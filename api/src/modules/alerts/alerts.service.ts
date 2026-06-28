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

/**
 * Owns the entire alert-delivery pipeline:
 *   1. Schedules a recurring BullMQ job (cron pattern from ALERT_BROADCAST_CRON)
 *      that fans out a weather alert to every APPROVED + Telegram-linked user.
 *      This is the "automated weather alerts" deliverable.
 *   2. Exposes `simulateForUser`, the synchronous path the admin dashboard's
 *      "Send test alert" button calls — this is the "simulated weather
 *      alert" deliverable, and intentionally bypasses the queue (an admin
 *      explicitly testing one user doesn't need to wait for a worker tick).
 *
 * Both paths funnel through the same private `deliverAlertToUser`, which is
 * the *only* place that actually calls TelegramService.sendMessage — this is
 * the single choke point that guarantees nothing ever gets sent to a user
 * who isn't APPROVED and telegramLinked (see the guard at the top of that
 * method). AlertsProcessor (the BullMQ worker) is the only other caller, and
 * it only reaches users already filtered by `findApprovedAndLinked()`.
 */
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
   * Registers the recurring broadcast as a BullMQ repeatable job. Removing
   * any existing repeatable job with the same key first makes this
   * idempotent across restarts/redeploys — otherwise BullMQ would happily
   * accumulate a duplicate scheduler every time the process boots.
   */
  async onModuleInit(): Promise<void> {
    const cron = this.configService.get('alertBroadcastCron', { infer: true });

    const existing = await this.alertsQueue.getRepeatableJobs();
    await Promise.all(
      existing
        .filter((job) => job.id === RECURRING_BROADCAST_JOB_ID)
        .map((job) => this.alertsQueue.removeRepeatableByKey(job.key)),
    );

    await this.alertsQueue.add(
      BROADCAST_JOB,
      {},
      { repeat: { pattern: cron }, jobId: RECURRING_BROADCAST_JOB_ID },
    );

    this.logger.log(`Recurring weather broadcast scheduled with cron "${cron}".`);
  }

  /** Admin "Send Now" button — enqueues an immediate broadcast outside the cron schedule. */
  async triggerBroadcastNow(): Promise<{ queued: true }> {
    await this.alertsQueue.add(BROADCAST_JOB, { manual: true });
    return { queued: true };
  }

  /**
   * Called by AlertsProcessor for the scheduled (and manually-triggered)
   * broadcast job. Walks every approved + linked user and delivers
   * independently, so one user's failure (bad chat id, Telegram API hiccup)
   * never blocks the rest of the batch.
   */
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

  /**
   * The admin dashboard's "Send test alert" action for one specific user.
   * Still enforces APPROVED + telegramLinked — an admin can pick any user
   * id from the UI, but the underlying guarantee ("only approved users
   * receive alerts") never bends, even for a manual demo button.
   */
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

  /**
   * The single choke point for outbound weather messages. Re-checks the
   * approval gate defensively (defense-in-depth, in case a future caller
   * forgets to pre-filter) even though both current callers already have.
   */
  private async deliverAlertToUser(
    user: UserDocument,
    options: { simulated: boolean; triggeredManually: boolean },
  ): Promise<AlertLogDocument> {
    if (user.status !== 'approved' || !user.telegramLinked || !user.telegramChatId) {
      throw new NotFoundException('User is not eligible to receive alerts.');
    }

    const weather = await this.weatherService.getWeatherForCity(user.city);
    const message =
      `${weather.emoji} *WeatherGuard alert for ${weather.city}*\n\n` +
      `${weather.condition}, ${weather.temperatureCelsius}°C\n` +
      `${weather.summary}${weather.simulated ? '\n\n_(simulated forecast — no live weather key configured)_' : ''}`;

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
