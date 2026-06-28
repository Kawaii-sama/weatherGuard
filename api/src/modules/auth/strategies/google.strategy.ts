import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthProvider } from '../../../common/enums';
import { NormalizedOAuthProfile } from '../../../common/interfaces';
import { AppConfig } from '../../../config/configuration';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService<AppConfig, true>) {
    const google = configService.get('google', { infer: true });
    super({
      clientID: google.clientId,
      clientSecret: google.clientSecret,
      callbackURL: google.callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  /**
   * Passport calls this once Google redirects back with a successful login.
   * We normalize the provider-specific profile and hand it to the route
   * handler via `done()` — AuthController picks it up as `req.user`.
   */
  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google account has no public email.'), undefined);
    }

    const normalized: NormalizedOAuthProfile = {
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };

    done(null, normalized as any);
  }
}
