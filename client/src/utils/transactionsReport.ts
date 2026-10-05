import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx-js-style';
import { formatCurrency } from '@/utils/format';
import {
  A4_WIDTH,
  FOOTER_Y,
  HEADER_COLOR,
  pdfText,
  ensureSpace,
  sectionTitle,
  renderTable,
  EXCEL_TEXT,
  ALT_BG,
  SUB_BG,
  MONEY_FMT,
  WHOLE_FMT,
  CellSpec,
  bannerCells,
  headerCells,
  altFill,
  makeSheet,
  mergedSpan,
} from '@/utils/reportFormat';
import formatPaymentMethod from '@/utils/formatPaymentMethod';
import { paymentStatusLabel, transactionTypeLabel } from '@/utils/paymentStatus';

/**
 * Report shape returned by GET /api/transactions/report.
 *
 * Money arrives as strings because Prisma Decimal serialises that way; it is
 * converted to numbers before rendering so the Excel number formats apply.
 */
export interface ReportTransactionRow {
  id: number;
  transaction_number: string;
  type: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  notes: string | null;
  customer: { id: number; first_name: string; last_name: string } | null;
  staff: { id: number; first_name: string; last_name: string } | null;
  item_count: number;
}

export interface ReportGroup {
  key: string;
  label: string;
  count: number;
  amount: number;
}

export interface ReportSummary {
  count: number;
  gross_sales: number;
  refund_total: number;
  voided_total: number;
  net_revenue: number;
  discount_total: number;
  tax_total: number;
}

export interface TransactionsReportData {
  period: { from: string | null; to: string | null; filtered: boolean };
  summary: ReportSummary;
  rows: ReportTransactionRow[];
  by_status: ReportGroup[];
  by_method: ReportGroup[];
  by_type: ReportGroup[];
  by_day: ReportGroup[];
}

const DISCLAIMER = 'Souvari Clinic Management System';

