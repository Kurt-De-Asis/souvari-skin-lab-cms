import clsx from 'clsx';

const statusColors: Record<string, string> = {
  active: 'badge-success',
  confirmed: 'badge-success',
  completed: 'badge-success',
  paid: 'badge-success',
  sent: 'badge-success',
  delivered: 'badge-success',
  pending: 'badge-warning',
  queued: 'badge-warning',
  in_progress: 'badge-info',
  checked_in: 'badge-info',
  draft: 'badge-info',
  cancelled: 'badge-danger',
  no_show: 'badge-danger',
  failed: 'badge-danger',
  voided: 'badge-danger',
  inactive: 'badge-neutral',
  discontinued: 'badge-neutral',
  refunded: 'badge-danger',
  unread: 'badge-primary',
  read: 'badge-neutral',
  archived: 'badge-neutral',
  on_leave: 'badge-warning',
  terminated: 'badge-danger',
  partial: 'badge-warning',
};

export default function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status] || 'badge-neutral';
  return (
    <span className={clsx('badge', colorClass)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
