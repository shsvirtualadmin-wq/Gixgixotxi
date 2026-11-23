import { useLocation } from 'react-router-dom';
import { useAdsConfig } from '@/services/adsConfigService';
import { useShowAds } from '@/hooks/useShowAds';

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
 * Delegates all viewer plan, loading, and Ad-free checks to `useShowAds()`:
 * - Active Pro/Plus members with Ad-free ON NEVER see ads.
 * - While auth, profile, or plan is loading, hides ads cleanly so nothing flashes to Pro/Plus users.
 * - Active Pro/Plus members with Ad-free OFF, free users, guests, and logged-out visitors see ads normally.
 * - Respects global admin `config.adsEnabled` master switch and `config.promoCode.active` (EARLY21).
 */
export function useBoardlyAdVisibility(): BoardlyAdVisibilityState {
  const location = useLocation();
  const { showAds } = useShowAds();
  const { config } = useAdsConfig();

  const promoEndDate = config.promoCode?.active ? config.promoCode.endDate : null;
  const isPromoExpired = Boolean(
    promoEndDate &&
      !Number.isNaN(Date.parse(`${promoEndDate}T23:59:59.999Z`)) &&
      Date.now() > Date.parse(`${promoEndDate}T23:59:59.999Z`)
  );
  const isPromoActive = Boolean(config.promoCode?.active && !isPromoExpired);

  const canShow =
    showAds &&
    Boolean(config.adsEnabled) &&
    !isSensitiveNoAdRoute(location.pathname);

  return {
    canShow,
    isPromoActive,
    promoEndDate: isPromoActive ? promoEndDate : null,
    pathname: location.pathname,
  };
}

export default useBoardlyAdVisibility;
