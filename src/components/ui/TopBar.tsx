import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../lib/firebase';
import { getUpgradePrompt, getPlanConfig } from '../../data/planLimits';
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Sparkles,
  Shield,
  Award,
  BookOpen,
  ArrowRight,
  Check,
} from 'lucide-react';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  onNavigateUpgrade?: () => void;
  onNavigateProfile?: () => void;
  onSearchChange?: (q: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onNavigateUpgrade,
  onNavigateProfile,
  onSearchChange,
}) => {
  const { user, profile, isAdmin, activeRole, switchRole, availableRoles, logOut } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const upgradeInfo = getUpgradePrompt(profile?.plan, isAdmin);
  const planConfig = getPlanConfig(profile?.plan);

  const roleLabels: Record<UserRole, { label: string; icon: React.ReactNode }> = {
    student: { label: 'Student View', icon: <UserIcon className="w-3.5 h-3.5 text-indigo-600" /> },
    organizer: { label: 'Study Circles', icon: <BookOpen className="w-3.5 h-3.5 text-teal-600" /> },
    captain: { label: 'Campus Captain', icon: <Award className="w-3.5 h-3.5 text-amber-600" /> },
    admin: { label: 'Admin Portal', icon: <Shield className="w-3.5 h-3.5 text-violet-600" /> },
  };

  return (
    <header className="sticky top-0 z-20 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3" ref={profileMenuRef}>
        {/* Upgrade Pill (hidden for admin and premium) */}
        {upgradeInfo && onNavigateUpgrade && (
          <button
            type="button"
            onClick={onNavigateUpgrade}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-sm shadow-indigo-500/20 cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">{upgradeInfo.label}</span>
            <span className="sm:hidden">Upgrade</span>
          </button>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Notifications
                </span>
                <span className="text-[10px] text-indigo-600 font-bold">All caught up</span>
              </div>
              <div className="py-6 text-center text-xs text-slate-400">
                No new unread reminders.
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown & Role Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-black text-xs text-slate-900 dark:text-white leading-tight">
                {profile?.name || 'Student'}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-violet-400 leading-tight">
                {isAdmin ? 'Admin' : planConfig.name}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {profile?.name || 'Student'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {isAdmin ? 'ADMINISTRATOR' : `${planConfig.name} Plan`}
                  </span>
                </div>
              </div>

              {/* Direct Admin Portal Switcher */}
              {isAdmin && (
                <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                  <a
                    href="/admin"
                    onClick={(e) => {
                      e.preventDefault();
                      setProfileMenuOpen(false);
                      window.history.pushState({}, '', '/admin');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-violet-600" />
                    <span>Switch to Admin Portal</span>
                  </a>
                </div>
              )}

              {/* Role Switcher Menu (when multiple other roles exist) */}
              {availableRoles.length > 1 && !isAdmin && (
                <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Switch Portal View
                  </span>
                  {availableRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        switchRole(r);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {roleLabels[r].icon}
                        <span>{roleLabels[r].label}</span>
                      </div>
                      {activeRole === r && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {onNavigateProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateProfile();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Settings / Billing</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  setProfileMenuOpen(false);
                  await logOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
