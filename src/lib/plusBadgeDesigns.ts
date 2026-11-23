import type React from 'react';

export interface PlusBadgeDesignMeta {
  /** 1-based canonical PLUS badge ID (1..50). */
  id: number;
  number: number;
  name: string;
  tagline: string;
  /** Exact inline CSS string from plus-badges.html */
  cssText: string;
  /** Pre-parsed React inline styles (including CSS custom properties like --t) */
  style: React.CSSProperties;
  /** Exact class names from plus-badges.html (e.g., 'orbit', 'halo', 'star twk', 'px', '') */
  animClass: string;
  /** Exact icon glyph from plus-badges.html */
  icon: string;
  /** True when the badge has a CSS keyframe animation */
  animated: boolean;
  /** Explicit "Static" tag in the design spec */
  staticTag: boolean;
}

/**
 * Classes from plus-badges.html that are purely structural/typographic (not animated).
 */
const NON_ANIMATED_CLASSES = new Set(['', 'px', 'spl', 'stk']);

function hasAnimatedClass(animClass: string): boolean {
  const tokens = animClass.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.some((tok) => !NON_ANIMATED_CLASSES.has(tok));
}

/**
 * Safely parses a CSS declaration list (including `--custom` vars and `-webkit-*` properties)
 * into a React.CSSProperties object without mutating values or stripping parentheses.
 */
function parseInlineCssText(cssText: string): React.CSSProperties {
  const result: Record<string, string> = {};
  let current = '';
  let parenDepth = 0;

  const commitDecl = (decl: string) => {
    const trimmed = decl.trim();
    if (!trimmed) return;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx <= 0) return;
    const rawProp = trimmed.slice(0, colonIdx).trim();
    const rawVal = trimmed.slice(colonIdx + 1).trim();
    if (!rawProp || !rawVal) return;

    if (rawProp.startsWith('--')) {
      result[rawProp] = rawVal;
      return;
    }

    // Convert kebab-case to camelCase (handling -webkit- -> Webkit)
    const camel = rawProp.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    result[camel] = rawVal;
  };

  for (let i = 0; i < cssText.length; i++) {
    const ch = cssText[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')' && parenDepth > 0) parenDepth--;
    else if (ch === ';' && parenDepth === 0) {
      commitDecl(current);
      current = '';
      continue;
    }
    current += ch;
  }
  commitDecl(current);

  return result as React.CSSProperties;
}

type RawBadgeTuple = readonly [
  name: string,
  tagline: string,
  cssText: string,
  animClass: string,
  icon: string,
  staticFlag?: 1,
];

