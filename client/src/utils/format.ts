export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(value: number | null | undefined): string {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-PH').format(n);
}

export function formatPercent(value: number | null | undefined): string {
  const n = Number(value || 0);
  return `${Math.round(n * 10) / 10}%`;
}

export function formatMinutesHours(minutes: number | null | undefined): string {
  const mins = Math.round(Number(minutes || 0));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatPosition(position: string | null | undefined): string {
  if (!position) return '';
  return position
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function percentChange(current: number | null | undefined, previous: number | null | undefined): number | null {
  const cur = Number(current || 0);
  const prev = Number(previous || 0);
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}