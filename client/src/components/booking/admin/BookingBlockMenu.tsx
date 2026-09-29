import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, Lock, Plus, Settings2, UserCog, X } from 'lucide-react';
import { BOOKING_MENU_STATUSES, statusLabel, statusMeta } from '../../../utils/appointmentStatus';
import { staffWorksOnDate } from '../../../utils/staffSchedule';
import type { BookingAppointment, StaffMember } from './types';

interface BookingBlockMenuProps {
  appointment: BookingAppointment;
  staff: StaffMember[];
  busyStatus: string;
  onStatus: (appt: BookingAppointment, status: string, reason?: string) => Promise<boolean>;
  onAssignStaff: (appt: BookingAppointment, staffId: number) => Promise<boolean>;
  onAddService: (appt: BookingAppointment) => void;
  onEdit: (appt: BookingAppointment) => void;
  onDetails: (appt: BookingAppointment) => void;
  onClose: () => void;
}

type Panel = 'main' | 'status' | 'staff' | 'cancel';

/**
 * Inline dropdown attached to a calendar booking block. Gives staff and admins
 * everything they need without opening the details drawer: set status,
 * reassign the specialist, add or change services, or reschedule.
 *
 * Cancelling is the one action that needs input, so it expands into its own
 * panel with a required reason (the server rejects a reasonless cancellation).
 */
