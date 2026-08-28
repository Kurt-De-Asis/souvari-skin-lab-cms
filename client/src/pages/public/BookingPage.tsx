import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Crown, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { servicesApi, appointmentsApi, membershipsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import BookingSteps from '../../components/booking/BookingSteps';
import ServiceSelector from '../../components/booking/ServiceSelector';
import DateSelector from '../../components/booking/DateSelector';
import TimeSlotPicker from '../../components/booking/TimeSlotPicker';
import BookingSummary from '../../components/booking/BookingSummary';

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  vip_price?: number | null;
  non_member_price?: number | null;
  duration: number;
  category: string;
  staff?: Array<{ id: number; first_name: string; last_name: string }>;
}

interface TimeSlot {
  start: string;
  end: string;
  staff_id: number;
  staff_name?: string;
}

interface MembershipInfo {
  code: string;
  plan_name: string;
  tier: string;
  status: string;
}

const STEPS = ['Services', 'Date & Time', 'Confirm'];

function calculateServicePrice(service: Service, membership: MembershipInfo | null): { price: number; isDiscounted: boolean } {
  if (membership && service.vip_price && service.vip_price < service.price) {
    return { price: service.vip_price, isDiscounted: true };
  }
  return { price: service.price, isDiscounted: false };
}

export default function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedServiceId = (location.state as any)?.serviceId as number | undefined;

  const [step, setStep] = useState(preselectedServiceId ? 1 : 0);

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [serviceCategory, setServiceCategory] = useState('All');

  const [baseDate, setBaseDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [selectedDate, setSelectedDate] = useState('');

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [customerInfo, setCustomerInfo] = useState({
    first_name: user?.customer?.first_name || '',
    last_name: user?.customer?.last_name || '',
    email: user?.email || '',
    phone: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const [membershipCode, setMembershipCode] = useState('');
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await servicesApi.browse();
        const raw = data.data?.data || data.data?.items || data.data || [];
        const list = Array.isArray(raw) ? raw.map((s: any) => ({
          ...s,
          price: Number(s.price) || 0,
          vip_price: s.vip_price != null ? Number(s.vip_price) : null,
          non_member_price: s.non_member_price != null ? Number(s.non_member_price) : null,
          duration: Number(s.duration || s.duration_minutes) || 0,
        })) : [];
        setAllServices(list);
        if (preselectedServiceId) {
          const found = (Array.isArray(list) ? list : []).find((s: Service) => s.id === preselectedServiceId);
          if (found) setSelectedServices([found]);
        }
      } catch {
        toast.error('Failed to load services');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [preselectedServiceId]);

  useEffect(() => {
    if (step === 1 && selectedDate && selectedServices.length > 0) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        setSelectedSlot(null);
        try {
          const primaryService = selectedServices[0];
          const { data } = await appointmentsApi.getAvailability({
            service_id: primaryService.id,
            date: selectedDate,
          });
          const raw = data.data?.available_slots || data.data?.slots || data.data || [];
          setSlots(
            Array.isArray(raw)
              ? raw.map((s: any) =>
                  typeof s === 'string' ? { start: s, end: '', staff_id: 0 } : s
                )
              : []
          );
        } catch {
          setSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [step, selectedDate, selectedServices]);

  const validateMembershipCode = useCallback(async () => {
    if (!membershipCode.trim()) return;
    setValidatingCode(true);
    try {
      const { data } = await membershipsApi.validateCode(membershipCode.trim());
      if (data.success && data.data) {
        setMembership(data.data);
        toast.success(`VIP membership detected: ${data.data.plan_name}`);
      } else {
        setMembership(null);
        toast.error('Invalid membership code');
      }
    } catch {
      setMembership(null);
      toast.error('Invalid membership code');
    } finally {
      setValidatingCode(false);
    }
  }, [membershipCode]);

  const updateInfo = useCallback((field: string, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(allServices.map((s) => s.category))];
    return ['All', ...cats];
  }, [allServices]);

  const filteredServices = useMemo(() => {
    if (serviceCategory === 'All') return allServices;
    return allServices.filter((s) => s.category === serviceCategory);
  }, [allServices, serviceCategory]);

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duration, 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + calculateServicePrice(s, membership).price, 0),
    [selectedServices, membership]
  );

  const totalRegularPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );

  const toggleService = useCallback((service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
  }, []);

  const handleBooking = async () => {
    if (!selectedServices.length || !selectedSlot || !selectedDate) return;
    setSubmitting(true);
    try {
      const primaryService = selectedServices[0];
      const payload: any = {
        service_id: primaryService.id,
        staff_id: selectedSlot.staff_id,
        appointment_date: selectedDate,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        notes: customerInfo.notes,
      };
      if (user?.customer) {
        payload.customer_id = user.customer.id;
      }
      if (membership) {
        payload.membership_code = membership.code;
      }
      await appointmentsApi.create(payload);
      toast.success('Appointment booked successfully!');
      navigate('/booking/confirmation', {
        state: {
          service: primaryService,
          date: selectedDate,
          time: selectedSlot.start,
          staff: selectedSlot.staff_name,
          totalPrice,
          totalDuration,
          membershipDiscount: totalRegularPrice - totalPrice,
          membershipCode: membership?.code,
        },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Booking failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return selectedServices.length > 0;
    if (step === 1) return !!selectedDate && !!selectedSlot;
    return true;
  };

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1);
    else handleBooking();
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (loadingServices) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition mb-4">
            <ArrowLeft size={14} /> Back
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Book an Appointment</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingSteps currentStep={step} steps={STEPS} />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 0 && (
              <ServiceSelector
                services={filteredServices}
                selectedServices={selectedServices}
                onToggleService={toggleService}
                categories={categories}
                activeCategory={serviceCategory}
                onCategoryChange={setServiceCategory}
                membershipPrice={!!membership}
              />
            )}

            {step === 1 && (
              <div className="space-y-8">
                <DateSelector
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  baseDate={baseDate}
                  onPrevWeek={() => setBaseDate((d) => dayjs(d).subtract(7, 'day').format('YYYY-MM-DD'))}
                  onNextWeek={() => setBaseDate((d) => dayjs(d).add(7, 'day').format('YYYY-MM-DD'))}
                />
                {selectedDate && (
                  <TimeSlotPicker
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    loading={loadingSlots}
                  />
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-1">Confirm Your Details</h2>
                  {!user && (
                    <p className="text-sm text-neutral-500">
                      Already have an account?{' '}
                      <Link to="/login" className="text-neutral-900 font-medium hover:underline">
                        Log in
                      </Link>
                    </p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      className="input-field"
                      value={customerInfo.first_name}
                      onChange={(e) => updateInfo('first_name', e.target.value)}
                      disabled={!!user?.customer}
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      className="input-field"
                      value={customerInfo.last_name}
                      onChange={(e) => updateInfo('last_name', e.target.value)}
                      disabled={!!user?.customer}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={customerInfo.email}
                      onChange={(e) => updateInfo('email', e.target.value)}
                      disabled={!!user}
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      className="input-field"
                      placeholder="+63 917 123 4567"
                      value={customerInfo.phone}
                      onChange={(e) => updateInfo('phone', e.target.value)}
                    />
                  </div>
                </div>

                {!membership && (
                  <div className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown size={16} className="text-amber-600" />
                      <p className="text-sm font-medium text-neutral-900">VIP Membership Code</p>
                    </div>
                    <p className="text-xs text-neutral-500 mb-3">Enter your SOUVARI VIP code for exclusive discounts on services.</p>
                    <div className="flex gap-2">
                      <input
                        className="input-field flex-1"
                        placeholder="SOUVARI-VIP-XXXXXX"
                        value={membershipCode}
                        onChange={(e) => setMembershipCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && validateMembershipCode()}
                      />
                      <button
                        onClick={validateMembershipCode}
                        disabled={validatingCode || !membershipCode.trim()}
                        className="btn-secondary text-sm"
                      >
                        {validatingCode ? <Loader2 size={14} className="animate-spin" /> : 'Validate'}
                      </button>
                    </div>
                  </div>
                )}

                {membership && (
                  <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown size={16} className="text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">{membership.plan_name}</p>
                          <p className="text-xs text-amber-600">{membership.code}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setMembership(null); setMembershipCode(''); }}
                        className="text-xs text-amber-600 hover:text-amber-800 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Any special requests or concerns..."
                    value={customerInfo.notes}
                    onChange={(e) => updateInfo('notes', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <BookingSummary
                services={selectedServices.map((s) => {
                  const { price } = calculateServicePrice(s, membership);
                  return {
                    name: s.name,
                    duration: s.duration,
                    price,
                    originalPrice: membership ? s.price : undefined,
                  };
                })}
                date={selectedDate || undefined}
                time={
                  selectedSlot
                    ? new Date(`2000-01-01T${selectedSlot.start}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : undefined
                }
                totalDuration={totalDuration}
                totalPrice={totalPrice}
                originalTotalPrice={membership ? totalRegularPrice : undefined}
                membershipName={membership?.plan_name}
              />

              <div className="flex gap-3 mt-4">
                {step > 0 && (
                  <button onClick={handleBack} className="btn-secondary flex-1 justify-center">
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
                {step < 2 ? (
                  <button onClick={handleNext} disabled={!canNext()} className="btn-primary flex-1 justify-center">
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button onClick={handleBooking} disabled={submitting || !customerInfo.first_name || !customerInfo.last_name || !customerInfo.email} className="btn-primary flex-1 justify-center">
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Booking...</>
                    ) : (
                      <><CheckCircle size={16} /> Confirm Booking</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
