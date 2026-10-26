import type { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  radius?: 'input' | 'card' | 'hero';
  animated?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = '',
  style,
  radius = 'card',
  animated = false,
  hover = false,
  onClick,
}: GlassCardProps) {
  const borderRadius = radius === 'input' ? '10px' : radius === 'hero' ? '16px' : '14px';

  return (
    <div
      onClick={onClick}
      className={`glass ${hover ? 'glass-hover' : ''} ${className}`}
      style={{
        borderRadius,
        backgroundColor: 'var(--card)',
        border: animated ? '1px solid var(--red)' : '1px solid var(--border)',
        boxShadow: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
