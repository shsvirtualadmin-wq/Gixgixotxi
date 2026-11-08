import React, { useRef, useState, useEffect, useCallback } from 'react';

function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── Tap Ripple + Jelly Button Animation Helper ─────────────────────────────

function spawnTapRipple(el: HTMLElement, clientX?: number, clientY?: number) {
  if (isReducedMotionPreferred()) return;
  const rect = el.getBoundingClientRect();
  const x =
    typeof clientX === 'number' && clientX > 0
      ? clientX - rect.left
      : rect.width / 2;
  const y =
    typeof clientY === 'number' && clientY > 0
      ? clientY - rect.top
      : rect.height / 2;

  const ripple = document.createElement('span');
  ripple.className = 'rw-tap-ripple';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.addEventListener(
    'animationend',
    () => {
      ripple.remove();
    },
    { once: true }
  );
  el.appendChild(ripple);
}

export function getJellyHandlers(disabled = false) {
  const triggerWobble = (el: HTMLElement) => {
    el.classList.remove('is-pressed');
    if (isReducedMotionPreferred()) return;
    el.classList.remove('is-wobbling');
    void el.offsetWidth;
    el.classList.add('is-wobbling');
  };

  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || e.button !== 0) return;
      const el = e.currentTarget;
      if (el.matches(':disabled, [aria-disabled="true"]')) return;
      el.classList.remove('is-wobbling');
      el.classList.add('is-pressed');
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      if (disabled) return;
      const el = e.currentTarget;
      if (el.matches(':disabled, [aria-disabled="true"]')) return;
      el.classList.remove('is-pressed');
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      const el = e.currentTarget;
      if (el.matches(':disabled, [aria-disabled="true"]')) return;
      spawnTapRipple(el, e.clientX, e.clientY);
      triggerWobble(el);
    },
    onAnimationEnd: (e: React.AnimationEvent<HTMLElement>) => {
      if (e.animationName === 'rw-jelly-wobble') {
        e.currentTarget.classList.remove('is-wobbling');
      }
    },
  };
}

// ─── 14-Coin Web Animations API Burst ───────────────────────────────────────

export function spawnClaimCoinBurst(
  sourceEl: HTMLElement | null,
  targetEl: HTMLElement | null
) {
  if (
    typeof document === 'undefined' ||
    !sourceEl ||
    !targetEl ||
    isReducedMotionPreferred()
  ) {
    return;
  }

  const srcRect = sourceEl.getBoundingClientRect();
  const tgtRect = targetEl.getBoundingClientRect();

  const startX = srcRect.left + srcRect.width / 2;
  const startY = srcRect.top + srcRect.height / 2;
  const endX = tgtRect.left + Math.min(60, tgtRect.width / 2);
  const endY = tgtRect.top + tgtRect.height / 2;

  const coinCount = 14;

  for (let i = 0; i < coinCount; i++) {
    const coin = document.createElement('div');
    coin.setAttribute('aria-hidden', 'true');
    coin.style.position = 'fixed';
    coin.style.left = `${startX - 8}px`;
    coin.style.top = `${startY - 8}px`;
    coin.style.width = '16px';
    coin.style.height = '16px';
    coin.style.borderRadius = '9999px';
    coin.style.backgroundColor = 'var(--rw-amber-coin)';
    coin.style.boxShadow = 'inset 0 0 0 2px var(--rw-amber-coin-rim)';
    coin.style.pointerEvents = 'none';
    coin.style.zIndex = '9999';
    document.body.appendChild(coin);

    const angle = (Math.PI * 2 * i) / coinCount + (Math.random() - 0.5) * 0.45;
    const radius = 36 + Math.random() * 54;
    const burstDx = Math.cos(angle) * radius;
    const burstDy = Math.sin(angle) * radius - 14;
    const finalDx = endX - startX;
    const finalDy = endY - startY;

    if (typeof coin.animate === 'function') {
      const anim = coin.animate(
        [
          {
            transform: 'translate(0px, 0px) scale(0.5)',
            opacity: 1,
          },
          {
            transform: `translate(${burstDx.toFixed(1)}px, ${burstDy.toFixed(1)}px) scale(1.15)`,
            opacity: 1,
            offset: 0.34,
          },
          {
            transform: `translate(${finalDx.toFixed(1)}px, ${finalDy.toFixed(1)}px) scale(0.55)`,
            opacity: 0.15,
          },
        ],
        {
          duration: 740,
          delay: i * 20,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        }
      );
      anim.onfinish = () => {
        coin.remove();
      };
    } else {
      setTimeout(() => coin.remove(), 800);
    }
  }
}

