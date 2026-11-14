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
} from 'lucide-react';
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
import { AdminCertificatesSkeleton } from '../../components/ui/Skeleton';
import { SignatureUploader } from '../../components/certificates/SignatureUploader';
import { ThemePicker } from '../../components/certificates/ThemePicker';
import { formatCertificateDate } from '../../lib/certificateRenderer';
import {
  GrandLineStatusPills,
  GrandLineAdminRowControls,
  useServerSyncedClock,
} from '../../components/admin/GrandLineScheduleSheet';
import { GrandLineTestsAdminSection } from '../../components/admin/GrandLineTestsAdminSection';

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
          text: err?.message || 'Failed to load certificates from Cloudflare D1.',
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
    setBusyId(cert.id);
    setNotice(null);
    try {
      const res = await regenerateCertificateById(cert.id);
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
    setRegeneratingAll(true);
    setNotice(null);
    try {
      const res = await regenerateAllCertificates();
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
    setBusyId(cert.id);
    setNotice(null);
    try {
      const nextStatus = cert.status === 'revoked' ? 'active' : 'revoked';
      await toggleRevokeCertificate(cert.id, nextStatus);
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
    const previousMocks = mocks;
    // Optimistically update UI immediately so big preview and checkmark switch in 0ms
    setMocks((prev) =>
      prev.map((m) => (m.id === mockId ? { ...m, certificateThemeId: themeId } : m))
    );
    setNotice(null);
    try {
      await updateGrandLineCertificateTheme(mockId, themeId);
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
    setBusyId(mock.id);
    setNotice(null);
    try {
      const res = await finaliseGrandLineMockResults(mock.id, mock.certificateThemeId);
      setNotice({
        type: 'success',
        text: `Finalised "${mock.title}" (${res.participantsCount} participants). Issued ${res.issuedCount} new certificate(s), ${res.existingCount} already existed.`,
      });
      await loadData();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent)]">
            GRAND LINE EXCELLENCE CREDENTIALS · CLOUDFLARE D1 + PRIVATE R2
          </div>
          <h1
            className="text-xl sm:text-2xl font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Certificates &amp; Admin Signature
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex-wrap">
          <button
            type="button"
            onClick={() => switchTab('certificates')}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'certificates'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Award size={14} />
            <span>Issued Certificates ({certificates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('themes')}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Palette size={14} />
            <span>Mock Certificate Designs ({mocks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('signature')}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'signature'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <PenTool size={14} />
            <span>Settings &gt; Certificate Signature</span>
          </button>
        </div>
      </div>

      {/* Global Warning Banner when no active signature is set */}
      {!loading && !hasActiveSignature && activeTab !== 'signature' && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
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
        </div>
      )}

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            notice.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
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
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                  className="w-full min-h-[42px] pl-9 pr-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter by certificate status"
                className="min-h-[42px] px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--text)]"
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
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Certificates Table / Cards */}
          {loading && !hasLoadedOnce && certificates.length === 0 ? (
            <AdminCertificatesSkeleton count={4} />
          ) : certificates.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-2">
              <div className="text-sm font-bold text-[var(--text)]">
                No certificates matching your filter
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                When a Grand Line mock's results are finalised, 1st-position certificates appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.slice(0, visibleCount).map((cert) => {
                const isBusy = busyId === cert.id;
                return (
                  <div
                    key={cert.id}
                    className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[var(--accent)]">
                          {cert.serial}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase ${
                            cert.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {cert.status}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[var(--surface-2)] text-[var(--text-muted)]">
                          Theme: {cert.themeId}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[var(--surface-2)] text-[var(--text-muted)]">
                          Sig: v{cert.signatureVersion}
                        </span>
                      </div>

                      <div className="text-sm sm:text-base font-bold text-[var(--text)]">
                        {cert.studentName}{' '}
                        {cert.studentEmail ? (
                          <span className="text-xs font-normal text-[var(--text-muted)]">
                            ({cert.studentEmail})
                          </span>
                        ) : null}
                      </div>

                      <div className="font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
                        <span>Mock: {cert.grandLineTitle}</span>
                        <span>·</span>
                        <span>
                          Score: {cert.score}/{cert.totalQuestions} ({cert.percentage}%)
                        </span>
                        <span>·</span>
                        <span>Participants: {cert.participantsCount}</span>
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
                          })
                        }
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer"
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
                          })
                        }
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={13} />
                        <span>PNG</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleRegenerateOne(cert)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Regenerate with current signature and mock theme"
                      >
                        <RefreshCw size={13} className={isBusy ? 'animate-spin' : ''} />
                        <span>Regenerate</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleToggleRevoke(cert)}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          cert.status === 'revoked'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : 'border-red-500/40 bg-red-500/10 text-red-400'
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
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1"
                      >
                        <span>Verify</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
              {certificates.length > visibleCount && (
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) => prev + CERTIFICATES_PAGE_SIZE)
                    }
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] cursor-pointer"
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
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                SELECT GRAND LINE MOCK ({mocks.length})
              </div>
              {mocks.length === 0 && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                  INTERACTIVE 9-THEME DESIGN PREVIEW MODE
                </span>
              )}
            </div>

            {mocks.length === 0 ? (
              <div className="text-xs text-[var(--text-muted)]">
                No Grand Line mocks have been created yet. You can preview all 9 certificate themes below with your active signature; once a Grand Line mock is created, select it here to save its theme to <code className="font-mono text-[var(--text)]">captain_tests.certificate_theme_id</code>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {mocks.map((mock) => {
                  const isSelected = selectedMock?.id === mock.id;
                  return (
                    <div
                      key={mock.id}
                      onClick={() => setSelectedMockId(mock.id)}
                      className={`p-3.5 rounded-xl border transition-colors cursor-pointer space-y-2 ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs sm:text-sm font-bold text-[var(--text)] line-clamp-1">
                          {mock.title}
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] shrink-0">
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
                        <span>Theme: {mock.certificateThemeId || 'Auto (Unique)'}</span>
                        <span>{mock.resultsFinalised ? 'Finalised' : 'Open'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ThemePicker & Publish/Finalise Action */}
          {selectedMock ? (
            <div className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
              <div className="flex items-start justify-between gap-3 flex-wrap border-b border-[var(--border)] pb-4">
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
                    GRAND LINE MOCK #{String(selectedMock.mockNumber).padStart(2, '0')} · {selectedMock.subject}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)]">
                    {selectedMock.title}
                  </h3>
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
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={14} />
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
            </div>
          ) : (
            <div className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
              <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
                    ALL 9 CERTIFICATE THEMES · LIVE INTERACTIVE PREVIEW
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)]">
                    Boardly Grand Line Mock (Theme Gallery &amp; Live Preview)
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
                  SELECTED: {defaultPreviewThemeId || 'auto (unique per student)'}
                </span>
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
            </div>
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
    </div>
  );
};

export default AdminCertificatesPage;
