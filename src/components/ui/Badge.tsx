import type { ReactNode, CSSProperties } from 'react';

export type BadgeColor = 'muted' | 'red' | 'red-outline' | 'brand' | 'default' | 'warning' | 'violet' | string;

export interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  dot?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Badge({
  children,
  color = 'muted',
  dot = false,
  className = '',
  style,
}: BadgeProps) {
  let badgeClass = 'badge-pill';
  let dotColor = 'var(--muted)';

  if (color === 'red') {
    badgeClass = 'badge-pill-red';
    dotColor = '#FFFFFF';
  } else if (color === 'red-outline') {
    badgeClass = 'badge-pill-red-outline';
    dotColor = 'var(--red)';
  } else if (color === 'brand' || color === 'violet') {
    badgeClass = 'badge-pill-red-outline';
    dotColor = 'var(--red)';
  } else if (color === 'warning') {
    badgeClass = 'badge-pill';
    dotColor = 'var(--text)';
  } else {
    badgeClass = 'badge-pill';
    dotColor = 'var(--muted)';
  }

  return (
    <span className={`${badgeClass} ${className}`.trim()} style={style}>
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
