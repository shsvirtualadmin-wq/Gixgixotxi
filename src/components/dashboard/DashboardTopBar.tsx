import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, CreditCard, LogOut, Sun, Moon, Shield, Award, ShoppingBag, Settings, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Logo } from '@/components/ui/Logo';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useTheme } from '@/hooks/useTheme';
import { useWallet } from '@/hooks/useWallet';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { KobanChip } from '@/components/koban/KobanIcon';
import { AvatarFrame, AvatarPicture, Nameplate } from '@/components/koban/CosmeticRenderers';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { useProfileModal } from '@/contexts/ProfileModalContext';

interface Props {
  sidebarCollapsed?: boolean;
}

export function DashboardTopBar({ sidebarCollapsed: _sidebarCollapsed }: Props) {
  const { signOutUser, isAdmin } = useAuth();
  const { user, profile } = useUserProfile();
  const { openProfile } = useProfileModal();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { theme, toggle: toggleTheme } = useTheme();
  const unreadCount = useUnreadNotificationsCount();

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
  const { balance: kobanBalance, loading: walletLoading, equipped } = useWallet();
  const isPro = effectivePlan.isUnlimited;
  const role = profile?.role || 'student';
  const cleanName = sanitizeStudentDisplayName(profile?.displayName || user?.displayName, profile?.shortId || user?.uid);

  return (
    <header className="sticky top-0 z-[50] w-full px-3 sm:px-6 pt-3 pb-1 shrink-0 pointer-events-none">
      <div
        className="max-w-5xl mx-auto h-14 sm:h-16 px-3.5 sm:px-5 rounded-full allow-backdrop-blur border flex items-center justify-between pointer-events-auto transition-all duration-200"
        style={{
          backgroundColor: 'var(--nav-bg)',
          borderColor: 'var(--glass-border)',
          boxShadow: 'var(--glass-card-shadow)',
        }}
      >
        {/* Left side: Brand logo + Pro badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link to="/dashboard" className="flex items-center shrink-0" aria-label="Boardly Dashboard">
            <Logo size="navbar" />
          </Link>
          <span
            className={`hidden xs:inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
              isPro ? 'badge-pill-red' : 'glass-pill text-[var(--text-muted)]'
            }`}
          >
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>

        {/* Right side: Kobans wallet chip, notification bell, theme toggle, upgrade button, and Avatar Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
          {/* Superadmin button */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold glass-pill border border-[var(--red)]/50 text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Shield size={13} />
              <span>Admin Portal</span>
            </button>
          )}

          {/* Upgrade pill for free students */}
          {!isPro && !isAdmin && (
            <Link
              to="/dashboard/plans"
              className="hidden sm:inline-flex btn-primary text-xs py-1.5 px-3.5 rounded-full items-center"
              style={{ height: '34px', fontSize: '12px' }}
            >
              Upgrade to Pro
            </Link>
          )}

          {/* Kobans Wallet Chip */}
          <Link
            to="/store"
            title="Boardly Store & Kobans Wallet"
            className="flex items-center transition-transform hover:scale-105"
          >
            <KobanChip balance={kobanBalance} loading={walletLoading} />
          </Link>

          {/* Notification Bell */}
          <Link
            to="/dashboard/notifications"
            aria-label="Notifications"
            title="Notifications"
            className="relative w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D71921] text-white text-[9px] font-bold flex items-center justify-center leading-none border border-black/30 shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
            className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Avatar Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="User profile menu"
              className="flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
            >
              <AvatarFrame itemId={equipped?.frame || 'none'} size={40}>
                <AvatarPicture
                  avatarId={equipped?.avatar}
                  avatarKey={profile?.avatarKey}
                  variant={profile?.avatarVariant}
                  seed={user?.uid}
                  size={32}
                />
              </AvatarFrame>
            </button>

            {/* Avatar Dropdown Menu */}
            {menuOpen && (
              <div
                className="absolute right-0 mt-2.5 w-64 rounded-[24px] glass-card allow-backdrop-blur p-2 z-50 flex flex-col gap-1"
              >
                {/* User summary header (No Email) */}
                <div
                  onClick={() => {
                    setMenuOpen(false);
                    openProfile();
                  }}
                  className="p-3 border-b border-[var(--glass-border)] space-y-1 cursor-pointer hover:bg-[var(--glass-pill-bg)] transition-colors rounded-t-[18px]"
                  title="View your profile"
                >
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
                  <span>Profile Setup</span>
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

              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>

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
      </div>
    </header>
  );
}
