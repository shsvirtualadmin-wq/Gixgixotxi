import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Bell,
  ShoppingBag,
  Award,
  User,
  Sparkles,
  Settings,
  Shield,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useWallet } from '@/hooks/useWallet';
import { useTheme, type ThemeSetting } from '@/hooks/useTheme';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { KobanChip } from '@/components/koban/KobanIcon';
import { AvatarPicture, AvatarFrame } from '@/components/koban/CosmeticRenderers';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

export interface HamburgerMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HamburgerMenuSheet: React.FC<HamburgerMenuSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, isAdmin, signOutUser } = useAuth();
  const { profile } = useUserProfile();
  const { openProfile } = useProfileModal();
  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, loading: walletLoading, equipped } = useWallet();
  const { themeSetting, resolvedTheme, setTheme } = useTheme();
  const unreadCount = useUnreadNotificationsCount();

  // Animation mounting state
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Swipe-to-dismiss touch tracking
  const touchStartY = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Handle open / close slide animation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setIsRendered(true);
      setShowSignOutConfirm(false);
      // Wait for next frame before triggering CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsRendered(false);
        setShowSignOutConfirm(false);
      }, 230);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Touch handlers for swipe down to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    if (delta > 0) {
      touchDeltaY.current = delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${Math.min(delta * 0.7, 180)}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    if (touchDeltaY.current > 65) {
      onClose();
    }
    touchDeltaY.current = 0;
  };

  const handleNav = useCallback(
    (target: string) => {
      onClose();
      navigate(target);
    },
    [onClose, navigate]
  );

  const handleConfirmSignOut = async () => {
    setShowSignOutConfirm(false);
    onClose();
    await signOutUser();
    navigate('/login');
  };

  if (!isRendered) return null;

  // Identity & permissions
  const role = profile?.role || 'student';
  const customRole = profile?.customRole;
  const isSuperAdmin = Boolean(
    isAdmin ||
    effectivePlan.isSuperAdmin ||
    (user && user.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2')
  );

  const rawNickname = profile?.nickname || profile?.displayName || user?.displayName || 'Student';
  const cleanNickname = sanitizeStudentDisplayName(rawNickname, profile?.shortId || user?.uid);
  const username = profile?.username || (profile?.shortId ? profile.shortId : '');

  const isPro = effectivePlan.isUnlimited;
  const isApprovedCaptain =
    role === 'captain' ||
    role === 'ambassador' ||
    Boolean(profile?.isCaptain) ||
    Boolean(profile?.isAmbassador);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Boardly Menu"
    >
      {/* Light dim backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 transition-opacity duration-200 ease-out z-0 cursor-pointer ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Screen reader close button */}
      <button
        type="button"
        onClick={onClose}
        className="sr-only"
        aria-label="Close menu"
      >
        Close menu
      </button>

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full sm:max-w-md bg-surface text-primary border-t sm:border border-border rounded-t-[24px] sm:rounded-2xl flex flex-col max-h-[90vh] max-h-[90dvh] shadow-2xl z-10 transition-all duration-200 ease-out transform overflow-hidden ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {/* Drag Handle (Swipe Area) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing select-none shrink-0"
        >
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>

        {/* Scrollable Sheet Content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 pt-1 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] space-y-4"
        >
          {/* ── 2. HEADER: Profile Summary (Single Tappable Row) ── */}
          <div
            onClick={() => {
              onClose();
              if (user) {
                openProfile();
              } else {
                navigate('/login');
              }
            }}
            className="flex items-center justify-between p-3 rounded-2xl bg-surface-muted/60 hover:bg-surface-muted border border-border transition-colors cursor-pointer group"
            title={user ? 'Open Profile' : 'Sign In'}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
                if (user) {
                  openProfile();
                } else {
                  navigate('/login');
                }
              }
            }}
          >
            {/* Left: Avatar with equipped frame (~56px) */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0">
                <AvatarFrame itemId={equipped?.frame || 'none'} size={56}>
                  <AvatarPicture
                    avatarId={equipped?.avatar}
                    avatarKey={profile?.avatarKey}
                    variant={profile?.avatarVariant}
                    seed={user?.uid}
                    size={44}
                  />
                </AvatarFrame>
              </div>

              {/* Middle: Nickname (bold plain text), Username (muted), Role badge + Plan */}
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="font-semibold text-[16px] text-primary truncate leading-tight group-hover:text-accent transition-colors">
                  {user ? cleanNickname : 'Guest Student'}
                </h2>

                {user && username ? (
                  <p className="text-[13px] text-muted truncate mt-0.5 leading-tight">
                    @{username}
                  </p>
                ) : (
                  <p className="text-[13px] text-muted truncate mt-0.5 leading-tight">
                    {user ? 'Student' : 'Tap to sign in or create account'}
                  </p>
                )}

                {/* Role badge & Plan pill */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <RoleBadge
                    role={role}
                    customRole={customRole}
                    isSuperAdmin={isSuperAdmin}
                    size="sm"
                  />

                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-border text-muted bg-surface">
                    {isPro ? 'Unlimited' : 'Free'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Koban balance chip + Chevron */}
            <div className="flex items-center gap-1.5 shrink-0">
              {user && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('/store');
                  }}
                  title="Boardly Store"
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <KobanChip balance={kobanBalance} loading={walletLoading} />
                </div>
              )}
              <ChevronRight
                size={18}
                className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                strokeWidth={1.75}
              />
            </div>
          </div>

          {/* ── 3. GROUPED LIST: Explore ── */}
          <div className="space-y-1.5">
            <p className="text-[12px] uppercase font-semibold text-muted tracking-wider px-1">
              Explore
            </p>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-xs">
              {/* Boardly Commons */}
              <button
                type="button"
                onClick={() => handleNav(user ? '/dashboard/commons' : '/commons')}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Compass
                    size={20}
                    className="text-secondary shrink-0 group-hover:text-primary transition-colors"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                      Boardly Commons
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                      Study material, notes & doubts
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                  strokeWidth={1.75}
                />
              </button>

              {/* Grand Line Public Tests */}
              <button
                type="button"
                onClick={() => handleNav('/grand-line')}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Award
                    size={20}
                    className="text-accent shrink-0 transition-colors"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                        Grand Line
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent leading-none">
                        Mock Tests
                      </span>
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                      Captain-authored tests & national leaderboard
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                  strokeWidth={1.75}
                />
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => handleNav('/dashboard/notifications')}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Bell
                    size={20}
                    className="text-secondary shrink-0 group-hover:text-primary transition-colors"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                      Notifications
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                      Followers & announcements
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent text-on-accent leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  <ChevronRight
                    size={16}
                    className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                    strokeWidth={1.75}
                  />
                </div>
              </button>

              {/* Boardly Store */}
              <button
                type="button"
                onClick={() => handleNav('/store')}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ShoppingBag
                    size={20}
                    className="text-secondary shrink-0 group-hover:text-primary transition-colors"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                      Boardly Store
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                      Cosmetics, frames & effects
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                  strokeWidth={1.75}
                />
              </button>

              {/* Nakama Captains Hub (if captain) */}
              {isApprovedCaptain && (
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/captain')}
                  className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Award
                      size={20}
                      className="text-secondary shrink-0 group-hover:text-primary transition-colors"
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                      <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                        Nakama Captains Hub
                      </p>
                      <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                        Crew ambassador & student perks
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                    strokeWidth={1.75}
                  />
                </button>
              )}
            </div>
          </div>

          {/* ── 3. GROUPED LIST: Account ── */}
          <div className="space-y-1.5">
            <p className="text-[12px] uppercase font-semibold text-muted tracking-wider px-1">
              Account
            </p>

            <div className="glass-row rounded-[22px] overflow-hidden divide-y divide-[var(--glass-border)]">
              {/* Profile */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openProfile();
                }}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <User
                    size={20}
                    className="text-secondary shrink-0 group-hover:text-primary transition-colors"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                      Profile
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                      View & customize your card
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                  strokeWidth={1.75}
                />
              </button>

              {/* Plans & Upgrade */}
              <button
                type="button"
                onClick={() => handleNav('/dashboard/plans')}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Sparkles
                    size={20}
                    className="text-secondary shrink-0 group-hover:text-primary transition-colors"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                      Plans & Upgrade
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                      {isPro
                        ? effectivePlan.source === 'crew'
                          ? 'Unlimited with Crew'
                          : 'Unlimited plan active'
                        : 'Free plan · Tap to upgrade'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {!isPro ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent text-on-accent leading-tight shadow-xs">
                      Upgrade
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-muted text-muted leading-tight border border-border">
                      Unlimited
                    </span>
                  )}
                  <ChevronRight
                    size={16}
                    className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                    strokeWidth={1.75}
                  />
                </div>
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => handleNav('/settings')}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Settings
                    size={20}
                    className="text-secondary shrink-0 group-hover:text-primary transition-colors"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                      Settings
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                      Plan, account & sign out
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                  strokeWidth={1.75}
                />
              </button>
            </div>
          </div>

          {/* ── 3. GROUPED LIST: Admin (Visible only to superadmin account) ── */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <p className="text-[12px] uppercase font-semibold text-muted tracking-wider px-1">
                Admin
              </p>

              <div className="glass-row rounded-[22px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleNav('/admin')}
                  className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted active:bg-surface-muted/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Shield
                      size={20}
                      className="text-accent shrink-0"
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                          Superadmin Portal
                        </p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-[#D71921] dark:bg-red-950/70 dark:text-red-400 border border-red-200 dark:border-red-900/60 leading-none">
                          Super Admin
                        </span>
                      </div>
                      <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                        Users, question bank, approvals & audit log
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                    strokeWidth={1.75}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── 3. GROUPED LIST: Preferences (Appearance Segmented Control) ── */}
          <div className="space-y-1.5">
            <p className="text-[12px] uppercase font-semibold text-muted tracking-wider px-1">
              Preferences
            </p>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {resolvedTheme === 'dark' ? (
                    <Moon
                      size={20}
                      className="text-secondary shrink-0"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <Sun
                      size={20}
                      className="text-secondary shrink-0"
                      strokeWidth={1.75}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-[15px] sm:text-[16px] font-medium text-primary leading-snug">
                      Appearance
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-muted truncate leading-snug">
                      {themeSetting === 'system'
                        ? `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
                        : resolvedTheme === 'dark'
                        ? 'Dark Mode'
                        : 'Light Mode'}
                    </p>
                  </div>
                </div>

                {/* Compact 3-option Segmented Control */}
                <div
                  className="flex items-center p-1 rounded-xl bg-surface-muted border border-border shrink-0 select-none"
                  role="radiogroup"
                  aria-label="Theme selection"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('light');
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer min-h-[32px] ${
                      themeSetting === 'light'
                        ? 'bg-surface text-primary shadow-xs border border-border font-bold'
                        : 'text-muted hover:text-primary border border-transparent'
                    }`}
                    aria-checked={themeSetting === 'light'}
                    role="radio"
                    title="Light theme"
                  >
                    <Sun size={13} strokeWidth={2} />
                    <span className="text-[11px]">Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('dark');
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer min-h-[32px] ${
                      themeSetting === 'dark'
                        ? 'bg-surface text-primary shadow-xs border border-border font-bold'
                        : 'text-muted hover:text-primary border border-transparent'
                    }`}
                    aria-checked={themeSetting === 'dark'}
                    role="radio"
                    title="Dark theme"
                  >
                    <Moon size={13} strokeWidth={2} />
                    <span className="text-[11px]">Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('system');
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer min-h-[32px] ${
                      themeSetting === 'system'
                        ? 'bg-surface text-primary shadow-xs border border-border font-bold'
                        : 'text-muted hover:text-primary border border-transparent'
                    }`}
                    aria-checked={themeSetting === 'system'}
                    role="radio"
                    title="System theme"
                  >
                    <Monitor size={13} strokeWidth={2} />
                    <span className="text-[11px]">Auto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. FOOTER: Links, Version & Sign Out ── */}
          <div className="pt-2 pb-1 space-y-3.5">
            {!user ? (
              <button
                type="button"
                onClick={() => handleNav('/login')}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-[15px] sm:text-[16px] transition-colors cursor-pointer select-none shadow-xs"
              >
                <User size={18} strokeWidth={1.75} />
                <span>Sign In / Create Account</span>
              </button>
            ) : !showSignOutConfirm ? (
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-accent hover:bg-accent-soft active:bg-accent-soft/80 font-medium text-[15px] sm:text-[16px] transition-colors cursor-pointer select-none"
              >
                <LogOut size={18} strokeWidth={1.75} />
                <span>Sign Out</span>
              </button>
            ) : (
              /* Inline Safe Sign Out Confirmation Card */
              <div className="p-3.5 rounded-2xl bg-surface border border-border shadow-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                  <AlertCircle size={16} className="text-accent shrink-0" />
                  <span>Sign out of Boardly?</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-surface-muted hover:bg-surface-raised border border-border text-secondary font-medium text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSignOut}
                    className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Muted Navigation Links in One Line */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[12px] text-muted">
              <button
                type="button"
                onClick={() => handleNav('/commons/about')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                About
              </button>
              <span aria-hidden="true" className="select-none">·</span>
              <button
                type="button"
                onClick={() => handleNav('/privacy')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span aria-hidden="true" className="select-none">·</span>
              <button
                type="button"
                onClick={() => handleNav('/terms')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Terms
              </button>
              <span aria-hidden="true" className="select-none">·</span>
              <button
                type="button"
                onClick={() => handleNav('/contact')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Help & Contact
              </button>
            </div>

            {/* App Version & Credits */}
            <p className="text-[11px] text-muted text-center leading-normal">
              v1.0.0 · A project of SHS Virtual Academy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenuSheet;
