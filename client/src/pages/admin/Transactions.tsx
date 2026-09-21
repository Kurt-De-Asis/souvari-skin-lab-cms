import { useState, useEffect, useCallback, Fragment } from 'react';
import { Search, ChevronDown, ChevronUp, DollarSign, Ban, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { transactionsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface TransactionItem {
  id: number;
  description?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  price_type?: string;
  service_id?: number | null;
  product_id?: number | null;
  product?: { id: number; name: string };
  service?: { id: number; name: string; price?: number };
}

interface Transaction {
  id: number;
  reference_number: string;
  created_at: string;
  customer: { id: number; first_name: string; last_name: string } | null;
  items: TransactionItem[];
  total: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  status: string;
  notes?: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Summary
  const [summaryRevenue, setSummaryRevenue] = useState(0);
  const [summaryCount, setSummaryCount] = useState(0);

  // Void/Refund modals
  const [voidModal, setVoidModal] = useState<Transaction | null>(null);
  const [refundModal, setRefundModal] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(customerSearch), 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  useEffect(() => { setPage(1); }, [debouncedSearch, dateFrom, dateTo, statusFilter, typeFilter]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter) params.payment_status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (debouncedSearch) params.customer = debouncedSearch;
      const { data } = await transactionsApi.list(params);
      const txns = data.data || [];
      setTransactions(txns);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setSummaryRevenue(txns.reduce((sum: number, t: any) => sum + (t.payment_status === 'refunded' || t.payment_status === 'voided' ? 0 : Number(t.total_amount || t.total || 0)), 0));
      setSummaryCount(data.pagination?.total || txns.length);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo, statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleVoid = async () => {
    if (!voidModal) return;
    setActionLoading(true);
    try {
      await transactionsApi.void(voidModal.id, { reason: voidReason });
      toast.success('Transaction voided');
      setVoidModal(null);
      setVoidReason('');
      fetchTransactions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to void transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    setActionLoading(true);
    try {
      await transactionsApi.refund(refundModal.id, { reason: refundReason });
      toast.success('Transaction refunded');
      setRefundModal(null);
      setRefundReason('');
      fetchTransactions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to refund transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-sans font-semibold text-neutral-900">Transactions</h1>
        <p className="text-sm text-neutral-500 mt-1">View transaction history and manage payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-md bg-green-50 text-green-600">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-sans font-semibold text-neutral-900 mt-0.5">{formatCurrency(summaryRevenue)}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-md bg-blue-50 text-primary-700">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Total Transactions</p>
            <p className="text-2xl font-sans font-semibold text-neutral-900 mt-0.5">{summaryCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card pb-0">
        <div className="flex flex-wrap items-end gap-3 pb-4">
          <div>
            <label className="label">From</label>
            <input type="date" className="input-field w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input-field w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Status</label>
            <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="voided">Voided</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select-field w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="service">Service</option>
              <option value="product">Product</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="label">Customer</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                className="input-field pl-8 w-auto"
                placeholder="Search..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions found" description="Adjust your filters to see results." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 w-8" />
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Reference #</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Items</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Total</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Payment</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.map((txn) => {
                  const isExpanded = expandedId === txn.id;
                  const canVoid = txn.payment_status === 'paid' && txn.status !== 'voided';
                  const canRefund = txn.payment_status === 'paid' && txn.status !== 'refunded' && txn.status !== 'voided';
                  return (
                    <Fragment key={txn.id}>
                      <tr
                        className="hover:bg-neutral-50/50 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                      >
                        <td className="px-6 py-4 text-neutral-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="px-6 py-4 text-neutral-600">{dayjs(txn.created_at).format('MMM D, YYYY')}</td>
                        <td className="px-6 py-4 font-mono text-xs text-neutral-600">{txn.reference_number}</td>
                        <td className="px-6 py-4 font-medium text-neutral-900">
                          {txn.customer ? `${txn.customer.first_name} ${txn.customer.last_name}` : 'Walk-in'}
                        </td>
                        <td className="px-6 py-4 text-neutral-500">{txn.items?.length || 0} item(s)</td>
                        <td className="px-6 py-4 font-semibold text-neutral-900">{formatCurrency(Number(txn.total_amount || txn.total || 0))}</td>
                        <td className="px-6 py-4"><StatusBadge status={txn.payment_status} /></td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {canVoid && (
                              <button
                                onClick={() => setVoidModal(txn)}
                                title="Void"
                                className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                            {canRefund && (
                              <button
                                onClick={() => setRefundModal(txn)}
                                title="Refund"
                                className="p-2 text-neutral-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-neutral-50/50 px-12 py-4">
                            <p className="text-xs font-medium text-neutral-500 mb-2">Transaction Items</p>
                            {txn.items && txn.items.length > 0 ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-neutral-500 border-b border-neutral-200">
                                    <th className="pb-2 font-medium">Item</th>
                                    <th className="pb-2 font-medium">Type</th>
                                    <th className="pb-2 font-medium text-right">Qty</th>
                                    <th className="pb-2 font-medium text-right">Unit Price</th>
                                    <th className="pb-2 font-medium text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                  {txn.items.map((item) => (
                                    <tr key={item.id}>
                                      <td className="py-2 text-neutral-900 font-medium">{item.description || item.product?.name || item.service?.name || 'Item'}</td>
                                      <td className="py-2 text-neutral-500 capitalize">{item.service_id ? 'service' : item.product_id ? 'product' : item.price_type || 'sale'}</td>
                                      <td className="py-2 text-neutral-600 text-right">{Number(item.quantity)}</td>
                                      <td className="py-2 text-neutral-600 text-right">{formatCurrency(Number(item.unit_price))}</td>
                                      <td className="py-2 text-neutral-900 font-medium text-right">{formatCurrency(Number(item.line_total))}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs text-neutral-400">No item details available</p>
                            )}
                            {txn.notes && (
                              <p className="text-xs text-neutral-500 mt-3 bg-white rounded-md p-2 border border-neutral-100">
                                <span className="font-medium">Notes:</span> {txn.notes}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && transactions.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Void Modal */}
      <Modal open={voidModal !== null} onClose={() => { setVoidModal(null); setVoidReason(''); }} title="Void Transaction" maxWidth="max-w-md">
        {voidModal && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Void transaction <span className="font-semibold">{voidModal.reference_number}</span> for{' '}
              <span className="font-semibold">{formatCurrency(voidModal.total)}</span>?
            </p>
            <div>
              <label className="label">Reason</label>
              <input
                className="input-field"
                placeholder="Enter reason for voiding..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setVoidModal(null); setVoidReason(''); }} className="btn-secondary">Cancel</button>
              <button onClick={handleVoid} disabled={actionLoading} className="btn-danger">
                {actionLoading ? 'Processing...' : 'Void Transaction'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal open={refundModal !== null} onClose={() => { setRefundModal(null); setRefundReason(''); }} title="Refund Transaction" maxWidth="max-w-md">
        {refundModal && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Refund transaction <span className="font-semibold">{refundModal.reference_number}</span> for{' '}
              <span className="font-semibold">{formatCurrency(refundModal.total)}</span>?
            </p>
            <div>
              <label className="label">Reason</label>
              <input
                className="input-field"
                placeholder="Enter reason for refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRefundModal(null); setRefundReason(''); }} className="btn-secondary">Cancel</button>
              <button onClick={handleRefund} disabled={actionLoading} className="btn-danger">
                {actionLoading ? 'Processing...' : 'Refund Transaction'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


