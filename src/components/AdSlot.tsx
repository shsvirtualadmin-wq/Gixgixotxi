import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ADSENSE_CLIENT_ID,
  DEFAULT_AD_SLOTS,
  isAdBlockedRoute,
  isOfferActiveNow,
  sanitizeGoogleSlotId,
  sanitizePublisherId,
  type AdSlotConfig,
  type AdSlotId,
  type AdsConfigDoc,
  type BoardlyOffer,
} from '@/config/ads';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import {
  claimUniqueOfferForPage,
  registerMobileAdSlot,
  releaseOfferClaimForPage,
  useAdsConfig,
} from '@/services/adsConfigService';
import { PromoBanner } from '@/components/PromoBanner';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export interface AdSlotProps {
  slotId: AdSlotId | string;
  /** Unique suffix when the same feed slot appears multiple times on one page */
  instanceKey?: string;
  format?: string;
  className?: string;
  /** Compact vertical card layout (used in sticky sidebar or phone preview) */
  compact?: boolean;
  /** Optional preview config override used by /admin/ads phone preview */
  previewConfig?: AdsConfigDoc;
  previewSlotOverride?: AdSlotConfig;
  isPreview?: boolean;
}

const ADSENSE_SCRIPT_ID = 'boardly-adsense-script';
const GOOGLE_FILL_TIMEOUT_MS = 3000;

