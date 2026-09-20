import { useState, useEffect, useCallback } from 'react';
import {
  Crown,
  Copy,
  Check,
  Star,
  Gift,
  Users,
  Sparkles,
  Clock,
  TrendingUp,
  Tag,
  Send,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import formatPaymentMethod from '../../utils/formatPaymentMethod';
import { useAuth } from '@/context/AuthContext';
import {
  membershipsApi,
  membershipPlansApi,
  loyaltyApi,
  monthlyPerksApi,
  membershipGiftsApi,
} from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

export default function Membership() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [perk, setPerk] = useState<any>(null);
  const [referralBalance, setReferralBalance] = useState<number>(0);
  const [referralCode, setReferralCode] = useState<string>('');
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [referralName, setReferralName] = useState('');
  const [referralEmail, setReferralEmail] = useState('');
  const [giftName, setGiftName] = useState('');
  const [giftEmail, setGiftEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [usingPerk, setUsingPerk] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [availingPlanId, setAvailingPlanId] = useState<number | null>(null);
  const [availPaymentOpen, setAvailPaymentOpen] = useState(false);
  const [availPaymentPlan, setAvailPaymentPlan] = useState<any>(null);
  const [availSubmitting, setAvailSubmitting] = useState(false);
  const [availPaymentMethod, setAvailPaymentMethod] = useState('cash');
  const [availPaymentType, setAvailPaymentType] = useState<'FULL' | 'DOWN_PAYMENT'>('FULL');
  const [availAmountPaid, setAvailAmountPaid] = useState(0);
  const PAYMENT_METHODS = ['cash', 'gcash', 'gotyme', 'rcbc', 'paid_on_us'];

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await membershipPlansApi.browse();
        const items = data.data?.data || data.data?.items || data.data || [];
        setPlans(Array.isArray(items) ? items : []);
      } catch {
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleAvailPlan = async (planId: number) => {
    const plan = plans.find((p: any) => p.id === planId);
    if (plan) {
      setAvailPaymentPlan(plan);
      setAvailAmountPaid(Number(plan.promo_price ?? plan.regular_price ?? 0));
      setAvailPaymentOpen(true);
    }
  };

  const handleAvailPaymentSubmit = async () => {
    if (!availPaymentPlan) return;
    setAvailSubmitting(true);
    try {
      await membershipsApi.avail({
        plan_id: availPaymentPlan.id,
        payment_method: availPaymentMethod,
        payment_type: availPaymentType,
        amount_paid: availAmountPaid,
      });
      toast.success('Membership availed!');
      setAvailPaymentOpen(false);
      setAvailPaymentPlan(null);
      setMembership(null);
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to avail membership');
    } finally {
      setAvailSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [memRes, perkRes, milestoneRes, giftRes] = await Promise.allSettled([
        membershipsApi.getMe(),
        monthlyPerksApi.getMe(),
        loyaltyApi.listMilestones(),
        membershipGiftsApi.getMe(),
      ]);

      if (memRes.status === 'fulfilled') {
        const mem = memRes.value.data.data;
        setMembership(mem);
        if (mem?.id) {
          try {
            const progRes = await loyaltyApi.getProgress(mem.id);
            setLoyalty(progRes.data.data);
          } catch { /* skip */ }
        }
      }
      if (perkRes.status === 'fulfilled') {
        setPerk(perkRes.value.data.data);
      }
      if (milestoneRes.status === 'fulfilled') {
        const mData = milestoneRes.value.data.data;
        setMilestones(Array.isArray(mData) ? mData : mData?.items || []);
      }
      if (giftRes.status === 'fulfilled') {
        const gData = giftRes.value.data.data;
        setGifts(Array.isArray(gData) ? gData : gData?.items || []);
      }
    } catch {
      toast.error('Failed to load membership data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyCode = () => {
    const code = membership?.membership_code || referralCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied');
    }
  };

  const handleUsePerk = async () => {
    setUsingPerk(true);
    try {
      await monthlyPerksApi.use({ membership_id: membership?.id });
      toast.success('Monthly perk applied!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to use perk');
    } finally {
      setUsingPerk(false);
    }
  };

  const handleReferFriend = async () => {
    if (!referralName.trim() || !referralEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      // TODO: implement referral API
      toast.success('Referral feature coming soon!');
      setReferralModalOpen(false);
      setReferralName('');
      setReferralEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send referral');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGiftMembership = async () => {
    if (!giftName.trim() || !giftEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await membershipGiftsApi.create({
        membership_id: membership?.id,
        recipient_name: giftName.trim(),
        recipient_email: giftEmail.trim(),
      });
      toast.success('Gift nomination submitted!');
      setGiftModalOpen(false);
      setGiftName('');
      setGiftEmail('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send gift');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!membership) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">Membership</h1>
        <div className="card text-center py-12">
          <Crown className="mx-auto h-16 w-16 text-neutral-300 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Active Membership</h2>
          <p className="text-neutral-500 max-w-md mx-auto">
            You don't have an active membership yet. Choose a plan below to start enjoying exclusive perks and discounts.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Sparkles size={18} /> Available Plans
          </h2>
          {plansLoading ? (
            <LoadingSpinner fullScreen={false} />
          ) : plans.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-neutral-500">No membership plans available at the moment. Please check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((p: any) => {
                const planBenefits = Array.isArray(p.benefits) ? p.benefits : [];
                const duration = p.duration_months || 1;
                const promo = p.promo_price != null ? Number(p.promo_price) : null;
                const regular = p.regular_price != null ? Number(p.regular_price) : null;
                const displayPrice = promo ?? regular ?? 0;
                const hasDiscount = promo != null && regular != null && promo < regular;
                const isAvailing = availingPlanId === p.id;
                return (
                  <div key={p.id} className="card flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{p.name || p.plan_name}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {duration} month{duration > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Crown size={18} className="text-neutral-300" />
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-2xl font-bold text-neutral-900">
                        ₱{displayPrice.toLocaleString()}
                      </p>
                      {hasDiscount && (
                        <p className="text-sm text-neutral-400 line-through">
                          ₱{regular!.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-xs text-green-600 mb-2">
                        Save ₱{(regular! - promo!).toLocaleString()}
                      </p>
                    )}
                    {p.description && (
                      <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{p.description}</p>
                    )}

                    {planBenefits.length > 0 && (
                      <ul className="space-y-1.5 mb-4">
                        {planBenefits.slice(0, 4).map((b: any, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                            <CheckCircle2 size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{typeof b === 'string' ? b : b.name || b.description}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      onClick={() => handleAvailPlan(p.id)}
                      disabled={isAvailing}
                      className="btn-primary w-full mt-auto"
                    >
                      {isAvailing ? 'Processing...' : 'Avail Membership'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const plan = membership.membership_plan || membership.plan || {};
  const planName = plan.name || plan.plan_name || 'Membership';
  const benefits = plan.benefits || [];
  const startDate = membership.start_date || membership.created_at;
  const endDate = membership.end_date;
  const daysRemaining = endDate ? Math.max(0, dayjs(endDate).diff(dayjs(), 'day')) : null;
  const totalSpending = loyalty?.total_spend || loyalty?.total_spent || 0;
  const is12Month = plan.duration_months >= 12 || plan.duration === 12 || plan.duration_months === 12;

  const perkStatus = perk?.status || 'unavailable';
  const perkUsedDate = perk?.used_at || perk?.used_date;

  const loyaltyTarget = loyalty?.next_milestone?.target_amount || loyalty?.target || 18000;
  const loyaltyProgress = Math.min(100, (totalSpending / loyaltyTarget) * 100);

  return (
    <>
      <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Membership</h1>

      {/* Membership Card */}
      <div className="bg-neutral-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-10" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1">SOUVARI SKIN LAB</p>
              <p className="font-sans text-2xl font-semibold">{planName}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={membership.status || 'active'} />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-neutral-400">Member</p>
            <p className="text-lg font-semibold">
              {user?.customer?.first_name} {user?.customer?.last_name}
            </p>
          </div>

          <div className="flex items-center gap-3 mb-6 p-3 bg-white/10 rounded-xl">
            <p className="text-sm font-mono tracking-wider flex-1">
              {membership.membership_code || 'SOUVARI-VIP-XXXXXX'}
            </p>
            <button onClick={copyCode} className="p-1.5 hover:bg-white/10 rounded-lg transition">
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-neutral-400 text-xs">Start Date</p>
              <p className="font-medium mt-0.5">{dayjs(startDate).format('MMM D, YYYY')}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs">End Date</p>
              <p className="font-medium mt-0.5">
                {endDate ? dayjs(endDate).format('MMM D, YYYY') : 'No Expiry'}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs">Days Left</p>
              <p className="font-medium mt-0.5">
                {daysRemaining !== null ? `${daysRemaining} days` : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <TrendingUp size={18} className="text-neutral-600" />
            </div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Total Spending</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">₱{totalSpending.toLocaleString()}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Users size={18} className="text-neutral-600" />
            </div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Referral Credits</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">₱{referralBalance.toLocaleString()}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Clock size={18} className="text-neutral-600" />
            </div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Days Remaining</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {daysRemaining !== null ? daysRemaining : '--'}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Sparkles size={18} className="text-neutral-600" />
            </div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Monthly Perk</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {perkStatus === 'used' ? 'Used' : perkStatus === 'available' ? 'Available' : 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Benefits */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Star size={18} /> My Benefits
          </h2>
          {benefits.length > 0 ? (
            <ul className="space-y-3">
              {benefits.map((b: any, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-neutral-700">
                    {typeof b === 'string' ? b : b.description || b.name || JSON.stringify(b)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <Star className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500">No benefits listed for this plan</p>
            </div>
          )}
        </div>

        {/* Monthly Perk */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Sparkles size={18} /> Monthly Perk
          </h2>
          <p className="text-xs text-neutral-500 mb-4">
            {dayjs().format('MMMM YYYY')}
          </p>

          {perkStatus === 'available' ? (
            <div className="bg-neutral-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Tag size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">₱300 Off Discount</p>
                  <p className="text-xs text-neutral-500">Min. spend of ₱800 required</p>
                </div>
              </div>
              <button onClick={handleUsePerk} disabled={usingPerk} className="btn-primary w-full">
                {usingPerk ? 'Applying...' : 'Use Perk'}
              </button>
            </div>
          ) : perkStatus === 'used' ? (
            <div className="bg-neutral-50 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-neutral-200 rounded-xl">
                  <CheckCircle2 size={20} className="text-neutral-500" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Perk Used</p>
                  <p className="text-xs text-neutral-500">
                    {perkUsedDate ? `Used on ${dayjs(perkUsedDate).format('MMM D, YYYY')}` : 'Already used this month'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-xl p-5 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500">
                No monthly perk available for this plan
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loyalty Progress */}
      <div className="card">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} /> Loyalty Progress
        </h2>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-500">Current Spend</span>
            <span className="font-semibold text-neutral-900">
              ₱{totalSpending.toLocaleString()} / ₱{loyaltyTarget.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-3">
            <div
              className="bg-neutral-900 h-3 rounded-full transition-all duration-500"
              style={{ width: `${loyaltyProgress}%` }}
            />
          </div>
        </div>

        {milestones.length > 0 && (
          <div className="space-y-2">
            {milestones.map((m: any) => {
              const target = m.target_amount || m.amount || 0;
              const reached = totalSpending >= target;
              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    reached ? 'bg-green-50' : 'bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {reached ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                    )}
                    <span className="text-sm font-medium text-neutral-900">
                      {m.name || `₱${target.toLocaleString()} Milestone`}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {reached ? 'Achieved' : `₱${target.toLocaleString()}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {milestones.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-neutral-500">No milestones configured yet</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Users size={18} /> Referrals
          </h2>

          <div className="bg-neutral-50 rounded-xl p-4 mb-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <p className="font-mono text-lg font-semibold text-neutral-900 flex-1">
                {referralCode || 'N/A'}
              </p>
              {referralCode && (
                <button onClick={copyReferralCode} className="btn-ghost text-sm">
                  <Copy size={14} /> Copy
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl mb-4">
            <span className="text-sm text-neutral-500">Available Credit</span>
            <span className="text-xl font-bold text-neutral-900">₱{referralBalance.toLocaleString()}</span>
          </div>

          <button onClick={() => setReferralModalOpen(true)} className="btn-primary w-full">
            <Send size={16} /> Refer a Friend
          </button>
        </div>

        {/* Gift Membership */}
        {is12Month && (
          <div className="card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Gift size={18} /> Gift Membership
            </h2>

            <p className="text-sm text-neutral-500 mb-4">
              As a 12-month member, you can nominate a friend to receive a complimentary membership.
            </p>

            {gifts.length > 0 && (
              <div className="space-y-3 mb-4">
                {gifts.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {g.recipient_name || g.name || 'Friend'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {g.recipient_email || g.email || ''}
                      </p>
                    </div>
                    <StatusBadge status={g.status || 'pending'} />
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setGiftModalOpen(true)} className="btn-secondary w-full">
              <Gift size={16} /> Nominate a Friend
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Activity size={18} /> Recent Activity
        </h2>

        {loyalty?.recent_activity && loyalty.recent_activity.length > 0 ? (
          <div className="space-y-3">
            {loyalty.recent_activity.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition">
                <div className={`p-2 rounded-lg ${
                  a.type === 'spend' ? 'bg-blue-100 text-blue-600' :
                  a.type === 'perk' ? 'bg-green-100 text-green-600' :
                  a.type === 'referral' ? 'bg-purple-100 text-purple-600' :
                  'bg-neutral-100 text-neutral-600'
                }`}>
                  {a.type === 'spend' ? <TrendingUp size={16} /> :
                   a.type === 'perk' ? <Sparkles size={16} /> :
                   a.type === 'referral' ? <Users size={16} /> :
                   <Activity size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {a.description || a.title || 'Activity'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {dayjs(a.created_at || a.date).format('MMM D, YYYY h:mm A')}
                  </p>
                </div>
                {a.amount && (
                  <span className={`text-sm font-semibold ${
                    a.type === 'spend' ? 'text-neutral-900' : 'text-green-600'
                  }`}>
                    {a.type === 'spend' ? '-' : '+'}₱{Math.abs(a.amount).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No recent activity</p>
          </div>
        )}
      </div>

      {/* Refer a Friend Modal */}
      <Modal open={referralModalOpen} onClose={() => setReferralModalOpen(false)} title="Refer a Friend">
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Share the experience! Your friend will receive a special offer when they visit.
          </p>
          <div>
            <label className="label">Friend's Name</label>
            <input
              value={referralName}
              onChange={(e) => setReferralName(e.target.value)}
              className="input-field"
              placeholder="Juan Dela Cruz"
            />
          </div>
          <div>
            <label className="label">Friend's Email</label>
            <input
              type="email"
              value={referralEmail}
              onChange={(e) => setReferralEmail(e.target.value)}
              className="input-field"
              placeholder="juan@example.com"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setReferralModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleReferFriend} disabled={submitting} className="btn-primary">
              {submitting ? 'Sending...' : 'Send Referral'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Gift Membership Modal */}
      <Modal open={giftModalOpen} onClose={() => setGiftModalOpen(false)} title="Gift a Membership">
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Nominate a friend to receive a complimentary membership as a gift.
          </p>
          <div>
            <label className="label">Friend's Name</label>
            <input
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
              className="input-field"
              placeholder="Juan Dela Cruz"
            />
          </div>
          <div>
            <label className="label">Friend's Email</label>
            <input
              type="email"
              value={giftEmail}
              onChange={(e) => setGiftEmail(e.target.value)}
              className="input-field"
              placeholder="juan@example.com"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setGiftModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleGiftMembership} disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting...' : 'Send Gift'}
            </button>
          </div>
        </div>
      </Modal>
    </div>

      {/* Avail Payment Modal */}
      {availPaymentOpen && availPaymentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-md shadow-xl">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Avail Membership</h2>
              <p className="text-sm text-neutral-500 mt-1">{availPaymentPlan.name}</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-neutral-50 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Plan Price</span>
                  <span className="font-semibold">₱{Number(availPaymentPlan.promo_price ?? availPaymentPlan.regular_price ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700">Payment Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setAvailPaymentType('FULL'); setAvailAmountPaid(Number(availPaymentPlan.promo_price ?? availPaymentPlan.regular_price ?? 0)); }}
                    className={`flex-1 py-2 px-3 text-sm rounded-md border transition ${availPaymentType === 'FULL' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-700 hover:border-primary-500'}`}
                  >
                    Full Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAvailPaymentType('DOWN_PAYMENT'); setAvailAmountPaid(Math.round(Number(availPaymentPlan.promo_price ?? availPaymentPlan.regular_price ?? 0) * 0.3)); }}
                    className={`flex-1 py-2 px-3 text-sm rounded-md border transition ${availPaymentType === 'DOWN_PAYMENT' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-700 hover:border-primary-500'}`}
                  >
                    Down Payment (30%)
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700">Payment Method</label>
                <select value={availPaymentMethod} onChange={e => setAvailPaymentMethod(e.target.value)} className="select-field">
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{formatPaymentMethod(m)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700">Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={Number(availPaymentPlan.promo_price ?? availPaymentPlan.regular_price ?? 0)}
                  value={availAmountPaid}
                  onChange={e => setAvailAmountPaid(parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex gap-3 justify-end">
              <button onClick={() => { setAvailPaymentOpen(false); setAvailPaymentPlan(null); }} className="btn-secondary" disabled={availSubmitting}>
                Cancel
              </button>
              <button onClick={handleAvailPaymentSubmit} disabled={availSubmitting} className="btn-primary">
                {availSubmitting ? 'Processing...' : 'Confirm & Avail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
