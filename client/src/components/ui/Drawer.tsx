import { X } from 'lucide-react';
import { useEffect } from 'react';
import Transition from './Transition';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Drawer({ open, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <Transition show={open} duration={250}>
      {({ active }) => (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 bg-black/40 ${active ? 'anim-fade-in' : 'anim-fade-out'}`} onClick={onClose} />
          <aside
            className={`absolute right-0 top-0 bottom-0 w-full ${maxWidth} bg-white shadow-2xl border-l border-neutral-200 flex flex-col ${
              active ? 'anim-slide-in-right' : 'anim-slide-out-right'
            }`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
                {subtitle && <p className="text-sm text-neutral-500 mt-0.5 truncate">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-1 rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </aside>
        </div>
      )}
    </Transition>
  );
}