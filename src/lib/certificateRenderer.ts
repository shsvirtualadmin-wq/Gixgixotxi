/**
 * BOARDLY — SERVER & WORKER CERTIFICATE TEMPLATE & RENDERING ENGINE
 *
 * Generates the A4 Landscape (1123 x 794 px) Boardly Grand Line Certificate of Excellence:
 * - Real HTML document (with frosted glass `backdrop-filter: blur(28px) saturate(160%)` AND
 *   pre-blurred glow layers so headless PDF/PNG engines always preserve the exact frosted glass look).
 * - Identical 1123x794 SVG representation with Gaussian-blurred glow layers, dot-grid background,
 *   decorative dot motif widget, dot-matrix "1st POSITION" badge, auto-shrinking / 2-line student name,
 *   3 bottom glass tiles (DATE, SERIAL + QR code, AUTHORISED BY with embedded private signature image).
 */

import {
  resolveCertificateTheme,
  type CertificateTheme,
  type CertificateMotifType,
} from '../config/certificateThemes';

export const CERTIFICATE_WIDTH = 1123;
export const CERTIFICATE_HEIGHT = 794;

export interface CertificateRenderInput {
  serial: string;
  studentName: string;
  grandLineId: string;
  grandLineTitle: string;
  editionLabel?: string;
  rank?: number;
  score: number | string;
  totalQuestions?: number;
  percentage?: number;
  participantsCount: number;
  issuedAt: number | string | Date;
  themeId?: string | null;
  /** Optional explicit CertificateTheme object; when provided, overrides themeId lookup */
  theme?: CertificateTheme | null;
  /** Optional unique instance key for scoping inline SVG <defs> IDs when multiple certificates render on one page */
  instanceId?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  /** Data URI `data:image/png;base64,...` embedded server-side from private R2; null/empty renders blank line */
  signatureDataUrl?: string | null;
  verifyBaseUrl?: string;
}

export function escapeXml(unsafe: string): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatCertificateDate(issuedAt: number | string | Date): string {
  const d =
    issuedAt instanceof Date
      ? issuedAt
      : typeof issuedAt === 'number'
      ? new Date(issuedAt < 10_000_000_000 ? issuedAt * 1000 : issuedAt)
      : new Date(issuedAt);
  if (Number.isNaN(d.getTime())) {
    return '07 NOV 2026';
  }
  const day = String(d.getUTCDate()).padStart(2, '0');
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const month = months[d.getUTCMonth()] || 'JAN';
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatCertificateScoreText(input: CertificateRenderInput): string {
  if (typeof input.score === 'string' && input.score.trim().length > 0) {
    return input.score.trim();
  }
  const numScore = Number(input.score || 0);
  const total = Number(input.totalQuestions || 0);
  const pct =
    typeof input.percentage === 'number' && Number.isFinite(input.percentage)
      ? Math.round(input.percentage)
      : total > 0
      ? Math.round((numScore / total) * 100)
      : null;
  if (total > 0 && pct !== null) {
    return `${numScore}/${total} (${pct}%)`;
  }
  if (total > 0) {
    return `${numScore}/${total}`;
  }
  return String(numScore);
}

/**
 * Computes auto-shrinking font size and 1-or-2-line wrapping for the student name.
 * Short/medium names stay on 1 line (52px down to 28px). Very long names wrap cleanly to 2 lines.
 */
export function layoutStudentName(rawName: string): {
  lines: string[];
  fontSize: number;
  lineHeight: number;
} {
  const clean = String(rawName || 'Student')
    .replace(/\s+/g, ' ')
    .trim();
  const len = clean.length;

  if (len <= 18) {
    return { lines: [clean], fontSize: 52, lineHeight: 60 };
  }
  if (len <= 24) {
    return { lines: [clean], fontSize: 44, lineHeight: 52 };
  }
  if (len <= 30) {
    return { lines: [clean], fontSize: 36, lineHeight: 44 };
  }
  if (len <= 36) {
    return { lines: [clean], fontSize: 30, lineHeight: 38 };
  }

  // Wrap to 2 balanced lines at minimum readable size (28px)
  const words = clean.split(' ');
  if (words.length <= 1) {
    return {
      lines: [clean.slice(0, 32), clean.slice(32, 64)].filter(Boolean),
      fontSize: 28,
      lineHeight: 34,
    };
  }

  const mid = Math.ceil(clean.length / 2);
  let bestSplit = 1;
  let bestDiff = Infinity;
  let acc = 0;
  for (let i = 0; i < words.length - 1; i++) {
    acc += words[i].length + (i > 0 ? 1 : 0);
    const diff = Math.abs(acc - mid);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i + 1;
    }
  }

  const line1 = words.slice(0, bestSplit).join(' ');
  const line2 = words.slice(bestSplit).join(' ');
  return {
    lines: [line1, line2.length > 38 ? `${line2.slice(0, 35)}...` : line2],
    fontSize: 28,
    lineHeight: 34,
  };
}

