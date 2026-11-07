/**
 * BOARDLY — GRAND LINE CERTIFICATE DESIGN & MULTI-THEME CONFIGURATION
 *
 * Every Grand Line mock gets a distinct design:
 * 1. Explicit theme selected on the mock (`certificate_theme_id`) or mapped in `GRAND_LINE_THEME_MAP`.
 * 2. Or deterministically synthesized from `grand_line_id` (FNV-1a hash) when `certificate_theme_id` is null/'auto',
 *    picking a unique Boardly palette combination, glow coordinates, and dot-matrix motif so no two mocks look the same
 *    and the same mock always renders identically.
 */

export type CertificateMotifType =
  | 'dot-rings'
  | 'dot-waves'
  | 'dot-grid-burst'
  | 'dot-spiral'
  | 'dot-stripes'
  | 'dot-diamond';

export type CertificateTitleStyle =
  | 'solid'
  | 'accent-rule'
  | 'mono-bracket'
  | 'double-dot'
  | 'minimal'
  | 'gold-trim';

export interface CertificateGlowSpec {
  color: string;
  x: number; // 0..1123 px
  y: number; // 0..794 px
  radius: number; // px
}

export interface CertificateTheme {
  id: string;
  label: string;
  mode: 'dark' | 'light';
  backgroundColor: string;
  dotColor: string;
  inkColor: string;
  mutedColor: string;
  accentColor: string;
  secondaryAccentColor: string;
  glow1: CertificateGlowSpec;
  glow2: CertificateGlowSpec;
  glassOpacity: number;
  glassBorderColor: string;
  tileBgColor: string;
  motif: CertificateMotifType;
  titleStyle?: CertificateTitleStyle;
}

/**
 * Starter themes using Boardly's official palette:
 * - Navy: #0d1b3e
 * - Blue: #1a6dff
 * - Red:  #ef4444
 * - Gold: #f5b942 (premium accents)
 * - Green: #22c55e
 */
