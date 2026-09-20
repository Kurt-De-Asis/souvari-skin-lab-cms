import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Filter, Trash2, Inbox, Star } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { notificationsApi, reviewsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';

type ReadFilter = 'all' | 'unread' | 'read';

function parseNotificationData(data: string | null): Record<string, any> {
  if (!data) return {};
  try { return JSON.parse(data); } catch { return {}; }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [reviewModalNotification, setReviewModalNotification] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (readFilter === 'unread') params.status = 'unread';
      if (readFilter === 'read') params.status = 'read';
      const { data } = await notificationsApi.list(params);
      const res = data.data;
      setNotifications(res.items || res || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / 15) || 1);
      setTotal(res.total || (res.items || res || []).length || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, readFilter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { setPage(1); }, [readFilter]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)));
    } catch { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await notificationsApi.delete(deleteModal.id);
      toast.success('Notification deleted');
      setDeleteModal(null);
      fetchNotifications();
    } catch { toast.error('Failed to delete notification'); } finally { setDeleting(false); }
  };

  const openReview = (n: any) => {
    setReviewModalNotification(n);
    setReviewRating(5);
    setReviewFeedback('');
  };

  const submitReview = async () => {
    if (!reviewModalNotification) return;
    const parsed = parseNotificationData(reviewModalNotification.data);
    const appointmentId = parsed.appointment_id;
    if (!appointmentId) { toast.error('Appointment ID not found'); return; }
    setReviewSubmitting(true);
    try {
      await reviewsApi.create({
        appointment_id: appointmentId,
        rating: reviewRating,
        feedback: reviewFeedback.trim() || undefined,
      });
      toast.success('Thank you for your feedback!');
      setReviewModalNotification(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setReviewSubmitting(false); }
  };

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;
  const readFilters: { value: ReadFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-sans font-semibold text-neutral-900">Notifications</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-neutral-400" />
            {readFilters.map((f) => (
              <button key={f.value} onClick={() => setReadFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  readFilter === f.value ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-secondary text-sm">
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description={readFilter === 'unread' ? "You're all caught up!" : "No notifications to display."}
        />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n: any) => {
              const parsed = parseNotificationData(n.data);
              const isCompletedSession = n.type === 'appointment_update' && parsed.new_status === 'completed' && parsed.appointment_id;

              return (
                <div key={n.id} onClick={() => n.status === 'unread' && handleMarkRead(n.id)}
                  className={`card flex items-start gap-4 transition cursor-pointer ${
                    n.status === 'unread' ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : 'hover:bg-neutral-50'
                  }`}>
                  <div className={`mt-0.5 p-2 rounded-md flex-shrink-0 ${
                    n.type === 'appointment_reminder' || n.type === 'appointment_update' ? 'bg-primary-100 text-primary-700'
                    : n.type === 'payment' ? 'bg-green-100 text-green-600'
                    : n.type === 'promotion' ? 'bg-amber-100 text-amber-600'
                    : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    <Bell size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.status === 'unread' ? 'text-neutral-900' : 'text-neutral-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-neutral-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-neutral-400 mt-1">{dayjs(n.created_at).format('MMM D, YYYY h:mm A')}</p>
                  </div>
                  {isCompletedSession && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openReview(n); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50 transition flex-shrink-0"
                      title="Rate your session"
                    >
                      <Star size={14} /> Rate Session
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setDeleteModal(n); }}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition flex-shrink-0" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Delete Modal */}
      <Modal open={!!deleteModal} onClose={() => !deleting && setDeleteModal(null)} title="Delete Notification">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Are you sure you want to delete this notification?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteModal(null)} disabled={deleting} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">{deleting ? 'Deleting...' : 'Delete'}</button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      {reviewModalNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-md shadow-xl">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Rate Your Session</h2>
              <p className="text-sm text-neutral-500 mt-1">How was your experience?</p>
            </div>
            <div className="p-4 space-y-5">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)}
                    className={`p-1 transition ${star <= reviewRating ? 'text-amber-400' : 'text-neutral-300 hover:text-amber-300'}`}>
                    <Star size={32} fill={star <= reviewRating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Share your experience (optional)"
                rows={4}
                className="input-field w-full resize-none"
              />
            </div>
            <div className="p-4 border-t border-neutral-200 flex gap-3 justify-end">
              <button onClick={() => setReviewModalNotification(null)} disabled={reviewSubmitting} className="btn-secondary">Cancel</button>
              <button onClick={submitReview} disabled={reviewSubmitting} className="btn-primary">
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}