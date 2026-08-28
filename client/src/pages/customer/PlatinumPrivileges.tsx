import { useState, useEffect } from 'react';
import { Check, Copy, Crown, Sparkles, Gift, Shield, Calendar, Percent, Star, Scissors, Palette, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { membershipsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function PlatinumPrivileges() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const { data } = await membershipsApi.getMe();
        setMembership(data.data);
      } catch {
        // No membership found
      } finally {
        setLoading(false);
      }
    };
    fetchMembership();
  }, []);

  const bookingCode = membership?.booking_code || `SOUVARI-VIP-${String(user?.customer?.id || 0).padStart(6, '0')}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(bookingCode);
      setCopied(true);
      toast.success('Booking code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white tracking-wide uppercase">
            <Crown size={14} />
            Platinum Member
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 tracking-tight">
            Your Platinum Privileges
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            As a valued Souvari Platinum member, you unlock an elevated experience with exclusive VIP benefits designed just for you.
          </p>
        </div>

        {/* Booking Code Card */}
        <div className="card max-w-md mx-auto text-center space-y-4 border-2 border-neutral-900 bg-neutral-50">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Your VIP Booking Code</p>
            <p className="text-2xl font-mono font-bold text-neutral-900 tracking-widest">{bookingCode}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="btn-primary w-full"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <p className="text-xs text-neutral-400">
            Enter this code during booking to identify yourself as a VIP member
          </p>
        </div>
      </section>

      {/* Unlimited Member Savings */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary-600">
            <Percent size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">Exclusive Savings</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-neutral-900">Unlimited Member Savings</h2>
          <p className="text-neutral-500">Enjoy these privileges on every visit — no limits, no conditions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 25% OFF Beauty Bloom */}
          <div className="card group hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-100 transition flex-shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-neutral-900">25% OFF</span>
                </div>
                <p className="text-sm font-medium text-neutral-900">Beauty Bloom Enhancers</p>
                <p className="text-xs text-neutral-500 mt-1">Save on our curated range of beauty enhancement products.</p>
              </div>
            </div>
          </div>

          {/* 25% OFF All Services */}
          <div className="card group hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition flex-shrink-0">
                <Scissors size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-neutral-900">25% OFF</span>
                </div>
                <p className="text-sm font-medium text-neutral-900">All Single Services & Packages</p>
                <p className="text-xs text-neutral-500 mt-1">Every service, every package — always at a discount.</p>
              </div>
            </div>
          </div>

          {/* 25% OFF Curated Packages */}
          <div className="card group hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition flex-shrink-0">
                <Gift size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-neutral-900">25% OFF</span>
                </div>
                <p className="text-sm font-medium text-neutral-900">Curated Packages</p>
                <p className="text-xs text-neutral-500 mt-1">Glow Combos, Waxing Combos, and the 7-Session Series.</p>
              </div>
            </div>
          </div>

          {/* Unlimited Nail Art */}
          <div className="card group hover:shadow-md transition relative overflow-hidden border-2 border-amber-200">
            <div className="absolute top-3 right-3">
              <span className="badge bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                Limited Time Offer
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition flex-shrink-0">
                <Palette size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-neutral-900">₱1,999</span>
                </div>
                <p className="text-sm font-medium text-neutral-900">Unlimited Nail Art + Extensions</p>
                <p className="text-xs text-neutral-500 mt-1">Limitless creativity — go as bold as you want, as often as you want.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your VIP Treatment */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary-600">
            <Star size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">VIP Treatment</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-neutral-900">Your VIP Treatment</h2>
          <p className="text-neutral-500">The extras that make every visit seamless and special.</p>
        </div>

        <div className="space-y-4">
          {/* Frictionless Booking */}
          <div className="card flex items-start gap-5">
            <div className="p-3 rounded-xl bg-green-50 text-green-600 flex-shrink-0">
              <Calendar size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-neutral-900">Frictionless Booking</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Your ₱300 booking fee is <span className="font-semibold text-neutral-900">waived</span> — every single time.
              </p>
            </div>
            <div className="flex-shrink-0 mt-1">
              <Check size={20} className="text-green-500" />
            </div>
          </div>

          {/* Monthly Treat */}
          <div className="card flex items-start gap-5">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 flex-shrink-0">
              <Gift size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-neutral-900">Monthly Treat</h3>
              <p className="text-sm text-neutral-600 mt-1">
                One complimentary perk each month — up to ₱300 value on a minimum spend of ₱800.
              </p>
            </div>
            <div className="flex-shrink-0 mt-1">
              <Check size={20} className="text-green-500" />
            </div>
          </div>

          {/* Always-On Upgrades */}
          <div className="card flex items-start gap-5">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 flex-shrink-0">
              <Zap size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-neutral-900">Always-On Upgrades</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Enjoy a <span className="font-semibold text-neutral-900">Free Polish Add-On</span> and{' '}
                <span className="font-semibold text-neutral-900">Free LED Light Therapy</span> with every qualifying service.
              </p>
            </div>
            <div className="flex-shrink-0 mt-1">
              <Check size={20} className="text-green-500" />
            </div>
          </div>
        </div>
      </section>

      {/* The Souvari Quality Promise */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary-600">
            <Shield size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">Quality Promise</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-neutral-900">The Souvari Quality Promise</h2>
          <p className="text-neutral-500">Extended coverage because we stand behind our work.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card text-center space-y-3 py-8">
            <div className="inline-flex mx-auto p-4 rounded-full bg-blue-50 text-blue-600">
              <Calendar size={28} />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">10 Days</p>
              <p className="text-sm font-medium text-neutral-900 mt-1">Extended Lash Refill</p>
              <p className="text-xs text-neutral-500 mt-2 max-w-xs mx-auto">
                Enjoy an extended window for lash refills — because your look should last.
              </p>
            </div>
          </div>

          <div className="card text-center space-y-3 py-8">
            <div className="inline-flex mx-auto p-4 rounded-full bg-teal-50 text-teal-600">
              <Shield size={28} />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">5 Days</p>
              <p className="text-sm font-medium text-neutral-900 mt-1">Extended Gel Rework</p>
              <p className="text-xs text-neutral-500 mt-2 max-w-xs mx-auto">
                If you're not happy with your gel set, we'll make it right within 5 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center py-8 border-t border-neutral-100">
        <p className="text-sm text-neutral-400">
          Questions about your Platinum privileges? Reach out at the front desk or message us anytime.
        </p>
      </section>
    </div>
  );
}
