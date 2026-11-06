import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Logo } from '@/components/ui/Logo';
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
  const { signOutUser, isAdmin } = useAuth();
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
  const isPro = effectivePlan.isUnlimited;

  if (isSigningOut) {
    return <LineLoader context="login" variant="page" immediate />;
  }

  return (
    <>
      <header className="sticky top-0 z-[70] w-full max-w-full px-3 sm:px-6 pt-3 pb-1 shrink-0 pointer-events-none box-border">
        <div
          className="w-full max-w-5xl min-w-0 box-border mx-auto h-14 sm:h-16 px-3 sm:px-5 rounded-full dashboard-glass-bar allow-backdrop-blur border flex items-center justify-between gap-2 pointer-events-auto transition-all duration-200"
        >
          {/* Left side: Brand logo, PRO/FREE badge, and Admin Portal label */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <div className="flex flex-col justify-center min-w-0 shrink-0">
              <Link to="/dashboard" className="flex items-center shrink-0" aria-label="Boardly Dashboard">
                <Logo
                  size="navbar"
                  className="!h-[26px] min-[400px]:!h-[30px] sm:!h-[40px] md:!h-[44px] w-auto shrink-0"
                />
              </Link>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="hidden min-[400px]:inline-flex sm:hidden items-center text-[9px] leading-none font-bold text-[var(--red)] hover:underline tracking-tight mt-0.5 text-left cursor-pointer w-fit"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Admin Portal
                </button>
              )}
            </div>

            <span
              className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                isPro ? 'badge-pill-red' : 'glass-pill text-[var(--text-muted)]'
              }`}
            >
              {isPro ? 'PRO' : 'FREE'}
            </span>

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass-pill border border-[var(--red)]/50 text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <Shield size={13} strokeWidth={1.75} className="shrink-0" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>

          {/* Right side: Upgrade button, Kobans wallet chip (shown once here), Notification bell, Theme toggle, Avatar trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {!isPro && !isAdmin && (
              <Link
                to="/dashboard/plans"
                className="hidden md:inline-flex btn-primary text-xs py-1.5 px-3.5 rounded-full items-center shrink-0 whitespace-nowrap"
                style={{ height: '34px', fontSize: '12px' }}
              >
                Upgrade to Pro
              </Link>
            )}

            {/* Kobans Wallet Chip — single source of coin balance when navbar is visible */}
            <Link
              to="/store"
              title="Boardly Store & Kobans Wallet"
              className="flex items-center shrink-0 transition-transform hover:scale-105"
            >
              <KobanChip balance={kobanBalance} loading={walletLoading} />
            </Link>

            {/* Notification Bell */}
            <Link
              to="/dashboard/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer shrink-0"
            >
              <Bell size={16} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D71921] text-white text-[9px] font-bold flex items-center justify-center leading-none border border-black/30 shadow-sm tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer shrink-0"
            >
              {theme === 'dark' ? (
                <Sun size={16} strokeWidth={1.75} />
              ) : (
                <Moon size={16} strokeWidth={1.75} />
              )}
            </button>

            {/* Avatar Trigger Button (min 44px touch target) */}
            <button
              ref={avatarBtnRef}
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="User profile menu"
              aria-expanded={menuOpen}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
            >
              <AvatarFrame itemId={equipped?.frame || 'none'} size={40}>
                <AvatarPicture
                  avatarId={equipped?.avatar}
                  avatarKey={profile?.avatarKey}
                  variant={profile?.avatarVariant}
                  seed={user?.uid}
                  size={28}
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
              className="fixed inset-0 z-0 cursor-pointer avatar-dropdown-backdrop allow-backdrop-blur"
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
              className="z-10 avatar-dropdown-panel allow-backdrop-blur p-3.5"
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
