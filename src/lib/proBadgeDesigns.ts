export const PRO_BADGE_IDS = [
  'ember',
  'neon',
  'holo',
  'hex',
  'pixel',
  'seal',
  'tag',
  'glass',
  'mono',
  'aurora',
  'emerald',
  'sakura',
  'chevron',
  'flame',
  'electric',
  'split',
  'ribbon',
  'sticker',
  'rainbow',
  'diamond',
  'shield',
  'arcade',
  'sunset',
  'chrome',
  'neonpink',
  'scale',
  'slash',
  'cosmic',
  'crownseal',
  'outline',
  'glitch',
] as const;

export type ProBadgeDesignId = (typeof PRO_BADGE_IDS)[number];

export const DEFAULT_PRO_BADGE_DESIGN: ProBadgeDesignId = 'ember';

export interface ProBadgeSettings {
  design: ProBadgeDesignId;
  visible: boolean;
}

export const DEFAULT_PRO_BADGE_SETTINGS: ProBadgeSettings = {
  design: DEFAULT_PRO_BADGE_DESIGN,
  visible: true,
};

const VALID_BADGE_SET = new Set<string>(PRO_BADGE_IDS);

export const STATIC_PRO_BADGE_IDS = new Set<ProBadgeDesignId>(['mono', 'chevron', 'ribbon']);

export const PIXEL_FONT_PRO_BADGE_IDS = new Set<ProBadgeDesignId>([
  'ember',
  'pixel',
  'emerald',
  'shield',
  'arcade',
  'glitch',
]);

export interface ProBadgeDesignMeta {
  id: ProBadgeDesignId;
  number: number;
  name: string;
  tagline: string;
  animated: boolean;
  font: 'doto' | 'space';
}

