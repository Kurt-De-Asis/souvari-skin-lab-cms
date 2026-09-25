import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import { formatCurrency, formatPercent, formatServicePrice } from '@/utils/format';

const A4_WIDTH = 210;
const CONTENT_W = A4_WIDTH - 28;
const MAX_IMG_H = 60;
const FOOTER_Y = 288;

const STATUS_LABEL: Record<string, string> = {
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
  pending: 'Pending',
};

const HEADER_COLOR: [number, number, number] = [72, 58, 49];

// jsPDF's built-in fonts only cover Latin-1. Unicode symbols like the peso sign
// (U+20B1) are bit-masked and render as garbage (e.g. "±"), and the width
// mismatch pushes numbers outside the table cells. Map them to ASCII-safe text.
const ASCII_MAP: Array<[RegExp, string]> = [
  [/₱/g, 'PHP '],
  [/[\u2013\u2014]/g, '-'],
  [/[’‘]/g, "'"],
  [/[“”«»]/g, '"'],
  [/…/g, '...'],
];

function pdfText(value: unknown): string {
  let s = String(value ?? '');
  for (const [re, rep] of ASCII_MAP) s = s.replace(re, rep);
  return s;
}

export interface ReportChartImage {
  id: string;
  label: string;
  dataUrl: string | null;
}

export interface AnalyticsReportKpi {
  label: string;
  value: string;
}

export interface AnalyticsReportData {
  dateFrom: string;
  dateTo: string;
  compare: boolean;
  kpis: AnalyticsReportKpi[];
  revenue: { date: string; revenue: number }[];
  prevRevenueByDate: Record<string, number>;
  appointments: { date: string; total: number; completed: number; cancelled: number; no_show: number; pending: number }[];
  status: { status: string; count: number }[];
  categories: { category: string; revenue: number }[];
  services: { name: string; category: string; price: number | string | null; appointment_count: number; total_revenue: number | string | null }[];
  staff: { full_name: string; revenue: number; bookings: number; occupancy_rate: number; patients: number; returning_patients: number }[];
  inventory: { total_products: number; total_value: number; low_stock_count: number; out_of_stock_count: number } | null;
  occupancy: { rate: number; working_minutes: number; booked_minutes: number; unbooked_minutes: number } | null;
}

interface Cursor {
  y: number;
}

/** Pull the already-rendered chart.js canvases out of the DOM. */
export function captureChartImages(ids: string[]): ReportChartImage[] {
  return ids.map((id) => {
    const el = document.querySelector<HTMLElement>(`[data-chart="${id}"]`);
    const canvas = el?.querySelector('canvas');
    return { id, label: id, dataUrl: canvas ? canvas.toDataURL('image/png') : null };
  });
}

function findImage(images: ReportChartImage[], id: string): ReportChartImage | undefined {
  return images.find((img) => img.id === id);
}

function ensureSpace(doc: jsPDF, cursor: Cursor, needed: number): void {
  if (doc.internal.pageSize.getHeight() - cursor.y < needed + (FOOTER_Y - 260)) {
    doc.addPage();
    cursor.y = 20;
  }
}

function sectionTitle(doc: jsPDF, cursor: Cursor, text: string): void {
  ensureSpace(doc, cursor, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(40, 34, 29);
  doc.text(pdfText(text), 14, cursor.y + 6);
  cursor.y += 11;
}

function addChart(doc: jsPDF, cursor: Cursor, image: ReportChartImage | undefined, caption?: string): void {
  if (!image?.dataUrl) return;
  let width = 0;
  let height = 0;
  try {
    const props = doc.getImageProperties(image.dataUrl);
    width = props.width;
    height = props.height;
  } catch {
    return;
  }
  if (!width || !height) return;

  const ratio = height / width;
  let w = CONTENT_W;
  let h = w * ratio;
  if (h > MAX_IMG_H) {
    h = MAX_IMG_H;
    w = h / ratio;
  }
  if (doc.internal.pageSize.getHeight() - cursor.y < h + 24) {
    doc.addPage();
    cursor.y = 20;
  }
  const x = 14 + (CONTENT_W - w) / 2;
  doc.addImage(image.dataUrl, 'PNG', x, cursor.y, w, h);
  cursor.y += h + 3;
  if (caption) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(130, 118, 111);
    const tw = doc.getTextWidth(pdfText(caption));
    doc.text(pdfText(caption), 14 + (CONTENT_W - tw) / 2, cursor.y);
    cursor.y += 6;
  }
}

