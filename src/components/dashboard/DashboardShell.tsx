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
import { scheduleIdleTabPrefetch } from '@/lib/swrCache';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { ensureWelcomeNotificationForUser } from '@/services/notificationService';
import { safetyCleanupScrollLocks } from '@/utils/scrollLock';
import { UserPlus, X } from 'lucide-react';

const GuestUpgradeModal = React.lazy(() =>
  import('@/components/auth/GuestUpgradeModal').then((m) => ({ default: m.GuestUpgradeModal }))
);

const CACHED_DOCK_PATHS = new Set([
  '/dashboard',
  '/dashboard/commons',
  '/commons',
  '/dashboard/messages',
  '/messages',
  '/dashboard/chat',
  '/dashboard/streaks',
  '/dashboard/crew',
  '/crew/my',
  '/crew/dashboard',
  '/dashboard/notifications',
  '/notifications',
  '/dashboard/practice',
  '/practice',
  '/dashboard/grand-line',
  '/dashboard/store',
  '/store',
]);

const MAX_KEEP_ALIVE_TABS = 6;

function KeepAliveTabsOutlet() {
  const location = useLocation();
  const currentOutlet = useOutlet();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isCacheableTab = CACHED_DOCK_PATHS.has(normalizedPath);
  const cacheRef = useRef<Map<string, React.ReactNode>>(new Map());

  if (isCacheableTab && currentOutlet) {
    // Refresh LRU order and cap at MAX_KEEP_ALIVE_TABS
    if (cacheRef.current.has(normalizedPath)) {
      cacheRef.current.delete(normalizedPath);
    } else if (cacheRef.current.size >= MAX_KEEP_ALIVE_TABS) {
      const oldestKey = cacheRef.current.keys().next().value;
      if (oldestKey) {
        cacheRef.current.delete(oldestKey);
      }
    }
    cacheRef.current.set(normalizedPath, currentOutlet);
  }

  return (
    <>
      {Array.from(cacheRef.current.entries()).map(([tabPath, element]) => {
        const isActive = isCacheableTab && tabPath === normalizedPath;
        return (
          <div
            key={tabPath}
            style={{ display: isActive ? 'contents' : 'none' }}
            aria-hidden={!isActive}
          >
            <BoardlySuspenseBoundary variant="page">{element}</BoardlySuspenseBoundary>
          </div>
        );
      })}
      {!isCacheableTab && (
        <BoardlySuspenseBoundary variant="page">{currentOutlet}</BoardlySuspenseBoundary>
      )}
    </>
  );
}

export function DashboardShell() {
  const { user, profile, isGuest, profileLoading, isSessionVerified, otpVerificationState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = isUserAuthenticated(user, profileLoading);
  const [guestNoteDismissed, setGuestNoteDismissed] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Safety cleanup on dashboard mount & route change to clear any leftover scroll lock
  useEffect(() => {
    safetyCleanupScrollLocks();
  }, [location.pathname]);

  const isProfileRoute = location.pathname.startsWith('/dashboard/profile');
  const isSettingsRoute =
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/dashboard/settings');
  const isCommonsRoute =
    location.pathname.startsWith('/dashboard/commons') ||
    location.pathname.startsWith('/commons') ||
    location.pathname === '/saved';

  useEffect(() => {
    if (user?.uid && isSessionVerified && !isGuest) {
      void ensureWelcomeNotificationForUser(user.uid);
    }
  }, [user?.uid, isSessionVerified, isGuest]);

  // Schedule idle prefetching of core bottom-dock tabs after first paint
  useEffect(() => {
    scheduleIdleTabPrefetch(user?.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (!isAuthenticated && !profileLoading && !user) {
      const target = `${location.pathname}${location.search}${location.hash}`;
      try {
        sessionStorage.setItem('boardly_post_login_redirect', target);
      } catch {
        // ignore storage errors
      }
      navigate(`/login?redirect=${encodeURIComponent(target)}`, { replace: true });
    }
  }, [isAuthenticated, user, profileLoading, navigate, location.pathname, location.search, location.hash]);

  // Route guard: Logged-out users visiting protected routes are redirected to login with exact return URL
  if (!isAuthenticated && !profileLoading && !user) {
    const target = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  // Route guard: Signed-in non-guest users who have NOT completed the 6-digit verification code step
  if (user && !isGuest && otpVerificationState.status !== 'checking' && !isSessionVerified) {
    const target = `${location.pathname}${location.search}${location.hash}`;
    try {
      sessionStorage.setItem('boardly_post_login_redirect', target);
    } catch {
      // ignore storage errors
    }
    const verifyDest =
      otpVerificationState.purpose === 'signup'
        ? '/verify-email'
        : `/login?redirect=${encodeURIComponent(target)}`;
    return <Navigate to={verifyDest} replace />;
  }

  // NEVER return null or block with a full-screen startup gate — always render shell, route skeleton/cache, and bottom nav immediately
  return (
    <div
      className={`min-h-screen flex flex-col antialiased overflow-x-clip ${
        isSettingsRoute
          ? 'bg-[var(--menu-bg)] text-[var(--menu-text)]'
          : 'bg-[var(--bg)] text-[var(--text)]'
      }`}
    >
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
        <div className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-2">
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

      {/* Main Content Container */}
      <main
        className={`flex-1 w-full min-w-0 box-border overflow-x-hidden mx-auto flex flex-col transition-all duration-200 ${
          isSettingsRoute
            ? 'max-w-none p-0'
            : isProfileRoute
              ? 'max-w-5xl px-0 sm:px-4 md:px-6 pt-0 sm:pt-4 pb-[var(--sdn-page-pb)]'
              : 'max-w-5xl px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-[var(--sdn-page-pb)]'
        }`}
      >
        <DashboardErrorBoundary fallbackTitle="Cockpit Section Error">
          <BoardlySuspenseBoundary variant="page">
            <KeepAliveTabsOutlet />
          </BoardlySuspenseBoundary>
        </DashboardErrorBoundary>
      </main>

      {/* Unified Student Pill Navigation */}
      <DashboardBottomNav />

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
