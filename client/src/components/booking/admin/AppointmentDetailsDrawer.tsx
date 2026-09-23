import { useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import Drawer from '../../ui/Drawer';
import StatusBadge from '../../ui/StatusBadge';
import { formatServicePrice } from '../../../utils/format';
import type { BookingAppointment, ServiceOption, StaffMember } from './types';

interface AppointmentDetailsDrawerProps {
  appointment: BookingAppointment | null;
  service?: ServiceOption;
  staff: StaffMember[];
  onClose: () => void;
  onEdit: (appt: BookingAppointment) => void;
  onStatus: (appt: BookingAppointment, status: string, reason?: string) => Promise<boolean>;
  onAssignStaff: (appt: BookingAppointment, staffId: number) => Promise<boolean>;
  onSelectCustomer?: (customer: { id: number; first_name: string; last_name: string; gender?: string; date_of_birth?: string; address?: string; user?: any }) => void;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

const REASSIGNABLE = ['pending', 'confirmed', 'checked_in', 'in_progress'];

export default function AppointmentDetailsDrawer({
  appointment,
  service,
  staff,
  onClose,
  onEdit,
  onStatus,
  onAssignStaff,
  onSelectCustomer,
}: AppointmentDetailsDrawerProps) {
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [busy, setBusy] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState(0);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    setCancelReason('');
    setCancelError('');
    setBusy('');
    setSelectedStaffId(appointment?.staff.id ?? 0);
    setAssigning(false);
  }, [appointment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!appointment) return null;

  const dateLabel = dayjs(appointment.date).format('MMMM D, YYYY');
  const showReschedule = ['pending', 'confirmed'].includes(appointment.status);
  const showCancel = ['pending', 'confirmed'].includes(appointment.status);
  const showConfirm = appointment.status === 'pending';
  const showCheckIn = appointment.status === 'confirmed';
  const showComplete = ['confirmed', 'checked_in', 'in_progress'].includes(appointment.status);
  const canReassign = REASSIGNABLE.includes(appointment.status);

  const staffOptions = staff.filter((s) => s.status !== 'inactive');
  if (appointment && !staffOptions.some((s) => s.id === appointment.staff.id)) {
    staffOptions.unshift({
      id: appointment.staff.id,
      first_name: appointment.staff.first_name,
      last_name: appointment.staff.last_name,
    });
  }
  if (staffOptions.length === 0) {
    staffOptions.push({
      id: appointment.staff.id,
      first_name: appointment.staff.first_name,
      last_name: appointment.staff.last_name,
    });
  }

  const currentStaff = staffOptions.find((s) => s.id === appointment.staff.id)
    || appointment.staff;

  const handleAssign = async (staffId: number) => {
    setSelectedStaffId(staffId);
    if (staffId === appointment.staff.id || staffId === 0) return;
    setAssigning(true);
    try {
      await onAssignStaff(appointment, staffId);
    } finally {
      setAssigning(false);
    }
  };

  const runAction = async (status: string, reason?: string) => {
    setBusy(status);
    try {
      await onStatus(appointment, status, reason);
    } finally {
      setBusy('');
    }
  };

  const handleCancel = () => {
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelError('Please type a reason to cancel this appointment.');
      return;
    }
    setCancelError('');
    runAction('cancelled', reason);
  };

  return (
    <Drawer
      open={!!appointment}
      onClose={onClose}
      title="Appointment Details"
      subtitle={`${appointment.customer.first_name} ${appointment.customer.last_name}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {/* Quick Client Clinical Record Card (Direct Access to Overview, Notes, Allergies & History) */}
        {appointment.customer && (
          <div className="bg-primary-50/60 rounded-lg p-4 border border-primary-200/60 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">Client Clinical Workspace</p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">{appointment.customer.first_name} {appointment.customer.last_name}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onSelectCustomer) onSelectCustomer(appointment.customer);
              }}
              className="btn-primary !py-1.5 !px-3 text-xs"
            >
              View Full Profile & Notes
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <StatusBadge status={appointment.status} />
          <span className="text-sm text-neutral-500">{appointment.start_time} - {appointment.end_time}</span>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Customer</dt>
            <dd className="text-right">
              <button
                type="button"
                onClick={() => {
                  if (appointment.customer && onSelectCustomer) {
                    onSelectCustomer(appointment.customer);
                  }
                }}
                className="font-medium text-neutral-900 hover:text-primary-600 underline decoration-neutral-300 hover:decoration-primary-600 transition"
                title="View complete client records, notes, allergies, and history"
              >
                {appointment.customer.first_name} {appointment.customer.last_name}
              </button>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Service{appointment.services && appointment.services.length > 1 ? 's' : ''}</dt>
            <dd className="text-neutral-900 font-medium text-right">
              {appointment.services && appointment.services.length > 0 ? (
                <div className="space-y-1">
                  {appointment.services.map((s) => (
                    <div key={s.id}>
                      {s.name}
                      {(s.duration_minutes !== undefined || s.price !== undefined) && (
                        <span className="block text-xs font-normal text-neutral-400 mt-0.5">
                          {[s.duration_minutes ? `${s.duration_minutes} min` : null, s.price !== undefined ? formatServicePrice(s.price) : null].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {appointment.service.name}
                  {service && <span className="block text-xs font-normal text-neutral-400 mt-0.5">{service.duration} min · {formatServicePrice(service.price)}</span>}
                </>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <dt className="text-neutral-500">Specialist</dt>
            <dd className="text-neutral-900 font-medium text-right min-w-[10rem]">
              {canReassign ? (
                <select
                  className="select-field !py-1.5 text-sm text-right"
                  value={selectedStaffId}
                  onChange={(e) => handleAssign(Number(e.target.value))}
                  disabled={assigning}
                >
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))}
                </select>
              ) : (
                <span>{currentStaff.first_name} {currentStaff.last_name}</span>
              )}
              {assigning && (
                <span className="flex items-center justify-end gap-1 text-xs text-neutral-400 mt-1">
                  <Loader2 size={12} className="animate-spin" /> Updating...
                </span>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Date</dt>
            <dd className="text-neutral-900 font-medium text-right">{dateLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Time</dt>
            <dd className="text-neutral-900 font-medium flex items-center gap-1 justify-end">
              <Clock size={14} className="text-neutral-400" />
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </dd>
          </div>
        </dl>

        {appointment.notes && (
          <div>
            <p className="text-xs text-neutral-500 mb-1">Notes</p>
            <p className="text-sm text-neutral-700 bg-neutral-50 rounded-md p-3">{appointment.notes}</p>
          </div>
        )}

        {/* Cancel confirmation */}
        {showCancel && (
          <div className="rounded-md border border-red-100 bg-red-50/50 p-4 space-y-3">
            <label className="label">Cancel reason <span className="text-red-600">*</span></label>
            <textarea
              className={`input-field ${cancelError ? 'border-red-400' : ''}`}
              rows={2}
              placeholder="Explain why the appointment is being cancelled"
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError('');
              }}
            />
            {cancelError && (
              <p className="text-xs text-red-600">{cancelError}</p>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy === 'cancelled'}
              className="btn-danger w-full"
            >
              {busy === 'cancelled' ? <Loader2 size={16} className="animate-spin" /> : null}
              Cancel Appointment
            </button>
          </div>
        )}

        {/* Actions */}
        {(showConfirm || showCheckIn || showComplete || showReschedule) && (
          <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4">
            {showConfirm && (
              <button onClick={() => runAction('confirmed')} disabled={!!busy} className="btn-primary w-full">
                {busy === 'confirmed' ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirm Appointment
              </button>
            )}
            {showCheckIn && (
              <button onClick={() => runAction('checked_in')} disabled={!!busy} className="btn-primary w-full">
                {busy === 'checked_in' ? <Loader2 size={16} className="animate-spin" /> : null}
                Check In
              </button>
            )}
            {showComplete && (
              <button onClick={() => runAction('completed')} disabled={!!busy} className="btn-primary w-full">
                {busy === 'completed' ? <Loader2 size={16} className="animate-spin" /> : null}
                Mark Complete
              </button>
            )}
            {showReschedule && (
              <button onClick={() => onEdit(appointment)} disabled={!!busy} className="btn-secondary w-full">
                Reschedule / Edit
              </button>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}