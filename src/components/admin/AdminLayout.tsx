import { useState, useEffect, Suspense, useCallback, useMemo, useRef } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Database,
  FileCheck2,
  CreditCard,
  Terminal,
  MoreHorizontal,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Activity,
  Award,
  Tag,
  Megaphone,
  Lock,
  KeyRound,
  MessageSquare,
  BookOpen,
  Sparkles,
  Ticket,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayInitial, getDisplayName } from '@/utils/displayName';
import { RoutePageSkeleton } from '@/components/ui/Skeleton';
import {
  buildFullPath,
  buildLoginRedirectUrl,
  evaluateAdminRouteAccess,
  persistPostLoginRedirect,
} from '@/utils/routeGuards';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { NAKAMA_CAPTAINS_NAME } from '@/constants/branding';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { useBodyScrollLock, safetyCleanupScrollLocks } from '@/utils/scrollLock';
import {
  scheduleIdleAdminPrefetchAll,
  prefetchAdminRouteOnInteraction,
  fetchAdminNavBadgesSWR,
  getCachedAdminNavBadges,
  patchCachedModerationBadge,
} from '@/services/adminTabCache';
import { clearGenericErrorToasts } from '@/lib/api';
import type { PermissionKey } from '@/constants/permissions';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';
import {
  AdminAmbientBubbles,
  AdminOverlay,
  BottomNav,
  useAdminButtonBubble,
} from '@/components/admin/AdminGlassPrimitives';
import '@/styles/adminGlass.css';

const AdminKobanNavIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <KobanIcon size={typeof size === 'number' ? size : 16} decorative className={className} />
);

interface AdminNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard | typeof AdminKobanNavIcon;
  end?: boolean;
  permission?: PermissionKey;
  superAdminOnly?: boolean;
  badgeKey?: 'accessRequests' | 'moderation';
}

/**
 * Exact 5 primary tabs for the mobile bottom nav (plus the 6th "More" slot):
 * Overview | Questions | Formulas | Applications | Certificates | More
 */
const BOTTOM_PRIMARY_NAV: AdminNavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/questions', label: 'Questions', icon: Database, permission: 'mcq.manage' },
  { to: '/admin/formulas', label: 'Formulas', icon: BookOpen, permission: 'mcq.manage' },
  { to: '/admin/applications', label: 'Applications', icon: FileCheck2, permission: 'users.role' },
  { to: '/admin/certificates', label: 'Certificates', icon: Award, permission: 'certificates.issue' },
];

/**
 * Primary items featured in the "More" menu (in exact requested order) and desktop sidebar.
 */
const MORE_MAIN_NAV: AdminNavItem[] = [
  { to: '/admin/users', label: 'Users', icon: Users, permission: 'users.view', superAdminOnly: true },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'users.plan' },
  { to: '/admin/coupons', label: 'Coupon Studio', icon: Ticket, permission: 'users.plan' },
  { to: '/admin/ads', label: 'Ads', icon: Megaphone },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, permission: 'announcements.manage', superAdminOnly: true },
  { to: '/admin/access-requests', label: 'Access Requests', icon: KeyRound, permission: 'audit.view', superAdminOnly: true, badgeKey: 'accessRequests' },
  { to: '/superadmin', label: 'Superadmin Area', icon: ShieldAlert, superAdminOnly: true, end: true },
];

/**
 * Secondary admin tools (kept accessible so zero existing routes are lost).
 */
