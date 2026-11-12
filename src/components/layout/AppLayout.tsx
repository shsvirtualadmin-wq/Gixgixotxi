import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BackgroundCanvas } from '../BackgroundCanvas';
import { VerificationBanner } from '../auth/VerificationBanner';
import { LegalUpdateNoticeBanner } from '../auth/LegalUpdateNoticeBanner';
import { DashboardTopBar } from '../dashboard/DashboardTopBar';
import { DashboardBottomNav } from '../dashboard/DashboardBottomNav';
import { BoardlySuspenseBoundary } from '../ui/BoardlyLoader';

interface AppLayoutProps {
  children?: React.ReactNode;
}

/**
 * AppLayout:
 * The unified signed-in application shell for all signed-in pages:
 * Commons, Dashboard, Notifications, Messages, Streak, Friends, Rewards, Store,
 * Leaderboard, Mock Tests, Profile, Settings (/settings/...), Menu, Cockpit, Crew, Captain.
 * Includes the app header (DashboardTopBar), the bottom nav (where applicable), and NO footer.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { isGuest } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const isProfileRoute =
    pathname.startsWith('/dashboard/profile') || pathname === '/profile/edit';
  const isSettingsRoute =
    pathname.startsWith('/settings') || pathname.startsWith('/dashboard/settings');
  const isCommonsFeedRoute =
    pathname === '/commons' ||
    pathname === '/commons/trending' ||
    pathname === '/commons/following' ||
    pathname.startsWith('/commons/subject/') ||
    pathname === '/commons/new' ||
    pathname.startsWith('/dashboard/commons') ||
    pathname === '/saved';
  const isStoreMainRoute =
    pathname === '/store' ||
    pathname === '/store/get-kobans' ||
    pathname === '/dashboard/store';
  const isCrewOverviewRoute = pathname === '/crew';

  const hideTopBar =
    isProfileRoute || isSettingsRoute || isCommonsFeedRoute || isStoreMainRoute;

  const isFullBleedMain =
    isSettingsRoute || isStoreMainRoute || pathname === '/rewards';

  return (
    <div
      className={`relative min-h-screen flex flex-col antialiased overflow-x-clip ${
        isSettingsRoute
          ? 'bg-[var(--menu-bg)] text-[var(--menu-text)]'
          : pathname === '/rewards'
          ? 'bg-[var(--rw-bg)] text-[var(--rw-text)]'
          : 'bg-[var(--bg)] text-[var(--text)]'
      }`}
    >
      <BackgroundCanvas />
      {!isGuest && <VerificationBanner />}
      {!hideTopBar && <DashboardTopBar />}
      {!isGuest && <LegalUpdateNoticeBanner />}

      <main
        className={`flex-1 w-full min-w-0 box-border overflow-x-hidden mx-auto flex flex-col transition-all duration-200 ${
          isFullBleedMain
            ? 'max-w-none p-0 pb-[var(--sdn-page-pb)]'
            : isProfileRoute
            ? 'max-w-5xl px-0 sm:px-4 md:px-6 pt-0 sm:pt-4 pb-[var(--sdn-page-pb)]'
            : 'max-w-5xl px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-[var(--sdn-page-pb)]'
        }`}
      >
        <BoardlySuspenseBoundary variant="page">
          {children ?? <Outlet />}
        </BoardlySuspenseBoundary>
      </main>

      {!isCrewOverviewRoute && <DashboardBottomNav />}
    </div>
  );
}

export default AppLayout;
