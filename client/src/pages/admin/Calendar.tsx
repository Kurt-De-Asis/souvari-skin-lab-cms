import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { appointmentsApi, servicesApi, staffApi } from '../../api';
import { TableSkeleton } from '../../components/ui/Skeleton';
import BookingGrid from '../../components/booking/admin/BookingGrid';
import CreateBookingDrawer from '../../components/booking/admin/CreateBookingDrawer';
import AppointmentDetailsDrawer from '../../components/booking/admin/AppointmentDetailsDrawer';
import EditAppointmentDrawer, { EditAppointmentPayload } from '../../components/booking/admin/EditAppointmentDrawer';
import CheckoutModal from '../../components/checkout/CheckoutModal';
import CustomerDetailDrawer from '../../components/admin/CustomerDetailDrawer';
import type {
  BookingAppointment,
  ServiceOption,
  StaffMember,
} from '../../components/booking/admin/types';

const STATUS_OPTIONS = ['pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [servicesList, setServicesList] = useState<ServiceOption[]>([]);
  const [appointments, setAppointments] = useState<BookingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [staffFilter, setStaffFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<{ staff_id: number; start_time: string } | null>(null);
  const [detailsAppt, setDetailsAppt] = useState<BookingAppointment | null>(null);
  const [editAppt, setEditAppt] = useState<BookingAppointment | null>(null);

  const [checkoutAppt, setCheckoutAppt] = useState<BookingAppointment | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const dateStr = currentDate.format('YYYY-MM-DD');
  const isPastDay = dateStr < dayjs().format('YYYY-MM-DD');

  type Fetcher = (params: Record<string, string>) => Promise<{ data: any }>;

  const fetchAllPages = useCallback(async (fetcher: Fetcher) => {
    const all: any[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const { data } = await fetcher({ page: String(page), limit: '100' });
      const pag = data.data?.pagination;
      totalPages = pag?.totalPages || 1;
      const list = data.data?.data || data.data?.staff || data.data?.services || [];
      if (Array.isArray(list)) all.push(...list);
      page++;
    } while (page <= totalPages);
    return all;
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const all = await fetchAllPages((p) => staffApi.list(p));
      setStaffList(all);
    } catch {
      setStaffList([]);
    }
  }, [fetchAllPages]);

  const fetchServices = useCallback(async () => {
    try {
      const all = await fetchAllPages((p) => servicesApi.list({ ...p, status: 'active' }));
      const mapped: ServiceOption[] = all.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? null,
        price: Number(s.price) || 0,
        duration: Number(s.duration_minutes) || 0,
        category: s.category || 'other',
        staff: (s.service_staff ?? []).map((ss: any) => ss.staff).filter(Boolean),
      }));
      setServicesList(mapped);
    } catch {
      setServicesList([]);
    }
  }, [fetchAllPages]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsApi.getCalendar({ start_date: dateStr, end_date: dateStr });
      setAppointments(data.data?.appointments || data.data?.data || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, [fetchStaff, fetchServices]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const activeStaff = useMemo(() => staffList.filter((s) => s.status === 'active'), [staffList]);

  const gridStaff = useMemo(() => {
    if (!staffFilter) return activeStaff;
    return activeStaff.filter((s) => s.id === Number(staffFilter));
  }, [activeStaff, staffFilter]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (staffFilter && a.staff?.id !== Number(staffFilter)) return false;
      if (serviceFilter && a.service?.id !== Number(serviceFilter)) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      return true;
    });
  }, [appointments, staffFilter, serviceFilter, statusFilter]);

  const serviceById = useCallback(
    (id: number) => servicesList.find((s) => s.id === id),
    [servicesList]
  );

  const navigate = (dir: 'prev' | 'next') => {
    setCurrentDate((prev) => (dir === 'prev' ? prev.subtract(1, 'day') : prev.add(1, 'day')));
  };

  const openCreate = (prefill?: { staff_id: number; start_time: string } | null) => {
    if (isPastDay) return;
    setCreatePrefill(prefill ?? null);
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
      fetchAppointments();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create appointment');
      return false;
    }
  };

  const handleSave = async (id: number, payload: EditAppointmentPayload): Promise<boolean> => {
    try {
      await appointmentsApi.update(id, payload);
      toast.success('Appointment updated');
      setEditAppt(null);
      setDetailsAppt(null);
      fetchAppointments();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update appointment');
      return false;
    }
  };

  const handleAssignStaff = async (appt: BookingAppointment, staffId: number): Promise<boolean> => {
    try {
      await appointmentsApi.update(appt.id, { staff_id: staffId });
      toast.success('Specialist updated');
      fetchAppointments();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update specialist');
      return false;
    }
  };

  const handleStatus = async (appt: BookingAppointment, status: string, reason?: string): Promise<boolean> => {
    try {
      if (status === 'completed') {
        if (appt.paid) {
          await appointmentsApi.updateStatus(appt.id, { status, reason });
          toast.success('Appointment completed');
          setDetailsAppt(null);
          fetchAppointments();
          return true;
        }
        setCheckoutAppt(appt);
        setCheckoutOpen(true);
        return true;
      }
      await appointmentsApi.updateStatus(appt.id, { status, reason });
      toast.success(`Appointment ${status.replace(/_/g, ' ')}`);
      setDetailsAppt(null);
      fetchAppointments();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
      return false;
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Calendar</h1>
          <p className="text-sm text-neutral-500 mt-1">Staff schedule &amp; appointment booking workspace</p>
        </div>
        <button onClick={() => openCreate(null)} disabled={isPastDay} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus size={18} />
          New Appointment
        </button>
      </div>

      {/* Date navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate('prev')} className="btn-secondary !px-3 !py-2">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => navigate('next')} className="btn-secondary !px-3 !py-2">
            <ChevronRight size={18} />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 ml-2">
            <span className="sm:hidden">{currentDate.format('MMMM D, YYYY')}</span>
            <span className="hidden sm:inline">{currentDate.format('dddd, MMMM D, YYYY')}</span>
          </h2>
        </div>
        <button onClick={() => setCurrentDate(dayjs())} className="btn-secondary text-sm">Today</button>
      </div>

      {/* Filters */}
      <div className="card pb-0 shrink-0">
        <div className="flex flex-wrap items-end gap-3 pb-4">
          <div>
            <label className="label">Staff</label>
            <select className="select-field w-full sm:w-auto" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
              <option value="">All Staff</option>
              {activeStaff.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Service</label>
            <select className="select-field w-full sm:w-auto" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
              <option value="">All Services</option>
              {servicesList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select-field w-full sm:w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="card !p-0 flex-1 min-h-0 flex flex-col">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : (
          <BookingGrid
            date={currentDate}
            staff={gridStaff}
            appointments={filteredAppointments}
            loading={false}
            onSlotClick={(staffId, startTime) => openCreate({ staff_id: staffId, start_time: startTime })}
            onAppointmentClick={(appt) => setDetailsAppt(appt)}
          />
        )}
      </div>

      {/* Create drawer */}
      <CreateBookingDrawer
        open={createOpen}
        date={dateStr}
        prefill={createPrefill}
        services={servicesList}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      {/* Details drawer */}
      <AppointmentDetailsDrawer
        appointment={detailsAppt}
        service={detailsAppt ? serviceById(detailsAppt.service.id) : undefined}
        staff={staffList}
        onClose={() => setDetailsAppt(null)}
        onEdit={(appt) => {
          setDetailsAppt(null);
          setEditAppt(appt);
        }}
        onStatus={handleStatus}
        onAssignStaff={handleAssignStaff}
        onSelectCustomer={(cust) => {
          setSelectedCustomer(cust);
        }}
      />

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        open={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />

      {/* Edit / reschedule drawer */}
      <EditAppointmentDrawer
        appointment={editAppt}
        services={servicesList}
        staff={staffList}
        onClose={() => setEditAppt(null)}
        onSave={handleSave}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => { setCheckoutOpen(false); setCheckoutAppt(null); }}
        onSuccess={() => { fetchAppointments(); toast.success('Appointment completed and payment recorded'); }}
        appointmentId={checkoutAppt?.id}
        customerId={checkoutAppt?.customer?.id ?? 0}
        staffId={checkoutAppt?.staff?.id ?? 0}
        services={
          checkoutAppt
            ? checkoutAppt.services && checkoutAppt.services.length > 0
              ? checkoutAppt.services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  price: s.price ?? servicesList.find((x) => x.id === s.id)?.price ?? 0,
                  duration: s.duration_minutes ?? servicesList.find((x) => x.id === s.id)?.duration ?? 0,
                  category: '',
                  staff: [],
                }))
              : [{
                  id: checkoutAppt.service.id,
                  name: checkoutAppt.service.name,
                  price: servicesList.find((s) => s.id === checkoutAppt.service.id)?.price ?? 0,
                  duration: servicesList.find((s) => s.id === checkoutAppt.service.id)?.duration ?? 0,
                  category: '',
                  staff: [],
                }]
            : []
        }
      />
    </div>
  );
}