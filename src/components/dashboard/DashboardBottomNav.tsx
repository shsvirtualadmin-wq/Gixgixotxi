import { useState, useEffect, useMemo, memo } from 'react';
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
import { PillNav, type PillNavItem } from '@/components/ui/PillNav';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { HamburgerMenuSheet } from './HamburgerMenuSheet';

function DashboardBottomNavComponent() {
  const { profile } = useUserProfile();
  const unreadCount = useUnreadNotificationsCount();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
  const crewLink = '/dashboard/crew';

  // Unified Student Nav: Home, Commons, Notifications, Streaks, Crew, [Captain], Menu
  const navItems: PillNavItem[] = useMemo(
    () => [
      {
        to: '/dashboard',
        label: 'Home',
        icon: <LayoutDashboard size={18} />,
        end: true,
      },
      {
        to: '/dashboard/commons',
        label: 'Commons',
        icon: <Compass size={18} />,
      },
      {
        to: '/dashboard/notifications',
        label: 'Notifications',
        icon: <Bell size={18} />,
        badge: unreadCount > 0 ? unreadCount : undefined,
      },
      {
        to: '/dashboard/streaks',
        label: 'Streaks',
        icon: <Flame size={18} />,
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
        onClick: () => setIsMenuOpen(true),
      },
    ],
    [unreadCount, crewLink, isApprovedCaptain]
  );

  return (
    <>
      {/* ─── FIXED UNIFIED PILL BOTTOM NAVIGATION ────────────────────────────── */}
      <div
        className={`fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-24px)] max-w-[520px] z-40 transition-opacity duration-150 ${
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
          activeId={location.pathname.startsWith('/store') ? 'menu' : undefined}
        />
      </div>

      {/* ─── REDESIGNED BOARDLY HAMBURGER MENU BOTTOM SHEET ───────────────── */}
      <HamburgerMenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}

export const DashboardBottomNav = memo(DashboardBottomNavComponent);
export default DashboardBottomNav;