function n(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function customerName(row: ReportTransactionRow): string {
  return row.customer ? `${row.customer.first_name} ${row.customer.last_name}` : 'Walk-in';
}

function staffName(row: ReportTransactionRow): string {
  return row.staff ? `${row.staff.first_name} ${row.staff.last_name}` : '—';
}

/** "2026-10-03" -> "Oct 3, 2026" for display. */
function prettyDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value ?? '');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function prettyDay(key: string): string {
  const [y, m, d] = key.split('-');
  if (!y || !m || !d) return key;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m) - 1] || m} ${Number(d)}, ${y}`;
}

function prettyTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Describe the period in words. When the user did not filter by date the range
 * comes from the data, so the file never implies an unbounded period.
 */
function periodText(period: TransactionsReportData['period']): string {
  const { from, to, filtered } = period;
  if (!from && !to) return 'No transactions in range';
  if (from && to) return `${prettyDate(from)} - ${prettyDate(to)}`;
  if (from) return `From ${prettyDate(from)}`;
  return `Up to ${prettyDate(to as string)}`;
}

/** Label for a breakdown bucket, mapped through the canonical wording. */
function groupLabel(group: ReportGroup): string {
  if (group.key === 'unspecified') return 'Unspecified';
  if (group.key === 'cash' || group.key === 'gcash' || group.key === 'gotyme' || group.key === 'rcbc' || group.key === 'paid_on_us') {
    return formatPaymentMethod(group.key);
  }
  if (group.key === 'sale' || group.key === 'refund' || group.key === 'adjustment') {
    return transactionTypeLabel(group.key);
  }
  return paymentStatusLabel(group.key);
}

function buildFilename(data: TransactionsReportData, ext: string): string {
  const from = data.period.from ?? 'start';
  const to = data.period.to ?? 'end';
  return `Souvari-Transactions_${from}_to_${to}.${ext}`;
}

function summaryRows(s: ReportSummary): CellSpec[][] {
  return [
    [
      { v: 'Transactions', align: 'r', bold: true },
      { v: s.count, align: 'r', numFmt: WHOLE_FMT },
    ],
    [
      { v: 'Gross Sales', align: 'r', bold: true },
      { v: s.gross_sales, align: 'r', numFmt: MONEY_FMT },
    ],
    [
      { v: 'Refunds', align: 'r', bold: true },
      { v: Math.abs(s.refund_total), align: 'r', numFmt: MONEY_FMT },
    ],
    [
      { v: 'Voided', align: 'r', bold: true },
      { v: s.voided_total, align: 'r', numFmt: MONEY_FMT },
    ],
    [
      { v: 'Net Revenue', align: 'r', bold: true },
      { v: s.net_revenue, align: 'r', bold: true, numFmt: MONEY_FMT, fill: SUB_BG },
    ],
    [
      { v: 'Discounts', align: 'r', bold: true },
      { v: s.discount_total, align: 'r', numFmt: MONEY_FMT },
    ],
    [
      { v: 'Tax', align: 'r', bold: true },
      { v: s.tax_total, align: 'r', numFmt: MONEY_FMT },
    ],
  ];
}

export function exportTransactionsPdf(data: TransactionsReportData): void {
  const doc = new jsPDF();
  const cursor = { y: 34 };
  const generated = new Date().toLocaleString();

  // Branded header band, matching the Analytics report.
  doc.setFillColor(HEADER_COLOR[0], HEADER_COLOR[1], HEADER_COLOR[2]);
  doc.rect(0, 0, A4_WIDTH, 26, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Souvari Skin Lab', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Transactions Report', A4_WIDTH - 14, 13, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(230, 222, 216);
  doc.text(pdfText(`Period: ${periodText(data.period)}`), A4_WIDTH - 14, 19, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(130, 118, 111);
  doc.text(pdfText(`Generated ${generated} · ${DISCLAIMER}`), 14, cursor.y);

  // Summary
  sectionTitle(doc, cursor, 'Summary');
  renderTable(
    doc,
    cursor,
    ['Metric', 'Amount'],
    [
      ['Transactions', data.summary.count],
      ['Gross Sales', formatCurrency(data.summary.gross_sales)],
      ['Refunds', formatCurrency(Math.abs(data.summary.refund_total))],
      ['Voided', formatCurrency(data.summary.voided_total)],
      ['Net Revenue', formatCurrency(data.summary.net_revenue)],
      ['Discounts', formatCurrency(data.summary.discount_total)],
      ['Tax', formatCurrency(data.summary.tax_total)],
    ],
    { 1: { halign: 'right' } }
  );

  if (data.by_status.length > 0) {
    sectionTitle(doc, cursor, 'By Payment Status');
    renderTable(
      doc,
      cursor,
      ['Status', 'Transactions', 'Amount'],
      data.by_status.map((g) => [groupLabel(g), g.count, formatCurrency(g.amount)]),
      { 1: { halign: 'right' }, 2: { halign: 'right' } }
    );
  }

  if (data.by_method.length > 0) {
    sectionTitle(doc, cursor, 'By Payment Method');
    renderTable(
      doc,
      cursor,
      ['Method', 'Transactions', 'Amount'],
      data.by_method.map((g) => [groupLabel(g), g.count, formatCurrency(g.amount)]),
      { 1: { halign: 'right' }, 2: { halign: 'right' } }
    );
  }

  if (data.by_day.length > 0) {
    sectionTitle(doc, cursor, 'By Day');
    renderTable(
      doc,
      cursor,
      ['Date', 'Transactions', 'Net Revenue'],
      data.by_day.map((g) => [prettyDay(g.key), g.count, formatCurrency(g.amount)]),
      { 1: { halign: 'right' }, 2: { halign: 'right' } }
    );
  }

  // Full register
  sectionTitle(doc, cursor, 'Transaction Register');
  if (data.rows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(130, 118, 111);
    doc.text(pdfText('No transactions matched the selected filters.'), 14, cursor.y + 6);
  } else {
    renderTable(
      doc,
      cursor,
      ['Reference #', 'Date', 'Customer', 'Type', 'Method', 'Status', 'Items', 'Total'],
      data.rows.map((r) => [
        r.transaction_number,
        `${prettyDate(r.created_at)}${prettyTime(r.created_at) ? ' ' + prettyTime(r.created_at) : ''}`,
        customerName(r),
        transactionTypeLabel(r.type),
        formatPaymentMethod(r.payment_method),
        paymentStatusLabel(r.payment_status),
        r.item_count,
        formatCurrency(n(r.total_amount)),
      ]),
      { 6: { halign: 'right' }, 7: { halign: 'right' } }
    );
  }

  // Footers
  const pageCount = (doc as any).internal.getNumberOfPages?.() ?? 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 150, 142);
    doc.text(pdfText(`Souvari Skin Lab · Generated ${generated}`), 14, FOOTER_Y);
    doc.text(`Page ${i} of ${pageCount}`, A4_WIDTH - 14, FOOTER_Y, { align: 'right' });
  }

  doc.save(buildFilename(data, 'pdf'));
}

export function exportTransactionsExcel(data: TransactionsReportData): void {
  const wb = XLSX.utils.book_new();
  const generated = new Date().toLocaleString();
  const s = data.summary;

  // ---- Summary ----
  {
    const rows: CellSpec[][] = [
      bannerCells(2, 'Souvari Skin Lab — Transactions Report', 13),
      [{ v: `Period: ${periodText(data.period)}`, align: 'l', color: EXCEL_TEXT }, { v: '', border: false }],
      [{ v: `Generated ${generated}`, align: 'l', color: EXCEL_TEXT }, { v: '', border: false }],
      [],
      headerCells(['Metric', 'Amount']),
      ...summaryRows(s),
    ];
    makeSheet(wb, 'Summary', rows, [34, 20], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }], { 0: 22 });
  }

  // ---- Transactions ----
  {
    const headers = ['Reference #', 'Date', 'Time', 'Customer', 'Staff', 'Type', 'Method', 'Status', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'Notes'];
    const rows: CellSpec[][] = [
      bannerCells(headers.length, 'Transactions', 12),
      headerCells(headers),
    ];
    data.rows.forEach((r, i) => {
      const fill = altFill(i);
      const d = new Date(r.created_at);
      rows.push([
        { v: r.transaction_number, align: 'l', fill },
        { v: Number.isNaN(d.getTime()) ? '' : prettyDate(r.created_at), align: 'l', fill },
        { v: Number.isNaN(d.getTime()) ? '' : prettyTime(r.created_at), align: 'c', fill },
        { v: customerName(r), align: 'l', fill },
        { v: staffName(r), align: 'l', fill },
        { v: transactionTypeLabel(r.type), align: 'l', fill },
        { v: formatPaymentMethod(r.payment_method), align: 'l', fill },
        { v: paymentStatusLabel(r.payment_status), align: 'l', fill },
        { v: r.item_count, align: 'r', numFmt: WHOLE_FMT, fill },
        { v: n(r.subtotal), align: 'r', numFmt: MONEY_FMT, fill },
        { v: n(r.discount_amount), align: 'r', numFmt: MONEY_FMT, fill },
        { v: n(r.tax_amount), align: 'r', numFmt: MONEY_FMT, fill },
        { v: n(r.total_amount), align: 'r', bold: true, numFmt: MONEY_FMT, fill },
        { v: r.notes ?? '', align: 'l', fill },
      ]);
    });
    if (data.rows.length === 0) {
      rows.push(mergedSpan(headers.length, 'No transactions matched the selected filters.', ALT_BG));
    }
    makeSheet(wb, 'Transactions', rows, [22, 14, 9, 24, 20, 11, 13, 11, 8, 13, 12, 11, 13, 30], [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }], { 0: 20 });
  }

  // ---- Breakdown sheets ----
  const breakdown = (name: string, title: string, groups: ReportGroup[], dateCol?: boolean) => {
    const rows: CellSpec[][] = [bannerCells(3, title, 12), headerCells([dateCol ? 'Date' : 'Group', 'Transactions', 'Amount'])];
    if (groups.length === 0) {
      rows.push(mergedSpan(3, 'No data', ALT_BG));
    } else {
      groups.forEach((g, i) => {
        const fill = altFill(i);
        rows.push([
          { v: dateCol ? prettyDay(g.key) : groupLabel(g), align: 'l', fill },
          { v: g.count, align: 'r', numFmt: WHOLE_FMT, fill },
          { v: g.amount, align: 'r', numFmt: MONEY_FMT, fill },
        ]);
      });
    }
    makeSheet(wb, name, rows, [26, 14, 18], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }], { 0: 20 });
  };

  breakdown('By Status', 'By Payment Status', data.by_status);
  breakdown('By Method', 'By Payment Method', data.by_method);
  breakdown('By Type', 'By Type', data.by_type);
  breakdown('By Day', 'By Day', data.by_day, true);

  XLSX.writeFile(wb, buildFilename(data, 'xlsx'));
}