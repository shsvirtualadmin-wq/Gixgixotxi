/**
 * Boardly Store Shared Procedural FX Engine (storeFxEngine.ts)
 * - Single requestAnimationFrame loop for the entire page
 * - Pauses automatically when document.visibilityState !== 'visible'
 * - Shared IntersectionObserver so only visible items update (off-screen = 0 CPU)
 * - Typed-array Canvas 2D particle engine (max 150 particles/item, zero per-frame allocations)
 * - Procedural midpoint-displacement branching lightning with flash decay
 * - Seeded 2D smooth value/simplex noise, easing helpers, color ramps, and spine mesh warp
 * - Renders a pre-warmed high-detail static frame when prefers-reduced-motion is active
 */

export type RgbaColor = [number, number, number, number]; // r,g,b in 0..255, a in 0..1

export interface ColorStop {
  t: number; // 0..1
  color: RgbaColor;
}

// ─── DETERMINISTIC PRNG & SMOOTH 2D NOISE ───────────────────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PERM = new Uint8Array(512);
const GRAD_X = new Float32Array(256);
const GRAD_Y = new Float32Array(256);
(() => {
  const rng = mulberry32(0x9e3779b9);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) {
    PERM[i] = p[i & 255];
  }
  for (let i = 0; i < 256; i++) {
    const ang = (i / 256) * Math.PI * 2;
    GRAD_X[i] = Math.cos(ang);
    GRAD_Y[i] = Math.sin(ang);
  }
})();

export function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2;
}

export function easeOutCubic(t: number): number {
  const u = 1 - clamp(t, 0, 1);
  return 1 - u * u * u;
}

export function noise2D(x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);

  const aa = PERM[PERM[xi] + yi];
  const ab = PERM[PERM[xi] + yi + 1];
  const ba = PERM[PERM[xi + 1] + yi];
  const bb = PERM[PERM[xi + 1] + yi + 1];

  const g00 = GRAD_X[aa] * xf + GRAD_Y[aa] * yf;
  const g10 = GRAD_X[ba] * (xf - 1) + GRAD_Y[ba] * yf;
  const g01 = GRAD_X[ab] * xf + GRAD_Y[ab] * (yf - 1);
  const g11 = GRAD_X[bb] * (xf - 1) + GRAD_Y[bb] * (yf - 1);

  return lerp(lerp(g00, g10, u), lerp(g01, g11, u), v);
}

// ─── COLOR RAMPS (ZERO ALLOCATION OUT-PARAM) ────────────────────────────────

