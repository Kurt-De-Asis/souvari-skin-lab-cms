import { useEffect, useMemo, useState } from 'react';
import { Clock, Loader2, Plus, Search, User, X } from 'lucide-react';
import dayjs from 'dayjs';
import { appointmentsApi, customersApi, posApi } from '../../../api';
import Drawer from '../../ui/Drawer';
import CustomerDetailDrawer from '../../admin/CustomerDetailDrawer';
import formatCategory from '../../../utils/formatCategory';
import { formatAmountInput, formatServicePrice, parseAmountInput } from '../../../utils/format';
import type {
  CreateGroupAppointmentPayload,
  CustomerOption,
  ServiceOption,
  TimeSlot,
} from './types';

interface QuoteResult {
  items?: { service_id: number; line_total: number }[];
  subtotal?: number;
  membership_discount?: number;
  monthly_perk_discount?: number;
  final_total?: number;
}

interface CreateBookingDrawerProps {
  open: boolean;
  date: string;
  prefill?: { staff_id: number; start_time: string } | null;
  services: ServiceOption[];
  onClose: () => void;
  onCreate: (data: CreateGroupAppointmentPayload) => Promise<boolean>;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' },
  { value: 'gotyme', label: 'GoTyme' },
  { value: 'rcbc', label: 'RCBC' },
  { value: 'paid_on_us', label: 'Paid On Us' },
];

