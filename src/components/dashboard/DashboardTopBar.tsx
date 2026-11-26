import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sun, Moon, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useTheme } from '@/hooks/useTheme';
import { useWallet } from '@/hooks/useWallet';
import { KobanChip } from '@/components/koban/KobanIcon';
import { getDisplayName } from '@/utils/displayName';
import { getEquippedLoadout } from '@/utils/userStateSource';
import {
  DashboardMenuContent,
  clearCachedAuthAndAdminStorage,
} from './HamburgerMenuSheet';
import { prefetchTabRouteAndData } from '@/lib/routePrefetch';
import { perfMarkStart } from '@/lib/perfMetrics';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { useProBadge } from '@/contexts/ProBadgeContext';
import { usePlusBadge } from '@/contexts/PlusBadgeContext';
import { clearOptimisticUserSnapshot } from '@/lib/swrCache';
import { useSmartBack } from '@/utils/homeUrl';

interface Props {
  sidebarCollapsed?: boolean;
  showBackArrow?: boolean;
  title?: string;
}

const SUBPAGE_TITLE_KEY_MAP: Record<string, string> = {
  '/rewards': 'nav.rewards',
  '/leaderboard': 'grandLine.leaderboard',
  '/grand-line': 'nav.grandLine',
  '/grand-line/about': 'nav.grandLine',
  '/grand-line/leaderboard': 'grandLine.leaderboard',
  '/pricing': 'nav.plansBilling',
  '/mcqs': 'nav.mcqs',
  '/subjects': 'dashboard.subjects',
  '/contact': 'settings.contactSupport',
  '/terms': 'settings.termsOfService',
  '/privacy': 'settings.privacyPolicy',
  '/commons/about': 'nav.commons',
  '/about': 'settings.aboutBoardly',
  '/search': 'common.search',
};

const SUBPAGE_FALLBACK_MAP: Record<string, string> = {
  '/arena': 'Live Arena',
  '/captains': 'Captains',
  '/nakama-captains': 'Captains',
  '/captain/leaderboard': 'Standings',
  '/captains/leaderboard': 'Standings',
  '/captain/apply': 'Captain Apply',
  '/captains/apply': 'Captain Apply',
  '/crew/apply': 'Crew Apply',
  '/material': 'Material',
  '/study-material': 'Material',
  '/kobans': 'Kobans',
  '/about-kobans': 'Kobans',
  '/guidelines': 'Guidelines',
  '/commons/guidelines': 'Guidelines',
  '/features': 'Features',
  '/how-it-works': 'How It Works',
  '/faq': 'FAQ',
  '/verify': 'Verify',
  '/bookmarks': 'Bookmarks',
  '/dashboard/bookmarks': 'Bookmarks',
};

