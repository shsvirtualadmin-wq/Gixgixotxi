import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  fetchMyCertificates,
  type StudentCertificateRecord,
} from '../../services/certificateService';
import { getMyTestAttempts } from '../../services/ambassadorTestService';
import { CertificateCard } from '../../components/certificates/CertificateCard';
import { CertificatesSectionSkeleton } from '../../components/ui/Skeleton';
import { readSwrCache, writeSwrCache } from '../../lib/swrCache';
import { useAuth } from '../../contexts/AuthContext';

export interface MyCertificatesSectionProps {
  compact?: boolean;
}

const CERTIFICATES_CACHE_KEY = 'certificates:my:v2';

/**
 * Reusable "My Certificates" section for the Student Dashboard (Overview, Profile, and /dashboard/certificates).
 */
export const MyCertificatesSection: React.FC<MyCertificatesSectionProps> = ({
  compact = false,
}) => {
  const { user, profile } = useAuth();
  const initialCached = useMemo(
    () => readSwrCache<StudentCertificateRecord[]>(CERTIFICATES_CACHE_KEY),
    []
  );
  const [certificates, setCertificates] = useState<StudentCertificateRecord[]>(
    () => initialCached?.data ?? []
  );
  const [loading, setLoading] = useState(() => !initialCached);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCertificates = useCallback(
    async (background = false) => {
      if (!background) {
        setLoading(true);
      }
      setErrorMsg(null);
      try {
        const [rows, myAttempts] = await Promise.all([
          fetchMyCertificates(),
          getMyTestAttempts().catch(() => []),
        ]);

        const fallbackProfileName = String(
          (profile as any)?.full_name ||
            (profile as any)?.fullName ||
            profile?.displayName ||
            user?.displayName ||
            profile?.username ||
            ''
        ).trim();

        const enrichedRows = rows.map((cert) => {
          let score = Math.max(0, Number(cert.scoreObtained ?? cert.score ?? 0));
          let totalQuestions = Math.max(
            0,
            Number(cert.totalMarks ?? cert.totalQuestions ?? 0)
          );
          let studentName = String(cert.studentName || '').trim();

          // Cross-check with student's best verified attempt for this mock if score is 0
          const matchingAttempts = Array.isArray(myAttempts)
            ? myAttempts.filter((a) => a.test_id === cert.grandLineId)
            : [];
          if (matchingAttempts.length > 0) {
            const bestAttempt = [...matchingAttempts].sort(
              (a, b) => Number(b.score || 0) - Number(a.score || 0)
            )[0];
            if (bestAttempt) {
              const attemptScore = Math.max(0, Number(bestAttempt.score || 0));
              const attemptTotal = Math.max(
                0,
                Number(bestAttempt.total_questions || totalQuestions || 0)
              );
              if (score === 0 && attemptScore > 0) {
                score = attemptScore;
              }
              if (attemptTotal > 0 && (totalQuestions === 0 || totalQuestions === 100)) {
                totalQuestions = attemptTotal;
              }
              if (
                (!studentName || studentName.toLowerCase() === 'student') &&
                bestAttempt.user_name &&
                bestAttempt.user_name.toLowerCase() !== 'student'
              ) {
                studentName = bestAttempt.user_name;
              }
            }
          }

          if (
            (!studentName ||
              studentName.toLowerCase() === 'student' ||
              studentName.toLowerCase() === 'ayesha rahman khan') &&
            fallbackProfileName
          ) {
            studentName = fallbackProfileName;
          }

          const percentage =
            totalQuestions > 0
              ? Math.max(0, Math.min(100, Math.round((score / totalQuestions) * 100)))
              : Math.max(0, Math.min(100, Math.round(Number(cert.percentage ?? 0))));

          return {
            ...cert,
            studentName: studentName || 'Student',
            score,
            scoreObtained: score,
            totalQuestions,
            totalMarks: totalQuestions,
            percentage,
          };
        });

        setCertificates(enrichedRows);
        writeSwrCache(CERTIFICATES_CACHE_KEY, enrichedRows, {
          freshTtlMs: 60_000,
          maxStaleMs: 15 * 60_000,
          persist: true,
        });
      } catch (err: any) {
        if (!background) {
          setErrorMsg(err?.message || 'Unable to load your certificates right now.');
        }
      } finally {
        setLoading(false);
      }
    },
    [profile, user]
  );

  useEffect(() => {
    void loadCertificates(Boolean(initialCached));
  }, [loadCertificates, initialCached]);

  return (
    <section className="space-y-3.5" aria-label="My Certificates">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-[var(--accent)]" />
          <h2
            className="text-base sm:text-lg font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            My Certificates
          </h2>
          {certificates.length > 0 && (
            <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[var(--accent)]/15 text-[var(--accent)]">
              {certificates.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadCertificates(false)}
            disabled={loading}
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {compact && (
            <Link
              to="/dashboard/certificates"
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
            >
              <span>All Certificates</span>
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="cockpit-surface-card p-4 text-xs text-red-400 border border-red-500/30">
          {errorMsg}
        </div>
      )}

      {loading && certificates.length === 0 ? (
        <CertificatesSectionSkeleton />
      ) : certificates.length === 0 ? (
        <div className="cockpit-surface-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <ShieldCheck size={16} className="text-[var(--accent)]" />
              <span>No 1st Position Certificates Yet</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-xl">
              When you take 1st Position in a finalized Boardly Grand Line mock, your signed A4 Certificate of Excellence is generated automatically and appears here with PDF &amp; PNG downloads.
            </p>
          </div>
          <Link
            to="/grand-line"
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 inline-flex items-center gap-2 shrink-0"
          >
            <span>Compete in Grand Line</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      )}
    </section>
  );
};

export function MyCertificatesPage() {
  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 space-y-6">
      <MyCertificatesSection compact={false} />
    </div>
  );
}

export default MyCertificatesPage;
