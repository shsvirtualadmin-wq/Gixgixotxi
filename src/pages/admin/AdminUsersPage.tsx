import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserOverrideDrawer } from '@/components/admin/UserOverrideDrawer';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import {
  fetchUsers,
  backfillMissingDisplayNames,
  getUserDisplayName,
} from '@/services/adminService';
import type { UserProfile } from '@/types';

export function AdminUsersPage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setAllUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError({
        code: err?.code || 'USERS_FETCH_FAILED',
        message: err?.message || 'Failed to load users from database. Please verify Firestore permissions.',
        collection: err?.collection || 'users',
        projectId: err?.projectId || 'boardly-8c0cd',
        operation: err?.operation || 'fetchUsers',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
          <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
            <p className="font-heading text-[14px] text-[var(--muted)]">
              No users match your search.
            </p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const name = getUserDisplayName(u);
            const initial = name[0].toUpperCase();
            const isSuper = u.email?.toLowerCase() === 'shsvirtualadmin@gmail.com';
            const isAdmin = isSuper || u.role === 'admin';
            const isSuspended = !!(u.suspended || u.isSuspended);
            const isPro = u.plan === 'pro' || u.isPremium;

            return (
              <div
                key={u.uid}
                onClick={() => setSelectedUser(u)}
                className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--text)]/40 transition-colors cursor-pointer flex flex-col gap-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar: solid #1A1A1A circle with white initial, no gradient */}
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center font-heading font-bold text-[14px] text-white shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-semibold text-[14px] text-[var(--text)] truncate">
                      {name}
                    </p>
                    <p className="font-heading text-[12px] text-[var(--muted)] truncate">
                      {u.email}
                    </p>
                  </div>
                </div>

                {/* Status Pills: role, plan, status */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[var(--border)]/60">
                  {/* Role pill: Student (grey outline), Admin (white outline), Superadmin (red outline) */}
                  {isSuper ? (
                    <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--red)] text-[var(--red)]">
                      Superadmin
                    </span>
                  ) : isAdmin ? (
                    <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--text)] text-[var(--text)]">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] capitalize">
                      {u.role || 'Student'}
                    </span>
                  )}

                  {/* Plan pill */}
                  <span
                    className={`text-[11px] font-heading px-2 py-0.5 rounded-full border ${
                      isPro
                        ? 'border-[var(--text)] text-[var(--text)]'
                        : 'border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    {isPro ? 'Pro' : 'Free'}
                  </span>

                  {/* Status pill */}
                  <span
                    className={`text-[11px] font-heading px-2 py-0.5 rounded-full border ${
                      isSuspended
                        ? 'border-[var(--red)] text-[var(--red)]'
                        : 'border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    {isSuspended ? 'Suspended' : 'Active'}
                  </span>

                  {u.targetUniversity && (
                    <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] truncate max-w-[150px]">
                      {u.targetUniversity}
                    </span>
                  )}
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
              <th className="py-3 px-5 font-medium">User</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Plan</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Target campus</th>
              <th className="py-3 px-5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[13px] font-heading">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="py-4 px-5">
                    <div className="h-4 bg-[var(--card-2)] rounded w-3/4 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-5 text-center text-[var(--muted)]">
                  No users match your search.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const name = getUserDisplayName(u);
                const initial = name[0].toUpperCase();
                const isSuper = u.email?.toLowerCase() === 'shsvirtualadmin@gmail.com';
                const isAdmin = isSuper || u.role === 'admin';
                const isSuspended = !!(u.suspended || u.isSuspended);
                const isPro = u.plan === 'pro' || u.isPremium;

                return (
                  <tr
                    key={u.uid}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                  >
                    {/* User info */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center font-heading font-bold text-[12px] text-white shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading font-semibold text-[13px] text-[var(--text)] truncate">
                            {name}
                          </p>
                          <p className="font-heading text-[11px] text-[var(--muted)] truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {isSuper ? (
                        <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--red)] text-[var(--red)]">
                          Superadmin
                        </span>
                      ) : isAdmin ? (
                        <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--text)] text-[var(--text)]">
                          Admin
                        </span>
                      ) : (
                        <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] capitalize">
                          {u.role || 'Student'}
                        </span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-heading px-2 py-0.5 rounded-full border ${
                          isPro
                            ? 'border-[var(--text)] text-[var(--text)]'
                            : 'border-[var(--border)] text-[var(--muted)]'
                        }`}
                      >
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-heading px-2 py-0.5 rounded-full border ${
                          isSuspended
                            ? 'border-[var(--red)] text-[var(--red)]'
                            : 'border-[var(--border)] text-[var(--muted)]'
                        }`}
                      >
                        {isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>

                    {/* Target campus */}
                    <td className="py-3.5 px-4 text-[var(--muted)] text-[12px]">
                      {u.targetUniversity || '—'}
                    </td>

                    {/* Action link */}
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
