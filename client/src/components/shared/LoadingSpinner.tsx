import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function LoadingSpinner({ fullScreen = false, size = 'md' }: { fullScreen?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div className={clsx('flex items-center justify-center', fullScreen && 'min-h-[50vh]')}>
      <Loader2 className={clsx('animate-spin text-primary-600', sizeClass)} />
    </div>
  );
}
