import { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
} from '@/services/adminService';
import { backfillAllPublicProfiles } from '@/services/publicProfileService';
import { formatStudentId } from '@/utils/shortId';
import { maskEmail } from '@/utils/privacy';
import type { UserProfile, UserTwoFactorBadgeLabel, UserTwoFactorSummary } from '@/types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { getPlan, parsePlanExpiryMs } from '@/lib/planTier';

const PAGE_SIZE = 50;

type LoadState = 'loading' | 'loaded' | 'error';

type TwoFactorFilterValue =
  | 'all'
  | 'Off'
  | 'Authenticator'
  | 'Email code'
  | 'Both'
  | 'Recovery pending';

interface UserRowProps {
  user: UserProfile;
  badge2fa: UserTwoFactorBadgeLabel;
  isSuperAdmin: boolean;
  isChecked?: boolean;
  onToggleCheck?: (uid: string) => void;
  onSelect: (user: UserProfile, section?: UserOverrideSection) => void;
}

function formatUserTimestamp(raw: any, fallback: string | null = 'Recent'): string | null {
  if (!raw) return fallback;
  if (typeof raw?.toDate === 'function') {
    return raw.toDate().toLocaleDateString('en-GB');
  }
  if (typeof raw?.seconds === 'number') {
    return new Date(raw.seconds * 1000).toLocaleDateString('en-GB');
  }
  if (typeof raw === 'number') {
    return new Date(raw).toLocaleDateString('en-GB');
  }
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toLocaleDateString('en-GB');
    }
  }
  return fallback;
}

