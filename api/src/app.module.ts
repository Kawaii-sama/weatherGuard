import { Module } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import configuration, { AppConfig } from './config/configuration';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { WeatherModule } from './modules/weather/weather.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        uri: configService.get('mongodbUri', { infer: true }),
      }),
    }),

    // BullMQ needs its own ioredis connection with maxRetriesPerRequest: null
    // (required for the blocking commands BullMQ issues under the hood).
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        connection: new Redis(configService.get('redisUrl', { infer: true }), {
          maxRetriesPerRequest: null,
        }),
      }),
    }),

    // Decouples UsersModule from TelegramModule (see user-lifecycle.events.ts)
    // so the module graph stays a clean tree instead of a cycle.
    EventEmitterModule.forRoot(),

    AuthModule,
    UsersModule,
    TelegramModule,
    WeatherModule,
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [
    // Secure-by-default: every route requires a valid JWT unless @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Runs after JwtAuthGuard; enforces @Roles(...) metadata.
    { provide: APP_GUARD, useClass: RolesGuard },
    // One predictable error JSON shape across the whole API.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Enforces @Exclude()/@Expose() on every response DTO automatically.
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
