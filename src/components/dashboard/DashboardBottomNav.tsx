import { useState, useEffect, useMemo, memo, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  Bell,
  Users,
  Menu,
  Compass,
  Award,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { PillNav, type PillNavItem } from '@/components/ui/PillNav';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { getHomeUrl, isUserAuthenticated } from '@/utils/homeUrl';

const LazyHamburgerMenuSheet = lazy(() =>
  import('./HamburgerMenuSheet').then((m) => ({ default: m.HamburgerMenuSheet }))
);

function DashboardBottomNavComponent() {
  const { user, profile } = useUserProfile();
  const { profileLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const unreadCount = useUnreadNotificationsCount();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasOpenedMenu, setHasOpenedMenu] = useState(false);

  const isAuthenticated = isUserAuthenticated(user, profileLoading);
  const homeUrl = getHomeUrl(user, profileLoading);

  // Auto-close drawer on any route change so state never gets stuck or re-triggered
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const role = profile?.role || 'student';
  const isApprovedCaptain =
    role === 'captain' ||
    role === 'ambassador' ||
    Boolean(profile?.isCaptain) ||
    Boolean(profile?.isAmbassador);
  const crewLink = isAuthenticated ? '/dashboard/crew' : '/crew';
  const commonsLink =
    !isAuthenticated || location.pathname.startsWith('/commons')
      ? '/commons'
      : '/dashboard/commons';

  // Unified Student Nav: Commons, Home, Notifications, Streaks, Squad, [Captain], Menu
  const navItems: PillNavItem[] = useMemo(
    () => [
      {
        to: commonsLink,
        label: 'Commons',
        icon: <Compass size={18} />,
      },
      {
        to: isAuthenticated ? '/dashboard' : homeUrl,
        label: 'Home',
        icon: <LayoutDashboard size={18} />,
        end: true,
      },
      isAuthenticated
        ? {
            to: '/dashboard/notifications',
            label: 'Notifications',
            icon: <Bell size={18} />,
            badge: unreadCount > 0 ? unreadCount : undefined,
          }
        : {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell size={18} />,
            onClick: () => requireAuth('view your notifications'),
          },
      isAuthenticated
        ? {
            to: '/dashboard/streaks',
            label: 'Streaks',
            icon: <Flame size={18} />,
          }
        : {
            id: 'streaks',
            label: 'Streaks',
            icon: <Flame size={18} />,
            onClick: () => requireAuth('track your daily study streaks'),
          },
      {
        to: crewLink,
        label: 'Squad',
        icon: <Users size={18} />,
      },
      ...(isApprovedCaptain
        ? [
            {
              to: '/dashboard/captain',
              label: 'Captain',
              icon: <Award size={18} />,
            },
          ]
        : []),
      {
        id: 'menu',
        label: 'Menu',
        icon: <Menu size={18} />,
        onClick: () => {
          setHasOpenedMenu(true);
          setIsMenuOpen(true);
        },
      },
    ],
    [isAuthenticated, homeUrl, commonsLink, unreadCount, crewLink, isApprovedCaptain, requireAuth]
  );

  return (
    <>
      {/* ─── FIXED UNIFIED PILL BOTTOM NAVIGATION ────────────────────────────── */}
      <div
        className={`fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-24px)] max-w-[520px] z-[60] transition-opacity duration-150 ${
          isMenuOpen
            ? 'pointer-events-none opacity-0 invisible'
            : 'pointer-events-auto opacity-100'
        }`}
        aria-label="Student Navigation Bar"
      >
        <PillNav
          items={navItems}
          layoutId="studentBottomNavActive"
          iconOnly={true}
          activeId={
            location.pathname.startsWith('/store') || location.pathname === '/contact'
              ? 'menu'
              : undefined
          }
        />
      </div>

      {/* ─── REDESIGNED BOARDLY HAMBURGER MENU BOTTOM SHEET ───────────────── */}
      {(hasOpenedMenu || isMenuOpen) && (
        <Suspense fallback={null}>
          <LazyHamburgerMenuSheet
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export const DashboardBottomNav = memo(DashboardBottomNavComponent);
export default DashboardBottomNav;
