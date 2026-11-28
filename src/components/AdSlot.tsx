import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ADSENSE_CLIENT_ID,
  DEFAULT_AD_SLOTS,
  isAdBlockedRoute,
  isOfferActiveNow,
  isPreviewAdHost,
  resolveLandingAdVideoMode,
  sanitizeGoogleSlotId,
  sanitizePublisherId,
  type AdSlotConfig,
  type AdSlotId,
  type AdsConfigDoc,
  type BoardlyOffer,
} from '@/config/ads';
import { useAuth } from '@/contexts/AuthContext';
import { useShowAds } from '@/hooks/useShowAds';
import {
  claimUniqueOfferForPage,
  registerMobileAdSlot,
  releaseOfferClaimForPage,
  useAdsConfig,
} from '@/services/adsConfigService';
import { PromoBanner } from '@/components/PromoBanner';
import { LandingPromoAnimation } from '@/components/ads/LandingPromoAnimation';

type AdSenseQueue = Array<Record<string, unknown>> & { loaded?: boolean };
type AdSenseScriptStatus = 'idle' | 'loading' | 'loaded' | 'failed';

declare global {
  interface Window {
    adsbygoogle?: AdSenseQueue;
    __boardlyAdSenseFailed?: boolean;
  }
}

export interface AdSlotProps {
  slotId: AdSlotId | string;
  /** Unique suffix when the same feed slot appears multiple times on one page */
  instanceKey?: string;
  format?: string;
  className?: string;
  /** Optional outer wrapper classes applied ONLY when the slot actually renders (zero empty gap when hidden) */
  wrapperClassName?: string;
  /** Compact vertical card layout (used in sticky sidebar or phone preview) */
  compact?: boolean;
  /** Optional preview config override used by /admin/ads phone preview */
  previewConfig?: AdsConfigDoc;
  previewSlotOverride?: AdSlotConfig;
  isPreview?: boolean;
  /** Viewer simulation inside /admin/ads phone preview */
  previewAs?: 'guest' | 'free' | 'paid';
}

const ADSENSE_SCRIPT_ID = 'boardly-adsense-script';
const GOOGLE_FILL_TIMEOUT_MS = 3000;
const GOOGLE_SCRIPT_LOAD_TIMEOUT_MS = 4500;

let adSenseScriptStatus: AdSenseScriptStatus = 'idle';
const adSenseLoadListeners = new Set<() => void>();
const adSenseErrorListeners = new Set<() => void>();

function isAdSenseRuntimeReady(): boolean {
  if (typeof window === 'undefined') return false;
  const queue = window.adsbygoogle;
  return Boolean(queue && (queue.loaded === true || !Array.isArray(queue)));
}

function flushAdSenseLoadListeners() {
  adSenseScriptStatus = 'loaded';
  const listeners = Array.from(adSenseLoadListeners);
  adSenseLoadListeners.clear();
  adSenseErrorListeners.clear();
  for (const cb of listeners) {
    cb();
  }
}

function flushAdSenseErrorListeners() {
  adSenseScriptStatus = 'failed';
  if (typeof window !== 'undefined') {
    window.__boardlyAdSenseFailed = true;
  }
  const listeners = Array.from(adSenseErrorListeners);
  adSenseLoadListeners.clear();
  adSenseErrorListeners.clear();
  for (const cb of listeners) {
    cb();
  }
}