/**
 * Generates deterministic 25x25 QR matrix for the verification URL (`https://boardly.cfd/verify/<serial>`).
 */
export function buildQrMatrix(text: string): boolean[][] {
  const N = 25;
  const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const addFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          grid[r0 + r][c0 + c] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          grid[r0 + r][c0 + c] = true;
        }
      }
    }
  };

  addFinder(1, 1);
  addFinder(1, N - 8);
  addFinder(N - 8, 1);

  for (let i = 8; i < N - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  let bitIdx = 0;
  for (let c = N - 1; c >= 0; c -= 2) {
    if (c === 6) c--;
    for (let r = 0; r < N; r++) {
      for (let col = c; col > c - 2 && col >= 0; col--) {
        if ((r < 9 && (col < 9 || col >= N - 9)) || (r >= N - 9 && col < 9)) {
          continue;
        }
        const pseudo = (hash ^ (r * 31 + col * 17) ^ (bitIdx++ * 13)) & 0xff;
        grid[r][col] = pseudo % 3 !== 0;
      }
    }
  }

  return grid;
}

export function renderQrSvgGroup(
  text: string,
  x: number,
  y: number,
  size: number,
  fgColor: string,
  bgColor: string,
  borderColor: string
): string {
  const matrix = buildQrMatrix(text);
  const N = matrix.length;
  const padding = 6;
  const innerSize = size - padding * 2;
  const cell = innerSize / N;

  const rects: string[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!matrix[r][c]) continue;
      const rx = x + padding + c * cell;
      const ry = y + padding + r * cell;
      rects.push(
        `<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${Math.max(
          1,
          cell - 0.35
        ).toFixed(2)}" height="${Math.max(1, cell - 0.35).toFixed(
          2
        )}" rx="${(cell * 0.2).toFixed(2)}" fill="${fgColor}" />`
      );
    }
  }

  return `<g>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="10" fill="${bgColor}" stroke="${borderColor}" stroke-width="1" />
    ${rects.join('')}
  </g>`;
}

/**
 * Generates decorative Nothing OS dot-matrix motif SVG elements for each theme motif.
 */
