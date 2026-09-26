import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  baseDate?: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  closedWeekdays?: string[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function DateSelector({
  selectedDate,
  onSelectDate,
  baseDate,
  onPrevWeek,
  onNextWeek,
  closedWeekdays = [],
}: DateSelectorProps) {
  const closedSet = useMemo(() => new Set(closedWeekdays.map((d) => d.toLowerCase())), [closedWeekdays]);

  const dates = useMemo(() => {
    const today = dayjs().startOf('day');
    const from = baseDate ? dayjs(baseDate) : today;
    const start = from.isBefore(today) ? today : from;
    return Array.from({ length: 7 }, (_, i) => {
      const d = start.add(i, 'day');
      return {
        value: d.format('YYYY-MM-DD'),
        dayName: DAY_NAMES[d.day()],
        dayNum: d.date(),
        month: MONTH_NAMES[d.month()],
        isToday: d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
        weekday: WEEKDAY_NAMES[d.day()],
      };
    });
  }, [baseDate]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">Select a Date</h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrevWeek}
            className="p-2.5 border border-neutral-200 bg-white hover:bg-neutral-100 transition text-neutral-500"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNextWeek}
            className="p-2.5 border border-neutral-200 bg-white hover:bg-neutral-100 transition text-neutral-500"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {dates.map((d) => {
          const isSelected = d.value === selectedDate;
          const isClosed = closedSet.has(d.weekday);
          if (isClosed) {
            return (
              <button
                key={d.value}
                type="button"
                disabled
                className="flex flex-col items-center min-w-[72px] px-3 py-3 border border-neutral-200 bg-neutral-100 text-neutral-300 cursor-not-allowed flex-shrink-0"
                title="Clinic closed on this day"
              >
                <span className="text-xs font-medium">{d.dayName}</span>
                <span className="text-lg font-semibold mt-0.5">{d.dayNum}</span>
                <span className="text-xs">{d.month}</span>
                <span className="text-[10px] mt-1">Closed</span>
              </button>
            );
          }
          return (
            <button
              key={d.value}
              onClick={() => onSelectDate(d.value)}
              className={`flex flex-col items-center min-w-[72px] px-3 py-3 border transition flex-shrink-0 ${
                isSelected
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <span className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                {d.dayName}
              </span>
              <span className="text-lg font-semibold mt-0.5">{d.dayNum}</span>
              <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>{d.month}</span>
              {d.isToday && (
                <div className={`w-1 h-1 mt-1.5 ${isSelected ? 'bg-white' : 'bg-primary-600'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
