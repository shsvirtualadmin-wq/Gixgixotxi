import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { ButtonLineLoader } from './LineLoader';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  progress?: number;
  loadingMessages?: string[];
  successText?: string;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  loadingText,
  loadingMessages,
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  let bg = 'transparent';
  let color = 'var(--text)';
  let border = '1px solid var(--glass-border)';
  let boxShadow = 'none';

  if (variant === 'primary' || variant === 'danger') {
    bg = 'var(--red)';
    color = '#FFFFFF';
    border = '1px solid rgba(255, 255, 255, 0.22)';
    boxShadow =
      '0 10px 24px -6px rgba(215, 25, 33, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.28)';
  } else if (variant === 'secondary' || variant === 'outline') {
    bg = 'var(--glass-pill-bg)';
    color = 'var(--text)';
    border = '1px solid var(--glass-border)';
    boxShadow = 'inset 0 1px 1px var(--glass-highlight)';
  } else if (variant === 'ghost') {
    bg = 'transparent';
    color = 'var(--muted)';
    border = '1px solid transparent';
  }

  const height = size === 'sm' ? '36px' : '46px';
  const paddingInline = size === 'sm' ? '14px' : size === 'lg' ? '24px' : '20px';
  const fontSize = size === 'sm' ? '13px' : '14px';

  const activeLabel = loading
    ? loadingText || loadingMessages?.[0] || children
    : children;

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full font-semibold
        transition-transform duration-150 cursor-pointer active:scale-[0.98]
        disabled:opacity-75 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        fontFamily: 'var(--font-heading)',
        letterSpacing: '-0.02em',
        lineHeight: '1.1',
        height,
        paddingInline,
        backgroundColor: bg,
        color,
        border,
        fontSize,
        boxShadow,
        ...style,
      }}
    >
      <span>{activeLabel}</span>
      {loading && <ButtonLineLoader />}
    </button>
  );
}
