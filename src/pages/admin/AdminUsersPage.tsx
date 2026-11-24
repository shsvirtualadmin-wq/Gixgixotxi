import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  RefreshCw,
  UserCheck,
  Shield,
  Users as UsersIcon,
  Tag,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Download,
  Sparkles,
  MoreHorizontal,
  ArrowUpDown,
  RotateCcw,
  X,
  Clock,
  Copy,
  Check,
  Crown,
  UserCog,
  FileBarChart2,
  ShieldCheck,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { useAuth } from '@/contexts/AuthContext';
import { UserOverrideDrawer, type UserOverrideSection } from '@/components/admin/UserOverrideDrawer';
import { RequestAccessSheet } from '@/components/admin/RequestAccessSheet';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import { AdminNameRequestsSection } from '@/components/admin/AdminNameRequestsSection';
import {
  fetchUsersPaginated,
  getCachedAdminUsersState,
  updateCachedAdminUser2fa,
  normalizeTwoFactorSummary,
  backfillMissingDisplayNames,
  cleanupOrphanUserProfiles,
  getUserDisplayName,
  bulkUpdateUsersPlan,
  sortAdminUsers,
  type AdminUserSortKey,
} from '@/services/adminService';
import { backfillAllPublicProfiles } from '@/services/publicProfileService';
import { formatStudentId } from '@/utils/shortId';
import { maskEmail } from '@/utils/privacy';
import {
  resolveUserJoinedAtMs,
  resolveUserLastActiveAtMs,
  formatPktJoinedDate,
  formatPktExactTimestamp,
  formatRelativeTimeHint,
} from '@/utils/userDate';
import type { UserProfile, UserTwoFactorBadgeLabel, UserTwoFactorSummary } from '@/types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { getPlan, parsePlanExpiryMs } from '@/lib/planTier';

const PAGE_SIZE = 20;

type LoadState = 'loading' | 'loaded' | 'error';

type TwoFactorFilterValue =
  | 'all'
  | 'Off'
  | 'Authenticator'
  | 'Email code'
  | 'Both'
  | 'Recovery pending';

const SORT_OPTIONS: Array<{ value: AdminUserSortKey; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'questions', label: 'Most questions solved' },
  { value: 'streak', label: 'Longest streak' },
  { value: 'name', label: 'Name A–Z' },
];

function resolveEmailOrHandle(u: UserProfile, isGuestUser: boolean, isSuperAdmin: boolean): string {
  if (isGuestUser) {
    const cleanUser = String(u.username || '').trim().replace(/^@+/, '');
    return cleanUser ? `@${cleanUser}` : '—';
  }
  const rawEmail = String(u.email || '').trim();
  if (rawEmail) {
    return isSuperAdmin ? rawEmail : maskEmail(rawEmail);
  }
  const cleanHandle = String(u.username || (u as any).handle || '')
    .trim()
    .replace(/^@+/, '');
  return cleanHandle ? `@${cleanHandle}` : '—';
}

interface ActionMenuState {
  user: UserProfile;
  rect: DOMRect;
}

interface UserActionsMenuProps {
  menuState: ActionMenuState | null;
  onClose: () => void;
  onSelect: (user: UserProfile, section?: UserOverrideSection) => void;
  copiedUid: string | null;
  onCopyId: (uid: string, value: string) => void;
}

interface AdminCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  ariaLabel: string;
  onChange: () => void;
}

function AdminCheckbox({ checked, indeterminate = false, ariaLabel, onChange }: AdminCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`press-scale inline-flex items-center justify-center w-[17px] h-[17px] rounded-[5px] border transition-all cursor-pointer shrink-0 ${
        checked || indeterminate
          ? 'bg-[#D71921] border-[#D71921] text-white shadow-[0_2px_8px_rgba(215,25,33,0.4)]'
          : 'bg-white/[0.04] border-white/25 hover:border-white/50 text-transparent'
      }`}
    >
      {checked ? (
        <Check size={11} strokeWidth={3} />
      ) : indeterminate ? (
        <span className="w-2 h-[2px] rounded-full bg-white" />
      ) : null}
    </button>
  );
}

function UserActionsMenu({
  menuState,
  onClose,
  onSelect,
  copiedUid,
  onCopyId,
}: UserActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuState) return;
    let scrollArmed = false;
    const armTimer = window.setTimeout(() => {
      scrollArmed = true;
    }, 80);
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => {
      if (scrollArmed) onClose();
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', onClose);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', onClose);
    };
  }, [menuState, onClose]);

  if (!menuState || typeof document === 'undefined') return null;

  const { user: u, rect } = menuState;
  const isGuestUser = Boolean(
    u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_')
  );
  const studentId = formatStudentId(u);

  const menuWidth = 216;
  const estimatedHeight = isGuestUser ? 168 : 268;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let left = rect.right - menuWidth;
  if (left < 12) left = 12;
  if (left + menuWidth > viewportW - 12) left = viewportW - menuWidth - 12;

  const openUpward = rect.bottom + estimatedHeight + 12 > viewportH && rect.top > estimatedHeight;
  const top = openUpward ? Math.max(12, rect.top - estimatedHeight - 6) : rect.bottom + 6;

  const triggerSection = (section: UserOverrideSection) => {
    onClose();
    onSelect(u, section);
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Actions for ${getUserDisplayName(u)}`}
      data-testid={`user-actions-menu-${u.uid}`}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${menuWidth}px`,
        zIndex: 9999,
      }}
      className="rounded-[18px] bg-[#141418]/95 backdrop-blur-xl border border-white/15 shadow-[0_18px_48px_rgba(0,0,0,0.65)] p-1.5 text-[12px] font-heading text-[var(--text)]"
    >
      <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
        <p className="font-semibold text-[12px] text-[var(--text)] truncate">
          {getUserDisplayName(u)}
        </p>
        <p className="font-mono text-[10px] text-[#D71921] font-bold">{studentId}</p>
      </div>

      <button
        type="button"
        role="menuitem"
        onClick={() => triggerSection('top')}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[12px] hover:bg-white/10 transition-colors cursor-pointer text-left press-scale"
      >
        <SlidersHorizontal size={13} className="text-[var(--muted)] shrink-0" />
        <span>View / Edit Profile</span>
      </button>

      {!isGuestUser && (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => triggerSection('plan')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[12px] hover:bg-white/10 transition-colors cursor-pointer text-left press-scale"
          >
            <Crown size={13} className="text-amber-400 shrink-0" />
            <span>Manage Plan</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => triggerSection('role')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[12px] hover:bg-white/10 transition-colors cursor-pointer text-left press-scale"
          >
            <UserCog size={13} className="text-[var(--muted)] shrink-0" />
            <span>Change Role</span>
          </button>
        </>
      )}

      <button
        type="button"
        role="menuitem"
        onClick={() => triggerSection('attempts')}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[12px] hover:bg-white/10 transition-colors cursor-pointer text-left press-scale"
      >
        <FileBarChart2 size={13} className="text-[var(--muted)] shrink-0" />
        <span>Practice &amp; Attempts</span>
      </button>

      {!isGuestUser && (
        <button
          type="button"
          role="menuitem"
          onClick={() => triggerSection('security')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[12px] hover:bg-white/10 transition-colors cursor-pointer text-left press-scale"
        >
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>2FA &amp; Security</span>
        </button>
      )}

      <div className="my-1 border-t border-white/10" />

      <button
        type="button"
        role="menuitem"
        onClick={() => onCopyId(u.uid, u.uid)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[12px] hover:bg-white/10 transition-colors cursor-pointer text-left press-scale"
      >
        {copiedUid === u.uid ? (
          <Check size={13} className="text-emerald-400 shrink-0" />
        ) : (
          <Copy size={13} className="text-[var(--muted)] shrink-0" />
        )}
        <span>{copiedUid === u.uid ? 'Copied UID' : 'Copy User ID'}</span>
      </button>
    </div>,
    document.body
  );
}

interface JoinedTimestampDisplayProps {
  joinedMs: number | null;
  lastActiveMs: number | null;
  nowMs: number;
  compact?: boolean;
}

