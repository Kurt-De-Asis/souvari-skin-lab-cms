import { ArrowLeft, Check, Clock, X } from 'lucide-react';

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
  selectedServices: Treatment[];
  onToggle: (service: Treatment) => void;
  onRemove: (service: Treatment) => void;
  onBack: () => void;
  membershipPrice?: boolean;
}

export default function TreatmentSelector({
  groupLabel,
  services,
  selectedServices,
  onToggle,
  onRemove,
  onBack,
  membershipPrice,
}: TreatmentSelectorProps) {
  const isSelected = (id: number) => selectedServices.some((s) => s.id === id);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

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
      <p className="text-sm text-neutral-500 mb-6">
        Pick one or more treatments for this visit. You can keep adding from other categories after.
      </p>

      {selectedServices.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-700">
              <span className="font-medium text-neutral-900">{selectedServices.length}</span> selected
              {totalDuration > 0 && <span className="text-neutral-400"> · {totalDuration} min total</span>}
            </p>
            <button
              onClick={() => onBack()}
              className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 hover:text-primary-700 transition"
            >
              Add more from another category
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedServices.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-primary-200 text-xs text-neutral-700"
              >
                {s.name}
                <button
                  onClick={() => onRemove(s)}
                  className="text-neutral-400 hover:text-red-600 transition"
                  aria-label={`Remove ${s.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 border-b border-neutral-200 pb-4">
        {services.map((s) => {
          const selected = isSelected(s.id);
          const showVipPrice = membershipPrice && s.vip_price && s.vip_price < s.price;
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s)}
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