import React, { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { Lock, MoreHorizontal, RotateCcw, Save } from 'lucide-react';
import { isLowEndDevice, useAdminGlassFlag } from '@/utils/adminGlassFlag';

/* ============================================================================
 * 1. AMBIENT BUBBLES (max 3, fixed shared layer, transform+opacity only)
 * ========================================================================== */
export const AdminAmbientBubbles = memo(function AdminAmbientBubbles({
  enabled,
}: {
  enabled: boolean;
}) {
  const [paused, setPaused] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false
  );
  const [isStatic] = useState<boolean>(() => isLowEndDevice());

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      setPaused(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="ag-ambient-layer"
      data-ag-paused={paused ? '1' : '0'}
      data-ag-static={isStatic ? '1' : '0'}
    >
      <div className="ag-bubble ag-bubble--1" />
      <div className="ag-bubble ag-bubble--2" />
      <div className="ag-bubble ag-bubble--3" />
    </div>
  );
});

/* ============================================================================
 * 2. NOTHING-STYLE DOT-MATRIX HEADING
 * ========================================================================== */
export interface DotHeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'div';
  size?: 'page' | 'section' | 'metric';
  className?: string;
  children: React.ReactNode;
}

export const DotHeading = memo(function DotHeading({
  as: Tag = 'h1',
  size = 'page',
  className = '',
  children,
}: DotHeadingProps) {
  const { enabled } = useAdminGlassFlag();
  const sizeClass =
    size === 'page'
      ? 'text-[24px] sm:text-[28px]'
      : size === 'metric'
      ? 'text-[26px] sm:text-[32px] ag-tabular'
      : 'text-[16px] sm:text-[18px]';
  return (
    <Tag
      className={`${enabled ? 'ag-dot-heading' : 'font-dot font-bold'} ${sizeClass} tracking-tight text-[var(--text)] ${className}`}
    >
      {children}
    </Tag>
  );
});

/* ============================================================================
 * 3. GLASS CARD (blur ONLY on top-level cards; flat translucent inside lists)
 * ========================================================================== */
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'glass' = frosted backdrop-filter (top-level cards only). 'flat' = translucent row/item card without backdrop-filter. */
  variant?: 'glass' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlassCard = memo(function GlassCard({
  variant = 'glass',
  padding = 'md',
  className = '',
  children,
  ...rest
}: GlassCardProps) {
  const { enabled } = useAdminGlassFlag();
  const padClass =
    padding === 'none'
      ? ''
      : padding === 'sm'
      ? 'p-3.5 sm:p-4'
      : padding === 'lg'
      ? 'p-5 sm:p-6'
      : 'p-4 sm:p-5';

  const surfaceClass = enabled
    ? variant === 'glass'
      ? 'ag-glass-card rounded-[22px]'
      : 'ag-flat-card rounded-[18px]'
    : 'rounded-2xl bg-[var(--card)] border border-[var(--border)]';

  return (
    <div className={`${surfaceClass} ${padClass} ${className}`} {...rest}>
      {children}
    </div>
  );
});

/* ============================================================================
 * 4. PILL (semantic status & metadata tag)
 * ========================================================================== */
export type PillTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const PILL_TONES: Record<PillTone, string> = {
  neutral: 'bg-[var(--bg)]/70 border-[var(--border)] text-[var(--text-muted)]',
  accent: 'bg-[#E8353B]/14 border-[#E8353B]/35 text-[#E8353B]',
  success: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/12 border-amber-500/30 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/12 border-red-500/30 text-red-600 dark:text-red-400',
  info: 'bg-sky-500/12 border-sky-500/30 text-sky-700 dark:text-sky-400',
};

export interface PillProps {
  tone?: PillTone;
  className?: string;
  children: React.ReactNode;
  title?: string;
}

