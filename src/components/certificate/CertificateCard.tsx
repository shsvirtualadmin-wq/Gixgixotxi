import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Certificate } from '@/types/certificate';
import { CertificateRenderer } from './CertificateRenderer';
import { downloadCertificatePdf, downloadCertificatePng } from '@/utils/certificateExporter';
import { showApiToast } from '@/lib/api';
import {
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Eye,
  RefreshCw,
} from 'lucide-react';

export interface CertificateCardProps {
  certificate: Certificate;
  isAdmin?: boolean;
  onRegenerate?: (certificate: Certificate) => Promise<void>;
  onRevoke?: (certificate: Certificate) => Promise<void>;
  className?: string;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  isAdmin = false,
  onRegenerate,
  onRevoke,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isRevoked = certificate.status === 'revoked';
  const verifyUrl = `https://boardly.cfd/verify/${certificate.serial}`;

  const handleCopySerial = () => {
    navigator.clipboard.writeText(certificate.serial);
    setCopiedSerial(true);
    showApiToast(`Copied serial ${certificate.serial}`, 'info');
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Boardly Certificate of Excellence — 1st Position`,
          text: `Check out my Certificate of Excellence for securing 1st Position in "${certificate.mock_name}" on Boardly!`,
          url: verifyUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(verifyUrl);
    showApiToast('Verification link copied to clipboard!', 'success');
  };

  const handleDownloadPdf = async () => {
    const el = containerRef.current?.querySelector('[data-certificate-serial]') as HTMLElement | null;
    if (!el) {
      showApiToast('Certificate renderer not loaded.', 'error');
      return;
    }
    setDownloadingPdf(true);
    try {
      await downloadCertificatePdf({
        element: el,
        serial: certificate.serial,
        studentName: certificate.student_name,
        mockName: certificate.mock_name,
      });
      showApiToast('Downloaded Certificate PDF', 'success');
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to download PDF', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    const el = containerRef.current?.querySelector('[data-certificate-serial]') as HTMLElement | null;
    if (!el) {
      showApiToast('Certificate renderer not loaded.', 'error');
      return;
    }
    setDownloadingPng(true);
    try {
      await downloadCertificatePng({
        element: el,
        serial: certificate.serial,
        studentName: certificate.student_name,
        mockName: certificate.mock_name,
      });
      showApiToast('Downloaded Certificate PNG', 'success');
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to download PNG', 'error');
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setActionInProgress(true);
    try {
      await onRegenerate(certificate);
      showApiToast(`Regenerated certificate ${certificate.serial}`, 'success');
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to regenerate certificate', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleToggleRevoke = async () => {
    if (!onRevoke) return;
    setActionInProgress(true);
    try {
      await onRevoke(certificate);
      showApiToast(
        isRevoked
          ? `Certificate ${certificate.serial} restored`
          : `Certificate ${certificate.serial} revoked`,
        'info'
      );
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to update certificate status', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col ${
        isRevoked
          ? 'border-red-500/30 bg-red-950/10'
          : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
      } ${className}`}
    >
      {/* Hidden full-scale certificate DOM for crisp high-resolution PNG & PDF generation */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1123px',
          height: '794px',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <CertificateRenderer
          studentName={certificate.student_name}
          mockName={certificate.mock_name}
          score={certificate.score}
          totalQuestions={certificate.total_questions}
          participantsCount={certificate.participants_count}
          serial={certificate.serial}
          issuedDate={certificate.issued_at}
          themeId={certificate.theme_id}
          mockId={certificate.grand_line_id}
          signatoryName={certificate.signatory_name}
          signatoryTitle={certificate.signatory_title}
          signatureDataUrl={certificate.signature_data_url}
        />
      </div>

      {/* Mini Visual Preview in Card (Aspect ratio 1123 : 794) */}
      <div
        onClick={() => setPreviewOpen(true)}
        className="relative aspect-[1123/794] w-full overflow-hidden bg-black/40 cursor-pointer group"
      >
        <div
          style={{ width: '1123px', height: '794px' }}
          className="origin-top-left transform scale-[0.32] sm:scale-[0.38] md:scale-[0.32] pointer-events-none"
        >
          <CertificateRenderer
            studentName={certificate.student_name}
            mockName={certificate.mock_name}
            score={certificate.score}
            totalQuestions={certificate.total_questions}
            participantsCount={certificate.participants_count}
            serial={certificate.serial}
            issuedDate={certificate.issued_at}
            themeId={certificate.theme_id}
            mockId={certificate.grand_line_id}
            signatoryName={certificate.signatory_name}
            signatoryTitle={certificate.signatory_title}
            signatureDataUrl={certificate.signature_data_url}
          />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-mono flex items-center gap-1.5 border border-white/20">
            <Eye className="w-3.5 h-3.5" />
            <span>Click to View Full Size</span>
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {isRevoked ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-red-600/90 text-white flex items-center gap-1 shadow-lg">
              <AlertTriangle className="w-3 h-3" />
              <span>REVOKED</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-600/80 text-white flex items-center gap-1 backdrop-blur-sm shadow-lg">
              <ShieldCheck className="w-3 h-3" />
              <span>OFFICIAL</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Content & Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Line */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-[#ef4444]">
              GRAND LINE · 1st POSITION
            </span>
            <button
              onClick={handleCopySerial}
              className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              title="Copy Serial Number"
            >
              <span>{certificate.serial}</span>
              {copiedSerial ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 opacity-60" />
              )}
            </button>
          </div>

          {/* Exact Mock Name */}
          <h3
            className="text-base font-bold text-zinc-100 line-clamp-2 break-words"
            title={certificate.mock_name}
          >
            {certificate.mock_name}
          </h3>

          {/* Student name (Admin only, or student details) */}
          {isAdmin && (
            <div className="text-xs text-zinc-300 mt-1 flex items-center gap-1.5">
              <span className="text-zinc-500 font-mono">Recipient:</span>
              <span className="font-semibold">{certificate.student_name}</span>
              {certificate.student_email && (
                <span className="text-zinc-500 font-mono truncate max-w-[150px]">
                  ({certificate.student_email})
                </span>
              )}
            </div>
          )}

          {/* Score & participants metadata */}
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-3 pt-3 border-t border-white/5">
            <div>
              Score:{' '}
              <span className="text-zinc-100 font-semibold font-sans">
                {certificate.score}
                {certificate.total_questions ? `/${certificate.total_questions}` : ''}
              </span>
            </div>
            <div>•</div>
            <div>
              Ahead of:{' '}
              <span className="text-zinc-100 font-semibold font-sans">
                {certificate.participants_count}
              </span>{' '}
              students
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex-1 min-w-[110px] h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#ef4444]" />
            <span>{downloadingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>

          {/* Download PNG */}
          <button
            onClick={handleDownloadPng}
            disabled={downloadingPng}
            className="flex-1 min-w-[110px] h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>{downloadingPng ? 'Exporting...' : 'PNG'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Share Certificate Verification Link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Verify Public Link */}
          <Link
            to={`/verify/${certificate.serial}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 flex items-center justify-center transition-colors"
            title="Open Public Verification Page"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>

          {/* Admin Specific Actions */}
          {isAdmin && (
            <div className="w-full flex items-center gap-2 mt-1 pt-2 border-t border-white/5">
              {onRegenerate && (
                <button
                  onClick={handleRegenerate}
                  disabled={actionInProgress}
                  className="flex-1 h-9 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Regenerate with latest mock name and active signature"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              )}

              {onRevoke && (
                <button
                  onClick={handleToggleRevoke}
                  disabled={actionInProgress}
                  className={`flex-1 h-9 px-2 rounded-xl border text-[11px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${
                    isRevoked
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{isRevoked ? 'Restore' : 'Revoke'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Preview Modal */}
      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full flex flex-col items-center gap-4"
          >
            <div className="w-full flex items-center justify-between text-white">
              <div className="font-mono text-sm tracking-wider">
                CERTIFICATE PREVIEW · {certificate.serial}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 rounded-lg bg-[#ef4444] text-white text-xs font-mono font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Scaled certificate */}
            <div className="w-full overflow-x-auto flex justify-center py-2">
              <div style={{ width: '1123px', height: '794px' }} className="shrink-0 shadow-2xl">
                <CertificateRenderer
                  studentName={certificate.student_name}
                  mockName={certificate.mock_name}
                  score={certificate.score}
                  totalQuestions={certificate.total_questions}
                  participantsCount={certificate.participants_count}
                  serial={certificate.serial}
                  issuedDate={certificate.issued_at}
                  themeId={certificate.theme_id}
                  mockId={certificate.grand_line_id}
                  signatoryName={certificate.signatory_name}
                  signatoryTitle={certificate.signatory_title}
                  signatureDataUrl={certificate.signature_data_url}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
