import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { NormalizedOAuthProfile, JwtPayload } from '../../common/interfaces';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Entry point shared by both the Google and GitHub callback routes.
   * Provider-specific work is already done by the Passport strategies —
   * from here on, both flows are identical.
   */
  async handleOAuthLogin(profile: NormalizedOAuthProfile): Promise<{ user: UserDocument; accessToken: string }> {
    const adminEmails = this.configService.get('adminEmails', { infer: true });
    const user = await this.usersService.findOrCreateFromOAuth(profile, adminEmails);
    const accessToken = this.signToken(user);
    return { user, accessToken };
  }

  signToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    };
    return this.jwtService.sign(payload);
  }
}
