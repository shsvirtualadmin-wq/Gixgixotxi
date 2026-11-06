import {
  cleanPreviewText,
  escapeHtmlMeta,
  normalizePreviewTitle,
  truncateAtWordBoundary,
} from './sharePreviewHelper';

export interface OgCardOptions {
  type?: 'post' | 'test' | 'profile' | 'default' | string;
  title?: string;
  subtitle?: string;
  badge?: string;
  meta?: string;
  avatar?: string;
}

/**
 * Splits text into wrapped lines that fit within `maxCharsPerLine`, up to `maxLines`.
 * Truncates the final line cleanly at a word boundary with an ellipsis if needed.
 */
function wrapTextLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const cleaned = cleanPreviewText(text, { stripUrls: true });
  if (!cleaned) return [];

  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (lines.length === maxLines - 1) {
        const remaining = [currentLine, ...words.slice(i)].filter(Boolean).join(' ');
        lines.push(truncateAtWordBoundary(remaining, maxCharsPerLine));
        return lines;
      }
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word.length > maxCharsPerLine ? truncateAtWordBoundary(word, maxCharsPerLine) : word;
      } else {
        lines.push(truncateAtWordBoundary(word, maxCharsPerLine));
        currentLine = '';
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Generates a 1200x630 Boardly SVG share card with Nothing OS dark aesthetic,
 * red accent (#D71921), dot-matrix header styling, and large readable title.
 */
export function buildBoardlyOgCardSvg(options: OgCardOptions): string {
  const type = String(options.type || 'default').toLowerCase();

  const defaultBadge =
    type === 'test'
      ? 'GRAND LINE VERIFIED TEST'
      : type === 'post'
        ? 'BOARDLY COMMONS'
        : type === 'profile'
          ? 'BOARDLY STUDENT PROFILE'
          : 'BOARDLY ACADEMIC ARENA';

  const badge = cleanPreviewText(options.badge || defaultBadge, { maxChars: 42, stripUrls: true }).toUpperCase();

  const rawTitle =
    options.title ||
    (type === 'test'
      ? 'Grand Line Test'
      : type === 'post'
        ? 'Boardly Commons Study Resource'
        : type === 'profile'
          ? 'Boardly Student Profile'
          : 'Boardly — Verified Exam Prep & Student Commons');

  const cleanTitle = normalizePreviewTitle(rawTitle, { maxChars: 92 }) || 'Boardly';
  const titleLines = wrapTextLines(cleanTitle, cleanTitle.length > 48 ? 28 : 24, 3);

  const defaultSubtitle =
    type === 'test'
      ? 'Take this verified test and see where you rank on the national leaderboard.'
      : type === 'post'
        ? 'Read this student post, view comments, and explore study resources on Boardly Commons.'
        : type === 'profile'
          ? 'Follow on Boardly: followers, posts and national test results.'
          : 'Practice verified university entrance MCQs, Grand Line ranked tests, and student study notes.';

  const subtitle = cleanPreviewText(options.subtitle || defaultSubtitle, {
    maxChars: 120,
    stripUrls: true,
  });
  const subtitleLines = wrapTextLines(subtitle, 58, 2);

  const meta = cleanPreviewText(
    options.meta ||
      (type === 'test'
        ? 'National Leaderboard · Verified MCQs'
        : type === 'post'
          ? 'Boardly Commons · Student Community'
          : type === 'profile'
            ? 'Boardly Profile · Verified Stats'
            : 'MDCAT · ECAT · IBA · NUST · FAST'),
    { maxChars: 68, stripUrls: true }
  );

  const titleFontSize = titleLines.length >= 3 ? 52 : titleLines.length === 2 ? 60 : 66;
  const titleLineHeight = titleLines.length >= 3 ? 62 : titleLines.length === 2 ? 72 : 78;
  const titleStartY = titleLines.length >= 3 ? 250 : titleLines.length === 2 ? 268 : 295;

  const titleSvgNodes = titleLines
    .map(
      (line, idx) =>
        `<text x="80" y="${titleStartY + idx * titleLineHeight}" fill="#FFFFFF" font-family="'Inter', 'Helvetica Neue', 'Arial', sans-serif" font-size="${titleFontSize}" font-weight="800" letter-spacing="-0.02em">${escapeHtmlMeta(line)}</text>`
    )
    .join('\n  ');

  const subtitleStartY = titleStartY + titleLines.length * titleLineHeight + 18;
  const subtitleSvgNodes = subtitleLines
    .map(
      (line, idx) =>
        `<text x="80" y="${subtitleStartY + idx * 36}" fill="#A1A1AA" font-family="'Inter', 'Helvetica Neue', 'Arial', sans-serif" font-size="25" font-weight="500">${escapeHtmlMeta(line)}</text>`
    )
    .join('\n  ');

  const badgeWidth = Math.max(220, Math.min(540, badge.length * 13 + 54));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="dotGrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.35" fill="#27272A" opacity="0.75" />
    </pattern>
    <radialGradient id="redGlow" cx="88%" cy="18%" r="55%">
      <stop offset="0%" stop-color="#D71921" stop-opacity="0.26" />
      <stop offset="65%" stop-color="#D71921" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#07070A" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3F3F46" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#27272A" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#D71921" stop-opacity="0.65" />
    </linearGradient>
  </defs>

  <!-- Deep Nothing OS Dark Canvas -->
  <rect width="1200" height="630" fill="#07070A" />
  <rect width="1200" height="630" fill="url(#dotGrid)" />
  <rect width="1200" height="630" fill="url(#redGlow)" />

  <!-- Top Red Accent Strip -->
  <rect x="0" y="0" width="1200" height="8" fill="#D71921" />

  <!-- Main Glass Frame -->
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="#0C0C10" fill-opacity="0.86" stroke="url(#cardBorder)" stroke-width="2" />

  <!-- Decorative Dot-Matrix Corner Cluster -->
  <g fill="#D71921" opacity="0.85">
    <circle cx="1096" cy="84" r="4" />
    <circle cx="1114" cy="84" r="4" />
    <circle cx="1114" cy="102" r="4" />
    <circle cx="1078" cy="84" r="4" opacity="0.4" />
    <circle cx="1114" cy="120" r="4" opacity="0.4" />
  </g>

  <!-- Top Category Pill -->
  <rect x="80" y="78" width="${badgeWidth}" height="44" rx="22" fill="#18181B" stroke="#D71921" stroke-opacity="0.65" stroke-width="1.5" />
  <circle cx="106" cy="100" r="6" fill="#D71921" />
  <text x="124" y="106" fill="#F4F4F5" font-family="'Courier New', 'JetBrains Mono', monospace" font-size="17" font-weight="700" letter-spacing="0.14em">${escapeHtmlMeta(badge)}</text>

  <!-- Main Title -->
  ${titleSvgNodes}

  <!-- Subtitle -->
  ${subtitleSvgNodes}

  <!-- Bottom Divider -->
  <line x1="80" y1="498" x2="1120" y2="498" stroke="#27272A" stroke-width="1.5" stroke-dasharray="4 6" />

  <!-- Bottom Left Meta Info -->
  <rect x="80" y="522" width="10" height="28" rx="3" fill="#D71921" />
  <text x="104" y="543" fill="#E4E4E7" font-family="'Courier New', 'JetBrains Mono', monospace" font-size="20" font-weight="700" letter-spacing="0.04em">${escapeHtmlMeta(meta)}</text>

  <!-- Bottom Right Boardly Logo Badge -->
  <g transform="translate(918, 514)">
    <rect x="0" y="0" width="202" height="48" rx="14" fill="#141419" stroke="#27272A" stroke-width="1.5" />
    <rect x="14" y="11" width="26" height="26" rx="7" fill="#D71921" />
    <text x="27" y="30" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', 'Arial', sans-serif" font-size="18" font-weight="900">B</text>
    <text x="52" y="31" fill="#FFFFFF" font-family="'Courier New', 'JetBrains Mono', monospace" font-size="21" font-weight="700" letter-spacing="0.12em">BOARDLY</text>
    <circle cx="182" cy="24" r="4.5" fill="#D71921" />
  </g>
</svg>`;
}
