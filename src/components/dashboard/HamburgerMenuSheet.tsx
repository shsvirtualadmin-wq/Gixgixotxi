import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  ShoppingBag,
  Award,
  Trophy,
  Sparkles,
  Settings,
  Shield,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronRight,
  Coins,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useWallet } from '@/hooks/useWallet';
import { useTheme, type ThemeSetting } from '@/hooks/useTheme';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { LineLoader } from '@/components/ui/LineLoader';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

export interface HamburgerMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APP_VERSION = 'v1.0.0';

export function clearCachedAuthAndAdminStorage() {
  try {
    const lsKeysToRemove: string[] = [
      'boardly_user_authenticated',
      'boardly_cached_role',
      'boardly_admin_token',
      'boardly_admin_cache',
      'boardly_last_route',
    ];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        k !== 'boardly-theme' &&
        (k.startsWith('boardly_admin') ||
          k.startsWith('boardly_role') ||
          k.startsWith('boardly_auth') ||
          k.startsWith('boardly_token') ||
          k.startsWith('firebase:authUser'))
      ) {
        lsKeysToRemove.push(k);
      }
    }
    lsKeysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore storage errors
  }

  try {
    sessionStorage.clear();
  } catch {
    // ignore storage errors
  }
}

export interface DashboardMenuContentProps {
  onNavigate: (target: string) => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  /** Show coin balance next to Boardly Store ONLY when the top navbar is hidden */
  showCoinBalanceInStore?: boolean;
}

/**
 * Shared Nothing OS + Glassmorphism Menu Content
 * Used identically inside both the Desktop Avatar Dropdown and the Mobile Hamburger Bottom Sheet.
 */
