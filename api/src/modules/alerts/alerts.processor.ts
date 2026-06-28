import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AlertsService, ALERTS_QUEUE, BROADCAST_JOB } from './alerts.service';

/**
 * The actual BullMQ worker. Deliberately thin — all delivery logic lives in
 * AlertsService so it stays unit-testable without spinning up a queue.
 * AlertsService injects itself here via Nest's DI instead of the processor
 * reaching back into repositories directly.
 */
@Processor(ALERTS_QUEUE)
export class AlertsProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(private readonly alertsService: AlertsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case BROADCAST_JOB:
        this.logger.log(`Processing weather broadcast job ${job.id} (manual=${Boolean(job.data?.manual)})`);
        await this.alertsService.broadcastToApprovedUsers();
        return;
      default:
        this.logger.warn(`Received unknown job name "${job.name}" — skipping.`);
    }
  }
}
