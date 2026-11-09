export type KobanDesignId = 'star' | 'hex' | 'pixel' | 'orb' | 'crystal' | 'chip';
export type KobanMotionMode = 'off' | 'subtle' | 'lively';

export interface KobanStyleSettings {
  design: KobanDesignId;
  mainColor: string;
  accentColor: string;
  glowColor: string;
  glow: number; // integer 0 to 100
  motion: KobanMotionMode;
  sparkle: boolean;
}

export interface KobanDesignMeta {
  id: KobanDesignId;
  name: string;
  proOnly: boolean;
}

export const KOBAN_DESIGNS: KobanDesignMeta[] = [
  { id: 'star', name: 'Shuriken Star', proOnly: false },
  { id: 'hex', name: 'Rune Hex', proOnly: false },
  { id: 'pixel', name: 'Pixel Gem', proOnly: false },
  { id: 'orb', name: 'Energy Orb', proOnly: false },
  { id: 'crystal', name: 'Crystal Shards', proOnly: false },
  { id: 'chip', name: 'Neon K Chip', proOnly: false },
];

export const VALID_KOBAN_DESIGN_IDS = new Set<KobanDesignId>(
  KOBAN_DESIGNS.map((d) => d.id)
);

export const VALID_KOBAN_MOTIONS = new Set<KobanMotionMode>(['off', 'subtle', 'lively']);

export const DEFAULT_KOBAN_STYLE: KobanStyleSettings = {
  design: 'chip',
  mainColor: '#ffc93f',
  accentColor: '#e11d2e',
  glowColor: '#ff8a1f',
  glow: 80,
  motion: 'subtle',
  sparkle: true,
};

export interface KobanPalettePreset {
  id: string;
  label: string;
  mainColor: string;
  accentColor: string;
  glowColor: string;
}

export const KOBAN_PALETTE_PRESETS: KobanPalettePreset[] = [
  {
    id: 'ember',
    label: 'Ember',
    mainColor: '#ffc93f',
    accentColor: '#e11d2e',
    glowColor: '#ff8a1f',
  },
  {
    id: 'gold',
    label: 'Gold',
    mainColor: '#ffd666',
    accentColor: '#c77700',
    glowColor: '#ffb020',
  },
  {
    id: 'ice',
    label: 'Ice',
    mainColor: '#9be8ff',
    accentColor: '#1f6fff',
    glowColor: '#4cc3ff',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    mainColor: '#8dffb8',
    accentColor: '#0a8f4d',
    glowColor: '#3ddc84',
  },
  {
    id: 'violet',
    label: 'Violet',
    mainColor: '#d9b8ff',
    accentColor: '#6a2bd9',
    glowColor: '#a66bff',
  },
  {
    id: 'sakura',
    label: 'Sakura',
    mainColor: '#ffc9e0',
    accentColor: '#d4145a',
    glowColor: '#ff6fa8',
  },
  {
    id: 'mono',
    label: 'Mono',
    mainColor: '#ffffff',
    accentColor: '#6b6b75',
    glowColor: '#ffffff',
  },
];

export const HEX6_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function isValidHex6(value: unknown): value is string {
  return typeof value === 'string' && HEX6_COLOR_REGEX.test(value);
}

