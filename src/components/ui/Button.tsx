import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-[#2F6BFF] to-[#22D3EE] text-white hover:opacity-90 shadow-lg shadow-blue-500/20',
  secondary: 'glass text-[var(--text)] hover:bg-[var(--surface-hover)]',
  ghost: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--r-input)]',
  md: 'px-5 py-2.5 text-sm rounded-[var(--r-input)]',
  lg: 'px-8 py-3.5 text-base rounded-[var(--r-input)]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-[160ms] cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANT_STYLES[variant]}
        ${SIZE_STYLES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{ fontFamily: 'inherit', border: variant === 'secondary' ? undefined : 'none', ...props.style }}
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
