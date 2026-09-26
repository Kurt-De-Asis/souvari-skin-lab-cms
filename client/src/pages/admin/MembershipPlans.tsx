import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { membershipPlansApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { registerMoney } from '@/utils/money';

interface MembershipPlan {
  id: number;
  name: string;
  tier: string;
  duration_months: number;
  regular_price: number;
  promo_price?: number;
  is_active: boolean;
  description?: string;
}

interface PlanForm {
  name: string;
  tier: string;
  duration_months: number;
  regular_price: number;
  promo_price?: number;
  description?: string;
}

export default function MembershipPlans() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanForm>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, tierFilter, statusFilter]);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (tierFilter) params.tier = tierFilter;
      if (statusFilter !== '') params.is_active = String(statusFilter);
      const { data } = await membershipPlansApi.list(params);
      const result = data.data;
      setPlans(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotal(result?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, tierFilter, statusFilter]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openAddModal = () => {
    setEditingPlan(null);
    reset({ name: '', tier: 'SILVER', duration_months: 1, regular_price: 0, promo_price: undefined, description: '' });
    setModalOpen(true);
  };

  const openEditModal = (p: MembershipPlan) => {
    setEditingPlan(p);
    reset({
      name: p.name,
      tier: p.tier,
      duration_months: p.duration_months,
      regular_price: p.regular_price,
      promo_price: p.promo_price,
      description: p.description || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: PlanForm) => {
    setSubmitting(true);
    try {
      if (editingPlan) {
        await membershipPlansApi.update(editingPlan.id, values);
        toast.success('Plan updated');
      } else {
        await membershipPlansApi.create({ ...values, is_active: true });
        toast.success('Plan created');
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await membershipPlansApi.delete(deleteId);
      toast.success('Plan deleted');
      setDeleteId(null);
      fetchPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const formatPrice = (price: number) => `₱${Number(price).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Membership Plans</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage membership tiers and pricing</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} />
          Add Plan
        </button>
      </div>

      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search plans..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field w-full sm:w-auto" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
            <option value="">All Tiers</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
            <option value="ELITE">Diamond</option>
          </select>
          <select className="select-field w-full sm:w-auto" value={String(statusFilter)} onChange={(e) => setStatusFilter(e.target.value === '' ? '' : e.target.value === 'true')}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : plans.length === 0 ? (
          <EmptyState title="No membership plans found" description="Create a new plan to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Tier</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Duration</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Regular Price</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Promo Price</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{p.name}</td>
                    <td className="px-6 py-4 text-neutral-600 capitalize">{p.tier}</td>
                    <td className="px-6 py-4 text-neutral-600">{p.duration_months} mo</td>
                    <td className="px-6 py-4 text-neutral-600">{formatPrice(p.regular_price)}</td>
                    <td className="px-6 py-4 text-neutral-600">{p.promo_price ? formatPrice(p.promo_price) : '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.is_active ? 'active' : 'inactive'} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && plans.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? 'Edit Plan' : 'Add Plan'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Plan Name</label>
            <input className="input-field" placeholder="e.g. Annual Gold Plan" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tier</label>
              <select className="select-field" {...register('tier', { required: 'Required' })}>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
                <option value="ELITE">Diamond</option>
              </select>
            </div>
            <div>
              <label className="label">Duration (months)</label>
              <input type="number" className="input-field" {...register('duration_months', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'Min 1 month' } })} />
              {errors.duration_months && <p className="text-xs text-red-600 mt-1">{errors.duration_months.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Regular Price (₱)</label>
              <input type="text" inputMode="decimal" className="input-field hide-number-spinners" {...registerMoney(register, 'regular_price', { required: 'Required' })} />
              {errors.regular_price && <p className="text-xs text-red-600 mt-1">{errors.regular_price.message}</p>}
            </div>
            <div>
              <label className="label">Promo Price (₱)</label>
              <input type="text" inputMode="decimal" className="input-field hide-number-spinners" placeholder="Optional" {...registerMoney(register, 'promo_price')} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" rows={2} placeholder="Optional description" {...register('description')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingPlan ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Plan" maxWidth="max-w-sm">
        <p className="text-sm text-neutral-600 mb-6">
          Are you sure you want to delete this membership plan? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
