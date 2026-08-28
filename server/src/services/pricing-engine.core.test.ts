import { describe, it, expect } from 'vitest';
import {
  resolveUnitPrice,
  applyMembershipDiscount,
  computePerDay,
  computeInstallments,
  roundPeso,
  PriceMatrixRow,
  PriceSelector,
} from './pricing-engine.core';

describe('roundPeso', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundPeso(100.444)).toBe(100.44);
    expect(roundPeso(100.445)).toBe(100.45);
    expect(roundPeso(100.446)).toBe(100.45);
  });

  it('handles zero', () => {
    expect(roundPeso(0)).toBe(0);
  });

  it('handles whole numbers', () => {
    expect(roundPeso(100)).toBe(100);
  });
});

describe('resolveUnitPrice', () => {
  const matrix: PriceMatrixRow[] = [
    { id: 1, service_id: 1, service_variant_id: null, audience: 'vip', staff_tier: 'standard', gender_scope: 'any', amount: 500, is_available: true, needs_verification: false, source_ref: null },
    { id: 2, service_id: 1, service_variant_id: null, audience: 'non_member', staff_tier: 'standard', gender_scope: 'any', amount: 800, is_available: true, needs_verification: false, source_ref: null },
    { id: 3, service_id: 1, service_variant_id: null, audience: 'vip', staff_tier: 'standard', gender_scope: 'male', amount: 450, is_available: true, needs_verification: false, source_ref: null },
    { id: 4, service_id: 1, service_variant_id: null, audience: 'vip', staff_tier: 'standard', gender_scope: 'female', amount: 480, is_available: true, needs_verification: false, source_ref: null },
    { id: 5, service_id: 1, service_variant_id: null, audience: 'regular', staff_tier: 'technician', gender_scope: 'any', amount: 600, is_available: true, needs_verification: false, source_ref: null },
    { id: 6, service_id: 1, service_variant_id: null, audience: 'vip', staff_tier: 'standard', gender_scope: 'any', amount: 500, is_available: false, needs_verification: false, source_ref: null },
  ];
  const variantIdMap = new Map<string, number>();

  it('resolves VIP price for any gender', () => {
    const selector: PriceSelector = { audience: 'vip', gender: 'any' };
    const result = resolveUnitPrice(matrix, selector, variantIdMap);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(500);
  });

  it('resolves non_member price', () => {
    const selector: PriceSelector = { audience: 'non_member', gender: 'any' };
    const result = resolveUnitPrice(matrix, selector, variantIdMap);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(800);
  });

  it('resolves gender-specific VIP price for male', () => {
    const selector: PriceSelector = { audience: 'vip', gender: 'male' };
    const result = resolveUnitPrice(matrix, selector, variantIdMap);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(450);
  });

  it('resolves gender-specific VIP price for female', () => {
    const selector: PriceSelector = { audience: 'vip', gender: 'female' };
    const result = resolveUnitPrice(matrix, selector, variantIdMap);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(480);
  });

  it('falls back to any gender when gender-specific not found', () => {
    const noMaleFemale: PriceMatrixRow[] = [
      { id: 30, service_id: 1, service_variant_id: null, audience: 'vip', staff_tier: 'standard', gender_scope: 'any', amount: 500, is_available: true, needs_verification: false, source_ref: null },
    ];
    const selector: PriceSelector = { audience: 'vip', gender: 'male' };
    const result = resolveUnitPrice(noMaleFemale, selector, variantIdMap);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(500);
  });

  it('returns null when no prices match', () => {
    const selector: PriceSelector = { audience: 'nonexistent' as any, gender: 'any' };
    const result = resolveUnitPrice(matrix, selector, variantIdMap);
    expect(result).toBeNull();
  });

  it('skips unavailable prices', () => {
    const onlyUnavailable: PriceMatrixRow[] = [
      { id: 10, service_id: 1, service_variant_id: null, audience: 'vip', staff_tier: 'standard', gender_scope: 'any', amount: 100, is_available: false, needs_verification: false, source_ref: null },
    ];
    const selector: PriceSelector = { audience: 'vip', gender: 'any' };
    const result = resolveUnitPrice(onlyUnavailable, selector, variantIdMap);
    expect(result).toBeNull();
  });

  it('includes warnings for needs_verification', () => {
    const verifyMatrix: PriceMatrixRow[] = [
      { id: 20, service_id: 1, service_variant_id: null, audience: 'vip', staff_tier: 'standard', gender_scope: 'any', amount: 100, is_available: true, needs_verification: true, source_ref: null },
    ];
    const selector: PriceSelector = { audience: 'vip', gender: 'any' };
    const result = resolveUnitPrice(verifyMatrix, selector, variantIdMap);
    expect(result).not.toBeNull();
    expect(result!.needs_verification).toBe(true);
    expect(result!.warnings.length).toBeGreaterThan(0);
  });

  it('multiplies by quantity', () => {
    const selector: PriceSelector = { audience: 'vip', gender: 'any', quantity: 3 };
    const result = resolveUnitPrice(matrix, selector, variantIdMap);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(1500);
  });
});

