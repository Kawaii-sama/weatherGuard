import { Module } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
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

function parseRedisConnection(redisUrl: string) {
  const parsed = new URL(redisUrl);
  const db = parsed.pathname && parsed.pathname !== '/' ? parseInt(parsed.pathname.slice(1), 10) : undefined;

  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db,
    maxRetriesPerRequest: null,
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        uri: configService.get('mongodbUri', { infer: true }),
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        connection: parseRedisConnection(configService.get('redisUrl', { infer: true })),
      }),
    }),

    EventEmitterModule.forRoot(),

    AuthModule,
    UsersModule,
    TelegramModule,
    WeatherModule,
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}