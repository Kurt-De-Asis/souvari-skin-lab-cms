import { useEffect, useRef, useState } from 'react';

interface TransitionProps {
  show: boolean;
  duration?: number;
  children: (state: { active: boolean }) => React.ReactNode;
  onExited?: () => void;
}

/**
 * Keeps children mounted during the exit animation, then unmounts them.
 * Exposes `active` so callers can toggle enter/exit animation classes per-element.
 */
export default function Transition({ show, duration = 250, children, onExited }: TransitionProps) {
  const [mounted, setMounted] = useState(show);
  const [active, setActive] = useState(show);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setActive(true);
    } else {
      setActive(false);
      timer.current = window.setTimeout(() => {
        setMounted(false);
        onExited?.();
      }, duration);
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [show, duration, onExited]);

  if (!mounted) return null;
  return <>{children({ active })}</>;
}