const JoinedTimestampDisplay = memo(function JoinedTimestampDisplay({
  joinedMs,
  lastActiveMs,
  nowMs,
  compact = false,
}: JoinedTimestampDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedJoined = formatPktJoinedDate(joinedMs);
  const exactJoined = formatPktExactTimestamp(joinedMs);
  const relativeJoined = formatRelativeTimeHint(joinedMs, nowMs);

  const exactLastActive = formatPktExactTimestamp(lastActiveMs);
  const relativeLastActive = formatRelativeTimeHint(lastActiveMs, nowMs);

  const tooltipLines: string[] = [];
  if (exactJoined) tooltipLines.push(`Joined: ${exactJoined}`);
  if (exactLastActive) tooltipLines.push(`Last active: ${exactLastActive}`);
  const titleText = tooltipLines.length > 0 ? tooltipLines.join('\n') : 'Join timestamp unavailable';

  if (!formattedJoined) {
    return (
      <div className="flex flex-col justify-center" title={titleText}>
        <span className="font-mono text-[12px] text-[var(--text-faint)] whitespace-nowrap">
          Unknown
        </span>
        {relativeLastActive && (
          <span
            className="text-[10px] font-mono text-[var(--muted)] whitespace-nowrap mt-0.5"
            title={exactLastActive ? `Last active: ${exactLastActive}` : undefined}
          >
            Active {relativeLastActive}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col justify-center min-w-0"
      title={titleText}
      onClick={(e) => {
        e.stopPropagation();
        setExpanded((v) => !v);
      }}
    >
      <button
        type="button"
        className={`text-left group cursor-pointer focus:outline-none ${
          compact ? 'inline-flex flex-col' : 'flex flex-col'
        }`}
        aria-label={titleText}
      >
        <span className="font-mono text-[12px] text-[var(--text)] whitespace-nowrap group-hover:text-white transition-colors">
          {formattedJoined}
        </span>
        {relativeJoined && (
          <span className="text-[11px] font-heading text-[var(--muted)] whitespace-nowrap leading-tight mt-0.5">
            {relativeJoined}
          </span>
        )}
        {relativeLastActive && (
          <span
            className="text-[10px] font-mono text-[var(--text-faint)] whitespace-nowrap leading-tight mt-0.5"
            title={exactLastActive ? `Last active: ${exactLastActive}` : undefined}
          >
            Active {relativeLastActive}
          </span>
        )}
      </button>

      {expanded && exactJoined && (
        <div className="mt-1.5 px-2 py-1 rounded-[10px] bg-black/55 border border-white/12 text-[10px] font-mono text-[var(--text)] space-y-0.5 shadow-md">
          <div className="flex items-center gap-1 text-[var(--text)]">
            <Clock size={10} className="text-[#D71921] shrink-0" />
            <span className="whitespace-nowrap">{exactJoined}</span>
          </div>
          {exactLastActive && (
            <div className="text-[var(--muted)] whitespace-nowrap">
              Last active: {exactLastActive}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

interface UserRowProps {
  user: UserProfile;
  badge2fa: UserTwoFactorBadgeLabel;
  isSuperAdmin: boolean;
  isChecked?: boolean;
  nowMs: number;
  onToggleCheck?: (uid: string) => void;
  onSelect: (user: UserProfile, section?: UserOverrideSection) => void;
  onOpenMenu: (user: UserProfile, anchorEl: HTMLElement) => void;
}

const AdminUserMobileCard = memo(function AdminUserMobileCard({
  user: u,
  badge2fa,
  isSuperAdmin,
  isChecked = false,
  nowMs,
  onToggleCheck,
  onSelect,
  onOpenMenu,
}: UserRowProps) {
  const name = getUserDisplayName(u);
  const isSuspended = !!(u.suspended || u.isSuspended);
  const isGuestUser = Boolean(
    u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_')
  );
  const resolvedTier = isGuestUser ? 'free' : getPlan(u);
  const isPaidUser = resolvedTier === 'pro' || resolvedTier === 'plus';
  const plusBadgeHidden = (u as any).plus_badge_visible === false;
  const rawPlusDesign =
    (u as any).plus_badge_design ?? (u as any).plusBadge ?? (u as any).plus_badge_id ?? null;
  const plusBadgeDesign =
    resolvedTier === 'plus' && !plusBadgeHidden && typeof rawPlusDesign === 'number'
      ? rawPlusDesign
      : null;
  const proBadgeDesign =
    resolvedTier === 'pro'
      ? (u as any).proBadgeDesign || (u as any).proBadge || 'ember'
      : null;
  const studentId = formatStudentId(u);
  const emailOrHandle = resolveEmailOrHandle(u, isGuestUser, isSuperAdmin);
  const qSolved = typeof u.totalQuestionsSolved === 'number' ? u.totalQuestionsSolved : null;
  const joinedMs = resolveUserJoinedAtMs(u);
  const lastActiveMs = resolveUserLastActiveAtMs(u);
  const trackLabel = u.targetUniversity || 'General Prep';

  return (
    <div
      onClick={() => onSelect(u)}
      data-pressable
      data-testid={`admin-user-card-${u.uid}`}
      className="press-scale p-4 rounded-[22px] bg-[var(--card)] border border-[var(--border)] hover:border-white/25 transition-all cursor-pointer flex flex-col gap-3"
    >
      {/* Top row: Checkbox + Avatar + Name/Badge/Subtitle + Actions menu */}
      <div className="flex items-start justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isSuperAdmin && !isGuestUser && onToggleCheck && (
            <AdminCheckbox
              checked={isChecked}
              ariaLabel={`Select ${name}`}
              onChange={() => onToggleCheck(u.uid)}
            />
          )}
          <BoardlyAvatar
            uid={u.uid}
            equippedAvatar={u.equipped?.avatar || u.avatar}
            name={name}
            size={38}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <p
                title={name}
                className="font-heading font-semibold text-[14px] text-[var(--text)] truncate"
              >
                {name}
              </p>
              {resolvedTier === 'plus' && plusBadgeDesign !== null ? (
                <span className="inline-flex items-center shrink-0">
                  <PlusBadge id={plusBadgeDesign} size="sm" listMode />
                </span>
              ) : resolvedTier === 'pro' && proBadgeDesign ? (
                <span className="inline-flex items-center shrink-0">
                  <ProBadge design={proBadgeDesign} size="sm" listMode />
                </span>
              ) : null}
              {isGuestUser && (
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                  Guest
                </span>
              )}
            </div>
            {isPaidUser && (
              <p className="text-[10px] font-mono text-[var(--muted)] leading-tight mt-0.5">
                {resolvedTier === 'plus' ? 'Boardly Plus' : 'Boardly Pro'}
                {resolvedTier === 'plus'
                  ? plusBadgeHidden
                    ? ' (badge hidden)'
                    : ''
                  : (u as any).proBadgeVisible === false
                  ? ' (badge hidden)'
                  : ''}
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <span className="font-mono text-[11px] font-bold text-[#D71921] shrink-0">
                {studentId}
              </span>
              <span
                title={emailOrHandle !== '—' ? emailOrHandle : undefined}
                className={`text-[11px] font-heading truncate ${
                  emailOrHandle === '—' ? 'text-[var(--text-faint)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {emailOrHandle}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Actions for ${name}`}
          data-testid={`user-card-menu-btn-${u.uid}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu(u, e.currentTarget);
          }}
          className="press-scale w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--card-2)]/70 hover:bg-white/10 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] shrink-0 cursor-pointer transition-colors"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      {/* Middle row: Joined Date + Track + Streak/Solved */}
      <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-[var(--border)]/70">
        <div className="min-w-0">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-0.5">
            Joined
          </span>
          <JoinedTimestampDisplay
            joinedMs={joinedMs}
            lastActiveMs={lastActiveMs}
            nowMs={nowMs}
            compact
          />
        </div>

        <div className="min-w-0 flex flex-col items-end text-right">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-0.5">
            Track &amp; Progress
          </span>
          <span
            title={trackLabel}
            className="text-[12px] font-heading font-medium text-[var(--text)] truncate max-w-full"
          >
            {trackLabel}
          </span>
          <div className="flex items-center justify-end gap-2 mt-0.5 font-mono text-[11px] tabular-nums">
            <span className="font-bold text-[var(--text)]">
              {qSolved !== null ? `${qSolved.toLocaleString()} MCQs` : '—'}
            </span>
            <span className="text-[var(--muted)] inline-flex items-center gap-0.5">
              <Flame size={11} className="text-amber-400" />
              {u.streak || 0}d
            </span>
          </div>
        </div>
      </div>

      {/* Bottom status row */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[var(--border)]/50">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              isSuspended
                ? 'bg-red-500/12 text-red-400 border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSuspended ? 'bg-red-400' : 'bg-emerald-400'
              }`}
            />
            {isSuspended ? 'Suspended' : 'Active'}
          </span>

          {!isGuestUser && (
            <span className="text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] capitalize">
              {u.role || 'Student'}
            </span>
          )}
        </div>

        {!isGuestUser && (
          <span
            data-testid={`user-2fa-badge-${u.uid}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(u, 'security');
            }}
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              badge2fa === 'Recovery pending'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold'
                : badge2fa !== 'Off'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                : 'border-[var(--border)] text-[var(--text-faint)]'
            }`}
          >
            2FA: {badge2fa}
          </span>
        )}
      </div>
    </div>
  );
});

const AdminUserTableRow = memo(function AdminUserTableRow({
  user: u,
  badge2fa,
  isSuperAdmin,
  isChecked = false,
  nowMs,
  onToggleCheck,
  onSelect,
  onOpenMenu,
}: UserRowProps) {
  const name = getUserDisplayName(u);
  const isSuspended = !!(u.suspended || u.isSuspended);
  const isGuestUser = Boolean(
    u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_')
  );
  const resolvedTier = isGuestUser ? 'free' : getPlan(u);
  const isPaidUser = resolvedTier === 'pro' || resolvedTier === 'plus';
  const plusBadgeHidden = (u as any).plus_badge_visible === false;
  const rawPlusDesign =
    (u as any).plus_badge_design ?? (u as any).plusBadge ?? (u as any).plus_badge_id ?? null;
  const plusBadgeDesign =
    resolvedTier === 'plus' && !plusBadgeHidden && typeof rawPlusDesign === 'number'
      ? rawPlusDesign
      : null;
  const proBadgeId =
    resolvedTier === 'pro'
      ? (u as any).proBadgeDesign || (u as any).proBadge || 'ember'
      : null;
  const studentId = formatStudentId(u);
  const emailOrHandle = resolveEmailOrHandle(u, isGuestUser, isSuperAdmin);
  const qSolved = typeof u.totalQuestionsSolved === 'number' ? u.totalQuestionsSolved : null;
  const joinedMs = resolveUserJoinedAtMs(u);
  const lastActiveMs = resolveUserLastActiveAtMs(u);
  const trackLabel = u.targetUniversity || 'General Prep';

  return (
    <tr
      onClick={() => onSelect(u)}
      data-testid={`admin-user-row-${u.uid}`}
      className="h-[68px] hover:bg-white/[0.04] active:scale-[0.998] cursor-pointer transition-all duration-150"
    >
      {/* 1. Checkbox */}
      <td
        className="w-[40px] pl-3.5 pr-1.5 py-2.5 align-middle text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {!isGuestUser && onToggleCheck ? (
          <AdminCheckbox
            checked={isChecked}
            ariaLabel={`Select ${name}`}
            onChange={() => onToggleCheck(u.uid)}
          />
        ) : (
          <span className="inline-block w-[17px] h-[17px]" aria-hidden="true" />
        )}
      </td>

      {/* 2. Student (avatar + name + plan badge + plan subtitle) */}
      <td className="py-2.5 px-2.5 align-middle min-w-[185px] max-w-[215px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <BoardlyAvatar
            uid={u.uid}
            equippedAvatar={u.equipped?.avatar || u.avatar}
            name={name}
            size={34}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                title={name}
                className="font-heading font-semibold text-[13px] text-[var(--text)] truncate"
              >
                {name}
              </span>
              {resolvedTier === 'plus' && plusBadgeDesign !== null ? (
                <span className="inline-flex items-center shrink-0">
                  <PlusBadge id={plusBadgeDesign} size="sm" listMode />
                </span>
              ) : resolvedTier === 'pro' && proBadgeId ? (
                <span className="inline-flex items-center shrink-0">
                  <ProBadge design={proBadgeId} size="sm" listMode />
                </span>
              ) : null}
              {isGuestUser && (
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                  Guest
                </span>
              )}
            </div>
            {isPaidUser && (
              <span className="text-[10px] font-mono text-[var(--muted)] block leading-tight mt-0.5 truncate">
                {resolvedTier === 'plus' ? 'Boardly Plus' : 'Boardly Pro'}
                {resolvedTier === 'plus'
                  ? plusBadgeHidden
                    ? ' (badge hidden)'
                    : ''
                  : (u as any).proBadgeVisible === false
                  ? ' (badge hidden)'
                  : ''}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 3. Short ID */}
      <td className="py-2.5 px-2.5 align-middle whitespace-nowrap font-mono font-bold text-[#D71921] text-[12px] tabular-nums">
        {studentId}
      </td>

      {/* 4. Email / Handle */}
      <td className="py-2.5 px-2.5 align-middle max-w-[165px]">
        <span
          title={emailOrHandle !== '—' ? emailOrHandle : undefined}
          className={`block truncate text-[12px] font-heading ${
            emailOrHandle === '—' ? 'text-[var(--text-faint)]' : 'text-[var(--text-muted)]'
          }`}
        >
          {emailOrHandle}
        </span>
      </td>

      {/* 5. Joined (PKT date + relative hint + optional Last active) */}
      <td className="py-2.5 px-2.5 align-middle whitespace-nowrap">
        <JoinedTimestampDisplay
          joinedMs={joinedMs}
          lastActiveMs={lastActiveMs}
          nowMs={nowMs}
        />
      </td>

      {/* 6. University Track */}
      <td className="py-2.5 px-2.5 align-middle max-w-[118px]">
        <span
          title={trackLabel}
          className="block truncate text-[12px] font-heading text-[var(--text)]"
        >
          {trackLabel}
        </span>
      </td>

      {/* 7. Questions Solved */}
      <td
        className="py-2.5 px-2.5 align-middle whitespace-nowrap font-mono font-bold text-[12px] text-[var(--text)] tabular-nums"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(u, 'attempts');
        }}
        title="Click to inspect practice attempts"
      >
        {qSolved !== null ? (
          <span>
            {qSolved.toLocaleString()}{' '}
            <span className="text-[10px] font-normal text-[var(--muted)]">MCQs</span>
          </span>
        ) : (
          <span className="text-[var(--text-faint)] font-normal">—</span>
        )}
      </td>

      {/* 8. Streak */}
      <td className="py-2.5 px-2.5 align-middle whitespace-nowrap font-mono text-[12px] text-[var(--text)] tabular-nums">
        <span className="inline-flex items-center gap-1">
          <Flame size={12} className="text-amber-400 shrink-0" />
          <span>{u.streak || 0}d</span>
        </span>
      </td>

      {/* 9. Status (Active/Suspended + Role + 2FA) */}
      <td className="py-2.5 px-2.5 align-middle whitespace-nowrap">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                isSuspended
                  ? 'bg-red-500/12 text-red-400 border-red-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSuspended ? 'bg-red-400' : 'bg-emerald-400'
                }`}
              />
              {isSuspended ? 'Suspended' : 'Active'}
            </span>
            {!isGuestUser && u.role && u.role !== 'student' && (
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/8 text-[var(--text)] border border-white/12">
                {u.role}
              </span>
            )}
          </div>
          {!isGuestUser && (
            <button
              type="button"
              data-testid={`user-2fa-badge-desktop-${u.uid}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(u, 'security');
              }}
              className={`text-[10px] font-mono leading-tight cursor-pointer hover:underline ${
                badge2fa === 'Recovery pending'
                  ? 'text-amber-400 font-semibold'
                  : badge2fa !== 'Off'
                  ? 'text-emerald-400 font-semibold'
                  : 'text-[var(--text-faint)]'
              }`}
            >
              2FA: {badge2fa}
            </button>
          )}
        </div>
      </td>

      {/* 10. Actions (⋯ menu) */}
      <td
        className="w-[50px] py-2.5 pl-1 pr-3.5 align-middle text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={`Actions for ${name}`}
          data-testid={`user-row-menu-btn-${u.uid}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu(u, e.currentTarget);
          }}
          className="press-scale inline-flex items-center justify-center w-8 h-8 rounded-full border border-transparent hover:border-[var(--border)] hover:bg-white/10 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-all"
        >
          <MoreHorizontal size={16} />
        </button>
      </td>
    </tr>
  );
});

export function AdminUsersPage() {
  const {
    user,
    isAdmin,
    isSuperAdmin: authIsSuperAdmin,
    hasPermission,
    profileLoading,
  } = useAuth();
  const canViewUsers = hasPermission('users.view');
  const [requestUsersViewOpen, setRequestUsersViewOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'users' | 'nameRequests'>('users');
  const [pendingNameRequestsCount, setPendingNameRequestsCount] = useState<number>(0);

  const initialCache = canViewUsers ? getCachedAdminUsersState() : null;
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() =>
    canViewUsers ? initialCache?.allDirectoryUsers ?? [] : []
  );
  const [totalDirectoryCount, setTotalDirectoryCount] = useState<number>(() =>
    canViewUsers ? initialCache?.totalCount ?? initialCache?.allDirectoryUsers.length ?? 0 : 0
  );
  const [user2faMap, setUser2faMap] = useState<Record<string, UserTwoFactorSummary>>(
    () => (canViewUsers ? initialCache?.user2faMap ?? {} : {})
  );
  const [loadState, setLoadState] = useState<LoadState>(() =>
    initialCache ? 'loaded' : 'loading'
  );
  const [loading, setLoading] = useState<boolean>(() => !initialCache && canViewUsers);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchingServer, setSearchingServer] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    () => (canViewUsers ? initialCache?.lastDoc ?? null : null)
  );
  const [hasMore, setHasMore] = useState<boolean>(() =>
    canViewUsers ? initialCache?.hasMore ?? false : false
  );
  const [error, setError] = useState<AdminDiagnosticError | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Sort & Filters
  const [sortBy, setSortBy] = useState<AdminUserSortKey>(
    () => initialCache?.sortBy ?? 'newest'
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState<
    'all' | 'guest' | 'registered' | 'pro' | 'plus'
  >('all');
  const [twoFactorFilter, setTwoFactorFilter] = useState<TwoFactorFilterValue>('all');
  const [selectedUids, setSelectedUids] = useState<Set<string>>(() => new Set());
  const [bulkApplying, setBulkApplying] = useState(false);

  // Actions menu (⋯)
  const [menuState, setMenuState] = useState<ActionMenuState | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Keep relative hints ("2 mins ago") fresh once per minute
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, planFilter, statusFilter, accountTypeFilter, twoFactorFilter, sortBy]);

  // Selected user for drawer/sheet
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserSection, setSelectedUserSection] = useState<UserOverrideSection>('top');

  const handleSelectUser = useCallback((u: UserProfile, section: UserOverrideSection = 'top') => {
    setSelectedUserSection(section);
    setSelectedUser(u);
  }, []);

  const handleOpenMenu = useCallback((u: UserProfile, anchorEl: HTMLElement) => {
    const rect = anchorEl.getBoundingClientRect();
    setMenuState((prev) => (prev && prev.user.uid === u.uid ? null : { user: u, rect }));
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  const handleCopyId = useCallback((uid: string, value: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedUid(uid);
    window.setTimeout(() => {
      setCopiedUid((curr) => (curr === uid ? null : curr));
    }, 1500);
  }, []);

  // Backfill names state
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);

  // Backfill public profiles state
  const [backfillingProfiles, setBackfillingProfiles] = useState(false);
  const [backfillProfilesMessage, setBackfillProfilesMessage] = useState<string | null>(null);

  const emailLower = user?.email?.toLowerCase().trim() || '';
  const isSuperAdmin = Boolean(
    authIsSuperAdmin ||
      emailLower === 'shsvirtualadmin@gmail.com' ||
      emailLower === 'support@boardly.cfd' ||
      emailLower === 'ktkhashir90@gmail.com' ||
      user?.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
      user?.uid === 'JBGCDTLuWUMUIUMCLek7SdgvUNn1'
  );

  const handleBackfillPublicProfiles = async () => {
    setBackfillingProfiles(true);
    setBackfillProfilesMessage(null);
    try {
      const res = await backfillAllPublicProfiles();
      setBackfillProfilesMessage(
        `Successfully synced ${res.backfilled} / ${res.totalUsers} student profiles to publicProfiles.`
      );
    } catch (err: unknown) {
      console.error('Backfill public profiles error:', err);
      setBackfillProfilesMessage(
        'Failed to backfill public profiles: ' +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setBackfillingProfiles(false);
    }
  };

  const loadUsers = useCallback(
    async (options?: { force?: boolean; sortOverride?: AdminUserSortKey }) => {
      if (!user || !isAdmin || !canViewUsers) return;
      const targetSort = options?.sortOverride ?? sortBy;
      const currentCached = getCachedAdminUsersState();
      if (!currentCached || options?.sortOverride) {
        setLoading(true);
        if (!currentCached) setLoadState('loading');
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await fetchUsersPaginated({
          limitCount: PAGE_SIZE,
          sortBy: targetSort,
          force: options?.force,
        });
        setAllUsers(res.users);
        setTotalDirectoryCount(res.totalCount);
        setUser2faMap((prev) => ({ ...prev, ...res.user2faMap }));
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
        setCurrentPage(1);
        setLoadState('loaded');
      } catch (err: unknown) {
        console.error('[AdminUsersPage] Failed to load users:', err);
        const e = err as Partial<AdminDiagnosticError>;
        setError({
          code: e?.code || 'USERS_FETCH_FAILED',
          message:
            e?.message ||
            'Failed to load users from database. Please verify Firestore permissions.',
          collection: e?.collection || 'users',
          operation: e?.operation || 'fetchUsersPaginated',
        });
        if (!getCachedAdminUsersState()) {
          setLoadState('error');
        }
      } finally {
        setLoading(false);
      }
    },
    [user, isAdmin, canViewUsers, sortBy]
  );

  // Initial load once auth and admin-role check settle
  const initialLoadedRef = useRef(false);
  useEffect(() => {
    if (profileLoading) return;
    if (!user || !isAdmin || !canViewUsers) {
      if (!canViewUsers) {
        setAllUsers([]);
        setUser2faMap({});
        setLoading(false);
      }
      return;
    }
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;

    const cached = getCachedAdminUsersState();
    if (cached && (cached.sortBy ?? 'newest') === sortBy) {
      setAllUsers(cached.allDirectoryUsers);
      setTotalDirectoryCount(cached.totalCount);
      setUser2faMap(cached.user2faMap);
      setLastDoc(cached.lastDoc);
      setHasMore(cached.hasMore);
      setLoadState('loaded');
      setLoading(false);
      // Silently revalidate in background if hydrated from sessionStorage or stale (> 30s)
      if (cached.fromSessionStorage || Date.now() - cached.loadedAt > 30_000) {
        void loadUsers({ sortOverride: sortBy });
      }
    } else {
      void loadUsers({ sortOverride: sortBy });
    }
  }, [profileLoading, user, isAdmin, canViewUsers, sortBy, loadUsers]);

  const handleSortChange = (nextSort: AdminUserSortKey) => {
    if (nextSort === sortBy) return;
    setSortBy(nextSort);
    setSelectedUids(new Set());
    void loadUsers({ sortOverride: nextSort, force: true });
  };

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchUsersPaginated({
        limitCount: PAGE_SIZE,
        sortBy,
        startAfterDoc: lastDoc,
      });
      setAllUsers((prev) => {
        const byUid = new Map<string, UserProfile>();
        for (const u of prev) byUid.set(u.uid, u);
        for (const u of res.users) {
          if (!byUid.has(u.uid)) byUid.set(u.uid, u);
        }
        return sortAdminUsers(Array.from(byUid.values()), sortBy);
      });
      setTotalDirectoryCount((prev) => Math.max(prev, res.totalCount));
      setUser2faMap((prev) => ({ ...prev, ...res.user2faMap }));
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.error('[AdminUsersPage] Failed to load more users:', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'USERS_LOAD_MORE_FAILED',
        message: e?.message || 'Failed to load additional users from database.',
        collection: 'users',
        operation: 'handleLoadMore',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleServerSearch = async () => {
    const q = search.trim();
    if (q.length < 2 || searchingServer) return;
    setSearchingServer(true);
    setError(null);
    try {
      const res = await fetchUsersPaginated({
        limitCount: PAGE_SIZE,
        sortBy,
        searchQuery: q,
      });
      setAllUsers((prev) => {
        const byUid = new Map<string, UserProfile>();
        for (const u of prev) byUid.set(u.uid, u);
        for (const u of res.users) {
          byUid.set(u.uid, { ...(byUid.get(u.uid) || {}), ...u } as UserProfile);
        }
        return sortAdminUsers(Array.from(byUid.values()), sortBy);
      });
      setUser2faMap((prev) => ({ ...prev, ...res.user2faMap }));
      setDebouncedSearch(q);
      setCurrentPage(1);
    } catch (err: unknown) {
      console.error('[AdminUsersPage] Directory search failed:', err);
    } finally {
      setSearchingServer(false);
    }
  };

  const resolveUser2faBadge = useCallback(
    (u: UserProfile): UserTwoFactorBadgeLabel => {
      const entry = user2faMap[u.uid] || u.twoFactorStatus;
      if (!entry) return 'Off';
      return normalizeTwoFactorSummary(entry).badgeLabel;
    },
    [user2faMap]
  );

  const handleUpdateUser2faInState = useCallback((uid: string, status: UserTwoFactorSummary) => {
    updateCachedAdminUser2fa(uid, status);
    setUser2faMap((prev) => ({ ...prev, [uid]: status }));
    setAllUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, twoFactorStatus: status } : u))
    );
    setSelectedUser((prev) =>
      prev && prev.uid === uid ? { ...prev, twoFactorStatus: status } : prev
    );
  }, []);

  // Orphan profile cleanup state
  const [cleaningOrphans, setCleaningOrphans] = useState(false);

  const handleCleanupOrphans = async () => {
    if (!user?.email) return;
    setCleaningOrphans(true);
    setBackfillMessage(null);
    try {
      const res = await cleanupOrphanUserProfiles(user.email);
      setBackfillMessage(
        res.removed > 0
          ? `Cleaned up ${res.removed} orphan profile(s) across ${res.scanned} user records.`
          : `All clean! 0 orphan profiles found across ${res.scanned} user records.`
      );
      if (res.removed > 0) {
        await loadUsers({ force: true });
      }
    } catch (err: unknown) {
      console.error('Orphan cleanup error:', err);
      setBackfillMessage(
        'Could not complete orphan profile cleanup: ' +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setCleaningOrphans(false);
    }
  };

  const handleBackfillNames = async () => {
    if (!user?.email) return;
    setBackfilling(true);
    setBackfillMessage(null);
    try {
      const res = await backfillMissingDisplayNames(user.email);
      setBackfillMessage(
        res.updated > 0
          ? `Updated ${res.updated} user display names.`
          : 'All users already have valid display names.'
      );
      await loadUsers({ force: true });
    } catch (err: unknown) {
      console.error('Backfill error:', err);
      setBackfillMessage('Could not complete backfill operation.');
    } finally {
      setBackfilling(false);
    }
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
      roleFilter !== 'all' ||
      planFilter !== 'all' ||
      statusFilter !== 'all' ||
      accountTypeFilter !== 'all' ||
      twoFactorFilter !== 'all'
  );

  const hasAnyModifier = hasActiveFilters || sortBy !== 'newest';

  const handleResetFilters = () => {
    const needSortReload = sortBy !== 'newest';
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('all');
    setPlanFilter('all');
    setStatusFilter('all');
    setAccountTypeFilter('all');
    setTwoFactorFilter('all');
    setCurrentPage(1);
    if (needSortReload) {
      setSortBy('newest');
      void loadUsers({ sortOverride: 'newest', force: true });
    }
  };

  // ── Filter + preserve deterministic active sort order (unknown join dates at bottom) ──
  const filteredUsers = useMemo(() => {
    const matched = allUsers.filter((u) => {
      // 1. Role Filter
      if (roleFilter !== 'all') {
        const isSuper = u.email?.toLowerCase() === 'shsvirtualadmin@gmail.com';
        const isUserAdmin = isSuper || u.role === 'admin' || u.role === 'superadmin';
        if (roleFilter === 'admin' && !isUserAdmin) return false;
        if (roleFilter === 'student' && (isUserAdmin || (u.role && u.role !== 'student')))
          return false;
        if (roleFilter === 'captain' && u.role !== 'captain') return false;
        if (roleFilter === 'crew' && u.role !== 'crew') return false;
      }

      // 2. Plan & Account Type Filter
      const isGuestUser = Boolean(
        u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_')
      );
      const resolvedTier = isGuestUser ? 'free' : getPlan(u);
      if (accountTypeFilter === 'guest' && !isGuestUser) return false;
      if (accountTypeFilter === 'registered' && isGuestUser) return false;
      if (accountTypeFilter === 'pro' && resolvedTier !== 'pro') return false;
      if (accountTypeFilter === 'plus' && resolvedTier !== 'plus') return false;

      if (planFilter !== 'all') {
        if (planFilter === 'plus' && resolvedTier !== 'plus') return false;
        if (planFilter === 'pro' && resolvedTier !== 'pro') return false;
        if (planFilter === 'free' && (resolvedTier !== 'free' || isGuestUser)) return false;
        if (planFilter === 'guest' && !isGuestUser) return false;
        if (planFilter === 'registered' && isGuestUser) return false;
      }

      // 3. Status Filter
      if (statusFilter === 'active') {
        if (u.suspended || u.isSuspended) return false;
      }
      if (statusFilter === 'suspended') {
        if (!u.suspended && !u.isSuspended) return false;
      }

      // 4. Two-Step Verification (2FA) Filter
      if (twoFactorFilter !== 'all') {
        if (isGuestUser) {
          if (twoFactorFilter !== 'Off') return false;
        } else {
          const badge = resolveUser2faBadge(u);
          if (badge !== twoFactorFilter) return false;
        }
      }

      // 5. Search Filter
      if (debouncedSearch.trim()) {
        const st = debouncedSearch.toLowerCase().trim();
        const stNoHash = st.replace(/^#/, '');
        const name = getUserDisplayName(u).toLowerCase();
        const username = String(u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const uid = (u.uid || '').toLowerCase();
        const shortId = formatStudentId(u).toLowerCase();
        const uni = (u.targetUniversity || '').toLowerCase();
        if (
          !name.includes(st) &&
          !username.includes(st.replace(/^@/, '')) &&
          !email.includes(st) &&
          !uid.includes(st) &&
          !shortId.includes(stNoHash) &&
          !uni.includes(st)
        ) {
          return false;
        }
      }

      return true;
    });

    return sortAdminUsers(matched, sortBy);
  }, [
    allUsers,
    roleFilter,
    planFilter,
    statusFilter,
    accountTypeFilter,
    twoFactorFilter,
    resolveUser2faBadge,
    debouncedSearch,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const startIdx = (safePage - 1) * PAGE_SIZE;
    return filteredUsers.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredUsers, safePage]);

  const selectablePageUids = useMemo(
    () =>
      paginatedUsers
        .filter((u) => !(u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_')))
        .map((u) => u.uid),
    [paginatedUsers]
  );

  const allPageSelected =
    selectablePageUids.length > 0 && selectablePageUids.every((uid) => selectedUids.has(uid));

  const somePageSelected =
    selectablePageUids.some((uid) => selectedUids.has(uid)) && !allPageSelected;

  const handleToggleSelectAllPage = () => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const uid of selectablePageUids) next.delete(uid);
      } else {
        for (const uid of selectablePageUids) next.add(uid);
      }
      return next;
    });
  };

  const handleToggleSelectUid = useCallback((uid: string) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const handleBulkPlanAction = async (targetPlan: 'free' | 'pro' | 'plus') => {
    if (!user?.email || selectedUids.size === 0) return;
    setBulkApplying(true);
    setBackfillMessage(null);
    try {
      const targets = allUsers
        .filter((u) => selectedUids.has(u.uid))
        .map((u) => ({ uid: u.uid, email: u.email, profile: u }));
      const res = await bulkUpdateUsersPlan(user.email, targets, targetPlan, 30);
      setBackfillMessage(
        `Bulk plan update complete: ${res.updated} user(s) set to ${targetPlan.toUpperCase()}${
          res.failed > 0 ? ` (${res.failed} failed)` : ''
        }.`
      );
      setSelectedUids(new Set());
      await loadUsers({ force: true });
    } catch (err: unknown) {
      setBackfillMessage(
        'Bulk plan update failed: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setBulkApplying(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'UID',
      'Short ID',
      'Name',
      'Email',
      'Joined (PKT)',
      'Role',
      'Plan',
      'Plan Expiry',
      'Status',
    ];
    const escapeCell = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filteredUsers.map((u) => {
      const isGuestUser = Boolean(
        u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_')
      );
      const tier = isGuestUser ? 'guest' : getPlan(u);
      const expMs = parsePlanExpiryMs(
        tier === 'plus'
          ? (u as any).plusUntil ?? u.planExpiresAt ?? u.premiumExpiresAt
          : (u as any).proUntil ?? u.planExpiresAt ?? u.premiumExpiresAt
      );
      const joinedMs = resolveUserJoinedAtMs(u);
      return [
        u.uid,
        formatStudentId(u),
        getUserDisplayName(u),
        isSuperAdmin ? u.email || '' : maskEmail(u.email),
        formatPktJoinedDate(joinedMs) || 'Unknown',
        u.role || 'student',
        tier,
        expMs ? new Date(expMs).toISOString().slice(0, 10) : '',
        u.suspended || u.isSuspended ? 'suspended' : 'active',
      ]
        .map(escapeCell)
        .join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boardly-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isInitialLoading = (profileLoading || loadState === 'loading') && allUsers.length === 0;
  const isTableBusy = isInitialLoading || (loading && allUsers.length === 0);
  const effectiveTotalN = Math.max(totalDirectoryCount, allUsers.length);

  const resultSummaryText = useMemo(() => {
    if (isInitialLoading) return 'Loading users...';
    const showingCount = paginatedUsers.length;
    if (hasActiveFilters) {
      if (filteredUsers.length === 0) {
        return `Showing 0 of ${effectiveTotalN.toLocaleString()} users`;
      }
      if (totalPages > 1) {
        const start = (safePage - 1) * PAGE_SIZE + 1;
        const end = Math.min(safePage * PAGE_SIZE, filteredUsers.length);
        return `Showing ${start}–${end} of ${filteredUsers.length.toLocaleString()} matching (${effectiveTotalN.toLocaleString()} total)`;
      }
      return `Showing ${showingCount.toLocaleString()} of ${effectiveTotalN.toLocaleString()} users`;
    }
    if (totalPages > 1) {
      const start = (safePage - 1) * PAGE_SIZE + 1;
      const end = Math.min(safePage * PAGE_SIZE, filteredUsers.length);
      return `Showing ${start}–${end} of ${effectiveTotalN.toLocaleString()} users`;
    }
    return `Showing ${showingCount.toLocaleString()} of ${effectiveTotalN.toLocaleString()} users`;
  }, [
    isInitialLoading,
    paginatedUsers.length,
    hasActiveFilters,
    filteredUsers.length,
    effectiveTotalN,
    totalPages,
    safePage,
  ]);

  if (!profileLoading && !canViewUsers) {
    return (
      <div
        data-testid="admin-users-locked-state"
        className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto space-y-5"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
          <Lock size={28} />
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
            LOCKED SECTION &bull; users.view
          </div>
          <h1 className="font-dot text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
            User Directory is Locked
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            As an <strong className="text-[var(--text)]">Admin</strong>, you can manage the MCQ
            question bank and moderate community content directly. Viewing the user directory,
            student emails, IDs, plans, or roles requires{' '}
            <strong className="text-[var(--text)]">Super Admin</strong> approval.
          </p>
        </div>

        <button
          type="button"
          data-testid="request-users-view-btn"
          onClick={() => setRequestUsersViewOpen(true)}
          className="press-scale min-h-[44px] px-6 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b8141b] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-[#D71921]/25 transition-all cursor-pointer"
        >
          <Lock size={15} />
          <span>Request Access to Users</span>
        </button>

        <RequestAccessSheet
          open={requestUsersViewOpen}
          onClose={() => setRequestUsersViewOpen(false)}
          permission="users.view"
          actionLabel="View User Directory, Profiles, Emails & IDs"
        />
      </div>
    );
  }

  return (
    <div data-admin-page="users" className="flex flex-col gap-5 w-full max-w-full min-w-0">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight leading-tight">
            All Users
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Manage student registrations, roles, subscription plans, and account status.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && (
            <button
              type="button"
              data-pressable
              onClick={handleCleanupOrphans}
              disabled={cleaningOrphans}
              className="press-scale relative overflow-hidden flex items-center justify-center gap-1.5 h-9 px-3 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--red)]/45 text-[12px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
              title="Find and remove orphan database profiles with no matching active Firebase Auth user"
            >
              <Trash2 size={13} className="text-[#D71921]" />
              <span>{cleaningOrphans ? 'Cleaning...' : 'Clean Up Orphans'}</span>
              {cleaningOrphans && <ButtonLineLoader />}
            </button>
          )}

          <button
            type="button"
            data-pressable
            onClick={handleBackfillPublicProfiles}
            disabled={backfillingProfiles}
            className="press-scale relative overflow-hidden flex items-center justify-center gap-1.5 h-9 px-3 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
            title="Batch backfill student public profiles for privacy protection"
          >
            <Shield size={13} className="text-[#D71921]" />
            <span>{backfillingProfiles ? 'Syncing...' : 'Backfill public profiles'}</span>
            {backfillingProfiles && <ButtonLineLoader />}
          </button>

          <button
            type="button"
            data-pressable
            onClick={handleBackfillNames}
            disabled={backfilling}
            className="press-scale relative overflow-hidden flex items-center justify-center gap-1.5 h-9 px-3 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
            title="Update missing display names for existing accounts"
          >
            <UserCheck size={13} />
            <span>{backfilling ? 'Filling...' : 'Fill missing names'}</span>
            {backfilling && <ButtonLineLoader />}
          </button>

          <button
            type="button"
            data-pressable
            onClick={handleExportCsv}
            disabled={filteredUsers.length === 0}
            className="press-scale flex items-center gap-1.5 h-9 px-3 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
            title="Export filtered users including joined date, plan & expiry to CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            data-pressable
            onClick={() => loadUsers({ force: true })}
            disabled={loading}
            className="press-scale relative overflow-hidden flex items-center gap-1.5 h-9 px-3.5 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] font-heading font-semibold text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#D71921]' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            {loading && <ButtonLineLoader />}
          </button>
        </div>
      </div>

      <AdminDiagnosticBanner
        error={error}
        collectionName="users"
        onRetry={() => loadUsers({ force: true })}
        retrying={loading}
      />

      {backfillProfilesMessage && (
        <div className="p-3 rounded-[16px] bg-[rgba(215,25,33,0.08)] border border-[var(--red)]/40 text-[13px] font-heading text-[var(--text)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-[#D71921] shrink-0" />
            <span>{backfillProfilesMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBackfillProfilesMessage(null)}
            className="text-[var(--muted)] hover:text-[var(--text)] text-[12px] cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {backfillMessage && (
        <div className="p-3 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] flex items-center justify-between gap-3">
          <span>{backfillMessage}</span>
          <button
            type="button"
            onClick={() => setBackfillMessage(null)}
            className="text-[var(--muted)] hover:text-[var(--text)] text-[12px] cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── TAB NAVIGATION (All Users vs Name Requests) ────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
        <button
          type="button"
          data-pressable
          onClick={() => setAdminTab('users')}
          className={`press-scale flex items-center gap-2 px-4 py-2 rounded-full text-xs font-heading font-semibold transition-all cursor-pointer ${
            adminTab === 'users'
              ? 'bg-[#D71921] text-white shadow-[0_4px_14px_rgba(215,25,33,0.3)]'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
          }`}
        >
          <UsersIcon size={14} />
          <span data-testid="admin-users-tab-count">
            All Users ({isInitialLoading ? '—' : effectiveTotalN.toLocaleString()})
          </span>
        </button>

        <button
          type="button"
          data-pressable
          onClick={() => setAdminTab('nameRequests')}
          className={`press-scale flex items-center gap-2 px-4 py-2 rounded-full text-xs font-heading font-semibold transition-all cursor-pointer ${
            adminTab === 'nameRequests'
              ? 'bg-[#D71921] text-white shadow-[0_4px_14px_rgba(215,25,33,0.3)]'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
          }`}
        >
          <Tag size={14} className={adminTab === 'nameRequests' ? 'text-white' : 'text-amber-400'} />
          <span>Name Requests</span>
          {pendingNameRequestsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-bold">
              {pendingNameRequestsCount}
            </span>
          )}
        </button>
      </div>

      {adminTab === 'nameRequests' ? (
        <AdminNameRequestsSection
          adminEmail={user?.email || ''}
          onRequestCountChange={setPendingNameRequestsCount}
        />
      ) : (
        <>
          {/* ─── SEARCH, SORT & FILTER CHIPS TOOLBAR ────────────────────────── */}
          <div className="p-4 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3.5">
            {/* Search + Sort Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div
                data-users-search-wrap
                className="flex-1 flex items-center gap-2 px-3.5 h-10 rounded-full bg-[var(--card-2)] border border-[var(--border)] transition-colors min-w-0"
              >
                <Search size={15} className="text-[var(--muted)] shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, email, @handle, #ID, or track..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && search.trim().length >= 2) {
                      void handleServerSearch();
                    }
                  }}
                  className="w-full bg-transparent border-none text-[13px] font-heading text-[var(--text)] placeholder-[var(--muted)] focus:outline-none min-w-0"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch('')}
                    className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/10 cursor-pointer shrink-0"
                  >
                    <X size={13} />
                  </button>
                )}
                {hasMore && search.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={() => void handleServerSearch()}
                    disabled={searchingServer}
                    className="press-scale text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#D71921]/15 text-[#D71921] border border-[#D71921]/35 hover:bg-[#D71921]/25 whitespace-nowrap cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {searchingServer ? 'Searching...' : 'Search all'}
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div
                data-users-sort-wrap
                className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-[var(--card-2)] border border-[var(--border)] shrink-0"
              >
                <ArrowUpDown size={14} className="text-[#D71921] shrink-0" />
                <label
                  htmlFor="admin-users-sort"
                  className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] whitespace-nowrap"
                >
                  Sort
                </label>
                <select
                  id="admin-users-sort"
                  data-testid="admin-users-sort-select"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as AdminUserSortKey)}
                  className="bg-transparent text-[12px] font-heading font-semibold text-[var(--text)] focus:outline-none cursor-pointer pr-1"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#121216] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tidy Wrapped Filter Chip Groups (2-column grid on xl desktop, stacked on mobile) */}
            <div data-users-filter-groups className="grid grid-cols-1 xl:grid-cols-2 gap-y-2 gap-x-5 pt-0.5">
              {/* Role */}
              <div data-users-filter-row="role" className="flex items-start flex-wrap gap-y-1.5 gap-x-2.5">
                <span className="w-[62px] shrink-0 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] leading-[30px]">
                  Role
                </span>
                <div data-users-filter-chips className="flex items-center flex-wrap gap-1.5 flex-1 min-w-0">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'student', label: 'Students' },
                    { id: 'admin', label: 'Admins' },
                    { id: 'captain', label: 'Captains' },
                    { id: 'crew', label: 'Crew' },
                  ].map(({ id, label }) => {
                    const active = roleFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        data-pressable
                        data-active={active ? 'true' : 'false'}
                        onClick={() => setRoleFilter(id)}
                        className={`press-scale h-8 px-3 rounded-full border text-[12px] font-heading transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                          active
                            ? 'border-[#D71921] bg-[#D71921] text-white font-semibold shadow-[0_4px_12px_rgba(215,25,33,0.28)]'
                            : 'border-[var(--border)] bg-white/[0.02] text-[var(--muted)] hover:text-[var(--text)] hover:border-white/25'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account */}
              <div
                data-users-filter-row="account"
                className="flex items-start flex-wrap gap-y-2 gap-x-3"
              >
                <span className="w-[68px] shrink-0 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] leading-8">
                  Account
                </span>
                <div data-users-filter-chips className="flex items-center flex-wrap gap-1.5 flex-1 min-w-0">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'registered', label: 'Registered' },
                    { id: 'guest', label: 'Guest' },
                    { id: 'pro', label: 'Pro' },
                    { id: 'plus', label: 'Plus' },
                  ].map(({ id, label }) => {
                    const active = accountTypeFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        data-pressable
                        data-active={active ? 'true' : 'false'}
                        onClick={() =>
                          setAccountTypeFilter(
                            id as 'all' | 'guest' | 'registered' | 'pro' | 'plus'
                          )
                        }
                        className={`press-scale h-8 px-3 rounded-full border text-[12px] font-heading transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                          active
                            ? 'border-[#D71921] bg-[#D71921] text-white font-semibold shadow-[0_4px_12px_rgba(215,25,33,0.28)]'
                            : 'border-[var(--border)] bg-white/[0.02] text-[var(--muted)] hover:text-[var(--text)] hover:border-white/25'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Plan */}
              <div data-users-filter-row="plan" className="flex items-start flex-wrap gap-y-2 gap-x-3">
                <span className="w-[68px] shrink-0 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] leading-8">
                  Plan
                </span>
                <div data-users-filter-chips className="flex items-center flex-wrap gap-1.5 flex-1 min-w-0">
                  {[
                    { id: 'all', label: 'All plans' },
                    { id: 'free', label: 'Free' },
                    { id: 'pro', label: 'Pro' },
                    { id: 'plus', label: 'Plus' },
                  ].map(({ id, label }) => {
                    const active = planFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        data-pressable
                        data-active={active ? 'true' : 'false'}
                        onClick={() => setPlanFilter(id)}
                        className={`press-scale h-8 px-3 rounded-full border text-[12px] font-heading transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                          active
                            ? 'border-[#D71921] bg-[#D71921] text-white font-semibold shadow-[0_4px_12px_rgba(215,25,33,0.28)]'
                            : 'border-[var(--border)] bg-white/[0.02] text-[var(--muted)] hover:text-[var(--text)] hover:border-white/25'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div
                data-users-filter-row="status"
                className="flex items-start flex-wrap gap-y-2 gap-x-3"
              >
                <span className="w-[68px] shrink-0 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] leading-8">
                  Status
                </span>
                <div data-users-filter-chips className="flex items-center flex-wrap gap-1.5 flex-1 min-w-0">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'active', label: 'Active' },
                    { id: 'suspended', label: 'Suspended' },
                  ].map(({ id, label }) => {
                    const active = statusFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        data-pressable
                        data-active={active ? 'true' : 'false'}
                        onClick={() => setStatusFilter(id)}
                        className={`press-scale h-8 px-3 rounded-full border text-[12px] font-heading transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                          active
                            ? 'border-[#D71921] bg-[#D71921] text-white font-semibold shadow-[0_4px_12px_rgba(215,25,33,0.28)]'
                            : 'border-[var(--border)] bg-white/[0.02] text-[var(--muted)] hover:text-[var(--text)] hover:border-white/25'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2FA */}
              <div
                data-users-filter-row="2fa"
                className="flex items-start flex-wrap gap-y-1.5 gap-x-2.5 xl:col-span-2"
              >
                <span className="w-[62px] shrink-0 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] leading-[30px]">
                  2FA
                </span>
                <div data-users-filter-chips className="flex items-center flex-wrap gap-1.5 flex-1 min-w-0">
                  {(
                    [
                      ['all', 'All'],
                      ['Off', 'Off'],
                      ['Authenticator', 'Authenticator'],
                      ['Email code', 'Email code'],
                      ['Both', 'Both'],
                      ['Recovery pending', 'Recovery pending'],
                    ] as const
                  ).map(([id, label]) => {
                    const active = twoFactorFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        data-pressable
                        data-active={active ? 'true' : 'false'}
                        onClick={() => setTwoFactorFilter(id)}
                        className={`press-scale h-8 px-3 rounded-full border text-[12px] font-heading transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                          active
                            ? 'border-[#D71921] bg-[#D71921] text-white font-semibold shadow-[0_4px_12px_rgba(215,25,33,0.28)]'
                            : 'border-[var(--border)] bg-white/[0.02] text-[var(--muted)] hover:text-[var(--text)] hover:border-white/25'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Result Count & Reset Filters Footer */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-[var(--border)]/70">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  data-testid="users-result-count"
                  className="font-mono text-[12px] text-[var(--text)] font-medium tabular-nums"
                >
                  {resultSummaryText}
                </span>
                {loading && !isInitialLoading && (
                  <span className="text-[11px] font-mono text-[#D71921] animate-pulse">
                    Updating…
                  </span>
                )}
              </div>

              <button
                type="button"
                data-pressable
                data-testid="users-reset-filters-btn"
                disabled={!hasAnyModifier}
                onClick={handleResetFilters}
                className={`press-scale inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-heading font-medium border transition-all ${
                  hasAnyModifier
                    ? 'border-[#D71921]/50 bg-[#D71921]/10 text-[var(--text)] hover:bg-[#D71921]/20 cursor-pointer'
                    : 'border-[var(--border)] text-[var(--text-faint)] opacity-50 cursor-not-allowed'
                }`}
              >
                <RotateCcw size={12} />
                <span>Reset filters</span>
              </button>
            </div>
          </div>

          {/* ─── BULK ACTIONS BAR (appears when checkboxes selected) ────────── */}
          {selectedUids.size > 0 && isSuperAdmin && (
            <div
              data-testid="users-bulk-actions-bar"
              className="p-3.5 rounded-[20px] bg-[var(--card)] border border-[#D71921]/45 shadow-[0_8px_28px_rgba(215,25,33,0.12)] flex items-center justify-between flex-wrap gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[#D71921] text-white font-mono text-[11px] font-bold">
                  {selectedUids.size}
                </span>
                <span className="text-xs font-heading font-semibold text-[var(--text)]">
                  user{selectedUids.size === 1 ? '' : 's'} selected
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  data-pressable
                  disabled={bulkApplying}
                  onClick={() => void handleBulkPlanAction('pro')}
                  className="press-scale h-8 px-3.5 rounded-full bg-[#D71921] hover:bg-[#b8141b] text-white text-xs font-heading font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Grant Pro (30d)
                </button>
                <button
                  type="button"
                  data-pressable
                  disabled={bulkApplying}
                  onClick={() => void handleBulkPlanAction('plus')}
                  className="press-scale h-8 px-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-heading font-semibold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <Sparkles size={12} />
                  <span>Grant Plus (30d)</span>
                </button>
                <button
                  type="button"
                  data-pressable
                  disabled={bulkApplying}
                  onClick={() => void handleBulkPlanAction('free')}
                  className="press-scale h-8 px-3.5 rounded-full border border-[var(--border)] bg-white/[0.03] text-xs font-heading font-semibold text-[var(--text)] hover:border-white/40 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Revoke to Free
                </button>
                <button
                  type="button"
                  data-pressable
                  disabled={bulkApplying}
                  onClick={() => setSelectedUids(new Set())}
                  className="press-scale h-8 px-2.5 text-xs font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ─── MOBILE CARDS (< 768px) ─────────────────────────────────────── */}
          <div className="block md:hidden space-y-3" data-testid="admin-users-mobile-list">
            {isTableBusy ? (
              <div className="space-y-3">
                <LineLoader context="admin" message="Loading registered users..." />
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-[22px] bg-[var(--card)] border border-[var(--border)] animate-pulse flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)]" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-[var(--surface-hover)]" />
                          <div className="h-3 w-24 rounded bg-[var(--surface-hover)]" />
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[var(--border)]/60">
                      <div className="space-y-1.5">
                        <div className="h-3 w-28 rounded bg-[var(--surface-hover)]" />
                        <div className="h-2.5 w-16 rounded bg-[var(--surface-hover)]" />
                      </div>
                      <div className="space-y-1.5 flex flex-col items-end">
                        <div className="h-3 w-24 rounded bg-[var(--surface-hover)]" />
                        <div className="h-2.5 w-20 rounded bg-[var(--surface-hover)]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : loadState === 'error' && allUsers.length === 0 ? (
              <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center space-y-3">
                <p className="font-heading text-[14px] text-[var(--muted)]">
                  Could not load users right now. Please use the Retry button above.
                </p>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
                  <UsersIcon size={20} />
                </div>
                <div className="space-y-1">
                  <p className="font-heading font-semibold text-[14px] text-[var(--text)]">
                    No users match your current filters
                  </p>
                  <p className="font-heading text-[12px] text-[var(--muted)]">
                    Try adjusting or clearing your filters{hasMore ? `, or load the next ${PAGE_SIZE} users` : ''}.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
                  {hasAnyModifier && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="press-scale h-9 px-4 rounded-full bg-[#D71921] text-white text-[12px] font-heading font-semibold cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => void handleLoadMore()}
                      disabled={loadingMore}
                      className="press-scale h-9 px-4 rounded-full border border-[var(--border)] text-[12px] font-heading text-[var(--text)] cursor-pointer disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : `Load next ${PAGE_SIZE}`}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              paginatedUsers.map((u) => {
                const isGuestUser = Boolean(
                  u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_')
                );
                const badge2fa = isGuestUser ? 'Off' : resolveUser2faBadge(u);
                return (
                  <AdminUserMobileCard
                    key={u.uid}
                    user={u}
                    badge2fa={badge2fa}
                    isSuperAdmin={isSuperAdmin}
                    isChecked={selectedUids.has(u.uid)}
                    nowMs={nowMs}
                    onToggleCheck={isSuperAdmin ? handleToggleSelectUid : undefined}
                    onSelect={handleSelectUser}
                    onOpenMenu={handleOpenMenu}
                  />
                );
              })
            )}
          </div>

          {/* ─── DESKTOP TABLE (>= 768px) — STICKY HEADER, INNER SCROLL ONLY ── */}
          <div className="hidden md:block rounded-[24px] bg-[var(--card)] border border-[var(--border)] overflow-hidden w-full min-w-0">
            <div
              data-testid="admin-users-table-scroll"
              className="w-full overflow-x-auto max-h-[68vh] overflow-y-auto relative"
            >
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[var(--card-2)]/95 backdrop-blur-md border-b border-[var(--border)]">
                  <tr className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    <th className="w-[40px] pl-3.5 pr-1.5 py-3 text-center font-medium">
                      {isSuperAdmin && selectablePageUids.length > 0 ? (
                        <AdminCheckbox
                          checked={allPageSelected}
                          indeterminate={somePageSelected}
                          ariaLabel="Select all users on this page"
                          onChange={handleToggleSelectAllPage}
                        />
                      ) : (
                        <span className="sr-only">Select</span>
                      )}
                    </th>
                    <th className="py-3 px-2.5 font-medium whitespace-nowrap">Student</th>
                    <th className="py-3 px-2.5 font-medium whitespace-nowrap">Short ID</th>
                    <th className="py-3 px-2.5 font-medium whitespace-nowrap">Email / Handle</th>
                    <th className="py-3 px-2.5 font-medium whitespace-nowrap">Joined</th>
                    <th className="py-3 px-2.5 font-medium whitespace-nowrap">University Track</th>
                    <th className="py-3 px-2.5 font-medium whitespace-nowrap">Solved</th>
                    <th className="py-3 px-2.5 font-medium whitespace-nowrap">Streak</th>
                    <th className="py-3 px-2.5 font-medium whitespace-nowrap">Status</th>
                    <th className="w-[50px] py-3 pl-1 pr-3.5 text-right font-medium whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/80 text-[13px] font-heading">
                  {isTableBusy ? (
                    <>
                      <tr>
                        <td colSpan={10} className="py-3 px-5">
                          <LineLoader context="admin" message="Loading registered users..." />
                        </td>
                      </tr>
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <tr key={idx} className="h-[68px] animate-pulse">
                          <td className="pl-4 pr-2 py-3 align-middle text-center">
                            <div className="w-4 h-4 mx-auto rounded bg-[var(--surface-hover)]" />
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)] shrink-0" />
                              <div className="space-y-1.5">
                                <div className="h-3.5 w-28 rounded bg-[var(--surface-hover)]" />
                                <div className="h-2.5 w-16 rounded bg-[var(--surface-hover)]" />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="h-3.5 w-16 rounded bg-[var(--surface-hover)]" />
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="h-3.5 w-36 rounded bg-[var(--surface-hover)]" />
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-32 rounded bg-[var(--surface-hover)]" />
                              <div className="h-2.5 w-16 rounded bg-[var(--surface-hover)]" />
                            </div>
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="h-3.5 w-24 rounded bg-[var(--surface-hover)]" />
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="h-3.5 w-16 rounded bg-[var(--surface-hover)]" />
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="h-3.5 w-10 rounded bg-[var(--surface-hover)]" />
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="h-5 w-20 rounded-full bg-[var(--surface-hover)]" />
                          </td>
                          <td className="py-3 pl-2 pr-4 align-middle text-right">
                            <div className="w-7 h-7 ml-auto rounded-full bg-[var(--surface-hover)]" />
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : loadState === 'error' && allUsers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-14 px-5 text-center text-[var(--muted)]">
                        Could not load users right now. Please use the Retry button above.
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-14 px-5 text-center">
                        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
                            <UsersIcon size={20} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-heading font-semibold text-[14px] text-[var(--text)]">
                              No users match your current filters
                            </p>
                            <p className="font-heading text-[12px] text-[var(--muted)]">
                              Adjust or reset your filters to view the directory
                              {hasMore ? `, or load the next ${PAGE_SIZE} users from the database` : ''}.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            {hasAnyModifier && (
                              <button
                                type="button"
                                onClick={handleResetFilters}
                                className="press-scale h-9 px-4 rounded-full bg-[#D71921] text-white text-[12px] font-heading font-semibold cursor-pointer"
                              >
                                Reset filters
                              </button>
                            )}
                            {hasMore && (
                              <button
                                type="button"
                                onClick={() => void handleLoadMore()}
                                disabled={loadingMore}
                                className="press-scale h-9 px-4 rounded-full border border-[var(--border)] text-[12px] font-heading text-[var(--text)] hover:border-white/35 cursor-pointer disabled:opacity-50"
                              >
                                {loadingMore ? 'Loading...' : `Load next ${PAGE_SIZE} users`}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const isGuestUser = Boolean(
                        u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_')
                      );
                      const badge2fa = isGuestUser ? 'Off' : resolveUser2faBadge(u);
                      return (
                        <AdminUserTableRow
                          key={u.uid}
                          user={u}
                          badge2fa={badge2fa}
                          isSuperAdmin={isSuperAdmin}
                          isChecked={selectedUids.has(u.uid)}
                          nowMs={nowMs}
                          onToggleCheck={isSuperAdmin ? handleToggleSelectUid : undefined}
                          onSelect={handleSelectUser}
                          onOpenMenu={handleOpenMenu}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── PAGINATION & LOAD MORE FOOTER (20 PER PAGE) ────────────────── */}
          {!isTableBusy && (filteredUsers.length > 0 || hasMore) && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-1 pt-1 pb-4 text-xs font-mono text-[var(--muted)]">
              <span>
                {resultSummaryText} &middot; {PAGE_SIZE} per page
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {totalPages > 1 && (
                  <>
                    <button
                      type="button"
                      data-pressable
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="press-scale inline-flex items-center gap-1 h-9 px-3 rounded-[12px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </button>
                    <span className="px-2 text-[var(--text)]">
                      Page {safePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      data-pressable
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="press-scale inline-flex items-center gap-1 h-9 px-3 rounded-[12px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] disabled:opacity-40 cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}

                {hasMore && (
                  <button
                    type="button"
                    data-pressable
                    data-testid="users-load-more-btn"
                    onClick={() => void handleLoadMore()}
                    disabled={loadingMore}
                    className="press-scale relative overflow-hidden inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[12px] border border-[#D71921]/45 bg-[#D71921]/10 hover:bg-[#D71921]/20 text-[12px] font-heading font-semibold text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer min-w-[140px]"
                  >
                    <span>
                      {loadingMore ? `Loading next ${PAGE_SIZE}...` : `Load more (${PAGE_SIZE})`}
                    </span>
                    {loadingMore && <ButtonLineLoader />}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── PORTALED ACTIONS DROPDOWN MENU (⋯) ─────────────────────────────── */}
      <UserActionsMenu
        menuState={menuState}
        onClose={handleCloseMenu}
        onSelect={handleSelectUser}
        copiedUid={copiedUid}
        onCopyId={handleCopyId}
      />

      {/* ─── USER OVERRIDE DRAWER (Side Drawer on Desktop / Bottom Sheet on Mobile) ─── */}
      {selectedUser && (
        <UserOverrideDrawer
          user={selectedUser}
          adminEmail={user?.email || ''}
          initialSection={selectedUserSection}
          initialTwoFactorStatus={user2faMap[selectedUser.uid] || selectedUser.twoFactorStatus}
          onUpdate2faStatus={handleUpdateUser2faInState}
          onUserUpdated={(updatedUser) => {
            setAllUsers((prev) =>
              prev.map((u) => (u.uid === updatedUser.uid ? { ...u, ...updatedUser } : u))
            );
            setSelectedUser((prev) =>
              prev && prev.uid === updatedUser.uid ? { ...prev, ...updatedUser } : prev
            );
          }}
          onClose={() => {
            setSelectedUser(null);
            setSelectedUserSection('top');
          }}
          onSuccess={() => {
            void loadUsers({ force: true });
          }}
        />
      )}
    </div>
  );
}

export default AdminUsersPage;
