import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Info, X } from 'lucide-react';

export type BoardlyAdVariant = 'card' | 'banner' | 'popup' | 'inline';

export interface BoardlyAdSecondaryAction {
  label: string;
  onClick: () => void;
}

export interface BoardlyAdProps {
  /** Layout variant for cards, banners, popups/modals, and compact inline/sidebar placements */
  variant?: BoardlyAdVariant;
  /** Yellow uppercase chip shown above the headline (e.g. "EARLY OFFER", "BOARDLY PRO") */
  chip?: string;
  /** Big bold headline */
  headline: string;
  /** One short supporting line */
  description?: string;
  /** Primary white pill button label */
  ctaLabel: string;
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
  // Date-only YYYY-MM-DD means end of that calendar day UTC
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

/**
 * Unified visual design for ALL Boardly-owned ads, promos, banners, and upsells.
 * Distinct purple-violet-pink gradient surface with top-left "Ad" badge, top-right
 * info & dismiss controls, yellow chip, bold white typography, optional real countdown
 * (only when a real endDate exists), and full-width white pill CTA with purple text.
 */
export function BoardlyAd({
  variant = 'card',
  chip = 'BOARDLY OFFER',
  headline,
  description,
  ctaLabel,
  href,
  onAction,
  secondaryAction,
  endDate,
  socialProof,
  highlights,
  metaNote,
  footerSlot,
  infoText = DEFAULT_INFO_TEXT,
  dismissible = true,
  onDismiss,
  isPreview = false,
  slotId,
  offerId,
  containerRef,
  className = '',
}: BoardlyAdProps) {
  const [dismissed, setDismissed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const targetEndMs = useMemo(() => parseEndDateMs(endDate), [endDate]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!targetEndMs) return;
    if (targetEndMs <= Date.now()) return;
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetEndMs]);

  const countdown = useMemo(
    () => computeCountdown(targetEndMs, nowMs),
    [targetEndMs, nowMs]
  );

  if (dismissed && !isPreview) {
    return null;
  }

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
    ? 'text-[20px] sm:text-[23px] font-extrabold leading-tight tracking-tight text-white text-balance'
    : isInline
    ? 'text-[15px] sm:text-base font-extrabold leading-snug tracking-tight text-white text-balance'
    : 'text-[18px] sm:text-[21px] font-extrabold leading-tight tracking-tight text-white text-balance';

  const ctaBaseClasses =
    'w-full min-h-[44px] rounded-full bg-white text-[#5b14b8] hover:bg-[#f7f2ff] active:scale-[0.99] font-extrabold text-[13.5px] sm:text-sm px-5 py-2.5 shadow-[0_8px_20px_-4px_rgba(24,8,48,0.32)] transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer select-none no-underline';

  const renderCta = () => {
    const content = (
      <>
        <span className="truncate">{ctaLabel}</span>
        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      </>
    );

    if (isPreview) {
      return (
        <span className={ctaBaseClasses} aria-hidden="true">
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
          >
            {content}
          </a>
        );
      }
      return (
        <Link to={href} onClick={handleCtaClick} className={ctaBaseClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button type="button" onClick={handleCtaClick} className={ctaBaseClasses}>
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
      className={`relative w-full min-w-0 max-w-full overflow-hidden box-border rounded-[12px] text-white ${paddingClass} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #5b14b8 0%, #8a2be2 52%, #d6247a 100%)',
        boxShadow:
          '0 12px 32px -8px rgba(138, 43, 226, 0.48), 0 4px 16px -4px rgba(214, 36, 122, 0.28)',
      }}
    >
      {/* Subtle decorative radial sheen (non-interactive, pure CSS) */}
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

        {/* Yellow Chip + Headline + Supporting Line */}
        <div className="min-w-0 space-y-1.5">
          {chip && (
            <span className="inline-block rounded-[6px] bg-[#ffd23f] px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#1a0b2e] leading-snug">
              {chip}
            </span>
          )}

          <h3
            className={headlineClass}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
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

        {/* Real Countdown Boxes (ONLY rendered when a real future endDate is provided) */}
        {countdown && (
          <div
            className="grid grid-cols-4 gap-1.5 sm:gap-2 max-w-[300px]"
            aria-label={`Offer ends in ${countdown.days} days ${countdown.hours} hours ${countdown.minutes} minutes`}
          >
            {[
              { label: 'Days', value: pad2(countdown.days) },
              { label: 'Hrs', value: pad2(countdown.hours) },
              { label: 'Min', value: pad2(countdown.minutes) },
              { label: 'Sec', value: pad2(countdown.seconds) },
            ].map((unit) => (
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
          <p className="text-[12px] font-semibold text-[#ffd23f] leading-snug">
            {socialProof}
          </p>
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
}

export default BoardlyAd;