describe('applyMembershipDiscount', () => {
  it('applies percentage discount when category matches', () => {
    const result = applyMembershipDiscount(1000, ['Facials', 'Body Treatments'], 'Facials', 15);
    expect(result.discounted).toBe(850);
    expect(result.discount).toBe(150);
    expect(result.applied).toBe(true);
  });

  it('applies percentage discount when eligibleCategories is null (all categories)', () => {
    const result = applyMembershipDiscount(1000, null, 'Facials', 15);
    expect(result.discounted).toBe(850);
    expect(result.discount).toBe(150);
    expect(result.applied).toBe(true);
  });

  it('does not apply discount when category does not match', () => {
    const result = applyMembershipDiscount(1000, ['Nails'], 'Facials', 15);
    expect(result.discounted).toBe(1000);
    expect(result.discount).toBe(0);
    expect(result.applied).toBe(false);
  });

  it('returns original price when discountPct is 0 or null', () => {
    const result = applyMembershipDiscount(1000, null, 'Facials', 0);
    expect(result.discounted).toBe(1000);
    expect(result.discount).toBe(0);
    expect(result.applied).toBe(false);
  });

  it('does not clamp below zero (engine returns raw)', () => {
    const result = applyMembershipDiscount(100, null, 'Facials', 200);
    expect(result.discount).toBe(200);
    expect(result.applied).toBe(true);
  });

  it('handles empty eligibleCategories array as no restriction', () => {
    const result = applyMembershipDiscount(1000, [], 'Facials', 10);
    expect(result.applied).toBe(true);
    expect(result.discounted).toBe(900);
  });
});

describe('computePerDay', () => {
  it('computes per-day price using 30.44 days/month', () => {
    const result = computePerDay(30000, 30);
    const expected = Math.round(30000 / (30 * 30.44) * 100) / 100;
    expect(result).toBe(expected);
  });

  it('computes 90-day term per-day price', () => {
    const result = computePerDay(90000, 90);
    const expected = Math.round(90000 / (90 * 30.44) * 100) / 100;
    expect(result).toBe(expected);
  });

  it('handles 1-month term', () => {
    const result = computePerDay(3000, 1);
    const expected = Math.round(3000 / (1 * 30.44) * 100) / 100;
    expect(result).toBe(expected);
  });

  it('handles zero price', () => {
    expect(computePerDay(0, 30)).toBe(0);
  });
});

describe('computeInstallments', () => {
  it('computes 3-month installment with 20% down payment', () => {
    const option = { months: 3, down_payment_pct: 20, payment_method: 'cash' };
    const result = computeInstallments(30000, option);
    expect(result.down_payment).toBe(6000);
    expect(result.monthly_payment).toBe(8000);
    expect(result.total).toBe(30000);
    expect(result.months).toBe(3);
  });

  it('computes 6-month installment with 10% down payment', () => {
    const option = { months: 6, down_payment_pct: 10, payment_method: 'cash' };
    const result = computeInstallments(60000, option);
    expect(result.down_payment).toBe(6000);
    expect(result.monthly_payment).toBe(9000);
    expect(result.total).toBe(60000);
    expect(result.months).toBe(6);
  });

  it('computes installment with 0% down payment', () => {
    const option = { months: 3, down_payment_pct: 0, payment_method: 'cash' };
    const result = computeInstallments(30000, option);
    expect(result.down_payment).toBe(0);
    expect(result.monthly_payment).toBe(10000);
    expect(result.total).toBe(30000);
  });

  it('handles 1-month installment', () => {
    const option = { months: 1, down_payment_pct: 50, payment_method: 'cash' };
    const result = computeInstallments(10000, option);
    expect(result.down_payment).toBe(5000);
    expect(result.monthly_payment).toBe(5000);
    expect(result.total).toBe(10000);
    expect(result.months).toBe(1);
  });
});
