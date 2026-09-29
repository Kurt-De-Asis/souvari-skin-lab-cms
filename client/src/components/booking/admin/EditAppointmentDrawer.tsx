import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Loader2, Lock, Plus, Search, X } from 'lucide-react';
import dayjs from 'dayjs';
import Drawer from '../../ui/Drawer';
import { formatServicePrice } from '../../../utils/format';
import formatCategory from '../../../utils/formatCategory';
import { isBookingEditable } from '../../../utils/appointmentStatus';
import { staffWorksOnDate } from '../../../utils/staffSchedule';
import type { BookingAppointment, ServiceOption, StaffMember } from './types';

export interface EditAppointmentPayload {
  service_id?: number;
  service_ids?: number[];
  staff_id?: number;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string | null;
  reschedule_reason?: string;
  discount_pct?: number;
  discount_reason?: string;
}

interface EditAppointmentDrawerProps {
  appointment: BookingAppointment | null;
  services: ServiceOption[];
  staff: StaffMember[];
  onClose: () => void;
  onSave: (id: number, data: EditAppointmentPayload) => Promise<boolean>;
}

function addMinutes(time: string, minutes: number): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Edit a booking in place: change its services, specialist, date, time, notes.
 *
 * The service list is fully editable — add or remove services and the block
 * length, price, and the customer's confirmation message all follow. `end_time`
 * is derived from `start_time` plus the total service duration rather than
 * being typed in, so the block can never disagree with what was booked.
 *
 * Completed appointments render read-only; the server rejects those edits too.
 */
