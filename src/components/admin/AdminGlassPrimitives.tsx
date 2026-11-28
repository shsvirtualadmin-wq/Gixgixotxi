import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  Filter,
  Lock,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  X,
} from 'lucide-react';
import { isLowEndDevice, useAdminGlassFlag } from '@/utils/adminGlassFlag';

/* ============================================================================
 * 0. SHARED HOOKS (400ms Debounce + Global Glossy Button Touch Bubble + Haptic)
 * ========================================================================== */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Attaches ONE delegated pointerdown listener on document when the redesigned
 * admin UI is enabled. Spawns a glossy circular touch bubble at the tap point
 * on any `.ag-ios-btn` or `.ag-segmented-item` and triggers subtle haptic
 * feedback (`navigator.vibrate?.(8)`), respecting `prefers-reduced-motion`.
 */
export function useAdminButtonBubble(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined' || typeof window === 'undefined') return;

    const reducedMotionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest<HTMLElement>('.ag-ios-btn, .ag-segmented-item');
      if (!btn || btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') {
        return;
      }

      const inAdminGlass = Boolean(
        btn.closest('[data-admin-shell="true"][data-admin-glass="1"], [data-admin-glass-portal="1"]')
      );
      if (!inAdminGlass) return;

      if (reducedMotionQuery?.matches) return;

      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(8);
        }
      } catch {
        // Haptics are optional and may be blocked before gesture
      }

      const rect = btn.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const size = Math.max(rect.width, rect.height) * 1.45;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const bubble = document.createElement('span');
      bubble.className = 'ag-touch-bubble';
      bubble.setAttribute('aria-hidden', 'true');
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${x}px`;
      bubble.style.top = `${y}px`;

      btn.appendChild(bubble);
      window.setTimeout(() => {
        bubble.remove();
      }, 680);
    };

    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [enabled]);
}

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
 * 2. HEADINGS & MONO LABELS (Space Grotesk + Space Mono uppercase labels)
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
      ? 'text-[22px] sm:text-[26px]'
      : size === 'metric'
      ? 'text-[24px] sm:text-[30px] ag-tabular'
      : 'text-[16px] sm:text-[18px]';
  return (
    <Tag
      className={`${enabled ? 'ag-dot-heading' : 'font-dot font-bold'} ${sizeClass} tracking-tight text-[var(--text)] ${className}`}
    >
      {children}
    </Tag>
  );
});

export const MonoLabel = memo(function MonoLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { enabled } = useAdminGlassFlag();
  return (
    <span
      className={`${
        enabled
          ? 'ag-mono-label text-[var(--ag-text-muted)]'
          : 'text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]'
      } ${className}`}
    >
      {children}
    </span>
  );
});

/* ============================================================================
 * 3. GLASS CARD (Question-Bank dark gradient card + red-glow hero variant)
 * ========================================================================== */
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'glass' = dark gradient card with inner top highlight. 'hero' = red-glow main item card. 'flat' = row card inside lists (no backdrop-filter). */
  variant?: 'glass' | 'flat' | 'hero';
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
    ? variant === 'hero'
      ? 'ag-glass-card--hero rounded-[22px]'
      : variant === 'glass'
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
 * 3B. RAISED GLOSSY iOS BUTTONS (shared primary / secondary / pill / icon / danger)
 * ========================================================================== */
export type AdminButtonVariant = 'primary' | 'secondary' | 'pill' | 'icon' | 'danger';

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
  fullWidth?: boolean;
}

export const AdminButton = memo(function AdminButton({
  variant = 'secondary',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: AdminButtonProps) {
  const { enabled } = useAdminGlassFlag();

  const classicClasses: Record<AdminButtonVariant, string> = {
    primary:
      'min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50',
    secondary:
      'min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[var(--bg)] cursor-pointer disabled:opacity-50',
    pill:
      'min-h-[40px] px-3.5 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50',
    icon:
      'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--text)] inline-flex items-center justify-center cursor-pointer disabled:opacity-50',
    danger:
      'min-h-[44px] px-4 py-2.5 rounded-xl bg-red-500/12 border border-red-500/35 text-red-500 text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50',
  };

  return (
    <button
      type={type}
      className={`${
        enabled ? `ag-ios-btn ag-ios-btn--${variant}` : classicClasses[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

/* ============================================================================
 * 4. PILL (semantic status & metadata tag)
 * ========================================================================== */
export type PillTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const PILL_TONES: Record<PillTone, string> = {
  neutral: 'bg-[var(--bg)]/70 border-[var(--border)] text-[var(--text-muted)]',
  accent: 'bg-[#E8353B]/15 border-[#E8353B]/40 text-[#ff6d73]',
  success: 'bg-emerald-500/14 border-emerald-500/35 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/14 border-amber-500/35 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/14 border-red-500/35 text-red-600 dark:text-red-400',
  info: 'bg-sky-500/14 border-sky-500/35 text-sky-700 dark:text-sky-400',
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
  const { enabled } = useAdminGlassFlag();
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-bold leading-none whitespace-nowrap ag-tabular ${
        enabled ? 'font-mono uppercase tracking-[0.04em]' : ''
      } ${PILL_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
});

/* ============================================================================
 * 5. SEGMENTED CONTROL (Question-Bank Pill Tab Bar with Red Active Tab)
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
                ? 'ag-segmented-item inline-flex items-center justify-center gap-1.5 shrink-0'
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
                className={`text-[10.5px] px-1.5 py-0.5 rounded-full ag-tabular font-mono ${
                  selected
                    ? 'bg-white/22 text-white'
                    : 'bg-white/[0.08] text-[var(--text-muted)]'
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
 * 5B. QUESTION-BANK 2x2 STAT TILES & SEARCH+FILTERS BAR & LIST STATES
 * ========================================================================== */
export interface AdminStatTileItem {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  tone?: 'default' | 'accent' | 'success' | 'warning';
}

export const AdminStatGrid = memo(function AdminStatGrid({
  items,
  columns = 2,
  className = '',
}: {
  items: AdminStatTileItem[];
  columns?: 2 | 4;
  className?: string;
}) {
  const { enabled } = useAdminGlassFlag();
  const gridCols = columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2';
  const valueToneClass = (tone?: AdminStatTileItem['tone']) => {
    if (tone === 'accent') return 'text-[#E8353B]';
    if (tone === 'success') return 'text-emerald-400';
    if (tone === 'warning') return 'text-amber-400';
    return 'text-[var(--text)]';
  };
  return (
    <div className={`grid ${gridCols} gap-2.5 ${className}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className={
            enabled
              ? 'ag-stat-tile flex flex-col gap-1 min-w-0'
              : 'rounded-2xl px-3.5 py-3 bg-[var(--bg)]/60 border border-[var(--border)] flex flex-col gap-1 min-w-0'
          }
        >
          <span
            className={
              enabled
                ? 'ag-mono-label text-[var(--ag-text-muted)] truncate'
                : 'text-[11px] font-semibold text-[var(--text-muted)] truncate'
            }
          >
            {item.label}
          </span>
          <div
            className={`text-[19px] sm:text-[22px] font-bold ag-tabular leading-tight truncate ${valueToneClass(
              item.tone
            )}`}
          >
            {item.value}
          </div>
          {item.sublabel && (
            <span className="text-[11px] text-[var(--text-muted)] truncate">{item.sublabel}</span>
          )}
        </div>
      ))}
    </div>
  );
});

export interface AdminSearchFilterBarProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
  filterLabel?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const AdminSearchFilterBar = memo(function AdminSearchFilterBar({
  value,
  onChange,
  placeholder = 'Search…',
  onOpenFilters,
  activeFilterCount = 0,
  filterLabel = 'Filters',
  rightSlot,
  className = '',
}: AdminSearchFilterBarProps) {
  const { enabled } = useAdminGlassFlag();
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <div className="relative flex-1 min-w-0">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${
            enabled ? 'ag-search-input rounded-[16px]' : 'bg-[var(--card)] border border-[var(--border)] rounded-xl'
          } w-full min-h-[44px] pl-10 pr-9 text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-muted)]`}
        />
        {value.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {onOpenFilters && (
        <AdminButton
          variant="secondary"
          onClick={onOpenFilters}
          className="shrink-0 !px-3.5"
          aria-label={
            activeFilterCount > 0 ? `${filterLabel} (${activeFilterCount} active)` : filterLabel
          }
        >
          <Filter size={15} />
          <span>{filterLabel}</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#E8353B] text-white text-[10px] font-mono font-bold leading-none ag-tabular">
              {activeFilterCount}
            </span>
          )}
        </AdminButton>
      )}
      {rightSlot}
    </div>
  );
});

export const AdminErrorRetryCard = memo(function AdminErrorRetryCard({
  title = 'Failed to load data',
  message,
  onRetry,
  retrying = false,
}: {
  title?: string;
  message?: string | null;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <GlassCard variant="glass" padding="lg" className="text-center flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-[#E8353B]/15 border border-[#E8353B]/35 text-[#ff7076] flex items-center justify-center">
        <AlertTriangle size={22} />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-[16px] font-bold text-[var(--text)]">{title}</h3>
        {message && <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">{message}</p>}
      </div>
      <AdminButton variant="primary" onClick={onRetry} disabled={retrying}>
        <RefreshCw size={15} className={retrying ? 'animate-spin' : ''} />
        <span>{retrying ? 'Retrying…' : 'Try again'}</span>
      </AdminButton>
    </GlassCard>
  );
});

export const AdminEmptyState = memo(function AdminEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <GlassCard variant="glass" padding="lg" className="text-center flex flex-col items-center gap-3">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#E8353B]/12 border border-[#E8353B]/30 text-[#E8353B] flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-md">
        <h3 className="text-[16px] font-bold text-[var(--text)]">{title}</h3>
        {description && (
          <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-1 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </GlassCard>
  );
});

/* ============================================================================
 * 5C. SHARED SOLID OPAQUE OVERLAY, POPOVER MENU & CONFIRM DIALOG
 *     (#161616 background, 1px solid #3a3a3a, rgba(0,0,0,0.8) backdrop, z-9999)
 * ========================================================================== */
export interface AdminOverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  mode?: 'modal' | 'sheet' | 'popover';
  anchorEl?: HTMLElement | null;
  align?: 'left' | 'right';
  maxWidthClass?: string;
  ariaLabel?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminOverlay({
  open,
  onClose,
  title,
  subtitle,
  mode = 'modal',
  anchorEl,
  align = 'right',
  maxWidthClass = 'max-w-[560px]',
  ariaLabel,
  footer,
  children,
}: AdminOverlayProps) {
  const { enabled } = useAdminGlassFlag();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width?: number } | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || mode !== 'popover' || !anchorEl || typeof window === 'undefined') {
      setPopoverCoords(null);
      return;
    }

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const panelWidth = Math.max(228, Math.min(300, panelRef.current?.offsetWidth || 244));
      const panelHeight = panelRef.current?.offsetHeight || 260;
      const margin = 10;

      let left = align === 'right' ? rect.right - panelWidth : rect.left;
      left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

      let top = rect.bottom + 8;
      if (top + panelHeight > window.innerHeight - margin && rect.top - panelHeight - 8 > margin) {
        top = rect.top - panelHeight - 8;
      } else {
        top = Math.min(top, Math.max(margin, window.innerHeight - panelHeight - margin));
      }

      setPopoverCoords({
        top: Math.round(top),
        left: Math.round(left),
        width: align === 'left' && rect.width > 220 ? Math.min(rect.width, window.innerWidth - 20) : undefined,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, mode, anchorEl, align]);

  if (!open || typeof document === 'undefined') return null;

  if (mode === 'popover') {
    return createPortal(
      <div
        data-admin-glass-portal={enabled ? '1' : '0'}
        data-admin-overlay="popover"
        className="fixed inset-0 z-[9998]"
        style={{ zIndex: 9998 }}
      >
        <div
          aria-hidden="true"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="ag-overlay-backdrop"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        />
        <div
          ref={panelRef}
          role="menu"
          aria-label={ariaLabel || title || 'Actions menu'}
          onClick={(e) => e.stopPropagation()}
          className="ag-overlay-panel fixed rounded-[20px] p-1.5 flex flex-col gap-0.5 max-h-[75dvh] overflow-y-auto"
          style={{
            zIndex: 9999,
            top: popoverCoords ? `${popoverCoords.top}px` : '80px',
            left: popoverCoords ? `${popoverCoords.left}px` : '16px',
            minWidth: popoverCoords?.width ? `${popoverCoords.width}px` : '232px',
            maxWidth: 'calc(100vw - 20px)',
          }}
        >
          {title && (
            <div className="px-3 py-2 border-b border-[#2e2e32] mb-1">
              <div className="ag-mono-label text-[10px] text-[#9c9ca6]">{title}</div>
              {subtitle && <div className="text-[12px] text-[#d4d4dc] truncate mt-0.5">{subtitle}</div>}
            </div>
          )}
          {children}
        </div>
      </div>,
      document.body
    );
  }

  const isSheet = mode === 'sheet';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || 'Admin dialog'}
      data-fullscreen-modal="true"
      data-admin-glass-portal={enabled ? '1' : '0'}
      data-admin-overlay={mode}
      style={{ zIndex: 9999 }}
      className={`fixed inset-0 z-[9999] flex ${
        isSheet ? 'items-end justify-center' : 'items-center justify-center p-4'
      }`}
    >
      <div
        aria-hidden="true"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        className="ag-overlay-backdrop"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`ag-overlay-panel w-full ${maxWidthClass} ${
          isSheet
            ? 'rounded-t-[26px] border-b-0 max-h-[90dvh] pb-[calc(20px+env(safe-area-inset-bottom,0px))]'
            : 'rounded-[24px] max-h-[88dvh]'
        } flex flex-col overflow-hidden`}
      >
        {isSheet && (
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-[#4a4a52]" />
          </div>
        )}

        {(title || subtitle) && (
          <div className="px-5 py-3.5 border-b border-[#2c2c30] flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 className="text-[17px] font-bold text-[#f5f5f7] leading-snug truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-[12px] text-[#a1a1aa] truncate mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="ag-ios-btn ag-ios-btn--icon !w-10 !h-10 !min-w-[40px] !min-h-[40px] shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-[#2c2c30] bg-[#121214] flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export interface AdminPopoverMenuItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
  download?: boolean;
  onSelect?: () => void;
}

export function AdminPopoverMenu({
  open,
  onClose,
  anchorEl,
  align = 'right',
  title,
  subtitle,
  items,
}: {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  align?: 'left' | 'right';
  title?: string;
  subtitle?: string;
  items: AdminPopoverMenuItem[];
}) {
  return (
    <AdminOverlay
      open={open}
      onClose={onClose}
      mode="popover"
      anchorEl={anchorEl}
      align={align}
      title={title}
      subtitle={subtitle}
    >
      {items.map((item) =>
        item.href ? (
          <a
            key={item.id}
            href={item.href}
            download={item.download}
            role="menuitem"
            onClick={() => {
              onClose();
              item.onSelect?.();
            }}
            className={`ag-overlay-item no-underline ${item.danger ? 'ag-overlay-item--danger' : ''}`}
          >
            {item.icon && <span className="shrink-0 flex items-center">{item.icon}</span>}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{item.label}</span>
              {item.description && (
                <span className="block text-[11px] font-normal text-[#9c9ca6] truncate">
                  {item.description}
                </span>
              )}
            </span>
          </a>
        ) : (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect?.();
            }}
            className={`ag-overlay-item ${item.danger ? 'ag-overlay-item--danger' : ''} disabled:opacity-45`}
          >
            {item.icon && <span className="shrink-0 flex items-center">{item.icon}</span>}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{item.label}</span>
              {item.description && (
                <span className="block text-[11px] font-normal text-[#9c9ca6] truncate">
                  {item.description}
                </span>
              )}
            </span>
          </button>
        )
      )}
    </AdminOverlay>
  );
}

export function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  busy = false,
  confirmDisabled = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <AdminOverlay
      open={open}
      onClose={busy ? () => {} : onClose}
      mode="modal"
      title={title}
      maxWidthClass="max-w-[440px]"
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={danger ? 'primary' : 'primary'}
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
          >
            {busy ? 'Working…' : confirmLabel}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-3">
        {description && (
          <p className="text-[13.5px] text-[#d4d4dc] leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </AdminOverlay>
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
  const { enabled } = useAdminGlassFlag();
  return (
    <div className={`ag-field flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <label
          htmlFor={htmlFor}
          className={
            enabled
              ? 'ag-mono-label text-[10.5px] text-[var(--ag-text-secondary)]'
              : 'text-[12px] font-semibold text-[var(--text)] leading-snug'
          }
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
        <p className="text-[11.5px] text-[#ff6b72] font-semibold">{error}</p>
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
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(86px+env(safe-area-inset-bottom,0px))] md:bottom-5 md:left-[calc(50%+120px)] z-[85] w-[calc(100%-24px)] max-w-[740px] pointer-events-auto"
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
          <span className="text-[13px] font-semibold text-[var(--text)]">{message}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {onResetDefaults && (
            <>
              <AdminButton
                variant="pill"
                onClick={onResetDefaults}
                disabled={saving}
                className="!text-[12px]"
              >
                <RotateCcw size={13} />
                <span>{resetLabel}</span>
              </AdminButton>
              <span
                className="hidden sm:inline-block h-5 w-px bg-[var(--border)] mx-0.5"
                aria-hidden="true"
              />
            </>
          )}
          {extraActions}
          {onDiscard && (
            <AdminButton
              variant="secondary"
              onClick={onDiscard}
              disabled={saving}
              className="!min-h-[40px] !py-2 !px-3.5 !text-[12.5px]"
            >
              {discardLabel}
            </AdminButton>
          )}
          <AdminButton
            variant="primary"
            onClick={onSave}
            disabled={saving || disabled}
            className="!min-h-[40px] !py-2 !px-4 !text-[13px]"
          >
            <Save size={14} />
            <span>{saving ? 'Saving…' : saveLabel}</span>
          </AdminButton>
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
 * 8. BOTTOM NAV (Mounted once outside page content; spring red pill + icon scale)
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
  isScrolling?: boolean;
}

export const BottomNav = memo(function BottomNav({
  items,
  activeTabIndex,
  isMoreActive,
  onPrefetch,
  onOpenMore,
  glassEnabled,
  isScrolling = false,
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
      className="md:hidden fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-20px)] max-w-[460px] z-[90] pointer-events-auto"
      aria-label="Admin Navigation Bar"
    >
      <nav
        role="tablist"
        data-scrolling={isScrolling ? '1' : '0'}
        className={
          glassEnabled
            ? 'ag-bottom-nav rounded-[30px] p-1.5 flex items-center justify-between select-none relative h-[64px] pointer-events-auto'
            : 'rounded-[32px] glass dashboard-glass-bar allow-backdrop-blur border p-1.5 flex items-center justify-between select-none relative h-[62px] pointer-events-auto'
        }
      >
        {/* Single absolutely positioned red sliding pill (animates ONLY transform & opacity) */}
        <div
          aria-hidden="true"
          data-admin-nav-pill="true"
          className="ag-bottom-nav-pill pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 rounded-full z-0"
          style={{
            width: `calc((100% - 12px) / ${totalTabs})`,
            transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)`,
            opacity: activeTabIndex >= 0 ? 1 : 0,
            background: glassEnabled
              ? 'linear-gradient(180deg, #ff4c53 0%, #e11d25 58%, #b3121a 100%)'
              : '#D71921',
            boxShadow: glassEnabled
              ? '0 8px 22px -4px rgba(232, 53, 59, 0.60), inset 0 1px 0 rgba(255, 255, 255, 0.38)'
              : '0 8px 22px -4px rgba(215, 25, 33, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.30)',
          }}
        />

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
              className={`relative rounded-full transition-colors duration-150 cursor-pointer h-full min-h-[48px] flex items-center justify-center text-center outline-none select-none flex-1 min-w-0 px-1 ${
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
                  <div
                    data-active={isActive ? '1' : '0'}
                    className="ag-bottom-nav-icon relative shrink-0 flex items-center justify-center"
                  >
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
          className="relative rounded-full transition-colors duration-150 cursor-pointer h-full min-h-[48px] flex items-center justify-center text-center outline-none select-none flex-1 min-w-0 px-1"
        >
          <span
            className={`relative z-10 flex items-center justify-center transition-colors max-w-full pointer-events-none ${
              isMoreActive
                ? 'text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <div
              data-active={isMoreActive ? '1' : '0'}
              className="ag-bottom-nav-icon relative shrink-0 flex items-center justify-center"
            >
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
 * 9. SKELETON PRIMITIVES (first load only — never flash after cached load)
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
          className="ag-list-row rounded-[18px] p-4 flex items-center justify-between gap-4"
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
