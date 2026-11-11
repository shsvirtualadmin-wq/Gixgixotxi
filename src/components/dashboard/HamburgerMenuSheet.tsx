import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  LogOut,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Pencil,
  Search,
  X,
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
import { KobanIcon } from '@/components/koban/KobanIcon';
import { ProBadge } from '@/components/ui/ProBadge';
import { useProBadge } from '@/contexts/ProBadgeContext';

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
  showCoinBalanceInStore?: boolean;
  searchQuery?: string;
  hideProfileHeader?: boolean;
}

interface MenuRowDefinition {
  id: string;
  label: string;
  subtitle?: string;
  keywords: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  rightBadge?: React.ReactNode;
}

export const DashboardMenuContent: React.FC<DashboardMenuContentProps> = ({
  onNavigate,
  onOpenProfile,
  onSignOut,
  searchQuery = '',
  hideProfileHeader = false,
}) => {
  const location = useLocation();
  const { user, profileLoading, isAdmin, isGuest } = useAuth();
  const { profile } = useUserProfile();
  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, equipped } = useWallet();
  const { themeSetting, resolvedTheme, setTheme } = useTheme();
  const { effectiveProBadge } = useProBadge();

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

  const rawName =
    profile?.nickname || profile?.displayName || user?.displayName || 'Student';
  const displayName = user
    ? sanitizeStudentDisplayName(rawName, profile?.shortId || user?.uid)
    : 'Guest Student';
  const handleText = user
    ? `@${profile?.username || profile?.shortId || user.uid.slice(0, 6)}`
    : '@guest';

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

  const q = searchQuery.trim().toLowerCase();

  // Group 1: Boardly Commons, Grand Line Mock Tests, Boardly Store (with coin count badge), Leaderboard, Rewards (subtitle "Daily Check-in & Referrals")
  const group1Rows = useMemo<MenuRowDefinition[]>(() => {
    const rows: MenuRowDefinition[] = [
      {
        id: 'commons',
        label: 'Boardly Commons',
        keywords: 'boardly commons community feed posts discussions',
        icon: <Compass size={18} strokeWidth={1.9} />,
        active: isCommonsActive,
        onClick: () => onNavigate(commonsTarget),
      },
      {
        id: 'grand-line',
        label: 'Grand Line Mock Tests',
        keywords: 'grand line mock tests exams practice drills',
        icon: <Award size={18} strokeWidth={1.9} />,
        active: isGrandLineActive,
        onClick: () => onNavigate('/grand-line'),
      },
      {
        id: 'store',
        label: 'Boardly Store',
        keywords: 'boardly store shop kobans coins cosmetics frames avatars',
        icon: <ShoppingBag size={18} strokeWidth={1.9} />,
        active: isStoreActive,
        onClick: () => onNavigate('/store'),
        rightBadge: (
          <span className="fsm-coin-badge" title="Kobans balance">
            <KobanIcon size={14} decorative />
            <span>{(kobanBalance ?? 0).toLocaleString()}</span>
          </span>
        ),
      },
      {
        id: 'leaderboard',
        label: 'Leaderboard',
        keywords: 'leaderboard rankings top scorers standings',
        icon: <Trophy size={18} strokeWidth={1.9} />,
        active: isLeaderboardActive,
        onClick: () => onNavigate('/leaderboard'),
      },
      {
        id: 'rewards',
        label: 'Rewards',
        subtitle: 'Daily Check-in & Referrals',
        keywords: 'rewards daily check-in referrals kobans streaks bonus',
        icon: <Sparkles size={18} strokeWidth={1.9} />,
        active: isRewardsActive,
        onClick: () => onNavigate('/rewards'),
      },
    ];
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        (r.subtitle && r.subtitle.toLowerCase().includes(q)) ||
        r.keywords.includes(q)
    );
  }, [
    isCommonsActive,
    commonsTarget,
    isGrandLineActive,
    isStoreActive,
    kobanBalance,
    isLeaderboardActive,
    isRewardsActive,
    onNavigate,
    q,
  ]);

  // Group 2: Settings, Superadmin Portal (super admins / admins only) + Captain Deck (for captains)
  const group2Rows = useMemo<MenuRowDefinition[]>(() => {
    const rows: MenuRowDefinition[] = [
      {
        id: 'settings',
        label: 'Settings',
        keywords: 'settings account preferences security password profile pro badge',
        icon: <Settings size={18} strokeWidth={1.9} />,
        active: isSettingsActive,
        onClick: () => onNavigate('/settings'),
      },
    ];

    if (isApprovedCaptain) {
      rows.push({
        id: 'captain-deck',
        label: 'Captain Deck',
        keywords: 'captain deck ambassador referrals tests',
        icon: <Award size={18} strokeWidth={1.9} />,
        active: isCaptainActive,
        onClick: () => onNavigate('/dashboard/captain'),
      });
    }

    if (isConfirmedAdmin) {
      rows.push({
        id: 'superadmin-portal',
        label: isConfirmedSuperAdmin ? 'Superadmin Portal' : 'Admin Portal',
        keywords: 'superadmin admin portal dashboard moderation users',
        icon: <Shield size={18} strokeWidth={1.9} />,
        active: isAdminActive,
        onClick: () => onNavigate('/admin'),
      });
    }

    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        (r.subtitle && r.subtitle.toLowerCase().includes(q)) ||
        r.keywords.includes(q)
    );
  }, [
    isSettingsActive,
    isApprovedCaptain,
    isCaptainActive,
    isConfirmedAdmin,
    isConfirmedSuperAdmin,
    isAdminActive,
    onNavigate,
    q,
  ]);

  // Group 3: Appearance with Light / Dark / System dropdown
  const showAppearanceGroup = useMemo(() => {
    if (!q) return true;
    return 'appearance theme light dark system mode color'.includes(q);
  }, [q]);

  // Group 4: Sign out + v1.0.0
  const showSignOutGroup = useMemo(() => {
    if (!q) return true;
    return 'sign out logout log out exit version v1.0.0'.includes(q);
  }, [q]);

  const noResults =
    q.length > 0 &&
    group1Rows.length === 0 &&
    group2Rows.length === 0 &&
    !showAppearanceGroup &&
    !showSignOutGroup;

  return (
    <div className="space-y-4">
      {/* Centered 88px Avatar + Edit Pencil Badge, Name, @username, Role Pill */}
      {!hideProfileHeader && (
        <div className="flex flex-col items-center text-center pt-1 pb-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative inline-flex items-center justify-center rounded-full cursor-pointer group focus:outline-none"
            aria-label="Edit profile"
          >
            <BoardlyAvatar
              uid={user?.uid}
              name={displayName}
              avatar={(profile as Record<string, unknown> | null)?.avatar as string | null}
              equippedAvatar={equipped?.avatar}
              frame={equipped?.frame}
              size={88}
            />
            <span className="fsm-edit-badge transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
              <Pencil size={13} strokeWidth={2.2} />
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="mt-3 flex flex-col items-center text-center cursor-pointer focus:outline-none"
          >
            <span
              className="font-dot text-xl font-bold leading-tight tracking-tight"
              style={{ color: 'var(--menu-text)' }}
            >
              {displayName}
            </span>
            <span
              className="mt-0.5 text-sm font-medium"
              style={{ color: 'var(--menu-subtext)' }}
            >
              {handleText}
            </span>
          </button>

          <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
            <span className="fsm-role-pill">{singleBadgeLabel}</span>
            {isPro && effectiveProBadge && (
              <ProBadge design={effectiveProBadge} size="sm" animated priority />
            )}
          </div>
        </div>
      )}

      {noResults && (
        <div
          className="fsm-card p-6 text-center text-sm"
          style={{ color: 'var(--menu-subtext)' }}
        >
          No menu items matching &ldquo;{searchQuery.trim()}&rdquo;
        </div>
      )}

      {/* Group 1: Boardly Commons, Grand Line Mock Tests, Boardly Store (with coin badge), Leaderboard, Rewards */}
      {group1Rows.length > 0 && (
        <div className="fsm-card">
          {group1Rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={row.onClick}
              className={`fsm-row ${row.active ? 'fsm-row--active' : ''}`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <span className="fsm-row-icon">{row.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="fsm-row-label truncate">{row.label}</div>
                  {row.subtitle && (
                    <div className="fsm-row-subtitle truncate">{row.subtitle}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {row.rightBadge}
                <ChevronRight size={18} strokeWidth={2} className="fsm-row-chevron" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Group 2: Settings, Superadmin Portal (super admins / admins only) */}
      {group2Rows.length > 0 && (
        <div className="fsm-card">
          {group2Rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={row.onClick}
              className={`fsm-row ${row.active ? 'fsm-row--active' : ''}`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <span className="fsm-row-icon">{row.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="fsm-row-label truncate">{row.label}</div>
                  {row.subtitle && (
                    <div className="fsm-row-subtitle truncate">{row.subtitle}</div>
                  )}
                </div>
              </div>

              <ChevronRight size={18} strokeWidth={2} className="fsm-row-chevron" />
            </button>
          ))}
        </div>
      )}

      {/* Group 3: Appearance with Light / Dark / System dropdown */}
      {showAppearanceGroup && (
        <div className="fsm-card">
          <div className="fsm-row" style={{ cursor: 'default' }}>
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <span className="fsm-row-icon">
                {resolvedTheme === 'dark' ? (
                  <Moon size={18} strokeWidth={1.9} />
                ) : (
                  <Sun size={18} strokeWidth={1.9} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="fsm-row-label truncate">Appearance</div>
              </div>
            </div>

            <div className="fsm-appearance-select-wrap shrink-0">
              <select
                aria-label="Appearance"
                value={themeSetting}
                onChange={(e) => setTheme(e.target.value as ThemeSetting)}
                className="fsm-appearance-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <ChevronDown
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute right-2.5"
                style={{ color: 'var(--menu-subtext)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Last: Separate card with red "Sign out" row and "v1.0.0" label */}
      {showSignOutGroup && (
        <div className="fsm-card">
          <button
            type="button"
            data-menu-item="sign-out"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (user) {
                onSignOut();
              } else {
                onNavigate('/login');
              }
            }}
            className="fsm-row fsm-row--danger"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <span className="fsm-row-icon">
                <LogOut size={18} strokeWidth={1.9} />
              </span>
              <span className="fsm-row-label truncate">Sign out</span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className="text-xs font-mono tabular-nums font-medium"
                style={{ color: 'var(--menu-subtext)' }}
              >
                {APP_VERSION}
              </span>
              <ChevronRight size={18} strokeWidth={2} className="fsm-row-chevron" />
            </div>
          </button>
        </div>
      )}
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

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Swipe-back (left-to-right horizontal swipe) & focus trap refs
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchDeltaX = useRef<number>(0);
  const isSwipingBack = useRef<boolean>(false);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const pushedHistoryRef = useRef<boolean>(false);

  // Lock body scroll while full-screen menu is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-hamburger-sheet-open', 'true');
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.removeAttribute('data-hamburger-sheet-open');
      };
    } else {
      document.body.removeAttribute('data-hamburger-sheet-open');
    }
  }, [isOpen]);

  // Smooth slide-in from right on open & slide-out to right on close
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setSearchQuery('');
      setIsRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else if (!isSigningOut) {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsRendered(false);
        previousActiveElementRef.current?.focus?.({ preventScroll: true });
      }, 320);
    }
    return () => clearTimeout(timer);
  }, [isOpen, isSigningOut]);

  // Phone's back button support via history popstate
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

  const dismissMenu = useCallback(() => {
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

  // Escape key & Tab focus trap inside the page
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissMenu();
        return;
      }

      if (e.key === 'Tab' && pageRef.current) {
        const focusables = Array.from(
          pageRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen, dismissMenu]);

  // Horizontal swipe-back (left-to-right) to close
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isSwipingBack.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isSwipingBack.current) {
      if (dx > 14 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        isSwipingBack.current = true;
      } else {
        return;
      }
    }

    if (isSwipingBack.current && dx > 0) {
      touchDeltaX.current = dx;
      if (pageRef.current) {
        pageRef.current.style.transition = 'none';
        pageRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (pageRef.current) {
      pageRef.current.style.transition = '';
      pageRef.current.style.transform = '';
    }
    if (isSwipingBack.current && touchDeltaX.current > 72) {
      dismissMenu();
    }
    touchDeltaX.current = 0;
    isSwipingBack.current = false;
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

  if (!isOpen && !isRendered) return null;

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

  const stopAllPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const pageContent = (
    <div
      ref={pageRef}
      data-hamburger-sheet="true"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onClick={stopAllPropagation}
      onMouseDown={stopAllPropagation}
      onPointerDown={stopAllPropagation}
      onPointerUp={stopAllPropagation}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`fsm-page ${isVisible ? 'fsm-page--open' : 'fsm-page--closed'}`}
    >
      {/* Scrollable full-screen content area */}
      <div className="fsm-scroll-area">
        <div className="fsm-container">
          {/* Top-left 44px circular liquid-glass back-arrow button */}
          <div className="flex items-center justify-between mb-1">
            <button
              type="button"
              onClick={dismissMenu}
              className="fsm-back-btn"
              aria-label="Back"
            >
              <ArrowLeft size={20} strokeWidth={2.1} />
            </button>
          </div>

          <DashboardMenuContent
            onNavigate={handleNav}
            onOpenProfile={handleOpenProfile}
            onSignOut={handleSignOut}
            showCoinBalanceInStore={showCoinBalanceInStore}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* Floating pill-shaped liquid-glass "Search menu" bar at the bottom */}
      <div className="fsm-search-wrap">
        <div className="fsm-search-pill">
          <Search
            size={18}
            strokeWidth={2}
            className="shrink-0"
            style={{ color: 'var(--menu-subtext)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu"
            aria-label="Search menu"
            className="fsm-search-input"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: 'var(--menu-icon-bg)',
                color: 'var(--menu-subtext)',
              }}
            >
              <X size={13} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(pageContent, document.body)
    : pageContent;
};

export default HamburgerMenuSheet;
