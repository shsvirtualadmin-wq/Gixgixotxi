import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  RefreshCw,
  Phone,
  Mail,
  Building,
  MapPin,
  X,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  GraduationCap,
  Eye,
  Link2,
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAllApplications,
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
import { useBodyScrollLock } from '@/utils/scrollLock';
import {
  normalizeApplicationStatus,
  extractTimestampMs,
  countPendingApplications,
  filterApplicationsByStatus,
} from '@/lib/applicationStatus';
import type { CaptainApplication, CrewApplication } from '@/types';

function formatAppliedDate(ts: unknown): string | null {
  const ms = extractTimestampMs(ts);
  if (!ms) return null;
  try {
    return new Date(ms).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function AdminApplicationsPage() {
  const { user, isAdmin, profileLoading } = useAuth();
  const reviewerEmail = user?.email || 'shsvirtualadmin@gmail.com';

  const [activeTab, setActiveTab] = useState<'captain' | 'crew'>('captain');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [allCaptains, setAllCaptains] = useState<CaptainApplication[]>([]);
  const [allCrew, setAllCrew] = useState<CrewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminDiagnosticError | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Captain Monthly Allotment status map { [captainUid]: { granted, date, monthLabel } }
  const [allotmentStatuses, setAllotmentStatuses] = useState<
    Record<string, { granted: boolean; date: Date | null; monthLabel: string }>
  >({});
  const [grantingCaptainId, setGrantingCaptainId] = useState<string | null>(null);
  const [grantAllModalOpen, setGrantAllModalOpen] = useState(false);
  const [grantingAll, setGrantingAll] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Detail modal state (opens when clicking an application row)
  const [selectedDetail, setSelectedDetail] = useState<{
    type: 'captain' | 'crew';
    app: CaptainApplication | CrewApplication;
  } | null>(null);

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
  const hasAutoSelectedTabRef = useRef(false);

  const hasOpenModal = Boolean(selectedDetail || grantAllModalOpen || rejectTarget);
  useBodyScrollLock(hasOpenModal, 'admin-applications-modal');

  useEffect(() => {
    if (!hasOpenModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (rejectTarget) {
          setRejectTarget(null);
        } else if (grantAllModalOpen) {
          setGrantAllModalOpen(false);
        } else if (selectedDetail) {
          setSelectedDetail(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasOpenModal, rejectTarget, grantAllModalOpen, selectedDetail]);

  const showNotice = useCallback((message: string) => {
    setBannerNotice(message);
    window.setTimeout(() => {
      setBannerNotice((prev) => (prev === message ? null : prev));
    }, 4500);
  }, []);

  const loadData = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchAllApplications();
      const captainData = snapshot.captains;
      const crewData = snapshot.crew;
      setAllCaptains(captainData);
      setAllCrew(crewData);

      if (!hasAutoSelectedTabRef.current) {
        hasAutoSelectedTabRef.current = true;
        if (captainData.length === 0 && crewData.length > 0) {
          setActiveTab('crew');
        }
      }

      // Fetch allotment status for approved captains
      const approvedCaps = captainData.filter(
        (c) => normalizeApplicationStatus(c.status) === 'approved' && Boolean(c.userId)
      );
      const statusMap: Record<string, { granted: boolean; date: Date | null; monthLabel: string }> = {};
      await Promise.all(
        approvedCaps.map(async (c) => {
          try {
            const st = await getCaptainAllotmentStatus(c.userId);
            statusMap[c.userId] = st;
          } catch {
            // ignore individual allotment lookup errors
          }
        })
      );
      setAllotmentStatuses(statusMap);
    } catch (err: unknown) {
      console.error('[AdminApplicationsPage] Failed to load applications:', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'APPLICATIONS_LOAD_FAILED',
        message: e?.message || 'Failed to load applications. Please retry.',
        collection: 'captainApplications, crewApplications',
        operation: 'loadData',
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!profileLoading && user && isAdmin) {
      void loadData();
    }
  }, [profileLoading, user, isAdmin, loadData]);

  const handleApproveCaptain = async (app: CaptainApplication) => {
    setActionInProgress(app.id);
    setError(null);
    try {
      await approveCaptainApplication(reviewerEmail, app);
      setAllCaptains((prev) =>
        prev.map((item) => (item.id === app.id ? { ...item, status: 'approved', approvedBy: reviewerEmail } : item))
      );
      setSelectedDetail((prev) => (prev?.app.id === app.id ? null : prev));
      showNotice(`Approved ${app.name || app.email} as Campus Captain.`);
      await loadData();
    } catch (err: unknown) {
      console.error('Approve captain error:', err);
      const e = err as { code?: string; message?: string };
      setError({
        code: e?.code || 'APPROVE_CAPTAIN_FAILED',
        message: e?.message || 'Could not approve this captain application. Please retry.',
        collection: 'captainApplications',
        operation: 'approveCaptainApplication',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveCrew = async (app: CrewApplication) => {
    setActionInProgress(app.id);
    setError(null);
    try {
      await approveCrewApplication(reviewerEmail, app);
      setAllCrew((prev) =>
        prev.map((item) => (item.id === app.id ? { ...item, status: 'approved', approvedBy: reviewerEmail } : item))
      );
      setSelectedDetail((prev) => (prev?.app.id === app.id ? null : prev));
      showNotice(`Approved ${app.name || app.email} for Study Crew.`);
      await loadData();
    } catch (err: unknown) {
      console.error('Approve crew error:', err);
      const e = err as { code?: string; message?: string };
      setError({
        code: e?.code || 'APPROVE_CREW_FAILED',
        message: e?.message || 'Could not approve this crew application. Please retry.',
        collection: 'crewApplications',
        operation: 'approveCrewApplication',
      });
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
    if (!rejectTarget) return;
    setActionInProgress(rejectTarget.appId);
    setError(null);
    try {
      const trimmedReason = rejectReason.trim() || 'Criteria not met at this time.';
      await rejectApplication(
        reviewerEmail,
        rejectTarget.type,
        rejectTarget.appId,
        rejectTarget.uid,
        rejectTarget.email,
        trimmedReason
      );
      if (rejectTarget.type === 'captain') {
        setAllCaptains((prev) =>
          prev.map((item) =>
            item.id === rejectTarget.appId
              ? { ...item, status: 'rejected', rejectionReason: trimmedReason }
              : item
          )
        );
      } else {
        setAllCrew((prev) =>
          prev.map((item) =>
            item.id === rejectTarget.appId
              ? { ...item, status: 'rejected', rejectionReason: trimmedReason }
              : item
          )
        );
      }
      setSelectedDetail((prev) => (prev?.app.id === rejectTarget.appId ? null : prev));
      const rejectedName = rejectTarget.name || rejectTarget.email;
      setRejectTarget(null);
      showNotice(`Rejected application for ${rejectedName}.`);
      await loadData();
    } catch (err: unknown) {
      console.error('Reject application error:', err);
      const e = err as { code?: string; message?: string };
      setError({
        code: e?.code || 'REJECT_APPLICATION_FAILED',
        message: e?.message || 'Could not reject this application. Please retry.',
        collection: rejectTarget.type === 'captain' ? 'captainApplications' : 'crewApplications',
        operation: 'rejectApplication',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleGrantCaptainAllotment = async (captainUid: string, captainName: string, captainEmail?: string) => {
    setGrantingCaptainId(captainUid);
    setError(null);
    try {
      await grantCaptainMonthlyAllotment(reviewerEmail, captainUid, captainName, captainEmail);
      const updatedStatus = await getCaptainAllotmentStatus(captainUid);
      setAllotmentStatuses((prev) => ({ ...prev, [captainUid]: updatedStatus }));
      showNotice(`Granted 5,000 Kobans to ${captainName} for ${currentMonthLabel}.`);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError({
        code: e?.code || 'GRANT_ALLOTMENT_FAILED',
        message: e?.message || 'Failed to grant allotment.',
        collection: 'captainApplications',
        operation: 'grantCaptainMonthlyAllotment',
      });
    } finally {
      setGrantingCaptainId(null);
    }
  };

  const handleGrantAllApprovedCaptains = async () => {
    const approved = allCaptains.filter((c) => normalizeApplicationStatus(c.status) === 'approved');
    setGrantingAll(true);
    setError(null);
    try {
      const candidates = approved.map((c) => ({
        captainUid: c.userId,
        captainName: c.name,
        captainEmail: c.email,
      }));
      const res = await grantAllCaptainsMonthlyAllotment(reviewerEmail, candidates);
      setGrantAllModalOpen(false);
      showNotice(
        `Monthly allotment credited to ${res.grantedCount} Captains (${res.skippedCount} already granted/skipped).`
      );
      await loadData();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError({
        code: e?.code || 'GRANT_ALL_ALLOTMENTS_FAILED',
        message: e?.message || 'Failed to grant all allotments.',
        collection: 'captainApplications',
        operation: 'grantAllCaptainsMonthlyAllotment',
      });
    } finally {
      setGrantingAll(false);
    }
  };

  const captainPendingCount = countPendingApplications(allCaptains);
  const crewPendingCount = countPendingApplications(allCrew);
  const activeAllList = activeTab === 'captain' ? allCaptains : allCrew;
  const currentList = filterApplicationsByStatus(activeAllList, statusFilter);
  const activePendingCount = activeTab === 'captain' ? captainPendingCount : crewPendingCount;

  const approvedCaptainsList = allCaptains.filter(
    (c) => normalizeApplicationStatus(c.status) === 'approved'
  );
  const pendingCaptainsForMonth = approvedCaptainsList.filter(
    (c) => !allotmentStatuses[c.userId]?.granted
  );

  return (
    <div data-admin-page="applications" className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden">
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
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <AdminDiagnosticBanner
        error={error}
        collectionName={activeTab === 'captain' ? 'captainApplications' : 'crewApplications'}
        onRetry={loadData}
        retrying={loading}
      />

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
            className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'captain'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>Campus Captains</span>
            {captainPendingCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                {captainPendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crew')}
            className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'crew'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>Study Crew</span>
            {crewPendingCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                {crewPendingCount}
              </span>
            )}
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
            {(
              [
                { id: 'all', label: `All (${activeAllList.length})` },
                { id: 'pending', label: `Pending (${activePendingCount})` },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map(({ id, label }) => (
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
          <LineLoader context="admin" message="Loading candidate applications..." />
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
            const normalizedStatus = normalizeApplicationStatus(app.status);
            const isPending = normalizedStatus === 'pending';
            const isApproved = normalizedStatus === 'approved';
            const isRejected = normalizedStatus === 'rejected';

            const institutionLabel = isCaptain ? capApp.university : crewApp.college;
            const statementText = isCaptain ? capApp.motivation : crewApp.whyCrew;
            const appliedDate = formatAppliedDate(app.createdAt);
            const capAllotment = isCaptain && isApproved ? allotmentStatuses[app.userId] : null;
            const isBusy = actionInProgress === app.id;

            return (
              <div
                key={app.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDetail({ type: activeTab, app })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDetail({ type: activeTab, app });
                  }
                }}
                data-application-row={app.id}
                data-application-status={normalizedStatus}
                className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--text)]/30 transition-colors flex flex-col gap-4 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-heading font-bold text-sm sm:text-base text-[var(--text)]">
                        {app.name || app.email || 'Applicant'}
                      </h2>
                      {appliedDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--muted)]">
                          <Clock size={11} />
                          <span>{appliedDate}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-heading text-[var(--muted)] mt-1 flex-wrap">
                      {app.email && (
                        <span className="flex items-center gap-1 font-mono">
                          <Mail size={12} />
                          <span>{app.email}</span>
                        </span>
                      )}
                      {app.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={12} />
                          <span>{app.phone}</span>
                        </span>
                      )}
                      {institutionLabel && (
                        <span className="flex items-center gap-1">
                          <Building size={12} />
                          <span>{institutionLabel}</span>
                        </span>
                      )}
                      {app.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{app.city}</span>
                        </span>
                      )}
                      {isCaptain && capApp.semester && (
                        <span className="flex items-center gap-1">
                          <GraduationCap size={12} />
                          <span>{capApp.semester}</span>
                        </span>
                      )}
                      {(isCaptain ? capApp.socialLink : crewApp.instagram) && (
                        <span className="flex items-center gap-1 font-mono">
                          <Link2 size={12} />
                          <span>{isCaptain ? capApp.socialLink : crewApp.instagram}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border shrink-0 font-bold ${
                        isApproved
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : isRejected
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-amber-500 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {normalizedStatus}
                    </span>
                  </div>
                </div>

                {/* Statement / Pitch */}
                {statementText && (
                  <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-heading text-[var(--muted)] leading-relaxed">
                    <p className="text-[var(--text)] mb-0.5 font-semibold">Candidate statement:</p>
                    <p className="line-clamp-3">{statementText}</p>
                  </div>
                )}

                {/* Rejection reason if rejected */}
                {isRejected && app.rejectionReason && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs font-heading text-red-300">
                    <span className="font-semibold">Rejection note: </span>
                    <span>{app.rejectionReason}</span>
                  </div>
                )}

                {/* ─── NAKAMA CAPTAIN MONTHLY ALLOTMENT ROW ──────────────────── */}
                {isCaptain && isApproved && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-[rgba(232,163,23,0.08)] to-transparent border border-[rgba(232,163,23,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleGrantCaptainAllotment(app.userId, app.name, app.email);
                        }}
                        className="relative overflow-hidden btn-red text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 shrink-0 min-w-[150px]"
                      >
                        <Sparkles size={13} />
                        <span>{grantingCaptainId === app.userId ? 'Granting...' : 'Grant 5,000 Kobans'}</span>
                        {grantingCaptainId === app.userId && <ButtonLineLoader />}
                      </button>
                    )}
                  </div>
                )}

                {/* Footer Row: View Details + Approve / Reject Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)] flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetail({ type: activeTab, app });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-heading text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>View details</span>
                  </button>

                  {isPending && (
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        data-action="reject-application"
                        disabled={isBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReject(activeTab, app.id, app.userId, app.email, app.name);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        data-action="approve-application"
                        disabled={isBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          void (isCaptain ? handleApproveCaptain(capApp) : handleApproveCrew(crewApp));
                        }}
                        className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-500/60 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm min-w-[130px]"
                      >
                        <CheckCircle2 size={14} />
                        <span>{isBusy ? 'Approving...' : 'Approve'}</span>
                        {isBusy && <ButtonLineLoader />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── MODAL: APPLICATION DETAILS (PORTALED ABOVE LAYOUT TRANSFORM) ──── */}
      {typeof document !== 'undefined' &&
        selectedDetail &&
        createPortal(
          (() => {
            const isCaptain = selectedDetail.type === 'captain';
            const app = selectedDetail.app;
            const capApp = app as CaptainApplication;
            const crewApp = app as CrewApplication;
            const normalizedStatus = normalizeApplicationStatus(app.status);
            const isPending = normalizedStatus === 'pending';
            const isApproved = normalizedStatus === 'approved';
            const isRejected = normalizedStatus === 'rejected';
            const institutionLabel = isCaptain ? capApp.university : crewApp.college;
            const statementText = isCaptain ? capApp.motivation : crewApp.whyCrew;
            const socialLabel = isCaptain ? capApp.socialLink : crewApp.instagram;
            const appliedDate = formatAppliedDate(app.createdAt);
            const isBusy = actionInProgress === app.id;

            return (
              <div
                data-testid="application-detail-modal"
                data-fullscreen-modal="true"
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 overlay-blur bg-black/65 backdrop-blur-md"
                role="dialog"
                aria-modal="true"
                onClick={() => setSelectedDetail(null)}
              >
                <div
                  className="relative w-full max-w-lg rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-bold text-lg text-[var(--text)]">
                          {app.name || app.email || 'Applicant'}
                        </h3>
                        <span
                          className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                            isApproved
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : isRejected
                              ? 'border-red-500 bg-red-500/10 text-red-400'
                              : 'border-amber-500 bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {normalizedStatus}
                        </span>
                      </div>
                      <p className="text-xs font-heading text-[var(--muted)] mt-0.5">
                        {isCaptain ? 'Nakama Campus Captain Application' : 'Study Crew Application'}
                        {appliedDate ? ` • Submitted ${appliedDate}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDetail(null)}
                      className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
                      aria-label="Close application details"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-heading">
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                      <span className="text-[10px] uppercase font-mono text-[var(--muted)] block mb-1">
                        Email
                      </span>
                      <span className="font-mono text-[var(--text)] break-all">{app.email || '—'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                      <span className="text-[10px] uppercase font-mono text-[var(--muted)] block mb-1">
                        Phone / WhatsApp
                      </span>
                      <span className="font-mono text-[var(--text)]">{app.phone || '—'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                      <span className="text-[10px] uppercase font-mono text-[var(--muted)] block mb-1">
                        {isCaptain ? 'University / College' : 'College / Institution'}
                      </span>
                      <span className="text-[var(--text)]">{institutionLabel || '—'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                      <span className="text-[10px] uppercase font-mono text-[var(--muted)] block mb-1">
                        City
                      </span>
                      <span className="text-[var(--text)]">{app.city || '—'}</span>
                    </div>
                    {isCaptain && capApp.semester && (
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)] flex items-center gap-1 mb-1">
                          <GraduationCap size={12} />
                          <span>Class / Year</span>
                        </span>
                        <span className="text-[var(--text)]">{capApp.semester}</span>
                      </div>
                    )}
                    {socialLabel && (
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)] flex items-center gap-1 mb-1">
                          <Link2 size={12} />
                          <span>Social / Instagram</span>
                        </span>
                        <span className="font-mono text-[var(--text)] break-all">{socialLabel}</span>
                      </div>
                    )}
                    {isCaptain && capApp.expectedReach && (
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] sm:col-span-2">
                        <span className="text-[10px] uppercase font-mono text-[var(--muted)] block mb-1">
                          Expected Reach
                        </span>
                        <span className="text-[var(--text)]">{capApp.expectedReach}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-heading space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                      Candidate statement
                    </span>
                    <p className="text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                      {statementText || 'No statement provided.'}
                    </p>
                  </div>

                  {isRejected && app.rejectionReason && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-heading text-red-300">
                      <span className="font-semibold">Rejection reason: </span>
                      <span>{app.rejectionReason}</span>
                    </div>
                  )}

                  {isApproved && app.approvedBy && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-heading text-emerald-300">
                      Approved by <span className="font-mono">{app.approvedBy}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setSelectedDetail(null)}
                      className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-heading font-semibold text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                    >
                      Close
                    </button>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          data-action="modal-reject-application"
                          disabled={isBusy}
                          onClick={() =>
                            handleOpenReject(
                              selectedDetail.type,
                              app.id,
                              app.userId,
                              app.email,
                              app.name
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          data-action="modal-approve-application"
                          disabled={isBusy}
                          onClick={() =>
                            void (isCaptain ? handleApproveCaptain(capApp) : handleApproveCrew(crewApp))
                          }
                          className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-500/60 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm min-w-[140px]"
                        >
                          <CheckCircle2 size={14} />
                          <span>{isBusy ? 'Approving...' : 'Approve & grant role'}</span>
                          {isBusy && <ButtonLineLoader />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })(),
          document.body
        )}

      {/* ─── MODAL: GRANT TO ALL APPROVED CAPTAINS ─────────────────────────── */}
      {typeof document !== 'undefined' &&
        grantAllModalOpen &&
        createPortal(
          <div
            data-fullscreen-modal="true"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            onClick={() => setGrantAllModalOpen(false)}
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
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
                  className="relative overflow-hidden btn-red flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  <span>{grantingAll ? 'Crediting all captains...' : 'Confirm & Credit All'}</span>
                  {grantingAll && <ButtonLineLoader />}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL: REJECT APPLICATION ─────────────────────────────────────── */}
      {typeof document !== 'undefined' &&
        rejectTarget &&
        createPortal(
          <div
            data-testid="application-reject-modal"
            data-fullscreen-modal="true"
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            onClick={() => setRejectTarget(null)}
          >
            <div
              className="relative w-full max-w-[420px] rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="font-heading font-bold text-base text-[var(--text)]">
                  Reject application
                </h3>
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="font-heading text-xs text-[var(--muted)] leading-relaxed">
                Rejecting application for <strong className="text-[var(--text)]">{rejectTarget.name || rejectTarget.email}</strong>. Provide an optional message to include in their notification.
              </p>

              <div>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="btn-outline flex-1 py-2 rounded-xl text-xs font-heading font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionInProgress !== null}
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 text-xs font-heading font-semibold cursor-pointer disabled:opacity-50"
                >
                  {actionInProgress !== null ? 'Rejecting...' : 'Confirm rejection'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default AdminApplicationsPage;
