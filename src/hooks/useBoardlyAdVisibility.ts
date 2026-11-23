import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useAdsConfig } from '@/services/adsConfigService';

/**
 * Routes where NO Boardly promos/strips/cards should appear
 * (auth, checkout/pricing, legal, admin, settings, profile, active exam runners).
 */
const NEVER_SHOW_PREFIXES = [
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/verify-email',
  '/pricing',
  '/plan',
  '/plans',
  '/dashboard/plan',
  '/dashboard/plans',
  '/wallet',
  '/checkout',
  '/admin',
  '/superadmin',
  '/privacy',
  '/terms',
  '/contact',
  '/settings',
  '/dashboard/settings',
  '/profile',
  '/dashboard/profile',
  '/u/',
  '/404',
  '/not-found',
  '/gone',
];

function isSensitiveNoAdRoute(pathnameRaw: string): boolean {
  const path =
    String(pathnameRaw || '/')
      .toLowerCase()
      .replace(/\/+$/, '') || '/';

  for (const prefix of NEVER_SHOW_PREFIXES) {
    const cleanPrefix = prefix.replace(/\/+$/, '');
    if (path === cleanPrefix || path.startsWith(`${cleanPrefix}/`)) {
      return true;
    }
  }

  // Active test runners (never interrupt an exam in progress!)
  if (/^\/test\/[^/]+$/.test(path)) return true;
  if (/^\/(grand-line\/)?tests?\/[^/]+\/(run|redo|retake)$/.test(path)) return true;

  return false;
}

export interface BoardlyAdVisibilityState {
  canShow: boolean;
  isPromoActive: boolean;
  promoEndDate: string | null;
  pathname: string;
}

/**
 * Shared visibility hook for Boardly-owned ads (strip, poster, compact cards).
 * Mirrors AdSlot's exact Pro/Plus ad-free rules:
 * - Active Pro/Plus members with Ad-free ON NEVER see ads.
 * - While a signed-in non-guest user's plan is still loading, waits cleanly so ads never flash to Pro/Plus.
 * - Logged-out visitors, guests ("Continue without an account"), and free users see ads when enabled.
 * - Respects global admin `config.adsEnabled` master switch and `config.promoCode.active` (EARLY21).
 */
export function useBoardlyAdVisibility(): BoardlyAdVisibilityState {
  const location = useLocation();
  const { user, profile, isGuest } = useAuth();
  const { isPaid, loading: planLoading, plan } = useEffectivePlan();
  const { config } = useAdsConfig();

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
      if (cached === '1') setLocalAdFreeOverride(true);
      else if (cached === '0') setLocalAdFreeOverride(false);
      else setLocalAdFreeOverride(null);
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
  const isWaitingForPlan = isSignedInNonGuest && planLoading;
  const isActivePaidMember = Boolean(
    isSignedInNonGuest && !planLoading && isPaid && (plan === 'pro' || plan === 'plus')
  );
  const isPaidAdFree = isActivePaidMember && adFreeToggleOn;

  const promoEndDate = config.promoCode?.active ? config.promoCode.endDate : null;
  const isPromoExpired = Boolean(
    promoEndDate &&
      !Number.isNaN(Date.parse(`${promoEndDate}T23:59:59.999Z`)) &&
      Date.now() > Date.parse(`${promoEndDate}T23:59:59.999Z`)
  );
  const isPromoActive = Boolean(config.promoCode?.active && !isPromoExpired);

  const canShow =
    Boolean(config.adsEnabled) &&
    !isWaitingForPlan &&
    !isPaidAdFree &&
    !isSensitiveNoAdRoute(location.pathname);

  return {
    canShow,
    isPromoActive,
    promoEndDate: isPromoActive ? promoEndDate : null,
    pathname: location.pathname,
  };
}

export default useBoardlyAdVisibility;
