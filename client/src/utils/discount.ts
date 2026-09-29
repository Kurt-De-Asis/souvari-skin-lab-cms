/**
 * Manual staff discount options, shared by the booking drawer, the edit
 * drawer, and the checkout modal so all three offer the same choices.
 */
export const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70] as const;

/** "Paid on us" is a 100% discount rather than a separate payment method. */
export const PAID_ON_US_PCT = 100;

/** The reason recorded on a transaction when staff apply a discount. */
export function buildDiscountReason(pct: number, paidOnUs: boolean, reason: string): string | undefined {
  if (paidOnUs) return 'Paid on us';
  if (pct > 0) return reason.trim() || `${pct}% staff discount`;
  return undefined;
}
