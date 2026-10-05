import { describe, it, expect } from 'vitest';
import {
  summarizeTransactions,
  summarizeGroupedRows,
  groupTotals,
  clinicDayStartUtc,
  clinicDayEndUtc,
  groupByDay,
  resolvePeriod,
  countsTowardRevenue,
  isRefund,
  isVoided,
  toLocalDayKey,
  type ReportRow,
} from './transactions-report-math';

let seq = 0;
function row(over: Partial<ReportRow> = {}): ReportRow {
  seq += 1;
  return {
    id: seq,
    transaction_number: `TXN-${String(seq).padStart(5, '0')}`,
    type: 'sale',
    payment_status: 'paid',
    payment_method: 'cash',
    created_at: '2026-10-01T09:00:00.000Z',
    total_amount: 1000,
    discount_amount: 0,
    tax_amount: 0,
    ...over,
  };
}

describe('summarizeTransactions', () => {
  it('reports nothing for an empty set', () => {
    expect(summarizeTransactions([])).toEqual({
      count: 0,
      gross_sales: 0,
      refund_total: 0,
      voided_total: 0,
      net_revenue: 0,
      discount_total: 0,
      tax_total: 0,
    });
  });

  it('sums plain paid sales', () => {
    const t = summarizeTransactions([row({ total_amount: 500 }), row({ total_amount: 250.5 })]);
    expect(t.count).toBe(2);
    expect(t.gross_sales).toBe(750.5);
    expect(t.net_revenue).toBe(750.5);
  });

  it('accepts Prisma Decimal strings without losing precision', () => {
    const t = summarizeTransactions([row({ total_amount: '330883.66' })]);
    expect(t.gross_sales).toBe(330883.66);
    expect(t.net_revenue).toBe(330883.66);
  });

  it('rounds to two decimals instead of leaking float noise', () => {
    const t = summarizeTransactions([
      row({ total_amount: 0.1 }),
      row({ total_amount: 0.2 }),
    ]);
    expect(t.gross_sales).toBe(0.3);
  });

  it('nets a fully refunded sale to zero', () => {
    // This is the real shape: the sale stays positive but is flagged refunded,
    // and a separate negative refund row is written.
    const t = summarizeTransactions([
      row({ type: 'sale', payment_status: 'refunded', total_amount: 1000 }),
      row({ type: 'refund', payment_status: 'paid', total_amount: -1000 }),
    ]);
    expect(t.gross_sales).toBe(1000);
    expect(t.refund_total).toBe(-1000);
    expect(t.net_revenue).toBe(0);
  });

  it('nets a partially refunded sale to the remainder', () => {
    const t = summarizeTransactions([
      row({ type: 'sale', payment_status: 'partial', total_amount: 1000 }),
      row({ type: 'refund', payment_status: 'paid', total_amount: -400 }),
    ]);
    expect(t.gross_sales).toBe(1000);
    expect(t.refund_total).toBe(-400);
    expect(t.net_revenue).toBe(600);
  });

  it('excludes a voided sale from revenue but still reports it', () => {
    const t = summarizeTransactions([
      row({ total_amount: 1000 }),
      row({ payment_status: 'voided', total_amount: 500 }),
    ]);
    expect(t.gross_sales).toBe(1000);
    expect(t.voided_total).toBe(500);
    expect(t.net_revenue).toBe(1000);
    expect(t.count).toBe(2);
  });

  it('does not let a voided sale net against a real sale', () => {
    // The original page summary excluded refunded rows while still counting the
    // negative refund row, which double-subtracted. Guard against that shape.
    const t = summarizeTransactions([
      row({ type: 'sale', payment_status: 'voided', total_amount: 800 }),
      row({ type: 'refund', total_amount: -800 }),
    ]);
    expect(t.net_revenue).toBe(-800);
    expect(t.voided_total).toBe(800);
  });

  it('counts discounts and tax only on revenue rows', () => {
    const t = summarizeTransactions([
      row({ total_amount: 1000, discount_amount: 100, tax_amount: 50 }),
      row({ payment_status: 'voided', total_amount: 700, discount_amount: 70, tax_amount: 35 }),
      row({ type: 'refund', total_amount: -200, discount_amount: -20, tax_amount: -10 }),
    ]);
    expect(t.discount_total).toBe(80);
    expect(t.tax_total).toBe(40);
  });

  it('treats a missing amount as zero rather than NaN', () => {
    const t = summarizeTransactions([
      { ...row(), total_amount: null as unknown as number, discount_amount: null as unknown as number },
      row({ total_amount: 100 }),
    ]);
    expect(t.gross_sales).toBe(100);
    expect(t.net_revenue).toBe(100);
    expect(Number.isNaN(t.discount_total)).toBe(false);
  });

  it('handles a refund-only set without producing a positive net', () => {
    const t = summarizeTransactions([row({ type: 'refund', total_amount: -300 })]);
    expect(t.gross_sales).toBe(0);
    expect(t.refund_total).toBe(-300);
    expect(t.net_revenue).toBe(-300);
  });
});

