import useInView from '../../hooks/useInView';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}

export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref as React.Ref<any>}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}