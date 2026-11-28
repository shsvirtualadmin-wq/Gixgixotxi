import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  Lock,
  KeyRound,
  History,
  UserCheck,
} from 'lucide-react';
import { api, showApiToast } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  PERMISSION_LABELS,
  type AccessRequestRecord,
  type ActivePermissionGrant,
  type PermissionKey,
} from '@/constants/permissions';
import { RequestAccessSheet } from '@/components/admin/RequestAccessSheet';
import {
  DotHeading,
  GlassCard,
  Pill,
  SkeletonListRows,
} from '@/components/admin/AdminGlassPrimitives';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';
import { formatAuditActionLabel } from '@/utils/adminLabels';

type DurationOption = 'once' | '1h' | '24h' | '7d';

const DURATION_OPTIONS: Array<{ value: DurationOption; label: string; desc: string }> = [
  { value: 'once', label: 'Once', desc: 'Consumed on first action' },
  { value: '1h', label: '1h', desc: 'Expires in 1 hour' },
  { value: '24h', label: '24h', desc: 'Expires in 24 hours' },
  { value: '7d', label: '7d', desc: 'Expires in 7 days' },
];

export const AdminAccessRequestsPage: React.FC = () => {
  const { enabled: glassEnabled } = useAdminGlassFlag();
  const { isSuperAdmin, hasPermission } = useAuth();
  const canViewAudit = isSuperAdmin || hasPermission('audit.view');
  const [requestAuditOpen, setRequestAuditOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'grants'>('pending');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [activeGrants, setActiveGrants] = useState<ActivePermissionGrant[]>([]);
  const [migratedAdmins, setMigratedAdmins] = useState<
    Array<{ uid: string; email: string; displayName?: string; previousRole: string; newRole: string }>
  >([]);

  const [selectedDurations, setSelectedDurations] = useState<Record<string, DurationOption>>({});
  const [denyNotes, setDenyNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAccessRequests = useCallback(async () => {
    if (!canViewAudit) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get<{
        ok: boolean;
        requests: AccessRequestRecord[];
        activeGrants?: ActivePermissionGrant[];
        grants?: ActivePermissionGrant[];
        migratedAccounts?: Array<{
          uid: string;
          email: string;
          displayName?: string;
          previousRole: string;
          newRole: string;
        }>;
      }>('/api/admin/access-requests', { silentErrorToast: true });

      setRequests(Array.isArray(res?.requests) ? res.requests : []);
      const resolvedGrants = Array.isArray(res?.activeGrants)
        ? res.activeGrants
        : Array.isArray(res?.grants)
          ? res.grants
          : [];
      setActiveGrants(resolvedGrants);
      if (Array.isArray(res?.migratedAccounts)) {
        setMigratedAdmins(res.migratedAccounts);
      }
      window.dispatchEvent(new CustomEvent('boardly:access-requests-updated'));
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (/404|not found/i.test(msg)) {
        setRequests([]);
        setActiveGrants([]);
      } else {
        setLoadError(msg || 'Could not load access requests.');
      }
    } finally {
      setLoading(false);
    }
  }, [canViewAudit]);

  useEffect(() => {
    void loadAccessRequests();
  }, [loadAccessRequests]);

  if (!canViewAudit) {
    return (
      <div
        data-testid="access-requests-locked-state"
        className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-lg mx-auto pb-24"
      >
        <GlassCard variant="glass" padding="lg" className="w-full flex flex-col items-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Lock size={28} />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-semibold">
              Super Admin Only · <span className="opacity-75">audit.view</span>
            </div>
            <DotHeading as="h1" size="page">
              Access Requests &amp; Grants
            </DotHeading>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Only a <strong className="text-[var(--text)]">Super Admin</strong> can review, approve,
              deny, or revoke Admin permission requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRequestAuditOpen(true)}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Lock size={15} />
            <span>Request Audit View Access</span>
          </button>
        </GlassCard>

        <RequestAccessSheet
          open={requestAuditOpen}
          onClose={() => setRequestAuditOpen(false)}
          permission="audit.view"
          actionLabel="View Access Requests & Audit Trail"
        />
      </div>
    );
  }

  const pendingList = requests.filter((r) => r.status === 'pending');
  const historyList = requests.filter((r) => r.status !== 'pending');

  const handleApprove = async (reqItem: AccessRequestRecord) => {
    if (busyId) return;
    const duration: DurationOption = selectedDurations[reqItem.id] || 'once';
    setBusyId(reqItem.id);
    try {
      await api.post(`/api/admin/access-requests/${encodeURIComponent(reqItem.id)}/approve`, {
        duration,
      });
      showApiToast(
        `Approved ${reqItem.permission} for ${reqItem.requesterName || reqItem.requesterId} (${duration}).`,
        'success'
      );
      await loadAccessRequests();
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to approve request.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeny = async (reqItem: AccessRequestRecord) => {
    if (busyId) return;
    const note = (denyNotes[reqItem.id] || '').trim();
    setBusyId(reqItem.id);
    try {
      await api.post(`/api/admin/access-requests/${encodeURIComponent(reqItem.id)}/deny`, {
        note: note || undefined,
      });
      showApiToast(
        `Denied ${reqItem.permission} request from ${reqItem.requesterName || reqItem.requesterId}.`,
        'info'
      );
      await loadAccessRequests();
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to deny request.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeGrant = async (grant: ActivePermissionGrant) => {
    if (busyId) return;
    setBusyId(grant.id);
    try {
      await api.post(`/api/admin/access-grants/${encodeURIComponent(grant.id)}/revoke`, {});
      showApiToast(`Revoked active grant (${grant.permission}).`, 'success');
      await loadAccessRequests();
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to revoke grant.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div data-admin-page="access-requests" className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#E8353B] font-semibold">
            Super Admin Governance · Access Control
          </div>
          <DotHeading as="h1" size="page" className="mt-0.5">
            Access Requests &amp; Active Grants
          </DotHeading>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Review temporary permission requests from limited Admins, grant one-time or timed access, or revoke active grants immediately.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAccessRequests()}
          disabled={loading}
          className="self-start sm:self-auto min-h-[40px] px-4 py-2 rounded-xl ag-flat-card hover:border-[#E8353B] text-xs font-bold text-[var(--text)] inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/35 text-xs text-red-700 dark:text-red-200 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void loadAccessRequests()}
            className="px-3.5 py-1.5 rounded-xl bg-[#E8353B] text-white font-bold hover:bg-[#D4292F] transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs (preserves data-testid attributes) */}
      <div
        role="tablist"
        aria-label="Access request sections"
        className={
          glassEnabled
            ? 'ag-segmented overflow-x-auto max-w-full'
            : 'flex items-center gap-2 p-1 rounded-2xl bg-[var(--card)] border border-[var(--border)] w-fit flex-wrap'
        }
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pending'}
          data-testid="tab-pending-requests"
          onClick={() => setActiveTab('pending')}
          className={
            glassEnabled
              ? 'ag-segmented-item inline-flex items-center gap-1.5 shrink-0'
              : `min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-[#E8353B] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`
          }
        >
          <Clock size={14} />
          <span>Pending ({pendingList.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'grants'}
          data-testid="tab-active-grants"
          onClick={() => setActiveTab('grants')}
          className={
            glassEnabled
              ? 'ag-segmented-item inline-flex items-center gap-1.5 shrink-0'
              : `min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'grants'
                    ? 'bg-[#E8353B] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`
          }
        >
          <KeyRound size={14} />
          <span>Active Grants ({activeGrants.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          data-testid="tab-request-history"
          onClick={() => setActiveTab('history')}
          className={
            glassEnabled
              ? 'ag-segmented-item inline-flex items-center gap-1.5 shrink-0'
              : `min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-[#E8353B] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`
          }
        >
          <History size={14} />
          <span>History ({historyList.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING REQUESTS (flat translucent cards — zero backdrop-filter inside list) */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {loading && pendingList.length === 0 ? (
            <SkeletonListRows rows={3} />
          ) : pendingList.length === 0 ? (
            <GlassCard variant="flat" padding="lg" className="text-center space-y-2">
              <ShieldCheck size={28} className="mx-auto text-emerald-500" />
              <div className="text-sm font-bold text-[var(--text)]">No pending access requests</div>
              <p className="text-xs text-[var(--muted)]">
                When a limited Admin requests permission for a locked action, it will appear here for your approval.
              </p>
            </GlassCard>
          ) : (
            pendingList.map((reqItem) => {
              const selectedDur = selectedDurations[reqItem.id] || 'once';
              const isBusy = busyId === reqItem.id;
              const permLabel =
                PERMISSION_LABELS[reqItem.permission as PermissionKey] ||
                formatAuditActionLabel(reqItem.permission);

              return (
                <GlassCard
                  key={reqItem.id}
                  variant="flat"
                  padding="md"
                  data-testid={`pending-request-${reqItem.id}`}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Pill tone="warning">{permLabel}</Pill>
                        <code className="text-[10px] font-mono text-[var(--muted)] opacity-80">
                          {reqItem.permission}
                        </code>
                      </div>

                      <div className="text-xs text-[var(--muted)] flex items-center gap-2 flex-wrap">
                        <span>
                          Requester:{' '}
                          <strong className="text-[var(--text)]">
                            {reqItem.requesterName || reqItem.requesterEmail || reqItem.requesterId}
                          </strong>
                        </span>
                        {reqItem.targetId && (
                          <>
                            <span>&bull;</span>
                            <span>
                              Target:{' '}
                              <code className="font-mono text-[var(--text)]">
                                {reqItem.targetLabel || reqItem.targetId}
                              </code>
                            </span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>{new Date(reqItem.createdAt).toLocaleString('en-GB')}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--bg)]/60 border border-[var(--border)] text-xs text-[var(--text)]">
                        <span className="text-[var(--muted)] font-semibold">Reason: </span>
                        {reqItem.reason}
                      </div>
                    </div>
                  </div>

                  {/* Duration Picker + Approve / Deny Controls */}
                  <div className="pt-3 border-t border-[var(--border)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                        Grant Duration
                      </span>
                      <div className="inline-flex items-center gap-1.5 flex-wrap">
                        {DURATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            data-testid={`duration-${reqItem.id}-${opt.value}`}
                            onClick={() =>
                              setSelectedDurations((prev) => ({
                                ...prev,
                                [reqItem.id]: opt.value,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                              selectedDur === opt.value
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'border-[var(--border)] bg-[var(--bg)]/60 text-[var(--muted)] hover:text-[var(--text)]'
                            }`}
                            title={opt.desc}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Optional note for denial..."
                        value={denyNotes[reqItem.id] || ''}
                        onChange={(e) =>
                          setDenyNotes((prev) => ({ ...prev, [reqItem.id]: e.target.value }))
                        }
                        className="px-3 py-2 rounded-xl bg-[var(--bg)]/70 border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[#E8353B]"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          data-testid={`deny-request-${reqItem.id}`}
                          onClick={() => void handleDeny(reqItem)}
                          className="min-h-[40px] px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          <span>Deny</span>
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          data-testid={`approve-request-${reqItem.id}`}
                          onClick={() => void handleApprove(reqItem)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve ({selectedDur})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE GRANTS */}
      {activeTab === 'grants' && (
        <div className="space-y-2.5">
          {activeGrants.length === 0 ? (
            <GlassCard variant="flat" padding="lg" className="text-center space-y-2">
              <KeyRound size={26} className="mx-auto text-[var(--muted)]" />
              <div className="text-sm font-bold text-[var(--text)]">No active temporary grants</div>
              <p className="text-xs text-[var(--muted)]">
                Approved one-time or timed permission grants that have not yet expired or been consumed appear here.
              </p>
            </GlassCard>
          ) : (
            activeGrants.map((grant) => {
              const grantLabel =
                PERMISSION_LABELS[grant.permission as PermissionKey] ||
                formatAuditActionLabel(grant.permission);
              return (
                <GlassCard
                  key={grant.id}
                  variant="flat"
                  padding="sm"
                  data-testid={`active-grant-${grant.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill tone="success">{grantLabel}</Pill>
                      <code className="text-[10px] font-mono text-[var(--muted)] opacity-80">
                        {grant.permission}
                      </code>
                      <Pill tone="neutral">Duration: {grant.duration}</Pill>
                    </div>
                    <div className="text-xs text-[var(--muted)] flex items-center gap-2 flex-wrap">
                      <span>
                        Admin ID: <code className="font-mono text-[var(--text)]">{grant.userId}</code>
                      </span>
                      {grant.targetId && (
                        <>
                          <span>&bull;</span>
                          <span>
                            Target: <code className="font-mono text-[var(--text)]">{grant.targetId}</code>
                          </span>
                        </>
                      )}
                      {grant.expiresAt && (
                        <>
                          <span>&bull;</span>
                          <span>Expires: {new Date(grant.expiresAt).toLocaleString('en-GB')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busyId === grant.id}
                    data-testid={`revoke-grant-${grant.id}`}
                    onClick={() => void handleRevokeGrant(grant)}
                    className="self-start sm:self-auto min-h-[38px] px-4 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Ban size={13} />
                    <span>Revoke</span>
                  </button>
                </GlassCard>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-2.5">
          {historyList.length === 0 ? (
            <GlassCard variant="flat" padding="lg" className="text-center text-xs text-[var(--muted)]">
              No past access request decisions recorded yet.
            </GlassCard>
          ) : (
            historyList.map((item) => {
              const itemLabel =
                PERMISSION_LABELS[item.permission as PermissionKey] ||
                formatAuditActionLabel(item.permission);
              return (
                <GlassCard
                  key={item.id}
                  variant="flat"
                  padding="sm"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[var(--text)]">{itemLabel}</span>
                      <code className="text-[10px] font-mono text-[var(--muted)] opacity-80">
                        {item.permission}
                      </code>
                      <Pill
                        tone={
                          item.status === 'approved'
                            ? 'success'
                            : item.status === 'denied' || item.status === 'revoked'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {item.status}
                      </Pill>
                      {item.duration && (
                        <span className="text-[11px] font-mono text-[var(--muted)]">
                          ({item.duration})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      Requester:{' '}
                      <strong className="text-[var(--text)]">
                        {item.requesterName || item.requesterId}
                      </strong>{' '}
                      &bull; Reason: &ldquo;{item.reason}&rdquo;
                    </div>
                    {item.decisionNote && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-300">
                        Note: {item.decisionNote}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--muted)] shrink-0">
                    {item.decidedAt
                      ? new Date(item.decidedAt).toLocaleString('en-GB')
                      : new Date(item.createdAt).toLocaleString('en-GB')}
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      )}

      {/* Migration Verification Summary Card */}
      {migratedAdmins.length > 0 && (
        <GlassCard variant="glass" padding="md" className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <UserCheck size={15} />
            <span>Role Migration Verified (Existing Admins → Super Admin)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {migratedAdmins.map((acc) => (
              <div
                key={acc.uid}
                className="p-2.5 rounded-xl ag-flat-card text-xs space-y-0.5"
              >
                <div className="font-bold text-[var(--text)] truncate">
                  {acc.email || acc.displayName || acc.uid}
                </div>
                <div className="text-[10px] font-mono text-[var(--muted)]">
                  ID: {acc.uid} &bull; Role:{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">{acc.newRole}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default AdminAccessRequestsPage;
