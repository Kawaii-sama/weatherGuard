import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UserResponseDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole, UserStatus } from '../../common/enums';
import { AuthenticatedUser } from '../../common/interfaces';
import { UserDocument } from './schemas/user.schema';
import { AppConfig } from '../../config/configuration';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /** The logged-in user's own profile — drives the "pending / approved" UI state. */
  @Get('me')
  async getMe(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.usersService.findById(currentUser.userId);
    return this.toResponseDto(user, { includeOwnDeepLink: true });
  }

  /** Lets a pending (or approved) user set the city they want alerts for, plus a request note. */
  @Patch('me')
  async updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateProfile(currentUser.userId, dto);
    return this.toResponseDto(user, { includeOwnDeepLink: true });
  }

  /** Admin-only: list users, optionally filtered by status (?status=pending). */
  @Get()
  @Roles(UserRole.ADMIN)
  async list(@Query('status') status?: UserStatus): Promise<UserResponseDto[]> {
    const users = await this.usersService.listByStatus(status);
    return users.map((user) => this.toResponseDto(user));
  }

  /** Admin-only: approve a pending user. This is what unlocks alert delivery. */
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  async approve(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.approve(id, admin.userId);
    return this.toResponseDto(user);
  }

  /** Admin-only: reject a pending user. */
  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  async reject(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.reject(id, admin.userId);
    return this.toResponseDto(user);
  }

  private toResponseDto(
    user: UserDocument,
    options: { includeOwnDeepLink?: boolean } = {},
  ): UserResponseDto {
    const botUsername = this.configService.get('telegram', { infer: true }).botUsername;

    return new UserResponseDto({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      role: user.role,
      status: user.status,
      city: user.city,
      requestNote: user.requestNote,
      telegramLinked: user.telegramLinked,
      telegramDeepLink:
        options.includeOwnDeepLink && !user.telegramLinked && user.telegramLinkToken
          ? this.usersService.buildTelegramDeepLink(botUsername, user.telegramLinkToken)
          : undefined,
      approvedAt: user.approvedAt,
      createdAt: user.createdAt,
    });
  }
}
