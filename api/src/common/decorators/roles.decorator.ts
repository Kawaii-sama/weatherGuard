import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

export const ROLES_KEY = 'roles';

/**
 * Usage: @Roles(UserRole.ADMIN)
 * Paired with `RolesGuard`, which reads this metadata to enforce it.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
