import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { AvatarPicture, AvatarFrame } from '@/components/koban/CosmeticRenderers';
import { LineLoader } from '@/components/ui/LineLoader';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

export interface HamburgerMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const APP_VERSION = 'v1.0.0';

function clearCachedAuthAndAdminStorage() {
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

export const HamburgerMenuSheet: React.FC<HamburgerMenuSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profileLoading, isAdmin, signOutUser } = useAuth();
  const { profile } = useUserProfile();
  const { openProfile } = useProfileModal();
  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, equipped } = useWallet();
  const { themeSetting, resolvedTheme, setTheme } = useTheme();

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
          // Focus first focusable element inside the sheet for focus trap
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

  // Navigate & close (replaces the temporary sheet history entry if present)
  const handleNav = useCallback(
    (target: string) => {
      const shouldReplace = pushedHistoryRef.current;
      pushedHistoryRef.current = false;
      onClose();
      navigate(target, { replace: shouldReplace });
    },
    [onClose, navigate]
  );

  // Sign out: clear user, role, token, cached routes & admin data, show LineLoader (login context), then navigate to /login
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

  const isApprovedCaptain = Boolean(
    !profileLoading &&
      user &&
      (confirmedRole === 'captain' ||
        confirmedRole === 'ambassador' ||
        profile?.isCaptain ||
        profile?.isAmbassador)
  );

  const isPro = Boolean(effectivePlan.isUnlimited || isConfirmedAdmin);
  const canUpgrade = Boolean(user && !isPro && !isConfirmedAdmin);

  // Single Role/Plan badge (shown ONCE in the profile card)
  const singleBadgeLabel = !user
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

  // Coin balance pill is shown ONLY if DashboardTopBar is hidden on the current route
  const isHeaderVisible =
    !location.pathname.startsWith('/dashboard/profile') &&
    !location.pathname.startsWith('/dashboard/commons') &&
    !location.pathname.startsWith('/commons') &&
    location.pathname !== '/messages' &&
    location.pathname !== '/saved';
  const showCoinPillInSheet = Boolean(user && !isHeaderVisible);

  // Active route checks for faint red tint
  const pathname = location.pathname;
  const commonsTarget = user ? '/dashboard/commons' : '/commons';
  const isCommonsActive =
    pathname.startsWith('/commons') || pathname.startsWith('/dashboard/commons');
  const isGrandLineActive = pathname.startsWith('/grand-line');
  const isStoreActive =
    pathname.startsWith('/store') || pathname.startsWith('/dashboard/store');
  const isLeaderboardActive =
    pathname.startsWith('/leaderboard') || pathname.includes('leaderboard');
  const isSettingsActive =
    pathname.startsWith('/settings') || pathname.startsWith('/dashboard/settings');
  const isUpgradeActive =
    pathname.startsWith('/dashboard/plans') ||
    pathname.startsWith('/plans') ||
    pathname.startsWith('/pricing');
  const isAdminActive = pathname.startsWith('/admin');

  const handleOpenProfile = () => {
    if (user) {
      pushedHistoryRef.current = false;
      onClose();
      openProfile();
    } else {
      handleNav('/login');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="More menu"
    >
      {/* Dimmed, lightly blurred backdrop */}
      <div
        onClick={dismissSheet}
        className={`fixed inset-0 z-0 cursor-pointer more-sheet-backdrop ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Glassmorphic Bottom Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className={`z-10 more-sheet-panel ${
          isVisible ? 'more-sheet-panel--open' : 'more-sheet-panel--closed'
        }`}
      >
        {/* 1. Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={dismissSheet}
          className="pt-2.5 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing select-none shrink-0"
          aria-label="Drag down or tap to close menu"
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'var(--border)' }}
          />
        </div>

        {/* Scrollable Sheet Content (fits without scrolling on most phones) */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3.5 sm:px-4 pt-1 pb-[calc(14px+env(safe-area-inset-bottom,0px))] space-y-2.5">
          {/* 2. Profile Card (tap opens profile) */}
          <button
            type="button"
            onClick={handleOpenProfile}
            className="w-full p-3 text-left flex items-center justify-between gap-3 more-glass-card more-glass-card--interactive group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0">
                <AvatarFrame itemId={equipped?.frame || 'none'} size={50}>
                  <AvatarPicture
                    avatarId={equipped?.avatar}
                    avatarKey={profile?.avatarKey}
                    variant={profile?.avatarVariant}
                    seed={user?.uid}
                    size={40}
                  />
                </AvatarFrame>
              </div>

              <div className="min-w-0 flex-1">
                {/* Full display name: wraps up to 2 lines, never truncated with single-line "..." */}
                <div
                  className="font-dot text-[15px] sm:text-[16px] leading-snug line-clamp-2 break-words whitespace-normal"
                  style={{ color: 'var(--text)' }}
                >
                  {displayName}
                </div>

                {/* @handle + ONE single role/plan badge */}
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

            <div className="flex items-center gap-2 shrink-0">
              {/* Coin balance pill ONLY when header is not visible */}
              {showCoinPillInSheet && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('/store');
                  }}
                  className="more-glass-pill cursor-pointer"
                  title="Kobans balance"
                >
                  <Coins size={12} strokeWidth={1.8} />
                  <span>{(kobanBalance ?? 0).toLocaleString()}</span>
                </span>
              )}

              <ChevronRight
                size={17}
                strokeWidth={1.8}
                style={{ color: 'var(--text-muted)' }}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </div>
          </button>

          {/* 3. Main Links — Compact 2-Column Grid of Glass Tiles */}
          <div className="grid grid-cols-2 gap-2">
            {/* Tile 1: Boardly Commons */}
            <button
              type="button"
              onClick={() => handleNav(commonsTarget)}
              className={`more-glass-tile ${
                isCommonsActive ? 'more-glass-tile--active' : ''
              }`}
            >
              <span
                className={`more-icon-circle ${
                  isCommonsActive ? 'more-icon-circle--accent' : ''
                }`}
              >
                <Compass size={17} strokeWidth={1.8} />
              </span>
              <span className="text-[13px] font-semibold leading-tight truncate">
                Boardly Commons
              </span>
            </button>

            {/* Tile 2: Grand Line (with small "Mock Tests" tag) */}
            <button
              type="button"
              onClick={() => handleNav('/grand-line')}
              className={`more-glass-tile ${
                isGrandLineActive ? 'more-glass-tile--active' : ''
              }`}
            >
              <span
                className={`more-icon-circle ${
                  isGrandLineActive ? 'more-icon-circle--accent' : ''
                }`}
              >
                <Award size={17} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex flex-col items-start">
                <span className="text-[13px] font-semibold leading-tight truncate max-w-full">
                  Grand Line
                </span>
                <span
                  className="text-[10px] font-semibold leading-tight mt-0.5"
                  style={{ color: 'var(--accent)' }}
                >
                  Mock Tests
                </span>
              </div>
            </button>

            {/* Tile 3: Boardly Store */}
            <button
              type="button"
              onClick={() => handleNav('/store')}
              className={`more-glass-tile ${
                isStoreActive ? 'more-glass-tile--active' : ''
              }`}
            >
              <span
                className={`more-icon-circle ${
                  isStoreActive ? 'more-icon-circle--accent' : ''
                }`}
              >
                <ShoppingBag size={17} strokeWidth={1.8} />
              </span>
              <span className="text-[13px] font-semibold leading-tight truncate">
                Boardly Store
              </span>
            </button>

            {/* Tile 4: Leaderboard (Squad/Crew is already in the bottom nav) */}
            <button
              type="button"
              onClick={() => handleNav('/leaderboard')}
              className={`more-glass-tile ${
                isLeaderboardActive ? 'more-glass-tile--active' : ''
              }`}
            >
              <span
                className={`more-icon-circle ${
                  isLeaderboardActive ? 'more-icon-circle--accent' : ''
                }`}
              >
                <Trophy size={17} strokeWidth={1.8} />
              </span>
              <span className="text-[13px] font-semibold leading-tight truncate">
                Leaderboard
              </span>
            </button>
          </div>

          {/* 4. Account Group: Settings (+ Upgrade only if not on Unlimited) */}
          <div className="space-y-1">
            {canUpgrade && (
              <p
                className="text-[11px] uppercase font-semibold tracking-wider px-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Account
              </p>
            )}

            <div
              className="more-glass-card overflow-hidden divide-y"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              {/* Settings */}
              <button
                type="button"
                onClick={() => handleNav('/settings')}
                className={`more-glass-row ${
                  isSettingsActive ? 'more-glass-row--active' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`more-icon-circle ${
                      isSettingsActive ? 'more-icon-circle--accent' : ''
                    }`}
                  >
                    <Settings size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold leading-tight">
                      Settings
                    </p>
                    <p
                      className="text-[11px] leading-tight mt-0.5 truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Plan, account &amp; sign out
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={1.8}
                  style={{ color: 'var(--text-muted)' }}
                  className="shrink-0"
                />
              </button>

              {/* Upgrade (shown ONLY if user is not on Unlimited / Superadmin) */}
              {canUpgrade && (
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/plans')}
                  className={`more-glass-row ${
                    isUpgradeActive ? 'more-glass-row--active' : ''
                  }`}
                  style={{ borderTopColor: 'var(--glass-border)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="more-icon-circle more-icon-circle--accent">
                      <Sparkles size={17} strokeWidth={1.8} />
                    </span>
                    <span className="text-[14px] font-semibold leading-tight">
                      Upgrade
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.8}
                    style={{ color: 'var(--text-muted)' }}
                    className="shrink-0"
                  />
                </button>
              )}
            </div>
          </div>

          {/* 5. Admin Group (confirmed admin/superadmin only; role badge not repeated) */}
          {isConfirmedAdmin && (
            <div className="more-glass-card overflow-hidden">
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className={`more-glass-row ${
                  isAdminActive ? 'more-glass-row--active' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="more-icon-circle more-icon-circle--accent">
                    <Shield size={17} strokeWidth={1.8} />
                  </span>
                  <span className="text-[14px] font-semibold leading-tight">
                    Admin Portal
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={1.8}
                  style={{ color: 'var(--text-muted)' }}
                  className="shrink-0"
                />
              </button>
            </div>
          )}

          {/* 6. Preferences: Theme Segmented Glass Control (Light / Dark / System) */}
          <div className="more-glass-card px-3 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="more-icon-circle">
                {resolvedTheme === 'dark' ? (
                  <Moon size={17} strokeWidth={1.8} />
                ) : (
                  <Sun size={17} strokeWidth={1.8} />
                )}
              </span>
              <span className="text-[14px] font-semibold leading-tight">
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
                    <Icon size={13} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Footer: Quiet Red "Sign out" Text Button + App Version */}
          <div className="pt-1 flex items-center justify-between px-1">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-[40px] px-2.5 py-1.5 -ml-2 rounded-xl inline-flex items-center gap-1.5 text-[13px] font-semibold transition-transform duration-150 active:scale-[0.97] cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                <LogOut size={15} strokeWidth={1.8} />
                <span>Sign out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNav('/login')}
                className="min-h-[40px] px-2.5 py-1.5 -ml-2 rounded-xl inline-flex items-center gap-1.5 text-[13px] font-semibold transition-transform duration-150 active:scale-[0.97] cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                <User size={15} strokeWidth={1.8} />
                <span>Sign in</span>
              </button>
            )}

            <span
              className="text-[11px] font-medium select-none"
              style={{ color: 'var(--text-muted)' }}
            >
              {APP_VERSION}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenuSheet;

