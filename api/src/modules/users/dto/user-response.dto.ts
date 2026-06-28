import { Exclude, Expose } from 'class-transformer';
import { AuthProvider, UserRole, UserStatus } from '../../../common/enums';

/**
 * Explicit allow-list response shape. We use `class-transformer`'s
 * `@Exclude()` by default plus `ClassSerializerInterceptor` so that secrets
 * (telegramLinkToken, providerId) can never accidentally leak to the
 * frontend, even if a future change adds a new field to the schema.
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  provider: AuthProvider;

  @Expose()
  role: UserRole;

  @Expose()
  status: UserStatus;

  @Expose()
  city: string;

  @Expose()
  requestNote?: string;

  @Expose()
  telegramLinked: boolean;

  /**
   * Only ever populated for the user's own /users/me response so the
   * frontend can render the t.me deep link — never included in admin list
   * responses for other users.
   */
  @Expose()
  telegramDeepLink?: string;

  @Expose()
  approvedAt?: Date;

  @Expose()
  createdAt?: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
