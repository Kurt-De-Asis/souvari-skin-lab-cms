import { LucideIcon } from 'lucide-react';
import DeltaBadge from './DeltaBadge';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
  delta?: number | null;
  deltaLabel?: string;
}

export default function KpiCard({ label, value, icon: Icon, iconClassName, delta, deltaLabel }: KpiCardProps) {
  return (
    <div className="card flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 font-medium truncate">{label}</p>
        <p className="num text-2xl text-neutral-900 mt-0.5 truncate">{value}</p>
        <div className="mt-2">
          <DeltaBadge value={delta} label={deltaLabel} />
        </div>
      </div>
      <div className={`p-3 rounded-md shrink-0 ${iconClassName || 'bg-primary-100 text-primary-700'}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}