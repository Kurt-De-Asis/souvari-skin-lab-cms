import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Crown, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { servicesApi, appointmentsApi, membershipsApi, settingsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import BookingSteps from '../../components/booking/BookingSteps';
import CategorySelector, { BookingGroup } from '../../components/booking/CategorySelector';
import TreatmentSelector from '../../components/booking/TreatmentSelector';
import ServiceSelector from '../../components/booking/ServiceSelector';
import DateSelector from '../../components/booking/DateSelector';
import TimeSlotPicker from '../../components/booking/TimeSlotPicker';
import BookingSummary from '../../components/booking/BookingSummary';
import Modal from '../../components/ui/Modal';

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

type Mode = 'single' | 'multi';

const SINGLE_STEPS = ['Service', 'Treatment', 'Schedule', 'Details'];
const MULTI_STEPS = ['Services', 'Schedule', 'Details'];

const SINGLE_SERVICE_STEP = 0;
const SINGLE_TREATMENT_STEP = 1;
const SINGLE_SCHEDULE_STEP = 2;
const SINGLE_DETAILS_STEP = 3;
const MULTI_SERVICES_STEP = 0;
const MULTI_SCHEDULE_STEP = 1;
const MULTI_DETAILS_STEP = 2;

const GROUPS: { key: string; label: string; description: string; categories: string[] }[] = [
  {
    key: 'facials',
    label: 'Facials & Skin Treatments',
    description: 'Deep-cleansing facials, glow treatments and clinical skin care, personalized to your concern.',
    categories: ['facial', 'laser'],
  },
  {
    key: 'rejuvenation',
    label: 'HIFU, Peels & Rejuvenation',
    description: 'Lifting, contouring and renewal — from peels and microdermabrasion to HIFU.',
    categories: ['skin_rejuvenation'],
  },
  {
    key: 'hair_removal',
    label: 'Laser & IPL Hair Removal',
    description: 'Smooth, low-maintenance skin — safely, session by session.',
    categories: ['hair_removal'],
  },
  {
    key: 'body',
    label: 'Body, Whitening & Waxing',
    description: 'Body treatments, laser whitening and waxing for cared-for skin.',
    categories: ['body'],
  },
  {
    key: 'injectables',
    label: 'Injectables, Botox & IV Therapy',
    description: 'Clinical injectables, vitamin infusions and wellness drips administered by professionals.',
    categories: ['injection'],
  },
  {
    key: 'consults_packages',
    label: 'Consultations & Packages',
    description: 'Start with a skin consultation, or commit to a multi-session results program.',
    categories: ['consultation', 'package'],
  },
  {
    key: 'beauty',
    label: 'Brows, Lashes, Nails & Spa',
    description: 'Polished details — permanent makeup, lashes, nails and hand-and-foot rituals.',
    categories: ['other'],
  },
];

const DRAFT_KEY = 'souvari_booking_draft';

interface BookingDraft {
  mode: Mode;
  serviceCategory: string;
  selectedGroup: string;
  selectedServices: Service[];
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  membership: MembershipInfo | null;
  membershipCode: string;
  step: number;
  notes: string;
}

function saveDraft(draft: BookingDraft | null) {
  try {
    if (!draft) {
      sessionStorage.removeItem(DRAFT_KEY);
    } else {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  } catch {
    /* ignore storage errors */
  }
}

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

  const [restore] = useState<BookingDraft | null>(() => {
    if (preselectedServiceId) return null;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as BookingDraft) : null;
    } catch {
      return null;
    }
  });

  const [closedWeekdays, setClosedWeekdays] = useState<string[]>([]);

  const [mode, setMode] = useState<Mode>(() =>
    restore ? restore.mode : preselectedServiceId ? 'single' : 'single'
  );

  const [step, setStep] = useState<number>(() =>
    restore ? restore.step : preselectedServiceId ? SINGLE_SCHEDULE_STEP : SINGLE_SERVICE_STEP
  );

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [selectedGroup, setSelectedGroup] = useState<string>(() => restore?.selectedGroup || '');
  const [serviceCategory, setServiceCategory] = useState(() => restore?.serviceCategory || 'All');
  const [selectedServices, setSelectedServices] = useState<Service[]>(() => restore?.selectedServices || []);

  const [baseDate, setBaseDate] = useState(() =>
    restore?.selectedDate || dayjs().format('YYYY-MM-DD')
  );
  const [selectedDate, setSelectedDate] = useState(() => restore?.selectedDate || '');

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(() => restore?.selectedSlot || null);
  const [selectedStaffId, setSelectedStaffId] = useState(0);

  const [customerInfo, setCustomerInfo] = useState({
    notes: restore?.notes || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [membershipCode, setMembershipCode] = useState(() => restore?.membershipCode || '');
  const [membership, setMembership] = useState<MembershipInfo | null>(() => restore?.membership || null);
  const [validatingCode, setValidatingCode] = useState(false);

  const steps = mode === 'single' ? SINGLE_STEPS : MULTI_STEPS;

  const isSingle = mode === 'single';
  const isMulti = mode === 'multi';

  const isScheduleStep = useCallback((s: number) => (isSingle ? s === SINGLE_SCHEDULE_STEP : s === MULTI_SCHEDULE_STEP), [isSingle]);
  const isDetailsStep = useCallback((s: number) => (isSingle ? s === SINGLE_DETAILS_STEP : s === MULTI_DETAILS_STEP), [isSingle]);

  const groups = useMemo<BookingGroup[]>(() => {
    return GROUPS.map((g) => ({
      key: g.key,
      label: g.label,
      description: g.description,
      count: allServices.filter((s) => g.categories.includes(s.category)).length,
    })).filter((g) => g.count > 0);
  }, [allServices]);

  const activeGroup = useMemo(() => GROUPS.find((g) => g.key === selectedGroup) || null, [selectedGroup]);

  const bookingServices = useMemo<Service[]>(() => {
    return selectedServices;
  }, [selectedServices]);

  useEffect(() => {
    saveDraft({
      mode,
      serviceCategory,
      selectedGroup,
      selectedServices,
      selectedDate,
      selectedSlot,
      membership,
      membershipCode,
      step,
      notes: customerInfo.notes,
    });
  }, [mode, serviceCategory, selectedGroup, selectedServices, selectedDate, selectedSlot, membership, membershipCode, step, customerInfo.notes]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const all: any[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const { data } = await servicesApi.browse({ page: String(page), limit: '100' });
          const result = data.data;
          const raw = result?.data || result?.items || result || [];
          totalPages = result?.pagination?.totalPages || 1;
          if (Array.isArray(raw)) {
            all.push(...raw.map((s: any) => ({
              ...s,
              price: Number(s.price) || 0,
              vip_price: s.vip_price != null ? Number(s.vip_price) : null,
              non_member_price: s.non_member_price != null ? Number(s.non_member_price) : null,
              duration: Number(s.duration || s.duration_minutes) || 0,
            })));
          }
          page++;
        } while (page <= totalPages);
        setAllServices(all);
        if (preselectedServiceId) {
          const found = all.find((s: Service) => s.id === preselectedServiceId);
          if (found) {
            const g = GROUPS.find((grp) => grp.categories.includes(found.category));
            setSelectedGroup(g?.key || '');
            setSelectedServices([found]);
          }
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
        // silent; DateSelector stays fully enabled as fallback
      }
    };
    fetchOperatingDays();
  }, []);

  useEffect(() => {
    if (!isScheduleStep(step) || !selectedDate || bookingServices.length === 0) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setSelectedStaffId(0);
      try {
        const totalDur = bookingServices.reduce((sum, s) => sum + s.duration, 0);
        const allSlots: TimeSlot[] = [];

        const { data } = await appointmentsApi.getAvailability({
          service_id: bookingServices[0].id,
          date: selectedDate,
          duration_minutes: totalDur,
        });
        const raw = data.data?.available_slots || data.data?.slots || data.data || [];
        if (Array.isArray(raw)) {
          for (const s of raw) {
            if (!s?.start || !s?.staff_id) continue;
            allSlots.push({
              start: s.start,
              end: s.end,
              staff_id: s.staff_id,
              staff_name: s.staff_name || '',
            });
          }
        }

        setSlots(allSlots);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [isScheduleStep, step, selectedDate, bookingServices]);

  const validateMembershipCode = useCallback(async () => {
    if (!membershipCode.trim()) return;
    setValidatingCode(true);
    try {
      const { data } = await membershipsApi.validateCode(membershipCode.trim());
      if (data.success && data.data) {
        const m = data.data;
        setMembership({
          code: m.code,
          plan_name: m.plan?.name ?? 'VIP',
          tier: m.plan?.tier,
          status: m.status,
        });
        toast.success(`VIP membership detected: ${m.plan?.name ?? 'VIP'}`);
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

  const updateNotes = useCallback((value: string) => {
    setCustomerInfo((prev) => ({ ...prev, notes: value }));
  }, []);

  const beginAuth = useCallback((path: string) => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          mode,
          serviceCategory,
          selectedGroup,
          selectedServices,
          selectedDate,
          selectedSlot,
          membership,
          membershipCode,
          step,
          notes: customerInfo.notes,
        })
      );
    } catch {
      /* ignore storage errors */
    }
    navigate(path);
  }, [navigate, mode, serviceCategory, selectedGroup, selectedServices, selectedDate, selectedSlot, membership, membershipCode, step, customerInfo.notes]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  

  const categories = useMemo(() => {
    const cats = [...new Set(allServices.map((s) => s.category))];
    return ['All', ...cats];
  }, [allServices]);

  const filteredServices = useMemo(() => {
    if (serviceCategory === 'All') return allServices;
    return allServices.filter((s) => s.category === serviceCategory);
  }, [allServices, serviceCategory]);

  const consultationService = useMemo<Service | undefined>(() => {
    return allServices.find((s) => s.category === 'consultation' && Number(s.price) === 0);
  }, [allServices]);

  const treatmentServices = useMemo(() => {
    if (!activeGroup) return [];
    const grouped = allServices.filter((s) => activeGroup.categories.includes(s.category));
    if (!consultationService) return grouped;
    return [consultationService, ...grouped.filter((s) => s.id !== consultationService.id)];
  }, [activeGroup, allServices, consultationService]);

  const availableStaff = useMemo(() => {
    const seen = new Map<number, string>();
    for (const s of slots) {
      if (s.staff_id && !seen.has(s.staff_id)) seen.set(s.staff_id, s.staff_name ?? '');
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [slots]);

  const displayedSlots = useMemo(() => {
    if (!selectedStaffId) return slots;
    return slots.filter((s) => s.staff_id === selectedStaffId);
  }, [slots, selectedStaffId]);

  const totalDuration = useMemo(
    () => bookingServices.reduce((sum, s) => sum + s.duration, 0),
    [bookingServices]
  );

  const totalPrice = useMemo(
    () => bookingServices.reduce((sum, s) => sum + calculateServicePrice(s, membership).price, 0),
    [bookingServices, membership]
  );

  const totalRegularPrice = useMemo(
    () => bookingServices.reduce((sum, s) => sum + s.price, 0),
    [bookingServices]
  );

  const toggleService = useCallback((service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
  }, []);

  const removeService = useCallback((service: Service) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== service.id));
  }, []);

  const selectGroup = useCallback((key: string) => {
    setSelectedGroup(key);
    setStep(SINGLE_TREATMENT_STEP);
  }, []);

  const switchToMulti = useCallback(() => {
    setSelectedServices([]);
    setSelectedGroup('');
    setServiceCategory('All');
    setMode('multi');
    setStep(MULTI_SERVICES_STEP);
  }, []);

  const switchToSingle = useCallback(() => {
    setSelectedServices([]);
    setMode('single');
    setStep(SINGLE_SERVICE_STEP);
  }, []);

  const handleBooking = async () => {
    if (bookingServices.length === 0 || !selectedSlot || !selectedDate) return;
    setSubmitting(true);
    try {
      if (bookingServices.length === 1) {
        const primaryService = bookingServices[0];
        await appointmentsApi.create({
          service_id: primaryService.id,
          appointment_date: selectedDate,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          staff_id: selectedSlot.staff_id,
          notes: customerInfo.notes,
          customer_id: user?.customer?.id,
          membership_code: membership?.code,
        });
      } else {
        await appointmentsApi.createGroup({
          service_ids: bookingServices.map((s) => s.id),
          appointment_date: selectedDate,
          start_time: selectedSlot.start,
          staff_id: selectedSlot.staff_id,
          notes: customerInfo.notes,
          customer_id: user?.customer?.id,
          membership_code: membership?.code,
        });
      }
      saveDraft(null);
      toast.success('Appointment booked successfully!');
      navigate('/booking/confirmation', {
        state: {
          services: bookingServices,
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
    const maxStep = isSingle ? SINGLE_DETAILS_STEP : MULTI_DETAILS_STEP;
    if (step === 0) return isSingle ? !!selectedGroup : selectedServices.length > 0;
    if (isSingle && step === SINGLE_TREATMENT_STEP) return selectedServices.length > 0;
    if (isScheduleStep(step)) return !!selectedDate && !!selectedSlot;
    return step <= maxStep;
  };

  const handleNext = () => {
    if (isDetailsStep(step)) {
      handleBooking();
      return;
    }
    if (isScheduleStep(step) && !user) {
      setShowAuthModal(true);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  if (loadingServices) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="relative bg-neutral-900 text-white border-b border-neutral-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/images/booking-bg.webp')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/60" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-400">Book an appointment</p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold">Under a minute. Promise.</h1>
          <p className="mt-3 text-sm text-neutral-300 max-w-lg leading-relaxed">
            This sends a request — every booking is reviewed and confirmed personally by Souvari staff. No payment is taken on this site.
          </p>
          <Link to="/services" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white transition mt-6">
            <ArrowLeft size={13} /> Back to services
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingSteps currentStep={step} steps={steps} />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 min-w-0">
            {/* SERVICE step (single): what brings you in */}
            {isSingle && step === SINGLE_SERVICE_STEP && (
              <CategorySelector groups={groups} onSelect={selectGroup} onSelectMulti={switchToMulti} />
            )}

            {/* TREATMENT step (single): choose your visit */}
            {isSingle && step === SINGLE_TREATMENT_STEP && activeGroup && (
              <TreatmentSelector
                groupLabel={activeGroup.label}
                services={treatmentServices}
                selectedServices={selectedServices}
                onToggle={toggleService}
                onRemove={removeService}
                onBack={() => setStep(SINGLE_SERVICE_STEP)}
                membershipPrice={!!membership}
                featuredServiceId={consultationService?.id}
              />
            )}

            {/* SERVICES step (multi): legacy multi-select */}
            {isMulti && step === MULTI_SERVICES_STEP && (
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

            {/* SCHEDULE step */}
            {isScheduleStep(step) && (
              <div className="space-y-8">
                <DateSelector
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  baseDate={baseDate}
                  onPrevWeek={() => setBaseDate((d) => dayjs(d).subtract(7, 'day').format('YYYY-MM-DD'))}
                  onNextWeek={() => setBaseDate((d) => dayjs(d).add(7, 'day').format('YYYY-MM-DD'))}
                  closedWeekdays={closedWeekdays}
                />
                {selectedDate && (
                  <TimeSlotPicker
                    slots={displayedSlots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    loading={loadingSlots}
                    staff={availableStaff}
                    selectedStaffId={selectedStaffId}
                    onSelectStaff={setSelectedStaffId}
                  />
                )}
              </div>
            )}

            {/* DETAILS step */}
            {isDetailsStep(step) && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-sans font-semibold text-neutral-900 mb-1">Confirm Your Details</h2>
                </div>

                {!user ? (
                  <div className="border border-neutral-200 bg-white p-6 text-center">
                    <div className="w-12 h-12 bg-neutral-900 flex items-center justify-center mx-auto mb-4">
                      <Lock size={20} className="text-primary-400" />
                    </div>
                    <h3 className="text-lg font-sans font-semibold text-neutral-900">Sign in to confirm your booking</h3>
                    <p className="text-sm text-neutral-500 mt-2">
                      You have {bookingServices.length} {bookingServices.length === 1 ? 'service' : 'services'} selected
                      {selectedDate && <> for {formatDate(selectedDate)}</>}
                      {selectedSlot?.start && <> at {formatTime(selectedSlot.start)}.</>}
                    </p>
                    <p className="text-xs text-neutral-400 mt-2">
                      Your selections will be saved and restored automatically once you sign in.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                      <button onClick={() => beginAuth('/login?redirect=/booking')} className="btn-primary px-6 justify-center">
                        Log in
                      </button>
                      <button onClick={() => beginAuth('/register?redirect=/booking')} className="btn-secondary px-6 justify-center">
                        Create account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name</label>
                      <input
                        className="input-field"
                        value={user.customer?.first_name || ''}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="label">Last Name</label>
                      <input
                        className="input-field"
                        value={user.customer?.last_name || ''}
                        disabled
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Email</label>
                      <input
                        type="email"
                        className="input-field"
                        value={user.email}
                        disabled
                      />
                    </div>
                  </div>
                )}

                {!membership && (
                  <div className="border border-neutral-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown size={16} className="text-primary-600" />
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
                  <div className="border border-primary-200 bg-primary-50 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown size={16} className="text-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-primary-800">{membership.plan_name}</p>
                          <p className="text-xs text-primary-600">{membership.code}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setMembership(null); setMembershipCode(''); }}
                        className="text-xs text-primary-600 hover:text-primary-800 underline"
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
                    onChange={(e) => updateNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-1 min-w-0">
            <div className="md:sticky md:top-24">
              <BookingSummary
                services={bookingServices.map((s) => {
                  const { price } = calculateServicePrice(s, membership);
                  return {
                    name: s.name,
                    duration: s.duration,
                    price,
                    originalPrice: membership ? s.price : undefined,
                  };
                })}
                date={selectedDate || undefined}
                staff={selectedSlot?.staff_name || undefined}
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

              {isMulti && step === MULTI_SERVICES_STEP && (
                <button onClick={switchToSingle} className="mt-4 w-full text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 hover:text-primary-700 transition">
                  Booking one treatment? Back to the simple flow
                </button>
              )}

              <div className="flex gap-3 mt-4">
                {step > 0 && (
                  <button onClick={handleBack} className="btn-secondary flex-1 justify-center">
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
                <button onClick={handleNext} disabled={!canNext()} className="btn-primary flex-1 justify-center">
                  {isDetailsStep(step) ? (
                    submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Booking...</>
                    ) : (
                      <><CheckCircle size={16} /> Confirm Booking</>
                    )
                  ) : (
                    <>
                      Continue <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in to confirm your booking"
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 bg-neutral-900 flex items-center justify-center mx-auto mb-4">
            <Lock size={20} className="text-primary-400" />
          </div>
          <p className="text-sm text-neutral-600">
            You have {bookingServices.length} {bookingServices.length === 1 ? 'service' : 'services'} selected
            {selectedDate && <> for {formatDate(selectedDate)}</>}
            {selectedSlot?.start && <> at {formatTime(selectedSlot.start)}.</>}
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Log in or create an account to confirm your booking. Your selections will be saved and restored automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button onClick={() => beginAuth('/login?redirect=/booking')} className="btn-primary px-8 justify-center">
              Log in
            </button>
            <button onClick={() => beginAuth('/register?redirect=/booking')} className="btn-secondary px-8 justify-center">
              Create account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}