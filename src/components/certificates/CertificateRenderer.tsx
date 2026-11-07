import React, { useMemo } from 'react';
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
}

/**
 * Reusable responsive A4 Landscape (1123 x 794 px) Certificate Renderer.
 * Matches the server/Worker HTML & SVG template 1:1, with frosted glass
 * (`backdrop-filter: blur(28px) saturate(160%)`, 36px radius, 1px light border),
 * pre-blurred colour glows, dot-grid background, and decorative dot motif widget.
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
  signatoryName,
  signatoryTitle,
  signatureDataUrl,
  verifyBaseUrl,
  className = '',
}) => {
  const theme = useMemo(
    () => resolveCertificateTheme(grandLineId, themeId),
    [grandLineId, themeId]
  );

  const svgMarkup = useMemo(
    () =>
      buildCertificateSvgMarkup({
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
        themeId: theme.id,
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
      theme.id,
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
      {/* Frosted glass backdrop-filter layer aligned with the inner glass panel (56,48 -> 1011x698) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: `${(56 / CERTIFICATE_WIDTH) * 100}%`,
          top: `${(48 / CERTIFICATE_HEIGHT) * 100}%`,
          width: `${(1011 / CERTIFICATE_WIDTH) * 100}%`,
          height: `${(698 / CERTIFICATE_HEIGHT) * 100}%`,
          borderRadius: '3.2%',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        }}
      />
      <div
        className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    </div>
  );
};

export default CertificateRenderer;