export const Pill = memo(function Pill({
  tone = 'neutral',
  className = '',
  children,
  title,
}: PillProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold leading-none whitespace-nowrap ag-tabular ${PILL_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
});

/* ============================================================================
 * 5. SEGMENTED CONTROL
 * ========================================================================== */
export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface SegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel = 'Filter options',
  className = '',
}: SegmentedProps<T>) {
  const { enabled } = useAdminGlassFlag();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`${
        enabled
          ? 'ag-segmented overflow-x-auto max-w-full'
          : 'inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-x-auto max-w-full'
      } ${className}`}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={
              enabled
                ? 'ag-segmented-item inline-flex items-center gap-1.5 shrink-0'
                : `px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    selected
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`
            }
          >
            {opt.icon}
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ag-tabular ${
                  selected
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--bg)]/60 text-[var(--text-muted)]'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 6. FIELD (clean form label + raw key hint + error)
 * ========================================================================== */
export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  rawKey?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Field = memo(function Field({
  label,
  htmlFor,
  hint,
  rawKey,
  error,
  required,
  className = '',
  children,
}: FieldProps) {
  return (
    <div className={`ag-field flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <label
          htmlFor={htmlFor}
          className="text-[12px] font-semibold text-[var(--text)] leading-snug"
        >
          {label}
          {required && <span className="text-[#E8353B] ml-0.5">*</span>}
        </label>
        {rawKey && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-75">
            {rawKey}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-[11px] text-red-500 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[var(--text-muted)] leading-snug">{hint}</p>
      ) : null}
    </div>
  );
});

/* ============================================================================
 * 7. STICKY ACTION BAR (shows ONLY when dirty, separates Save vs Reset)
 * ========================================================================== */
export interface StickyActionBarProps {
  visible: boolean;
  message?: string;
  saving?: boolean;
  saveLabel?: string;
  onSave: () => void;
  onDiscard?: () => void;
  discardLabel?: string;
  onResetDefaults?: () => void;
  resetLabel?: string;
  disabled?: boolean;
  extraActions?: React.ReactNode;
}

export const StickyActionBar = memo(function StickyActionBar({
  visible,
  message = 'You have unsaved changes',
  saving = false,
  saveLabel = 'Save changes',
  onSave,
  onDiscard,
  discardLabel = 'Discard',
  onResetDefaults,
  resetLabel = 'Reset to defaults',
  disabled = false,
  extraActions,
}: StickyActionBarProps) {
  const { enabled } = useAdminGlassFlag();

  if (!visible) return null;

  const content = (
    <div
      data-admin-glass-portal={enabled ? '1' : '0'}
      role="region"
      aria-label="Unsaved changes bar"
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] md:bottom-5 md:left-[calc(50%+120px)] z-[85] w-[calc(100%-24px)] max-w-[740px] pointer-events-auto"
    >
      <div
        className={`${
          enabled
            ? 'ag-sticky-bar rounded-[20px]'
            : 'rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl'
        } px-4 py-3 flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#E8353B] shrink-0" aria-hidden="true" />
          <span className="text-[13px] font-medium text-[var(--text)]">{message}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {onResetDefaults && (
            <>
              <button
                type="button"
                onClick={onResetDefaults}
                disabled={saving}
                className="px-3 py-2 rounded-xl text-[12px] font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw size={13} />
                <span>{resetLabel}</span>
              </button>
              <span
                className="hidden sm:inline-block h-5 w-px bg-[var(--border)] mx-0.5"
                aria-hidden="true"
              />
            </>
          )}
          {extraActions}
          {onDiscard && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className="px-3 py-2 rounded-xl border border-[var(--border)] text-[12px] font-semibold text-[var(--text)] hover:bg-[var(--bg)]/60 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {discardLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving || disabled}
            className="px-4 py-2 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] text-white text-[13px] font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Save size={14} />
            <span>{saving ? 'Saving…' : saveLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
});

/* ============================================================================
 * 8. BOTTOM NAV (Mobile floating glass dock with blur(16px))
 * ========================================================================== */
export interface BottomNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  end?: boolean;
  locked: boolean;
  badgeCount: number;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeTabIndex: number;
  isMoreActive: boolean;
  onPrefetch: (to: string) => void;
  onOpenMore: () => void;
  glassEnabled: boolean;
}

export const BottomNav = memo(function BottomNav({
  items,
  activeTabIndex,
  isMoreActive,
  onPrefetch,
  onOpenMore,
  glassEnabled,
}: BottomNavProps) {
  const totalTabs = items.length + 1;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-admin-bottom-nav="true"
      data-admin-glass-portal={glassEnabled ? '1' : '0'}
      style={{ zIndex: 90 }}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className="md:hidden fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-24px)] max-w-[440px] z-[90] pointer-events-auto"
      aria-label="Admin Navigation Bar"
    >
      <nav
        role="tablist"
        className={
          glassEnabled
            ? 'ag-bottom-nav rounded-[30px] p-1.5 flex items-center justify-between select-none relative h-[64px] pointer-events-auto'
            : 'rounded-[32px] glass dashboard-glass-bar allow-backdrop-blur border p-1.5 flex items-center justify-between select-none relative h-[62px] pointer-events-auto'
        }
      >
        {activeTabIndex >= 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 rounded-full z-0"
            style={{
              width: `calc((100% - 12px) / ${totalTabs})`,
              transform: `translate3d(${activeTabIndex * 100}%, 0, 0)`,
              transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
              backgroundColor: glassEnabled ? '#E8353B' : '#D71921',
              boxShadow: glassEnabled
                ? '0 8px 20px -4px rgba(232, 53, 59, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.28)'
                : '0 8px 22px -4px rgba(215, 25, 33, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.30)',
            }}
          />
        )}

        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              aria-label={item.label}
              onMouseEnter={() => onPrefetch(item.to)}
              onFocus={() => onPrefetch(item.to)}
              onTouchStart={() => onPrefetch(item.to)}
              onClick={(e) => e.stopPropagation()}
              className={`relative rounded-full transition-colors duration-150 cursor-pointer h-full flex items-center justify-center text-center outline-none select-none flex-1 min-w-0 px-1 ${
                item.locked ? 'opacity-65' : ''
              }`}
            >
              {({ isActive }) => (
                <span
                  className={`relative z-10 flex flex-col items-center justify-center gap-0.5 transition-colors max-w-full ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon size={20} className={isActive ? 'text-white' : ''} />
                    {item.locked && (
                      <Lock size={9} className="absolute -top-1 -right-1.5 text-amber-400" />
                    )}
                    {item.badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-[#E8353B] text-white text-[9px] font-bold ag-tabular">
                        {item.badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="sr-only">{item.label}</span>
                </span>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          role="tab"
          data-admin-nav-tab="more"
          aria-selected={isMoreActive}
          title="More admin sections"
          aria-label="More admin sections"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenMore();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="relative rounded-full transition-colors duration-150 cursor-pointer h-full flex items-center justify-center text-center outline-none select-none flex-1 min-w-0 px-1"
        >
          <span
            className={`relative z-10 flex items-center justify-center transition-colors max-w-full pointer-events-none ${
              isMoreActive
                ? 'text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <MoreHorizontal size={20} className={isMoreActive ? 'text-white' : ''} />
            </div>
            <span className="sr-only">More</span>
          </span>
        </button>
      </nav>
    </div>,
    document.body
  );
});

/* ============================================================================
 * 9. SKELETON PRIMITIVES (replace "0" / "Loading..." flashes)
 * ========================================================================== */
export const Skeleton = memo(function Skeleton({
  className = 'h-4 w-24',
}: {
  className?: string;
}) {
  return <div aria-hidden="true" className={`ag-skeleton ${className}`} />;
});

export const SkeletonMetricCard = memo(function SkeletonMetricCard() {
  return (
    <GlassCard variant="glass" padding="md" className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-7 w-7 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </GlassCard>
  );
});

export const SkeletonListRows = memo(function SkeletonListRows({
  rows = 5,
}: {
  rows?: number;
}) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="ag-list-row rounded-[16px] p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-2 flex-1 max-w-[320px]">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
});
