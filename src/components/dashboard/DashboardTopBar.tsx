import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useTheme } from '@/hooks/useTheme';
import { useWallet } from '@/hooks/useWallet';
import { KobanChip } from '@/components/koban/KobanIcon';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import {
  DashboardMenuContent,
  HamburgerMenuSheet,
  clearCachedAuthAndAdminStorage,
} from './HamburgerMenuSheet';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { useProBadge } from '@/contexts/ProBadgeContext';
import { clearOptimisticUserSnapshot } from '@/lib/swrCache';

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
  const { effectiveProBadge } = useProBadge();

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
    if (isSigningOut) return;
    setMenuOpen(false);
    setIsSigningOut(true);
    clearCachedAuthAndAdminStorage();
    clearOptimisticUserSnapshot();
    try {
      await signOutUser();
    } finally {
      setIsSigningOut(false);
      navigate('/login', { replace: true });
    }
  };

  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, loading: walletLoading, equipped } = useWallet();
  const isPro = !isGuest && effectivePlan.isUnlimited;

  return (
    <>
      <header
        className="sticky z-[70] w-full max-w-full box-border px-3 sm:px-6 lg:px-8 pb-1 shrink-0 pointer-events-none select-none overflow-visible"
        style={{
          top: 'calc(12px + env(safe-area-inset-top, 0px))',
          marginTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div
          className="w-full max-w-5xl mx-auto min-w-0 box-border h-14 sm:h-[60px] px-3 rounded-full dashboard-glass-bar allow-backdrop-blur flex flex-row items-center justify-between gap-2 pointer-events-auto transition-all duration-200 overflow-hidden"
        >
          {/* Left side: Boardly Doto logo and PRO pill */}
          <div className="flex flex-col justify-center shrink-0 min-w-0">
            <div className="inline-flex items-center gap-2 shrink-0 whitespace-nowrap">
              <Link
                to="/dashboard"
                className="inline-flex items-center shrink-0 whitespace-nowrap select-none leading-none tracking-tight hover:opacity-90 transition-opacity text-[18px] min-[390px]:text-[20px] sm:text-[22px]"
                style={{
                  fontFamily: "'Doto', var(--font-dot), sans-serif",
                  fontWeight: 800,
                  color: 'var(--cw-red-text)',
                }}
                aria-label="Boardly Dashboard"
              >
                Boardly
              </Link>

              {isPro && effectiveProBadge && (
                <span className="shrink-0 inline-flex items-center">
                  <ProBadge
                    design={effectiveProBadge}
                    size="sm"
                    animated
                    priority
                    className="ml-0.5 shrink-0"
                  />
                </span>
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="inline-flex items-center text-[9px] leading-none font-bold hover:underline tracking-tight mt-0.5 text-left cursor-pointer w-fit whitespace-nowrap"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--cw-red-text)',
                }}
              >
                Admin Portal
              </button>
            )}
          </div>

          {/* Right side: Coin chip, Theme toggle, and Profile avatar */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Kobans Wallet Chip */}
            <Link
              to="/store"
              title="Boardly Store & Kobans Wallet"
              className="flex items-center justify-end shrink-0 whitespace-nowrap transition-transform hover:scale-105"
            >
              <KobanChip balance={kobanBalance} loading={walletLoading} />
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

            {/* Profile Avatar (36px circle, vertically centered and fully visible on 360px/390px/430px) */}
            <button
              ref={avatarBtnRef}
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="User profile menu"
              aria-expanded={menuOpen}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full overflow-visible shrink-0 flex items-center justify-center self-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                width: 36,
                height: 36,
              }}
            >
              <BoardlyAvatar
                uid={user?.uid}
                equippedAvatar={
                  equipped?.avatar ||
                  (profile as Record<string, unknown> | null)?.avatar as string | undefined
                }
                equippedFrameId={equipped?.frame}
                size={36}
              />
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
