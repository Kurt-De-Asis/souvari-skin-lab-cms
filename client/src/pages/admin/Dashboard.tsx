import { useState, useEffect } from 'react';
import {
  CalendarCheck, CheckCircle2, DollarSign, Users, AlertTriangle, UserCog,
} from 'lucide-react';
import { analyticsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface DashboardData {
  total_appointments: number;
  completed: number;
  cancelled: number;
  no_show: number;
  total_revenue: number;
  total_customers: number;
  total_staff: number;
  low_stock_count: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await analyticsApi.getDashboard();
        setData(res.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;
  if (!data) return null;

  const kpis = [
    { label: 'Appointments (This Month)', value: data.total_appointments, icon: CalendarCheck, color: 'bg-blue-50 text-blue-600' },
    { label: 'Completed', value: data.completed, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'Revenue', value: `₱${Number(data.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Customers', value: data.total_customers, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Staff', value: data.total_staff, icon: UserCog, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Low Stock Alerts', value: data.low_stock_count, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Overview of your clinic performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card flex items-start gap-4">
            <div className={`p-3 rounded-xl ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">{kpi.label}</p>
              <p className="text-2xl font-bold text-neutral-900 mt-0.5">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
