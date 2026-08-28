import { Clock } from 'lucide-react';

interface TimeSlot {
  start: string;
  end: string;
  staff_id: number;
  staff_name?: string;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  loading: boolean;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function TimeSlotPicker({ slots, selectedSlot, onSelectSlot, loading }: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Pick a Time</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-neutral-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Pick a Time</h3>
        <div className="text-center py-10 rounded-xl border border-dashed border-neutral-200">
          <Clock size={28} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-500">No available times for this date.</p>
          <p className="text-xs text-neutral-400 mt-1">Try selecting a different date.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-900 mb-4">Pick a Time</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map((slot, idx) => {
          const isSelected = selectedSlot?.start === slot.start && selectedSlot?.staff_id === slot.staff_id;
          return (
            <button
              key={`${slot.start}-${slot.staff_id}-${idx}`}
              onClick={() => onSelectSlot(slot)}
              className={`px-3 py-3 rounded-lg border text-sm font-medium transition ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
              }`}
            >
              {formatTime(slot.start)}
              {slot.staff_name && (
                <span className={`block text-xs font-normal mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
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
