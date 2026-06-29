import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole, UserStatus } from '../../common/enums';
import { NormalizedOAuthProfile } from '../../common/interfaces';
import { UpdateProfileDto } from './dto';
import { UserApprovedEvent, UserRejectedEvent, UserTelegramLinkedEvent } from './events/user-lifecycle.events';
import { AlertLog } from '../alerts/schemas/alert-log.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AlertLog.name) private readonly alertLogModel: Model<any>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findOrCreateFromOAuth(
    profile: NormalizedOAuthProfile,
    adminEmails: string[],
  ): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: profile.email });
    if (existing) return existing;

    const isPreApprovedAdmin = adminEmails.includes(profile.email.toLowerCase());

    return this.userModel.create({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      provider: profile.provider,
      providerId: profile.providerId,
      role: isPreApprovedAdmin ? UserRole.ADMIN : UserRole.USER,
      status: isPreApprovedAdmin ? UserStatus.APPROVED : UserStatus.PENDING,
      approvedAt: isPreApprovedAdmin ? new Date() : undefined,
      telegramLinkToken: randomUUID(),
    });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async findByTelegramLinkToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ telegramLinkToken: token });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (dto.city !== undefined) user.city = dto.city;
    if (dto.requestNote !== undefined) user.requestNote = dto.requestNote;
    await user.save();
    return user;
  }

  async listByStatus(status?: UserStatus): Promise<UserDocument[]> {
    const filter = status ? { status } : {};
    return this.userModel.find(filter).sort({ createdAt: -1 });
  }

  async approve(userId: string, adminId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (user.status === UserStatus.APPROVED) throw new ConflictException('User is already approved.');

    user.status = UserStatus.APPROVED;
    user.approvedAt = new Date();
    user.approvedBy = new Types.ObjectId(adminId);
    user.rejectedAt = undefined;
    user.rejectedBy = undefined;

    if (!user.telegramLinkToken && !user.telegramLinked) {
      user.telegramLinkToken = randomUUID();
    }

    await user.save();
    this.eventEmitter.emit('user.approved', new UserApprovedEvent(user));
    return user;
  }

  async reject(userId: string, adminId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.status = UserStatus.REJECTED;
    user.rejectedAt = new Date();
    user.rejectedBy = new Types.ObjectId(adminId);
    user.approvedAt = undefined;
    user.approvedBy = undefined;
    await user.save();
    this.eventEmitter.emit('user.rejected', new UserRejectedEvent(user));
    return user;
  }

  /**
   * Hard deletes a user and ALL their associated alert logs.
   * This is a permanent, irreversible action — the user and their
   * entire history vanish completely from the system.
   */
  async hardDelete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    // Delete all alert logs for this user first
    await this.alertLogModel.deleteMany({ userId: user._id });
    // Then delete the user itself
    await this.userModel.findByIdAndDelete(userId);
  }

  async linkTelegramAccount(userId: string, chatId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.telegramChatId = chatId;
    user.telegramLinked = true;
    user.telegramLinkToken = undefined;
    await user.save();
    this.eventEmitter.emit('user.telegram-linked', new UserTelegramLinkedEvent(user));
    return user;
  }

  async findApprovedAndLinked(): Promise<UserDocument[]> {
    return this.userModel.find({ status: UserStatus.APPROVED, telegramLinked: true });
  }

  buildTelegramDeepLink(botUsername: string, token: string): string {
    return `https://t.me/${botUsername}?start=${token}`;
  }
}