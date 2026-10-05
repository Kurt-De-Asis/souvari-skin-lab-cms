/**
 * Pure aggregation helpers for the transactions report.
 *
 * Kept free of Prisma and Express so the money rules can be unit tested. The
 * live database currently holds no refunds or voids, so these cases are only
 * verifiable here.
 *
 * How refunds and voids are represented:
 * - A refund is a NEW transaction row with `type = 'refund'` and a NEGATIVE
 *   total_amount, while the original sale is flipped to `refunded` (fully) or
 *   `partial`.
 * - A void keeps its original positive total_amount but is marked
 *   `payment_status = 'voided'`, and must not count as revenue.
 */

/**
 * Anything Prisma might hand back for a money column: a number, a numeric
 * string, or a Decimal (which is JSON-serialised as a string). Accepting all
 * three keeps this module free of a Prisma import while still type checking
 * against the real query result.
 */
export type Money = number | string | { toString(): string };

export interface ReportRow {
  id: number;
  transaction_number: string;
  type: string;
  payment_status: string;
  payment_method: string | null;
  created_at: Date | string;
  total_amount: Money;
  discount_amount: Money;
  tax_amount: Money;
}

export interface ReportTotals {
  count: number;
  gross_sales: number;
  refund_total: number;
  voided_total: number;
  net_revenue: number;
  discount_total: number;
  tax_total: number;
}

export interface GroupTotal {
  key: string;
  label: string;
  count: number;
  amount: number;
}

export interface ReportPeriod {
  from: string | null;
  to: string | null;
  /** True when the period came from the caller's filter rather than the data. */
  filtered: boolean;
}

const VOIDED = 'voided';

function num(value: Money | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/**
 * Round to 2 decimals. Money is summed in floating point here, so repeated
 * addition can otherwise leave values like 330883.66000000004 in the report.
 */
function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isVoided(row: ReportRow): boolean {
  return row.payment_status === VOIDED;
}

export function isRefund(row: ReportRow): boolean {
  return row.type === 'refund';
}

/**
 * Whether a row contributes to recognised revenue.
 *
 * A voided row never does. A refund row does, with a negative amount, which is
 * what makes a fully refunded sale net to exactly zero.
 */
export function countsTowardRevenue(row: ReportRow): boolean {
  return !isVoided(row);
}

function emptyTotals(): ReportTotals {
  return {
    count: 0,
    gross_sales: 0,
    refund_total: 0,
    voided_total: 0,
    net_revenue: 0,
    discount_total: 0,
    tax_total: 0,
  };
}

/**
 * Add one bucket's already-summed amounts into the totals.
 *
 * Shared by both entry points so the money rules cannot drift: raw rows pass a
 * single row with count 1, while grouped rows pass the group's SUM with the
 * group's row count. Note the group's total is already summed by the database,
 * so it must not be multiplied by the count.
 */
function addBucket(
  totals: ReportTotals,
  bucket: { type: string; payment_status: string; total: number; discount: number; tax: number; count: number }
): void {
  totals.count += bucket.count;

  if (bucket.payment_status === VOIDED) {
    // Reported separately and excluded from every revenue figure.
    totals.voided_total += bucket.total;
    return;
  }

  if (bucket.type === 'refund') {
    // Already negative in the database; keep the sign so net maths is additive.
    totals.refund_total += bucket.total;
    totals.discount_total += bucket.discount;
    totals.tax_total += bucket.tax;
    return;
  }

  totals.gross_sales += bucket.total;
  totals.discount_total += bucket.discount;
  totals.tax_total += bucket.tax;
}

function finishTotals(totals: ReportTotals): ReportTotals {
  totals.gross_sales = money(totals.gross_sales);
  totals.refund_total = money(totals.refund_total);
  totals.voided_total = money(totals.voided_total);
  totals.discount_total = money(totals.discount_total);
  totals.tax_total = money(totals.tax_total);
  totals.net_revenue = money(totals.gross_sales + totals.refund_total);
  return totals;
}

export function summarizeTransactions(rows: ReportRow[]): ReportTotals {
  const totals = emptyTotals();

  for (const row of rows) {
    addBucket(totals, {
      type: row.type,
      payment_status: row.payment_status,
      total: num(row.total_amount),
      discount: num(row.discount_amount),
      tax: num(row.tax_amount),
      count: 1,
    });
  }

  return finishTotals(totals);
}

/**
 * Grouped aggregate rows as returned by prisma.groupBy.
 */
export interface GroupedAggregate {
  type: string;
  payment_status: string;
  total_amount: Money | null;
  discount_amount: Money | null;
  tax_amount: Money | null;
  _count: number | bigint;
}

/**
 * Summarise grouped aggregates into the same totals as summarizeTransactions.
 *
 * The list screen needs totals over every matching row, but shipping each row
 * just to add it up would be wasteful. Prisma already returns each group's SUM
 * and row count, so this adds those directly through the same accumulator —
 * the on-screen KPI and the exported report cannot disagree.
 */
export function summarizeGroupedRows(groups: GroupedAggregate[]): ReportTotals {
  const totals = emptyTotals();

  for (const g of groups) {
    addBucket(totals, {
      type: g.type,
      payment_status: g.payment_status,
      total: num(g.total_amount),
      discount: num(g.discount_amount),
      tax: num(g.tax_amount),
      count: Number(g._count ?? 0),
    });
  }

  return finishTotals(totals);
}

/**
 * Group rows by one field, e.g. payment status or payment method.
 * Voided rows are excluded because they are not revenue, but they are reported
 * through the status breakdown as their own line.
 */
export function groupTotals(
  rows: ReportRow[],
  field: 'payment_status' | 'payment_method' | 'type',
  labelFor: (value: string) => string
): GroupTotal[] {
  const buckets = new Map<string, GroupTotal>();

  for (const row of rows) {
    const raw = (row[field] as string | null) ?? '';
    const key = raw === '' ? 'unspecified' : raw;
    const bucket = buckets.get(key) ?? { key, label: labelFor(key), count: 0, amount: 0 };
    bucket.count += 1;
    if (countsTowardRevenue(row)) bucket.amount += num(row.total_amount);
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .map((b) => ({ ...b, amount: money(b.amount) }))
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));
}

