interface PriceChipProps {
  amount: number;
  variant?: 'default' | 'vip' | 'regular' | 'discount';
  size?: 'sm' | 'md';
}

export default function PriceChip({ amount, variant = 'default', size = 'sm' }: PriceChipProps) {
  const baseClass = 'inline-flex items-center gap-0.5 font-medium border rounded-full';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  const variantClass = {
    default: 'bg-white border-gray-200 text-gray-900',
    vip: 'bg-gray-900 border-gray-900 text-white',
    regular: 'bg-white border-gray-300 text-gray-700',
    discount: 'bg-green-50 border-green-200 text-green-700',
  }[variant];

  return (
    <span className={`${baseClass} ${sizeClass} ${variantClass}`}>
      ₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
    </span>
  );
}