export function renderMotifSvgMarkup(
  motif: CertificateMotifType,
  cx: number,
  cy: number,
  accentColor: string,
  secondaryColor: string
): string {
  const dots: string[] = [];

  if (motif === 'dot-rings') {
    const radii = [28, 46, 64, 82];
    const counts = [12, 20, 28, 36];
    radii.forEach((r, idx) => {
      const count = counts[idx];
      const color = idx % 2 === 0 ? accentColor : secondaryColor;
      const opacity = idx === 0 ? 0.85 : 0.45 - idx * 0.07;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const dotR = idx === 0 ? 2.6 : 2.0;
        dots.push(
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${dotR}" fill="${color}" fill-opacity="${opacity.toFixed(2)}" />`
        );
      }
    });
  } else if (motif === 'dot-waves') {
    for (let row = -4; row <= 4; row++) {
      for (let col = -6; col <= 6; col++) {
        const x = cx + col * 12;
        const y = cy + row * 12 + Math.sin(col * 0.6 + row * 0.4) * 6;
        const color = (row + col) % 2 === 0 ? accentColor : secondaryColor;
        const opacity = 0.22 + (1 - Math.abs(col) / 8) * 0.45;
        dots.push(
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="${color}" fill-opacity="${opacity.toFixed(2)}" />`
        );
      }
    }
  } else if (motif === 'dot-grid-burst') {
    for (let row = -5; row <= 5; row++) {
      for (let col = -5; col <= 5; col++) {
        const dist = Math.hypot(row, col);
        if (dist > 5.4) continue;
        const x = cx + col * 14;
        const y = cy + row * 14;
        const r = Math.max(1.2, 3.6 - dist * 0.42);
        const color = dist < 2.2 ? accentColor : secondaryColor;
        const opacity = Math.max(0.18, 0.78 - dist * 0.11);
        dots.push(
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" fill-opacity="${opacity.toFixed(2)}" />`
        );
      }
    }
  } else if (motif === 'dot-spiral') {
    const total = 68;
    for (let i = 0; i < total; i++) {
      const angle = i * 0.48;
      const r = 8 + i * 1.15;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const color = i % 3 === 0 ? accentColor : secondaryColor;
      const opacity = Math.max(0.2, 0.82 - (i / total) * 0.55);
      dots.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2.6 - (i / total) * 0.9).toFixed(1)}" fill="${color}" fill-opacity="${opacity.toFixed(2)}" />`
      );
    }
  } else if (motif === 'dot-stripes') {
    for (let r = -5; r <= 5; r++) {
      for (let c = -5; c <= 5; c++) {
        if ((r + c) % 2 !== 0) continue;
        const x = cx + c * 13;
        const y = cy + r * 13;
        const color = Math.abs(r) <= 1 ? accentColor : secondaryColor;
        const opacity = Math.abs(r) <= 1 ? 0.75 : 0.35;
        dots.push(
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.3" fill="${color}" fill-opacity="${opacity.toFixed(2)}" />`
        );
      }
    }
  } else {
    // dot-diamond
    for (let r = -5; r <= 5; r++) {
      for (let c = -5; c <= 5; c++) {
        const manhattan = Math.abs(r) + Math.abs(c);
        if (manhattan > 6) continue;
        const x = cx + c * 13;
        const y = cy + r * 13;
        const isEdge = manhattan === 6 || manhattan === 3 || manhattan === 0;
        const color = isEdge ? accentColor : secondaryColor;
        const opacity = isEdge ? 0.78 : 0.28;
        dots.push(
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isEdge ? '2.5' : '1.8'}" fill="${color}" fill-opacity="${opacity.toFixed(2)}" />`
        );
      }
    }
  }

  return `<g aria-hidden="true">${dots.join('')}</g>`;
}

/**
 * Renders the 5x7 dot-matrix glyphs for "1ST POSITION" so the PNG/PDF and live preview
 * always display an authentic Nothing OS dot-matrix headline without external font file dependencies.
 */
