import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  X,
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
} from '@/services/adminTabCache';
import { apiRequest, clearGenericErrorToasts } from '@/lib/api';
import type { PermissionKey } from '@/constants/permissions';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';
import { AdminAmbientBubbles, BottomNav } from '@/components/admin/AdminGlassPrimitives';
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

const PRIMARY_NAV: AdminNavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/questions', label: 'Questions', icon: Database, permission: 'mcq.manage' },
  { to: '/admin/formulas', label: 'Formula Bank', icon: BookOpen, permission: 'mcq.manage' },
  { to: '/admin/commons', label: 'Moderation', icon: MessageSquare, permission: 'content.delete', badgeKey: 'moderation' },
  { to: '/admin/applications', label: 'Applications', icon: FileCheck2, permission: 'users.role' },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'users.plan' },
  { to: '/admin/coupons', label: 'Coupon Studio', icon: Ticket, permission: 'users.plan' },
  { to: '/admin/ads', label: 'Ads', icon: Megaphone },
  { to: '/superadmin', label: 'Superadmin Area', icon: ShieldAlert, superAdminOnly: true, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, permission: 'users.view', superAdminOnly: true },
  { to: '/admin/access-requests', label: 'Access Requests', icon: KeyRound, permission: 'audit.view', superAdminOnly: true, badgeKey: 'accessRequests' },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, permission: 'announcements.manage', superAdminOnly: true },
  { to: '/admin/certificates', label: 'Certificates', icon: Award, permission: 'certificates.issue', superAdminOnly: true },
];

