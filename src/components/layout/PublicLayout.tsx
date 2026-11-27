import { lazy, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionStatus, isUserAuthenticated } from '@/utils/homeUrl';
import {
  clearPostLoginRedirect,
  evaluatePublicLayoutAccess,
  readPostLoginRedirect,
} from '@/utils/routeGuards';
import { BackgroundCanvas } from '../BackgroundCanvas';
import { Navbar } from './Navbar';
import { PublicPageHeader } from './PublicPageHeader';
import { Footer } from './Footer';
import { BoardlyLoader, BoardlySuspenseBoundary } from '../ui/BoardlyLoader';
import { RotatingBoardlyAd } from '@/components/BoardlyAd';

const LazyAppLayout = lazy(() =>
  import('./AppLayout').then((m) => ({ default: m.AppLayout }))
);

/**
 * PublicLayout:
 * - Resolves session state without flashing the landing page or public chrome for signed-in users.
 * - Signed-in users on non-root shared routes (/leaderboard, /privacy, etc.) stay on their exact route
 *   inside AppLayout without ever bouncing through '/' or '/dashboard/commons'.
 * - Signed-in users on '/' honor any pending post-login redirect before falling back to '/dashboard/commons'.
 * - Signed-out visitors render the public header (Navbar on '/', PublicPageHeader on subpages)
 *   and the red Boardly Footer.
 */
export function PublicLayout() {
  const { user, profileLoading, authStatus } = useAuth();
  const location = useLocation();
  const sessionStatus = getSessionStatus(user, profileLoading, authStatus);
  const isOptimisticallyAuthenticated = isUserAuthenticated(user, profileLoading, authStatus);

  const pathname = location.pathname;
  const isHomePage = pathname === '/';
  const isLoadingSession = sessionStatus === 'loading';
  const pendingRedirect = isHomePage ? readPostLoginRedirect() : null;

  const layoutDecision = evaluatePublicLayoutAccess({
    pathname,
    sessionStatus,
    isOptimisticallyAuthenticated,
    pendingRedirect,
  });

  useEffect(() => {
    if (layoutDecision.action === 'redirect' && layoutDecision.clearPendingRedirect) {
      clearPostLoginRedirect();
    }
  }, [layoutDecision]);

  if (layoutDecision.action === 'redirect') {
    return <Navigate to={layoutDecision.target} replace />;
  }

  if (layoutDecision.action === 'loading_authenticated_home') {
    return (
      <div
        className="relative min-h-screen flex flex-col"
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
      >
        <BackgroundCanvas />
        <BoardlyLoader variant="page" />
      </div>
    );
  }

  if (layoutDecision.action === 'render_app_layout') {
    return (
      <BoardlySuspenseBoundary variant="page">
        <LazyAppLayout />
      </BoardlySuspenseBoundary>
    );
  }

  // Signed-out session (or cold unauthenticated session still resolving) -> PublicLayout
  // While session is loading, omit the red marketing Footer so it never flashes for signed-in users,
  // while still rendering the actual route content / skeleton so the screen is NEVER black.
  const isStoreMainPage =
    pathname === '/store' || pathname === '/store/get-kobans';
  const isCommonsFeed =
    pathname === '/commons' ||
    pathname === '/commons/trending' ||
    pathname === '/commons/following' ||
    pathname.startsWith('/commons/subject/');

  return (
    <div
      className={`relative min-h-screen flex flex-col${
        isStoreMainPage || isCommonsFeed ? ' antialiased overflow-x-clip' : ''
      }`}
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <BackgroundCanvas />
      <RotatingBoardlyAd
        key="boardly-public-top-strip"
        variant="strip"
        slotKey="public_top_strip"
      />
      {isStoreMainPage || isCommonsFeed ? (
        <main
          className="flex-1 w-full flex flex-col"
          style={{ paddingTop: 'var(--boardly-top-strip-h, 0px)' }}
        >
          <BoardlySuspenseBoundary variant="page">
            <Outlet />
          </BoardlySuspenseBoundary>
        </main>
      ) : (
        <>
          {isHomePage ? <Navbar /> : <PublicPageHeader />}
          {isHomePage ? (
            <div className="flex-1 flex flex-col">
              <BoardlySuspenseBoundary variant="page">
                <Outlet />
              </BoardlySuspenseBoundary>
            </div>
          ) : (
            <main
              className="flex-1 flex flex-col pb-12"
              style={{
                paddingTop:
                  'calc(64px + 24px + env(safe-area-inset-top, 0px) + var(--boardly-top-strip-h, 0px))',
              }}
            >
              <BoardlySuspenseBoundary variant="page">
                <Outlet />
              </BoardlySuspenseBoundary>
            </main>
          )}
        </>
      )}
      {!isLoadingSession && <Footer />}
    </div>
  );
}

export default PublicLayout;
