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
import Reveal from '@/components/ui/Reveal';
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
      <section className="bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 border border-primary-500/60 text-primary-400 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] mb-6">
            <Sparkles size={13} />
            Exclusive Membership
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-semibold text-white leading-[1.1] tracking-tight">
            VIP Elite Platinum Membership
          </h1>
          <p className="mt-6 text-lg text-neutral-300 leading-relaxed max-w-2xl mx-auto">
            Unlock exclusive access to premium treatments, unmatched savings, and VIP
            privileges designed for our most valued clients.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-600">Membership</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold text-neutral-900">Choose Your Plan</h2>
              <p className="mt-3 text-neutral-500 max-w-xl mx-auto">Select the membership that fits your lifestyle and beauty goals.</p>
            </div>
          </Reveal>

          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : sortedPlans.length === 0 ? (
            <div className="text-center py-16">
              <Crown size={40} className="mx-auto text-neutral-300 mb-4" />
              <p className="text-neutral-500">No membership plans available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedPlans.map((plan, i) => {
                const savings = plan.regular_price - plan.promo_price;
                const pricePerDay = getPricePerDay(plan.promo_price, plan.duration_months);

                return (
                  <Reveal key={plan.id} delay={Math.min(i * 60, 180)}>
                    <div
                      className="bg-white border border-neutral-200 p-7 flex flex-col h-full hover:border-primary-500/50 transition-colors"
                    >
                    <div className="mb-4">
                      <span className="badge badge-primary">{plan.tier.replace('_', ' ')}</span>
                    </div>

                    <h3 className="font-sans text-xl font-semibold text-neutral-900 mb-1">{plan.name}</h3>

                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-neutral-400 mb-6">
                      <Calendar size={12} className="text-primary-600" />
                      <span>{getDurationLabel(plan.duration_months)}</span>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="font-sans text-3xl font-sans font-semibold text-neutral-900">
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
                      <div className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-100 px-3 py-2 text-xs font-medium mb-6">
                        <Tag size={12} />
                        Save ₱{formatPrice(savings)}
                        {plan.discount_pct && plan.discount_pct > 0 && (
                          <span className="ml-1">({plan.discount_pct}% off)</span>
                        )}
                      </div>
                    )}

                    {/* Benefits */}
                    {plan.benefits.length > 0 && (
                      <div className="flex-1 mb-7">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-[0.2em] mb-3">Benefits</p>
                        <ul className="space-y-2.5">
                          {plan.benefits.slice(0, 4).map((benefit) => (
                            <li key={benefit.id} className="flex items-start gap-2 text-sm text-neutral-600">
                              <Check size={14} className="text-primary-600 mt-0.5 shrink-0" />
                              <span>{benefit.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      to="/booking"
                      className="btn-primary w-full justify-center mt-auto"
                    >
                      Select Membership
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* VIP Benefits Overview */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-600">Perks</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold text-neutral-900">VIP Member Benefits</h2>
              <p className="mt-3 text-neutral-500 max-w-xl mx-auto">Every membership comes with these exclusive perks.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VIP_BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <Reveal key={benefit.title} delay={Math.min(i * 50, 200)}>
                  <div
                    className="bg-neutral-50 border border-neutral-200 p-7 h-full transition-colors hover:border-primary-500/40"
                  >
                    <div className="h-11 w-11 border border-primary-500/50 flex items-center justify-center mb-5">
                      <Icon size={18} className="text-primary-600" />
                    </div>
                    <h3 className="font-sans text-lg font-semibold text-neutral-900 mb-1.5">{benefit.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">{benefit.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <Crown size={36} className="mx-auto text-primary-400 mb-5" />
          <h2 className="text-3xl sm:text-4xl font-sans font-semibold text-white">Ready to Go VIP?</h2>
          <p className="mt-3 text-neutral-400 max-w-xl mx-auto">
            Sign up today and start enjoying premium benefits, exclusive discounts, and personalized care.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link to="/booking" className="btn-primary bg-primary-500 text-neutral-900 hover:bg-primary-400">
              Get Started
              <ArrowRight size={13} />
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 border border-neutral-600 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-200 transition hover:border-white hover:text-white">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}