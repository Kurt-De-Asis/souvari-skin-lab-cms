import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi, servicesApi, staffApi } from '@/api';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import CustomerDetailDrawer from '@/components/admin/CustomerDetailDrawer';
import CreateBookingDrawer from '@/components/booking/admin/CreateBookingDrawer';
import type { ServiceOption } from '@/components/booking/admin/types';

dayjs.extend(isoWeek);

interface StaffSchedule {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
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
  const [createServices, setCreateServices] = useState<ServiceOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState('');
  const [createPrefill, setCreatePrefill] = useState<{ staff_id: number; start_time: string } | null>(null);

  const staffId = user?.staff?.id;

  useEffect(() => {
    if (staffId) fetchData();
  }, [staffId, weekStart]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const all: any[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const { data } = await servicesApi.list({ page: String(page), limit: '100', status: 'active' });
          const pag = data.data?.pagination;
          totalPages = pag?.totalPages || 1;
          const list = data.data?.data || data.data?.services || [];
          if (Array.isArray(list)) all.push(...list);
          page++;
        } while (page <= totalPages);
        setCreateServices(all.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? null,
          price: Number(s.price) || 0,
          duration: Number(s.duration_minutes) || 0,
          category: s.category || 'other',
          staff: (s.service_staff ?? []).map((ss: any) => ss.staff).filter(Boolean),
        })));
      } catch {
        setCreateServices([]);
      }
    };
    fetchServices();
  }, []);

  const fetchData = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const [scheduleRes, appointRes] = await Promise.all([
        staffApi.getSchedules(staffId),
        appointmentsApi.list({
          start_date: weekStart.format('YYYY-MM-DD'),
          end_date: weekStart.add(6, 'day').format('YYYY-MM-DD'),
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

  const getScheduleForDay = (dayOfWeek: number) =>
    schedules.find((s) => s.day_of_week === dayOfWeek);

  const getAppointmentsForDay = (date: dayjs.Dayjs) =>
    appointments.filter((a) => dayjs(a.appointment_date).isSame(date, 'day'));

  const goToPreviousWeek = () => setWeekStart((prev) => prev.subtract(1, 'week'));
  const goToNextWeek = () => setWeekStart((prev) => prev.add(1, 'week'));
  const goToCurrentWeek = () => setWeekStart(dayjs().startOf('isoWeek'));

  const formatTime = (time: string) => dayjs(`2000-01-01 ${time}`).format('h:mm A');

  const openCreateFor = (date?: dayjs.Dayjs) => {
    const today = dayjs();
    const target = date && date.isBefore(today, 'day') ? today : (date ?? today);
    setCreateDate(target.format('YYYY-MM-DD'));
    setCreatePrefill(staffId ? { staff_id: staffId, start_time: '' } : null);
    setCreateOpen(true);
  };

  const handleCreate = async (payload: any): Promise<boolean> => {
    try {
      await appointmentsApi.createGroup({
        ...payload,
        service_ids: Array.isArray(payload.service_ids) ? payload.service_ids : [payload.service_id],
      });
      toast.success(payload.payment ? 'Appointment created and payment recorded' : 'Appointment created');
      setCreateOpen(false);
      fetchData();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create appointment');
      return false;
    }
  };

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
          <button onClick={() => openCreateFor()} className="btn-primary">
            <Plus size={16} />
            New Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {days.map((day) => {
          const daySchedule = getScheduleForDay(day.day());
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = day.isSame(dayjs(), 'day');

          return (
            <div
              key={day.format('YYYY-MM-DD')}
              className={`card p-4 min-h-[300px] relative ${
                isToday ? 'ring-2 ring-primary-500 border-primary-200' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => openCreateFor(day)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full border border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:border-neutral-900 flex items-center justify-center transition"
                title="Book an appointment for this day"
              >
                <Plus size={12} />
              </button>
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

              {daySchedule ? (
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
              ) : (
                <p className="text-xs text-neutral-400 text-center mb-3">Day off</p>
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

      {/* Create booking drawer (walk-in / existing client) */}
      <CreateBookingDrawer
        open={createOpen}
        date={createDate}
        prefill={createPrefill}
        services={createServices}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
