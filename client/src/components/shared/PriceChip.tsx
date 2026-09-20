interface PriceChipProps {
  amount: number;
  variant?: 'default' | 'vip' | 'regular' | 'discount';
  size?: 'sm' | 'md';
}

export default function PriceChip({ amount, variant = 'default', size = 'sm' }: PriceChipProps) {
  const baseClass = 'inline-flex items-center gap-0.5 font-medium border';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  const variantClass = {
    default: 'bg-white border-neutral-200 text-neutral-900',
    vip: 'bg-primary-500 border-primary-500 text-white',
    regular: 'bg-white border-neutral-300 text-neutral-700',
    discount: 'bg-green-50 border-green-200 text-green-700',
  }[variant];

  return (
    <span className={`${baseClass} ${sizeClass} ${variantClass}`}>
      ₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
    </span>
  );
}