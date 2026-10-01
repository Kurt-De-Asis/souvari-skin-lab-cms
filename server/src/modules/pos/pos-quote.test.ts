import { describe, it, expect } from 'vitest';
import { roundPeso } from '../../services/pricing-engine.core';
import { computeQuoteLine, sumQuoteLines } from './pos-quote-math';

describe('computeQuoteLine', () => {
  it('quotes the catalogue price as the line total for a member at regular price', () => {
    const line = computeQuoteLine({ basePrice: 1000, applicablePrice: 1000, priceType: 'regular' });

    expect(line.unit_amount).toBe(1000);
    expect(line.line_total).toBe(1000);
    expect(line.discount).toBe(0);
  });

  it('reports a VIP price as a discount against the catalogue subtotal', () => {
    const line = computeQuoteLine({ basePrice: 1000, applicablePrice: 750, priceType: 'vip' });

    expect(line.unit_amount).toBe(1000);
    expect(line.line_total).toBe(1000);
    expect(line.discount).toBe(250);
  });

  it('keeps non-member pricing in the subtotal with no discount row', () => {
    // Non-member pricing is a different price list, not a reduction, so it must
    // not be shown as a discount the customer never received.
    const line = computeQuoteLine({
      basePrice: 1000,
      applicablePrice: 1100,
      priceType: 'non_member',
    });

    expect(line.line_total).toBe(1100);
    expect(line.discount).toBe(0);
  });

  it('multiplies the line by quantity', () => {
    // Regression: `calculatePrice` returns per-unit figures, so accumulating them
    // without multiplying quoted three services at the price of one.
    const line = computeQuoteLine({
      basePrice: 14,
      applicablePrice: 14,
      priceType: 'regular',
      quantity: 2,
    });

    expect(line.unit_amount).toBe(14);
    expect(line.quantity).toBe(2);
    expect(line.line_total).toBe(28);
  });

  it('multiplies the membership discount by quantity as well', () => {
    const line = computeQuoteLine({
      basePrice: 10,
      applicablePrice: 7.5,
      priceType: 'vip',
      quantity: 3,
    });

    expect(line.line_total).toBe(30);
    expect(line.discount).toBe(7.5);
  });

  it('multiplies the monthly perk by quantity', () => {
    const line = computeQuoteLine({
      basePrice: 1000,
      applicablePrice: 750,
      priceType: 'regular',
      monthlyPerkDiscount: 200,
      quantity: 2,
    });

    expect(line.line_total).toBe(2000);
    expect(line.discount).toBe(500);
    expect(line.monthlyPerkDiscount).toBe(400);
  });

  it('treats a missing or zero quantity as one', () => {
    for (const quantity of [undefined, 0, -3]) {
      const line = computeQuoteLine({
        basePrice: 100,
        applicablePrice: 100,
        priceType: 'regular',
        quantity,
      });
      expect(line.quantity).toBe(1);
      expect(line.line_total).toBe(100);
    }
  });
});

describe('sumQuoteLines', () => {
  const quote = (specs: Parameters<typeof computeQuoteLine>[0][]) =>
    sumQuoteLines(specs.map(computeQuoteLine));

  it('reconciles subtotal minus discounts to the total', () => {
    const q = quote([{ basePrice: 1000, applicablePrice: 750, priceType: 'vip' }]);

    expect(q.subtotal).toBe(1000);
    expect(q.membership_discount).toBe(250);
    expect(q.final_total).toBe(750);
  });

  it('applies the monthly perk once, after the membership discount', () => {
    const q = quote([
      { basePrice: 1000, applicablePrice: 750, priceType: 'regular', monthlyPerkDiscount: 200 },
    ]);

    expect(q.subtotal).toBe(1000);
    expect(q.membership_discount).toBe(250);
    expect(q.monthly_perk_discount).toBe(200);
    expect(q.final_total).toBe(550);
  });

  it('never counts the membership discount twice', () => {
    // The original bug: the subtotal was accumulated from the already-discounted
    // price and the discount was also rendered as its own row.
    const q = quote([{ basePrice: 1000, applicablePrice: 750, priceType: 'regular' }]);

    expect(q.subtotal).toBe(1000);
    expect(q.subtotal).not.toBe(q.final_total);
  });

  it('reconciles exactly across awkward cents and mixed quantities', () => {
    const q = quote([
      { basePrice: 333.33, applicablePrice: 249.995, priceType: 'regular', quantity: 3 },
      { basePrice: 1234.57, applicablePrice: 925.9275, priceType: 'regular', quantity: 2 },
      {
        basePrice: 99.99,
        applicablePrice: 74.9925,
        priceType: 'regular',
        monthlyPerkDiscount: 10.005,
        quantity: 7,
      },
    ]);

    // Binary floats cannot hold a value like 3056.75, so re-subtracting the
    // rounded figures leaves a residue far below a cent. What matters is that
    // the printed rows and the charged total agree to the peso.
    const recomputed = roundPeso(q.subtotal - q.membership_discount - q.monthly_perk_discount);
    expect(recomputed).toBe(q.final_total);

    for (const value of [q.subtotal, q.membership_discount, q.monthly_perk_discount, q.final_total]) {
      expect(roundPeso(value)).toBe(value);
    }
  });

  it('sums to zero for an empty quote', () => {
    expect(quote([])).toEqual({
      subtotal: 0,
      membership_discount: 0,
      monthly_perk_discount: 0,
      final_total: 0,
    });
  });

  it('never reports a negative total when discounts exceed the subtotal', () => {
    const q = quote([
      { basePrice: 100, applicablePrice: 100, priceType: 'regular', monthlyPerkDiscount: 500 },
    ]);

    expect(q.final_total).toBe(0);
  });
});
