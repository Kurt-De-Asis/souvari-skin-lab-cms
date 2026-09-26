import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi, staffApi } from '@/api';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import CustomerDetailDrawer from '@/components/admin/CustomerDetailDrawer';

dayjs.extend(isoWeek);

interface StaffSchedule {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_active?: boolean;
}

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer: { first_name: string; last_name: string } | null;
  service: { name: string } | null;
  services?: { name: string }[];
}

export default function Schedule() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => dayjs().startOf('isoWeek'));
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const staffId = user?.staff?.id;

  useEffect(() => {
    if (staffId) fetchData();
  }, [staffId, weekStart]);

  const fetchData = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const [scheduleRes, appointRes] = await Promise.all([
        staffApi.getSchedules(staffId),
        appointmentsApi.list({
          date_from: weekStart.format('YYYY-MM-DD'),
          date_to: weekStart.add(6, 'day').format('YYYY-MM-DD'),
          staff_id: String(staffId),
        }),
      ]);
      setSchedules(scheduleRes.data.data || []);
      setAppointments(appointRes.data.data || []);
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const getScheduleForDay = (day: dayjs.Dayjs) =>
    schedules.find((s) => s.day_of_week === DAYS[day.day()]);

  const isOffDay = (s?: StaffSchedule) =>
    !s || s.is_active === false || (s.start_time === '00:00' && s.end_time === '00:00');

  const getAppointmentsForDay = (date: dayjs.Dayjs) =>
    appointments.filter((a) => dayjs(a.appointment_date).isSame(date, 'day'));

  const goToPreviousWeek = () => setWeekStart((prev) => prev.subtract(1, 'week'));
  const goToNextWeek = () => setWeekStart((prev) => prev.add(1, 'week'));
  const goToCurrentWeek = () => setWeekStart(dayjs().startOf('isoWeek'));

  const formatTime = (time: string) => dayjs(`2000-01-01 ${time}`).format('h:mm A');

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">My Schedule</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {weekStart.format('MMM D')} - {weekStart.add(6, 'day').format('MMM D, YYYY')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={goToPreviousWeek} className="btn-secondary p-2">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToCurrentWeek} className="btn-secondary text-xs">
            Today
          </button>
          <button onClick={goToNextWeek} className="btn-secondary p-2">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {days.map((day) => {
          const daySchedule = getScheduleForDay(day);
          const dayOff = isOffDay(daySchedule);
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = day.isSame(dayjs(), 'day');

          return (
            <div
              key={day.format('YYYY-MM-DD')}
              className={`card p-4 min-h-[300px] relative ${
                isToday ? 'ring-2 ring-primary-500 border-primary-200' : ''
              }`}
            >
              <div className="text-center mb-3">
                <p className="text-xs font-medium text-neutral-500 uppercase">
                  {day.format('ddd')}
                </p>
                <p
                  className={`text-lg font-bold ${
                    isToday ? 'text-primary-600' : 'text-neutral-900'
                  }`}
                >
                  {day.format('D')}
                </p>
              </div>

              {dayOff ? (
                <p className="text-xs text-neutral-400 text-center mb-3">Day off</p>
              ) : (
                daySchedule && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <Clock size={12} />
                      <span>
                        {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                      </span>
                    </div>
                    {daySchedule.break_start && daySchedule.break_end && (
                      <div className="text-xs text-neutral-400 ml-4">
                        Break: {formatTime(daySchedule.break_start)} -{' '}
                        {formatTime(daySchedule.break_end)}
                      </div>
                    )}
                  </div>
                )
              )}

              <div className="space-y-1.5">
                {dayAppointments.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 text-center">No appointments</p>
                ) : (
                  dayAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-1.5 rounded bg-primary-50 border border-primary-100"
                    >
                      <p className="text-[11px] font-medium text-neutral-900 truncate">
                        {dayjs(`2000-01-01 ${appt.start_time}`).format('h:mm A')}
                      </p>
                      <p className="text-[10px] text-neutral-600 truncate">
                        {appt.customer ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(appt.customer)}
                            className="font-medium text-neutral-900 hover:text-primary-600 underline decoration-neutral-300 hover:decoration-primary-600 transition text-left"
                            title="View complete client records, notes, allergies, and history"
                          >
                            {appt.customer.first_name} {appt.customer.last_name}
                          </button>
                        ) : (
                          'Customer'
                        )}
                      </p>
                      <p className="text-[10px] text-neutral-500 truncate">
                        {appt.service?.name || 'Service'}
                        {appt.services && appt.services.length > 1 ? ` +${appt.services.length - 1}` : ''}
                      </p>
                      <StatusBadge status={appt.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        open={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  );
}
