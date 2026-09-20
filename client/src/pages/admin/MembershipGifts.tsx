import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { membershipGiftsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface MembershipGift {
  id: number;
  nominee_name: string;
  membership_code: string;
  status: string;
  created_at: string;
}

export default function MembershipGifts() {
  const [gifts, setGifts] = useState<MembershipGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModal, setActionModal] = useState<{ open: boolean; gift: MembershipGift | null; action: 'approve' | 'reject' }>({
    open: false, gift: null, action: 'approve',
  });
  const [redeemModal, setRedeemModal] = useState<{ open: boolean; gift: MembershipGift | null }>({ open: false, gift: null });
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await membershipGiftsApi.list(params);
      const result = data.data;
      setGifts(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotal(result?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load membership gifts');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  const openActionModal = (gift: MembershipGift, action: 'approve' | 'reject') => {
    setActionModal({ open: true, gift, action });
    setReason('');
  };

  const handleAction = async () => {
    if (!actionModal.gift) return;
    setSubmitting(true);
    try {
      const payload: any = { status: actionModal.action === 'approve' ? 'approved' : 'rejected' };
      if (actionModal.action === 'reject' && reason) payload.notes = reason;
      await membershipGiftsApi.approve(actionModal.gift.id, payload);
      toast.success(`Gift ${actionModal.action}d`);
      setActionModal({ open: false, gift: null, action: 'approve' });
      fetchGifts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemModal.gift) return;
    setSubmitting(true);
    try {
      await membershipGiftsApi.redeem(redeemModal.gift.id);
      toast.success('Gift redeemed successfully');
      setRedeemModal({ open: false, gift: null });
      fetchGifts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Redeem failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-sans font-semibold text-neutral-900">Membership Gifts</h1>
        <p className="text-sm text-neutral-500 mt-1">Review and manage membership gift requests</p>
      </div>

      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by nominee or membership..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending_approval">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="redeemed">Redeemed</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : gifts.length === 0 ? (
          <EmptyState title="No membership gifts found" description="Gift requests will appear here when members nominate others." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Nominee</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Membership</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {gifts.map((g) => (
                  <tr key={g.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{g.nominee_name}</td>
                    <td className="px-6 py-4 text-neutral-600 font-mono text-xs">{g.membership_code}</td>
                    <td className="px-6 py-4"><StatusBadge status={g.status} /></td>
                    <td className="px-6 py-4 text-neutral-600">{formatDate(g.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {g.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openActionModal(g, 'approve')}
                              className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(g, 'reject')}
                              className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {g.status === 'approved' && (
                          <button
                            onClick={() => setRedeemModal({ open: true, gift: g })}
                            className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition"
                          >
                            Redeem
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
        {!loading && gifts.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Approve/Reject Modal */}
      <Modal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, gift: null, action: 'approve' })}
        title={actionModal.action === 'approve' ? 'Approve Gift' : 'Reject Gift'}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {actionModal.action === 'approve'
              ? `Approve gift for nominee "${actionModal.gift?.nominee_name}"?`
              : `Reject gift for nominee "${actionModal.gift?.nominee_name}"?`}
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
            <button onClick={() => setActionModal({ open: false, gift: null, action: 'approve' })} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleAction} disabled={submitting} className={actionModal.action === 'approve' ? 'btn-primary' : 'btn-danger'}>
              {submitting ? 'Processing...' : actionModal.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Redeem Modal */}
      <Modal
        open={redeemModal.open}
        onClose={() => setRedeemModal({ open: false, gift: null })}
        title="Redeem Gift"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Redeem gift for <span className="font-medium">{redeemModal.gift?.nominee_name}</span>? This will mark the gift as redeemed.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setRedeemModal({ open: false, gift: null })} className="btn-secondary">Cancel</button>
            <button onClick={handleRedeem} disabled={submitting} className="btn-primary">
              {submitting ? 'Redeeming...' : 'Redeem'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
