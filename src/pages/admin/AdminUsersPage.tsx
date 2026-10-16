import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Shield, Key, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserOverrideDrawer } from '@/components/admin/UserOverrideDrawer';
import { fetchUsers } from '@/services/adminService';
import type { UserProfile } from '@/types';

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(search, roleFilter, planFilter, 100);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, planFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Key size={20} style={{ color: '#10B981' }} />
            <h1
              className="font-display"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              User Management & Overrides
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Inspect student profiles, grant Pro privileges, update roles, or suspend abusive accounts.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadUsers} loading={loading}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* ── Filter & Search Toolbar ──────────────────────────────────── */}
      <GlassCard style={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Search Input */}
          <div
            style={{
              flex: 1,
              minWidth: 240,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-input)',
              padding: '0 12px',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="Search by email, name, or UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                fontSize: 13,
                padding: '10px 0',
                outline: 'none',
              }}
            />
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-faint)' }} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--r-input)',
                padding: '8px 12px',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="crew">Crew</option>
              <option value="captain">Captains</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 'var(--r-input)',
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="all">All Plans</option>
            <option value="free">Free Tier</option>
            <option value="pro">Pro Tier</option>
          </select>
        </div>
      </GlassCard>

      {/* ── Users Table ──────────────────────────────────────────────── */}
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-faint)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '12px 20px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Plan</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Target Campus</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px' }} colSpan={6}>
                      <Skeleton height={20} />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <EmptyState
                      title="No users found"
                      description="No registered students match your current search or filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSusp = u.suspended || u.isSuspended;
                  const isPro = u.plan === 'pro' || u.isPremium;

                  return (
                    <tr
                      key={u.uid}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 160ms',
                      }}
                      className="hover:bg-[var(--surface-hover)]"
                    >
                      {/* User Info */}
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--text)' }}>
                              {u.displayName || 'Unnamed Student'}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            background:
                              u.role === 'admin'
                                ? 'rgba(16,185,129,0.15)'
                                : u.role === 'captain'
                                ? 'rgba(245,158,11,0.15)'
                                : u.role === 'crew'
                                ? 'rgba(124,92,255,0.15)'
                                : 'rgba(255,255,255,0.06)',
                            color:
                              u.role === 'admin'
                                ? '#34D399'
                                : u.role === 'captain'
                                ? '#FBBF24'
                                : u.role === 'crew'
                                ? '#C084FC'
                                : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {u.role || 'student'}
                        </span>
                      </td>

                      {/* Plan */}
                      <td style={{ padding: '12px 16px' }}>
                        {isPro ? (
                          <Badge color="brand">Pro ({u.premiumSource || 'active'})</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Free</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        {isSusp ? (
                          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                            <UserX size={14} /> Suspended
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <UserCheck size={14} /> Active
                          </span>
                        )}
                      </td>

                      {/* Target University */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {u.targetUniversity || 'Not specified'}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedUser(u)}
                        >
                          <Shield size={13} /> Override
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ── Slide-over Override Drawer ─────────────────────────────────── */}
      <UserOverrideDrawer
        user={selectedUser}
        adminEmail={user?.email || ''}
        onClose={() => setSelectedUser(null)}
        onSuccess={loadUsers}
      />
    </div>
  );
}