function ensureAdSenseScriptLoaded(
  publisherId: string,
  onScriptReady?: () => void,
  onScriptError?: () => void
): () => void {
  if (typeof document === 'undefined') return () => {};
  if (
    (typeof window !== 'undefined' && window.__boardlyAdSenseFailed) ||
    adSenseScriptStatus === 'failed'
  ) {
    onScriptError?.();
    return () => {};
  }

  if (adSenseScriptStatus === 'loaded' || isAdSenseRuntimeReady()) {
    adSenseScriptStatus = 'loaded';
    onScriptReady?.();
    return () => {};
  }

  const cleanPub = sanitizePublisherId(publisherId || ADSENSE_CLIENT_ID);
  if (!cleanPub) return () => {};

  if (onScriptReady) adSenseLoadListeners.add(onScriptReady);
  if (onScriptError) adSenseErrorListeners.add(onScriptError);

  const unsubscribe = () => {
    if (onScriptReady) adSenseLoadListeners.delete(onScriptReady);
    if (onScriptError) adSenseErrorListeners.delete(onScriptError);
  };

  const existing = (document.getElementById(ADSENSE_SCRIPT_ID) ||
    document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    )) as HTMLScriptElement | null;

  if (existing) {
    if (existing.dataset.boardlyLoaded === '1' || isAdSenseRuntimeReady()) {
      flushAdSenseLoadListeners();
      return () => {};
    }
    if (adSenseScriptStatus !== 'loading') {
      adSenseScriptStatus = 'loading';
      existing.addEventListener(
        'load',
        () => {
          existing.dataset.boardlyLoaded = '1';
          flushAdSenseLoadListeners();
        },
        { once: true }
      );
      existing.addEventListener(
        'error',
        () => {
          flushAdSenseErrorListeners();
        },
        { once: true }
      );
    }
    return unsubscribe;
  }

  adSenseScriptStatus = 'loading';
  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
    cleanPub
  )}`;
  script.onload = () => {
    script.dataset.boardlyLoaded = '1';
    flushAdSenseLoadListeners();
  };
  script.onerror = () => {
    flushAdSenseErrorListeners();
  };
  document.head.appendChild(script);
  return unsubscribe;
}

function scheduleAdSenseScriptLoad(
  publisherId: string,
  onScriptReady?: () => void,
  onScriptError?: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const existing =
    document.getElementById(ADSENSE_SCRIPT_ID) ||
    document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
  if (
    existing ||
    window.__boardlyAdSenseFailed ||
    adSenseScriptStatus !== 'idle' ||
    isAdSenseRuntimeReady()
  ) {
    return ensureAdSenseScriptLoaded(publisherId, onScriptReady, onScriptError);
  }

  let cancelled = false;
  let unsubscribeScript: (() => void) | null = null;
  const run = () => {
    if (!cancelled) {
      unsubscribeScript = ensureAdSenseScriptLoaded(publisherId, onScriptReady, onScriptError);
    }
  };

  if ('requestIdleCallback' in window) {
    const idleId = (
      window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback(run, { timeout: 1500 });
    return () => {
      cancelled = true;
      (
        window as Window & { cancelIdleCallback?: (id: number) => void }
      ).cancelIdleCallback?.(idleId);
      unsubscribeScript?.();
    };
  }

  const timerId = window.setTimeout(run, 300);
  return () => {
    cancelled = true;
    window.clearTimeout(timerId);
    unsubscribeScript?.();
  };
}

/**
 * Clean reserved placeholder shown while a signed-in user's plan is still loading,
 * or when a Google slot has no fill and Boardly offer fallback is disabled/exhausted.
 * Uses neutral DOM attributes so cosmetic content blockers never hide reserved slots.
 */
function AdSpacePlaceholder({
  slotId,
  compact = false,
  loading = false,
}: {
  slotId: string;
  compact?: boolean;
  loading?: boolean;
}) {
  return (
    <aside
      aria-label="Sponsored placement"
      data-boardly-slot={slotId}
      data-boardly-state={loading ? 'loading' : 'reserved'}
      className="w-full min-w-0 flex flex-col gap-1.5"
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] select-none px-1"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Advertisement
      </span>
      <div
        className={`w-full rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/80 flex flex-col items-center justify-center text-center transition-colors ${
          compact ? 'min-h-[120px] p-4' : 'min-h-[92px] px-4 py-4'
        }`}
      >
        <span
          className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Ad space
        </span>
      </div>
    </aside>
  );
}

/**
 * Unified Boardly AdSlot component.
 *
 * Visibility rules:
 * 1. Logged-out visitors, "Continue without an account" guests, and free users ALWAYS
 *    see an enabled slot on allowed pages (Google ad, Boardly offer, or "Ad space" placeholder).
 * 2. Only an active Pro or Plus member (after plan has finished loading) with the
 *    Ad-free toggle ON sees nothing (`null`). While plan is loading, shows reserved "Ad space".
 * 3. Controlled live from /admin/ads with safe built-in defaults (all slots ON by default).
 * 4. `store_rows` is strictly Boardly-only (never Google).
 * 5. Until AdSense approves (blank slot ID, script load failure, ad-blocker collapse, unfilled, or 3s timeout),
 *    Google slots switch automatically to their fallback Boardly offer (or "Ad space" placeholder).
 * 6. Two slots on the same page never show the same Boardly offer.
 * 7. Only one ad/offer is visible at a time on mobile screens (<768px).
 * 8. Add `?adsdebug=1` to any URL to inspect every slot's ID, mode, viewer, state, and hidden reason.
 */
export const AdSlot = memo(function AdSlot({
  slotId,
  instanceKey = 'main',
  format = 'auto',
  className = '',
  wrapperClassName = '',
  compact = false,
  previewConfig,
  previewSlotOverride,
  isPreview = false,
  previewAs = 'guest',
}: AdSlotProps) {
  const location = useLocation();
  const reactId = useId();
  const { user, isGuest } = useAuth();
  const {
    showAds,
    loading: planLoading,
    isPaidAdFree: rawIsPaidAdFree,
    plan,
    planSource,
  } = useShowAds();
  const { config: liveConfig } = useAdsConfig();

  const isDebugMode = useMemo(() => {
    if (isPreview) return false;
    try {
      return new URLSearchParams(location.search).get('adsdebug') === '1';
    } catch {
      return false;
    }
  }, [isPreview, location.search]);

  const config = previewConfig || liveConfig;
  const canonicalSlotId = (slotId in DEFAULT_AD_SLOTS ? slotId : null) as AdSlotId | null;
  const slotConfig: AdSlotConfig | null = previewSlotOverride
    ? previewSlotOverride
    : canonicalSlotId
    ? config.slots[canonicalSlotId] || DEFAULT_AD_SLOTS[canonicalSlotId]
    : null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const insRef = useRef<HTMLModElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Track mobile single-ad visibility permission (defaults to true)
  const [mobileAllowed, setMobileAllowed] = useState(true);
  // Track Google AdSense fill state: 'idle' | 'pending' | 'filled' | 'unfilled'
  const [googleState, setGoogleState] = useState<'idle' | 'pending' | 'filled' | 'unfilled'>('idle');
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoRetryCount, setVideoRetryCount] = useState(0);

  const isWaitingForPlan = !isPreview && planLoading;
  const isPaidAdFree = !isPreview && rawIsPaidAdFree;

  const isRouteBlocked = !isPreview && isAdBlockedRoute(location.pathname);
  const isGloballyEnabled = isPreview || config.adsEnabled;
  const isSlotEnabled = Boolean(slotConfig && (isPreview || slotConfig.enabled));

  // Determine exact hidden reason (if any) for both render guard and ?adsdebug=1
  let hiddenReason: string | null = null;
  if (!slotConfig) {
    hiddenReason = `unknown_slot_id (${slotId})`;
  } else if (isRouteBlocked) {
    hiddenReason = `route_blocked (${location.pathname})`;
  } else if (isWaitingForPlan) {
    hiddenReason = 'loading_plan_and_ad_free_setting';
  } else if (isPaidAdFree || !showAds) {
    hiddenReason = `paid_ad_free (plan=${plan}, source=${planSource}, adFree=ON)`;
  } else if (!isGloballyEnabled) {
    hiddenReason = 'global_ads_off';
  } else if (!isSlotEnabled) {
    hiddenReason = 'slot_disabled_in_admin';
  }

  const shouldHideCompletely = !isPreview && hiddenReason !== null;

  // Enforce store_rows strictly Boardly-only
  const effectiveMode = slotConfig?.boardlyOnly ? 'boardly' : slotConfig?.mode || 'boardly';
  const cleanGoogleSlotId =
    slotConfig && !slotConfig.boardlyOnly ? sanitizeGoogleSlotId(slotConfig.googleSlotId) : '';
  const cleanPublisherId = sanitizePublisherId(config.publisherId);

  const isPreviewHost = isPreviewAdHost();
  const isLandingVideoSlot = slotConfig?.id === 'home_faq';
  const cleanLandingVideoUrl = isLandingVideoSlot ? (config.landingAdVideoUrl || '').trim() : '';
  const canAttemptGoogle =
    showAds &&
    !shouldHideCompletely &&
    !isWaitingForPlan &&
    !isPreview &&
    !isPreviewHost &&
    !isLandingVideoSlot &&
    (effectiveMode === 'google' || effectiveMode === 'auto') &&
    Boolean(cleanGoogleSlotId) &&
    Boolean(cleanPublisherId);

  // When waiting for AdSense approval (no Google Slot ID yet, script failed, ad-blocker collapsed, or unfilled/timeout),
  // BOTH 'auto' and 'google' modes fall back to the Boardly offer if fallbackToBoardly is ON!
  const needsBoardlyOffer =
    !shouldHideCompletely &&
    !isWaitingForPlan &&
    (effectiveMode === 'boardly' ||
      isPreview ||
      ((effectiveMode === 'auto' || effectiveMode === 'google') &&
        config.fallbackToBoardly &&
        (!canAttemptGoogle || googleState === 'unfilled')));

  // Resolve a page-unique active Boardly offer when showing Boardly offer
  const pageKey = isPreview ? '__admin_preview__' : location.pathname;
  const slotClaimKey = `${slotId}::${instanceKey}::${reactId}`;
  const preferredOfferId =
    effectiveMode === 'boardly'
      ? slotConfig?.primaryOfferId || 'early'
      : slotConfig?.fallbackOfferId || slotConfig?.primaryOfferId || 'early';

  const pickPreviewOffer = (): BoardlyOffer | null => {
    const exact = config.offers.find((o) => o.id === preferredOfferId);
    if (exact && isOfferActiveNow(exact)) return exact;
    return config.offers.find((o) => isOfferActiveNow(o)) || exact || config.offers[0] || null;
  };

  const [resolvedOffer, setResolvedOffer] = useState<BoardlyOffer | null>(() => {
    if (!needsBoardlyOffer || !slotConfig) return null;
    if (isPreview) return pickPreviewOffer();
    return claimUniqueOfferForPage(pageKey, slotClaimKey, preferredOfferId, config.offers);
  });

  // Keep page offer claim strictly synchronized with mount/unmount (React 18 StrictMode safe)
  useEffect(() => {
    if (!needsBoardlyOffer || !slotConfig) {
      setResolvedOffer(null);
      if (!isPreview) {
        releaseOfferClaimForPage(pageKey, slotClaimKey);
      }
      return;
    }

    if (isPreview) {
      const exact = config.offers.find((o) => o.id === preferredOfferId);
      const picked =
        exact && isOfferActiveNow(exact)
          ? exact
          : config.offers.find((o) => isOfferActiveNow(o)) || exact || config.offers[0] || null;
      setResolvedOffer(picked);
      return;
    }

    const claimed = claimUniqueOfferForPage(
      pageKey,
      slotClaimKey,
      preferredOfferId,
      config.offers
    );
    setResolvedOffer(claimed);

    return () => {
      releaseOfferClaimForPage(pageKey, slotClaimKey);
    };
  }, [needsBoardlyOffer, slotConfig, isPreview, config.offers, preferredOfferId, pageKey, slotClaimKey]);

  // Register outer wrapper with mobile single-visible coordinator (outer wrapper NEVER gets display:none)
  useEffect(() => {
    if (isPreview || shouldHideCompletely) {
      setMobileAllowed(true);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    return registerMobileAdSlot(slotClaimKey, el, (allowed) => {
      setMobileAllowed(allowed);
    });
  }, [isPreview, shouldHideCompletely, slotClaimKey]);

  // Load Google AdSense and watch fill status (including cosmetic ad-blocker collapse + 3s timeout)
  useEffect(() => {
    if (!canAttemptGoogle) {
      setGoogleState('idle');
      return;
    }

    if (typeof window !== 'undefined' && window.__boardlyAdSenseFailed) {
      setGoogleState('unfilled');
      return;
    }

    let cancelled = false;
    let rafId: number | null = null;
    let fillTimeoutId: number | null = null;
    let scriptTimeoutId: number | null = null;
    let observer: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const clearTimers = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (fillTimeoutId !== null) {
        window.clearTimeout(fillTimeoutId);
        fillTimeoutId = null;
      }
      if (scriptTimeoutId !== null) {
        window.clearTimeout(scriptTimeoutId);
        scriptTimeoutId = null;
      }
    };

    const markUnfilled = () => {
      if (cancelled) return;
      clearTimers();
      setGoogleState('unfilled');
    };

    const isCosmeticallyBlocked = (el: HTMLModElement | null): boolean => {
      if (!el || typeof window === 'undefined') return false;
      try {
        const cs = window.getComputedStyle(el);
        return cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0';
      } catch {
        return false;
      }
    };

    const isLaidOutVisible = (el: HTMLModElement | null): boolean => {
      if (!el || !el.isConnected) return false;
      if (isCosmeticallyBlocked(el)) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0;
    };

    const checkStatus = (): boolean => {
      const insEl = insRef.current;
      if (!insEl || cancelled) return false;
      if (isCosmeticallyBlocked(insEl)) {
        markUnfilled();
        return true;
      }
      const status = insEl.getAttribute('data-ad-status');
      if (status === 'filled') {
        clearTimers();
        setGoogleState('filled');
        return true;
      }
      if (status === 'unfilled') {
        markUnfilled();
        return true;
      }
      return false;
    };

    const startFillTimeout = () => {
      if (cancelled || fillTimeoutId !== null) return;
      fillTimeoutId = window.setTimeout(() => {
        fillTimeoutId = null;
        if (cancelled) return;
        const insEl = insRef.current;
        if (!insEl || isCosmeticallyBlocked(insEl)) {
          setGoogleState('unfilled');
          return;
        }
        const status = insEl.getAttribute('data-ad-status');
        if (status === 'filled') {
          setGoogleState('filled');
        } else {
          setGoogleState('unfilled');
        }
      }, GOOGLE_FILL_TIMEOUT_MS);
    };

    const tryPushAdUnit = () => {
      if (cancelled) return;
      const insEl = insRef.current;
      if (!insEl || !insEl.isConnected) return;

      if (checkStatus()) return;

      // Do not push while hidden by responsive CSS (e.g., desktopOnly or mobileAllowed=false)
      if (!isLaidOutVisible(insEl)) {
        return;
      }

      // Already pushed or claimed by AdSense — just monitor status/timeout
      if (
        insEl.getAttribute('data-adsbygoogle-status') ||
        insEl.dataset.boardlyPushed === '1'
      ) {
        startFillTimeout();
        return;
      }

      // Never push before the AdSense runtime has actually loaded (prevents orphaned queue items)
      if (!isAdSenseRuntimeReady() && adSenseScriptStatus !== 'loaded') {
        return;
      }

      // Verify DOM has an uninitialized ins.adsbygoogle before calling push({})
      if (
        !insEl.classList.contains('adsbygoogle') ||
        document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])').length === 0
      ) {
        checkStatus();
        return;
      }

      insEl.dataset.boardlyPushed = '1';
      startFillTimeout();
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        markUnfilled();
      }
    };

    const schedulePush = () => {
      if (cancelled) return;
      if (scriptTimeoutId !== null) {
        window.clearTimeout(scriptTimeoutId);
        scriptTimeoutId = null;
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      // Defer push to the next animation frame so React StrictMode unmount/remount cancels safely
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        tryPushAdUnit();
      });
    };

    const initialIns = insRef.current;
    if (initialIns && initialIns.getAttribute('data-ad-status') === 'filled') {
      setGoogleState('filled');
      return;
    }

    setGoogleState((prev) => (prev === 'filled' ? 'filled' : 'pending'));

    if (initialIns && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        if (checkStatus() && observer) {
          observer.disconnect();
        }
      });
      observer.observe(initialIns, {
        attributes: true,
        attributeFilter: ['data-ad-status', 'style', 'class'],
      });
    }

    // Watch the <ins> container so slots hidden by responsive CSS (desktopOnly or max-md:hidden) initialize once visible
    const resizeTarget = initialIns?.parentElement || containerRef.current;
    if (resizeTarget && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (cancelled) return;
        const insEl = insRef.current;
        if (
          insEl &&
          insEl.dataset.boardlyPushed !== '1' &&
          !insEl.getAttribute('data-adsbygoogle-status') &&
          (isAdSenseRuntimeReady() || adSenseScriptStatus === 'loaded') &&
          isLaidOutVisible(insEl)
        ) {
          schedulePush();
        }
      });
      resizeObserver.observe(resizeTarget);
    }

    // Fallback timeout if the AdSense script request stalls silently without firing load or error
    if (!isAdSenseRuntimeReady() && adSenseScriptStatus !== 'loaded') {
      scriptTimeoutId = window.setTimeout(() => {
        scriptTimeoutId = null;
        if (!cancelled && !isAdSenseRuntimeReady() && adSenseScriptStatus !== 'loaded') {
          markUnfilled();
        }
      }, GOOGLE_SCRIPT_LOAD_TIMEOUT_MS);
    }

    const cancelScheduledScript = scheduleAdSenseScriptLoad(
      cleanPublisherId,
      schedulePush,
      markUnfilled
    );

    return () => {
      cancelled = true;
      cancelScheduledScript();
      clearTimers();
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [canAttemptGoogle, cleanGoogleSlotId, cleanPublisherId, format]);

  const viewerRoleLabel = !user?.uid
    ? 'logged_out'
    : isGuest || user.uid.startsWith('guest_')
    ? 'guest'
    : planLoading
    ? 'loading_plan'
    : plan;

  useEffect(() => {
    if (!isDebugMode) return;
    console.info('[AdSlot debug]', {
      slotId: String(slotId),
      path: location.pathname,
      mode: effectiveMode,
      viewer: viewerRoleLabel,
      hiddenReason,
      googleState,
      offerId: resolvedOffer?.id || null,
      mobileAllowed,
    });
  }, [
    isDebugMode,
    slotId,
    location.pathname,
    effectiveMode,
    viewerRoleLabel,
    hiddenReason,
    googleState,
    resolvedOffer?.id,
    mobileAllowed,
  ]);

  // ================= ADMIN PHONE PREVIEW (ALL MODES + VIEW-AS SWITCH) =================
  // Ignores viewer's own plan, ad-free toggle, master switch, slot enabled state, desktopOnly, and route rules.
  if (isPreview && slotConfig) {
    if (previewAs === 'paid') {
      return (
        <div
          data-boardly-slot-preview={slotConfig.id}
          className={`w-full min-w-0 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/35 min-h-[96px] p-4 flex flex-col items-center justify-center text-center gap-1 ${className}`}
        >
          <span
            className="text-xs font-semibold text-[var(--text-secondary)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Hidden: ad-free is on
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Pro / Plus members with ad-free enabled see an empty area here.
          </span>
        </div>
      );
    }

    const previewOffer = resolvedOffer || pickPreviewOffer();
    const activePromoEndDate = config.promoCode?.active ? config.promoCode.endDate : null;

    if (effectiveMode === 'boardly') {
      return previewOffer ? (
        <PromoBanner
          offer={previewOffer}
          slotId={slotConfig.id}
          className={className}
          compact={compact}
          promoEndDate={activePromoEndDate}
          isPreview
        />
      ) : (
        <AdSpacePlaceholder slotId={slotConfig.id} compact={compact} />
      );
    }

    if (cleanGoogleSlotId) {
      return (
        <div
          data-boardly-slot-preview={slotConfig.id}
          className={`w-full min-w-0 flex flex-col gap-1.5 ${className}`}
        >
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
          {config.fallbackToBoardly && previewOffer && (
            <div className="pt-2">
              <p className="text-[11px] text-[var(--text-muted)] mb-1">
                Fallback if Google has no ad:
              </p>
              <PromoBanner
                offer={previewOffer}
                slotId={slotConfig.id}
                compact={compact}
                promoEndDate={activePromoEndDate}
                isPreview
              />
            </div>
          )}
        </div>
      );
    }

    if (config.fallbackToBoardly && previewOffer) {
      return (
        <PromoBanner
          offer={previewOffer}
          slotId={slotConfig.id}
          className={className}
          compact={compact}
          promoEndDate={activePromoEndDate}
          isPreview
        />
      );
    }

    return <AdSpacePlaceholder slotId={slotConfig.id} compact={compact} />;
  }

  // Hidden completely for normal visitors; visible as a diagnostic box when ?adsdebug=1 is active (including for admins/Plus)
  if (shouldHideCompletely || !slotConfig) {
    if (!isDebugMode) {
      return null;
    }
    return (
      <div
        data-boardly-slot-debug={String(slotId)}
        className={`w-full min-w-0 rounded-xl border-2 border-dashed border-rose-500/80 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-500 dark:text-rose-300 ${className}`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <div className="font-bold text-rose-600 dark:text-rose-400">
          [ADS DEBUG · HIDDEN] slot={String(slotId)} · mode={effectiveMode} · viewer={viewerRoleLabel}
        </div>
        <div className="opacity-90 mt-0.5">reason: {hiddenReason || 'missing_slot_config'}</div>
      </div>
    );
  }

  // Desktop-only slot wrapper class (unless debug mode is inspecting it)
  const desktopOnlyClass = slotConfig.desktopOnly && !isDebugMode ? 'hidden md:block' : '';

  // Render Google AdSense while pending or filled
  const showGoogleUnit = canAttemptGoogle && googleState !== 'unfilled';

  const debugStateLabel = isWaitingForPlan
    ? 'loading_plan_placeholder'
    : showGoogleUnit
    ? `google_${googleState}`
    : resolvedOffer
    ? `boardly_offer (${resolvedOffer.id})`
    : 'ad_space_placeholder';

  const debugSubNote = !mobileAllowed
    ? 'hidden_on_mobile_viewport (<768px second slot)'
    : slotConfig.desktopOnly
    ? 'desktop_only (hidden <768px)'
    : effectiveMode !== 'boardly' && !cleanGoogleSlotId
    ? 'google_slot_id_empty -> fallback'
    : googleState === 'unfilled'
    ? 'google_unfilled -> fallback'
    : 'visible';

  const activePromoEndDate = config.promoCode?.active ? config.promoCode.endDate : null;
  const landingVideoMode = resolveLandingAdVideoMode({
    videoUrl: cleanLandingVideoUrl,
    loadFailed: videoFailed,
  });

  const handleVideoTapPlay = () => {
    const el = videoRef.current;
    if (!el) return;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err) => {
        console.error('[LandingAdVideo] play() failed:', {
          src: cleanLandingVideoUrl,
          name: err?.name,
          message: err?.message,
          err,
        });
        if (err?.name !== 'AbortError' && err?.name !== 'NotAllowedError') {
          setVideoFailed(true);
        }
      });
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    const mediaErr = el.error;
    const codeLabels: Record<number, string> = {
      1: 'MEDIA_ERR_ABORTED',
      2: 'MEDIA_ERR_NETWORK (network error, CORS, or private bucket)',
      3: 'MEDIA_ERR_DECODE (corrupt file or decode failure)',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED (404 not found, private bucket/403, CORS, or unsupported format)',
    };
    console.error('[LandingAdVideo] Failed to load video:', {
      src: el.currentSrc || cleanLandingVideoUrl,
      code: mediaErr?.code ?? null,
      reason: mediaErr?.code ? codeLabels[mediaErr.code] || 'UNKNOWN' : 'UNKNOWN',
      message: mediaErr?.message || '',
      networkState: el.networkState,
      readyState: el.readyState,
    });
    setVideoPlaying(false);
    setVideoFailed(true);
  };

  const handleVideoRetry = () => {
    setVideoFailed(false);
    setVideoPlaying(false);
    setVideoRetryCount((c) => c + 1);
    window.setTimeout(() => {
      const el = videoRef.current;
      if (!el) return;
      el.load();
      const p = el.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    }, 0);
  };

  const innerContent = isWaitingForPlan ? (
    <AdSpacePlaceholder
      slotId={slotConfig.id}
      compact={compact || Boolean(slotConfig.desktopOnly)}
      loading
    />
  ) : isLandingVideoSlot ? (
    <aside
      aria-label="Boardly showcase video"
      data-boardly-slot={slotConfig.id}
      data-landing-ad-mode={landingVideoMode}
      className="w-full min-w-0 flex flex-col gap-1.5"
    >
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0b0d13]">
        {landingVideoMode === 'animated' ? (
          <LandingPromoAnimation />
        ) : landingVideoMode === 'error' ? (
          <div className="relative w-full aspect-[16/9] max-h-[360px] overflow-hidden bg-[#0b0d13]">
            <img
              src="/boardly-ad-poster.jpg"
              alt="Boardly video poster"
              loading="lazy"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-4 text-center">
              <span className="text-sm font-semibold text-white">
                Video could not load
              </span>
              <button
                type="button"
                onClick={handleVideoRetry}
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#0b0d13] shadow hover:bg-white/90 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full bg-[#0b0d13]">
            <video
              key={`${cleanLandingVideoUrl}:${videoRetryCount}`}
              ref={videoRef}
              src={cleanLandingVideoUrl}
              poster="/boardly-ad-poster.jpg"
              controls
              playsInline
              preload="metadata"
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => setVideoPlaying(false)}
              onError={handleVideoError}
              className="w-full max-h-[420px] object-cover block bg-[#0b0d13]"
            />
            {!videoPlaying && (
              <button
                type="button"
                onClick={handleVideoTapPlay}
                aria-label="Play video"
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors cursor-pointer"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#0b0d13] shadow-lg transition-transform hover:scale-105">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-0.5 fill-current">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  ) : showGoogleUnit ? (
    <aside
      aria-label="Sponsored placement"
      data-boardly-slot={slotConfig.id}
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
          key={`${cleanPublisherId}:${cleanGoogleSlotId}:${format}`}
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
      promoEndDate={activePromoEndDate}
    />
  ) : (
    <AdSpacePlaceholder
      slotId={slotConfig.id}
      compact={compact || Boolean(slotConfig.desktopOnly)}
    />
  );

  // Outer containerRef NEVER receives display:none so IntersectionObserver always measures cleanly on mobile
  const renderedSlot = (
    <div
      ref={containerRef}
      data-boardly-slot={slotConfig.id}
      className={`boardly-ad-contain w-full min-w-0 ${desktopOnlyClass} ${className} ${
        isDebugMode
          ? 'rounded-2xl border-2 border-dashed border-emerald-500/85 bg-emerald-500/[0.04] p-2'
          : ''
      }`}
    >
      {isDebugMode && (
        <div
          className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>[ADS DEBUG] slot={slotConfig.id}</span>
          <span>· mode={effectiveMode}</span>
          <span>· viewer={viewerRoleLabel}</span>
          <span>· state={debugStateLabel}</span>
          <span>· {debugSubNote}</span>
        </div>
      )}
      <div className={!mobileAllowed && !isDebugMode ? 'max-md:hidden' : ''}>{innerContent}</div>
    </div>
  );

  return wrapperClassName ? <div className={wrapperClassName}>{renderedSlot}</div> : renderedSlot;
});

export default AdSlot;
