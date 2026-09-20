import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { monthlyPerksApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface MonthlyPerk {
  id: number;
  customer_name: string;
  membership_id: number;
  membership?: {
    id: number;
    code: string;
  };
  year_month: string;
  status: string;
  used_at?: string;
}

export default function MonthlyPerks() {
  const [perks, setPerks] = useState<MonthlyPerk[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resetModal, setResetModal] = useState<{ open: boolean; perk: MonthlyPerk | null }>({ open: false, perk: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const fetchPerks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await monthlyPerksApi.list(params);
      const result = data.data;
      setPerks(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotal(result?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load monthly perks');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchPerks(); }, [fetchPerks]);

  const handleReset = async () => {
    if (!resetModal.perk) return;
    setSubmitting(true);
    try {
      await monthlyPerksApi.reset({ membership_id: resetModal.perk.membership_id, year_month: resetModal.perk.year_month });
      toast.success('Perk reset successfully');
      setResetModal({ open: false, perk: null });
      fetchPerks();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-sans font-semibold text-neutral-900">Monthly Perks</h1>
        <p className="text-sm text-neutral-500 mt-1">Track and manage monthly membership perks</p>
      </div>

      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by customer or code..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : perks.length === 0 ? (
          <EmptyState title="No monthly perks found" description="Perks will appear here when members receive them." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Membership Code</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Year-Month</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Used At</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {perks.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{p.customer_name}</td>
                    <td className="px-6 py-4 text-neutral-600 font-mono text-xs">{p.membership?.code}</td>
                    <td className="px-6 py-4 text-neutral-600">{p.year_month}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 text-neutral-600">{formatDate(p.used_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        {p.status !== 'available' && (
                          <button
                            onClick={() => setResetModal({ open: true, perk: p })}
                            className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition"
                          >
                            Reset
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
        {!loading && perks.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        open={resetModal.open}
        onClose={() => setResetModal({ open: false, perk: null })}
        title="Reset Perk"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Reset perk for <span className="font-medium">{resetModal.perk?.customer_name}</span> ({resetModal.perk?.year_month})? This will make the perk available again.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setResetModal({ open: false, perk: null })} className="btn-secondary">Cancel</button>
            <button onClick={handleReset} disabled={submitting} className="btn-primary">
              {submitting ? 'Resetting...' : 'Reset Perk'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