// ─── Pure SVG Icons ──────────────────────────────────────────────────────────

export function KobanCoinSvg({
  size = 18,
  amber = false,
  className = '',
}: {
  size?: number;
  amber?: boolean;
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
      <circle
        cx="12"
        cy="12"
        r="10"
        style={{
          fill: amber ? 'var(--rw-amber-coin)' : 'var(--rw-gold)',
          stroke: amber ? 'var(--rw-amber-coin-rim)' : 'var(--rw-card)',
        }}
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="6.5"
        style={{ stroke: 'var(--rw-card)' }}
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />
      <rect
        x="9.5"
        y="9.5"
        width="5"
        height="5"
        rx="1"
        style={{ fill: 'var(--rw-card)' }}
      />
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
        style={{
          fill: grand ? 'var(--rw-red)' : 'var(--rw-card)',
          stroke: 'var(--rw-gold)',
        }}
        strokeWidth="1.75"
      />
      <path
        d="M3 11C3 7.5 6.5 5 14 5C21.5 5 25 7.5 25 11H3Z"
        style={{
          fill: grand ? 'var(--rw-red)' : 'var(--rw-gold)',
          stroke: 'var(--rw-gold)',
        }}
        strokeWidth="1.75"
      />
      <rect
        x="11.5"
        y="9.5"
        width="5"
        height="6"
        rx="1.2"
        style={{
          fill: 'var(--rw-gold)',
          stroke: 'var(--rw-card)',
        }}
        strokeWidth="1.2"
      />
      <circle cx="14" cy="12.5" r="1" style={{ fill: 'var(--rw-card)' }} />
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
        style={{
          fill: 'var(--rw-bg)',
          stroke: 'var(--rw-red)',
        }}
        strokeWidth="1.5"
      />
      <path
        d="M9 21C10.5 16.5 13 14 16.5 13.5C15 11.5 12.5 10.5 10.5 11C12.5 8 16.8 7.5 20.2 9.8C22.8 11.5 24 14.8 22.8 18.2C21.6 21.5 18.2 23.5 14.5 23.2C16.8 21.8 18.2 19.6 18 17.5C15.5 18.5 12.2 19.8 9 21Z"
        style={{ fill: 'var(--rw-red)' }}
      />
      <circle cx="18.5" cy="11.5" r="1.2" style={{ fill: 'var(--rw-gold)' }} />
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

export function GlassCard({
  as: Component = 'div',
  variant = 'default',
  className = '',
  style,
  children,
  ...rest
}: GlassCardProps) {
  const isZenryu = variant === 'zenryu';

  return (
    <Component
      className={`rounded-[26px] sm:rounded-[28px] border transition-colors duration-150 ${className}`}
      style={{
        backgroundColor: 'var(--rw-card)',
        borderColor: isZenryu ? 'var(--rw-red)' : 'var(--rw-border)',
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
  jellyVariant?: 'default' | 'faq' | 'none';
}

export function PillRow({
  label,
  value,
  leftSlot,
  rightSlot,
  dashed = false,
  as: Component = 'div',
  type = 'button',
  disabled,
  jellyVariant = 'none',
  className = '',
  style,
  children,
  ...rest
}: PillRowProps) {
  const isButton = Component === 'button';
  const resolvedVariant =
    jellyVariant !== 'none' ? jellyVariant : isButton ? 'faq' : 'none';
  const jellyClass =
    resolvedVariant === 'faq'
      ? 'rw-jelly-faq'
      : resolvedVariant === 'default'
      ? 'rw-jelly-btn'
      : '';
  const jellyHandlers =
    resolvedVariant !== 'none' ? getJellyHandlers(Boolean(disabled)) : {};

  return (
    <Component
      {...(isButton ? { type, disabled } : {})}
      {...jellyHandlers}
      className={`w-full rounded-full min-h-[54px] px-5 py-3 flex items-center justify-between gap-3 border ${
        dashed ? 'border-dashed' : 'border-solid'
      } ${
        isButton
          ? 'cursor-pointer text-left select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]'
          : ''
      } ${jellyClass} ${className}`}
      style={{
        backgroundColor: 'var(--rw-card)',
        borderColor: 'var(--rw-border)',
        color: 'var(--rw-text)',
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
                style={{ color: 'var(--rw-muted)' }}
              >
                {label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {value !== undefined && (
              <span
                className="text-sm sm:text-base font-bold tabular-nums"
                style={{ color: 'var(--rw-text)' }}
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

// ─── 3. Liquid Glass Tab Switcher (TabPills) ─────────────────────────────────

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
}

/**
 * Liquid Glass Tab Switcher:
 * - Indicator pill at z-index 3 (`pointer-events: none`), tab labels at z-index 4.
 * - Nearly clear glass (`rgba(255,255,255,.05)` dark, `rgba(255,255,255,.12)` light),
 *   `backdrop-filter: blur(2px) saturate(1.5)`, edge highlights + soft drop shadow.
 * - Press and hold: scales to `1.45` wide by `1.9` tall so it pops out of the tab bar's borders,
 *   with a lifted drop shadow (`0 22px 36px -10px`).
 * - Drag left/right (`setPointerCapture`, `touch-action: pan-y`): follows finger with short lag
 *   (`translate .14s ease-out`), stretches wider (`+0.3` max to scaleX) and flatter (`-0.15` to scaleY)
 *   proportional to finger velocity, relaxing back after ~90ms without movement.
 * - On release: shrinks back, snaps to nearest tab, updates hash, and plays jelly wobble (`0.6s`).
 */
export function TabPills<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Section tabs',
  className = '',
}: TabPillsProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const relaxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab)
  );

  const [tabMetrics, setTabMetrics] = useState<
    { left: number; width: number; height: number; top: number }[]
  >([]);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const [dragNearestIdx, setDragNearestIdx] = useState<number | null>(null);
  const [isWobbling, setIsWobbling] = useState(false);
  const [stretchDeltaX, setStretchDeltaX] = useState(0);

  const pointerStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    lastX: number;
    lastTime: number;
    hasMoved: boolean;
    nearestIdx: number;
    handledTimestamp: number;
  }>({
    pointerId: null,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    hasMoved: false,
    nearestIdx: activeIndex,
    handledTimestamp: 0,
  });

  const measureTabs = useCallback(() => {
    const metrics = tabs.map((_, idx) => {
      const btn = tabRefs.current[idx];
      if (!btn) return { left: 0, width: 0, height: 40, top: 6 };
      return {
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        height: btn.offsetHeight,
        top: btn.offsetTop,
      };
    });
    setTabMetrics(metrics);
  }, [tabs]);

  useEffect(() => {
    measureTabs();
    const ro = new ResizeObserver(measureTabs);
    if (trackRef.current) {
      ro.observe(trackRef.current);
    }
    window.addEventListener('resize', measureTabs);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureTabs);
      if (relaxTimerRef.current) clearTimeout(relaxTimerRef.current);
    };
  }, [measureTabs]);

  const triggerIndicatorWobble = useCallback(() => {
    if (isReducedMotionPreferred()) return;
    setIsWobbling(false);
    const ind = indicatorRef.current;
    if (ind) {
      ind.classList.remove('is-wobbling');
      void ind.offsetWidth;
    }
    requestAnimationFrame(() => {
      setIsWobbling(true);
    });
  }, []);

  const getNearestTabFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || tabMetrics.length === 0) {
        return { clampedX: 0, nearestIdx: activeIndex };
      }
      const rect = track.getBoundingClientRect();
      const relX = clientX - rect.left;
      const first = tabMetrics[0];
      const last = tabMetrics[tabMetrics.length - 1];
      const indWidth = first?.width || rect.width / tabs.length;

      const minLeft = first ? first.left : 6;
      const maxLeft = last ? last.left : Math.max(6, rect.width - indWidth - 6);

      const rawLeft = relX - indWidth / 2;
      const clampedX = Math.max(minLeft, Math.min(maxLeft, rawLeft));
      const indCenter = clampedX + indWidth / 2;

      let bestIdx = 0;
      let bestDist = Infinity;
      tabMetrics.forEach((m, i) => {
        const center = m.left + m.width / 2;
        const dist = Math.abs(indCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      return { clampedX, nearestIdx: bestIdx };
    },
    [tabMetrics, activeIndex, tabs.length]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;

    try {
      track.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if synthetic event lacks active pointerId
    }

    const now = performance.now();
    const { nearestIdx } = getNearestTabFromClientX(e.clientX);
    pointerStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastTime: now,
      hasMoved: false,
      nearestIdx,
      handledTimestamp: Date.now(),
    };

    if (relaxTimerRef.current) clearTimeout(relaxTimerRef.current);
    setStretchDeltaX(0);
    setIsWobbling(false);
    setIsPressed(true);
    setIsDragging(false);
    setDragNearestIdx(nearestIdx);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStateRef.current.pointerId !== e.pointerId) return;
    const now = performance.now();
    const dt = Math.max(8, now - pointerStateRef.current.lastTime);
    const stepDx = Math.abs(e.clientX - pointerStateRef.current.lastX);
    const totalDx = Math.abs(e.clientX - pointerStateRef.current.startX);

    pointerStateRef.current.lastX = e.clientX;
    pointerStateRef.current.lastTime = now;

    const { clampedX, nearestIdx } = getNearestTabFromClientX(e.clientX);

    if (totalDx > 2 || pointerStateRef.current.hasMoved) {
      pointerStateRef.current.hasMoved = true;
      setIsDragging(true);
      setDragX(clampedX);

      // Velocity in px/ms -> map up to +0.3 extra scaleX
      const velocity = stepDx / dt;
      const addedStretch = Math.min(0.3, velocity * 0.14);
      setStretchDeltaX(addedStretch);

      if (relaxTimerRef.current) clearTimeout(relaxTimerRef.current);
      relaxTimerRef.current = setTimeout(() => {
        setStretchDeltaX(0);
      }, 90);
    }

    pointerStateRef.current.nearestIdx = nearestIdx;
    setDragNearestIdx(nearestIdx);
  };

  const finishPointerInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStateRef.current.pointerId !== e.pointerId) return;
    const track = trackRef.current;
    if (track) {
      try {
        if (track.hasPointerCapture(e.pointerId)) {
          track.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
    }

    if (relaxTimerRef.current) clearTimeout(relaxTimerRef.current);

    const targetIdx = pointerStateRef.current.nearestIdx;
    pointerStateRef.current.pointerId = null;
    pointerStateRef.current.handledTimestamp = Date.now();

    setStretchDeltaX(0);
    setIsPressed(false);
    setIsDragging(false);
    setDragX(null);
    setDragNearestIdx(null);

    const targetTab = tabs[targetIdx];
    if (targetTab) {
      onChange(targetTab.id);
    }
    triggerIndicatorWobble();
  };

  const handleTabClick = (idx: number) => {
    if (Date.now() - pointerStateRef.current.handledTimestamp < 250) {
      return;
    }
    const targetTab = tabs[idx];
    if (targetTab) {
      onChange(targetTab.id);
      triggerIndicatorWobble();
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = tabs.length - 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pointerStateRef.current.handledTimestamp = Date.now();
      onChange(tabs[idx].id);
      triggerIndicatorWobble();
      return;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      pointerStateRef.current.handledTimestamp = Date.now();
      const targetTab = tabs[nextIdx];
      onChange(targetTab.id);
      triggerIndicatorWobble();
      tabRefs.current[nextIdx]?.focus();
    }
  };

  const currentMetric = tabMetrics[activeIndex];
  const indicatorTranslateX =
    dragX !== null ? dragX : currentMetric ? currentMetric.left : 6;
  const indicatorWidth = currentMetric ? currentMetric.width : undefined;
  const indicatorHeight = currentMetric ? currentMetric.height : 40;
  const indicatorTop = currentMetric ? currentMetric.top : 6;

  const highlightedIdx = dragNearestIdx !== null ? dragNearestIdx : activeIndex;

  const pressedScaleX = (1.45 + stretchDeltaX).toFixed(3);
  const pressedScaleY = (1.9 - stretchDeltaX * 0.5).toFixed(3);

  return (
    <div className={`w-full flex justify-center overflow-visible py-3 ${className}`}>
      <div
        ref={trackRef}
        role="tablist"
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerInteraction}
        onPointerCancel={finishPointerInteraction}
        className="relative grid grid-cols-4 items-center w-full p-1.5 rounded-full border select-none overflow-visible"
        style={{
          backgroundColor: 'var(--rw-card)',
          borderColor: 'var(--rw-border)',
          touchAction: 'pan-y',
          overflow: 'visible',
        }}
      >
        {/* Liquid Glass Indicator Pill (z-index 3, pointer-events: none) */}
        <div
          ref={indicatorRef}
          data-testid="rewards-tab-indicator"
          aria-hidden="true"
          onAnimationEnd={(e) => {
            if (e.animationName === 'rw-jelly-wobble') {
              setIsWobbling(false);
            }
          }}
          className={`rw-tab-indicator absolute left-0 rounded-full ${
            isPressed ? 'is-pressed' : ''
          } ${isDragging ? 'is-dragging' : ''} ${isWobbling ? 'is-wobbling' : ''}`}
          style={
            {
              zIndex: 3,
              pointerEvents: 'none',
              top: `${indicatorTop}px`,
              width: indicatorWidth
                ? `${indicatorWidth}px`
                : `calc((100% - 12px) / ${tabs.length})`,
              height: `${indicatorHeight}px`,
              translate: `${indicatorTranslateX}px 0px`,
              '--rw-ind-scale-x': pressedScaleX,
              '--rw-ind-scale-y': pressedScaleY,
            } as React.CSSProperties
          }
        />

        {/* Tab Labels (z-index 4 so they stay sharp above the glass pill) */}
        {tabs.map((tab, idx) => {
          const isSelected = tab.id === activeTab;
          const isHighlighted = idx === highlightedIdx;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              data-testid={`rewards-tab-${tab.id}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleTabClick(idx)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className="relative h-10 min-h-[40px] px-2 sm:px-4 rounded-full text-xs sm:text-sm font-heading font-bold transition-colors duration-150 cursor-pointer whitespace-nowrap select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rw-red)]"
              style={{
                zIndex: 4,
                color: isHighlighted ? 'var(--rw-text)' : 'var(--rw-muted)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
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
      className={`inline-flex items-center rounded-full border font-dot font-extrabold tabular-nums shrink-0 ${sizeClasses} ${className}`}
      style={{
        backgroundColor: 'var(--rw-bg)',
        borderColor: 'var(--rw-gold)',
        color: 'var(--rw-gold)',
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
