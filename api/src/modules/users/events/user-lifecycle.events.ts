import { UserDocument } from '../schemas/user.schema';

export const USER_APPROVED_EVENT = 'user.approved';
export const USER_REJECTED_EVENT = 'user.rejected';
export const USER_TELEGRAM_LINKED_EVENT = 'user.telegram-linked';

/**
 * Emitted by UsersService.approve(). TelegramModule listens for this and
 * sends the "you're approved!" message — UsersModule never imports
 * TelegramModule directly, which keeps the module graph acyclic.
 */
export class UserApprovedEvent {
  constructor(public readonly user: UserDocument) {}
}

export class UserRejectedEvent {
  constructor(public readonly user: UserDocument) {}
}

export class UserTelegramLinkedEvent {
  constructor(public readonly user: UserDocument) {}
}