export default function EditAppointmentDrawer({
  appointment,
  services,
  staff,
  onClose,
  onSave,
}: EditAppointmentDrawerProps) {
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const [initialServiceIds, setInitialServiceIds] = useState<number[]>([]);
  const [staffId, setStaffId] = useState(0);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  // Which appointment the current draft seed belongs to. Lets a late-arriving
  // services catalog finish seeding the selections without ever clobbering the
  // user's in-progress edits.
  const seedTargetRef = useRef<number | null>(null);

  const TODAY = dayjs().format('YYYY-MM-DD');
  const locked = !!appointment && !isBookingEditable(appointment.status);

  useEffect(() => {
    if (!appointment) {
      seedTargetRef.current = null;
      return;
    }
    // Seed from the full multi-service list when the booking has one; the
    // single-service legacy field is only a fallback.
    const ids =
      appointment.services && appointment.services.length > 0
        ? appointment.services.map((s) => s.id)
        : [appointment.service.id];
    const resolve = () =>
      ids
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is ServiceOption => !!s);

    const freshOpen = seedTargetRef.current !== appointment.id;
    if (freshOpen) {
      seedTargetRef.current = appointment.id;
      setInitialServiceIds(ids);
      setStaffId(appointment.staff.id);
      setDate(dayjs(appointment.date).format('YYYY-MM-DD'));
      setStartTime(appointment.start_time);
      setNotes(appointment.notes ?? '');
      setMessage('');
      setPickerOpen(false);
      setServiceQuery('');
      setActiveCategory('all');
    }
    setSelectedServices(resolve());
  }, [appointment?.id, services]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duration, 0),
    [selectedServices]
  );
  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );
  const derivedEndTime = addMinutes(startTime, totalDuration);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const s of services) {
      const c = s.category_name || s.category;
      if (c && !seen.includes(c)) seen.push(c);
    }
    return seen;
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    return services.filter((s) => {
      const c = s.category_name || s.category;
      if (activeCategory !== 'all' && c !== activeCategory) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q);
    });
  }, [services, serviceQuery, activeCategory]);

  const staffOptions = useMemo(() => {
    // Only specialists scheduled on the selected date are offered, so the
    // booking can never be moved to someone on a day off. Falls back to all
    // non-inactive members when nobody is scheduled so the drawer never
    // empties — the server still rejects an off-day assignment.
    let options = staff.filter((s) => s.status !== 'inactive' && staffWorksOnDate(s, date));
    if (options.length === 0) options = staff.filter((s) => s.status !== 'inactive');
    if (options.length === 0) options = staff;
    if (appointment && !options.some((s) => s.id === appointment.staff.id)) {
      options = [
        { id: appointment.staff.id, first_name: appointment.staff.first_name, last_name: appointment.staff.last_name },
        ...options,
      ];
    }
    return options;
  }, [staff, appointment, date]);

  if (!appointment) return null;

  const serviceIds = selectedServices.map((s) => s.id);
  const servicesChanged =
    serviceIds.length !== initialServiceIds.length ||
    serviceIds.some((id, i) => id !== initialServiceIds[i]);

  const rescheduled =
    date !== dayjs(appointment.date).format('YYYY-MM-DD') || startTime !== appointment.start_time;
  const reasonRequired = rescheduled && !message.trim();
  const invalidTime = !startTime || !derivedEndTime || startTime >= derivedEndTime;
  // Adding a service to a booking that has already been paid leaves a balance
  // to collect, which the POS modal raises at completion time.
  //
  // There is deliberately no discount control here. The POS modal at completion
  // is the only place a discount is applied, and any discount it grants is
  // written back onto the booking then, so an edit form has nothing to edit.
  const willCreateBalance = servicesChanged && (appointment.paid_amount ?? 0) > 0;
  const canSubmit =
    !locked &&
    selectedServices.length > 0 &&
    !invalidTime &&
    !reasonRequired &&
    (staffId > 0 || staffOptions.length === 0) &&
    !submitting;

  const addService = (s: ServiceOption) => {
    setSelectedServices((prev) => (prev.some((x) => x.id === s.id) ? prev : [...prev, s]));
  };

  const removeService = (id: number) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async () => {
    if (!appointment || invalidTime || locked) return;
    setSubmitting(true);
    try {
      const payload: EditAppointmentPayload = {
        appointment_date: date,
        start_time: startTime,
        end_time: derivedEndTime,
        notes: notes.trim() || null,
      };
      if (servicesChanged) payload.service_ids = serviceIds;
      // Keep the legacy single-service field in sync so older consumers that
      // read `service_id` see the right primary service.
      if (selectedServices.length > 0 && serviceIds[0] !== appointment.service.id) {
        payload.service_id = serviceIds[0];
      }
      if (staffId !== appointment.staff.id) payload.staff_id = staffId;
      // The server requires this on a reschedule and uses it as the body of the
      // service-change notice, so send it whenever the user wrote one.
      if (message.trim()) payload.reschedule_reason = message.trim();
      await onSave(appointment.id, payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={!!appointment}
      onClose={onClose}
      title="Edit Appointment"
      subtitle={`${appointment.customer.first_name} ${appointment.customer.last_name} · ${dayjs(appointment.date).format('MMM D, YYYY')} at ${appointment.start_time}`}
      maxWidth="max-w-xl"
    >
      {locked ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <Lock size={16} className="text-neutral-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">This appointment is completed</p>
              <p className="text-xs text-neutral-500 mt-1">
                Completed bookings are locked and can no longer be edited, rescheduled, or have their
                services or specialist changed.
              </p>
            </div>
          </div>
          <ReadOnlySummary appointment={appointment} />
          <div className="flex justify-end">
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Services</label>
              <span className="text-[11px] text-neutral-400">
                {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} · {totalDuration} min · {formatServicePrice(totalPrice)}
              </span>
            </div>

            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedServices.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[11px] font-medium pl-2 pr-1 py-0.5 rounded-md">
                    {s.name}
                    <span className="text-neutral-300 font-normal">· {s.duration}m</span>
                    <button onClick={() => removeService(s.id)} className="p-0.5 rounded hover:bg-white/20 transition" title="Remove service">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {pickerOpen ? (
              <div>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    className="input-field pl-8 !py-1.5 !text-xs"
                    placeholder="Search services to add..."
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                  />
                </div>
                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['all', ...categories].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2 py-1 rounded-full text-[11px] font-medium transition ${
                          activeCategory === cat
                            ? 'bg-neutral-900 text-white'
                            : 'bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {cat === 'all' ? 'All' : formatCategory(cat)}
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredServices.map((s) => {
                    const added = selectedServices.some((x) => x.id === s.id);
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-2.5 p-2 rounded-md border transition ${
                          added ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-neutral-900">{s.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-400">
                            <Clock size={10} />
                            <span>{s.duration} min</span>
                            <span className="mx-0.5">·</span>
                            <span className="truncate">{formatCategory(s.category_name || s.category)}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-neutral-900 whitespace-nowrap">{formatServicePrice(s.price)}</span>
                        <button
                          onClick={() => (added ? removeService(s.id) : addService(s))}
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                            added
                              ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                              : 'bg-neutral-900 text-white hover:bg-neutral-700'
                          }`}
                        >
                          {added ? <X size={11} /> : <Plus size={11} />}
                          {added ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                  {filteredServices.length === 0 && (
                    <p className="text-[11px] text-neutral-400 py-3 text-center">No services match your search.</p>
                  )}
                </div>
                <button onClick={() => setPickerOpen(false)} className="text-[11px] text-neutral-500 hover:text-neutral-700 mt-2">
                  Done adding services
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full border border-dashed border-neutral-300 rounded-md py-2 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition"
              >
                <Plus size={13} className="inline mr-1" />
                {selectedServices.length > 0 ? 'Add another service' : 'Add a service'}
              </button>
            )}
            {servicesChanged && (
              <p className="text-[11px] text-primary-600 mt-1.5">
                The session will be extended to {derivedEndTime} and the price re-quoted for the customer.
              </p>
            )}
            {willCreateBalance && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-1.5">
                ₱{(appointment.paid_amount ?? 0).toLocaleString()} has already been collected. The added
                service will show as a balance to settle when this booking is marked complete.
              </p>
            )}
          </div>

          {/* Specialist */}
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

          {/* Date / time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
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
              <label className="label">End <span className="text-neutral-400 font-normal">(from services)</span></label>
              <input type="time" className="input-field bg-neutral-50 text-neutral-500" value={derivedEndTime} readOnly tabIndex={-1} />
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
              placeholder={
                rescheduled
                  ? 'Explain the reason for the reschedule — this is sent to the customer.'
                  : 'Optional message sent to the customer when the services change.'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {reasonRequired && <p className="text-xs text-red-600 mt-1">A message is required when the date or time changes.</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function ReadOnlySummary({ appointment }: { appointment: BookingAppointment }) {
  const services =
    appointment.services && appointment.services.length > 0
      ? appointment.services
      : [{ id: appointment.service.id, name: appointment.service.name }];
  return (
    <dl className="space-y-2 text-sm border border-neutral-200 rounded-md p-4">
      <div className="flex justify-between gap-4">
        <dt className="text-neutral-500">Services</dt>
        <dd className="text-neutral-900 font-medium text-right">{services.map((s) => s.name).join(', ')}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-neutral-500">Specialist</dt>
        <dd className="text-neutral-900 font-medium">{appointment.staff.first_name} {appointment.staff.last_name}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-neutral-500">Time</dt>
        <dd className="text-neutral-900 font-medium">{appointment.start_time} – {appointment.end_time}</dd>
      </div>
    </dl>
  );
}
