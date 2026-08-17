import React from 'react';
import { WATERMARK_LOGO_BASE64 } from './watermarkBase64';

export { WATERMARK_LOGO_BASE64 };

/**
 * Resolves the active Boardly logo URL
 */
export function getActiveLogoUrl(customLogoUrl?: string | null): string {
  let activeLogo =
    (customLogoUrl !== undefined && customLogoUrl !== null ? customLogoUrl : null) ||
    (typeof window !== 'undefined' ? localStorage.getItem('boardly_logo_url') : null) ||
    'https://i.ibb.co/ymPFp2Wb/Chat-Box-1256234838.jpg';

  let logoTrimmed = activeLogo ? activeLogo.trim() : 'https://i.ibb.co/ymPFp2Wb/Chat-Box-1256234838.jpg';
  if (logoTrimmed.startsWith('/') && typeof window !== 'undefined') {
    logoTrimmed = `${window.location.origin}${logoTrimmed}`;
  }
  return logoTrimmed;
}

/**
 * Resolves the clean transparent watermark image URL (uses embedded transparent PNG base64 for reliable PDF rendering)
 */
export function getTransparentWatermarkUrl(): string {
  return WATERMARK_LOGO_BASE64;
}

/**
 * Returns an HTML string representing single centered faint logo watermarks per page block (A4 ~1123px per page).
 * Positioned behind all text content (z-index: 0) with ~9% opacity.
 */
export function getWatermarkHtmlOverlay(customLogoUrl?: string | null, pageCount: number = 4): string {
  // Watermarks are drawn directly on canvas slices per page in pdfGenerator.ts to ensure 100% precise single centering without HTML layering offset.
  return '';
}

/**
 * React Component for rendering a single large faint centered logo watermark behind printable components.
 */
export const PdfWatermarkOverlay: React.FC<{ customLogoUrl?: string | null }> = () => {
  const logoUrl = getTransparentWatermarkUrl();

  return (
    <div
      className="boardly-pdf-watermark-overlay pointer-events-none select-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={logoUrl}
        alt=""
        style={{
          width: '65%',
          maxWidth: '520px',
          minWidth: '280px',
          aspectRatio: '1/1',
          objectFit: 'contain',
          opacity: 0.09,
          pointerEvents: 'none',
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = '/watermark-logo.png';
        }}
      />
    </div>
  );
};

