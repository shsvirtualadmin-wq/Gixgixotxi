import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useTheme } from '@/hooks/useTheme';
import { useWallet } from '@/hooks/useWallet';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { KobanChip } from '@/components/koban/KobanIcon';
import { AvatarFrame, AvatarPicture } from '@/components/koban/CosmeticRenderers';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import {
  DashboardMenuContent,
  HamburgerMenuSheet,
  clearCachedAuthAndAdminStorage,
} from './HamburgerMenuSheet';
import { LineLoader } from '@/components/ui/LineLoader';

interface Props {
  sidebarCollapsed?: boolean;
}

export function DashboardTopBar({ sidebarCollapsed: _sidebarCollapsed }: Props) {
  const { signOutUser, isAdmin, isGuest } = useAuth();
  const { user, profile } = useUserProfile();
  const { openProfile } = useProfileModal();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; right: number }>({
    top: 72,
    right: 16,
  });

  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);

  const { theme, toggle: toggleTheme } = useTheme();
  const unreadCount = useUnreadNotificationsCount();

  // Track viewport size so phones (<640px) use the bottom sheet and desktop uses the avatar dropdown
  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 640;
      setIsMobileViewport(mobile);
      if (!mobile && avatarBtnRef.current) {
        const rect = avatarBtnRef.current.getBoundingClientRect();
        setDropdownCoords({
          top: Math.round(rect.bottom + 10),
          right: Math.max(12, Math.round(window.innerWidth - rect.right)),
        });
      }
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Recompute dropdown position whenever menu opens on desktop
  useEffect(() => {
    if (menuOpen && !isMobileViewport && avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: Math.round(rect.bottom + 10),
        right: Math.max(12, Math.round(window.innerWidth - rect.right)),
      });
    }
  }, [menuOpen, isMobileViewport]);

  // Escape key closes desktop dropdown
  useEffect(() => {
    if (!menuOpen || isMobileViewport) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, isMobileViewport]);

  const handleNav = useCallback(
    (target: string) => {
      setMenuOpen(false);
      navigate(target);
    },
    [navigate]
  );

  const handleOpenProfile = useCallback(() => {
    setMenuOpen(false);
    if (user) {
      openProfile();
    } else {
      navigate('/login');
    }
  }, [user, openProfile, navigate]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    setIsSigningOut(true);
    clearCachedAuthAndAdminStorage();
    try {
      await Promise.all([
        signOutUser(),
        new Promise((resolve) => setTimeout(resolve, 450)),
      ]);
    } finally {
      setIsSigningOut(false);
      navigate('/login', { replace: true });
    }
  };

  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, loading: walletLoading, equipped } = useWallet();
  const isPro = !isGuest && effectivePlan.isUnlimited;
  const hasEquippedFrame = Boolean(equipped?.frame && equipped.frame !== 'none');

  if (isSigningOut) {
    return <LineLoader context="login" variant="page" immediate />;
  }

  return (
    <>
      <header
        className="sticky z-[70] w-full max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-1 shrink-0 pointer-events-none box-border select-none"
        style={{
          top: 'calc(12px + env(safe-area-inset-top, 0px))',
          marginTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div
          className="w-full min-w-0 box-border h-14 sm:h-[60px] px-3.5 sm:px-5 rounded-full dashboard-glass-bar allow-backdrop-blur flex items-center justify-between gap-2 pointer-events-auto transition-all duration-200"
        >
          {/* Left side: Boardly Doto logo, Admin Portal label, and conditional PRO chip */}
          <div className="flex items-center gap-2.5 min-w-0 shrink">
            <div className="flex flex-col justify-center min-w-0 shrink-0">
              <Link
                to="/dashboard"
                className="inline-flex items-center shrink-0 select-none leading-none tracking-tight hover:opacity-90 transition-opacity"
                style={{
                  fontFamily: "'Doto', var(--font-dot), sans-serif",
                  fontWeight: 800,
                  fontSize: '22px',
                  color: 'var(--cw-red-text)',
                }}
                aria-label="Boardly Dashboard"
              >
                Boardly
              </Link>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center text-[9px] leading-none font-bold hover:underline tracking-tight mt-0.5 text-left cursor-pointer w-fit"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--cw-red-text)',
                  }}
                >
                  Admin Portal
                </button>
              )}
            </div>

            {isPro && (
              <span
                className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cw-red) 16%, transparent)',
                  color: 'var(--cw-red-text)',
                  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--cw-red) 38%, transparent)',
                }}
              >
                PRO
              </span>
            )}
          </div>

          {/* Right side: Gold Kobans balance chip, Notification bell, Theme toggle (40px), Profile avatar (36px) */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Kobans Wallet Chip */}
            <Link
              to="/store"
              title="Boardly Store & Kobans Wallet"
              className="flex items-center shrink-0 transition-transform hover:scale-105"
            >
              <KobanChip balance={kobanBalance} loading={walletLoading} />
            </Link>

            {/* Notification Bell (40px round glass icon button) */}
            <Link
              to="/dashboard/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative w-10 h-10 min-w-[40px] min-h-[40px] rounded-full dashboard-topbar-icon-btn flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              <Bell size={17} strokeWidth={1.85} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D71921] text-white text-[9px] font-bold flex items-center justify-center leading-none border border-black/30 shadow-sm tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle (40px round glass icon button) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full dashboard-topbar-icon-btn flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              {theme === 'dark' ? (
                <Sun size={17} strokeWidth={1.85} />
              ) : (
                <Moon size={17} strokeWidth={1.85} />
              )}
            </button>

            {/* Profile Avatar (36px circle with ring) */}
            <button
              ref={avatarBtnRef}
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="User profile menu"
              aria-expanded={menuOpen}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity ring-1 ring-white/25 dark:ring-white/20"
              style={{ boxShadow: 'inset 0 0 0 1px var(--cw-line)' }}
            >
              <AvatarFrame itemId={equipped?.frame || 'none'} size={36}>
                <AvatarPicture
                  avatarId={equipped?.avatar}
                  avatarKey={profile?.avatarKey}
                  variant={profile?.avatarVariant}
                  seed={user?.uid}
                  size={hasEquippedFrame ? 26 : 36}
                />
              </AvatarFrame>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile (<640px): Tapping avatar opens the unified Hamburger Bottom Sheet */}
      {isMobileViewport && (
        <HamburgerMenuSheet
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {/* Desktop (>=640px): Portal-mounted dimmed/blurred backdrop + Nothing OS Avatar Dropdown */}
      {!isMobileViewport &&
        menuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[120]"
            role="dialog"
            aria-modal="true"
            aria-label="Account menu"
          >
            {/* Dimmed, blurred backdrop overlay so page content underneath never competes with menu text */}
            <div
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-0 cursor-pointer bg-black/30 backdrop-blur-sm avatar-dropdown-backdrop"
              aria-hidden="true"
            />

            {/* Glass Avatar Dropdown Panel */}
            <div
              ref={dropdownPanelRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: `${dropdownCoords.top}px`,
                right: `${dropdownCoords.right}px`,
              }}
              className="z-10 glass avatar-dropdown-panel allow-backdrop-blur p-3.5"
            >
              <DashboardMenuContent
                onNavigate={handleNav}
                onOpenProfile={handleOpenProfile}
                onSignOut={handleSignOut}
                showCoinBalanceInStore={false}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
