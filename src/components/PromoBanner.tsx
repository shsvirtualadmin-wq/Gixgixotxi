import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  isAdBlockedRoute,
  isOfferActiveNow,
  sanitizeSafeOfferUrl,
  type AdSlotId,
  type BoardlyOffer,
} from '@/config/ads';
import { recordBoardlyOfferEvent } from '@/services/adsConfigService';

export interface PromoBannerProps {
  offer: BoardlyOffer;
  slotId: AdSlotId | string;
  className?: string;
  compact?: boolean;
  /** Set true inside /admin/ads phone preview so stats aren't recorded and route guards are bypassed */
  isPreview?: boolean;
}

/**
 * Reusable Boardly Offer banner labeled "Boardly offer".
 * Matches Boardly's glass/surface design in both dark and light modes.
 * Records 1 anonymous impression when scrolled into view and 1 click on CTA.
 */
export function PromoBanner({
  offer,
  slotId,
  className = '',
  compact = false,
  isPreview = false,
}: PromoBannerProps) {
  const location = useLocation();
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const impressionSentRef = useRef<string | null>(null);

  const safeHref = sanitizeSafeOfferUrl(offer.link);
  const isExternal = /^https?:\/\//i.test(safeHref);
  const isBlocked = !isPreview && isAdBlockedRoute(location.pathname);
  const isActive = isPreview || isOfferActiveNow(offer);

  useEffect(() => {
    if (isPreview || isBlocked || !isActive || !offer?.id) return;
    const key = `${slotId}::${offer.id}::${location.pathname}`;
    if (impressionSentRef.current === key) return;

    const el = bannerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      impressionSentRef.current = key;
      recordBoardlyOfferEvent('impression', slotId, offer.id);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && impressionSentRef.current !== key) {
          impressionSentRef.current = key;
          recordBoardlyOfferEvent('impression', slotId, offer.id);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isPreview, isBlocked, isActive, offer?.id, slotId, location.pathname]);

  if (!isPreview && (isBlocked || !isActive)) {
    return null;
  }

  const handleClick = () => {
    if (!isPreview && offer?.id) {
      recordBoardlyOfferEvent('click', slotId, offer.id);
    }
  };

  const buttonClasses =
    'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.99] transition-all whitespace-nowrap shrink-0';

  return (
    <aside
      ref={bannerRef}
      aria-label="Boardly offer"
      data-boardly-offer={offer.id}
      data-boardly-slot={slotId}
      className={`w-full min-w-0 flex flex-col gap-1.5 ${className}`}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] select-none px-1"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Boardly offer
      </span>

      <div
        className={`w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 shadow-sm transition-colors ${
          compact ? 'p-4' : 'px-4 py-3.5 sm:px-5 sm:py-4'
        }`}
      >
        <div
          className={`flex ${
            compact
              ? 'flex-col items-start gap-3'
              : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'
          }`}
        >
          <div className="min-w-0 flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm sm:text-[15px] font-semibold leading-snug text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {offer.title}
              </p>
              {offer.text && (
                <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
                  {offer.text}
                </p>
              )}
            </div>
          </div>

          {isPreview ? (
            <span className={buttonClasses}>
              <span>{offer.buttonLabel || 'Learn more'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          ) : isExternal ? (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className={buttonClasses}
            >
              <span>{offer.buttonLabel || 'Learn more'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : (
            <Link to={safeHref} onClick={handleClick} className={buttonClasses}>
              <span>{offer.buttonLabel || 'Learn more'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

export default PromoBanner;