export function normalizeHex6(value: string, fallback = '#ffc93f'): string {
  if (!isValidHex6(value)) return fallback.toLowerCase();
  return value.toLowerCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = isValidHex6(hex) ? hex.slice(1) : 'ffc93f';
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Mixes colorA with colorB by `weightBPercent` (0 to 100).
 * Example: mix(main, '#ffffff', 70) -> 30% main + 70% white.
 */
export function mix(colorA: string, colorB: string, weightBPercent: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const wB = Math.max(0, Math.min(100, weightBPercent)) / 100;
  const wA = 1 - wB;
  return rgbToHex(a.r * wA + b.r * wB, a.g * wA + b.g * wB, a.b * wA + b.b * wB);
}

export interface DerivedKobanColors {
  light: string;
  mid: string;
  midDeep: string;
  deep: string;
  ink: string;
  kcolor: string;
  pixelOutline: string;
  pixelMidDeep: string;
  glowRgb: { r: number; g: number; b: number };
}

/**
 * Derives the exact palette stops required by the 6 SVG Koban designs:
 * - light = mix(main, white, 70%)
 * - mid = main
 * - deep = accent
 * - ink = mix(accent, black, 80%)
 * - kcolor = light
 */
export function deriveKobanColors(
  mainColor: string,
  accentColor: string,
  glowColor: string
): DerivedKobanColors {
  const main = normalizeHex6(mainColor, DEFAULT_KOBAN_STYLE.mainColor);
  const accent = normalizeHex6(accentColor, DEFAULT_KOBAN_STYLE.accentColor);
  const glow = normalizeHex6(glowColor, DEFAULT_KOBAN_STYLE.glowColor);

  const light = mix(main, '#ffffff', 70);
  const mid = main;
  const deep = accent;
  const ink = mix(accent, '#000000', 80);
  const kcolor = light;
  const midDeep = mix(mid, deep, 50);
  const pixelOutline = mix(deep, '#000000', 55);

  return {
    light,
    mid,
    midDeep,
    deep,
    ink,
    kcolor,
    pixelOutline,
    pixelMidDeep: midDeep,
    glowRgb: hexToRgb(glow),
  };
}

/**
 * Relative luminance per WCAG 2.1 (0.0 darkest to 1.0 brightest)
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * If a user picks a very dark mainColor that would disappear on the dark #07070a background,
 * nudges it lighter so the icon stays clearly visible at 16px.
 */
export function nudgeMainColorForReadability(hex: string): {
  color: string;
  nudged: boolean;
} {
  const normalized = normalizeHex6(hex, DEFAULT_KOBAN_STYLE.mainColor);
  const darkBg = '#07070a';
  const contrast = getContrastRatio(normalized, darkBg);
  if (contrast >= 2.6) {
    return { color: normalized, nudged: false };
  }

  let candidate = normalized;
  for (let pct = 15; pct <= 75; pct += 10) {
    candidate = mix(normalized, '#ffffff', pct);
    if (getContrastRatio(candidate, darkBg) >= 2.8) {
      return { color: candidate, nudged: true };
    }
  }
  return { color: candidate, nudged: true };
}

export interface ValidationResult {
  valid: boolean;
  value?: KobanStyleSettings;
  error?: string;
}

/**
 * Strictly validates user-supplied Koban style settings.
 * Rejects any unexpected values, non-hex colors, out-of-range glow, or unreadable contrast.
 */
export function validateKobanStylePayload(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, error: 'Invalid payload: expected a JSON object.' };
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.design !== 'string' || !VALID_KOBAN_DESIGN_IDS.has(raw.design as KobanDesignId)) {
    return {
      valid: false,
      error: 'Invalid design: must be one of star, hex, pixel, orb, crystal, chip.',
    };
  }

  if (!isValidHex6(raw.mainColor)) {
    return {
      valid: false,
      error: 'Invalid mainColor: must be a 6-digit hex color (#RRGGBB).',
    };
  }

  if (!isValidHex6(raw.accentColor)) {
    return {
      valid: false,
      error: 'Invalid accentColor: must be a 6-digit hex color (#RRGGBB).',
    };
  }

  if (!isValidHex6(raw.glowColor)) {
    return {
      valid: false,
      error: 'Invalid glowColor: must be a 6-digit hex color (#RRGGBB).',
    };
  }

  if (
    typeof raw.glow !== 'number' ||
    !Number.isInteger(raw.glow) ||
    raw.glow < 0 ||
    raw.glow > 100
  ) {
    return {
      valid: false,
      error: 'Invalid glow: must be an integer between 0 and 100.',
    };
  }

  if (typeof raw.motion !== 'string' || !VALID_KOBAN_MOTIONS.has(raw.motion as KobanMotionMode)) {
    return {
      valid: false,
      error: 'Invalid motion: must be one of off, subtle, lively.',
    };
  }

  if (typeof raw.sparkle !== 'boolean') {
    return {
      valid: false,
      error: 'Invalid sparkle: must be a boolean.',
    };
  }

  const mainColor = raw.mainColor.toLowerCase();
  const accentColor = raw.accentColor.toLowerCase();
  const glowColor = raw.glowColor.toLowerCase();

  // Check readability on dark background (#07070a) so the icon is never invisible at 16px
  const bgContrast = getContrastRatio(mainColor, '#07070a');
  if (bgContrast < 1.8) {
    return {
      valid: false,
      error: 'Main color is too dark to be visible on dark surfaces. Please choose a brighter main color.',
    };
  }

  return {
    valid: true,
    value: {
      design: raw.design as KobanDesignId,
      mainColor,
      accentColor,
      glowColor,
      glow: raw.glow,
      motion: raw.motion as KobanMotionMode,
      sparkle: raw.sparkle,
    },
  };
}
