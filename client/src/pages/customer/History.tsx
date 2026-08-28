import { useState, useEffect, useCallback } from 'react';
import { Calendar, User, ChevronDown, ChevronUp, Star } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { treatmentRecordsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';

export default function History() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await treatmentRecordsApi.list({ page: String(page), limit: '10' });
      const res = data.data;
      setRecords(res.items || res || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / 10) || 1);
      setTotal(res.total || (res.items || res || []).length || 0);
    } catch {
      toast.error('Failed to load treatment history');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Treatment History</h1>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : records.length === 0 ? (
        <EmptyState title="No treatment records" description="Your treatment history will appear here after your visits." />
      ) : (
        <>
          <div className="space-y-3">
            {records.map((rec: any) => (
              <div key={rec.id} className="card">
                <button
                  onClick={() => toggleExpand(rec.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{rec.service?.name || rec.service_name || 'Treatment'}</p>
                      <p className="text-sm text-neutral-500">
                        {dayjs(rec.date || rec.created_at).format('MMMM D, YYYY')}
                        {rec.staff && ` — ${rec.staff.first_name} ${rec.staff.last_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {rec.rating && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-medium">{rec.rating}</span>
                      </div>
                    )}
                    {expanded === rec.id ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
                  </div>
                </button>

                {expanded === rec.id && (
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
                      {rec.price != null && (
                        <div>
                          <p className="text-neutral-500">Price</p>
                          <p className="font-medium text-neutral-900">₱{Number(rec.price).toLocaleString()}</p>
                        </div>
                      )}
                      {rec.rating && (
                        <div>
                          <p className="text-neutral-500">Rating</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                className={s <= rec.rating ? 'text-amber-500' : 'text-neutral-200'}
                                fill={s <= rec.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                        </div>
                      )}
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
