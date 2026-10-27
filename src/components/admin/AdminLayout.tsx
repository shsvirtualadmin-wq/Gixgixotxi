import { useState } from 'react';
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
  Coins,
  Tag,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { motion } from 'framer-motion';
import { NAKAMA_CAPTAINS_NAME } from '@/constants/branding';

interface AdminNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const PRIMARY_NAV: AdminNavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/crews', label: 'Crews', icon: Shield },
  { to: '/admin/captains', label: NAKAMA_CAPTAINS_NAME, icon: Award },
  { to: '/admin/questions', label: 'Questions', icon: Database },
];

const SECONDARY_NAV: AdminNavItem[] = [
  { to: '/admin/pricing', label: 'Store Pricing', icon: Tag },
  { to: '/admin/kobans', label: 'Kobans', icon: Coins },
  { to: '/admin/applications', label: 'Applications', icon: FileCheck2 },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/audit-logs', label: 'Audit log', icon: Terminal },
  { to: '/admin/health', label: 'Health & Tests', icon: Activity },
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

  const handleSignOut = async () => {
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
      <aside className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 md:left-0 bg-[var(--glass-surface)] border-r border-[var(--glass-border)] z-30">
        {/* Sidebar Header */}
        <div className="h-16 px-5 border-b border-[var(--glass-border)] flex items-center">
          <Link to="/admin" className="flex items-center" aria-label="Boardly Admin">
            <Logo size="admin" />
          </Link>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {ALL_SIDEBAR_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[13px] font-heading transition-colors ${
                  isActive
                    ? 'glass-row text-[var(--text)] font-semibold border-[var(--glass-border)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-[#D71921]' : 'text-[var(--muted)]'} />
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
                  <span className="inline-block text-[10px] font-heading px-1.5 py-0.2 rounded-full border border-[var(--red)] text-[var(--red)]">
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
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
      <header className="md:hidden sticky top-0 z-30 h-16 bg-[var(--nav-bg)] allow-backdrop-blur border-b border-[var(--glass-border)] px-4 flex items-center">
        <Link to="/admin" className="flex items-center" aria-label="Boardly Admin">
          <Logo size="admin" />
        </Link>
      </header>

      {/* ─── MAIN CONTENT VIEWPORT ─────────────────────────────────────────── */}
      <main className="flex-1 md:ml-[240px] min-w-0 min-h-[calc(100vh-3.5rem)] md:min-h-screen p-4 sm:p-6 md:p-8 pb-32 sm:pb-36 md:pb-8 max-w-[1400px] w-full mx-auto overflow-x-hidden">
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
            <div className="max-w-[480px] w-full p-6 sm:p-8 rounded-[28px] glass-card text-center">
              <div className="w-14 h-14 rounded-full glass-row border border-[var(--red)]/40 text-[var(--red)] flex items-center justify-center mx-auto mb-5">
                <ShieldAlert size={28} />
              </div>
              <h1 className="font-dot text-[22px] font-bold text-[var(--text)] mb-3">
                Admin access restricted
              </h1>
              <p className="font-heading text-[14px] text-[var(--muted)] leading-relaxed mb-5">
                This portal is strictly reserved for the Boardly platform super-administrator.
                Your account (<strong className="text-[var(--text)] font-semibold">{user.email}</strong>) does not have administrator authority.
              </p>
              <div className="glass-row p-3 rounded-[14px] text-[12px] font-heading text-[var(--muted)] mb-6">
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
          <Outlet />
        )}
      </main>

      {/* ─── MOBILE FLOATING PILL BOTTOM NAV (Overview, Users, Questions, More) ──── */}
      <div
        className="md:hidden fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-24px)] max-w-[420px] z-40"
        aria-label="Admin Navigation Bar"
      >
        <nav
          role="tablist"
          style={{
            backgroundColor: 'var(--nav-bg)',
            borderColor: 'var(--glass-border)',
            boxShadow: 'var(--glass-card-shadow), var(--glass-highlight)',
          }}
          className="rounded-full allow-backdrop-blur border p-1 flex items-center justify-between select-none relative overflow-hidden h-[54px]"
        >
          {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => {
            const isQuestions = to.includes('questions');
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                aria-label={label}
                className="relative rounded-full transition-colors duration-150 cursor-pointer h-full flex items-center justify-center text-center outline-none select-none flex-1 min-w-0 px-1"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="adminActiveNavPill"
                        className="absolute inset-0 rounded-full z-0"
                        style={{
                          backgroundColor: '#D71921',
                          boxShadow: '0 4px 14px -2px rgba(215, 25, 33, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
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
                        {isQuestions && (
                          <span className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[var(--red)] ring-2 ${isActive ? 'ring-[#D71921]' : 'ring-[var(--nav-bg)]'}`} />
                        )}
                      </div>
                      <span className="sr-only">{label}</span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* 4th Tab: "More" button */}
          <button
            type="button"
            role="tab"
            aria-selected={isSecondaryActive}
            title="More admin sections"
            aria-label="More admin sections"
            onClick={() => setIsMoreOpen(true)}
            className="relative rounded-full transition-colors duration-150 cursor-pointer h-full flex items-center justify-center text-center outline-none select-none flex-1 min-w-0 px-1"
          >
            {isSecondaryActive && (
              <motion.div
                layoutId="adminActiveNavPill"
                className="absolute inset-0 rounded-full z-0"
                style={{
                  backgroundColor: '#D71921',
                  boxShadow: '0 4px 14px -2px rgba(215, 25, 33, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
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
      </div>

      {/* ─── MOBILE "MORE" BOTTOM SHEET ────────────────────────────────────── */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-[var(--overlay-bg)] transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="relative w-full max-h-[80vh] glass-panel allow-backdrop-blur rounded-t-[28px] p-5 flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-[var(--glass-border)] rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <h2 className="font-dot font-bold text-[15px] text-[var(--text)]">
                More admin sections
              </h2>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full glass-pill text-[var(--muted)] hover:text-[var(--text)]"
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
                  className={`flex items-center justify-between p-3 rounded-[18px] text-[13px] font-heading transition-colors ${
                    location.pathname.startsWith(to)
                      ? 'glass-row border-[var(--red)]/40 text-[var(--text)] font-semibold'
                      : 'glass-row text-[var(--muted)] hover:text-[var(--text)]'
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
                className="w-full flex items-center justify-center gap-2 p-3 rounded-[18px] glass-row border-[var(--red)]/40 text-[var(--red)] font-heading text-[13px] font-medium"
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
