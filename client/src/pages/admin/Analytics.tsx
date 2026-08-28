import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, CalendarCheck, Package, BarChart3 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { analyticsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface RevenueData {
  date: string;
  revenue: number;
}

interface AppointmentData {
  date: string;
  count: number;
}

interface ServiceData {
  name: string;
  count: number;
}

interface StatusData {
  status: string;
  count: number;
}

interface InventorySummary {
  total_products: number;
  total_value: number;
  low_stock_count: number;
}

type PresetRange = 'today' | 'week' | 'month' | 'last_month' | 'custom';

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#22c55e',
  completed: '#16a34a',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  no_show: '#dc2626',
  checked_in: '#3b82f6',
  in_progress: '#6366f1',
};

const PRESET_OPTIONS: { label: string; value: PresetRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Custom', value: 'custom' },
];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<PresetRange>('month');
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));

  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [appointmentData, setAppointmentData] = useState<AppointmentData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);

  const applyPreset = useCallback((p: PresetRange) => {
    setPreset(p);
    const today = dayjs();
    switch (p) {
      case 'today':
        setDateFrom(today.format('YYYY-MM-DD'));
        setDateTo(today.format('YYYY-MM-DD'));
        break;
      case 'week':
        setDateFrom(today.startOf('week').format('YYYY-MM-DD'));
        setDateTo(today.format('YYYY-MM-DD'));
        break;
      case 'month':
        setDateFrom(today.startOf('month').format('YYYY-MM-DD'));
        setDateTo(today.format('YYYY-MM-DD'));
        break;
      case 'last_month':
        setDateFrom(today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
        setDateTo(today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'));
        break;
      default:
        break;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { start_date: dateFrom, end_date: dateTo };
      const [revRes, aptRes, svcRes, invRes] = await Promise.all([
        analyticsApi.getRevenue(params),
        analyticsApi.getAppointments(params),
        analyticsApi.getServices(params),
        analyticsApi.getInventory(),
      ]);

      setRevenueData(revRes.data.data?.data || []);

      const aptItems = (aptRes.data.data || []) as any[];
      setAppointmentData(aptItems.map((d: any) => ({ date: d.date, count: d.total })));

      const svcItems = (svcRes.data.data || []) as any[];
      setServiceData(svcItems.map((d: any) => ({ name: d.name, count: d.appointment_count })));

      const statusAccum: Record<string, number> = {};
      for (const d of aptItems) {
        for (const key of ['completed', 'cancelled', 'no_show', 'pending', 'confirmed', 'checked_in', 'in_progress']) {
          if (d[key]) statusAccum[key] = (statusAccum[key] || 0) + d[key];
        }
      }
      setStatusData(
        Object.entries(statusAccum).map(([status, count]) => ({ status, count }))
      );

      setInventorySummary(invRes.data.data || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatCurrency = (amount: number) => `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Chart configs
  const lineChartData = {
    labels: revenueData.map((d) => dayjs(d.date).format('MMM D')),
    datasets: [
      {
        label: 'Revenue (₱)',
        data: revenueData.map((d) => d.revenue),
        borderColor: '#c95144',
        backgroundColor: 'rgba(201, 81, 68, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12, font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { size: 11 }, callback: (v: any) => `₱${Number(v).toLocaleString()}` } },
    },
  };

  const barChartData = {
    labels: appointmentData.map((d) => dayjs(d.date).format('MMM D')),
    datasets: [
      {
        label: 'Appointments',
        data: appointmentData.map((d) => d.count),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12, font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
    },
  };

  const doughnutData = {
    labels: serviceData.map((d) => d.name),
    datasets: [
      {
        data: serviceData.map((d) => d.count),
        backgroundColor: [
          '#c95144', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6',
          '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: { legend: { position: 'bottom' as const, labels: { padding: 10, usePointStyle: true, font: { size: 11 } } } },
  };

  const pieData = {
    labels: statusData.map((d) => d.status.replace(/_/g, ' ')),
    datasets: [
      {
        data: statusData.map((d) => d.count),
        backgroundColor: statusData.map((d) => STATUS_COLORS[d.status] || '#a3a3a3'),
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { padding: 10, usePointStyle: true, font: { size: 11 } } } },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">Clinic performance insights and reports</p>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex rounded-lg border border-neutral-300 overflow-hidden">
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => applyPreset(opt.value)}
                className={`px-3 py-2 text-sm font-medium transition ${
                  preset === opt.value ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <>
              <div>
                <label className="label">From</label>
                <input type="date" className="input-field w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input-field w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <>
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Line Chart */}
            <div className="card lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-primary-600" />
                <h2 className="font-semibold text-neutral-900">Revenue Over Time</h2>
              </div>
              <div className="h-72">
                {revenueData.length > 0 ? (
                  <Line data={lineChartData} options={lineChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-neutral-400">No revenue data for this period</div>
                )}
              </div>
            </div>

            {/* Appointment Status Pie Chart */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-primary-600" />
                <h2 className="font-semibold text-neutral-900">Status Breakdown</h2>
              </div>
              <div className="h-72">
                {statusData.length > 0 ? (
                  <Pie data={pieData} options={pieOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-neutral-400">No data</div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Appointments Bar Chart */}
            <div className="card lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <CalendarCheck size={18} className="text-primary-600" />
                <h2 className="font-semibold text-neutral-900">Appointments Over Time</h2>
              </div>
              <div className="h-72">
                {appointmentData.length > 0 ? (
                  <Bar data={barChartData} options={barChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-neutral-400">No appointment data for this period</div>
                )}
              </div>
            </div>

            {/* Services Doughnut Chart */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-primary-600" />
                <h2 className="font-semibold text-neutral-900">Top Services</h2>
              </div>
              <div className="h-72">
                {serviceData.length > 0 ? (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-neutral-400">No service data</div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Summary */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-primary-600" />
              <h2 className="font-semibold text-neutral-900">Inventory Summary</h2>
            </div>
            {inventorySummary ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50">
                  <p className="text-sm text-neutral-500">Total Products</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{inventorySummary.total_products}</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50">
                  <p className="text-sm text-neutral-500">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{formatCurrency(inventorySummary.total_value)}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50">
                  <p className="text-sm text-red-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{inventorySummary.low_stock_count}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No inventory data available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
