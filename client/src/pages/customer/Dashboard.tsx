import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, Bell, DollarSign, Clock, ArrowRight, User } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi, notificationsApi, transactionsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [apptRes, notifRes, txRes] = await Promise.allSettled([
          appointmentsApi.list({ status: 'upcoming', limit: '1', sort: 'date:asc', ...(user?.customer?.id ? { customer_id: String(user.customer.id) } : {}) }),
          notificationsApi.list({ limit: '5', sort: 'created_at:desc' }),
          transactionsApi.list({ limit: '5', sort: 'date:desc', ...(user?.customer?.id ? { customer_id: String(user.customer.id) } : {}) }),
        ]);

        if (apptRes.status === 'fulfilled') {
          const items = apptRes.value.data.data?.items || apptRes.value.data.data || [];
          setUpcoming(Array.isArray(items) ? items[0] || null : null);
        }
        if (notifRes.status === 'fulfilled') {
          setNotifications(notifRes.value.data.data?.items || notifRes.value.data.data || []);
        }
        if (txRes.status === 'fulfilled') {
          setTransactions(txRes.value.data.data?.items || txRes.value.data.data || []);
        }
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const firstName = user?.customer?.first_name || 'there';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Welcome back, {firstName}!</h1>
        <p className="text-neutral-500 mt-1">Here's an overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/customer/book" className="card flex items-center gap-4 hover:shadow-md transition group">
          <div className="p-3 bg-primary-100 rounded-xl text-primary-600 group-hover:bg-primary-200 transition">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">Book Appointment</p>
            <p className="text-xs text-neutral-500">Schedule a new visit</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-neutral-400 group-hover:text-primary-600 transition" />
        </Link>

        <Link to="/customer/appointments" className="card flex items-center gap-4 hover:shadow-md transition group">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-200 transition">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">My Appointments</p>
            <p className="text-xs text-neutral-500">View all appointments</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-neutral-400 group-hover:text-blue-600 transition" />
        </Link>

        <Link to="/customer/notifications" className="card flex items-center gap-4 hover:shadow-md transition group">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-600 group-hover:bg-amber-200 transition">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">Notifications</p>
            <p className="text-xs text-neutral-500">Check your updates</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-neutral-400 group-hover:text-amber-600 transition" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Clock size={18} /> Upcoming Appointment
          </h2>
          {upcoming ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">
                    {upcoming.service?.name || upcoming.service_name || 'Service'}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {dayjs(upcoming.appointment_date || upcoming.date).format('MMMM D, YYYY')} at{' '}
                    {upcoming.start_time || upcoming.time}
                  </p>
                  {upcoming.staff && (
                    <p className="text-sm text-neutral-500">
                      with {upcoming.staff.first_name} {upcoming.staff.last_name}
                    </p>
                  )}
                </div>
                <StatusBadge status={upcoming.status} />
              </div>
              <Link to="/customer/appointments" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View Details &rarr;
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500 mb-3">No upcoming appointments</p>
              <Link to="/customer/book" className="btn-primary text-sm">
                Book One Now
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Bell size={18} /> Recent Notifications
          </h2>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.status === 'unread' ? 'bg-primary-500' : 'bg-neutral-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{n.title}</p>
                    <p className="text-xs text-neutral-500 truncate">{n.message}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{dayjs(n.created_at).fromNow?.() || dayjs(n.created_at).format('MMM D, h:mm A')}</p>
                  </div>
                </div>
              ))}
              <Link to="/customer/notifications" className="text-sm text-primary-600 hover:text-primary-700 font-medium block text-center">
                View All
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <Bell className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500">No notifications yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <DollarSign size={18} /> Recent Transactions
        </h2>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-100">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-neutral-50 last:border-0">
                    <td className="py-2.5 text-neutral-700">{dayjs(tx.date || tx.created_at).format('MMM D, YYYY')}</td>
                    <td className="py-2.5 text-neutral-700 font-mono text-xs">{tx.reference_number || tx.id}</td>
                    <td className="py-2.5 text-neutral-900 font-medium">₱{(tx.total || tx.amount || 0).toLocaleString()}</td>
                    <td className="py-2.5"><StatusBadge status={tx.payment_status || tx.status || 'pending'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link to="/customer/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-medium block text-center mt-4">
              View All Transactions
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <DollarSign className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
