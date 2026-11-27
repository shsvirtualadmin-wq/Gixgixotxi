import { getMentorConfig, type AiMentorId } from '@/utils/aiMentorsLogic';

export type MentorPoseState = 'idle' | 'nod' | 'thinking' | 'speaking';

export type VisemeId = 'rest' | 'aa' | 'ih' | 'ou' | 'ee' | 'oh';

export interface VisemeFrame {
  viseme: VisemeId;
  /** Vertical jaw/mouth opening [0..1] */
  open: number;
  /** Horizontal mouth stretch (>0 wider for ee/ih, <0 narrower/pursed for ou/oh) [-1..1] */
  wide: number;
  /** Lip rounding intensity [0..1] */
  round: number;
  durationMs: number;
}

export interface MentorCharacterProfile {
  id: AiMentorId;
  slug: 'noor' | 'zain' | 'sehar' | 'hamza' | 'mahnoor';
  name: string;
  role: string;
  accentHex: string;
  accentRgb: [number, number, number];
  bustWebp: string;
  avatarWebp: string;
  /** Normalized WebGL UV coordinates (u: 0..1 left-to-right, v: 0..1 bottom-to-top) */
  landmarks: {
    leftEye: [number, number];
    rightEye: [number, number];
    eyeRadius: [number, number];
    mouth: [number, number];
    mouthRadius: [number, number];
    headCenter: [number, number];
    chinV: number;
    shoulderV: number;
  };
}

