import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAuthenticated } from '@/utils/homeUrl';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';
import { PageMeta } from '@/components/ui/PageMeta';
import { BoardlySuspenseBoundary } from '@/components/ui/BoardlyLoader';
import { LineLoader } from '@/components/ui/LineLoader';
import { useEffect } from 'react';
import { ensureWelcomeNotificationForUser } from '@/services/notificationService';

export function DashboardShell() {
  const { user, profileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = isUserAuthenticated(user, profileLoading);

  const isProfileRoute = location.pathname.startsWith('/dashboard/profile');
  const isCrewRoute = location.pathname.startsWith('/dashboard/crew');
  const isCommonsRoute =
    location.pathname.startsWith('/dashboard/commons') ||
    location.pathname.startsWith('/commons') ||
    location.pathname === '/messages' ||
    location.pathname === '/saved';

  useEffect(() => {
    if (user?.uid) {
      void ensureWelcomeNotificationForUser(user.uid);
    }
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

  if (profileLoading && !user && !isAuthenticated) {
    return <LineLoader context="dashboard" variant="page" />;
  }

  // Route guard: Logged-out users visiting protected routes are redirected to login with exact return URL
  if (!isAuthenticated && !profileLoading && !user) {
    const target = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  // NEVER return null or blank screen — always render shell and bottom nav immediately
  return (
    <div
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] antialiased overflow-x-hidden"
    >
      <PageMeta
        title="Student Cockpit — Boardly"
        description="Private Boardly student dashboard and practice cockpit."
        noindex={true}
      />
      <VerificationBanner />
      {!isProfileRoute && !isCommonsRoute && !isCrewRoute && <DashboardTopBar />}

      {/* Main Content Container */}
      <main
        className={`flex-1 w-full min-w-0 box-border overflow-x-hidden mx-auto flex flex-col transition-all duration-200 ${
          isCrewRoute
            ? 'max-w-none p-0'
            : isProfileRoute
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
      {!isCrewRoute && <DashboardBottomNav />}
    </div>
  );
}

export default DashboardShell;

