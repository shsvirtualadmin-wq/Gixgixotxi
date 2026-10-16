import type { ReactNode } from 'react';

type BadgeColor = 'brand' | 'violet' | 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
  pulse?: boolean;
}

const COLOR_STYLES: Record<BadgeColor, string> = {
  brand: 'bg-[rgba(47,107,255,0.2)] text-[#2F6BFF] border border-[rgba(47,107,255,0.3)]',
  violet: 'bg-[rgba(124,92,255,0.2)] text-[#7C5CFF] border border-[rgba(124,92,255,0.3)]',
  success: 'bg-[rgba(52,211,153,0.2)] text-[#34D399] border border-[rgba(52,211,153,0.3)]',
  warning: 'bg-[rgba(251,191,36,0.2)] text-[#FBBF24] border border-[rgba(251,191,36,0.3)]',
  danger: 'bg-[rgba(248,113,113,0.2)] text-[#F87171] border border-[rgba(248,113,113,0.3)]',
  muted: 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]',
};

export function Badge({ children, color = 'muted', className = '', pulse = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
        rounded-[var(--r-pill)] ${COLOR_STYLES[color]} ${className}
      `}
    >
      {pulse && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            animation: 'pulse-glow 1.5s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