function hexToRgbNorm(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  if (!Number.isFinite(n)) return [0.86, 0.15, 0.15];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const LANDMARKS_BY_SLUG: Record<MentorCharacterProfile['slug'], MentorCharacterProfile['landmarks']> = {
  noor: {
    leftEye: [0.405, 0.605],
    rightEye: [0.59, 0.605],
    eyeRadius: [0.056, 0.032],
    mouth: [0.498, 0.475],
    mouthRadius: [0.072, 0.032],
    headCenter: [0.5, 0.56],
    chinV: 0.40,
    shoulderV: 0.34,
  },
  zain: {
    leftEye: [0.41, 0.685],
    rightEye: [0.59, 0.685],
    eyeRadius: [0.054, 0.028],
    mouth: [0.5, 0.545],
    mouthRadius: [0.076, 0.032],
    headCenter: [0.5, 0.63],
    chinV: 0.45,
    shoulderV: 0.38,
  },
  sehar: {
    leftEye: [0.415, 0.695],
    rightEye: [0.585, 0.695],
    eyeRadius: [0.052, 0.028],
    mouth: [0.5, 0.575],
    mouthRadius: [0.068, 0.029],
    headCenter: [0.5, 0.65],
    chinV: 0.50,
    shoulderV: 0.42,
  },
  hamza: {
    leftEye: [0.415, 0.68],
    rightEye: [0.58, 0.68],
    eyeRadius: [0.053, 0.029],
    mouth: [0.5, 0.56],
    mouthRadius: [0.074, 0.03],
    headCenter: [0.5, 0.63],
    chinV: 0.46,
    shoulderV: 0.39,
  },
  mahnoor: {
    leftEye: [0.41, 0.60],
    rightEye: [0.585, 0.60],
    eyeRadius: [0.054, 0.029],
    mouth: [0.5, 0.47],
    mouthRadius: [0.072, 0.031],
    headCenter: [0.5, 0.56],
    chinV: 0.39,
    shoulderV: 0.34,
  },
};

export function getMentorCharacterProfile(mentorId: AiMentorId): MentorCharacterProfile {
  const cfg = getMentorConfig(mentorId);
  const slug = cfg.slug;
  return {
    id: cfg.id,
    slug,
    name: cfg.name,
    role: cfg.role,
    accentHex: cfg.accent,
    accentRgb: hexToRgbNorm(cfg.accent),
    bustWebp: `/assets/mentors/${slug}/bust.webp`,
    avatarWebp: `/assets/mentors/${slug}/avatar.webp`,
    landmarks: LANDMARKS_BY_SLUG[slug],
  };
}

const VISEME_SHAPES: Record<VisemeId, Omit<VisemeFrame, 'durationMs'>> = {
  rest: { viseme: 'rest', open: 0.0, wide: 0.0, round: 0.0 },
  aa: { viseme: 'aa', open: 0.92, wide: 0.14, round: 0.18 },
  ih: { viseme: 'ih', open: 0.46, wide: 0.58, round: 0.0 },
  ee: { viseme: 'ee', open: 0.36, wide: 0.85, round: 0.0 },
  oh: { viseme: 'oh', open: 0.72, wide: -0.35, round: 0.82 },
  ou: { viseme: 'ou', open: 0.44, wide: -0.62, round: 1.0 },
};

/**
 * Converts a streamed text chunk into a compact viseme timeline for real-time lip-sync.
 * Skips markdown/LaTeX control symbols and coalesces runs so speech cadence stays natural.
 */
export function textChunkToVisemes(chunk: string): VisemeFrame[] {
  if (!chunk) return [];
  const cleaned = chunk
    .replace(/[`*_~#$\\{}[\]|<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  const frames: VisemeFrame[] = [];
  let i = 0;

  while (i < cleaned.length && frames.length < 36) {
    const ch = cleaned[i];
    const next = cleaned[i + 1] || '';

    if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') {
      frames.push({ ...VISEME_SHAPES.rest, durationMs: 110 });
      i += 1;
      continue;
    }
    if (ch === ',' || ch === ';' || ch === ':' || ch === ' ') {
      if (frames.length === 0 || frames[frames.length - 1].viseme !== 'rest') {
        frames.push({ ...VISEME_SHAPES.rest, durationMs: 42 });
      }
      i += 1;
      continue;
    }

    // Digraph vowels
    const pair = ch + next;
    let viseme: VisemeId | null = null;
    let step = 1;

    if (pair === 'ee' || pair === 'ea' || pair === 'ie') {
      viseme = 'ee';
      step = 2;
    } else if (pair === 'oo' || pair === 'ou' || pair === 'ow') {
      viseme = 'ou';
      step = 2;
    } else if (pair === 'oa' || pair === 'au' || pair === 'aw') {
      viseme = 'oh';
      step = 2;
    } else if (pair === 'ai' || pair === 'ay' || pair === 'ey') {
      viseme = 'ih';
      step = 2;
    } else if (ch === 'a') {
      viseme = 'aa';
    } else if (ch === 'e') {
      viseme = 'ee';
    } else if (ch === 'i' || ch === 'y') {
      viseme = 'ih';
    } else if (ch === 'o') {
      viseme = 'oh';
    } else if (ch === 'u' || ch === 'w') {
      viseme = 'ou';
    } else if ('bmpfv'.includes(ch)) {
      // Bilabial / labiodental closure for natural consonant articulation
      frames.push({ viseme: 'rest', open: 0.06, wide: -0.1, round: 0.1, durationMs: 44 });
      i += 1;
      continue;
    } else if ('tdnlrszkcgjqxh'.includes(ch)) {
      // Light open consonant articulation
      frames.push({ viseme: 'ih', open: 0.24, wide: 0.18, round: 0.05, durationMs: 40 });
      i += 1;
      continue;
    }

    if (viseme) {
      const shape = VISEME_SHAPES[viseme];
      const prev = frames[frames.length - 1];
      if (prev && prev.viseme === viseme) {
        prev.durationMs = Math.min(130, prev.durationMs + 34);
      } else {
        frames.push({ ...shape, durationMs: 74 });
      }
    }
    i += step;
  }

  return frames;
}

/**
 * Checks whether the current device/user should fall back to static portraits instead of live WebGL.
 */
export function shouldUseStaticPortraitFallback(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
  } catch {
    // Ignore media query errors
  }

  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (nav) {
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) {
      return true;
    }
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory <= 2) {
      return true;
    }
    if (nav.connection?.saveData === true) {
      return true;
    }
  }

  return false;
}
