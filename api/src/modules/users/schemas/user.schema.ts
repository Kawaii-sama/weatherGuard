import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuthProvider, UserRole, UserStatus } from '../../../common/enums';

export type UserDocument = User & Document;

/**
 * The single source of truth for "who is this person, and are they allowed
 * to receive alerts". See README.md "System Design" for the full schema
 * diagram and the rationale behind each field.
 */
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ required: true, enum: AuthProvider })
  provider: AuthProvider;

  @Prop({ required: true })
  providerId: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ required: true, enum: UserStatus, default: UserStatus.PENDING, index: true })
  status: UserStatus;

  /** City used to resolve weather for this user's scheduled alerts. */
  @Prop({ default: 'London' })
  city: string;

  /** Optional note the user leaves when requesting access (shown to admins). */
  @Prop({ trim: true, maxlength: 280 })
  requestNote?: string;

  /** Telegram chat id, captured once the user completes the /start deep link. */
  @Prop()
  telegramChatId?: string;

  /** True once the user has linked their Telegram account. Gate #2 for alerts. */
  @Prop({ default: false, index: true })
  telegramLinked: boolean;

  /**
   * One-time secret used as the Telegram deep-link payload
   * (t.me/<bot>?start=<token>) so we can match an anonymous /start back to
   * this user without ever exposing Mongo IDs in a public link.
   */
  @Prop()
  telegramLinkToken?: string;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  approvedBy?: Types.ObjectId;

  @Prop()
  rejectedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  rejectedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
