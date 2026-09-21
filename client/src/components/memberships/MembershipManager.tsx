import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Plus, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { membershipsApi, customersApi, membershipPlansApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import formatPaymentMethod from '@/utils/formatPaymentMethod';
import { registerMoney } from '@/utils/money';
import { formatAmountInput, parseAmountInput } from '@/utils/format';

interface Membership {
  id: number;
  customer_id: number;
  plan_id: number;
  code: string;
  status: string;
  start_date: string;
  end_date: string;
  total_spending: number;
  balance?: number;
  amount_paid?: number;
  price?: number;
  payment_status?: string;
  down_payment_due_date?: string | null;
  pay_in_store_requested?: boolean;
  customer?: { id: number; first_name: string; last_name: string; user?: { email: string } };
  plan?: { id: number; name: string; tier: string };
}

interface AssignForm {
  customer_id: number;
  plan_id: number;
  payment_method: string;
  payment_type: string;
  amount_paid: number;
  down_payment_due_date: string;
}

interface ExtendForm {
  months: number;
  payment_method: string;
  payment_type: string;
  amount_paid: number;
}

interface CollectForm {
  amount: number;
  payment_method: string;
  notes: string;
}

interface Props {
  mode: 'admin' | 'staff';
}

export default function MembershipManager({ mode }: Props) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [extendModal, setExtendModal] = useState<{ open: boolean; membership: Membership | null }>({ open: false, membership: null });
  const [actionId, setActionId] = useState<{ id: number; action: 'active' | 'suspended' | 'cancelled' | 'failed' } | null>(null);
  const [collectModal, setCollectModal] = useState<{ open: boolean; membership: Membership | null }>({ open: false, membership: null });
  const [submitting, setSubmitting] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(0);

  const CUSTOMER_PAYMENT_METHODS = ['gcash', 'gotyme', 'rcbc'];
  const STORE_PAYMENT_METHODS = ['cash', 'gcash', 'gotyme', 'rcbc'];
  const PAYMENT_TYPES = ['FULL', 'DOWN_PAYMENT'];

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AssignForm>({
    defaultValues: { customer_id: 0, plan_id: 0, payment_method: 'gcash', payment_type: 'FULL', amount_paid: 0, down_payment_due_date: '' },
  });

  const selectedPlanId = watch('plan_id');
  const watchType = watch('payment_type');

  useEffect(() => {
    const plan = plans.find((p: any) => p.id === Number(selectedPlanId));
    const price = Number(plan?.promo_price ?? plan?.regular_price ?? 0);
    setSelectedPlanPrice(price);
  }, [selectedPlanId, plans]);
  const { register: registerExtend, handleSubmit: handleSubmitExtend, reset: resetExtend, formState: { errors: extendErrors } } = useForm<ExtendForm>();
  const { register: registerCollect, handleSubmit: handleSubmitCollect, reset: resetCollect, setValue, watch: watchCollect, formState: { errors: collectErrors } } = useForm<CollectForm>();
  const collectAmount = Number(watchCollect('amount') || 0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await membershipsApi.list(params);
      const result = data.data;
      setMemberships(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotal(result?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load memberships');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  const openAssignModal = async () => {
    reset({ customer_id: 0, plan_id: 0, payment_method: 'gcash', payment_type: 'FULL', amount_paid: 0, down_payment_due_date: '' });
    setSelectedPlanPrice(0);
    try {
      const [custRes, planRes] = await Promise.all([
        customersApi.list({ limit: '200' }),
        membershipPlansApi.list({ status: 'active', limit: '100' }),
      ]);
      setCustomers(custRes.data.data?.data || custRes.data.data || []);
      setPlans(planRes.data.data?.data || planRes.data.data || []);
    } catch {
      toast.error('Failed to load dropdown data');
    }
    setAssignModalOpen(true);
  };

  const onAssign = async (values: AssignForm) => {
    setSubmitting(true);
    try {
      const payload: any = {
        customer_id: values.customer_id,
        plan_id: values.plan_id,
        payment_method: values.payment_method,
        payment_type: values.payment_type,
        amount_paid: values.amount_paid ?? 0,
      };
      if (values.payment_type === 'DOWN_PAYMENT' && values.down_payment_due_date) {
        payload.down_payment_due_date = values.down_payment_due_date;
      }
      await membershipsApi.create(payload);
      toast.success('Membership assigned');
      setAssignModalOpen(false);
      fetchMemberships();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign membership');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusAction = async () => {
    if (!actionId) return;
    try {
      await membershipsApi.updateStatus(actionId.id, { status: actionId.action });
      toast.success(`Membership ${actionId.action === 'active' ? 'activated' : actionId.action === 'suspended' ? 'suspended' : actionId.action === 'failed' ? 'marked failed' : 'cancelled'}`);
      setActionId(null);
      fetchMemberships();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    }
  };

  const openExtendModal = (m: Membership) => {
    resetExtend({ months: 1, payment_method: 'gcash', payment_type: 'FULL', amount_paid: 0 });
    setExtendModal({ open: true, membership: m });
  };

  const onExtend = async (values: ExtendForm) => {
    if (!extendModal.membership) return;
    setSubmitting(true);
    try {
      await membershipsApi.extend(extendModal.membership.id, values);
      toast.success('Membership extended');
      setExtendModal({ open: false, membership: null });
      fetchMemberships();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to extend');
    } finally {
      setSubmitting(false);
    }
  };

  const openCollectModal = (m: Membership) => {
    const balance = Number(m.balance ?? 0);
    resetCollect({ amount: balance, payment_method: 'cash', notes: '' });
    setCollectModal({ open: true, membership: m });
  };

  const onCollect = async (values: CollectForm) => {
    if (!collectModal.membership) return;
    const balance = Number(collectModal.membership.balance ?? 0);
    const appliedAmount = Math.min(values.amount, balance);
    setSubmitting(true);
    try {
      await membershipsApi.recordPayment(collectModal.membership.id, {
        amount: appliedAmount,
        payment_method: values.payment_method,
        payment_type: 'FULL',
        notes: values.notes ? `${values.notes} (store collection)` : 'Store balance collection',
      });
      toast.success('Payment collected');
      setCollectModal({ open: false, membership: null });
      fetchMemberships();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => `₱${Number(price || 0).toLocaleString()}`;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';
  const isOverdue = (m: Membership) =>
    m.payment_status === 'partial' &&
    m.pay_in_store_requested !== true &&
    m.down_payment_due_date &&
    m.status === 'active' &&
    new Date(m.down_payment_due_date) < new Date(new Date().toDateString());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Memberships</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage customer memberships</p>
        </div>
        <button onClick={openAssignModal} className="btn-primary">
          <Plus size={18} />
          Assign Membership
        </button>
      </div>

      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : memberships.length === 0 ? (
          <EmptyState title="No memberships found" description="Assign a membership to a customer to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Plan</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Code</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Start</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">End</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Balance</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {memberships.map((m) => {
                  const hasBalance = Number(m.balance ?? 0) > 0;
                  const overdue = isOverdue(m);
                  return (
                    <tr key={m.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-4 font-medium text-neutral-900">
                        {m.customer?.first_name} {m.customer?.last_name}
                        {m.pay_in_store_requested && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                            <Wallet size={10} /> Paying at store
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-600">{m.plan?.name || '—'}</td>
                      <td className="px-6 py-4 text-neutral-600 font-mono text-xs">{m.code}</td>
                      <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                      <td className="px-6 py-4 text-neutral-600">{formatDate(m.start_date)}</td>
                      <td className="px-6 py-4 text-neutral-600">{formatDate(m.end_date)}</td>
                      <td className="px-6 py-4">
                        {hasBalance ? (
                          <span className={overdue ? 'text-red-600 font-semibold' : 'text-amber-600'}>
                            {formatPrice(m.balance!)}
                            {m.down_payment_due_date && (
                              <span className="block text-[10px] text-neutral-400">
                                due {formatDate(m.down_payment_due_date)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-neutral-400">{formatPrice(0)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {hasBalance && (m.status === 'active' || m.status === 'pending' || m.status === 'suspended') && (
                            <button
                              onClick={() => openCollectModal(m)}
                              className={`px-2 py-1 text-xs rounded transition ${m.pay_in_store_requested ? 'btn-primary !px-3 !py-1.5' : 'text-indigo-600 hover:bg-indigo-50'}`}
                            >
                              {m.pay_in_store_requested ? <><Wallet size={12} className="inline mr-1" />Collect</> : 'Collect Balance'}
                            </button>
                          )}
                          {m.status !== 'active' && m.status !== 'failed' && mode === 'admin' && (
                            <button onClick={() => setActionId({ id: m.id, action: 'active' })} className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition">
                              Activate
                            </button>
                          )}
                          {m.status === 'active' && mode === 'admin' && (
                            <>
                              <button onClick={() => setActionId({ id: m.id, action: 'suspended' })} className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition">
                                Suspend
                              </button>
                              <button onClick={() => openExtendModal(m)} className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition">
                                Extend
                              </button>
                            </>
                          )}
                          {(m.status === 'active' || m.status === 'suspended') && mode === 'admin' && (
                            <button onClick={() => setActionId({ id: m.id, action: 'cancelled' })} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && memberships.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Membership" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onAssign)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer</label>
              <select className="select-field" {...register('customer_id', { required: 'Required', valueAsNumber: true })}>
                <option value="">Select customer</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
              {errors.customer_id && <p className="text-xs text-red-600 mt-1">{errors.customer_id.message}</p>}
            </div>
            <div>
              <label className="label">Plan</label>
              <select className="select-field" {...register('plan_id', { required: 'Required', valueAsNumber: true })}>
                <option value="">Select plan</option>
                {plans.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.tier}</option>
                ))}
              </select>
              {errors.plan_id && <p className="text-xs text-red-600 mt-1">{errors.plan_id.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Plan Price</label>
            <input type="text" className="input-field" value={`₱${selectedPlanPrice.toLocaleString()}`} readOnly />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Payment Method</label>
              <select className="select-field" {...register('payment_method')}>
                {CUSTOMER_PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{formatPaymentMethod(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment Type</label>
              <select className="select-field" {...register('payment_type')}>
                {PAYMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount Paid</label>
              <input
                type="text"
                inputMode="decimal"
                className="input-field hide-number-spinners"
                {...registerMoney(register, 'amount_paid')}
              />
            </div>
          </div>
          {watchType === 'DOWN_PAYMENT' && (
            <div>
              <label className="label">Balance Due Date</label>
              <input
                type="date"
                className="input-field"
                {...register('down_payment_due_date', { required: 'Due date required for downpayment' })}
              />
              {errors.down_payment_due_date && <p className="text-xs text-red-600 mt-1">{errors.down_payment_due_date.message}</p>}
              <p className="text-xs text-neutral-400 mt-1">
                The customer must settle the remaining balance by this date or the membership will be marked failed.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Collect Balance / POS Modal */}
      <Modal open={collectModal.open} onClose={() => setCollectModal({ open: false, membership: null })} title="Collect Remaining Balance" maxWidth="max-w-md">
        {collectModal.membership && (() => {
          const mem = collectModal.membership;
          const balance = Number(mem.balance ?? 0);
          const paid = Number(mem.amount_paid ?? 0);
          const change = collectAmount > balance ? collectAmount - balance : 0;
          const appliedAmount = Math.min(collectAmount, balance);
          return (
            <form onSubmit={handleSubmitCollect(onCollect)} className="space-y-4">
              <div className="bg-neutral-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">Customer</span><span className="font-medium text-neutral-900">{mem.customer?.first_name} {mem.customer?.last_name}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Plan</span><span className="font-medium text-neutral-900">{mem.plan?.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Total Price</span><span className="font-medium text-neutral-900">{formatPrice(Number(mem.price ?? 0))}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Paid</span><span className="font-medium text-green-600">{formatPrice(paid)}</span></div>
                <div className="flex justify-between border-t border-neutral-200 pt-2"><span className="text-neutral-500 font-medium">Remaining Balance</span><span className="font-semibold text-red-600">{formatPrice(balance)}</span></div>
                {mem.down_payment_due_date && (
                  <div className="flex justify-between"><span className="text-neutral-500">Due Date</span><span className="font-medium text-neutral-900">{formatDate(mem.down_payment_due_date)}</span></div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-field hide-number-spinners"
                    {...registerMoney(registerCollect, 'amount', { required: 'Amount required', min: { value: 0.01, message: 'Greater than 0' } })}
                  />
                  {collectErrors.amount && <p className="text-xs text-red-600 mt-1">{collectErrors.amount.message}</p>}
                  {change > 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Change: {formatPrice(change)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select className="select-field" {...registerCollect('payment_method')}>
                    {STORE_PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{formatPaymentMethod(m)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <input type="text" className="input-field" {...registerCollect('notes')} placeholder="Optional" />
              </div>
              <p className="text-xs text-neutral-400">
                {change > 0
                  ? `You'll collect ${formatPrice(appliedAmount)} and return ${formatPrice(change)} change.`
                  : 'Collecting the full remaining amount settles the membership balance immediately.'}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCollectModal({ open: false, membership: null })} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Processing...' : `Collect ${formatPrice(appliedAmount)}`}
                </button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Status Action Confirmation */}
      <Modal open={actionId !== null} onClose={() => setActionId(null)} title={`${actionId?.action === 'active' ? 'Activate' : actionId?.action === 'suspended' ? 'Suspend' : actionId?.action === 'failed' ? 'Mark Failed' : 'Cancel'} Membership`} maxWidth="max-w-sm">
        <p className="text-sm text-neutral-600 mb-6">
          Are you sure you want to {actionId?.action === 'suspended' ? 'suspend' : actionId?.action === 'cancelled' ? 'cancel' : actionId?.action === 'failed' ? 'mark as failed' : 'activate'} this membership?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setActionId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleStatusAction} className="btn-primary">
            {actionId?.action === 'active' ? 'Activate' : actionId?.action === 'suspended' ? 'Suspend' : actionId?.action === 'failed' ? 'Mark Failed' : 'Cancel'}
          </button>
        </div>
      </Modal>

      {/* Extend Modal */}
      <Modal open={extendModal.open} onClose={() => setExtendModal({ open: false, membership: null })} title="Extend Membership" maxWidth="max-w-md">
        <form onSubmit={handleSubmitExtend(onExtend)} className="space-y-4">
          <div>
            <label className="label">Extend by (months)</label>
            <input type="number" className="input-field" {...registerExtend('months', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'Min 1 month' } })} />
            {extendErrors.months && <p className="text-xs text-red-600 mt-1">{extendErrors.months.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Payment Method</label>
              <select className="select-field" {...registerExtend('payment_method')}>
                {STORE_PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{formatPaymentMethod(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment Type</label>
              <select className="select-field" {...registerExtend('payment_type')}>
                {PAYMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount Paid</label>
              <input type="text" inputMode="decimal" className="input-field hide-number-spinners" {...registerMoney(registerExtend, 'amount_paid')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setExtendModal({ open: false, membership: null })} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Extending...' : 'Extend'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}