export default function BookingBlockMenu({
  appointment,
  staff,
  busyStatus,
  onStatus,
  onAssignStaff,
  onAddService,
  onEdit,
  onDetails,
  onClose,
}: BookingBlockMenuProps) {
  const [panel, setPanel] = useState<Panel>('main');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [pending, setPending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Every click inside the menu is a deliberate action, so stop the click from
  // reaching the grid track underneath (which would open the create-booking
  // drawer for the clicked slot).
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // Only specialists actually scheduled to work on this appointment's date can
  // be assigned — never someone on a day off. The current assignee stays in the
  // list (checked + disabled) so the menu always shows who owns the booking.
  const staffOptions = staff.filter(
    (s) => s.status !== 'inactive' && staffWorksOnDate(s, appointment.date)
  );
  const current = staff.find((s) => s.id === appointment.staff.id);
  if (current && !staffOptions.some((s) => s.id === current.id)) {
    staffOptions.unshift(current);
  }

  const runStatus = async (status: string, cancelReason?: string) => {
    setPending(true);
    try {
      const ok = await onStatus(appointment, status, cancelReason);
      if (ok) onClose();
    } finally {
      setPending(false);
    }
  };

  const runAssign = async (staffId: number) => {
    setPending(true);
    try {
      const ok = await onAssignStaff(appointment, staffId);
      if (ok) onClose();
    } finally {
      setPending(false);
    }
  };

  const submitCancel = () => {
    if (!reason.trim()) {
      setReasonError('Please give the customer a reason for cancelling.');
      return;
    }
    setReasonError('');
    runStatus('cancelled', reason.trim());
  };

  return (
    <div
      ref={rootRef}
      onClick={stop}
      onMouseDown={stop}
      // Positioned by the wrapper the grid renders around this menu, so the
      // root itself only needs to establish a containing block for the spinner.
      className="relative w-60 rounded-md border border-neutral-200 bg-white shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-neutral-900 text-white">
        <p className="text-[11px] font-semibold truncate">
          {appointment.customer.first_name} {appointment.customer.last_name}
        </p>
        <p className="text-[10px] text-neutral-300 whitespace-nowrap">
          {appointment.start_time}–{appointment.end_time}
        </p>
      </div>

      {panel === 'main' && (
        <div className="py-1">
          <MenuRow icon={<Settings2 size={13} />} label="Set status" hint={statusLabel(appointment.status)} onClick={() => setPanel('status')} />
          <MenuRow
            icon={<UserCog size={13} />}
            label="Assign specialist"
            hint={`${appointment.staff.first_name} ${appointment.staff.last_name}`}
            onClick={() => setPanel('staff')}
          />
          <MenuRow icon={<Plus size={13} />} label="Add or change services" onClick={() => { onAddService(appointment); onClose(); }} />
          <MenuRow icon={<Settings2 size={13} />} label="Edit or reschedule" onClick={() => { onEdit(appointment); onClose(); }} />
          <div className="my-1 border-t border-neutral-100" />
          <MenuRow icon={<ChevronRight size={13} />} label="View full details" onClick={() => { onDetails(appointment); onClose(); }} />
        </div>
      )}

      {panel === 'status' && (
        <div className="py-1">
          <PanelHeader title="Set status" onBack={() => setPanel('main')} />
          {BOOKING_MENU_STATUSES.map((status) => {
            const isCurrent = status === appointment.status;
            return (
              <button
                key={status}
                type="button"
                disabled={pending || isCurrent}
                onClick={() => (status === 'cancelled' ? setPanel('cancel') : runStatus(status))}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusMeta(status).dot }} />
                <span className="flex-1 text-neutral-800">{statusLabel(status)}</span>
                {isCurrent && <Check size={12} className="text-neutral-400" />}
              </button>
            );
          })}
          <p className="px-3 py-2 text-[10px] text-neutral-400 border-t border-neutral-100">
            Mark Complete stays on the details drawer so payment can be collected first.
          </p>
        </div>
      )}

      {panel === 'staff' && (
        <div className="py-1">
          <PanelHeader title="Assign specialist" onBack={() => setPanel('main')} />
          <div className="max-h-56 overflow-y-auto">
            {staffOptions.length === 0 && (
              <p className="px-3 py-2 text-xs text-neutral-400">No staff scheduled for this date.</p>
            )}
            {staffOptions.map((s) => {
              const isCurrent = s.id === appointment.staff.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={pending || isCurrent}
                  onClick={() => runAssign(s.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex-1 text-neutral-800 truncate">
                    {s.first_name} {s.last_name}
                  </span>
                  {isCurrent && <Check size={12} className="text-neutral-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {panel === 'cancel' && (
        <div className="p-3 space-y-2">
          <PanelHeader title="Cancel appointment" onBack={() => setPanel('main')} />
          <p className="text-[11px] text-neutral-500">
            The customer receives an automatic SMS with this reason.
          </p>
          <textarea
            autoFocus
            rows={2}
            className={`input-field !py-1.5 !text-xs ${reasonError ? 'border-red-400' : ''}`}
            placeholder="Explain why the appointment is being cancelled"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError('');
            }}
          />
          {reasonError && <p className="text-[11px] text-red-600">{reasonError}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => setPanel('main')} className="btn-secondary !py-1.5 !px-2.5 text-[11px]">
              Back
            </button>
            <button
              type="button"
              onClick={submitCancel}
              disabled={pending}
              className="btn-danger !py-1.5 !px-2.5 text-[11px]"
            >
              {pending ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
              Cancel booking
            </button>
          </div>
        </div>
      )}

      {busyStatus && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <Loader2 size={16} className="animate-spin text-neutral-600" />
        </div>
      )}
    </div>
  );
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-neutral-100">
      <button type="button" onClick={onBack} className="text-neutral-400 hover:text-neutral-700" title="Back">
        <ChevronLeft size={13} />
      </button>
      <p className="text-[11px] font-semibold text-neutral-900">{title}</p>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-800 transition hover:bg-neutral-50"
    >
      <span className="text-neutral-400 flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[10px] text-neutral-400 truncate max-w-[7rem]">{hint}</span>}
    </button>
  );
}

/** Rendered in place of the menu trigger once a booking is completed. */
export function CompletedLockBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded bg-white/25 px-1 py-0.5 text-[9px] font-semibold text-white"
      title="Completed appointments are locked and can no longer be edited"
    >
      <Lock size={9} /> Locked
    </span>
  );
}
