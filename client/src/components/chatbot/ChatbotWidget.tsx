import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import ChatbotWindow from './ChatbotWindow';
import Transition from '../ui/Transition';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Window */}
      <Transition show={isOpen} duration={200}>
        {({ active }) => (
          <ChatbotWindow
            onClose={() => setIsOpen(false)}
            className={active ? 'anim-slide-in-down' : 'anim-slide-out-up'}
          />
        )}
      </Transition>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:right-6 w-14 h-14 rounded-full flex items-center justify-center transition z-50 ${
          isOpen
            ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
            : 'bg-neutral-900 hover:bg-neutral-800 text-white'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>
    </>
  );
}