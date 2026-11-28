import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  RefreshCw,
  Phone,
  Mail,
  Building,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  GraduationCap,
  Eye,
  Link2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
import { useAuth } from '@/contexts/AuthContext';
import {
  approveCaptainApplication,
  approveCrewApplication,
  rejectApplication,
} from '@/services/adminService';
import {
  getCachedAdminApplications,
  fetchAdminApplicationsSWR,
  invalidateAdminApplicationsCache,
} from '@/services/adminTabCache';
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
import {
  AdminButton,
  AdminEmptyState,
  AdminOverlay,
  AdminSearchFilterBar,
  AdminStatGrid,
  DotHeading,
  Field,
  GlassCard,
  MonoLabel,
  Pill,
  Segmented,
  SkeletonListRows,
  useDebouncedValue,
} from '@/components/admin/AdminGlassPrimitives';
import type { CaptainApplication, CrewApplication } from '@/types';

const APPLICATIONS_PAGE_SIZE = 20;

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

  const initialCache = getCachedAdminApplications();
  const [activeTab, setActiveTab] = useState<'captain' | 'crew'>('captain');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(APPLICATIONS_PAGE_SIZE);

  const [allCaptains, setAllCaptains] = useState<CaptainApplication[]>(
    () => initialCache?.captains ?? []
  );
  const [allCrew, setAllCrew] = useState<CrewApplication[]>(
    () => initialCache?.crew ?? []
  );
  const [loading, setLoading] = useState<boolean>(() => !initialCache);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(() => Boolean(initialCache));
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
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);

  const { label: currentMonthLabel } = getCurrentPktMonth();
  const hasAutoSelectedTabRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const hasOpenModal = Boolean(selectedDetail || grantAllModalOpen || rejectTarget || filtersOpen);
  useBodyScrollLock(hasOpenModal, 'admin-applications-modal');

  const showNotice = useCallback((message: string) => {
    setBannerNotice(message);
    window.setTimeout(() => {
      setBannerNotice((prev) => (prev === message ? null : prev));
    }, 4500);
  }, []);

  const loadAllotmentsForCaptains = useCallback(async (captainData: CaptainApplication[]) => {
    const approvedCaps = captainData.filter(
      (c) => normalizeApplicationStatus(c.status) === 'approved' && Boolean(c.userId)
    );
    if (approvedCaps.length === 0) return;

    const statusMap: Record<string, { granted: boolean; date: Date | null; monthLabel: string }> = {};
    // Bounded batches of 6 to avoid flooding Firestore
    for (let i = 0; i < approvedCaps.length; i += 6) {
      const batch = approvedCaps.slice(i, i + 6);
      await Promise.all(
        batch.map(async (c) => {
          try {
            const st = await getCaptainAllotmentStatus(c.userId);
            statusMap[c.userId] = st;
          } catch {
            // ignore individual allotment lookup errors
          }
        })
      );
    }
    if (isMountedRef.current) {
      setAllotmentStatuses((prev) => ({ ...prev, ...statusMap }));
    }
  }, []);

  const applySnapshot = useCallback(
    (snapshot: { captains: CaptainApplication[]; crew: CrewApplication[] }) => {
      if (!isMountedRef.current) return;
      const captainData = snapshot.captains;
      const crewData = snapshot.crew;
      setAllCaptains(captainData);
      setAllCrew(crewData);
      setHasLoadedOnce(true);

      if (!hasAutoSelectedTabRef.current) {
        hasAutoSelectedTabRef.current = true;
        if (captainData.length === 0 && crewData.length > 0) {
          setActiveTab('crew');
        }
      }
      void loadAllotmentsForCaptains(captainData);
    },
    [loadAllotmentsForCaptains]
  );

  const loadData = useCallback(
    async (force = false) => {
      if (!user || !isAdmin) return;
      const cached = getCachedAdminApplications();
      if (!cached) {
        setLoading(true);
      }
      if (force) {
        invalidateAdminApplicationsCache();
      }
      setError(null);
      try {
        const snapshot = await fetchAdminApplicationsSWR({
          force,
          onUpdate: applySnapshot,
        });
        applySnapshot(snapshot);
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        console.error('[AdminApplicationsPage] Failed to load applications:', err);
        const e = err as Partial<AdminDiagnosticError>;
        setError({
          code: e?.code || 'APPLICATIONS_LOAD_FAILED',
          message: e?.message || 'Failed to load applications. Please retry.',
          collection: 'captainApplications, crewApplications',
          operation: 'loadData',
        });
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [user, isAdmin, applySnapshot]
  );

  useEffect(() => {
    if (!profileLoading && user && isAdmin) {
      void loadData(false);
    }
  }, [profileLoading, user, isAdmin, loadData]);

  // Reset pagination when tab, filter, or search changes
  useEffect(() => {
    setVisibleCount(APPLICATIONS_PAGE_SIZE);
  }, [activeTab, statusFilter, debouncedSearch]);

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
      await loadData(true);
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
      await loadData(true);
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
    setRejectReasonError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      setRejectReasonError('Please provide a short reason for the applicant.');
      return;
    }
    setRejectReasonError(null);
    setActionInProgress(rejectTarget.appId);
    setError(null);
    try {
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
      await loadData(true);
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
      await loadData(true);
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

  const captainPendingCount = useMemo(() => countPendingApplications(allCaptains), [allCaptains]);
  const crewPendingCount = useMemo(() => countPendingApplications(allCrew), [allCrew]);
  const activeAllList = activeTab === 'captain' ? allCaptains : allCrew;

  const currentList = useMemo(() => {
    const byStatus = filterApplicationsByStatus(activeAllList, statusFilter);
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((app) => {
      const cap = app as CaptainApplication;
      const crew = app as CrewApplication;
      const hay = [
        app.name,
        app.email,
        app.phone,
        app.city,
        cap.university,
        crew.college,
        cap.motivation,
        crew.whyCrew,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeAllList, statusFilter, debouncedSearch]);

  const activePendingCount = activeTab === 'captain' ? captainPendingCount : crewPendingCount;

  const approvedCaptainsList = useMemo(
    () => allCaptains.filter((c) => normalizeApplicationStatus(c.status) === 'approved'),
    [allCaptains]
  );
  const pendingCaptainsForMonth = useMemo(
    () => approvedCaptainsList.filter((c) => !allotmentStatuses[c.userId]?.granted),
    [approvedCaptainsList, allotmentStatuses]
  );

  const visibleList = useMemo(
    () => currentList.slice(0, visibleCount),
    [currentList, visibleCount]
  );

  const activeFilterCount = statusFilter !== 'all' ? 1 : 0;

  return (
    <div data-admin-page="applications" className="flex flex-col gap-5 w-full max-w-full overflow-x-hidden pb-24">
      {/* ─── QUESTION-BANK HERO SUMMARY CARD ───────────────────────────────── */}
      <GlassCard variant="hero" padding="lg" className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 min-w-0">
            <MonoLabel>Nakama Admissions Queue</MonoLabel>
            <DotHeading as="h1" size="page">
              Applications &amp; Review
            </DotHeading>
            <p className="text-[13px] text-[var(--text-muted)] max-w-xl">
              Review Campus Captain nominations, verify Study Crew members, and issue monthly leadership Koban allotments.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'captain' && approvedCaptainsList.length > 0 && (
              <AdminButton
                variant="primary"
                onClick={() => setGrantAllModalOpen(true)}
              >
                <KobanIcon size={15} />
                <span>Grant All ({pendingCaptainsForMonth.length} pending)</span>
              </AdminButton>
            )}
            <AdminButton
              variant="secondary"
              onClick={() => void loadData(true)}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </AdminButton>
          </div>
        </div>

        <AdminStatGrid
          columns={4}
          items={[
            {
              label: 'Captain Apps',
              value: loading && !hasLoadedOnce ? '—' : allCaptains.length,
              sublabel: `${approvedCaptainsList.length} approved`,
            },
            {
              label: 'Pending Captains',
              value: loading && !hasLoadedOnce ? '—' : captainPendingCount,
              tone: captainPendingCount > 0 ? 'accent' : 'default',
              sublabel: 'Awaiting review',
            },
            {
              label: 'Study Crew Apps',
              value: loading && !hasLoadedOnce ? '—' : allCrew.length,
              sublabel: 'Community team',
            },
            {
              label: 'Pending Crew',
              value: loading && !hasLoadedOnce ? '—' : crewPendingCount,
              tone: crewPendingCount > 0 ? 'warning' : 'default',
              sublabel: 'Awaiting review',
            },
          ]}
        />
      </GlassCard>

      <AdminDiagnosticBanner
        error={error}
        collectionName={activeTab === 'captain' ? 'captainApplications' : 'crewApplications'}
        onRetry={() => void loadData(true)}
        retrying={loading}
      />

      {bannerNotice && (
        <div className="p-3.5 rounded-[16px] bg-emerald-500/12 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* ─── PILL TAB BAR + SEARCH & FILTERS BAR ───────────────────────────── */}
      <GlassCard variant="glass" padding="md" className="space-y-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Segmented
            ariaLabel="Application categories"
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            options={[
              {
                value: 'captain',
                label: 'Campus Captains',
                count: captainPendingCount,
                icon: <ShieldCheck size={14} />,
              },
              {
                value: 'crew',
                label: 'Study Crew',
                count: crewPendingCount,
                icon: <Users size={14} />,
              },
            ]}
          />

          <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'all', label: `All (${activeAllList.length})` },
                { id: 'pending', label: `Pending (${activePendingCount})` },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map(({ id, label }) => (
              <AdminButton
                key={id}
                variant={statusFilter === id ? 'primary' : 'pill'}
                onClick={() => setStatusFilter(id)}
                className="!min-h-[36px] !py-1.5 !px-3 !text-[12px]"
              >
                {label}
              </AdminButton>
            ))}
          </div>
        </div>

        <AdminSearchFilterBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search applicant name, email, institution, city…"
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />
      </GlassCard>

      {/* ─── APPLICATIONS LIST ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading && !hasLoadedOnce ? (
          <SkeletonListRows rows={5} />
        ) : currentList.length === 0 ? (
          <AdminEmptyState
            icon={<Users size={22} />}
            title="No applications match this view"
            description={
              debouncedSearch.trim() || statusFilter !== 'all'
                ? 'Try clearing your search or switching the status filter.'
                : 'New Campus Captain and Study Crew applications will appear here automatically.'
            }
            action={
              (debouncedSearch.trim() || statusFilter !== 'all') && (
                <AdminButton
                  variant="secondary"
                  onClick={() => {
                    setSearchInput('');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </AdminButton>
              )
            }
          />
        ) : (
          <>
            {visibleList.map((app) => {
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
                <GlassCard
                  key={app.id}
                  variant="flat"
                  padding="md"
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
                  className="hover:border-white/20 transition-colors flex flex-col gap-3.5 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-[15px] text-[var(--text)]">
                          {app.name || app.email || 'Applicant'}
                        </h2>
                        {appliedDate && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)]">
                            <Clock size={11} />
                            <span>{appliedDate}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1 flex-wrap">
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

                    <Pill tone={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}>
                      {normalizedStatus}
                    </Pill>
                  </div>

                  {statementText && (
                    <div className="p-3 rounded-[14px] bg-black/25 border border-white/[0.07] text-xs text-[var(--text-muted)] leading-relaxed">
                      <MonoLabel className="block mb-1">Candidate Statement</MonoLabel>
                      <p className="line-clamp-3 text-[var(--text)]/90">{statementText}</p>
                    </div>
                  )}

                  {isRejected && app.rejectionReason && (
                    <div className="p-3 rounded-[14px] bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                      <span className="font-semibold">Rejection note: </span>
                      <span>{app.rejectionReason}</span>
                    </div>
                  )}

                  {isCaptain && isApproved && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="p-3.5 rounded-[16px] bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)]">
                          <KobanIcon size={16} />
                          <span>Monthly allotment: 5,000 Kobans</span>
                        </div>
                        <p className="text-[11px] font-mono text-[var(--text-muted)]">
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
                        <AdminButton
                          variant="primary"
                          disabled={grantingCaptainId === app.userId}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleGrantCaptainAllotment(app.userId, app.name, app.email);
                          }}
                          className="!min-h-[40px] !py-1.5 !px-3.5 !text-xs shrink-0"
                        >
                          <Sparkles size={13} />
                          <span>{grantingCaptainId === app.userId ? 'Granting…' : 'Grant 5,000 Kobans'}</span>
                          {grantingCaptainId === app.userId && <ButtonLineLoader />}
                        </AdminButton>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.08] flex-wrap">
                    <AdminButton
                      variant="pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetail({ type: activeTab, app });
                      }}
                    >
                      <Eye size={13} />
                      <span>View details</span>
                    </AdminButton>

                    {isPending && (
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AdminButton
                          variant="danger"
                          data-action="reject-application"
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReject(activeTab, app.id, app.userId, app.email, app.name);
                          }}
                          className="!min-h-[40px] !py-1.5 !px-3.5 !text-xs"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </AdminButton>
                        <AdminButton
                          variant="primary"
                          data-action="approve-application"
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            void (isCaptain ? handleApproveCaptain(capApp) : handleApproveCrew(crewApp));
                          }}
                          className="!min-h-[40px] !py-1.5 !px-4 !text-xs"
                        >
                          <CheckCircle2 size={14} />
                          <span>{isBusy ? 'Approving…' : 'Approve'}</span>
                          {isBusy && <ButtonLineLoader />}
                        </AdminButton>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}

            {currentList.length > visibleCount && (
              <div className="pt-2 flex justify-center">
                <AdminButton
                  variant="secondary"
                  onClick={() => setVisibleCount((prev) => prev + APPLICATIONS_PAGE_SIZE)}
                >
                  Load more applications ({currentList.length - visibleCount} remaining)
                </AdminButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── FILTER SHEET (SOLID OPAQUE) ────────────────────────────────────── */}
      <AdminOverlay
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        mode="sheet"
        title="Filter Applications"
        subtitle="Narrow the review queue by decision status"
        maxWidthClass="max-w-[460px]"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => {
                setStatusFilter('all');
                setFiltersOpen(false);
              }}
            >
              Reset
            </AdminButton>
            <AdminButton variant="primary" onClick={() => setFiltersOpen(false)}>
              Apply
            </AdminButton>
          </>
        }
      >
        <div className="space-y-2.5">
          <MonoLabel>Decision Status</MonoLabel>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'all', label: `All (${activeAllList.length})` },
                { id: 'pending', label: `Pending (${activePendingCount})` },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map(({ id, label }) => (
              <AdminButton
                key={id}
                variant={statusFilter === id ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter(id)}
                fullWidth
              >
                {label}
              </AdminButton>
            ))}
          </div>
        </div>
      </AdminOverlay>

      {/* ─── MODAL: APPLICATION DETAILS (SOLID OPAQUE) ─────────────────────── */}
      {(() => {
        if (!selectedDetail) return null;
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
          <AdminOverlay
            open={true}
            onClose={() => setSelectedDetail(null)}
            mode="modal"
            title={app.name || app.email || 'Applicant'}
            subtitle={`${isCaptain ? 'Nakama Campus Captain Application' : 'Study Crew Application'}${appliedDate ? ` • Submitted ${appliedDate}` : ''}`}
            maxWidthClass="max-w-[540px]"
            footer={
              <>
                <AdminButton variant="secondary" onClick={() => setSelectedDetail(null)}>
                  Close
                </AdminButton>
                {isPending && (
                  <>
                    <AdminButton
                      variant="danger"
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
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </AdminButton>
                    <AdminButton
                      variant="primary"
                      data-action="modal-approve-application"
                      disabled={isBusy}
                      onClick={() =>
                        void (isCaptain ? handleApproveCaptain(capApp) : handleApproveCrew(crewApp))
                      }
                    >
                      <CheckCircle2 size={14} />
                      <span>{isBusy ? 'Approving…' : 'Approve & grant role'}</span>
                      {isBusy && <ButtonLineLoader />}
                    </AdminButton>
                  </>
                )}
              </>
            }
          >
            <div data-testid="application-detail-modal" className="space-y-4">
              <div className="flex items-center gap-2">
                <Pill tone={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}>
                  {normalizedStatus}
                </Pill>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-[14px] bg-[#1e1e21] border border-[#2f2f34]">
                  <MonoLabel className="block mb-1">Email</MonoLabel>
                  <span className="font-mono text-[#f5f5f7] break-all">{app.email || '—'}</span>
                </div>
                <div className="p-3 rounded-[14px] bg-[#1e1e21] border border-[#2f2f34]">
                  <MonoLabel className="block mb-1">Phone / WhatsApp</MonoLabel>
                  <span className="font-mono text-[#f5f5f7]">{app.phone || '—'}</span>
                </div>
                <div className="p-3 rounded-[14px] bg-[#1e1e21] border border-[#2f2f34]">
                  <MonoLabel className="block mb-1">
                    {isCaptain ? 'University / College' : 'College / Institution'}
                  </MonoLabel>
                  <span className="text-[#f5f5f7]">{institutionLabel || '—'}</span>
                </div>
                <div className="p-3 rounded-[14px] bg-[#1e1e21] border border-[#2f2f34]">
                  <MonoLabel className="block mb-1">City</MonoLabel>
                  <span className="text-[#f5f5f7]">{app.city || '—'}</span>
                </div>
                {isCaptain && capApp.semester && (
                  <div className="p-3 rounded-[14px] bg-[#1e1e21] border border-[#2f2f34]">
                    <MonoLabel className="block mb-1">Class / Year</MonoLabel>
                    <span className="text-[#f5f5f7]">{capApp.semester}</span>
                  </div>
                )}
                {socialLabel && (
                  <div className="p-3 rounded-[14px] bg-[#1e1e21] border border-[#2f2f34]">
                    <MonoLabel className="block mb-1">Social / Instagram</MonoLabel>
                    <span className="font-mono text-[#f5f5f7] break-all">{socialLabel}</span>
                  </div>
                )}
                {isCaptain && capApp.expectedReach && (
                  <div className="p-3 rounded-[14px] bg-[#1e1e21] border border-[#2f2f34] sm:col-span-2">
                    <MonoLabel className="block mb-1">Expected Reach</MonoLabel>
                    <span className="text-[#f5f5f7]">{capApp.expectedReach}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-[14px] bg-[#1e1e21] border border-[#2f2f34] text-xs space-y-1.5">
                <MonoLabel>Candidate Statement</MonoLabel>
                <p className="text-[#f5f5f7] leading-relaxed whitespace-pre-wrap">
                  {statementText || 'No statement provided.'}
                </p>
              </div>

              {isRejected && app.rejectionReason && (
                <div className="p-3 rounded-[14px] bg-red-500/12 border border-red-500/35 text-xs text-red-300">
                  <span className="font-semibold">Rejection reason: </span>
                  <span>{app.rejectionReason}</span>
                </div>
              )}

              {isApproved && app.approvedBy && (
                <div className="p-3 rounded-[14px] bg-emerald-500/12 border border-emerald-500/35 text-xs text-emerald-300">
                  Approved by <span className="font-mono">{app.approvedBy}</span>
                </div>
              )}
            </div>
          </AdminOverlay>
        );
      })()}

      {/* ─── MODAL: GRANT TO ALL APPROVED CAPTAINS (SOLID OPAQUE) ─────────── */}
      <AdminOverlay
        open={grantAllModalOpen}
        onClose={() => {
          if (!grantingAll) setGrantAllModalOpen(false);
        }}
        mode="modal"
        title="Grant to All Approved Captains"
        subtitle={`${currentMonthLabel} Monthly Allotment`}
        maxWidthClass="max-w-[460px]"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setGrantAllModalOpen(false)}
              disabled={grantingAll}
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={grantingAll || pendingCaptainsForMonth.length === 0}
              onClick={() => void handleGrantAllApprovedCaptains()}
            >
              <Sparkles size={14} />
              <span>{grantingAll ? 'Crediting all captains…' : 'Confirm & Credit All'}</span>
              {grantingAll && <ButtonLineLoader />}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[#d4d4dc] leading-relaxed">
            This will grant <strong className="text-[#FFD66B] font-mono">5,000 Kobans</strong> to each approved Nakama Captain who has not yet received their monthly allowance for {currentMonthLabel}.
          </p>

          <div className="p-3 rounded-[16px] bg-[#1e1e21] border border-[#2f2f34] max-h-52 overflow-y-auto divide-y divide-[#2c2c30]">
            <MonoLabel className="block pb-1.5">
              Captains to Credit ({pendingCaptainsForMonth.length})
            </MonoLabel>
            {pendingCaptainsForMonth.length === 0 ? (
              <p className="text-xs text-emerald-400 py-2">
                All approved captains have already received their {currentMonthLabel} allotment!
              </p>
            ) : (
              pendingCaptainsForMonth.map((c) => (
                <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#f5f5f7]">{c.name}</span>
                  <span className="font-mono text-[#FFD66B] font-bold">+5,000</span>
                </div>
              ))
            )}
          </div>
        </div>
      </AdminOverlay>

      {/* ─── MODAL: REJECT APPLICATION (SOLID OPAQUE) ─────────────────────── */}
      <AdminOverlay
        open={Boolean(rejectTarget)}
        onClose={() => {
          if (actionInProgress === null) setRejectTarget(null);
        }}
        mode="modal"
        title="Reject application"
        subtitle={rejectTarget ? rejectTarget.name || rejectTarget.email : undefined}
        maxWidthClass="max-w-[440px]"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setRejectTarget(null)}
              disabled={actionInProgress !== null}
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={actionInProgress !== null}
              onClick={() => void handleConfirmReject()}
            >
              {actionInProgress !== null ? 'Rejecting…' : 'Confirm rejection'}
            </AdminButton>
          </>
        }
      >
        <div data-testid="application-reject-modal" className="space-y-3.5">
          <p className="text-[13px] text-[#d4d4dc] leading-relaxed">
            Rejecting application for{' '}
            <strong className="text-[#f5f5f7]">
              {rejectTarget?.name || rejectTarget?.email}
            </strong>
            . Provide a short note to include in their notification.
          </p>

          <Field
            label="Rejection reason"
            required
            error={rejectReasonError}
          >
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectReasonError) setRejectReasonError(null);
              }}
              placeholder="Explain why this application was not approved…"
              className="w-full p-3 rounded-[14px] bg-[#1e1e21] border border-[#3a3a3a] text-[13px] text-[#f5f5f7] focus:outline-none focus:border-[#E8353B]"
            />
          </Field>
        </div>
      </AdminOverlay>
    </div>
  );
}

export default AdminApplicationsPage;
