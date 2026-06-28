import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AlertsController } from './alerts.controller';
import { AlertsService, ALERTS_QUEUE } from './alerts.service';
import { AlertsProcessor } from './alerts.processor';
import { AlertLog, AlertLogSchema } from './schemas/alert-log.schema';
import { UsersModule } from '../users/users.module';
import { WeatherModule } from '../weather/weather.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AlertLog.name, schema: AlertLogSchema }]),
    BullModule.registerQueue({ name: ALERTS_QUEUE }),
    UsersModule,
    WeatherModule,
    TelegramModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsProcessor],
  exports: [AlertsService],
})
export class AlertsModule {}
