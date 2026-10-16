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
  const radii = {
    input: 'var(--r-input)',
    card: 'var(--r-card)',
    hero: 'var(--r-hero)',
  };

  return (
    <div
      onClick={onClick}
      className={`glass ${hover ? 'glass-hover' : ''} ${
        animated ? 'glass-animated-border' : ''
      } ${className}`}
      style={{
        borderRadius: radii[radius],
        padding: '1.5rem',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
