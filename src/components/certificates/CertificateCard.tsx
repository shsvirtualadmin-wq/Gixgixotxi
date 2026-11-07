import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Share2,
  CheckCircle2,
  ExternalLink,
  Award,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import {
  downloadCertificateFile,
  createCertificateShareLink,
  type StudentCertificateRecord,
} from '../../services/certificateService';
import { CertificateRenderer } from './CertificateRenderer';
import { formatCertificateDate } from '../../lib/certificateRenderer';

export interface CertificateCardProps {
  certificate: StudentCertificateRecord;
}

/**
 * Student Dashboard Certificate Card ("My Certificates").
 * Provides live A4 landscape preview and authenticated Download PDF, Download PNG,
 * Share, and public Verify actions with >= 44px tap targets.
 */
export const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'png' | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'png') => {
    setErrorMsg(null);
    setDownloadingFormat(format);
    try {
      await downloadCertificateFile({
        certificateId: certificate.id,
        serial: certificate.serial,
        format,
        signedUrl:
          format === 'pdf' ? certificate.downloadPdfUrl : certificate.downloadPngUrl,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to download ${format.toUpperCase()}.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleShare = async () => {
    setErrorMsg(null);
    try {
      const shareData = await createCertificateShareLink(certificate.id);
      const fullVerifyUrl = `${window.location.origin}${shareData.verifyUrl}`;
      const shareTitle = `1st Position in ${certificate.grandLineTitle} — Boardly Certificate`;
      const shareText = `I secured 1st Position in ${certificate.grandLineTitle} on Boardly! Verify certificate ${certificate.serial}:`;

      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: fullVerifyUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullVerifyUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }
    } catch {
      const fallbackUrl = `${window.location.origin}/verify/${encodeURIComponent(
        certificate.serial
      )}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fallbackUrl).catch(() => {});
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }
    }
  };

  return (
    <div className="cockpit-surface-card p-4 sm:p-5 space-y-4 border border-[var(--border)] rounded-2xl bg-[var(--surface)]">
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wider bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
            <Award size={12} />
            <span>1ST POSITION · NATIONAL MERIT</span>
          </div>
          <h3
            className="text-base sm:text-lg font-bold text-[var(--text)] truncate"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {certificate.grandLineTitle}
          </h3>
          <div className="font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
            <span>SERIAL: {certificate.serial}</span>
            <span>·</span>
            <span>ISSUED: {formatCertificateDate(certificate.issuedAt)}</span>
            <span>·</span>
            <span>
              SCORE: {certificate.score}/{certificate.totalQuestions} ({certificate.percentage}%)
            </span>
          </div>
        </div>

        <Link
          to={`/verify/${encodeURIComponent(certificate.serial)}`}
          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Verify</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* Certificate Preview (Server-rendered PNG with fallback to identical live renderer) */}
      <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-black/20">
        {certificate.previewPngUrl ? (
          <img
            src={certificate.previewPngUrl}
            alt={`Certificate ${certificate.serial} for ${certificate.studentName}`}
            className="w-full h-auto block"
            loading="lazy"
          />
        ) : (
          <CertificateRenderer
            serial={certificate.serial}
            studentName={certificate.studentName}
            grandLineId={certificate.grandLineId}
            grandLineTitle={certificate.grandLineTitle}
            editionLabel={certificate.editionLabel}
            rank={certificate.rank}
            score={certificate.score}
            totalQuestions={certificate.totalQuestions}
            percentage={certificate.percentage}
            participantsCount={certificate.participantsCount}
            issuedAt={certificate.issuedAt}
            themeId={certificate.themeId}
          />
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Action Buttons (Minimum 44px tap targets) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => void handleDownload('pdf')}
          disabled={downloadingFormat !== null}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <FileText size={14} />
          <span>
            {downloadingFormat === 'pdf' ? 'Downloading PDF...' : 'Download PDF'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void handleDownload('png')}
          disabled={downloadingFormat !== null}
          className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs font-semibold hover:border-[var(--accent)] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <ImageIcon size={14} />
          <Download size={13} />
          <span>
            {downloadingFormat === 'png' ? 'Downloading PNG...' : 'Download PNG'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void handleShare()}
          className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs font-semibold hover:border-[var(--accent)] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          {shareCopied ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-emerald-400">Verify Link Copied</span>
            </>
          ) : (
            <>
              <Share2 size={14} />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CertificateCard;
