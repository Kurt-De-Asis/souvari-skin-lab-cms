import { describe, it, expect } from 'vitest';
import { summarizeAppointmentPayment, countsTowardPaid } from './payment-summary';

const sale = (total: number, serviceIds: number[] = [], over: any = {}) => ({
  type: 'sale',
  payment_status: 'paid',
  total_amount: total,
  items: serviceIds.map((service_id) => ({ service_id })),
  ...over,
});

const refund = (total: number, serviceIds: number[] = []) => ({
  type: 'refund',
  payment_status: 'paid',
  total_amount: -Math.abs(total),
  items: serviceIds.map((service_id) => ({ service_id })),
});

describe('countsTowardPaid', () => {
  it('counts refund rows so they net against the sale', () => {
    expect(countsTowardPaid(refund(100))).toBe(true);
  });

  it('counts paid and partially-refunded sales', () => {
    expect(countsTowardPaid(sale(100))).toBe(true);
    expect(countsTowardPaid(sale(100, [], { payment_status: 'partial' }))).toBe(true);
  });

  it('excludes voided, fully refunded, and pending rows', () => {
    expect(countsTowardPaid(sale(100, [], { payment_status: 'voided' }))).toBe(false);
    expect(countsTowardPaid(sale(100, [], { payment_status: 'refunded' }))).toBe(false);
    expect(countsTowardPaid(sale(100, [], { payment_status: 'pending' }))).toBe(false);
  });
});

describe('summarizeAppointmentPayment', () => {
  it('reports nothing owed for an unpaid booking', () => {
    const s = summarizeAppointmentPayment({ quotedPrice: 3000, transactions: [] });
    expect(s).toMatchObject({ amount_due: 3000, paid_amount: 0, balance: 3000 });
  });

  it('treats a NULL quoted_price as nothing to collect', () => {
    // Legacy walk-in appointments have quoted_price = NULL but a paid
    // transaction; completing them must not error or demand money.
    const s = summarizeAppointmentPayment({ quotedPrice: null, transactions: [sale(1875)] });
    expect(s).toMatchObject({ amount_due: 0, paid_amount: 1875, balance: 0 });
  });

  it('computes the outstanding balance on a partly-paid booking', () => {
    // Live appointment 84: Calves paid, Knees added afterwards.
    const s = summarizeAppointmentPayment({
      quotedPrice: 3000,
      transactions: [sale(1875, [1])],
    });
    expect(s).toMatchObject({ amount_due: 3000, paid_amount: 1875, balance: 1125 });
    expect(s.covered_service_ids).toEqual([1]);
  });

  it('nets a full refund to zero rather than negative', () => {
    const s = summarizeAppointmentPayment({
      quotedPrice: 1875,
      transactions: [sale(1875, [1], { payment_status: 'refunded' }), refund(1875, [1])],
    });
    expect(s).toMatchObject({ amount_due: 1875, paid_amount: 0, balance: 1875 });
  });

  it('keeps the retained portion of a partial refund', () => {
    // Original drops to `partial`; the refund is the offsetting leg.
    const s = summarizeAppointmentPayment({
      quotedPrice: 3000,
      transactions: [sale(3000, [1, 2], { payment_status: 'partial' }), refund(1000, [1])],
    });
    expect(s).toMatchObject({ paid_amount: 2000, balance: 1000 });
  });

  it('frees a fully refunded service for re-collection', () => {
    const s = summarizeAppointmentPayment({
      quotedPrice: 3000,
      transactions: [sale(1875, [1], { payment_status: 'refunded' }), refund(1875, [1])],
    });
    expect(s.covered_service_ids).toEqual([]);
    expect(s.balance).toBe(3000);
  });

  it('ignores a voided sale entirely', () => {
    const s = summarizeAppointmentPayment({
      quotedPrice: 3000,
      transactions: [sale(3000, [1, 2], { payment_status: 'voided' })],
    });
    expect(s).toMatchObject({ paid_amount: 0, balance: 3000, covered_service_ids: [] });
  });

  it('applies the manual discount on top of the quoted price', () => {
    const s = summarizeAppointmentPayment({ quotedPrice: 3000, discountPct: 20, transactions: [] });
    expect(s).toMatchObject({ amount_due: 2400, balance: 2400, discount_pct: 20 });
  });

  it('applies a 100% discount to a fully paid-on-us booking', () => {
    const s = summarizeAppointmentPayment({ quotedPrice: 3000, discountPct: 100, transactions: [] });
    expect(s).toMatchObject({ amount_due: 0, balance: 0 });
  });

  it('accumulates across several balance payments', () => {
    const s = summarizeAppointmentPayment({
      quotedPrice: 3000,
      transactions: [sale(1875, [1]), sale(1125, [2])],
    });
    expect(s).toMatchObject({ paid_amount: 3000, balance: 0 });
    expect(s.covered_service_ids).toEqual([1, 2]);
  });

  it('rounds to 2dp without float drift', () => {
    const s = summarizeAppointmentPayment({
      quotedPrice: 100,
      discountPct: 33,
      transactions: [sale(0.1), sale(0.2)],
    });
    // 100 * 0.67 = 67, minus 0.30000000000000004
    expect(s.balance).toBe(66.7);
  });
});
