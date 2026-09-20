import { useState, useEffect } from 'react';
import {
  Calendar,
  Filter,
  CheckCircle,
  UserCheck,
  XCircle,
  ClipboardCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi, treatmentRecordsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import CheckoutModal from '@/components/checkout/CheckoutModal';
import CustomerDetailDrawer from '@/components/admin/CustomerDetailDrawer';

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  customer: { id: number; first_name: string; last_name: string } | null;
  service: { id: number; name: string; duration_minutes: number } | null;
  services?: { id: number; name: string; price?: number; duration_minutes?: number }[];
  paid?: boolean;
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

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

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
    if (appointment.paid) {
      handleUpdateStatus(appointment.id, 'completed');
      return;
    }
    setSelectedAppointment(appointment);
    setTreatmentNotes('');
    setRecommendations('');
    setCheckoutOpen(true);
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
              className="btn-ghost text-xs text-primary-700 hover:text-primary-700"
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
        <h1 className="text-2xl font-sans font-semibold text-neutral-900">Appointments</h1>
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
                      {appt.customer ? (
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(appt.customer)}
                          className="font-medium text-neutral-900 hover:text-primary-600 underline decoration-neutral-300 hover:decoration-primary-600 transition text-left"
                          title="View complete client records, notes, allergies, and history"
                        >
                          {appt.customer.first_name} {appt.customer.last_name}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {appt.service?.name || '—'}
                      {appt.services && appt.services.length > 1 ? ` +${appt.services.length - 1}` : ''}
                    </td>
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

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => { setCheckoutOpen(false); setSelectedAppointment(null); }}
        onSuccess={() => { fetchAppointments(); toast.success('Appointment completed and payment recorded'); }}
        appointmentId={selectedAppointment?.id}
        customerId={selectedAppointment?.customer?.id ?? 0}
        staffId={user?.staff?.id ?? 0}
        services={
          selectedAppointment
            ? selectedAppointment.services && selectedAppointment.services.length > 0
              ? selectedAppointment.services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  price: s.price ?? 0,
                  duration: s.duration_minutes ?? 0,
                  category: '',
                  staff: [],
                }))
              : [{
                  id: selectedAppointment.service?.id ?? 0,
                  name: selectedAppointment.service?.name ?? '',
                  price: 0,
                  duration: selectedAppointment.service?.duration_minutes ?? 0,
                  category: '',
                  staff: [],
                }]
            : []
        }
        isStaff={true}
        treatmentNotes={treatmentNotes}
        treatmentRecommendations={recommendations}
      />

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        open={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  );
}
