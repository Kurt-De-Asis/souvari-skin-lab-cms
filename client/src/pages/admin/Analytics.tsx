import { useState, useEffect, useCallback } from 'react';
import {
  Activity, CalendarCheck, DollarSign, Package, ShoppingBag, SlidersHorizontal,
  Sparkles, TrendingUp, UserCheck, UserPlus, Users,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { analyticsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import KpiCard from '@/components/analytics/KpiCard';
import ChartCard from '@/components/analytics/ChartCard';
import DeltaBadge from '@/components/analytics/DeltaBadge';
import StaffPerformanceTable, { StaffPerformanceRow } from '@/components/analytics/StaffPerformanceTable';
import { formatCurrency, formatNumber, formatMinutesHours, formatPercent, percentChange } from '@/utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface RevenueData {
  date: string;
  revenue: number;
}

interface AppointmentData {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  no_show: number;
  pending: number;
}

interface StatusData {
  status: string;
  count: number;
}

interface ServiceData {
  name: string;
  appointment_count: number;
}

interface InventorySummary {
  total_products: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

interface OccupancySummary {
  rate: number;
  working_minutes: number;
  booked_minutes: number;
  unbooked_minutes: number;
  series: { date: string; rate: number }[];
}

interface SummaryData {
  transaction_count: number;
  total_revenue: number;
  avg_sale: number;
  occupancy: OccupancySummary;
  returning_patient_rate: number;
  patients: { active: number; new_patients: number; returning_patients: number };
  staff: StaffPerformanceRow[];
}

type PresetRange = 'today' | 'week' | 'month' | 'last_month' | 'last_30_days' | 'custom';
type CompareMode = 'previous_period' | 'none';
type GroupBy = 'day' | 'week' | 'month';

const STATUS_META: Record<string, { color: string; label: string }> = {
  completed: { color: '#16a34a', label: 'Completed' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
  no_show: { color: '#dc2626', label: 'No-show' },
  pending: { color: '#f59e0b', label: 'Pending' },
};

const PRESET_OPTIONS: { label: string; value: PresetRange }[] = [
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Custom', value: 'custom' },
];

const DOUGHNUT_COLORS = [
  '#bb8875', '#82574b', '#e0b3a3', '#a3a3a3', '#624139',
  '#eccdc2', '#525252', '#d09a87', '#404040', '#452d28',
];

function prevRange(from: string, to: string): { from: string; to: string } {
  const start = dayjs(from);
  const end = dayjs(to);
  const len = end.diff(start, 'day') + 1;
  const prevTo = start.subtract(1, 'day');
  return { from: prevTo.subtract(len - 1, 'day').format('YYYY-MM-DD'), to: prevTo.format('YYYY-MM-DD') };
}

function resolveData<T>(result: PromiseSettledResult<any>, path: (data: any) => T): T {
  return result.status === 'fulfilled' ? path(result.value.data.data) : null as unknown as T;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<PresetRange>('last_30_days');
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(29, 'day').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [compare, setCompare] = useState<CompareMode>('previous_period');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [prevRevenueData, setPrevRevenueData] = useState<RevenueData[]>([]);
  const [appointmentData, setAppointmentData] = useState<AppointmentData[]>([]);
  const [prevAppointmentData, setPrevAppointmentData] = useState<AppointmentData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [prevSummary, setPrevSummary] = useState<SummaryData | null>(null);

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
      case 'last_30_days':
        setDateFrom(today.subtract(29, 'day').format('YYYY-MM-DD'));
        setDateTo(today.format('YYYY-MM-DD'));
        break;
      default:
        break;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { start_date: dateFrom, end_date: dateTo, group_by: groupBy };
      const jobs = [
        analyticsApi.getRevenue(params),
        analyticsApi.getAppointments({ start_date: dateFrom, end_date: dateTo }),
        analyticsApi.getServices(),
        analyticsApi.getInventory(),
        analyticsApi.getSummary({ start_date: dateFrom, end_date: dateTo }),
      ];
      const hasCompare = compare === 'previous_period';
      if (hasCompare) {
        const { from, to } = prevRange(dateFrom, dateTo);
        const prevParams = { start_date: from, end_date: to };
        jobs.push(
          analyticsApi.getRevenue({ ...prevParams, group_by: groupBy }),
          analyticsApi.getAppointments(prevParams),
          analyticsApi.getSummary(prevParams)
        );
      }
      const [rev, apt, svc, inv, sum, prevRev, prevApt, prevSum] = await Promise.allSettled(jobs);

      const revRows = (resolveData<RevenueData[]>(rev, (d) => d.data) || []) as RevenueData[];
      const aptRows = (resolveData<AppointmentData[]>(apt, (d) => d) || []) as AppointmentData[];

      setRevenueData(revRows);
      setPrevRevenueData(hasCompare ? (resolveData<RevenueData[]>(prevRev, (d) => d.data) || []) : []);

      setAppointmentData(aptRows);
      setPrevAppointmentData(hasCompare ? (resolveData<AppointmentData[]>(prevApt, (d) => d) || []) : []);

      const statusAccum: Record<string, number> = {};
      for (const d of aptRows) {
        for (const key of Object.keys(STATUS_META)) {
          const v = (d as any)[key];
          if (v) statusAccum[key] = (statusAccum[key] || 0) + v;
        }
      }
      setStatusData(Object.entries(statusAccum).map(([status, count]) => ({ status, count })));

      setServiceData((resolveData<ServiceData[]>(svc, (d) => d) || []) as ServiceData[]);
      setInventorySummary(resolveData<InventorySummary>(inv, (d) => d) as InventorySummary);
      setSummary(resolveData<SummaryData>(sum, (d) => d) as SummaryData);
      setPrevSummary(hasCompare ? (resolveData<SummaryData>(prevSum, (d) => d) as SummaryData) : null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, compare, groupBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const revenueTotal = revenueData.reduce((s, d) => s + Number(d.revenue), 0);
  const prevRevenueTotal = prevRevenueData.reduce((s, d) => s + Number(d.revenue), 0);
  const revenueDelta = percentChange(revenueTotal, prevRevenueTotal);

  const appointmentTotal = appointmentData.reduce((s, d) => s + Number(d.total), 0);
  const prevAppointmentTotal = prevAppointmentData.reduce((s, d) => s + Number(d.total), 0);
  const appointmentDelta = percentChange(appointmentTotal, prevAppointmentTotal);

  const avgSale = summary?.avg_sale ?? 0;
  const avgSaleDelta = percentChange(avgSale, prevSummary?.avg_sale ?? 0);
  const occupancyRate = summary?.occupancy.rate ?? 0;
  const prevOccupancyRate = prevSummary?.occupancy.rate;
  const occupancyDelta = prevOccupancyRate !== undefined ? Math.round((occupancyRate - prevOccupancyRate) * 10) / 10 : null;
  const returningRate = summary?.returning_patient_rate ?? 0;
  const prevReturningRate = prevSummary?.returning_patient_rate;
  const returningDelta = prevReturningRate !== undefined ? Math.round((returningRate - prevReturningRate) * 10) / 10 : null;

  const prevByDate = new Map(prevRevenueData.map((d) => [d.date, d.revenue]));
  const prevRevenueSeries = revenueData.map((d) => prevByDate.get(d.date) ?? 0);

  const prevApptByDate = new Map(prevAppointmentData.map((d) => [d.date, d.total]));
  const prevAppointmentSeries = appointmentData.map((d) => prevApptByDate.get(d.date) ?? 0);

  const occupancySeries = summary?.occupancy.series ?? [];

  const revenueLineData = {
    labels: revenueData.map((d) => dayjs(d.date).format('MMM D')),
    datasets: [
      { label: 'Current', data: revenueData.map((d) => d.revenue), borderColor: '#bb8875', backgroundColor: 'rgba(187, 136, 117, 0.08)', fill: true, tension: 0.4, pointRadius: 2, pointHoverRadius: 5 },
      ...(compare === 'previous_period'
        ? [{ label: 'Previous', data: prevRevenueSeries, borderColor: '#8f8675', backgroundColor: 'transparent', borderDash: [5, 4], tension: 0.4, pointRadius: 0, fill: false }]
        : []),
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: compare === 'previous_period', position: 'top' as const, labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } } }, title: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12, font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { size: 11 } } },
    },
  };

  const appointmentLineData = {
    labels: appointmentData.map((d) => dayjs(d.date).format('MMM D')),
    datasets: [
      { label: 'Current', data: appointmentData.map((d) => d.total), borderColor: '#94733f', backgroundColor: 'rgba(148, 115, 63, 0.08)', fill: true, tension: 0.4, pointRadius: 2, pointHoverRadius: 5 },
      ...(compare === 'previous_period'
        ? [{ label: 'Previous', data: prevAppointmentSeries, borderColor: '#8f8675', backgroundColor: 'transparent', borderDash: [5, 4], tension: 0.4, pointRadius: 0, fill: false }]
        : []),
    ],
  };

  const occupancyLineData = {
    labels: occupancySeries.map((d) => dayjs(d.date).format('MMM D')),
    datasets: [
      { label: 'Occupancy', data: occupancySeries.map((d) => d.rate), borderColor: '#bb8875', backgroundColor: 'rgba(187, 136, 117, 0.1)', fill: true, tension: 0.4, pointRadius: 2, pointHoverRadius: 5 },
    ],
  };

  const occupancyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
      y: { beginAtZero: true, max: 100, ticks: { font: { size: 11 }, callback: (v: any) => `${v}%` } },
    },
  };

  const doughnutData = {
    labels: serviceData.map((d) => d.name),
    datasets: [
      {
        data: serviceData.map((d) => d.appointment_count),
        backgroundColor: DOUGHNUT_COLORS,
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

  const statusTotal = statusData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-sans font-semibold text-neutral-900">Analytics</h1>
        <p className="text-sm text-neutral-500">Performance dashboard for Souvari Skin Lab</p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              className="select-field pr-8"
              value={preset}
              onChange={(e) => applyPreset(e.target.value as PresetRange)}
              aria-label="Date range preset"
            >
              {PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>{dayjs(dateFrom).format('MMM D, YYYY')} – {dayjs(dateTo).format('MMM D, YYYY')}</span>
          </div>

          <div className="w-px h-6 bg-neutral-200 hidden sm:block" />

          <div className="relative">
            <select
              className="select-field pr-8"
              value={compare}
              onChange={(e) => setCompare(e.target.value as CompareMode)}
              aria-label="Comparison period"
            >
              <option value="previous_period">Compare: Previous Period</option>
              <option value="none">Compare: Off</option>
            </select>
          </div>

          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`btn-secondary inline-flex items-center gap-2 ${filtersOpen ? '!bg-neutral-900 !text-white !border-neutral-900' : ''}`}
            type="button"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-end gap-4 mt-4 pt-4 border-t border-neutral-100">
            <div>
              <label className="label">From</label>
              <input
                type="date"
                className="input-field w-auto"
                value={dateFrom}
                onChange={(e) => { setPreset('custom'); setDateFrom(e.target.value); }}
              />
            </div>
            <div>
              <label className="label">To</label>
              <input
                type="date"
                className="input-field w-auto"
                value={dateTo}
                onChange={(e) => { setPreset('custom'); setDateTo(e.target.value); }}
              />
            </div>
            <div>
              <label className="label">Group By</label>
              <select
                className="select-field"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <>
          {/* Primary: revenue summary + revenue over time */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500 font-medium">Total Revenue</p>
                  <p className="text-3xl font-sans font-semibold text-neutral-900 mt-1">{formatCurrency(revenueTotal)}</p>
                </div>
                <div className="p-3 rounded-md bg-primary-100 text-primary-700">
                  <DollarSign size={22} />
                </div>
              </div>
              <div className="mt-4">
                <DeltaBadge value={revenueDelta} label="vs previous period" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                <div>
                  <p className="text-xs text-neutral-500">Transactions</p>
                  <p className="text-lg font-semibold text-neutral-900 mt-0.5">{formatNumber(summary?.transaction_count ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Avg Sale</p>
                  <p className="text-lg font-semibold text-neutral-900 mt-0.5">{formatCurrency(avgSale)}</p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-2">
              <ChartCard icon={TrendingUp} title="Revenue Over Time" subtitle="Grouped by day">
                <div className="h-72">
                  {revenueData.length > 0 ? (
                    <Line data={revenueLineData} options={lineOptions as any} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-neutral-400">No revenue data for this period</div>
                  )}
                </div>
              </ChartCard>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard label="Avg Sale" value={formatCurrency(avgSale)} icon={ShoppingBag} iconClassName="bg-green-50 text-green-600" delta={avgSaleDelta} />
            <KpiCard label="Appointments" value={formatNumber(appointmentTotal)} icon={CalendarCheck} iconClassName="bg-blue-50 text-primary-700" delta={appointmentDelta} />
            <KpiCard label="Occupancy Rate" value={formatPercent(occupancyRate)} icon={Activity} iconClassName="bg-amber-50 text-amber-600" delta={occupancyDelta} />
            <KpiCard label="Returning Patients" value={formatPercent(returningRate)} icon={UserCheck} iconClassName="bg-purple-50 text-primary-700" delta={returningDelta} />
          </div>

          {/* Appointments + patient acquisition */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ChartCard
                icon={CalendarCheck}
                title="Appointments Analytics"
                subtitle={`${appointmentTotal} appointments · ${statusTotal > 0 ? `${statusTotal} status-tracked` : 'no bookings'}`}
                right={
                  statusTotal > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {statusData.map((s) => (
                        <span
                          key={s.status}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
                          style={{ backgroundColor: `${STATUS_META[s.status]?.color || '#a3a3a3'}15`, color: STATUS_META[s.status]?.color || '#a3a3a3' }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_META[s.status]?.color || '#a3a3a3' }} />
                          {STATUS_META[s.status]?.label || s.status}: {s.count}
                        </span>
                      ))}
                    </div>
                  ) : null
                }
              >
                <div className="h-72">
                  {appointmentData.length > 0 ? (
                    <Line data={appointmentLineData} options={lineOptions as any} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-neutral-400">No appointment data for this period</div>
                  )}
                </div>
              </ChartCard>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-md bg-primary-100 text-primary-700">
                  <Users size={16} />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-900">Patient Acquisition</h2>
                  <p className="text-xs text-neutral-400">New vs returning this period</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-green-50/60">
                  <div className="flex items-center gap-2">
                    <UserPlus size={16} className="text-green-600" />
                    <p className="text-sm font-medium text-green-700">New Patients</p>
                  </div>
                  <p className="text-2xl font-sans font-semibold text-neutral-900 mt-1">{formatNumber(summary?.patients.new_patients ?? 0)}</p>
                  <div className="mt-2">
                    <DeltaBadge value={percentChange(summary?.patients.new_patients ?? 0, prevSummary?.patients.new_patients ?? 0)} />
                  </div>
                </div>
                <div className="p-4 rounded-md bg-purple-50/60">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-primary-700" />
                    <p className="text-sm font-medium text-primary-700">Returning Patients</p>
                  </div>
                  <p className="text-2xl font-sans font-semibold text-neutral-900 mt-1">{formatNumber(summary?.patients.returning_patients ?? 0)}</p>
                  <div className="mt-2">
                    <DeltaBadge value={percentChange(summary?.patients.returning_patients ?? 0, prevSummary?.patients.returning_patients ?? 0)} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mt-4">Walk-ins are not recorded in the system, so only booked patients are counted.</p>
            </div>
          </div>

          {/* Occupancy + top services */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ChartCard
                icon={Activity}
                title="Occupancy Analytics"
                subtitle="Booked time vs scheduled working time"
                right={<DeltaBadge value={occupancyDelta} label="vs previous period (percentage points)" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-md bg-neutral-50">
                    <p className="text-xs text-neutral-500">Working Time</p>
                    <p className="text-lg font-semibold text-neutral-900 mt-0.5">{formatMinutesHours(summary?.occupancy.working_minutes ?? 0)}</p>
                  </div>
                  <div className="p-4 rounded-md bg-neutral-50">
                    <p className="text-xs text-neutral-500">Booked Time</p>
                    <p className="text-lg font-semibold text-neutral-900 mt-0.5">{formatMinutesHours(summary?.occupancy.booked_minutes ?? 0)}</p>
                  </div>
                  <div className="p-4 rounded-md bg-neutral-50">
                    <p className="text-xs text-neutral-500">Unbooked Time</p>
                    <p className="text-lg font-semibold text-neutral-900 mt-0.5">{formatMinutesHours(summary?.occupancy.unbooked_minutes ?? 0)}</p>
                  </div>
                </div>
                <div className="h-56">
                  {occupancySeries.length > 0 ? (
                    <Line data={occupancyLineData} options={occupancyOptions as any} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-neutral-400">No occupancy data for this period</div>
                  )}
                </div>
              </ChartCard>
            </div>

            <div>
              <ChartCard icon={Sparkles} title="Top Services" subtitle="By appointment count">
                <div className="h-72">
                  {serviceData.length > 0 ? (
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-neutral-400">No service data</div>
                  )}
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Inventory summary */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-md bg-neutral-100 text-neutral-700">
                <Package size={16} />
              </div>
              <h2 className="font-semibold text-neutral-900">Inventory Summary</h2>
            </div>
            {inventorySummary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-md bg-neutral-50">
                  <p className="text-sm text-neutral-500">Total Products</p>
                  <p className="text-2xl font-sans font-semibold text-neutral-900 mt-1">{formatNumber(inventorySummary.total_products)}</p>
                </div>
                <div className="p-4 rounded-md bg-neutral-50">
                  <p className="text-sm text-neutral-500">Total Inventory Value</p>
                  <p className="text-2xl font-sans font-semibold text-neutral-900 mt-1">{formatCurrency(inventorySummary.total_value)}</p>
                </div>
                <div className="p-4 rounded-md bg-amber-50">
                  <p className="text-sm text-amber-600">Low Stock Items</p>
                  <p className="text-2xl font-sans font-semibold text-amber-700 mt-1">{formatNumber(inventorySummary.low_stock_count)}</p>
                </div>
                <div className="p-4 rounded-md bg-red-50">
                  <p className="text-sm text-red-600">Out of Stock</p>
                  <p className="text-2xl font-sans font-semibold text-red-700 mt-1">{formatNumber(inventorySummary.out_of_stock_count)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No inventory data available</p>
            )}
          </div>

          {/* Staff performance */}
          <div className="card">
            <div className="flex items-center gap-2 px-6 pt-5">
              <div className="p-2 rounded-md bg-primary-100 text-primary-700">
                <Users size={16} />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900">Provider Performance</h2>
                <p className="text-xs text-neutral-400">Revenue, bookings, occupancy and patient retention per provider</p>
              </div>
            </div>
            <div className="pt-4">
              <StaffPerformanceTable staff={summary?.staff ?? []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}