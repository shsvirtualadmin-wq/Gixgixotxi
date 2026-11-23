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
    __boardlyAdSenseFailed?: boolean;
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
  /** Viewer simulation inside /admin/ads phone preview */
  previewAs?: 'guest' | 'free' | 'paid';
}

const ADSENSE_SCRIPT_ID = 'boardly-adsense-script';
const GOOGLE_FILL_TIMEOUT_MS = 3000;

function ensureAdSenseScriptLoaded(publisherId: string, onScriptError?: () => void) {
  if (typeof document === 'undefined') return;
  if (typeof window !== 'undefined' && window.__boardlyAdSenseFailed) {
    onScriptError?.();
    return;
  }

  const cleanPub = sanitizePublisherId(publisherId || ADSENSE_CLIENT_ID);
  if (!cleanPub) return;

  const existing = (document.getElementById(ADSENSE_SCRIPT_ID) ||
    document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    )) as HTMLScriptElement | null;

  if (existing) {
    if (onScriptError) {
      const handleError = () => {
        if (typeof window !== 'undefined') {
          window.__boardlyAdSenseFailed = true;
        }
        onScriptError();
      };
      existing.addEventListener('error', handleError, { once: true });
    }
    return;
  }

  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
    cleanPub
  )}`;
  script.onerror = () => {
    if (typeof window !== 'undefined') {
      window.__boardlyAdSenseFailed = true;
    }
    onScriptError?.();
  };
  document.head.appendChild(script);
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
export function AdSlot({
  slotId,
  instanceKey = 'main',
  format = 'auto',
  className = '',
  compact = false,
  previewConfig,
  previewSlotOverride,
  isPreview = false,
  previewAs = 'guest',
}: AdSlotProps) {
  const location = useLocation();
  const reactId = useId();
  const { user, profile, isGuest } = useAuth();
  const { isPaid, loading: planLoading, plan, source: planSource } = useEffectivePlan();
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
  const hasPushedRef = useRef(false);

  // Track mobile single-ad visibility permission (defaults to true)
  const [mobileAllowed, setMobileAllowed] = useState(true);
  // Track Google AdSense fill state: 'idle' | 'pending' | 'filled' | 'unfilled'
  const [googleState, setGoogleState] = useState<'idle' | 'pending' | 'filled' | 'unfilled'>('idle');

  // Read cached or profile-synced adFreeEnabled preference (scoped strictly to current user UID)
  const [localAdFreeOverride, setLocalAdFreeOverride] = useState<boolean | null>(() => {
    try {
      if (user?.uid && !isGuest && !user.uid.startsWith('guest_')) {
        const cached = localStorage.getItem(`boardly_ad_free_${user.uid}`);
        if (cached === '1') return true;
        if (cached === '0') return false;
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });

  // Reset adFree override whenever the active user changes (login / logout / guest switch)
  useEffect(() => {
    if (!user?.uid || isGuest || user.uid.startsWith('guest_')) {
      setLocalAdFreeOverride(null);
      return;
    }
    if (typeof profile?.adFreeEnabled === 'boolean') {
      setLocalAdFreeOverride(profile.adFreeEnabled);
      return;
    }
    try {
      const cached = localStorage.getItem(`boardly_ad_free_${user.uid}`);
      if (cached === '1') {
        setLocalAdFreeOverride(true);
      } else if (cached === '0') {
        setLocalAdFreeOverride(false);
      } else {
        setLocalAdFreeOverride(null);
      }
    } catch {
      setLocalAdFreeOverride(null);
    }
  }, [user?.uid, isGuest, profile?.adFreeEnabled]);

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

  const isSignedInNonGuest = Boolean(user?.uid && !isGuest && !user.uid.startsWith('guest_'));
  const isWaitingForPlan = !isPreview && isSignedInNonGuest && planLoading;
  // Strictly ONLY active Pro or Plus members (never logged-out, never guest, never loading, never free)
  const isActivePaidMember = Boolean(
    isSignedInNonGuest && !planLoading && isPaid && (plan === 'pro' || plan === 'plus')
  );
  const isPaidAdFree = !isPreview && isActivePaidMember && adFreeToggleOn;

  const isRouteBlocked = !isPreview && isAdBlockedRoute(location.pathname);
  const isGloballyEnabled = isPreview || config.adsEnabled;
  const isSlotEnabled = Boolean(slotConfig && (isPreview || slotConfig.enabled));

  // Determine exact hidden reason (if any) for both render guard and ?adsdebug=1
  let hiddenReason: string | null = null;
  if (!slotConfig) {
    hiddenReason = `unknown_slot_id (${slotId})`;
  } else if (isRouteBlocked) {
    hiddenReason = `route_blocked (${location.pathname})`;
  } else if (isPaidAdFree) {
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

  const canAttemptGoogle =
    !shouldHideCompletely &&
    !isWaitingForPlan &&
    !isPreview &&
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
      hasPushedRef.current = false;
      setGoogleState('idle');
      return;
    }

    let cancelled = false;
    const markUnfilled = () => {
      if (!cancelled) setGoogleState('unfilled');
    };

    ensureAdSenseScriptLoaded(cleanPublisherId, markUnfilled);
    if (typeof window !== 'undefined' && window.__boardlyAdSenseFailed) {
      setGoogleState('unfilled');
      return;
    }

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
    const isCosmeticallyBlocked = (): boolean => {
      if (!insEl || typeof window === 'undefined') return false;
      try {
        const cs = window.getComputedStyle(insEl);
        return cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0';
      } catch {
        return false;
      }
    };

    const checkStatus = (): boolean => {
      if (!insEl || cancelled) return false;
      if (isCosmeticallyBlocked()) {
        setGoogleState('unfilled');
        return true;
      }
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
      observer.observe(insEl, {
        attributes: true,
        attributeFilter: ['data-ad-status', 'style', 'class'],
      });
    }

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      if (!insEl || isCosmeticallyBlocked()) {
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
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [canAttemptGoogle, cleanGoogleSlotId, cleanPublisherId]);

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

    if (effectiveMode === 'boardly') {
      return previewOffer ? (
        <PromoBanner
          offer={previewOffer}
          slotId={slotConfig.id}
          className={className}
          compact={compact}
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

  const innerContent = isWaitingForPlan ? (
    <AdSpacePlaceholder
      slotId={slotConfig.id}
      compact={compact || Boolean(slotConfig.desktopOnly)}
      loading
    />
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
  ) : (
    <AdSpacePlaceholder
      slotId={slotConfig.id}
      compact={compact || Boolean(slotConfig.desktopOnly)}
    />
  );

  // Outer containerRef NEVER receives display:none so IntersectionObserver always measures cleanly on mobile
  return (
    <div
      ref={containerRef}
      data-boardly-slot={slotConfig.id}
      className={`w-full min-w-0 ${desktopOnlyClass} ${className} ${
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
}

export default AdSlot;