describe('row classification', () => {
  it('identifies refunds and voids', () => {
    expect(isRefund(row({ type: 'refund' }))).toBe(true);
    expect(isRefund(row())).toBe(false);
    expect(isVoided(row({ payment_status: 'voided' }))).toBe(true);
    expect(isVoided(row({ payment_status: 'refunded' }))).toBe(false);
  });

  it('excludes only voids from revenue', () => {
    expect(countsTowardRevenue(row({ payment_status: 'paid' }))).toBe(true);
    expect(countsTowardRevenue(row({ payment_status: 'partial' }))).toBe(true);
    expect(countsTowardRevenue(row({ type: 'refund' }))).toBe(true);
    expect(countsTowardRevenue(row({ payment_status: 'voided' }))).toBe(false);
  });
});

describe('summarizeGroupedRows', () => {
  it('matches the row-by-row result for plain sales', () => {
    const rows = [row({ total_amount: 1000 }), row({ total_amount: 250 })];
    const grouped = summarizeGroupedRows([
      { type: 'sale', payment_status: 'paid', total_amount: 1250, discount_amount: 0, tax_amount: 0, _count: 2 },
    ]);
    expect(grouped).toEqual(summarizeTransactions(rows));
  });

  it('uses the group sum as-is and takes only the count from _count', () => {
    // Prisma returns the SUM for the group, so it must not be multiplied again.
    const t = summarizeGroupedRows([
      { type: 'sale', payment_status: 'paid', total_amount: 2000, discount_amount: 40, tax_amount: 20, _count: 4 },
    ]);
    expect(t.count).toBe(4);
    expect(t.gross_sales).toBe(2000);
    expect(t.discount_total).toBe(40);
    expect(t.tax_total).toBe(20);
    expect(t.net_revenue).toBe(2000);
  });

  it('keeps voids out of revenue across groups', () => {
    const t = summarizeGroupedRows([
      { type: 'sale', payment_status: 'paid', total_amount: 2000, discount_amount: 0, tax_amount: 0, _count: 2 },
      { type: 'sale', payment_status: 'voided', total_amount: 300, discount_amount: 0, tax_amount: 0, _count: 1 },
    ]);
    expect(t.count).toBe(3);
    expect(t.gross_sales).toBe(2000);
    expect(t.voided_total).toBe(300);
    expect(t.net_revenue).toBe(2000);
  });

  it('nets refunds the same way as rows do', () => {
    const t = summarizeGroupedRows([
      { type: 'sale', payment_status: 'refunded', total_amount: 900, discount_amount: 0, tax_amount: 0, _count: 1 },
      { type: 'refund', payment_status: 'paid', total_amount: -900, discount_amount: 0, tax_amount: 0, _count: 1 },
    ]);
    expect(t.gross_sales).toBe(900);
    expect(t.refund_total).toBe(-900);
    expect(t.net_revenue).toBe(0);
  });

  it('accepts a BigInt count from MySQL', () => {
    const t = summarizeGroupedRows([
      { type: 'sale', payment_status: 'paid', total_amount: 300, discount_amount: 0, tax_amount: 0, _count: 3n },
    ]);
    expect(t.count).toBe(3);
    expect(t.gross_sales).toBe(300);
  });

  it('treats null sums as zero', () => {
    const t = summarizeGroupedRows([
      { type: 'sale', payment_status: 'paid', total_amount: null, discount_amount: null, tax_amount: null, _count: 2 },
    ]);
    expect(t.gross_sales).toBe(0);
    expect(t.count).toBe(2);
  });

  it('returns zeroed totals for no groups', () => {
    expect(summarizeGroupedRows([])).toEqual(summarizeTransactions([]));
  });
});

describe('groupTotals', () => {
  const label = (v: string) => v;

  it('groups and totals by payment method', () => {
    const groups = groupTotals(
      [
        row({ payment_method: 'cash', total_amount: 1000 }),
        row({ payment_method: 'gcash', total_amount: 500 }),
        row({ payment_method: 'cash', total_amount: 250 }),
      ],
      'payment_method',
      label
    );
    expect(groups).toEqual([
      { key: 'cash', label: 'cash', count: 2, amount: 1250 },
      { key: 'gcash', label: 'gcash', count: 1, amount: 500 },
    ]);
  });

  it('keeps voided rows visible in the status breakdown but not in revenue', () => {
    const groups = groupTotals(
      [
        row({ payment_status: 'paid', total_amount: 1000 }),
        row({ payment_status: 'voided', total_amount: 400 }),
      ],
      'payment_status',
      label
    );
    const voided = groups.find((g) => g.key === 'voided');
    expect(voided?.count).toBe(1);
    expect(voided?.amount).toBe(0);
  });

  it('buckets a null payment method instead of dropping it', () => {
    const groups = groupTotals([row({ payment_method: null, total_amount: 700 })], 'payment_method', label);
    expect(groups[0].key).toBe('unspecified');
    expect(groups[0].amount).toBe(700);
  });

  it('returns nothing for no rows', () => {
    expect(groupTotals([], 'type', label)).toEqual([]);
  });
});

