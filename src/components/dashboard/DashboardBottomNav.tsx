import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Shield,
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  X,
  ChevronRight,
  Award,
  Flame,
  Target,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PillNav, type PillNavItem } from '@/components/ui/PillNav';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useTheme } from '@/hooks/useTheme';

export function DashboardBottomNav() {
  const { isAdmin, signOutUser } = useAuth();
  const { user, profile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-close drawer on any route change so state never gets stuck or re-triggered
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const { theme, toggle: toggleTheme } = useTheme();

  const handleNav = (target: string) => {
    setIsMenuOpen(false);
    navigate(target);
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOutUser();
    navigate('/login');
  };

  const effectivePlan = useEffectivePlan();
  const isPro = effectivePlan.isUnlimited;
  const role = profile?.role || 'student';
  const displayName = profile?.displayName || user?.displayName || 'Student';
  const initial = (displayName[0] || user?.email?.[0] || 'S').toUpperCase();
  const isApprovedCaptain = role === 'captain' || role === 'ambassador' || Boolean(profile?.isCaptain) || Boolean(profile?.isAmbassador);
  const crewLink = '/dashboard/crew';

  // Unified Student Nav: Daily Practice, Cockpit, Weak Chapters, Streaks, Crew, [Captain], Menu
  const navItems: PillNavItem[] = [
    {
      to: '/dashboard/practice',
      label: 'Daily Practice',
      icon: <BookOpen size={18} />,
    },
    {
      to: '/dashboard',
      label: 'Cockpit',
      icon: <LayoutDashboard size={18} />,
      end: true,
    },
    {
      to: '/dashboard/weak-chapters',
      label: 'Weak Chapters',
      icon: <Target size={18} />,
    },
    {
      to: '/dashboard/streaks',
      label: 'Streaks',
      icon: <Flame size={18} />,
    },
    {
      to: crewLink,
      label: 'Crew',
      icon: <Users size={18} />,
    },
    ...(isApprovedCaptain
      ? [
          {
            to: '/dashboard/captain',
            label: 'Captain',
            icon: <Award size={18} />,
          },
        ]
      : []),
    {
      id: 'menu',
      label: 'Menu',
      icon: (
        <div className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--text)] relative shrink-0">
          <span>{initial}</span>
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)] ring-1 ring-[var(--surface)]"
            title="Menu & Account"
          />
        </div>
      ),
      onClick: () => setIsMenuOpen(true),
    },
  ];

  return (
    <>
      {/* ─── FIXED UNIFIED PILL BOTTOM NAVIGATION ────────────────────────────── */}
      <div
        className={`fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-24px)] max-w-[520px] z-40 transition-opacity duration-150 ${
          isMenuOpen ? 'pointer-events-none opacity-0 invisible' : 'pointer-events-auto opacity-100'
        }`}
        aria-label="Student Navigation Bar"
      >
        <PillNav
          items={navItems}
          layoutId="studentBottomNavActive"
          iconOnly={true}
        />
      </div>

      {/* ─── BOTTOM MENU DRAWER / MODAL ────────────────────────────────────── */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity z-0 pointer-events-auto"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer/Modal content: full-width bottom sheet on mobile; centered modal on md+ */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:max-w-md bg-[var(--card)] border border-[var(--border)] rounded-t-[28px] md:rounded-2xl p-5 sm:p-6 pb-8 md:pb-6 flex flex-col gap-4 overflow-y-auto max-h-[88vh] md:max-h-[85vh] z-10 pointer-events-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Grab handle for mobile */}
            <div className="md:hidden w-10 h-1 bg-[var(--border)] rounded-full mx-auto -mt-1 mb-1 pointer-events-none" />

            {/* Header: User Summary */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border)]">
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
                  <p className="font-heading font-bold text-base text-[var(--text)] truncate">
                    {displayName}
                  </p>
                  <p className="font-heading text-xs text-[var(--muted)] truncate">
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
                      {effectivePlan.isSuperAdmin
                        ? 'Superadmin · Unlimited'
                        : isPro
                        ? (effectivePlan.source === 'crew' ? `Pro (${effectivePlan.crewName || 'Crew'})` : 'Pro Member')
                        : 'Free Starter'}
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
                className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── SUPERADMIN PORTAL (Visible ONLY for admins) ───────────────── */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[var(--red)] text-[var(--red)] transition-all hover:bg-[rgba(239,68,68,0.14)] text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--red)] text-white flex items-center justify-center shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm sm:text-base">
                      Superadmin Portal
                    </p>
                    <p className="font-heading text-xs text-[var(--muted)]">
                      Manage users, question bank, approvals &amp; audit log
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--red)]" />
              </button>
            )}

            {/* Navigation links in drawer */}
            <div className="space-y-1.5">
              {/* Dynamic menu button: Profile if completed, Target Exam & Profile Setup if incomplete */}
              {profile?.profileCompleted || profile?.onboardingCompleted ? (
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/profile')}
                  className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm sm:text-base font-heading text-[var(--text)] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-[var(--muted)]" />
                    <span>Profile</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNav('/onboarding')}
                  className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm sm:text-base font-heading text-[var(--text)] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap size={18} className="text-[var(--muted)]" />
                    <span>Target Exam &amp; Profile Setup</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNav('/dashboard/plans')}
                className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm sm:text-base font-heading text-[var(--text)] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-[var(--muted)]" />
                  <span>Plans &amp; Upgrade</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!isPro && (
                    <span className="text-xs font-heading px-2 py-0.5 rounded-full bg-[var(--text)] text-[var(--bg)] font-semibold">
                      Upgrade
                    </span>
                  )}
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </div>
              </button>

              {/* Study Crew for all students */}
              <button
                type="button"
                onClick={() => handleNav(crewLink)}
                className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm sm:text-base font-heading text-[var(--text)] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-[var(--muted)]" />
                  <span>Study Crew &amp; Squads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                    Up to 30
                  </span>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </div>
              </button>

              {isApprovedCaptain && (
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/captain')}
                  className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm sm:text-base font-heading text-[var(--text)] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Award size={18} className="text-[#D71921]" />
                    <span>Nakama Captains Hub</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </button>
              )}
            </div>

            {/* Theme Toggle & Sign Out Controls */}
            <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm sm:text-base font-heading text-[var(--text)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Sun size={18} className="text-[var(--muted)]" />
                  ) : (
                    <Moon size={18} className="text-[var(--muted)]" />
                  )}
                  <span>Appearance</span>
                </div>
                <span className="text-xs font-heading text-[var(--muted)] capitalize">
                  {theme} mode
                </span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-[var(--red)]/40 text-[var(--red)] hover:bg-[rgba(239,68,68,0.08)] font-heading text-sm sm:text-base font-medium transition-colors cursor-pointer"
              >
                <LogOut size={16} />
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
