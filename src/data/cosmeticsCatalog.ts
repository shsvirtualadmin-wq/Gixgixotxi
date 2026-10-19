import type { CosmeticType, CosmeticRarity } from '@/types';

export interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticType;
  priceKobans: number;
  rarity: CosmeticRarity;
  description: string;
  isAnimated: boolean;
  previewColor?: string;
}

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // ─── 6 AVATAR FRAMES ───────────────────────────────────────────────────────
  {
    id: 'frame-bronze-ronin',
    name: 'Bronze Ronin',
    type: 'frame',
    priceKobans: 500,
    rarity: 'common',
    description: 'Subtle antique bronze ring with 4 corner studs and brushed finish.',
    isAnimated: false,
    previewColor: '#B8740A',
  },
  {
    id: 'frame-neon-cyber',
    name: 'Neon Cyber-Karachi',
    type: 'frame',
    priceKobans: 800,
    rarity: 'rare',
    description: 'Pulsing dual neon ring with cyan and magenta laser discharge.',
    isAnimated: true,
    previewColor: '#00F0FF',
  },
  {
    id: 'frame-crimson-flame',
    name: 'Crimson Flame',
    type: 'frame',
    priceKobans: 1200,
    rarity: 'rare',
    description: 'Boardly-red fire gradient with slow atmospheric flicker and embers.',
    isAnimated: true,
    previewColor: '#D71920',
  },
  {
    id: 'frame-sakura-blossom',
    name: 'Sakura Blossom',
    type: 'frame',
    priceKobans: 1500,
    rarity: 'epic',
    description: 'Soft pink petal ring with three floating blossom accents.',
    isAnimated: true,
    previewColor: '#FF94B8',
  },
  {
    id: 'frame-void-shinobi',
    name: 'Void Shinobi',
    type: 'frame',
    priceKobans: 2000,
    rarity: 'epic',
    description: 'Deep violet smoky border with glowing purple stealth accents.',
    isAnimated: true,
    previewColor: '#A855F7',
  },
  {
    id: 'frame-superadmin-crown',
    name: 'Superadmin Crown',
    type: 'frame',
    priceKobans: 5000,
    rarity: 'legendary',
    description: 'Golden imperial laurel wreath with ruby crest and polished shine.',
    isAnimated: true,
    previewColor: '#FFD700',
  },

  // ─── 6 NAMEPLATES ──────────────────────────────────────────────────────────
  {
    id: 'plate-slate-scholar',
    name: 'Slate Scholar',
    type: 'nameplate',
    priceKobans: 400,
    rarity: 'common',
    description: 'Charcoal minimalist pill with subtle grid matrix dots.',
    isAnimated: false,
    previewColor: '#4A4A4A',
  },
  {
    id: 'plate-golden-honor',
    name: 'Golden Honor',
    type: 'nameplate',
    priceKobans: 900,
    rarity: 'rare',
    description: 'Gold gradient badge with etched borders and precision bevels.',
    isAnimated: false,
    previewColor: '#E8A317',
  },
  {
    id: 'plate-midnight-syndicate',
    name: 'Midnight Syndicate',
    type: 'nameplate',
    priceKobans: 1100,
    rarity: 'rare',
    description: 'Deep navy badge with animated electric-blue pinstripe glow.',
    isAnimated: true,
    previewColor: '#3B82F6',
  },
  {
    id: 'plate-bloodline-nakama',
    name: 'Bloodline Nakama',
    type: 'nameplate',
    priceKobans: 1600,
    rarity: 'epic',
    description: 'Boardly-red brushed carbon texture with bold Japanese crest.',
    isAnimated: false,
    previewColor: '#D71920',
  },
  {
    id: 'plate-cyber-samurai',
    name: 'Cyber Samurai',
    type: 'nameplate',
    priceKobans: 2200,
    rarity: 'epic',
    description: 'Dark slate badge with angled corner cuts and hazard warning lines.',
    isAnimated: true,
    previewColor: '#F59E0B',
  },
  {
    id: 'plate-galaxy-pioneer',
    name: 'Galaxy Pioneer',
    type: 'nameplate',
    priceKobans: 3500,
    rarity: 'legendary',
    description: 'Deep cosmic purple gradient with slow twinkling star constellations.',
    isAnimated: true,
    previewColor: '#8B5CF6',
  },

  // ─── 6 PROFILE / AVATAR EFFECTS ───────────────────────────────────────────
  {
    id: 'effect-faint-sparkles',
    name: 'Faint Sparkles',
    type: 'effect',
    priceKobans: 600,
    rarity: 'common',
    description: 'Four small gold 4-point stars floating gently upward.',
    isAnimated: true,
    previewColor: '#FFD66B',
  },
  {
    id: 'effect-ember-drift',
    name: 'Ember Drift',
    type: 'effect',
    priceKobans: 1000,
    rarity: 'rare',
    description: 'Slow crimson embers rising softly around your avatar.',
    isAnimated: true,
    previewColor: '#EF4444',
  },
  {
    id: 'effect-electric-aura',
    name: 'Electric Aura',
    type: 'effect',
    priceKobans: 1400,
    rarity: 'rare',
    description: 'Crackling cyan energy arcs surging across the avatar edge.',
    isAnimated: true,
    previewColor: '#06B6D4',
  },
  {
    id: 'effect-cherry-storm',
    name: 'Cherry Storm',
    type: 'effect',
    priceKobans: 1800,
    rarity: 'epic',
    description: 'Swirling pink sakura petal storm dancing in the wind.',
    isAnimated: true,
    previewColor: '#F472B6',
  },
  {
    id: 'effect-shadow-haze',
    name: 'Shadow Haze',
    type: 'effect',
    priceKobans: 2400,
    rarity: 'epic',
    description: 'Deep shadowy smoke vignette pulsing smoothly around borders.',
    isAnimated: true,
    previewColor: '#6B21A8',
  },
  {
    id: 'effect-divine-radiance',
    name: 'Divine Radiance',
    type: 'effect',
    priceKobans: 4000,
    rarity: 'legendary',
    description: 'Spinning celestial golden sunburst rays radiating outward.',
    isAnimated: true,
    previewColor: '#FBBF24',
  },
];

export function getCosmeticById(id: string): CosmeticItem | undefined {
  return COSMETICS_CATALOG.find((item) => item.id === id);
}

export function getCosmeticsByType(type: CosmeticType): CosmeticItem[] {
  return COSMETICS_CATALOG.filter((item) => item.type === type);
}