describe('groupByDay', () => {
  it('buckets ascending by local day', () => {
    const groups = groupByDay([
      row({ created_at: '2026-10-03T02:00:00.000Z', total_amount: 100 }),
      row({ created_at: '2026-10-01T09:00:00.000Z', total_amount: 50 }),
    ]);
    expect(groups.map((g) => g.key)).toEqual(['2026-10-01', '2026-10-03']);
  });

  it('nets a same-day refund against the sale', () => {
    const groups = groupByDay([
      row({ created_at: '2026-10-01T09:00:00.000Z', total_amount: 1000 }),
      row({ type: 'refund', created_at: '2026-10-01T11:00:00.000Z', total_amount: -400 }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].amount).toBe(600);
  });

  it('uses the local calendar day, not UTC', () => {
    // 2026-10-02T01:00Z is already 09:00 on the 2nd in UTC+8, and
    // 2026-10-01T23:00Z is 07:00 on the 2nd there too. UTC keys would file
    // both under the 1st and 1st respectively.
    expect(toLocalDayKey('2026-10-02T01:00:00.000Z')).toBe('2026-10-02');
    const groups = groupByDay([row({ created_at: '2026-10-01T23:00:00.000Z' })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe(toLocalDayKey('2026-10-01T23:00:00.000Z'));
  });

  it('skips unparseable dates', () => {
    const groups = groupByDay([row({ created_at: 'not-a-date' }), row({ created_at: '2026-10-01' })]);
    expect(groups).toHaveLength(1);
  });
});

describe('clinic calendar', () => {
  it('buckets by the clinic day, not the host or UTC day', () => {
    // 23:30 Manila on the 20th is 15:30 UTC on the 20th.
    expect(toLocalDayKey('2026-09-20T15:30:00.000Z')).toBe('2026-09-20');
    // 02:00 UTC on the 21st is 10:00 Manila on the 21st.
    expect(toLocalDayKey('2026-09-21T02:00:00.000Z')).toBe('2026-09-21');
    // 17:00 UTC on the 20th is 01:00 Manila on the 21st, so it belongs to the 21st.
    expect(toLocalDayKey('2026-09-20T17:00:00.000Z')).toBe('2026-09-21');
  });

  it('clinicDayStartUtc is the inverse of toLocalDayKey', () => {
    const start = clinicDayStartUtc('2026-09-20')!;
    expect(start.toISOString()).toBe('2026-09-19T16:00:00.000Z');
    expect(toLocalDayKey(start)).toBe('2026-09-20');
    // One millisecond earlier is the previous clinic day.
    expect(toLocalDayKey(new Date(start.getTime() - 1))).toBe('2026-09-19');
  });

  it('a start/end range contains exactly the rows by_day files under those days', () => {
    const from = clinicDayStartUtc('2026-09-20')!;
    const to = clinicDayEndUtc('2026-09-20')!;
    const inside = [
      '2026-09-19T16:00:00.000Z', // 00:00 Manila on the 20th, inclusive start
      '2026-09-20T15:59:59.999Z', // 23:59:59 Manila, inclusive end
    ];
    const outside = ['2026-09-19T15:59:59.999Z', '2026-09-20T16:00:00.000Z'];

    for (const t of inside) {
      const d = new Date(t);
      expect(d.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(d.getTime()).toBeLessThanOrEqual(to.getTime());
      expect(toLocalDayKey(d)).toBe('2026-09-20');
    }
    for (const t of outside) {
      expect(toLocalDayKey(new Date(t))).not.toBe('2026-09-20');
    }
  });

  it('rejects malformed day keys', () => {
    expect(clinicDayStartUtc('')).toBeNull();
    expect(clinicDayStartUtc('Sep 20')).toBeNull();
    expect(clinicDayStartUtc('2026-9-2')).toBeNull();
  });
});

describe('resolvePeriod', () => {
  it('uses the caller filter when one was applied', () => {
    const p = resolvePeriod([row({ created_at: '2026-09-01' })], { date_from: '2026-10-01', date_to: '2026-10-31' });
    expect(p).toEqual({ from: '2026-10-01', to: '2026-10-31', filtered: true });
  });

  it('derives the range from the data when unfiltered', () => {
    const p = resolvePeriod(
      [row({ created_at: '2026-09-05' }), row({ created_at: '2026-10-20' }), row({ created_at: '2026-09-12' })],
      {}
    );
    expect(p).toEqual({ from: '2026-09-05', to: '2026-10-20', filtered: false });
  });

  it('handles a one-sided filter', () => {
    expect(resolvePeriod([], { date_from: '2026-10-01' })).toEqual({
      from: '2026-10-01',
      to: null,
      filtered: true,
    });
  });

  it('reports no period when there is neither filter nor data', () => {
    expect(resolvePeriod([], {})).toEqual({ from: null, to: null, filtered: false });
  });
});