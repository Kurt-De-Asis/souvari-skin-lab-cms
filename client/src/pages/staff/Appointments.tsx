import { useState, useEffect } from 'react';
import {
  Calendar,
  Filter,
  CheckCircle,
  UserCheck,
  XCircle,
  ClipboardCheck,
  Star,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi, treatmentRecordsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  customer: { id: number; first_name: string; last_name: string } | null;
  service: { id: number; name: string; duration_minutes: number } | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No Show' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(dayjs().format('YYYY-MM-DD'));

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [satisfactionRating, setSatisfactionRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter, statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await appointmentsApi.list(params);
      setAppointments(data.data || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await appointmentsApi.updateStatus(id, { status });
      toast.success(`Appointment marked as ${status.replace('_', ' ')}`);
      fetchAppointments();
    } catch {
      toast.error('Failed to update appointment status');
    }
  };

  const openCompleteModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setTreatmentNotes('');
    setRecommendations('');
    setSatisfactionRating(5);
    setCompleteModalOpen(true);
  };

  const handleCompleteWithRecord = async () => {
    if (!selectedAppointment || !user?.staff) return;
    setSubmitting(true);
    try {
      await appointmentsApi.updateStatus(selectedAppointment.id, { status: 'completed' });
      await treatmentRecordsApi.create({
        appointment_id: selectedAppointment.id,
        customer_id: selectedAppointment.customer?.id,
        staff_id: user.staff.id,
        service_id: selectedAppointment.service?.id,
        notes: treatmentNotes,
        recommendations,
        satisfaction_rating: satisfactionRating,
      });
      toast.success('Appointment completed and treatment record created');
      setCompleteModalOpen(false);
      fetchAppointments();
    } catch {
      toast.error('Failed to complete appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusActions = (appt: Appointment) => {
    switch (appt.status) {
      case 'pending':
        return (
          <>
            <button
              onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
              className="btn-ghost text-xs text-green-600 hover:text-green-700"
            >
              <CheckCircle size={14} />
              Confirm
            </button>
            <button
              onClick={() => handleUpdateStatus(appt.id, 'no_show')}
              className="btn-ghost text-xs text-red-600 hover:text-red-700"
            >
              <XCircle size={14} />
              No Show
            </button>
          </>
        );
      case 'confirmed':
        return (
          <>
            <button
              onClick={() => handleUpdateStatus(appt.id, 'checked_in')}
              className="btn-ghost text-xs text-blue-600 hover:text-blue-700"
            >
              <UserCheck size={14} />
              Check In
            </button>
            <button
              onClick={() => handleUpdateStatus(appt.id, 'no_show')}
              className="btn-ghost text-xs text-red-600 hover:text-red-700"
            >
              <XCircle size={14} />
              No Show
            </button>
          </>
        );
      case 'checked_in':
        return (
          <>
            <button
              onClick={() => openCompleteModal(appt)}
              className="btn-ghost text-xs text-primary-600 hover:text-primary-700"
            >
              <ClipboardCheck size={14} />
              Complete
            </button>
            <button
              onClick={() => handleUpdateStatus(appt.id, 'no_show')}
              className="btn-ghost text-xs text-red-600 hover:text-red-700"
            >
              <XCircle size={14} />
              No Show
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Appointments</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your daily appointments</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative max-w-xs">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field pl-10 pr-8"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="No appointments match your current filters"
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3 text-neutral-900">
                      {dayjs(appt.appointment_date).format('MMM D, YYYY')}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {dayjs(`2000-01-01 ${appt.start_time}`).format('h:mm A')} -{' '}
                      {dayjs(`2000-01-01 ${appt.end_time}`).format('h:mm A')}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 font-medium">
                      {appt.customer
                        ? `${appt.customer.first_name} ${appt.customer.last_name}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{appt.service?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {getStatusActions(appt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Appointment"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-neutral-900">
                {selectedAppointment.customer?.first_name} {selectedAppointment.customer?.last_name}
              </p>
              <p className="text-neutral-600">{selectedAppointment.service?.name}</p>
            </div>

            <div>
              <label className="label">Treatment Notes</label>
              <textarea
                rows={3}
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
                className="input-field"
                placeholder="Describe the treatment performed..."
              />
            </div>

            <div>
              <label className="label">Recommendations</label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="input-field"
                placeholder="Any follow-up recommendations..."
              />
            </div>

            <div>
              <label className="label">Customer Satisfaction</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSatisfactionRating(star)}
                    className="p-0.5"
                  >
                    <Star
                      size={24}
                      className={
                        star <= satisfactionRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-neutral-300'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteWithRecord}
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Complete & Save Record'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
