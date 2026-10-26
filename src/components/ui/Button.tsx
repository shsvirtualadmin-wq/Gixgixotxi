import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  let bg = 'transparent';
  let color = 'var(--text)';
  let border = '1px solid var(--border)';

  if (variant === 'primary' || variant === 'danger') {
    bg = 'var(--red)';
    color = '#FFFFFF';
    border = '1px solid var(--red)';
  } else if (variant === 'secondary' || variant === 'outline') {
    bg = 'transparent';
    color = 'var(--text)';
    border = '1px solid var(--border-strong)';
  } else if (variant === 'ghost') {
    bg = 'transparent';
    color = 'var(--muted)';
    border = '1px solid transparent';
  }

  // Button sizes: 46px tall standard
  const height = size === 'sm' ? '36px' : '46px';
  const paddingInline = size === 'sm' ? '14px' : size === 'lg' ? '24px' : '20px';
  const fontSize = size === 'sm' ? '13px' : '14px';

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-full font-semibold
        transition-colors duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
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
        boxShadow: 'none',
        ...style,
      }}
    >
      {loading ? (
        <span
          style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : null}
      {children}
    </button>
  );
}
