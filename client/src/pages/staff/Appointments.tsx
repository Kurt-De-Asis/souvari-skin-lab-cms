import { useState, useEffect } from 'react';
import {
  Calendar,
  Filter,
  CheckCircle,
  UserCheck,
  XCircle,
  ClipboardCheck,
  Plus,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi, servicesApi, treatmentRecordsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import CheckoutModal from '@/components/checkout/CheckoutModal';
import CreateBookingDrawer from '@/components/booking/admin/CreateBookingDrawer';
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
  amount_due?: number;
  paid_amount?: number;
  balance?: number;
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
  const [checkoutMode, setCheckoutMode] = useState<'full' | 'balance'>('full');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [servicesList, setServicesList] = useState<any[]>([]);

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter, statusFilter]);

  // The new-booking drawer needs the services catalog; it is stable data, so
  // it is fetched once rather than on every filter change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await servicesApi.list();
        if (!cancelled) setServicesList(data.data || data || []);
      } catch {
        if (!cancelled) setServicesList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFilter) {
        params.date_from = dateFilter;
        params.date_to = dateFilter;
      }
      if (statusFilter) params.status = statusFilter;
      if (user?.staff?.id) params.staff_id = String(user.staff.id);
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
    // Only open the POS modal when money is genuinely outstanding.
    //
    // `balance` is the amount still owed. `balance` mode is correct only when
    // some money was already collected, so the modal bills just the uncovered
    // services. A never-paid booking uses `full` mode instead, because
    // /pos/quote applies membership and monthly-perk benefits that getBalance
    // does not.
    const outstanding = appointment.balance ?? (appointment.paid ? 0 : null);
    if (outstanding !== null && outstanding <= 0) {
      handleUpdateStatus(appointment.id, 'completed');
      return;
    }
    setSelectedAppointment(appointment);
    setCheckoutMode((appointment.paid_amount ?? 0) > 0 ? 'balance' : 'full');
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-sans font-semibold text-neutral-900">Appointments</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage your daily appointments</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="btn-primary whitespace-nowrap">
            <Plus size={15} className="mr-1" />
            New Appointment
          </button>
        </div>
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
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 whitespace-nowrap">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 whitespace-nowrap">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 whitespace-nowrap">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 whitespace-nowrap">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 whitespace-nowrap">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600 whitespace-nowrap">Actions</th>
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
        mode={checkoutMode}
        isStaff={true}
        treatmentNotes={treatmentNotes}
        treatmentRecommendations={recommendations}
      />

      {/* New Appointment — same drawer the admin calendar uses, so staff get
          the identical booking, discount, and POS flow. */}
      <CreateBookingDrawer
        open={createOpen}
        date={dateFilter || dayjs().format('YYYY-MM-DD')}
        services={servicesList}
        onClose={() => setCreateOpen(false)}
        onCreate={async (payload) => {
          try {
            await appointmentsApi.createGroup(payload);
            toast.success('Appointment created. Payment is collected at the POS when it is marked complete.');
            setCreateOpen(false);
            setDateFilter(payload.appointment_date);
            fetchAppointments();
            return true;
          } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create appointment');
            return false;
          }
        }}
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
