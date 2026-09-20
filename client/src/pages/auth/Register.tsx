import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ChatbotWidget from '../../components/chatbot/ChatbotWidget';

interface RegisterForm {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (values: RegisterForm) => {
    try {
      const { confirm_password, ...data } = values;
      const userData = await registerUser(data);
      toast.success('Account created successfully!');
      const isSafeRedirect =
        userData.role === 'customer' &&
        redirectTo &&
        redirectTo.startsWith('/') &&
        !redirectTo.startsWith('//');
      navigate(isSafeRedirect ? redirectTo : '/customer', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Simple top nav */}
      <div className="border-b border-neutral-800 bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/images/souvari-logo.png" alt="Souvari Skin Lab" className="h-14 w-auto object-contain" />
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-neutral-200 p-8 md:p-10">
          <div className="text-center mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-600">Join us</p>
            <h1 className="mt-4 text-3xl font-sans font-semibold text-neutral-900">Create account</h1>
            <p className="text-sm text-neutral-500 mt-2">Join us to book your first appointment</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  className="input-field"
                  {...register('first_name', { required: 'Required' })}
                />
                {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  className="input-field"
                  {...register('last_name', { required: 'Required' })}
                />
                {errors.last_name && <p className="text-xs text-red-600 mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                className="input-field"
                placeholder="+63 917 123 4567"
                {...register('phone')}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder=""
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
                })}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Re-enter your password"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirm_password && <p className="text-xs text-red-600 mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-3">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-7">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Floating Chatbot */}
      <ChatbotWidget />
    </div>
  );
}