import { roundPeso } from '../../services/pricing-engine.core';

/**
 * Pure money math for a single POS quote line.
 *
 * `pricingService.calculatePrice` returns *per-unit* figures (`basePrice` and
 * `applicablePrice` come straight off the service row), so a line of quantity 3
 * has to multiply them to get the amount actually owed. Accumulating the
 * per-unit values instead would quote three services at the price of one.
 *
 * Kept separate from the service class so the arithmetic can be unit-tested
 * without a database.
 */

export type PriceType = 'regular' | 'vip' | 'non_member';

export interface QuoteLineInput {
  /** Per-unit catalog price. */
  basePrice: number;
  /** Per-unit price after any membership/VIP reduction. */
  applicablePrice: number;
  priceType: PriceType;
  /** Per-unit monthly-perk discount. */
  monthlyPerkDiscount?: number;
  quantity?: number;
}

export interface QuoteLine {
  /** Per-unit catalog price, or the non-member price where one applies. */
  unit_amount: number;
  quantity: number;
  /** Pre-discount total for the whole line. */
  line_total: number;
  /** This line's share of the membership discount. */
  discount: number;
  /** This line's share of the monthly perk. */
  monthlyPerkDiscount: number;
}

export function computeQuoteLine(input: QuoteLineInput): QuoteLine {
  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;

  // Non-member pricing is a different price list rather than a reduction, so it
  // belongs in the subtotal as-is rather than as a discount the customer never
  // received.
  const isNonMemberPricing = input.priceType === 'non_member';
  const unitGross = isNonMemberPricing ? input.applicablePrice : input.basePrice;
  const unitDiscount = isNonMemberPricing
    ? 0
    : roundPeso(unitGross - input.applicablePrice);

  return {
    unit_amount: roundPeso(unitGross),
    quantity,
    line_total: roundPeso(unitGross * quantity),
    discount: roundPeso(unitDiscount * quantity),
    monthlyPerkDiscount: roundPeso((input.monthlyPerkDiscount ?? 0) * quantity),
  };
}

/**
 * Rolls a quote's lines up. `subtotal` is the catalog value of the services and
 * `final_total` is what the customer owes, so the two only ever differ by the
 * discounts that are reported alongside them.
 */
export function sumQuoteLines(lines: QuoteLine[]): {
  subtotal: number;
  membership_discount: number;
  monthly_perk_discount: number;
  final_total: number;
} {
  const subtotal = roundPeso(lines.reduce((acc, l) => acc + l.line_total, 0));
  const membershipDiscount = roundPeso(lines.reduce((acc, l) => acc + l.discount, 0));
  const monthlyPerkDiscount = roundPeso(lines.reduce((acc, l) => acc + l.monthlyPerkDiscount, 0));

  return {
    subtotal,
    membership_discount: membershipDiscount,
    monthly_perk_discount: monthlyPerkDiscount,
    final_total: Math.max(0, roundPeso(subtotal - membershipDiscount - monthlyPerkDiscount)),
  };
}
