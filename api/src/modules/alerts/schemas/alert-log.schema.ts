import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertLogDocument = AlertLog & Document;

export enum AlertLogStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

/**
 * One row per delivery attempt. Kept separate from User (rather than an
 * embedded array) because this is an append-only, fast-growing collection
 * with a totally different access pattern (recent-first feed, admin
 * auditing) than the user document.
 */
@Schema({ timestamps: true })
export class AlertLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  temperatureCelsius: number;

  @Prop({ required: true })
  condition: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: AlertLogStatus })
  status: AlertLogStatus;

  @Prop()
  errorMessage?: string;

  /** True if this row came from the manual "simulate alert" admin action rather than the scheduled broadcast. */
  @Prop({ default: false })
  simulated: boolean;

  @Prop({ default: false })
  triggeredManually: boolean;

  createdAt?: Date;
}

export const AlertLogSchema = SchemaFactory.createForClass(AlertLog);
