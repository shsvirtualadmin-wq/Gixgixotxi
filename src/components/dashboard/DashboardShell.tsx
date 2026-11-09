import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAuthenticated } from '@/utils/homeUrl';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { LegalUpdateNoticeBanner } from '@/components/auth/LegalUpdateNoticeBanner';
import { GuestUpgradeModal } from '@/components/auth/GuestUpgradeModal';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';
import { PageMeta } from '@/components/ui/PageMeta';
import { BoardlySuspenseBoundary } from '@/components/ui/BoardlyLoader';
import { LineLoader } from '@/components/ui/LineLoader';
import { useEffect, useState } from 'react';
import { ensureWelcomeNotificationForUser } from '@/services/notificationService';
import { UserPlus, X } from 'lucide-react';

export function DashboardShell() {
  const { user, profile, isGuest, profileLoading, isSessionVerified, otpVerificationState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = isUserAuthenticated(user, profileLoading);
  const [guestNoteDismissed, setGuestNoteDismissed] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isProfileRoute = location.pathname.startsWith('/dashboard/profile');
  const isCommonsRoute =
    location.pathname.startsWith('/dashboard/commons') ||
    location.pathname.startsWith('/commons') ||
    location.pathname === '/saved';

  useEffect(() => {
    if (user?.uid && isSessionVerified && !isGuest) {
      void ensureWelcomeNotificationForUser(user.uid);
    }
  }, [user?.uid, isSessionVerified, isGuest]);

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

  if (
    (profileLoading && !user && !isAuthenticated) ||
    (user && !isGuest && otpVerificationState.status === 'checking')
  ) {
    return <LineLoader context="dashboard" variant="page" />;
  }

  // Route guard: Logged-out users visiting protected routes are redirected to login with exact return URL
  if (!isAuthenticated && !profileLoading && !user) {
    const target = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  // Route guard: Signed-in non-guest users who have NOT completed the 6-digit verification code step
  if (user && !isGuest && !isSessionVerified) {
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

  // NEVER return null or blank screen — always render shell and bottom nav immediately
  return (
    <div
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] antialiased overflow-x-clip"
    >
      <PageMeta
        title="Student Cockpit — Boardly"
        description="Private Boardly student dashboard and practice cockpit."
        noindex={true}
      />
      {!isGuest && <VerificationBanner />}
      {!isProfileRoute && !isCommonsRoute && <DashboardTopBar />}
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
          isProfileRoute
            ? 'max-w-5xl px-0 sm:px-4 md:px-6 pt-0 sm:pt-4 pb-[calc(24px+env(safe-area-inset-bottom,0px))]'
            : 'max-w-5xl px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-[calc(112px+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <DashboardErrorBoundary fallbackTitle="Cockpit Section Error">
          <BoardlySuspenseBoundary variant="page">
            <Outlet />
          </BoardlySuspenseBoundary>
        </DashboardErrorBoundary>
      </main>

      {/* Unified Student Pill Navigation */}
      <DashboardBottomNav />

      <GuestUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
}

export default DashboardShell;
