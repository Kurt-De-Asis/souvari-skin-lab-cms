import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { referralsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface Referral {
  id: number;
  referrer_name: string;
  referred_name: string;
  status: string;
  credit_amount: number;
  created_at: string;
}

export default function Referrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModal, setActionModal] = useState<{ open: boolean; referral: Referral | null; action: 'approve' | 'reject' }>({
    open: false, referral: null, action: 'approve',
  });
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await referralsApi.list(params);
      const result = data.data;
      setReferrals(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotal(result?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const openActionModal = (referral: Referral, action: 'approve' | 'reject') => {
    setActionModal({ open: true, referral, action });
    setReason('');
  };

  const handleAction = async () => {
    if (!actionModal.referral) return;
    setSubmitting(true);
    try {
      const payload: any = { status: actionModal.action === 'approve' ? 'completed' : 'rejected' };
      if (actionModal.action === 'reject' && reason) payload.notes = reason;
      await referralsApi.approve(actionModal.referral.id, payload);
      toast.success(`Referral ${actionModal.action}d`);
      setActionModal({ open: false, referral: null, action: 'approve' });
      fetchReferrals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => `₱${Number(price || 0).toLocaleString()}`;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Referrals</h1>
        <p className="text-sm text-neutral-500 mt-1">Review and manage referral requests</p>
      </div>

      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : referrals.length === 0 ? (
          <EmptyState title="No referrals found" description="Referrals will appear here when customers refer others." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 font-medium">Referrer</th>
                  <th className="px-6 py-3 font-medium">Referred</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Credit Amount</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{r.referrer_name}</td>
                    <td className="px-6 py-4 text-neutral-600">{r.referred_name}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4 text-neutral-600">{formatPrice(r.credit_amount)}</td>
                    <td className="px-6 py-4 text-neutral-600">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openActionModal(r, 'approve')}
                              className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(r, 'reject')}
                              className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && referrals.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Approve/Reject Modal */}
      <Modal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, referral: null, action: 'approve' })}
        title={actionModal.action === 'approve' ? 'Approve Referral' : 'Reject Referral'}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {actionModal.action === 'approve'
              ? `Approve referral from ${actionModal.referral?.referrer_name} for ${actionModal.referral?.referred_name}? Credit of ${formatPrice(actionModal.referral?.credit_amount || 0)} will be issued.`
              : `Reject referral from ${actionModal.referral?.referrer_name} for ${actionModal.referral?.referred_name}?`}
          </p>
          {actionModal.action === 'reject' && (
            <div>
              <label className="label">Reason (optional)</label>
              <input
                className="input-field"
                placeholder="Reason for rejection"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setActionModal({ open: false, referral: null, action: 'approve' })} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleAction} disabled={submitting} className={actionModal.action === 'approve' ? 'btn-primary' : 'btn-danger'}>
              {submitting ? 'Processing...' : actionModal.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
