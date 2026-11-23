import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  isAdBlockedRoute,
  isOfferActiveNow,
  sanitizeSafeOfferUrl,
  type AdSlotId,
  type BoardlyOffer,
} from '@/config/ads';
import { recordBoardlyOfferEvent } from '@/services/adsConfigService';
import { BoardlyAd } from '@/components/BoardlyAd';

export interface PromoBannerProps {
  offer: BoardlyOffer;
  slotId: AdSlotId | string;
  className?: string;
  compact?: boolean;
  /** Real end date from promoCode config (only used when offer itself has no endDate) */
  promoEndDate?: string | null;
  /** Set true inside /admin/ads phone preview so stats aren't recorded and route guards are bypassed */
  isPreview?: boolean;
}

const OFFER_CHIP_MAP: Record<string, string> = {
  early: 'EARLY OFFER',
  sprint: 'TIMED SPRINT',
  vault: 'FORMULA VAULT',
  mentor: 'AI MENTOR',
  notes: 'STUDY NOTES',
  captain: 'NAKAMA CAPTAIN',
  weak: 'BOARDLY PRO',
  squad: 'STUDY CREW',
  kobans: 'KOBANS REWARDS',
};

function getChipForOffer(offer: BoardlyOffer): string {
  const key = String(offer.id || '').toLowerCase();
  if (OFFER_CHIP_MAP[key]) return OFFER_CHIP_MAP[key];
  const lowerTitle = String(offer.title || '').toLowerCase();
  if (lowerTitle.includes('early') || lowerTitle.includes('% off')) return 'EARLY OFFER';
  if (lowerTitle.includes('ai mentor')) return 'AI MENTOR';
  if (lowerTitle.includes('formula')) return 'FORMULA VAULT';
  if (lowerTitle.includes('crew') || lowerTitle.includes('classmate')) return 'STUDY CREW';
  if (lowerTitle.includes('koban')) return 'KOBANS REWARDS';
  if (lowerTitle.includes('pro') || lowerTitle.includes('plus')) return 'BOARDLY PRO';
  return 'BOARDLY OFFER';
}

/**
 * Reusable Boardly Offer ad wrapper built on BoardlyAd.
 * Preserves all existing route-block, schedule, URL sanitization, and impression/click tracking logic.
 */
export function PromoBanner({
  offer,
  slotId,
  className = '',
  compact = false,
  promoEndDate = null,
  isPreview = false,
}: PromoBannerProps) {
  const location = useLocation();
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const impressionSentRef = useRef<string | null>(null);

  const safeHref = sanitizeSafeOfferUrl(offer.link);
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

  // Only show a countdown if a real endDate exists on the offer (or promoCode for the early offer)
  const realEndDate =
    offer.endDate || (offer.id === 'early' && promoEndDate ? promoEndDate : null);

  return (
    <BoardlyAd
      variant={compact ? 'inline' : 'card'}
      chip={getChipForOffer(offer)}
      headline={offer.title}
      description={offer.text || undefined}
      ctaLabel={offer.buttonLabel || 'Learn more'}
      href={safeHref}
      onAction={handleClick}
      endDate={realEndDate}
      isPreview={isPreview}
      slotId={String(slotId)}
      offerId={offer.id}
      containerRef={bannerRef}
      className={className}
    />
  );
}

export default PromoBanner;
