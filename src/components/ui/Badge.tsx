import type { ReactNode } from 'react';

type BadgeColor = 'brand' | 'violet' | 'success' | 'warning' | 'danger' | 'muted' | 'default' | 'red' | 'red-outline';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ children, color = 'muted', className = '', dot = false, pulse = false }: BadgeProps) {
  const isSolidRed = color === 'red' || color === 'danger';
  const isRedOutline = color === 'red-outline';
  const hasDot = dot || pulse;

  let bg = 'transparent';
  let textColor = 'var(--muted)';
  let borderColor = 'var(--border)';
  let dotColor = 'var(--red)';

  if (isSolidRed) {
    bg = 'var(--red)';
    textColor = '#FFFFFF';
    borderColor = 'var(--red)';
    dotColor = '#FFFFFF';
  } else if (isRedOutline) {
    bg = 'transparent';
    textColor = 'var(--red)';
    borderColor = 'var(--red)';
    dotColor = 'var(--red)';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap ${className}`}
      style={{
        padding: '6px 14px',
        fontSize: '13px',
        fontFamily: 'var(--font-heading)',
        letterSpacing: '-0.02em',
        lineHeight: '1.1',
        fontWeight: isSolidRed || isRedOutline ? 600 : 500,
        backgroundColor: bg,
        color: textColor,
        border: `1px solid ${borderColor}`,
        width: 'fit-content',
      }}
    >
      {hasDot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
