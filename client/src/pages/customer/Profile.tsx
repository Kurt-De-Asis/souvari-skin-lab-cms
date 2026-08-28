import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { customersApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ProfileForm {
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  address: string;
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await customersApi.getMe();
        const c = data.data;
        reset({
          first_name: c.first_name || '',
          last_name: c.last_name || '',
          phone: c.phone || '',
          gender: c.gender || '',
          date_of_birth: c.date_of_birth ? c.date_of_birth.split('T')[0] : '',
          address: c.address || '',
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (formData: ProfileForm) => {
    setSaving(true);
    try {
      await customersApi.updateMe(formData);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>

      <div className="card">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-100">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={28} className="text-primary-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{user?.customer?.first_name} {user?.customer?.last_name}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">First Name</label>
              <input
                {...register('first_name', { required: 'First name is required' })}
                className="input-field"
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                {...register('last_name', { required: 'Last name is required' })}
                className="input-field"
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              {...register('phone')}
              className="input-field"
              placeholder="+63 917 123 4567"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Gender</label>
              <select {...register('gender')} className="select-field">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input
                type="date"
                {...register('date_of_birth')}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              {...register('address')}
              className="input-field"
              rows={3}
              placeholder="Your address"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="btn-primary"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
