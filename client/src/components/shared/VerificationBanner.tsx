import { AlertTriangle } from 'lucide-react';

interface VerificationBannerProps {
  count: number;
  onRunScan?: () => void;
  scanning?: boolean;
}

export default function VerificationBanner({ count, onRunScan, scanning }: VerificationBannerProps) {
  if (count === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            {count} service{count !== 1 ? 's' : ''} need price verification
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Some prices have not been reviewed against the Souvari pricing document.
          </p>
        </div>
      </div>
      {onRunScan && (
        <button
          onClick={onRunScan}
          disabled={scanning}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
        >
          {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
      )}
    </div>
  );
}