const SECONDARY_NAV: AdminNavItem[] = [
  { to: '/admin/commons', label: 'Moderation', icon: MessageSquare, permission: 'content.delete', badgeKey: 'moderation' },
  { to: '/admin/plans', label: 'Plans & Pricing', icon: Sparkles, permission: 'users.plan', superAdminOnly: true },
  { to: '/admin/kobans', label: 'Kobans', icon: AdminKobanNavIcon, permission: 'coupons.grant', superAdminOnly: true },
  { to: '/admin/pricing', label: 'Store Pricing', icon: Tag, permission: 'coupons.grant', superAdminOnly: true },
  { to: '/admin/signatures?tab=signature', label: 'Certificate Signature', icon: FileCheck2, permission: 'certificates.issue', superAdminOnly: true },
  { to: '/admin/captains', label: NAKAMA_CAPTAINS_NAME, icon: Award, permission: 'tests.manage', superAdminOnly: true },
  { to: '/admin/crews', label: 'Crews', icon: Shield, permission: 'users.view', superAdminOnly: true },
  { to: '/admin/audit-logs', label: 'Audit log', icon: Terminal, permission: 'audit.view', superAdminOnly: true },
  { to: '/admin/health', label: 'Health & Tests', icon: Activity, superAdminOnly: true },
];

const ALL_SIDEBAR_NAV: AdminNavItem[] = [
  ...BOTTOM_PRIMARY_NAV,
  ...MORE_MAIN_NAV,
  ...SECONDARY_NAV,
];

