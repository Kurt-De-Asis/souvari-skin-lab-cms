import { Clock, Crown, Tag } from 'lucide-react';
import { formatServicePrice } from '../../utils/format';

interface BookingSummaryProps {
  clinicName?: string;
  services: Array<{ name: string; duration: number; price: number; originalPrice?: number }>;
  date?: string;
  time?: string;
  staff?: string;
  totalDuration: number;
  totalPrice: number;
  originalTotalPrice?: number;
  membershipName?: string;
}

function formatTime(time: string): string {
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function BookingSummary({
  clinicName = 'Souvari Skin Lab',
  services,
  date,
  time,
  staff,
  totalDuration,
  totalPrice,
  originalTotalPrice,
  membershipName,
}: BookingSummaryProps) {
  const totalSaved = originalTotalPrice && originalTotalPrice > totalPrice ? originalTotalPrice - totalPrice : 0;

  return (
    <div className="bg-white border border-neutral-200 p-6">
      <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-[0.2em] mb-5">{clinicName}</h3>

      {membershipName && (
        <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-primary-50 border border-primary-100">
          <Crown size={14} className="text-primary-600" />
          <span className="text-xs font-medium text-primary-800">{membershipName} Pricing Applied</span>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {services.map((s, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 break-words">{s.name}</p>
              <div className="flex items-center gap-1 text-xs text-neutral-400 mt-0.5">
                <Clock size={11} />
                <span>{s.duration} min</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-neutral-900 whitespace-nowrap">{formatServicePrice(s.price)}</span>
              {s.originalPrice && s.originalPrice > s.price && (
                <span className="block text-xs text-neutral-400 line-through">₱{s.originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {services.length > 0 && <div className="border-t border-neutral-200 my-4" />}

      {date && (
        <div className="mb-3">
          <p className="text-xs text-neutral-400">Date</p>
          <p className="text-sm font-medium text-neutral-900 mt-0.5">{formatDate(date)}</p>
        </div>
      )}

      {time && (
        <div className="mb-3">
          <p className="text-xs text-neutral-400">Time</p>
          <p className="text-sm font-medium text-neutral-900 mt-0.5">{formatTime(time)}</p>
        </div>
      )}

      {staff && (
        <div className="mb-3">
          <p className="text-xs text-neutral-400">Specialist</p>
          <p className="text-sm font-medium text-neutral-900 mt-0.5">{staff}</p>
        </div>
      )}

      {totalDuration > 0 && (
        <div className="mb-3">
          <p className="text-xs text-neutral-400">Duration</p>
          <p className="text-sm font-medium text-neutral-900 mt-0.5">{totalDuration} min</p>
        </div>
      )}

      {totalPrice > 0 && (
        <>
          {totalSaved > 0 && (
            <div className="border-t border-neutral-200 pt-3 mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-neutral-500">Subtotal</span>
                <span className="text-xs text-neutral-500 line-through">₱{originalTotalPrice!.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="flex items-center gap-1 text-xs font-medium text-primary-700">
                  <Tag size={11} /> VIP Discount
                </span>
                <span className="text-xs font-medium text-primary-700">-₱{totalSaved.toLocaleString()}</span>
              </div>
            </div>
          )}
          <div className="border-t border-neutral-200 pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-neutral-900">Total</span>
            <span className="font-sans text-xl font-semibold text-neutral-900">{formatServicePrice(totalPrice)}</span>
          </div>
        </>
      )}
    </div>
  );
}
