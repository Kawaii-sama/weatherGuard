import { ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { WeatherService } from '../weather/weather.service';
import { TelegramService } from '../telegram/telegram.service';
import { AlertLog, AlertLogDocument, AlertLogStatus } from './schemas/alert-log.schema';
import { AlertLogResponseDto } from './dto';
import { AppConfig } from '../../config/configuration';
import { UserDocument } from '../users/schemas/user.schema';

export const ALERTS_QUEUE = 'weather-alerts';
export const BROADCAST_JOB = 'broadcast';
export const RECURRING_BROADCAST_JOB_ID = 'recurring-weather-broadcast';
export const RECURRING_BROADCAST_JOB_ID_2 = 'recurring-weather-broadcast-evening';

@Injectable()
export class AlertsService implements OnModuleInit {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectQueue(ALERTS_QUEUE) private readonly alertsQueue: Queue,
    @InjectModel(AlertLog.name) private readonly alertLogModel: Model<AlertLogDocument>,
    private readonly usersService: UsersService,
    private readonly weatherService: WeatherService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Schedules TWO recurring broadcast jobs:
   *   - 8:00 AM daily
   *   - 6:00 PM daily
   * Clears any existing repeatable jobs first to avoid duplicates on restart.
   */
  async onModuleInit(): Promise<void> {
    // Clear all existing recurring broadcast jobs
    const existing = await this.alertsQueue.getRepeatableJobs();
    await Promise.all(
      existing
        .filter((job) =>
          job.id === RECURRING_BROADCAST_JOB_ID ||
          job.id === RECURRING_BROADCAST_JOB_ID_2,
        )
        .map((job) => this.alertsQueue.removeRepeatableByKey(job.key)),
    );

    // 8:00 AM daily
    await this.alertsQueue.add(
      BROADCAST_JOB,
      { slot: 'morning' },
      { repeat: { pattern: '0 8 * * *' }, jobId: RECURRING_BROADCAST_JOB_ID },
    );

    // 6:00 PM daily
    await this.alertsQueue.add(
      BROADCAST_JOB,
      { slot: 'evening' },
      { repeat: { pattern: '0 18 * * *' }, jobId: RECURRING_BROADCAST_JOB_ID_2 },
    );

    this.logger.log('Recurring weather broadcasts scheduled: 8:00 AM and 6:00 PM daily.');
  }

  /** Admin "Send Now" button — enqueues an immediate broadcast outside the cron schedule. */
  async triggerBroadcastNow(): Promise<{ queued: true }> {
    await this.alertsQueue.add(BROADCAST_JOB, { manual: true });
    return { queued: true };
  }

  async broadcastToApprovedUsers(): Promise<{ sent: number; failed: number }> {
    const recipients = await this.usersService.findApprovedAndLinked();
    let sent = 0;
    let failed = 0;

    for (const user of recipients) {
      const result = await this.deliverAlertToUser(user, { simulated: false, triggeredManually: false });
      if (result.status === AlertLogStatus.SENT) sent++;
      else failed++;
    }

    this.logger.log(`Broadcast complete: ${sent} sent, ${failed} failed, ${recipients.length} eligible.`);
    return { sent, failed };
  }

  async simulateForUser(userId: string): Promise<AlertLogResponseDto> {
    const user = await this.usersService.findById(userId);

    if (user.status !== 'approved' || !user.telegramLinked) {
      throw new ForbiddenException(
        'This user must be approved and have linked Telegram before an alert can be sent.',
      );
    }

    const log = await this.deliverAlertToUser(user, { simulated: true, triggeredManually: true });
    return new AlertLogResponseDto({
      id: log._id.toString(),
      userId: log.userId.toString(),
      city: log.city,
      temperatureCelsius: log.temperatureCelsius,
      condition: log.condition,
      message: log.message,
      status: log.status,
      errorMessage: log.errorMessage,
      simulated: log.simulated,
      createdAt: log.createdAt,
    });
  }

  async listRecentLogs(limit = 50): Promise<AlertLogResponseDto[]> {
    const logs = await this.alertLogModel.find().sort({ createdAt: -1 }).limit(limit);
    return logs.map(
      (log) =>
        new AlertLogResponseDto({
          id: log._id.toString(),
          userId: log.userId.toString(),
          city: log.city,
          temperatureCelsius: log.temperatureCelsius,
          condition: log.condition,
          message: log.message,
          status: log.status,
          errorMessage: log.errorMessage,
          simulated: log.simulated,
          createdAt: log.createdAt,
        }),
    );
  }

  private async deliverAlertToUser(
    user: UserDocument,
    options: { simulated: boolean; triggeredManually: boolean },
  ): Promise<AlertLogDocument> {
    if (user.status !== 'approved' || !user.telegramLinked || !user.telegramChatId) {
      throw new NotFoundException('User is not eligible to receive alerts.');
    }

    const weather = await this.weatherService.getWeatherForCity(user.city);

    const message =
      `${weather.emoji} *WeatherGuard Alert — ${weather.city}*\n\n` +
      `*Condition:* ${weather.condition}\n` +
      `*Temperature:* ${weather.temperatureCelsius}°C (feels like ${weather.feelsLikeCelsius}°C)\n` +
      `*Humidity:* ${weather.humidity}%\n` +
      `*Wind:* ${weather.windSpeedKph} km/h\n` +
      `*Visibility:* ${weather.visibilityKm} km\n\n` +
      `_${weather.summary}_` +
      `${weather.simulated ? '\n\n_(simulated forecast — no live weather key configured)_' : ''}`;

    const delivery = await this.telegramService.sendMessage(user.telegramChatId, message);

    return this.alertLogModel.create({
      userId: user._id,
      city: weather.city,
      temperatureCelsius: weather.temperatureCelsius,
      condition: weather.condition,
      message,
      status: delivery.delivered ? AlertLogStatus.SENT : AlertLogStatus.FAILED,
      errorMessage: delivery.error,
      simulated: options.simulated,
      triggeredManually: options.triggeredManually,
    });
  }
}