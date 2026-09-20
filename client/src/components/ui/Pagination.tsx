import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-y-3 gap-x-4 mt-4">
      <p className="text-sm text-neutral-500 order-2 sm:order-1">{total} total results</p>
      <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-2 rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          typeof p === 'string' ? (
            <span key={`e${i}`} className="px-2 text-neutral-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-md border text-sm font-medium ${p === page ? 'bg-primary-500 border-primary-500 text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'}`}
            >
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="p-2 rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
