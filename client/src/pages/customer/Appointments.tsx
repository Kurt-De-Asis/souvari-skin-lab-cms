import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, Trash2, Filter } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { appointmentsApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

type FilterType = 'all' | 'upcoming' | 'past';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [cancelModal, setCancelModal] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (user?.customer?.id) {
        params.customer_id = String(user.customer.id);
      }
      if (filter === 'upcoming') {
        params.status = 'pending,confirmed,checked_in';
        params.date_from = dayjs().format('YYYY-MM-DD');
      } else if (filter === 'past') {
        params.status = 'completed,cancelled,no_show';
      }
      const { data } = await appointmentsApi.list(params);
      const res = data.data;
      setAppointments(res.items || res || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / 10) || 1);
      setTotal(res.total || (res.items || res || []).length || 0);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await appointmentsApi.updateStatus(cancelModal.id, { status: 'cancelled' });
      toast.success('Appointment cancelled');
      setCancelModal(null);
      fetchAppointments();
    } catch {
      toast.error('Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const isUpcoming = (apt: any) => {
    const aptDate = dayjs(apt.appointment_date || apt.date);
    return aptDate.isAfter(dayjs(), 'day') || (aptDate.isSame(dayjs(), 'day') && ['pending', 'confirmed', 'checked_in'].includes(apt.status));
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">My Appointments</h1>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-neutral-400" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description={filter === 'all' ? "You haven't booked any appointments yet." : `No ${filter} appointments.`}
        />
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left text-neutral-500">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Service</th>
                    <th className="px-6 py-3 font-medium">Staff</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {appointments.map((apt: any) => (
                    <tr key={apt.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-neutral-900">
                          <Calendar size={14} className="text-neutral-400" />
                          {dayjs(apt.appointment_date || apt.date).format('MMM D, YYYY')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Clock size={14} className="text-neutral-400" />
                          {apt.start_time || apt.time || '--'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-neutral-900 font-medium">
                        {apt.service?.name || apt.service_name || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <User size={14} className="text-neutral-400" />
                          {apt.staff ? `${apt.staff.first_name} ${apt.staff.last_name}` : '--'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isUpcoming(apt) && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => setCancelModal(apt)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition"
                            title="Cancel appointment"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!cancelModal} onClose={() => !cancelling && setCancelModal(null)} title="Cancel Appointment">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to cancel your appointment for{' '}
            <strong>{cancelModal?.service?.name || cancelModal?.service_name || 'this service'}</strong> on{' '}
            <strong>{cancelModal && dayjs(cancelModal.appointment_date || cancelModal.date).format('MMMM D, YYYY')}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCancelModal(null)}
              disabled={cancelling}
              className="btn-secondary"
            >
              Keep Appointment
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn-danger"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
