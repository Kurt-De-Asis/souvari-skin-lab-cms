/**
 * Single source of truth for appointment status presentation.
 *
 * Every status gets its own hue. The previous calendar palette mapped
 * completed / checked_in / in_progress all to the same brand colour and
 * painted cancelled and no_show two shades of red, so three blocks in a row
 * were indistinguishable and two unrelated outcomes looked identical.
 *
 * `cancelled` is the only red — a no-show is not a failure the clinic caused,
 * so it reads neutral grey instead of alarm red.
 */
export interface AppointmentStatusMeta {
  /** Human-facing label. */
  label: string;
  /** Solid block colour for calendar booking blocks. */
  block: string;
  /** Matching hex, for inline swatches that need a real colour value. */
  dot: string;
  /** Pill/badge colour class. */
  badge: string;
  /** Whether the booking can still be edited, reassigned, or re-statused. */
  editable: boolean;
}

export const APPOINTMENT_STATUS_META: Record<string, AppointmentStatusMeta> = {
  pending: { label: 'Booked', block: 'bg-amber-400', dot: '#fbbf24', badge: 'badge-warning', editable: true },
  confirmed: { label: 'Confirmed', block: 'bg-emerald-500', dot: '#10b981', badge: 'badge-success', editable: true },
  checked_in: { label: 'Arrived', block: 'bg-sky-500', dot: '#0ea5e9', badge: 'badge-info', editable: true },
  in_progress: { label: 'Started', block: 'bg-violet-500', dot: '#8b5cf6', badge: 'badge-info', editable: true },
  completed: { label: 'Completed', block: 'bg-teal-700', dot: '#0f766e', badge: 'badge-success', editable: false },
  cancelled: { label: 'Cancelled', block: 'bg-red-500', dot: '#ef4444', badge: 'badge-danger', editable: true },
  no_show: { label: 'No Show', block: 'bg-neutral-500', dot: '#737373', badge: 'badge-neutral', editable: true },
};

/** Statuses a customer may still cancel from. Mirrors the server guard. */
export const CUSTOMER_CANCELLABLE_STATUSES = ['pending', 'confirmed'];

/**
 * The statuses offered by the inline calendar booking menu. `completed` is
 * deliberately absent: completing an unpaid booking has to run through the
 * checkout flow, so it stays on the "Mark Complete" action in the details
 * drawer.
 */
export const BOOKING_MENU_STATUSES = [
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'no_show',
  'cancelled',
] as const;

/** Every status, in lifecycle order — used by the calendar status filter. */
export const ALL_APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
] as const;

export function statusMeta(status: string): AppointmentStatusMeta {
  return (
    APPOINTMENT_STATUS_META[status] ?? {
      label: status.replace(/_/g, ' '),
      block: 'bg-neutral-400',
      dot: '#a3a3a3',
      badge: 'badge-neutral',
      editable: true,
    }
  );
}

export function statusLabel(status: string): string {
  return statusMeta(status).label;
}

export function statusBlockClass(status: string): string {
  return statusMeta(status).block;
}

/** Completed bookings are terminal — the server rejects every edit. */
export function isBookingEditable(status: string): boolean {
  return statusMeta(status).editable;
}
