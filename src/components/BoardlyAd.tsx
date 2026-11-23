import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import {
  StudentIllustration,
  getStudentImageSrc,
  preloadAndDecodeStudentImage,
  type StudentIllustrationId,
} from '@/components/ads/StudentIllustration';
import {
  BOARDLY_AD_ACCENTS,
  claimRotatingCatalogAd,
  dismissAdForSession,
  getPosterSlides,
  getStripHeadlines,
  releaseRotatingCatalogClaim,
  subscribeDismissedAds,
  type BoardlyAdAccent,
  type BoardlyCatalogAd,
} from '@/config/boardlyAdsCatalog';
import { useBoardlyAdVisibility } from '@/hooks/useBoardlyAdVisibility';
import { useShowAds } from '@/hooks/useShowAds';

export type BoardlyAdVariant = 'card' | 'banner' | 'popup' | 'inline' | 'strip' | 'poster';

export interface BoardlyAdSecondaryAction {
  label: string;
  onClick: () => void;
}

export interface BoardlyAdProps {
  /** Layout variant for cards, banners, popups, inline slots, top yellow strip, or large hero poster carousel */
  variant?: BoardlyAdVariant;
  /** Color gradient variant (purple-pink default, indigo-blue, magenta-orange, teal-purple) */
  accent?: BoardlyAdAccent;
  /** Student illustration character rendered inside the ad */
  illustrationId?: StudentIllustrationId;
  /** Optional real student photo URL (drops cleanly into the illustration frame if supplied later) */
  imageUrl?: string | null;
  /** Yellow uppercase chip shown above the headline (e.g. "EARLY OFFER", "STUDY CREW") */
  chip?: string;
  /** Big bold headline (optional for strip/poster when slides are provided) */
  headline?: string;
  /** One short supporting line */
  description?: string;
  /** Primary white pill button label */
  ctaLabel?: string;
  /** Internal path ("/pricing") or external URL ("https://...") */
  href?: string;
  /** Click handler when the CTA triggers an in-app action instead of a link */
  onAction?: () => void;
  /** Optional secondary ghost-white action (used by popups/banners that already offer a 2nd option) */
  secondaryAction?: BoardlyAdSecondaryAction;
  /** Real end date (YYYY-MM-DD or ISO string) from config. Countdown ONLY renders when valid & in the future. */
  endDate?: string | null;
  /** Real data-backed social proof line. Omitted completely unless provided from real app data. */
  socialProof?: string | null;
  /** Optional concise real benefit bullets (used in upgrade popups like AI Mentor or PDF Export) */
  highlights?: string[];
  /** Optional real metadata note (e.g. live plan pricing or real PKT midnight reset countdown) */
  metaNote?: string;
  /** Optional extra note shown below the CTA (e.g. admin bypass button) */
  footerSlot?: React.ReactNode;
  /** Optional seal badge label on poster slides */
  posterSeal?: string;
  /** Rotating slides for `poster` and `strip` variants */
  slides?: BoardlyCatalogAd[];
  /** Active promo end date (only shown on slides with `requiresPromoActive`) */
  promoEndDate?: string | null;
  /** Callback when a specific slide in poster carousel is dismissed for the session */
  onSlideDismiss?: (adId: string) => void;
  /** Custom explanation inside the top-right info popover */
  infoText?: string;
  /** Whether the top-right dismiss X button is shown (default true) */
  dismissible?: boolean;
  /** Callback invoked when the user taps the top-right dismiss X button */
  onDismiss?: () => void;
  /** Preview mode inside /admin/ads phone preview */
  isPreview?: boolean;
  /** Optional impression/tracking data attributes */
  slotId?: string;
  offerId?: string;
  /** Optional ref for IntersectionObserver impression tracking */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** Extra Tailwind classes on the outermost wrapper */
  className?: string;
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function parseEndDateMs(raw?: string | null): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T23:59:59.999Z` : trimmed;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function computeCountdown(targetMs: number | null, nowMs: number): CountdownParts | null {
  if (!targetMs) return null;
  const diff = targetMs - nowMs;
  if (diff <= 0) return null;
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds };
}

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0');
}

const DEFAULT_INFO_TEXT =
  'This is a Boardly promotion. Boardly Pro and Plus members can hide ads anytime from Settings.';

const TOP_STRIP_DISMISSED_KEY = 'boardly_top_strip_dismissed_v1';
const POSTER_AUTOPLAY_MS = 5000;

/**
 * Isolated memoized 1-second countdown component so ticking seconds NEVER re-render
 * parent ad cards, carousels, or student illustrations. Automatically pauses when
 * offscreen (`active === false`) or when the browser tab is hidden.
 */
const AdCountdownGrid = memo(function AdCountdownGrid({
  targetEndMs,
  variant,
  active = true,
}: {
  targetEndMs: number | null;
  variant: 'poster' | 'card';
  active?: boolean;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !targetEndMs || targetEndMs <= Date.now()) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setNowMs(Date.now());
    }, 1000);
    const onVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        setNowMs(Date.now());
      }
    };
    document.addEventListener('visibilitychange', onVisibility, { passive: true });
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [targetEndMs, active]);

  const countdown = useMemo(() => computeCountdown(targetEndMs, nowMs), [targetEndMs, nowMs]);
  if (!countdown) return null;

  const units = [
    { label: 'Days', value: pad2(countdown.days) },
    { label: 'Hrs', value: pad2(countdown.hours) },
    { label: 'Min', value: pad2(countdown.minutes) },
    { label: 'Sec', value: pad2(countdown.seconds) },
  ];

  if (variant === 'poster') {
    return (
      <div
        className="grid grid-cols-4 gap-1.5 w-full max-w-[260px] pt-0.5"
        aria-label={`Offer ends in ${countdown.days} days ${countdown.hours} hours`}
      >
        {units.map((u) => (
          <div
            key={u.label}
            className="rounded-[8px] border border-white/30 bg-black/20 px-1.5 py-1 text-center"
          >
            <div
              className="text-sm font-extrabold tabular-nums text-white leading-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {u.value}
            </div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80 leading-none">
              {u.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-4 gap-1.5 sm:gap-2 max-w-[300px]"
      aria-label={`Offer ends in ${countdown.days} days ${countdown.hours} hours ${countdown.minutes} minutes`}
    >
      {units.map((unit) => (
        <div
          key={unit.label}
          className="rounded-[8px] border border-white/25 bg-white/12 px-1.5 py-1.5 text-center"
        >
          <div
            className="text-sm sm:text-base font-extrabold tabular-nums text-white leading-none"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {unit.value}
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/80 leading-none">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Top yellow scrolling announcement strip (`variant="strip"`).
 * - Memoized + portaled to document.body on its own GPU compositor layer so scrolling never
 *   triggers re-renders, paint invalidation, or animation restarts.
 * - Pure CSS `translate3d(0,0,0) -> translate3d(-50%,0,0)` linear infinite loop.
 * - Automatically reserves 36px at top via `--boardly-top-strip-h` CSS variable so the
 *   floating navbar and hero content never overlap or jump when dismissed.
 */
const TopAnnouncementStrip = memo(function TopAnnouncementStrip({
  slides,
  infoText,
  dismissible,
  onDismiss,
  onLoopComplete,
  slotId,
  isPreview,
  className,
}: {
  slides: BoardlyCatalogAd[];
  infoText: string;
  dismissible: boolean;
  onDismiss?: () => void;
  onLoopComplete?: () => void;
  slotId?: string;
  isPreview?: boolean;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (isPreview || typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(TOP_STRIP_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [infoOpen, setInfoOpen] = useState(false);

  const visible = !dismissed && slides.length > 0;

  useEffect(() => {
    if (isPreview || typeof document === 'undefined') return;
    const root = document.documentElement;
    if (visible) {
      root.style.setProperty('--boardly-top-strip-h', '36px');
    } else {
      root.style.setProperty('--boardly-top-strip-h', '0px');
    }
    return () => {
      root.style.setProperty('--boardly-top-strip-h', '0px');
    };
  }, [visible, isPreview]);

  const marqueeItems = useMemo(() => [...slides, ...slides], [slides]);

  const handleClose = useCallback(() => {
    setInfoOpen(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(TOP_STRIP_DISMISSED_KEY, '1');
    } catch {
      // Ignore storage errors
    }
    onDismiss?.();
  }, [onDismiss]);

  if (!visible) return null;

  const stripElement = (
    <div
      role="region"
      aria-label="Boardly announcement advertisement"
      data-boardly-ad="true"
      data-boardly-variant="strip"
      data-boardly-slot={slotId || 'top_strip'}
      className={`boardly-strip-shell ${
        isPreview ? 'relative' : 'fixed left-0 right-0 z-[1010]'
      } w-full h-[36px] bg-[#ffd23f] text-[#1a0b2e] border-b border-black/15 shadow-[0_1px_6px_rgba(26,11,46,0.14)] select-none ${
        className || ''
      }`}
      style={isPreview ? undefined : { top: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="h-full w-full flex items-center gap-2 px-2 sm:px-3 overflow-hidden">
        {/* Left pinned "Ad" badge */}
        <span
          className="inline-flex items-center rounded-full border border-[#1a0b2e]/45 bg-[#1a0b2e]/10 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-[#1a0b2e] leading-none shrink-0"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Ad
        </span>

        {/* Scrolling headlines ticker (isolated GPU compositor layer) */}
        <div className="boardly-strip-viewport relative flex-1 min-w-0 h-full flex items-center">
          <div
            className="boardly-strip-track flex items-center whitespace-nowrap"
            onAnimationIteration={onLoopComplete}
          >
            {marqueeItems.map((item, idx) => (
              <span
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2.5 pr-8 sm:pr-10 text-[11.5px] sm:text-[12px] font-bold text-[#1a0b2e]"
              >
                <span>{item.shortHeadline || item.headline}</span>
                {isPreview ? (
                  <span className="inline-flex items-center rounded-full bg-[#5b14b8] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white leading-none">
                    CLICK HERE
                  </span>
                ) : (
                  <Link
                    to={item.link}
                    className="inline-flex items-center rounded-full bg-[#5b14b8] hover:bg-[#460d92] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white leading-none no-underline transition-colors"
                  >
                    CLICK HERE
                  </Link>
                )}
                <span aria-hidden="true" className="text-[#1a0b2e]/35 font-black">
                  •
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Right pinned info & dismiss controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setInfoOpen((prev) => !prev)}
            aria-label="About this ad"
            aria-expanded={infoOpen}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#1a0b2e]/80 hover:bg-black/10 hover:text-[#1a0b2e] transition-colors cursor-pointer"
            title="About this ad"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          {dismissible && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Dismiss announcement strip"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#1a0b2e]/80 hover:bg-black/10 hover:text-[#1a0b2e] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Info popover below strip */}
      {infoOpen && (
        <div
          role="note"
          className="absolute right-2 top-[38px] z-[1020] w-[min(320px,calc(100vw-16px))] rounded-[12px] border border-white/25 bg-[#1c0933] px-3 py-2.5 text-[11.5px] leading-snug text-white shadow-xl flex items-start justify-between gap-2"
        >
          <span>{infoText}</span>
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            aria-label="Close ad info"
            className="shrink-0 rounded-full p-0.5 text-white/80 hover:text-white cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );

  if (!isPreview && typeof document !== 'undefined' && document.body) {
    return createPortal(stripElement, document.body);
  }

  return stripElement;
});

/**
 * Large festive hero poster carousel (`variant="poster"`).
 * 4–5 rotating slides, auto-rotates every 5s, touch swipe on mobile, dots at bottom,
 * bunting flags, confetti accents, light rays, circular seal badge, and zero layout shift.
 */
const HeroPosterCarousel = memo(function HeroPosterCarousel({
  slides,
  promoEndDate,
  infoText,
  dismissible,
  onSlideDismiss,
  onDismiss,
  slotId,
  isPreview,
  className,
}: {
  slides: BoardlyCatalogAd[];
  promoEndDate?: string | null;
  infoText: string;
  dismissible: boolean;
  onSlideDismiss?: (adId: string) => void;
  onDismiss?: () => void;
  slotId?: string;
  isPreview?: boolean;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inViewport, setInViewport] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [localDismissedIds, setLocalDismissedIds] = useState<string[]>([]);
  const posterRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPreview) return;
    const el = posterRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        setInViewport(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isPreview]);

  const visibleSlides = useMemo(
    () => slides.filter((s) => !localDismissedIds.includes(s.id)),
    [slides, localDismissedIds]
  );

  // Clamp index cleanly if a slide is dismissed
  const safeIndex = visibleSlides.length > 0 ? activeIndex % visibleSlides.length : 0;
  const activeSlide = visibleSlides[safeIndex] || null;

  const promoTargetEndMs = useMemo(() => parseEndDateMs(promoEndDate), [promoEndDate]);

  const goNext = useCallback(() => {
    if (visibleSlides.length <= 1) return;
    setInfoOpen(false);
    setActiveIndex((prev) => (prev + 1) % visibleSlides.length);
  }, [visibleSlides.length]);

  const goPrev = useCallback(() => {
    if (visibleSlides.length <= 1) return;
    setInfoOpen(false);
    setActiveIndex((prev) => (prev - 1 + visibleSlides.length) % visibleSlides.length);
  }, [visibleSlides.length]);

  // Preload slide 0 with high priority (<link rel="preload">) and decode the next 1–2 slides ahead of rotation
  useEffect(() => {
    if (visibleSlides.length === 0) return;
    const firstSlide = visibleSlides[0];
    if (firstSlide) {
      void preloadAndDecodeStudentImage(
        getStudentImageSrc(firstSlide.illustrationId, firstSlide.imageUrl),
        true
      );
    }
    const len = visibleSlides.length;
    const upcomingOffsets = len > 2 ? [1, 2] : len > 1 ? [1] : [];
    for (const offset of upcomingOffsets) {
      const nextSlide = visibleSlides[(safeIndex + offset) % len];
      if (nextSlide) {
        void preloadAndDecodeStudentImage(
          getStudentImageSrc(nextSlide.illustrationId, nextSlide.imageUrl),
          false
        );
      }
    }
  }, [visibleSlides, safeIndex]);

  // Auto-rotate every 5 seconds ONLY while visible in viewport, tab active, and not paused
  useEffect(() => {
    if (isPreview || paused || infoOpen || !inViewport || visibleSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setActiveIndex((prev) => (prev + 1) % visibleSlides.length);
    }, POSTER_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [isPreview, paused, infoOpen, inViewport, visibleSlides.length]);

  if (!activeSlide) return null;

  const accentStyle = BOARDLY_AD_ACCENTS[activeSlide.accent] || BOARDLY_AD_ACCENTS['purple-pink'];

  const handleDismissCurrent = () => {
    setInfoOpen(false);
    setLocalDismissedIds((prev) => (prev.includes(activeSlide.id) ? prev : [...prev, activeSlide.id]));
    onSlideDismiss?.(activeSlide.id);
    if (visibleSlides.length <= 1) {
      onDismiss?.();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setPaused(false);
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    const dx = endX - touchStartXRef.current;
    const dy = endY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  return (
    <aside
      ref={posterRef}
      aria-label={`Boardly featured promotion: ${activeSlide.headline}`}
      aria-roledescription="carousel"
      data-boardly-ad="true"
      data-boardly-variant="poster"
      data-boardly-slot={slotId || 'hero_poster'}
      data-boardly-offer={activeSlide.id}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`boardly-ad-contain relative w-full min-w-0 max-w-full overflow-hidden box-border rounded-[24px] text-white transition-[background] duration-500 min-h-[430px] sm:min-h-[340px] flex flex-col justify-between ${
        className || ''
      }`}
      style={{
        background: accentStyle.background,
        boxShadow: accentStyle.shadow,
      }}
    >
      {/* Subtle radial light-ray starburst background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'repeating-conic-gradient(from 0deg at 72% 48%, rgba(255,255,255,0.45) 0deg 10deg, transparent 10deg 24deg)',
        }}
      />

      {/* Festive bunting triangle garland along top edge */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 34"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-0 left-0 w-full h-[26px] sm:h-[30px] opacity-95"
      >
        <path
          d="M0 4 Q 150 18 300 6 Q 450 18 600 4"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.6"
          fill="none"
        />
        <polygon points="18,6 42,9 28,26" fill="#FFD23F" />
        <polygon points="62,10 86,12 72,29" fill="#FF7EB6" />
        <polygon points="108,12 132,13 118,30" fill="#38BDF8" />
        <polygon points="154,12 178,11 166,28" fill="#FFFFFF" />
        <polygon points="200,10 224,9 212,26" fill="#FFD23F" />
        <polygon points="246,7 270,6 258,23" fill="#FF7EB6" />
        <polygon points="326,7 350,8 338,25" fill="#38BDF8" />
        <polygon points="372,10 396,11 384,28" fill="#FFD23F" />
        <polygon points="418,12 442,13 430,30" fill="#FFFFFF" />
        <polygon points="464,12 488,11 476,28" fill="#FF7EB6" />
        <polygon points="510,10 534,8 522,25" fill="#FFD23F" />
        <polygon points="556,6 580,5 568,22" fill="#38BDF8" />
      </svg>

      {/* Playful confetti shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute top-14 left-5 h-2.5 w-2.5 rotate-12 rounded-[2px] bg-[#ffd23f]/80" />
        <span className="absolute top-20 right-10 h-3 w-3 -rotate-12 rounded-full bg-white/45" />
        <span className="absolute bottom-14 left-8 h-2.5 w-5 rotate-45 rounded-full bg-[#ff7eb6]/70" />
        <span className="absolute bottom-20 right-6 h-3 w-3 rotate-12 rounded-[3px] bg-[#38bdf8]/75" />
      </div>

      {/* Main inner padding */}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-5 pt-7 sm:p-7 sm:pt-8 gap-4">
        {/* Top chrome row: left "Ad" badge, right info + dismiss */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-flex items-center rounded-full border border-white/65 bg-black/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white leading-none shrink-0"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Ad
            </span>
            <span className="inline-block truncate rounded-[6px] bg-[#ffd23f] px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#1a0b2e] leading-snug">
              {activeSlide.chip}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 -mr-1">
            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              aria-label="About this ad"
              aria-expanded={infoOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-white/90 hover:bg-black/25 hover:text-white transition-colors cursor-pointer"
              title="About this ad"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {dismissible && (
              <button
                type="button"
                onClick={handleDismissCurrent}
                aria-label="Dismiss this ad"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-white/90 hover:bg-black/25 hover:text-white transition-colors cursor-pointer"
                title="Hide this ad"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Info Popover */}
        {infoOpen && (
          <div
            role="note"
            className="rounded-[12px] border border-white/30 bg-[#1c0933]/85 backdrop-blur-sm px-3.5 py-2.5 text-[12px] leading-snug text-white/95 flex items-start justify-between gap-2"
          >
            <span>{infoText}</span>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              aria-label="Close ad info"
              className="shrink-0 rounded-full p-0.5 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Poster Hero Content: all slides stay mounted with stable keys (opacity/translate only, never remounted) */}
        <div className="relative grid flex-1 items-center">
          {visibleSlides.map((slide, idx) => {
            const isSlideActive = idx === safeIndex;
            const slideAccent =
              BOARDLY_AD_ACCENTS[slide.accent] || BOARDLY_AD_ACCENTS['purple-pink'];
            const showSlideCountdown = Boolean(slide.requiresPromoActive && promoTargetEndMs);

            return (
              <div
                key={slide.id}
                aria-hidden={!isSlideActive}
                className={`col-start-1 row-start-1 grid grid-cols-1 sm:grid-cols-[1.25fr_0.75fr] items-center gap-4 sm:gap-6 transition-[opacity,transform] duration-300 ease-out ${
                  isSlideActive
                    ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
                    : 'opacity-0 translate-x-2 pointer-events-none z-0'
                }`}
              >
                {/* Copy & CTA */}
                <div className="min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5">
                  <h3
                    className="text-[24px] sm:text-[30px] md:text-[34px] font-black leading-[1.12] tracking-tight text-white text-balance"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {slide.headline}
                  </h3>

                  <p className="text-[13.5px] sm:text-[15px] leading-relaxed text-white/92 max-w-lg break-words">
                    {slide.description}
                  </p>

                  {/* Real Countdown (only if active EARLY21 slide has a real endDate; isolated timer) */}
                  {showSlideCountdown && (
                    <AdCountdownGrid
                      targetEndMs={promoTargetEndMs}
                      variant="poster"
                      active={inViewport && isSlideActive}
                    />
                  )}

                  {/* Desktop CTA button (shown inline on sm+, moved below illustration on mobile) */}
                  <div className="hidden sm:flex pt-2 w-full max-w-[260px]">
                    {isPreview ? (
                      <span
                        className="w-full min-h-[46px] rounded-full bg-white font-extrabold text-sm px-6 py-2.5 shadow-[0_10px_24px_-4px_rgba(24,8,48,0.36)] inline-flex items-center justify-center gap-2"
                        style={{ color: slideAccent.ctaText }}
                      >
                        <span>{slide.ctaLabel}</span>
                        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.6} aria-hidden="true" />
                      </span>
                    ) : (
                      <Link
                        to={slide.link}
                        tabIndex={isSlideActive ? 0 : -1}
                        className="w-full min-h-[46px] rounded-full bg-white hover:bg-[#f7f2ff] active:scale-[0.99] font-extrabold text-sm px-6 py-2.5 shadow-[0_10px_24px_-4px_rgba(24,8,48,0.36)] transition-all duration-150 inline-flex items-center justify-center gap-2 no-underline"
                        style={{ color: slideAccent.ctaText }}
                      >
                        <span className="truncate">{slide.ctaLabel}</span>
                        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.6} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Student Illustration + Tilted Circular Seal Badge */}
                <div className="relative flex flex-col items-center justify-center">
                  <div className="relative inline-flex items-center justify-center">
                    <StudentIllustration
                      illustrationId={slide.illustrationId}
                      imageUrl={slide.imageUrl}
                      size="lg"
                      priority={idx === 0}
                    />
                    {/* Circular tilted seal badge */}
                    <div
                      aria-hidden="true"
                      className="absolute -top-2 -right-3 sm:-top-3 sm:-right-4 h-[62px] w-[62px] sm:h-[70px] sm:w-[70px] rounded-full bg-[#ffd23f] text-[#1a0b2e] border-[2.5px] border-white shadow-[0_8px_18px_rgba(18,6,38,0.35)] -rotate-12 flex items-center justify-center p-1.5 text-center"
                    >
                      <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase leading-[1.08] tracking-tight">
                        {slide.posterSeal || slide.chip}
                      </span>
                    </div>
                  </div>

                  {/* Mobile full-width white pill CTA below illustration */}
                  <div className="sm:hidden w-full pt-3">
                    {isPreview ? (
                      <span
                        className="w-full min-h-[46px] rounded-full bg-white font-extrabold text-[14px] px-5 py-2.5 shadow-[0_10px_24px_-4px_rgba(24,8,48,0.36)] inline-flex items-center justify-center gap-2"
                        style={{ color: slideAccent.ctaText }}
                      >
                        <span>{slide.ctaLabel}</span>
                        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.6} aria-hidden="true" />
                      </span>
                    ) : (
                      <Link
                        to={slide.link}
                        tabIndex={isSlideActive ? 0 : -1}
                        className="w-full min-h-[46px] rounded-full bg-white hover:bg-[#f7f2ff] active:scale-[0.99] font-extrabold text-[14px] px-5 py-2.5 shadow-[0_10px_24px_-4px_rgba(24,8,48,0.36)] transition-all duration-150 inline-flex items-center justify-center gap-2 no-underline"
                        style={{ color: slideAccent.ctaText }}
                      >
                        <span className="truncate">{slide.ctaLabel}</span>
                        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.6} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Carousel Controls: pagination dots + subtle desktop prev/next */}
        {visibleSlides.length > 1 && (
          <div className="flex items-center justify-between sm:justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <div
              className="flex items-center justify-center gap-2 mx-auto sm:mx-0"
              role="tablist"
              aria-label="Poster ad slides"
            >
              {visibleSlides.map((slide, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${idx + 1}: ${slide.chip}`}
                    onClick={() => {
                      setInfoOpen(false);
                      setActiveIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive ? 'w-7 bg-[#ffd23f]' : 'w-2 bg-white/45 hover:bg-white/75'
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});