const SECONDARY_NAV: AdminNavItem[] = [
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
  ...PRIMARY_NAV,
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

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingModerationCount, setPendingModerationCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { enabled: glassEnabled, toggle: toggleAdminGlass } = useAdminGlassFlag();

  useBodyScrollLock(isMoreOpen, 'admin-more-sheet');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMoreOpen(false);
    safetyCleanupScrollLocks();
    clearGenericErrorToasts();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMoreOpen]);

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

  // Poll or fetch pending access requests count for Super Admin badge
  useEffect(() => {
    if (!user || !isSuperAdmin) {
      setPendingRequestsCount(0);
      return;
    }
    let cancelled = false;
    const loadPendingCount = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const res = await apiRequest<{ requests?: Array<{ status: string }> }>(
          '/api/admin/access-requests?status=pending',
          { method: 'GET', silentErrorToast: true }
        );
        if (!cancelled && Array.isArray(res?.requests)) {
          setPendingRequestsCount(res.requests.filter((r) => r.status === 'pending').length);
        }
      } catch {
        // non-fatal
      }
    };
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void loadPendingCount();
      }
    };
    const handleUpdated = () => {
      void loadPendingCount();
    };
    void loadPendingCount();
    const timer = window.setInterval(loadPendingCount, 30000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('boardly:access-requests-updated', handleUpdated);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('boardly:access-requests-updated', handleUpdated);
    };
  }, [user, isSuperAdmin]);

  // Poll pending moderation queue count so badge only renders when flagged items exist
  const canModerateCommons = isSuperAdmin || hasPermission('content.delete');
  useEffect(() => {
    if (!user || (!isAdmin && !isSuperAdmin) || !canModerateCommons) {
      setPendingModerationCount(0);
      return;
    }
    let cancelled = false;
    const loadModerationCount = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const res = await apiRequest<{
          success?: boolean;
          flaggedPosts?: unknown[];
          reports?: Array<{ status?: string }>;
        }>('/api/posts/moderation/queue', { method: 'GET', silentErrorToast: true });
        if (!cancelled && res) {
          const flaggedCount = Array.isArray(res.flaggedPosts) ? res.flaggedPosts.length : 0;
          const pendingReportsCount = Array.isArray(res.reports)
            ? res.reports.filter((r) => !r.status || r.status === 'pending').length
            : 0;
          setPendingModerationCount(Math.max(flaggedCount, pendingReportsCount));
        }
      } catch {
        // non-fatal
      }
    };
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void loadModerationCount();
      }
    };
    const handleModerationUpdated = (ev: Event) => {
      const detailCount = (ev as CustomEvent<{ count?: number }>).detail?.count;
      if (typeof detailCount === 'number' && Number.isFinite(detailCount)) {
        setPendingModerationCount(Math.max(0, Math.floor(detailCount)));
      } else {
        void loadModerationCount();
      }
    };
    void loadModerationCount();
    const timer = window.setInterval(loadModerationCount, 30000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('boardly:moderation-updated', handleModerationUpdated);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  // Hide superAdmin-only items in UI for non-superAdmins
  const visiblePrimaryNav = PRIMARY_NAV.filter((item) => !item.superAdminOnly || isSuperAdmin);
  const visibleSecondaryNav = SECONDARY_NAV.filter((item) => !item.superAdminOnly || isSuperAdmin);
  const visibleSidebarNav = ALL_SIDEBAR_NAV.filter((item) => !item.superAdminOnly || isSuperAdmin);

  const activeNavItem = visibleSidebarNav.find((item) => {
    const base = item.to.split('?')[0];
    return item.end ? location.pathname === base : location.pathname.startsWith(base);
  });
  const mobileTitle = activeNavItem?.label || (isSuperAdmin ? 'Super Admin' : 'Admin');

  // Check if current path is in the secondary "More" section
  const isSecondaryActive = visibleSecondaryNav.some((item) =>
    location.pathname.startsWith(item.to.split('?')[0])
  );

  const mobilePrimaryNav = visiblePrimaryNav.slice(0, 5);
  const mobileActivePrimaryIdx = mobilePrimaryNav.findIndex((item) => {
    const base = item.to.split('?')[0];
    return item.end ? location.pathname === base : location.pathname.startsWith(base);
  });
  const mobileActiveTabIdx =
    mobileActivePrimaryIdx >= 0
      ? mobileActivePrimaryIdx
      : isSecondaryActive
      ? mobilePrimaryNav.length
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
      mobilePrimaryNav.map((item) => {
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
    [mobilePrimaryNav, isNavItemLocked, getPendingBadgeCount]
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
            className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isSuperAdmin
                ? glassEnabled
                  ? 'border-[#E8353B]/40 bg-[#E8353B]/12 text-[#E8353B]'
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
                  `flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[13px] font-heading transition-colors ${
                    locked ? 'opacity-65' : ''
                  } ${
                    isActive
                      ? glassEnabled
                        ? 'bg-[#E8353B]/12 text-[var(--text)] font-semibold border border-[#E8353B]/30'
                        : 'glass-row text-[var(--text)] font-semibold border-[var(--glass-border)]'
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
                        className={`px-1.5 py-0.5 rounded-full text-white text-[10px] font-bold leading-none shrink-0 ag-tabular ${
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

        {/* Sidebar Footer with Signed-in Info & Avatar Menu Trigger */}
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
              <div className="w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[12px] font-heading font-bold text-[var(--text)] shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[12px] text-[var(--text)] truncate font-semibold">
                  {adminDisplayName}
                </p>
                <p className="font-heading text-[11px] text-[var(--text-muted)] truncate">
                  {user?.email || 'admin@boardly.cfd'}
                </p>
                <div className="mt-1">
                  <span
                    className={`inline-block text-[10px] font-heading px-1.5 py-0.5 rounded-full border ${
                      isSuperAdmin
                        ? glassEnabled
                          ? 'border-[#E8353B]/40 text-[#E8353B]'
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
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-heading text-[var(--text-muted)] hover:text-[var(--text)] py-1.5 rounded-[10px] hover:bg-[var(--settings-row-hover)] transition-colors border border-transparent hover:border-[var(--border)]"
                title="Open student dashboard"
              >
                <ExternalLink size={12} />
                <span>Student view</span>
              </Link>
              <button
                type="button"
                onClick={toggleAdminGlass}
                className="flex items-center justify-center p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-[10px] hover:bg-[var(--settings-row-hover)] transition-colors cursor-pointer"
                title={glassEnabled ? 'Switch to classic admin UI' : 'Switch to glass admin UI'}
                aria-label={glassEnabled ? 'Switch to classic admin UI' : 'Switch to glass admin UI'}
              >
                <Layers size={13} className={glassEnabled ? 'text-[#E8353B]' : ''} />
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] rounded-[10px] hover:bg-[var(--settings-row-hover)] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR (Sticky glass bar when flag enabled) ────────── */}
      <header
        className={`md:hidden sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)] transition-colors ${
          glassEnabled
            ? `ag-mobile-header border-b ${scrolled ? 'border-[var(--ag-border)]' : 'border-transparent'}`
            : `bg-[var(--bg)] ${scrolled ? 'border-b border-[var(--border)]' : 'border-b border-transparent'}`
        }`}
      >
        <div className="h-[56px] px-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to student dashboard"
            className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)] transition-colors shrink-0 cursor-pointer"
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
            {isSuperAdmin && pendingRequestsCount > 0 ? (
              <Link
                to="/admin/access-requests"
                aria-label={`${pendingRequestsCount} pending access requests`}
                className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-[12px] font-bold shrink-0 ag-tabular ${
                  glassEnabled ? 'bg-[#E8353B]' : 'bg-[var(--accent)]'
                }`}
              >
                {pendingRequestsCount}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsMoreOpen(true)}
                aria-label="More admin sections"
                className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)] transition-colors shrink-0 cursor-pointer"
              >
                <MoreHorizontal size={20} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT VIEWPORT ─────────────────────────────────────────── */}
      <main className="ag-main-viewport flex-1 md:ml-[240px] min-w-0 min-h-[calc(100dvh-3.5rem)] md:min-h-[100dvh] p-4 sm:p-6 md:p-8 pb-32 sm:pb-36 md:pb-12 max-w-[1400px] w-full mx-auto overflow-x-hidden">
        {!isAdmin && !isSuperAdmin ? (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="max-w-[480px] w-full p-6 sm:p-8 rounded-[32px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--bg)] border border-[var(--danger-border)] text-[var(--danger)] flex items-center justify-center mx-auto mb-5">
                <ShieldAlert size={28} />
              </div>
              <h1 className="font-dot text-[22px] font-bold text-[var(--text)] mb-3">
                Admin access restricted
              </h1>
              <p className="font-heading text-[14px] text-[var(--text-muted)] leading-relaxed mb-5">
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
          <div
            key={location.pathname}
            className="w-full min-h-[calc(100dvh-5rem)] bg-transparent relative isolate page-slide-right"
          >
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

      {/* ─── MOBILE FLOATING PILL BOTTOM NAV ──── */}
      <BottomNav
        items={bottomNavItems}
        activeTabIndex={mobileActiveTabIdx}
        isMoreActive={isSecondaryActive}
        onPrefetch={handlePrefetch}
        onOpenMore={handleOpenMore}
        glassEnabled={glassEnabled}
      />

      {/* ─── MOBILE "MORE" BOTTOM SHEET (Portaled to body at z-[9999]) ─── */}
      {isMoreOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More admin sections"
            data-fullscreen-modal="true"
            data-admin-glass-portal={glassEnabled ? '1' : '0'}
            style={{ zIndex: 9999, pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="md:hidden fixed inset-0 z-[9999] pointer-events-auto flex items-end justify-center"
          >
            <div
              style={{ pointerEvents: 'auto' }}
              className="fixed inset-0 z-0 pointer-events-auto bg-black/55 backdrop-blur-md more-sheet-backdrop transition-opacity cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMoreOpen(false);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMoreOpen(false);
              }}
              aria-hidden="true"
            />
            <div
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className={`relative z-10 pointer-events-auto w-full max-w-[640px] max-h-[90dvh] rounded-t-[24px] border-t border-x shadow-2xl px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] flex flex-col gap-4 overflow-y-auto overscroll-contain ${
                glassEnabled
                  ? 'ag-sheet-panel border-[var(--ag-border-strong)]'
                  : 'bg-[var(--card)] border-[var(--border)]'
              }`}
            >
              {/* Drag handle 36x4px */}
              <div className="w-9 h-1 rounded-full bg-[var(--border)] mx-auto shrink-0" />

              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] shrink-0">
                <h2
                  className={
                    glassEnabled
                      ? 'ag-dot-heading text-[18px] text-[var(--text)]'
                      : 'text-[17px] font-semibold text-[var(--text)]'
                  }
                >
                  More admin sections
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMoreOpen(false);
                  }}
                  aria-label="Close"
                  className="w-10 h-10 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grouped Settings-style card list (flat translucent, no backdrop-filter on list) */}
              <div
                className={`rounded-[22px] border overflow-hidden divide-y divide-[var(--border)] ${
                  glassEnabled ? 'ag-flat-card' : 'bg-[var(--card)] border-[var(--border)]'
                }`}
              >
                {[...visiblePrimaryNav.slice(5), ...visibleSecondaryNav].map((item) => {
                  const { to, label, icon: Icon } = item;
                  const locked = isNavItemLocked(item);
                  const badgeCount = locked ? 0 : getPendingBadgeCount(item);
                  const active = location.pathname.startsWith(to.split('?')[0]);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onMouseEnter={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                      onTouchStart={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                      onClick={() => setIsMoreOpen(false)}
                      className={`min-h-[54px] px-5 flex items-center justify-between gap-3 text-[15px] transition-colors hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)] ${
                        locked ? 'opacity-50' : ''
                      } ${
                        active
                          ? glassEnabled
                            ? 'text-[#E8353B] font-semibold'
                            : 'text-[var(--accent)] font-semibold'
                          : 'text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Icon size={20} className="shrink-0" />
                        <span>{label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {locked && <Lock size={14} className="text-amber-600 dark:text-amber-400" />}
                        {badgeCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#E8353B] text-white text-[11px] font-bold leading-none shrink-0 ag-tabular">
                            {badgeCount}
                          </span>
                        )}
                        <ChevronRight size={18} className="text-[var(--text-muted)]" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={toggleAdminGlass}
                  className="w-full min-h-[52px] px-5 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-between text-[15px] text-[var(--text)] hover:bg-[var(--settings-row-hover)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <Layers size={20} className={glassEnabled ? 'text-[#E8353B]' : ''} />
                    <span>{glassEnabled ? 'Admin appearance: Glass' : 'Admin appearance: Classic'}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[var(--text-muted)]">Switch</span>
                </button>

                <Link
                  to="/dashboard"
                  onClick={() => setIsMoreOpen(false)}
                  className="min-h-[52px] px-5 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-between text-[15px] text-[var(--text)] hover:bg-[var(--settings-row-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <ExternalLink size={20} />
                    <span>Student view</span>
                  </div>
                  <ChevronRight size={18} className="text-[var(--text-muted)]" />
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full min-h-[52px] px-5 rounded-full bg-[var(--card)] border border-[var(--danger-border)] text-[var(--danger)] flex items-center justify-center gap-2.5 text-[15px] font-medium hover:bg-[var(--danger)]/5 transition-colors cursor-pointer"
                >
                  <LogOut size={19} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default AdminLayout;
