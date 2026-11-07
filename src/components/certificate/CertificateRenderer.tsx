import React, { useMemo } from 'react';
import type { CertificateTheme, CertificateMotifType } from '@/config/certificateThemes';
import { resolveCertificateTheme } from '@/config/certificateThemes';
import { QrCodeSvg } from '@/components/crew/QrCodeSvg';

export interface CertificateRendererProps {
  studentName: string;
  mockName: string; // Exact mock name character for character
  score: number | string;
  totalQuestions?: number | string;
  participantsCount: number | string;
  serial: string;
  issuedDate: string | number | Date;
  theme?: CertificateTheme;
  themeId?: string | null;
  mockId?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureDataUrl?: string | null;
  scale?: number;
  className?: string;
  id?: string;
}

function formatDate(val: string | number | Date): string {
  try {
    const d = val instanceof Date ? val : new Date(typeof val === 'number' && val < 1e12 ? val * 1000 : val);
    if (isNaN(d.getTime())) return 'OFFICIAL';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  } catch {
    return 'OFFICIAL';
  }
}

/**
 * Renders decorative dot motifs without external SVGs or copyright
 */
function RenderMotif({
  type,
  color,
  opacity = 0.35,
}: {
  type: CertificateMotifType;
  color: string;
  opacity?: number;
}) {
  switch (type) {
    case 'dot-rings':
      return (
        <svg
          className="absolute -top-12 -right-12 pointer-events-none"
          width="280"
          height="280"
          viewBox="0 0 280 280"
          fill="none"
          style={{ opacity }}
        >
          {[30, 60, 90, 120].map((radius, rIdx) => {
            const count = 12 + rIdx * 8;
            return (
              <g key={rIdx}>
                {Array.from({ length: count }).map((_, i) => {
                  const angle = (i * 2 * Math.PI) / count;
                  const cx = 140 + radius * Math.cos(angle);
                  const cy = 140 + radius * Math.sin(angle);
                  return <circle key={i} cx={cx} cy={cy} r="2.2" fill={color} />;
                })}
              </g>
            );
          })}
        </svg>
      );
    case 'dot-waves':
      return (
        <svg
          className="absolute top-4 -right-8 pointer-events-none"
          width="260"
          height="200"
          viewBox="0 0 260 200"
          fill="none"
          style={{ opacity }}
        >
          {Array.from({ length: 6 }).map((_, row) => (
            <g key={row}>
              {Array.from({ length: 14 }).map((_, col) => {
                const cx = 20 + col * 17;
                const cy = 20 + row * 28 + Math.sin(col * 0.5) * 10;
                return <circle key={col} cx={cx} cy={cy} r="2" fill={color} />;
              })}
            </g>
          ))}
        </svg>
      );
    case 'dot-grid-burst':
      return (
        <svg
          className="absolute -top-10 -right-10 pointer-events-none"
          width="260"
          height="260"
          viewBox="0 0 260 260"
          fill="none"
          style={{ opacity }}
        >
          {Array.from({ length: 11 }).map((_, r) =>
            Array.from({ length: 11 }).map((_, c) => {
              const dist = Math.hypot(r - 5, c - 5);
              if (dist > 5.2) return null;
              const rSize = Math.max(1, 3.2 - dist * 0.4);
              return (
                <circle
                  key={`${r}-${c}`}
                  cx={30 + c * 20}
                  cy={30 + r * 20}
                  r={rSize}
                  fill={color}
                  opacity={Math.max(0.2, 1 - dist * 0.16)}
                />
              );
            })
          )}
        </svg>
      );
    case 'dot-spiral':
      return (
        <svg
          className="absolute -top-10 -right-10 pointer-events-none"
          width="260"
          height="260"
          viewBox="0 0 260 260"
          fill="none"
          style={{ opacity }}
        >
          {Array.from({ length: 55 }).map((_, i) => {
            const angle = 0.25 * i;
            const r = 2.2 * i;
            const cx = 130 + r * Math.cos(angle);
            const cy = 130 + r * Math.sin(angle);
            return <circle key={i} cx={cx} cy={cy} r="2.2" fill={color} />;
          })}
        </svg>
      );
    case 'dot-stripes':
      return (
        <svg
          className="absolute top-6 right-6 pointer-events-none"
          width="220"
          height="180"
          viewBox="0 0 220 180"
          fill="none"
          style={{ opacity }}
        >
          {Array.from({ length: 8 }).map((_, row) => (
            <g key={row}>
              {Array.from({ length: 12 }).map((_, col) => (
                <circle
                  key={col}
                  cx={20 + col * 16}
                  cy={15 + row * 20}
                  r="2"
                  fill={color}
                  opacity={0.3 + (col / 12) * 0.7}
                />
              ))}
            </g>
          ))}
        </svg>
      );
    case 'dot-diamond':
    default:
      return (
        <svg
          className="absolute -top-6 -right-6 pointer-events-none"
          width="240"
          height="240"
          viewBox="0 0 240 240"
          fill="none"
          style={{ opacity }}
        >
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const manhattan = Math.abs(r - 4) + Math.abs(c - 4);
              if (manhattan > 4) return null;
              return (
                <circle
                  key={`${r}-${c}`}
                  cx={30 + c * 22}
                  cy={30 + r * 22}
                  r="2.4"
                  fill={color}
                />
              );
            })
          )}
        </svg>
      );
  }
}