export function AdminLayout() {
  const {
    user,
    profile,
    authStatus,
    isGuest,
    profileLoading,
    tokenClaims,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    isSessionVerified,
    otpVerificationState,
    signOutUser,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const cachedBadges = getCachedAdminNavBadges();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(
    cachedBadges?.pendingRequestsCount ?? 0
  );
  const [pendingModerationCount, setPendingModerationCount] = useState(
    cachedBadges?.pendingModerationCount ?? 0
  );
  const [scrolled, setScrolled] = useState(false);
  const [isActivelyScrolling, setIsActivelyScrolling] = useState(false);
  const scrollIdleTimerRef = useRef<number | null>(null);
  const { enabled: glassEnabled, toggle: toggleAdminGlass } = useAdminGlassFlag();

  // Delegated glossy iOS button touch-bubble + haptic feedback (respects prefers-reduced-motion)
  useAdminButtonBubble(glassEnabled);
  useBodyScrollLock(isMoreOpen, 'admin-more-sheet');

  // Passive scroll listener: updates header border + lowers bottom-nav blur while actively scrolling
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4);
      setIsActivelyScrolling(true);
      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }
      scrollIdleTimerRef.current = window.setTimeout(() => {
        setIsActivelyScrolling(false);
        scrollIdleTimerRef.current = null;
      }, 160);
    };
    setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsMoreOpen(false);
    safetyCleanupScrollLocks();
    clearGenericErrorToasts();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (isMoreOpen) {
      document.body.setAttribute('data-fullscreen-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-fullscreen-modal-open');
    }
    return () => {
      document.body.removeAttribute('data-fullscreen-modal-open');
    };
  }, [isMoreOpen]);

  // Combined SWR badge loader — NO setInterval polling! Refreshes only on mount + explicit custom events.
  const canModerateCommons = isSuperAdmin || hasPermission('content.delete');
  useEffect(() => {
    if (!user || (!isAdmin && !isSuperAdmin)) {
      setPendingRequestsCount(0);
      setPendingModerationCount(0);
      return;
    }
    let cancelled = false;
    const loadBadges = async (force = false) => {
      try {
        const res = await fetchAdminNavBadgesSWR({
          includeAccessRequests: isSuperAdmin,
          includeModeration: canModerateCommons,
          force,
        });
        if (!cancelled) {
          setPendingRequestsCount(res.pendingRequestsCount);
          setPendingModerationCount(res.pendingModerationCount);
        }
      } catch {
        // non-fatal
      }
    };

    const handleAccessRequestsUpdated = () => {
      void loadBadges(true);
    };

    const handleModerationUpdated = (ev: Event) => {
      const detailCount = (ev as CustomEvent<{ count?: number }>).detail?.count;
      if (typeof detailCount === 'number' && Number.isFinite(detailCount)) {
        const nextCount = Math.max(0, Math.floor(detailCount));
        patchCachedModerationBadge(nextCount);
        setPendingModerationCount(nextCount);
      } else {
        void loadBadges(true);
      }
    };

    void loadBadges(false);
    window.addEventListener('boardly:access-requests-updated', handleAccessRequestsUpdated);
    window.addEventListener('boardly:moderation-updated', handleModerationUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('boardly:access-requests-updated', handleAccessRequestsUpdated);
      window.removeEventListener('boardly:moderation-updated', handleModerationUpdated);
    };
  }, [user, isAdmin, isSuperAdmin, canModerateCommons]);

  // Prefetch admin tab chunks and SWR data during idle time once AdminLayout is verified
  useEffect(() => {
    if (!profileLoading && user && isSessionVerified && isAdmin) {
      return scheduleIdleAdminPrefetchAll(user.uid, isSuperAdmin);
    }
  }, [profileLoading, user, isSessionVerified, isAdmin, isSuperAdmin]);

  const handleSignOut = async () => {
    setIsMoreOpen(false);
    await signOutUser({ force: true });
    try {
      sessionStorage.removeItem('boardly_post_login_redirect');
    } catch {
      // ignore
    }
    navigate('/login', { replace: true });
  };

  const adminDisplayName = getDisplayName({
    display_name: profile?.display_name ?? profile?.displayName,
    realName: profile?.realName ?? profile?.name ?? user?.displayName,
    username: profile?.username,
  });

  const userInitial = getDisplayInitial(
    {
      display_name: profile?.display_name ?? profile?.displayName,
      realName: profile?.realName ?? profile?.name ?? user?.displayName,
      username: profile?.username,
    },
    'A'
  );

  // Filter superAdmin-only items for non-superAdmins in sidebar & More menu
  const visibleMoreMainNav = useMemo(
    () => MORE_MAIN_NAV.filter((item) => !item.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  );
  const visibleSecondaryNav = useMemo(
    () => SECONDARY_NAV.filter((item) => !item.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  );
  const visibleSidebarNav = useMemo(
    () => ALL_SIDEBAR_NAV.filter((item) => !item.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  );

  const activeNavItem = visibleSidebarNav.find((item) => {
    const base = item.to.split('?')[0];
    return item.end ? location.pathname === base : location.pathname.startsWith(base);
  });
  const mobileTitle = activeNavItem?.label || (isSuperAdmin ? 'Super Admin' : 'Admin');

  // Active tab detection for the 6-slot bottom nav (Overview | Questions | Formulas | Applications | Certificates | More)
  const mobileActivePrimaryIdx = BOTTOM_PRIMARY_NAV.findIndex((item) => {
    const base = item.to.split('?')[0];
    return item.end ? location.pathname === base : location.pathname.startsWith(base);
  });

  const isMoreSectionActive =
    mobileActivePrimaryIdx < 0 &&
    ([...visibleMoreMainNav, ...visibleSecondaryNav].some((item) => {
      const base = item.to.split('?')[0];
      return item.end ? location.pathname === base : location.pathname.startsWith(base);
    }) ||
      location.pathname.startsWith('/admin/signatures'));

  const mobileActiveTabIdx =
    mobileActivePrimaryIdx >= 0
      ? mobileActivePrimaryIdx
      : isMoreSectionActive
      ? BOTTOM_PRIMARY_NAV.length
      : -1;

  const isNavItemLocked = useCallback(
    (item: AdminNavItem): boolean => {
      if (isSuperAdmin) return false;
      if (item.superAdminOnly) return true;
      if (!item.permission) return false;
      return !hasPermission(item.permission);
    },
    [isSuperAdmin, hasPermission]
  );

  const getPendingBadgeCount = useCallback(
    (item: AdminNavItem): number => {
      if (item.badgeKey === 'accessRequests') {
        return isSuperAdmin ? pendingRequestsCount : 0;
      }
      if (item.badgeKey === 'moderation') {
        return canModerateCommons ? pendingModerationCount : 0;
      }
      return 0;
    },
    [isSuperAdmin, pendingRequestsCount, canModerateCommons, pendingModerationCount]
  );

  const handlePrefetch = useCallback(
    (to: string) => {
      prefetchAdminRouteOnInteraction(to, user?.uid);
    },
    [user?.uid]
  );

  const handleOpenMore = useCallback(() => {
    setIsMoreOpen(true);
  }, []);

  const bottomNavItems = useMemo(
    () =>
      BOTTOM_PRIMARY_NAV.map((item) => {
        const locked = isNavItemLocked(item);
        return {
          to: item.to,
          label: item.label,
          icon: item.icon,
          end: item.end,
          locked,
          badgeCount: locked ? 0 : getPendingBadgeCount(item),
        };
      }),
    [isNavItemLocked, getPendingBadgeCount]
  );

  // Fail-closed route guard before rendering any admin shell or children
  const adminAccess = evaluateAdminRouteAccess({
    pathname: location.pathname,
    authStatus,
    profileLoading,
    hasUser: Boolean(user),
    isGuest,
    tokenClaimsVerified: Boolean(tokenClaims?.verified),
    isAdmin,
    isSuperAdmin,
    otpStatus: otpVerificationState.status,
    otpPurpose: otpVerificationState.purpose,
    isSessionVerified,
  });

  if (adminAccess.action === 'loading') {
    return <RoutePageSkeleton pathname={location.pathname} />;
  }
  if (adminAccess.action === 'redirect_login' || adminAccess.action === 'redirect_verify_email') {
    const fullTarget = buildFullPath(location.pathname, location.search, location.hash);
    persistPostLoginRedirect(fullTarget);
    const dest =
      adminAccess.action === 'redirect_verify_email'
        ? '/verify-email'
        : buildLoginRedirectUrl(location.pathname, location.search, location.hash);
    return <Navigate to={dest} replace />;
  }
  if (adminAccess.action === 'redirect_dashboard') {
    return <Navigate to="/dashboard" replace />;
  }
  if (adminAccess.action === 'redirect_admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div
      data-admin-shell="true"
      data-admin-glass={glassEnabled ? '1' : '0'}
      className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] flex flex-col md:flex-row antialiased overflow-x-clip"
    >
      <AdminAmbientBubbles enabled={glassEnabled} />

      {/* ─── DESKTOP LEFT SIDEBAR (240px) ─────────────────────────────────── */}
      <aside
        className={`hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 md:left-0 border-r z-30 ${
          glassEnabled
            ? 'ag-sidebar border-[var(--ag-border)]'
            : 'glass border-[var(--glass-border)]'
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`h-16 px-5 border-b flex items-center justify-between ${
            glassEnabled ? 'border-[var(--ag-border)]' : 'border-[var(--glass-border)]'
          }`}
        >
          <Link to="/admin" className="flex items-center" aria-label="Boardly Admin">
            <Logo size="admin" />
          </Link>
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isSuperAdmin
                ? glassEnabled
                  ? 'border-[#E8353B]/45 bg-[#E8353B]/14 text-[#ff6f75]'
                  : 'border-[var(--red)]/40 bg-[var(--red)]/10 text-[var(--red)]'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-500 dark:text-amber-400'
            }`}
          >
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleSidebarNav.map((item) => {
            const { to, label, icon: Icon, end } = item;
            const locked = isNavItemLocked(item);
            const badgeCount = locked ? 0 : getPendingBadgeCount(item);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onMouseEnter={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                onFocus={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                onTouchStart={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[13px] font-semibold transition-colors ${
                    locked ? 'opacity-65' : ''
                  } ${
                    isActive
                      ? glassEnabled
                        ? 'bg-[#E8353B]/14 text-[var(--text)] border border-[#E8353B]/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                        : 'glass-row text-[var(--text)] border-[var(--glass-border)]'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={
                        isActive
                          ? glassEnabled
                            ? 'text-[#E8353B]'
                            : 'text-[#D71921]'
                          : 'text-[var(--muted)]'
                      }
                    />
                    <span className="flex-1 whitespace-nowrap">{label}</span>
                    {locked && (
                      <Lock size={12} className="text-amber-400 shrink-0" aria-label="Locked" />
                    )}
                    {badgeCount > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-white text-[10px] font-mono font-bold leading-none shrink-0 ag-tabular ${
                          glassEnabled ? 'bg-[#E8353B]' : 'bg-[var(--red)]'
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`p-3 border-t ${
            glassEnabled ? 'border-[var(--ag-border)]' : 'border-[var(--border)]'
          }`}
        >
          <div
            className={`p-2.5 rounded-[18px] border flex flex-col gap-2 ${
              glassEnabled
                ? 'ag-flat-card border-[var(--ag-border)]'
                : 'bg-[var(--card)] border-[var(--border)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E8353B]/15 border border-[#E8353B]/35 flex items-center justify-center text-[12px] font-bold text-[#ff7379] shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-[var(--text)] truncate font-bold">
                  {adminDisplayName}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {user?.email || 'admin@boardly.cfd'}
                </p>
                <div className="mt-1">
                  <span
                    className={`inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full border ${
                      isSuperAdmin
                        ? glassEnabled
                          ? 'border-[#E8353B]/40 text-[#ff7076]'
                          : 'border-[var(--accent)]/40 text-[var(--accent)]'
                        : 'border-amber-600/40 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {isSuperAdmin ? 'Super Admin' : 'Admin (Limited)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--border)]">
              <Link
                to="/dashboard"
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] py-1.5 rounded-[10px] hover:bg-[var(--settings-row-hover)] transition-colors border border-transparent hover:border-[var(--border)]"
                title="Open student dashboard"
              >
                <ExternalLink size={12} />
                <span>Student view</span>
              </Link>
              <button
                type="button"
                onClick={toggleAdminGlass}
                className="flex items-center justify-center p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-[10px] hover:bg-[var(--settings-row-hover)] transition-colors cursor-pointer"
                title={glassEnabled ? 'Admin appearance: New (switch to Classic)' : 'Admin appearance: Classic (switch to New)'}
                aria-label={glassEnabled ? 'Switch to Classic admin appearance' : 'Switch to New admin appearance'}
              >
                <Layers size={13} className={glassEnabled ? 'text-[#E8353B]' : ''} />
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] rounded-[10px] hover:bg-[var(--settings-row-hover)] transition-colors cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR (Back & Menu buttons matching Question Bank) ──── */}
      <header
        className={`md:hidden sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)] transition-colors ${
          glassEnabled
            ? `ag-mobile-header border-b ${scrolled ? 'border-[var(--ag-border)]' : 'border-transparent'}`
            : `bg-[var(--bg)] ${scrolled ? 'border-b border-[var(--border)]' : 'border-b border-transparent'}`
        }`}
      >
        <div className="h-[58px] px-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to student dashboard"
            className={
              glassEnabled
                ? 'ag-ios-btn ag-ios-btn--icon !w-10 !h-10 !min-w-[40px] !min-h-[40px] shrink-0'
                : 'w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--settings-row-hover)] transition-colors shrink-0 cursor-pointer'
            }
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1
              className={`leading-tight text-[var(--text)] truncate ${
                glassEnabled ? 'ag-dot-heading text-[18px]' : 'text-[17px] font-semibold'
              }`}
            >
              {mobileTitle}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isSuperAdmin && pendingRequestsCount > 0 && (
              <Link
                to="/admin/access-requests"
                aria-label={`${pendingRequestsCount} pending access requests`}
                className={
                  glassEnabled
                    ? 'ag-ios-btn ag-ios-btn--primary !w-10 !h-10 !min-w-[40px] !min-h-[40px] !p-0 !rounded-full text-[12px] font-mono font-bold shrink-0 ag-tabular'
                    : 'w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[12px] font-bold shrink-0 ag-tabular'
                }
              >
                {pendingRequestsCount}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              aria-label="More admin sections"
              className={
                glassEnabled
                  ? 'ag-ios-btn ag-ios-btn--icon !w-10 !h-10 !min-w-[40px] !min-h-[40px] shrink-0'
                  : 'w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--settings-row-hover)] transition-colors shrink-0 cursor-pointer'
              }
            >
              <MoreHorizontal size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT VIEWPORT ─────────────────────────────────────────── */}
      <main className="ag-main-viewport flex-1 md:ml-[240px] min-w-0 min-h-[calc(100dvh-3.5rem)] md:min-h-[100dvh] p-4 sm:p-6 md:p-8 pb-32 sm:pb-36 md:pb-12 max-w-[1400px] w-full mx-auto overflow-x-hidden">
        {!isAdmin && !isSuperAdmin ? (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="max-w-[480px] w-full p-6 sm:p-8 rounded-[24px] ag-glass-card text-center">
              <div className="w-14 h-14 rounded-full bg-[#E8353B]/14 border border-[#E8353B]/35 text-[#ff6f75] flex items-center justify-center mx-auto mb-5">
                <ShieldAlert size={28} />
              </div>
              <h1 className="text-[22px] font-bold text-[var(--text)] mb-3">
                Admin access restricted
              </h1>
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed mb-5">
                This portal is strictly reserved for Boardly administrators.
                Your account (<strong className="text-[var(--text)] font-semibold">{user.email}</strong>) does not have administrator authority.
              </p>
              <Link to="/dashboard" className="inline-block w-full">
                <Button variant="secondary" size="md" className="w-full justify-center">
                  <ArrowLeft size={16} /> Return to student dashboard
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full min-h-[calc(100dvh-5rem)] bg-transparent relative">
            <Suspense
              fallback={
                <div className="w-full min-h-[60dvh] bg-transparent">
                  <RoutePageSkeleton pathname={location.pathname} />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        )}
      </main>

      {/* ─── MOBILE FLOATING PILL BOTTOM NAV (Mounted once outside page content) ──── */}
      <BottomNav
        items={bottomNavItems}
        activeTabIndex={mobileActiveTabIdx}
        isMoreActive={isMoreSectionActive}
        onPrefetch={handlePrefetch}
        onOpenMore={handleOpenMore}
        glassEnabled={glassEnabled}
        isScrolling={isActivelyScrolling}
      />

      {/* ─── MOBILE "MORE" BOTTOM SHEET (Shared Solid Opaque Overlay #161616 / #3a3a3a) ─── */}
      <AdminOverlay
        open={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        mode="sheet"
        title="More"
        subtitle={adminDisplayName}
        maxWidthClass="max-w-[640px]"
        ariaLabel="More admin sections"
      >
        <div className="space-y-4">
          {/* Quick Student View Link */}
          <Link
            to="/dashboard"
            onClick={() => setIsMoreOpen(false)}
            className="ag-overlay-item border border-[#2f2f35] bg-[#1e1e23] rounded-[16px] justify-between"
          >
            <span className="flex items-center gap-3 min-w-0">
              <ExternalLink size={18} className="text-[#E8353B] shrink-0" />
              <span className="font-bold text-[14.5px]">Student view</span>
            </span>
            <ChevronRight size={17} className="text-[#8e8e98] shrink-0" />
          </Link>

          {/* Primary More Sections (Users, Payments & Coupons, Ads, Announcements, Access Requests, Superadmin Area) */}
          <div className="space-y-1.5">
            <div className="px-1 ag-mono-label text-[10px] text-[#8e8e98]">
              Admin sections
            </div>
            <div className="rounded-[18px] border border-[#2f2f35] bg-[#1c1c20] overflow-hidden divide-y divide-[#2a2a30]">
              {visibleMoreMainNav.map((item) => {
                const { to, label, icon: Icon } = item;
                const locked = isNavItemLocked(item);
                const badgeCount = locked ? 0 : getPendingBadgeCount(item);
                const base = to.split('?')[0];
                const active = item.end ? location.pathname === base : location.pathname.startsWith(base);
                const displayLabel =
                  to === '/admin/payments'
                    ? 'Payments & Coupons — Payments'
                    : to === '/admin/coupons'
                    ? 'Payments & Coupons — Coupon Studio'
                    : label;
                return (
                  <Link
                    key={to}
                    to={to}
                    onMouseEnter={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                    onTouchStart={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                    onClick={() => setIsMoreOpen(false)}
                    className={`min-h-[52px] px-4 flex items-center justify-between gap-3 text-[14.5px] transition-colors hover:bg-[#26262c] ${
                      locked ? 'opacity-55' : ''
                    } ${active ? 'text-[#ff6a70] font-bold' : 'text-[#f5f5f7] font-semibold'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={18} className={active ? 'text-[#E8353B] shrink-0' : 'text-[#a1a1aa] shrink-0'} />
                      <span className="truncate">{displayLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {locked && <Lock size={14} className="text-amber-400" />}
                      {badgeCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#E8353B] text-white text-[11px] font-mono font-bold leading-none ag-tabular">
                          {badgeCount}
                        </span>
                      )}
                      <ChevronRight size={17} className="text-[#787882]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Secondary Admin Tools */}
          {visibleSecondaryNav.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-1 ag-mono-label text-[10px] text-[#8e8e98]">
                More tools
              </div>
              <div className="rounded-[18px] border border-[#2f2f35] bg-[#1c1c20] overflow-hidden divide-y divide-[#2a2a30]">
                {visibleSecondaryNav.map((item) => {
                  const { to, label, icon: Icon } = item;
                  const locked = isNavItemLocked(item);
                  const badgeCount = locked ? 0 : getPendingBadgeCount(item);
                  const base = to.split('?')[0];
                  const active = location.pathname.startsWith(base);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onMouseEnter={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                      onTouchStart={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                      onClick={() => setIsMoreOpen(false)}
                      className={`min-h-[48px] px-4 flex items-center justify-between gap-3 text-[14px] transition-colors hover:bg-[#26262c] ${
                        locked ? 'opacity-55' : ''
                      } ${active ? 'text-[#ff6a70] font-bold' : 'text-[#e4e4ec] font-medium'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon size={17} className={active ? 'text-[#E8353B] shrink-0' : 'text-[#9a9aa4] shrink-0'} />
                        <span className="truncate">{label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {locked && <Lock size={13} className="text-amber-400" />}
                        {badgeCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#E8353B] text-white text-[11px] font-mono font-bold leading-none ag-tabular">
                            {badgeCount}
                          </span>
                        )}
                        <ChevronRight size={16} className="text-[#787882]" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Appearance Toggle (New / Classic) + Sign out */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={toggleAdminGlass}
              className="ag-ios-btn ag-ios-btn--secondary w-full !justify-between !px-4 !min-h-[50px]"
            >
              <span className="flex items-center gap-3">
                <Layers size={18} className={glassEnabled ? 'text-[#E8353B]' : 'text-[#a1a1aa]'} />
                <span>Admin appearance</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#E8353B]/18 border border-[#E8353B]/45 text-[#ff7379] text-[11px] font-mono font-bold uppercase">
                {glassEnabled ? 'New' : 'Classic'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="ag-ios-btn ag-ios-btn--danger w-full !min-h-[50px]"
            >
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </AdminOverlay>
    </div>
  );
}

export default AdminLayout;
