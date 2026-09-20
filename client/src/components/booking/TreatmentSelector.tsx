import { ArrowLeft, Check, Clock } from 'lucide-react';

interface Treatment {
  id: number;
  name: string;
  description?: string;
  price: number;
  vip_price?: number | null;
  non_member_price?: number | null;
  duration: number;
  category: string;
}

interface TreatmentSelectorProps {
  groupLabel: string;
  services: Treatment[];
  selectedService: Treatment | null;
  onSelect: (service: Treatment) => void;
  onBack: () => void;
  membershipPrice?: boolean;
}

export default function TreatmentSelector({
  groupLabel,
  services,
  selectedService,
  onSelect,
  onBack,
  membershipPrice,
}: TreatmentSelectorProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-900 transition mb-8"
      >
        <ArrowLeft size={13} /> Back
      </button>

      <h2 className="text-2xl font-sans font-semibold text-neutral-900 mb-1">
        Choose your {groupLabel.toLowerCase()} visit
      </h2>
      <p className="text-sm text-neutral-500 mb-6">Pick the treatment for this visit.</p>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 border-b border-neutral-200 pb-4">
        {services.map((s) => {
          const selected = selectedService?.id === s.id;
          const showVipPrice = membershipPrice && s.vip_price && s.vip_price < s.price;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full text-left p-4 border transition ${
                selected ? 'border-primary-600 bg-white' : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 transition ${
                        selected ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'
                      }`}
                    >
                      {selected && <Check size={12} className="text-white" />}
                    </div>
                    <p className="text-sm font-medium text-neutral-900">{s.name}</p>
                  </div>
                  {s.description && (
                    <p className="text-xs text-neutral-500 mt-1.5 ml-8 line-clamp-1">{s.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 ml-8 text-xs text-neutral-400">
                    <Clock size={11} />
                    <span>{s.duration} min</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {showVipPrice ? (
                    <>
                      <span className="text-sm font-semibold text-primary-700 whitespace-nowrap">₱{s.vip_price!.toLocaleString()}</span>
                      <span className="block text-xs text-neutral-400 line-through">₱{s.price.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-neutral-900 whitespace-nowrap">₱{s.price.toLocaleString()}</span>
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