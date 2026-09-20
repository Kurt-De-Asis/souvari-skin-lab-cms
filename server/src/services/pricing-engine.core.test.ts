import { describe, it, expect } from 'vitest';
import {
  computePerDay,
  computeInstallments,
  roundPeso,
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