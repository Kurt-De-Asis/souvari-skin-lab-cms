import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, CheckCircle2, XCircle, RefreshCw, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { appointmentsApi, customersApi, staffApi, servicesApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import CheckoutModal from '@/components/checkout/CheckoutModal';

interface Appointment {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer: { id: number; first_name: string; last_name: string };
  staff: { id: number; first_name: string; last_name: string };
  service: { id: number; name: string };
  services?: { id: number; name: string; price?: number; duration_minutes?: number }[];
  paid?: boolean;
  notes?: string;
}

interface Customer { id: number; first_name: string; last_name: string; }
interface StaffMember { id: number; first_name: string; last_name: string; }
interface ServiceItem { id: number; name: string; duration: number; price: number; }

interface AppointmentForm {
  customer_id: number;
  staff_id: number;
  service_id: number;
  date: string;
  start_time: string;
  notes: string;
}

interface RescheduleForm {
  appointment_date: string;
  start_time: string;
  reschedule_reason: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');


  // Dropdown data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Reschedule modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Status confirm modals
  const [confirmAction, setConfirmAction] = useState<{ appointment: Appointment; action: string } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Checkout modal
  const [checkoutAppointment, setCheckoutAppointment] = useState<Appointment | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const openConfirm = (appointment: Appointment, action: string) => {
    setActionReason('');
    if (action === 'completed' && !appointment.paid) {
      setCheckoutAppointment(appointment);
      setCheckoutOpen(true);
    } else {
      setConfirmAction({ appointment, action });
    }
  };

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AppointmentForm>({
    defaultValues: { customer_id: 0, staff_id: 0, service_id: 0, date: '', start_time: '', notes: '' },
  });

  const { register: registerReschedule, handleSubmit: handleSubmitReschedule, reset: resetReschedule, formState: { errors: rescheduleErrors } } = useForm<RescheduleForm>({
    defaultValues: { appointment_date: '', start_time: '', reschedule_reason: '' },
  });

  const selectedServiceId = watch('service_id');
  const selectedService = servicesList.find((s) => s.id === Number(selectedServiceId));

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter) params.status = statusFilter;
      if (staffFilter) params.staff_id = staffFilter;
      const { data } = await appointmentsApi.list(params);
      setAppointments(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo, statusFilter, staffFilter]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [custRes, staffRes, svcRes] = await Promise.all([
        customersApi.list({ limit: '200' }),
        staffApi.list({ limit: '200' }),
        servicesApi.list({ limit: '200' }),
      ]);
      setCustomers(custRes.data.data?.customers || custRes.data.data?.data || []);
      setStaffList(staffRes.data.data?.staff || staffRes.data.data?.data || []);
      setServicesList(svcRes.data.data?.services || svcRes.data.data?.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
  useEffect(() => { setPage(1); }, [dateFrom, dateTo, statusFilter, staffFilter]);

  const onCreateSubmit = async (values: AppointmentForm) => {
    setCreateSubmitting(true);
    try {
      await appointmentsApi.create({
        ...values,
        customer_id: Number(values.customer_id),
        staff_id: Number(values.staff_id),
        service_id: Number(values.service_id),
      });
      toast.success('Appointment created');
      setCreateModalOpen(false);
      reset({ customer_id: 0, staff_id: 0, service_id: 0, date: '', start_time: '', notes: '' });
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create appointment');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const onRescheduleSubmit = async (values: RescheduleForm) => {
    if (!rescheduleAppointment) return;
    setRescheduleSubmitting(true);
    try {
      await appointmentsApi.update(rescheduleAppointment.id, {
        appointment_date: values.appointment_date,
        start_time: values.start_time,
        reschedule_reason: values.reschedule_reason.trim(),
      });
      toast.success('Appointment rescheduled');
      setRescheduleModalOpen(false);
      setRescheduleAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reschedule');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const updateStatus = async (appointmentId: number, status: string, reason?: string) => {
    try {
      await appointmentsApi.updateStatus(appointmentId, { status, reason });
      toast.success(`Appointment ${status}`);
      setConfirmAction(null);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const changeStaff = async (apt: Appointment, staffId: number) => {
    try {
      await appointmentsApi.update(apt.id, { staff_id: staffId });
      toast.success('Handled by updated');
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update staff');
      fetchAppointments();
    }
  };

  const openReschedule = (apt: Appointment) => {
    setRescheduleAppointment(apt);
    resetReschedule({ appointment_date: apt.date?.split('T')[0] || '', start_time: apt.start_time || '', reschedule_reason: '' });
    setRescheduleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Appointments</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage all clinic appointments</p>
        </div>
        <button onClick={() => { setCreateModalOpen(true); reset({ customer_id: 0, staff_id: 0, service_id: 0, date: '', start_time: '', notes: '' }); }} className="btn-primary">
          <Plus size={18} />
          New Appointment
        </button>
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
            <label className="label">Status</label>
            <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <div>
            <label className="label">Staff</label>
            <select className="select-field w-auto" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
              <option value="">All Staff</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments found" description="Create a new appointment or adjust filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Staff</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Service</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 text-neutral-600">{dayjs(apt.date).format('MMM D, YYYY')}</td>
                    <td className="px-6 py-4 text-neutral-600">{apt.start_time} - {apt.end_time}</td>
                    <td className="px-6 py-4 font-medium text-neutral-900">{apt.customer?.first_name} {apt.customer?.last_name}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      <select
                        title="Handled by"
                        value={apt.staff?.id ?? ''}
                        onChange={(e) => changeStaff(apt, Number(e.target.value))}
                        className="input-field !py-1.5 !px-2 text-sm w-auto min-w-[9rem]"
                      >
                        <option value="" disabled>Select staff</option>
                        {staffList.map((sm) => (
                          <option key={sm.id} value={sm.id}>{sm.first_name} {sm.last_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {apt.service?.name}
                      {apt.services && apt.services.length > 1 ? ` +${apt.services.length - 1}` : ''}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={apt.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {apt.status === 'pending' && (
                          <button
                            onClick={() => openConfirm(apt, 'confirmed')}
                            title="Confirm"
                            className="p-2 text-neutral-500 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {apt.status === 'pending' && (
                          <>
                            <button onClick={() => openReschedule(apt)} title="Reschedule" className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-blue-50 rounded-md transition">
                              <RefreshCw size={16} />
                            </button>
                            <button
                              onClick={() => openConfirm(apt, 'cancelled')}
                              title="Cancel"
                              className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => openConfirm(apt, 'checked_in')}
                              title="Check In"
                              className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-blue-50 rounded-md transition"
                            >
                              <LogIn size={16} />
                            </button>
                            <button
                              onClick={() => openConfirm(apt, 'completed')}
                              title="Mark Complete"
                              className="p-2 text-neutral-500 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button onClick={() => openReschedule(apt)} title="Reschedule" className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-blue-50 rounded-md transition">
                              <RefreshCw size={16} />
                            </button>
                            <button
                              onClick={() => openConfirm(apt, 'cancelled')}
                              title="Cancel"
                              className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {apt.status === 'checked_in' && (
                          <button
                            onClick={() => openConfirm(apt, 'completed')}
                            title="Mark Complete"
                            className="p-2 text-neutral-500 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && appointments.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="New Appointment" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="label">Customer</label>
            <select className="select-field" {...register('customer_id', { required: 'Required', valueAsNumber: true })}>
              <option value={0}>Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
            {errors.customer_id && <p className="text-xs text-red-600 mt-1">{errors.customer_id.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Service</label>
              <select className="select-field" {...register('service_id', { required: 'Required', valueAsNumber: true })}>
                <option value={0}>Select service</option>
                {servicesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.duration}min)</option>
                ))}
              </select>
              {errors.service_id && <p className="text-xs text-red-600 mt-1">{errors.service_id.message}</p>}
            </div>
            <div>
              <label className="label">Staff</label>
              <select className="select-field" {...register('staff_id', { required: 'Required', valueAsNumber: true })}>
                <option value={0}>Select staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
              {errors.staff_id && <p className="text-xs text-red-600 mt-1">{errors.staff_id.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" {...register('date', { required: 'Required' })} />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input-field" {...register('start_time', { required: 'Required' })} />
              {errors.start_time && <p className="text-xs text-red-600 mt-1">{errors.start_time.message}</p>}
            </div>
          </div>
          {selectedService && (
            <p className="text-xs text-neutral-500">Duration: {selectedService.duration} minutes</p>
          )}
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} placeholder="Optional notes" {...register('notes')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createSubmitting} className="btn-primary">
              {createSubmitting ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal open={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Reschedule Appointment">
        <form onSubmit={handleSubmitReschedule(onRescheduleSubmit)} className="space-y-4">
          <p className="text-sm text-neutral-500">
            Rescheduling appointment for <span className="font-medium text-neutral-700">{rescheduleAppointment?.customer?.first_name} {rescheduleAppointment?.customer?.last_name}</span>
          </p>
          <div>
            <label className="label">New Date</label>
            <input type="date" className="input-field" {...registerReschedule('appointment_date', { required: 'Required' })} />
            {rescheduleErrors.appointment_date && <p className="text-xs text-red-600 mt-1">{rescheduleErrors.appointment_date.message}</p>}
          </div>
          <div>
            <label className="label">New Start Time</label>
            <input type="time" className="input-field" {...registerReschedule('start_time', { required: 'Required' })} />
            {rescheduleErrors.start_time && <p className="text-xs text-red-600 mt-1">{rescheduleErrors.start_time.message}</p>}
          </div>
          <div>
            <label className="label">Message to Customer <span className="text-red-600">*</span></label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Explain the reason for rescheduling — this will be sent to the customer via notification and SMS."
              {...registerReschedule('reschedule_reason', { required: 'Please provide a message explaining the reschedule' })}
            />
            {rescheduleErrors.reschedule_reason && <p className="text-xs text-red-600 mt-1">{rescheduleErrors.reschedule_reason.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRescheduleModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={rescheduleSubmitting} className="btn-primary">
              {rescheduleSubmitting ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </Modal>

{/* Confirm Action Modal */}
      <Modal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.action === 'confirmed' ? 'Confirmation' : confirmAction?.action === 'cancelled' ? 'Cancellation' : confirmAction?.action === 'checked_in' ? 'Check-In' : 'Completion'}
        maxWidth="max-w-sm"
      >
        {confirmAction && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Are you sure you want to <span className="font-semibold">{confirmAction.action === 'checked_in' ? 'check in' : confirmAction.action}</span> the appointment for{' '}
              <span className="font-semibold">{confirmAction.appointment.customer?.first_name} {confirmAction.appointment.customer?.last_name}</span>?
            </p>
            {confirmAction.action === 'cancelled' && (
              <div>
                <label className="label">Reason for Cancellation <span className="text-red-600">*</span></label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Explain why the appointment is being cancelled — this will be sent to the customer via notification and SMS."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmAction(null)} className="btn-secondary">Go Back</button>
              <button
                onClick={() => updateStatus(confirmAction.appointment.id, confirmAction.action, confirmAction.action === 'cancelled' ? actionReason.trim() : undefined)}
                disabled={confirmAction.action === 'cancelled' && !actionReason.trim()}
                className={confirmAction.action === 'cancelled' ? 'btn-danger' : 'btn-primary'}
              >
                {confirmAction.action === 'confirmed' ? 'Confirm' : confirmAction.action === 'cancelled' ? 'Cancel Appointment' : confirmAction.action === 'checked_in' ? 'Check In' : 'Mark Complete'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => { setCheckoutOpen(false); setCheckoutAppointment(null); }}
        onSuccess={() => { fetchAppointments(); toast.success('Appointment completed and payment recorded'); }}
        appointmentId={checkoutAppointment?.id}
        customerId={checkoutAppointment?.customer?.id ?? 0}
        staffId={checkoutAppointment?.staff?.id ?? 0}
        services={
          checkoutAppointment
            ? checkoutAppointment.services && checkoutAppointment.services.length > 0
              ? checkoutAppointment.services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  price: s.price ?? servicesList.find((x) => x.id === s.id)?.price ?? 0,
                  duration: s.duration_minutes ?? servicesList.find((x) => x.id === s.id)?.duration ?? 0,
                  category: '',
                  staff: [],
                }))
              : [{
                  id: checkoutAppointment.service.id,
                  name: checkoutAppointment.service.name,
                  price: servicesList.find((s) => s.id === checkoutAppointment.service.id)?.price ?? 0,
                  duration: servicesList.find((s) => s.id === checkoutAppointment.service.id)?.duration ?? 0,
                  category: '',
                  staff: [],
                }]
            : []
        }
      />
    </div>
  );
}
