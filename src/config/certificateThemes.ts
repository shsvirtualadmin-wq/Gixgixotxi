/**
 * BOARDLY — GRAND LINE CERTIFICATE DESIGN & MULTI-THEME CONFIGURATION
 *
 * Defines the complete design token set for all 9 certificate themes:
 * - Auto (Unique per student / mock)
 * - default ("Default Nothing Dark")
 * - default-light ("Default Nothing Light")
 * - red-dark ("Nothing Crimson Dark")
 * - light-red ("Paper & Signal Red")
 * - blue-dark ("Deep Navy & Electric Blue")
 * - green-dark ("Obsidian & Emerald Signal")
 * - amber-dark ("Midnight & Sovereign Gold")
 * - mono-light ("Pure Nothing Daylight")
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
  description: string;
  mode: 'dark' | 'light';
  /** Outer A4 canvas background hex */
  backgroundColor: string;
  /** Frosted glass inner card surface colour (rgba) */
  cardSurfaceColor: string;
  /** Inner card border colour */
  glassBorderColor: string;
  /** Opacity fallback for glass card */
  glassOpacity: number;
  /** Bottom metadata tiles surface colour */
  tileBgColor: string;
  /** Background 24px dot-matrix grid dot colour */
  dotColor: string;
  /** Primary text colour */
  inkColor: string;
  /** Muted label & citation text colour */
  mutedColor: string;
  /** Primary accent colour (badges, top rule, rank) */
  accentColor: string;
  /** Secondary accent colour */
  secondaryAccentColor: string;
  /** Primary colour for decorative dot-ring / motif widgets */
  dotRingPrimaryColor: string;
  /** Secondary colour for decorative dot-ring / motif widgets */
  dotRingSecondaryColor: string;
  /** Soft ambient glow 1 behind frosted card */
  glow1: CertificateGlowSpec;
  /** Soft ambient glow 2 behind frosted card */
  glow2: CertificateGlowSpec;
  /** QR code foreground module colour */
  qrFgColor: string;
  /** QR code quiet-zone tile background colour */
  qrBgColor: string;
  /** Signature stroke ink colour (light/gold on dark themes, dark navy on light themes) */
  signatureInkColor: string;
  /** Decorative dot widget geometry */
  motif: CertificateMotifType;
  /** Overline / title framing style */
  titleStyle: CertificateTitleStyle;
}

/**
 * All 8 named preset themes with complete, distinct design token sets.
 */
