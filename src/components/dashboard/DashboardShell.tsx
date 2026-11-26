import { useOutlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAuthenticated } from '@/utils/homeUrl';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { LegalUpdateNoticeBanner } from '@/components/auth/LegalUpdateNoticeBanner';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';
import { PageMeta } from '@/components/ui/PageMeta';
import { BoardlySuspenseBoundary } from '@/components/ui/BoardlyLoader';
import { scheduleIdleTabPrefetch } from '@/lib/routePrefetch';
import { perfMarkEnd } from '@/lib/perfMetrics';
import React, { Suspense, useEffect, useState } from 'react';
import { ensureWelcomeNotificationForUser } from '@/services/notificationService';
import { safetyCleanupScrollLocks } from '@/utils/scrollLock';
import { UserPlus, X } from 'lucide-react';
import {
  buildFullPath,
  buildLoginRedirectUrl,
  evaluateDashboardRouteAccess,
  persistPostLoginRedirect,
} from '@/utils/routeGuards';

const GuestUpgradeModal = React.lazy(() =>
  import('@/components/auth/GuestUpgradeModal').then((m) => ({ default: m.GuestUpgradeModal }))
);

function SingleSuspenseOutlet() {
  const currentOutlet = useOutlet();
  return <BoardlySuspenseBoundary variant="page">{currentOutlet}</BoardlySuspenseBoundary>;
}

