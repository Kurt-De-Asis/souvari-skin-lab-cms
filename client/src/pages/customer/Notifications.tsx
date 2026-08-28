import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Filter, Trash2, Inbox } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { notificationsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';

type ReadFilter = 'all' | 'unread' | 'read';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    setPage(1);
  }, [readFilter]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await notificationsApi.delete(deleteModal.id);
      toast.success('Notification deleted');
      setDeleteModal(null);
      fetchNotifications();
    } catch {
      toast.error('Failed to delete notification');
    } finally {
      setDeleting(false);
    }
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
        <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-neutral-400" />
            {readFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setReadFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  readFilter === f.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
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
            {notifications.map((n: any) => (
              <div
                key={n.id}
                onClick={() => n.status === 'unread' && handleMarkRead(n.id)}
                className={`card flex items-start gap-4 transition cursor-pointer ${
                  n.status === 'unread' ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : 'hover:bg-neutral-50'
                }`}
              >
                <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${
                  n.type === 'appointment_reminder' || n.type === 'appointment_update' ? 'bg-blue-100 text-blue-600'
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
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteModal(n); }}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!deleteModal} onClose={() => !deleting && setDeleteModal(null)} title="Delete Notification">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Are you sure you want to delete this notification?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteModal(null)} disabled={deleting} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
