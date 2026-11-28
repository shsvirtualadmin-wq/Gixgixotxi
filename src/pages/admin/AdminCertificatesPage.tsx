import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  Search,
  RefreshCw,
  Download,
  ShieldAlert,
  CheckCircle2,
  PenTool,
  Palette,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Ban,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RequestAccessSheet } from '../../components/admin/RequestAccessSheet';
import type { PermissionKey } from '../../constants/permissions';
import {
  downloadCertificateFile,
  regenerateCertificateById,
  regenerateAllCertificates,
  toggleRevokeCertificate,
  finaliseGrandLineMockResults,
  updateGrandLineCertificateTheme,
  type StudentCertificateRecord,
  type AdminSignatureRecord,
  type AdminMockSummary,
} from '../../services/certificateService';
import {
  getCachedAdminCertificates,
  fetchAdminCertificatesSWR,
  invalidateAdminCertificatesCache,
} from '../../services/adminTabCache';
import { SignatureUploader } from '../../components/certificates/SignatureUploader';
import { ThemePicker } from '../../components/certificates/ThemePicker';
import { formatCertificateDate } from '../../lib/certificateRenderer';
import {
  GrandLineStatusPills,
  GrandLineAdminRowControls,
  useServerSyncedClock,
} from '../../components/admin/GrandLineScheduleSheet';
import { GrandLineTestsAdminSection } from '../../components/admin/GrandLineTestsAdminSection';
import {
  DotHeading,
  GlassCard,
  Pill,
  Segmented,
  SkeletonListRows,
} from '../../components/admin/AdminGlassPrimitives';
import { useAdminGlassFlag } from '../../utils/adminGlassFlag';
import {
  formatSignatureLabel,
  formatThemeLabel,
  pluralize,
} from '../../utils/adminLabels';

const CERTIFICATES_PAGE_SIZE = 20;

/**
 * Super-Admin Certificates & Signature Management Page (`/admin/certificates` & `/admin/signatures`).
 * Includes:
 * 1. Issued Certificates list (student, mock, serial, issued date, status), search, Download PDF/PNG,
 *    Regenerate (with current signature & theme), and Revoke/Restore.
 * 2. Grand Line Mock Certificate Design Picker (with live preview + "Auto") & "Finalise & Publish Results".
 * 3. Settings > Certificate Signature manager (upload or draw pad, white-bg removal, light/dark preview, version history).
 */
