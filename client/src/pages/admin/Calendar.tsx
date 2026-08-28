import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { appointmentsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

dayjs.extend(isoWeek);

type ViewMode = 'day' | 'week' | 'month';

interface CalendarAppointment {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer: { id: number; first_name: string; last_name: string };
  staff: { id: number; first_name: string; last_name: string };
  service: { id: number; name: string };
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500',
  completed: 'bg-blue-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  checked_in: 'bg-indigo-500',
  in_progress: 'bg-purple-500',
  no_show: 'bg-red-400',
};

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9AM - 6PM

export default function Calendar() {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);

  const dateRange = useMemo(() => {
    if (view === 'day') {
      return { start: currentDate.startOf('day'), end: currentDate.endOf('day') };
    }
    if (view === 'week') {
      return { start: currentDate.startOf('isoWeek'), end: currentDate.endOf('isoWeek') };
    }
    return { start: currentDate.startOf('month'), end: currentDate.endOf('month') };
  }, [currentDate, view]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsApi.getCalendar({
        start_date: dateRange.start.format('YYYY-MM-DD'),
        end_date: dateRange.end.format('YYYY-MM-DD'),
      });
      setAppointments(data.data?.appointments || data.data?.data || []);
    } catch {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const navigate = (direction: 'prev' | 'next') => {
    const unit = view === 'day' ? 'day' : view === 'week' ? 'week' : 'month';
    setCurrentDate((prev) => direction === 'prev' ? prev.subtract(1, unit) : prev.add(1, unit));
  };

  const goToday = () => setCurrentDate(dayjs());

  const headerLabel = useMemo(() => {
    if (view === 'day') return currentDate.format('dddd, MMMM D, YYYY');
    if (view === 'week') return `${dateRange.start.format('MMM D')} - ${dateRange.end.format('MMM D, YYYY')}`;
    return currentDate.format('MMMM YYYY');
  }, [currentDate, view, dateRange]);

  const getAppointmentsForHour = (date: dayjs.Dayjs, hour: number) => {
    const dateStr = date.format('YYYY-MM-DD');
    return appointments.filter((apt) => {
      if (dayjs(apt.date).format('YYYY-MM-DD') !== dateStr) return false;
      const aptHour = parseInt(apt.start_time.split(':')[0], 10);
      return aptHour === hour;
    });
  };

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter((apt) => dayjs(apt.date).format('YYYY-MM-DD') === dateStr);
  };

  const getTopPosition = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return ((h - 9) * 60 + m) * (64 / 60); // 64px per hour
  };

  const getHeight = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(diff * (64 / 60), 24);
  };

  const weekDays = useMemo(() => {
    const start = currentDate.startOf('isoWeek');
    return Array.from({ length: 6 }, (_, i) => start.add(i, 'day')); // Mon-Sat
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = currentDate.startOf('month').startOf('isoWeek');
    const end = currentDate.endOf('month').endOf('isoWeek');
    const days: dayjs.Dayjs[] = [];
    let d = start;
    while (d.isBefore(end) || d.isSame(end, 'day')) {
      days.push(d);
      d = d.add(1, 'day');
    }
    return days;
  }, [currentDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Calendar</h1>
          <p className="text-sm text-neutral-500 mt-1">Clinic appointment calendar</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-neutral-300 overflow-hidden">
            {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-medium capitalize transition ${
                  view === v ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('prev')} className="btn-secondary !px-3 !py-2">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => navigate('next')} className="btn-secondary !px-3 !py-2">
            <ChevronRight size={18} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900 ml-2">{headerLabel}</h2>
        </div>
        <button onClick={goToday} className="btn-secondary text-sm">Today</button>
      </div>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <div className="card !p-0 overflow-hidden">
          {/* Day View */}
          {view === 'day' && (
            <div className="overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-[72px_1fr] min-w-0">
                {HOURS.map((hour) => {
                  const hourAppts = getAppointmentsForHour(currentDate, hour);
                  return (
                    <div key={hour} className="contents">
                      <div className="text-xs text-neutral-400 text-right pr-3 pt-1 border-r border-neutral-200" style={{ height: 64 }}>
                        {dayjs().hour(hour).minute(0).format('h A')}
                      </div>
                      <div className="relative border-b border-neutral-100" style={{ height: 64 }}>
                        {hourAppts.map((apt) => {
                          const top = getTopPosition(apt.start_time);
                          const height = getHeight(apt.start_time, apt.end_time);
                          return (
                            <button
                              key={apt.id}
                              onClick={() => setSelectedAppointment(apt)}
                              className={`absolute left-1 right-1 rounded-lg px-2 py-1 text-left text-xs text-white overflow-hidden shadow-sm hover:opacity-90 transition ${STATUS_COLORS[apt.status] || 'bg-neutral-400'}`}
                              style={{ top: 0, height, zIndex: 10 }}
                            >
                              <p className="font-semibold truncate">{apt.start_time} - {apt.end_time}</p>
                              <p className="truncate">{apt.customer?.first_name} {apt.customer?.last_name}</p>
                              <p className="truncate opacity-80">{apt.service?.name}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {view === 'week' && (
            <div className="overflow-auto max-h-[70vh]">
              <div className="grid grid-cols-[72px_repeat(6,1fr)] min-w-[700px]">
                {/* Header */}
                <div className="border-b border-neutral-200 p-2" />
                {weekDays.map((day) => (
                  <div key={day.format('YYYY-MM-DD')} className={`border-b border-neutral-200 p-2 text-center ${day.isSame(dayjs(), 'day') ? 'bg-primary-50' : ''}`}>
                    <p className="text-xs text-neutral-500 uppercase">{day.format('ddd')}</p>
                    <p className={`text-sm font-semibold ${day.isSame(dayjs(), 'day') ? 'text-primary-600' : 'text-neutral-900'}`}>
                      {day.format('D')}
                    </p>
                  </div>
                ))}

                {/* Grid */}
                {HOURS.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="text-xs text-neutral-400 text-right pr-3 pt-1 border-r border-neutral-200" style={{ height: 64 }}>
                      {dayjs().hour(hour).minute(0).format('h A')}
                    </div>
                    {weekDays.map((day) => {
                      const hourAppts = getAppointmentsForHour(day, hour);
                      return (
                        <div key={`${day.format('YYYY-MM-DD')}-${hour}`} className={`relative border-b border-r border-neutral-100 ${day.isSame(dayjs(), 'day') ? 'bg-primary-50/20' : ''}`} style={{ height: 64 }}>
                          {hourAppts.map((apt) => {
                            const height = getHeight(apt.start_time, apt.end_time);
                            return (
                              <button
                                key={apt.id}
                                onClick={() => setSelectedAppointment(apt)}
                                className={`absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-left text-[10px] text-white overflow-hidden shadow-sm hover:opacity-90 transition ${STATUS_COLORS[apt.status] || 'bg-neutral-400'}`}
                                style={{ top: 0, height, zIndex: 10 }}
                              >
                                <p className="font-semibold truncate">{apt.start_time}</p>
                                <p className="truncate">{apt.customer?.first_name} {apt.customer?.last_name?.charAt(0)}.</p>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month View */}
          {view === 'month' && (
            <div>
              <div className="grid grid-cols-6 border-b border-neutral-200">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="p-3 text-center text-xs font-medium text-neutral-500 uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-6">
                {monthDays.map((day) => {
                  const dateStr = day.format('YYYY-MM-DD');
                  const dayAppts = getAppointmentsForDate(dateStr);
                  const isCurrentMonth = day.month() === currentDate.month();
                  const isToday = day.isSame(dayjs(), 'day');
                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[80px] p-2 border-b border-r border-neutral-100 transition hover:bg-neutral-50 cursor-pointer ${
                        !isCurrentMonth ? 'bg-neutral-50/50' : ''
                      }`}
                      onClick={() => { setCurrentDate(day); setView('day'); }}
                    >
                      <p className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-600 bg-primary-50 w-6 h-6 rounded-full flex items-center justify-center' : isCurrentMonth ? 'text-neutral-900' : 'text-neutral-300'}`}>
                        {day.format('D')}
                      </p>
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 3).map((apt) => (
                          <div key={apt.id} className={`flex items-center gap-1 text-[10px] text-white rounded px-1 py-0.5 ${STATUS_COLORS[apt.status] || 'bg-neutral-400'}`}>
                            <span className="truncate">{apt.start_time} {apt.customer?.first_name}</span>
                          </div>
                        ))}
                        {dayAppts.length > 3 && (
                          <p className="text-[10px] text-neutral-500 pl-1">+{dayAppts.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
        <span className="font-medium mr-1">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {status.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Appointment Detail Modal */}
      <Modal open={selectedAppointment !== null} onClose={() => setSelectedAppointment(null)} title="Appointment Details">
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Customer</p>
                <p className="text-sm font-medium text-neutral-900">{selectedAppointment.customer?.first_name} {selectedAppointment.customer?.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Staff</p>
                <p className="text-sm font-medium text-neutral-900">{selectedAppointment.staff?.first_name} {selectedAppointment.staff?.last_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Service</p>
                <p className="text-sm font-medium text-neutral-900">{selectedAppointment.service?.name}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Status</p>
                <StatusBadge status={selectedAppointment.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Date</p>
                <p className="text-sm font-medium text-neutral-900">{dayjs(selectedAppointment.date).format('MMMM D, YYYY')}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Time</p>
                <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                  <Clock size={14} className="text-neutral-400" />
                  {selectedAppointment.start_time} - {selectedAppointment.end_time}
                </p>
              </div>
            </div>
            {selectedAppointment.notes && (
              <div>
                <p className="text-xs text-neutral-500 mb-1">Notes</p>
                <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3">{selectedAppointment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