function initials(name: string): string {
  const [first = '', last = ''] = name.split(' ');
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function CreateBookingDrawer({
  open,
  date,
  prefill,
  services,
  onClose,
  onCreate,
}: CreateBookingDrawerProps) {
  const [appointmentDate, setAppointmentDate] = useState(date);

  const TODAY = dayjs().format('YYYY-MM-DD');
  const safeDate = date && date < TODAY ? TODAY : date;

  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  const [clientMode, setClientMode] = useState<'existing' | 'walk-in'>('existing');
  const [walkInFirst, setWalkInFirst] = useState('');
  const [walkInLast, setWalkInLast] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInNotes, setWalkInNotes] = useState('');

  const [serviceQuery, setServiceQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);

  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [availabilityClosed, setAvailabilityClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedStaffId, setSelectedStaffId] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [payError, setPayError] = useState('');
  const [detailCustomer, setDetailCustomer] = useState<any | null>(null);

  // Reset whenever the drawer opens
  useEffect(() => {
    if (!open) return;
    setAppointmentDate(safeDate);
    setCustomerQuery('');
    setCustomerResults([]);
    setSelectedCustomer(null);
    setClientMode('existing');
    setWalkInFirst('');
    setWalkInLast('');
    setWalkInPhone('');
    setWalkInEmail('');
    setWalkInNotes('');
    setServiceQuery('');
    setActiveCategory('all');
    setSelectedServices([]);
    setServicePickerOpen(true);
    setAvailability([]);
    setAvailabilityClosed(false);
    setSelectedStaffId(0);
    setSelectedSlot(null);
    setNotes('');
    setQuote(null);
    setPaymentMethod('cash');
    setAmountTendered('');
    setPayError('');
  }, [open, date]);

  // Customer search (debounced) — shows recent customers as picker boxes when the query is empty
  useEffect(() => {
    if (!open) {
      setCustomerResults([]);
      setLoadingCustomers(false);
      return;
    }
    setLoadingCustomers(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await customersApi.list({
          limit: '20',
          ...(customerQuery.trim() ? { search: customerQuery.trim() } : {}),
        });
        const list = data.data?.data || data.data?.items || [];
        setCustomerResults(list);
      } catch {
        setCustomerResults([]);
      } finally {
        setLoadingCustomers(false);
      }
    }, customerQuery.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [customerQuery, open]);

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duration, 0),
    [selectedServices]
  );
  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );

  const finalTotal = quote?.final_total ?? totalPrice;
  const memberDiscount =
    (quote?.membership_discount ?? 0) + (quote?.monthly_perk_discount ?? 0);

  const lineTotal = (serviceId: number) => {
    const item = quote?.items?.find((i) => i.service_id === serviceId);
    return item ? item.line_total : undefined;
  };

  // Live POS quote whenever the customer + services are set
  useEffect(() => {
    if (!open || clientMode !== 'existing' || selectedServices.length === 0 || !selectedCustomer) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }
    setQuoteLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const { data } = await posApi.quote({
          customer_id: selectedCustomer.id,
          items: selectedServices.map((s) => ({ service_id: s.id, quantity: 1 })),
        });
        if (!cancelled) setQuote(data ?? null);
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selectedCustomer, selectedServices, clientMode]);

  // Availability for the combined block (all services back-to-back)
  useEffect(() => {
    if (!open || selectedServices.length === 0 || !appointmentDate) {
      setAvailability([]);
      setAvailabilityClosed(false);
      return;
    }
    setLoadingSlots(true);
    let cancelled = false;
    const primary = selectedServices[0];
    (async () => {
      try {
        const { data } = await appointmentsApi.getAvailability({
          service_id: String(primary.id),
          date: appointmentDate,
          duration_minutes: String(totalDuration),
        });
        const res = data.data;
        if (cancelled) return;
        setAvailabilityClosed(!!res.closed);
        setAvailability(res.available_slots || []);
      } catch {
        if (!cancelled) {
          setAvailability([]);
          setAvailabilityClosed(false);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, appointmentDate, selectedServices, totalDuration]);

  // Default staff: prefer the clicked column, otherwise the first available
  useEffect(() => {
    if (!open || availability.length === 0) {
      setSelectedStaffId(0);
      setSelectedSlot(null);
      return;
    }
    const target = prefill?.staff_id && availability.some((s) => s.staff_id === prefill.staff_id)
      ? prefill.staff_id
      : availability[0].staff_id;
    setSelectedStaffId(target);
  }, [open, availability, prefill]);

  // Default slot: prefer the clicked time, otherwise the first for that staff
  useEffect(() => {
    if (!open) return;
    const staffSlots = availability.filter((s) => s.staff_id === selectedStaffId);
    if (staffSlots.length === 0) {
      setSelectedSlot(null);
      return;
    }
    const prefTime = prefill?.staff_id === selectedStaffId ? prefill.start_time : null;
    const match = prefTime ? staffSlots.find((s) => s.start === prefTime) : undefined;
    setSelectedSlot(match ?? staffSlots[0]);
  }, [open, availability, selectedStaffId, prefill]);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const s of services) {
      if (s.category && !seen.includes(s.category)) seen.push(s.category);
    }
    return seen;
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    return services.filter((s) => {
      if (activeCategory !== 'all' && s.category !== activeCategory) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q);
    });
  }, [services, serviceQuery, activeCategory]);

  const slotStaff = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of availability) {
      if (!map.has(s.staff_id)) map.set(s.staff_id, s.staff_name ?? '');
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [availability]);

  const staffSlots = useMemo(
    () => availability.filter((s) => s.staff_id === selectedStaffId),
    [availability, selectedStaffId]
  );

  const addService = (s: ServiceOption) => {
    setSelectedServices((prev) => (prev.some((x) => x.id === s.id) ? prev : [...prev, s]));
  };

  const removeService = (id: number) => {
    setSelectedServices((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        setServicePickerOpen(true);
        setSelectedSlot(null);
      }
      return next;
    });
  };

  const tendered = parseAmountInput(amountTendered) || 0;
  const change = Math.max(0, tendered - finalTotal);

  const clientReady =
    clientMode === 'walk-in'
      ? !!walkInFirst.trim() && !!walkInLast.trim()
      : !!selectedCustomer;

  const canSubmit =
    clientReady && selectedServices.length > 0 && !!selectedSlot && !submitting;

  const selectClientMode = (mode: 'existing' | 'walk-in') => {
    setClientMode(mode);
    if (mode === 'walk-in') {
      setSelectedCustomer(null);
    }
  };

  const handleSubmit = async (action: 'checkout' | 'save') => {
    if (!clientReady || selectedServices.length === 0 || !selectedSlot) return;
    if (action === 'checkout' && paymentMethod === 'cash' && tendered < finalTotal) {
      setPayError('Amount tendered is less than total');
      return;
    }
    setPayError('');
    setSubmitting(true);
    try {
      const base = {
        ...(clientMode === 'walk-in'
          ? {
              walk_in: {
                first_name: walkInFirst.trim(),
                last_name: walkInLast.trim(),
                ...(walkInPhone.trim() ? { phone: walkInPhone.trim() } : {}),
                ...(walkInEmail.trim() ? { email: walkInEmail.trim() } : {}),
                ...(walkInNotes.trim() ? { notes: walkInNotes.trim() } : {}),
              },
            }
          : { customer_id: selectedCustomer!.id }),
        service_ids: selectedServices.map((s) => s.id),
        staff_id: selectedSlot.staff_id,
        appointment_date: appointmentDate,
        start_time: selectedSlot.start,
        notes: notes.trim() || undefined,
      };
      const payload: CreateGroupAppointmentPayload =
        action === 'checkout'
          ? {
              ...base,
              payment: {
                payment_method: paymentMethod,
                amount_tendered: paymentMethod === 'cash' && tendered > 0 ? tendered : undefined,
              },
            }
          : base;
      await onCreate(payload);
    } catch {
      // handled by the page (toast)
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New Appointment"
      subtitle={dayjs(appointmentDate).format('dddd, MMMM D, YYYY')}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Date */}
        <div>
          <label className="label">Appointment Date</label>
          <input
            type="date"
            className="input-field"
            min={TODAY}
            value={appointmentDate}
            onChange={(e) => {
              const v = e.target.value;
              setAppointmentDate(v && v < TODAY ? TODAY : v);
            }}
          />
        </div>

        {/* Client + Service selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Client Selection panel */}
          <div className="bg-white border border-neutral-200 rounded-md">
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900">
              <User size={13} className="text-neutral-300" />
              <p className="text-[13px] font-semibold text-white uppercase tracking-wide">Client</p>
            </div>
            <div className="p-3 space-y-2.5">
              {/* Existing client vs Walk-in toggle */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-md bg-neutral-100">
                <button
                  type="button"
                  onClick={() => selectClientMode('existing')}
                  className={`rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                    clientMode === 'existing' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Existing client
                </button>
                <button
                  type="button"
                  onClick={() => selectClientMode('walk-in')}
                  className={`rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                    clientMode === 'walk-in' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Walk-in client
                </button>
              </div>

              {clientMode === 'walk-in' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="label">First Name *</label>
                      <input
                        className="input-field !py-1.5 !text-xs"
                        placeholder="First name"
                        value={walkInFirst}
                        onChange={(e) => setWalkInFirst(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Last Name *</label>
                      <input
                        className="input-field !py-1.5 !text-xs"
                        placeholder="Last name"
                        value={walkInLast}
                        onChange={(e) => setWalkInLast(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input
                        className="input-field !py-1.5 !text-xs"
                        placeholder="0981 xxx xxxx"
                        value={walkInPhone}
                        onChange={(e) => setWalkInPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        className="input-field !py-1.5 !text-xs"
                        placeholder="name@email.com"
                        value={walkInEmail}
                        onChange={(e) => setWalkInEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Client Notes</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      placeholder="Optional notes for the client profile"
                      value={walkInNotes}
                      onChange={(e) => setWalkInNotes(e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    A client profile will be created automatically for this walk-in booking.
                  </p>
                </div>
              ) : selectedCustomer ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-neutral-900 bg-neutral-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-semibold">{initials(`${selectedCustomer.first_name} ${selectedCustomer.last_name}`)}</span>
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setDetailCustomer(selectedCustomer)}
                          className="text-xs font-medium text-neutral-900 hover:text-primary-600 truncate underline text-left block"
                          title="View clinical workspace & full records"
                        >
                          {selectedCustomer.first_name} {selectedCustomer.last_name}
                        </button>
                        {selectedCustomer.user?.email && (
                          <p className="text-[11px] text-neutral-400 truncate">{selectedCustomer.user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailCustomer(selectedCustomer)}
                        className="text-[11px] text-primary-600 hover:text-primary-700 font-medium underline"
                      >
                        Workspace
                      </button>
                      <button className="text-[11px] text-neutral-500 hover:text-neutral-700" onClick={() => setSelectedCustomer(null)}>
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      className="input-field pl-8 !py-1.5 !text-xs"
                      placeholder="Search by name or email..."
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                    />
                  </div>
                  {loadingCustomers && !customerResults.length && (
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                      <Loader2 size={13} className="animate-spin" /> Loading customers...
                    </div>
                  )}
                  {!loadingCustomers && customerResults.length > 0 && customerQuery.trim() && (
                    <div className="border border-neutral-200 rounded-md divide-y divide-neutral-100 max-h-44 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCustomer(c)}
                          className="w-full flex items-center gap-2.5 p-2 text-left hover:bg-neutral-50 transition"
                        >
                          <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-[11px] font-semibold">{initials(`${c.first_name} ${c.last_name}`)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-neutral-900 truncate">{c.first_name} {c.last_name}</p>
                            {c.user?.email && <p className="text-[11px] text-neutral-400 truncate">{c.user.email}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {customerResults.length > 0 && !customerQuery.trim() && (
                    <div className="flex flex-wrap gap-2">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCustomer(c)}
                          className="flex items-center gap-2 border border-neutral-200 hover:border-neutral-900 hover:shadow-sm p-1.5 pr-2.5 text-left transition group"
                        >
                          <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-[11px] font-semibold">{initials(`${c.first_name} ${c.last_name}`)}</span>
                          </div>
                          <p className="text-xs font-medium text-neutral-900 truncate group-hover:text-primary-600">{c.first_name} {c.last_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {!loadingCustomers && customerResults.length === 0 && (
                    <p className="text-[11px] text-neutral-400">
                      {customerQuery.trim() ? 'No customers found. Try a different search.' : 'No customers found yet.'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Service Selection panel */}
          <div className="bg-white border border-neutral-200 rounded-md">
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900">
              <Clock size={13} className="text-neutral-300" />
              <p className="text-[13px] font-semibold text-white uppercase tracking-wide">Services</p>
            </div>
            <div className="p-3 space-y-2.5">
              <p className="text-[11px] text-neutral-400">
                {selectedServices.length === 0
                  ? 'Add one or more services'
                  : `${selectedServices.length} ${selectedServices.length === 1 ? 'service' : 'services'} · ${totalDuration} min · ${formatServicePrice(totalPrice)}`}
              </p>

              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedServices.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[11px] font-medium pl-2 pr-1 py-0.5 rounded-md">
                      {s.name}
                      <button
                        onClick={() => removeService(s.id)}
                        className="p-0.5 rounded hover:bg-white/20 transition"
                        title="Remove service"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {selectedServices.length === 0 && !servicePickerOpen ? (
                <button
                  onClick={() => setServicePickerOpen(true)}
                  className="w-full border border-dashed border-neutral-300 rounded-md py-2 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition"
                >
                  <Plus size={13} className="inline mr-1" /> Add a service
                </button>
              ) : (selectedServices.length === 0 || servicePickerOpen) ? (
                <div>
                  <div className="relative mb-2.5">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      className="input-field pl-8 !py-1.5 !text-xs"
                      placeholder="Search services..."
                      value={serviceQuery}
                      onChange={(e) => setServiceQuery(e.target.value)}
                    />
                  </div>
                  {categories.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {['all', ...categories].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-2 py-1 rounded-full text-[11px] font-medium transition ${
                            activeCategory === cat
                              ? 'bg-neutral-900 text-white'
                              : 'bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {cat === 'all' ? 'All' : formatCategory(cat)}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {filteredServices.map((s) => {
                      const added = selectedServices.some((x) => x.id === s.id);
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-md border transition ${
                            added ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-neutral-900">{s.name}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
                              <Clock size={10} />
                              <span>{s.duration} min</span>
                              <span className="mx-0.5">·</span>
                              <span className="truncate">{formatCategory(s.category)}</span>
                            </div>
                          </div>
                          <span className="text-[13px] font-semibold text-neutral-900 whitespace-nowrap">{formatServicePrice(s.price)}</span>
                          <button
                            onClick={() => (added ? removeService(s.id) : addService(s))}
                            className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                              added
                                ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                : 'bg-neutral-900 text-white hover:bg-neutral-700'
                            }`}
                          >
                            {added ? <X size={11} /> : <Plus size={11} />}
                            {added ? 'Remove' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                    {filteredServices.length === 0 && (
                      <p className="text-[11px] text-neutral-400 py-3 text-center">No services match your search.</p>
                    )}
                  </div>
                  {selectedServices.length > 0 && (
                    <button
                      onClick={() => setServicePickerOpen(false)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-700 mt-2"
                    >
                      Done adding services
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Staff + Time */}
        {selectedServices.length > 0 && (
          <div>
            <label className="label">Specialist &amp; Time</label>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-6 text-neutral-400">
                <Loader2 size={18} className="animate-spin mr-2" /> Checking availability...
              </div>
            ) : availabilityClosed ? (
              <div className="border border-neutral-200 rounded-md p-5 text-center">
                <User size={24} className="mx-auto text-neutral-300 mb-1.5" />
                <p className="text-sm font-medium text-neutral-700">The clinic is closed on this day</p>
                <p className="text-xs text-neutral-400 mt-1">Please choose an operating day.</p>
              </div>
            ) : availability.length === 0 ? (
              <div className="border border-neutral-200 rounded-md p-5 text-center">
                <User size={24} className="mx-auto text-neutral-300 mb-1.5" />
                <p className="text-sm font-medium text-neutral-700">No available times</p>
                <p className="text-xs text-neutral-400 mt-1">Try a different date or service.</p>
              </div>
            ) : (
              <>
                {slotStaff.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {slotStaff.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStaffId(st.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition ${
                          selectedStaffId === st.id
                            ? 'bg-neutral-900 border-neutral-900 text-white'
                            : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                          {initials(st.name)}
                        </span>
                        {st.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {staffSlots.map((slot) => {
                    const active = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={`${slot.start}-${slot.staff_id}`}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-1.5 py-2 rounded-md border text-xs font-medium transition ${
                          active
                            ? 'bg-neutral-900 border-neutral-900 text-white'
                            : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
                        }`}
                      >
                        {formatTime(slot.start)}
                        {slot.staff_name && (
                          <span className={`block text-[10px] font-normal mt-0.5 truncate ${active ? 'text-neutral-300' : 'text-neutral-400'}`}>
                            {slot.staff_name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* POS / Payment */}
        {clientReady && selectedServices.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-md">
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-900">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white uppercase tracking-wide">POS</span>
              </div>
              {quoteLoading ? (
                <span className="text-[11px] text-neutral-300 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Pricing...
                </span>
              ) : (
                <span className="text-[11px] text-neutral-300">{selectedServices.length} item{selectedServices.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="p-3">
              <div className="space-y-1">
                {selectedServices.map((s) => {
                  const line = lineTotal(s.id);
                  return (
                    <div key={s.id} className="flex justify-between text-xs">
                      <span className="text-neutral-600">{s.name} <span className="text-neutral-400">· {s.duration} min</span></span>
                      <span className="font-medium text-neutral-900 whitespace-nowrap">
                        {line !== undefined ? formatServicePrice(line) : formatServicePrice(s.price)}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-xs pt-1.5 border-t border-neutral-100">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="text-neutral-900 font-medium">{formatServicePrice(quote?.subtotal ?? totalPrice)}</span>
                </div>
                {memberDiscount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Member / Perk discount</span>
                    <span className="text-green-600 font-medium">− ₱{memberDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1.5 border-t border-neutral-200">
                  <span className="font-semibold text-neutral-900">Total</span>
                  <span className="font-bold text-neutral-900">{formatServicePrice(finalTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400 pt-1">
                  <span>Duration</span>
                  <span>{totalDuration} min</span>
                </div>
                {selectedSlot && (
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Time</span>
                    <span>{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <label className="label">Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Optional notes for the appointment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-xs font-semibold text-neutral-900 uppercase tracking-wide mb-2">Payment Method</p>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      disabled={submitting}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition ${
                        paymentMethod === pm.value
                          ? 'bg-neutral-900 border-neutral-900 text-white'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cash' && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="label">Amount Tendered</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="input-field hide-number-spinners"
                        placeholder="0.00"
                        value={amountTendered}
                        onChange={(e) => {
                          setAmountTendered(formatAmountInput(e.target.value));
                          setPayError('');
                        }}
                      />
                    </div>
                    <div>
                      <label className="label">Change</label>
                      <div className="input-field bg-neutral-50 text-neutral-600 flex items-center">
                        ₱{change.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
                {payError && <p className="text-xs text-red-600 mt-2">{payError}</p>}
              </div>

               <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSubmit('save')}
                  disabled={!canSubmit}
                  className="border border-neutral-300 text-neutral-700 hover:bg-neutral-100 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => handleSubmit('checkout')}
                  disabled={!canSubmit}
                  className="btn-primary w-full !py-2.5 text-sm"
                >
                  {submitting ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        open={detailCustomer !== null}
        onClose={() => setDetailCustomer(null)}
        customer={detailCustomer}
      />
    </Drawer>
  );
}