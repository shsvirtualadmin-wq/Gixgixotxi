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
  AlertCircle,
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

type DurationOption = 'once' | '1h' | '24h' | '7d';

const DURATION_OPTIONS: Array<{ value: DurationOption; label: string; desc: string }> = [
  { value: 'once', label: 'Once', desc: 'Consumed on first action' },
  { value: '1h', label: '1h', desc: 'Expires in 1 hour' },
  { value: '24h', label: '24h', desc: 'Expires in 24 hours' },
  { value: '7d', label: '7d', desc: 'Expires in 7 days' },
];

export const AdminAccessRequestsPage: React.FC = () => {
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

  const loadAccessRequests = useCallback(async () => {
    if (!canViewAudit) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{
        ok: boolean;
        requests: AccessRequestRecord[];
        activeGrants: ActivePermissionGrant[];
        migratedAccounts?: Array<{
          uid: string;
          email: string;
          displayName?: string;
          previousRole: string;
          newRole: string;
        }>;
      }>('/api/admin/access-requests', { silentErrorToast: true });

      setRequests(Array.isArray(res?.requests) ? res.requests : []);
      setActiveGrants(Array.isArray(res?.activeGrants) ? res.activeGrants : []);
      if (Array.isArray(res?.migratedAccounts)) {
        setMigratedAdmins(res.migratedAccounts);
      }
      window.dispatchEvent(new CustomEvent('boardly:access-requests-updated'));
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to load access requests.', 'error');
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
        className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto space-y-5"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Lock size={28} />
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
            SUPER ADMIN ONLY &bull; audit.view
          </div>
          <h1 className="font-dot text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
            Access Requests &amp; Grants
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            Only a <strong className="text-[var(--text)]">Super Admin</strong> can review, approve,
            deny, or revoke Admin permission requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRequestAuditOpen(true)}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#b8141b] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <Lock size={15} />
          <span>Request Audit View Access</span>
        </button>

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#D71921] font-semibold">
            SUPER ADMIN GOVERNANCE &bull; ACCESS CONTROL
          </div>
          <h1 className="font-dot text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
            Access Requests &amp; Active Grants
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Review temporary permission requests from limited Admins, grant one-time or timed access, or revoke active grants immediately.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAccessRequests()}
          disabled={loading}
          className="self-start sm:self-auto min-h-[40px] px-4 py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-bold text-[var(--text)] inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--card)] border border-[var(--border)] w-fit flex-wrap">
        <button
          type="button"
          data-testid="tab-pending-requests"
          onClick={() => setActiveTab('pending')}
          className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-[#D71921] text-white'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <Clock size={14} />
          <span>Pending ({pendingList.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-active-grants"
          onClick={() => setActiveTab('grants')}
          className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'grants'
              ? 'bg-[#D71921] text-white'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <KeyRound size={14} />
          <span>Active Grants ({activeGrants.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-request-history"
          onClick={() => setActiveTab('history')}
          className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#D71921] text-white'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <History size={14} />
          <span>History ({historyList.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {loading && pendingList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
              Loading pending access requests...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center space-y-2">
              <ShieldCheck size={28} className="mx-auto text-emerald-400" />
              <div className="text-sm font-bold text-[var(--text)]">No pending access requests</div>
              <p className="text-xs text-[var(--muted)]">
                When a limited Admin requests permission for a locked action, it will appear here for your approval.
              </p>
            </div>
          ) : (
            pendingList.map((reqItem) => {
              const selectedDur = selectedDurations[reqItem.id] || 'once';
              const isBusy = busyId === reqItem.id;
              const permLabel =
                PERMISSION_LABELS[reqItem.permission as PermissionKey] || reqItem.permission;

              return (
                <div
                  key={reqItem.id}
                  data-testid={`pending-request-${reqItem.id}`}
                  className="p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {reqItem.permission}
                        </span>
                        <span className="text-xs font-bold text-[var(--text)]">{permLabel}</span>
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

                      <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-xs text-[var(--text)]">
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
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                : 'border-[var(--border)] bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
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
                        className="px-3 py-2 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--text)]"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          data-testid={`deny-request-${reqItem.id}`}
                          onClick={() => void handleDeny(reqItem)}
                          className="min-h-[40px] px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE GRANTS */}
      {activeTab === 'grants' && (
        <div className="space-y-3">
          {activeGrants.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center space-y-2">
              <KeyRound size={26} className="mx-auto text-[var(--muted)]" />
              <div className="text-sm font-bold text-[var(--text)]">No active temporary grants</div>
              <p className="text-xs text-[var(--muted)]">
                Approved one-time or timed permission grants that have not yet expired or been consumed appear here.
              </p>
            </div>
          ) : (
            activeGrants.map((grant) => (
              <div
                key={grant.id}
                data-testid={`active-grant-${grant.id}`}
                className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {grant.permission}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)]">
                      Duration: {grant.duration}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--muted)] flex items-center gap-2 flex-wrap">
                    <span>
                      Admin UID: <code className="font-mono text-[var(--text)]">{grant.userId}</code>
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
                  className="self-start sm:self-auto min-h-[38px] px-4 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ban size={13} />
                  <span>Revoke</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {historyList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
              No past access request decisions recorded yet.
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[var(--text)]">
                      {item.permission}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                        item.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : item.status === 'denied' || item.status === 'revoked'
                          ? 'bg-red-500/15 text-red-300 border-red-500/30'
                          : 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.duration && (
                      <span className="text-[11px] font-mono text-[var(--muted)]">
                        ({item.duration})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Requester: <strong className="text-[var(--text)]">{item.requesterName || item.requesterId}</strong> &bull; Reason: &ldquo;{item.reason}&rdquo;
                  </div>
                  {item.decisionNote && (
                    <div className="text-[11px] text-amber-300">Note: {item.decisionNote}</div>
                  )}
                </div>
                <div className="text-[11px] font-mono text-[var(--muted)] shrink-0">
                  {item.decidedAt
                    ? new Date(item.decidedAt).toLocaleString('en-GB')
                    : new Date(item.createdAt).toLocaleString('en-GB')}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Migration Verification Summary Card */}
      {migratedAdmins.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <UserCheck size={15} />
            <span>Idempotent Role Migration Verified (Existing Admins → Super Admin)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {migratedAdmins.map((acc) => (
              <div
                key={acc.uid}
                className="p-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-xs space-y-0.5"
              >
                <div className="font-bold text-[var(--text)] truncate">
                  {acc.email || acc.displayName || acc.uid}
                </div>
                <div className="text-[10px] font-mono text-[var(--muted)]">
                  UID: {acc.uid} &bull; Role: <span className="text-emerald-400">{acc.newRole}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccessRequestsPage;
