import { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { appointmentsApi, staffApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';

interface Appointment {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer: { id: number; first_name: string; last_name: string };
  staff: { id: number; first_name: string; last_name: string };
  service: { id: number; name: string };
  services?: { id: number; name: string; price?: number; duration_minutes?: number }[];
  paid?: boolean;
  notes?: string;
}

interface StaffMember { id: number; first_name: string; last_name: string; }

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');


  // Dropdown data
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15', sort_by: 'appointment_date', sort_order: sortOrder };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter) params.status = statusFilter;
      if (staffFilter) params.staff_id = staffFilter;
      const { data } = await appointmentsApi.list(params);
      setAppointments(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo, statusFilter, staffFilter, sortOrder]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const staffRes = await staffApi.list({ limit: '200' });
      setStaffList(staffRes.data.data?.staff || staffRes.data.data?.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
  useEffect(() => { setPage(1); }, [dateFrom, dateTo, statusFilter, staffFilter]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Appointments</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage all clinic appointments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card pb-0">
        <div className="flex flex-wrap items-end gap-3 pb-4">
          <div>
            <label className="label">From</label>
            <input type="date" className="input-field w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input-field w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select-field w-full sm:w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <div>
            <label className="label">Staff</label>
            <select className="select-field w-full sm:w-auto" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
              <option value="">All Staff</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments found" description="Create a new appointment or adjust filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">
                    <button
                      onClick={toggleSort}
                      className="inline-flex items-center gap-1 hover:text-neutral-800 transition"
                      title={sortOrder === 'desc' ? 'Newest to oldest — click to sort oldest to newest' : 'Oldest to newest — click to sort newest to oldest'}
                    >
                      Date
                      {sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Staff</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Service</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 text-neutral-600">{dayjs(apt.date).format('MMM D, YYYY')}</td>
                    <td className="px-6 py-4 text-neutral-600">{apt.start_time} - {apt.end_time}</td>
                    <td className="px-6 py-4 font-medium text-neutral-900">{apt.customer?.first_name} {apt.customer?.last_name}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      {apt.staff ? `${apt.staff.first_name} ${apt.staff.last_name}` : <span className="text-neutral-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {apt.service?.name}
                      {apt.services && apt.services.length > 1 ? ` +${apt.services.length - 1}` : ''}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && appointments.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
