import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
}

export function AuthInput({ label, icon: Icon, error, ...props }: AuthInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              pointerEvents: 'none',
            }}
          />
        )}
        <input
          {...props}
          style={{
            width: '100%',
            height: 48,
            padding: Icon ? '0 14px 0 40px' : '0 14px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--r-input)',
            color: 'var(--text)',
            fontSize: 15,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 160ms',
            ...props.style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--brand)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border)';
            props.onBlur?.(e);
          }}
        />
      </div>
      {error && (
        <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 2 }}>{error}</p>
      )}
    </div>
  );
}
