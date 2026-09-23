import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, Clock } from 'lucide-react';
import ChatbotWidget from '../../components/chatbot/ChatbotWidget';
import { formatServicePrice } from '../../utils/format';

interface LocationState {
  services: { name: string; price: number; duration: number }[];
  date?: string;
  time?: string;
  staff?: string;
  totalPrice?: number;
  totalDuration?: number;
  membershipDiscount?: number;
  membershipCode?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(time: string): string {
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function BookingConfirmation() {
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const hasData = (state.services && state.services.length) || state.date;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-primary-500 flex items-center justify-center mx-auto mb-6 rounded-full">
            <CheckCircle size={32} className="text-white" />
          </div>

          <h1 className="text-3xl font-sans font-semibold text-neutral-900">Appointment Confirmed</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Your appointment has been successfully scheduled.
          </p>

          {/* Appointment Details */}
          {hasData && (
            <div className="mt-8 p-7 border border-neutral-200 bg-white text-left">
              {state.services && state.services.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs text-neutral-400 uppercase tracking-[0.2em]">
                    {state.services.length > 1 ? 'Services' : 'Service'}
                  </p>
                  <ul className="mt-3 border-t border-neutral-200">
                    {state.services.map((svc, idx) => (
                      <li key={idx} className="flex justify-between items-center gap-3 py-3 border-b border-neutral-200">
                        <span className="text-sm font-medium text-neutral-900">
                          {svc.name}
                          {svc.duration ? (
                            <span className="block text-xs text-neutral-400 font-normal">
                              {svc.duration} minutes
                            </span>
                          ) : null}
                        </span>
                        <span className="font-sans text-sm text-neutral-700 whitespace-nowrap">
                          {formatServicePrice(svc.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {state.date && (
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-primary-600" />
                  <span className="text-sm text-neutral-900">{formatDate(state.date)}</span>
                </div>
              )}
              {state.time && (
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-primary-600" />
                  <span className="text-sm text-neutral-900">{formatTime(state.time)}</span>
                </div>
              )}
              {state.staff && (
                <p className="text-sm text-neutral-500 mt-2">with {state.staff}</p>
              )}
              {state.totalPrice != null && (
                <div className="border-t border-neutral-200 mt-5 pt-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-900">Total</span>
                  <span className="font-sans text-xl font-semibold text-neutral-900">{formatServicePrice(state.totalPrice)}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/customer/appointments" className="btn-primary">
              View Appointment
            </Link>
            <Link to="/" className="btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  );
}