export const COLOR_RAMPS: Record<string, ColorStop[]> = {
  dragonFire: [
    { t: 0.0, color: [255, 253, 235, 1.0] }, // white-gold core
    { t: 0.25, color: [251, 191, 36, 0.95] }, // molten gold
    { t: 0.55, color: [239, 68, 68, 0.88] }, // crimson flame
    { t: 0.8, color: [153, 27, 27, 0.65] }, // deep blood red
    { t: 1.0, color: [24, 24, 27, 0.0] }, // dark smoke
  ],
  spiritFox: [
    { t: 0.0, color: [240, 249, 255, 1.0] }, // ice white
    { t: 0.3, color: [56, 189, 248, 0.95] }, // spirit cyan
    { t: 0.65, color: [129, 140, 248, 0.85] }, // astral indigo
    { t: 1.0, color: [192, 132, 252, 0.0] }, // violet mist
  ],
  sakuraGale: [
    { t: 0.0, color: [255, 241, 242, 0.95] },
    { t: 0.4, color: [249, 168, 212, 0.92] },
    { t: 0.75, color: [244, 114, 182, 0.85] },
    { t: 1.0, color: [190, 24, 93, 0.0] },
  ],
  fallingStars: [
    { t: 0.0, color: [255, 255, 255, 1.0] },
    { t: 0.3, color: [254, 240, 138, 0.95] },
    { t: 0.65, color: [245, 158, 11, 0.8] },
    { t: 1.0, color: [129, 140, 248, 0.0] },
  ],
  thunderGold: [
    { t: 0.0, color: [255, 255, 255, 1.0] },
    { t: 0.35, color: [254, 240, 138, 0.95] },
    { t: 0.7, color: [56, 189, 248, 0.8] },
    { t: 1.0, color: [30, 58, 138, 0.0] },
  ],
  neonKyoto: [
    { t: 0.0, color: [224, 242, 254, 0.95] },
    { t: 0.45, color: [0, 240, 255, 0.85] },
    { t: 0.8, color: [255, 0, 122, 0.7] },
    { t: 1.0, color: [15, 23, 42, 0.0] },
  ],
  bloodMoonAsh: [
    { t: 0.0, color: [254, 226, 226, 0.95] },
    { t: 0.35, color: [239, 68, 68, 0.9] },
    { t: 0.7, color: [127, 29, 29, 0.7] },
    { t: 1.0, color: [15, 5, 7, 0.0] },
  ],
  emeraldTempest: [
    { t: 0.0, color: [236, 253, 245, 0.95] },
    { t: 0.4, color: [52, 211, 153, 0.9] },
    { t: 0.75, color: [16, 185, 129, 0.7] },
    { t: 1.0, color: [6, 78, 59, 0.0] },
  ],
  voidObsidian: [
    { t: 0.0, color: [243, 232, 255, 0.95] },
    { t: 0.4, color: [192, 132, 252, 0.9] },
    { t: 0.75, color: [147, 51, 234, 0.75] },
    { t: 1.0, color: [15, 7, 32, 0.0] },
  ],
};

const _scratchColor: RgbaColor = [255, 255, 255, 1];

export function sampleColorRamp(
  ramp: ColorStop[],
  t: number,
  out: RgbaColor = _scratchColor
): RgbaColor {
  const u = clamp(t, 0, 1);
  if (ramp.length === 0) {
    out[0] = 255;
    out[1] = 255;
    out[2] = 255;
    out[3] = 1;
    return out;
  }
  for (let i = 0; i < ramp.length - 1; i++) {
    const a = ramp[i];
    const b = ramp[i + 1];
    if (u >= a.t && u <= b.t) {
      const f = (u - a.t) / (b.t - a.t || 1e-6);
      out[0] = Math.round(lerp(a.color[0], b.color[0], f));
      out[1] = Math.round(lerp(a.color[1], b.color[1], f));
      out[2] = Math.round(lerp(a.color[2], b.color[2], f));
      out[3] = lerp(a.color[3], b.color[3], f);
      return out;
    }
  }
  const last = ramp[ramp.length - 1].color;
  out[0] = last[0];
  out[1] = last[1];
  out[2] = last[2];
  out[3] = last[3];
  return out;
}

// ─── TYPED-ARRAY PARTICLE SYSTEM (MAX 150 PARTICLES PER ITEM) ───────────────

export const enum ParticleShape {
  SoftGlow = 0,
  Spark = 1,
  Petal = 2,
  Streak = 3,
  Wisp = 4,
  Smoke = 5,
}

export interface EmitterConfig {
  rate: number; // particles per second
  shape: ParticleShape;
  additive?: boolean;
  ramp: ColorStop[];
  // Spawn region in normalized [0..1] canvas coordinates
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  // Optional ring spawn around center (normalized radius)
  ringRadius?: number;
  ringCenterX?: number;
  ringCenterY?: number;
  tangentialSpeed?: number;
  // Velocity range (normalized width/height per second)
  vxMin: number;
  vxMax: number;
  vyMin: number;
  vyMax: number;
  // Forces
  gravityX?: number;
  gravityY?: number;
  drag?: number;
  turbulence?: number;
  turbulenceFreq?: number;
  // Size & Life
  lifeMin: number;
  lifeMax: number;
  sizeStartMin: number;
  sizeStartMax: number;
  sizeEndMin: number;
  sizeEndMax: number;
  rotSpeedMin?: number;
  rotSpeedMax?: number;
  alphaPeak?: number;
}

