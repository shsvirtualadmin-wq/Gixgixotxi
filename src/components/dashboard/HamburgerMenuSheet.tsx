import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Settings,
  ShoppingBag,
  Gift,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { clearSecurityStatusCache } from '@/hooks/useSecurityStatus';
import { clearCachedRewardsState } from '@/services/rewardsService';
import { BoardlySettingsFlow, BOARDLY_APP_VERSION } from '@/components/settings/BoardlySettingsFlow';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useWallet } from '@/hooks/useWallet';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { getDisplayName, getUsernameHandle } from '@/utils/displayName';
import {
  clearCachedEquippedLoadout,
  clearCachedKobans,
  clearSwrCache,
} from '@/utils/userStateSource';
import { useBodyScrollLock } from '@/utils/scrollLock';

export interface HamburgerMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DashboardMenuContentProps {
  onNavigate: (path: string) => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  showCoinBalanceInStore?: boolean;
}

export const APP_VERSION = BOARDLY_APP_VERSION;

export function clearCachedAuthAndAdminStorage() {
  clearSecurityStatusCache();
  clearCachedRewardsState();
  clearCachedEquippedLoadout();
  clearCachedKobans();
  clearSwrCache();
  try {
    const lsKeysToRemove: string[] = [
      'boardly_user_authenticated',
      'boardly_guest_session_token',
      'boardly_guest_session_backup_v1',
      'boardly_last_known_user_v1',
      'boardly_last_known_wallet_v1',
      'boardly_cached_role',
      'boardly_admin_token',
      'boardly_admin_cache',
      'boardly_last_route',
      'boardly_pro_badge_v1',
      'boardly_koban_style_v1',
      'boardly_active_session_id_v1',
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
          k.startsWith('boardly_guest') ||
          k.startsWith('cached_profile_') ||
          k.startsWith('boardly_user_profile_') ||
          k.startsWith('boardly_swr_v2:') ||
          k.startsWith('boardly_read_notifs_v2_') ||
          k.startsWith('boardly_security_status_') ||
          k.startsWith('boardly_rewards_summary_') ||
          k.startsWith('boardly_profile_layout_') ||
          k.startsWith('boardly_profile_swr_v1_'))
      ) {
        lsKeysToRemove.push(k);
      }
    }
    lsKeysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage cleanup errors
  }
}

export const DashboardMenuContent: React.FC<DashboardMenuContentProps> = ({
  onNavigate,
  onOpenProfile,
  onSignOut,
  showCoinBalanceInStore = true,
}) => {
  const { user, profile } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { isPro, isPlus } = useEffectivePlan();
  const { kobanBalance, balanceLoaded } = useWallet();

  const displayName = getDisplayName(
    {
      display_name: profile?.display_name ?? profile?.displayName,
      realName: profile?.realName ?? profile?.name ?? user?.displayName,
      username: profile?.username,
    },
    'Student'
  );
  const handle = getUsernameHandle({ username: profile?.username });

  const itemClass =
    'w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left text-[14px] font-medium text-[var(--text)] hover:bg-[var(--border)]/40 transition-colors cursor-pointer';

  return (
    <div className="w-[260px] max-w-[calc(100vw-32px)] space-y-2 text-[var(--text)]">
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <div className="text-[15px] font-semibold text-[var(--text)] truncate">
          {displayName}
        </div>
        {handle && (
          <div className="text-[12px] text-[var(--text-muted)] truncate">{handle}</div>
        )}
      </div>

      <div className="space-y-0.5">
        <button type="button" onClick={onOpenProfile} className={itemClass}>
          <span className="inline-flex items-center gap-2.5 min-w-0">
            <User className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">Profile</span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
        </button>

        {!isPro ? (
          <button
            type="button"
            onClick={() => onNavigate('/dashboard/plan')}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left text-[14px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2.5 min-w-0">
              <Crown className="w-4 h-4 shrink-0" />
              <span className="truncate">Upgrade to Pro</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        ) : !isPlus ? (
          <button
            type="button"
            onClick={() => onNavigate('/dashboard/plan')}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left text-[14px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="truncate">Upgrade to Plus</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        ) : null}

        <button type="button" onClick={() => onNavigate('/store')} className={itemClass}>
          <span className="inline-flex items-center gap-2.5 min-w-0">
            <ShoppingBag className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">Boardly Store</span>
          </span>
          {showCoinBalanceInStore ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[var(--koban-bg)] text-[var(--koban)] border border-[var(--koban-border)] tabular-nums">
              <KobanIcon size={12} decorative />
              {!balanceLoaded || kobanBalance === null ? (
                <span className="inline-block w-8 h-3 rounded skeleton" aria-hidden="true" />
              ) : (
                kobanBalance.toLocaleString()
              )}
            </span>
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
          )}
        </button>

        <button type="button" onClick={() => onNavigate('/rewards')} className={itemClass}>
          <span className="inline-flex items-center gap-2.5 min-w-0">
            <Gift className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">Rewards</span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
        </button>

        <button type="button" onClick={() => onNavigate('/locker')} className={itemClass}>
          <span className="inline-flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">Locker</span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
        </button>

        <button type="button" onClick={() => onNavigate('/settings')} className={itemClass}>
          <span className="inline-flex items-center gap-2.5 min-w-0">
            <Settings className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">Settings</span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
        </button>

        <button type="button" onClick={toggleTheme} className={itemClass}>
          <span className="inline-flex items-center gap-2.5 min-w-0">
            {isDark ? (
              <Sun className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            ) : (
              <Moon className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
            )}
            <span className="truncate">{isDark ? 'Light theme' : 'Dark theme'}</span>
          </span>
        </button>
      </div>

      <div className="pt-1 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onSignOut}
          className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left text-[14px] font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

export const HamburgerMenuSheet: React.FC<HamburgerMenuSheetProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen, 'hamburger-menu-sheet');

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9900] h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Settings and more"
    >
      <BoardlySettingsFlow
        onClose={onClose}
        onAfterNavigate={onClose}
        scrollContainer="self"
      />
    </div>,
    document.body
  );
};

export default HamburgerMenuSheet;
