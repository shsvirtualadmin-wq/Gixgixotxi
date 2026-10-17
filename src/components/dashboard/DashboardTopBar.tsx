import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, CreditCard, LogOut, Sun, Moon, Shield, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Logo } from '@/components/ui/Logo';

interface Props {
  sidebarCollapsed?: boolean;
}

export function DashboardTopBar({ sidebarCollapsed: _sidebarCollapsed }: Props) {
  const { signOutUser, isAdmin } = useAuth();
  const { user, profile } = useUserProfile();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('boardly-theme') : 'dark';
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('boardly-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOutUser();
    navigate('/login');
  };

  const isPro = profile?.isPremium || profile?.plan === 'pro';
  const role = profile?.role || 'student';

  return (
    <header
      className="h-16 w-full border-b border-[var(--border)] px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-[50]"
      style={{ backgroundColor: 'var(--card)' }}
    >
      {/* Left side: Mobile brand logo */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center md:hidden" aria-label="Boardly Dashboard">
          <Logo size="navbar" />
        </Link>
      </div>

      {/* Right side: theme toggle, upgrade button, and Avatar Menu */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Superadmin button */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1A1A1A] border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-[#FFFFFF] transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <Shield size={13} />
            <span>Admin Portal</span>
          </button>
        )}

        {/* Upgrade pill for free students */}
        {!isPro && !isAdmin && (
          <Link
            to="/pricing"
            className="btn-red text-xs py-1.5 px-3.5 rounded-full"
            style={{ height: '36px', fontSize: '13px' }}
          >
            Upgrade to Pro
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors cursor-pointer border border-[var(--border)]"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Avatar Menu Container */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User profile menu"
            className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center text-[var(--text)] font-semibold hover:border-[var(--red)] transition-colors cursor-pointer text-sm"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (user?.displayName?.[0] || user?.email?.[0] || 'S').toUpperCase()
            )}
          </button>

          {/* Avatar Dropdown Menu */}
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#111111] border border-[var(--border)] p-2 shadow-xl z-50 flex flex-col gap-1"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* User summary header */}
              <div className="p-3 border-b border-[var(--border)]">
                <div
                  className="font-bold text-sm text-[var(--text)] truncate"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {user?.displayName || 'Student Aspirant'}
                </div>
                <div className="text-xs text-[var(--muted)] truncate mt-0.5">
                  {user?.email}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={`badge-pill text-[11px] px-2 py-0.5 ${
                      isPro ? 'badge-pill-red' : ''
                    }`}
                  >
                    {isPro ? 'Pro Member' : 'Free Starter'}
                  </span>
                  {role !== 'student' && (
                    <span className="badge-pill text-[11px] px-2 py-0.5 capitalize">
                      {role}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu items */}
              {profile?.profileCompleted || profile?.onboardingCompleted ? (
                <Link
                  to="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <User size={16} />
                  <span>Profile</span>
                </Link>
              ) : (
                <Link
                  to="/onboarding"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <User size={16} />
                  <span>Target Exam &amp; Profile Setup</span>
                </Link>
              )}

              <Link
                to="/pricing"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <CreditCard size={16} />
                <span>Plans &amp; Upgrade</span>
              </Link>

              {role === 'crew' && (
                <Link
                  to="/crew"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <Award size={16} />
                  <span>Crew Dashboard</span>
                </Link>
              )}

              {role === 'captain' && (
                <Link
                  to="/captain"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <Award size={16} />
                  <span>Captain Dashboard</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--red)] hover:bg-[var(--card-2)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <Shield size={16} />
                  <span>Superadmin Portal</span>
                </Link>
              )}

              <div className="border-t border-[var(--border)] my-1" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--card-2)] transition-colors cursor-pointer text-left"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