function renderTable(
  doc: jsPDF,
  cursor: Cursor,
  head: string[],
  body: (string | number)[][],
  columnStyles: Record<number, { halign: 'left' | 'right' | 'center' }> = {}
): void {
  ensureSpace(doc, cursor, 24);
  autoTable(doc, {
    startY: cursor.y,
    head: [head.map(pdfText)],
    body: body.map((row) => row.map(pdfText)),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, textColor: [50, 45, 40], overflow: 'linebreak' },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 247, 245] },
    columnStyles,
    margin: { left: 14, right: 14 },
  });
  const lastY = (doc as any).lastAutoTable?.finalY;
  cursor.y = typeof lastY === 'number' ? lastY + 8 : cursor.y + 8;
}

export function exportAnalyticsPdf(r: AnalyticsReportData, images: ReportChartImage[]): void {
  const doc = new jsPDF();
  const cursor: Cursor = { y: 34 };
  const generated = new Date().toLocaleString();
  const prevMap = r.prevRevenueByDate;

  // Branded header band
  doc.setFillColor(HEADER_COLOR[0], HEADER_COLOR[1], HEADER_COLOR[2]);
  doc.rect(0, 0, A4_WIDTH, 26, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Souvari Skin Lab', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Analytics Report', A4_WIDTH - 14, 13, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(230, 222, 216);
  doc.text(pdfText(`Period: ${r.dateFrom} – ${r.dateTo}`), A4_WIDTH - 14, 19, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(130, 118, 111);
  doc.text(pdfText(`Generated ${generated} · Souvari Clinic Management System`), 14, cursor.y);

  // KPI summary
  sectionTitle(doc, cursor, 'Key Metrics');
  renderTable(
    doc,
    cursor,
    ['Metric', 'Value'],
    r.kpis.map((k) => [k.label, k.value]),
    { 1: { halign: 'right' } }
  );

  // Revenue over time
  sectionTitle(doc, cursor, 'Revenue Over Time');
  addChart(doc, cursor, findImage(images, 'revenue'), 'Revenue over the selected period');
  renderTable(
    doc,
    cursor,
    ['Date', 'Revenue', ...(r.compare ? ['Previous'] : [])],
    r.revenue.map((row) => [row.date, formatCurrency(row.revenue), ...(r.compare ? [formatCurrency(prevMap[row.date] ?? 0)] : [])]),
    { 1: { halign: 'right' }, 2: { halign: 'right' } }
  );

  // Appointments
  sectionTitle(doc, cursor, 'Appointments Analytics');
  addChart(doc, cursor, findImage(images, 'appointments'), 'Appointments over the selected period');
  renderTable(
    doc,
    cursor,
    ['Date', 'Total', 'Completed', 'Cancelled', 'No-show', 'Pending'],
    r.appointments.map((row) => [row.date, row.total, row.completed, row.cancelled, row.no_show, row.pending]),
    { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
  );

  // Bookings by status
  sectionTitle(doc, cursor, 'Bookings by Status');
  addChart(doc, cursor, findImage(images, 'status'), 'Appointment status breakdown');
  renderTable(
    doc,
    cursor,
    ['Status', 'Count'],
    r.status.map((s) => [STATUS_LABEL[s.status] || s.status, s.count]),
    { 1: { halign: 'right' } }
  );

  // Revenue by category
  sectionTitle(doc, cursor, 'Revenue by Service Category');
  addChart(doc, cursor, findImage(images, 'categories'), 'Revenue contribution per service category');
  renderTable(
    doc,
    cursor,
    ['Category', 'Revenue'],
    r.categories.map((c) => [c.category, formatCurrency(c.revenue)]),
    { 1: { halign: 'right' } }
  );

  // Top services
  sectionTitle(doc, cursor, 'Top Services');
  addChart(doc, cursor, findImage(images, 'top-services'), 'Most-booked services');
  renderTable(
    doc,
    cursor,
    ['Service', 'Category', 'Price', 'Appointments', 'Revenue'],
    r.services.map((s) => [
      s.name,
      s.category.replace(/_/g, ' '),
      formatServicePrice(Number(s.price)),
      s.appointment_count,
      formatCurrency(Number(s.total_revenue || 0)),
    ]),
    { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
  );

  // Occupancy
  sectionTitle(doc, cursor, 'Occupancy Analytics');
  addChart(doc, cursor, findImage(images, 'occupancy'), 'Occupancy rate per day');
  renderTable(
    doc,
    cursor,
    ['Metric', 'Value'],
    r.occupancy
      ? [
          ['Occupancy Rate', formatPercent(r.occupancy.rate)],
          ['Working Time', formatMinutesHours(r.occupancy.working_minutes)],
          ['Booked Time', formatMinutesHours(r.occupancy.booked_minutes)],
          ['Unbooked Time', formatMinutesHours(r.occupancy.unbooked_minutes)],
        ]
      : [['Occupancy', 'No data']],
    { 1: { halign: 'right' } }
  );

  // Provider performance
  sectionTitle(doc, cursor, 'Provider Performance');
  renderTable(
    doc,
    cursor,
    ['Provider', 'Revenue', 'Bookings', 'Occupancy', 'Patients', 'Returning'],
    r.staff.map((s) => [
      s.full_name,
      formatCurrency(s.revenue),
      s.bookings,
      formatPercent(s.occupancy_rate),
      s.patients,
      `${s.returning_patients}/${s.patients}`,
    ]),
    { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
  );

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 150, 142);
    doc.text(pdfText(`Souvari Skin Lab · Generated ${generated}`), 14, FOOTER_Y);
    doc.text(`Page ${i} of ${pageCount}`, A4_WIDTH - 14, FOOTER_Y, { align: 'right' });
  }

  doc.save(`Souvari-Analytics_${r.dateFrom}_to_${r.dateTo}.pdf`);
}

const EXCEL_TEXT = '3D3128';
const BRAND_BG = '543B2E';
const HEADER_BG = 'EADFD4';
const ALT_BG = 'F8F4EF';
const SUB_BG = 'F0E9E1';
const BORDER = 'E3D8CC';

interface CellSpec {
  v: string | number;
  align?: 'l' | 'r' | 'c';
  bold?: boolean;
  italic?: boolean;
  size?: number;
  color?: string;
  fill?: string;
  numFmt?: string;
  border?: boolean;
}

function excelStyle(c: CellSpec): any {
  const thin = { style: 'thin', color: { rgb: BORDER } };
  const s: any = {
    font: {
      name: 'Calibri',
      sz: c.size ?? 10,
      color: { rgb: c.color ?? EXCEL_TEXT },
      bold: !!c.bold,
      italic: !!c.italic,
    },
    alignment: {
      horizontal: c.align === 'r' ? 'right' : c.align === 'c' ? 'center' : 'left',
      vertical: 'center',
    },
  };
  if (c.fill) s.fill = { fgColor: { rgb: c.fill }, patternType: 'solid' };
  if (c.numFmt) s.numFmt = c.numFmt;
  if (c.border !== false) s.border = { top: thin, bottom: thin, left: thin, right: thin };
  return s;
}

function bannerCells(n: number, text: string, size = 13): CellSpec[] {
  return Array.from({ length: n }, (_, i) =>
    i === 0
      ? { v: text, align: 'c', bold: true, size, color: 'FFFFFF', fill: BRAND_BG, border: false }
      : { v: '', fill: BRAND_BG, border: false }
  );
}

function headerCells(headers: string[]): CellSpec[] {
  return headers.map((h) => ({ v: h, align: 'c', bold: true, color: BRAND_BG, fill: HEADER_BG }));
}

function altFill(i: number): string | undefined {
  return i % 2 === 1 ? ALT_BG : undefined;
}

function makeSheet(
  wb: XLSX.WorkBook,
  name: string,
  rows: CellSpec[][],
  widths: number[],
  merges: XLSX.Range[] = [],
  rowHeights: Record<number, number> = {}
): void {
  const matrix = rows.map((r) => r.map((c) => c.v));
  const ws = XLSX.utils.aoa_to_sheet(matrix);
  ws['!cols'] = widths.map((w) => ({ wch: w }));
  if (merges.length) ws['!merges'] = merges;
  const maxRow = Math.max(...Object.keys(rowHeights).map(Number), rows.length - 1);
  const rowArr: XLSX.RowInfo[] = [];
  for (let i = 0; i <= maxRow; i++) rowArr.push({ hpt: rowHeights[i] });
  ws['!rows'] = rowArr;

  rows.forEach((row, r) => {
    row.forEach((cell, col) => {
      const addr = XLSX.utils.encode_cell({ r, c: col });
      const target = ws[addr] as XLSX.CellObject | undefined;
      if (target) (target as any).s = excelStyle(cell);
    });
  });

  XLSX.utils.book_append_sheet(wb, ws, name);
}

function mergedSpan(n: number, text: string, fill: string): CellSpec[] {
  return Array.from({ length: n }, (_, i) =>
    i === 0
      ? { v: text, align: 'l', size: 10, color: BRAND_BG, fill, bold: false }
      : { v: '', fill, border: false }
  );
}

export function exportAnalyticsExcel(r: AnalyticsReportData): void {
  const wb = XLSX.utils.book_new();
  const generated = new Date().toLocaleString();
  const money = '"₱"#,##0.00';
  const whole = '#,##0';
  const pct = '0.0"%"';

  // ---- Summary ----
  {
    const n = 2;
    const merge = (row: number): XLSX.Range => ({ s: { r: row, c: 0 }, e: { r: row, c: n - 1 } });
    const rows: CellSpec[][] = [
      bannerCells(n, 'Souvari Skin Lab — Analytics Report', 14),
      mergedSpan(n, `Period: ${r.dateFrom} to ${r.dateTo}`, SUB_BG),
      mergedSpan(n, `Generated: ${generated}`, SUB_BG),
      headerCells(['Metric', 'Value']),
      ...r.kpis.map((k, i): CellSpec[] => [
        { v: k.label, fill: altFill(i) },
        { v: k.value, align: 'r', fill: altFill(i), bold: true },
      ]),
    ];
    makeSheet(wb, 'Summary', rows, [36, 24], [merge(0), merge(1), merge(2)], { 0: 26, 1: 16, 2: 16, 3: 18 });
  }

  // ---- Revenue over time ----
  {
    const hasPrev = r.compare;
    const n = hasPrev ? 3 : 2;
    const rows: CellSpec[][] = [
      bannerCells(n, 'Revenue Over Time'),
      headerCells(['Date', 'Revenue', ...(hasPrev ? ['Previous Period'] : [])]),
      ...r.revenue.map((row, i): CellSpec[] => [
        { v: row.date, fill: altFill(i) },
        { v: row.revenue, align: 'r', numFmt: money, fill: altFill(i) },
        ...(hasPrev ? [{ v: r.prevRevenueByDate[row.date] ?? 0, align: 'r' as const, numFmt: money, fill: altFill(i) }] : []),
      ]),
    ];
    makeSheet(wb, 'Revenue', rows, [18, 18, 18], [{ s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } }], { 0: 26, 1: 18 });
  }

  // ---- Appointments ----
  {
    const n = 6;
    const rows: CellSpec[][] = [
      bannerCells(n, 'Appointments Analytics'),
      headerCells(['Date', 'Total', 'Completed', 'Cancelled', 'No-show', 'Pending']),
      ...r.appointments.map((row, i): CellSpec[] => [
        { v: row.date, fill: altFill(i) },
        { v: row.total, align: 'r', numFmt: whole, fill: altFill(i) },
        { v: row.completed, align: 'r', numFmt: whole, fill: altFill(i) },
        { v: row.cancelled, align: 'r', numFmt: whole, fill: altFill(i) },
        { v: row.no_show, align: 'r', numFmt: whole, fill: altFill(i) },
        { v: row.pending, align: 'r', numFmt: whole, fill: altFill(i) },
      ]),
    ];
    makeSheet(wb, 'Appointments', rows, [18, 12, 14, 14, 14, 14], [{ s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } }], { 0: 26, 1: 18 });
  }

  // ---- Bookings by status ----
  {
    const n = 2;
    const rows: CellSpec[][] = [
      bannerCells(n, 'Bookings by Status'),
      headerCells(['Status', 'Count']),
      ...r.status.map((s, i): CellSpec[] => [
        { v: STATUS_LABEL[s.status] || s.status, fill: altFill(i) },
        { v: s.count, align: 'r', numFmt: whole, fill: altFill(i) },
      ]),
    ];
    makeSheet(wb, 'Bookings by Status', rows, [26, 14], [{ s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } }], { 0: 26, 1: 18 });
  }

  // ---- Revenue by category ----
  {
    const n = 2;
    const rows: CellSpec[][] = [
      bannerCells(n, 'Revenue by Service Category'),
      headerCells(['Category', 'Revenue']),
      ...r.categories.map((c, i): CellSpec[] => [
        { v: c.category, fill: altFill(i) },
        { v: c.revenue, align: 'r', numFmt: money, fill: altFill(i) },
      ]),
    ];
    makeSheet(wb, 'Revenue by Category', rows, [32, 18], [{ s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } }], { 0: 26, 1: 18 });
  }

  // ---- Top services ----
  {
    const n = 5;
    const rows: CellSpec[][] = [
      bannerCells(n, 'Top Services'),
      headerCells(['Service', 'Category', 'Price', 'Appointments', 'Revenue']),
      ...r.services.map((s, i): CellSpec[] => {
        const price = Number(s.price);
        const isFree = !price || Number.isNaN(price);
        return [
          { v: s.name, fill: altFill(i) },
          { v: s.category.replace(/_/g, ' '), fill: altFill(i) },
          isFree
            ? { v: 'Free', align: 'l', fill: altFill(i), italic: true }
            : { v: price, align: 'r', numFmt: money, fill: altFill(i) },
          { v: s.appointment_count, align: 'r', numFmt: whole, fill: altFill(i) },
          { v: Number(s.total_revenue || 0), align: 'r', numFmt: money, fill: altFill(i) },
        ];
      }),
    ];
    makeSheet(wb, 'Services', rows, [30, 20, 14, 15, 18], [{ s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } }], { 0: 26, 1: 18 });
  }

  // ---- Inventory ----
  {
    if (r.inventory) {
      const inv = r.inventory;
      const val = (v: number, fmt: string, i: number): CellSpec => ({ v, align: 'r', numFmt: fmt, fill: altFill(i) });
      const rows: CellSpec[][] = [
        bannerCells(2, 'Inventory Summary'),
        headerCells(['Metric', 'Value']),
        [{ v: 'Total Products', fill: altFill(0) }, val(inv.total_products, whole, 0)],
        [{ v: 'Total Value', fill: altFill(1) }, val(inv.total_value, money, 1)],
        [{ v: 'Low Stock Items', fill: altFill(2) }, val(inv.low_stock_count, whole, 2)],
        [{ v: 'Out of Stock', fill: altFill(3) }, val(inv.out_of_stock_count, whole, 3)],
      ];
      makeSheet(wb, 'Inventory', rows, [26, 18], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }], { 0: 26, 1: 18 });
    } else {
      const rows: CellSpec[][] = [[{ v: 'No inventory data', align: 'l', italic: true }]];
      makeSheet(wb, 'Inventory', rows, [30]);
    }
  }

  // ---- Providers ----
  {
    const n = 6;
    const rows: CellSpec[][] = [
      bannerCells(n, 'Provider Performance'),
      headerCells(['Provider', 'Revenue', 'Bookings', 'Occupancy', 'Patients', 'Returning']),
      ...r.staff.map((s, i): CellSpec[] => [
        { v: s.full_name, fill: altFill(i) },
        { v: s.revenue, align: 'r', numFmt: money, fill: altFill(i) },
        { v: s.bookings, align: 'r', numFmt: whole, fill: altFill(i) },
        { v: Number(s.occupancy_rate || 0), align: 'r', numFmt: pct, fill: altFill(i) },
        { v: s.patients, align: 'r', numFmt: whole, fill: altFill(i) },
        { v: s.returning_patients > 0 ? `${s.returning_patients}/${s.patients}` : 0, align: 'r', numFmt: s.returning_patients > 0 ? undefined : whole, fill: altFill(i) },
      ]),
    ];
    makeSheet(wb, 'Providers', rows, [24, 18, 12, 14, 12, 14], [{ s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } }], { 0: 26, 1: 18 });
  }

  XLSX.writeFile(wb, `Souvari-Analytics_${r.dateFrom}_to_${r.dateTo}.xlsx`);
}

function formatMinutesHours(minutes: number): string {
  const mins = Math.round(Number(minutes || 0));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}