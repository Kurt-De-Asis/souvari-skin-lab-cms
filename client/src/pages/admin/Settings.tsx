import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Building2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface SettingsForm {
  clinic_name: string;
  clinic_phone: string;
  clinic_email: string;
  clinic_address: string;
  business_hours_start: string;
  business_hours_end: string;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const onSubmit = async (values: SettingsForm) => {
    setSaving(true);
    try {
      await settingsApi.update({
        settings: (Object.keys(values) as Array<keyof SettingsForm>).map((key) => ({ key, value: values[key] })),
      });
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
