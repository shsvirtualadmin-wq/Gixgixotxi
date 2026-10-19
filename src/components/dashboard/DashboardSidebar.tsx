import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  GraduationCap,
  Sparkles,
  Shield,
  Sun,
  Moon,
  Award,
  User,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { Logo } from '@/components/ui/Logo';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

import { useTheme } from '@/hooks/useTheme';

export function DashboardSidebar() {
  const { isAdmin, signOutUser } = useAuth();
  const { user, profile } = useUserProfile();
  const navigate = useNavigate();
  const effectivePlan = useEffectivePlan();

  const { theme, toggle: toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  const isPro = effectivePlan.isUnlimited;
  const role = profile?.role || 'student';
  const rawDisplayName = profile?.displayName || user?.displayName || 'Student';
  const displayName = sanitizeStudentDisplayName(rawDisplayName, profile?.shortId || user?.uid);
  const initial = (displayName[0] || 'S').toUpperCase();

  return (
    <aside
      className="hidden md:flex flex-col border-r border-[var(--border)] shrink-0 select-none sticky top-0 h-screen"
      style={{
        width: 240,
        backgroundColor: 'var(--card)',
      }}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border)] shrink-0">
        <Link to="/dashboard" className="flex items-center" aria-label="Boardly Dashboard">
          <Logo size="sidebar" />
        </Link>
      </div>

      {/* Student Navigation Items */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Study Portal
        </div>

        {/* 1. Cockpit */}
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
            }`
          }
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          <LayoutDashboard size={18} />
          <span>Cockpit</span>
        </NavLink>

        {/* 2. Daily Practice */}
        <NavLink
          to="/dashboard/practice"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
            }`
          }
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          <BookOpen size={18} />
          <span>Daily Practice</span>
        </NavLink>

        {/* 3. Arena */}
        <NavLink
          to="/dashboard/arena"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
            }`
          }
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          <Zap size={18} />
          <span>Arena</span>
        </NavLink>

        {/* 4. Target Exam & Profile Setup (switches to Profile when setup is complete) */}
        {profile?.profileCompleted || profile?.onboardingCompleted ? (
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
              }`
            }
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            <User size={18} />
            <span>Profile</span>
          </NavLink>
        ) : (
          <NavLink
            to="/onboarding"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
              }`
            }
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            <GraduationCap size={18} />
            <span>Target Exam &amp; Profile Setup</span>
          </NavLink>
        )}

        {/* Study Squads / Crew */}
        <NavLink
          to="/dashboard/crew"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
            }`
          }
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          <Users size={18} />
          <span>Crew</span>
        </NavLink>

        {/* 5. Plans & Upgrade */}
        <NavLink
          to="/pricing"
          className={({ isActive }) =>
            `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
            }`
          }
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          <div className="flex items-center gap-3">
            <Sparkles size={18} />
            <span>Plans &amp; Upgrade</span>
          </div>
          {!isPro && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--text)] text-[var(--bg)] font-semibold">
              Pro
            </span>
          )}
        </NavLink>

        {/* Ambassadorship role if approved */}
        {(role === 'crew' || role === 'ambassador' || Boolean(profile?.isAmbassador)) && (
          <NavLink
            to="/dashboard/ambassador"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
              }`
            }
          >
            <Award size={18} />
            <span>Ambassador</span>
          </NavLink>
        )}

        {role === 'captain' && (
          <NavLink
            to="/captain"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
              }`
            }
          >
            <Award size={18} />
            <span>Captain Hub</span>
          </NavLink>
        )}

        {/* ── SUPERADMIN PORTAL (Visible for admin accounts) ──────────────── */}
        {isAdmin && (
          <div className="pt-2 mt-1 border-t border-[var(--border)]">
            <Link
              to="/admin"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[rgba(239,68,68,0.08)] border border-[var(--red)] text-[var(--red)] hover:bg-[rgba(239,68,68,0.16)] transition-colors"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Shield size={16} />
              <span>Superadmin Portal</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer: User summary, Theme Toggle & Sign Out */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--card)] flex flex-col gap-2">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
          <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--text)] shrink-0">
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
          <div className="min-w-0 flex-1">
            <p className="font-heading font-semibold text-xs text-[var(--text)] truncate">
              {displayName}
            </p>
            <p className="font-heading text-[10px] text-[var(--muted)] truncate">
              {isPro ? 'Pro Member' : 'Free Starter'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[11px] font-heading text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            <span className="capitalize">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center justify-center p-2 rounded-lg border border-[var(--border)] hover:border-[var(--red)]/40 hover:bg-[rgba(239,68,68,0.08)] text-[var(--muted)] hover:text-[var(--red)] transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
