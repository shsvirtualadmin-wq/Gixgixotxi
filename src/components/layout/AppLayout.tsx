import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BackgroundCanvas } from '../BackgroundCanvas';
import { VerificationBanner } from '../auth/VerificationBanner';
import { LegalUpdateNoticeBanner } from '../auth/LegalUpdateNoticeBanner';
import { DashboardTopBar } from '../dashboard/DashboardTopBar';
import { DashboardBottomNav } from '../dashboard/DashboardBottomNav';
import { BoardlySuspenseBoundary } from '../ui/BoardlyLoader';
import { useNavStore } from '@/lib/navStore';

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
  const { isMenuOpen } = useNavStore();

  const isProfileRoute =
    pathname.startsWith('/dashboard/profile') || pathname === '/profile/edit';
  const isSettingsRoute =
    pathname.startsWith('/settings') ||
    pathname.startsWith('/dashboard/settings') ||
    pathname === '/dashboard/plan' ||
    pathname === '/dashboard/plans' ||
    pathname === '/plans' ||
    pathname === '/plan' ||
    pathname === '/wallet' ||
    pathname === '/checkout';
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
  const isAiRoute =
    pathname === '/dashboard/ai' || pathname.startsWith('/dashboard/ai/');
  const searchParams = new URLSearchParams(location.search);
  const isInsideChatRoute =
    /^\/(dashboard\/)?messages\/[^/]+/.test(pathname) ||
    ((pathname === '/dashboard/messages' || pathname === '/messages') &&
      Boolean(searchParams.get('uid') || searchParams.get('conversationId')));

  const hideTopBar =
    isProfileRoute || isSettingsRoute || isCommonsFeedRoute || isStoreMainRoute;

  const isFullBleedMain =
    isSettingsRoute || isStoreMainRoute || pathname === '/rewards';

  const hasDockedBottomNav =
    !isCrewOverviewRoute && !isSettingsRoute && !isAiRoute && !isInsideChatRoute;

  const mainElement = (
    <main
      inert={isMenuOpen ? ('' as unknown as boolean) : undefined}
      aria-hidden={isMenuOpen ? 'true' : undefined}
      className={`flex-1 w-full min-w-0 box-border overflow-x-clip mx-auto flex flex-col transition-all duration-200 ${
        isMenuOpen ? 'pointer-events-none invisible select-none' : ''
      } ${
        isSettingsRoute
          ? 'max-w-none p-0'
          : isFullBleedMain
          ? 'max-w-none px-0 pt-0 dashboard-main-scroll'
          : isProfileRoute
          ? 'max-w-[1400px] px-0 sm:px-4 md:px-6 pt-0 sm:pt-4 dashboard-main-scroll'
          : 'max-w-[1400px] px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 dashboard-main-scroll'
      }`}
    >
      <BoardlySuspenseBoundary variant="page">
        {children ?? <Outlet />}
      </BoardlySuspenseBoundary>
    </main>
  );

  return (
    <div
      data-student-shell="true"
      data-student-nav-layout={hasDockedBottomNav ? 'docked' : 'standard'}
      className={`relative ${
        hasDockedBottomNav ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh] overflow-x-clip'
      } flex flex-col antialiased ${
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

      {hasDockedBottomNav ? (
        <>
          <div
            data-student-scroll-container="true"
            className="student-scroll-viewport flex-1 min-h-0 w-full overflow-y-auto overflow-x-clip flex flex-col"
          >
            {mainElement}
          </div>
          <div
            data-bottom-nav-safe-area="true"
            className={`student-bottom-nav-tray shrink-0 w-full pointer-events-none ${
              pathname === '/rewards' ? 'student-bottom-nav-tray--rewards' : ''
            }`}
            aria-hidden="true"
          />
        </>
      ) : (
        mainElement
      )}

      {!isCrewOverviewRoute && <DashboardBottomNav />}
    </div>
  );
}

export default AppLayout;
