import { useState, useEffect, useCallback } from 'react';
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { transactionsApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (user?.customer?.id) {
        params.customer_id = String(user.customer.id);
      }
      const { data } = await transactionsApi.list(params);
      const res = data.data;
      setTransactions(res.items || res || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / 10) || 1);
      setTotal(res.total || (res.items || res || []).length || 0);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Transactions</h1>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : transactions.length === 0 ? (
        <EmptyState title="No transactions" description="Your transaction history will appear here." />
      ) : (
        <>
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="card">
                <button
                  onClick={() => toggleExpand(tx.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500">
                        {tx.reference_number || `TXN-${tx.id}`}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {dayjs(tx.date || tx.created_at).format('MMMM D, YYYY')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-900">
                      ₱{(tx.total || tx.amount || 0).toLocaleString()}
                    </span>
                    <StatusBadge status={tx.payment_status || tx.status || 'pending'} />
                    {expanded === tx.id ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
                  </div>
                </button>

                {expanded === tx.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                    {tx.items && tx.items.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Items</p>
                        <div className="bg-neutral-50 rounded-lg divide-y divide-neutral-100">
                          {tx.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                              <div>
                                <span className="text-neutral-900">{item.name || item.service?.name || item.description || 'Item'}</span>
                                {item.quantity > 1 && <span className="text-neutral-500 ml-1">x{item.quantity}</span>}
                              </div>
                              <span className="text-neutral-900 font-medium">₱{(item.total || item.price || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500">Payment Method</p>
                        <p className="font-medium text-neutral-900 capitalize">{tx.payment_method || '--'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Status</p>
                        <StatusBadge status={tx.payment_status || tx.status || 'pending'} />
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-neutral-200 pt-3">
                      <span className="text-neutral-500 font-medium">Total</span>
                      <span className="font-bold text-neutral-900">₱{(tx.total || tx.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
