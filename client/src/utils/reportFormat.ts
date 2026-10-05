import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';

/**
 * Shared layout and styling primitives for the PDF/Excel reports.
 *
 * Extracted from analyticsReport so the brand colours, page geometry and money
 * formats have a single definition. Two copies of these constants would drift,
 * and a report that disagrees with Analytics on branding is obvious to users.
 */

export const A4_WIDTH = 210;
export const CONTENT_W = A4_WIDTH - 28;
export const MAX_IMG_H = 60;
export const FOOTER_Y = 288;

export const HEADER_COLOR: [number, number, number] = [72, 58, 49];

// jsPDF's built-in fonts only cover Latin-1. Unicode symbols like the peso sign
// (U+20B1) are bit-masked and render as garbage (e.g. "±"), and the width
// mismatch pushes numbers outside the table cells. Map them to ASCII-safe text.
const ASCII_MAP: Array<[RegExp, string]> = [
  [/₱/g, 'PHP '],
  [/[–—]/g, '-'],
  [/[’‘]/g, "'"],
  [/[“”«»]/g, '"'],
  [/…/g, '...'],
];

export function pdfText(value: unknown): string {
  let s = String(value ?? '');
  for (const [re, rep] of ASCII_MAP) s = s.replace(re, rep);
  return s;
}

export interface Cursor {
  y: number;
}

export function ensureSpace(doc: jsPDF, cursor: Cursor, needed: number): void {
  if (doc.internal.pageSize.getHeight() - cursor.y < needed + (FOOTER_Y - 260)) {
    doc.addPage();
    cursor.y = 20;
  }
}

export function sectionTitle(doc: jsPDF, cursor: Cursor, text: string): void {
  ensureSpace(doc, cursor, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(40, 34, 29);
  doc.text(pdfText(text), 14, cursor.y + 6);
  cursor.y += 11;
}

/**
 * Render a grid table and advance the cursor past it. autoTable paginates on its
 * own; the cursor is moved to the final row of the last page it wrote.
 */
export function renderTable(
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

export const EXCEL_TEXT = '3D3128';
export const BRAND_BG = '543B2E';
export const HEADER_BG = 'EADFD4';
export const ALT_BG = 'F8F4EF';
export const SUB_BG = 'F0E9E1';
export const BORDER = 'E3D8CC';

export const MONEY_FMT = '"₱"#,##0.00';
export const WHOLE_FMT = '#,##0';
export const PCT_FMT = '0.0"%"';

export interface CellSpec {
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

export function excelStyle(c: CellSpec): any {
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

export function bannerCells(n: number, text: string, size = 13): CellSpec[] {
  return Array.from({ length: n }, (_, i) =>
    i === 0
      ? { v: text, align: 'c', bold: true, size, color: 'FFFFFF', fill: BRAND_BG, border: false }
      : { v: '', fill: BRAND_BG, border: false }
  );
}

export function headerCells(headers: string[]): CellSpec[] {
  return headers.map((h) => ({ v: h, align: 'c', bold: true, color: BRAND_BG, fill: HEADER_BG }));
}

export function altFill(i: number): string | undefined {
  return i % 2 === 1 ? ALT_BG : undefined;
}

export function mergedSpan(n: number, text: string, fill: string): CellSpec[] {
  return Array.from({ length: n }, (_, i) =>
    i === 0
      ? { v: text, align: 'l', size: 10, color: BRAND_BG, fill, bold: false }
      : { v: '', fill, border: false }
  );
}

export function makeSheet(
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