/**
 * Unified visual design for ALL Boardly-owned ads, promos, banners, strips, posters, and upsells.
 * Preserves the signature gradient surface with top-left "Ad" badge, top-right
 * info & dismiss controls, yellow chip, bold white typography, student character illustration,
 * optional real countdown (only when a real endDate exists), and white pill CTA.
 */
export const BoardlyAd = memo(function BoardlyAd({
  variant = 'card',
  accent = 'purple-pink',
  illustrationId = 'girl-books',
  imageUrl = null,
  chip = 'BOARDLY OFFER',
  headline = '',
  description,
  ctaLabel = 'Learn more',
  href,
  onAction,
  secondaryAction,
  endDate,
  socialProof,
  highlights,
  metaNote,
  footerSlot,
  posterSeal,
  slides,
  promoEndDate = null,
  onSlideDismiss,
  infoText = DEFAULT_INFO_TEXT,
  dismissible = true,
  onDismiss,
  isPreview = false,
  slotId,
  offerId,
  containerRef,
  className = '',
}: BoardlyAdProps) {
  const { showAds } = useShowAds();
  const [dismissed, setDismissed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const targetEndMs = useMemo(() => parseEndDateMs(endDate), [endDate]);

  // Strictly honor Pro/Plus ad-free setting (and wait while plan/setting loads) across EVERY BoardlyAd variant
  if (!isPreview && !showAds) {
    return null;
  }

  // ── TOP YELLOW ANNOUNCEMENT STRIP VARIANT ──
  if (variant === 'strip') {
    const stripSlides: BoardlyCatalogAd[] =
      slides && slides.length > 0
        ? slides
        : headline
        ? [
            {
              id: offerId || 'strip_single',
              chip,
              headline,
              shortHeadline: headline,
              description: description || '',
              ctaLabel,
              link: href || '/signup',
              accent,
              illustrationId,
            },
          ]
        : [];
    return (
      <TopAnnouncementStrip
        slides={stripSlides}
        infoText={infoText}
        dismissible={dismissible}
        onDismiss={onDismiss}
        slotId={slotId}
        isPreview={isPreview}
        className={className}
      />
    );
  }

  // ── LARGE HERO POSTER CAROUSEL VARIANT ──
  if (variant === 'poster') {
    const posterSlides: BoardlyCatalogAd[] =
      slides && slides.length > 0
        ? slides
        : headline
        ? [
            {
              id: offerId || 'poster_single',
              chip,
              headline,
              shortHeadline: headline,
              description: description || '',
              ctaLabel,
              link: href || '/signup',
              accent,
              illustrationId,
              posterSeal,
              imageUrl: imageUrl || undefined,
            },
          ]
        : [];
    return (
      <HeroPosterCarousel
        slides={posterSlides}
        promoEndDate={promoEndDate || endDate}
        infoText={infoText}
        dismissible={dismissible}
        onSlideDismiss={onSlideDismiss}
        onDismiss={onDismiss}
        slotId={slotId}
        isPreview={isPreview}
        className={className}
      />
    );
  }

  if (dismissed && !isPreview) {
    return null;
  }

  const accentStyle = BOARDLY_AD_ACCENTS[accent] || BOARDLY_AD_ACCENTS['purple-pink'];
  const isInline = variant === 'inline';
  const isBanner = variant === 'banner';
  const isPopup = variant === 'popup';
  const isExternal = Boolean(href && /^https?:\/\//i.test(href));

  const handleDismiss = () => {
    setInfoOpen(false);
    if (onDismiss) {
      onDismiss();
      return;
    }
    setDismissed(true);
  };

  const handleCtaClick = () => {
    onAction?.();
  };

  const paddingClass = isPopup
    ? 'p-5 sm:p-6'
    : isInline
    ? 'p-3.5 sm:p-4'
    : isBanner
    ? 'px-4 py-4 sm:px-5 sm:py-5'
    : 'p-4 sm:p-5';

  const headlineClass = isPopup
    ? 'text-[19px] sm:text-[22px] font-extrabold leading-tight tracking-tight text-white text-balance'
    : isInline
    ? 'text-[15px] sm:text-base font-extrabold leading-snug tracking-tight text-white text-balance'
    : 'text-[17px] sm:text-[20px] font-extrabold leading-tight tracking-tight text-white text-balance';

  const ctaBaseClasses =
    'w-full min-h-[44px] rounded-full bg-white hover:bg-[#f7f2ff] active:scale-[0.99] font-extrabold text-[13.5px] sm:text-sm px-5 py-2.5 shadow-[0_8px_20px_-4px_rgba(24,8,48,0.32)] transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer select-none no-underline';

  const renderCta = () => {
    const content = (
      <>
        <span className="truncate">{ctaLabel}</span>
        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      </>
    );

    if (isPreview) {
      return (
        <span className={ctaBaseClasses} style={{ color: accentStyle.ctaText }} aria-hidden="true">
          {content}
        </span>
      );
    }

    if (href) {
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCtaClick}
            className={ctaBaseClasses}
            style={{ color: accentStyle.ctaText }}
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          to={href}
          onClick={handleCtaClick}
          className={ctaBaseClasses}
          style={{ color: accentStyle.ctaText }}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={handleCtaClick}
        className={ctaBaseClasses}
        style={{ color: accentStyle.ctaText }}
      >
        {content}
      </button>
    );
  };

  if (dismissed && isPreview) {
    return (
      <div
        className={`w-full min-w-0 rounded-[12px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/40 px-4 py-3 text-center text-xs text-[var(--text-muted)] ${className}`}
      >
        <span>Ad dismissed in preview. </span>
        <button
          type="button"
          onClick={() => setDismissed(false)}
          className="font-semibold underline text-[var(--text)] cursor-pointer"
        >
          Restore
        </button>
      </div>
    );
  }

  return (
    <aside
      ref={containerRef}
      aria-label={`Advertisement: ${headline}`}
      data-boardly-ad="true"
      data-boardly-variant={variant}
      data-boardly-slot={slotId || undefined}
      data-boardly-offer={offerId || undefined}
      className={`boardly-ad-contain relative w-full min-w-0 max-w-full overflow-hidden box-border rounded-[12px] text-white ${paddingClass} ${className}`}
      style={{
        background: accentStyle.background,
        boxShadow: accentStyle.shadow,
      }}
    >
      {/* Subtle decorative radial sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-25 blur-2xl"
        style={{ background: '#ffd23f' }}
      />

      <div className={`relative z-10 flex flex-col ${isInline ? 'gap-2.5' : 'gap-3'}`}>
        {/* Top Ad Chrome Bar: left "Ad" badge, right info + dismiss controls */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className="inline-flex items-center rounded-full border border-white/60 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white leading-none select-none shrink-0"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Ad
          </span>

          <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              aria-label="About this ad"
              aria-expanded={infoOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              title="About this ad"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {dismissible && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss ad"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Working Info Popover */}
        {infoOpen && (
          <div
            role="note"
            className="rounded-[10px] border border-white/30 bg-[#1c0933]/80 backdrop-blur-sm px-3 py-2 text-[11.5px] leading-snug text-white/95 flex items-start justify-between gap-2"
          >
            <span>{infoText}</span>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              aria-label="Close ad info"
              className="shrink-0 rounded-full p-0.5 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Content Row: Yellow Chip + Headline + Supporting Line paired with Student Illustration */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 min-w-0">
          <div className="min-w-0 flex-1 space-y-1.5">
            {chip && (
              <span className="inline-block rounded-[6px] bg-[#ffd23f] px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#1a0b2e] leading-snug">
                {chip}
              </span>
            )}

            <h3 className={headlineClass} style={{ fontFamily: 'var(--font-heading)' }}>
              {headline}
            </h3>

            {description && (
              <p
                className={`${
                  isInline ? 'text-[12.5px]' : 'text-[13px] sm:text-[14px]'
                } leading-relaxed text-white/90 break-words`}
              >
                {description}
              </p>
            )}
          </div>

          <StudentIllustration
            illustrationId={illustrationId}
            imageUrl={imageUrl}
            size={isInline || isPopup ? 'sm' : 'md'}
            className="self-center"
          />
        </div>

        {/* Real Countdown Boxes (ONLY rendered when a real future endDate is provided; isolated timer) */}
        {targetEndMs && (
          <AdCountdownGrid
            targetEndMs={targetEndMs}
            variant="card"
            active={isPreview || showAds}
          />
        )}

        {/* Optional Real Highlights List (used in Pro/Plus upgrade popups) */}
        {highlights && highlights.length > 0 && (
          <ul className="space-y-1.5 rounded-[10px] border border-white/20 bg-white/10 p-3 text-[12.5px] sm:text-[13px] leading-snug text-white">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ffd23f]"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Optional Real Metadata Note (live pricing or real PKT reset info) */}
        {metaNote && (
          <div className="rounded-[10px] border border-white/20 bg-[#1a0830]/35 px-3 py-2 text-[12px] leading-snug text-white/95 font-medium">
            {metaNote}
          </div>
        )}

        {/* Optional Real Data-Backed Social Proof Line */}
        {socialProof && (
          <p className="text-[12px] font-semibold text-[#ffd23f] leading-snug">{socialProof}</p>
        )}

        {/* Full-Width White Pill CTA Button (+ optional secondary white-outline button) */}
        <div className={`flex flex-col gap-2 ${isInline ? 'pt-0.5' : 'pt-1'}`}>
          {renderCta()}

          {secondaryAction && !isPreview && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="w-full min-h-[42px] rounded-full border border-white/45 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-[13px] px-4 py-2 transition-colors cursor-pointer text-center leading-snug"
            >
              {secondaryAction.label}
            </button>
          )}

          {footerSlot}
        </div>
      </div>
    </aside>
  );
});

/**
 * Self-contained rotating Boardly ad wrapper that automatically:
 * - Honors Pro/Plus ad-free rules, admin master switch, and sensitive route blocks.
 * - Pulls from the 50-ad shuffled deck (`card`, `inline`, `poster`, or `strip`).
 * - Never repeats the same ad twice on one screen or twice in a row.
 * - Lets users dismiss a specific ad for the current session via `✕` without breaking rotation.
 */
export interface RotatingBoardlyAdProps {
  variant: 'card' | 'inline' | 'poster' | 'strip';
  slotKey: string;
  slideCount?: number;
  className?: string;
  /** Optional outer layout wrapper classes applied ONLY when the ad renders (prevents empty gaps when hidden) */
  wrapperClassName?: string;
}

export const RotatingBoardlyAd = memo(function RotatingBoardlyAd({
  variant,
  slotKey,
  slideCount = 5,
  className = '',
  wrapperClassName = '',
}: RotatingBoardlyAdProps) {
  const reactId = useId();
  const { canShow, isPromoActive, promoEndDate, pathname } = useBoardlyAdVisibility();
  const [dismissVersion, setDismissVersion] = useState(0);
  const [slotClosed, setSlotClosed] = useState(false);

  const uniqueSlotKey = `${slotKey}::${reactId}`;

  useEffect(() => {
    return subscribeDismissedAds(() => {
      setDismissVersion((v) => v + 1);
    });
  }, []);

  // Reset slot visibility when navigating to a new page
  useEffect(() => {
    setSlotClosed(false);
  }, [pathname]);

  const [singleAd, setSingleAd] = useState<BoardlyCatalogAd | null>(() => {
    if (!canShow || variant === 'poster' || variant === 'strip') return null;
    return claimRotatingCatalogAd(pathname, uniqueSlotKey, isPromoActive);
  });

  const [posterSlides, setPosterSlides] = useState<BoardlyCatalogAd[]>(() => {
    if (!canShow || variant !== 'poster') return [];
    return getPosterSlides(pathname, uniqueSlotKey, isPromoActive, slideCount);
  });

  const [stripSlides, setStripSlides] = useState<BoardlyCatalogAd[]>(() =>
    variant === 'strip' ? getStripHeadlines(isPromoActive, 12) : []
  );
  const stripPromoRef = useRef<boolean>(isPromoActive);

  // Only refresh strip headlines when promo eligibility actually changes (never on scroll or route change)
  useEffect(() => {
    if (variant !== 'strip') return;
    if (stripPromoRef.current !== isPromoActive) {
      stripPromoRef.current = isPromoActive;
      setStripSlides(getStripHeadlines(isPromoActive, 12));
    }
  }, [variant, isPromoActive]);

  // Keep card/poster claims in sync without touching stripSlides
  useEffect(() => {
    if (variant === 'strip') return;

    if (!canShow || slotClosed) {
      setSingleAd(null);
      setPosterSlides([]);
      releaseRotatingCatalogClaim(pathname, uniqueSlotKey);
      return;
    }

    if (variant === 'poster') {
      const picked = getPosterSlides(pathname, uniqueSlotKey, isPromoActive, slideCount);
      setPosterSlides(picked);
      return () => {
        for (let i = 0; i < slideCount; i++) {
          releaseRotatingCatalogClaim(pathname, `${uniqueSlotKey}::${i}`);
        }
      };
    }

    const claimed = claimRotatingCatalogAd(pathname, uniqueSlotKey, isPromoActive);
    setSingleAd(claimed);

    return () => {
      releaseRotatingCatalogClaim(pathname, uniqueSlotKey);
    };
  }, [canShow, slotClosed, variant, pathname, uniqueSlotKey, isPromoActive, slideCount, dismissVersion]);

  const handleStripDismiss = useCallback(() => {
    setSlotClosed(true);
  }, []);

  const handlePosterSlideDismiss = useCallback((adId: string) => {
    dismissAdForSession(adId);
  }, []);

  const handleSingleDismiss = useCallback(() => {
    if (singleAd) {
      dismissAdForSession(singleAd.id);
    }
    setSlotClosed(true);
  }, [singleAd]);

  if (!canShow || slotClosed) return null;

  const wrapIfNeeded = (node: React.ReactNode) =>
    wrapperClassName ? <div className={wrapperClassName}>{node}</div> : node;

  if (variant === 'strip') {
    if (stripSlides.length === 0) return null;
    return (
      <TopAnnouncementStrip
        slides={stripSlides}
        infoText={DEFAULT_INFO_TEXT}
        dismissible
        onDismiss={handleStripDismiss}
        slotId={slotKey}
        className={className}
      />
    );
  }

  if (variant === 'poster') {
    if (posterSlides.length === 0) return null;
    return wrapIfNeeded(
      <BoardlyAd
        variant="poster"
        slides={posterSlides}
        promoEndDate={promoEndDate}
        slotId={slotKey}
        onSlideDismiss={handlePosterSlideDismiss}
        onDismiss={handleStripDismiss}
        className={className}
      />
    );
  }

  if (!singleAd) return null;

  return wrapIfNeeded(
    <BoardlyAd
      variant={variant}
      accent={singleAd.accent}
      illustrationId={singleAd.illustrationId}
      imageUrl={singleAd.imageUrl}
      chip={singleAd.chip}
      headline={singleAd.headline}
      description={singleAd.description}
      ctaLabel={singleAd.ctaLabel}
      href={singleAd.link}
      endDate={singleAd.requiresPromoActive ? promoEndDate : null}
      slotId={slotKey}
      offerId={singleAd.id}
      onDismiss={handleSingleDismiss}
      className={className}
    />
  );
});

export default BoardlyAd;
