import { ArrowRight } from 'lucide-react';

export interface BookingGroup {
  key: string;
  label: string;
  description: string;
  count: number;
}

interface CategorySelectorProps {
  groups: BookingGroup[];
  onSelect: (key: string) => void;
  onSelectMulti: () => void;
}

export default function CategorySelector({ groups, onSelect, onSelectMulti }: CategorySelectorProps) {
  return (
    <div>
      <h2 className="text-2xl font-sans font-semibold text-neutral-900 mb-1">What brings you in?</h2>
      <p className="text-sm text-neutral-500 mb-8">Choose the kind of visit you'd like to book.</p>

      <div className="border-t border-neutral-200">
        {groups.map((g) => (
          <button
            key={g.key}
            onClick={() => onSelect(g.key)}
            className="group w-full text-left flex items-center justify-between gap-6 py-7 border-b border-neutral-200 transition hover:bg-white"
          >
            <div className="min-w-0">
              <h3 className="font-sans text-xl md:text-2xl text-neutral-900 group-hover:text-primary-700 transition">
                {g.label}
              </h3>
              <p className="mt-1.5 text-sm text-neutral-500 max-w-xl leading-relaxed">{g.description}</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-xs uppercase tracking-[0.15em] text-neutral-400">{g.count} treatment{g.count === 1 ? '' : 's'}</span>
              <span className="text-neutral-300 transition group-hover:translate-x-1 group-hover:text-primary-600">
                <ArrowRight size={18} />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-neutral-200">
        <button
          onClick={onSelectMulti}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 hover:text-primary-700 transition"
        >
          Booking several treatments at once? Use multi-service booking
        </button>
      </div>
    </div>
  );
}