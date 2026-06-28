import { UserRole } from '../enums';
import { UserStatus } from '../enums';

/** Shape of the payload embedded in every signed JWT we issue. */
export interface JwtPayload {
  sub: string; // Mongo _id of the user
  email: string;
  role: UserRole;
  status: UserStatus;
}

/** Shape attached to `Request.user` once `JwtAuthGuard` has run. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}