export const CERTIFICATE_THEMES: Record<string, CertificateTheme> = {
  'red-dark': {
    id: 'red-dark',
    label: 'Nothing Crimson Dark',
    mode: 'dark',
    backgroundColor: '#0A0A0D',
    dotColor: 'rgba(255, 255, 255, 0.11)',
    inkColor: '#F8FAFC',
    mutedColor: '#94A3B8',
    accentColor: '#EF4444',
    secondaryAccentColor: '#F5B942',
    glow1: { color: '#EF4444', x: 260, y: 210, radius: 290 },
    glow2: { color: '#0D1B3E', x: 880, y: 580, radius: 340 },
    glassOpacity: 0.72,
    glassBorderColor: 'rgba(255, 255, 255, 0.14)',
    tileBgColor: 'rgba(255, 255, 255, 0.045)',
    motif: 'dot-rings',
    titleStyle: 'accent-rule',
  },
  'light-red': {
    id: 'light-red',
    label: 'Paper & Signal Red',
    mode: 'light',
    backgroundColor: '#F6F5F0',
    dotColor: 'rgba(13, 27, 62, 0.12)',
    inkColor: '#0D1B3E',
    mutedColor: '#475569',
    accentColor: '#EF4444',
    secondaryAccentColor: '#0D1B3E',
    glow1: { color: '#EF4444', x: 860, y: 200, radius: 270 },
    glow2: { color: '#1A6DFF', x: 240, y: 600, radius: 290 },
    glassOpacity: 0.84,
    glassBorderColor: 'rgba(13, 27, 62, 0.14)',
    tileBgColor: 'rgba(13, 27, 62, 0.04)',
    motif: 'dot-grid-burst',
    titleStyle: 'solid',
  },
  'blue-dark': {
    id: 'blue-dark',
    label: 'Deep Navy & Electric Blue',
    mode: 'dark',
    backgroundColor: '#0D1B3E',
    dotColor: 'rgba(255, 255, 255, 0.12)',
    inkColor: '#F8FAFC',
    mutedColor: '#93C5FD',
    accentColor: '#1A6DFF',
    secondaryAccentColor: '#EF4444',
    glow1: { color: '#1A6DFF', x: 300, y: 230, radius: 310 },
    glow2: { color: '#EF4444', x: 850, y: 560, radius: 260 },
    glassOpacity: 0.74,
    glassBorderColor: 'rgba(147, 197, 253, 0.18)',
    tileBgColor: 'rgba(255, 255, 255, 0.05)',
    motif: 'dot-waves',
    titleStyle: 'mono-bracket',
  },
  'green-dark': {
    id: 'green-dark',
    label: 'Obsidian & Emerald Signal',
    mode: 'dark',
    backgroundColor: '#090F0D',
    dotColor: 'rgba(255, 255, 255, 0.10)',
    inkColor: '#F0FDF4',
    mutedColor: '#86EFAC',
    accentColor: '#22C55E',
    secondaryAccentColor: '#1A6DFF',
    glow1: { color: '#22C55E', x: 840, y: 220, radius: 290 },
    glow2: { color: '#0D1B3E', x: 260, y: 570, radius: 320 },
    glassOpacity: 0.75,
    glassBorderColor: 'rgba(34, 197, 94, 0.18)',
    tileBgColor: 'rgba(255, 255, 255, 0.045)',
    motif: 'dot-spiral',
    titleStyle: 'double-dot',
  },
  'amber-dark': {
    id: 'amber-dark',
    label: 'Midnight & Sovereign Gold',
    mode: 'dark',
    backgroundColor: '#0B0D14',
    dotColor: 'rgba(245, 185, 66, 0.13)',
    inkColor: '#FFFBEB',
    mutedColor: '#CBD5E1',
    accentColor: '#F5B942',
    secondaryAccentColor: '#EF4444',
    glow1: { color: '#F5B942', x: 280, y: 200, radius: 300 },
    glow2: { color: '#EF4444', x: 860, y: 590, radius: 270 },
    glassOpacity: 0.74,
    glassBorderColor: 'rgba(245, 185, 66, 0.20)',
    tileBgColor: 'rgba(255, 255, 255, 0.05)',
    motif: 'dot-diamond',
    titleStyle: 'gold-trim',
  },
  'mono-light': {
    id: 'mono-light',
    label: 'Pure Nothing Daylight',
    mode: 'light',
    backgroundColor: '#FFFFFF',
    dotColor: 'rgba(13, 27, 62, 0.13)',
    inkColor: '#0D1B3E',
    mutedColor: '#475569',
    accentColor: '#EF4444',
    secondaryAccentColor: '#1A6DFF',
    glow1: { color: '#1A6DFF', x: 260, y: 220, radius: 260 },
    glow2: { color: '#F5B942', x: 860, y: 580, radius: 260 },
    glassOpacity: 0.86,
    glassBorderColor: 'rgba(13, 27, 62, 0.15)',
    tileBgColor: 'rgba(13, 27, 62, 0.035)',
    motif: 'dot-stripes',
    titleStyle: 'minimal',
  },
};

export const CERTIFICATE_THEME_LIST: CertificateTheme[] = Object.values(CERTIFICATE_THEMES);

/**
 * Optional static mapping keyed by `grand_line_id`.
 * Adding a new preset or mapping a specific mock is a config-only change.
 */
export const GRAND_LINE_THEME_MAP: Record<string, string> = {
  gl_mock_01: 'red-dark',
  gl_mock_02: 'blue-dark',
  gl_mock_03: 'light-red',
  gl_mock_04: 'green-dark',
  gl_mock_05: 'amber-dark',
  gl_mock_06: 'mono-light',
};

const MOTIFS: CertificateMotifType[] = [
  'dot-rings',
  'dot-waves',
  'dot-grid-burst',
  'dot-spiral',
  'dot-stripes',
  'dot-diamond',
];

const TITLE_STYLES: CertificateTitleStyle[] = [
  'solid',
  'accent-rule',
  'mono-bracket',
  'double-dot',
  'minimal',
  'gold-trim',
];

/**
 * Boardly palette combinations used by the deterministic auto-generator.
 * Ensures WCAG AA text contrast and distinct visual identity for every `grand_line_id`.
 */
