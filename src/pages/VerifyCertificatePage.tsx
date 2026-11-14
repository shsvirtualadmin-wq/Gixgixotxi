import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  ShieldAlert,
  Award,
  ArrowLeft,
  Calendar,
  Hash,
  Users,
  Trophy,
} from 'lucide-react';
import {
  verifyCertificateBySerial,
  type PublicCertificateVerification,
} from '../services/certificateService';
import { formatCertificateDate } from '../lib/certificateRenderer';
import { CertificateRenderer } from '../components/certificates/CertificateRenderer';

/**
 * Public Certificate Verification Page (`boardly.cfd/verify/:serial` and `/verify`).
 * Shows ONLY safe public verification metadata (Student Name, Mock Title, Rank, Score,
 * Issue Date, Serial, and Active/Revoked status). Never exposes signature files or private R2 keys.
 */
export const VerifyCertificatePage: React.FC = () => {
  const { serial: paramSerial } = useParams<{ serial?: string }>();
  const navigate = useNavigate();

  const [serialInput, setSerialInput] = useState(paramSerial || '');
  const [loading, setLoading] = useState(Boolean(paramSerial));
  const [result, setResult] = useState<PublicCertificateVerification | null>(null);

  const runVerification = useCallback(async (targetSerial: string) => {
    const clean = targetSerial.trim().toUpperCase();
    if (!clean) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await verifyCertificateBySerial(clean);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paramSerial) {
      setSerialInput(paramSerial.toUpperCase());
      void runVerification(paramSerial);
    } else {
      setResult(null);
      setLoading(false);
    }
  }, [paramSerial, runVerification]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = serialInput.trim().toUpperCase();
    if (!clean) return;
    navigate(`/verify/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-[82vh] w-full max-w-3xl mx-auto px-4 py-10 sm:py-16 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/grand-line"
          className="inline-flex items-center gap-2 min-h-[44px] text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={14} />
          <span>Back to Grand Line</span>
        </Link>
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
          <span>BOARDLY CREDENTIAL REGISTRY</span>
        </div>
      </div>

      {/* Header & Search Form */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
        <div className="space-y-1.5">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent)]">
            PUBLIC CREDENTIAL VERIFICATION
          </span>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Verify a Boardly Certificate
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Enter a Boardly Grand Line certificate serial number (for example{' '}
            <code className="font-mono text-[var(--text)]">BDLY-GL01-0001</code>) to confirm its authenticity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
              placeholder="BDLY-GL01-0001"
              aria-label="Certificate Serial Number"
              className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] font-mono text-sm text-[var(--text)] uppercase tracking-wider focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Checking Registry...' : 'Verify Serial'}
          </button>
        </form>
      </div>

      {/* Verification Result Card */}
      {loading && (
        <div className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-2">
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)] animate-pulse">
            VERIFYING SERIAL IN BOARDLY CREDENTIAL REGISTRY...
          </div>
        </div>
      )}

      {!loading && result && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
            result.status === 'active'
              ? 'border-emerald-500/40 bg-[var(--surface)]'
              : result.status === 'revoked'
              ? 'border-red-500/40 bg-[var(--surface)]'
              : 'border-[var(--border)] bg-[var(--surface)]'
          }`}
        >
          {/* Status Banner */}
          {result.status === 'active' && (
            <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                      AUTHENTIC &amp; ACTIVE CERTIFICATE
                    </span>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    This certificate was officially issued by Boardly for a finalised Grand Line mock result.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg font-mono text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                STATUS: ACTIVE
              </span>
            </div>
          )}

          {result.status === 'revoked' && (
            <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-400">
                      CERTIFICATE REVOKED
                    </span>
                    <XCircle size={14} className="text-red-400" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    This certificate serial ({result.serial}) has been revoked by Boardly Administration and is no longer valid.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg font-mono text-xs font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                STATUS: REVOKED
              </span>
            </div>
          )}

          {(result.status === 'not_found' || result.status === 'invalid') && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <XCircle size={22} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-[var(--text)]">
                  No Certificate Found for "{result.serial}"
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Please check the serial number printed on the bottom tile of the certificate and try again.
                </p>
              </div>
            </div>
          )}

          {/* Safe Public Record Details (Shown for Active or Revoked records) */}
          {(result.status === 'active' || result.status === 'revoked') && (
            <div className="space-y-5">
              {result.status === 'active' && (
                <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-black/20">
                  <CertificateRenderer
                    serial={result.serial}
                    serialNumber={result.serial}
                    studentName={result.studentName || 'Student'}
                    studentUid={result.studentUid || result.serial}
                    paletteSeed={result.studentUid || result.serial || result.studentName}
                    grandLineId={result.grandLineId || 'default'}
                    grandLineTitle={result.mockTitle || 'Boardly Grand Line Mock'}
                    testTitle={result.mockTitle || 'Boardly Grand Line Mock'}
                    editionLabel={result.editionLabel || 'OFFICIAL MOCK EDITION'}
                    rank={result.rank || 1}
                    score={Math.max(0, Number(result.score ?? 0))}
                    scoreObtained={Math.max(0, Number(result.score ?? 0))}
                    totalQuestions={Math.max(0, Number(result.totalQuestions ?? 0))}
                    totalMarks={Math.max(0, Number(result.totalQuestions ?? 0))}
                    percentage={
                      Number(result.totalQuestions ?? 0) > 0
                        ? Math.round(
                            (Math.max(0, Number(result.score ?? 0)) /
                              Math.max(1, Number(result.totalQuestions ?? 1))) *
                              100
                          )
                        : Math.max(0, Math.min(100, Math.round(Number(result.percentage ?? 0))))
                    }
                    participantsCount={Math.max(1, Number(result.participantsCount || 1))}
                    issuedAt={result.issuedAt || Date.now()}
                    themeId={result.themeId || 'auto'}
                    instanceId={`verify-cert-${result.serial}`}
                    signatoryName={result.signatoryName}
                    signatoryTitle={result.signatoryTitle}
                    signatureDataUrl={result.signatureDataUrl}
                    verifyBaseUrl={
                      typeof window !== 'undefined' ? window.location.origin : 'https://boardly.cfd'
                    }
                  />
                </div>
              )}

              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  RECIPIENT (STUDENT NAME)
                </div>
                <div
                  className="text-2xl sm:text-3xl font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {result.studentName}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <Award size={12} className="text-[var(--accent)]" />
                    <span>GRAND LINE MOCK</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--text)]">
                    {result.mockTitle}
                  </div>
                  {result.editionLabel && (
                    <div className="font-mono text-[11px] text-[var(--text-muted)]">
                      {result.editionLabel}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <Trophy size={12} className="text-[var(--accent)]" />
                    <span>STANDING &amp; SCORE</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--text)]">
                    1st Position (Rank #{result.rank || 1})
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)]">
                    Score: {Math.max(0, Number(result.score ?? 0))}/
                    {Math.max(0, Number(result.totalQuestions ?? 0))} (
                    {Number(result.totalQuestions ?? 0) > 0
                      ? Math.round(
                          (Math.max(0, Number(result.score ?? 0)) /
                            Math.max(1, Number(result.totalQuestions ?? 1))) *
                            100
                        )
                      : Math.max(0, Math.min(100, Math.round(Number(result.percentage ?? 0))))}
                    %)
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <Calendar size={12} className="text-[var(--accent)]" />
                    <span>ISSUE DATE</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--text)]">
                    {result.issuedAt ? formatCertificateDate(result.issuedAt) : 'N/A'}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)]">
                    Finalised Grand Line Result
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <Hash size={12} className="text-[var(--accent)]" />
                    <span>SERIAL &amp; COHORT</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-bold text-[var(--text)]">
                    {result.serial}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)] inline-flex items-center gap-1">
                    <Users size={11} />
                    <span>Ahead of {Number(result.participantsCount || 1).toLocaleString()} participants</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyCertificatePage;
