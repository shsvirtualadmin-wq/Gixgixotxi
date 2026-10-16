import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'red';
  className?: string;
  style?: CSSProperties;
  noPadding?: boolean;
}

/**
 * Shared Card component for Nothing OS style:
 * - Padding 24px (20px under 400px wide)
 * - Radius 24px
 * - 1px border (#2A2A2A or #D71921 if red variant)
 * - Solid background #111 (or var(--card))
 * - Display flex, flex-direction column, gap 12px
 * - No fixed height or min-height
 * - Rounded corners never clip text (overflow visible)
 */
export function Card({
  children,
  variant = 'default',
  className = '',
  style,
  noPadding = false,
  ...props
}: CardProps) {
  const isRed = variant === 'red';
  return (
    <div
      className={`boardly-card ${isRed ? 'boardly-card-red' : ''} ${className}`}
      style={{
        padding: noPadding ? 0 : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
