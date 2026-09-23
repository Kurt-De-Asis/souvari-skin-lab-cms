import { useState, useEffect, useCallback } from 'react';
import { Receipt, Calendar, ChevronDown, ChevronUp, User } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { transactionsApi, treatmentRecordsApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import formatPaymentMethod from '@/utils/formatPaymentMethod';
import { formatServicePrice } from '@/utils/format';

type TabKey = 'transactions' | 'history';

export default function Transactions() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>('transactions');

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotalPages, setRecordsTotalPages] = useState(1);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (user?.customer?.id) {
        params.customer_id = String(user.customer.id);
      }
      const { data } = await transactionsApi.list(params);
      const res = data.data;
      const pagination = data.pagination;
      setTransactions(res.items || res || []);
      setTotalPages(pagination?.totalPages || Math.ceil((pagination?.total || 0) / 10) || 1);
      setTotal(pagination?.total || (res.items || res || []).length || 0);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const { data } = await treatmentRecordsApi.list({ page: String(recordsPage), limit: '10' });
      const res = data.data;
      const pagination = data.pagination;
      setRecords(res.items || res || []);
      setRecordsTotalPages(pagination?.totalPages || Math.ceil((pagination?.total || 0) / 10) || 1);
      setRecordsTotal(pagination?.total || (res.items || res || []).length || 0);
    } catch {
      toast.error('Failed to load treatment history');
    } finally {
      setRecordsLoading(false);
    }
  }, [recordsPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  const toggleRecordExpand = (id: number) => {
    setExpandedRecord(expandedRecord === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-sans font-semibold text-neutral-900">Transactions</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        <button
          onClick={() => setTab('transactions')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
            tab === 'transactions'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
            tab === 'history'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Treatment History
        </button>
      </div>

      {tab === 'transactions' && (
        loading ? (
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
                    className="w-full flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 bg-primary-100 rounded-md text-primary-700 flex-shrink-0">
                        <Receipt size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-500 truncate">
                          {tx.reference_number || `TXN-${tx.id}`}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {dayjs(tx.date || tx.created_at).format('MMMM D, YYYY')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-neutral-900">
                        ₱{(Number(tx.total_amount) || 0).toLocaleString()}
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
                          <div className="bg-neutral-50 rounded-md divide-y divide-neutral-100">
                            {tx.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                <div>
                                  <span className="text-neutral-900">{item.name || item.service?.name || item.description || 'Item'}</span>
                                  {item.quantity > 1 && <span className="text-neutral-500 ml-1">x{item.quantity}</span>}
                                </div>
                                <span className="text-neutral-900 font-medium">₱{(Number(item.line_total) || Number(item.unit_price) || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500">Payment Method</p>
                          <p className="font-medium text-neutral-900">{formatPaymentMethod(tx.payment_method)}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Status</p>
                          <StatusBadge status={tx.payment_status || tx.status || 'pending'} />
                        </div>
                      </div>

                      <div className="flex justify-between border-t border-neutral-200 pt-3">
                        <span className="text-neutral-500 font-medium">Total</span>
                        <span className="font-bold text-neutral-900">₱{(Number(tx.total_amount) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )
      )}

      {tab === 'history' && (
        recordsLoading ? (
          <LoadingSpinner fullScreen />
        ) : records.length === 0 ? (
          <EmptyState title="No treatment records" description="Your treatment history will appear here after your visits." />
        ) : (
          <>
            <div className="space-y-3">
              {records.map((rec: any) => (
                <div key={rec.id} className="card">
                  <button
                    onClick={() => toggleRecordExpand(rec.id)}
                    className="w-full flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 bg-primary-100 rounded-md text-primary-600 flex-shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900">{rec.service?.name || rec.service_name || 'Treatment'}</p>
                        <p className="text-sm text-neutral-500">
                          {dayjs(rec.treatment_date || rec.date || rec.created_at).format('MMMM D, YYYY')}
                          {rec.staff && ` — ${rec.staff.first_name} ${rec.staff.last_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {expandedRecord === rec.id ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
                    </div>
                  </button>

                  {expandedRecord === rec.id && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                      {rec.notes && (
                        <div>
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Notes</p>
                          <p className="text-sm text-neutral-700">{rec.notes}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500">Staff</p>
                          <p className="font-medium text-neutral-900">
                            {rec.staff ? `${rec.staff.first_name} ${rec.staff.last_name}` : '--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Service</p>
                          <p className="font-medium text-neutral-900">{rec.service?.name || rec.service_name || '--'}</p>
                        </div>
                        {(rec.price ?? rec.service?.price) != null && (
                          <div>
                            <p className="text-neutral-500">Price</p>
                            <p className="font-medium text-neutral-900">{formatServicePrice(rec.price ?? rec.service?.price)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination page={recordsPage} totalPages={recordsTotalPages} total={recordsTotal} onPageChange={setRecordsPage} />
          </>
        )
      )}
    </div>
  );
}