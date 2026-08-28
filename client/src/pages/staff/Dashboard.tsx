import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer: { first_name: string; last_name: string } | null;
  service: { name: string } | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const { data } = await appointmentsApi.list({ date: today });
      setAppointments(data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const todayCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const firstName = user?.staff?.first_name || 'Staff';

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Here's your schedule for {dayjs().format('MMMM D, YYYY')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <CalendarDays className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{todayCount}</p>
            <p className="text-xs text-neutral-500">Today's Appointments</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
            <p className="text-xs text-neutral-500">Pending</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ClipboardList className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{confirmedCount}</p>
            <p className="text-xs text-neutral-500">Confirmed</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{completedCount}</p>
            <p className="text-xs text-neutral-500">Completed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Today's Schedule</h2>
              <Link to="/staff/appointments" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {appointments.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <AlertCircle className="h-10 w-10 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition"
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-semibold text-neutral-900">
                        {dayjs(`2000-01-01 ${appt.start_time}`).format('h:mm A')}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {appt.customer
                          ? `${appt.customer.first_name} ${appt.customer.last_name}`
                          : 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {appt.service?.name || 'Unknown Service'}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/staff/appointments"
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition"
              >
                <ClipboardList size={18} className="text-primary-600" />
                <span className="text-sm font-medium text-neutral-700">Manage Appointments</span>
              </Link>
              <Link
                to="/staff/schedule"
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition"
              >
                <CalendarDays size={18} className="text-primary-600" />
                <span className="text-sm font-medium text-neutral-700">View My Schedule</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
