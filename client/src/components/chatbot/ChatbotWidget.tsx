import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import ChatbotWindow from './ChatbotWindow';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Window */}
      {isOpen && <ChatbotWindow onClose={() => setIsOpen(false)} />}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition z-50 ${
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
