import React from 'react';

export interface SettingsToggleRowProps {
  icon?: React.ReactNode;
  label: string;
  subtitle?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  isLast?: boolean;
}

export const SettingsToggleRow: React.FC<SettingsToggleRowProps> = ({
  icon,
  label,
  subtitle,
  checked,
  onChange,
  disabled = false,
  loading = false,
  isLast = true,
}) => {
  const isInteractive = !disabled && !loading;

  const handleToggle = () => {
    if (!isInteractive) return;
    onChange(!checked);
  };

  return (
    <div className="relative">
      <div
        onClick={handleToggle}
        className={`flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-3 transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)]'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center">
          {icon && (
            <span
              className="mr-4 flex h-6 w-6 shrink-0 items-center justify-center [&>svg]:h-6 [&>svg]:w-6"
              style={{ color: 'var(--text)' }}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span
              className="block text-[16px] font-normal leading-snug"
              style={{ color: 'var(--text)' }}
            >
              {label}
            </span>
            {subtitle && (
              <span
                className="mt-0.5 block text-[13px] leading-snug"
                style={{ color: 'var(--text-muted)' }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Accessible 48x28 switch with 24px thumb */}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={!isInteractive}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className="relative inline-flex h-[28px] w-[48px] shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
          style={{
            backgroundColor: checked ? 'var(--accent)' : 'transparent',
            border: checked ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
          }}
        >
          <span
            className="pointer-events-none block h-[22px] w-[22px] rounded-full shadow-sm transition-transform duration-200"
            style={{
              backgroundColor: checked ? '#ffffff' : 'var(--text-muted)',
              transform: checked ? 'translateX(21px)' : 'translateX(2px)',
            }}
          />
        </button>
      </div>

      {!isLast && (
        <div
          aria-hidden="true"
          className="pointer-events-none h-px"
          style={{
            backgroundColor: 'var(--border)',
            marginLeft: icon ? '60px' : '20px',
          }}
        />
      )}
    </div>
  );
};
