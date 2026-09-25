import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Drawer from '../../ui/Drawer';
import type { BookingAppointment, ServiceOption, StaffMember } from './types';

export interface EditAppointmentPayload {
  service_id?: number;
  staff_id?: number;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string | null;
  reschedule_reason?: string;
}

interface EditAppointmentDrawerProps {
  appointment: BookingAppointment | null;
  services: ServiceOption[];
  staff: StaffMember[];
  onClose: () => void;
  onSave: (id: number, data: EditAppointmentPayload) => Promise<boolean>;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function EditAppointmentDrawer({
  appointment,
  services,
  staff,
  onClose,
  onSave,
}: EditAppointmentDrawerProps) {
  const [serviceId, setServiceId] = useState(0);
  const [staffId, setStaffId] = useState(0);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const TODAY = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (!appointment) return;
    setServiceId(appointment.service.id);
    setStaffId(appointment.staff.id);
    setDate(dayjs(appointment.date).format('YYYY-MM-DD'));
    setStartTime(appointment.start_time);
    setEndTime(appointment.end_time);
    setNotes(appointment.notes ?? '');
    setRescheduleReason('');
  }, [appointment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const staffOptions = useMemo(() => {
    let options = staff.filter((s) => s.status !== 'inactive');
    if (options.length === 0) options = staff;
    if (appointment && !options.some((s) => s.id === appointment.staff.id)) {
      options = [
        { id: appointment.staff.id, first_name: appointment.staff.first_name, last_name: appointment.staff.last_name },
        ...options,
      ];
    }
    return options;
  }, [staff, appointment]);

  const handleServiceChange = (id: number) => {
    setServiceId(id);
    setEndTime(addMinutes(startTime, selectedService?.duration ?? 30));
  };

  if (!appointment) return null;

  const rescheduled =
    date !== dayjs(appointment.date).format('YYYY-MM-DD') || startTime !== appointment.start_time;
  const reasonRequired = rescheduled && !rescheduleReason.trim();
  const invalidTime = !startTime || !endTime || startTime >= endTime;
  const canSubmit = !invalidTime && !reasonRequired && (staffId > 0 || staffOptions.length === 0) && !submitting;

  const handleSubmit = async () => {
    if (!appointment || invalidTime) return;
    setSubmitting(true);
    try {
      const payload: EditAppointmentPayload = {
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || null,
      };
      if (serviceId !== appointment.service.id) payload.service_id = serviceId;
      if (staffId !== appointment.staff.id) payload.staff_id = staffId;
      if (rescheduled) payload.reschedule_reason = rescheduleReason.trim();
      await onSave(appointment.id, payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={!!appointment}
      onClose={onClose}
      title="Reschedule / Edit"
      subtitle={`${appointment.customer.first_name} ${appointment.customer.last_name} · ${appointment.services && appointment.services.length > 1 ? `${appointment.services.length} services` : appointment.service.name}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Service{appointment.services && appointment.services.length > 1 ? 's' : ''}</label>
            {appointment.services && appointment.services.length > 1 ? (
              <div className="flex flex-wrap gap-1.5 border border-neutral-200 bg-neutral-50 p-2.5">
                {appointment.services.map((s) => (
                  <span key={s.id} className="bg-neutral-900 text-white text-xs font-medium px-2 py-1 rounded-md">
                    {s.name}
                    {s.duration_minutes ? <span className="text-neutral-300 font-normal ml-1">· {s.duration_minutes} min</span> : null}
                  </span>
                ))}
              </div>
            ) : (
              <select
                className="select-field"
                value={serviceId}
                onChange={(e) => handleServiceChange(Number(e.target.value))}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">Specialist</label>
            <select
              className="select-field"
              value={staffId}
              onChange={(e) => setStaffId(Number(e.target.value))}
            >
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="label">Date</label>
            <input
              type="date"
              className="input-field"
              min={TODAY}
              value={date}
              onChange={(e) => {
                const v = e.target.value;
                setDate(v && v < TODAY ? TODAY : v);
              }}
            />
          </div>
          <div>
            <label className="label">Start</label>
            <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="label">End</label>
            <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Optional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <label className="label">
            Message to Customer {rescheduled && <span className="text-red-600">*</span>}
          </label>
          <textarea
            className="input-field"
            rows={3}
            placeholder={rescheduled ? 'Explain the reason for the reschedule — this is sent to the customer.' : 'Optional message (required only when the date or time changes)'}
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
          />
          {reasonRequired && <p className="text-xs text-red-600 mt-1">A reschedule message is required when the date or time changes.</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Drawer>
  );
}