export function DashboardShell() {
  const {
    user,
    profile,
    isGuest,
    profileLoading,
    authStatus,
    isSessionVerified,
    otpVerificationState,
    isSigningOut,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = isUserAuthenticated(user, profileLoading, authStatus);
  const [guestNoteDismissed, setGuestNoteDismissed] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Safety cleanup on dashboard mount & route change to clear any leftover scroll lock and finish tab timing
  useEffect(() => {
    safetyCleanupScrollLocks();
    perfMarkEnd('tab_switch', { path: location.pathname });
    perfMarkEnd('login_to_dashboard', { path: location.pathname });
  }, [location.pathname]);

  const isProfileRoute =
    location.pathname === '/profile' ||
    location.pathname.startsWith('/profile/') ||
    location.pathname.startsWith('/dashboard/profile');
  const isSettingsRoute =
    location.pathname === '/settings' ||
    location.pathname.startsWith('/settings/') ||
    location.pathname === '/dashboard/settings' ||
    location.pathname.startsWith('/dashboard/settings/') ||
    location.pathname === '/dashboard/plan' ||
    location.pathname === '/dashboard/plans' ||
    location.pathname === '/plans' ||
    location.pathname === '/plan' ||
    location.pathname === '/wallet' ||
    location.pathname === '/checkout';
  const isCommonsRoute =
    location.pathname.startsWith('/dashboard/commons') ||
    location.pathname.startsWith('/commons') ||
    location.pathname === '/saved';
  const isAiRoute =
    location.pathname === '/dashboard/ai' || location.pathname.startsWith('/dashboard/ai/');
  const searchParams = new URLSearchParams(location.search);
  const isInsideChatRoute =
    /^\/(dashboard\/)?messages\/[^/]+/.test(location.pathname) ||
    ((location.pathname === '/dashboard/messages' || location.pathname === '/messages') &&
      Boolean(searchParams.get('uid') || searchParams.get('conversationId')));
  const hideBottomNavSpace = isSettingsRoute || isAiRoute || isInsideChatRoute;

  useEffect(() => {
    if (user?.uid && isSessionVerified && !isGuest) {
      void ensureWelcomeNotificationForUser(user.uid);
    }
  }, [user?.uid, isSessionVerified, isGuest]);

  // Schedule idle prefetching of core bottom-dock tabs after first paint
  useEffect(() => {
    scheduleIdleTabPrefetch(user?.uid);
  }, [user?.uid]);

  // Helper: map public-equivalent /dashboard/* paths to their public routes for logged-out visitors
  const getPublicEquivalentForLoggedOut = (pathname: string): string | null => {
    const lower = pathname.toLowerCase();
    if (
      lower === '/dashboard/store' ||
      lower.startsWith('/dashboard/store/') ||
      lower === '/dashboard/commons' ||
      lower.startsWith('/dashboard/commons/') ||
      lower === '/dashboard/formulas' ||
      lower.startsWith('/dashboard/formulas/') ||
      lower === '/dashboard/formula-vault' ||
      lower.startsWith('/dashboard/formula-vault/') ||
      lower === '/dashboard/grand-line' ||
      lower.startsWith('/dashboard/grand-line/') ||
      lower === '/dashboard/leaderboard' ||
      lower.startsWith('/dashboard/leaderboard/') ||
      lower === '/dashboard/captains' ||
      lower.startsWith('/dashboard/captains/') ||
      lower === '/dashboard/rewards' ||
      lower.startsWith('/dashboard/rewards/')
    ) {
      return pathname.replace(/^\/dashboard/i, '') || '/';
    }
    return null;
  };

  const signingOutNow =
    isSigningOut ||
    (typeof window !== 'undefined' && Boolean((window as any).__boardlySigningOut));

  const publicEquivalent = getPublicEquivalentForLoggedOut(location.pathname);
  const routeDecision = evaluateDashboardRouteAccess({
    authStatus,
    isAuthenticated,
    profileLoading,
    hasUser: Boolean(user),
    isGuest,
    otpStatus: otpVerificationState.status,
    otpPurpose: otpVerificationState.purpose,
    isSessionVerified,
    isSigningOut: signingOutNow,
    publicEquivalent,
  });

  useEffect(() => {
    if (signingOutNow) {
      return;
    }
    if (routeDecision.action === 'redirect_public') {
      navigate(`${routeDecision.target}${location.search}${location.hash}`, { replace: true });
      return;
    }
    if (routeDecision.action === 'redirect_login') {
      const target = buildFullPath(location.pathname, location.search, location.hash);
      persistPostLoginRedirect(target);
      navigate(buildLoginRedirectUrl(location.pathname, location.search, location.hash), {
        replace: true,
      });
    }
  }, [
    signingOutNow,
    routeDecision,
    navigate,
    location.pathname,
    location.search,
    location.hash,
  ]);

  // Route guard: Logged-out users visiting protected routes are redirected to login with exact return URL
  if (routeDecision.action === 'redirect_login_clean') {
    return <Navigate to="/login" replace />;
  }
  if (routeDecision.action === 'redirect_public') {
    return <Navigate to={`${routeDecision.target}${location.search}${location.hash}`} replace />;
  }
  if (routeDecision.action === 'redirect_login' || routeDecision.action === 'redirect_verify_email') {
    const target = buildFullPath(location.pathname, location.search, location.hash);
    persistPostLoginRedirect(target);
    const dest =
      routeDecision.action === 'redirect_verify_email'
        ? '/verify-email'
        : buildLoginRedirectUrl(location.pathname, location.search, location.hash);
    return <Navigate to={dest} replace />;
  }

  // NEVER return null or block with a full-screen startup gate — always render shell, route skeleton/cache, and bottom nav immediately
  return (
    <div className="min-h-[100dvh] flex flex-col antialiased overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
      <PageMeta
        title="Student Cockpit — Boardly"
        description="Private Boardly student dashboard and practice cockpit."
        noindex={true}
      />
      {!isGuest && <VerificationBanner />}
      {!isProfileRoute && !isCommonsRoute && !isSettingsRoute && <DashboardTopBar />}
      {!isGuest && <LegalUpdateNoticeBanner />}

      {/* Small non-blocking note for guests (Part B Rule 3) */}
      {isGuest && !guestNoteDismissed && (
        <div className="max-w-[1400px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-2">
          <div className="px-3.5 py-2 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
            <span>
              Signed in as guest (<strong className="text-[var(--text)] font-mono">@{profile?.username || user?.displayName || 'guest'}</strong>). Clearing browser data means you cannot return unless you upgrade.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-[#D71921] text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <UserPlus size={12} />
                <span>Create account</span>
              </button>
              <button
                type="button"
                onClick={() => setGuestNoteDismissed(true)}
                className="p-1 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                aria-label="Dismiss guest notice"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container — full viewport width centered up to 1400px, ad-free dashboard cockpit */}
      <main
        className={`flex-1 w-full min-w-0 box-border overflow-x-clip mx-auto flex flex-col ${
          isSettingsRoute
            ? 'max-w-none p-0'
            : isProfileRoute
            ? 'max-w-none px-0 pt-0'
            : 'max-w-[1400px] px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6'
        } ${hideBottomNavSpace ? '' : 'dashboard-main-scroll'}`}
      >
        <DashboardErrorBoundary fallbackTitle="Cockpit Section Error">
          <SingleSuspenseOutlet />
        </DashboardErrorBoundary>
      </main>

      {/* Unified Student Pill Navigation — hidden on Settings-area pages (Settings, Account, Security, Privacy, Plans and billing) */}
      {!isSettingsRoute && <DashboardBottomNav />}

      {upgradeModalOpen && (
        <Suspense fallback={null}>
          <GuestUpgradeModal
            isOpen={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default DashboardShell;
