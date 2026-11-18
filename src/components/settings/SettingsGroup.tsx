import React from 'react';

export interface SettingsGroupProps {
  /** Optional sentence-case label above the card (never uppercase) */
  label?: string;
  /** Optional helper text below the card (13px muted, links underlined in --accent) */
  helperText?: React.ReactNode;
  /** Force single-row full pill (999px) vs multi-row (32px). Auto-detected if omitted. */
  singleRow?: boolean;
  /** Red-tinted danger border for Sign out / Suspend / Delete cards */
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  label,
  helperText,
  singleRow,
  danger = false,
  className = '',
  children,
}) => {
  const validChildren = React.Children.toArray(children).filter(Boolean);
  if (validChildren.length === 0) return null;

  const isSingleRow = singleRow ?? validChildren.length === 1;

  return (
    <section className={`mb-6 ${className}`}>
      {label && (
        <h2
          className="mb-2 pl-4 text-[14px] font-medium leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </h2>
      )}

      <div
        className={`overflow-hidden ${isSingleRow ? 'rounded-[999px]' : 'rounded-[32px]'}`}
        style={{
          backgroundColor: 'var(--card)',
          border: `1px solid ${danger ? 'var(--danger-border)' : 'var(--border)'}`,
          boxShadow: 'var(--settings-card-shadow)',
        }}
      >
        {validChildren.map((child, idx) => {
          if (!React.isValidElement(child)) return child;
          const isLast = idx === validChildren.length - 1;
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
