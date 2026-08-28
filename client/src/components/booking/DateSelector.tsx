import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  baseDate?: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DateSelector({
  selectedDate,
  onSelectDate,
  baseDate,
  onPrevWeek,
  onNextWeek,
}: DateSelectorProps) {
  const dates = useMemo(() => {
    const start = baseDate ? dayjs(baseDate) : dayjs();
    return Array.from({ length: 7 }, (_, i) => {
      const d = start.add(i, 'day');
      return {
        value: d.format('YYYY-MM-DD'),
        dayName: DAY_NAMES[d.day()],
        dayNum: d.date(),
        month: MONTH_NAMES[d.month()],
        isToday: d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
      };
    });
  }, [baseDate]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">Select a Date</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevWeek}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition text-neutral-500"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNextWeek}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition text-neutral-500"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {dates.map((d) => {
          const isSelected = d.value === selectedDate;
          return (
            <button
              key={d.value}
              onClick={() => onSelectDate(d.value)}
              className={`flex flex-col items-center min-w-[72px] px-3 py-3 rounded-xl border transition flex-shrink-0 ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <span className={`text-xs font-medium ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                {d.dayName}
              </span>
              <span className="text-lg font-semibold mt-0.5">{d.dayNum}</span>
              <span className={`text-xs ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>{d.month}</span>
              {d.isToday && (
                <div className={`w-1 h-1 rounded-full mt-1.5 ${isSelected ? 'bg-white' : 'bg-neutral-900'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
