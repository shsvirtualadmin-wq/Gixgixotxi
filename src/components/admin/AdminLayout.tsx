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
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Activity,
  Award,
  Tag,
  Megaphone,
  Bot,
  Lock,
  KeyRound,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LineLoader } from '@/components/ui/LineLoader';
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
  superAdminOnlyBadge?: boolean;
}

const PRIMARY_NAV: AdminNavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/questions', label: 'Questions', icon: Database, permission: 'mcq.manage' },
  { to: '/admin/commons', label: 'Moderation', icon: MessageSquare, permission: 'content.delete' },
  { to: '/admin/users', label: 'Users', icon: Users, permission: 'users.view' },
  { to: '/admin/access-requests', label: 'Access Requests', icon: KeyRound, permission: 'audit.view', superAdminOnlyBadge: true },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, permission: 'announcements.manage' },
  { to: '/admin/certificates', label: 'Certificates', icon: Award, permission: 'certificates.issue' },
];

const SECONDARY_NAV: AdminNavItem[] = [
  { to: '/admin/kobans', label: 'Kobans', icon: AdminKobanNavIcon, permission: 'coupons.grant' },
  { to: '/admin/pricing', label: 'Store Pricing', icon: Tag, permission: 'coupons.grant' },
  { to: '/admin/signatures?tab=signature', label: 'Certificate Signature', icon: FileCheck2, permission: 'certificates.issue' },
  { to: '/admin/captains', label: NAKAMA_CAPTAINS_NAME, icon: Award, permission: 'tests.manage' },
  { to: '/admin/crews', label: 'Crews', icon: Shield, permission: 'users.view' },
  { to: '/admin/bots', label: 'Bots', icon: Bot, permission: 'tests.manage' },
  { to: '/admin/applications', label: 'Applications', icon: FileCheck2, permission: 'users.role' },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'users.plan' },
  { to: '/admin/audit-logs', label: 'Audit log', icon: Terminal, permission: 'audit.view' },
  { to: '/admin/health', label: 'Health & Tests', icon: Activity },
];

const ALL_SIDEBAR_NAV: AdminNavItem[] = [
  ...PRIMARY_NAV,
  ...SECONDARY_NAV,
];