export const CERTIFICATE_THEMES: Record<string, CertificateTheme> = {
  default: {
    id: 'default',
    label: 'Default Nothing Dark',
    description: 'Signature Nothing OS carbon canvas with signal red & cobalt glow',
    mode: 'dark',
    backgroundColor: '#0A0A0D',
    cardSurfaceColor: 'rgba(15, 18, 28, 0.78)',
    glassOpacity: 0.78,
    glassBorderColor: 'rgba(255, 255, 255, 0.16)',
    tileBgColor: 'rgba(255, 255, 255, 0.055)',
    dotColor: 'rgba(255, 255, 255, 0.12)',
    inkColor: '#F8FAFC',
    mutedColor: '#94A3B8',
    accentColor: '#EF4444',
    secondaryAccentColor: '#1A6DFF',
    dotRingPrimaryColor: '#EF4444',
    dotRingSecondaryColor: '#38BDF8',
    glow1: { color: '#EF4444', x: 250, y: 205, radius: 290 },
    glow2: { color: '#1A6DFF', x: 880, y: 585, radius: 330 },
    qrFgColor: '#F8FAFC',
    qrBgColor: '#080B12',
    signatureInkColor: '#F8FAFC',
    motif: 'dot-rings',
    titleStyle: 'accent-rule',
  },
  'default-light': {
    id: 'default-light',
    label: 'Default Nothing Light',
    description: 'Warm archival stone canvas with deep navy ink & crimson badge',
    mode: 'light',
    backgroundColor: '#F6F5F0',
    cardSurfaceColor: 'rgba(255, 255, 255, 0.88)',
    glassOpacity: 0.88,
    glassBorderColor: 'rgba(13, 27, 62, 0.16)',
    tileBgColor: 'rgba(13, 27, 62, 0.045)',
    dotColor: 'rgba(13, 27, 62, 0.13)',
    inkColor: '#0D1B3E',
    mutedColor: '#475569',
    accentColor: '#EF4444',
    secondaryAccentColor: '#1A6DFF',
    dotRingPrimaryColor: '#EF4444',
    dotRingSecondaryColor: '#0D1B3E',
    glow1: { color: '#EF4444', x: 860, y: 195, radius: 265 },
    glow2: { color: '#1A6DFF', x: 245, y: 600, radius: 285 },
    qrFgColor: '#0D1B3E',
    qrBgColor: '#FFFFFF',
    signatureInkColor: '#0D1B3E',
    motif: 'dot-rings',
    titleStyle: 'solid',
  },
  'red-dark': {
    id: 'red-dark',
    label: 'Nothing Crimson Dark',
    description: 'Deepcrimson obsidian stage with dual scarlet & gold radial burst',
    mode: 'dark',
    backgroundColor: '#120709',
    cardSurfaceColor: 'rgba(28, 10, 14, 0.76)',
    glassOpacity: 0.76,
    glassBorderColor: 'rgba(239, 68, 68, 0.30)',
    tileBgColor: 'rgba(239, 68, 68, 0.08)',
    dotColor: 'rgba(254, 202, 202, 0.14)',
    inkColor: '#FFF1F2',
    mutedColor: '#FDA4AF',
    accentColor: '#FF2E38',
    secondaryAccentColor: '#F5B942',
    dotRingPrimaryColor: '#FF2E38',
    dotRingSecondaryColor: '#F5B942',
    glow1: { color: '#EF4444', x: 220, y: 185, radius: 320 },
    glow2: { color: '#F5B942', x: 890, y: 590, radius: 300 },
    qrFgColor: '#FFF1F2',
    qrBgColor: '#19080B',
    signatureInkColor: '#FFE4E6',
    motif: 'dot-grid-burst',
    titleStyle: 'double-dot',
  },
  'light-red': {
    id: 'light-red',
    label: 'Paper & Signal Red',
    description: 'Crisp cream parchment with vermilion grid burst & warm gold glow',
    mode: 'light',
    backgroundColor: '#FAF5EE',
    cardSurfaceColor: 'rgba(255, 251, 245, 0.86)',
    glassOpacity: 0.86,
    glassBorderColor: 'rgba(220, 38, 38, 0.24)',
    tileBgColor: 'rgba(220, 38, 38, 0.055)',
    dotColor: 'rgba(185, 28, 28, 0.14)',
    inkColor: '#1E1B18',
    mutedColor: '#644D45',
    accentColor: '#DC2626',
    secondaryAccentColor: '#D97706',
    dotRingPrimaryColor: '#DC2626',
    dotRingSecondaryColor: '#D97706',
    glow1: { color: '#EF4444', x: 850, y: 200, radius: 280 },
    glow2: { color: '#F59E0B', x: 250, y: 590, radius: 290 },
    qrFgColor: '#1E1B18',
    qrBgColor: '#FFFFFF',
    signatureInkColor: '#1E1B18',
    motif: 'dot-grid-burst',
    titleStyle: 'accent-rule',
  },
  'blue-dark': {
    id: 'blue-dark',
    label: 'Deep Navy & Electric Blue',
    description: 'Maritime Grand Line navy with electric cobalt waves & cyan ink',
    mode: 'dark',
    backgroundColor: '#07122B',
    cardSurfaceColor: 'rgba(11, 25, 58, 0.78)',
    glassOpacity: 0.78,
    glassBorderColor: 'rgba(56, 189, 248, 0.28)',
    tileBgColor: 'rgba(26, 109, 255, 0.10)',
    dotColor: 'rgba(147, 197, 253, 0.15)',
    inkColor: '#F0F9FF',
    mutedColor: '#93C5FD',
    accentColor: '#38BDF8',
    secondaryAccentColor: '#EF4444',
    dotRingPrimaryColor: '#38BDF8',
    dotRingSecondaryColor: '#60A5FA',
    glow1: { color: '#1A6DFF', x: 290, y: 220, radius: 330 },
    glow2: { color: '#06B6D4', x: 860, y: 565, radius: 290 },
    qrFgColor: '#F0F9FF',
    qrBgColor: '#061024',
    signatureInkColor: '#E0F2FE',
    motif: 'dot-waves',
    titleStyle: 'mono-bracket',
  },
  'green-dark': {
    id: 'green-dark',
    label: 'Obsidian & Emerald Signal',
    description: 'Cyber-botanical dark slate with neon emerald spiral & mint accents',
    mode: 'dark',
    backgroundColor: '#06120D',
    cardSurfaceColor: 'rgba(9, 26, 19, 0.78)',
    glassOpacity: 0.78,
    glassBorderColor: 'rgba(34, 197, 94, 0.28)',
    tileBgColor: 'rgba(34, 197, 94, 0.08)',
    dotColor: 'rgba(134, 239, 172, 0.14)',
    inkColor: '#ECFDF5',
    mutedColor: '#86EFAC',
    accentColor: '#22C55E',
    secondaryAccentColor: '#38BDF8',
    dotRingPrimaryColor: '#22C55E',
    dotRingSecondaryColor: '#34D399',
    glow1: { color: '#22C55E', x: 840, y: 215, radius: 310 },
    glow2: { color: '#0EA5E9', x: 260, y: 575, radius: 310 },
    qrFgColor: '#ECFDF5',
    qrBgColor: '#040D09',
    signatureInkColor: '#D1FAE5',
    motif: 'dot-spiral',
    titleStyle: 'double-dot',
  },
  'amber-dark': {
    id: 'amber-dark',
    label: 'Midnight & Sovereign Gold',
    description: 'Imperial midnight vault with sovereign gold diamond lattice & gold ink',
    mode: 'dark',
    backgroundColor: '#0B0C14',
    cardSurfaceColor: 'rgba(20, 19, 28, 0.80)',
    glassOpacity: 0.80,
    glassBorderColor: 'rgba(245, 185, 66, 0.34)',
    tileBgColor: 'rgba(245, 185, 66, 0.085)',
    dotColor: 'rgba(245, 185, 66, 0.16)',
    inkColor: '#FFFBEB',
    mutedColor: '#FDE68A',
    accentColor: '#F5B942',
    secondaryAccentColor: '#EF4444',
    dotRingPrimaryColor: '#F5B942',
    dotRingSecondaryColor: '#EF4444',
    glow1: { color: '#F5B942', x: 275, y: 195, radius: 315 },
    glow2: { color: '#EF4444', x: 865, y: 590, radius: 280 },
    qrFgColor: '#FDE68A',
    qrBgColor: '#090A10',
    signatureInkColor: '#FDE68A',
    motif: 'dot-diamond',
    titleStyle: 'gold-trim',
  },
  'mono-light': {
    id: 'mono-light',
    label: 'Pure Nothing Daylight',
    description: 'High-contrast alabaster gallery sheet with cobalt & crimson dot stripes',
    mode: 'light',
    backgroundColor: '#FFFFFF',
    cardSurfaceColor: 'rgba(248, 250, 252, 0.90)',
    glassOpacity: 0.90,
    glassBorderColor: 'rgba(15, 23, 42, 0.18)',
    tileBgColor: 'rgba(15, 23, 42, 0.04)',
    dotColor: 'rgba(15, 23, 42, 0.15)',
    inkColor: '#0F172A',
    mutedColor: '#475569',
    accentColor: '#1A6DFF',
    secondaryAccentColor: '#EF4444',
    dotRingPrimaryColor: '#1A6DFF',
    dotRingSecondaryColor: '#EF4444',
    glow1: { color: '#1A6DFF', x: 255, y: 215, radius: 265 },
    glow2: { color: '#F5B942', x: 865, y: 580, radius: 265 },
    qrFgColor: '#0F172A',
    qrBgColor: '#FFFFFF',
    signatureInkColor: '#0F172A',
    motif: 'dot-stripes',
    titleStyle: 'minimal',
  },
};

