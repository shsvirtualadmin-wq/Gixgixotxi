import { useState, useEffect, Suspense } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayInitial, getDisplayName } from '@/utils/displayName';
import { RoutePageSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { motion } from 'framer-motion';
import { NAKAMA_CAPTAINS_NAME } from '@/constants/branding';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { useBodyScrollLock, safetyCleanupScrollLocks } from '@/utils/scrollLock';
import {
  scheduleIdleAdminPrefetchAll,
  prefetchAdminRouteOnInteraction,
} from '@/services/adminTabCache';
import { apiRequest } from '@/lib/api';
import type { PermissionKey } from '@/constants/permissions';

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
  superAdminOnlyBadge?: boolean;
}

const PRIMARY_NAV: AdminNavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/questions', label: 'Questions', icon: Database, permission: 'mcq.manage' },
  { to: '/admin/formulas', label: 'Formula Bank', icon: BookOpen, permission: 'mcq.manage' },
  { to: '/admin/commons', label: 'Moderation', icon: MessageSquare, permission: 'content.delete' },
  { to: '/admin/applications', label: 'Applications', icon: FileCheck2, permission: 'users.role' },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'users.plan' },
  { to: '/admin/ads', label: 'Ads', icon: Megaphone },
  { to: '/superadmin', label: 'Superadmin Area', icon: ShieldAlert, superAdminOnly: true, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, permission: 'users.view', superAdminOnly: true },
  { to: '/admin/access-requests', label: 'Access Requests', icon: KeyRound, permission: 'audit.view', superAdminOnly: true, superAdminOnlyBadge: true },
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
    profileLoading,
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
  const [scrolled, setScrolled] = useState(false);

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
    void loadPendingCount();
    const timer = window.setInterval(loadPendingCount, 30000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isSuperAdmin]);

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

  const isNavItemLocked = (item: AdminNavItem): boolean => {
    if (isSuperAdmin) return false;
    if (item.superAdminOnly) return true;
    if (!item.permission) return false;
    return !hasPermission(item.permission);
  };

  // Fail-closed route guard before rendering any admin shell or children
  if (profileLoading || otpVerificationState.status === 'checking') {
    return <RoutePageSkeleton />;
  }
  if (!user || !isSessionVerified) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }
  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (location.pathname.startsWith('/superadmin') && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div
      data-admin-shell="true"
      className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] flex flex-col md:flex-row antialiased overflow-x-clip"
    >
      {/* ─── DESKTOP LEFT SIDEBAR (240px) ─────────────────────────────────── */}
      <aside className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 md:left-0 glass border-r border-[var(--glass-border)] z-30">
        {/* Sidebar Header */}
        <div className="h-16 px-5 border-b border-[var(--glass-border)] flex items-center justify-between">
          <Link to="/admin" className="flex items-center" aria-label="Boardly Admin">
            <Logo size="admin" />
          </Link>
          <span
            className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isSuperAdmin
                ? 'border-[var(--red)]/40 bg-[var(--red)]/10 text-[var(--red)]'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
            }`}
          >
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleSidebarNav.map((item) => {
            const { to, label, icon: Icon, end, superAdminOnlyBadge } = item;
            const locked = isNavItemLocked(item);
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
                      ? 'glass-row text-[var(--text)] font-semibold border-[var(--glass-border)]'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? 'text-[#D71921]' : 'text-[var(--muted)]'} />
                    <span className="flex-1 truncate">{label}</span>
                    {locked && (
                      <Lock size={12} className="text-amber-400 shrink-0" aria-label="Locked" />
                    )}
                    {superAdminOnlyBadge && isSuperAdmin && pendingRequestsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[var(--red)] text-white text-[10px] font-bold leading-none shrink-0">
                        {pendingRequestsCount}
                      </span>
                    )}
                    {isActive && !locked && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[var(--red)]"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer with Signed-in Info & Avatar Menu Trigger */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="p-2.5 rounded-[18px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-2">
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
                        ? 'border-[var(--accent)]/40 text-[var(--accent)]'
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

      {/* ─── MOBILE TOP BAR (Matches Settings 56px solid sticky bar) ────────── */}
      <header
        className={`md:hidden sticky top-0 z-30 bg-[var(--bg)] pt-[env(safe-area-inset-top,0px)] transition-colors ${
          scrolled ? 'border-b border-[var(--border)]' : 'border-b border-transparent'
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
            <h1 className="text-[17px] font-semibold leading-tight text-[var(--text)] truncate">
              {mobileTitle}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isSuperAdmin && pendingRequestsCount > 0 ? (
              <Link
                to="/admin/access-requests"
                aria-label={`${pendingRequestsCount} pending access requests`}
                className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[12px] font-bold shrink-0"
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
      <main className="flex-1 md:ml-[240px] min-w-0 min-h-[calc(100dvh-3.5rem)] md:min-h-[100dvh] p-4 sm:p-6 md:p-8 pb-32 sm:pb-36 md:pb-8 max-w-[1400px] w-full mx-auto overflow-x-hidden">
        {profileLoading || otpVerificationState.status === 'checking' ? (
          <RoutePageSkeleton pathname={location.pathname} />
        ) : !user || !isSessionVerified ? (
          <Navigate to="/login?redirect=/admin" replace />
        ) : !isAdmin ? (
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
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            data-admin-bottom-nav="true"
            style={{ zIndex: 90 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="md:hidden fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-24px)] max-w-[420px] z-[90] pointer-events-auto"
            aria-label="Admin Navigation Bar"
          >
            <nav
              role="tablist"
              className="rounded-[32px] glass dashboard-glass-bar allow-backdrop-blur border p-1.5 flex items-center justify-between select-none relative h-[62px] pointer-events-auto"
            >
              {visiblePrimaryNav.slice(0, 5).map((item) => {
                const { to, label, icon: Icon, end, superAdminOnlyBadge } = item;
                const locked = isNavItemLocked(item);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={label}
                    aria-label={label}
                    onMouseEnter={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                    onFocus={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                    onTouchStart={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                    onClick={(e) => e.stopPropagation()}
                    className={`relative rounded-full transition-colors duration-150 cursor-pointer h-full flex items-center justify-center text-center outline-none select-none flex-1 min-w-0 px-1 ${
                      locked ? 'opacity-65' : ''
                    }`}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="adminActiveNavPill"
                            className="absolute inset-0 rounded-full z-0"
                            style={{
                              backgroundColor: '#D71921',
                              boxShadow:
                                '0 8px 22px -4px rgba(215, 25, 33, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.30)',
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 450,
                              damping: 35,
                              mass: 0.6,
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 flex items-center justify-center transition-colors max-w-full ${
                            isActive
                              ? 'text-white'
                              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          <div className="relative shrink-0 flex items-center justify-center">
                            <Icon size={20} className={isActive ? 'text-white' : ''} />
                            {locked && (
                              <Lock
                                size={9}
                                className="absolute -top-1 -right-1.5 text-amber-400"
                              />
                            )}
                            {superAdminOnlyBadge && isSuperAdmin && pendingRequestsCount > 0 && (
                              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-[var(--red)] text-white text-[9px] font-bold">
                                {pendingRequestsCount}
                              </span>
                            )}
                          </div>
                          <span className="sr-only">{label}</span>
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}

              {/* "More" button */}
              <button
                type="button"
                role="tab"
                data-admin-nav-tab="more"
                aria-selected={isSecondaryActive}
                title="More admin sections"
                aria-label="More admin sections"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMoreOpen(true);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="relative rounded-full transition-colors duration-150 cursor-pointer h-full flex items-center justify-center text-center outline-none select-none flex-1 min-w-0 px-1"
              >
                {isSecondaryActive && (
                  <motion.div
                    layoutId="adminActiveNavPill"
                    className="absolute inset-0 rounded-full z-0"
                    style={{
                      backgroundColor: '#D71921',
                      boxShadow:
                        '0 8px 22px -4px rgba(215, 25, 33, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.30)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 35,
                      mass: 0.6,
                    }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center justify-center transition-colors max-w-full pointer-events-none ${
                    isSecondaryActive
                      ? 'text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <MoreHorizontal size={20} className={isSecondaryActive ? 'text-white' : ''} />
                  </div>
                  <span className="sr-only">More</span>
                </span>
              </button>
            </nav>
          </div>,
          document.body
        )}

      {/* ─── MOBILE "MORE" BOTTOM SHEET (Portaled to body at z-[9999]) ─── */}
      {isMoreOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More admin sections"
            data-fullscreen-modal="true"
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
              className="relative z-10 pointer-events-auto w-full max-w-[640px] max-h-[90dvh] rounded-t-[24px] bg-[var(--card)] border-t border-x border-[var(--border)] shadow-2xl px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] flex flex-col gap-4 overflow-y-auto overscroll-contain"
            >
              {/* Drag handle 36x4px */}
              <div className="w-9 h-1 rounded-full bg-[var(--border)] mx-auto shrink-0" />

              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] shrink-0">
                <h2 className="text-[17px] font-semibold text-[var(--text)]">
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

              {/* Grouped Settings-style card list */}
              <div className="rounded-[24px] bg-[var(--card)] border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
                {[...visiblePrimaryNav.slice(5), ...visibleSecondaryNav].map((item) => {
                  const { to, label, icon: Icon } = item;
                  const locked = isNavItemLocked(item);
                  const active = location.pathname.startsWith(to.split('?')[0]);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onMouseEnter={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                      onTouchStart={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                      onClick={() => setIsMoreOpen(false)}
                      className={`min-h-[56px] px-5 flex items-center justify-between gap-3 text-[16px] transition-colors hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)] ${
                        locked ? 'opacity-50' : ''
                      } ${active ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text)]'}`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Icon size={22} className="shrink-0" />
                        <span className="truncate">{label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {locked && <Lock size={14} className="text-amber-600 dark:text-amber-400" />}
                        <ChevronRight size={18} className="text-[var(--text-muted)]" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="space-y-3 pt-1">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMoreOpen(false)}
                  className="min-h-[56px] px-5 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-between text-[16px] text-[var(--text)] hover:bg-[var(--settings-row-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <ExternalLink size={22} />
                    <span>Student view</span>
                  </div>
                  <ChevronRight size={18} className="text-[var(--text-muted)]" />
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full min-h-[56px] px-5 rounded-full bg-[var(--card)] border border-[var(--danger-border)] text-[var(--danger)] flex items-center justify-center gap-2.5 text-[16px] font-medium hover:bg-[var(--danger)]/5 transition-colors cursor-pointer"
                >
                  <LogOut size={20} />
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
