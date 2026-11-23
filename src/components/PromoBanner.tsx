import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_BOARDLY_OFFERS,
  isAdBlockedRoute,
  isOfferActiveNow,
  sanitizeSafeOfferUrl,
  type AdSlotId,
  type BoardlyOffer,
} from '@/config/ads';
import {
  claimRotatingCatalogAd,
  dismissAdForSession,
  getDismissedAdIds,
  getVisualStyleForOfferId,
  releaseRotatingCatalogClaim,
  subscribeDismissedAds,
  type BoardlyCatalogAd,
} from '@/config/boardlyAdsCatalog';
import { recordBoardlyOfferEvent, useAdsConfig } from '@/services/adsConfigService';
import { useShowAds } from '@/hooks/useShowAds';
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

const DEFAULT_OFFER_TITLES = new Map(
  DEFAULT_BOARDLY_OFFERS.map((o) => [o.id, o.title.trim()])
);

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

function isAdminCustomizedOffer(offer: BoardlyOffer): boolean {
  if (!offer?.id) return false;
  const defaultTitle = DEFAULT_OFFER_TITLES.get(offer.id);
  // Custom offer created in /admin/ads, or built-in offer whose title was edited by admin
  if (!defaultTitle) return true;
  return offer.title.trim() !== defaultTitle;
}

/**
 * Reusable Boardly Offer ad wrapper built on BoardlyAd.
 * - On live pages, seamlessly rotates through the 50-ad catalog (respecting active EARLY21 config,
 *   no consecutive repeats, no same-screen duplicates, and session-only X dismissal) unless the
 *   admin explicitly customized an offer in /admin/ads.
 * - In /admin/ads phone preview (`isPreview`), always renders the exact selected offer.
 * - Preserves all existing route-block, schedule, URL sanitization, and impression/click tracking logic.
 */
export const PromoBanner = memo(function PromoBanner({
  offer,
  slotId,
  className = '',
  compact = false,
  promoEndDate = null,
  isPreview = false,
}: PromoBannerProps) {
  const location = useLocation();
  const reactId = useId();
  const { showAds } = useShowAds();
  const { config } = useAdsConfig();
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const impressionSentRef = useRef<string | null>(null);

  const [dismissVersion, setDismissVersion] = useState(0);
  const [slotDismissed, setSlotDismissed] = useState(false);

  useEffect(() => {
    if (isPreview) return;
    return subscribeDismissedAds(() => {
      setDismissVersion((v) => v + 1);
    });
  }, [isPreview]);

  useEffect(() => {
    setSlotDismissed(false);
  }, [location.pathname, slotId]);

  const promoExpired = Boolean(
    promoEndDate &&
      !Number.isNaN(Date.parse(`${promoEndDate}T23:59:59.999Z`)) &&
      Date.now() > Date.parse(`${promoEndDate}T23:59:59.999Z`)
  );
  const isPromoActive = Boolean(config.promoCode?.active && !promoExpired);
  const useCatalogRotation = !isPreview && !isAdminCustomizedOffer(offer);
  const claimKey = `promo::${String(slotId)}::${reactId}`;

  const [catalogAd, setCatalogAd] = useState<BoardlyCatalogAd | null>(() => {
    if (!useCatalogRotation) return null;
    return claimRotatingCatalogAd(location.pathname, claimKey, isPromoActive);
  });

  useEffect(() => {
    if (!useCatalogRotation || slotDismissed) {
      setCatalogAd(null);
      releaseRotatingCatalogClaim(location.pathname, claimKey);
      return;
    }

    const picked = claimRotatingCatalogAd(location.pathname, claimKey, isPromoActive);
    setCatalogAd(picked);

    return () => {
      releaseRotatingCatalogClaim(location.pathname, claimKey);
    };
  }, [useCatalogRotation, slotDismissed, location.pathname, claimKey, isPromoActive, dismissVersion]);

  const isBlocked = !isPreview && isAdBlockedRoute(location.pathname);
  const isActive = isPreview || isOfferActiveNow(offer);

  const isCustomDismissed = useMemo(() => {
    if (isPreview || useCatalogRotation) return false;
    return getDismissedAdIds().has(`custom::${offer.id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview, useCatalogRotation, offer.id, dismissVersion]);

  const activeOfferId = catalogAd ? catalogAd.id : offer.id;

  const isAdAllowed = isPreview || showAds;

  useEffect(() => {
    if (
      isPreview ||
      !isAdAllowed ||
      isBlocked ||
      !isActive ||
      slotDismissed ||
      isCustomDismissed ||
      !activeOfferId
    ) {
      return;
    }
    const key = `${slotId}::${activeOfferId}::${location.pathname}`;
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
  }, [
    isPreview,
    isAdAllowed,
    isBlocked,
    isActive,
    slotDismissed,
    isCustomDismissed,
    activeOfferId,
    offer.id,
    slotId,
    location.pathname,
  ]);

  const handleClick = useCallback(() => {
    if (!isPreview && offer?.id) {
      recordBoardlyOfferEvent('click', slotId, offer.id);
    }
  }, [isPreview, offer?.id, slotId]);

  const handleDismissCatalog = useCallback(() => {
    if (!catalogAd) return;
    dismissAdForSession(catalogAd.id);
    setSlotDismissed(true);
  }, [catalogAd]);

  const handleDismissCustom = useCallback(() => {
    dismissAdForSession(`custom::${offer.id}`);
    setSlotDismissed(true);
  }, [offer.id]);

  if (!isPreview && (!isAdAllowed || isBlocked || !isActive || slotDismissed || isCustomDismissed)) {
    return null;
  }

  if (catalogAd) {
    const safeCatalogHref = sanitizeSafeOfferUrl(catalogAd.link);
    return (
      <BoardlyAd
        variant={compact ? 'inline' : 'card'}
        accent={catalogAd.accent}
        illustrationId={catalogAd.illustrationId}
        imageUrl={catalogAd.imageUrl}
        chip={catalogAd.chip}
        headline={catalogAd.headline}
        description={catalogAd.description}
        ctaLabel={catalogAd.ctaLabel}
        href={safeCatalogHref}
        onAction={handleClick}
        endDate={catalogAd.requiresPromoActive ? promoEndDate : null}
        isPreview={false}
        slotId={String(slotId)}
        offerId={catalogAd.id}
        onDismiss={handleDismissCatalog}
        containerRef={bannerRef}
        className={className}
      />
    );
  }

  // Admin-customized offer or /admin/ads phone preview
  const safeHref = sanitizeSafeOfferUrl(offer.link);
  const visualStyle = getVisualStyleForOfferId(offer.id, offer.title);
  const realEndDate =
    offer.endDate || (offer.id === 'early' && promoEndDate ? promoEndDate : null);

  return (
    <BoardlyAd
      variant={compact ? 'inline' : 'card'}
      accent={visualStyle.accent}
      illustrationId={visualStyle.illustrationId}
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
      onDismiss={isPreview ? undefined : handleDismissCustom}
      containerRef={bannerRef}
      className={className}
    />
  );
});

export default PromoBanner;
