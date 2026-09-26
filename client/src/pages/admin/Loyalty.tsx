import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { loyaltyApi, membershipsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { registerMoney } from '@/utils/money';

interface Milestone {
  id: number;
  plan_type: string;
  spend_threshold: number;
  reward_pct: number;
  is_active: boolean;
}

interface MilestoneForm {
  plan_type: string;
  spend_threshold: number;
  reward_pct: number;
  is_active: boolean;
}

interface ProgressEntry {
  membership_id: number;
  customer_name: string;
  plan_type: string;
  total_spend: number;
  current_tier: string;
  next_tier?: string;
  next_threshold?: number;
}

export default function Loyalty() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [progressOpen, setProgressOpen] = useState(false);
  const [progressSearch, setProgressSearch] = useState('');
  const [progressResults, setProgressResults] = useState<ProgressEntry[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MilestoneForm>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await loyaltyApi.listMilestones(params);
      const result = data.data;
      setMilestones(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotal(result?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load loyalty milestones');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

  const openAddModal = () => {
    setEditingMilestone(null);
    reset({ plan_type: 'SILVER', spend_threshold: 0, reward_pct: 0, is_active: true });
    setModalOpen(true);
  };

  const openEditModal = (m: Milestone) => {
    setEditingMilestone(m);
    reset({
      plan_type: m.plan_type,
      spend_threshold: m.spend_threshold,
      reward_pct: m.reward_pct,
      is_active: m.is_active,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: MilestoneForm) => {
    setSubmitting(true);
    try {
      if (editingMilestone) {
        await loyaltyApi.updateMilestone(editingMilestone.id, values);
        toast.success('Milestone updated');
      } else {
        await loyaltyApi.createMilestone(values);
        toast.success('Milestone created');
      }
      setModalOpen(false);
      fetchMilestones();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await loyaltyApi.deleteMilestone(deleteId);
      toast.success('Milestone deleted');
      setDeleteId(null);
      fetchMilestones();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const loadProgress = async () => {
    setProgressLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (progressSearch) params.search = progressSearch;
      const memRes = await membershipsApi.list(params);
      const mems = memRes.data.data?.data || memRes.data.data || [];
      const results: ProgressEntry[] = [];
      for (const m of mems.slice(0, 20)) {
        try {
          const { data } = await loyaltyApi.getProgress(m.id);
          const d = data.data;
          results.push({
            membership_id: m.id,
            customer_name: `${m.customer?.first_name || ''} ${m.customer?.last_name || ''}`.trim(),
            plan_type: d.membership?.plan?.plan_type || 'N/A',
            total_spend: d.progress?.total_spend ?? 'N/A',
            current_tier: d.progress?.current_tier || 'N/A',
            next_tier: d.progress?.next_tier || 'N/A',
            next_threshold: d.progress?.next_threshold ?? 'N/A',
          });
        } catch { /* skip */ }
      }
      setProgressResults(results);
    } catch {
      toast.error('Failed to load progress');
    } finally {
      setProgressLoading(false);
    }
  };

  const formatPrice = (price: number) => `₱${Number(price || 0).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Loyalty</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage loyalty milestones and track customer progress</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setProgressOpen(true); setProgressSearch(''); setProgressResults([]); }} className="btn-secondary">
            View Progress
          </button>
          <button onClick={openAddModal} className="btn-primary">
            <Plus size={18} />
            Add Milestone
          </button>
        </div>
      </div>

      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search milestones..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field w-full sm:w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : milestones.length === 0 ? (
          <EmptyState title="No milestones found" description="Create a milestone to define reward tiers." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Plan Type</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Spend Threshold</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Reward %</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {milestones.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900 capitalize">{m.plan_type}</td>
                    <td className="px-6 py-4 text-neutral-600">{formatPrice(m.spend_threshold)}</td>
                    <td className="px-6 py-4 text-neutral-600">{m.reward_pct}%</td>
                    <td className="px-6 py-4"><StatusBadge status={m.is_active ? 'active' : 'inactive'} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(m)} className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(m.id)} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition">
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
        {!loading && milestones.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Milestone Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingMilestone ? 'Edit Milestone' : 'Add Milestone'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Plan Type</label>
            <select className="select-field" {...register('plan_type', { required: 'Required' })}>
              <option value="SILVER">Silver</option>
              <option value="GOLD">Gold</option>
              <option value="PLATINUM">Platinum</option>
              <option value="ELITE">Elite</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Spend Threshold (₱)</label>
              <input type="text" inputMode="decimal" className="input-field hide-number-spinners" {...registerMoney(register, 'spend_threshold', { required: 'Required' })} />
              {errors.spend_threshold && <p className="text-xs text-red-600 mt-1">{errors.spend_threshold.message}</p>}
            </div>
            <div>
              <label className="label">Reward Percentage (%)</label>
              <input type="number" step="0.01" className="input-field" {...register('reward_pct', { required: 'Required', valueAsNumber: true })} />
              {errors.reward_pct && <p className="text-xs text-red-600 mt-1">{errors.reward_pct.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="label mb-0">Active</label>
            <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" {...register('is_active')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingMilestone ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Milestone" maxWidth="max-w-sm">
        <p className="text-sm text-neutral-600 mb-6">
          Are you sure you want to delete this milestone? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </Modal>

      {/* Customer Progress Modal */}
      <Modal open={progressOpen} onClose={() => setProgressOpen(false)} title="Customer Loyalty Progress">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by customer name..."
                className="input-field pl-10"
                value={progressSearch}
                onChange={(e) => setProgressSearch(e.target.value)}
              />
            </div>
            <button onClick={loadProgress} disabled={progressLoading} className="btn-primary whitespace-nowrap">
              {progressLoading ? 'Loading...' : 'Search'}
            </button>
          </div>
          {progressLoading ? (
            <LoadingSpinner fullScreen={false} />
          ) : progressResults.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-neutral-500 border-b border-neutral-200">
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-4 py-2 font-medium">Tier</th>
                    <th className="px-4 py-2 font-medium">Total Spend</th>
                    <th className="px-4 py-2 font-medium">Current Reward</th>
                    <th className="px-4 py-2 font-medium">Next Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {progressResults.map((p) => (
                    <tr key={p.membership_id}>
                      <td className="px-4 py-3 font-medium text-neutral-900">{p.customer_name}</td>
                      <td className="px-4 py-3 text-neutral-600 capitalize">{p.current_tier}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatPrice(p.total_spend)}</td>
                      <td className="px-4 py-3 text-neutral-600">{p.plan_type}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {p.next_tier ? `${p.next_tier} (${formatPrice(p.next_threshold || 0)})` : 'Max tier'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">Search for customers to view their loyalty progress.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
