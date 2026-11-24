import React from 'react';

export interface SettingsGroupProps {
  /** Optional sentence-case label above the card (never uppercase) */
  label?: string;
  /** Optional helper text below the card (13px muted, links underlined in --accent) */
  helperText?: React.ReactNode;
  /** Force single-row full pill (999px) vs multi-row (32px). Auto-detected if omitted. */
  singleRow?: boolean;
  /** Optional corner radius override: 'compact' renders 22px corners matching standard cards */
  radius?: 'auto' | 'compact';
  /** Red-tinted danger border for Sign out / Suspend / Delete cards */
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  label,
  helperText,
  singleRow,
  radius = 'auto',
  danger = false,
  className = '',
  children,
}) => {
  const validChildren = React.Children.toArray(children).filter(Boolean);
  if (validChildren.length === 0) return null;

  const isSingleRow = singleRow ?? validChildren.length === 1;
  const radiusClass =
    radius === 'compact'
      ? 'rounded-[22px]'
      : isSingleRow
        ? 'rounded-[999px]'
        : 'rounded-[32px]';

  return (
    <section className={`mb-6 ${className}`}>
      {label && (
        <h2
          className="mb-2 ps-4 text-start text-[14px] font-medium leading-snug"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans, var(--font-heading), system-ui, sans-serif)',
          }}
        >
          {label}
        </h2>
      )}

      <div
        className={`overflow-hidden ${radiusClass}`}
        style={{
          backgroundColor: 'var(--card)',
          border: `1px solid ${danger ? 'var(--danger-border)' : 'var(--border)'}`,
          boxShadow: 'var(--settings-card-shadow)',
        }}
      >
        {validChildren.map((child, idx) => {
          if (!React.isValidElement(child)) return child;
          const isLast = idx === validChildren.length - 1;
          if (typeof child.type === 'string') {
            return React.cloneElement(child as React.ReactElement<any>, {
              key: child.key ?? idx,
            });
          }
          return React.cloneElement(child as React.ReactElement<any>, {
            isLast,
            key: child.key ?? idx,
          });
        })}
      </div>

      {helperText && (
        <div
          className="mt-2 px-4 text-[13px] leading-relaxed [&_a]:underline [&_a]:text-[var(--accent)] [&_button]:underline [&_button]:text-[var(--accent)]"
          style={{ color: 'var(--text-muted)' }}
        >
          {helperText}
        </div>
      )}
    </section>
  );
};
