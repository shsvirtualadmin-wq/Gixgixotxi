import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  ShoppingBag,
  Award,
  Trophy,
  Sparkles,
  Settings,
  Shield,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Pencil,
  Search,
  X,
  User,
  AtSign,
  Lock,
  Mail,
  Trash2,
  MessageCircle,
  Users,
  Flame,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useProfileModal } from '@/contexts/ProfileModalContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useWallet } from '@/hooks/useWallet';
import { useTheme, type ThemeSetting } from '@/hooks/useTheme';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { LineLoader } from '@/components/ui/LineLoader';
import { sanitizeStudentDisplayName, isAdminAccount } from '@/utils/privacy';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { ProBadge } from '@/components/ui/ProBadge';
import { useProBadge } from '@/contexts/ProBadgeContext';
import { useSecurityStatus, clearSecurityStatusCache } from '@/hooks/useSecurityStatus';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { clearCachedRewardsState, prefetchRewardsSummary } from '@/services/rewardsService';
import { markRewardsTapStart } from '@/lib/navStore';
import { useBodyScrollLock } from '@/utils/scrollLock';

export interface HamburgerMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APP_VERSION = 'v1.0.0';

export function clearCachedAuthAndAdminStorage() {
  clearSecurityStatusCache();
  clearCachedRewardsState();
  try {
    const lsKeysToRemove: string[] = [
      'boardly_user_authenticated',
      'boardly_cached_role',
      'boardly_admin_token',
      'boardly_admin_cache',
      'boardly_last_route',
      'boardly_pro_badge_v1',
      'boardly_koban_style_v1',
    ];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        k !== 'boardly-theme' &&
        (k.startsWith('boardly_admin') ||
          k.startsWith('boardly_role') ||
          k.startsWith('boardly_auth') ||
          k.startsWith('boardly_token') ||
          k.startsWith('boardly_security_status_v1_') ||
          k.startsWith('boardly_rewards_summary_v1_') ||
          k.startsWith('boardly_profile_layout_v1_') ||
          k.startsWith('boardly_settings_plan_v1_') ||
          k.startsWith('boardly_notif_prefs_v1_') ||
          k.startsWith('boardly_pro_badge_v1_') ||
          k.startsWith('boardly_koban_style_v1_') ||
          k.startsWith('firebase:authUser'))
      ) {
        lsKeysToRemove.push(k);
      }
    }
    lsKeysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore storage errors
  }

  try {
    sessionStorage.clear();
  } catch {
    // ignore storage errors
  }
}

export interface DashboardMenuContentProps {
  onNavigate: (target: string) => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  showCoinBalanceInStore?: boolean;
  searchQuery?: string;
  hideProfileHeader?: boolean;
}

interface MenuRowDefinition {
  id: string;
  label: string;
  subtitle?: string;
  keywords: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  rightBadge?: React.ReactNode;
}

export type UniversalSearchSection = 'Menu items' | 'Settings' | 'Pages' | 'Actions';

export interface UniversalSearchIndexItem {
  id: string;
  label: string;
  subtitle?: string;
  keywords: string[];
  section: UniversalSearchSection;
  route?: string;
  action?: () => void;
  icon: React.ReactNode;
  rightBadge?: React.ReactNode;
  danger?: boolean;
}

const UNIVERSAL_SEARCH_SECTION_ORDER: UniversalSearchSection[] = [
  'Menu items',
  'Settings',
  'Pages',
  'Actions',
];

function scoreUniversalSearchItem(item: UniversalSearchIndexItem, rawQuery: string): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;

  const labelLower = item.label.toLowerCase();
  const subtitleLower = (item.subtitle || '').toLowerCase();
  const keywordsLower = item.keywords.map((k) => k.toLowerCase());
  const tokens = q.split(/\s+/).filter(Boolean);

  // Every query token must match at least one of label, keywords, or subtitle
  for (const token of tokens) {
    const inLabel = labelLower.includes(token);
    const inKeywords = keywordsLower.some((k) => k.includes(token));
    const inSubtitle = subtitleLower.includes(token);
    if (!inLabel && !inKeywords && !inSubtitle) {
      return 0;
    }
  }

  let score = 0;

  if (labelLower === q) {
    score += 1000;
  } else if (labelLower.startsWith(q)) {
    score += 650;
  } else if (labelLower.split(/[\s/&()-]+/).some((w) => w.startsWith(q))) {
    score += 480;
  } else if (labelLower.includes(q)) {
    score += 300;
  }

  if (keywordsLower.some((k) => k === q)) {
    score += 520;
  } else if (keywordsLower.some((k) => k.startsWith(q))) {
    score += 360;
  } else if (keywordsLower.some((k) => k.includes(q))) {
    score += 220;
  }

  for (const token of tokens) {
    if (labelLower.startsWith(token)) score += 90;
    else if (labelLower.includes(token)) score += 55;
    if (keywordsLower.some((k) => k === token)) score += 80;
    else if (keywordsLower.some((k) => k.startsWith(token))) score += 50;
    else if (keywordsLower.some((k) => k.includes(token))) score += 30;
  }

  return score;
}

