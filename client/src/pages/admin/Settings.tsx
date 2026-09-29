import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Building2, Clock, AlertTriangle, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentsApi, settingsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface SettingsForm {
  clinic_name: string;
  clinic_phone: string;
  clinic_email: string;
  clinic_address: string;
  business_hours_start: string;
  business_hours_end: string;
}

/** Monday-first, matching the server's canonical weekday ordering. */
const DAY_CHOICES = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const DAY_LABELS: Record<string, string> = Object.fromEntries(
  DAY_CHOICES.map((d) => [d.value, d.label])
);

const DEFAULT_OPEN_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Open days live outside react-hook-form because they need custom toggle
  // behaviour and an async collision check before the user commits.
  const [openDays, setOpenDays] = useState<string[]>(DEFAULT_OPEN_DAYS);
  const [daysError, setDaysError] = useState('');
  const [impactWarning, setImpactWarning] = useState('');
  const [checkingImpact, setCheckingImpact] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsForm>({
    defaultValues: {
      clinic_name: '',
      clinic_phone: '',
      clinic_email: '',
      clinic_address: '',
      business_hours_start: '09:00',
      business_hours_end: '18:00',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await settingsApi.getAll();
        const items: any[] = Array.isArray(data.data) ? data.data : [];
        const s: Record<string, any> = {};
        items.forEach((item: any) => {
          s[item.key] = item.value;
        });
        const days = Array.isArray(s.business_days) && s.business_days.length > 0
          ? s.business_days
          : DEFAULT_OPEN_DAYS;
        // Store in canonical order regardless of how the row was saved.
        setOpenDays(DAY_CHOICES.map((d) => d.value).filter((d) => days.includes(d)));
        reset({
          clinic_name: s.clinic_name || '',
          clinic_phone: s.clinic_phone || '',
          clinic_email: s.clinic_email || '',
          clinic_address: s.clinic_address || '',
          business_hours_start: s.business_hours_start || '09:00',
          business_hours_end: s.business_hours_end || '18:00',
        });
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  // Warn — but do not block — when closing a day that already has live bookings
  // on it. The clinic is allowed to close a day; it just needs to know.
  const checkImpact = useCallback(async (closing: string[]) => {
    if (closing.length === 0) {
      setImpactWarning('');
      return;
    }
    setCheckingImpact(true);
    try {
      const { data } = await appointmentsApi.getOperatingDaysImpact(closing);
      const rows: Array<{ day: string; upcoming_count: number }> = data.data ?? [];
      const withBookings = rows.filter((r) => r.upcoming_count > 0);
      if (withBookings.length === 0) {
        setImpactWarning('');
      } else {
        const summary = withBookings
          .map((r) => `${r.upcoming_count} upcoming booking${r.upcoming_count === 1 ? '' : 's'} on ${DAY_LABELS[r.day] ?? r.day}`)
          .join(', ');
        setImpactWarning(
          `${summary}. Closing ${withBookings.length === 1 ? 'this day' : 'these days'} will not remove ` +
          `existing appointments — customers will simply stop being able to book new ones.`
        );
      }
    } catch {
      // The warning is advisory; a failure here must not block saving.
      setImpactWarning('');
    } finally {
      setCheckingImpact(false);
    }
  }, []);

  const toggleDay = (day: string) => {
    // Preserve canonical ordering rather than toggle order.
    const toggled = openDays.includes(day)
      ? openDays.filter((d) => d !== day)
      : [...openDays, day];
    const next = DAY_CHOICES.map((d) => d.value).filter((d) => toggled.includes(d));

    setOpenDays(next);
    setDaysError('');

    // Only closing days can strand existing appointments.
    void checkImpact(openDays.filter((d) => !next.includes(d)));
  };

  const onSubmit = async (values: SettingsForm) => {
    if (openDays.length === 0) {
      setDaysError('Select at least one day the clinic is open.');
      return;
    }
    setSaving(true);
    try {
      const settings = [
        ...(Object.keys(values) as Array<keyof SettingsForm>).map((key) => ({ key, value: values[key] })),
        { key: 'business_days', value: openDays },
      ];
      await settingsApi.update({ settings });
      setImpactWarning('');
      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-sans font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Configure your clinic system preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-primary-600" />
            <h2 className="font-semibold text-neutral-900">General Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Clinic Name</label>
              <input className="input-field" placeholder="Clinic name" {...register('clinic_name', { required: 'Required' })} />
              {errors.clinic_name && <p className="text-xs text-red-600 mt-1">{errors.clinic_name.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="input-field" placeholder="Phone number" {...register('clinic_phone')} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="email@example.com" {...register('clinic_email')} />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input-field" placeholder="Clinic address" {...register('clinic_address')} />
            </div>
          </div>
        </div>

        {/* Business Hours Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-primary-600" />
            <h2 className="font-semibold text-neutral-900">Business Hours</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Opening Time</label>
              <input type="time" className="input-field" {...register('business_hours_start', { required: 'Required' })} />
              {errors.business_hours_start && <p className="text-xs text-red-600 mt-1">{errors.business_hours_start.message}</p>}
            </div>
            <div>
              <label className="label">Closing Time</label>
              <input type="time" className="input-field" {...register('business_hours_end', { required: 'Required' })} />
              {errors.business_hours_end && <p className="text-xs text-red-600 mt-1">{errors.business_hours_end.message}</p>}
            </div>
          </div>
        </div>

        {/* Operating Days Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={18} className="text-primary-600" />
            <h2 className="font-semibold text-neutral-900">Days We Are Open</h2>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Days that are switched off are hidden from customers — they cannot book or request an
            appointment on them.
          </p>

          <div className="flex flex-wrap gap-2">
            {DAY_CHOICES.map((day) => {
              const active = openDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-pressed={active}
                  className={`min-w-[3.25rem] px-3 py-2 rounded-md text-sm font-medium border transition ${
                    active
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-white border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>

          {daysError && <p className="text-xs text-red-600 mt-2">{daysError}</p>}

          {checkingImpact && (
            <p className="text-xs text-neutral-400 mt-3">Checking existing bookings...</p>
          )}

          {impactWarning && !checkingImpact && (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 p-3 mt-3">
              <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-900">{impactWarning}</p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
