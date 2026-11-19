import React from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

export interface SettingsRowProps {
  icon?: React.ReactNode;
  leadingElement?: React.ReactNode;
  label: string;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  /** Styles right value as an action link in --accent ("Set up", "Add") */
  actionValue?: boolean;
  /** Optional yellow recommendation indicator dot */
  dot?: boolean;
  /** Optional custom right element (e.g. Kobans balance chip) */
  rightElement?: React.ReactNode;
  chevron?: 'right' | 'down' | 'none';
  tone?: 'default' | 'accent' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  /** Set automatically by SettingsGroup */
  isLast?: boolean;
  ariaLabel?: string;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  leadingElement,
  label,
  subtitle,
  value,
  actionValue = false,
  dot = false,
  rightElement,
  chevron = 'right',
  tone = 'default',
  disabled = false,
  loading = false,
  onClick,
  isLast = true,
  ariaLabel,
}) => {
  const hasLeading = Boolean(icon || leadingElement);
  const interactive = Boolean(onClick) && !disabled && !loading;

  const textColor =
    tone === 'accent'
      ? 'var(--accent)'
      : tone === 'danger'
        ? 'var(--danger)'
        : 'var(--text)';

  const content = (
    <>
      {leadingElement ? (
        <span className="mr-4 flex shrink-0 items-center justify-center">
          {leadingElement}
        </span>
      ) : icon ? (
        <span
          className="mr-4 flex h-6 w-6 shrink-0 items-center justify-center [&>svg]:h-6 [&>svg]:w-6"
          style={{ color: textColor }}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}

      <span className="min-w-0 flex-1 py-3 text-left">
        <span
          className="block text-[16px] font-normal leading-snug"
          style={{ color: textColor }}
        >
          {label}
        </span>
        {subtitle && (
          <span
            className="mt-0.5 block text-[13px] leading-snug break-words"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle}
          </span>
        )}
      </span>

      <span
        className={`ml-auto pl-3 flex items-center justify-end gap-2 ${
          actionValue ? 'flex-none shrink-0 whitespace-nowrap' : 'min-w-0 max-w-[55%] shrink'
        }`}
      >
        {dot && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400"
            aria-label="Action recommended"
          />
        )}

        {rightElement}

        {value !== undefined && value !== null && (
          <span
            className={
              actionValue
                ? 'whitespace-nowrap text-right text-[14px] sm:text-[15px] leading-snug'
                : 'min-w-0 break-words text-right text-[14px] sm:text-[15px] leading-snug'
            }
            style={{
              color: actionValue ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: actionValue ? 500 : 400,
              ...(actionValue ? {} : { overflowWrap: 'anywhere' }),
            }}
          >
            {value}
          </span>
        )}

        {loading ? (
          <Loader2
            className="h-5 w-5 animate-spin shrink-0"
            style={{ color: 'var(--text-muted)' }}
          />
        ) : chevron === 'right' ? (
          <ChevronRight
            className="h-5 w-5 shrink-0"
            style={{ color: 'var(--text-muted)' }}
            strokeWidth={1.75}
          />
        ) : chevron === 'down' ? (
          <ChevronDown
            className="h-5 w-5 shrink-0"
            style={{ color: 'var(--text-muted)' }}
            strokeWidth={1.75}
          />
        ) : null}
      </span>
    </>
  );

  const baseClass = `relative flex min-h-[56px] w-full items-center gap-2 px-5 transition-colors ${
    disabled ? 'opacity-50 cursor-not-allowed' : interactive ? 'cursor-pointer hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)]' : ''
  }`;

  return (
    <div className="relative">
      {onClick ? (
        <button
          type="button"
          onClick={interactive ? onClick : undefined}
          disabled={disabled}
          aria-disabled={disabled || loading ? 'true' : undefined}
          aria-label={ariaLabel}
          className={baseClass}
        >
          {content}
        </button>
      ) : (
        <div className={baseClass} aria-disabled={disabled ? 'true' : undefined}>
          {content}
        </div>
      )}

      {!isLast && (
        <div
          aria-hidden="true"
          className="pointer-events-none h-px"
          style={{
            backgroundColor: 'var(--border)',
            marginLeft: hasLeading ? '60px' : '20px',
          }}
        />
      )}
    </div>
  );
};

export interface SettingsProgressRowProps {
  label: string;
  percentRemaining: number;
  rightText?: string;
  resetsText?: string;
  isLast?: boolean;
}

export const SettingsProgressRow: React.FC<SettingsProgressRowProps> = ({
  label,
  percentRemaining,
  rightText,
  resetsText,
  isLast = true,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentRemaining)));

  return (
    <div className="relative px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[16px] font-normal" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        <span className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {rightText || `${clamped}% remaining`}
        </span>
      </div>

      <div
        className="mt-2.5 h-[6px] w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--border)' }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${clamped}%`,
            backgroundColor: 'var(--accent)',
          }}
        />
      </div>

      {resetsText && (
        <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {resetsText}
        </p>
      )}

      {!isLast && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 ml-5 h-px"
          style={{ backgroundColor: 'var(--border)' }}
        />
      )}
    </div>
  );
};
