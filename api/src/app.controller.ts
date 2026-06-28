import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from './common/decorators';

@Controller()
export class AppController {
  /** Render/Railway/Fly ping `/` for health checks — keep it public and trivial. */
  @Public()
  @Get()
  @ApiExcludeEndpoint()
  health(): { status: string; service: string } {
    return { status: 'ok', service: 'WeatherGuard API ☁️🌤️' };
  }
}