const AUTO_PALETTE_BASES: Array<{
  mode: 'dark' | 'light';
  bg: string;
  dot: string;
  ink: string;
  muted: string;
  accent: string;
  secondary: string;
  glowA: string;
  glowB: string;
  glassOpacity: number;
  glassBorder: string;
  tileBg: string;
  labelPrefix: string;
}> = [
  {
    mode: 'dark',
    bg: '#0A0B10',
    dot: 'rgba(255, 255, 255, 0.11)',
    ink: '#F8FAFC',
    muted: '#94A3B8',
    accent: '#EF4444',
    secondary: '#1A6DFF',
    glowA: '#EF4444',
    glowB: '#1A6DFF',
    glassOpacity: 0.73,
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    tileBg: 'rgba(255, 255, 255, 0.045)',
    labelPrefix: 'Auto Signal Red',
  },
  {
    mode: 'dark',
    bg: '#0D1B3E',
    dot: 'rgba(255, 255, 255, 0.12)',
    ink: '#F8FAFC',
    muted: '#93C5FD',
    accent: '#1A6DFF',
    secondary: '#F5B942',
    glowA: '#1A6DFF',
    glowB: '#F5B942',
    glassOpacity: 0.74,
    glassBorder: 'rgba(147, 197, 253, 0.18)',
    tileBg: 'rgba(255, 255, 255, 0.05)',
    labelPrefix: 'Auto Grand Navy',
  },
  {
    mode: 'light',
    bg: '#F6F5F0',
    dot: 'rgba(13, 27, 62, 0.12)',
    ink: '#0D1B3E',
    muted: '#475569',
    accent: '#EF4444',
    secondary: '#0D1B3E',
    glowA: '#EF4444',
    glowB: '#1A6DFF',
    glassOpacity: 0.85,
    glassBorder: 'rgba(13, 27, 62, 0.14)',
    tileBg: 'rgba(13, 27, 62, 0.04)',
    labelPrefix: 'Auto Daylight Red',
  },
  {
    mode: 'dark',
    bg: '#09110E',
    dot: 'rgba(255, 255, 255, 0.11)',
    ink: '#F0FDF4',
    muted: '#86EFAC',
    accent: '#22C55E',
    secondary: '#F5B942',
    glowA: '#22C55E',
    glowB: '#1A6DFF',
    glassOpacity: 0.74,
    glassBorder: 'rgba(34, 197, 94, 0.18)',
    tileBg: 'rgba(255, 255, 255, 0.045)',
    labelPrefix: 'Auto Emerald Matrix',
  },
  {
    mode: 'dark',
    bg: '#0C0E17',
    dot: 'rgba(245, 185, 66, 0.13)',
    ink: '#FFFBEB',
    muted: '#CBD5E1',
    accent: '#F5B942',
    secondary: '#EF4444',
    glowA: '#F5B942',
    glowB: '#EF4444',
    glassOpacity: 0.74,
    glassBorder: 'rgba(245, 185, 66, 0.20)',
    tileBg: 'rgba(255, 255, 255, 0.05)',
    labelPrefix: 'Auto Sovereign Gold',
  },
  {
    mode: 'light',
    bg: '#FFFFFF',
    dot: 'rgba(13, 27, 62, 0.13)',
    ink: '#0D1B3E',
    muted: '#475569',
    accent: '#1A6DFF',
    secondary: '#EF4444',
    glowA: '#1A6DFF',
    glowB: '#22C55E',
    glassOpacity: 0.86,
    glassBorder: 'rgba(13, 27, 62, 0.15)',
    tileBg: 'rgba(13, 27, 62, 0.035)',
    labelPrefix: 'Auto Cobalt Light',
  },
  {
    mode: 'dark',
    bg: '#0B1325',
    dot: 'rgba(255, 255, 255, 0.11)',
    ink: '#F8FAFC',
    muted: '#94A3B8',
    accent: '#22C55E',
    secondary: '#1A6DFF',
    glowA: '#1A6DFF',
    glowB: '#22C55E',
    glassOpacity: 0.74,
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    tileBg: 'rgba(255, 255, 255, 0.045)',
    labelPrefix: 'Auto Deep Marine',
  },
  {
    mode: 'light',
    bg: '#F4F7FB',
    dot: 'rgba(13, 27, 62, 0.12)',
    ink: '#0D1B3E',
    muted: '#475569',
    accent: '#22C55E',
    secondary: '#0D1B3E',
    glowA: '#22C55E',
    glowB: '#F5B942',
    glassOpacity: 0.85,
    glassBorder: 'rgba(13, 27, 62, 0.14)',
    tileBg: 'rgba(13, 27, 62, 0.04)',
    labelPrefix: 'Auto Mint Paper',
  },
];

