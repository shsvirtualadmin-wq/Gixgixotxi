import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';
import { prefersReducedMotion, triggerHapticFeedback } from '@/utils/bubbleTouch';

/* ============================================================================
 * 1. usePressable & <Bubble> — Bubble Touch Physics Hook & Wrapper
 * ============================================================================ */

export interface UsePressableOptions {
  disabled?: boolean;
  haptic?: boolean;
  scaleVariant?: 'default' | 'icon';
}

export function usePressable<T extends HTMLElement = HTMLElement>(
  options: UsePressableOptions = {}
) {
  const { disabled = false, haptic = true, scaleVariant = 'default' } = options;
  const reboundTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (reboundTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(reboundTimerRef.current);
      }
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<T>) => {
      if (disabled) return;
      if (haptic) {
        triggerHapticFeedback(8);
      }
      if (prefersReducedMotion()) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      el.style.setProperty('--tap-x', `${x}px`);
      el.style.setProperty('--tap-y', `${y}px`);
      el.removeAttribute('data-rebound');
      el.setAttribute('data-pressed', 'true');
    },
    [disabled, haptic]
  );

  const releasePress = useCallback((e: React.PointerEvent<T>) => {
    const el = e.currentTarget;
    if (el.getAttribute('data-pressed') !== 'true') return;
    el.removeAttribute('data-pressed');
    if (prefersReducedMotion()) return;
    el.setAttribute('data-rebound', 'true');
    if (reboundTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(reboundTimerRef.current);
    }
    if (typeof window !== 'undefined') {
      reboundTimerRef.current = window.setTimeout(() => {
        el.removeAttribute('data-rebound');
        reboundTimerRef.current = null;
      }, 500);
    }
  }, []);

  return {
    'data-pressable': 'true' as const,
    'data-pressable-scale': scaleVariant,
    onPointerDown,
    onPointerUp: releasePress,
    onPointerLeave: releasePress,
    onPointerCancel: releasePress,
  };
}

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'button' | 'span';
  disabled?: boolean;
  haptic?: boolean;
  scaleVariant?: 'default' | 'icon';
  type?: 'button' | 'submit' | 'reset';
}

export const Bubble: React.FC<BubbleProps> = ({
  as = 'div',
  disabled = false,
  haptic = true,
  scaleVariant = 'default',
  type = 'button',
  className = '',
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...rest
}) => {
  const pressable = usePressable<HTMLElement>({ disabled, haptic, scaleVariant });

  const mergedProps = {
    ...rest,
    'data-pressable': pressable['data-pressable'],
    'data-pressable-scale': pressable['data-pressable-scale'],
    className: `lg-bubble ${className}`.trim(),
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      pressable.onPointerDown(e);
      onPointerDown?.(e as React.PointerEvent<HTMLDivElement>);
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      pressable.onPointerUp(e);
      onPointerUp?.(e as React.PointerEvent<HTMLDivElement>);
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      pressable.onPointerLeave(e);
      onPointerLeave?.(e as React.PointerEvent<HTMLDivElement>);
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      pressable.onPointerCancel(e);
      onPointerCancel?.(e as React.PointerEvent<HTMLDivElement>);
    },
  };

  if (as === 'button') {
    return (
      <button type={type} disabled={disabled} {...(mergedProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }

  if (as === 'span') {
    return <span {...(mergedProps as React.HTMLAttributes<HTMLSpanElement>)}>{children}</span>;
  }

  return <div {...mergedProps}>{children}</div>;
};

/* ============================================================================
 * 2. <GlassCard> — Liquid Glass Surface Container (26px–32px radius)
 * ============================================================================ */

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  dotHeader?: React.ReactNode;
  pressable?: boolean;
  haptic?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  compact = false,
  dotHeader,
  pressable = false,
  haptic = false,
  className = '',
  children,
  ...rest
}) => {
  const pressProps = usePressable<HTMLDivElement>({
    disabled: !pressable,
    haptic,
  });

  return (
    <div
      {...(pressable ? pressProps : {})}
      className={`lg-card ${compact ? 'lg-card--compact' : ''} ${
        pressable ? 'cursor-pointer' : ''
      } ${className}`.trim()}
      {...rest}
    >
      {dotHeader && (
        <div className="lg-dot-matrix -mx-5 -mt-4 mb-3.5 px-5 py-3 border-b border-[var(--border)]">
          {dotHeader}
        </div>
      )}
      {children}
    </div>
  );
};

/* ============================================================================
 * 3. <Pill> — Status / Role / Count / Filter Badge (default, red, ok, danger)
 *    Never renders "undefined"
 * ============================================================================ */

export type PillVariant =
  | 'default'
  | 'neutral'
  | 'ok'
  | 'live'
  | 'green'
  | 'warn'
  | 'pending'
  | 'amber'
  | 'danger'
  | 'error'
  | 'red'
  | 'accent'
  | 'info'
  | 'cyan';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  dot?: boolean;
}

