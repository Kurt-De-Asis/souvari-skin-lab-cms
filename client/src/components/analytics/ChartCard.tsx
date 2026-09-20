import { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ icon: Icon, title, subtitle, right, children, className }: ChartCardProps) {
  return (
    <div className={`card ${className || ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-primary-100 text-primary-700">
            <Icon size={16} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">{title}</h2>
            {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}