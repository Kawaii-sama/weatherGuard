import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators';
import { NormalizedOAuthProfile } from '../../common/interfaces';
import { AppConfig } from '../../config/configuration';

/**
 * Every route here is @Public() — these are the only endpoints a brand new,
 * never-seen-before visitor is allowed to hit without a JWT. Everything
 * else in the API requires a valid token, enforced by the global
 * JwtAuthGuard registered in main.ts.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  googleLogin(): void {
    // Passport's GoogleStrategy intercepts this request and redirects to Google.
    // This method body never actually executes.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.completeOAuthLogin(req, res);
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiExcludeEndpoint()
  githubLogin(): void {
    // Same as above, but for GitHub.
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiExcludeEndpoint()
  async githubCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.completeOAuthLogin(req, res);
  }

  private async completeOAuthLogin(req: Request, res: Response): Promise<void> {
    const profile = req.user as NormalizedOAuthProfile;
    const { accessToken } = await this.authService.handleOAuthLogin(profile);
    const frontendUrl = this.configService.get('frontendUrl', { infer: true });

    // Hand the token to the SPA via a one-time query param; the frontend's
    // AuthCallbackPage immediately moves it into memory/local state and
    // never re-reads it from the URL again.
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }
}
