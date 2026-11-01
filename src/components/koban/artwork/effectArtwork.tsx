import React, { useCallback, useEffect, useState } from 'react';
import { StoreFxCanvas } from '../fx/StoreFxCanvas';
import { StoreLoopVideo } from '../fx/StoreLoopVideo';
import {
  COLOR_RAMPS,
  LightningPool2D,
  ParticlePool2D,
  ParticleShape,
  mulberry32,
  noise2D,
} from '../fx/storeFxEngine';

interface EffectProps {
  itemId: string;
  size?: number;
  canAnimate?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const WAVE2_3D_EFFECT_IDS = new Set([
  'effect-phoenix-rebirth-flames',
  'effect-frost-spirit-blizzard',
  'effect-cyber-glitch-matrix',
  'effect-lantern-spirit-drift',
  'effect-shuriken-storm',
]);

const PREMIUM_EFFECT_IDS = new Set([
  'effect-dragon-fire-aura',
  'effect-thunder-kami-storm',
  'effect-spirit-fox-fire',
  'effect-cherry-blossom-gale',
  'effect-falling-stars',
  'effect-phoenix-rebirth-flames',
  'effect-frost-spirit-blizzard',
  'effect-cyber-glitch-matrix',
  'effect-lantern-spirit-drift',
  'effect-shuriken-storm',
]);

/**
 * Pure Canvas-2D renderer for the 5 new Store Profile Effects,
 * driven by the shared single-rAF StoreFxCanvas engine.
 */
const PremiumProfileEffectCanvas: React.FC<{
  itemId: string;
  canAnimate?: boolean;
  mode: 'card' | 'avatar';
}> = ({ itemId, canAnimate = true, mode }) => {
  const isCard = mode === 'card';

  const onStepDragonFire = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0xdf1234);

      // Warm ambient underglow at base of card/avatar
      const baseGlow = ctx.createLinearGradient(0, h, 0, h * 0.25);
      const pulse = 0.22 + 0.08 * Math.sin(elapsed * 4.2);
      baseGlow.addColorStop(0, `rgba(220, 38, 38, ${pulse.toFixed(3)})`);
      baseGlow.addColorStop(0.5, `rgba(249, 115, 22, ${(pulse * 0.55).toFixed(3)})`);
      baseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = baseGlow;
      ctx.fillRect(0, 0, w, h);

      // Rising soft additive flame plumes with turbulence (white -> orange -> crimson -> smoke)
      pool.emit(dt, isCard ? 36 : 22, () => {
        const edgeBias = rand() < 0.65 ? (rand() < 0.5 ? rand() * 0.28 : 0.72 + rand() * 0.28) : rand();
        return {
          x: edgeBias * w,
          y: h + 6,
          vx: (rand() - 0.5) * 18,
          vy: -(38 + rand() * (isCard ? 54 : 34)),
          size0: isCard ? 14 + rand() * 14 : 7 + rand() * 7,
          size1: isCard ? 26 + rand() * 18 : 13 + rand() * 9,
          life: 1.2 + rand() * 1.1,
          drag: 0.99,
          gravity: -16,
          turbulence: 42,
          ramp: COLOR_RAMPS.dragonFire,
          additive: true,
          shape: ParticleShape.SoftGlow,
          alphaPeak: 0.72,
          seed: rand() * 100,
        };
      });

      // Rising dark smoke wisps near top of flames
      pool.emit(dt, isCard ? 10 : 5, () => ({
        x: (0.1 + rand() * 0.8) * w,
        y: h * (0.65 + rand() * 0.3),
        vx: (rand() - 0.5) * 14,
        vy: -(24 + rand() * 28),
        size0: isCard ? 12 + rand() * 10 : 6 + rand() * 5,
        size1: isCard ? 28 + rand() * 16 : 14 + rand() * 8,
        life: 1.5 + rand() * 1.1,
        drag: 0.985,
        gravity: -8,
        turbulence: 28,
        ramp: COLOR_RAMPS.obsidianAsh,
        additive: false,
        shape: ParticleShape.Smoke,
        alphaPeak: 0.28,
        seed: rand() * 100,
      }));

