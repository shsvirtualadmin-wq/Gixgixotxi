import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  AdminButton,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminErrorRetryCard,
  AdminSearchFilterBar,
  AdminStatGrid,
  DotHeading,
  GlassCard,
  MonoLabel,
  Pill,
  SkeletonListRows,
  useDebouncedValue,
} from '@/components/admin/AdminGlassPrimitives';
import {
  getCachedAdminAccessRequests,
  fetchAdminAccessRequestsSWR,
  invalidateAdminAccessRequestsCache,
} from '@/services/adminTabCache';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';
import { formatAuditActionLabel } from '@/utils/adminLabels';

type DurationOption = 'once' | '1h' | '24h' | '7d';

const PAGE_SIZE = 20;

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

  const initialCache = getCachedAdminAccessRequests();
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'grants'>('pending');
  const [loading, setLoading] = useState<boolean>(() => !initialCache);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(() => Boolean(initialCache));
  const [requests, setRequests] = useState<AccessRequestRecord[]>(
    () => initialCache?.requests ?? []
  );
  const [activeGrants, setActiveGrants] = useState<ActivePermissionGrant[]>(
    () => initialCache?.grants ?? []
  );
  const [migratedAdmins, setMigratedAdmins] = useState<
    Array<{ uid: string; email: string; displayName?: string; previousRole: string; newRole: string }>
  >(() => initialCache?.migratedAccounts ?? []);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [selectedDurations, setSelectedDurations] = useState<Record<string, DurationOption>>({});
  const [denyNotes, setDenyNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ActivePermissionGrant | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyCache = useCallback(
    (data: {
      requests: AccessRequestRecord[];
      grants: ActivePermissionGrant[];
      migratedAccounts: Array<{
        uid: string;
        email: string;
        displayName?: string;
        previousRole: string;
        newRole: string;
      }>;
    }) => {
      setRequests(data.requests);
      setActiveGrants(data.grants);
      if (data.migratedAccounts.length > 0) {
        setMigratedAdmins(data.migratedAccounts);
      }
      setHasLoadedOnce(true);
    },
    []
  );

  const loadAccessRequests = useCallback(
    async (force = false) => {
      if (!canViewAudit) {
        setLoading(false);
        return;
      }
      const cached = getCachedAdminAccessRequests();
      if (!cached) {
        setLoading(true);
      }
      if (force) {
        invalidateAdminAccessRequestsCache();
      }
      setLoadError(null);
      try {
        const res = await fetchAdminAccessRequestsSWR({
          force,
          onUpdate: applyCache,
        });
        applyCache(res);
        window.dispatchEvent(new CustomEvent('boardly:access-requests-updated'));
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (/404|not found/i.test(msg)) {
          setRequests([]);
          setActiveGrants([]);
          setHasLoadedOnce(true);
        } else {
          setLoadError(msg || 'Could not load access requests.');
        }
      } finally {
        setLoading(false);
      }
    },
    [canViewAudit, applyCache]
  );

  useEffect(() => {
    void loadAccessRequests(false);
  }, [loadAccessRequests]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, debouncedSearch]);

  const pendingList = useMemo(
    () => requests.filter((r) => r.status === 'pending'),
    [requests]
  );
  const historyList = useMemo(
    () => requests.filter((r) => r.status !== 'pending'),
    [requests]
  );

  const filteredPending = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return pendingList;
    return pendingList.filter((r) =>
      [r.permission, r.requesterName, r.requesterEmail, r.requesterId, r.reason, r.targetLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [pendingList, debouncedSearch]);

  const filteredGrants = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return activeGrants;
    return activeGrants.filter((g) =>
      [g.permission, g.userId, g.targetId, g.duration]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [activeGrants, debouncedSearch]);

  const filteredHistory = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return historyList;
    return historyList.filter((r) =>
      [r.permission, r.status, r.requesterName, r.requesterId, r.reason, r.decisionNote]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [historyList, debouncedSearch]);

  if (!canViewAudit) {
    return (
      <div
        data-testid="access-requests-locked-state"
        className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-lg mx-auto pb-24"
      >
        <GlassCard variant="hero" padding="lg" className="w-full flex flex-col items-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
            <Lock size={28} />
          </div>
          <div className="space-y-2">
            <MonoLabel className="text-amber-400">Super Admin Only · audit.view</MonoLabel>
            <DotHeading as="h1" size="page">
              Access Requests &amp; Grants
            </DotHeading>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Only a <strong className="text-[var(--text)]">Super Admin</strong> can review, approve,
              deny, or revoke Admin permission requests.
            </p>
          </div>

          <AdminButton variant="primary" onClick={() => setRequestAuditOpen(true)}>
            <Lock size={15} />
            <span>Request Audit View Access</span>
          </AdminButton>
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
      await loadAccessRequests(true);
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
      await loadAccessRequests(true);
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to deny request.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmRevokeGrant = async () => {
    if (!revokeTarget || busyId) return;
    const grant = revokeTarget;
    setBusyId(grant.id);
    try {
      await api.post(`/api/admin/access-grants/${encodeURIComponent(grant.id)}/revoke`, {});
      setRevokeTarget(null);
      showApiToast(`Revoked active grant (${grant.permission}).`, 'success');
      await loadAccessRequests(true);
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to revoke grant.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div data-admin-page="access-requests" className="space-y-5 pb-24">
      {/* Question-Bank Hero Card */}
      <GlassCard variant="hero" padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <MonoLabel>Super Admin Governance · Access Control</MonoLabel>
            <DotHeading as="h1" size="page">
              Access Requests &amp; Grants
            </DotHeading>
            <p className="text-[13px] text-[var(--text-muted)] max-w-xl">
              Review temporary permission requests from limited Admins, grant one-time or timed access, or revoke active grants immediately.
            </p>
          </div>

          <AdminButton
            variant="secondary"
            onClick={() => void loadAccessRequests(true)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </AdminButton>
        </div>

        <AdminStatGrid
          columns={4}
          items={[
            {
              label: 'Pending',
              value: loading && !hasLoadedOnce ? '—' : pendingList.length,
              tone: pendingList.length > 0 ? 'accent' : 'default',
              sublabel: 'Awaiting decision',
            },
            {
              label: 'Active Grants',
              value: loading && !hasLoadedOnce ? '—' : activeGrants.length,
              tone: activeGrants.length > 0 ? 'success' : 'default',
              sublabel: 'Live temporary access',
            },
            {
              label: 'History',
              value: loading && !hasLoadedOnce ? '—' : historyList.length,
              sublabel: 'Past decisions',
            },
            {
              label: 'Governance',
              value: isSuperAdmin ? 'Super' : 'Audit',
              sublabel: 'RBAC enforced',
            },
          ]}
        />
      </GlassCard>

      {loadError && (
        <AdminErrorRetryCard
          title="Could not load access requests"
          message={loadError}
          onRetry={() => void loadAccessRequests(true)}
          retrying={loading}
        />
      )}

      {/* Pill Tab Bar + 400ms Debounced Search */}
      <GlassCard variant="glass" padding="md" className="space-y-3.5">
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

        <AdminSearchFilterBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search requester, permission key, target, or reason…"
        />
      </GlassCard>

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {loading && !hasLoadedOnce ? (
            <SkeletonListRows rows={3} />
          ) : filteredPending.length === 0 ? (
            <AdminEmptyState
              icon={<ShieldCheck size={24} />}
              title={
                pendingList.length === 0
                  ? 'No pending access requests'
                  : 'No pending requests match your search'
              }
              description={
                pendingList.length === 0
                  ? 'When a limited Admin requests permission for a locked action, it will appear here for your approval.'
                  : 'Try clearing your search term.'
              }
              action={
                debouncedSearch.trim() && (
                  <AdminButton variant="secondary" onClick={() => setSearchInput('')}>
                    Clear search
                  </AdminButton>
                )
              }
            />
          ) : (
            <>
              {filteredPending.slice(0, visibleCount).map((reqItem) => {
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
                          <code className="text-[10px] font-mono text-[var(--text-muted)] opacity-80">
                            {reqItem.permission}
                          </code>
                        </div>

                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
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

                        <div className="p-3 rounded-[14px] bg-black/25 border border-white/[0.08] text-xs text-[var(--text)]">
                          <span className="text-[var(--text-muted)] font-semibold">Reason: </span>
                          {reqItem.reason}
                        </div>
                      </div>
                    </div>

                    {/* Duration Picker + Approve / Deny Controls */}
                    <div className="pt-3 border-t border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <MonoLabel className="block">Grant Duration</MonoLabel>
                        <div className="inline-flex items-center gap-1.5 flex-wrap">
                          {DURATION_OPTIONS.map((opt) => (
                            <AdminButton
                              key={opt.value}
                              variant={selectedDur === opt.value ? 'primary' : 'pill'}
                              data-testid={`duration-${reqItem.id}-${opt.value}`}
                              onClick={() =>
                                setSelectedDurations((prev) => ({
                                  ...prev,
                                  [reqItem.id]: opt.value,
                                }))
                              }
                              className="!min-h-[36px] !py-1 !px-3 !text-xs font-mono"
                              title={opt.desc}
                            >
                              {opt.label}
                            </AdminButton>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder="Optional note for denial…"
                          value={denyNotes[reqItem.id] || ''}
                          onChange={(e) =>
                            setDenyNotes((prev) => ({ ...prev, [reqItem.id]: e.target.value }))
                          }
                          className="min-h-[40px] px-3 py-2 rounded-[14px] bg-black/30 border border-white/12 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#E8353B]"
                        />

                        <div className="flex items-center gap-2">
                          <AdminButton
                            variant="danger"
                            disabled={isBusy}
                            data-testid={`deny-request-${reqItem.id}`}
                            onClick={() => void handleDeny(reqItem)}
                            className="!min-h-[40px] !py-1.5 !px-3.5 !text-xs"
                          >
                            <XCircle size={14} />
                            <span>Deny</span>
                          </AdminButton>

                          <AdminButton
                            variant="primary"
                            disabled={isBusy}
                            data-testid={`approve-request-${reqItem.id}`}
                            onClick={() => void handleApprove(reqItem)}
                            className="!min-h-[40px] !py-1.5 !px-4 !text-xs"
                          >
                            <CheckCircle2 size={14} />
                            <span>Approve ({selectedDur})</span>
                          </AdminButton>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}

              {filteredPending.length > visibleCount && (
                <div className="pt-2 flex justify-center">
                  <AdminButton
                    variant="secondary"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  >
                    Load more requests ({filteredPending.length - visibleCount} remaining)
                  </AdminButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE GRANTS */}
      {activeTab === 'grants' && (
        <div className="space-y-2.5">
          {loading && !hasLoadedOnce ? (
            <SkeletonListRows rows={3} />
          ) : filteredGrants.length === 0 ? (
            <AdminEmptyState
              icon={<KeyRound size={22} />}
              title="No active temporary grants"
              description="Approved one-time or timed permission grants that have not yet expired or been consumed appear here."
            />
          ) : (
            <>
              {filteredGrants.slice(0, visibleCount).map((grant) => {
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
                        <code className="text-[10px] font-mono text-[var(--text-muted)] opacity-80">
                          {grant.permission}
                        </code>
                        <Pill tone="neutral">Duration: {grant.duration}</Pill>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
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

                    <AdminButton
                      variant="danger"
                      disabled={busyId === grant.id}
                      data-testid={`revoke-grant-${grant.id}`}
                      onClick={() => setRevokeTarget(grant)}
                      className="self-start sm:self-auto !min-h-[40px] !py-1.5 !px-3.5 !text-xs"
                    >
                      <Ban size={13} />
                      <span>Revoke</span>
                    </AdminButton>
                  </GlassCard>
                );
              })}

              {filteredGrants.length > visibleCount && (
                <div className="pt-2 flex justify-center">
                  <AdminButton
                    variant="secondary"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  >
                    Load more grants ({filteredGrants.length - visibleCount} remaining)
                  </AdminButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-2.5">
          {loading && !hasLoadedOnce ? (
            <SkeletonListRows rows={3} />
          ) : filteredHistory.length === 0 ? (
            <AdminEmptyState
              icon={<History size={22} />}
              title="No past access decisions"
              description="Approved, denied, or revoked permission requests will be archived here."
            />
          ) : (
            <>
              {filteredHistory.slice(0, visibleCount).map((item) => {
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
                        <code className="text-[10px] font-mono text-[var(--text-muted)] opacity-80">
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
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            ({item.duration})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Requester:{' '}
                        <strong className="text-[var(--text)]">
                          {item.requesterName || item.requesterId}
                        </strong>{' '}
                        &bull; Reason: &ldquo;{item.reason}&rdquo;
                      </div>
                      {item.decisionNote && (
                        <div className="text-[11px] text-amber-300">
                          Note: {item.decisionNote}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
                      {item.decidedAt
                        ? new Date(item.decidedAt).toLocaleString('en-GB')
                        : new Date(item.createdAt).toLocaleString('en-GB')}
                    </div>
                  </GlassCard>
                );
              })}

              {filteredHistory.length > visibleCount && (
                <div className="pt-2 flex justify-center">
                  <AdminButton
                    variant="secondary"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  >
                    Load more history ({filteredHistory.length - visibleCount} remaining)
                  </AdminButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Migration Verification Summary Card */}
      {migratedAdmins.length > 0 && (
        <GlassCard variant="glass" padding="md" className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
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
                <div className="text-[10px] font-mono text-[var(--text-muted)]">
                  ID: {acc.uid} &bull; Role:{' '}
                  <span className="text-emerald-400">{acc.newRole}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Solid Opaque Revoke Grant Confirmation Dialog */}
      <AdminConfirmDialog
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => void handleConfirmRevokeGrant()}
        title="Revoke active permission grant?"
        description={
          revokeTarget
            ? `Immediately revoke "${revokeTarget.permission}" for admin ${revokeTarget.userId}? They will lose temporary access immediately.`
            : undefined
        }
        confirmLabel="Yes, revoke grant"
        busy={Boolean(busyId)}
        danger
      />
    </div>
  );
};

export default AdminAccessRequestsPage;