function ensureAdSenseScriptLoaded(publisherId: string) {
  if (typeof document === 'undefined') return;
  const cleanPub = sanitizePublisherId(publisherId || ADSENSE_CLIENT_ID);
  if (!cleanPub) return;
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
  const existing = document.querySelector(
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
  );
  if (existing) return;

  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
    cleanPub
  )}`;
  document.head.appendChild(script);
}

/**
 * Unified Boardly AdSlot component.
 *
 * Rules enforced automatically:
 * 1. Never renders on blocked routes (pricing, checkout, login, signup, onboarding,
 *    verify-email, active test runner, profile, settings, captains, rewards, contact,
 *    privacy, terms, faq, not-found, admin).
 * 2. Pro/Plus users with Ad-free experience toggle ON see NO ad, NO Boardly offer,
 *    NO reserved space, and the AdSense script is NOT loaded.
 * 3. Controlled live from /admin/ads (global switch, per-slot toggle/mode/Google slot ID,
 *    Boardly offers with active & date windows).
 * 4. `store_rows` is strictly Boardly-only (never Google).
 * 5. When Google has no ad (blank slot ID, unfilled, or 3s timeout), automatically falls
 *    back to the slot's fallback Boardly offer (if global fallback switch is ON) or collapses
 *    completely — never leaving an empty box.
 * 6. Two slots on the same page never show the same Boardly offer.
 * 7. Only one ad/offer is visible at a time on mobile screens (<768px).
 */
export function AdSlot({
  slotId,
  instanceKey = 'main',
  format = 'auto',
  className = '',
  compact = false,
  previewConfig,
  previewSlotOverride,
  isPreview = false,
}: AdSlotProps) {
  const location = useLocation();
  const reactId = useId();
  const { user, profile } = useAuth();
  const { isPaid } = useEffectivePlan();
  const { config: liveConfig } = useAdsConfig();

  const config = previewConfig || liveConfig;
  const canonicalSlotId = (slotId in DEFAULT_AD_SLOTS ? slotId : null) as AdSlotId | null;
  const slotConfig: AdSlotConfig | null = previewSlotOverride
    ? previewSlotOverride
    : canonicalSlotId
    ? config.slots[canonicalSlotId] || DEFAULT_AD_SLOTS[canonicalSlotId]
    : null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const insRef = useRef<HTMLModElement | null>(null);
  const hasPushedRef = useRef(false);

  // Track mobile single-ad visibility permission
  const [mobileAllowed, setMobileAllowed] = useState(true);
  // Track Google AdSense fill state: 'idle' | 'pending' | 'filled' | 'unfilled'
  const [googleState, setGoogleState] = useState<'idle' | 'pending' | 'filled' | 'unfilled'>('idle');

  // Read cached or profile-synced adFreeEnabled preference (defaults to true for active Pro/Plus)
  const [localAdFreeOverride, setLocalAdFreeOverride] = useState<boolean | null>(() => {
    try {
      if (user?.uid) {
        const cached = localStorage.getItem(`boardly_ad_free_${user.uid}`);
        if (cached === '1') return true;
        if (cached === '0') return false;
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });

  useEffect(() => {
    if (typeof profile?.adFreeEnabled === 'boolean') {
      setLocalAdFreeOverride(profile.adFreeEnabled);
    }
  }, [profile?.adFreeEnabled]);

  useEffect(() => {
    const onAdFreeChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ adFreeEnabled?: boolean }>).detail;
      if (typeof detail?.adFreeEnabled === 'boolean') {
        setLocalAdFreeOverride(detail.adFreeEnabled);
      }
    };
    window.addEventListener('boardly:ad-free-changed', onAdFreeChanged);
    return () => window.removeEventListener('boardly:ad-free-changed', onAdFreeChanged);
  }, []);

  const adFreeToggleOn =
    typeof profile?.adFreeEnabled === 'boolean'
      ? profile.adFreeEnabled
      : localAdFreeOverride !== null
      ? localAdFreeOverride
      : true;

  const isRouteBlocked = !isPreview && isAdBlockedRoute(location.pathname);
  const isPaidAdFree = !isPreview && Boolean(isPaid && adFreeToggleOn);
  const isGloballyEnabled = isPreview || config.adsEnabled;
  const isSlotEnabled = Boolean(slotConfig && (isPreview || slotConfig.enabled));
  const shouldHideCompletely =
    !slotConfig || isRouteBlocked || isPaidAdFree || !isGloballyEnabled || !isSlotEnabled;

  // Enforce store_rows strictly Boardly-only
  const effectiveMode = slotConfig?.boardlyOnly ? 'boardly' : slotConfig?.mode || 'boardly';
  const cleanGoogleSlotId =
    slotConfig && !slotConfig.boardlyOnly ? sanitizeGoogleSlotId(slotConfig.googleSlotId) : '';
  const cleanPublisherId = sanitizePublisherId(config.publisherId);

  const canAttemptGoogle =
    !shouldHideCompletely &&
    !isPreview &&
    (effectiveMode === 'google' || effectiveMode === 'auto') &&
    Boolean(cleanGoogleSlotId) &&
    Boolean(cleanPublisherId);

  const shouldFallbackToBoardly =
    !shouldHideCompletely &&
    (effectiveMode === 'boardly' ||
      (effectiveMode === 'auto' &&
        config.fallbackToBoardly &&
        (!canAttemptGoogle || googleState === 'unfilled')));

  // Resolve a page-unique active Boardly offer when showing Boardly offer
  const pageKey = isPreview ? '__admin_preview__' : location.pathname;
  const slotClaimKey = `${slotId}::${instanceKey}::${reactId}`;
  const preferredOfferId =
    effectiveMode === 'boardly'
      ? slotConfig?.primaryOfferId || 'early'
      : slotConfig?.fallbackOfferId || slotConfig?.primaryOfferId || 'early';

  const resolvedOffer: BoardlyOffer | null = useMemo(() => {
    if (!shouldFallbackToBoardly || !slotConfig) return null;
    if (isPreview) {
      const exact = config.offers.find((o) => o.id === preferredOfferId);
      if (exact && isOfferActiveNow(exact)) return exact;
      return config.offers.find((o) => isOfferActiveNow(o)) || exact || null;
    }
    return claimUniqueOfferForPage(pageKey, slotClaimKey, preferredOfferId, config.offers);
  }, [shouldFallbackToBoardly, slotConfig, isPreview, config.offers, preferredOfferId, pageKey, slotClaimKey]);

  // Release page offer claim on unmount or when slot stops displaying an offer
  useEffect(() => {
    if (isPreview) return;
    return () => {
      releaseOfferClaimForPage(pageKey, slotClaimKey);
    };
  }, [isPreview, pageKey, slotClaimKey]);

  // Register with mobile single-visible coordinator
  useEffect(() => {
    if (isPreview || shouldHideCompletely) return;
    const el = containerRef.current;
    if (!el) return;
    return registerMobileAdSlot(slotClaimKey, el, (allowed) => {
      setMobileAllowed(allowed);
    });
  }, [isPreview, shouldHideCompletely, slotClaimKey]);

  // Load Google AdSense and watch fill status with 3-second fallback timeout
  useEffect(() => {
    if (!canAttemptGoogle) {
      hasPushedRef.current = false;
      setGoogleState('idle');
      return;
    }

    ensureAdSenseScriptLoaded(cleanPublisherId);
    setGoogleState('pending');

    if (!hasPushedRef.current) {
      hasPushedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        setGoogleState('unfilled');
        return;
      }
    }

    const insEl = insRef.current;
    const checkStatus = (): boolean => {
      if (!insEl) return false;
      const status = insEl.getAttribute('data-ad-status');
      if (status === 'filled') {
        setGoogleState('filled');
        return true;
      }
      if (status === 'unfilled') {
        setGoogleState('unfilled');
        return true;
      }
      return false;
    };

    if (checkStatus()) return;

    let observer: MutationObserver | null = null;
    if (insEl && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        if (checkStatus() && observer) {
          observer.disconnect();
        }
      });
      observer.observe(insEl, { attributes: true, attributeFilter: ['data-ad-status'] });
    }

    const timeoutId = window.setTimeout(() => {
      if (!insEl) {
        setGoogleState('unfilled');
        return;
      }
      const status = insEl.getAttribute('data-ad-status');
      const hasIframe = Boolean(insEl.querySelector('iframe'));
      if (status === 'filled' || (hasIframe && status !== 'unfilled' && insEl.offsetHeight >= 40)) {
        setGoogleState('filled');
      } else {
        setGoogleState('unfilled');
      }
    }, GOOGLE_FILL_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [canAttemptGoogle, cleanGoogleSlotId, cleanPublisherId]);

  if (shouldHideCompletely) {
    return null;
  }

  // Admin phone preview helper for Google mode when slot ID is set vs fallback
  if (isPreview && (effectiveMode === 'google' || effectiveMode === 'auto')) {
    if (cleanGoogleSlotId) {
      return (
        <div className={`w-full min-w-0 flex flex-col gap-1.5 ${className}`}>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] select-none px-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Advertisement
          </span>
          <div className="w-full min-h-[100px] rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/70 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs font-semibold text-[var(--text)]">Google AdSense Unit</span>
            <span className="mt-1 text-[11px] text-[var(--text-muted)] font-mono">
              {cleanPublisherId || 'No publisher ID'} · Slot {cleanGoogleSlotId}
            </span>
          </div>
          {config.fallbackToBoardly && resolvedOffer && (
            <div className="pt-2">
              <p className="text-[11px] text-[var(--text-muted)] mb-1">
                Fallback if Google has no ad:
              </p>
              <PromoBanner
                offer={resolvedOffer}
                slotId={slotConfig.id}
                compact={compact}
                isPreview
              />
            </div>
          )}
        </div>
      );
    }
    if (resolvedOffer) {
      return (
        <PromoBanner
          offer={resolvedOffer}
          slotId={slotConfig.id}
          className={className}
          compact={compact}
          isPreview
        />
      );
    }
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
        Slot collapses cleanly (no Google Slot ID and no active fallback offer).
      </div>
    );
  }

  // Desktop-only slot wrapper class
  const desktopOnlyClass = slotConfig.desktopOnly ? 'hidden md:block' : '';

  // Render Google AdSense while pending or filled
  const showGoogleUnit = canAttemptGoogle && googleState !== 'unfilled';

  // If neither Google nor a fallback Boardly offer can render, collapse completely (no empty box!)
  if (!showGoogleUnit && !resolvedOffer) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-ad-wrapper={slotConfig.id}
      className={`w-full min-w-0 ${desktopOnlyClass} ${className} ${
        !mobileAllowed ? 'max-md:hidden' : ''
      }`}
    >
      {showGoogleUnit ? (
        <aside
          aria-label="Advertisement"
          data-ad-slot-container="true"
          data-ad-slot-id={slotConfig.id}
          className="w-full min-w-0 flex flex-col gap-1.5"
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] select-none px-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Advertisement
          </span>
          <div className="w-full min-h-[90px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] transition-colors">
            <ins
              ref={insRef}
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client={cleanPublisherId}
              data-ad-slot={cleanGoogleSlotId}
              data-ad-format={format}
              data-full-width-responsive="true"
            />
          </div>
        </aside>
      ) : resolvedOffer ? (
        <PromoBanner
          offer={resolvedOffer}
          slotId={slotConfig.id}
          compact={compact || Boolean(slotConfig.desktopOnly)}
        />
      ) : null}
    </div>
  );
}

export default AdSlot;
