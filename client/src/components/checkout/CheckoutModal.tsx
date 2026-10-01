import { useEffect, useMemo, useState } from 'react';
import { CreditCard, DollarSign, Loader2, Minus, Plus, X } from 'lucide-react';
import { appointmentsApi, posApi, transactionsApi } from '../../api';
import { formatAmountInput, formatServicePrice, parseAmountInput } from '../../utils/format';
import { DISCOUNT_OPTIONS, buildDiscountReason } from '../../utils/discount';
import type { AppointmentBalance, ServiceOption } from '../booking/admin/types';

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
  /**
   * `full` charges the whole booking. `balance` charges only what is still
   * owed — used when a booking was edited to add a service after payment had
   * already been taken, so a paid service is never billed twice.
   */
  mode?: 'full' | 'balance';
}

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
  mode = 'full',
}: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<AppointmentBalance | null>(null);
  const [loadError, setLoadError] = useState('');
  const [quote, setQuote] = useState<{
    subtotal: number;
    membership_discount: number;
    monthly_perk_discount: number;
    final_total: number;
    benefits: string[];
    perks_applied: string[];
    items: { service_id: number; quantity: number; unit_amount: number; line_total: number; discount?: number }[];
  } | null>(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [paidOnUs, setPaidOnUs] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [error, setError] = useState('');

  const isBalanceMode = mode === 'balance';
  const totalPrice = useMemo(() => services.reduce((sum, s) => sum + s.price, 0), [services]);

  useEffect(() => {
    if (!open) return;
    setDiscountPct(0);
    setDiscountReason('');
    setPaidOnUs(false);
    setAmountTendered('');
    setError('');
    // Always clear the stale payload so switching modes can't render one
    // mode's totals against the other's base.
    setBalanceInfo(null);
    setLoadError('');
    if (isBalanceMode) {
      if (appointmentId) loadBalance();
    } else if (services.length > 0) {
      loadQuote();
    }
  }, [open, services, isBalanceMode, appointmentId]);

  // In balance mode the server is the source of truth: it knows which services
  // prior transactions already covered, and has the booking's discount already
  // apportioned across the ones that remain.
  const loadBalance = async () => {
    try {
      const { data } = await appointmentsApi.getBalance(appointmentId!);
      // This endpoint responds `{ success, data }`, unlike /pos/quote which
      // returns the bare payload. Unwrapping matters: keeping the envelope
      // stored left `covered_services` undefined, and the render below then
      // dereferenced it and threw, blanking the page.
      const balance = data?.data ?? null;
      if (!balance || !Array.isArray(balance.covered_services) || !Array.isArray(balance.uncovered_services)) {
        setBalanceInfo(null);
        setLoadError('Could not load the balance for this appointment');
        return;
      }
      setLoadError('');
      setBalanceInfo(balance);
    } catch {
      setBalanceInfo(null);
      setLoadError('Could not load the balance for this appointment');
    }
  };

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

  // The base being discounted: the whole booking in `full` mode, only the
  // outstanding amount in `balance` mode.
  const baseTotal = isBalanceMode ? (balanceInfo?.balance ?? 0) : (quote?.final_total ?? 0);

  // Membership + monthly-perk discount, always as a real number. The backend
  // can surface either value as a zero-looking string or object (Decimal), so
  // a bare `||` truthiness check is not enough to hide the row when it is 0.
  const memberPerkDiscount = useMemo(() => {
    if (!quote) return 0;
    return (
      Number(quote.membership_discount ?? 0) +
      Number(quote.monthly_perk_discount ?? 0)
    );
  }, [quote]);

  // Staff/comp discount applies to what the customer actually owes — the quoted
  // total, which is already net of the membership discount. Applying it to the
  // pre-discount subtotal would discount the membership saving a second time.
  const computedDiscount = useMemo(() => {
    if (!quote && !balanceInfo) return 0;
    const peso = (n: number) => Math.round(n * 100) / 100;
    if (paidOnUs) return peso(baseTotal);
    if (discountPct > 0) return peso((baseTotal * discountPct) / 100);
    return 0;
  }, [quote, balanceInfo, discountPct, paidOnUs, baseTotal]);

  const finalTotal = useMemo(() => {
    return Math.max(0, Math.round((baseTotal - computedDiscount) * 100) / 100);
  }, [baseTotal, computedDiscount]);

  const change = useMemo(() => {
    const tendered = parseAmountInput(amountTendered) || 0;
    return Math.max(0, tendered - finalTotal);
  }, [amountTendered, finalTotal]);

  const handleSubmit = async () => {
    if (!quote && !balanceInfo) return;
    if (paymentMethod === 'cash' && (parseAmountInput(amountTendered) || 0) < finalTotal) {
      setError('Amount tendered is less than total');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // `unit_price` is always the pre-discount catalog amount, so the stored
      // transaction's subtotal is the true value of the services. Every
      // reduction — membership, monthly perk, and any staff discount — is then
      // recorded once as the transaction-level discount. Recording a discount on
      // the items *and* at the transaction level is what double-charged
      // members, so the items carry no discount of their own.
      const round = (n: number) => Math.round(n * 100) / 100;
      const items = isBalanceMode
        ? (balanceInfo?.uncovered_services ?? []).map((line) => {
            const lineTotal = line.line_total ?? line.price;
            return {
              service_id: line.service_id,
              description: line.name,
              quantity: 1,
              unit_price: line.price,
              tax: 0,
              line_total: lineTotal,
            };
          })
        : (quote?.items ?? []).map((item) => ({
            service_id: item.service_id,
            description: services.find((s) => s.id === item.service_id)?.name ?? `Service #${item.service_id}`,
            quantity: item.quantity,
            unit_price: item.unit_amount,
            tax: 0,
            line_total: item.line_total,
          }));

      if (items.length === 0) {
        setError('There is nothing left to collect for this appointment');
        setLoading(false);
        return;
      }

      // The membership and perk savings already baked into the quoted amount,
      // so the manual discount lands on what the customer actually owes.
      const bookedDiscount = isBalanceMode
        ? round(items.reduce((sum, l) => sum + (l.unit_price - (l.line_total ?? l.unit_price)), 0))
        : memberPerkDiscount;
      const totalDiscount = round(bookedDiscount + computedDiscount);

      const payload = {
        customer_id: customerId,
        staff_id: staffId,
        appointment_id: appointmentId ?? null,
        type: 'sale' as const,
        items,
        discount_amount: totalDiscount > 0 ? totalDiscount : undefined,
        discount_pct: paidOnUs ? 100 : discountPct || undefined,
        discount_reason: buildDiscountReason(discountPct, paidOnUs, discountReason),
        discount_applied_by: staffId,
        tax_amount: 0,
        payment_method: paymentMethod,
        payment_status: 'paid' as const,
        paid_at: new Date().toISOString(),
        notes: [
          isBalanceMode ? 'Balance collection' : undefined,
          isStaff ? `Treatment notes: ${treatmentNotes || 'N/A'}` : undefined,
          isStaff ? `Recommendations: ${treatmentRecommendations || 'N/A'}` : undefined,
        ]
          .filter(Boolean)
          .join('\n') || undefined,
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
          <h2 className="text-lg font-semibold text-neutral-900">
            {isBalanceMode ? 'Collect Balance' : 'Checkout'}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {isBalanceMode ? (
            <div className="border border-neutral-200 p-3">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">
                Remaining services
                {(balanceInfo?.covered_services?.length ?? 0) > 0 && (
                  <span className="text-[11px] font-normal text-neutral-400 ml-1">
                    ({balanceInfo!.covered_services.map((s) => s.name).join(', ')} already paid)
                  </span>
                )}
              </h3>
              {(balanceInfo?.uncovered_services ?? []).map((line) => (
                <div key={line.service_id} className="flex justify-between text-sm py-1">
                  <span>{line.name}</span>
                  <span className="font-medium">{formatServicePrice(line.line_total ?? line.price)}</span>
                </div>
              ))}
              {balanceInfo && balanceInfo.uncovered_services.length === 0 && (
                <p className="text-xs text-neutral-400 py-1">Nothing left to collect.</p>
              )}
              {loadError && (
                <p className="text-xs text-red-600 py-1">{loadError}</p>
              )}
            </div>
          ) : (
            <div className="border border-neutral-200 p-3">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Services</h3>
              {services.map(s => (
                <div key={s.id} className="flex justify-between text-sm py-1">
                  <span>{s.name}</span>
                  <span className="font-medium">{formatServicePrice(s.price)}</span>
                </div>
              ))}
            </div>
          )}

          {(quote || balanceInfo) && (
            <>
              <div className="border border-neutral-200 p-3 space-y-1">
                {isBalanceMode && balanceInfo ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Appointment total</span>
                      <span>{formatServicePrice(balanceInfo.amount_due)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Already paid</span>
                      <span>-₱{(balanceInfo.paid_amount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-neutral-900">
                      <span>Balance due</span>
                      <span>{formatServicePrice(balanceInfo.balance)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Pre-discount catalog value of the services. */}
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Subtotal</span>
                      <span>{formatServicePrice(quote!.subtotal)}</span>
                    </div>
                    {memberPerkDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Member/Perk Discount</span>
                        <span>-₱{memberPerkDiscount.toLocaleString()}</span>
                      </div>
                    )}
                  </>
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
                  <span>{isBalanceMode ? 'Amount to collect' : 'Total'}</span>
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
          <button
            onClick={handleSubmit}
            disabled={loading || (isBalanceMode && (balanceInfo?.uncovered_services.length ?? 0) === 0)}
            className="btn-gold"
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : ''}
            {isBalanceMode ? 'Collect Balance' : 'Complete & Pay'}{' '}
            {finalTotal > 0 ? `(₱${finalTotal.toLocaleString()})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}