import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Phone,
  Mail,
  Building,
  MapPin,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchCaptainApplications,
  fetchCrewApplications,
  approveCaptainApplication,
  approveCrewApplication,
  rejectApplication,
} from '@/services/adminService';
import {
  getCaptainAllotmentStatus,
  grantCaptainMonthlyAllotment,
  grantAllCaptainsMonthlyAllotment,
  getCurrentPktMonth,
} from '@/services/kobanService';
import { KobanIcon } from '@/components/koban/KobanIcon';
import type { CaptainApplication, CrewApplication } from '@/types';

export function AdminApplicationsPage() {
  const { user } = useAuth();
  const superadminEmail = user?.email || 'shsvirtualadmin@gmail.com';

  const [activeTab, setActiveTab] = useState<'captain' | 'crew'>('captain');
  const [statusFilter, setStatusFilter] = useState('all');
  const [captains, setCaptains] = useState<CaptainApplication[]>([]);
  const [crew, setCrew] = useState<CrewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Captain Monthly Allotment status map { [captainUid]: { granted, date, monthLabel } }
  const [allotmentStatuses, setAllotmentStatuses] = useState<
    Record<string, { granted: boolean; date: Date | null; monthLabel: string }>
  >({});
  const [grantingCaptainId, setGrantingCaptainId] = useState<string | null>(null);
  const [grantAllModalOpen, setGrantAllModalOpen] = useState(false);
  const [grantingAll, setGrantingAll] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Reject modal dialog state
  const [rejectTarget, setRejectTarget] = useState<{
    type: 'captain' | 'crew';
    appId: string;
    uid: string;
    email: string;
    name: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('Criteria not met at this time.');

  const { label: currentMonthLabel } = getCurrentPktMonth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'captain') {
        const data = await fetchCaptainApplications(statusFilter);
        setCaptains(data);

        // Fetch allotment status for approved captains
        const approvedCaps = data.filter((c) => c.status === 'approved');
        const statusMap: Record<string, { granted: boolean; date: Date | null; monthLabel: string }> = {};
        await Promise.all(
          approvedCaps.map(async (c) => {
            const st = await getCaptainAllotmentStatus(c.userId);
            statusMap[c.userId] = st;
          })
        );
        setAllotmentStatuses(statusMap);
      } else {
        const data = await fetchCrewApplications(statusFilter);
        setCrew(data);
      }
    } catch (err) {
      console.warn('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveCaptain = async (app: CaptainApplication) => {
    if (!user?.email) return;
    setActionInProgress(app.id);
    try {
      await approveCaptainApplication(user.email, app);
      await loadData();
    } catch (err) {
      console.error('Approve captain error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveCrew = async (app: CrewApplication) => {
    if (!user?.email) return;
    setActionInProgress(app.id);
    try {
      await approveCrewApplication(user.email, app);
      await loadData();
    } catch (err) {
      console.error('Approve crew error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenReject = (
    type: 'captain' | 'crew',
    appId: string,
    uid: string,
    email: string,
    name: string
  ) => {
    setRejectTarget({ type, appId, uid, email, name });
    setRejectReason('Criteria not met at this time.');
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !user?.email) return;
    setActionInProgress(rejectTarget.appId);
    try {
      await rejectApplication(
        user.email,
        rejectTarget.type,
        rejectTarget.appId,
        rejectTarget.uid,
        rejectTarget.email,
        rejectReason
      );
      setRejectTarget(null);
      await loadData();
    } catch (err) {
      console.error('Reject application error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleGrantCaptainAllotment = async (captainUid: string, captainName: string, captainEmail?: string) => {
    setGrantingCaptainId(captainUid);
    try {
      await grantCaptainMonthlyAllotment(superadminEmail, captainUid, captainName, captainEmail);
      const updatedStatus = await getCaptainAllotmentStatus(captainUid);
      setAllotmentStatuses((prev) => ({ ...prev, [captainUid]: updatedStatus }));
      setBannerNotice(`Granted 5,000 Kobans to ${captainName} for ${currentMonthLabel}.`);
      setTimeout(() => setBannerNotice(null), 3500);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to grant allotment');
    } finally {
      setGrantingCaptainId(null);
    }
  };

  const handleGrantAllApprovedCaptains = async () => {
    const approved = captains.filter((c) => c.status === 'approved');
    setGrantingAll(true);
    try {
      const candidates = approved.map((c) => ({
        captainUid: c.userId,
        captainName: c.name,
        captainEmail: c.email,
      }));
      const res = await grantAllCaptainsMonthlyAllotment(superadminEmail, candidates);
      setGrantAllModalOpen(false);
      setBannerNotice(
        `Monthly allotment credited to ${res.grantedCount} Captains (${res.skippedCount} already granted/skipped).`
      );
      setTimeout(() => setBannerNotice(null), 4000);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to grant all allotments');
    } finally {
      setGrantingAll(false);
    }
  };

  const currentList = activeTab === 'captain' ? captains : crew;
  const approvedCaptainsList = captains.filter((c) => c.status === 'approved');
  const pendingCaptainsForMonth = approvedCaptainsList.filter(
    (c) => !allotmentStatuses[c.userId]?.granted
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="font-dot text-[22px] sm:text-[26px] font-extrabold text-[var(--text)] tracking-tight">
            Applications &amp; Review Queue
          </h1>
          <p className="font-heading text-xs sm:text-[13px] text-[var(--muted)] mt-1">
            Review Campus Captain nominations, verify study crews, and grant monthly leadership Kobans.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {bannerNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-xs font-heading flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* ─── TAB SWITCHER & FILTER CHIPS ────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Segmented Switcher */}
        <div className="flex items-center p-1 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab('captain')}
            className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-medium transition-colors cursor-pointer ${
              activeTab === 'captain'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Campus Captains
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crew')}
            className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-medium transition-colors cursor-pointer ${
              activeTab === 'crew'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Study Crew
          </button>
        </div>

        {/* Right side: Status Filter and Grant All Button */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-between md:justify-end">
          {activeTab === 'captain' && approvedCaptainsList.length > 0 && (
            <button
              type="button"
              onClick={() => setGrantAllModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#E8A317]/15 border border-[#E8A317]/40 text-[#FFD66B] hover:bg-[#E8A317]/25 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <KobanIcon size={14} />
              <span>Grant All Captains ({pendingCaptainsForMonth.length} pending)</span>
            </button>
          )}

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={`text-xs font-heading px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
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

      {/* ─── APPLICATIONS LIST ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3 animate-pulse h-28"
            />
          ))
        ) : currentList.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
            <p className="font-heading text-[14px] text-[var(--muted)]">
              No applications match this filter.
            </p>
          </div>
        ) : (
          currentList.map((app) => {
            const isCaptain = activeTab === 'captain';
            const capApp = app as CaptainApplication;
            const crewApp = app as CrewApplication;
            const isPending = app.status === 'pending';
            const isApproved = app.status === 'approved';
            const isRejected = app.status === 'rejected';

            const capAllotment = isCaptain && isApproved ? allotmentStatuses[app.userId] : null;

            return (
              <div
                key={app.id}
                className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="font-heading font-bold text-sm sm:text-base text-[var(--text)]">
                      {app.name}
                    </h2>
                    <div className="flex items-center gap-3 text-xs font-heading text-[var(--muted)] mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Mail size={12} />
                        <span>{app.email}</span>
                      </span>
                      {app.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={12} />
                          <span>{app.phone}</span>
                        </span>
                      )}
                      {isCaptain && capApp.university && (
                        <span className="flex items-center gap-1">
                          <Building size={12} />
                          <span>{capApp.university}</span>
                        </span>
                      )}
                      {app.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{app.city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border shrink-0 font-bold ${
                      isApproved
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : isRejected
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : 'border-amber-500 bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Statement / Pitch */}
                {(isCaptain ? capApp.motivation : crewApp.whyCrew) && (
                  <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-heading text-[var(--muted)] leading-relaxed">
                    <p className="text-[var(--text)] mb-0.5 font-semibold">Candidate statement:</p>
                    <p>{isCaptain ? capApp.motivation : crewApp.whyCrew}</p>
                  </div>
                )}

                {/* ─── NAKAMA CAPTAIN MONTHLY ALLOTMENT ROW ──────────────────── */}
                {isCaptain && isApproved && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-[rgba(232,163,23,0.08)] to-transparent border border-[rgba(232,163,23,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[var(--text)]">
                        <KobanIcon size={16} />
                        <span>Monthly allotment: 5,000 Kobans</span>
                      </div>
                      <p className="text-[11px] font-mono text-[var(--muted)]">
                        Status for {currentMonthLabel} (PKT):{' '}
                        {capAllotment?.granted ? (
                          <span className="text-emerald-400 font-bold">
                            Granted on{' '}
                            {capAllotment.date?.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              timeZone: 'Asia/Karachi',
                            })}
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold">Pending</span>
                        )}
                      </p>
                    </div>

                    {!capAllotment?.granted && (
                      <button
                        type="button"
                        disabled={grantingCaptainId === app.userId}
                        onClick={() => handleGrantCaptainAllotment(app.userId, app.name, app.email)}
                        className="btn-red text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {grantingCaptainId === app.userId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Sparkles size={13} />
                        )}
                        <span>Grant 5,000 Kobans</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Action Buttons if Pending */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      disabled={actionInProgress === app.id}
                      onClick={() =>
                        handleOpenReject(activeTab, app.id, app.userId, app.email, app.name)
                      }
                      className="px-3.5 py-2 rounded-xl border border-[var(--red)]/40 text-[var(--red)] hover:bg-[var(--card-2)] text-xs font-heading font-medium transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgress === app.id}
                      onClick={() =>
                        isCaptain ? handleApproveCaptain(capApp) : handleApproveCrew(crewApp)
                      }
                      className="px-4 py-2 rounded-xl border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-xs font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {actionInProgress === app.id ? 'Approving...' : 'Approve & grant role'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── MODAL: GRANT TO ALL APPROVED CAPTAINS ─────────────────────────── */}
      {grantAllModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border)]">
              <div className="w-10 h-10 rounded-2xl bg-[#E8A317]/10 border border-[#E8A317]/30 flex items-center justify-center text-[#FFD66B]">
                <KobanIcon size={24} />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-[var(--text)]">
                  Grant to All Approved Captains
                </h3>
                <p className="text-xs text-[var(--muted)] font-mono">{currentMonthLabel} Allotment</p>
              </div>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              This will grant <strong className="text-[#FFD66B] font-mono">5,000 Kobans</strong> to each approved Nakama Captain who has not yet received their monthly allowance for {currentMonthLabel}.
            </p>

            <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] max-h-48 overflow-y-auto divide-y divide-[var(--border)]">
              <span className="text-[10px] uppercase font-mono text-[var(--muted)] block pb-1">
                Captains to Credit ({pendingCaptainsForMonth.length}):
              </span>
              {pendingCaptainsForMonth.length === 0 ? (
                <p className="text-xs text-emerald-400 py-2">
                  All approved captains have already received their {currentMonthLabel} allotment!
                </p>
              ) : (
                pendingCaptainsForMonth.map((c) => (
                  <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-heading font-semibold text-[var(--text)]">{c.name}</span>
                    <span className="font-mono text-[#FFD66B] font-bold">+5,000</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGrantAllModalOpen(false)}
                className="btn-outline flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={grantingAll || pendingCaptainsForMonth.length === 0}
                onClick={handleGrantAllApprovedCaptains}
                className="btn-red flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {grantingAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Confirm &amp; Credit All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT APPLICATION ─────────────────────────────────────── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-[420px] rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-heading font-bold text-base text-[var(--text)]">
                Reject application
              </h3>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="font-heading text-xs text-[var(--muted)] leading-relaxed">
              Rejecting application for <strong className="text-[var(--text)]">{rejectTarget.name}</strong>. Provide an optional message to include in their notification.
            </p>

            <div>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="btn-outline flex-1 py-2 rounded-xl text-xs font-heading font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionInProgress !== null}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 text-xs font-heading font-semibold"
              >
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApplicationsPage;
