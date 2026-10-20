import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, CreditCard, LogOut, Sun, Moon, Shield, Award, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Logo } from '@/components/ui/Logo';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useTheme } from '@/hooks/useTheme';
import { useWallet } from '@/hooks/useWallet';
import { KobanChip } from '@/components/koban/KobanIcon';
import { AvatarFrame, AvatarPicture, Nameplate } from '@/components/koban/CosmeticRenderers';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

interface Props {
  sidebarCollapsed?: boolean;
}

export function DashboardTopBar({ sidebarCollapsed: _sidebarCollapsed }: Props) {
  const { signOutUser, isAdmin } = useAuth();
  const { user, profile } = useUserProfile();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { theme, toggle: toggleTheme } = useTheme();

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

  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, equipped } = useWallet();
  const isPro = effectivePlan.isUnlimited;
  const role = profile?.role || 'student';
  const cleanName = sanitizeStudentDisplayName(profile?.displayName || user?.displayName, profile?.shortId || user?.uid);

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
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--card-2)] border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors cursor-pointer"
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
        {/* Avatar Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User profile menu"
            className="flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          >
            <AvatarFrame itemId={equipped?.frame || 'none'} size={42}>
              <AvatarPicture
                avatarId={equipped?.avatar}
                avatarKey={profile?.avatarKey}
                variant={profile?.avatarVariant}
                seed={user?.uid}
                size={34}
              />
            </AvatarFrame>
          </button>

          {/* Avatar Dropdown Menu */}
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--card)] border border-[var(--border)] p-2 shadow-xl z-50 flex flex-col gap-1"
            >
              {/* User summary header (No Email) */}
              <div className="p-3 border-b border-[var(--border)] space-y-1">
                {equipped?.nameplate ? (
                  <Nameplate
                    itemId={equipped.nameplate}
                    name={cleanName}
                    shortId={profile?.shortId || (user?.uid ? user.uid.slice(0, 5) : '00000')}
                    roleBadge={role === 'captain' ? 'CAPTAIN' : undefined}
                  />
                ) : (
                  <div
                    className="font-bold text-sm text-[var(--text)] truncate"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {cleanName}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`badge-pill text-[11px] px-2 py-0.5 ${
                      isPro ? 'badge-pill-red' : ''
                    }`}
                  >
                    {effectivePlan.isSuperAdmin
                      ? 'Superadmin · Unlimited'
                      : isPro
                      ? (effectivePlan.source === 'crew' ? `Pro (${effectivePlan.crewName || 'Crew'})` : 'Pro Member')
                      : 'Free Starter'}
                  </span>
                  {role !== 'student' && (
                    <span className="badge-pill text-[11px] px-2 py-0.5 capitalize">
                      {role}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu items */}
              <Link
                to="/store"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--text)] hover:bg-[var(--card-2)] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag size={16} className="text-[#E8A317]" />
                  <span>Boardly Store</span>
                </div>
                <KobanChip balance={kobanBalance} />
              </Link>
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
