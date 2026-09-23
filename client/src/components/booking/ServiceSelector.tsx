import { Clock, Crown } from 'lucide-react';
import formatCategory from '../../utils/formatCategory';
import { formatServicePrice } from '../../utils/format';

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  vip_price?: number | null;
  non_member_price?: number | null;
  duration: number;
  category: string;
}

interface ServiceSelectorProps {
  services: Service[];
  selectedServices: Service[];
  onToggleService: (service: Service) => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  membershipPrice?: boolean;
}

export default function ServiceSelector({
  services,
  selectedServices,
  onToggleService,
  categories,
  activeCategory,
  onCategoryChange,
  membershipPrice,
}: ServiceSelectorProps) {
  const isSelected = (id: number) => selectedServices.some((s) => s.id === id);

  return (
    <div>
      <h2 className="text-2xl font-sans font-semibold text-neutral-900 mb-1">Select Services</h2>
      <p className="text-sm text-neutral-500 mb-6">Choose one or more services for your appointment.</p>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-neutral-200 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`pb-3 text-xs font-semibold uppercase tracking-[0.2em] border-b transition ${
                activeCategory === cat
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {formatCategory(cat)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {services.map((s) => {
          const selected = isSelected(s.id);
          const showVipPrice = membershipPrice && s.vip_price && s.vip_price < s.price;
          return (
            <button
              key={s.id}
              onClick={() => onToggleService(s)}
              className={`w-full text-left p-4 border transition ${
                selected
                  ? 'border-primary-600 bg-white'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition ${
                        selected ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'
                      }`}
                    >
                      {selected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm font-medium text-neutral-900">{s.name}</p>
                    {showVipPrice && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-medium uppercase tracking-wide">
                        <Crown size={10} /> VIP
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-neutral-500 mt-1.5 ml-6 line-clamp-1">{s.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 ml-6 text-xs text-neutral-400">
                    <Clock size={11} />
                    <span>{s.duration} min</span>
                    <span className="mx-0.5">·</span>
                    <span>{formatCategory(s.category)}</span>
                  </div>
                </div>
                <div className="text-right">
                  {Number(s.price) === 0 ? (
                    <span className="text-sm font-semibold text-primary-700 whitespace-nowrap">Free</span>
                  ) : showVipPrice ? (
                    <>
                      <span className="text-sm font-semibold text-primary-700 whitespace-nowrap">₱{s.vip_price!.toLocaleString()}</span>
                      <span className="block text-xs text-neutral-400 line-through">₱{s.price.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-neutral-900 whitespace-nowrap">{formatServicePrice(s.price)}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
