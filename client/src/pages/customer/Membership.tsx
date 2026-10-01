import { useState, useEffect, useCallback } from 'react';
import {
  Crown,
  Copy,
  Check,
  Star,
  Users,
  Sparkles,
  Clock,
  TrendingUp,
  Tag,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  membershipsApi,
  loyaltyApi,
  monthlyPerksApi,
} from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';

export default function Membership() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [perk, setPerk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [usingPerk, setUsingPerk] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [memRes, perkRes] = await Promise.allSettled([
        membershipsApi.getMe(),
        monthlyPerksApi.getMe(),
      ]);

      if (memRes.status === 'fulfilled') {
        const mem = memRes.value.data.data;
        setMembership(mem);
        try {
          const progRes = await loyaltyApi.getMe();
          setLoyalty(progRes.data.data);
        } catch { /* skip */ }
      }
      if (perkRes.status === 'fulfilled') {
        setPerk(perkRes.value.data.data);
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
    const code = membership?.code || membership?.membership_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUsePerk = async () => {
    setUsingPerk(true);
    try {
      await monthlyPerksApi.use({ membership_id: membership?.id, discount_amount: Number(perk?.max_value ?? 300) });
      toast.success('Monthly perk applied!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to use perk');
    } finally {
      setUsingPerk(false);
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
            You don't have an active membership. To join a plan, please visit the clinic — our staff
            can set one up for you.
          </p>
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
  const totalSpending = Number(loyalty?.progress?.total_spend ?? loyalty?.total_spend ?? loyalty?.total_spent ?? 0);

  const perkStatus = perk?.status || 'unavailable';
  const perkUsedDate = perk?.used_at || perk?.used_date;

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
              {membership.code || 'SOUVARI-VIP-XXXXXX'}
            </p>
            <button onClick={copyCode} className="p-1.5 hover:bg-white/10 rounded-lg transition">
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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

      {/* Balance / Pay-in-store banner */}
      {membership.payment_status === 'partial' && Number(membership.balance) > 0 && (
        <div className={`rounded-xl border p-4 ${membership.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className={`text-sm font-semibold ${membership.status === 'failed' ? 'text-red-700' : 'text-neutral-900'}`}>
                {membership.status === 'failed'
                  ? 'Membership marked as failed — overdue balance'
                  : 'Remaining Balance Due'}
              </p>
              <p className={`text-xs mt-1 ${membership.status === 'failed' ? 'text-red-600' : 'text-neutral-500'}`}>
                {membership.pay_in_store_requested
                  ? `You'll settle the remaining ₱${Number(membership.balance || 0).toLocaleString()} at the store. Our staff will assist you.`
                  : `Please settle the remaining ₱${Number(membership.balance || 0).toLocaleString()}${
                      membership.down_payment_due_date
                        ? ` by ${dayjs(membership.down_payment_due_date).format('MMM D, YYYY')}`
                        : ''
                    }.${membership.status === 'failed' ? ' Contact us to reactivate.' : ' Please pay at the store, or contact us to settle it online.'}`}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${membership.status === 'failed' ? 'text-red-700' : 'text-neutral-900'}`}>
                ₱{Number(membership.balance || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      </div>
    </>
  );
}
