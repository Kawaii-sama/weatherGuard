import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Telegraf } from 'telegraf';
import { UsersService } from '../users/users.service';
import { UserApprovedEvent } from '../users/events/user-lifecycle.events';
import { AppConfig } from '../../config/configuration';
import { UserStatus } from '../../common/enums';

/**
 * Owns the single Telegraf bot instance for the whole app. Two
 * responsibilities only:
 *   1. Handle the /start <token> deep link that links a Telegram chat to a
 *      WeatherGuard account (see UsersService.linkTelegramAccount).
 *   2. Send outbound messages — approval notices and weather alerts — to a
 *      chat id that AlertsService/UsersService have already verified
 *      belongs to an APPROVED user.
 *
 * Notably, TelegramService never queries "who should get a message" itself;
 * that decision always lives in UsersService/AlertsService. This keeps the
 * "only approved users get alerts" rule enforced in one place instead of
 * being duplicated across every integration that happens to send a message.
 */
@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    const token = this.configService.get('telegram', { infer: true }).botToken;

    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN is not set — Telegram integration is disabled. Alerts will be logged but not delivered.',
      );
      return;
    }

    this.bot = new Telegraf(token);
    this.registerHandlers(this.bot);

    // Fire-and-forget with backoff: a Telegram outage (rate limiting, an
    // ISP-level block, a brief API incident, etc.) must never block the
    // rest of the API — auth, users, alerts — from starting up.
    this.launchWithRetry();
  }

  private launchWithRetry(attempt = 1): void {
    if (!this.bot) return;

    this.bot
      .launch()
      .then(() => this.logger.log('Telegram bot is live and polling for updates.'))
      .catch((error) => {
        const delaySeconds = Math.min(60, 5 * attempt);
        this.logger.warn(
          `Telegram bot launch failed (attempt ${attempt}): ${(error as Error).message}. ` +
            `Retrying in ${delaySeconds}s — the rest of the API is unaffected.`,
        );
        setTimeout(() => this.launchWithRetry(attempt + 1), delaySeconds * 1000);
      });
  }

  async onModuleDestroy(): Promise<void> {
    this.bot?.stop('app-shutdown');
  }

  private registerHandlers(bot: Telegraf): void {
    bot.start(async (ctx) => {
      const token = ctx.startPayload; // the part after ?start= in the deep link
      const chatId = ctx.chat?.id?.toString();

      if (!chatId) {
        return;
      }

      if (!token) {
        await ctx.reply(
          '👋 Hi! This bot only works with a personal invite link from the WeatherGuard dashboard. ' +
            'Sign in at the WeatherGuard web app and grab your link from there.',
        );
        return;
      }

      const user = await this.usersService.findByTelegramLinkToken(token);
      if (!user) {
        await ctx.reply('🙁 That link has expired or was already used. Please grab a fresh one from the dashboard.');
        return;
      }

      await this.usersService.linkTelegramAccount(user._id.toString(), chatId);

      if (user.status === UserStatus.APPROVED) {
        await ctx.reply(
          `🎉☁️ Yay, ${user.name}! Your Telegram is linked and you're already approved.\n\n` +
            `I'll send your kawaii weather alerts for *${user.city}* right here. ☀️🌧️`,
          { parse_mode: 'Markdown' },
        );
      } else {
        await ctx.reply(
          `🌥️ Thanks, ${user.name}! Your Telegram is linked.\n\n` +
            `Your access request is still pending review — I'll ping you the moment an admin approves you! (｀･ω･´)`,
        );
      }
    });

    bot.catch((err, ctx) => {
      this.logger.error(`Telegram bot error while handling update ${ctx.updateType}`, err as Error);
    });
  }

  /**
   * Fired by UsersService.approve(). Only actually sends a message if the
   * user has already linked Telegram — otherwise there's nowhere to send
   * it, and the deep link shown on their dashboard will trigger this same
   * "you're approved" branch inside bot.start() once they do link.
   */
  @OnEvent('user.approved')
  async handleUserApproved(event: UserApprovedEvent): Promise<void> {
    const { user } = event;
    if (!user.telegramLinked || !user.telegramChatId) {
      return;
    }

    await this.sendMessage(
      user.telegramChatId,
      `🎉☁️ Great news, ${user.name}! Your WeatherGuard access has been *approved*.\n\n` +
        `You'll now receive kawaii weather alerts for *${user.city}* right here. ☀️🌦️`,
    );
  }

  /**
   * The only method that actually talks to Telegram's API. Callers
   * (AlertsService, this service's own event handler) are responsible for
   * confirming the recipient is allowed to receive messages before calling
   * this — it does not re-check approval status itself.
   */
  async sendMessage(chatId: string, text: string): Promise<{ delivered: boolean; error?: string }> {
    if (!this.bot) {
      this.logger.warn(`Telegram bot is disabled — would have sent to ${chatId}: ${text}`);
      return { delivered: false, error: 'Telegram bot is not configured on this server.' };
    }

    try {
      await this.bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      return { delivered: true };
    } catch (error) {
      this.logger.error(`Failed to deliver Telegram message to ${chatId}`, error as Error);
      return { delivered: false, error: (error as Error).message };
    }
  }

  isConfigured(): boolean {
    return this.bot !== null;
  }
}