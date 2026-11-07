/**
 * Boardly Certificate Theme Configurations
 * ============================================================================
 * Defines reusable certificate themes using the Boardly palette.
 * Reusable designs with dark & light modes, dot colors, ink colors,
 * accent colors, dual glows, glass opacity, and decorative dot motifs.
 *
 * Adding a new theme is a config-only change.
 */

export type CertificateMotifType =
  | 'dot-rings'
  | 'dot-waves'
  | 'dot-grid-burst'
  | 'dot-spiral'
  | 'dot-stripes'
  | 'dot-diamond';

export interface CertificateTheme {
  id: string;
  label: string;
  mode: 'dark' | 'light';
  backgroundColor: string;
  dotColor: string;
  inkColor: string;
  mutedColor: string;
  accentColor: string;
  glowColor1: string;
  glowColor2: string;
  glassOpacity: number;
  glassBorder: string;
  motifType: CertificateMotifType;
}

export const CERTIFICATE_THEMES: Record<string, CertificateTheme> = {
  'red-dark': {
    id: 'red-dark',
    label: 'Grand Crimson',
    mode: 'dark',
    backgroundColor: '#07070a',
    dotColor: '#261b20',
    inkColor: '#f8fafc',
    mutedColor: '#a1a1aa',
    accentColor: '#ef4444',
    glowColor1: 'rgba(239, 68, 68, 0.22)',
    glowColor2: 'rgba(184, 17, 29, 0.16)',
    glassOpacity: 0.76,
    glassBorder: 'rgba(255, 255, 255, 0.14)',
    motifType: 'dot-rings',
  },
  'light-red': {
    id: 'light-red',
    label: 'Studio Pure',
    mode: 'light',
    backgroundColor: '#f6f6f8',
    dotColor: '#e4e4ed',
    inkColor: '#0f172a',
    mutedColor: '#52525b',
    accentColor: '#d91422',
    glowColor1: 'rgba(217, 20, 34, 0.12)',
    glowColor2: 'rgba(255, 107, 116, 0.08)',
    glassOpacity: 0.86,
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    motifType: 'dot-waves',
  },
  'blue-dark': {
    id: 'blue-dark',
    label: 'Ocean Navy',
    mode: 'dark',
    backgroundColor: '#060a16',
    dotColor: '#121f3d',
    inkColor: '#f1f5f9',
    mutedColor: '#94a3b8',
    accentColor: '#1a6dff',
    glowColor1: 'rgba(26, 109, 255, 0.24)',
    glowColor2: 'rgba(13, 27, 62, 0.40)',
    glassOpacity: 0.74,
    glassBorder: 'rgba(147, 197, 253, 0.18)',
    motifType: 'dot-grid-burst',
  },
  'green-dark': {
    id: 'green-dark',
    label: 'Emerald Matrix',
    mode: 'dark',
    backgroundColor: '#050f09',
    dotColor: '#13281a',
    inkColor: '#f0fdf4',
    mutedColor: '#86efac',
    accentColor: '#22c55e',
    glowColor1: 'rgba(34, 197, 94, 0.20)',
    glowColor2: 'rgba(15, 56, 32, 0.35)',
    glassOpacity: 0.74,
    glassBorder: 'rgba(187, 247, 208, 0.16)',
    motifType: 'dot-diamond',
  },
  'amber-dark': {
    id: 'amber-dark',
    label: 'Solar Gold',
    mode: 'dark',
    backgroundColor: '#0f0c05',
    dotColor: '#2d2210',
    inkColor: '#fffbeb',
    mutedColor: '#fde68a',
    accentColor: '#f5b942',
    glowColor1: 'rgba(245, 185, 66, 0.20)',
    glowColor2: 'rgba(120, 53, 15, 0.35)',
    glassOpacity: 0.74,
    glassBorder: 'rgba(254, 240, 138, 0.16)',
    motifType: 'dot-spiral',
  },
  'mono-light': {
    id: 'mono-light',
    label: 'Slate Minimal',
    mode: 'light',
    backgroundColor: '#f8fafc',
    dotColor: '#e2e8f0',
    inkColor: '#0f172a',
    mutedColor: '#64748b',
    accentColor: '#1e293b',
    glowColor1: 'rgba(100, 116, 139, 0.10)',
    glowColor2: 'rgba(15, 23, 42, 0.06)',
    glassOpacity: 0.88,
    glassBorder: 'rgba(15, 23, 42, 0.08)',
    motifType: 'dot-stripes',
  },
};

export const CERTIFICATE_THEME_LIST = Object.values(CERTIFICATE_THEMES);

/**
 * Deterministic hash from string into a positive integer
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

const MOTIFS: CertificateMotifType[] = [
  'dot-rings',
  'dot-waves',
  'dot-grid-burst',
  'dot-spiral',
  'dot-stripes',
  'dot-diamond',
];

/**
 * Resolves certificate theme.
 * If themeId is empty, null, or 'auto', derives a unique, deterministic design from mockId.
 * Never fails and never falls back to a plain template.
 */
export function resolveCertificateTheme(
  themeId: string | null | undefined,
  mockId: string
): CertificateTheme {
  const cleanId = (themeId || '').trim().toLowerCase();
  if (cleanId && cleanId !== 'auto' && CERTIFICATE_THEMES[cleanId]) {
    return CERTIFICATE_THEMES[cleanId];
  }

  // Deterministically generate a unique theme from mockId
  const seed = hashString(mockId || 'grand-line-mock-seed');
  const themeKeys = Object.keys(CERTIFICATE_THEMES);
  const baseTheme = CERTIFICATE_THEMES[themeKeys[seed % themeKeys.length]];
  const selectedMotif = MOTIFS[(seed >> 3) % MOTIFS.length];

  // Variations on glow positions and intensity based on seed bits
  const hueShift = (seed % 30) - 15;
  const opacityOffset = ((seed % 10) - 5) / 100;

  return {
    ...baseTheme,
    id: `auto-${mockId}`,
    label: `Auto (${baseTheme.label})`,
    motifType: selectedMotif,
    glassOpacity: Math.min(0.92, Math.max(0.68, baseTheme.glassOpacity + opacityOffset)),
  };
}