export const DashboardMenuContent: React.FC<DashboardMenuContentProps> = ({
  onNavigate,
  onOpenProfile,
  onSignOut,
  searchQuery = '',
  hideProfileHeader = false,
}) => {
  const location = useLocation();
  const { user, profileLoading, isAdmin, isGuest } = useAuth();
  const { profile } = useUserProfile();
  const effectivePlan = useEffectivePlan();
  const { balance: kobanBalance, equipped } = useWallet();
  const { themeSetting, resolvedTheme, setTheme } = useTheme();
  const { effectiveProBadge } = useProBadge();
  const securityStatus = useSecurityStatus();
  const unreadNotifCount = useUnreadNotificationsCount();

  // Single trusted server-verified role value keyed strictly by uid
  const confirmedRole: string | null =
    !profileLoading && user && profile?.role ? profile.role : null;

  const isConfirmedSuperAdmin = Boolean(
    !profileLoading &&
      user &&
      !isGuest &&
      (isAdminAccount(user.uid) || confirmedRole === 'superadmin')
  );

  const isConfirmedAdmin = Boolean(
    !profileLoading &&
      user &&
      !isGuest &&
      (isConfirmedSuperAdmin || confirmedRole === 'admin' || isAdmin)
  );

  const role = profile?.role || 'student';
  const isApprovedCaptain = Boolean(
    user &&
      (role === 'captain' ||
        role === 'ambassador' ||
        confirmedRole === 'captain' ||
        confirmedRole === 'ambassador' ||
        profile?.isCaptain ||
        profile?.isAmbassador)
  );

  const isPro = Boolean((effectivePlan.isUnlimited || isConfirmedAdmin) && !isGuest);

  const singleBadgeLabel = !user || isGuest
    ? 'Guest'
    : isConfirmedSuperAdmin
    ? 'Super Admin'
    : isConfirmedAdmin
    ? 'Admin'
    : isApprovedCaptain
    ? 'Captain'
    : isPro
    ? 'Pro'
    : 'Free';

  const rawName =
    profile?.nickname || profile?.displayName || user?.displayName || 'Student';
  const displayName = user
    ? sanitizeStudentDisplayName(rawName, profile?.shortId || user?.uid)
    : 'Guest Student';
  const handleText = user
    ? `@${profile?.username || profile?.shortId || user.uid.slice(0, 6)}`
    : '@guest';

  const pathname = location.pathname;
  const commonsTarget = user ? '/dashboard/commons' : '/commons';
  const messagesTarget = user ? '/dashboard/messages' : '/messages';
  const notificationsTarget = user ? '/dashboard/notifications' : '/notifications';
  const crewTarget = user ? '/dashboard/crew' : '/crew';
  const isCommonsActive =
    pathname.startsWith('/commons') || pathname.startsWith('/dashboard/commons');
  const isGrandLineActive = pathname.startsWith('/grand-line');
  const isStoreActive =
    pathname.startsWith('/store') || pathname.startsWith('/dashboard/store');
  const isLeaderboardActive =
    pathname.startsWith('/leaderboard') || pathname.includes('leaderboard');
  const isRewardsActive =
    pathname.startsWith('/rewards') || pathname.startsWith('/dashboard/rewards');
  const isNotificationsActive =
    pathname.startsWith('/dashboard/notifications') || pathname === '/notifications';
  const isSettingsActive =
    pathname.startsWith('/settings') || pathname.startsWith('/dashboard/settings');
  const isCaptainActive =
    pathname.startsWith('/dashboard/captain') ||
    pathname.startsWith('/dashboard/ambassador');
  const isAdminActive = pathname.startsWith('/admin');

  const q = searchQuery.trim().toLowerCase();

  // Group 1 ("Boardly Store" group): Boardly Commons, Grand Line Mock Tests, Boardly Store (with coin count badge), Notifications (with unread badge), Leaderboard, Rewards
  const group1Rows = useMemo<MenuRowDefinition[]>(() => [
    {
      id: 'commons',
      label: 'Boardly Commons',
      keywords: 'boardly commons community feed posts discussions',
      icon: <Compass size={18} strokeWidth={1.9} />,
      active: isCommonsActive,
      onClick: () => onNavigate(commonsTarget),
    },
    {
      id: 'grand-line',
      label: 'Grand Line Mock Tests',
      keywords: 'grand line mock tests exams practice drills',
      icon: <Award size={18} strokeWidth={1.9} />,
      active: isGrandLineActive,
      onClick: () => onNavigate('/grand-line'),
    },
    {
      id: 'store',
      label: 'Boardly Store',
      keywords: 'boardly store shop kobans coins cosmetics frames avatars',
      icon: <ShoppingBag size={18} strokeWidth={1.9} />,
      active: isStoreActive,
      onClick: () => onNavigate('/store'),
      rightBadge: (
        <span className="fsm-coin-badge" title="Kobans balance">
          <KobanIcon size={14} decorative />
          <span>{(kobanBalance ?? 0).toLocaleString()}</span>
        </span>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      keywords: 'notifications alerts bell inbox updates mentions activity',
      icon: <Mail size={18} strokeWidth={1.9} />,
      active: isNotificationsActive,
      onClick: () => onNavigate(notificationsTarget),
      rightBadge:
        unreadNotifCount > 0 ? (
          <span
            className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#D71921] text-white text-[11px] font-bold inline-flex items-center justify-center leading-none tabular-nums"
            title={`${unreadNotifCount} unread`}
          >
            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
          </span>
        ) : undefined,
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      keywords: 'leaderboard rankings top scorers standings',
      icon: <Trophy size={18} strokeWidth={1.9} />,
      active: isLeaderboardActive,
      onClick: () => onNavigate('/leaderboard'),
    },
    {
      id: 'rewards',
      label: 'Rewards',
      subtitle: 'Daily Check-in & Referrals',
      keywords: 'rewards daily check-in referrals kobans streaks bonus',
      icon: <Sparkles size={18} strokeWidth={1.9} />,
      active: isRewardsActive,
      onClick: () => {
        markRewardsTapStart();
        onNavigate('/rewards');
      },
    },
  ], [
    isCommonsActive,
    commonsTarget,
    isGrandLineActive,
    isStoreActive,
    kobanBalance,
    isNotificationsActive,
    notificationsTarget,
    unreadNotifCount,
    isLeaderboardActive,
    isRewardsActive,
    onNavigate,
  ]);

  // Group 2: Settings, Superadmin Portal (super admins / admins only) + Captain Deck (for captains)
  const group2Rows = useMemo<MenuRowDefinition[]>(() => {
    const rows: MenuRowDefinition[] = [
      {
        id: 'settings',
        label: 'Settings',
        keywords: 'settings account preferences security password profile pro badge',
        icon: <Settings size={18} strokeWidth={1.9} />,
        active: isSettingsActive,
        onClick: () => onNavigate('/settings'),
      },
    ];

    if (isApprovedCaptain) {
      rows.push({
        id: 'captain-deck',
        label: 'Captain Deck',
        keywords: 'captain deck ambassador referrals tests',
        icon: <Award size={18} strokeWidth={1.9} />,
        active: isCaptainActive,
        onClick: () => onNavigate('/dashboard/captain'),
      });
    }

    if (isConfirmedSuperAdmin) {
      rows.push({
        id: 'superadmin-portal',
        label: 'Superadmin Portal',
        keywords: 'superadmin admin portal dashboard moderation users',
        icon: <Shield size={18} strokeWidth={1.9} />,
        active: isAdminActive,
        onClick: () => onNavigate('/admin'),
      });
    } else if (isConfirmedAdmin) {
      rows.push({
        id: 'admin-portal',
        label: 'Admin Portal',
        keywords: 'admin portal dashboard moderation users',
        icon: <Shield size={18} strokeWidth={1.9} />,
        active: isAdminActive,
        onClick: () => onNavigate('/admin'),
      });
    }

    return rows;
  }, [
    isSettingsActive,
    isApprovedCaptain,
    isCaptainActive,
    isConfirmedAdmin,
    isConfirmedSuperAdmin,
    isAdminActive,
    onNavigate,
  ]);

  // Central Universal Search Index across Menu items, Settings, Pages, and Actions
  const universalSearchIndex = useMemo<UniversalSearchIndexItem[]>(() => {
    const themeIcon =
      resolvedTheme === 'dark' ? (
        <Moon size={18} strokeWidth={1.9} />
      ) : (
        <Sun size={18} strokeWidth={1.9} />
      );

    const items: UniversalSearchIndexItem[] = [
      // ── Section 1: Menu items ──
      {
        id: 'menu-commons',
        label: 'Boardly Commons',
        subtitle: 'Community feed & study notes',
        keywords: ['boardly commons', 'commons', 'community', 'feed', 'posts', 'discussions', 'notes'],
        section: 'Menu items',
        route: commonsTarget,
        icon: <Compass size={18} strokeWidth={1.9} />,
      },
      {
        id: 'menu-grand-line',
        label: 'Grand Line Mock Tests',
        subtitle: 'Timed entry test simulations',
        keywords: ['grand line', 'mock tests', 'exams', 'practice', 'drills', 'mcq', 'tests'],
        section: 'Menu items',
        route: '/grand-line',
        icon: <Award size={18} strokeWidth={1.9} />,
      },
      {
        id: 'menu-store',
        label: 'Boardly Store',
        subtitle: 'Cosmetics, avatars & frames',
        keywords: ['boardly store', 'store', 'shop', 'kobans', 'coins', 'cosmetics', 'avatars', 'frames', 'buy'],
        section: 'Menu items',
        route: '/store',
        icon: <ShoppingBag size={18} strokeWidth={1.9} />,
        rightBadge: (
          <span className="fsm-coin-badge" title="Kobans balance">
            <KobanIcon size={14} decorative />
            <span>{(kobanBalance ?? 0).toLocaleString()}</span>
          </span>
        ),
      },
      {
        id: 'menu-leaderboard',
        label: 'Leaderboard',
        subtitle: 'Top scorers & rankings',
        keywords: ['leaderboard', 'rankings', 'top scorers', 'standings', 'rank', 'scores'],
        section: 'Menu items',
        route: '/leaderboard',
        icon: <Trophy size={18} strokeWidth={1.9} />,
      },
      {
        id: 'menu-rewards',
        label: 'Rewards',
        subtitle: 'Daily Check-in & Referrals',
        keywords: ['rewards', 'daily check-in', 'referrals', 'kobans', 'streaks', 'bonus', 'claim'],
        section: 'Menu items',
        route: '/rewards',
        icon: <Sparkles size={18} strokeWidth={1.9} />,
      },
      {
        id: 'menu-settings',
        label: 'Settings',
        subtitle: 'Account, security & preferences',
        keywords: ['settings', 'preferences', 'account', 'options', 'configuration', 'profile'],
        section: 'Menu items',
        route: '/settings',
        icon: <Settings size={18} strokeWidth={1.9} />,
      },
      ...(isApprovedCaptain
        ? [
            {
              id: 'menu-captain-deck',
              label: 'Captain Deck',
              subtitle: 'Ambassador & referral tools',
              keywords: ['captain', 'captain deck', 'ambassador', 'referrals', 'crew'],
              section: 'Menu items' as UniversalSearchSection,
              route: '/dashboard/captain',
              icon: <Award size={18} strokeWidth={1.9} />,
            },
          ]
        : []),
      ...(isConfirmedSuperAdmin
        ? [
            {
              id: 'menu-superadmin-portal',
              label: 'Superadmin Portal',
              subtitle: 'User management & moderation',
              keywords: ['superadmin', 'super admin', 'admin', 'portal', 'moderation', 'users', 'dashboard'],
              section: 'Menu items' as UniversalSearchSection,
              route: '/admin',
              icon: <Shield size={18} strokeWidth={1.9} />,
            },
          ]
        : []),
      {
        id: 'menu-appearance',
        label: 'Appearance',
        subtitle: 'Light, Dark & System theme',
        keywords: ['appearance', 'theme', 'light', 'dark', 'system', 'mode', 'color', 'colour'],
        section: 'Menu items',
        route: '/settings#settings-theme',
        icon: themeIcon,
      },
      {
        id: 'menu-sign-out',
        label: 'Sign out',
        subtitle: 'Open session sign-out in Settings',
        keywords: ['sign out', 'logout', 'log out', 'exit', 'leave', 'end session'],
        section: 'Menu items',
        route: '/settings#settings-sign-out',
        icon: <LogOut size={18} strokeWidth={1.9} />,
        danger: true,
      },

      // ── Section 2: Settings ──
      {
        id: 'setting-plan',
        label: 'Workspace / Plan',
        subtitle: 'Settings · Current Plan & View Plan Details',
        keywords: [
          'workspace',
          'plan',
          'pro',
          'upgrade',
          'subscription',
          'billing',
          'free plan',
          'pro plan',
          'unlimited',
          'membership',
          'view plan details',
        ],
        section: 'Settings',
        route: '/settings#settings-plan',
        icon: <Sparkles size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-email',
        label: 'Account Email',
        subtitle: 'Settings · Verified email address & privacy note',
        keywords: ['email', 'account email', 'email address', 'verified email', 'contact', 'mail'],
        section: 'Settings',
        route: '/settings#settings-email',
        icon: <Mail size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-username',
        label: 'Username & Study Role',
        subtitle: 'Settings · Change @username & academic role badge',
        keywords: [
          'change username',
          'username',
          'handle',
          '@handle',
          'edit username',
          'user id',
          'study role',
          'academic role',
          'matric',
          'fsc',
          'mdcat',
          'ecat',
        ],
        section: 'Settings',
        route: '/settings#settings-username',
        icon: <AtSign size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-display-name',
        label: 'Display Name',
        subtitle: 'Settings · Change your display name',
        keywords: [
          'change display name',
          'display name',
          'nickname',
          'name',
          'edit name',
          'profile name',
          'full name',
          'rename',
          'official name',
        ],
        section: 'Settings',
        route: '/settings#settings-display-name',
        icon: <User size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-theme',
        label: 'Appearance & Theme',
        subtitle: 'Settings · Light, Dark & System mode',
        keywords: [
          'theme',
          'change theme',
          'appearance',
          'dark mode',
          'light mode',
          'system theme',
          'color',
          'colour',
          'night mode',
        ],
        section: 'Settings',
        route: '/settings#settings-theme',
        icon: themeIcon,
      },
      {
        id: 'setting-reduce-effects',
        label: 'Reduce effects',
        subtitle: 'Settings · Appearance · Disable animations & heavy blur',
        keywords: [
          'reduce effects',
          'smooth mode',
          'animations',
          'blur',
          'performance',
          'battery',
          'lag',
          'low end',
        ],
        section: 'Settings',
        route: '/settings#appearance-reduce-effects',
        icon: <Sparkles size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-hide-dragon',
        label: 'Hide dragon',
        subtitle: 'Settings · Appearance · Toggle companion dragon visibility',
        keywords: [
          'hide dragon',
          'dragon',
          'mascot',
          'companion',
          'pet',
          'show dragon',
          'appearance',
        ],
        section: 'Settings',
        route: '/settings#settings-dragon',
        icon: <Sparkles size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-profile-layout',
        label: 'Profile layout',
        subtitle: 'Settings · Choose from 10 live profile layouts',
        keywords: [
          'profile layout',
          'profile',
          'layout',
          'design',
          'theme',
          'banner',
          'game card',
          'clean social',
          'dark passport',
          'centered hero',
          'full cover',
          'trading card',
          'retro pixel',
          'glass',
          'id badge',
          'loadout showcase',
        ],
        section: 'Settings',
        route: '/settings#profile-layout',
        icon: <User size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-pro-badge',
        label: 'Pro Badge',
        subtitle: 'Settings · 31 badge designs & Show my badge toggle',
        keywords: [
          'pro badge',
          'badge',
          'emblem',
          'tag',
          'cosmetic badge',
          'show my badge',
          'ember',
          'neon',
          'holo',
        ],
        section: 'Settings',
        route: '/settings#appearance-pro-badge',
        icon: <Sparkles size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-koban-icon',
        label: 'Koban Icon',
        subtitle: 'Settings · Coin design, color palette, glow, motion & shine',
        keywords: [
          'koban',
          'koban icon',
          'coin',
          'coin style',
          'gold coin',
          'color palette',
          'glow strength',
          'motion',
          'shine',
          'sparkles',
        ],
        section: 'Settings',
        route: '/settings#appearance-koban-icon',
        icon: <ShoppingBag size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-notifications',
        label: 'Notification preferences',
        subtitle: 'Settings · Koban receipts & test start notifications',
        keywords: [
          'notification preferences',
          'email notifications',
          'receipts',
          'koban receipts',
          'test start notifications',
          'preferences',
          'unsubscribe',
        ],
        section: 'Settings',
        route: '/settings#settings-notifications',
        icon: <Mail size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-password',
        label: 'Change password',
        subtitle: 'Settings · Security · Update your account password',
        keywords: [
          'change password',
          'password',
          'set password',
          'reset password',
          'update password',
          'security',
          'credentials',
          'login',
        ],
        section: 'Settings',
        route: '/settings#settings-password',
        icon: <Lock size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-2fa',
        label: 'Security & Two-Step Verification',
        subtitle: securityStatus.known
          ? `Settings · ${securityStatus.rowLabel} · Authenticator app (TOTP), backup codes & email code`
          : 'Settings · Authenticator app (TOTP), backup codes & email code',
        keywords: [
          '2fa',
          'two-step verification',
          'two factor',
          'authenticator',
          'totp',
          'backup codes',
          'regenerate backup codes',
          'security',
          ...(securityStatus.known ? [securityStatus.rowLabel.toLowerCase()] : []),
        ],
        section: 'Settings',
        route: '/settings#security-totp',
        icon: <Shield size={18} strokeWidth={1.9} />,
        rightBadge: securityStatus.known ? (
          <span className="text-xs font-medium text-[var(--menu-subtext)]">
            {securityStatus.rowLabel}
          </span>
        ) : (
          <span className="stg-row-value-skeleton" aria-label="Loading" />
        ),
      },
      {
        id: 'setting-email-2fa',
        label: 'Email code at login',
        subtitle: securityStatus.known
          ? `Settings · Security · ${securityStatus.emailCodeEnabled ? 'Enabled' : 'Off'}`
          : 'Settings · Security · 6-digit login verification code',
        keywords: [
          'email code at login',
          'email 2fa',
          'login code',
          'turn off email code',
          'verification code',
        ],
        section: 'Settings',
        route: '/settings#security-email-2fa',
        icon: <Mail size={18} strokeWidth={1.9} />,
        rightBadge: securityStatus.known ? (
          <span className="text-xs font-medium text-[var(--menu-subtext)]">
            {securityStatus.emailCodeEnabled ? 'Email code' : 'Off'}
          </span>
        ) : (
          <span className="stg-row-value-skeleton" aria-label="Loading" />
        ),
      },
      {
        id: 'setting-remembered-devices',
        label: 'Remembered devices & Sign out of all devices',
        subtitle: securityStatus.known
          ? `Settings · Security · ${securityStatus.rememberedDevices} active`
          : 'Settings · Security · Revoke trusted sessions everywhere',
        keywords: [
          'remembered devices',
          'trusted devices',
          'sign out of all devices',
          'sessions',
          'revoke devices',
        ],
        section: 'Settings',
        route: '/settings#security-devices',
        icon: <Shield size={18} strokeWidth={1.9} />,
        rightBadge: securityStatus.known ? (
          <span className="text-xs font-medium text-[var(--menu-subtext)]">
            {securityStatus.rememberedDevices} active
          </span>
        ) : (
          <span className="stg-row-value-skeleton" aria-label="Loading" />
        ),
      },
      {
        id: 'setting-delete-account',
        label: 'Delete account',
        subtitle: 'Settings · Security · Permanently close your account',
        keywords: [
          'delete',
          'remove',
          'deactivate',
          'close account',
          'delete account',
          'erase account',
          'wipe account',
          'cancel account',
          'terminate',
        ],
        section: 'Settings',
        route: '/settings#settings-delete-account',
        icon: <Trash2 size={18} strokeWidth={1.9} />,
        danger: true,
      },
      {
        id: 'setting-legal',
        label: 'Legal & Privacy',
        subtitle: 'Settings · Terms of Service & Privacy Policy (v2.0)',
        keywords: [
          'legal',
          'privacy',
          'privacy policy',
          'terms',
          'terms of service',
          'version 2.0',
          'rules',
        ],
        section: 'Settings',
        route: '/settings#settings-legal',
        icon: <FileText size={18} strokeWidth={1.9} />,
      },
      {
        id: 'setting-sign-out',
        label: 'Sign out',
        subtitle: 'Settings · End your current session',
        keywords: ['sign out', 'logout', 'log out', 'end session', 'exit', 'switch account'],
        section: 'Settings',
        route: '/settings#settings-sign-out',
        icon: <LogOut size={18} strokeWidth={1.9} />,
        danger: true,
      },

      // ── Section 3: Pages ──
      {
        id: 'page-commons',
        label: 'Commons',
        subtitle: 'Community study feed & posts',
        keywords: ['commons', 'boardly commons', 'feed', 'posts', 'community', 'notes', 'questions'],
        section: 'Pages',
        route: commonsTarget,
        icon: <Compass size={18} strokeWidth={1.9} />,
      },
      {
        id: 'page-mock-tests',
        label: 'Mock Tests',
        subtitle: 'Grand Line & university practice exams',
        keywords: ['mock tests', 'tests', 'grand line', 'practice', 'exams', 'mcqs', 'universities', 'nust', 'mdcat', 'ecat'],
        section: 'Pages',
        route: '/grand-line',
        icon: <Award size={18} strokeWidth={1.9} />,
      },
      {
        id: 'page-store',
        label: 'Store',
        subtitle: 'Kobans wallet, avatars & frames',
        keywords: ['store', 'boardly store', 'shop', 'kobans', 'wallet', 'coins', 'cosmetics', 'avatars', 'frames'],
        section: 'Pages',
        route: '/store',
        icon: <ShoppingBag size={18} strokeWidth={1.9} />,
      },
      {
        id: 'page-leaderboard',
        label: 'Leaderboard',
        subtitle: 'Global & university standings',
        keywords: ['leaderboard', 'rankings', 'top scorers', 'standings', 'hall of fame'],
        section: 'Pages',
        route: '/leaderboard',
        icon: <Trophy size={18} strokeWidth={1.9} />,
      },
      {
        id: 'page-rewards',
        label: 'Rewards',
        subtitle: 'Daily check-in & referral bonuses',
        keywords: ['rewards', 'daily check-in', 'referrals', 'bonus', 'earn kobans'],
        section: 'Pages',
        route: '/rewards',
        icon: <Sparkles size={18} strokeWidth={1.9} />,
      },
      {
        id: 'page-messages',
        label: 'Messages',
        subtitle: 'Direct messages & study chat',
        keywords: ['messages', 'chat', 'dm', 'direct messages', 'inbox', 'conversations'],
        section: 'Pages',
        route: messagesTarget,
        icon: <MessageCircle size={18} strokeWidth={1.9} />,
      },
      {
        id: 'page-notifications',
        label: 'Notifications',
        subtitle: 'Activity alerts, inbox & updates',
        keywords: ['notifications', 'alerts', 'bell', 'inbox', 'updates', 'mentions', 'activity'],
        section: 'Pages',
        route: notificationsTarget,
        icon: <Mail size={18} strokeWidth={1.9} />,
      },
      {
        id: 'page-friends',
        label: 'Friends',
        subtitle: 'Squad, crew & study partners',
        keywords: ['friends', 'squad', 'crew', 'nakama', 'teammates', 'study group', 'members'],
        section: 'Pages',
        route: crewTarget,
        icon: <Users size={18} strokeWidth={1.9} />,
      },
      {
        id: 'page-streak',
        label: 'Streak',
        subtitle: 'Daily study streak tracker',
        keywords: ['streak', 'streaks', 'daily streak', 'flame', 'fire', 'consistency', 'calendar'],
        section: 'Pages',
        route: '/dashboard/streaks',
        icon: <Flame size={18} strokeWidth={1.9} />,
      },
      ...(isConfirmedSuperAdmin
        ? [
            {
              id: 'page-superadmin-portal',
              label: 'Superadmin Portal',
              subtitle: 'Admin dashboard & user controls',
              keywords: [
                'superadmin portal',
                'superadmin',
                'super admin',
                'admin',
                'admin dashboard',
                'portal',
                'moderation',
                'users',
              ],
              section: 'Pages' as UniversalSearchSection,
              route: '/admin',
              icon: <Shield size={18} strokeWidth={1.9} />,
            },
          ]
        : []),

      // ── Section 4: Actions ──
      {
        id: 'action-sign-out',
        label: 'Sign out',
        subtitle: 'Review & confirm signing out in Settings',
        keywords: ['sign out', 'logout', 'log out', 'exit', 'leave', 'end session', 'switch account'],
        section: 'Actions',
        route: '/settings#settings-sign-out',
        icon: <LogOut size={18} strokeWidth={1.9} />,
        danger: true,
      },
      {
        id: 'action-delete-account',
        label: 'Delete account',
        subtitle: 'Review & confirm account deletion in Settings',
        keywords: [
          'delete',
          'remove',
          'deactivate',
          'close account',
          'delete account',
          'erase account',
          'wipe account',
          'cancel account',
        ],
        section: 'Actions',
        route: '/settings#settings-delete-account',
        icon: <Trash2 size={18} strokeWidth={1.9} />,
        danger: true,
      },
      {
        id: 'action-change-theme',
        label: 'Change theme',
        subtitle: 'Switch between Light, Dark & System in Settings',
        keywords: [
          'change theme',
          'theme',
          'appearance',
          'dark mode',
          'light mode',
          'system',
          'toggle theme',
          'switch theme',
          'color',
          'colour',
        ],
        section: 'Actions',
        route: '/settings#settings-theme',
        icon: themeIcon,
      },
    ];

    return items;
  }, [
    resolvedTheme,
    commonsTarget,
    kobanBalance,
    isApprovedCaptain,
    isConfirmedSuperAdmin,
    messagesTarget,
    notificationsTarget,
    crewTarget,
    securityStatus.known,
    securityStatus.rowLabel,
    securityStatus.emailCodeEnabled,
    securityStatus.rememberedDevices,
  ]);

  // Ranked universal search results grouped by section
  const groupedSearchResults = useMemo(() => {
    if (!q) return [];

    const scored = universalSearchIndex
      .map((item) => ({
        item,
        score: scoreUniversalSearchItem(item, q),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    return UNIVERSAL_SEARCH_SECTION_ORDER.map((section) => ({
      section,
      items: scored.filter((s) => s.item.section === section).map((s) => s.item),
    })).filter((group) => group.items.length > 0);
  }, [q, universalSearchIndex]);

  const noResults = q.length > 0 && groupedSearchResults.length === 0;

  return (
    <div className="space-y-4">
      {/* Centered 88px Avatar + Edit Pencil Badge, Name, @username, Role Pill */}
      {!hideProfileHeader && (
        <div className="flex flex-col items-center text-center pt-1 pb-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative inline-flex items-center justify-center rounded-full cursor-pointer group focus:outline-none"
            aria-label="Edit profile"
          >
            <BoardlyAvatar
              uid={user?.uid}
              name={displayName}
              avatar={(profile as Record<string, unknown> | null)?.avatar as string | null}
              equippedAvatar={equipped?.avatar}
              frame={equipped?.frame}
              size={88}
            />
            <span className="fsm-edit-badge transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
              <Pencil size={13} strokeWidth={2.2} />
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="mt-3 flex flex-col items-center text-center cursor-pointer focus:outline-none"
          >
            <span
              className="font-dot text-xl font-bold leading-tight tracking-tight"
              style={{ color: 'var(--menu-text)' }}
            >
              {displayName}
            </span>
            <span
              className="mt-0.5 text-sm font-medium"
              style={{ color: 'var(--menu-subtext)' }}
            >
              {handleText}
            </span>
          </button>

          <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
            <span className="fsm-role-pill">{singleBadgeLabel}</span>
            {isPro && effectiveProBadge && (
              <ProBadge design={effectiveProBadge} size="sm" animated priority />
            )}
          </div>
        </div>
      )}

      {/* Universal Search Results (when typing in Search Boardly) */}
      {q.length > 0 ? (
        noResults ? (
          <div
            className="fsm-card p-6 text-center text-sm"
            style={{ color: 'var(--menu-subtext)' }}
          >
            No results matching &ldquo;{searchQuery.trim()}&rdquo;
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSearchResults.map((group) => (
              <div key={group.section} className="space-y-1.5">
                <div className="fsm-section-header">{group.section}</div>
                <div className="fsm-card">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.route) {
                          onNavigate(item.route);
                        } else if (item.action) {
                          item.action();
                        }
                      }}
                      className={`fsm-row ${item.danger ? 'fsm-row--danger' : ''}`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className="fsm-row-icon">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="fsm-row-label truncate">{item.label}</div>
                          {item.subtitle && (
                            <div className="fsm-row-subtitle truncate">{item.subtitle}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {item.rightBadge}
                        <ChevronRight size={18} strokeWidth={2} className="fsm-row-chevron" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {/* Group 1: Boardly Commons, Grand Line Mock Tests, Boardly Store (with coin badge), Leaderboard, Rewards */}
          {group1Rows.length > 0 && (
            <div className="fsm-card">
              {group1Rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={row.onClick}
                  className={`fsm-row ${row.active ? 'fsm-row--active' : ''}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="fsm-row-icon">{row.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="fsm-row-label truncate">{row.label}</div>
                      {row.subtitle && (
                        <div className="fsm-row-subtitle truncate">{row.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {row.rightBadge}
                    <ChevronRight size={18} strokeWidth={2} className="fsm-row-chevron" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Group 2: Settings, Superadmin Portal (super admins / admins only) */}
          {group2Rows.length > 0 && (
            <div className="fsm-card">
              {group2Rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={row.onClick}
                  className={`fsm-row ${row.active ? 'fsm-row--active' : ''}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="fsm-row-icon">{row.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="fsm-row-label truncate">{row.label}</div>
                      {row.subtitle && (
                        <div className="fsm-row-subtitle truncate">{row.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} strokeWidth={2} className="fsm-row-chevron" />
                </button>
              ))}
            </div>
          )}

          {/* Group 3: Appearance with Light / Dark / System dropdown */}
          <div className="fsm-card">
            <div className="fsm-row" style={{ cursor: 'default' }}>
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <span className="fsm-row-icon">
                  {resolvedTheme === 'dark' ? (
                    <Moon size={18} strokeWidth={1.9} />
                  ) : (
                    <Sun size={18} strokeWidth={1.9} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="fsm-row-label truncate">Appearance</div>
                </div>
              </div>

              <div className="fsm-appearance-select-wrap shrink-0">
                <select
                  aria-label="Appearance"
                  value={themeSetting}
                  onChange={(e) => setTheme(e.target.value as ThemeSetting)}
                  className="fsm-appearance-select"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <ChevronDown
                  size={15}
                  strokeWidth={2}
                  className="pointer-events-none absolute right-2.5"
                  style={{ color: 'var(--menu-subtext)' }}
                />
              </div>
            </div>
          </div>

          {/* Last: Separate card with red "Sign out" row and "v1.0.0" label */}
          <div className="fsm-card">
            <button
              type="button"
              data-menu-item="sign-out"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (user) {
                  onSignOut();
                } else {
                  onNavigate('/login');
                }
              }}
              className="fsm-row fsm-row--danger"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <span className="fsm-row-icon">
                  <LogOut size={18} strokeWidth={1.9} />
                </span>
                <span className="fsm-row-label truncate">Sign out</span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className="text-xs font-mono tabular-nums font-medium"
                  style={{ color: 'var(--menu-subtext)' }}
                >
                  {APP_VERSION}
                </span>
                <ChevronRight size={18} strokeWidth={2} className="fsm-row-chevron" />
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const HamburgerMenuSheet: React.FC<HamburgerMenuSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOutUser } = useAuth();
  const { openProfile } = useProfileModal();

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Swipe-back (left-to-right horizontal swipe) & focus trap refs
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchDeltaX = useRef<number>(0);
  const isSwipingBack = useRef<boolean>(false);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const pushedHistoryRef = useRef<boolean>(false);

  // Lock body scroll while full-screen menu is open
  useBodyScrollLock(isOpen, 'hamburger-menu');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.setAttribute('data-hamburger-sheet-open', 'true');
      return () => {
        document.body.removeAttribute('data-hamburger-sheet-open');
      };
    } else {
      document.body.removeAttribute('data-hamburger-sheet-open');
    }
  }, [isOpen]);

  // Smooth slide-in from right on open & slide-out to right on close
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setSearchQuery('');
      setIsSearchFocused(false);
      setIsRendered(true);
      // Warm up the Rewards chunk + summary data as soon as the menu opens
      void import('@/pages/RewardsPage').catch(() => {});
      prefetchRewardsSummary(user?.uid);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else if (!isSigningOut) {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsRendered(false);
        previousActiveElementRef.current?.focus?.({ preventScroll: true });
      }, 320);
    }
    return () => clearTimeout(timer);
  }, [isOpen, isSigningOut, user?.uid]);

  // Phone's back button support via history popstate
  useEffect(() => {
    if (!isOpen) return;

    try {
      window.history.pushState(
        { ...(window.history.state || {}), boardlyMoreSheet: true },
        ''
      );
      pushedHistoryRef.current = true;
    } catch {
      pushedHistoryRef.current = false;
    }

    const handlePopState = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  const dismissMenu = useCallback(() => {
    if (pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
      try {
        window.history.back();
      } catch {
        // ignore history error
      }
    }
    onClose();
  }, [onClose]);

  // Escape key & Tab focus trap inside the page
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissMenu();
        return;
      }

      if (e.key === 'Tab' && pageRef.current) {
        const focusables = Array.from(
          pageRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismissMenu]);

  // Horizontal swipe-back (left-to-right) to close
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isSwipingBack.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isSwipingBack.current) {
      if (dx > 14 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        isSwipingBack.current = true;
      } else {
        return;
      }
    }

    if (isSwipingBack.current && dx > 0) {
      touchDeltaX.current = dx;
      if (pageRef.current) {
        pageRef.current.style.transition = 'none';
        pageRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (pageRef.current) {
      pageRef.current.style.transition = '';
      pageRef.current.style.transform = '';
    }
    if (isSwipingBack.current && touchDeltaX.current > 72) {
      dismissMenu();
    }
    touchDeltaX.current = 0;
    isSwipingBack.current = false;
  };

  // Navigate & close
  const handleNav = useCallback(
    (target: string) => {
      if (target.startsWith('/rewards')) {
        markRewardsTapStart();
      }
      const shouldReplace = pushedHistoryRef.current;
      pushedHistoryRef.current = false;
      onClose();
      navigate(target, { replace: shouldReplace });
    },
    [onClose, navigate]
  );

  // Sign out
  const handleSignOut = async () => {
    pushedHistoryRef.current = false;
    setIsSigningOut(true);
    clearCachedAuthAndAdminStorage();
    try {
      await Promise.all([
        signOutUser(),
        new Promise((resolve) => setTimeout(resolve, 450)),
      ]);
    } finally {
      setIsSigningOut(false);
      setIsRendered(false);
      onClose();
      navigate('/login', { replace: true });
    }
  };

  if (isSigningOut) {
    return <LineLoader context="login" variant="page" immediate />;
  }

  if (!isOpen && !isRendered) return null;

  const isHeaderVisible =
    !location.pathname.startsWith('/dashboard/profile') &&
    !location.pathname.startsWith('/dashboard/commons') &&
    !location.pathname.startsWith('/commons') &&
    location.pathname !== '/messages' &&
    location.pathname !== '/saved';
  const showCoinBalanceInStore = Boolean(user && !isHeaderVisible);

  const handleOpenProfile = () => {
    if (user) {
      pushedHistoryRef.current = false;
      onClose();
      openProfile();
    } else {
      handleNav('/login');
    }
  };

  const stopAllPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const pageContent = (
    <div
      ref={pageRef}
      data-hamburger-sheet="true"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onClick={stopAllPropagation}
      onMouseDown={stopAllPropagation}
      onPointerDown={stopAllPropagation}
      onPointerUp={stopAllPropagation}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`fsm-page ${isVisible ? 'fsm-page--open' : 'fsm-page--closed'}`}
    >
      {/* Scrollable full-screen content area */}
      <div className="fsm-scroll-area">
        <div className="fsm-container">
          {/* Top-left 44px circular liquid-glass back-arrow button */}
          <div className="flex items-center justify-between mb-1">
            <button
              type="button"
              onClick={dismissMenu}
              className="fsm-back-btn"
              aria-label="Back"
            >
              <ArrowLeft size={20} strokeWidth={2.1} />
            </button>
          </div>

          <DashboardMenuContent
            onNavigate={handleNav}
            onOpenProfile={handleOpenProfile}
            onSignOut={handleSignOut}
            showCoinBalanceInStore={showCoinBalanceInStore}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* Floating pill-shaped liquid-glass "Search Boardly" bar at the bottom */}
      <div className="fsm-search-wrap">
        <div className={`fsm-search-pill ${isSearchFocused ? 'is-focused' : ''}`}>
          <Search
            size={18}
            strokeWidth={2}
            className="shrink-0"
            style={{ color: isSearchFocused ? 'var(--nav-icon-active)' : 'var(--menu-subtext)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search Boardly"
            aria-label="Search Boardly"
            className="fsm-search-input"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shrink-0"
              style={{
                backgroundColor: 'var(--menu-icon-bg)',
                color: 'var(--menu-subtext)',
              }}
            >
              <X size={13} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(pageContent, document.body)
    : pageContent;
};

export default HamburgerMenuSheet;