export const CERTIFICATE_THEME_LIST: CertificateTheme[] = [
  CERTIFICATE_THEMES['default'],
  CERTIFICATE_THEMES['default-light'],
  CERTIFICATE_THEMES['red-dark'],
  CERTIFICATE_THEMES['light-red'],
  CERTIFICATE_THEMES['blue-dark'],
  CERTIFICATE_THEMES['green-dark'],
  CERTIFICATE_THEMES['amber-dark'],
  CERTIFICATE_THEMES['mono-light'],
];

/**
 * Optional static mapping keyed by `grand_line_id`.
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
  'dot-spiral',
  'dot-waves',
  'dot-diamond',
  'dot-grid-burst',
  'dot-rings',
  'dot-stripes',
];

const TITLE_STYLES: CertificateTitleStyle[] = [
  'gold-trim',
  'mono-bracket',
  'double-dot',
  'accent-rule',
  'solid',
  'minimal',
];

/**
 * Boardly palette combinations used by the deterministic Auto generator.
 * Includes a vibrant Violet/Cyber Indigo & Coral synthesis first so "Auto"
 * previews look immediately distinct from all 8 static presets.
 */
const AUTO_PALETTE_BASES: Array<{
  mode: 'dark' | 'light';
  bg: string;
  cardSurface: string;
  dot: string;
  ink: string;
  muted: string;
  accent: string;
  secondary: string;
  ringPrimary: string;
  ringSecondary: string;
  glowA: string;
  glowB: string;
  glassOpacity: number;
  glassBorder: string;
  tileBg: string;
  qrFg: string;
  qrBg: string;
  sigInk: string;
  labelPrefix: string;
}> = [
  {
    mode: 'dark',
    bg: '#0D0918',
    cardSurface: 'rgba(21, 15, 38, 0.78)',
    dot: 'rgba(196, 181, 253, 0.15)',
    ink: '#FAF5FF',
    muted: '#C4B5FD',
    accent: '#A855F7',
    secondary: '#F43F5E',
    ringPrimary: '#A855F7',
    ringSecondary: '#38BDF8',
    glowA: '#9333EA',
    glowB: '#F43F5E',
    glassOpacity: 0.78,
    glassBorder: 'rgba(168, 85, 247, 0.30)',
    tileBg: 'rgba(168, 85, 247, 0.085)',
    qrFg: '#FAF5FF',
    qrBg: '#090612',
    sigInk: '#F3E8FF',
    labelPrefix: 'Auto Spectrum Violet',
  },
  {
    mode: 'dark',
    bg: '#071318',
    cardSurface: 'rgba(10, 28, 36, 0.78)',
    dot: 'rgba(103, 232, 249, 0.14)',
    ink: '#ECFEFF',
    muted: '#67E8F9',
    accent: '#06B6D4',
    secondary: '#F5B942',
    ringPrimary: '#06B6D4',
    ringSecondary: '#F5B942',
    glowA: '#06B6D4',
    glowB: '#F5B942',
    glassOpacity: 0.78,
    glassBorder: 'rgba(6, 182, 212, 0.28)',
    tileBg: 'rgba(6, 182, 212, 0.08)',
    qrFg: '#ECFEFF',
    qrBg: '#050E12',
    sigInk: '#CFFAFE',
    labelPrefix: 'Auto Cyan Horizon',
  },
  {
    mode: 'light',
    bg: '#F3F6FA',
    cardSurface: 'rgba(255, 255, 255, 0.88)',
    dot: 'rgba(26, 109, 255, 0.14)',
    ink: '#0D1B3E',
    muted: '#475569',
    accent: '#1A6DFF',
    secondary: '#EF4444',
    ringPrimary: '#1A6DFF',
    ringSecondary: '#EF4444',
    glowA: '#1A6DFF',
    glowB: '#EF4444',
    glassOpacity: 0.88,
    glassBorder: 'rgba(26, 109, 255, 0.20)',
    tileBg: 'rgba(26, 109, 255, 0.05)',
    qrFg: '#0D1B3E',
    qrBg: '#FFFFFF',
    sigInk: '#0D1B3E',
    labelPrefix: 'Auto Cobalt Daylight',
  },
  {
    mode: 'dark',
    bg: '#09110E',
    cardSurface: 'rgba(12, 26, 21, 0.78)',
    dot: 'rgba(134, 239, 172, 0.13)',
    ink: '#F0FDF4',
    muted: '#86EFAC',
    accent: '#10B981',
    secondary: '#F5B942',
    ringPrimary: '#10B981',
    ringSecondary: '#F5B942',
    glowA: '#10B981',
    glowB: '#1A6DFF',
    glassOpacity: 0.78,
    glassBorder: 'rgba(16, 185, 129, 0.26)',
    tileBg: 'rgba(16, 185, 129, 0.07)',
    qrFg: '#F0FDF4',
    qrBg: '#060C0A',
    sigInk: '#D1FAE5',
    labelPrefix: 'Auto Emerald Matrix',
  },
  {
    mode: 'dark',
    bg: '#110B10',
    cardSurface: 'rgba(28, 16, 25, 0.78)',
    dot: 'rgba(244, 114, 182, 0.14)',
    ink: '#FDF2F8',
    muted: '#F9A8D4',
    accent: '#EC4899',
    secondary: '#F5B942',
    ringPrimary: '#EC4899',
    ringSecondary: '#F5B942',
    glowA: '#EC4899',
    glowB: '#F5B942',
    glassOpacity: 0.78,
    glassBorder: 'rgba(236, 72, 153, 0.28)',
    tileBg: 'rgba(236, 72, 153, 0.075)',
    qrFg: '#FDF2F8',
    qrBg: '#0C070B',
    sigInk: '#FCE7F3',
    labelPrefix: 'Auto Nova Rose',
  },
];

