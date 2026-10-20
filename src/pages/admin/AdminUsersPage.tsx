import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, UserCheck, Loader2, Shield, Users as UsersIcon, Clock, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserOverrideDrawer } from '@/components/admin/UserOverrideDrawer';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import { AdminNameRequestsSection } from '@/components/admin/AdminNameRequestsSection';
import {
  fetchUsersPaginated,
  backfillMissingDisplayNames,
  getUserDisplayName,
} from '@/services/adminService';
import { backfillAllPublicProfiles } from '@/services/publicProfileService';
import { formatStudentId } from '@/utils/shortId';
import { maskEmail } from '@/utils/privacy';
import type { UserProfile } from '@/types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

let cachedAdminUsers: UserProfile[] = [];

export function AdminUsersPage() {
  const { user } = useAuth();
  const [adminTab, setAdminTab] = useState<'users' | 'nameRequests'>('users');
  const [pendingNameRequestsCount, setPendingNameRequestsCount] = useState<number>(0);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => cachedAdminUsers);
  const [loading, setLoading] = useState(() => cachedAdminUsers.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<AdminDiagnosticError | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected user for drawer/sheet
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Backfill names state
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);

  // Backfill public profiles state
  const [backfillingProfiles, setBackfillingProfiles] = useState(false);
  const [backfillProfilesMessage, setBackfillProfilesMessage] = useState<string | null>(null);

  const emailLower = user?.email?.toLowerCase().trim() || '';
  const isSuperAdmin = Boolean(
    emailLower === 'shsvirtualadmin@gmail.com' ||
    emailLower === 'support@boardly.cfd' ||
    user?.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'
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

  const loadUsers = useCallback(async () => {
    if (cachedAdminUsers.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetchUsersPaginated({
        limitCount: 100,
      });
      cachedAdminUsers = res.users;
      setAllUsers(res.users);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('Failed to load users:', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'USERS_FETCH_FAILED',
        message: e?.message || 'Failed to load users from database. Please verify Firestore permissions.',
        collection: e?.collection || 'users',
        operation: e?.operation || 'fetchUsersPaginated',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchUsersPaginated({
        limitCount: 50,
        role: roleFilter,
        plan: planFilter,
        startAfterDoc: lastDoc,
      });
      setAllUsers((prev) => [...prev, ...res.users]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      console.warn('Failed to load more users:', err);
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

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user, loadUsers]);

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
      await loadUsers();
    } catch (err: unknown) {
      console.error('Backfill error:', err);
      setBackfillMessage('Could not complete backfill operation.');
    } finally {
      setBackfilling(false);
    }
  };

  // ── Client-side filtering in memory across all dimensions ──────────────────
  const filteredUsers = allUsers.filter((u) => {
    // 1. Role Filter
    if (roleFilter !== 'all') {
      const isSuper = u.email?.toLowerCase() === 'shsvirtualadmin@gmail.com';
      const isAdmin = isSuper || u.role === 'admin';
      if (roleFilter === 'admin' && !isAdmin) return false;
      if (roleFilter === 'student' && (isAdmin || (u.role && u.role !== 'student'))) return false;
      if (roleFilter === 'captain' && u.role !== 'captain') return false;
      if (roleFilter === 'crew' && u.role !== 'crew') return false;
    }

    // 2. Plan Filter
    if (planFilter !== 'all') {
      const isPro = u.plan === 'pro' || !!u.isPremium;
      if (planFilter === 'pro' && !isPro) return false;
      if (planFilter === 'free' && isPro) return false;
    }

    // 3. Status Filter
    if (statusFilter === 'active') {
      if (u.suspended || u.isSuspended) return false;
    }
    if (statusFilter === 'suspended') {
      if (!u.suspended && !u.isSuspended) return false;
    }

    // 4. Search Filter
    if (search.trim()) {
      const st = search.toLowerCase().trim();
      const name = getUserDisplayName(u).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const uid = (u.uid || '').toLowerCase();
      const uni = (u.targetUniversity || '').toLowerCase();
      if (!name.includes(st) && !email.includes(st) && !uid.includes(st) && !uni.includes(st)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
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
          <button
            type="button"
            onClick={handleBackfillPublicProfiles}
            disabled={backfillingProfiles}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
            title="Batch backfill student public profiles for privacy protection"
          >
            <Shield size={14} className={backfillingProfiles ? 'animate-spin text-[#D71921]' : 'text-[#D71921]'} />
            <span>{backfillingProfiles ? 'Syncing profiles...' : 'Backfill public profiles'}</span>
          </button>

          <button
            type="button"
            onClick={handleBackfillNames}
            disabled={backfilling}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
            title="Update missing display names for existing accounts"
          >
            <UserCheck size={14} />
            <span>{backfilling ? 'Filling names...' : 'Fill missing names'}</span>
          </button>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <AdminDiagnosticBanner
        error={error}
        collectionName="users"
        onRetry={loadUsers}
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
          <span>All Users ({allUsers.length})</span>
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

        {/* Filter chips that wrap cleanly on mobile screens without scrolling sideways */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Role Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
              Role:
            </span>
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

          {/* Plan & Status Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
              Plan:
            </span>
            {[
              { id: 'all', label: 'All plans' },
              { id: 'free', label: 'Free' },
              { id: 'pro', label: 'Pro' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlanFilter(id)}
                className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
                  planFilter === id
                    ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </button>
            ))}

            <span className="text-[11px] font-heading text-[var(--muted)] mx-1 shrink-0">
              Status:
            </span>
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

      {/* ─── USERS LIST: MOBILE CARDS (block md:hidden) ─────────────────────── */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--card-2)] border border-[var(--border)] shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-[var(--card-2)] rounded w-1/2" />
                  <div className="h-3 bg-[var(--card-2)] rounded w-3/4" />
                </div>
              </div>
            </div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center space-y-3">
            <p className="font-heading text-[14px] text-[var(--muted)]">
              No users match your filters or search criteria.
            </p>
            {(search || roleFilter !== 'all' || planFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setPlanFilter('all');
                  setStatusFilter('all');
                }}
                className="text-[12px] font-heading px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text)] hover:border-[var(--text)] transition-colors cursor-pointer"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const name = getUserDisplayName(u);
            const initial = name[0].toUpperCase();
            const isSuspended = !!(u.suspended || u.isSuspended);
            const isPro = u.plan === 'pro' || u.isPremium;

            const studentId = formatStudentId(u);
            const qSolved = u.totalQuestionsSolved ?? ((u.testsCompleted || 0) * 15);
            const joinedDate = u.createdAt?.toDate
              ? u.createdAt.toDate().toLocaleDateString('en-GB')
              : u.createdAt?.seconds
              ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('en-GB')
              : 'Recent';

            return (
              <div
                key={u.uid}
                onClick={() => setSelectedUser(u)}
                  className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--text)]/40 transition-colors cursor-pointer flex flex-col gap-3.5"
                >
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center font-heading font-bold text-[14px] text-[var(--text)] shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-heading font-semibold text-[14px] text-[var(--text)] truncate">
                            {name}
                          </p>
                          <span className="font-mono text-[11px] font-bold text-[#D71921] px-1.5 py-0.2 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                            {studentId}
                          </span>
                        </div>
                        <p className="font-heading text-[12px] text-[var(--muted)] truncate">
                          {isSuperAdmin ? u.email : maskEmail(u.email)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-[var(--text)] block">
                        {qSolved} MCQs
                      </span>
                      <span className="text-[10px] text-[var(--text-faint)] font-mono">
                        🔥 {u.streak || 0}d streak
                      </span>
                    </div>
                  </div>

                  {/* Meta: Track, Joined Date & Status Pills */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[var(--border)]/60 text-xs">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)] truncate max-w-[140px]">
                        {u.targetUniversity || 'General Prep'}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[var(--text-faint)]">Joined {joinedDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSuspended && (
                        <span className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                          Suspended
                        </span>
                      )}
                      <span className="text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] capitalize">
                        {u.role || 'Student'}
                      </span>
                      <span className="text-[10px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
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
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">University Track</th>
                <th className="py-3 px-4 font-medium">Questions Solved</th>
                <th className="py-3 px-4 font-medium">Streak</th>
                <th className="py-3 px-4 font-medium">Joined Date</th>
                <th className="py-3 px-5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[13px] font-heading">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-4 px-5">
                      <div className="h-4 bg-[var(--card-2)] rounded w-3/4 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-5 text-center text-[var(--muted)]">
                    <p className="font-heading text-[14px] mb-2">No users match your filters or search criteria.</p>
                    {(search || roleFilter !== 'all' || planFilter !== 'all' || statusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setRoleFilter('all');
                          setPlanFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-[12px] font-heading px-3 py-1 rounded-full border border-[var(--border)] text-[var(--text)] hover:border-[var(--text)] transition-colors cursor-pointer"
                      >
                        Reset all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const name = getUserDisplayName(u);
                  const initial = name[0].toUpperCase();
                  const studentId = formatStudentId(u);
                  const qSolved = u.totalQuestionsSolved ?? ((u.testsCompleted || 0) * 15);
                  const joinedDate = u.createdAt?.toDate
                    ? u.createdAt.toDate().toLocaleDateString('en-GB')
                    : u.createdAt?.seconds
                    ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('en-GB')
                    : 'Recent';

                  return (
                    <tr
                      key={u.uid}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                    >
                      {/* 1. Student Name */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center font-heading font-bold text-[12px] text-[var(--text)] shrink-0">
                            {initial}
                          </div>
                          <span className="font-heading font-semibold text-[13px] text-[var(--text)] truncate max-w-[140px]">
                            {name}
                          </span>
                        </div>
                      </td>

                      {/* 2. Short Student ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#D71921] text-xs">
                        {studentId}
                      </td>

                      {/* 3. Email */}
                      <td className="py-3.5 px-4 text-[12px] text-[var(--muted)]">
                        {isSuperAdmin ? u.email : maskEmail(u.email)}
                      </td>

                      {/* 4. University Track */}
                      <td className="py-3.5 px-4 text-[12px] text-[var(--text)]">
                        {u.targetUniversity || 'General Prep'}
                      </td>

                      {/* 5. Total Questions Solved */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[13px] text-[var(--text)]">
                        {qSolved.toLocaleString()} MCQs
                      </td>

                      {/* 6. Streak */}
                      <td className="py-3.5 px-4 font-mono text-[12px] text-[var(--text)]">
                        🔥 {u.streak || 0}d
                      </td>

                      {/* 7. Joined Date */}
                      <td className="py-3.5 px-4 text-[12px] font-mono text-[var(--text-faint)]">
                        {joinedDate}
                      </td>

                      {/* 8. Action */}
                      <td className="py-3.5 px-5 text-right">
                        <span className="text-[12px] text-[var(--text)] hover:underline">
                          Edit
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[13px] font-heading font-medium text-[var(--text)] transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
                <span>Loading more users...</span>
              </>
            ) : (
              <span>Load More Users</span>
            )}
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
          onClose={() => setSelectedUser(null)}
          onSuccess={loadUsers}
        />
      )}
    </div>
  );
}

export default AdminUsersPage;
