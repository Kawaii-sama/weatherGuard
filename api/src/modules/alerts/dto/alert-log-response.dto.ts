import { Exclude, Expose } from 'class-transformer';
import { AlertLogStatus } from '../schemas/alert-log.schema';

@Exclude()
export class AlertLogResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  city: string;

  @Expose()
  temperatureCelsius: number;

  @Expose()
  condition: string;

  @Expose()
  message: string;

  @Expose()
  status: AlertLogStatus;

  @Expose()
  errorMessage?: string;

  @Expose()
  simulated: boolean;

  @Expose()
  createdAt?: Date;

  constructor(partial: Partial<AlertLogResponseDto>) {
    Object.assign(this, partial);
  }
}
