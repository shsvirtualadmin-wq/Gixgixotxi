import React, { useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  CERTIFICATE_WIDTH,
  CERTIFICATE_HEIGHT,
  buildCertificateSvgMarkup,
  type CertificateRenderInput,
} from '../../lib/certificateRenderer';
import { resolveCertificateTheme } from '../../config/certificateThemes';

export interface CertificateRendererProps extends CertificateRenderInput {
  className?: string;
  /** Optional server-rendered PNG preview URL (signed short-lived token) */
  serverPreviewUrl?: string | null;
  /** Show skeleton/blur ONLY while loading */
  loading?: boolean;
  /** Optional error message if loading preview data failed */
  error?: string | null;
  /** Optional retry callback when error is present */
  onRetry?: () => void;
}

/**
 * Reusable responsive A4 Landscape (1123 x 794 px) Certificate Renderer.
 * Matches the server/Worker HTML & SVG template 1:1, with pre-blurred colour glows,
 * frosted glass card surface, dot-grid background, and decorative dot motif widget.
 * Never overlays a CSS blur on top of the rendered certificate.
 */
export const CertificateRenderer: React.FC<CertificateRendererProps> = ({
  serial,
  studentName,
  grandLineId,
  grandLineTitle,
  editionLabel,
  rank = 1,
  score,
  totalQuestions,
  percentage,
  participantsCount,
  issuedAt,
  themeId,
  theme: themeProp,
  instanceId,
  signatoryName,
  signatoryTitle,
  signatureDataUrl,
  verifyBaseUrl,
  className = '',
  loading = false,
  error = null,
  onRetry,
}) => {
  const theme = useMemo(
    () =>
      resolveCertificateTheme(
        grandLineId || 'default',
        themeId === undefined ? 'default' : themeId,
        studentName,
        themeProp
      ),
    [grandLineId, themeId, studentName, themeProp]
  );

  const svgMarkup = useMemo(
    () =>
      buildCertificateSvgMarkup({
        serial,
        studentName,
        grandLineId: grandLineId || 'default',
        grandLineTitle,
        editionLabel,
        rank,
        score,
        totalQuestions,
        percentage,
        participantsCount,
        issuedAt,
        themeId: theme.id,
        theme,
        instanceId: instanceId || `${theme.id}-${serial}`,
        signatoryName,
        signatoryTitle,
        signatureDataUrl,
        verifyBaseUrl,
      }),
    [
      serial,
      studentName,
      grandLineId,
      grandLineTitle,
      editionLabel,
      rank,
      score,
      totalQuestions,
      percentage,
      participantsCount,
      issuedAt,
      theme,
      instanceId,
      signatoryName,
      signatoryTitle,
      signatureDataUrl,
      verifyBaseUrl,
    ]
  );

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-[var(--border)] select-none ${className}`}
      style={{
        aspectRatio: `${CERTIFICATE_WIDTH} / ${CERTIFICATE_HEIGHT}`,
        backgroundColor: theme.backgroundColor,
      }}
      role="img"
      aria-label={`Boardly Certificate of Excellence for ${studentName} in ${grandLineTitle} (Serial ${serial})`}
    >
      {/* Sharp SVG Certificate */}
      <div
        className={`w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block transition-opacity duration-200 ${
          loading ? 'opacity-35 blur-sm' : 'opacity-100'
        }`}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />

      {/* Loading Skeleton Overlay (shown ONLY while loading is true) */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
          <RefreshCw size={22} className="animate-spin text-[var(--accent)]" />
          <span className="font-mono text-xs uppercase tracking-wider text-white">
            Loading certificate preview...
          </span>
        </div>
      )}

      {/* Error State with Retry Button (never a permanent silent blur) */}
      {!loading && error && (
        <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl border border-red-500/40 bg-black/85 text-xs text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold text-xs hover:opacity-90 inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificateRenderer;
