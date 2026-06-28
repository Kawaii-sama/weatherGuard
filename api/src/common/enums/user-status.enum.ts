/**
 * Drives the entire approval workflow. A user is only ever in exactly one
 * of these states, and `AlertsService` only ever broadcasts to users whose
 * status is APPROVED (see alerts.service.ts for the enforcement point).
 */
export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
