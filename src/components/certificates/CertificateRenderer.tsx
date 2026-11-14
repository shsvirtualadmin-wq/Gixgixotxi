import React, { useMemo, useRef, useState, useEffect } from 'react';
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
 * Uses a ResizeObserver + CSS transform: scale(...) inside an aspect-ratio: 1123/794
 * container so the full 1123x794 certificate scales cleanly across mobile & desktop.
 */
export const CertificateRenderer: React.FC<CertificateRendererProps> = ({
  serial,
  serialNumber,
  studentName,
  studentUid,
  paletteSeed,
  grandLineId,
  grandLineTitle,
  testTitle,
  editionLabel,
  rank = 1,
  score,
  scoreObtained,
  totalQuestions,
  totalMarks,
  percentage,
  participantsCount,
  issuedAt,
  issuedDate,
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setScale(rect.width / CERTIFICATE_WIDTH);
      }
    };

    updateScale();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateScale();
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const effectiveSerial = serialNumber || serial || 'BDLY-GL01-0001';
  const effectiveTitle = testTitle || grandLineTitle || 'Boardly Grand Line Mock';
  const effectiveSeed =
    paletteSeed || studentUid || effectiveSerial || studentName || 'Student';

  const theme = useMemo(
    () =>
      resolveCertificateTheme(
        grandLineId || 'default',
        themeId === undefined ? 'default' : themeId,
        effectiveSeed,
        themeProp
      ),
    [grandLineId, themeId, effectiveSeed, themeProp]
  );

  const svgMarkup = useMemo(
    () =>
      buildCertificateSvgMarkup({
        serial: effectiveSerial,
        serialNumber: effectiveSerial,
        studentName,
        studentUid,
        paletteSeed: effectiveSeed,
        grandLineId: grandLineId || 'default',
        grandLineTitle: effectiveTitle,
        testTitle: effectiveTitle,
        editionLabel,
        rank,
        score,
        scoreObtained,
        totalQuestions,
        totalMarks,
        percentage,
        participantsCount,
        issuedAt,
        issuedDate,
        themeId: theme.id,
        theme,
        instanceId: instanceId || `${theme.id}-${effectiveSerial}`,
        signatoryName,
        signatoryTitle,
        signatureDataUrl,
        verifyBaseUrl,
      }),
    [
      effectiveSerial,
      studentName,
      studentUid,
      effectiveSeed,
      grandLineId,
      effectiveTitle,
      editionLabel,
      rank,
      score,
      scoreObtained,
      totalQuestions,
      totalMarks,
      percentage,
      participantsCount,
      issuedAt,
      issuedDate,
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
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl border border-[var(--border)] select-none ${className}`}
      style={{
        aspectRatio: `${CERTIFICATE_WIDTH} / ${CERTIFICATE_HEIGHT}`,
        width: '100%',
        overflow: 'hidden',
        backgroundColor: theme.backgroundColor,
      }}
      role="img"
      aria-label={`Boardly Certificate of Excellence for ${studentName} in ${effectiveTitle} (Serial ${effectiveSerial})`}
    >
      {/* Sharp 1123x794 A4 Landscape Stage scaled via ResizeObserver */}
      <div
        className={`transition-opacity duration-200 ${
          loading ? 'opacity-35 blur-sm' : 'opacity-100'
        }`}
        style={
          scale !== null
            ? {
                width: `${CERTIFICATE_WIDTH}px`,
                height: `${CERTIFICATE_HEIGHT}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }
            : {
                width: '100%',
                height: '100%',
              }
        }
      >
        <div
          className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      </div>

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
