import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Database,
  FileCheck2,
  CreditCard,
  MessageSquare,
  Terminal,
  MoreHorizontal,
  LogOut,
  ExternalLink,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { getApp } from '@/lib/firebase';

interface AdminNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const PRIMARY_NAV: AdminNavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/questions', label: 'Questions', icon: Database },
];

const SECONDARY_NAV: AdminNavItem[] = [
  { to: '/admin/applications', label: 'Applications', icon: FileCheck2 },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/admin/audit-logs', label: 'Audit log', icon: Terminal },
];

const ALL_SIDEBAR_NAV: AdminNavItem[] = [
  ...PRIMARY_NAV,
  ...SECONDARY_NAV,
];

export function AdminLayout() {
  const { user, profileLoading, isAdmin, signOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsAvatarMenuOpen(false);
    setIsMoreOpen(false);
    await signOutUser();
    navigate('/login');
  };

  const emailLower = user?.email?.toLowerCase().trim();
  const isSuperAdmin = !!(
    emailLower === 'shsvirtualadmin@gmail.com' ||
    emailLower === 'support@boardly.cfd' ||
    user?.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'
  );
  const userInitial = (user?.displayName || user?.email || 'A')[0].toUpperCase();

  // Check if current path is in the secondary "More" section
  const isSecondaryActive = SECONDARY_NAV.some((item) =>
    location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col md:flex-row antialiased overflow-x-clip">
      {/* ─── DESKTOP LEFT SIDEBAR (240px) ─────────────────────────────────── */}
      <aside className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 md:left-0 bg-[var(--bg)] border-r border-[var(--border)] z-30">
        {/* Sidebar Header */}
        <div className="h-16 px-5 border-b border-[var(--border)] flex items-center justify-between">
          <Link to="/admin" className="flex items-center" aria-label="Boardly Admin">
            <Logo size="admin" />
          </Link>
          <span className="text-[11px] font-heading font-semibold text-[var(--muted)] px-2 py-0.5 rounded-full border border-[var(--border)]">
            Admin
          </span>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {ALL_SIDEBAR_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13px] font-heading transition-colors ${
                  isActive
                    ? 'bg-[var(--card-2)] text-[var(--text)] font-semibold border border-[var(--border)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-[var(--text)]' : 'text-[var(--muted)]'} />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[var(--red)]"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer with Signed-in Info & Avatar Menu Trigger */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="p-2 rounded-[16px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[12px] font-heading font-bold text-[var(--text)] shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[12px] text-[var(--text)] truncate font-medium">
                  {user?.email || 'admin@boardly.cfd'}
                </p>
                <div className="mt-0.5">
                  <span className="inline-block text-[10px] font-heading px-1.5 py-0.2 rounded-full border border-[var(--red)] text-[var(--red)]">
                    {isSuperAdmin ? 'Superadmin' : 'Admin'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--border)]">
              <Link
                to="/dashboard"
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-heading text-[var(--muted)] hover:text-[var(--text)] py-1.5 rounded-[8px] hover:bg-[var(--surface-hover)] transition-colors border border-transparent hover:border-[var(--border)]"
                title="Open student dashboard"
              >
                <ExternalLink size={12} />
                <span>Student view</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center p-1.5 text-[var(--muted)] hover:text-[var(--red)] rounded-[8px] hover:bg-[var(--surface-hover)] transition-colors"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR ─────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 h-16 bg-[var(--bg)] border-b border-[var(--border)] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link to="/admin" className="flex items-center" aria-label="Boardly Admin">
            <Logo size="admin" />
          </Link>
          <span className="text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
            Admin
          </span>
        </div>

        {/* Avatar Menu Trigger on Mobile */}
        <button
          type="button"
          onClick={() => setIsAvatarMenuOpen(true)}
          className="w-8 h-8 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[12px] font-heading font-bold text-[var(--text)]"
          aria-label="Admin account menu"
        >
          {userInitial}
        </button>
      </header>

      {/* ─── MAIN CONTENT VIEWPORT ─────────────────────────────────────────── */}
      <main className="flex-1 md:ml-[240px] min-w-0 min-h-[calc(100vh-3.5rem)] md:min-h-screen p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-[1400px] w-full mx-auto overflow-x-hidden">
        {profileLoading ? (
          <div className="space-y-4 max-w-4xl py-4">
            <Skeleton height={32} width="40%" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Skeleton height={120} />
              <Skeleton height={120} />
              <Skeleton height={120} />
              <Skeleton height={120} />
            </div>
            <div className="mt-6">
              <Skeleton height={280} />
            </div>
          </div>
        ) : !user ? (
          <Navigate to="/login?redirect=/admin" replace />
        ) : !isAdmin ? (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="max-w-[480px] w-full p-6 sm:p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center shadow-none">
              <div className="w-14 h-14 rounded-full bg-[var(--card-2)] border border-[var(--red)]/40 text-[var(--red)] flex items-center justify-center mx-auto mb-5">
                <ShieldAlert size={28} />
              </div>
              <h1 className="font-dot text-[22px] font-bold text-[var(--text)] mb-3">
                Admin access restricted
              </h1>
              <p className="font-heading text-[14px] text-[var(--muted)] leading-relaxed mb-5">
                This portal is strictly reserved for the Boardly platform super-administrator.
                Your account (<strong className="text-[var(--text)] font-semibold">{user.email}</strong>) does not have administrator authority.
              </p>
              <div className="bg-[var(--card-2)] p-3 rounded-[12px] border border-[var(--border)] text-[12px] font-heading text-[var(--muted)] mb-6">
                Authorized: shsvirtualadmin@gmail.com
              </div>
              <Link to="/dashboard" className="inline-block w-full">
                <Button variant="secondary" size="md" className="w-full justify-center">
                  <ArrowLeft size={16} /> Return to student dashboard
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Outlet />
            <footer className="mt-8 pt-4 pb-12 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-[var(--muted)]">
              <span>Firebase Active Project ID: <strong className="text-[var(--text)]">{getApp().options.projectId || 'unknown'}</strong></span>
              <span>Auth Domain: <strong className="text-[var(--text)]">{getApp().options.authDomain || 'unknown'}</strong></span>
            </footer>
          </>
        )}
      </main>

      {/* ─── MOBILE BOTTOM NAV (4 Items: Overview, Users, Questions, More) ──── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-[var(--bg)] border-t border-[var(--border)] grid grid-cols-4 items-center px-1"
        aria-label="Admin Mobile Navigation"
      >
        {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? 'text-[var(--text)]' : 'text-[var(--muted)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={19} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-heading ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* 4th Tab: "More" opens Bottom Sheet */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isSecondaryActive ? 'text-[var(--text)]' : 'text-[var(--muted)]'
          }`}
        >
          <div className="relative">
            <MoreHorizontal size={19} />
            {isSecondaryActive && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 font-heading ${isSecondaryActive ? 'font-semibold' : 'font-normal'}`}>
            More
          </span>
        </button>
      </nav>

      {/* ─── MOBILE "MORE" BOTTOM SHEET ────────────────────────────────────── */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="relative w-full max-h-[80vh] bg-[var(--card)] border-t border-[var(--border)] rounded-t-[24px] p-5 flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h2 className="font-heading font-semibold text-[15px] text-[var(--text)]">
                More admin sections
              </h2>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMoreOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-[16px] border text-[13px] font-heading transition-colors ${
                    location.pathname.startsWith(to)
                      ? 'bg-[var(--card-2)] border-[var(--border)] text-[var(--text)] font-semibold'
                      : 'bg-transparent border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{label}</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
              <Link
                to="/dashboard"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3 rounded-[16px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
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
                className="w-full flex items-center justify-center gap-2 p-3 rounded-[16px] border border-[var(--red)]/40 text-[var(--red)] font-heading text-[13px] font-medium"
              >
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE AVATAR MENU BOTTOM SHEET ───────────────────────────────── */}
      {isAvatarMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsAvatarMenuOpen(false)}
          />
          <div className="relative w-full bg-[var(--card)] border-t border-[var(--border)] rounded-t-[24px] p-5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[13px] font-heading font-bold text-[var(--text)] shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-[13px] text-[var(--text)] font-medium truncate">
                    {user?.email || 'admin@boardly.cfd'}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--red)] text-[var(--red)]">
                    {isSuperAdmin ? 'Superadmin' : 'Admin'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarMenuOpen(false)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard"
                onClick={() => setIsAvatarMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-[16px] border border-[var(--border)] text-[13px] font-heading text-[var(--text)]"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink size={15} />
                  <span>Switch to student cockpit</span>
                </div>
                <ChevronRight size={14} className="text-[var(--muted)]" />
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-[16px] border border-[var(--red)]/40 text-[var(--red)] font-heading text-[13px] font-medium"
              >
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
