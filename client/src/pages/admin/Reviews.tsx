import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { reviewsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface Review {
  id: number;
  rating: number;
  feedback: string | null;
  created_at: string;
  customer: { id: number; first_name: string; last_name: string } | null;
  service: { id: number; name: string } | null;
  staff: { id: number; first_name: string; last_name: string } | null;
}

const RATINGS = [5, 4, 3, 2, 1];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={15}
          className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (ratingFilter) params.rating = ratingFilter;
      const { data } = await reviewsApi.list(params);
      setReviews(data.data?.data || []);
      setTotalPages(data.data?.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, ratingFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Reviews</h1>
          <p className="text-sm text-neutral-500 mt-1">Client feedback across all services</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Rating:</span>
          <select
            className="select-field w-auto"
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            {RATINGS.map((r) => (
              <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Client reviews will appear here once appointments are completed." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {r.customer ? `${r.customer.first_name} ${r.customer.last_name}` : 'Customer'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {dayjs(r.created_at).format('MMM D, YYYY')}
                    </p>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                {r.feedback && (
                  <p className="text-sm text-neutral-600 whitespace-pre-line">{r.feedback}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                  <span>Service: <span className="text-neutral-700 font-medium">{r.service?.name || '—'}</span></span>
                  {r.staff && (
                    <span>Staff: <span className="text-neutral-700 font-medium">{r.staff.first_name} {r.staff.last_name}</span></span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}