const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  gotyme: 'GoTyme',
  rcbc: 'RCBC',
  'paid_on_us': 'Paid On Us',
};

export default function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return '—';
  return PAYMENT_METHOD_LABELS[method] || method.replace(/_/g, ' ');
}