export const DashboardMenuContent: React.FC<DashboardMenuContentProps> = ({
  onNavigate,
  onOpenProfile,
  onSignOut,
  showCoinBalanceInStore = false,
}) => {
  const location = useLocation();
  const { user, profileLoading, isAdmin, isGuest } = useAuth();
  const { profile } = useUserProfile();
  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, equipped } = useWallet();
  const { themeSetting, resolvedTheme, setTheme } = useTheme();

  // Strict role confirmation (default role = null until confirmed)
  const confirmedRole: string | null =
    !profileLoading && user && profile?.role ? profile.role : null;

  const isConfirmedAdmin = Boolean(
    !profileLoading &&
      user &&
      (confirmedRole === 'admin' ||
        confirmedRole === 'superadmin' ||
        isAdmin)
  );

  const isConfirmedSuperAdmin = Boolean(
    isConfirmedAdmin &&
      (confirmedRole === 'superadmin' ||
        effectivePlan.isSuperAdmin ||
        user?.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2')
  );

  const role = profile?.role || 'student';
  const isApprovedCaptain = Boolean(
    user &&
      (role === 'captain' ||
        role === 'ambassador' ||
        confirmedRole === 'captain' ||
        confirmedRole === 'ambassador' ||
        profile?.isCaptain ||
        profile?.isAmbassador)
  );

  const isPro = Boolean((effectivePlan.isUnlimited || isConfirmedAdmin) && !isGuest);

  // Single Role/Plan badge (shown ONCE in the profile card)
  const singleBadgeLabel = !user || isGuest
    ? 'Guest'
    : isConfirmedSuperAdmin
    ? 'Super Admin'
    : isConfirmedAdmin
    ? 'Admin'
    : isApprovedCaptain
    ? 'Captain'
    : isPro
    ? 'Pro'
    : 'Free';

  const isBadgeAccent = Boolean(isConfirmedAdmin || isPro);

  // Full display name & @handle
  const rawName =
    profile?.nickname || profile?.displayName || user?.displayName || 'Student';
  const displayName = user
    ? sanitizeStudentDisplayName(rawName, profile?.shortId || user?.uid)
    : 'Guest Student';
  const handleText = user
    ? `@${profile?.username || profile?.shortId || user.uid.slice(0, 6)}`
    : '@guest';

  // Active route checks for consistent subtle red tint + red label
  const pathname = location.pathname;
  const commonsTarget = user ? '/dashboard/commons' : '/commons';
  const isCommonsActive =
    pathname.startsWith('/commons') || pathname.startsWith('/dashboard/commons');
  const isGrandLineActive = pathname.startsWith('/grand-line');
  const isStoreActive =
    pathname.startsWith('/store') || pathname.startsWith('/dashboard/store');
  const isLeaderboardActive =
    pathname.startsWith('/leaderboard') || pathname.includes('leaderboard');
  const isRewardsActive =
    pathname.startsWith('/rewards') || pathname.startsWith('/dashboard/rewards');
  const isSettingsActive =
    pathname.startsWith('/settings') || pathname.startsWith('/dashboard/settings');
  const isCaptainActive =
    pathname.startsWith('/dashboard/captain') ||
    pathname.startsWith('/dashboard/ambassador');
  const isAdminActive = pathname.startsWith('/admin');

  return (
    <div className="space-y-2.5">
      {/* 1. Top: Profile Card (avatar with frame, dot-matrix name, @username, role badge) */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="w-full min-h-[64px] p-3 text-left flex items-center justify-between gap-3 more-glass-card more-glass-card--interactive group"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="shrink-0">
            <BoardlyAvatar
              uid={user?.uid}
              name={displayName}
              avatarUrl={(profile as Record<string, unknown> | null)?.avatarUrl as string | undefined}
              photoURL={profile?.photoURL || user?.photoURL}
              avatar={(profile as Record<string, unknown> | null)?.avatar as string | null}
              customAvatarUrl={(profile as Record<string, unknown> | null)?.customAvatarUrl as string | null}
              equippedAvatar={equipped?.avatar}
              frame={equipped?.frame}
              size={48}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="font-dot text-[15px] leading-snug line-clamp-2 break-words whitespace-normal"
              style={{ color: 'var(--text)' }}
            >
              {displayName}
            </div>

            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {handleText}
              </span>

              <span
                className={`more-glass-pill ${
                  isBadgeAccent ? 'more-glass-pill--accent' : ''
                }`}
              >
                {singleBadgeLabel}
              </span>
            </div>
          </div>
        </div>

        <ChevronRight
          size={17}
          strokeWidth={1.75}
          style={{ color: 'var(--text-muted)' }}
          className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
        />
      </button>

      {/* 2. Clean 2-Column Grid of Main Destinations */}
      <div className="grid grid-cols-2 gap-2">
        {/* Tile 1: Boardly Commons */}
        <button
          type="button"
          onClick={() => onNavigate(commonsTarget)}
          className={`more-glass-tile ${
            isCommonsActive ? 'more-glass-tile--active' : ''
          }`}
        >
          <span
            className={`more-icon-circle ${
              isCommonsActive ? 'more-icon-circle--accent' : ''
            }`}
          >
            <Compass size={17} strokeWidth={1.75} />
          </span>
          <span className="text-[13px] font-medium leading-tight truncate">
            Boardly Commons
          </span>
        </button>

        {/* Tile 2: Grand Line (small muted secondary label: Mock Tests) */}
        <button
          type="button"
          onClick={() => onNavigate('/grand-line')}
          className={`more-glass-tile ${
            isGrandLineActive ? 'more-glass-tile--active' : ''
          }`}
        >
          <span
            className={`more-icon-circle ${
              isGrandLineActive ? 'more-icon-circle--accent' : ''
            }`}
          >
            <Award size={17} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex flex-col items-start">
            <span className="text-[13px] font-medium leading-tight truncate max-w-full">
              Grand Line
            </span>
            <span
              className="text-[11px] font-normal leading-tight mt-0.5 truncate max-w-full"
              style={{ color: 'var(--text-muted)' }}
            >
              Mock Tests
            </span>
          </div>
        </button>

        {/* Tile 3: Boardly Store (coin balance shown here ONLY if top navbar is hidden) */}
        <button
          type="button"
          onClick={() => onNavigate('/store')}
          className={`more-glass-tile ${
            isStoreActive ? 'more-glass-tile--active' : ''
          }`}
        >
          <span
            className={`more-icon-circle ${
              isStoreActive ? 'more-icon-circle--accent' : ''
            }`}
          >
            <ShoppingBag size={17} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1 flex items-center justify-between gap-1.5">
            <span className="text-[13px] font-medium leading-tight truncate">
              Boardly Store
            </span>
            {showCoinBalanceInStore && (
              <span
                className="more-glass-pill tabular-nums shrink-0"
                title="Kobans balance"
              >
                <Coins size={11} strokeWidth={1.75} />
                <span>{(kobanBalance ?? 0).toLocaleString()}</span>
              </span>
            )}
          </div>
        </button>

        {/* Tile 4: Leaderboard */}
        <button
          type="button"
          onClick={() => onNavigate('/leaderboard')}
          className={`more-glass-tile ${
            isLeaderboardActive ? 'more-glass-tile--active' : ''
          }`}
        >
          <span
            className={`more-icon-circle ${
              isLeaderboardActive ? 'more-icon-circle--accent' : ''
            }`}
          >
            <Trophy size={17} strokeWidth={1.75} />
          </span>
          <span className="text-[13px] font-medium leading-tight truncate">
            Leaderboard
          </span>
        </button>

        {/* Tile 5: Rewards (full-width tile, small muted secondary label: Daily Check-in & Referrals) */}
        <button
          type="button"
          onClick={() => onNavigate('/rewards')}
          className={`more-glass-tile col-span-2 ${
            isRewardsActive ? 'more-glass-tile--active' : ''
          }`}
        >
          <span
            className={`more-icon-circle ${
              isRewardsActive ? 'more-icon-circle--accent' : ''
            }`}
          >
            <Sparkles size={17} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex flex-1 items-center justify-between gap-2">
            <span className="text-[13px] font-medium leading-tight truncate">
              Rewards
            </span>
            <span
              className="text-[11px] font-normal leading-tight truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Daily Check-in &amp; Referrals
            </span>
          </div>
        </button>
      </div>

      {/* 3. Settings, Captain Deck & Admin/Superadmin Portal (Full-width rows with chevrons, uniform height & padding) */}
      <div
        className="more-glass-card overflow-hidden divide-y"
        style={{ borderColor: 'var(--glass-menu-item-border)' }}
      >
        {/* Captain Deck Row (for approved Nakama Captains) */}
        {isApprovedCaptain && (
          <button
            type="button"
            onClick={() => onNavigate('/dashboard/captain')}
            className={`more-glass-row ${
              isCaptainActive ? 'more-glass-row--active' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`more-icon-circle ${
                  isCaptainActive ? 'more-icon-circle--accent' : ''
                }`}
              >
                <Award size={17} strokeWidth={1.75} />
              </span>
              <span className="text-[13px] font-medium leading-tight truncate">
                Captain Deck
              </span>
            </div>
            <ChevronRight
              size={16}
              strokeWidth={1.75}
              style={{ color: 'var(--text-muted)' }}
              className="shrink-0"
            />
          </button>
        )}

        {/* Settings Row */}
        <button
          type="button"
          onClick={() => onNavigate('/settings')}
          className={`more-glass-row ${
            isSettingsActive ? 'more-glass-row--active' : ''
          }`}
          style={isApprovedCaptain ? { borderTopColor: 'var(--glass-menu-divider)' } : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`more-icon-circle ${
                isSettingsActive ? 'more-icon-circle--accent' : ''
              }`}
            >
              <Settings size={17} strokeWidth={1.75} />
            </span>
            <span className="text-[13px] font-medium leading-tight truncate">
              Settings
            </span>
          </div>
          <ChevronRight
            size={16}
            strokeWidth={1.75}
            style={{ color: 'var(--text-muted)' }}
            className="shrink-0"
          />
        </button>

        {/* Admin Portal / Superadmin Portal Row (for admins only) */}
        {isConfirmedAdmin && (
          <button
            type="button"
            onClick={() => onNavigate('/admin')}
            className={`more-glass-row ${
              isAdminActive ? 'more-glass-row--active' : ''
            }`}
            style={{ borderTopColor: 'var(--glass-menu-divider)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`more-icon-circle ${
                  isAdminActive ? 'more-icon-circle--accent' : ''
                }`}
              >
                <Shield size={17} strokeWidth={1.75} />
              </span>
              <span className="text-[13px] font-medium leading-tight truncate">
                {isConfirmedSuperAdmin ? 'Superadmin Portal' : 'Admin Portal'}
              </span>
            </div>
            <ChevronRight
              size={16}
              strokeWidth={1.75}
              style={{ color: 'var(--text-muted)' }}
              className="shrink-0"
            />
          </button>
        )}
      </div>

      {/* 4. Theme Switch (Light, Dark, System) as a Segmented Control */}
      <div className="more-glass-card min-h-[48px] px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="more-icon-circle">
            {resolvedTheme === 'dark' ? (
              <Moon size={17} strokeWidth={1.75} />
            ) : (
              <Sun size={17} strokeWidth={1.75} />
            )}
          </span>
          <span className="text-[13px] font-medium leading-tight">
            Theme
          </span>
        </div>

        <div
          className="more-theme-segmented shrink-0 select-none"
          role="radiogroup"
          aria-label="Theme preference"
        >
          {(
            [
              { id: 'light', label: 'Light', Icon: Sun },
              { id: 'dark', label: 'Dark', Icon: Moon },
              { id: 'system', label: 'System', Icon: Monitor },
            ] as { id: ThemeSetting; label: string; Icon: typeof Sun }[]
          ).map(({ id, label, Icon }) => {
            const isActive = themeSetting === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(id);
                }}
                className={`more-theme-segment ${
                  isActive ? 'more-theme-segment--active' : ''
                }`}
              >
                <Icon size={13} strokeWidth={1.75} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Footer: Divider + Sign out on the left and Version number on the right */}
      <div
        className="pt-2 mt-1 border-t flex items-center justify-between px-1"
        style={{ borderTopColor: 'var(--glass-menu-divider)' }}
      >
        {user ? (
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[44px] px-2.5 py-2 -ml-1.5 rounded-xl inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--accent-soft)] active:scale-[0.98] cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="min-h-[44px] px-2.5 py-2 -ml-1.5 rounded-xl inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--accent-soft)] active:scale-[0.98] cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            <User size={16} strokeWidth={1.75} />
            <span>Sign in</span>
          </button>
        )}

        <span
          className="text-[11px] font-mono tabular-nums font-medium select-none pr-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {APP_VERSION}
        </span>
      </div>
    </div>
  );
};

export const HamburgerMenuSheet: React.FC<HamburgerMenuSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOutUser } = useAuth();
  const { openProfile } = useProfileModal();

  // Animation & sign-out states
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Swipe-to-dismiss & focus trap refs
  const touchStartY = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const pushedHistoryRef = useRef<boolean>(false);

  // Open (240ms ease-out) & close (200ms) lifecycle
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setIsRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
          const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus({ preventScroll: true });
        });
      });
    } else if (!isSigningOut) {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsRendered(false);
        previousActiveElementRef.current?.focus?.({ preventScroll: true });
      }, 200);
    }
    return () => clearTimeout(timer);
  }, [isOpen, isSigningOut]);

  // Android back button support via history popstate
  useEffect(() => {
    if (!isOpen) return;

    try {
      window.history.pushState(
        { ...(window.history.state || {}), boardlyMoreSheet: true },
        ''
      );
      pushedHistoryRef.current = true;
    } catch {
      pushedHistoryRef.current = false;
    }

    const handlePopState = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  const dismissSheet = useCallback(() => {
    if (pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
      try {
        window.history.back();
      } catch {
        // ignore history error
      }
    }
    onClose();
  }, [onClose]);

  // Escape key & Tab focus trap inside the sheet
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissSheet();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = Array.from(
          sheetRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismissSheet]);

  // Touch handlers for swipe-down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    if (delta > 0) {
      touchDeltaY.current = delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${Math.min(delta * 0.75, 200)}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    if (touchDeltaY.current > 60) {
      dismissSheet();
    }
    touchDeltaY.current = 0;
  };

  // Navigate & close
  const handleNav = useCallback(
    (target: string) => {
      const shouldReplace = pushedHistoryRef.current;
      pushedHistoryRef.current = false;
      onClose();
      navigate(target, { replace: shouldReplace });
    },
    [onClose, navigate]
  );

  // Sign out
  const handleSignOut = async () => {
    pushedHistoryRef.current = false;
    setIsSigningOut(true);
    clearCachedAuthAndAdminStorage();
    try {
      await Promise.all([
        signOutUser(),
        new Promise((resolve) => setTimeout(resolve, 450)),
      ]);
    } finally {
      setIsSigningOut(false);
      setIsRendered(false);
      onClose();
      navigate('/login', { replace: true });
    }
  };

  if (isSigningOut) {
    return <LineLoader context="login" variant="page" immediate />;
  }

  if (!isRendered) return null;

  // Coin balance is shown next to Boardly Store ONLY when DashboardTopBar is hidden on the current route
  const isHeaderVisible =
    !location.pathname.startsWith('/dashboard/profile') &&
    !location.pathname.startsWith('/dashboard/commons') &&
    !location.pathname.startsWith('/commons') &&
    location.pathname !== '/messages' &&
    location.pathname !== '/saved';
  const showCoinBalanceInStore = Boolean(user && !isHeaderVisible);

  const handleOpenProfile = () => {
    if (user) {
      pushedHistoryRef.current = false;
      onClose();
      openProfile();
    } else {
      handleNav('/login');
    }
  };

  const sheetContent = (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="More menu"
    >
      {/* Dimmed, blurred backdrop overlay */}
      <div
        onClick={dismissSheet}
        className={`fixed inset-0 z-0 cursor-pointer bg-black/30 backdrop-blur-sm more-sheet-backdrop ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Glassmorphic Bottom Sheet (max 85% screen height) */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className={`z-10 glass more-sheet-panel allow-backdrop-blur ${
          isVisible ? 'more-sheet-panel--open' : 'more-sheet-panel--closed'
        }`}
      >
        {/* Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={dismissSheet}
          className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing select-none shrink-0"
          aria-label="Drag down or tap to close menu"
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'var(--border-strong)' }}
          />
        </div>

        {/* Scrollable Sheet Content with safe-area bottom inset */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
          <DashboardMenuContent
            onNavigate={handleNav}
            onOpenProfile={handleOpenProfile}
            onSignOut={handleSignOut}
            showCoinBalanceInStore={showCoinBalanceInStore}
          />
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(sheetContent, document.body)
    : sheetContent;
};

export default HamburgerMenuSheet;