export const PRO_BADGE_DESIGNS: readonly ProBadgeDesignMeta[] = [
  { id: 'ember', number: 1, name: 'Ember Crown', tagline: 'Solar gold-to-crimson pill with crown & diagonal sweep', animated: true, font: 'doto' },
  { id: 'neon', number: 2, name: 'Neon Pulse', tagline: 'Obsidian pill with gold-red neon frame & pulsing glow', animated: true, font: 'space' },
  { id: 'holo', number: 3, name: 'Holo Foil', tagline: 'Pastel iridescent foil gradient that slides smoothly', animated: true, font: 'space' },
  { id: 'hex', number: 4, name: 'Hex Plate', tagline: 'Precision hexagon plate with gold-red edge pulse', animated: true, font: 'space' },
  { id: 'pixel', number: 5, name: '8-Bit Plaque', tagline: 'Stepped arcade plaque with bobbing pixel crown', animated: true, font: 'doto' },
  { id: 'seal', number: 6, name: 'Royal Seal', tagline: 'Radial gold crown medallion with pulsing outer ring', animated: true, font: 'space' },
  { id: 'tag', number: 7, name: 'Crimson Tag', tagline: 'Cut-corner red tag with glinting gold left stripe', animated: true, font: 'space' },
  { id: 'glass', number: 8, name: 'Ruby Glass', tagline: 'Translucent ruby pill with specular edge & sheen', animated: true, font: 'space' },
  { id: 'mono', number: 9, name: 'Mono Contrast', tagline: 'High-contrast minimal pill (static)', animated: false, font: 'space' },
  { id: 'aurora', number: 10, name: 'Aurora Flow', tagline: 'Flowing violet, cyan & mint northern lights', animated: true, font: 'space' },
  { id: 'emerald', number: 11, name: 'Emerald Matrix', tagline: 'Glowing terminal green pixel badge', animated: true, font: 'doto' },
  { id: 'sakura', number: 12, name: 'Sakura Blossom', tagline: 'Petal-pink gradient with twinkling star sparkle', animated: true, font: 'space' },
  { id: 'chevron', number: 13, name: 'Chevron Arrow', tagline: 'Sharp crimson arrow tag (static)', animated: false, font: 'space' },
  { id: 'flame', number: 14, name: 'Blaze Flame', tagline: 'Molten fire gradient with flickering flame icon', animated: true, font: 'space' },
  { id: 'electric', number: 15, name: 'Electric Bolt', tagline: 'Deep navy badge with cyan lightning flash', animated: true, font: 'space' },
  { id: 'split', number: 16, name: 'Split Crest', tagline: 'Gold crown block joined to dark obsidian label', animated: true, font: 'space' },
  { id: 'ribbon', number: 17, name: 'Gilded Ribbon', tagline: 'Notched gold heraldic banner (static)', animated: false, font: 'space' },
  { id: 'sticker', number: 18, name: 'Pop Sticker', tagline: 'Tilted yellow die-cut sticker with gentle wiggle', animated: true, font: 'space' },
  { id: 'rainbow', number: 19, name: 'Prism Circuit', tagline: 'Dark pill with flowing 4-color prism border', animated: true, font: 'space' },
  { id: 'diamond', number: 20, name: 'Glacier Diamond', tagline: 'Icy crystal gradient with glinting gem facet', animated: true, font: 'space' },
  { id: 'shield', number: 21, name: 'Aegis Shield', tagline: 'Crest shield with gold-red edge & Doto type', animated: true, font: 'doto' },
  { id: 'arcade', number: 22, name: 'Coin-Op Arcade', tagline: 'Yellow cartridge plate with blinking red LED tab', animated: true, font: 'doto' },
  { id: 'sunset', number: 23, name: 'Mirage Sunset', tagline: 'Shifting amber, coral & ultraviolet dusk gradient', animated: true, font: 'space' },
  { id: 'chrome', number: 24, name: 'Liquid Chrome', tagline: 'Brushed silver metal pill with sweeping sheen', animated: true, font: 'space' },
  { id: 'neonpink', number: 25, name: 'Cyber Magenta', tagline: 'Midnight violet with flickering magenta neon tube', animated: true, font: 'space' },
  { id: 'scale', number: 26, name: 'Dragon Scale', tagline: 'Crimson scale armor pattern with golden shimmer', animated: true, font: 'space' },
  { id: 'slash', number: 27, name: 'Katana Slash', tagline: 'Slanted dark tag with red block & white blade flash', animated: true, font: 'space' },
  { id: 'cosmic', number: 28, name: 'Cosmic Nebula', tagline: 'Deep night sky with twinkling constellation stars', animated: true, font: 'space' },
  { id: 'crownseal', number: 29, name: 'Obsidian Seal', tagline: 'Dark round seal with gold ring & glowing crown', animated: true, font: 'space' },
  { id: 'outline', number: 30, name: 'Live Signal', tagline: 'Minimal hair-line outline with pulsing red indicator', animated: true, font: 'space' },
  { id: 'glitch', number: 31, name: 'Cyber Glitch', tagline: 'Chromatic RGB split shadow with periodic jitter', animated: true, font: 'doto' },
] as const;

export function isValidProBadgeDesign(val: unknown): val is ProBadgeDesignId {
  return typeof val === 'string' && VALID_BADGE_SET.has(val.trim().toLowerCase());
}

export function normalizeProBadgeDesign(val: unknown): ProBadgeDesignId {
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase();
    if (VALID_BADGE_SET.has(clean)) {
      return clean as ProBadgeDesignId;
    }
  }
  return DEFAULT_PRO_BADGE_DESIGN;
}

export function validateProBadgePayload(raw: unknown): {
  valid: boolean;
  value?: ProBadgeSettings;
  error?: string;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Payload must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const rawDesign = typeof obj.design === 'string' ? obj.design.trim().toLowerCase() : '';
  if (!isValidProBadgeDesign(rawDesign)) {
    return {
      valid: false,
      error: `Invalid badge design "${String(obj.design ?? '')}". Must be one of the 31 whitelisted designs.`,
    };
  }
  if (typeof obj.visible !== 'boolean') {
    return {
      valid: false,
      error: 'Field "visible" must be a boolean (true or false).',
    };
  }
  return {
    valid: true,
    value: {
      design: rawDesign,
      visible: obj.visible,
    },
  };
}