/**
 * Deterministic 32-bit FNV-1a hash with secondary avalanche mixing.
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
 * Generates a deterministic, unique CertificateTheme from `grandLineId` (and optional student seed)
 * so that when "Auto" is selected, each student/mock gets a distinct generated palette, glow coordinates,
 * and dot-matrix motif.
 */
export function generateDeterministicThemeForGrandLine(
  grandLineId: string,
  studentSeed?: string
): CertificateTheme {
  const cleanId = String(grandLineId || 'grand_line_mock').trim();
  const compositeSeed = studentSeed ? `${cleanId}::${studentSeed.trim()}` : cleanId;

  // Make sure the default preview seed lands on index 0 ("Auto Spectrum Violet") so it looks
  // unmistakably distinct from all 8 static presets in the theme picker.
  const isDefaultPreviewSeed =
    cleanId === 'default' || cleanId === 'grand_line_preview' || cleanId === 'auto';

  const h1 = hashGrandLineId(compositeSeed, 0x811c9dc5);
  const h2 = hashGrandLineId(`${compositeSeed}:glow`, 0x9e3779b9);
  const h3 = hashGrandLineId(`${compositeSeed}:motif`, 0x243f6a88);

  const paletteIdx = isDefaultPreviewSeed && !studentSeed ? 0 : h1 % AUTO_PALETTE_BASES.length;
  const palette = AUTO_PALETTE_BASES[paletteIdx];
  const motif = isDefaultPreviewSeed && !studentSeed ? 'dot-spiral' : MOTIFS[h3 % MOTIFS.length];
  const titleStyle =
    isDefaultPreviewSeed && !studentSeed
      ? 'mono-bracket'
      : TITLE_STYLES[(h1 >>> 4) % TITLE_STYLES.length];

  const glow1X = 200 + (h2 % 300); // 200..500
  const glow1Y = 160 + ((h2 >>> 8) % 220); // 160..380
  const glow1Radius = 260 + ((h2 >>> 16) % 80); // 260..340

  const glow2X = 640 + ((h3 >>> 3) % 300); // 640..940
  const glow2Y = 430 + ((h3 >>> 11) % 200); // 430..630
  const glow2Radius = 260 + ((h3 >>> 19) % 80); // 260..340

  const shortHash = (h1 & 0xffff).toString(16).toUpperCase().padStart(4, '0');

  return {
    id: `auto:${cleanId}`,
    label: `${palette.labelPrefix} #${shortHash}`,
    description:
      'Deterministically synthesized per student & mock — each winner receives a unique palette & dot motif',
    mode: palette.mode,
    backgroundColor: palette.bg,
    cardSurfaceColor: palette.cardSurface,
    dotColor: palette.dot,
    inkColor: palette.ink,
    mutedColor: palette.muted,
    accentColor: palette.accent,
    secondaryAccentColor: palette.secondary,
    dotRingPrimaryColor: palette.ringPrimary,
    dotRingSecondaryColor: palette.ringSecondary,
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
    qrFgColor: palette.qrFg,
    qrBgColor: palette.qrBg,
    signatureInkColor: palette.sigInk,
    motif,
    titleStyle,
  };
}

