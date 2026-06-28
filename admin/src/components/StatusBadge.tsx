interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'sent' | 'failed';
}

const STYLES: Record<StatusBadgeProps['status'], string> = {
  pending: 'bg-sun text-ink',
  approved: 'bg-mint text-ink',
  sent: 'bg-mint text-ink',
  rejected: 'bg-blush text-ink',
  failed: 'bg-blush text-ink',
};

const LABELS: Record<StatusBadgeProps['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  sent: 'Sent',
  failed: 'Failed',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-display font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