const RAW_PLUS_BADGES: readonly RawBadgeTuple[] = [
  [
    'Comet Orbit',
    'Dark pill with a gold-white comet circling the border',
    'background:linear-gradient(#0e0b1f,#0e0b1f) padding-box,conic-gradient(from var(--a),rgba(255,212,92,.22) 0 62%,#ffd45c 82%,#fff 100%) border-box;color:#fff;border:2px solid transparent;box-shadow:0 0 14px rgba(255,200,90,.35);padding:5px 12px',
    'orbit',
    '✦',
  ],
  [
    'Neon Halo',
    'Dark gold pill with a floating halo above it',
    'background:linear-gradient(#2a2208,#0d0b04);color:#ffd45c;border-color:#6b5314;box-shadow:0 0 10px rgba(255,212,92,.25)',
    'halo',
    '◎',
  ],
  [
    'Holo Foil',
    'Iridescent pastel foil that tilts like a trading card',
    'background:conic-gradient(from 200deg at 30% 40%,#ffd1f7,#b9e8ff,#d2ffd9,#fff1b8,#ffd1f7);color:#2a2540;border-radius:5px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.65)',
    'tilt',
    '✦',
  ],
  [
    'Hex Plate',
    'Brushed steel plate with side rivets',
    'background:radial-gradient(circle at 6px 50%,#9fb3c8 0 1.6px,transparent 2.3px),radial-gradient(circle at calc(100% - 6px) 50%,#9fb3c8 0 1.6px,transparent 2.3px),repeating-linear-gradient(90deg,#2b3340 0 2px,#252c37 2px 4px);color:#d7e6f5;border:1px solid #556377;border-radius:3px;padding:5px 17px',
    '',
    '⬢',
  ],
  [
    '8-Bit Plaque',
    'Purple pixel-font plaque with stepped pixel corners',
    'background:#5b21b6;color:#fde047;border:0;border-radius:0;padding:6px 14px;clip-path:polygon(0 4px,4px 4px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px))',
    'px',
    '▣',
  ],
  [
    'Velvet Seal',
    'Purple velvet medallion with a double gold frame',
    'background:radial-gradient(circle at 30% 30%,#7c3aed,#3b0f77);color:#fbd75b;border:3px double #f5c542;border-radius:10px;padding:4px 12px',
    '',
    '♕',
  ],
  [
    'Crimson Tag',
    'Red luggage tag with a punched eyelet hole',
    'background:radial-gradient(circle at 11px 50%,var(--card) 0 2.5px,transparent 3px),linear-gradient(#e11d2e,#a30f1a);color:#fff;border-radius:0;padding:6px 14px 6px 22px;clip-path:polygon(9px 0,100% 0,100% 100%,9px 100%,0 50%)',
    '',
    '◆',
  ],
  [
    'Ruby Glass',
    'Translucent ruby glass with twinkling sparkles',
    'background:radial-gradient(circle at 20% 30%,#fff 0 1px,transparent 1.6px),radial-gradient(circle at 75% 65%,#fff 0 1px,transparent 1.6px),radial-gradient(circle at 60% 22%,#fff 0 .8px,transparent 1.4px),linear-gradient(135deg,rgba(255,60,90,.9),rgba(120,0,30,.95));color:#fff;border-color:rgba(255,160,175,.6)',
    'spk',
    '◈',
  ],
  [
    'Mono Contrast',
    'Minimal crisp white stamp with wide letter spacing (static)',
    'background:#fff;color:#000;border-radius:3px;padding:6px 14px;letter-spacing:.22em;box-shadow:inset 0 0 0 2px #fff,inset 0 0 0 3.5px #000',
    '',
    '●',
    1,
  ],
  [
    'Aurora Flow',
    'Dark night with drifting green, violet and cyan curtains',
    'background:linear-gradient(90deg,transparent,rgba(52,211,153,.8),transparent) 0 0/200% 100%,linear-gradient(90deg,transparent,rgba(139,92,246,.8),transparent) 60% 0/200% 100%,linear-gradient(90deg,transparent,rgba(34,211,238,.7),transparent) 120% 0/200% 100%,#06101f;color:#e0fff4',
    'au',
    '✦',
  ],
  [
    'Emerald Matrix',
    'Dark green terminal plate with falling code rain',
    'background:#04150b;color:#4ade80;border:1px solid #14532d;border-radius:2px;text-shadow:0 0 6px rgba(74,222,128,.8);box-shadow:0 0 12px rgba(34,197,94,.35)',
    'rain',
    '▚',
  ],
  [
    'Sakura Blossom',
    'Petal-shaped pink pill that sways gently',
    'background:radial-gradient(circle at 18% 35%,#fff 0 1.5px,transparent 2px),radial-gradient(circle at 82% 65%,#fff 0 1.5px,transparent 2px),linear-gradient(135deg,#ffd6e8,#ff9ec7);color:#6b1038;border-radius:16px 2px 16px 2px',
    'sw',
    '✿',
  ],
  [
    'Chevron Arrow',
    'Stepped indigo arrow pointer tag (static)',
    'background:linear-gradient(90deg,#312e81 0 12%,#4338ca 12% 26%,#6366f1 26% 46%,#818cf8 46%);color:#fff;border-radius:0;padding:5px 18px 5px 12px;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%)',
    '',
    '❯',
    1,
  ],
  [
    'Blaze Flame',
    'Molten fire pill with dancing amber flames',
    'background:radial-gradient(ellipse at 50% 125%,#ffd600 0 30%,transparent 62%),radial-gradient(ellipse at 18% 115%,#ff9100 0 32%,transparent 66%),radial-gradient(ellipse at 82% 115%,#ff6d00 0 32%,transparent 66%),#7f1d00;color:#fff;text-shadow:0 1px 2px #3a0d00',
    'fire',
    '✹',
  ],
  [
    'Electric Bolt',
    'Jagged navy voltage plate with lightning flashes',
    'background:linear-gradient(115deg,#0a1a3a 0 45%,#1e40af 45% 55%,#0a1a3a 55%);color:#bfe9ff;border-radius:0;padding:5px 14px;clip-path:polygon(0 0,100% 0,93% 32%,100% 55%,91% 100%,0 100%,7% 66%,0 40%)',
    'zap',
    'ϟ',
  ],
  [
    'Split Crest',
    'Two-tone gold and midnight crest pill',
    'background:linear-gradient(90deg,#f5c542 0 30%,#0e1a3a 30%);color:#f5c542;border:1px solid #f5c542;border-radius:4px 14px 14px 4px;padding-left:8px',
    'spl',
    '♔',
  ],
  [
    'Pop Sticker',
    'Tilted glossy die-cut sticker with peeled corner',
    'background:linear-gradient(165deg,rgba(255,255,255,.45) 0 38%,transparent 38%),linear-gradient(135deg,#ff5fa2,#ff8a3d);color:#fff;border:3px solid #fff;border-radius:12px;box-shadow:0 3px 8px rgba(0,0,0,.45);text-shadow:0 1px 0 rgba(0,0,0,.35);transform:rotate(-2deg);padding:5px 12px',
    'stk',
    '★',
  ],
  [
    'Prism Circuit',
    'Obsidian plate with slanted rainbow prism strip',
    'background:linear-gradient(102deg,#0d0d16 0 calc(100% - 26px),transparent calc(100% - 26px)),linear-gradient(90deg,#ef4444,#f59e0b,#fde047,#22c55e,#3b82f6,#8b5cf6);color:#fff;padding-right:34px;border-radius:4px',
    '',
    '⌬',
  ],
  [
    'Glacier Diamond',
    'Faceted icy crystal glass with spinning snowflake',
    'background:linear-gradient(60deg,transparent 48%,rgba(255,255,255,.8) 48.5% 49.5%,transparent 50%),linear-gradient(120deg,transparent 30%,rgba(255,255,255,.7) 30.5% 31.2%,transparent 31.7%),linear-gradient(135deg,#e0f7ff,#8fd3ff 50%,#c9f0ff);color:#08324a;border-radius:6px;box-shadow:inset 0 0 8px rgba(255,255,255,.9)',
    'spn',
    '❄',
  ],
  [
    'Aegis Shield',
    'Split crimson and gold pointed crest shield',
    'background:linear-gradient(90deg,#b01822 50%,#e0b341 50%);color:#fff;text-shadow:0 1px 2px #000;border-radius:0;padding:6px 16px 13px;clip-path:polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)',
    '',
    '✠',
  ],
  [
    'Coin-Op Arcade',
    'Retro arcade marquee with blinking dotted border',
    'background:#0a0a12;color:#ffd200;border:3px dotted #ffd200;border-radius:8px;font-style:italic;letter-spacing:.12em;text-shadow:2px 2px 0 #ff3d00;padding:5px 12px',
    'mq',
    '▶',
  ],
  [
    'Mirage Sunset',
    'Dusk horizon sky with a gently bobbing sun',
    'background:radial-gradient(circle at 78% 100%,#fff3b0 0 5px,#ffd166 6px 9px,transparent 10px),linear-gradient(180deg,#5b2a86,#d6456a 55%,#ff9a3c);color:#fff;text-shadow:0 1px 2px rgba(60,0,40,.6)',
    'sun',
    '☀',
  ],
  [
    'Liquid Chrome',
    'Mirror-polished silver metal with flowing reflection',
    'background:linear-gradient(180deg,#fff,#c7ccd6 18%,#5b6270 48%,#e8ecf3 52%,#9aa3b2 80%,#f5f7fa);color:#111',
    'lqc',
    '◐',
  ],
  [
    'Cyber Magenta',
    'Midnight violet tube with realistic neon flicker',
    'background:#1a0526;color:#ff7be9;text-shadow:0 0 5px #ff2bd6,0 0 12px #ff2bd6;border:1px solid rgba(255,43,214,.25);border-radius:6px',
    'fk',
    '▲',
  ],
  [
    'Dragon Scale',
    'Layered crimson dragon-scale armor tile',
    'background:radial-gradient(circle at 50% 100%,#e11d2e 0 45%,#8f0f1a 46% 62%,transparent 63%) 0 0/10px 9px,radial-gradient(circle at 50% 100%,#e11d2e 0 45%,#8f0f1a 46% 62%,transparent 63%) 5px 4px/10px 9px,#5a0a12;color:#fff;text-shadow:0 1px 2px #000;border-radius:6px 14px 6px 14px',
    '',
    '❂',
  ],
  [
    'Katana Slash',
    'Slanted steel blade with crimson-wrapped hilt',
    'background:repeating-linear-gradient(60deg,#7f1d1d 0 3px,#111 3px 6px) right/18px 100% no-repeat,linear-gradient(180deg,#f8fafc 0 45%,#cbd5e1 45% 52%,#94a3b8 52%);color:#0b1220;border-radius:0;padding:5px 26px 5px 14px;clip-path:polygon(10px 0,100% 0,100% 100%,0 100%)',
    '',
    '⚔',
  ],
  [
    'Cosmic Nebula',
    'Deep starfield nebula with shooting star and twinkle',
    'background:radial-gradient(circle at 12% 28%,#fff 0 1px,transparent 1.5px),radial-gradient(circle at 88% 70%,#fff 0 1px,transparent 1.5px),radial-gradient(at 20% 30%,#7c3aed,transparent 60%),radial-gradient(at 80% 70%,#ec4899,transparent 55%),#0b0b2a;color:#fff',
    'star twk',
    '✧',
  ],
  [
    'Obsidian Seal',
    'Faceted octagonal dark volcanic obsidian plate',
    'background:conic-gradient(from 20deg,#050507,#2a2a33 10%,#050507 25%,#1b1b22 45%,#050507 60%,#34343e 78%,#050507);color:#e5e7eb;border:0;border-radius:0;padding:6px 16px;clip-path:polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)',
    '',
    '✺',
  ],
  [
    'Live Signal',
    'Glowing crimson broadcast pill with animated equalizer bars',
    'background:linear-gradient(135deg,#ff3b3b,#b4001e);color:#fff;border-color:rgba(255,255,255,.35);box-shadow:0 0 12px rgba(255,59,59,.45);text-shadow:0 1px 2px rgba(60,0,10,.6)',
    'live2',
    '',
  ],
  [
    'Cyber Glitch',
    'CRT scanline block with RGB chromatic glitch jitter',
    'background:repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 1px,transparent 1px 3px),#08080c;color:#fff;border-radius:2px',
    'gx',
    '◢',
  ],
  [
    'Origami Crane',
    'Crisp folded teal paper origami tile',
    'background:linear-gradient(115deg,#14b8a6 0 48%,#0f766e 48% 50%,#2dd4bf 50%);color:#042f2e;border-radius:3px',
    '',
    '❏',
  ],
  [
    'Barcode Scan',
    'High-contrast barcode label with sweeping red laser',
    'background:repeating-linear-gradient(90deg,#fff 0 2px,transparent 2px 4px) left/12px 100% no-repeat,repeating-linear-gradient(90deg,#fff 0 1px,transparent 1px 3px,#fff 3px 5px,transparent 5px 6px) right/12px 100% no-repeat,#111;color:#fff;padding:5px 20px;border-radius:2px',
    'scan',
    '▌',
  ],
  [
    'Boarding Ticket',
    'Warm amber boarding pass with side ticket notches',
    'background:radial-gradient(circle at 0 50%,transparent 5px,#fdba74 5.5px) left/51% 100% no-repeat,radial-gradient(circle at 100% 50%,transparent 5px,#fdba74 5.5px) right/51% 100% no-repeat;color:#431407;border:0;border-radius:3px;padding:6px 16px',
    '',
    '✈',
  ],
  [
    'Blueprint Grid',
    'Architectural blueprint grid with dashed white border',
    'background:linear-gradient(rgba(255,255,255,.28) 1px,transparent 1px) 0 0/8px 8px,linear-gradient(90deg,rgba(255,255,255,.28) 1px,transparent 1px) 0 0/8px 8px,#0b4f9c;color:#fff;border:1px dashed #fff;border-radius:2px',
    '',
    '✛',
  ],
  [
    'Barber Pole',
    'Spinning diagonal crimson and white stripes',
    'background:linear-gradient(45deg,#ff4d6d 25%,#fff 25% 50%,#ff4d6d 50% 75%,#fff 75%) 0 0/17px 17px;color:#fff;text-shadow:0 0 3px #7a0020,0 0 3px #7a0020',
    'bar',
    '✱',
  ],
  [
    'Extruded Block',
    'Lime 3D stacked block with layered drop shadow',
    'background:#bef264;color:#1a2e05;border-radius:5px;margin:0 7px 7px 0;box-shadow:3px 3px 0 #84cc16,6px 6px 0 #4d7c0f',
    '',
    '▦',
  ],
  [
    'Morph Blob',
    'Organic mint blob with fluid morphing silhouette',
    'background:#5eead4;color:#042f2e;border-radius:60% 40% 55% 45%/50% 60% 40% 50%;padding:7px 14px',
    'mo',
    '❋',
  ],
  [
    'HP Bar',
    'Segmented retro health bar with pulse flash',
    'background:repeating-linear-gradient(90deg,#dc2626 0 8px,#450a0a 8px 10px);color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;border:2px solid #fff;border-radius:2px',
    'hp',
    '♥',
  ],
  [
    'Denim Stitch',
    'Textured indigo denim patch with gold dashed stitching',
    'background:repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 1px,transparent 1px 3px),#1e3a8a;color:#fff;border:2px dashed #fbbf24;border-radius:7px;box-shadow:0 0 0 2px #1e3a8a',
    '',
    '⌘',
  ],
  [
    'Liquid Fill',
    'Deep cyan capsule with rising sloshing wave',
    'background:#0e7490;color:#fff;border-color:#22d3ee',
    'fill',
    '≈',
  ],
  [
    'Flip Clock',
    'Mechanical split-flap tile that flips periodically',
    'background:linear-gradient(#2b2b2b 0 49%,#000 49% 51%,#171717 51%);color:#f5f5f5;border-color:#3a3a3a;border-radius:4px',
    'fp',
    '◔',
  ],
  [
    'Hollow Type',
    'Clean transparent outline-stroke lettering',
    'background:transparent;color:transparent;-webkit-text-stroke:1.2px var(--fg);border-color:transparent',
    '',
    '◌',
  ],
  [
    'Chat Bubble',
    'Bright blue message bubble with typing dots',
    'background:#0a84ff;color:#fff;border-radius:14px 14px 14px 3px',
    'typ',
    '•••',
  ],
  [
    'Terminal Caret',
    'Monospace command prompt with blinking underscore',
    'background:#1f1f24;color:#e5e7eb;border:1px solid #3f3f46;border-radius:4px;font-family:ui-monospace,Menlo,monospace',
    'cur',
    '>',
  ],
  [
    'Sunburst',
    'Radiating coral sunburst rays with crisp white ring',
    'background:repeating-conic-gradient(#fb7185 0 10deg,#fda4af 0 20deg);color:#4c0519;box-shadow:0 0 0 2px #fff',
    '',
    '☼',
  ],
  [
    'Racing Check',
    'Scrolling black-and-white finish-line checkered flag',
    'background:repeating-conic-gradient(#fff 0 25%,#111 0 50%) 0 0/12px 12px;color:#e11d1d;text-shadow:-1px 0 #fff,1px 0 #fff,0 -1px #fff,0 1px #fff,0 0 4px #fff;border:2px solid #111;border-radius:3px;--t:12px',
    'bar',
    '⚑',
  ],
  [
    'Soft Neumorph',
    'Soft sculpted matte silver neumorphic pill',
    'background:#e3e8ef;color:#64748b;box-shadow:5px 5px 10px rgba(0,0,0,.35),-4px -4px 9px rgba(255,255,255,.35)',
    '',
    '◍',
  ],
  [
    'Underline Flow',
    'Minimal text underlined by a flowing rainbow bar',
    'background:linear-gradient(90deg,#f43f5e,#f59e0b,#22c55e,#3b82f6,#f43f5e) 0 100%/300% 3px no-repeat;color:var(--fg);border-radius:0;padding:5px 2px 7px',
    'ul',
    '✎',
  ],
  [
    'Parchment Scroll',
    'Warm antique italic serif parchment emblem',
    'background:radial-gradient(ellipse at center,#fff3c4 55%,#d6a85a);color:#5b3a0a;border-radius:10px/14px;font-family:Georgia,serif;font-style:italic;letter-spacing:.04em;box-shadow:inset 0 0 6px rgba(120,70,10,.5)',
    '',
    '❧',
  ],
  [
    'Gem Facets',
    'Hexagonal spectrum crystal cycling through rainbow hues',
    'background:conic-gradient(from 45deg at 50% 50%,#ff7aa2,#c04bff,#4bb0ff,#4bffd0,#ffe66b,#ff7aa2);color:#1a0b2e;border-radius:0;padding:6px 18px;clip-path:polygon(14% 0,86% 0,100% 50%,86% 100%,14% 100%,0 50%)',
    'hue',
    '◊',
  ],
];

