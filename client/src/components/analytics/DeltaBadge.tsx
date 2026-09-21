import { ChevronDown, ChevronUp, Minus } from 'lucide-react';

interface DeltaBadgeProps {
  value: number | null | undefined;
  label?: string;
}

export default function DeltaBadge({ value, label = 'vs prev period' }: DeltaBadgeProps) {
  if (value === null || value === undefined) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
        <Minus size={12} /> No prior data
      </span>
    );
  }

  const positive = value > 0;
  const negative = value < 0;
  const Arrow = positive ? ChevronUp : negative ? ChevronDown : Minus;

  const className = positive
    ? 'bg-green-50 text-green-700'
    : negative
    ? 'bg-red-50 text-red-600'
    : 'bg-neutral-100 text-neutral-500';

  return (
    <span title={label} className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      <Arrow size={13} />
      {positive ? '+' : ''}
      {value}
    </span>
  );
}