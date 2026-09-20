import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Skeleton({ className = '', children }: SkeletonProps) {
  return <div className={clsx('skeleton skeleton-shimmer', className)}>{children}</div>;
}

export function SkeletonBlock({ rows = 18, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={clsx('h-4', i % 3 === 0 ? 'w-2/3' : i % 3 === 1 ? 'w-5/6' : 'w-1/2')} />
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="w-24 h-3 mt-4" />
          <Skeleton className="w-32 h-7 mt-2" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={clsx('h-4 flex-1', c === 0 && 'w-40 flex-none')} />
          ))}
        </div>
      ))}
    </div>
  );
}