/**
 * Group rows into YYYY-MM-DD buckets, ascending. Money is per-day net revenue
 * so a refund on the same day as its sale cancels out.
 */
export function groupByDay(rows: ReportRow[]): GroupTotal[] {
  const buckets = new Map<string, { count: number; amount: number }>();

  for (const row of rows) {
    const key = toLocalDayKey(row.created_at);
    if (!key) continue;
    const bucket = buckets.get(key) ?? { count: 0, amount: 0 };
    bucket.count += 1;
    if (countsTowardRevenue(row)) bucket.amount += num(row.total_amount);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([key, v]) => ({ key, label: key, count: v.count, amount: money(v.amount) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * The clinic operates in the Philippines, which is a fixed UTC+8 with no DST.
 *
 * This is pinned deliberately rather than read from the host: day bucketing and
 * date-range filters must agree no matter where the server happens to run, and
 * a naive `new Date(str)` filter would otherwise be interpreted in UTC while
 * day keys are read in server-local time.
 */
export const CLINIC_UTC_OFFSET_MINUTES = 8 * 60;

/** Calendar day at the clinic, as YYYY-MM-DD. */
export function toLocalDayKey(value: Date | string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  // Shift by the fixed offset, then read UTC parts so the host timezone is irrelevant.
  const shifted = new Date(d.getTime() + CLINIC_UTC_OFFSET_MINUTES * 60_000);
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${month}-${day}`;
}

/**
 * Start of a clinic day (YYYY-MM-DD) as a UTC instant.
 *
 * Inverse of `toLocalDayKey`, so a range built from these bounds contains
 * exactly the rows that `toLocalDayKey` files under those days.
 */
export function clinicDayStartUtc(dayKey: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey ?? '');
  if (!m) return null;
  const utcMidnight = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(utcMidnight)) return null;
  return new Date(utcMidnight - CLINIC_UTC_OFFSET_MINUTES * 60_000);
}

/** Inclusive end of a clinic day: the last millisecond before the next day. */
export function clinicDayEndUtc(dayKey: string): Date | null {
  const start = clinicDayStartUtc(dayKey);
  if (!start) return null;
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Resolve the period the report covers.
 *
 * When the caller filtered by date we report that filter. Otherwise we derive
 * the range from the data so the file never implies an unbounded period.
 */
export function resolvePeriod(
  rows: ReportRow[],
  filter: { date_from?: string; date_to?: string }
): ReportPeriod {
  const filtered = Boolean(filter.date_from || filter.date_to);

  if (filtered) {
    return { from: filter.date_from ?? null, to: filter.date_to ?? null, filtered: true };
  }

  const days = rows.map((r) => toLocalDayKey(r.created_at)).filter(Boolean).sort();
  if (days.length === 0) return { from: null, to: null, filtered: false };
  return { from: days[0], to: days[days.length - 1], filtered: false };
}