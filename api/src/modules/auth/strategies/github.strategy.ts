import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
// passport-github2 ships no types of its own beyond @types/passport-github2
import { Strategy, Profile } from 'passport-github2';
import { AuthProvider } from '../../../common/enums';
import { NormalizedOAuthProfile } from '../../../common/interfaces';
import { AppConfig } from '../../../config/configuration';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService<AppConfig, true>) {
    const github = configService.get('github', { infer: true });
    super({
      clientID: github.clientId,
      clientSecret: github.clientSecret,
      callbackURL: github.callbackUrl,
      scope: ['user:email'],
    });
  }

  /**
   * GitHub often doesn't include emails in the main profile payload unless
   * the user has a public email set — we fall back to a generated
   * placeholder using their GitHub login so sign-up never hard-fails, but
   * we prefer the real email whenever GitHub provides one.
   */
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void,
  ): void {
    const email = profile.emails?.[0]?.value ?? `${profile.username}@users.noreply.github.com`;

    const normalized: NormalizedOAuthProfile = {
      provider: AuthProvider.GITHUB,
      providerId: profile.id,
      email,
      name: profile.displayName || profile.username || 'GitHub User',
      avatarUrl: profile.photos?.[0]?.value,
    };

    done(null, normalized);
  }
}