export const MAX_PARTICLES_PER_ITEM = 150;
const TRAIL_POINTS = 5;

export class ParticlePool2D {
  readonly capacity: number;
  readonly active: Uint8Array;
  readonly shape: Uint8Array;
  readonly additive: Uint8Array;
  readonly emitterIdx: Uint8Array;

  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly gx: Float32Array;
  readonly gy: Float32Array;
  readonly drag: Float32Array;
  readonly turb: Float32Array;
  readonly turbFreq: Float32Array;
  readonly age: Float32Array;
  readonly life: Float32Array;
  readonly size0: Float32Array;
  readonly size1: Float32Array;
  readonly rot: Float32Array;
  readonly rotVel: Float32Array;
  readonly seed: Float32Array;
  readonly alphaPeak: Float32Array;
  // Trail history for wisps & meteors (capacity * TRAIL_POINTS)
  readonly trailX: Float32Array;
  readonly trailY: Float32Array;

  private emitters: EmitterConfig[];
  private spawnAccum: Float32Array;
  private rng: () => number;
  private cursor = 0;

  constructor(emitters: EmitterConfig[], maxParticles = MAX_PARTICLES_PER_ITEM, seed = 1337) {
    this.capacity = Math.min(maxParticles, MAX_PARTICLES_PER_ITEM);
    this.emitters = emitters;
    this.spawnAccum = new Float32Array(emitters.length);
    this.rng = mulberry32(seed);

    const n = this.capacity;
    this.active = new Uint8Array(n);
    this.shape = new Uint8Array(n);
    this.additive = new Uint8Array(n);
    this.emitterIdx = new Uint8Array(n);

    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.gx = new Float32Array(n);
    this.gy = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.turb = new Float32Array(n);
    this.turbFreq = new Float32Array(n);
    this.age = new Float32Array(n);
    this.life = new Float32Array(n);
    this.size0 = new Float32Array(n);
    this.size1 = new Float32Array(n);
    this.rot = new Float32Array(n);
    this.rotVel = new Float32Array(n);
    this.seed = new Float32Array(n);
    this.alphaPeak = new Float32Array(n);

    this.trailX = new Float32Array(n * TRAIL_POINTS);
    this.trailY = new Float32Array(n * TRAIL_POINTS);
  }

  private rand(min: number, max: number): number {
    return min + (max - min) * this.rng();
  }

  private spawnOne(eIdx: number): void {
    const e = this.emitters[eIdx];
    // Find next free slot or oldest slot
    let slot = -1;
    for (let i = 0; i < this.capacity; i++) {
      const idx = (this.cursor + i) % this.capacity;
      if (this.active[idx] === 0) {
        slot = idx;
        this.cursor = (idx + 1) % this.capacity;
        break;
      }
    }
    if (slot === -1) return; // Respect strict cap

    this.active[slot] = 1;
    this.shape[slot] = e.shape;
    this.additive[slot] = e.additive !== false ? 1 : 0;
    this.emitterIdx[slot] = eIdx;

    let px: number;
    let py: number;
    let vx = this.rand(e.vxMin, e.vxMax);
    let vy = this.rand(e.vyMin, e.vyMax);

    if (e.ringRadius && e.ringRadius > 0) {
      const ang = this.rng() * Math.PI * 2;
      const cx = e.ringCenterX ?? 0.5;
      const cy = e.ringCenterY ?? 0.5;
      const rSpread = e.ringRadius * (0.94 + this.rng() * 0.12);
      px = cx + Math.cos(ang) * rSpread;
      py = cy + Math.sin(ang) * rSpread;
      if (e.tangentialSpeed) {
        vx += -Math.sin(ang) * e.tangentialSpeed;
        vy += Math.cos(ang) * e.tangentialSpeed;
      }
    } else {
      px = this.rand(e.xMin, e.xMax);
      py = this.rand(e.yMin, e.yMax);
    }

    this.x[slot] = px;
    this.y[slot] = py;
    this.vx[slot] = vx;
    this.vy[slot] = vy;
    this.gx[slot] = e.gravityX ?? 0;
    this.gy[slot] = e.gravityY ?? 0;
    this.drag[slot] = e.drag ?? 0.15;
    this.turb[slot] = e.turbulence ?? 0;
    this.turbFreq[slot] = e.turbulenceFreq ?? 2.2;
    this.age[slot] = 0;
    this.life[slot] = Math.max(0.15, this.rand(e.lifeMin, e.lifeMax));
    this.size0[slot] = this.rand(e.sizeStartMin, e.sizeStartMax);
    this.size1[slot] = this.rand(e.sizeEndMin, e.sizeEndMax);
    this.rot[slot] = this.rng() * Math.PI * 2;
    this.rotVel[slot] = this.rand(e.rotSpeedMin ?? -1.5, e.rotSpeedMax ?? 1.5);
    this.seed[slot] = this.rng() * 100;
    this.alphaPeak[slot] = e.alphaPeak ?? 0.9;

    const base = slot * TRAIL_POINTS;
    for (let k = 0; k < TRAIL_POINTS; k++) {
      this.trailX[base + k] = px;
      this.trailY[base + k] = py;
    }
  }

