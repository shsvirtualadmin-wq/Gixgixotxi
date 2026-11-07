import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Award, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  fetchMyCertificates,
  type StudentCertificateRecord,
} from '../../services/certificateService';
import { CertificateCard } from '../../components/certificates/CertificateCard';

export interface MyCertificatesSectionProps {
  compact?: boolean;
}

/**
 * Reusable "My Certificates" section for the Student Dashboard (Overview, Profile, and /dashboard/certificates).
 */
export const MyCertificatesSection: React.FC<MyCertificatesSectionProps> = ({
  compact = false,
}) => {
  const [certificates, setCertificates] = useState<StudentCertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const rows = await fetchMyCertificates();
      setCertificates(rows);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load your certificates right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

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
            onClick={() => void loadCertificates()}
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

      {loading ? (
        <div className="cockpit-surface-card p-6 text-center font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Loading your official Grand Line certificates...
        </div>
      ) : certificates.length === 0 ? (
        <div className="cockpit-surface-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <ShieldCheck size={16} className="text-[var(--accent)]" />
              <span>No 1st Position Certificates Yet</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-xl">
              When you take <strong>1st Position</strong> in a finalised Boardly Grand Line mock, your signed A4 Certificate of Excellence is automatically generated on Cloudflare and appears here with PDF &amp; PNG downloads.
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
