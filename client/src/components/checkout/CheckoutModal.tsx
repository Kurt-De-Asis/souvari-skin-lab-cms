import { useEffect, useMemo, useState } from 'react';
import { CreditCard, DollarSign, Loader2, Minus, Plus, X } from 'lucide-react';
import { posApi, transactionsApi } from '../../api';
import { formatAmountInput, formatServicePrice, parseAmountInput } from '../../utils/format';
import type { ServiceOption } from '../booking/admin/types';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointmentId?: number;
  customerId: number;
  staffId: number;
  services: ServiceOption[];
  isStaff?: boolean;
  treatmentNotes?: string;
  treatmentRecommendations?: string;
}

const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70];
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: DollarSign },
  { value: 'gcash', label: 'GCash', icon: CreditCard },
  { value: 'gotyme', label: 'GoTyme', icon: CreditCard },
  { value: 'rcbc', label: 'RCBC', icon: CreditCard },
  { value: 'paid_on_us', label: 'Paid On Us', icon: CreditCard },
];

export default function CheckoutModal({
  open,
  onClose,
  onSuccess,
  appointmentId,
  customerId,
  staffId,
  services,
  isStaff = false,
  treatmentNotes,
  treatmentRecommendations,
}: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<{
    subtotal: number;
    membership_discount: number;
    monthly_perk_discount: number;
    final_total: number;
    benefits: string[];
    perks_applied: string[];
    items: { service_id: number; quantity: number; unit_amount: number; line_total: number }[];
  } | null>(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [paidOnUs, setPaidOnUs] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [error, setError] = useState('');

  const totalPrice = useMemo(() => services.reduce((sum, s) => sum + s.price, 0), [services]);

  useEffect(() => {
    if (open && services.length > 0) {
      loadQuote();
    }
  }, [open, services]);

  const loadQuote = async () => {
    try {
      const { data } = await posApi.quote({
        customer_id: customerId,
        items: services.map(s => ({ service_id: s.id, quantity: 1 })),
      });
      setQuote(data);
    } catch {
      setQuote({
        subtotal: totalPrice,
        membership_discount: 0,
        monthly_perk_discount: 0,
        final_total: totalPrice,
        benefits: [],
        perks_applied: [],
        items: services.map(s => ({ service_id: s.id, quantity: 1, unit_amount: s.price, line_total: s.price })),
      });
    }
  };

  const computedDiscount = useMemo(() => {
    if (!quote) return 0;
    const memberPerkDiscount = (quote.membership_discount || 0) + (quote.monthly_perk_discount || 0);
    if (paidOnUs) return quote.final_total;
    if (discountPct > 0) return (quote.final_total * discountPct) / 100;
    return 0;
  }, [quote, discountPct, paidOnUs]);

  const finalTotal = useMemo(() => {
    if (!quote) return 0;
    return Math.max(0, quote.final_total - computedDiscount);
  }, [quote, computedDiscount]);

  const change = useMemo(() => {
    const tendered = parseAmountInput(amountTendered) || 0;
    return Math.max(0, tendered - finalTotal);
  }, [amountTendered, finalTotal]);

  const handleSubmit = async () => {
    if (!quote) return;
    if (paymentMethod === 'cash' && (parseAmountInput(amountTendered) || 0) < finalTotal) {
      setError('Amount tendered is less than total');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const items = quote.items.map(item => ({
        service_id: item.service_id,
        description: services.find(s => s.id === item.service_id)?.name ?? `Service #${item.service_id}`,
        quantity: item.quantity,
        unit_price: item.unit_amount,
        discount: 0,
        tax: 0,
        line_total: item.line_total,
      }));

      const payload = {
        customer_id: customerId,
        staff_id: staffId,
        appointment_id: appointmentId ?? null,
        type: 'sale' as const,
        items,
        discount_pct: paidOnUs ? 100 : discountPct,
        discount_reason: paidOnUs ? 'Paid on us' : discountReason || (discountPct > 0 ? `${discountPct}% staff discount` : undefined),
        discount_applied_by: staffId,
        tax_amount: 0,
        payment_method: paymentMethod,
        payment_status: 'paid' as const,
        paid_at: new Date().toISOString(),
        notes: isStaff
          ? `Treatment notes: ${treatmentNotes || 'N/A'}\nRecommendations: ${treatmentRecommendations || 'N/A'}`
          : undefined,
      };

      await transactionsApi.create(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Checkout</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="border border-neutral-200 p-3">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Services</h3>
            {services.map(s => (
              <div key={s.id} className="flex justify-between text-sm py-1">
                <span>{s.name}</span>
                <span className="font-medium">{formatServicePrice(s.price)}</span>
              </div>
            ))}
          </div>

          {quote && (
            <>
              <div className="border border-neutral-200 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span>{formatServicePrice(quote.subtotal)}</span>
                </div>
                {(quote.membership_discount || quote.monthly_perk_discount) && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Member/Perk Discount</span>
                    <span>-₱{(quote.membership_discount + quote.monthly_perk_discount).toLocaleString()}</span>
                  </div>
                )}
                {computedDiscount > 0 && (
                  <div className="flex justify-between text-sm text-primary-600">
                    <span>
                      {paidOnUs ? 'Paid on us (100%)' : `Staff Discount (${discountPct}%)`}
                    </span>
                    <span>-₱{computedDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-neutral-200 pt-2 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatServicePrice(finalTotal)}</span>
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">Discount</label>
            <div className="flex flex-wrap gap-2">
              {DISCOUNT_OPTIONS.map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => { const next = discountPct === pct ? 0 : pct; setDiscountPct(next); setPaidOnUs(false); if (next === 0) setDiscountReason(''); }}
                  className={`px-3 py-2 text-sm rounded-md border transition ${
                    discountPct === pct && !paidOnUs
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 text-neutral-700 hover:border-primary-500'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => { const next = !paidOnUs; setPaidOnUs(next); if (next) setDiscountPct(0); else { setDiscountPct(0); setDiscountReason(''); } }}
                className={`px-3 py-2 text-sm rounded-md border transition ${
                  paidOnUs
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-700 hover:border-primary-500'
                }`}
              >
                Paid on us (100%)
              </button>
            </div>
            <input
              type="text"
              placeholder="Discount reason (optional)"
              value={discountReason}
              onChange={e => setDiscountReason(e.target.value)}
              className="input-field text-sm"
              disabled={paidOnUs}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition ${
                    paymentMethod === m.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 text-neutral-700 hover:border-primary-500'
                  }`}
                >
                  <m.icon size={16} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">Amount Tendered</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">₱</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountTendered}
                onChange={e => setAmountTendered(formatAmountInput(e.target.value))}
                className="input-field pl-7 text-right text-lg hide-number-spinners"
                placeholder="0.00"
                disabled={paymentMethod !== 'cash'}
              />
            </div>
            {paymentMethod === 'cash' && finalTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Change</span>
                <span className="font-semibold text-green-600">₱{change.toFixed(2)}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-200 flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-gold">
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : ''}
            Complete & Pay {finalTotal > 0 ? `(₱${finalTotal.toLocaleString()})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}