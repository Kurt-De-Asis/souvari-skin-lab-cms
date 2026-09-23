import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Check, ChevronRight, ChevronLeft, Scissors, Search } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { servicesApi, appointmentsApi, settingsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatServicePrice } from '@/utils/format';

interface Service {
  id: number;
  name: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  staff?: any[];
}

interface TimeSlot {
  time: string;
  end?: string;
  available: boolean;
  staff_id: number;
  staff_name?: string;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

function initials(name: string): string {
  const [first = '', last = ''] = name.split(' ');
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [closedWeekdays, setClosedWeekdays] = useState<string[]>([]);
  const [closedDayError, setClosedDayError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    const fetchOperatingDays = async () => {
      try {
        const { data } = await settingsApi.getPublic();
        const days = Array.isArray(data.data?.business_days) ? data.data.business_days : (Array.isArray(data?.business_days) ? data.business_days : null);
        if (Array.isArray(days)) {
          const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const openSet = new Set(days.map((d: string) => String(d).toLowerCase()));
          setClosedWeekdays(weekdayNames.filter((d) => !openSet.has(d)));
        }
      } catch {
        // silent
      }
    };
    fetchOperatingDays();
  }, []);

  useEffect(() => {
    if (step === 4 && selectedService) {
      appointmentsApi
        .getQuote(selectedService.id)
        .then(({ data }) => setQuote(data.data || null))
        .catch(() => setQuote(null));
    }
  }, [step, selectedService]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const all: any[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const { data } = await servicesApi.browse({ page: String(page), limit: '100' });
          const result = data.data;
          const items = result?.data || result?.items || result || [];
          totalPages = result?.pagination?.totalPages || 1;
          if (Array.isArray(items)) all.push(...items);
          page++;
        } while (page <= totalPages);
        setServices(all);
      } catch {
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService && selectedDate && step === 3) {
      fetchSlots();
    }
  }, [selectedDate, step]);

  const fetchSlots = async () => {
    if (!selectedService || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setSelectedStaffId(0);
    try {
      const { data } = await appointmentsApi.getAvailability({
        service_id: selectedService.id,
        date: selectedDate,
      });
      const available = data.data?.available_slots || data.data?.slots || data.data || [];
      const mapped = Array.isArray(available)
        ? available.map((s: any) => ({
            time: s.start,
            end: s.end,
            available: true,
            staff_id: s.staff_id,
            staff_name: s.staff_name || '',
          }))
        : [];

      setAllSlots(mapped);
    } catch {
      toast.error('Failed to load available times');
      setAllSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedSlot || !user?.customer) return;
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        service_id: selectedService.id,
        appointment_date: selectedDate,
        start_time: selectedSlot.time,
        end_time: selectedSlot.end,
        customer_id: user.customer.id,
        staff_id: selectedSlot.staff_id,
      });
      toast.success('Appointment booked successfully!');
      navigate('/customer/appointments');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  const isClosedDay = (date: string) => {
    if (!date || closedWeekdays.length === 0) return false;
    const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekday = weekdayNames[dayjs(date).day()];
    return closedWeekdays.includes(weekday);
  };

  const [serviceSearch, setServiceSearch] = useState('');
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services;
    const q = serviceSearch.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
    );
  }, [services, serviceSearch]);

  const availableStaff = useMemo(() => {
    const seen = new Map<number, string>();
    for (const s of allSlots) {
      if (s.staff_id && !seen.has(s.staff_id)) seen.set(s.staff_id, s.staff_name ?? '');
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [allSlots]);

  const slots = useMemo(() => {
    if (!selectedStaffId) return allSlots;
    return allSlots.filter((s) => s.staff_id === selectedStaffId);
  }, [allSlots, selectedStaffId]);

  const steps = [
    { num: 1, label: 'Service' },
    { num: 2, label: 'Date' },
    { num: 3, label: 'Time' },
    { num: 4, label: 'Confirm' },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-sans font-semibold text-neutral-900">Book an Appointment</h1>

      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                step > s.num ? 'bg-green-500 text-white' : step === s.num ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}>
                {step > s.num ? <Check size={16} /> : s.num}
              </div>
              <span className="text-xs text-neutral-500 mt-1">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-1 ${step > s.num ? 'bg-green-500' : 'bg-neutral-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Scissors size={18} /> Select a Service
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search for a service..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            {filteredServices.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8">
                No services match "{serviceSearch}". Try a different search.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredServices.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep(2); }}
                  className={`text-left p-4 rounded-md border-2 transition ${
                    selectedService?.id === svc.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                  }`}
                >
                  <p className="font-medium text-neutral-900">{svc.name}</p>
                  {svc.description && <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{svc.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-sm text-neutral-600">
                    {svc.price != null && <span>{formatServicePrice(svc.price)}</span>}
                    {svc.duration_minutes && <span>{svc.duration_minutes} min</span>}
                  </div>
                </button>
              ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Calendar size={18} /> Select a Date
            </h2>
            <p className="text-sm text-neutral-500">Service: <strong>{selectedService?.name}</strong></p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setClosedDayError('');
              }}
              min={minDate}
              max={maxDate}
              className="input-field"
            />
            {closedDayError && (
              <p className="text-sm text-red-600">{closedDayError}</p>
            )}
            {selectedDate && isClosedDay(selectedDate) && !closedDayError && (
              <p className="text-sm text-red-600">
                The clinic is closed on {dayjs(selectedDate).format('dddd')}. Please choose an operating day.
              </p>
            )}
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={() => {
                  if (isClosedDay(selectedDate)) {
                    setClosedDayError('The clinic is closed on this day. Please choose an operating day.');
                    return;
                  }
                  if (selectedDate) setStep(3);
                }}
                disabled={!selectedDate}
                className="btn-primary"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Clock size={18} /> Select Specialist &amp; Time
            </h2>
            <p className="text-sm text-neutral-500">
              {selectedService?.name} on {dayjs(selectedDate).format('MMMM D, YYYY')}
            </p>
            {loadingSlots ? (
              <LoadingSpinner />
            ) : allSlots.length === 0 ? (
              <p className="text-neutral-500 text-sm">No available time slots for this date.</p>
            ) : (
              <>
                {availableStaff.length > 1 && (
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-2">Choose your specialist</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => { setSelectedStaffId(0); setSelectedSlot(null); }}
                        className={`px-3 py-2 rounded-md border text-sm font-medium transition ${
                          !selectedStaffId
                            ? 'bg-neutral-900 border-neutral-900 text-white'
                            : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
                        }`}
                      >
                        All specialists
                      </button>
                      {availableStaff.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => { setSelectedStaffId(st.id); setSelectedSlot(null); }}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition ${
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
                    <p className="text-xs text-neutral-400 mt-2">
                      {selectedStaffId
                        ? `Showing slots for ${availableStaff.find((x) => x.id === selectedStaffId)?.name}.`
                        : 'Showing slots for all available specialists.'}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.time}-${slot.staff_id}`}
                      disabled={!slot.available}
                      onClick={() => { setSelectedSlot(slot); setStep(4); }}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition ${
                        !slot.available
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : selectedSlot?.time === slot.time && selectedSlot?.staff_id === slot.staff_id
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-neutral-200 text-neutral-700 hover:border-primary-400 hover:bg-primary-50'
                      }`}
                    >
                      {slot.time}
                      {slot.staff_name && (
                        <span className={`block text-[10px] font-normal mt-0.5 truncate ${
                          !slot.available ? 'text-neutral-400'
                            : selectedSlot?.time === slot.time && selectedSlot?.staff_id === slot.staff_id
                              ? 'text-primary-100'
                              : 'text-neutral-400'
                        }`}>
                          {slot.staff_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="flex justify-between">
              <button onClick={() => {
                setSelectedStaffId(0);
                setStep(2);
              }} className="btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900">Confirm Booking</h2>
            <div className="bg-neutral-50 rounded-md p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Service</span>
                <span className="font-medium text-neutral-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Date</span>
                <span className="font-medium text-neutral-900">{dayjs(selectedDate).format('MMMM D, YYYY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Time</span>
                <span className="font-medium text-neutral-900">{selectedSlot ? formatTime(selectedSlot.time) : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Staff</span>
                <span className="font-medium text-neutral-900">{selectedSlot?.staff_name || 'Specialist'}</span>
              </div>
              {quote ? (
                <>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                    <span className="text-neutral-500">Price</span>
                    <span className={quote.vipSavings > 0 || quote.membershipDiscount > 0 ? 'text-neutral-400 line-through' : 'font-semibold text-neutral-900'}>
                      {formatServicePrice(quote.basePrice)}
                    </span>
                  </div>
                  {quote.vipSavings > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Member VIP Price</span>
                      <span className="font-medium text-green-600">-₱{Number(quote.vipSavings).toLocaleString()}</span>
                    </div>
                  )}
                  {quote.membershipDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Membership Discount</span>
                      <span className="font-medium text-green-600">-₱{Number(quote.membershipDiscount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                    <span className="text-neutral-700 font-medium">Total</span>
                    <span className="font-bold text-neutral-900">{formatServicePrice(quote.finalTotal)}</span>
                  </div>
                </>
              ) : selectedService?.price != null && (
                <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                  <span className="text-neutral-500">Price</span>
                  <span className="font-semibold text-neutral-900">{formatServicePrice(selectedService.price)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={handleBook} disabled={submitting} className="btn-primary">
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
