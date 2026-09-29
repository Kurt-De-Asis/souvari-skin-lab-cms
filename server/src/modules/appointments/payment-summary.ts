import { Decimal } from '@prisma/client/runtime/library';

/**
 * Payment accounting for a single appointment.
 *
 * The `paid` boolean these helpers replace was `transactions.some(t =>
 * t.payment_status === 'paid')`, which cannot tell a fully-paid booking from a
 * half-paid one. It also mishandles refunds, because `refundTransaction` does
 * two things at once: it flips the *original* row to `refunded`/`partial`, and
 * it inserts a *new* `type: 'refund'` row with a negative `total_amount`. So
 * "any row that says paid" nets a full refund to -X instead of 0.
 */

export interface PaymentTransactionRow {
  type: string;
  payment_status: string;
  total_amount: unknown;
  items?: { service_id: number | null }[] | null;
}

/**
 * Rows that still represent real money owed/received.
 *
 * - `refund` rows are included: they carry a negative amount and are the
 *   offsetting leg of a refund, so they must be netted against the sale.
 * - `paid` and `partial` sales are included. `partial` matters because a
 *   partial refund downgrades the original row from `paid` to `partial`, and
 *   dropping it would discard the money that was actually kept.
 * - `refunded` and `voided` rows are excluded. Both are terminal states whose
 *   value is already carried by the offsetting refund row (or which never
 *   counted in the first place, for a void).
 * - `pending` is excluded: it has been recorded but not collected.
 */
const COUNTS_TOWARD_PAID = new Set(['paid', 'partial']);

export function countsTowardPaid(row: PaymentTransactionRow): boolean {
  if (row.type === 'refund') return true;
  return COUNTS_TOWARD_PAID.has(row.payment_status);
}

export interface AppointmentPaymentSummary {
  /** Quote after membership/perk, less the manual staff discount. */
  amount_due: number;
  /** Net money actually collected against the appointment. */
  paid_amount: number;
  /** amount_due - paid_amount, floored at 0. */
  balance: number;
  /** Services already billed, so a balance collection never re-charges them. */
  covered_service_ids: number[];
  /** Manual staff discount percentage, normalised to a number (0 when none). */
  discount_pct: number;
}

function toDecimal(value: unknown): Decimal {
  if (value === null || value === undefined) return new Decimal(0);
  return new Decimal(value.toString());
}

/** Rounds to 2dp. Guards against float drift like 1124.9999999999998. */
function money(value: Decimal): number {
  return value.toDecimalPlaces(2).toNumber();
}

export function summarizeAppointmentPayment(input: {
  quotedPrice: unknown;
  discountPct?: unknown;
  transactions?: PaymentTransactionRow[] | null;
}): AppointmentPaymentSummary {
  const rows = input.transactions ?? [];
  const discountPct = input.discountPct === null || input.discountPct === undefined
    ? 0
    : toDecimal(input.discountPct).toNumber();

  // A NULL quoted_price is a legacy/walk-in appointment with nothing to
  // collect. Treat it as zero owed rather than failing, so completing those
  // still works.
  const base = toDecimal(input.quotedPrice);
  const baseDue = base.isNegative() ? new Decimal(0) : base;
  const manualDiscount = baseDue.times(discountPct).dividedBy(100);
  const amountDue = Decimal.max(baseDue.minus(manualDiscount), 0);

  let paid = new Decimal(0);
  // Signed per-service tally: a sale adds coverage, its refund subtracts it,
  // so a refunded service correctly becomes collectable again.
  const coverage = new Map<number, number>();

  for (const row of rows) {
    if (!countsTowardPaid(row)) continue;
    paid = paid.plus(toDecimal(row.total_amount));
    // Refund rows carry the same service ids as the sale they offset, so they
    // must remove coverage rather than add it.
    const delta = row.type === 'refund' ? -1 : 1;
    for (const item of row.items ?? []) {
      if (item?.service_id === null || item?.service_id === undefined) continue;
      coverage.set(item.service_id, (coverage.get(item.service_id) ?? 0) + delta);
    }
  }

  // Clamp: a legacy row that nets negative (fully refunded booking) should not
  // show the clinic owing the customer money.
  const paidAmount = money(Decimal.max(paid, 0));

  return {
    amount_due: money(amountDue),
    paid_amount: paidAmount,
    balance: money(Decimal.max(amountDue.minus(paidAmount), 0)),
    covered_service_ids: [...coverage.entries()]
      .filter(([, count]) => count > 0)
      .map(([serviceId]) => serviceId),
    discount_pct: discountPct,
  };
}
