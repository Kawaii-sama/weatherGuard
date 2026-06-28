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

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Called by AuthService right after a Google/GitHub OAuth callback
   * succeeds. Creates the account on first login (status: PENDING) or
   * returns the existing one on every subsequent login. This single
   * function *is* the "request access" mechanism — signing in with an
   * approved social identity is the request.
   *
   * Emails listed in ADMIN_EMAILS are auto-approved as admins, which is
   * how the very first administrator account is seeded without ever
   * touching the database by hand.
   */
  async findOrCreateFromOAuth(
    profile: NormalizedOAuthProfile,
    adminEmails: string[],
  ): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: profile.email });
    if (existing) {
      return existing;
    }

    const isPreApprovedAdmin = adminEmails.includes(profile.email.toLowerCase());

    const created = await this.userModel.create({
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

    return created;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
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

  /**
   * The approval action an admin takes from the dashboard. This is the
   * single write path that flips a user into APPROVED — every other part
   * of the system (the alert broadcaster, the Telegram link check) treats
   * `status === APPROVED` as the only source of truth, so centralizing the
   * transition here is what keeps that invariant trustworthy.
   */
  async approve(userId: string, adminId: string): Promise<UserDocument> {
    const user = await this.findById(userId);

    if (user.status === UserStatus.APPROVED) {
      throw new ConflictException('User is already approved.');
    }

    user.status = UserStatus.APPROVED;
    user.approvedAt = new Date();
    user.approvedBy = new Types.ObjectId(adminId);
    user.rejectedAt = undefined;
    user.rejectedBy = undefined;

    // Approved users without a Telegram link yet still need a way to link —
    // make sure a token exists so the frontend can always render a deep link.
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
   * Called by TelegramService once a /start <token> deep link resolves.
   * Clearing the token after use makes it single-use, like any other
   * secret link.
   */
  async linkTelegramAccount(userId: string, chatId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.telegramChatId = chatId;
    user.telegramLinked = true;
    user.telegramLinkToken = undefined;
    await user.save();

    this.eventEmitter.emit('user.telegram-linked', new UserTelegramLinkedEvent(user));
    return user;
  }

  /**
   * The exact query the alert broadcaster relies on. Both conditions are
   * required: APPROVED (admin sign-off) AND telegramLinked (we have
   * somewhere to actually deliver the message). See AlertsService for the
   * second, defense-in-depth check performed again at send time.
   */
  async findApprovedAndLinked(): Promise<UserDocument[]> {
    return this.userModel.find({
      status: UserStatus.APPROVED,
      telegramLinked: true,
    });
  }

  buildTelegramDeepLink(botUsername: string, token: string): string {
    return `https://t.me/${botUsername}?start=${token}`;
  }
}
