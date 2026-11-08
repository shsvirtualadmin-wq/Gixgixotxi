import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { getHomeUrl } from '@/utils/homeUrl';
import { DashboardBottomNav } from '@/components/dashboard/DashboardBottomNav';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Interactive press + jelly wobble handlers for Crew buttons (.cw-btn).
 * Scales to 1.1 on press with cubic-bezier(.34,1.56,.64,1) and plays
 * the 0.6s jelly animation (1,1 -> 1.2,.84 -> .94,1.12 -> 1,1) on click.
 */
export function getCrewBtnHandlers(disabled?: boolean) {
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || prefersReducedMotion()) return;
      e.currentTarget.classList.remove('is-wobbling');
      e.currentTarget.classList.add('is-pressed');
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.classList.remove('is-pressed');
    },
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      el.classList.remove('is-pressed');
      if (disabled || prefersReducedMotion()) return;
      el.classList.remove('is-wobbling');
      void el.offsetWidth;
      el.classList.add('is-wobbling');
    },
    onAnimationEnd: (e: React.AnimationEvent<HTMLElement>) => {
      if (e.animationName === 'rw-jelly-wobble') {
        e.currentTarget.classList.remove('is-wobbling');
      }
    },
  };
}

/* ─── Gold Coin Mini SVG for Header Balance Chip ───────────────────────── */
export function CrewGoldCoinIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="#f5c542"
        stroke="#8a5a00"
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="9"
        width="6"
        height="6"
        rx="1.2"
        transform="rotate(45 12 12)"
        fill="#16161a"
      />
    </svg>
  );
}

