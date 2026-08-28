import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Check, ChevronRight, ChevronLeft, Scissors, Search } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { servicesApi, appointmentsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Service {
  id: number;
  name: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  staff?: any[];
}

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  position?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    if (step === 5 && selectedService) {
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
    if (selectedService) {
      setStaffList(selectedService.staff || []);
      if (selectedService.staff?.length === 1) {
        setSelectedStaff(selectedService.staff[0]);
      }
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedStaff && selectedDate) {
      fetchSlots();
    }
  }, [selectedStaff, selectedDate]);

  const fetchSlots = async () => {
    if (!selectedStaff || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    try {
      const { data } = await appointmentsApi.getAvailability({
        staff_id: selectedStaff.id,
        date: selectedDate,
        service_id: selectedService?.id,
      });
      const available = data.data?.available_slots || data.data?.slots || data.data || [];
      setSlots(Array.isArray(available) ? available.map((s: string) => ({ time: s, available: true })) : []);
    } catch {
      toast.error('Failed to load available times');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedSlot || !selectedStaff || !user?.customer) return;
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        service_id: selectedService.id,
        staff_id: selectedStaff.id,
        appointment_date: selectedDate,
        start_time: selectedSlot,
        customer_id: user.customer.id,
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

  const steps = [
    { num: 1, label: 'Service' },
    { num: 2, label: 'Date' },
    { num: 3, label: 'Staff' },
    { num: 4, label: 'Time' },
    { num: 5, label: 'Confirm' },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Book an Appointment</h1>

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
                  className={`text-left p-4 rounded-xl border-2 transition ${
                    selectedService?.id === svc.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                  }`}
                >
                  <p className="font-medium text-neutral-900">{svc.name}</p>
                  {svc.description && <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{svc.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-sm text-neutral-600">
                    {svc.price != null && <span>₱{Number(svc.price).toLocaleString()}</span>}
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
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="input-field"
            />
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={() => selectedDate && setStep(3)} disabled={!selectedDate} className="btn-primary">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <User size={18} /> Select Staff
            </h2>
            <p className="text-sm text-neutral-500">
              {selectedService?.name} on {dayjs(selectedDate).format('MMMM D, YYYY')}
            </p>
            {staffList.length === 0 ? (
              <p className="text-neutral-500 text-sm">No staff available for this service. Please contact us.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {staffList.map((s: any) => {
                  const member = s.staff || s;
                  return (
                    <button
                      key={member.id}
                      onClick={() => { setSelectedStaff(member); setStep(4); }}
                      className={`text-left p-4 rounded-xl border-2 transition ${
                        selectedStaff?.id === member.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{member.first_name} {member.last_name}</p>
                          {member.position && <p className="text-xs text-neutral-500">{member.position}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Clock size={18} /> Select Time
            </h2>
            <p className="text-sm text-neutral-500">
              {selectedService?.name} with {selectedStaff?.first_name} {selectedStaff?.last_name} on {dayjs(selectedDate).format('MMMM D, YYYY')}
            </p>
            {loadingSlots ? (
              <LoadingSpinner />
            ) : slots.length === 0 ? (
              <p className="text-neutral-500 text-sm">No available time slots for this date.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => { setSelectedSlot(slot.time); setStep(5); }}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                      !slot.available
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : selectedSlot === slot.time
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:border-primary-400 hover:bg-primary-50'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900">Confirm Booking</h2>
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm">
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
                <span className="font-medium text-neutral-900">{selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Staff</span>
                <span className="font-medium text-neutral-900">{selectedStaff?.first_name} {selectedStaff?.last_name}</span>
              </div>
              {quote ? (
                <>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                    <span className="text-neutral-500">Price</span>
                    <span className={quote.vipSavings > 0 || quote.membershipDiscount > 0 ? 'text-neutral-400 line-through' : 'font-semibold text-neutral-900'}>
                      ₱{Number(quote.basePrice).toLocaleString()}
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
                    <span className="font-bold text-neutral-900">₱{Number(quote.finalTotal).toLocaleString()}</span>
                  </div>
                </>
              ) : selectedService?.price != null && (
                <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                  <span className="text-neutral-500">Price</span>
                  <span className="font-semibold text-neutral-900">₱{Number(selectedService.price).toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(4)} className="btn-secondary">
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