  update(dt: number, elapsed: number): void {
    // 1. Spawn from emitters
    for (let eIdx = 0; eIdx < this.emitters.length; eIdx++) {
      const e = this.emitters[eIdx];
      this.spawnAccum[eIdx] += e.rate * dt;
      while (this.spawnAccum[eIdx] >= 1) {
        this.spawnAccum[eIdx] -= 1;
        this.spawnOne(eIdx);
      }
    }

    // 2. Integrate active particles
    for (let i = 0; i < this.capacity; i++) {
      if (this.active[i] === 0) continue;
      const newAge = this.age[i] + dt;
      const life = this.life[i];
      if (newAge >= life) {
        this.active[i] = 0;
        continue;
      }
      this.age[i] = newAge;

      // Shift trail positions
      const base = i * TRAIL_POINTS;
      for (let k = TRAIL_POINTS - 1; k > 0; k--) {
        this.trailX[base + k] = this.trailX[base + k - 1];
        this.trailY[base + k] = this.trailY[base + k - 1];
      }
      this.trailX[base] = this.x[i];
      this.trailY[base] = this.y[i];

      const turbAmp = this.turb[i];
      let nx = 0;
      let ny = 0;
      if (turbAmp > 0) {
        const tf = this.turbFreq[i];
        const s = this.seed[i];
        nx = noise2D(this.x[i] * tf + elapsed * 0.65 + s, this.y[i] * tf) * turbAmp;
        ny = noise2D(this.x[i] * tf, this.y[i] * tf + elapsed * 0.65 + s + 31.7) * turbAmp;
      }

      const damp = Math.max(0, 1 - this.drag[i] * dt);
      this.vx[i] = (this.vx[i] + (this.gx[i] + nx) * dt) * damp;
      this.vy[i] = (this.vy[i] + (this.gy[i] + ny) * dt) * damp;

      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.rot[i] += this.rotVel[i] * dt;
    }
  }