export const PLUS_BADGE_MIN_ID = 1;
export const PLUS_BADGE_MAX_ID = 50;
export const DEFAULT_PLUS_BADGE_ID = 1;

export const PLUS_BADGE_DESIGNS: readonly PlusBadgeDesignMeta[] = RAW_PLUS_BADGES.map(
  ([name, tagline, cssText, animClass, icon, staticFlag], index) => {
    const id = index + 1;
    const animated = hasAnimatedClass(animClass);
    return {
      id,
      number: id,
      name,
      tagline,
      cssText,
      style: parseInlineCssText(cssText),
      animClass,
      icon,
      animated,
      staticTag: staticFlag === 1 || !animated,
    };
  }
);

const PLUS_BADGE_BY_ID = new Map<number, PlusBadgeDesignMeta>(
  PLUS_BADGE_DESIGNS.map((b) => [b.id, b])
);

/**
 * Legacy 31-badge migration map -> new 1..50 PLUS badge IDs.
 * Removed old badges (`ember` / Ember Crown, `ribbon` / Gilded Ribbon) map to `null` (unequipped).
 */
export const LEGACY_PRO_BADGE_TO_PLUS_ID: Readonly<Record<string, number | null>> = {
  // Removed badges -> unequip
  ember: null,
  'ember crown': null,
  ribbon: null,
  'gilded ribbon': null,
  // Preserved legacy IDs & names -> matching new 1..50 IDs
  neon: 2,
  'neon pulse': 2,
  holo: 3,
  hex: 4,
  pixel: 5,
  seal: 6,
  'royal seal': 6,
  tag: 7,
  glass: 8,
  mono: 9,
  aurora: 10,
  emerald: 11,
  sakura: 12,
  chevron: 13,
  flame: 14,
  electric: 15,
  split: 16,
  sticker: 17,
  rainbow: 18,
  diamond: 19,
  shield: 20,
  arcade: 21,
  sunset: 22,
  chrome: 23,
  neonpink: 24,
  scale: 25,
  slash: 26,
  cosmic: 27,
  crownseal: 28,
  outline: 29,
  glitch: 30,
};

