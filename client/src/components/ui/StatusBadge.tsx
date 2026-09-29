import clsx from 'clsx';
import { APPOINTMENT_STATUS_META } from '../../utils/appointmentStatus';

// Appointment statuses resolve through the shared palette so the pills here
// always match the calendar blocks. Everything else keeps its own colour.
const statusColors: Record<string, string> = {
  active: 'badge-success',
  paid: 'badge-success',
  sent: 'badge-success',
  delivered: 'badge-success',
  queued: 'badge-warning',
  draft: 'badge-info',
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
  const appointmentMeta = APPOINTMENT_STATUS_META[status];
  const colorClass = appointmentMeta?.badge ?? statusColors[status] ?? 'badge-neutral';
  return (
    <span className={clsx('badge', colorClass)}>
      {appointmentMeta ? appointmentMeta.label : status.replace(/_/g, ' ')}
    </span>
  );
}
