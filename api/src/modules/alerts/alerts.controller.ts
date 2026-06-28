import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertLogResponseDto } from './dto';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';

/**
 * Every route here is admin-only — alert delivery is an operational/admin
 * concern, not something a regular user ever calls directly.
 */
@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
@Roles(UserRole.ADMIN)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /** Recent delivery log, newest first — powers the dashboard's activity feed. */
  @Get('logs')
  async logs(@Query('limit') limit?: string): Promise<AlertLogResponseDto[]> {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    return this.alertsService.listRecentLogs(parsed && !Number.isNaN(parsed) ? parsed : undefined);
  }

  /** Enqueues an out-of-schedule broadcast to every approved + linked user right now. */
  @Post('broadcast')
  async broadcastNow(): Promise<{ queued: true }> {
    return this.alertsService.triggerBroadcastNow();
  }

  /** "Send test alert" button for one user — the simulated-alert deliverable. */
  @Post('simulate/:userId')
  async simulate(@Param('userId') userId: string): Promise<AlertLogResponseDto> {
    return this.alertsService.simulateForUser(userId);
  }
}