const NAME_TO_PLUS_ID = new Map<string, number>(
  PLUS_BADGE_DESIGNS.map((b) => [b.name.toLowerCase(), b.id])
);

export function isValidPlusBadgeId(val: unknown): val is number {
  return (
    typeof val === 'number' &&
    Number.isInteger(val) &&
    val >= PLUS_BADGE_MIN_ID &&
    val <= PLUS_BADGE_MAX_ID
  );
}

export function getPlusBadgeById(id: number | null | undefined): PlusBadgeDesignMeta | null {
  if (!isValidPlusBadgeId(id)) return null;
  return PLUS_BADGE_BY_ID.get(id) || null;
}

/**
 * Resolves any stored value (`plus_badge_id`, `'plus:12'`, `'12'`, legacy `'holo'` / `'plus:holo'` / `'Royal Seal'`,
 * or removed `'ember'` / `'ribbon'`) into a canonical `1..50` PLUS badge ID or `null` (unequipped).
 */
export function resolvePlusBadgeId(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'number') {
    return isValidPlusBadgeId(raw) ? raw : null;
  }

  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower === 'null' || lower === 'none' || lower === 'plus') return null;

  const stripped = lower.startsWith('plus:') ? lower.slice('plus:'.length).trim() : lower;
  if (!stripped || stripped === 'null' || stripped === 'none') return null;

  // Numeric string ('1'..'50' or '#01'..'#50')
  const numericCandidate = stripped.startsWith('#') ? stripped.slice(1) : stripped;
  if (/^\d+$/.test(numericCandidate)) {
    const parsed = Number.parseInt(numericCandidate, 10);
    return isValidPlusBadgeId(parsed) ? parsed : null;
  }

  // Exact match in legacy migration table (including removed -> null)
  if (Object.prototype.hasOwnProperty.call(LEGACY_PRO_BADGE_TO_PLUS_ID, stripped)) {
    return LEGACY_PRO_BADGE_TO_PLUS_ID[stripped];
  }

  // Exact match by new badge name
  const byName = NAME_TO_PLUS_ID.get(stripped);
  if (byName !== undefined) return byName;

  return null;
}
