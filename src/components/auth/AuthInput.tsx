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
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#374151',
              pointerEvents: 'none',
            }}
          />
        )}
        <input
          {...props}
          className={`auth-form-input ${error ? 'input-error' : ''} ${props.className || ''}`}
          style={{
            height: '52px',
            paddingLeft: Icon ? '44px' : '16px',
            paddingRight: '16px',
            ...props.style,
          }}
        />
      </div>
      {error && (
        <p style={{ fontSize: 12, color: '#DC2626', fontWeight: 500, marginTop: 2 }}>{error}</p>
      )}
    </div>
  );
}