export const AdminCertificatesPage: React.FC = () => {
  const { enabled: glassEnabled } = useAdminGlassFlag();
  const { hasPermission, refreshActiveGrants } = useAuth();
  const canIssueCerts = hasPermission('certificates.issue');
  const [confirmRevokeCert, setConfirmRevokeCert] = useState<StudentCertificateRecord | null>(null);
  const [requestAccessModal, setRequestAccessModal] = useState<{
    permission: PermissionKey;
    actionLabel: string;
    targetId?: string | null;
    targetLabel?: string | null;
  } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const nowMs = useServerSyncedClock(1000);
  const initialTab =
    searchParams.get('tab') === 'signature'
      ? 'signature'
      : searchParams.get('tab') === 'themes'
      ? 'themes'
      : 'certificates';

  const initialCertsCache = getCachedAdminCertificates();
  const [activeTab, setActiveTab] = useState<'certificates' | 'themes' | 'signature'>(
    initialTab
  );
  const [loading, setLoading] = useState<boolean>(() => !initialCertsCache);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(() => Boolean(initialCertsCache));
  const [visibleCount, setVisibleCount] = useState<number>(CERTIFICATES_PAGE_SIZE);
  const [hasActiveSignature, setHasActiveSignature] = useState<boolean>(
    () => Boolean(initialCertsCache?.hasActiveSignature)
  );
  const [activeSignature, setActiveSignature] = useState<AdminSignatureRecord | null>(
    () => initialCertsCache?.activeSignature ?? null
  );
  const [certificates, setCertificates] = useState<StudentCertificateRecord[]>(
    () => initialCertsCache?.certificates ?? []
  );
  const [mocks, setMocks] = useState<AdminMockSummary[]>(
    () => initialCertsCache?.mocks ?? []
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [selectedMockId, setSelectedMockId] = useState<string>(
    () => initialCertsCache?.mocks?.[0]?.id || ''
  );
  const [defaultPreviewThemeId, setDefaultPreviewThemeId] = useState<string | null>('default');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSignatureChanged = useCallback((sig: AdminSignatureRecord | null) => {
    setHasActiveSignature(Boolean(sig));
    setActiveSignature(sig);
    invalidateAdminCertificatesCache();
  }, []);

  const applyCertsData = useCallback(
    (res: {
      hasActiveSignature: boolean;
      activeSignature: AdminSignatureRecord | null;
      certificates: StudentCertificateRecord[];
      mocks: AdminMockSummary[];
    }) => {
      if (!isMountedRef.current) return;
      setHasActiveSignature(Boolean(res.hasActiveSignature));
      setActiveSignature(res.activeSignature || null);
      setCertificates(Array.isArray(res.certificates) ? res.certificates : []);
      const mockList = Array.isArray(res.mocks) ? res.mocks : [];
      setMocks(mockList);
      if (mockList.length > 0) {
        setSelectedMockId((prev) => prev || mockList[0].id);
      }
      setHasLoadedOnce(true);
    },
    []
  );

  const loadData = useCallback(
    async (force = false) => {
      const cached = getCachedAdminCertificates({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (!cached) {
        setLoading(true);
      }
      if (force) {
        invalidateAdminCertificatesCache();
      }
      try {
        const res = await fetchAdminCertificatesSWR({
          search: searchQuery || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          force,
          onUpdate: applyCertsData,
        });
        applyCertsData(res);
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setNotice({
          type: 'error',
          text: err?.message || 'Failed to load certificates.',
        });
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [searchQuery, statusFilter, applyCertsData]
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const switchTab = (tab: 'certificates' | 'themes' | 'signature') => {
    setActiveTab(tab);
    setSearchParams(tab === 'certificates' ? {} : { tab });
  };

  const handleRegenerateOne = async (cert: StudentCertificateRecord) => {
    if (!hasPermission('certificates.issue', cert.id)) {
      setRequestAccessModal({
        permission: 'certificates.issue',
        actionLabel: `Regenerate certificate ${cert.serial}`,
        targetId: cert.id,
        targetLabel: `${cert.studentName} (${cert.serial})`,
      });
      return;
    }
    setBusyId(cert.id);
    setNotice(null);
    try {
      const res = await regenerateCertificateById(cert.id);
      refreshActiveGrants().catch(() => {});
      setNotice({
        type: 'success',
        text: `Regenerated ${res.certificate.serial} with signature v${res.certificate.signatureVersion}.`,
      });
      await loadData();
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err?.message || 'Failed to regenerate certificate.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerateAll = async () => {
    if (!canIssueCerts) {
      setRequestAccessModal({
        permission: 'certificates.issue',
        actionLabel: 'Regenerate all certificates',
      });
      return;
    }
    setRegeneratingAll(true);
    setNotice(null);
    try {
      const res = await regenerateAllCertificates();
      refreshActiveGrants().catch(() => {});
      const count = res.regenerated ?? res.regeneratedCount ?? 0;
      setNotice({
        type: 'success',
        text:
          res.total === 0 && count === 0
            ? `0 certificates needed regeneration (all active certificates already use signature v${res.signatureVersion || activeSignature?.version || 1}).`
            : `Regenerated ${count} of ${res.total} certificate(s) with signature v${res.signatureVersion || activeSignature?.version || 1}${
                res.failed ? ` (${res.failed} failed)` : ''
              }.`,
      });
      await loadData();
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err?.message || 'Failed to regenerate all certificates.',
      });
    } finally {
      setRegeneratingAll(false);
    }
  };

  const handleToggleRevoke = async (cert: StudentCertificateRecord) => {
    if (!hasPermission('certificates.issue', cert.id)) {
      setRequestAccessModal({
        permission: 'certificates.issue',
        actionLabel: `${cert.status === 'revoked' ? 'Restore' : 'Revoke'} certificate ${cert.serial}`,
        targetId: cert.id,
        targetLabel: `${cert.studentName} (${cert.serial})`,
      });
      return;
    }
    setBusyId(cert.id);
    setNotice(null);
    try {
      const nextStatus = cert.status === 'revoked' ? 'active' : 'revoked';
      await toggleRevokeCertificate(cert.id, nextStatus);
      refreshActiveGrants().catch(() => {});
      setNotice({
        type: 'success',
        text: `Certificate ${cert.serial} is now ${nextStatus.toUpperCase()}.`,
      });
      await loadData();
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err?.message || 'Failed to update certificate status.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleMockThemeChange = async (mockId: string, themeId: string | null) => {
    if (!hasPermission('certificates.issue', mockId)) {
      setRequestAccessModal({
        permission: 'certificates.issue',
        actionLabel: 'Change mock certificate theme',
        targetId: mockId,
      });
      return;
    }
    const previousMocks = mocks;
    // Optimistically update UI immediately so big preview and checkmark switch in 0ms
    setMocks((prev) =>
      prev.map((m) => (m.id === mockId ? { ...m, certificateThemeId: themeId } : m))
    );
    setNotice(null);
    try {
      await updateGrandLineCertificateTheme(mockId, themeId);
      refreshActiveGrants().catch(() => {});
      setNotice({
        type: 'success',
        text: `Saved certificate theme "${themeId || 'Auto (Unique per student)'}" for mock.`,
      });
    } catch (err: any) {
      setMocks(previousMocks);
      setNotice({
        type: 'error',
        text: err?.message || 'Failed to update mock certificate theme.',
      });
    }
  };

  const handleFinaliseMock = async (mock: AdminMockSummary) => {
    if (!hasPermission('certificates.issue', mock.id)) {
      setRequestAccessModal({
        permission: 'certificates.issue',
        actionLabel: `Issue 1st Position Certificate for "${mock.title}"`,
        targetId: mock.id,
        targetLabel: mock.title,
      });
      return;
    }
    setBusyId(mock.id);
    setNotice(null);
    try {
      const res = await finaliseGrandLineMockResults(mock.id, mock.certificateThemeId);
      refreshActiveGrants().catch(() => {});
      setNotice({
        type: 'success',
        text: `Finalised "${mock.title}" (${res.participantsCount} participants). Issued ${res.issuedCount} new certificate(s), ${res.existingCount} already existed.`,
      });
      await loadData(true);
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err?.message || 'Failed to finalise Grand Line mock results.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const selectedMock = mocks.find((m) => m.id === selectedMockId) || mocks[0] || null;

  return (
    <div data-admin-page="certificates" className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-[#E8353B] font-semibold">
            Grand Line Excellence Credentials
          </div>
          <DotHeading as="h1" size="page" className="mt-0.5">
            Certificates &amp; Admin Signature
          </DotHeading>
        </div>

        {/* Navigation Tabs */}
        <Segmented
          ariaLabel="Certificate management sections"
          value={activeTab}
          onChange={switchTab}
          options={[
            {
              value: 'certificates',
              label: 'Issued',
              count: certificates.length,
              icon: <Award size={14} />,
            },
            {
              value: 'themes',
              label: 'Mock Designs',
              count: mocks.length,
              icon: <Palette size={14} />,
            },
            {
              value: 'signature',
              label: 'Signature',
              icon: <PenTool size={14} />,
            },
          ]}
        />
      </div>

      {/* Global Warning Banner when no active signature is set */}
      {!loading && !hasActiveSignature && activeTab !== 'signature' && (
        <GlassCard
          variant="glass"
          padding="sm"
          className="border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-[var(--text)]">
                Add your signature to finish certificates
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                No admin signature is currently active. Upload or draw your signature once so every Grand Line certificate includes it automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => switchTab('signature')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:opacity-90 cursor-pointer"
          >
            Open Signature Manager
          </button>
        </GlassCard>
      )}

      {notice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
            notice.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 size={15} />
            ) : (
              <ShieldAlert size={15} />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: ISSUED CERTIFICATES LIST */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {/* Search, Filter & Regenerate All Bar */}
          <GlassCard
            variant="glass"
            padding="sm"
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
          >
            <div className="flex flex-1 items-center gap-2.5 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student, serial (BDLY-GL01-0001), or mock..."
                  className="w-full min-h-[42px] pl-9 pr-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 text-xs text-[var(--text)] focus:outline-none focus:border-[#E8353B]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter by certificate status"
                className="min-h-[42px] px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 text-xs text-[var(--text)]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="revoked">Revoked Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => void handleRegenerateAll()}
                disabled={regeneratingAll || certificates.length === 0}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)]/60 text-xs font-semibold text-[var(--text)] hover:border-[#E8353B] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={13} className={regeneratingAll ? 'animate-spin' : ''} />
                <span>
                  {regeneratingAll
                    ? 'Regenerating All...'
                    : 'Regenerate All with Current Signature'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void loadData(true)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)]/60 text-xs font-semibold text-[var(--text)] hover:border-[#E8353B] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </GlassCard>

          {/* Certificates List (flat translucent rows — zero backdrop-filter inside list) */}
          {loading && !hasLoadedOnce && certificates.length === 0 ? (
            <SkeletonListRows rows={4} />
          ) : certificates.length === 0 ? (
            <GlassCard variant="flat" padding="lg" className="text-center space-y-2">
              <div className="text-sm font-bold text-[var(--text)]">
                No certificates matching your filter
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                When a Grand Line mock&apos;s results are finalised, 1st-position certificates appear here automatically.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-2.5">
              {certificates.slice(0, visibleCount).map((cert) => {
                const isBusy = busyId === cert.id;
                return (
                  <GlassCard
                    key={cert.id}
                    variant="flat"
                    padding="sm"
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#E8353B]">
                          {cert.serial}
                        </span>
                        <Pill tone={cert.status === 'active' ? 'success' : 'danger'}>
                          {cert.status === 'active' ? 'Active' : 'Revoked'}
                        </Pill>
                        <Pill tone="neutral" title={cert.themeId}>
                          Theme: {formatThemeLabel(cert.themeId)}
                        </Pill>
                        <Pill tone="neutral">
                          {formatSignatureLabel(cert.signatureVersion)}
                        </Pill>
                      </div>

                      <div className="text-sm sm:text-base font-bold text-[var(--text)]">
                        {cert.studentName}{' '}
                        {cert.studentEmail ? (
                          <span className="text-xs font-normal text-[var(--text-muted)]">
                            ({cert.studentEmail})
                          </span>
                        ) : null}
                      </div>

                      <div className="font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-2 flex-wrap ag-tabular">
                        <span>Mock: {cert.grandLineTitle}</span>
                        <span>·</span>
                        <span>
                          Score: {cert.score}/{cert.totalQuestions} (
                          {cert.totalQuestions > 0
                            ? Math.round((cert.score / cert.totalQuestions) * 100)
                            : cert.percentage}
                          %)
                        </span>
                        <span>·</span>
                        <span>{pluralize(cert.participantsCount, 'participant')}</span>
                        <span>·</span>
                        <span>Issued: {formatCertificateDate(cert.issuedAt)}</span>
                      </div>
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          void downloadCertificateFile({
                            certificateId: cert.id,
                            serial: cert.serial,
                            format: 'pdf',
                            signedUrl: cert.downloadPdfUrl,
                            certificate: cert,
                          })
                        }
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void downloadCertificateFile({
                            certificateId: cert.id,
                            serial: cert.serial,
                            format: 'png',
                            signedUrl: cert.downloadPngUrl,
                            certificate: cert,
                          })
                        }
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]/60 text-xs font-semibold text-[var(--text)] hover:border-[#E8353B] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Download size={13} />
                        <span>PNG</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleRegenerateOne(cert)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]/60 text-xs font-semibold text-[var(--text)] hover:border-[#E8353B] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                        title="Regenerate with current signature and mock theme"
                      >
                        <RefreshCw size={13} className={isBusy ? 'animate-spin' : ''} />
                        <span>Regenerate</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (cert.status === 'revoked') {
                            void handleToggleRevoke(cert);
                          } else {
                            setConfirmRevokeCert(cert);
                          }
                        }}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          cert.status === 'revoked'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {cert.status === 'revoked' ? (
                          <>
                            <RotateCcw size={13} />
                            <span>Restore</span>
                          </>
                        ) : (
                          <>
                            <Ban size={13} />
                            <span>Revoke</span>
                          </>
                        )}
                      </button>

                      <Link
                        to={`/verify/${encodeURIComponent(cert.serial)}`}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]/60 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1"
                      >
                        <span>Verify</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </GlassCard>
                );
              })}
              {certificates.length > visibleCount && (
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) => prev + CERTIFICATES_PAGE_SIZE)
                    }
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)]/60 text-xs font-semibold text-[var(--text)] hover:border-[#E8353B] cursor-pointer transition-colors"
                  >
                    Load more certificates ({certificates.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRAND LINE MOCK CERTIFICATE DESIGN PICKER & FINALISE RESULTS */}
      {activeTab === 'themes' && (
        <div className="space-y-5">
          {/* Full Schedule & Status Control for all Grand Line Mocks */}
          <GrandLineTestsAdminSection />

          {/* Mock Selector Strip */}
          <GlassCard variant="glass" padding="md" className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <DotHeading as="h2" size="section">
                Select Grand Line Mock ({mocks.length})
              </DotHeading>
              {mocks.length === 0 && (
                <Pill tone="accent">9-theme preview mode</Pill>
              )}
            </div>

            {mocks.length === 0 ? (
              <div className="text-xs text-[var(--text-muted)]">
                No Grand Line mocks have been created yet. You can preview all 9 certificate themes below with your active signature; once a Grand Line mock is created, select it here to save its certificate theme.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {mocks.map((mock) => {
                  const isSelected = selectedMock?.id === mock.id;
                  return (
                    <div
                      key={mock.id}
                      onClick={() => setSelectedMockId(mock.id)}
                      className={`p-3.5 rounded-[16px] border transition-colors cursor-pointer space-y-2 ${
                        isSelected
                          ? 'border-[#E8353B] bg-[#E8353B]/8'
                          : 'ag-flat-card hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs sm:text-sm font-bold text-[var(--text)] line-clamp-1">
                          {mock.title}
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[var(--bg)]/70 border border-[var(--border)] text-[var(--text-muted)] shrink-0">
                          GL#{String(mock.mockNumber).padStart(2, '0')}
                        </span>
                      </div>

                      <GrandLineStatusPills
                        test={mock}
                        nowMs={nowMs}
                        showWindow={true}
                        showCountdown={true}
                        compact={true}
                      />

                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--text-muted)]">
                        <span>
                          Theme:{' '}
                          {mock.certificateThemeId
                            ? formatThemeLabel(mock.certificateThemeId)
                            : 'Auto (Unique)'}
                        </span>
                        <span>{mock.resultsFinalised ? 'Finalised' : 'Open'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* ThemePicker & Publish/Finalise Action */}
          {selectedMock ? (
            <GlassCard variant="glass" padding="lg" className="space-y-5">
              <div className="flex items-start justify-between gap-3 flex-wrap border-b border-[var(--border)] pb-4">
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#E8353B] font-semibold">
                    Grand Line Mock #{String(selectedMock.mockNumber).padStart(2, '0')} · {selectedMock.subject}
                  </div>
                  <DotHeading as="h3" size="section">
                    {selectedMock.title}
                  </DotHeading>
                  <GrandLineStatusPills
                    test={selectedMock}
                    nowMs={nowMs}
                    showWindow={true}
                    showCountdown={true}
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <GrandLineAdminRowControls
                    test={selectedMock}
                    nowMs={nowMs}
                    onUpdated={(updated) => {
                      const nextFinalised =
                        updated.statusMode === 'forceEnded'
                          ? true
                          : updated.statusMode === 'forceLive'
                          ? false
                          : Boolean(updated.resultsFinalised ?? selectedMock.resultsFinalised);
                      setMocks((prev) =>
                        prev.map((m) =>
                          m.id === updated.id
                            ? {
                                ...m,
                                startAt: updated.startAt,
                                endAt: updated.endAt,
                                statusMode: updated.statusMode,
                                reason: updated.reason,
                                forceCloseAttemptsAt: updated.forceCloseAttemptsAt,
                                effectiveStatus: updated.effectiveStatus,
                                resultsFinalised: nextFinalised,
                              }
                            : m
                        )
                      );
                    }}
                  />

                  <button
                    type="button"
                    disabled={busyId === selectedMock.id}
                    onClick={() => void handleFinaliseMock(selectedMock)}
                    className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors ${
                      hasPermission('certificates.issue', selectedMock.id)
                        ? 'bg-[#E8353B] hover:bg-[#D4292F] text-white'
                        : 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 opacity-85'
                    }`}
                  >
                    {hasPermission('certificates.issue', selectedMock.id) ? (
                      <Sparkles size={14} />
                    ) : (
                      <Lock size={14} />
                    )}
                    <span>
                      {busyId === selectedMock.id
                        ? 'Finalising & Issuing...'
                        : selectedMock.resultsFinalised
                        ? 'Re-check & Issue 1st Position Certificates'
                        : 'Publish Results & Issue 1st Position Certificate'}
                    </span>
                  </button>
                </div>
              </div>

              <ThemePicker
                grandLineId={selectedMock.id}
                grandLineTitle={selectedMock.title}
                value={selectedMock.certificateThemeId}
                onChange={(nextThemeId) =>
                  void handleMockThemeChange(selectedMock.id, nextThemeId)
                }
                signatoryName={
                  activeSignature?.signatoryName || 'Boardly Examination Council'
                }
                signatoryTitle={activeSignature?.signatoryTitle || 'Founder, Boardly'}
                signatureDataUrl={activeSignature?.previewDataUrl || null}
              />
            </GlassCard>
          ) : (
            <GlassCard variant="glass" padding="lg" className="space-y-5">
              <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#E8353B] font-semibold">
                    All 9 Certificate Themes · Live Interactive Preview
                  </div>
                  <DotHeading as="h3" size="section" className="mt-0.5">
                    Boardly Grand Line Mock (Theme Gallery)
                  </DotHeading>
                </div>
                <Pill tone="neutral">
                  Selected: {defaultPreviewThemeId ? formatThemeLabel(defaultPreviewThemeId) : 'Auto (Unique)'}
                </Pill>
              </div>

              <ThemePicker
                grandLineId="gl_mock_01"
                grandLineTitle="Boardly Grand Line Mock"
                value={defaultPreviewThemeId}
                onChange={(nextThemeId) => setDefaultPreviewThemeId(nextThemeId)}
                signatoryName={
                  activeSignature?.signatoryName || 'Boardly Examination Council'
                }
                signatoryTitle={activeSignature?.signatoryTitle || 'Founder, Boardly'}
                signatureDataUrl={activeSignature?.previewDataUrl || null}
              />
            </GlassCard>
          )}
        </div>
      )}

      {/* TAB 3: SETTINGS > CERTIFICATE SIGNATURE */}
      {activeTab === 'signature' && (
        <SignatureUploader
          initialActiveSignature={activeSignature}
          onSignatureChanged={handleSignatureChanged}
        />
      )}

      {/* Revoke Certificate Confirm Modal */}
      {confirmRevokeCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm certificate revocation"
          data-admin-glass-portal={glassEnabled ? '1' : '0'}
          onClick={() => setConfirmRevokeCert(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${
              glassEnabled
                ? 'ag-sheet-panel rounded-[22px]'
                : 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl'
            } w-full max-w-md p-6 space-y-4`}
          >
            <DotHeading as="h3" size="section">
              Revoke certificate?
            </DotHeading>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              This will mark certificate{' '}
              <code className="font-mono font-bold text-[var(--text)]">{confirmRevokeCert.serial}</code>{' '}
              for <strong className="text-[var(--text)]">{confirmRevokeCert.studentName}</strong> as revoked on the public verification page. You can restore it later.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRevokeCert(null)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = confirmRevokeCert;
                  setConfirmRevokeCert(null);
                  void handleToggleRevoke(target);
                }}
                className="rounded-xl bg-[#E8353B] hover:bg-[#D4292F] px-4 py-2 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Yes, revoke certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {requestAccessModal && (
        <RequestAccessSheet
          open={Boolean(requestAccessModal)}
          onClose={() => setRequestAccessModal(null)}
          permission={requestAccessModal.permission}
          actionLabel={requestAccessModal.actionLabel}
          targetId={requestAccessModal.targetId}
          targetLabel={requestAccessModal.targetLabel}
        />
      )}
    </div>
  );
};

export default AdminCertificatesPage;

