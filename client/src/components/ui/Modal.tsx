import { X } from 'lucide-react';
import Transition from './Transition';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  return (
    <Transition show={open} duration={200}>
      {({ active }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/40 ${active ? 'anim-fade-in' : 'anim-fade-out'}`}
            onClick={onClose}
          />
          <div
            className={`relative bg-white shadow-2xl rounded-lg w-full ${maxWidth} max-h-[90vh] flex flex-col ${
              active ? 'anim-scale-in' : 'anim-scale-out'
            }`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
              <button onClick={onClose} className="p-1 rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
          </div>
        </div>
      )}
    </Transition>
  );
}