export const Pill: React.FC<PillProps> = ({
  variant = 'default',
  dot = false,
  className = '',
  children,
  ...rest
}) => {
  if (children === null || children === undefined || children === '') {
    return null;
  }
  const textRep = typeof children === 'string' || typeof children === 'number' ? String(children) : '';
  if (/undefined|nan/i.test(textRep)) {
    return null;
  }

  const variantClass =
    variant === 'default' || variant === 'neutral' ? '' : `lg-pill--${variant}`;

  return (
    <span className={`lg-pill ${variantClass} ${className}`.trim()} {...rest}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

/* ============================================================================
 * 4. <Segmented> — Horizontal Pill Tab Bar with Sliding Spring Indicator
 * ============================================================================ */

export interface SegmentedOption<T extends string = string> {
  id: T;
  label: React.ReactNode;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface SegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel = 'Segmented options',
  className = '',
}: SegmentedProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const activeEl = itemRefs.current[value];
    const containerEl = containerRef.current;
    if (!activeEl || !containerEl) {
      setIndicator(null);
      return;
    }
    const updateMetrics = () => {
      const el = itemRefs.current[value];
      if (!el) return;
      setIndicator({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    };
    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      data-has-indicator={indicator ? 'true' : 'false'}
      className={`lg-segmented ${className}`.trim()}
    >
      {indicator && (
        <div
          aria-hidden="true"
          className="lg-segmented-indicator"
          style={{
            width: `${indicator.width}px`,
            transform: `translate3d(${indicator.left}px, 0, 0)`,
          }}
        />
      )}
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <div
            key={opt.id}
            ref={(el) => {
              itemRefs.current[opt.id] = el;
            }}
            className="shrink-0 flex"
          >
            <Bubble
              as="button"
              type="button"
              haptic
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.id)}
              className={`lg-segmented-item ${active ? 'is-active' : ''}`}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span>{opt.label}</span>
              {opt.badge !== undefined && opt.badge !== null && !/undefined/i.test(String(opt.badge)) && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/25 text-current tabular-nums">
                  {opt.badge}
                </span>
              )}
            </Bubble>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 5. <GlassSheet> — Mobile Bottom Sheet / Desktop Centered Modal (Spring In)
 * ============================================================================ */

export interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const GlassSheet: React.FC<GlassSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = 'md:max-w-[520px]',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-fullscreen-modal="true"
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity cursor-pointer"
        aria-hidden="true"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full ${maxWidthClass} max-h-[86dvh] overflow-y-auto lg-surface lg-sheet-panel rounded-t-[28px] md:rounded-[28px] p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] md:pb-6 flex flex-col gap-4`}
      >
        <div className="md:hidden w-10 h-1 rounded-full bg-white/25 mx-auto -mt-1 mb-1 shrink-0" />
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="min-w-0">
              {title && (
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] leading-snug">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--mute)] mt-0.5">{subtitle}</p>
              )}
            </div>
            <Bubble
              as="button"
              type="button"
              scaleVariant="icon"
              onClick={onClose}
              aria-label="Close sheet"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--glass-2)] border border-[var(--border)] text-[var(--mute)] hover:text-[var(--text)] shrink-0 cursor-pointer"
            >
              <X size={16} />
            </Bubble>
          </div>
        )}
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>,
    document.body
  );
};

/* ============================================================================
 * 6. <GlassInput>, <GlassSelect>, <GlassTextarea> — 48px Height, 16px Radius
 * ============================================================================ */

export interface GlassFieldWrapperProps {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

const GlassFieldWrapper: React.FC<GlassFieldWrapperProps> = ({
  label,
  helperText,
  errorText,
  htmlFor,
  children,
  className = '',
}) => (
  <div className={`space-y-1.5 ${className}`.trim()}>
    {label && (
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-[var(--mute)] tracking-wide"
      >
        {label}
      </label>
    )}
    {children}
    {errorText ? (
      <p className="text-xs font-medium text-[var(--accent)]">{errorText}</p>
    ) : helperText ? (
      <p className="text-xs text-[var(--dim)]">{helperText}</p>
    ) : null}
  </div>
);

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  wrapperClassName?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  helperText,
  errorText,
  id,
  className = '',
  wrapperClassName = '',
  ...rest
}) => (
  <GlassFieldWrapper
    label={label}
    helperText={helperText}
    errorText={errorText}
    htmlFor={id}
    className={wrapperClassName}
  >
    <input id={id} className={`lg-input ${className}`.trim()} {...rest} />
  </GlassFieldWrapper>
);

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  wrapperClassName?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  label,
  helperText,
  errorText,
  id,
  className = '',
  wrapperClassName = '',
  children,
  ...rest
}) => (
  <GlassFieldWrapper
    label={label}
    helperText={helperText}
    errorText={errorText}
    htmlFor={id}
    className={wrapperClassName}
  >
    <select id={id} className={`lg-select ${className}`.trim()} {...rest}>
      {children}
    </select>
  </GlassFieldWrapper>
);

export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  wrapperClassName?: string;
}

export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  helperText,
  errorText,
  id,
  className = '',
  wrapperClassName = '',
  ...rest
}) => (
  <GlassFieldWrapper
    label={label}
    helperText={helperText}
    errorText={errorText}
    htmlFor={id}
    className={wrapperClassName}
  >
    <textarea id={id} className={`lg-textarea ${className}`.trim()} {...rest} />
  </GlassFieldWrapper>
);

/* ============================================================================
 * 7. <Toast> — Floating Glass Pill at Top (Replaces blocking alert())
 * ============================================================================ */

export interface ToastProps {
  message: string | null;
  variant?: 'neutral' | 'success' | 'error';
  onDismiss?: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'neutral',
  onDismiss,
  durationMs = 3600,
}) => {
  useEffect(() => {
    if (!message || !onDismiss || durationMs <= 0) return;
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [message, onDismiss, durationMs]);

  if (!message || typeof document === 'undefined') return null;

  const toneBorder =
    variant === 'error'
      ? 'border-[var(--accent)]/45 text-[var(--accent)]'
      : variant === 'success'
      ? 'border-[var(--green)]/45 text-[var(--green)]'
      : 'border-[var(--border)] text-[var(--text)]';

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
      className="fixed inset-x-0 z-[10000] flex justify-center px-4 pointer-events-none"
    >
      <div
        className={`pointer-events-auto lg-surface rounded-full px-4 py-2.5 border ${toneBorder} shadow-2xl flex items-center gap-2.5 text-xs font-semibold max-w-md`}
      >
        <span className="truncate">{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="opacity-70 hover:opacity-100 cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

/* ============================================================================
 * 8. <EmptyState> — Clean Glass Card with Icon, Title, Subtitle & Optional CTA
 * ============================================================================ */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  className = '',
}) => (
  <GlassCard className={`text-center py-8 px-5 flex flex-col items-center gap-2.5 ${className}`.trim()}>
    {icon && (
      <div className="w-11 h-11 rounded-full bg-[var(--glass-2)] border border-[var(--border)] flex items-center justify-center text-[var(--mute)]">
        {icon}
      </div>
    )}
    <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">{title}</h3>
    {subtitle && (
      <p className="text-xs text-[var(--mute)] max-w-md leading-relaxed">{subtitle}</p>
    )}
    {actionLabel && onAction && (
      <Bubble
        as="button"
        type="button"
        haptic
        onClick={onAction}
        className="mt-1.5 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer"
      >
        {actionLabel}
      </Bubble>
    )}
  </GlassCard>
);

/* ============================================================================
 * 9. <ErrorState> — Compact Red-Tinted Glass Banner with Collapsed "Details"
 *    (Details stay mounted in DOM and hidden via CSS only)
 * ============================================================================ */

export interface ErrorStateProps {
  section?: string;
  message?: string;
  details?: string | Record<string, unknown> | null;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  section = 'section',
  message,
  details,
  onRetry,
  retrying = false,
  className = '',
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formattedDetails =
    details === null || details === undefined
      ? ''
      : typeof details === 'string'
      ? details
      : JSON.stringify(details, null, 2);

  return (
    <div
      role="alert"
      className={`lg-surface rounded-[22px] p-4 border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--text)] space-y-2.5 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center shrink-0">
            <AlertCircle size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
              {message || `Couldn't load ${section}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {formattedDetails && (
            <Bubble
              as="button"
              type="button"
              onClick={() => setDetailsOpen((prev) => !prev)}
              aria-expanded={detailsOpen}
              className="inline-flex items-center gap-1 min-h-[44px] px-3.5 py-2 rounded-full text-[11px] font-semibold bg-[var(--glass-2)] border border-[var(--border)] text-[var(--mute)] hover:text-[var(--text)] cursor-pointer"
            >
              <span>Details</span>
              {detailsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </Bubble>
          )}
          {onRetry && (
            <Bubble
              as="button"
              type="button"
              haptic
              disabled={retrying}
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full text-[11px] font-bold bg-[var(--accent)] text-white cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
              <span>{retrying ? 'Retrying…' : 'Retry'}</span>
            </Bubble>
          )}
        </div>
      </div>

      {/* Mounted at all times, hidden with CSS when collapsed */}
      {formattedDetails && (
        <pre
          data-collapsed={!detailsOpen}
          style={{ display: detailsOpen ? 'block' : 'none' }}
          className="lg-collapsible p-3 rounded-2xl bg-black/40 border border-[var(--border)] text-[11px] font-mono text-[var(--mute)] overflow-x-auto whitespace-pre-wrap break-all"
        >
          {formattedDetails}
        </pre>
      )}
    </div>
  );
};
