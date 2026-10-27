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
  const borderRadius = radius === 'input' ? '16px' : radius === 'hero' ? '32px' : '28px';

  return (
    <div
      onClick={onClick}
      className={`glass-card ${animated ? 'glass-animated-border' : ''} ${hover ? 'glass-hover glass-card-interactive' : ''} ${className}`}
      style={{
        borderRadius,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