export const CertificateRenderer: React.FC<CertificateRendererProps> = ({
  studentName,
  mockName,
  score,
  totalQuestions,
  participantsCount,
  serial,
  issuedDate,
  theme: customTheme,
  themeId,
  mockId = 'boardly-grand-line',
  signatoryName = 'Muhammad Hashir',
  signatoryTitle = 'Founder, Boardly',
  signatureDataUrl,
  scale = 1,
  className = '',
  id,
}) => {
  const theme = useMemo(() => {
    if (customTheme) return customTheme;
    return resolveCertificateTheme(themeId, mockId);
  }, [customTheme, themeId, mockId]);

  const verifyUrl = `https://boardly.cfd/verify/${encodeURIComponent(serial || 'BDLY-GL-0001')}`;
  const dateFormatted = useMemo(() => formatDate(issuedDate), [issuedDate]);

  // Dynamic font sizing for exact mock name so long names fit without truncating or "..."
  const nameLen = (mockName || '').length;
  const mockNameFontSizeClass =
    nameLen > 65
      ? 'text-base sm:text-lg leading-snug'
      : nameLen > 40
      ? 'text-lg sm:text-xl leading-snug'
      : nameLen > 25
      ? 'text-xl sm:text-2xl leading-normal'
      : 'text-2xl sm:text-3xl leading-tight';

  // Dynamic font sizing for student name: bold readable font, single line preferred, auto-shrinks
  const studentLen = (studentName || '').length;
  const studentNameFontSizeClass =
    studentLen > 32
      ? 'text-2xl sm:text-3xl tracking-tight'
      : studentLen > 22
      ? 'text-3xl sm:text-4xl tracking-tight'
      : 'text-4xl sm:text-5xl tracking-normal';

  const scoreDisplay = totalQuestions ? `${score}/${totalQuestions}` : `${score}`;

  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
      className={`inline-block select-none ${className}`}
    >
      {/* Exact A4 Landscape Container: 1123 x 794 px */}
      <div
        id={id}
        data-certificate-serial={serial}
        style={{
          width: '1123px',
          height: '794px',
          backgroundColor: theme.backgroundColor,
          color: theme.inkColor,
        }}
        className="relative overflow-hidden p-10 flex flex-col justify-between font-sans box-border"
      >
        {/* Dot Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${theme.dotColor} 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Color Glows (Preserved in rasterization via high-blur SVGs/divs) */}
        <div
          className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full pointer-events-none filter blur-[90px]"
          style={{ backgroundColor: theme.glowColor1 }}
        />
        <div
          className="absolute -bottom-28 -right-28 w-[520px] h-[520px] rounded-full pointer-events-none filter blur-[100px]"
          style={{ backgroundColor: theme.glowColor2 }}
        />

        {/* Pre-baked solid blur simulation layer for headless/canvas PDF rasterization */}
        <div
          className="absolute inset-8 rounded-[36px] pointer-events-none"
          style={{
            backgroundColor:
              theme.mode === 'dark'
                ? `rgba(10, 14, 26, ${theme.glassOpacity * 0.95})`
                : `rgba(255, 255, 255, ${theme.glassOpacity * 0.95})`,
          }}
        />

        {/* Outer Frosted Glass Card Container */}
        <div
          className="relative z-10 w-full h-full rounded-[36px] p-10 flex flex-col justify-between shadow-2xl backdrop-blur-[28px] saturate-[160%]"
          style={{
            border: `1px solid ${theme.glassBorder}`,
            boxShadow:
              theme.mode === 'dark'
                ? '0 24px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.12)'
                : '0 20px 45px -10px rgba(15, 23, 42, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
          }}
        >
          {/* Decorative Dot Motif Widget */}
          <RenderMotif type={theme.motifType} color={theme.accentColor} opacity={0.4} />

          {/* ─── TOP SECTION: BRAND & HEADER ─── */}
          <div className="flex items-start justify-between relative">
            <div>
              {/* BOARDLY Wordmark with Signature Red Dot */}
              <div className="flex items-center gap-1.5 font-['Space_Grotesk',sans-serif] text-2xl font-black tracking-tight">
                <span style={{ color: theme.inkColor }}>BOARDLY</span>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: '#ef4444' }}
                />
              </div>
              <div
                className="font-mono text-[11px] tracking-[0.24em] uppercase mt-1"
                style={{ color: theme.mutedColor }}
              >
                ACADEMIC COMPETENCY SYSTEM
              </div>
            </div>

            {/* Header Line: GRAND LINE + Exact Mock Name on line below */}
            <div className="text-right max-w-[560px]">
              <div
                className="font-mono text-xs font-bold tracking-[0.28em] uppercase"
                style={{ color: theme.accentColor }}
              >
                GRAND LINE
              </div>
              <div
                className={`font-semibold tracking-tight mt-0.5 break-words line-clamp-2 ${mockNameFontSizeClass}`}
                style={{ color: theme.inkColor }}
                title={mockName}
              >
                {mockName}
              </div>
            </div>
          </div>

          {/* ─── CENTER HERO: POSITION & STUDENT RECOGNITION ─── */}
          <div className="text-center my-auto flex flex-col items-center">
            {/* CERTIFICATE OF EXCELLENCE */}
            <div
              className="font-mono text-xs font-bold tracking-[0.35em] uppercase mb-2"
              style={{ color: theme.mutedColor }}
            >
              CERTIFICATE OF EXCELLENCE
            </div>

            {/* Big Dot-Matrix "1st POSITION" */}
            <div
              className="font-['Doto',monospace] text-6xl sm:text-7xl font-extrabold tracking-tight mb-4"
              style={{
                color: theme.accentColor,
                textShadow: `0 0 24px ${theme.glowColor1}`,
              }}
            >
              1st POSITION
            </div>

            {/* "Proudly presented to" */}
            <div
              className="font-mono text-xs uppercase tracking-[0.25em] mb-2"
              style={{ color: theme.mutedColor }}
            >
              PROUDLY PRESENTED TO
            </div>

            {/* Student Name: Bold readable font (Space Grotesk / Inter), auto-shrinking, NOT pixel font */}
            <div
              className={`font-['Space_Grotesk',sans-serif] font-bold max-w-[900px] break-words line-clamp-2 px-4 ${studentNameFontSizeClass}`}
              style={{ color: theme.inkColor }}
            >
              {studentName}
            </div>

            {/* Underline separator */}
            <div
              className="w-36 h-[2px] rounded-full my-4"
              style={{ backgroundColor: theme.accentColor, opacity: 0.6 }}
            />

            {/* Body Line with exact mock name, score, and participants */}
            <p
              className="max-w-[760px] text-sm sm:text-base leading-relaxed px-4 break-words"
              style={{ color: theme.mutedColor }}
            >
              for securing First Position in{' '}
              <span className="font-semibold" style={{ color: theme.inkColor }}>
                {mockName}
              </span>{' '}
              with a score of{' '}
              <span className="font-bold" style={{ color: theme.accentColor }}>
                {scoreDisplay}
              </span>
              , ahead of{' '}
              <span className="font-semibold" style={{ color: theme.inkColor }}>
                {participantsCount}
              </span>{' '}
              participants.
            </p>
          </div>

          {/* ─── BOTTOM TILES: 3 FROSTED GLASS PANELS ─── */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: theme.glassBorder }}>
            {/* TILE 1: DATE */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-between"
              style={{
                backgroundColor:
                  theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${theme.glassBorder}`,
              }}
            >
              <div
                className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
                style={{ color: theme.mutedColor }}
              >
                DATE
              </div>
              <div
                className="font-mono text-sm sm:text-base font-bold mt-2"
                style={{ color: theme.inkColor }}
              >
                {dateFormatted}
              </div>
              <div className="font-mono text-[9px] mt-1" style={{ color: theme.mutedColor }}>
                OFFICIAL RECORD
              </div>
            </div>

            {/* TILE 2: SERIAL & QR CODE */}
            <div
              className="rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{
                backgroundColor:
                  theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${theme.glassBorder}`,
              }}
            >
              <div className="flex-1">
                <div
                  className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
                  style={{ color: theme.mutedColor }}
                >
                  SERIAL NUMBER
                </div>
                <div
                  className="font-mono text-sm sm:text-base font-bold tracking-wider mt-1 break-all"
                  style={{ color: theme.accentColor }}
                >
                  {serial}
                </div>
                <div
                  className="font-mono text-[9px] mt-1 truncate"
                  style={{ color: theme.mutedColor }}
                >
                  boardly.cfd/verify
                </div>
              </div>

              {/* Small QR Code linking to verification URL */}
              <div
                className="p-1.5 rounded-lg shrink-0 bg-white shadow-sm flex items-center justify-center"
                style={{ width: '56px', height: '56px' }}
              >
                <QrCodeSvg value={verifyUrl} size={48} fgColor="#07070a" bgColor="#ffffff" />
              </div>
            </div>

            {/* TILE 3: AUTHORISED BY (Signature, Name & Title) */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-between"
              style={{
                backgroundColor:
                  theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${theme.glassBorder}`,
              }}
            >
              <div
                className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
                style={{ color: theme.mutedColor }}
              >
                AUTHORISED BY
              </div>

              {/* Signature Display or Blank Signature Line */}
              <div className="h-12 flex items-center justify-start my-1 overflow-hidden">
                {signatureDataUrl ? (
                  <img
                    src={signatureDataUrl}
                    alt="Authorised Signature"
                    className="max-h-11 max-w-[170px] object-contain filter drop-shadow-sm"
                  />
                ) : (
                  <div
                    className="w-36 border-b border-dashed mt-4"
                    style={{ borderColor: theme.mutedColor }}
                  />
                )}
              </div>

              {/* Signatory Name & Title */}
              <div>
                <div
                  className="text-xs sm:text-sm font-bold tracking-tight"
                  style={{ color: theme.inkColor }}
                >
                  {signatoryName}
                </div>
                <div
                  className="font-mono text-[10px] tracking-wide"
                  style={{ color: theme.mutedColor }}
                >
                  {signatoryTitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
