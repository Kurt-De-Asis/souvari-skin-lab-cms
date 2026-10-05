/**
 * Canonical wording for transaction statuses and types.
 *
 * appointmentStatus.ts only covers appointment statuses, and StatusBadge just
 * does a raw underscore replacement. Reports need explicit labels so a column
 * header never reads "pending" or "paid_on_us" while the rest of the document is
 * properly capitalised.
 */

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  partial: 'Partial',
  refunded: 'Refunded',
  voided: 'Voided',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  sale: 'Sale',
  refund: 'Refund',
  adjustment: 'Adjustment',
};

function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return PAYMENT_STATUS_LABELS[status] ?? humanize(status);
}

export function transactionTypeLabel(type: string | null | undefined): string {
  if (!type) return '—';
  return TRANSACTION_TYPE_LABELS[type] ?? humanize(type);
}

export const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABELS);
export const TRANSACTION_TYPES = Object.keys(TRANSACTION_TYPE_LABELS);