export function DashboardTopBar({
  sidebarCollapsed: _sidebarCollapsed,
  showBackArrow,
  title,
}: Props) {
  const { signOutUser, isAdmin, isGuest, authStatus, profileLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const { t, isRtl } = useLanguage();
  const { user, profile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const handleBack = useSmartBack();

  const mappedTitleKey = SUBPAGE_TITLE_KEY_MAP[location.pathname];
  const autoSubPageTitle =
    title ||
    (mappedTitleKey ? t(mappedTitleKey) : undefined) ||
    SUBPAGE_FALLBACK_MAP[location.pathname] ||
    (location.pathname.startsWith('/grand-line/')
      ? t('nav.grandLine')
      : location.pathname.startsWith('/tests/')
      ? t('nav.grandLine')
      : location.pathname.startsWith('/material/') ||
        location.pathname.startsWith('/study-material/')
      ? 'Material'
      : location.pathname.startsWith('/mcqs/') ||
        location.pathname.startsWith('/subjects/') ||
        location.pathname.startsWith('/practice/')
      ? t('nav.practice')
      : location.pathname.startsWith('/captains/')
      ? 'Captain'
      : location.pathname.startsWith('/crew/') &&
        location.pathname !== '/crew/my' &&
        location.pathname !== '/crew/dashboard'
      ? t('nav.crew')
      : location.pathname.startsWith('/join/')
      ? t('nav.crew')
      : location.pathname.startsWith('/verify/')
      ? 'Verify'
      : location.pathname.startsWith('/u/') ||
        location.pathname.startsWith('/profile/') ||
        location.pathname.startsWith('/user/') ||
        location.pathname.startsWith('/users/')
      ? t('nav.profile')
      : location.pathname.startsWith('/store/')
      ? t('nav.store')
      : undefined);

  const shouldShowBackArrow =
    showBackArrow !== undefined ? showBackArrow : Boolean(autoSubPageTitle);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; right?: number; left?: number }>({
    top: 72,
    right: 16,
  });

  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);

  const { theme, toggle: toggleTheme } = useTheme();
  const { effectiveProBadge } = useProBadge();
  const { effectivePlusBadgeId } = usePlusBadge();

  // Track viewport size so phones (<640px) use the bottom sheet and desktop uses the avatar dropdown
  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 640;
      setIsMobileViewport(mobile);
      if (!mobile && avatarBtnRef.current) {
        const rect = avatarBtnRef.current.getBoundingClientRect();
        setDropdownCoords(
          isRtl
            ? {
                top: Math.round(rect.bottom + 10),
                left: Math.max(12, Math.round(rect.left)),
              }
            : {
                top: Math.round(rect.bottom + 10),
                right: Math.max(12, Math.round(window.innerWidth - rect.right)),
              }
        );
      }
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [isRtl]);

  // Recompute dropdown position whenever menu opens on desktop
  useEffect(() => {
    if (menuOpen && !isMobileViewport && avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect();
      setDropdownCoords(
        isRtl
          ? {
              top: Math.round(rect.bottom + 10),
              left: Math.max(12, Math.round(rect.left)),
            }
          : {
              top: Math.round(rect.bottom + 10),
              right: Math.max(12, Math.round(window.innerWidth - rect.right)),
            }
      );
    }
  }, [menuOpen, isMobileViewport, isRtl]);

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
    if (user || profile?.uid || authStatus === 'loading' || authStatus === 'authenticated') {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  }, [user, profile?.uid, authStatus, navigate]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setMenuOpen(false);
    setIsSigningOut(true);
    if (typeof window !== 'undefined') {
      (window as any).__boardlySigningOut = true;
    }
    try {
      await signOutUser({ force: true });
      clearCachedAuthAndAdminStorage();
      clearOptimisticUserSnapshot();
    } finally {
      try {
        sessionStorage.removeItem('boardly_post_login_redirect');
      } catch {
        // ignore
      }
      setIsSigningOut(false);
      navigate('/login', { replace: true });
    }
  };

  const effectivePlan = useEffectivePlan();
  const { kobanBalance, balanceLoaded, equipped } = useWallet();
  const isPro = !isGuest && effectivePlan.isUnlimited;
  const headerLoadout = getEquippedLoadout({
    uid: user?.uid,
    equipped,
    avatar: (profile as Record<string, unknown> | null)?.avatar as string | undefined,
    equippedAvatar: (profile as Record<string, unknown> | null)?.equippedAvatar as string | undefined,
    equippedFrame: (profile as Record<string, unknown> | null)?.equippedFrame as string | undefined,
    photoURL: profile?.photoURL || user?.photoURL,
  });

  return (
    <>
      <header
        className="sticky top-0 z-[70] w-full max-w-full box-border px-3 sm:px-6 lg:px-8 pb-2 shrink-0 pointer-events-none select-none overflow-visible dashboard-topbar-wrap"
        style={{
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div
          className="w-full max-w-[1400px] mx-auto min-w-0 box-border h-14 sm:h-[60px] px-3 sm:px-4 rounded-full dashboard-glass-bar allow-backdrop-blur flex flex-row items-center justify-between gap-2 pointer-events-auto transition-all duration-200 overflow-hidden"
        >
          {/* Left side: Back arrow + Title (on sub-pages like /rewards) or Boardly Doto logo + PRO pill */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            {shouldShowBackArrow && (
              <button
                type="button"
                onClick={handleBack}
                aria-label={t('nav.goBack')}
                title={t('nav.goBack')}
                className="w-9 h-9 min-w-[36px] min-h-[36px] sm:w-10 sm:h-10 rounded-full dashboard-topbar-icon-btn flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              >
                <ArrowLeft size={18} strokeWidth={2} />
              </button>
            )}

            <div className="flex flex-col justify-center shrink-0 min-w-0">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
                {autoSubPageTitle ? (
                  <span
                    className="inline-flex items-center shrink-0 whitespace-nowrap select-none leading-none tracking-tight text-[16px] min-[390px]:text-[18px] sm:text-[20px] font-heading font-extrabold text-[var(--text)] truncate max-w-[125px] sm:max-w-none"
                  >
                    {autoSubPageTitle}
                  </span>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center shrink-0 whitespace-nowrap select-none leading-none tracking-tight hover:opacity-90 transition-opacity text-[18px] min-[390px]:text-[20px] sm:text-[22px]"
                    style={{
                      fontFamily: "'Doto', var(--font-dot), sans-serif",
                      fontWeight: 800,
                      color: 'var(--cw-red-text)',
                    }}
                    aria-label={`Boardly ${t('nav.dashboard')}`}
                  >
                    Boardly
                  </Link>
                )}

                {!isGuest && effectivePlan.isPlus && effectivePlusBadgeId !== null ? (
                  <span className="shrink-0 inline-flex items-center">
                    <PlusBadge
                      id={effectivePlusBadgeId}
                      size="sm"
                      animated
                      priority
                      className="ms-0.5 shrink-0"
                    />
                  </span>
                ) : isPro && !effectivePlan.isPlus && effectiveProBadge ? (
                  <span className="shrink-0 inline-flex items-center">
                    <ProBadge
                      design={effectiveProBadge}
                      size="sm"
                      animated
                      priority
                      className="ms-0.5 shrink-0"
                    />
                  </span>
                ) : null}
              </div>

              {isAdmin && !autoSubPageTitle && (
                <button
                  type="button"
                  onMouseEnter={() => prefetchTabRouteAndData('admin', user?.uid)}
                  onTouchStart={() => prefetchTabRouteAndData('admin', user?.uid)}
                  onClick={() => {
                    perfMarkStart('admin_student_count');
                    navigate('/admin');
                  }}
                  className="inline-flex items-center text-[9px] leading-none font-bold hover:underline tracking-tight mt-0.5 text-start cursor-pointer w-fit whitespace-nowrap"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--cw-red-text)',
                  }}
                >
                  {t('nav.adminPanel')}
                </button>
              )}
            </div>
          </div>

          {/* End side: AI Mentors (desktop), Coin chip, Theme toggle, and Profile avatar */}
          <div className="flex items-center gap-2 shrink-0 ms-auto">
            {/* Desktop (1024px+) AI Mentors navigation item */}
            <button
              type="button"
              data-testid="topbar-ai-mentors-btn"
              onMouseEnter={() => prefetchTabRouteAndData('ai', user?.uid)}
              onTouchStart={() => prefetchTabRouteAndData('ai', user?.uid)}
              onClick={() => {
                if (!user) {
                  requireAuth(t('nav.aiMentors'));
                  return;
                }
                navigate('/dashboard/ai');
              }}
              aria-label={t('nav.aiMentors')}
              title={t('nav.aiMentors')}
              className="hidden lg:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full dashboard-topbar-icon-btn text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Sparkles size={15} strokeWidth={2.1} className="text-[var(--accent)]" />
              <span>AI Mentors</span>
            </button>

            {/* Kobans Wallet Chip */}
            <div
              title={t('nav.store')}
              className="flex items-center justify-end shrink-0 whitespace-nowrap transition-transform hover:scale-105"
            >
              <KobanChip balance={kobanBalance} loading={!balanceLoaded} />
            </div>

            {/* Theme Toggle (40px round glass icon button) */}
            <button
              type="button"
              data-testid="rewards-theme-toggle"
              onClick={toggleTheme}
              aria-label={t('nav.switchTheme')}
              title={t('nav.switchTheme')}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full dashboard-topbar-icon-btn flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              {theme === 'dark' ? (
                <Sun size={17} strokeWidth={1.85} />
              ) : (
                <Moon size={17} strokeWidth={1.85} />
              )}
            </button>

            {/* Profile Avatar — opens /profile directly */}
            <button
              ref={avatarBtnRef}
              type="button"
              onMouseEnter={() => prefetchTabRouteAndData('profile', user?.uid)}
              onTouchStart={() => prefetchTabRouteAndData('profile', user?.uid)}
              onClick={handleOpenProfile}
              aria-label={t('nav.viewProfile')}
              title={t('nav.viewProfile')}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full overflow-visible shrink-0 flex items-center justify-center self-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                width: 36,
                height: 36,
              }}
            >
              <BoardlyAvatar
                uid={user?.uid}
                name={getDisplayName(
                  {
                    display_name: profile?.display_name ?? profile?.displayName,
                    realName: profile?.realName ?? profile?.name ?? user?.displayName,
                    username: profile?.username,
                  },
                  ''
                )}
                loading={(authStatus === 'loading' || profileLoading) && !user?.uid && !profile?.uid}
                photoURL={headerLoadout.photoURL}
                equippedAvatar={headerLoadout.avatar}
                equippedFrameId={headerLoadout.frame}
                size={36}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile (<640px): Menu navigates straight to /settings without a blank lazy sheet */}

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
                ...(dropdownCoords.left !== undefined
                  ? { left: `${dropdownCoords.left}px` }
                  : { right: `${dropdownCoords.right ?? 16}px` }),
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
