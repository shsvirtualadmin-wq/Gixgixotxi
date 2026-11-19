import React from 'react';

export interface SettingsGroupProps {
  /** Optional sentence-case label above the card (never uppercase) */
  label?: string;
  /** Optional helper text below the card (13px muted, links underlined in --accent) */
  helperText?: React.ReactNode;
  /** Force single-row full pill (999px) vs multi-row (32px). Auto-detected if omitted. */
  singleRow?: boolean;
  /** Explicit corner radius preset: 'pill' (999px), 'compact' (22px), or 'card' (32px) */
  radius?: 'pill' | 'compact' | 'card';
  /** Red-tinted danger border for Sign out / Suspend / Delete cards */
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  label,
  helperText,
  singleRow,
  radius,
  danger = false,
  className = '',
  children,
}) => {
  const validChildren = React.Children.toArray(children).filter(Boolean);
  if (validChildren.length === 0) return null;

  const isSingleRow = singleRow ?? validChildren.length === 1;
  const singleChildHasSubtitle =
    validChildren.length === 1 &&
    React.isValidElement(validChildren[0]) &&
    Boolean((validChildren[0].props as Record<string, any>)?.subtitle);

  const radiusClass =
    radius === 'compact'
      ? 'rounded-[22px]'
      : radius === 'card'
        ? 'rounded-[32px]'
        : radius === 'pill'
          ? 'rounded-[999px]'
          : isSingleRow && !singleChildHasSubtitle
            ? 'rounded-[999px]'
            : isSingleRow && singleChildHasSubtitle
              ? 'rounded-[22px]'
              : 'rounded-[32px]';

  return (
    <section className={`mb-6 ${className}`}>
      {label && (
        <h2
          className="mb-2 pl-4 text-[14px] font-medium leading-snug"
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
