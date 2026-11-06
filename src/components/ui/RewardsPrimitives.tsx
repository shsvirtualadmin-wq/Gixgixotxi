import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Pure SVG Icons ──────────────────────────────────────────────────────────

export function KobanCoinSvg({
  size = 18,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <ellipse
        cx="12"
        cy="12"
        rx="7.5"
        ry="10"
        fill="url(#kobanGoldGradShared)"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="5"
        ry="7"
        stroke="#FEF3C7"
        strokeWidth="0.9"
        strokeDasharray="2 1.5"
        opacity="0.75"
      />
      <rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1" fill="#92400E" opacity="0.85" />
      <defs>
        <linearGradient
          id="kobanGoldGradShared"
          x1="4.5"
          y1="2"
          x2="19.5"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TreasureChestSvg({
  grand = false,
  size = 22,
  className = '',
}: {
  grand?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="11"
        width="22"
        height="13"
        rx="2.5"
        fill={grand ? '#B91C1C' : '#92400E'}
        stroke={grand ? '#FCA5A5' : '#FCD34D'}
        strokeWidth="1.6"
      />
      <path
        d="M3 11C3 7.5 6.5 5 14 5C21.5 5 25 7.5 25 11H3Z"
        fill={grand ? '#E11D2A' : '#B45309'}
        stroke={grand ? '#FCA5A5' : '#FCD34D'}
        strokeWidth="1.6"
      />
      <rect
        x="11.5"
        y="9.5"
        width="5"
        height="6"
        rx="1.2"
        fill="#FDE68A"
        stroke="#78350F"
        strokeWidth="1.2"
      />
      <circle cx="14" cy="12.5" r="1" fill="#78350F" />
    </svg>
  );
}

export function DragonCrestSvg({
  size = 36,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="rgba(225, 29, 42, 0.14)"
        stroke="#E11D2A"
        strokeWidth="1.5"
      />
      <path
        d="M9 21C10.5 16.5 13 14 16.5 13.5C15 11.5 12.5 10.5 10.5 11C12.5 8 16.8 7.5 20.2 9.8C22.8 11.5 24 14.8 22.8 18.2C21.6 21.5 18.2 23.5 14.5 23.2C16.8 21.8 18.2 19.6 18 17.5C15.5 18.5 12.2 19.8 9 21Z"
        fill="#E11D2A"
      />
      <circle cx="18.5" cy="11.5" r="1.2" fill="#FEF08A" />
    </svg>
  );
}

// ─── 1. GlassCard ────────────────────────────────────────────────────────────

export interface GlassCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  primary?: boolean;
  variant?: 'default' | 'zenryu';
  children: React.ReactNode;
}

/**
 * Reusable top-level rounded-[28px] frosted glass card that reads `--rw-*` theme tokens.
 * Uses backdrop-blur-xl only on top-level cards.
 */
export function GlassCard({
  as: Component = 'div',
  primary = false,
  variant = 'default',
  className = '',
  style,
  children,
  ...rest
}: GlassCardProps) {
  const isZenryu = variant === 'zenryu';

  return (
    <Component
      className={`rounded-[28px] border backdrop-blur-xl transition-all duration-200 ${className}`}
      style={{
        backgroundColor: isZenryu ? 'var(--rw-zenryu-bg)' : 'var(--rw-card-bg)',
        borderColor: isZenryu ? 'var(--rw-zenryu-border)' : 'var(--rw-card-border)',
        boxShadow: primary ? 'var(--rw-card-primary-shadow)' : 'var(--rw-card-shadow)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}

// ─── 2. PillRow ──────────────────────────────────────────────────────────────

export interface PillRowProps extends React.HTMLAttributes<HTMLElement> {
  label?: React.ReactNode;
  value?: React.ReactNode;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  dashed?: boolean;
  as?: 'div' | 'button';
  type?: 'button' | 'submit';
  disabled?: boolean;
}

/**
 * Reusable pill-shaped row (`rounded-full`, `h-14`), label on the left, status or value on the right.
 * Does NOT apply nested backdrop-blur so it stays fast inside or outside cards.
 */
export function PillRow({
  label,
  value,
  leftSlot,
  rightSlot,
  dashed = false,
  as: Component = 'div',
  type = 'button',
  disabled,
  className = '',
  style,
  children,
  ...rest
}: PillRowProps) {
  const componentProps =
    Component === 'button' ? { type, disabled } : {};

  return (
    <Component
      {...componentProps}
      className={`w-full rounded-full min-h-[56px] h-14 px-5 flex items-center justify-between gap-3 border transition-colors duration-200 ${
        dashed ? 'border-dashed' : 'border-solid'
      } ${Component === 'button' ? 'cursor-pointer text-left select-none' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--rw-pill-bg)',
        borderColor: 'var(--rw-pill-border)',
        color: 'var(--rw-text-primary)',
        ...style,
      }}
      {...rest}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="flex items-center gap-2.5 min-w-0">
            {leftSlot}
            {label !== undefined && (
              <span
                className="text-xs sm:text-sm font-semibold truncate"
                style={{ color: 'var(--rw-text-secondary)' }}
              >
                {label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {value !== undefined && (
              <span
                className="text-sm sm:text-base font-bold tabular-nums"
                style={{ color: 'var(--rw-text-primary)' }}
              >
                {value}
              </span>
            )}
            {rightSlot}
          </div>
        </>
      )}
    </Component>
  );
}

// ─── 3. TabPills ─────────────────────────────────────────────────────────────

export interface TabPillItem<T extends string = string> {
  id: T;
  label: string;
}

export interface TabPillsProps<T extends string = string> {
  tabs: TabPillItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
  sticky?: boolean;
}

/**
 * Sticky pill tab switcher matching the Cockpit/Crew/Captain/Arena preview control bar:
 * `rounded-full` track, active tab = red pill with glow, small `‹` `›` arrows when overflowing or cycling.
 */
export function TabPills<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Section tabs',
  className = '',
  sticky = true,
}: TabPillsProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setHasOverflow(el.scrollWidth > el.clientWidth + 4);
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow, tabs.length]);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab)
  );

  const handlePrev = () => {
    const prevIdx = (activeIndex - 1 + tabs.length) % tabs.length;
    onChange(tabs[prevIdx].id);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % tabs.length;
    onChange(tabs[nextIdx].id);
  };

  return (
    <div
      className={`${
        sticky ? 'sticky top-[72px] sm:top-[80px] z-30 py-1.5' : ''
      } flex justify-center w-full ${className}`}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1 p-1.5 rounded-full border backdrop-blur-xl max-w-full"
        style={{
          backgroundColor: 'var(--rw-tab-track-bg)',
          borderColor: 'var(--rw-tab-track-border)',
          boxShadow: 'var(--rw-card-shadow)',
        }}
      >
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous tab"
          className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 ${
            hasOverflow ? 'inline-flex' : 'inline-flex'
          }`}
          style={{ color: 'var(--rw-tab-inactive-text)' }}
          title="Previous tab"
        >
          <ChevronLeft size={15} />
        </button>

        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                data-testid={`rewards-tab-${tab.id}`}
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className="h-9 min-h-[36px] px-3.5 sm:px-4 rounded-full text-xs sm:text-[13px] font-heading font-bold transition-all duration-200 cursor-pointer whitespace-nowrap select-none active:scale-95"
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--rw-accent)',
                        color: 'var(--rw-accent-text)',
                        boxShadow: 'var(--rw-btn-primary-shadow)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: 'var(--rw-tab-inactive-text)',
                      }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next tab"
          className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 ${
            hasOverflow ? 'inline-flex' : 'inline-flex'
          }`}
          style={{ color: 'var(--rw-tab-inactive-text)' }}
          title="Next tab"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── 4. KobanBadge ───────────────────────────────────────────────────────────

export interface KobanBadgeProps {
  amount: number | string;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg';
  iconSize?: number;
  className?: string;
}

/**
 * Reusable Koban amount pill reading `--rw-gold-bg`, `--rw-gold-border`, and `--rw-gold-text`.
 * In light mode uses deeper amber (#B97700 text on #FFF4D6 pill with #F5B301/40 border).
 */
export function KobanBadge({
  amount,
  prefix = '+',
  suffix = '',
  size = 'md',
  iconSize,
  className = '',
}: KobanBadgeProps) {
  const formatted =
    typeof amount === 'number' ? amount.toLocaleString() : amount;

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs gap-1'
      : size === 'lg'
      ? 'px-4 py-1.5 text-sm sm:text-base gap-2'
      : 'px-3 py-1 text-xs sm:text-sm gap-1.5';

  const resolvedIconSize =
    iconSize ?? (size === 'sm' ? 14 : size === 'lg' ? 18 : 15);

  return (
    <span
      className={`inline-flex items-center rounded-full border font-display font-black tabular-nums shrink-0 ${sizeClasses} ${className}`}
      style={{
        backgroundColor: 'var(--rw-gold-bg)',
        borderColor: 'var(--rw-gold-border)',
        color: 'var(--rw-gold-text)',
      }}
    >
      <KobanCoinSvg size={resolvedIconSize} />
      <span>
        {prefix}
        {formatted}
        {suffix ? ` ${suffix}` : ''}
      </span>
    </span>
  );
}