  prewarm(seconds = 2.4, step = 0.04): void {
    let t = 0;
    while (t < seconds) {
      this.update(step, t);
      t += step;
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number): void {
    const minDim = Math.min(width, height);
    const scaleFactor = Math.max(0.55, minDim / 220);

    for (let i = 0; i < this.capacity; i++) {
      if (this.active[i] === 0) continue;

      const u = this.age[i] / this.life[i];
      const env = smoothstep(0, 0.16, u) * (1 - smoothstep(0.68, 1.0, u));
      if (env <= 0.01) continue;

      const e = this.emitters[this.emitterIdx[i]];
      const c = sampleColorRamp(e.ramp, u, _scratchColor);
      const alpha = clamp(c[3] * env * this.alphaPeak[i], 0, 1);
      if (alpha <= 0.01) continue;

      const px = this.x[i] * width;
      const py = this.y[i] * height;
      const sz = Math.max(1.2, lerp(this.size0[i], this.size1[i], u) * scaleFactor);
      const shape = this.shape[i];

      ctx.save();
      ctx.globalCompositeOperation = this.additive[i] === 1 ? 'lighter' : 'source-over';

      if (shape === ParticleShape.SoftGlow || shape === ParticleShape.Smoke) {
        // Two-pass soft glow / smoke puff (fast & smooth without per-frame gradient allocations)
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.34).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, sz * 1.85, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.85).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, sz * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === ParticleShape.Spark) {
        const vx = this.vx[i] * width;
        const vy = this.vy[i] * height;
        const ang = Math.atan2(vy, vx);
        const len = Math.max(sz * 2.4, Math.hypot(vx, vy) * 0.045);
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(1.2, sz * 0.65);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-len, 0);
        ctx.lineTo(len * 0.35, 0);
        ctx.stroke();

        ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.9).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1, sz * 0.45), 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === ParticleShape.Petal) {
        // 3D tumbling sakura petal with depth-based aspect ratio
        const tumble = 0.32 + 0.68 * Math.abs(Math.cos(elapsed * 2.6 + this.seed[i]));
        ctx.translate(px, py);
        ctx.rotate(this.rot[i]);
        ctx.scale(1, tumble);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.bezierCurveTo(sz * 0.95, -sz * 0.6, sz * 0.85, sz * 0.7, 0, sz);
        ctx.bezierCurveTo(-sz * 0.85, sz * 0.7, -sz * 0.95, -sz * 0.6, 0, -sz);
        ctx.fill();
      } else if (shape === ParticleShape.Streak) {
        // Meteor / Rain streak with tapered fading tail
        const base = i * TRAIL_POINTS;
        const tx = this.trailX[base + TRAIL_POINTS - 1] * width;
        const ty = this.trailY[base + TRAIL_POINTS - 1] * height;
        const dx = px - tx;
        const dy = py - ty;
        const tailX = Math.hypot(dx, dy) > 2 ? tx : px - this.vx[i] * width * 0.08;
        const tailY = Math.hypot(dx, dy) > 2 ? ty : py - this.vy[i] * height * 0.08;

        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.45).toFixed(3)})`;
        ctx.lineWidth = Math.max(1.4, sz * 1.2);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255,255,255,${(alpha * 0.92).toFixed(3)})`;
        ctx.lineWidth = Math.max(1, sz * 0.55);
        ctx.beginPath();
        ctx.moveTo(lerp(tailX, px, 0.45), lerp(tailY, py, 0.45));
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.3, sz * 0.75), 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === ParticleShape.Wisp) {
        // Spirit Foxfire orb with smooth ribbon trail
        const base = i * TRAIL_POINTS;
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.48).toFixed(3)})`;
        ctx.lineWidth = Math.max(1.5, sz * 1.15);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        for (let k = 0; k < TRAIL_POINTS; k++) {
          ctx.lineTo(this.trailX[base + k] * width, this.trailY[base + k] * height);
        }
        ctx.stroke();

        // Outer foxfire halo
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(alpha * 0.38).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, sz * 2.1, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `rgba(240,249,255,${(alpha * 0.95).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, sz * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

// ─── PROCEDURAL MIDPOINT-DISPLACEMENT LIGHTNING SYSTEM ──────────────────────

const MAX_BOLT_SEGMENTS = 64;
const MAX_ACTIVE_BOLTS = 4;

export interface LightningConfig {
  intervalMin: number;
  intervalMax: number;
  decayRate: number;
  glowColor: string;
  coreColor: string;
  flashAlpha?: number;
  ringMode?: boolean; // If true, arcs along a circular perimeter (for frames)
  ringRadius?: number;
}

export class LightningPool2D {
  private config: LightningConfig;
  private rng: () => number;
  private timer = 0.1;

  // Pre-allocated bolt buffers
  private readonly boltActive = new Uint8Array(MAX_ACTIVE_BOLTS);
  private readonly boltAge = new Float32Array(MAX_ACTIVE_BOLTS);
  private readonly boltSegCount = new Uint8Array(MAX_ACTIVE_BOLTS);
  private readonly segX1 = new Float32Array(MAX_ACTIVE_BOLTS * MAX_BOLT_SEGMENTS);
  private readonly segY1 = new Float32Array(MAX_ACTIVE_BOLTS * MAX_BOLT_SEGMENTS);
  private readonly segX2 = new Float32Array(MAX_ACTIVE_BOLTS * MAX_BOLT_SEGMENTS);
  private readonly segY2 = new Float32Array(MAX_ACTIVE_BOLTS * MAX_BOLT_SEGMENTS);
  private readonly segWidth = new Float32Array(MAX_ACTIVE_BOLTS * MAX_BOLT_SEGMENTS);

  constructor(config: LightningConfig, seed = 9001) {
    this.config = config;
    this.rng = mulberry32(seed);
  }

  private addSegment(
    boltIdx: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number
  ): void {
    const count = this.boltSegCount[boltIdx];
    if (count >= MAX_BOLT_SEGMENTS) return;
    const idx = boltIdx * MAX_BOLT_SEGMENTS + count;
    this.segX1[idx] = x1;
    this.segY1[idx] = y1;
    this.segX2[idx] = x2;
    this.segY2[idx] = y2;
    this.segWidth[idx] = width;
    this.boltSegCount[boltIdx] = count + 1;
  }

  private subdivide(
    boltIdx: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    displace: number,
    depth: number,
    width: number
  ): void {
    if (depth <= 0 || displace < 0.008) {
      this.addSegment(boltIdx, x1, y1, x2, y2, width);
      return;
    }
    const mx = (x1 + x2) * 0.5 + (this.rng() - 0.5) * displace;
    const my = (y1 + y2) * 0.5 + (this.rng() - 0.5) * displace;
    this.subdivide(boltIdx, x1, y1, mx, my, displace * 0.54, depth - 1, width);
    this.subdivide(boltIdx, mx, my, x2, y2, displace * 0.54, depth - 1, width);

    // Occasional branch
    if (depth >= 2 && this.rng() < 0.38) {
      const bx = mx + (x2 - x1) * 0.45 + (this.rng() - 0.5) * displace * 0.9;
      const by = my + (y2 - y1) * 0.45 + (this.rng() - 0.5) * displace * 0.9;
      this.subdivide(boltIdx, mx, my, bx, by, displace * 0.45, depth - 2, width * 0.6);
    }
  }

  triggerStrike(): void {
    let slot = 0;
    let maxAge = -1;
    for (let i = 0; i < MAX_ACTIVE_BOLTS; i++) {
      if (this.boltActive[i] === 0) {
        slot = i;
        break;
      }
      if (this.boltAge[i] > maxAge) {
        maxAge = this.boltAge[i];
        slot = i;
      }
    }

    this.boltActive[slot] = 1;
    this.boltAge[slot] = 0;
    this.boltSegCount[slot] = 0;

    if (this.config.ringMode) {
      const r = this.config.ringRadius ?? 0.41;
      const a1 = this.rng() * Math.PI * 2;
      const a2 = a1 + (0.65 + this.rng() * 0.85) * (this.rng() < 0.5 ? 1 : -1);
      const steps = 5;
      for (let s = 0; s < steps; s++) {
        const t1 = lerp(a1, a2, s / steps);
        const t2 = lerp(a1, a2, (s + 1) / steps);
        const x1 = 0.5 + Math.cos(t1) * r;
        const y1 = 0.5 + Math.sin(t1) * r;
        const x2 = 0.5 + Math.cos(t2) * r;
        const y2 = 0.5 + Math.sin(t2) * r;
        this.subdivide(slot, x1, y1, x2, y2, 0.055, 2, 1.8);
      }
    } else {
      const x1 = 0.12 + this.rng() * 0.76;
      const y1 = 0.02 + this.rng() * 0.12;
      const x2 = clamp(x1 + (this.rng() - 0.5) * 0.45, 0.08, 0.92);
      const y2 = 0.68 + this.rng() * 0.28;
      this.subdivide(slot, x1, y1, x2, y2, 0.22, 4, 2.4);
    }
  }

  update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.triggerStrike();
      this.timer =
        this.config.intervalMin +
        (this.config.intervalMax - this.config.intervalMin) * this.rng();
    }

    for (let i = 0; i < MAX_ACTIVE_BOLTS; i++) {
      if (this.boltActive[i] === 0) continue;
      this.boltAge[i] += dt;
      const alpha = Math.exp(-this.boltAge[i] * this.config.decayRate);
      if (alpha < 0.02) {
        this.boltActive[i] = 0;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < MAX_ACTIVE_BOLTS; i++) {
      if (this.boltActive[i] === 0) continue;
      const alpha = Math.exp(-this.boltAge[i] * this.config.decayRate);
      if (alpha <= 0.02) continue;

      // Subtle atmospheric flash decay on recent strike
      if (this.config.flashAlpha && this.boltAge[i] < 0.18) {
        const fAlpha = (1 - this.boltAge[i] / 0.18) * this.config.flashAlpha;
        ctx.fillStyle = `rgba(254, 240, 138, ${fAlpha.toFixed(3)})`;
        ctx.fillRect(0, 0, width, height);
      }

      const count = this.boltSegCount[i];
      const base = i * MAX_BOLT_SEGMENTS;

      // Pass 1: Wide outer afterglow
      ctx.strokeStyle = this.config.glowColor;
      ctx.globalAlpha = clamp(alpha * 0.55, 0, 1);
      for (let s = 0; s < count; s++) {
        const idx = base + s;
        ctx.lineWidth = this.segWidth[idx] * 3.2;
        ctx.beginPath();
        ctx.moveTo(this.segX1[idx] * width, this.segY1[idx] * height);
        ctx.lineTo(this.segX2[idx] * width, this.segY2[idx] * height);
        ctx.stroke();
      }

      // Pass 2: Crisp white-hot core
      ctx.strokeStyle = this.config.coreColor;
      ctx.globalAlpha = clamp(alpha * 0.95, 0, 1);
      for (let s = 0; s < count; s++) {
        const idx = base + s;
        ctx.lineWidth = this.segWidth[idx] * 1.1;
        ctx.beginPath();
        ctx.moveTo(this.segX1[idx] * width, this.segY1[idx] * height);
        ctx.lineTo(this.segX2[idx] * width, this.segY2[idx] * height);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// ─── SINE-DRIVEN SPINE MESH WARP HELPER (FOR KITSUNE TAILS & WINGS) ─────────

export function drawSwayingTailMesh(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  length: number,
  baseAngle: number,
  maxWidth: number,
  elapsed: number,
  phase: number,
  fillStyle: string,
  tipGlowColor: string
): void {
  const segments = 10;
  const segLen = length / segments;
  let cx = baseX;
  let cy = baseY;
  let ang = baseAngle;

  const leftX = new Float32Array(segments + 1);
  const leftY = new Float32Array(segments + 1);
  const rightX = new Float32Array(segments + 1);
  const rightY = new Float32Array(segments + 1);

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const wave = Math.sin(elapsed * 2.1 + phase - u * 2.6) * 0.16 * u;
    ang = baseAngle + wave;
    const profile = Math.sin(u * Math.PI) * maxWidth * (1 - u * 0.35) + (1 - u) * maxWidth * 0.25;
    const nx = -Math.sin(ang) * profile;
    const ny = Math.cos(ang) * profile;

    leftX[i] = cx + nx;
    leftY[i] = cy + ny;
    rightX[i] = cx - nx;
    rightY[i] = cy - ny;

    if (i < segments) {
      cx += Math.cos(ang) * segLen;
      cy += Math.sin(ang) * segLen;
    }
  }

  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(leftX[0], leftY[0]);
  for (let i = 1; i <= segments; i++) {
    ctx.lineTo(leftX[i], leftY[i]);
  }
  for (let i = segments; i >= 0; i--) {
    ctx.lineTo(rightX[i], rightY[i]);
  }
  ctx.closePath();
  ctx.fill();

  // Luminescent tail tip glow
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = tipGlowColor;
  ctx.beginPath();
  ctx.arc(cx, cy, maxWidth * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── GLOBAL SINGLETON RAF SCHEDULER & SHARED INTERSECTION OBSERVER ──────────

export interface FxTask {
  element: HTMLElement;
  canAnimate: boolean;
  onFrame: (dt: number, elapsed: number) => void;
  onStaticFrame?: () => void;
}

class StoreFxScheduler {
  private tasks = new Map<HTMLElement, FxTask>();
  private visibilityMap = new WeakMap<HTMLElement, boolean>();
  private observer: IntersectionObserver | null = null;
  private rafId: number | null = null;
  private lastNow = 0;
  private elapsed = 0;
  private isTabVisible = true;
  private prefersReducedMotion = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.isTabVisible = document.visibilityState === 'visible';
      document.addEventListener('visibilitychange', () => {
        this.isTabVisible = document.visibilityState === 'visible';
        if (this.isTabVisible) {
          this.lastNow = performance.now();
          this.ensureLoop();
        } else {
          this.stopLoop();
        }
      });

      try {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.prefersReducedMotion = mq.matches;
        mq.addEventListener('change', (e) => {
          this.prefersReducedMotion = e.matches;
          if (this.prefersReducedMotion) {
            this.stopLoop();
            this.renderAllStatic();
          } else {
            this.ensureLoop();
          }
        });
      } catch {
        // ignore
      }

      if (typeof IntersectionObserver !== 'undefined') {
        this.observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const el = entry.target as HTMLElement;
              this.visibilityMap.set(el, entry.isIntersecting);
            }
            this.ensureLoop();
          },
          { threshold: 0.01, rootMargin: '80px' }
        );
      }
    }
  }

  register(task: FxTask): () => void {
    const el = task.element;
    this.tasks.set(el, task);
    this.visibilityMap.set(el, true);
    this.observer?.observe(el);

    if (this.prefersReducedMotion || !task.canAnimate) {
      task.onStaticFrame?.();
    } else {
      // Render initial frame immediately so there is zero blank flash
      task.onFrame(0.016, this.elapsed);
      this.ensureLoop();
    }

    return () => {
      this.tasks.delete(el);
      this.observer?.unobserve(el);
      if (this.tasks.size === 0) {
        this.stopLoop();
      }
    };
  }

  private renderAllStatic(): void {
    for (const task of this.tasks.values()) {
      task.onStaticFrame?.();
    }
  }

  private hasActiveVisibleTask(): boolean {
    if (!this.isTabVisible || this.prefersReducedMotion) return false;
    for (const [el, task] of this.tasks.entries()) {
      if (task.canAnimate && (this.visibilityMap.get(el) ?? true)) {
        return true;
      }
    }
    return false;
  }

  private ensureLoop(): void {
    if (this.rafId !== null) return;
    if (!this.hasActiveVisibleTask()) return;
    this.lastNow = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (now: number): void => {
    this.rafId = null;
    if (!this.hasActiveVisibleTask()) return;

    const rawDt = (now - this.lastNow) / 1000;
    this.lastNow = now;
    const dt = clamp(rawDt, 0.001, 0.05);
    this.elapsed += dt;

    for (const [el, task] of this.tasks.entries()) {
      if (!task.canAnimate) continue;
      if (!(this.visibilityMap.get(el) ?? true)) continue;
      task.onFrame(dt, this.elapsed);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}

export const storeFxScheduler = new StoreFxScheduler();