/**
 * Resolves the CertificateTheme for a given Grand Line mock or explicit theme object.
 * Priority:
 * 1. Explicit `themeOverride` object if passed directly
 * 2. Explicit `preferredThemeId` (if set and in `CERTIFICATE_THEMES`)
 * 3. If `preferredThemeId === 'auto'` or `null`/`undefined`:
 *    - Static `GRAND_LINE_THEME_MAP[grandLineId]` (only when preferredThemeId is undefined, not when 'auto' is explicitly chosen)
 *    - Deterministic auto-generated theme from `grandLineId` (+ optional `studentSeed`)
 */
export function resolveCertificateTheme(
  grandLineId: string,
  preferredThemeId?: string | null,
  studentSeed?: string,
  themeOverride?: CertificateTheme | null
): CertificateTheme {
  if (themeOverride && themeOverride.backgroundColor && themeOverride.accentColor) {
    return themeOverride;
  }

  const cleanPref = typeof preferredThemeId === 'string' ? preferredThemeId.trim() : '';
  if (cleanPref && cleanPref !== 'auto' && !cleanPref.startsWith('auto:')) {
    if (CERTIFICATE_THEMES[cleanPref]) {
      return CERTIFICATE_THEMES[cleanPref];
    }
  }

  if (cleanPref.startsWith('auto:')) {
    const seedFromId = cleanPref.slice(5) || grandLineId;
    return generateDeterministicThemeForGrandLine(seedFromId, studentSeed);
  }

  if (cleanPref === 'auto' || preferredThemeId === null) {
    return generateDeterministicThemeForGrandLine(grandLineId, studentSeed);
  }

  const mappedId = GRAND_LINE_THEME_MAP[grandLineId];
  if (!cleanPref && mappedId && CERTIFICATE_THEMES[mappedId]) {
    return CERTIFICATE_THEMES[mappedId];
  }

  return generateDeterministicThemeForGrandLine(grandLineId, studentSeed);
}