/* ─── Sticky Glass Header Pill ─────────────────────────────────────────── */
export function CrewStickyHeader({
  showProChip = false,
}: {
  showProChip?: boolean;
}) {
  const { isDark, toggle: toggleTheme } = useTheme();
  const { balance: kobanBalance } = useWallet();
  const { user, profileLoading } = useAuth();
  const homeUrl = getHomeUrl(user, profileLoading);

  return (
    <header
      className="sticky z-40 w-full pointer-events-none select-none"
      style={{
        top: 'calc(10px + env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="cw-glass-heavy pointer-events-auto w-full h-14 sm:h-[60px] px-4 sm:px-5 rounded-full flex items-center justify-between gap-3">
          {/* Left: Boardly Logo in Doto (red-text) + conditional PRO chip */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to={homeUrl}
              {...getCrewBtnHandlers()}
              className="cw-btn !p-0 !bg-transparent !shadow-none cw-font-doto text-2xl sm:text-[26px] font-extrabold tracking-tight shrink-0"
              style={{ color: 'var(--cw-red-text)' }}
              aria-label="Boardly Home"
            >
              Boardly
            </Link>

            {showProChip && (
              <span className="cw-chip cw-chip-pro">PRO</span>
            )}
          </div>

          {/* Right: Gold Coin Balance Chip + Theme Toggle 42x42 Circle */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/store"
              {...getCrewBtnHandlers()}
              className="cw-btn !py-1.5 !px-3.5 cw-chip cw-chip-gold cw-font-doto text-xs sm:text-sm font-extrabold tabular-nums"
              title="Kobans Balance"
              aria-label={`${(kobanBalance || 0).toLocaleString()} Kobans`}
            >
              <CrewGoldCoinIcon size={15} />
              <span>{(kobanBalance || 0).toLocaleString()}</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              {...getCrewBtnHandlers()}
              className="cw-btn cw-icon-btn cw-btn-glass"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? (
                <Sun size={18} strokeWidth={2} />
              ) : (
                <Moon size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Interactive Stretching & Sliding Glass Pill Slider ───────────────── */
export interface CrewSliderOption<T extends string = string> {
  id: T;
  label: string;
}

export function CrewGlassSlider<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  trackVariant = 'card',
  className = '',
}: {
  options: CrewSliderOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
  trackVariant?: 'card' | 'card2';
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [metrics, setMetrics] = useState<{ x: number; width: number }>({
    x: 5,
    width: 0,
  });
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isWobbling, setIsWobbling] = useState(false);

  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startClientX: number;
    initialPillX: number;
    pillWidth: number;
    minX: number;
    maxX: number;
    moved: boolean;
    lastClientX: number;
    lastTime: number;
  }>({
    active: false,
    pointerId: null,
    startClientX: 0,
    initialPillX: 5,
    pillWidth: 0,
    minX: 5,
    maxX: 5,
    moved: false,
    lastClientX: 0,
    lastTime: 0,
  });

  const relaxTimerRef = useRef<number | null>(null);

  const measureOption = useCallback(
    (optionId: T) => {
      const trackEl = trackRef.current;
      const btnEl = btnRefs.current[optionId];
      if (!trackEl || !btnEl) return null;
      const trackRect = trackEl.getBoundingClientRect();
      const btnRect = btnEl.getBoundingClientRect();
      return {
        x: Math.round(btnRect.left - trackRect.left),
        width: Math.round(btnRect.width),
      };
    },
    []
  );

  const updateActiveMetrics = useCallback(() => {
    if (dragStateRef.current.active) return;
    const m = measureOption(value);
    if (m) {
      setMetrics(m);
    }
  }, [value, measureOption]);

  useLayoutEffect(() => {
    updateActiveMetrics();
  }, [updateActiveMetrics, options.length]);

  useEffect(() => {
    window.addEventListener('resize', updateActiveMetrics);
    return () => window.removeEventListener('resize', updateActiveMetrics);
  }, [updateActiveMetrics]);

  useEffect(() => {
    return () => {
      if (relaxTimerRef.current !== null) {
        window.clearTimeout(relaxTimerRef.current);
      }
    };
  }, []);

  const triggerWobble = useCallback(() => {
    if (prefersReducedMotion()) return;
    setIsWobbling(false);
    requestAnimationFrame(() => {
      setIsWobbling(true);
    });
  }, []);

  const resetStretchVars = useCallback(() => {
    const pill = pillRef.current;
    if (!pill) return;
    pill.style.setProperty('--cw-pill-sx', '1.25');
    pill.style.setProperty('--cw-pill-sy', '1.65');
  }, []);

  const findNearestOption = useCallback(
    (pillCenterX: number): T => {
      const trackEl = trackRef.current;
      if (!trackEl) return value;
      const trackRect = trackEl.getBoundingClientRect();
      let bestId = value;
      let bestDist = Infinity;

      for (const opt of options) {
        const btn = btnRefs.current[opt.id];
        if (!btn) continue;
        const rect = btn.getBoundingClientRect();
        const center = rect.left - trackRect.left + rect.width / 2;
        const dist = Math.abs(pillCenterX - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = opt.id;
        }
      }
      return bestId;
    },
    [options, value]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const trackEl = trackRef.current;
    if (!trackEl) return;

    const currentM = measureOption(value) || metrics;
    const trackWidth = trackEl.clientWidth;
    const minX = 5;
    const maxX = Math.max(minX, trackWidth - currentM.width - 5);

    const now = performance.now();
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      initialPillX: currentM.x,
      pillWidth: currentM.width,
      minX,
      maxX,
      moved: false,
      lastClientX: e.clientX,
      lastTime: now,
    };

    setIsWobbling(false);
    resetStretchVars();
    setIsPressed(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    const dx = e.clientX - ds.startClientX;
    if (Math.abs(dx) > 4) {
      ds.moved = true;
      if (!isDragging) setIsDragging(true);
    }

    if (ds.moved) {
      const now = performance.now();
      const dt = Math.max(8, now - ds.lastTime);
      const vx = Math.abs(e.clientX - ds.lastClientX) / dt;
      ds.lastClientX = e.clientX;
      ds.lastTime = now;

      if (!prefersReducedMotion() && pillRef.current) {
        const extraX = Math.min(0.22, vx * 0.12);
        const sx = (1.25 + extraX).toFixed(3);
        const sy = (1.65 - extraX * 0.5).toFixed(3);
        pillRef.current.style.setProperty('--cw-pill-sx', sx);
        pillRef.current.style.setProperty('--cw-pill-sy', sy);

        if (relaxTimerRef.current !== null) {
          window.clearTimeout(relaxTimerRef.current);
        }
        relaxTimerRef.current = window.setTimeout(() => {
          resetStretchVars();
        }, 90);
      }

      const clampedX = Math.min(ds.maxX, Math.max(ds.minX, ds.initialPillX + dx));
      setMetrics({ x: clampedX, width: ds.pillWidth });
    }
  };

  const finishInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;

    ds.active = false;
    ds.pointerId = null;

    if (relaxTimerRef.current !== null) {
      window.clearTimeout(relaxTimerRef.current);
      relaxTimerRef.current = null;
    }

    setIsPressed(false);
    setIsDragging(false);
    resetStretchVars();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    const trackEl = trackRef.current;
    let targetId = value;

    if (ds.moved) {
      const dx = e.clientX - ds.startClientX;
      const finalX = Math.min(ds.maxX, Math.max(ds.minX, ds.initialPillX + dx));
      const centerX = finalX + ds.pillWidth / 2;
      targetId = findNearestOption(centerX);
    } else if (trackEl) {
      const trackRect = trackEl.getBoundingClientRect();
      const clickX = e.clientX - trackRect.left;
      targetId = findNearestOption(clickX);
    }

    const targetMetrics = measureOption(targetId);
    if (targetMetrics) {
      setMetrics(targetMetrics);
    }

    if (targetId !== value) {
      onChange(targetId);
    }
    triggerWobble();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const nextIdx = (idx + dir + options.length) % options.length;
      const nextOpt = options[nextIdx];
      onChange(nextOpt.id);
      triggerWobble();
      btnRefs.current[nextOpt.id]?.focus();
    }
  };

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishInteraction}
      onPointerCancel={finishInteraction}
      className={`cw-slider-track ${
        trackVariant === 'card2' ? 'cw-slider-track-card2' : ''
      } ${className}`}
    >
      {/* Sliding & stretching glass pill behind selected option */}
      <div
        ref={pillRef}
        aria-hidden="true"
        onAnimationEnd={() => setIsWobbling(false)}
        className={`cw-slider-pill ${isDragging ? 'is-dragging' : ''} ${
          isPressed ? 'is-pressed' : ''
        } ${isWobbling ? 'is-wobbling' : ''}`}
        style={{
          width: metrics.width > 0 ? `${metrics.width}px` : `${100 / options.length}%`,
          translate: `${metrics.x}px 0`,
        }}
      />

      {options.map((opt, idx) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              btnRefs.current[opt.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onClick={() => {
              if (opt.id !== value) {
                onChange(opt.id);
                triggerWobble();
              }
            }}
            className="relative z-10 flex-1 min-w-0 py-2 px-3 rounded-full text-center text-xs sm:text-[13px] font-bold transition-colors duration-150 cursor-pointer truncate"
            style={{
              color: selected ? 'var(--cw-text)' : 'var(--cw-muted)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Unified Student Dashboard Bottom Dock ────────────────────────────── */
export function CrewBottomDock() {
  return <DashboardBottomNav />;
}