      // Fast bright rising dragon sparks
      pool.emit(dt, isCard ? 24 : 14, () => ({
        x: rand() * w,
        y: h + 4,
        vx: (rand() - 0.5) * 36,
        vy: -(58 + rand() * (isCard ? 78 : 48)),
        size0: isCard ? 2.4 + rand() * 2.2 : 1.6 + rand() * 1.5,
        size1: 0.5,
        life: 0.85 + rand() * 0.95,
        drag: 0.992,
        gravity: -20,
        turbulence: 52,
        rotation: rand() * Math.PI * 2,
        vRot: (rand() - 0.5) * 8,
        ramp: COLOR_RAMPS.dragonEmber,
        additive: true,
        shape: ParticleShape.Spark,
        alphaPeak: 0.95,
        seed: rand() * 100,
      }));

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const onStepThunderKami = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D,
      lightning: LightningPool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0x77a9bc);

      // Storm cloud afterglow & flash decay
      const flashAlpha = lightning.getFlashAlpha();
      if (flashAlpha > 0.01) {
        const flashGrad = ctx.createRadialGradient(w * 0.5, h * 0.2, 4, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
        flashGrad.addColorStop(0, `rgba(254, 249, 195, ${(flashAlpha * 0.42).toFixed(3)})`);
        flashGrad.addColorStop(0.5, `rgba(56, 189, 248, ${(flashAlpha * 0.24).toFixed(3)})`);
        flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Procedural branching lightning strikes with afterglow
      lightning.updateAndDraw(ctx, dt, () => {
        if (rand() < dt * (isCard ? 4.2 : 3.2)) {
          const isGold = rand() < 0.55;
          const x1 = (0.12 + rand() * 0.76) * w;
          const y1 = rand() * h * 0.18;
          const x2 = x1 + (rand() - 0.5) * w * 0.42;
          const y2 = h * (0.62 + rand() * 0.35);
          lightning.triggerBolt({
            x1,
            y1,
            x2,
            y2,
            life: 0.22 + rand() * 0.16,
            colorCore: '#FFFFFF',
            colorGlow: isGold ? '#FACC15' : '#38BDF8',
            width: isCard ? 2.1 : 1.5,
            displacement: isCard ? 24 : 13,
            branchChance: 0.5,
            seed: ((elapsed * 1000) | 0) + ((rand() * 999) | 0),
          });
        }
      });

      // Ionized electric sparks & afterglow motes
      pool.emit(dt, isCard ? 26 : 14, () => ({
        x: (0.08 + rand() * 0.84) * w,
        y: (0.1 + rand() * 0.8) * h,
        vx: (rand() - 0.5) * 45,
        vy: (rand() - 0.5) * 45,
        size0: isCard ? 2.2 + rand() * 2.2 : 1.5 + rand() * 1.4,
        size1: 0.4,
        life: 0.35 + rand() * 0.45,
        drag: 0.94,
        turbulence: 65,
        rotation: rand() * Math.PI * 2,
        vRot: (rand() - 0.5) * 10,
        ramp: COLOR_RAMPS.thunderGold,
        additive: true,
        shape: ParticleShape.Spark,
        alphaPeak: 0.92,
        seed: rand() * 100,
      }));

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const onStepSpiritFox = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0x5f0911);

      // 5 primary Fox-Fire orbs following smooth continuous 2D noise paths with soft glowing ribbon trails
      const orbCount = isCard ? 5 : 3;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < orbCount; i++) {
        const phase = i * 1.2566 + elapsed * 0.55;
        const trailSteps = 9;
        for (let s = trailSteps - 1; s >= 0; s--) {
          const tSample = elapsed - s * 0.045;
          const nx = noise2D(tSample * 0.48 + i * 3.7, i * 1.9 + 0.5);
          const ny = noise2D(i * 2.3 + 1.1, tSample * 0.48 + i * 4.1);
          const ox = w * (0.5 + 0.36 * Math.cos(phase - s * 0.08) + nx * 0.14);
          const oy = h * (0.5 + 0.32 * Math.sin(phase * 1.15 - s * 0.08) + ny * 0.14);
          const frac = 1 - s / trailSteps;
          const r = (isCard ? 11 : 6.5) * (0.35 + 0.65 * frac);
          const isViolet = i % 2 === 1;

          const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * 1.7);
          if (s === 0) {
            grad.addColorStop(0, 'rgba(240, 249, 255, 0.95)');
          } else {
            grad.addColorStop(0, isViolet ? `rgba(192, 132, 252, ${(0.42 * frac).toFixed(3)})` : `rgba(56, 189, 248, ${(0.42 * frac).toFixed(3)})`);
          }
          grad.addColorStop(0.55, isViolet ? `rgba(147, 51, 234, ${(0.28 * frac).toFixed(3)})` : `rgba(14, 165, 233, ${(0.28 * frac).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(ox, oy, r * 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Secondary drifting spirit wisps with ribbon trails in the particle pool
      pool.emit(dt, isCard ? 18 : 10, () => ({
        x: (0.1 + rand() * 0.8) * w,
        y: (0.15 + rand() * 0.75) * h,
        vx: (rand() - 0.5) * 20,
        vy: -(16 + rand() * 22),
        size0: isCard ? 4.2 + rand() * 3.2 : 2.5 + rand() * 2,
        size1: 1.0,
        life: 1.5 + rand() * 1.2,
        drag: 0.992,
        gravity: -6,
        turbulence: 44,
        ramp: COLOR_RAMPS.spiritFox,
        additive: true,
        shape: ParticleShape.Wisp,
        alphaPeak: 0.85,
        seed: rand() * 100,
      }));

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const onStepCherryBlossomGale = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0xca4419);

      // Swirling wind field ribbons (subtle translucent silk currents)
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.16)';
      ctx.lineWidth = isCard ? 1.4 : 1;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        const yBase = h * (0.32 + i * 0.36);
        for (let x = 0; x <= w; x += 12) {
          const y =
            yBase +
            Math.sin(x * 0.025 - elapsed * 2.4 + i * 1.8) * (isCard ? 14 : 7) +
            Math.cos(x * 0.012 + elapsed * 1.5) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Depth-sorted sakura petals with 3D-looking tumble rotation & swirling wind turbulence
      pool.emit(dt, isCard ? 26 : 15, () => {
        // Depth factor: 0 = far/small, 1 = close/large/soft
        const depth = rand();
        const baseSize = isCard
          ? 3.2 + depth * 5.2
          : 2.2 + depth * 3.0;
        const fromTop = rand() < 0.45;
        return {
          x: fromTop ? rand() * w * 0.85 : -10,
          y: fromTop ? -10 : rand() * h * 0.85,
          vx: (36 + depth * 42) * (isCard ? 1 : 0.7),
          vy: (18 + depth * 24) * (isCard ? 1 : 0.7),
          size0: baseSize,
          size1: baseSize * 0.85,
          life: 2.2 + rand() * 1.6,
          drag: 0.996,
          gravity: 6,
          turbulence: 34 + depth * 22,
          rotation: rand() * Math.PI * 2,
          vRot: (rand() - 0.5) * 4.5,
          ramp: COLOR_RAMPS.sakuraGale,
          additive: depth > 0.72,
          shape: ParticleShape.Petal,
          alphaPeak: 0.55 + depth * 0.4,
          seed: rand() * 100,
        };
      });

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const onStepFallingStars = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0x9988aa);

      // Regular golden meteors with fading tapered tails
      pool.emit(dt, isCard ? 14 : 9, () => {
        const isRareBright = rand() < 0.18;
        const speed = (isRareBright ? 155 : 95 + rand() * 45) * (isCard ? 1 : 0.72);
        const angle = Math.PI * 0.72 + (rand() - 0.5) * 0.12; // ~130 deg diagonal down-left
        return {
          x: (0.2 + rand() * 0.95) * w,
          y: -8 + rand() * h * 0.35,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size0: isRareBright ? (isCard ? 3.8 : 2.6) : isCard ? 2.2 + rand() * 1.1 : 1.6 + rand() * 0.8,
          size1: 0.4,
          life: 0.75 + rand() * 0.65,
          drag: 0.998,
          gravity: 12,
          turbulence: 4,
          ramp: COLOR_RAMPS.fallingStars,
          additive: true,
          shape: ParticleShape.Streak,
          alphaPeak: isRareBright ? 1.0 : 0.85,
          seed: rand() * 100,
        };
      });

      // Twinkling golden stardust wake
      pool.emit(dt, isCard ? 16 : 9, () => ({
        x: (0.08 + rand() * 0.84) * w,
        y: (0.08 + rand() * 0.84) * h,
        vx: -8 + (rand() - 0.5) * 8,
        vy: 6 + (rand() - 0.5) * 8,
        size0: isCard ? 1.8 + rand() * 1.6 : 1.2 + rand() * 1.2,
        size1: 0.3,
        life: 1.1 + rand() * 1.0,
        drag: 0.98,
        turbulence: 10,
        rotation: rand() * Math.PI * 2,
        vRot: (rand() - 0.5) * 4,
        ramp: COLOR_RAMPS.fallingStars,
        additive: true,
        shape: ParticleShape.Spark,
        alphaPeak: 0.8,
        seed: rand() * 100,
      }));

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  // ─── 5 NEW WAVE 2 PROFILE EFFECTS (3D Loop + Canvas FX Overlay) ──────────
  const onStepPhoenixRebirth = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0xfa8812);

      // Rising Phoenix Flame Silhouette Wing Arcs
      const cycle = (elapsed * 0.45) % 1;
      const py = h * (0.85 - cycle * 0.65);
      const wingSpan = w * (0.28 + 0.1 * Math.sin(elapsed * 4.2));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const phxGrad = ctx.createRadialGradient(w * 0.5, py, 2, w * 0.5, py, wingSpan);
      phxGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
      phxGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.32)');
      phxGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = phxGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, py, wingSpan, wingSpan * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      pool.emit(dt, isCard ? 28 : 16, () => ({
        x: (0.12 + rand() * 0.76) * w,
        y: h + 4,
        vx: (rand() - 0.5) * 28,
        vy: -(52 + rand() * (isCard ? 68 : 42)),
        size0: isCard ? 3.2 + rand() * 2.8 : 2.0 + rand() * 1.8,
        size1: 0.6,
        life: 0.9 + rand() * 1.0,
        drag: 0.992,
        gravity: -18,
        turbulence: 46,
        rotation: rand() * Math.PI * 2,
        vRot: (rand() - 0.5) * 6,
        ramp: COLOR_RAMPS.dragonFire,
        additive: true,
        shape: ParticleShape.Spark,
        alphaPeak: 0.95,
        seed: rand() * 100,
      }));

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const onStepFrostBlizzard = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0x44ccff);

      pool.emit(dt, isCard ? 30 : 18, () => ({
        x: -10 + rand() * w * 0.9,
        y: -10 + rand() * h * 0.7,
        vx: 45 + rand() * 48,
        vy: 28 + rand() * 34,
        size0: isCard ? 2.6 + rand() * 3.2 : 1.8 + rand() * 2.0,
        size1: 0.8,
        life: 1.2 + rand() * 1.2,
        drag: 0.994,
        gravity: 8,
        turbulence: 42,
        rotation: rand() * Math.PI * 2,
        vRot: (rand() - 0.5) * 6,
        ramp: COLOR_RAMPS.spiritFox,
        additive: true,
        shape: rand() < 0.5 ? ParticleShape.Spark : ParticleShape.SoftGlow,
        alphaPeak: 0.88,
        seed: rand() * 100,
      }));

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const onStepCyberMatrix = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0x10ff88);

      // Falling neon code column streaks + horizontal glitch bars
      const cols = isCard ? 10 : 6;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let c = 0; c < cols; c++) {
        const cx = ((c + 0.5) / cols) * w;
        const headY = ((elapsed * (55 + (c % 4) * 18) + c * 47) % (h + 40)) - 20;
        const grad = ctx.createLinearGradient(cx, headY - 38, cx, headY);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        grad.addColorStop(0.7, c % 2 === 0 ? 'rgba(0, 240, 255, 0.38)' : 'rgba(16, 185, 129, 0.38)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - 1.2, headY - 38, 2.4, 38);
      }
      if (Math.sin(elapsed * 9.5) > 0.65) {
        const gy = (Math.sin(elapsed * 17.3) * 0.5 + 0.5) * h;
        ctx.fillStyle = 'rgba(255, 0, 122, 0.24)';
        ctx.fillRect(0, gy, w, 3);
      }
      ctx.restore();

      pool.emit(dt, isCard ? 18 : 10, () => ({
        x: rand() * w,
        y: -6,
        vx: 0,
        vy: 65 + rand() * 55,
        size0: isCard ? 2.2 : 1.5,
        size1: 0.8,
        life: 1.0 + rand() * 0.9,
        drag: 1,
        ramp: COLOR_RAMPS.neonKyoto,
        additive: true,
        shape: ParticleShape.Streak,
        alphaPeak: 0.85,
        seed: rand() * 100,
      }));

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const onStepLanternDrift = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0xffaa33);

      pool.emit(dt, isCard ? 20 : 12, () => ({
        x: (0.1 + rand() * 0.8) * w,
        y: h + 8,
        vx: (rand() - 0.5) * 14,
        vy: -(28 + rand() * 32),
        size0: isCard ? 5.5 + rand() * 4.5 : 3.2 + rand() * 2.5,
        size1: isCard ? 3.5 : 2.0,
        life: 1.8 + rand() * 1.4,
        drag: 0.995,
        gravity: -6,
        turbulence: 22,
        ramp: COLOR_RAMPS.fallingStars,
        additive: true,
        shape: ParticleShape.SoftGlow,
        alphaPeak: 0.9,
        seed: rand() * 100,
      }));

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const onStepShurikenStorm = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      elapsed: number,
      pool: ParticlePool2D
    ) => {
      const rand = mulberry32(((elapsed * 1000) | 0) ^ 0x88ccff);

      pool.emit(dt, isCard ? 22 : 14, () => {
        const speed = (125 + rand() * 65) * (isCard ? 1 : 0.75);
        const angle = Math.PI * 0.22 + (rand() - 0.5) * 0.14;
        return {
          x: -12 + rand() * w * 0.55,
          y: -12 + rand() * h * 0.45,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size0: isCard ? 3.2 + rand() * 2.0 : 2.2 + rand() * 1.2,
          size1: 0.6,
          life: 0.75 + rand() * 0.6,
          drag: 0.998,
          rotation: rand() * Math.PI * 2,
          vRot: 12,
          ramp: COLOR_RAMPS.neonKyoto,
          additive: true,
          shape: ParticleShape.Streak,
          alphaPeak: 0.92,
          seed: rand() * 100,
        };
      });

      pool.updateAndDraw(ctx, dt, elapsed);
    },
    [isCard]
  );

  const stepFn =
    itemId === 'effect-dragon-fire-aura'
      ? onStepDragonFire
      : itemId === 'effect-thunder-kami-storm'
      ? onStepThunderKami
      : itemId === 'effect-spirit-fox-fire'
      ? onStepSpiritFox
      : itemId === 'effect-cherry-blossom-gale'
      ? onStepCherryBlossomGale
      : itemId === 'effect-phoenix-rebirth-flames'
      ? onStepPhoenixRebirth
      : itemId === 'effect-frost-spirit-blizzard'
      ? onStepFrostBlizzard
      : itemId === 'effect-cyber-glitch-matrix'
      ? onStepCyberMatrix
      : itemId === 'effect-lantern-spirit-drift'
      ? onStepLanternDrift
      : itemId === 'effect-shuriken-storm'
      ? onStepShurikenStorm
      : onStepFallingStars;

  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none" style={{ contain: 'paint' }}>
      {WAVE2_3D_EFFECT_IDS.has(itemId) && (
        <StoreLoopVideo
          itemId={itemId}
          animated={true}
          canAnimate={canAnimate}
          objectFit="cover"
          className="absolute inset-0 w-full h-full opacity-75 mix-blend-screen"
        />
      )}
      <StoreFxCanvas
        id={`profile-fx-${mode}-${itemId}`}
        canAnimate={canAnimate}
        maxParticles={isCard ? 120 : 65}
        maxBolts={itemId === 'effect-thunder-kami-storm' ? 6 : 2}
        prewarmSeconds={2.4}
        onStep={stepFn}
      />
    </div>
  );
};

/**
 * 25 BESPOKE AVATAR-SIZED EFFECT WRAPPERS (<EffectAvatarRenderer />)
 * Renders atmospheric vector/canvas auras around the student's avatar/frame.
 */
export const EffectAvatarRenderer: React.FC<EffectProps> = ({
  itemId,
  size = 64,
  canAnimate = true,
  children,
  className = '',
}) => {
  if (PREMIUM_EFFECT_IDS.has(itemId)) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <div
          className="absolute -inset-2.5 rounded-full pointer-events-none z-20 overflow-hidden"
          style={{ overflow: 'hidden', contain: 'paint' }}
        >
          <PremiumProfileEffectCanvas itemId={itemId} canAnimate={canAnimate} mode="avatar" />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  switch (itemId) {
    // ─── 13 STATIC AVATAR EFFECTS ──────────────────────────────────────────
    case 'effect-whispering-mist':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M10 80C25 65 45 75 60 70C75 65 85 75 95 80" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
            <path d="M5 88C20 78 40 85 65 82C80 80 90 85 98 88" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-golden-leaf-frost':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M18 18C14 26 22 34 30 30C28 22 24 16 18 18Z" fill="#FBBF24" stroke="#B45309" strokeWidth="0.8" opacity="0.9" />
            <path d="M82 82C86 74 78 66 70 70C72 78 76 84 82 82Z" fill="#FBBF24" stroke="#B45309" strokeWidth="0.8" opacity="0.9" />
            <polygon points="12,12 14,16 18,18 14,20 12,24 10,20 6,18 10,16" fill="#FDE68A" />
            <polygon points="88,88 86,84 82,82 86,80 88,76 90,80 94,82 90,84" fill="#FDE68A" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-crimson-vignette':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute -inset-3 rounded-full bg-radial from-transparent via-[#DC2626]/20 to-[#7F1D1D]/45 pointer-events-none z-0" />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-ink-brush-splash':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M10 25C25 15 45 10 70 18C85 24 95 40 92 65C88 85 70 95 45 92C25 90 10 75 12 50" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" opacity="0.75" />
            <circle cx="88" cy="22" r="3" fill="#0F172A" opacity="0.8" />
            <circle cx="94" cy="32" r="2" fill="#0F172A" opacity="0.8" />
            <circle cx="14" cy="78" r="2.5" fill="#0F172A" opacity="0.8" />
            <rect x="76" y="74" width="8" height="8" fill="#DC2626" opacity="0.9" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-star-chart':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#818CF8" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
            <line x1="50" y1="2" x2="50" y2="10" stroke="#818CF8" strokeWidth="1.5" />
            <line x1="50" y1="90" x2="50" y2="98" stroke="#818CF8" strokeWidth="1.5" />
            <line x1="2" y1="50" x2="10" y2="50" stroke="#818CF8" strokeWidth="1.5" />
            <line x1="90" y1="50" x2="98" y2="50" stroke="#818CF8" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="2" fill="#FDE047" />
            <circle cx="76" cy="24" r="2" fill="#FDE047" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-frosted-crystal':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 53,14 63,14 55,20 58,30 50,24 42,30 45,20 37,14 47,14" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="0.8" opacity="0.85" />
            <polygon points="50,96 52,88 60,88 54,84 56,76 50,80 44,76 46,84 40,88 48,88" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="0.8" opacity="0.85" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-paper-lantern-glow':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute -inset-3 rounded-full bg-radial from-[#F59E0B]/25 via-[#D97706]/10 to-transparent pointer-events-none z-0" />
          <svg className="absolute -top-3 -right-2 w-8 h-8 pointer-events-none z-20 overflow-visible" viewBox="0 0 32 32" fill="none">
            <line x1="16" y1="0" x2="16" y2="8" stroke="#78350F" strokeWidth="1.5" />
            <rect x="10" y="8" width="12" height="16" rx="3" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" />
            <line x1="10" y1="16" x2="22" y2="16" stroke="#FEF08A" strokeWidth="1" />
            <circle cx="16" cy="16" r="3" fill="#FDE047" opacity="0.8" />
            <line x1="16" y1="24" x2="16" y2="30" stroke="#B45309" strokeWidth="1.5" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-sacred-geometry':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,82 10,82" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />
            <polygon points="50,96 90,18 10,18" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="50" r="46" stroke="#D97706" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.5" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-bamboo-screen':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <rect x="6" y="20" width="4" height="60" rx="1" fill="#15803D" stroke="#86EFAC" strokeWidth="0.8" />
            <rect x="90" y="20" width="4" height="60" rx="1" fill="#15803D" stroke="#86EFAC" strokeWidth="0.8" />
            <path d="M4 30C12 24 20 28 24 32C16 34 10 32 4 30Z" fill="#22C55E" />
            <path d="M96 65C88 60 80 64 76 68C84 70 90 68 96 65Z" fill="#22C55E" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-cherry-carpet':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M26 84C32 78 40 82 38 88C32 94 24 90 26 84Z" fill="#F472B6" opacity="0.9" />
            <path d="M46 88C52 82 60 86 58 92C52 98 44 94 46 88Z" fill="#FB7185" opacity="0.85" />
            <path d="M68 84C74 78 82 82 80 88C74 94 66 90 68 84Z" fill="#F472B6" opacity="0.9" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-dawn-horizon':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M50 50L20 10M50 50L50 2M50 50L80 10M50 50L98 30M50 50L2 30" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="6 4" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-dusk-smoke':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute -inset-3 rounded-full bg-radial from-transparent via-[#581C87]/25 to-[#3B0764]/40 pointer-events-none z-0" />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-ancient-runes':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 5 8 5" opacity="0.75" />
            <text x="50" y="10" fill="#FEF08A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">封</text>
            <text x="50" y="98" fill="#FEF08A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">印</text>
            <text x="8" y="52" fill="#FEF08A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">滅</text>
            <text x="92" y="52" fill="#FEF08A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">破</text>
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    // ─── 12 ANIMATED AVATAR EFFECTS ─────────────────────────────────────────
    case 'effect-faint-sparkles':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span
            className="absolute -top-1 -left-1 text-[#FFD66B] text-xs pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-star-twinkle 2s ease-in-out infinite' } : undefined}
          >
            ✦
          </span>
          <span
            className="absolute -top-1 -right-1 text-[#FFD66B] text-[10px] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-star-twinkle 2.5s ease-in-out infinite 0.6s' } : undefined}
          >
            ✦
          </span>
          <span
            className="absolute -bottom-1 right-0 text-[#FFD66B] text-xs pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-star-twinkle 1.8s ease-in-out infinite 1.2s' } : undefined}
          >
            ✧
          </span>
          <span
            className="absolute bottom-0 -left-1 text-[#FFD66B] text-[9px] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-star-twinkle 2.2s ease-in-out infinite 0.3s' } : undefined}
          >
            ✦
          </span>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-ember-drift':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span
            className="absolute bottom-1 left-2 w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444] z-20 pointer-events-none"
            style={canAnimate ? { animation: 'koban-ember-rise 2s ease-out infinite' } : undefined}
          />
          <span
            className="absolute bottom-3 right-1 w-2.5 h-2.5 rounded-full bg-[#F97316] shadow-[0_0_6px_#F97316] z-20 pointer-events-none"
            style={canAnimate ? { animation: 'koban-ember-rise 2.6s ease-out infinite 0.8s' } : undefined}
          />
          <span
            className="absolute bottom-6 left-1/2 w-1.5 h-1.5 rounded-full bg-[#FDE047] shadow-[0_0_4px_#FDE047] z-20 pointer-events-none"
            style={canAnimate ? { animation: 'koban-ember-rise 2.2s ease-out infinite 1.4s' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-electric-aura':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { animation: 'koban-lightning-flicker 1.8s steps(2, start) infinite' } : undefined}
          >
            <path d="M16 28L26 36L20 46L32 58" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
            <path d="M84 24L74 34L80 44L70 56" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
            <path d="M36 86L46 80L42 72L54 68" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-cherry-storm':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 z-20 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 2.8s ease-in-out infinite' } : undefined}
          >
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#F472B6" />
            <path d="M12 6C10 9 8 11 9 14" stroke="#BE185D" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <svg
            className="absolute bottom-0 -left-2 w-3.5 h-3.5 z-20 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 3.6s ease-in-out infinite 1s' } : undefined}
          >
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#FB7185" />
          </svg>
          <svg
            className="absolute top-1/3 -right-2 w-3 h-3 z-20 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 3.2s ease-in-out infinite 1.8s' } : undefined}
          >
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#FDA4AF" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-shadow-haze':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute -inset-3 rounded-full bg-radial from-transparent via-[#581C87]/35 to-[#3B0764]/70 blur-xs z-0 pointer-events-none"
            style={canAnimate ? { animation: 'koban-pulse-glow 2.8s ease-in-out infinite' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-divine-radiance':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-3.5 w-[calc(100%+28px)] h-[calc(100%+28px)] pointer-events-none z-0 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-cw 12s linear infinite' } : undefined}
          >
            <g stroke="#FBBF24" strokeWidth="1.8" strokeOpacity="0.65" strokeDasharray="4 6">
              <line x1="50" y1="2" x2="50" y2="22" />
              <line x1="50" y1="78" x2="50" y2="98" />
              <line x1="2" y1="50" x2="22" y2="50" />
              <line x1="78" y1="50" x2="98" y2="50" />
              <line x1="16" y1="16" x2="30" y2="30" />
              <line x1="70" y1="70" x2="84" y2="84" />
              <line x1="84" y1="16" x2="70" y2="30" />
              <line x1="30" y1="70" x2="16" y2="84" />
            </g>
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-thunder-storm':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { animation: 'koban-lightning-flicker 1.6s steps(2, start) infinite' } : undefined}
          >
            <polygon points="50,2 54,20 46,20 52,36 42,22 48,22" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
            <polygon points="18,50 34,54 24,56 40,62 26,60 32,58" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
            <polygon points="82,48 66,52 76,54 60,60 74,58 68,56" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-celestial-star-drift':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={canAnimate ? { transformOrigin: 'center', animation: 'koban-orbit-cw 8s linear infinite' } : undefined}
          >
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FDE047] shadow-[0_0_6px_#FDE047]" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E0E7FF] shadow-[0_0_4px_#818CF8]" />
          </div>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-spirit-wisps':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span
            className="absolute bottom-2 -left-2 w-3.5 h-3.5 rounded-full bg-[#38BDF8]/80 blur-[2px] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-pulse-glow 2.4s ease-in-out infinite' } : undefined}
          />
          <span
            className="absolute -top-1 right-1 w-3 h-3 rounded-full bg-[#818CF8]/80 blur-[2px] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-pulse-glow 3s ease-in-out infinite 0.8s' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-neon-rain':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
          >
            <line x1="20" y1="0" x2="16" y2="28" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" style={canAnimate ? { animation: 'koban-sweep-light 1.8s linear infinite' } : undefined} />
            <line x1="80" y1="10" x2="76" y2="38" stroke="#FF007A" strokeWidth="1.5" strokeLinecap="round" style={canAnimate ? { animation: 'koban-sweep-light 2.2s linear infinite 0.6s' } : undefined} />
            <line x1="50" y1="60" x2="46" y2="88" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" style={canAnimate ? { animation: 'koban-sweep-light 2s linear infinite 1.2s' } : undefined} />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-blazing-inferno':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute -inset-3 rounded-full bg-radial from-transparent via-[#DC2626]/30 to-[#EA580C]/50 pointer-events-none z-0"
            style={canAnimate ? { animation: 'koban-flame-flicker 1.8s ease-in-out infinite' } : undefined}
          />
          <span
            className="absolute bottom-0 left-1 w-2 h-2 rounded-full bg-[#FDE047] shadow-[0_0_6px_#FDE047] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-ember-rise 1.8s ease-out infinite' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-abyssal-ripples':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute -inset-3 rounded-full border-2 border-[#00F0FF]/60 shadow-[0_0_10px_rgba(0,240,255,0.4)] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-water-ripple 2.8s ease-in-out infinite' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    default:
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          {children}
        </div>
      );
  }
};

/**
 * 25 FULL-CARD PROFILE OVERLAY EFFECTS (<ProfileCardEffect />)
 * In real profile view: displays for 3-4s, then smoothly fades away.
 * In store card / detail preview (`previewMode={true}`): loops continuously!
 */
export interface ProfileCardEffectProps {
  itemId?: string | null;
  className?: string;
  previewMode?: boolean;
  size?: number;
}

export const ProfileCardEffect: React.FC<ProfileCardEffectProps> = ({ itemId, className = '', previewMode = false }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!itemId || itemId === 'none') {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (!previewMode) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3600); // 3.6s duration
      return () => clearTimeout(timer);
    }
  }, [itemId, previewMode]);

  if (!itemId || itemId === 'none') return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20 transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{ overflow: 'hidden', contain: 'paint' }}
      aria-hidden="true"
    >
      {/* ─── 5 NEW PREMIUM FULL-CARD EFFECTS (Canvas-2D FX Engine Only) ─────── */}
      {PREMIUM_EFFECT_IDS.has(itemId) && (
        <PremiumProfileEffectCanvas itemId={itemId} canAnimate={visible} mode="card" />
      )}

      {/* ─── 13 STATIC FULL-CARD EFFECTS (Zero Motion) ───────────────────────── */}
      {itemId === 'effect-whispering-mist' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none" fill="none">
          <path d="M0 140C60 120 120 160 180 130C240 100 280 150 300 130V200H0Z" fill="#94A3B8" opacity="0.25" />
          <path d="M0 160C80 140 160 180 220 150C270 130 290 170 300 160V200H0Z" fill="#CBD5E1" opacity="0.3" />
          <circle cx="260" cy="40" r="22" fill="#E2E8F0" opacity="0.2" />
        </svg>
      )}

      {itemId === 'effect-golden-leaf-frost' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <rect x="6" y="6" width="288" height="188" rx="12" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="8 6" />
          {/* Top-left Ginkgo leaves */}
          <path d="M12 12C24 16 32 30 24 40C16 42 12 28 12 12Z" fill="#FBBF24" opacity="0.4" />
          {/* Bottom-right Momiji leaf */}
          <path d="M280 180L272 165L260 172L266 160L250 155L265 148L262 135L274 144L285 135L282 148L295 155L280 160Z" fill="#D97706" opacity="0.35" />
        </svg>
      )}

      {itemId === 'effect-crimson-vignette' && (
        <div className="absolute inset-0 bg-radial from-transparent via-[#DC2626]/15 to-[#450A0A]/55" />
      )}

      {itemId === 'effect-ink-brush-splash' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <path d="M-20 60C50 30 120 80 200 40C250 20 280 60 320 40" stroke="#0F172A" strokeWidth="18" strokeLinecap="round" opacity="0.35" />
          <circle cx="240" cy="80" r="6" fill="#0F172A" opacity="0.4" />
          <circle cx="255" cy="95" r="4" fill="#0F172A" opacity="0.4" />
          <circle cx="60" cy="120" r="5" fill="#0F172A" opacity="0.4" />
          <rect x="250" y="20" width="16" height="16" fill="#DC2626" opacity="0.8" />
        </svg>
      )}

      {itemId === 'effect-star-chart' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <circle cx="150" cy="100" r="80" stroke="#818CF8" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
          <circle cx="150" cy="100" r="120" stroke="#818CF8" strokeWidth="0.8" opacity="0.2" />
          <line x1="30" y1="100" x2="270" y2="100" stroke="#818CF8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
          <line x1="150" y1="10" x2="150" y2="190" stroke="#818CF8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
          <circle cx="80" cy="50" r="2.5" fill="#FDE047" opacity="0.7" />
          <circle cx="220" cy="60" r="2.5" fill="#FDE047" opacity="0.7" />
          <circle cx="190" cy="150" r="2" fill="#FDE047" opacity="0.7" />
          <line x1="80" y1="50" x2="110" y2="70" stroke="#FDE047" strokeWidth="0.8" opacity="0.5" />
        </svg>
      )}

      {itemId === 'effect-frosted-crystal' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <path d="M0 0L30 30M300 0L270 30M0 200L30 170M300 200L270 170" stroke="#38BDF8" strokeWidth="2" opacity="0.6" />
          <polygon points="150,0 156,20 166,24 156,28 150,48 144,28 134,24 144,20" fill="#E0F2FE" opacity="0.35" />
          <rect x="4" y="4" width="292" height="192" rx="12" stroke="#38BDF8" strokeWidth="1" opacity="0.3" />
        </svg>
      )}

      {itemId === 'effect-paper-lantern-glow' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          {/* Top Hanging Festival String */}
          <path d="M0 20Q150 60 300 20" stroke="#78350F" strokeWidth="1.5" opacity="0.6" />
          {/* Lantern 1 */}
          <g transform="translate(60, 32)">
            <rect width="20" height="28" rx="4" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" opacity="0.85" />
            <circle cx="10" cy="14" r="5" fill="#FDE047" opacity="0.7" />
          </g>
          {/* Lantern 2 */}
          <g transform="translate(220, 32)">
            <rect width="20" height="28" rx="4" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" opacity="0.85" />
            <circle cx="10" cy="14" r="5" fill="#FDE047" opacity="0.7" />
          </g>
        </svg>
      )}

      {itemId === 'effect-sacred-geometry' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <g transform="translate(150, 100)" stroke="#F59E0B" strokeWidth="1" opacity="0.25">
            <polygon points="0,-70 60,35 -60,35" />
            <polygon points="0,70 60,-35 -60,-35" />
            <circle r="72" />
            <circle r="45" strokeDasharray="4 4" />
          </g>
        </svg>
      )}

      {itemId === 'effect-bamboo-screen' && (
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_90%,rgba(34,197,94,0.18)_90%)] [background-size:20px_100%]" />
      )}

      {itemId === 'effect-cherry-carpet' && (
        <svg className="absolute inset-x-0 bottom-0 w-full h-16" viewBox="0 0 300 64" fill="none">
          <path d="M20 50C26 44 34 48 32 54C26 60 18 56 20 50Z" fill="#F472B6" opacity="0.7" />
          <path d="M80 44C86 38 94 42 92 48C86 54 78 50 80 44Z" fill="#FB7185" opacity="0.6" />
          <path d="M150 52C156 46 164 50 162 56C156 62 148 58 150 52Z" fill="#F472B6" opacity="0.7" />
          <path d="M220 46C226 40 234 44 232 50C226 56 218 52 220 46Z" fill="#FB7185" opacity="0.6" />
          <path d="M270 54C276 48 284 52 282 58C276 64 268 60 270 54Z" fill="#F472B6" opacity="0.7" />
        </svg>
      )}

      {itemId === 'effect-dawn-horizon' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <g stroke="#F59E0B" strokeWidth="2" opacity="0.3" strokeDasharray="8 6">
            <line x1="150" y1="200" x2="30" y2="0" />
            <line x1="150" y1="200" x2="90" y2="0" />
            <line x1="150" y1="200" x2="150" y2="0" />
            <line x1="150" y1="200" x2="210" y2="0" />
            <line x1="150" y1="200" x2="270" y2="0" />
          </g>
        </svg>
      )}

      {itemId === 'effect-dusk-smoke' && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#3B0764]/40 via-[#1E1B4B]/20 to-transparent" />
      )}

      {itemId === 'effect-ancient-runes' && (
        <div className="absolute inset-0 border-2 border-[#D97706]/40 rounded-2xl flex items-center justify-between p-2 pointer-events-none">
          <span className="text-xs text-[#FEF08A] opacity-60">封</span>
          <span className="text-xs text-[#FEF08A] opacity-60">印</span>
          <span className="text-xs text-[#FEF08A] opacity-60">界</span>
          <span className="text-xs text-[#FEF08A] opacity-60">陣</span>
        </div>
      )}

      {/* ─── 12 ANIMATED FULL-CARD EFFECTS (Visible Looping Motion) ───────────── */}
      {itemId === 'effect-faint-sparkles' && (
        <div className="absolute inset-0">
          <span className="absolute top-6 left-12 text-[#FDE047] text-xl" style={{ animation: 'koban-star-twinkle 2.2s ease-in-out infinite' }}>✦</span>
          <span className="absolute top-16 right-16 text-[#FDE047] text-sm" style={{ animation: 'koban-star-twinkle 2.8s ease-in-out infinite 0.7s' }}>✦</span>
          <span className="absolute bottom-10 left-1/4 text-[#FEF08A] text-lg" style={{ animation: 'koban-star-twinkle 1.9s ease-in-out infinite 1.3s' }}>✧</span>
          <span className="absolute bottom-16 right-1/3 text-[#FDE047] text-base" style={{ animation: 'koban-star-twinkle 2.4s ease-in-out infinite 0.4s' }}>✦</span>
        </div>
      )}

      {itemId === 'effect-ember-drift' && (
        <div className="absolute inset-0">
          <span className="absolute bottom-4 left-10 w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" style={{ animation: 'koban-ember-rise 2.4s ease-out infinite' }} />
          <span className="absolute bottom-8 right-16 w-3 h-3 rounded-full bg-[#F97316] shadow-[0_0_8px_#F97316]" style={{ animation: 'koban-ember-rise 2.8s ease-out infinite 0.7s' }} />
          <span className="absolute bottom-12 left-1/2 w-2 h-2 rounded-full bg-[#FDE047] shadow-[0_0_6px_#FDE047]" style={{ animation: 'koban-ember-rise 2.1s ease-out infinite 1.4s' }} />
        </div>
      )}

      {itemId === 'effect-electric-aura' && (
        <div
          className="absolute inset-0 border-2 border-[#00F0FF]/60 shadow-[inset_0_0_20px_rgba(0,240,255,0.3)] rounded-2xl"
          style={{ animation: 'koban-lightning-flicker 2s steps(2, start) infinite' }}
        />
      )}

      {itemId === 'effect-cherry-storm' && (
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-4 left-16 w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ animation: 'koban-petal-fall 3.2s ease-in-out infinite' }}>
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#F472B6" />
            <path d="M12 6C10 9 8 11 9 14" stroke="#BE185D" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <svg className="absolute top-12 right-20 w-4 h-4" viewBox="0 0 24 24" fill="none" style={{ animation: 'koban-petal-fall 4s ease-in-out infinite 1s' }}>
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#FB7185" />
          </svg>
          <svg className="absolute top-8 left-1/2 w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" style={{ animation: 'koban-petal-fall 3.6s ease-in-out infinite 1.8s' }}>
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#FDA4AF" />
          </svg>
        </div>
      )}

      {itemId === 'effect-shadow-haze' && (
        <div
          className="absolute inset-0 bg-radial from-transparent to-[#3B0764]/70 blur-xs"
          style={{ animation: 'koban-pulse-glow 3s ease-in-out infinite' }}
        />
      )}

      {itemId === 'effect-divine-radiance' && (
        <div
          className="absolute inset-0 border-2 border-[#FBBF24]/70 shadow-[0_0_24px_rgba(251,191,36,0.35)] rounded-2xl"
          style={{ animation: 'koban-pulse-glow 2.8s ease-in-out infinite' }}
        />
      )}

      {itemId === 'effect-thunder-storm' && (
        <div
          className="absolute inset-0 border-2 border-[#FDE047] shadow-[0_0_16px_#FDE047] rounded-2xl"
          style={{ animation: 'koban-lightning-flicker 1.6s steps(2, start) infinite' }}
        />
      )}

      {itemId === 'effect-celestial-star-drift' && (
        <div className="absolute inset-0">
          <span className="absolute top-8 left-12 text-[#FEF08A] text-lg" style={{ animation: 'koban-star-twinkle 2.4s ease-in-out infinite' }}>★</span>
          <span className="absolute bottom-10 right-16 text-[#C7D2FE] text-base" style={{ animation: 'koban-star-twinkle 3s ease-in-out infinite 1s' }}>★</span>
          <span className="absolute top-1/2 right-10 text-[#FEF08A] text-sm" style={{ animation: 'koban-star-twinkle 2s ease-in-out infinite 0.5s' }}>✦</span>
        </div>
      )}

      {itemId === 'effect-spirit-wisps' && (
        <div className="absolute inset-0">
          <span className="absolute bottom-6 left-12 w-5 h-5 rounded-full bg-[#38BDF8]/70 blur-xs" style={{ animation: 'koban-pulse-glow 2.6s ease-in-out infinite' }} />
          <span className="absolute bottom-14 right-14 w-4 h-4 rounded-full bg-[#818CF8]/70 blur-xs" style={{ animation: 'koban-pulse-glow 3.2s ease-in-out infinite 1s' }} />
        </div>
      )}

      {itemId === 'effect-neon-rain' && (
        <div
          className="absolute inset-0 bg-[linear-gradient(135deg,transparent_90%,rgba(0,240,255,0.45)_90%)] [background-size:20px_20px]"
          style={{ animation: 'koban-grid-scroll 3s linear infinite' }}
        />
      )}

      {itemId === 'effect-blazing-inferno' && (
        <div
          className="absolute inset-0 border-2 border-[#EF4444] shadow-[0_0_24px_rgba(239,68,68,0.6)] rounded-2xl"
          style={{ animation: 'koban-flame-flicker 2s ease-in-out infinite' }}
        />
      )}

      {itemId === 'effect-abyssal-ripples' && (
        <div
          className="absolute inset-0 border-2 border-[#00F0FF]/70 shadow-[inset_0_0_24px_rgba(0,240,255,0.35)] rounded-2xl"
          style={{ animation: 'koban-water-ripple 3s ease-in-out infinite' }}
        />
      )}
    </div>
  );
};

/**
 * Dedicated Card Preview Renderer for Store and Gallery
 * Displays a realistic sample mini profile card (avatar, name line, effect particles)
 * strictly clipped inside the tile with overflow: hidden; contain: paint.
 * No overlapping "PROFILE EFFECT" label inside the mock card, and no gray bars sticking out.
 */
export const ProfileEffectCardPreview: React.FC<{
  itemId: string;
  className?: string;
  compact?: boolean;
  userName?: string;
  forceStatic?: boolean;
}> = ({ itemId, className = '', userName = 'Boardly Scholar', forceStatic = false }) => {
  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-[#141418] via-[#0E0E12] to-[#08080B] border border-white/10 p-3 flex flex-col justify-center items-center shadow-inner select-none ${className}`}
      style={{ overflow: 'hidden', contain: 'paint' }}
    >
      {/* Subtle Top Banner Strip Inside Mini Profile Card */}
      <div className="absolute inset-x-0 top-0 h-9 bg-gradient-to-r from-[#2A080C] via-[#1E1B4B] to-[#0F172A] opacity-80 pointer-events-none" />

      {/* Centered Mini Profile Avatar + Name Line */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center max-w-full px-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#DC2626] to-[#F59E0B] p-0.5 shrink-0 shadow-md">
          <div className="w-full h-full rounded-full bg-[#121216] flex items-center justify-center p-2 text-[#F59E0B]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z" />
            </svg>
          </div>
        </div>
        <span className="text-[11px] font-heading font-semibold text-white/90 leading-tight line-clamp-1 max-w-full px-2 py-0.5 rounded-md bg-black/45 border border-white/10">
          {userName}
        </span>
      </div>

      {/* Looping Full-Card Effect Clipped Inside */}
      <ProfileCardEffect itemId={itemId} previewMode={true} forceStatic={forceStatic} />
    </div>
  );
};