export function AdminLayout() {
  const {
    user,
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

  useBodyScrollLock(isMoreOpen, 'admin-more-sheet');

  useEffect(() => {
    setIsMoreOpen(false);
    safetyCleanupScrollLocks();
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

  // Poll or fetch pending access requests count for Super Admin badge
  useEffect(() => {
    if (!user || !isSuperAdmin) {
      setPendingRequestsCount(0);
      return;
    }
    let cancelled = false;
    const loadPendingCount = async () => {
      try {
        const res = await apiRequest<{ requests?: Array<{ status: string }> }>(
          '/api/admin/access-requests?status=pending',
          { method: 'GET', skipErrorToast: true }
        );
        if (!cancelled && Array.isArray(res?.requests)) {
          setPendingRequestsCount(res.requests.filter((r) => r.status === 'pending').length);
        }
      } catch {
        // non-fatal
      }
    };
    void loadPendingCount();
    const timer = window.setInterval(loadPendingCount, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user, isSuperAdmin, location.pathname]);

  // Prefetch all admin tab chunks and SWR data during idle time once AdminLayout is verified
  useEffect(() => {
    if (!profileLoading && user && isSessionVerified && isAdmin) {
      return scheduleIdleAdminPrefetchAll(user.uid);
    }
  }, [profileLoading, user, isSessionVerified, isAdmin]);

  const handleSignOut = async () => {
    setIsMoreOpen(false);
    await signOutUser();
    navigate('/login');
  };

  const userInitial = (user?.displayName || user?.email || 'A')[0].toUpperCase();

  // Check if current path is in the secondary "More" section
  const isSecondaryActive = SECONDARY_NAV.some((item) =>
    location.pathname.startsWith(item.to.split('?')[0])
  );

  const isNavItemLocked = (item: AdminNavItem): boolean => {
    if (isSuperAdmin) return false;
    if (!item.permission) return false;
    return !hasPermission(item.permission);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col md:flex-row antialiased overflow-x-clip">
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
          {ALL_SIDEBAR_NAV.map((item) => {
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
        <div className="p-3 border-t border-[var(--glass-border)]">
          <div className="p-2.5 rounded-[18px] glass-row flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[12px] font-heading font-bold text-[var(--text)] shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[12px] text-[var(--text)] truncate font-medium">
                  {user?.email || 'admin@boardly.cfd'}
                </p>
                <div className="mt-0.5">
                  <span
                    className={`inline-block text-[10px] font-heading px-1.5 py-0.2 rounded-full border ${
                      isSuperAdmin
                        ? 'border-[var(--red)] text-[var(--red)]'
                        : 'border-amber-500/50 text-amber-400'
                    }`}
                  >
                    {isSuperAdmin ? 'Super Admin' : 'Admin (Limited)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--glass-border)]">
              <Link
                to="/dashboard"
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-heading text-[var(--muted)] hover:text-[var(--text)] py-1.5 rounded-[10px] hover:bg-[var(--surface-hover)] transition-colors border border-transparent hover:border-[var(--glass-border)]"
                title="Open student dashboard"
              >
                <ExternalLink size={12} />
                <span>Student view</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center p-1.5 text-[var(--muted)] hover:text-[var(--red)] rounded-[10px] hover:bg-[var(--surface-hover)] transition-colors"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR ─────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 h-14 w-full max-w-full min-w-0 box-border glass allow-backdrop-blur border-b border-[var(--glass-border)] px-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 shrink">
          <Link to="/admin" className="flex items-center shrink-0" aria-label="Boardly Admin">
            <Logo size="admin" className="!h-[28px] min-[400px]:!h-[30px] w-auto shrink-0" />
          </Link>
          <span className="badge-pill-red text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
            {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isSuperAdmin && pendingRequestsCount > 0 && (
            <Link
              to="/admin/access-requests"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--red)] text-white text-[11px] font-heading font-bold shrink-0"
            >
              <KeyRound size={11} />
              <span>{pendingRequestsCount}</span>
            </Link>
          )}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-pill text-[11px] font-heading font-semibold text-[var(--text-muted)] hover:text-[var(--text)] shrink-0 whitespace-nowrap"
          >
            <ExternalLink size={12} className="shrink-0" />
            <span>Student Home</span>
          </Link>
        </div>
      </header>

      {/* ─── MAIN CONTENT VIEWPORT ─────────────────────────────────────────── */}
      <main className="flex-1 md:ml-[240px] min-w-0 min-h-[calc(100vh-3.5rem)] md:min-h-screen p-4 sm:p-6 md:p-8 pb-32 sm:pb-36 md:pb-8 max-w-[1400px] w-full mx-auto overflow-x-hidden">
        {profileLoading || otpVerificationState.status === 'checking' ? (
          <LineLoader context="admin" variant="section" />
        ) : !user || !isSessionVerified ? (
          <Navigate to="/login?redirect=/admin" replace />
        ) : !isAdmin ? (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="max-w-[480px] w-full p-6 sm:p-8 rounded-[28px] glass-card text-center">
              <div className="w-14 h-14 rounded-full glass-row border border-[var(--red)]/40 text-[var(--red)] flex items-center justify-center mx-auto mb-5">
                <ShieldAlert size={28} />
              </div>
              <h1 className="font-dot text-[22px] font-bold text-[var(--text)] mb-3">
                Admin access restricted
              </h1>
              <p className="font-heading text-[14px] text-[var(--muted)] leading-relaxed mb-5">
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
            className="w-full min-h-[calc(100vh-5rem)] bg-[var(--bg)] relative isolate"
          >
            <Suspense
              fallback={
                <div className="w-full min-h-[60vh] bg-[var(--bg)]">
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
              className="rounded-full glass dashboard-glass-bar allow-backdrop-blur border p-1 flex items-center justify-between select-none relative h-[54px] pointer-events-auto"
            >
              {PRIMARY_NAV.slice(0, 5).map((item) => {
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
                                '0 4px 14px -2px rgba(215, 25, 33, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
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
                        '0 4px 14px -2px rgba(215, 25, 33, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
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
              className="fixed inset-0 z-0 pointer-events-auto bg-black/45 backdrop-blur-sm more-sheet-backdrop transition-opacity cursor-pointer"
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
              className="relative z-10 pointer-events-auto w-full max-h-[80dvh] glass more-sheet-panel allow-backdrop-blur rounded-t-[28px] p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200"
            >
              {/* Grab handle */}
              <div className="w-10 h-1 bg-[var(--glass-border)] rounded-full mx-auto -mt-1 mb-1 shrink-0" />

              <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)] shrink-0">
                <h2 className="font-dot font-bold text-[15px] text-[var(--text)]">
                  More admin sections
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMoreOpen(false);
                  }}
                  className="p-1.5 rounded-full glass-pill text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5">
                {[...PRIMARY_NAV.slice(5), ...SECONDARY_NAV].map((item) => {
                  const { to, label, icon: Icon } = item;
                  const locked = isNavItemLocked(item);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onMouseEnter={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                      onTouchStart={() => prefetchAdminRouteOnInteraction(to, user?.uid)}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-[18px] text-[13px] font-heading transition-colors ${
                        locked ? 'opacity-65' : ''
                      } ${
                        location.pathname.startsWith(to.split('?')[0])
                          ? 'glass-row border-[var(--red)]/40 text-[var(--text)] font-semibold'
                          : 'glass-row text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} />
                        <span>{label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {locked && <Lock size={13} className="text-amber-400" />}
                        <ChevronRight size={14} className="text-[var(--muted)]" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[var(--glass-border)] flex flex-col gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center justify-between p-3 rounded-[18px] glass-row text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink size={16} />
                    <span>Student cockpit view</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-[18px] glass-row border-[var(--red)]/40 text-[var(--red)] font-heading text-[13px] font-medium cursor-pointer"
                >
                  <LogOut size={15} />
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
