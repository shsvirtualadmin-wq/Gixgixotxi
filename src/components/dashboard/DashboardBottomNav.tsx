import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  GraduationCap,
  CreditCard,
  Shield,
  Sun,
  Moon,
  LogOut,
  X,
  ChevronRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardBottomNav() {
  const { user, profile, isAdmin, signOutUser } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Theme toggle state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('boardly-theme') : 'dark';
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('boardly-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOutUser();
    navigate('/login');
  };

  const isPro = profile?.isPremium || profile?.plan === 'pro';
  const role = profile?.role || 'student';
  const displayName = profile?.displayName || user?.displayName || 'Student';
  const initial = (displayName[0] || user?.email?.[0] || 'S').toUpperCase();

  return (
    <>
      {/* ─── BOTTOM NAVIGATION BAR ─────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--card)] px-2 py-1.5 flex items-center justify-around shadow-none"
        style={{
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        }}
        aria-label="Student Navigation Bar"
      >
        {/* 1. Cockpit */}
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[var(--text)] text-[var(--bg)]' : ''
                }`}
              >
                <LayoutDashboard size={18} />
              </div>
              <span className={`text-[10px] mt-0.5 font-heading ${isActive ? 'font-bold' : 'font-medium'}`}>
                Cockpit
              </span>
            </>
          )}
        </NavLink>

        {/* 2. Daily Practice */}
        <NavLink
          to="/dashboard/practice"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[var(--text)] text-[var(--bg)]' : ''
                }`}
              >
                <BookOpen size={18} />
              </div>
              <span className={`text-[10px] mt-0.5 font-heading ${isActive ? 'font-bold' : 'font-medium'}`}>
                Practice
              </span>
            </>
          )}
        </NavLink>

        {/* 3. Arena */}
        <NavLink
          to="/dashboard/arena"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[var(--text)] text-[var(--bg)]' : ''
                }`}
              >
                <Zap size={18} />
              </div>
              <span className={`text-[10px] mt-0.5 font-heading ${isActive ? 'font-bold' : 'font-medium'}`}>
                Arena
              </span>
            </>
          )}
        </NavLink>

        {/* 4. Target Exam & Profile */}
        <NavLink
          to="/onboarding"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[var(--text)] text-[var(--bg)]' : ''
                }`}
              >
                <GraduationCap size={18} />
              </div>
              <span className={`text-[10px] mt-0.5 font-heading ${isActive ? 'font-bold' : 'font-medium'}`}>
                Exam
              </span>
            </>
          )}
        </NavLink>

        {/* 5. Plans & Upgrade */}
        <NavLink
          to="/pricing"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[var(--text)] text-[var(--bg)]' : ''
                }`}
              >
                <CreditCard size={18} />
              </div>
              <span className={`text-[10px] mt-0.5 font-heading ${isActive ? 'font-bold' : 'font-medium'}`}>
                Plans
              </span>
            </>
          )}
        </NavLink>

        {/* 6. Profile / Menu Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            isMenuOpen ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          aria-label="Student profile and menu"
        >
          <div className="w-7 h-7 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[12px] font-heading font-bold text-[var(--text)] relative">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initial
            )}
            {isAdmin && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--red)] border-2 border-[var(--card)]"
                title="Superadmin Access"
              />
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-heading font-medium">Menu</span>
        </button>
      </nav>

      {/* ─── BOTTOM MENU DRAWER / SHEET ────────────────────────────────────── */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-h-[85vh] bg-[var(--card)] border-t border-[var(--border)] rounded-t-[28px] p-5 pb-8 flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto -mt-1 mb-1" />

            {/* Header: User Summary */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[15px] font-heading font-bold text-[var(--text)] shrink-0">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-bold text-[15px] text-[var(--text)] truncate">
                    {displayName}
                  </p>
                  <p className="font-heading text-[12px] text-[var(--muted)] truncate">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-[10px] font-heading px-2 py-0.5 rounded-full border ${
                        isPro
                          ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                          : 'border-[var(--border)] text-[var(--muted)]'
                      }`}
                    >
                      {isPro ? 'Pro Member' : 'Free Starter'}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--red)] text-[var(--red)] font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── SUPERADMIN PORTAL (Visible ONLY for admins) ───────────────── */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-[16px] bg-[rgba(239,68,68,0.08)] border border-[var(--red)] text-[var(--red)] transition-all hover:bg-[rgba(239,68,68,0.14)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--red)] text-white flex items-center justify-center shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-[14px]">
                      Superadmin Portal
                    </p>
                    <p className="font-heading text-[11px] text-[var(--muted)]">
                      Manage users, question bank, approvals &amp; audit log
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--red)]" />
              </Link>
            )}

            {/* Navigation links in drawer */}
            <div className="space-y-1.5">
              <Link
                to="/onboarding"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-[16px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[13px] font-heading text-[var(--text)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap size={16} className="text-[var(--muted)]" />
                  <span>Target Exam &amp; Profile Setup</span>
                </div>
                <ChevronRight size={14} className="text-[var(--muted)]" />
              </Link>

              <Link
                to="/pricing"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-[16px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[13px] font-heading text-[var(--text)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-[var(--muted)]" />
                  <span>Plans &amp; Upgrade</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!isPro && (
                    <span className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-[var(--text)] text-[var(--bg)] font-semibold">
                      Upgrade
                    </span>
                  )}
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </div>
              </Link>

              {role === 'crew' && (
                <Link
                  to="/crew"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-[16px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[13px] font-heading text-[var(--text)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Award size={16} className="text-[var(--muted)]" />
                    <span>Crew Ambassador Hub</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </Link>
              )}

              {role === 'captain' && (
                <Link
                  to="/captain"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-[16px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[13px] font-heading text-[var(--text)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Award size={16} className="text-[var(--muted)]" />
                    <span>Campus Captain Hub</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </Link>
              )}
            </div>

            {/* Theme Toggle & Sign Out Controls */}
            <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-between p-3 rounded-[16px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[13px] font-heading text-[var(--text)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Sun size={16} className="text-[var(--muted)]" />
                  ) : (
                    <Moon size={16} className="text-[var(--muted)]" />
                  )}
                  <span>Appearance</span>
                </div>
                <span className="text-[12px] font-heading text-[var(--muted)] capitalize">
                  {theme} mode
                </span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-[16px] border border-[var(--red)]/40 text-[var(--red)] hover:bg-[rgba(239,68,68,0.08)] font-heading text-[13px] font-medium transition-colors"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DashboardBottomNav;
