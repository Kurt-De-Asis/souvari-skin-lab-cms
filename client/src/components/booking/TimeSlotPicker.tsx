import { Clock, Loader2 } from 'lucide-react';

export interface SlotTime {
  start: string;
  end: string;
  staff_id: number;
  staff_name?: string;
  available?: boolean;
}

export interface StaffChip {
  id: number;
  name: string;
}

interface TimeSlotPickerProps {
  slots: SlotTime[];
  selectedSlot: SlotTime | null;
  onSelectSlot: (slot: SlotTime) => void;
  loading: boolean;
  staff?: StaffChip[];
  selectedStaffId?: number;
  onSelectStaff?: (staffId: number) => void;
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

function initials(name: string): string {
  const [first = '', last = ''] = name.split(' ');
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  loading,
  staff = [],
  selectedStaffId,
  onSelectStaff,
}: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">Pick a Specialist &amp; Time</h3>
        <div className="flex flex-wrap gap-2">
          {[0,1,2].map((i) => (
            <div key={i} className="h-10 w-32 bg-neutral-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-neutral-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900 mb-4">Pick a Time</h3>
        <div className="text-center py-10 border border-dashed border-neutral-300 bg-white">
          <Clock size={28} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-500">No available times for this date.</p>
          <p className="text-xs text-neutral-400 mt-1">Try selecting a different date.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">Pick a Specialist &amp; Time</h3>

      {staff.length > 1 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 mb-3">Choose your specialist</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSelectStaff?.(0)}
              className={`px-4 py-2.5 border text-sm font-medium transition ${
                !selectedStaffId
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
              }`}
            >
              All specialists
            </button>
            {staff.map((s) => {
              const isActive = selectedStaffId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectStaff?.(s.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 border text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                    {initials(s.name)}
                  </span>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map((slot, idx) => {
          const isSelected = selectedSlot?.start === slot.start && selectedSlot?.staff_id === slot.staff_id;
          return (
            <button
              key={`${slot.start}-${slot.staff_id}-${idx}`}
              onClick={() => onSelectSlot(slot)}
              className={`px-3 py-3 border text-sm font-medium transition ${
                isSelected
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
              }`}
            >
              {formatTime(slot.start)}
              {slot.staff_name && (
                <span className={`block text-xs font-normal mt-0.5 ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                  {slot.staff_name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}