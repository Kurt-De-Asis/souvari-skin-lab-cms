import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { membershipsApi, customersApi, membershipPlansApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import formatPaymentMethod from '@/utils/formatPaymentMethod';

interface Membership {
  id: number;
  customer_id: number;
  plan_id: number;
  code: string;
  status: string;
  start_date: string;
  end_date: string;
  total_spending: number;
  customer?: { id: number; first_name: string; last_name: string; user?: { email: string } };
  plan?: { id: number; name: string; tier: string };
}

interface AssignForm {
  customer_id: number;
  plan_id: number;
  payment_method: string;
  payment_type: string;
  amount_paid: number;
}

interface ExtendForm {
  months: number;
  payment_method: string;
  payment_type: string;
  amount_paid: number;
}

export default function Memberships() {
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
  const [actionId, setActionId] = useState<{ id: number; action: 'activate' | 'suspended' | 'cancelled' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(0);

  const PAYMENT_METHODS = ['cash', 'gcash', 'gotyme', 'rcbc', 'paid_on_us'];
  const PAYMENT_TYPES = ['FULL', 'DOWN_PAYMENT'];

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AssignForm>({
    defaultValues: { customer_id: 0, plan_id: 0, payment_method: 'cash', payment_type: 'FULL', amount_paid: 0 },
  });

  const selectedPlanId = watch('plan_id');

  useEffect(() => {
    const plan = plans.find((p: any) => p.id === Number(selectedPlanId));
    const price = Number(plan?.promo_price ?? plan?.regular_price ?? 0);
    setSelectedPlanPrice(price);
  }, [selectedPlanId, plans]);
  const { register: registerExtend, handleSubmit: handleSubmitExtend, reset: resetExtend, formState: { errors: extendErrors } } = useForm<ExtendForm>();

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
    reset({ customer_id: 0, plan_id: 0, payment_method: 'cash', payment_type: 'FULL', amount_paid: 0 });
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
      await membershipsApi.create(values);
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
      await membershipsApi.updateStatus(actionId.id, { status: actionId.action === 'activate' ? 'active' : actionId.action });
      toast.success(`Membership ${actionId.action === 'activate' ? 'activated' : actionId.action === 'suspended' ? 'suspended' : 'cancelled'}`);
      setActionId(null);
      fetchMemberships();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    }
  };

  const openExtendModal = (m: Membership) => {
    resetExtend({ months: 1 });
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

  const formatPrice = (price: number) => `₱${Number(price || 0).toLocaleString()}`;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

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
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
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
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Spending</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {memberships.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      {m.customer?.first_name} {m.customer?.last_name}
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{m.plan?.name || '—'}</td>
                    <td className="px-6 py-4 text-neutral-600 font-mono text-xs">{m.code}</td>
                    <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                    <td className="px-6 py-4 text-neutral-600">{formatDate(m.start_date)}</td>
                    <td className="px-6 py-4 text-neutral-600">{formatDate(m.end_date)}</td>
                    <td className="px-6 py-4 text-neutral-600">{formatPrice(m.total_spending)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {m.status !== 'active' && (
                          <button onClick={() => setActionId({ id: m.id, action: 'activate' })} className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition">
                            Activate
                          </button>
                        )}
                        {m.status === 'active' && (
                          <>
                            <button onClick={() => setActionId({ id: m.id, action: 'suspended' })} className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition">
                              Suspend
                            </button>
                            <button onClick={() => openExtendModal(m)} className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition">
                              Extend
                            </button>
                          </>
                        )}
                        {(m.status === 'active' || m.status === 'suspended') && (
                          <button onClick={() => setActionId({ id: m.id, action: 'cancelled' })} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
                {PAYMENT_METHODS.map(m => (
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
                type="number"
                step="0.01"
                min="0"
                max={selectedPlanPrice}
                className="input-field"
                {...register('amount_paid', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Action Confirmation */}
      <Modal open={actionId !== null} onClose={() => setActionId(null)} title={`${actionId?.action === 'activate' ? 'Activate' : actionId?.action === 'suspended' ? 'Suspend' : 'Cancel'} Membership`} maxWidth="max-w-sm">
        <p className="text-sm text-neutral-600 mb-6">
          Are you sure you want to {actionId?.action === 'suspended' ? 'suspend' : actionId?.action === 'cancelled' ? 'cancel' : actionId?.action} this membership?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setActionId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleStatusAction} className="btn-primary">
            {actionId?.action === 'activate' ? 'Activate' : actionId?.action === 'suspended' ? 'Suspend' : 'Cancel'}
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
                {PAYMENT_METHODS.map(m => (
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
              <input type="number" step="0.01" min="0" className="input-field" {...registerExtend('amount_paid', { valueAsNumber: true })} />
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