/**
 * Deterministic 32-bit FNV-1a hash with secondary mixing.
 */
export function hashGrandLineId(input: string, seed = 0x811c9dc5): number {
  const str = String(input || 'boardly_default_mock').trim();
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}

/**
 * Generates a deterministic, unique CertificateTheme from `grandLineId` so that:
 * - No two mocks with different `grand_line_id` share the exact same palette + glow coordinates + motif.
 * - The same `grand_line_id` always resolves to the exact same design across server and client.
 */
export function generateDeterministicThemeForGrandLine(grandLineId: string): CertificateTheme {
  const cleanId = String(grandLineId || 'grand_line_mock').trim();
  const h1 = hashGrandLineId(cleanId, 0x811c9dc5);
  const h2 = hashGrandLineId(`${cleanId}:glow`, 0x9e3779b9);
  const h3 = hashGrandLineId(`${cleanId}:motif`, 0x243f6a88);

  const palette = AUTO_PALETTE_BASES[h1 % AUTO_PALETTE_BASES.length];
  const motif = MOTIFS[h3 % MOTIFS.length];
  const titleStyle = TITLE_STYLES[(h1 >>> 4) % TITLE_STYLES.length];

  // Deterministic glow coordinates within the 1123x794 canvas
  const glow1X = 180 + (h2 % 340); // 180..520
  const glow1Y = 140 + ((h2 >>> 8) % 240); // 140..380
  const glow1Radius = 250 + ((h2 >>> 16) % 90); // 250..340

  const glow2X = 620 + ((h3 >>> 3) % 340); // 620..960
  const glow2Y = 420 + ((h3 >>> 11) % 240); // 420..660
  const glow2Radius = 250 + ((h3 >>> 19) % 90); // 250..340

  const shortHash = (h1 & 0xffff).toString(16).toUpperCase().padStart(4, '0');

  return {
    id: `auto:${cleanId}`,
    label: `${palette.labelPrefix} #${shortHash}`,
    mode: palette.mode,
    backgroundColor: palette.bg,
    dotColor: palette.dot,
    inkColor: palette.ink,
    mutedColor: palette.muted,
    accentColor: palette.accent,
    secondaryAccentColor: palette.secondary,
    glow1: {
      color: palette.glowA,
      x: glow1X,
      y: glow1Y,
      radius: glow1Radius,
    },
    glow2: {
      color: palette.glowB,
      x: glow2X,
      y: glow2Y,
      radius: glow2Radius,
    },
    glassOpacity: palette.glassOpacity,
    glassBorderColor: palette.glassBorder,
    tileBgColor: palette.tileBg,
    motif,
    titleStyle,
  };
}

/**
 * Resolves the CertificateTheme for a given Grand Line mock.
 * Priority:
 * 1. Explicit `preferredThemeId` (if set and in `CERTIFICATE_THEMES`)
 * 2. Static `GRAND_LINE_THEME_MAP[grandLineId]` (if no explicit preference or 'auto')
 * 3. Deterministic auto-generated theme from `grandLineId` (never fails, never plain fallback)
 */
export function resolveCertificateTheme(
  grandLineId: string,
  preferredThemeId?: string | null
): CertificateTheme {
  const cleanPref = typeof preferredThemeId === 'string' ? preferredThemeId.trim() : '';
  if (cleanPref && cleanPref !== 'auto' && CERTIFICATE_THEMES[cleanPref]) {
    return CERTIFICATE_THEMES[cleanPref];
  }

  const mappedId = GRAND_LINE_THEME_MAP[grandLineId];
  if (!cleanPref && mappedId && CERTIFICATE_THEMES[mappedId]) {
    return CERTIFICATE_THEMES[mappedId];
  }

  return generateDeterministicThemeForGrandLine(grandLineId);
}