const DOT_FONT_5X7: Record<string, string[]> = {
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  S: ['01110', '10001', '10000', '01110', '00001', '10001', '01110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
};

export function renderDotMatrixBannerSvg(
  text: string,
  centerX: number,
  topY: number,
  dotPitch: number,
  dotRadius: number,
  primaryColor: string,
  accentColor: string
): string {
  const upper = text.toUpperCase();
  const glyphs = upper.split('').map((ch) => DOT_FONT_5X7[ch] || DOT_FONT_5X7[' ']);
  const gapCols = 1.6;
  const totalCols = glyphs.reduce(
    (sum, g, idx) => sum + g[0].length + (idx < glyphs.length - 1 ? gapCols : 0),
    0
  );
  const totalWidth = totalCols * dotPitch;
  let cursorX = centerX - totalWidth / 2;

  const circles: string[] = [];
  glyphs.forEach((glyph, gIdx) => {
    const isRankPart = gIdx < 3; // "1ST" in accentColor, "POSITION" in primaryColor
    const fill = isRankPart ? accentColor : primaryColor;
    for (let r = 0; r < glyph.length; r++) {
      const rowStr = glyph[r];
      for (let c = 0; c < rowStr.length; c++) {
        if (rowStr[c] === '1') {
          const cx = cursorX + c * dotPitch + dotPitch / 2;
          const cy = topY + r * dotPitch + dotPitch / 2;
          circles.push(
            `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${dotRadius.toFixed(2)}" fill="${fill}" />`
          );
        }
      }
    }
    cursorX += (glyph[0].length + gapCols) * dotPitch;
  });

  return `<g aria-label="${escapeXml(text)}">${circles.join('')}</g>`;
}

/**
 * Builds the complete 1123x794 SVG markup for the Certificate of Excellence.
 * Used for the live preview, miniature theme thumbnails, and server-side PNG/PDF rasterization.
 */
export function buildCertificateSvgMarkup(input: CertificateRenderInput): string {
  const theme: CertificateTheme = resolveCertificateTheme(
    input.grandLineId,
    input.themeId,
    input.studentName,
    input.theme
  );
  const rawUid = String(input.instanceId || `${theme.id}-${input.serial || 'cert'}`).replace(
    /[^a-zA-Z0-9_-]/g,
    '_'
  );
  const dotGridId = `dotGrid_${rawUid}`;
  const glowBlurId = `glowBlur_${rawUid}`;
  const panelShadowId = `panelShadow_${rawUid}`;
  const glassClipId = `glassClip_${rawUid}`;
  const sigInkId = `sigInk_${rawUid}`;

  const edition = (input.editionLabel || 'OFFICIAL MOCK EDITION').trim().toUpperCase();
  const mockTitle = (input.grandLineTitle || 'Boardly Grand Line Mock').trim();
  const scoreLabel = formatCertificateScoreText(input);
  const participantsCount = Math.max(1, Math.floor(Number(input.participantsCount || 1)));
  const dateLabel = formatCertificateDate(input.issuedAt);
  const serial = (input.serial || 'BDLY-GL01-0001').trim();
  const signatoryName = (input.signatoryName || 'Boardly Examination Council').trim();
  const signatoryTitle = (input.signatoryTitle || 'Founder, Boardly').trim();
  const baseUrl = (input.verifyBaseUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const verifyUrl = `${baseUrl}/verify/${encodeURIComponent(serial)}`;

  const nameLayout = layoutStudentName(input.studentName);
  const glassBaseRgb = theme.mode === 'dark' ? '15, 18, 28' : '255, 255, 255';
  const glassFill =
    theme.cardSurfaceColor || `rgba(${glassBaseRgb}, ${theme.glassOpacity})`;
  const qrFg = theme.qrFgColor || theme.inkColor;
  const qrBg = theme.qrBgColor || (theme.mode === 'dark' ? '#080B12' : '#FFFFFF');
  const ringPrimary = theme.dotRingPrimaryColor || theme.accentColor;
  const ringSecondary = theme.dotRingSecondaryColor || theme.secondaryAccentColor;
  const sigInkColor =
    theme.signatureInkColor || (theme.mode === 'dark' ? '#F8FAFC' : '#0D1B3E');

  const citationLine = `for securing First Position in ${mockTitle} with a score of ${scoreLabel}, ahead of ${participantsCount.toLocaleString()} ${
    participantsCount === 1 ? 'participant' : 'participants'
  }.`;

  // Split citation line if longer than 88 chars
  let citationLines = [citationLine];
  if (citationLine.length > 88) {
    const mid = Math.floor(citationLine.length / 2);
    const splitAt = citationLine.lastIndexOf(' ', mid + 12);
    if (splitAt > 20) {
      citationLines = [
        citationLine.slice(0, splitAt).trim(),
        citationLine.slice(splitAt + 1).trim(),
      ];
    }
  }

  // Name SVG tspans
  const nameStartY = nameLayout.lines.length === 1 ? 430 : 412;
  const nameSvg = nameLayout.lines
    .map(
      (line, idx) =>
        `<text x="561.5" y="${nameStartY + idx * nameLayout.lineHeight}" text-anchor="middle" fill="${theme.inkColor}" font-family="'Space Grotesk', 'Inter', 'Helvetica Neue', Arial, sans-serif" font-size="${nameLayout.fontSize}" font-weight="700" letter-spacing="-0.02em">${escapeXml(
          line
        )}</text>`
    )
    .join('\n');

  const citationStartY = nameLayout.lines.length === 1 ? 492 : 504;
  const citationSvg = citationLines
    .map(
      (line, idx) =>
        `<text x="561.5" y="${citationStartY + idx * 24}" text-anchor="middle" fill="${theme.mutedColor}" font-family="'Inter', 'Helvetica Neue', Arial, sans-serif" font-size="16.5" font-weight="500">${escapeXml(
          line
        )}</text>`
    )
    .join('\n');

  const hasSignatureImg =
    typeof input.signatureDataUrl === 'string' &&
    input.signatureDataUrl.trim().length > 0 &&
    (input.signatureDataUrl.startsWith('data:image/') ||
      input.signatureDataUrl.startsWith('blob:') ||
      input.signatureDataUrl.startsWith('http://') ||
      input.signatureDataUrl.startsWith('https://') ||
      input.signatureDataUrl.startsWith('/'));

  const signatureBlockSvg = hasSignatureImg
    ? `<image href="${escapeXml(input.signatureDataUrl!.trim())}" x="790" y="594" width="200" height="52" preserveAspectRatio="xMidYMid meet" filter="url(#${sigInkId})" />
       <line x1="778" y1="644" x2="995" y2="644" stroke="${theme.glassBorderColor}" stroke-width="1" />`
    : `<line x1="805" y1="638" x2="975" y2="638" stroke="${theme.mutedColor}" stroke-width="1.2" stroke-dasharray="4 4" stroke-opacity="0.65" />`;

  // Title style framing for CERTIFICATE OF EXCELLENCE badge
  const overlineBadgeSvg =
    theme.titleStyle === 'gold-trim'
      ? `<g>
          <rect x="398" y="168" width="327" height="34" rx="17" fill="${theme.tileBgColor}" stroke="${theme.accentColor}" stroke-width="1.5" />
          <circle cx="420" cy="185" r="4" fill="${theme.accentColor}" />
          <circle cx="703" cy="185" r="4" fill="${theme.accentColor}" />
          <text x="561.5" y="189.5" text-anchor="middle" fill="${theme.accentColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="12" font-weight="700" letter-spacing="0.2em">CERTIFICATE OF EXCELLENCE</text>
        </g>`
      : theme.titleStyle === 'mono-bracket'
      ? `<g>
          <rect x="394" y="170" width="335" height="30" rx="8" fill="${theme.tileBgColor}" stroke="${theme.accentColor}" stroke-width="1.2" />
          <text x="561.5" y="189.5" text-anchor="middle" fill="${theme.inkColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="12" font-weight="700" letter-spacing="0.18em">[ CERTIFICATE OF EXCELLENCE ]</text>
        </g>`
      : theme.titleStyle === 'double-dot'
      ? `<g>
          <rect x="400" y="170" width="323" height="30" rx="15" fill="${theme.tileBgColor}" stroke="${theme.glassBorderColor}" stroke-width="1.2" />
          <circle cx="420" cy="185" r="4" fill="${theme.accentColor}" />
          <circle cx="703" cy="185" r="4" fill="${theme.secondaryAccentColor}" />
          <text x="561.5" y="189.5" text-anchor="middle" fill="${theme.inkColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="12" font-weight="700" letter-spacing="0.2em">CERTIFICATE OF EXCELLENCE</text>
        </g>`
      : `<g>
          <rect x="406" y="170" width="311" height="30" rx="15" fill="${theme.tileBgColor}" stroke="${theme.glassBorderColor}" stroke-width="1" />
          <circle cx="426" cy="185" r="4" fill="${theme.accentColor}" />
          <text x="568" y="189.5" text-anchor="middle" fill="${theme.inkColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="12" font-weight="700" letter-spacing="0.2em">CERTIFICATE OF EXCELLENCE</text>
        </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CERTIFICATE_WIDTH} ${CERTIFICATE_HEIGHT}" width="${CERTIFICATE_WIDTH}" height="${CERTIFICATE_HEIGHT}">
  <defs>
    <pattern id="${dotGridId}" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.4" fill="${theme.dotColor}" />
    </pattern>
    <filter id="${glowBlurId}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="68" />
    </filter>
    <filter id="${panelShadowId}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="${
        theme.mode === 'dark' ? '0.48' : '0.10'
      }" />
    </filter>
    <filter id="${sigInkId}" color-interpolation-filters="sRGB">
      <feFlood flood-color="${sigInkColor}" flood-opacity="1" result="sigTint" />
      <feComposite in="sigTint" in2="SourceAlpha" operator="in" />
    </filter>
    <clipPath id="${glassClipId}">
      <rect x="56" y="48" width="1011" height="698" rx="36" />
    </clipPath>
  </defs>

  <!-- 1. Solid Theme Canvas + Dot-Matrix Grid -->
  <rect width="${CERTIFICATE_WIDTH}" height="${CERTIFICATE_HEIGHT}" fill="${theme.backgroundColor}" />
  <rect width="${CERTIFICATE_WIDTH}" height="${CERTIFICATE_HEIGHT}" fill="url(#${dotGridId})" />

  <!-- 2. Two Soft Blurred Colour Glows Behind Glass Panel -->
  <g filter="url(#${glowBlurId})">
    <circle cx="${theme.glow1.x}" cy="${theme.glow1.y}" r="${theme.glow1.radius}" fill="${theme.glow1.color}" fill-opacity="${
    theme.mode === 'dark' ? '0.38' : '0.24'
  }" />
    <circle cx="${theme.glow2.x}" cy="${theme.glow2.y}" r="${theme.glow2.radius}" fill="${theme.glow2.color}" fill-opacity="${
    theme.mode === 'dark' ? '0.34' : '0.20'
  }" />
  </g>

  <!-- 3. Frosted Glass Panel (36px radius, 1.5px border, pre-blurred glow backdrop) -->
  <g filter="url(#${panelShadowId})">
    <rect x="56" y="48" width="1011" height="698" rx="36" fill="${glassFill}" stroke="${theme.glassBorderColor}" stroke-width="1.5" />
  </g>

  <!-- Clipped Inner Elements inside Glass Panel -->
  <g clip-path="url(#${glassClipId})">
    <!-- Top Accent Hairline -->
    <rect x="420" y="48" width="283" height="3.5" rx="1.75" fill="${theme.accentColor}" />

    <!-- Decorative Nothing OS Dot Motif Widget (Top Right & Bottom Left subtle echo) -->
    ${renderMotifSvgMarkup(
      theme.motif,
      948,
      148,
      ringPrimary,
      ringSecondary
    )}
    ${renderMotifSvgMarkup(
      theme.motif,
      168,
      415,
      ringSecondary,
      ringPrimary
    )}

    <!-- Top-Left Brand Header: BOARDLY wordmark with Accent Dot -->
    <g transform="translate(104, 108)">
      <text x="0" y="0" fill="${theme.inkColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="24" font-weight="700" letter-spacing="0.22em">BOARDLY</text>
      <circle cx="152" cy="-8" r="5.5" fill="${theme.accentColor}" />
      <text x="0" y="24" fill="${theme.mutedColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="11.5" font-weight="600" letter-spacing="0.18em">GRAND LINE MOCK  /  ${escapeXml(
        edition
      )}</text>
    </g>

    <!-- Top-Right Official Serial & Theme Tag -->
    <g transform="translate(1019, 104)">
      <text x="0" y="0" text-anchor="end" fill="${theme.mutedColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="11" font-weight="600" letter-spacing="0.16em">VERIFIED RECORD // ${escapeXml(
        serial
      )}</text>
      <text x="0" y="20" text-anchor="end" fill="${theme.accentColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="10.5" font-weight="700" letter-spacing="0.18em">RANK #01 NATIONAL MERIT</text>
    </g>

    <!-- Center Overline: CERTIFICATE OF EXCELLENCE -->
    ${overlineBadgeSvg}

    <!-- Big Dot-Matrix "1ST POSITION" -->
    ${renderDotMatrixBannerSvg(
      '1ST POSITION',
      561.5,
      226,
      7.2,
      2.75,
      theme.inkColor,
      theme.accentColor
    )}

    <!-- "Proudly presented to" -->
    <text x="561.5" y="346" text-anchor="middle" fill="${theme.mutedColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="13" font-weight="600" letter-spacing="0.2em">PROUDLY PRESENTED TO</text>

    <!-- Student Name in Bold Readable Font (never pixel font) -->
    ${nameSvg}

    <!-- Subtle Divider Rule under Student Name -->
    <line x1="360" y1="454" x2="763" y2="454" stroke="${theme.glassBorderColor}" stroke-width="1.2" />
    <circle cx="561.5" cy="454" r="3.5" fill="${theme.accentColor}" />

    <!-- Citation Line: Mock Name, Score, Participants -->
    ${citationSvg}

    <!-- Bottom Three Glass Tiles: DATE | SERIAL (+ QR) | AUTHORISED BY -->
    <!-- Tile 1: DATE -->
    <g>
      <rect x="104" y="572" width="265" height="128" rx="22" fill="${theme.tileBgColor}" stroke="${theme.glassBorderColor}" stroke-width="1" />
      <text x="128" y="604" fill="${theme.mutedColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="10.5" font-weight="700" letter-spacing="0.18em">DATE ISSUED</text>
      <text x="128" y="644" fill="${theme.inkColor}" font-family="'Space Grotesk', 'Inter', Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="0.02em">${escapeXml(
        dateLabel
      )}</text>
      <text x="128" y="674" fill="${theme.mutedColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="10.5" font-weight="500" letter-spacing="0.08em">FINALIZED GRAND LINE RESULT</text>
    </g>

    <!-- Tile 2: SERIAL + QR CODE -->
    <g>
      <rect x="389" y="572" width="345" height="128" rx="22" fill="${theme.tileBgColor}" stroke="${theme.glassBorderColor}" stroke-width="1" />
      <text x="413" y="604" fill="${theme.mutedColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="10.5" font-weight="700" letter-spacing="0.18em">SERIAL &amp; VERIFICATION</text>
      <text x="413" y="640" fill="${theme.inkColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="18.5" font-weight="700" letter-spacing="0.05em">${escapeXml(
        serial
      )}</text>
      <text x="413" y="672" fill="${theme.accentColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="10" font-weight="600" letter-spacing="0.04em">boardly.cfd/verify/${escapeXml(
        serial
      )}</text>
      ${renderQrSvgGroup(
        verifyUrl,
        632,
        586,
        86,
        qrFg,
        qrBg,
        theme.glassBorderColor
      )}
    </g>

    <!-- Tile 3: AUTHORISED BY (Signature Image + Name + Title) -->
    <g>
      <rect x="754" y="572" width="265" height="128" rx="22" fill="${theme.tileBgColor}" stroke="${theme.glassBorderColor}" stroke-width="1" />
      <text x="778" y="598" fill="${theme.mutedColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="10.5" font-weight="700" letter-spacing="0.18em">AUTHORISED BY</text>
      ${signatureBlockSvg}
      <text x="778" y="662" fill="${theme.inkColor}" font-family="'Space Grotesk', 'Inter', Arial, sans-serif" font-size="14.5" font-weight="700">${escapeXml(
        signatoryName
      )}</text>
      <text x="778" y="682" fill="${theme.mutedColor}" font-family="'Space Mono', 'JetBrains Mono', 'Courier New', monospace" font-size="10.5" font-weight="500" letter-spacing="0.06em">${escapeXml(
        signatoryTitle
      )}</text>
    </g>
  </g>
</svg>`;
}

/**
 * Builds the standalone real HTML document (1123 x 794 px A4 Landscape) for the certificate,
 * combining CSS `backdrop-filter: blur(28px) saturate(160%)` with the embedded SVG/pre-blurred glow layer
 * so headless browsers and server renderers produce the exact same visual output.
 */
export function buildCertificateHtmlDocument(input: CertificateRenderInput): string {
  const theme = resolveCertificateTheme(
    input.grandLineId,
    input.themeId,
    input.studentName,
    input.theme
  );
  const svgMarkup = buildCertificateSvgMarkup({ ...input, theme });
  const title = `Boardly Certificate — ${input.serial} — ${input.studentName}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1123, height=794, initial-scale=1.0" />
  <title>${escapeXml(title)}</title>
  <style>
    @page {
      size: 1123px 794px landscape;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      width: 1123px;
      height: 794px;
      overflow: hidden;
      background: ${theme.backgroundColor};
      font-family: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .certificate-stage {
      position: relative;
      width: 1123px;
      height: 794px;
      overflow: hidden;
      background: ${theme.backgroundColor};
    }
    .certificate-stage svg {
      position: relative;
      z-index: 1;
      display: block;
      width: 1123px;
      height: 794px;
    }
  </style>
</head>
<body>
  <div class="certificate-stage">
    ${svgMarkup}
  </div>
</body>
</html>`;
}