const AdminUserMobileCard = memo(function AdminUserMobileCard({
  user: u,
  badge2fa,
  isSuperAdmin,
  onSelect,
}: UserRowProps) {
  const name = getUserDisplayName(u);
  const isSuspended = !!(u.suspended || u.isSuspended);
  const isGuestUser = Boolean(u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_'));
  const resolvedTier = isGuestUser ? 'free' : getPlan(u);
  const isPaidUser = resolvedTier === 'pro' || resolvedTier === 'plus';
  const rawBadgeDesign = (u as any).proBadgeDesign || (u as any).proBadge || 'ember';
  const badgeDesign = resolvedTier === 'plus' ? `plus:${rawBadgeDesign}` : rawBadgeDesign;
  const studentId = formatStudentId(u);
  const qSolved = typeof u.totalQuestionsSolved === 'number' ? u.totalQuestionsSolved : null;
  const joinedDate = formatUserTimestamp(u.createdAt, 'Recent') || 'Recent';
  const lastActiveDate = formatUserTimestamp(u.lastActiveAt, null);

  return (
    <div
      onClick={() => onSelect(u)}
      data-testid={`admin-user-card-${u.uid}`}
      className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--text)]/40 transition-colors cursor-pointer flex flex-col gap-3.5"
    >
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <BoardlyAvatar
            uid={u.uid}
            equippedAvatar={u.equipped?.avatar || u.avatar}
            name={name}
            size={40}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-heading font-semibold text-[14px] text-[var(--text)] truncate">
                {name}
              </p>
              {isGuestUser && (
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  Guest
                </span>
              )}
              <span className="font-mono text-[11px] font-bold text-[var(--accent)] px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)]">
                {studentId}
              </span>
            </div>
            <p className="font-heading text-[12px] text-[var(--text-muted)] truncate">
              {isGuestUser
                ? u.username
                  ? `@${String(u.username).replace(/^@/, '')}`
                  : 'Guest'
                : isSuperAdmin
                ? u.email
                : maskEmail(u.email)}
            </p>
          </div>
        </div>

        <div
          className="text-right shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(u, 'attempts');
          }}
        >
          <span className="font-mono font-bold text-xs text-[var(--text)] block">
            {qSolved !== null ? `${qSolved.toLocaleString()} MCQs` : '— MCQs'}
          </span>
          <span className="text-[10px] text-[var(--text-faint)] font-mono">
            🔥 {u.streak || 0}d streak
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[var(--border)]/60 text-xs">
        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] flex-wrap">
          <span className="font-medium text-[var(--text)] truncate max-w-[140px]">
            {u.targetUniversity || 'General Prep'}
          </span>
          <span>·</span>
          <span className="font-mono text-[var(--text-faint)]">Joined {joinedDate}</span>
          {lastActiveDate && (
            <>
              <span>·</span>
              <span className="font-mono text-[var(--text-faint)]">Active {lastActiveDate}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {isSuspended && (
            <span className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              Suspended
            </span>
          )}
          {isGuestUser ? (
            <span className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
              Guest
            </span>
          ) : (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(u, 'role');
                }}
                className="text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] capitalize hover:border-[var(--text)]"
              >
                {u.role || 'Student'}
              </span>
              {isPaidUser ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(u, 'plan');
                  }}
                  className="inline-flex items-center gap-1"
                >
                  <ProBadge design={badgeDesign} size="sm" listMode />
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {resolvedTier === 'plus' ? 'Plus' : 'Pro'}
                    {(u as any).proBadgeVisible === false ? ' (hidden)' : ''}
                  </span>
                </span>
              ) : (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(u, 'plan');
                  }}
                  className="text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--text)]"
                >
                  Free
                </span>
              )}
              <span
                data-testid={`user-2fa-badge-${u.uid}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(u, 'security');
                }}
                className={`text-[10px] font-heading px-2 py-0.5 rounded-full border ${
                  badge2fa === 'Recovery pending'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold'
                    : badge2fa !== 'Off'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                2FA: {badge2fa}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const AdminUserTableRow = memo(function AdminUserTableRow({
  user: u,
  badge2fa,
  isSuperAdmin,
  isChecked = false,
  onToggleCheck,
  onSelect,
}: UserRowProps) {
  const name = getUserDisplayName(u);
  const isGuestUser = Boolean(u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_'));
  const resolvedTier = isGuestUser ? 'free' : getPlan(u);
  const isPaidUser = resolvedTier === 'pro' || resolvedTier === 'plus';
  const rawBadgeId = (u as any).proBadgeDesign || (u as any).proBadge || (isPaidUser ? 'ember' : null);
  const badgeId =
    resolvedTier === 'plus' ? `plus:${rawBadgeId || 'ember'}` : rawBadgeId;
  const studentId = formatStudentId(u);
  const qSolved = typeof u.totalQuestionsSolved === 'number' ? u.totalQuestionsSolved : null;
  const joinedDate = formatUserTimestamp(u.createdAt, 'Recent') || 'Recent';
  const lastActiveDate = formatUserTimestamp(u.lastActiveAt, null);

  return (
    <tr
      onClick={() => onSelect(u)}
      data-testid={`admin-user-row-${u.uid}`}
      className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
    >
      {/* 1. Student Name */}
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-2.5">
          {!isGuestUser && onToggleCheck && (
            <input
              type="checkbox"
              checked={isChecked}
              aria-label={`Select ${name}`}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleCheck(u.uid)}
              className="w-3.5 h-3.5 accent-[#D71921] cursor-pointer shrink-0"
            />
          )}
          <BoardlyAvatar
            uid={u.uid}
            equippedAvatar={u.equipped?.avatar || u.avatar}
            name={name}
            size={32}
            className="shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-semibold text-[13px] text-[var(--text)] truncate max-w-[140px]">
                {name}
              </span>
              {isPaidUser && (
                <ProBadge design={badgeId || 'ember'} size="sm" listMode />
              )}
              {isGuestUser && (
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                  Guest
                </span>
              )}
            </div>
            {isPaidUser && (
              <span className="text-[10px] font-mono text-[var(--muted)] block leading-tight mt-0.5">
                {resolvedTier === 'plus' ? 'Boardly Plus' : 'Boardly Pro'}
                {(u as any).proBadgeVisible === false ? ' (badge hidden)' : ''}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 2. Short Student ID */}
      <td className="py-3.5 px-4 font-mono font-bold text-[#D71921] text-xs">
        {studentId}
      </td>

      {/* 3. Email / Username */}
      <td className="py-3.5 px-4 text-[12px] text-[var(--text-muted)]">
        {isGuestUser
          ? u.username
            ? `@${String(u.username).replace(/^@/, '')}`
            : 'Guest'
          : isSuperAdmin
          ? u.email
          : maskEmail(u.email)}
      </td>

      {/* 4. University Track */}
      <td className="py-3.5 px-4 text-[12px] text-[var(--text)]">
        {u.targetUniversity || 'General Prep'}
      </td>

      {/* 5. Total Questions Solved */}
      <td
        className="py-3.5 px-4 font-mono font-bold text-[13px] text-[var(--text)]"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(u, 'attempts');
        }}
      >
        {qSolved !== null ? `${qSolved.toLocaleString()} MCQs` : '—'}
      </td>

      {/* 6. Streak */}
      <td className="py-3.5 px-4 font-mono text-[12px] text-[var(--text)]">
        🔥 {u.streak || 0}d
      </td>

      {/* 6b. 2FA Status Badge (Off, Authenticator, Email code, Both, or Recovery pending) */}
      <td
        className="py-3.5 px-4 text-[12px]"
        onClick={(e) => {
          if (!isGuestUser) {
            e.stopPropagation();
            onSelect(u, 'security');
          }
        }}
      >
        {isGuestUser ? (
          <span className="text-[11px] text-[var(--text-faint)]">—</span>
        ) : (
          <span
            data-testid={`user-2fa-badge-desktop-${u.uid}`}
            className={`text-[11px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${
              badge2fa === 'Recovery pending'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold'
                : badge2fa !== 'Off'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            {badge2fa}
          </span>
        )}
      </td>

      {/* 7. Created & Last Active Date */}
      <td className="py-3.5 px-4 text-[12px] font-mono text-[var(--text-faint)]">
        <div>{joinedDate}</div>
        {lastActiveDate && (
          <div className="text-[10px] text-[var(--muted)]">Active {lastActiveDate}</div>
        )}
      </td>

      {/* 8. Action */}
      <td className="py-3.5 px-5 text-right">
        <span className="text-[12px] text-[var(--text)] hover:underline">
          Edit
        </span>
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
  const [user2faMap, setUser2faMap] = useState<Record<string, UserTwoFactorSummary>>(
    () => (canViewUsers ? initialCache?.user2faMap ?? {} : {})
  );
  const [loadState, setLoadState] = useState<LoadState>(() =>
    initialCache ? 'loaded' : 'loading'
  );
  const [loading, setLoading] = useState<boolean>(() => !initialCache && canViewUsers);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    () => (canViewUsers ? initialCache?.lastDoc ?? null : null)
  );
  const [hasMore, setHasMore] = useState<boolean>(() =>
    canViewUsers ? initialCache?.hasMore ?? false : false
  );
  const [error, setError] = useState<AdminDiagnosticError | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filters
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, planFilter, statusFilter, accountTypeFilter, twoFactorFilter]);

  // Selected user for drawer/sheet
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserSection, setSelectedUserSection] = useState<UserOverrideSection>('top');

  const handleSelectUser = useCallback((u: UserProfile, section: UserOverrideSection = 'top') => {
    setSelectedUserSection(section);
    setSelectedUser(u);
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
        'Failed to backfill public profiles: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setBackfillingProfiles(false);
    }
  };

  const loadUsers = useCallback(
    async (options?: { force?: boolean }) => {
      if (!user || !isAdmin || !canViewUsers) return;
      const currentCached = getCachedAdminUsersState();
      if (!currentCached) {
        setLoading(true);
        setLoadState('loading');
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await fetchUsersPaginated({
          limitCount: PAGE_SIZE,
          force: options?.force,
        });
        const latestCache = getCachedAdminUsersState();
        const directoryList = latestCache?.allDirectoryUsers ?? res.users;
        setAllUsers(directoryList);
        setUser2faMap((prev) => ({ ...prev, ...res.user2faMap }));
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
        setLoadState('loaded');
      } catch (err: unknown) {
        console.error('[AdminUsersPage] Failed to load users:', err);
        const e = err as Partial<AdminDiagnosticError>;
        setError({
          code: e?.code || 'USERS_FETCH_FAILED',
          message:
            e?.message || 'Failed to load users from database. Please verify Firestore permissions.',
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
    [user, isAdmin, canViewUsers]
  );

  // Wait for auth and admin-role check before firing fetch
  useEffect(() => {
    if (!profileLoading && user && isAdmin && canViewUsers) {
      const cached = getCachedAdminUsersState();
      if (cached) {
        setAllUsers(cached.allDirectoryUsers);
        setUser2faMap(cached.user2faMap);
        setLastDoc(cached.lastDoc);
        setHasMore(cached.hasMore);
        setLoadState('loaded');
        setLoading(false);
        // If cache is older than 30 seconds, refresh quietly in the background ONLY if user sheet is closed
        if (Date.now() - cached.loadedAt > 30_000 && !selectedUser) {
          void loadUsers();
        }
      } else {
        void loadUsers();
      }
    } else if (!canViewUsers) {
      setAllUsers([]);
      setUser2faMap({});
      setLoading(false);
    }
  }, [profileLoading, user, isAdmin, canViewUsers, loadUsers, selectedUser]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchUsersPaginated({
        limitCount: PAGE_SIZE,
        role: roleFilter,
        plan: planFilter,
        startAfterDoc: lastDoc,
      });
      setAllUsers((prev) => {
        const existingUids = new Set(prev.map((u) => u.uid));
        const added = res.users.filter((u) => !existingUids.has(u.uid));
        return [...prev, ...added];
      });
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
    setSelectedUser((prev) => (prev && prev.uid === uid ? { ...prev, twoFactorStatus: status } : prev));
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

  // ── Client-side filtering in memory across all dimensions ──────────────────
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      // 1. Role Filter
      if (roleFilter !== 'all') {
        const isSuper = u.email?.toLowerCase() === 'shsvirtualadmin@gmail.com';
        const isUserAdmin = isSuper || u.role === 'admin' || u.role === 'superadmin';
        if (roleFilter === 'admin' && !isUserAdmin) return false;
        if (roleFilter === 'student' && (isUserAdmin || (u.role && u.role !== 'student'))) return false;
        if (roleFilter === 'captain' && u.role !== 'captain') return false;
        if (roleFilter === 'crew' && u.role !== 'crew') return false;
      }

      // 2. Plan & Account Type Filter (Guest / Registered / Pro / Plus)
      const isGuestUser = Boolean(u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_'));
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
        const name = getUserDisplayName(u).toLowerCase();
        const username = String(u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const uid = (u.uid || '').toLowerCase();
        const uni = (u.targetUniversity || '').toLowerCase();
        if (
          !name.includes(st) &&
          !username.includes(st) &&
          !email.includes(st) &&
          !uid.includes(st) &&
          !uni.includes(st)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    allUsers,
    roleFilter,
    planFilter,
    statusFilter,
    accountTypeFilter,
    twoFactorFilter,
    resolveUser2faBadge,
    debouncedSearch,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const startIdx = (safePage - 1) * PAGE_SIZE;
    return filteredUsers.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredUsers, safePage]);

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
    const headers = ['UID', 'Short ID', 'Name', 'Email', 'Role', 'Plan', 'Plan Expiry', 'Status'];
    const escapeCell = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filteredUsers.map((u) => {
      const isGuestUser = Boolean(u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_'));
      const tier = isGuestUser ? 'guest' : getPlan(u);
      const expMs = parsePlanExpiryMs(
        tier === 'plus'
          ? (u as any).plusUntil ?? u.planExpiresAt ?? u.premiumExpiresAt
          : (u as any).proUntil ?? u.planExpiresAt ?? u.premiumExpiresAt
      );
      return [
        u.uid,
        formatStudentId(u),
        getUserDisplayName(u),
        isSuperAdmin ? u.email || '' : maskEmail(u.email),
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
            student emails, IDs, plans, or roles requires <strong className="text-[var(--text)]">Super Admin</strong> approval.
          </p>
        </div>

        <button
          type="button"
          data-testid="request-users-view-btn"
          onClick={() => setRequestUsersViewOpen(true)}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b8141b] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-[#D71921]/25 transition-all cursor-pointer"
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
    <div data-admin-page="users" className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Users
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Manage student registrations, roles, subscription plans, and account status.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleCleanupOrphans}
              disabled={cleaningOrphans}
              className="relative overflow-hidden flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--red)]/50 text-[12px] sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer min-w-[180px]"
              title="Find and remove orphan database profiles with no matching active Firebase Auth user"
            >
              <Trash2 size={14} className="text-[#D71921]" />
              <span>{cleaningOrphans ? 'Cleaning orphan profiles...' : 'Clean Up Orphan Profiles'}</span>
              {cleaningOrphans && <ButtonLineLoader />}
            </button>
          )}

          <button
            type="button"
            onClick={handleBackfillPublicProfiles}
            disabled={backfillingProfiles}
            className="relative overflow-hidden flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer min-w-[170px]"
            title="Batch backfill student public profiles for privacy protection"
          >
            <Shield size={14} className="text-[#D71921]" />
            <span>{backfillingProfiles ? 'Syncing profiles...' : 'Backfill public profiles'}</span>
            {backfillingProfiles && <ButtonLineLoader />}
          </button>

          <button
            type="button"
            onClick={handleBackfillNames}
            disabled={backfilling}
            className="relative overflow-hidden flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 min-w-[150px]"
            title="Update missing display names for existing accounts"
          >
            <UserCheck size={14} />
            <span>{backfilling ? 'Filling names...' : 'Fill missing names'}</span>
            {backfilling && <ButtonLineLoader />}
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
            title="Export filtered users including plan & expiry to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => loadUsers({ force: true })}
            disabled={loading}
            className="relative overflow-hidden flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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
        <div className="p-3 rounded-[16px] bg-[rgba(215,25,33,0.08)] border border-[var(--red)]/40 text-[13px] font-heading text-[var(--text)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-[#D71921] shrink-0" />
            <span>{backfillProfilesMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBackfillProfilesMessage(null)}
            className="text-[var(--muted)] hover:text-[var(--text)] text-[12px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {backfillMessage && (
        <div className="p-3 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] flex items-center justify-between">
          <span>{backfillMessage}</span>
          <button
            type="button"
            onClick={() => setBackfillMessage(null)}
            className="text-[var(--muted)] hover:text-[var(--text)] text-[12px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── TAB NAVIGATION (Users Directory vs Name Requests) ─── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer ${
            adminTab === 'users'
              ? 'bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <UsersIcon size={14} className={adminTab === 'users' ? 'text-[var(--red)]' : ''} />
          <span data-testid="admin-users-tab-count">
            All Users ({isInitialLoading ? '—' : allUsers.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('nameRequests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer ${
            adminTab === 'nameRequests'
              ? 'bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <Tag size={14} className={adminTab === 'nameRequests' ? 'text-amber-400' : ''} />
          <span>Name Requests</span>
          {pendingNameRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-mono font-bold">
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
          {/* ─── SEARCH & FILTER CHIPS TOOLBAR ──────────────────────────────────── */}
          <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3.5">
            {/* Search input */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)]">
              <Search size={16} className="text-[var(--muted)] shrink-0" />
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-[13px] font-heading text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
              />
            </div>

            {/* Filter chips */}
            <div data-users-filter-groups className="flex flex-col gap-2 pt-1">
              {/* Role Filter Chips */}
              <div data-users-filter-row="role" className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
                  Role:
                </span>
                <div data-users-filter-chips className="contents">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'student', label: 'Students' },
                    { id: 'admin', label: 'Admins' },
                    { id: 'captain', label: 'Captains' },
                    { id: 'crew', label: 'Crew' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRoleFilter(id)}
                      className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                        roleFilter === id
                          ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                          : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Type, Plan & Status Filter Chips */}
              <div data-users-filter-compound className="flex items-center gap-1.5 flex-wrap">
                <div data-users-filter-row="account" className="contents">
                  <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
                    Account:
                  </span>
                  <div data-users-filter-chips className="contents">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'registered', label: 'Registered' },
                      { id: 'guest', label: 'Guest' },
                      { id: 'pro', label: 'Pro' },
                      { id: 'plus', label: 'Plus' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setAccountTypeFilter(id as 'all' | 'guest' | 'registered' | 'pro' | 'plus')
                        }
                        className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                          accountTypeFilter === id
                            ? id === 'plus'
                              ? 'border-amber-500 bg-amber-500 text-black font-semibold'
                              : 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                            : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div data-users-filter-row="plan" className="contents">
                  <span className="text-[11px] font-heading text-[var(--muted)] mx-1 shrink-0">
                    Plan:
                  </span>
                  <div data-users-filter-chips className="contents">
                    {[
                      { id: 'all', label: 'All plans' },
                      { id: 'free', label: 'Free' },
                      { id: 'pro', label: 'Pro' },
                      { id: 'plus', label: 'Plus' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPlanFilter(id)}
                        className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                          planFilter === id
                            ? id === 'plus'
                              ? 'border-amber-500 bg-amber-500 text-black font-semibold'
                              : 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                            : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div data-users-filter-row="status" className="contents">
                  <span className="text-[11px] font-heading text-[var(--muted)] mx-1 shrink-0">
                    Status:
                  </span>
                  <div data-users-filter-chips className="contents">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Active' },
                      { id: 'suspended', label: 'Suspended' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setStatusFilter(id)}
                        className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                          statusFilter === id
                            ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                            : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2FA Filter */}
              <div data-users-filter-row="2fa" className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] mr-1">
                  2FA:
                </span>
                <div data-users-filter-chips className="contents">
                  {(
                    [
                      ['all', 'All'],
                      ['Off', 'Off'],
                      ['Authenticator', 'Authenticator'],
                      ['Email code', 'Email code'],
                      ['Both', 'Both'],
                      ['Recovery pending', 'Recovery pending'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTwoFactorFilter(id)}
                      className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                        twoFactorFilter === id
                          ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                          : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {selectedUids.size > 0 && isSuperAdmin && (
            <div className="p-3.5 rounded-[20px] bg-[var(--card)] border border-amber-500/40 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-mono font-bold text-[var(--text)]">
                {selectedUids.size} user{selectedUids.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={bulkApplying}
                  onClick={() => void handleBulkPlanAction('pro')}
                  className="px-3 py-1.5 rounded-full bg-[#D71921] text-white text-xs font-heading font-semibold disabled:opacity-50 cursor-pointer"
                >
                  Grant Pro (30d)
                </button>
                <button
                  type="button"
                  disabled={bulkApplying}
                  onClick={() => void handleBulkPlanAction('plus')}
                  className="px-3 py-1.5 rounded-full bg-amber-500 text-black text-xs font-heading font-semibold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>Grant Plus (30d)</span>
                </button>
                <button
                  type="button"
                  disabled={bulkApplying}
                  onClick={() => void handleBulkPlanAction('free')}
                  className="px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] hover:border-[var(--text)] disabled:opacity-50 cursor-pointer"
                >
                  Revoke to Free
                </button>
                <button
                  type="button"
                  disabled={bulkApplying}
                  onClick={() => setSelectedUids(new Set())}
                  className="px-2.5 py-1.5 text-xs font-heading text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ─── USERS LIST: MOBILE CARDS (block md:hidden) ─────────────────────── */}
          <div className="block md:hidden space-y-3">
            {isInitialLoading ? (
              <div className="space-y-3">
                <LineLoader context="admin" message="Loading registered users..." />
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] animate-pulse flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)]" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-[var(--surface-hover)]" />
                          <div className="h-3 w-24 rounded bg-[var(--surface-hover)]" />
                        </div>
                      </div>
                      <div className="h-5 w-16 rounded bg-[var(--surface-hover)]" />
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
              <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center space-y-3">
                <p className="font-heading text-[14px] text-[var(--muted)]">
                  No users match your filters or search criteria.
                </p>
                {(search ||
                  roleFilter !== 'all' ||
                  planFilter !== 'all' ||
                  statusFilter !== 'all' ||
                  accountTypeFilter !== 'all' ||
                  twoFactorFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('all');
                      setPlanFilter('all');
                      setStatusFilter('all');
                      setAccountTypeFilter('all');
                      setTwoFactorFilter('all');
                    }}
                    className="text-[12px] font-heading px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text)] hover:border-[var(--text)] transition-colors cursor-pointer"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              paginatedUsers.map((u) => {
                const isGuestUser = Boolean(u.isGuest || u.accountType === 'guest' || u.uid?.startsWith('guest_'));
                const badge2fa = isGuestUser ? 'Off' : resolveUser2faBadge(u);
                return (
                  <AdminUserMobileCard
                    key={u.uid}
                    user={u}
                    badge2fa={badge2fa}
                    isSuperAdmin={isSuperAdmin}
                    onSelect={handleSelectUser}
                  />
                );
              })
            )}
          </div>

          {/* ─── USERS LIST: DESKTOP TABLE (hidden md:block) ────────────────────── */}
          <div className="hidden md:block p-0 rounded-[24px] bg-[var(--card)] border border-[var(--border)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card-2)]/50 text-[12px] font-heading text-[var(--muted)]">
                  <th className="py-3 px-5 font-medium">Student</th>
                  <th className="py-3 px-4 font-medium">Short ID</th>
                  <th className="py-3 px-4 font-medium">Email / Handle</th>
                  <th className="py-3 px-4 font-medium">University Track</th>
                  <th className="py-3 px-4 font-medium">Questions Solved</th>
                  <th className="py-3 px-4 font-medium">Streak</th>
                  <th className="py-3 px-4 font-medium">2FA</th>
                  <th className="py-3 px-4 font-medium">Created / Active</th>
                  <th className="py-3 px-5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[13px] font-heading">
                {isInitialLoading ? (
                  <>
                    <tr>
                      <td colSpan={9} className="py-4 px-5">
                        <LineLoader context="admin" message="Loading registered users..." />
                      </td>
                    </tr>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)]" />
                            <div className="h-4 w-28 rounded bg-[var(--surface-hover)]" />
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-4 w-16 rounded bg-[var(--surface-hover)]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-4 w-36 rounded bg-[var(--surface-hover)]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-4 w-24 rounded bg-[var(--surface-hover)]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-4 w-16 rounded bg-[var(--surface-hover)]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-4 w-12 rounded bg-[var(--surface-hover)]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-5 w-20 rounded-full bg-[var(--surface-hover)]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-4 w-20 rounded bg-[var(--surface-hover)]" />
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="h-4 w-10 ml-auto rounded bg-[var(--surface-hover)]" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : loadState === 'error' && allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 px-5 text-center text-[var(--muted)]">
                      Could not load users right now. Please use the Retry button above.
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 px-5 text-center text-[var(--muted)]">
                      <p className="font-heading text-[14px] mb-2">
                        No users match your filters or search criteria.
                      </p>
                      {(search ||
                        roleFilter !== 'all' ||
                        planFilter !== 'all' ||
                        statusFilter !== 'all' ||
                        accountTypeFilter !== 'all' ||
                        twoFactorFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setRoleFilter('all');
                            setPlanFilter('all');
                            setStatusFilter('all');
                            setAccountTypeFilter('all');
                            setTwoFactorFilter('all');
                          }}
                          className="text-[12px] font-heading px-3 py-1 rounded-full border border-[var(--border)] text-[var(--text)] hover:border-[var(--text)] transition-colors cursor-pointer"
                        >
                          Reset all filters
                        </button>
                      )}
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
                        onToggleCheck={isSuperAdmin ? handleToggleSelectUid : undefined}
                        onSelect={handleSelectUser}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── PAGINATION BAR (50 PER PAGE + TOTAL COUNT) ─────────────────────── */}
          {!isInitialLoading && filteredUsers.length > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-2 pt-1 pb-2 text-xs font-mono text-[var(--muted)]">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users (50 per page)
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                    Prev
                  </button>
                  <span>
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] disabled:opacity-40 cursor-pointer"
                  >
                    Next
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[13px] font-heading font-medium text-[var(--text)] transition-colors disabled:opacity-50 min-w-[160px]"
              >
                <span>{loadingMore ? 'Loading more users...' : 'Load More Users'}</span>
                {loadingMore && <ButtonLineLoader />}
              </button>
            </div>
          )}
        </>
      )}

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
