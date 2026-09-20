import { useState } from 'react';
import { formatCurrency, formatPercent } from '@/utils/format';

export interface StaffPerformanceRow {
  id: number;
  full_name: string;
  avatar_url: string | null;
  revenue: number;
  bookings: number;
  occupancy_rate: number;
  patients: number;
  returning_patients: number;
}

type SortKey = 'full_name' | 'revenue' | 'bookings' | 'occupancy_rate';

interface StaffPerformanceTableProps {
  staff: StaffPerformanceRow[];
}

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'full_name', label: 'Provider' },
  { key: 'revenue', label: 'Revenue', align: 'right' },
  { key: 'bookings', label: 'Bookings', align: 'right' },
  { key: 'occupancy_rate', label: 'Occupancy', align: 'right' },
];

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-9 h-9 rounded-full object-cover bg-neutral-100"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
        onLoad={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'inline';
        }}
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
      <span className="text-sm font-semibold text-primary-700">{name.charAt(0)}</span>
    </div>
  );
}

export default function StaffPerformanceTable({ staff }: StaffPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'full_name' ? 'asc' : 'desc');
    }
  };

  const sorted = [...staff].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
  });

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-neutral-200">
            {COLUMNS.map((col) => (
              <th key={col.key} className={`py-2.5 text-neutral-500 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                <button
                  onClick={() => toggleSort(col.key)}
                  className="inline-flex items-center gap-1 hover:text-neutral-800"
                  type="button"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="text-neutral-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
            ))}
            <th className="py-2.5 text-right text-neutral-500 font-medium">Returning</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {sorted.map((s) => (
            <tr key={s.id} className="hover:bg-neutral-50/60">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={s.full_name} url={s.avatar_url} />
                  <span className="font-medium text-neutral-900">{s.full_name}</span>
                </div>
              </td>
              <td className="py-3 text-right font-semibold text-neutral-900">{formatCurrency(s.revenue)}</td>
              <td className="py-3 text-right text-neutral-600">{s.bookings}</td>
              <td className="py-3 text-right text-neutral-600">{formatPercent(s.occupancy_rate)}</td>
              <td className="py-3 text-right">
                {s.patients > 0 ? (
                  <span className="text-neutral-600">
                    {s.returning_patients}/{s.patients}{' '}
                    <span className="text-neutral-400">({formatPercent(Math.round((s.returning_patients / s.patients) * 100))})</span>
                  </span>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-neutral-400">
                No staff performance data for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}