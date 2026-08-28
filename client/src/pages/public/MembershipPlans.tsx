import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  Check,
  Star,
  Percent,
  Gift,
  Shield,
  ArrowRight,
  Sparkles,
  Calendar,
  Tag,
} from 'lucide-react';
import { membershipPlansApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

interface MembershipBenefit {
  id: number;
  name: string;
  description: string | null;
  discount_pct: number | null;
  is_active: boolean;
}

interface MembershipPlan {
  id: number;
  name: string;
  tier: string;
  duration_months: number;
  regular_price: number;
  promo_price: number;
  discount_pct: number | null;
  description: string | null;
  is_active: boolean;
  benefits: MembershipBenefit[];
}

const VIP_BENEFITS = [
  {
    icon: Percent,
    title: '25% Off Services',
    description: 'Enjoy exclusive discounts on all aesthetic treatments and procedures.',
  },
  {
    icon: Calendar,
    title: 'Free Booking Fee',
    description: 'No booking fees — schedule your appointments without extra charges.',
  },
  {
    icon: Gift,
    title: 'Monthly Perks',
    description: 'Receive complimentary services and products every month.',
  },
  {
    icon: Star,
    title: 'Referral Rewards',
    description: 'Earn credits for every friend you refer to the clinic.',
  },
  {
    icon: Shield,
    title: 'Quality Promise',
    description: 'Access to premium treatments and priority scheduling.',
  },
];

function getDurationLabel(months: number): string {
  if (months >= 12) return '12 Months';
  if (months === 6) return '6 Months';
  return `${months} Months`;
}

function getPricePerDay(promoPrice: number, months: number): number {
  const totalDays = months * 30;
  return Math.round((promoPrice / totalDays) * 100) / 100;
}

function formatPrice(value: number): string {
  return value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function MembershipPlans() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await membershipPlansApi.browse();
        const raw = data.data || [];
        setPlans(
          (Array.isArray(raw) ? raw : []).map((p: any) => ({
            ...p,
            regular_price: Number(p.regular_price) || 0,
            promo_price: Number(p.promo_price) || 0,
            discount_pct: p.discount_pct ? Number(p.discount_pct) : null,
            duration_months: Number(p.duration_months) || 0,
            benefits: Array.isArray(p.benefits) ? p.benefits : [],
          }))
        );
      } catch {
        toast.error('Failed to load membership plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const sortedPlans = [...plans].sort((a, b) => a.tier.localeCompare(b.tier) || a.regular_price - b.regular_price);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 rounded-full px-4 py-1.5 text-xs font-medium mb-6">
            <Sparkles size={14} />
            Exclusive Membership
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-neutral-900 leading-[1.1] tracking-tight">
            VIP Elite Platinum Membership
          </h1>
          <p className="mt-6 text-lg text-neutral-500 leading-relaxed max-w-2xl mx-auto">
            Unlock exclusive access to premium treatments, unmatched savings, and VIP
            privileges designed for our most valued clients.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900">Choose Your Plan</h2>
            <p className="mt-2 text-neutral-500">Select the membership that fits your lifestyle and beauty goals.</p>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" />
          ) : sortedPlans.length === 0 ? (
            <div className="text-center py-16">
              <Crown size={40} className="mx-auto text-neutral-300 mb-4" />
              <p className="text-neutral-500">No membership plans available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedPlans.map((plan) => {
                const savings = plan.regular_price - plan.promo_price;
                const pricePerDay = getPricePerDay(plan.promo_price, plan.duration_months);

                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col hover:shadow-md transition-shadow"
                  >
                    <div className="mb-4">
                      <span className="badge badge-primary capitalize">{plan.tier.replace('_', ' ')}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">{plan.name}</h3>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-5">
                      <Calendar size={12} />
                      <span>{getDurationLabel(plan.duration_months)}</span>
                    </div>

                    {/* Pricing */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-neutral-900">
                          ₱{formatPrice(plan.promo_price)}
                        </span>
                        {plan.regular_price > plan.promo_price && (
                          <span className="text-sm text-neutral-400 line-through">
                            ₱{formatPrice(plan.regular_price)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        ₱{formatPrice(pricePerDay)} / day
                      </p>
                    </div>

                    {/* Savings Badge */}
                    {savings > 0 && (
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 rounded-lg px-3 py-2 text-xs font-medium mb-5">
                        <Tag size={12} />
                        Save ₱{formatPrice(savings)}
                        {plan.discount_pct && plan.discount_pct > 0 && (
                          <span className="ml-1">({plan.discount_pct}% off)</span>
                        )}
                      </div>
                    )}

                    {/* Benefits */}
                    {plan.benefits.length > 0 && (
                      <div className="flex-1 mb-6">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Benefits</p>
                        <ul className="space-y-2">
                          {plan.benefits.slice(0, 4).map((benefit) => (
                            <li key={benefit.id} className="flex items-start gap-2 text-sm text-neutral-600">
                              <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                              <span>{benefit.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      to="/booking"
                      className="btn-primary w-full text-sm justify-center mt-auto"
                    >
                      Select Membership
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* VIP Benefits Overview */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900">VIP Member Benefits</h2>
            <p className="mt-2 text-neutral-500">Every membership comes with these exclusive perks.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VIP_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="bg-neutral-50 rounded-xl border border-neutral-100 p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-1.5">{benefit.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <Crown size={36} className="mx-auto text-amber-400 mb-4" />
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">Ready to Go VIP?</h2>
          <p className="mt-3 text-neutral-400 max-w-xl mx-auto">
            Sign up today and start enjoying premium benefits, exclusive discounts, and personalized care.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/booking" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100">
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 px-7 py-3 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
