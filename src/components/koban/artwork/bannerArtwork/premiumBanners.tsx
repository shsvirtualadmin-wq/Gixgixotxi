import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StoreFxCanvas } from '../../fx/StoreFxCanvas';
import { StoreLoopVideo } from '../../fx/StoreLoopVideo';
import {
  COLOR_RAMPS,
  ParticleShape,
  storeFxScheduler,
  type EmitterConfig,
  type LightningConfig,
} from '../../fx/storeFxEngine';

interface BannerProps {
  canAnimate?: boolean;
}

interface ParallaxBannerConfig {
  bannerId: string;
  placeholderGradient: string;
  flickerColor: string;
  emitters: EmitterConfig[];
  lightning?: LightningConfig;
  seed: number;
  onCustomDraw?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number
  ) => void;
}

/**
 * Shared 5-Layer WebP Parallax + Procedural Canvas FX Banner Stage
 * - Uses 5 transparent 1200x675 WebP layers (sky, far, mid, subject, fg)
 * - Driven by the single page-wide storeFxScheduler rAF loop
 * - Seamless sinusoidal parallax drift at distinct depth speeds + light flicker + vignette
 * - Strictly clipped with overflow: hidden; contain: paint
 */
const LayeredParallaxBanner: React.FC<ParallaxBannerConfig & BannerProps> = ({
  bannerId,
  placeholderGradient,
  flickerColor,
  emitters,
  lightning,
  seed,
  onCustomDraw,
  canAnimate = true,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLImageElement>(null);
  const farRef = useRef<HTMLImageElement>(null);
  const midRef = useRef<HTMLImageElement>(null);
  const subRef = useRef<HTMLImageElement>(null);
  const fgRef = useRef<HTMLImageElement>(null);
  const flickerRef = useRef<HTMLDivElement>(null);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const applyTransforms = (elapsed: number) => {
      const s1 = Math.sin(elapsed * 0.42);
      const c1 = Math.cos(elapsed * 0.35);
      const s2 = Math.sin(elapsed * 0.68 + 1.1);

      if (skyRef.current) {
        skyRef.current.style.transform = `scale(1.06) translate3d(${(s1 * 2.2).toFixed(2)}px, ${(c1 * 1.2).toFixed(2)}px, 0)`;
      }
      if (farRef.current) {
        farRef.current.style.transform = `scale(1.08) translate3d(${(s1 * 5.0).toFixed(2)}px, ${(c1 * 2.0).toFixed(2)}px, 0)`;
      }
      if (midRef.current) {
        midRef.current.style.transform = `scale(1.10) translate3d(${(s1 * 8.5).toFixed(2)}px, ${(s2 * 2.8).toFixed(2)}px, 0)`;
      }
      if (subRef.current) {
        const breathe = 1.09 + Math.sin(elapsed * 1.25) * 0.014;
        subRef.current.style.transform = `scale(${breathe.toFixed(4)}) translate3d(${(-s1 * 11.5).toFixed(2)}px, ${(Math.cos(elapsed * 0.95) * 4.2).toFixed(2)}px, 0)`;
      }
      if (fgRef.current) {
        fgRef.current.style.transform = `scale(1.12) translate3d(${(-s1 * 16.0).toFixed(2)}px, ${(s2 * 3.5).toFixed(2)}px, 0)`;
      }
      if (flickerRef.current) {
        const flicker = 0.14 + 0.1 * Math.sin(elapsed * 2.7) + 0.05 * Math.cos(elapsed * 6.3);
        flickerRef.current.style.opacity = flicker.toFixed(3);
      }
    };

    const unregister = storeFxScheduler.register({
      element: stage,
      canAnimate,
      onFrame: (_dt, elapsed) => {
        applyTransforms(elapsed);
      },
      onStaticFrame: () => {
        applyTransforms(1.8);
      },
    });

    return unregister;
  }, [canAnimate]);

  const basePath = `/assets/store/banners/${bannerId}`;
  const markLoaded = () => setLoadedCount((c) => c + 1);

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: placeholderGradient,
        contain: 'paint',
      }}
    >
      {/* Soft Glow Loading Shimmer Placeholder while WebP layers stream in */}
      {loadedCount < 2 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 55% 40%, ${flickerColor}, transparent 70%)`,
            opacity: 0.45,
          }}
        />
      )}

      {/* Layer 0: Painted Sky & Celestial Backdrop */}
      <img
        ref={skyRef}
        src={`${basePath}/sky.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={markLoaded}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform"
        style={{ transform: 'scale(1.06)' }}
      />

      {/* Layer 1: Far Mountains / Horizon */}
      <img
        ref={farRef}
        src={`${basePath}/far.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={markLoaded}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform"
        style={{ transform: 'scale(1.08)' }}
      />

      {/* Layer 2: Mid-Ground Scene */}
      <img
        ref={midRef}
        src={`${basePath}/mid.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={markLoaded}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform"
        style={{ transform: 'scale(1.10)' }}
      />

      {/* Layer 3: Main Painted Hero Subject */}
      <img
        ref={subRef}
        src={`${basePath}/subject.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={markLoaded}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform"
        style={{ transform: 'scale(1.09)' }}
      />

      {/* Live Procedural FX Engine Canvas Overlay (Embers / Rain / Ash / Starlight / Lightning) */}
      <StoreFxCanvas
        emitters={emitters}
        lightning={lightning}
        maxParticles={95}
        seed={seed}
        canAnimate={canAnimate}
        onCustomDraw={onCustomDraw}
        className="absolute inset-0 w-full h-full z-[4]"
      />

      {/* Layer 4: Foreground Silhouette Frame */}
      <img
        ref={fgRef}
        src={`${basePath}/fg.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={markLoaded}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform z-[5]"
        style={{ transform: 'scale(1.12)' }}
      />

      {/* Subtle Atmospheric Light Flicker & Cinematic Vignette */}
      <div
        ref={flickerRef}
        className="absolute inset-0 pointer-events-none z-[6]"
        style={{
          background: `radial-gradient(circle at 56% 36%, ${flickerColor}, transparent 68%)`,
          mixBlendMode: 'screen',
          opacity: 0.16,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[7]"
        style={{
          boxShadow: 'inset 0 0 36px rgba(0, 0, 0, 0.72)',
        }}
      />
    </div>
  );
};

/**
 * 1. Crimson Dragon's Descent (ban_crimson_dragons_descent)
 */
export const CrimsonDragonsDescentBanner: React.FC<BannerProps> = ({ canAnimate = true }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 28,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.08,
        xMax: 0.92,
        yMin: 0.75,
        yMax: 1.02,
        vxMin: -0.08,
        vxMax: 0.12,
        vyMin: -0.42,
        vyMax: -0.18,
        gravityY: -0.08,
        drag: 0.2,
        turbulence: 0.35,
        turbulenceFreq: 2.5,
        lifeMin: 1.6,
        lifeMax: 3.1,
        sizeStartMin: 2.2,
        sizeStartMax: 4.2,
        sizeEndMin: 0.6,
        sizeEndMax: 1.4,
        alphaPeak: 0.95,
      },
      {
        rate: 16,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.38,
        xMax: 0.68,
        yMin: 0.48,
        yMax: 0.88,
        vxMin: -0.06,
        vxMax: 0.06,
        vyMin: -0.22,
        vyMax: -0.08,
        turbulence: 0.24,
        lifeMin: 1.8,
        lifeMax: 3.4,
        sizeStartMin: 4.5,
        sizeStartMax: 9.0,
        sizeEndMin: 1.5,
        sizeEndMax: 3.5,
        alphaPeak: 0.65,
      },
    ],
    []
  );

  return (
    <LayeredParallaxBanner
      bannerId="ban_crimson_dragons_descent"
      placeholderGradient="linear-gradient(180deg, #070103 0%, #26050B 50%, #7F1D1D 100%)"
      flickerColor="rgba(245, 158, 11, 0.55)"
      emitters={emitters}
      seed={101}
      canAnimate={canAnimate}
    />
  );
};

/**
 * 2. Neon Kyoto Rain (ban_neon_kyoto_rain)
 */
export const NeonKyotoRainBanner: React.FC<BannerProps> = ({ canAnimate = true }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 42,
        shape: ParticleShape.Streak,
        additive: true,
        ramp: COLOR_RAMPS.neonKyoto,
        xMin: -0.05,
        xMax: 1.1,
        yMin: -0.08,
        yMax: 0.15,
        vxMin: -0.24,
        vxMax: -0.18,
        vyMin: 0.82,
        vyMax: 1.25,
        drag: 0.02,
        lifeMin: 0.65,
        lifeMax: 1.15,
        sizeStartMin: 1.4,
        sizeStartMax: 2.5,
        sizeEndMin: 1.0,
        sizeEndMax: 1.8,
        alphaPeak: 0.78,
      },
      {
        rate: 12,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.neonKyoto,
        xMin: 0.15,
        xMax: 0.85,
        yMin: 0.65,
        yMax: 0.95,
        vxMin: -0.03,
        vxMax: 0.03,
        vyMin: -0.08,
        vyMax: -0.02,
        turbulence: 0.12,
        lifeMin: 1.8,
        lifeMax: 3.2,
        sizeStartMin: 3.0,
        sizeStartMax: 6.5,
        sizeEndMin: 1.0,
        sizeEndMax: 2.5,
        alphaPeak: 0.6,
      },
    ],
    []
  );

  const drawRainRipples = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number
  ) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const cycle = (elapsed * 0.85 + i * 0.37) % 1;
      const rx = width * (0.28 + i * 0.11 + Math.sin(i * 3.1) * 0.04);
      const ry = height * (0.78 + (i % 2) * 0.08);
      const radX = cycle * width * 0.075;
      const radY = radX * 0.26;
      const alpha = (1 - cycle) * 0.42;
      ctx.strokeStyle = i % 2 === 0 ? `rgba(0, 240, 255, ${alpha})` : `rgba(255, 0, 122, ${alpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(rx, ry, Math.max(1, radX), Math.max(0.5, radY), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  return (
    <LayeredParallaxBanner
      bannerId="ban_neon_kyoto_rain"
      placeholderGradient="linear-gradient(180deg, #030613 0%, #0B1536 55%, #311042 100%)"
      flickerColor="rgba(0, 240, 255, 0.45)"
      emitters={emitters}
      seed={202}
      canAnimate={canAnimate}
      onCustomDraw={drawRainRipples}
    />
  );
};

/**
 * 3. Blood Moon Ronin (ban_blood_moon_ronin)
 */
export const BloodMoonRoninBanner: React.FC<BannerProps> = ({ canAnimate = true }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 22,
        shape: ParticleShape.Petal,
        additive: true,
        ramp: COLOR_RAMPS.bloodMoonAsh,
        xMin: -0.08,
        xMax: 0.85,
        yMin: 0.12,
        yMax: 0.95,
        vxMin: 0.12,
        vxMax: 0.28,
        vyMin: -0.14,
        vyMax: 0.08,
        turbulence: 0.32,
        turbulenceFreq: 2.2,
        lifeMin: 2.0,
        lifeMax: 3.8,
        sizeStartMin: 2.5,
        sizeStartMax: 5.2,
        sizeEndMin: 1.0,
        sizeEndMax: 2.4,
        rotSpeedMin: -2.8,
        rotSpeedMax: 2.8,
        alphaPeak: 0.9,
      },
      {
        rate: 16,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.2,
        xMax: 0.9,
        yMin: 0.55,
        yMax: 1.0,
        vxMin: 0.08,
        vxMax: 0.22,
        vyMin: -0.28,
        vyMax: -0.08,
        turbulence: 0.25,
        lifeMin: 1.5,
        lifeMax: 2.9,
        sizeStartMin: 1.8,
        sizeStartMax: 3.4,
        sizeEndMin: 0.5,
        sizeEndMax: 1.2,
        alphaPeak: 0.88,
      },
    ],
    []
  );

  return (
    <LayeredParallaxBanner
      bannerId="ban_blood_moon_ronin"
      placeholderGradient="linear-gradient(180deg, #060103 0%, #26040A 55%, #7F1D1D 100%)"
      flickerColor="rgba(239, 68, 68, 0.5)"
      emitters={emitters}
      seed={303}
      canAnimate={canAnimate}
    />
  );
};

/**
 * 4. Celestial Koi River (ban_celestial_koi_river)
 */
export const CelestialKoiRiverBanner: React.FC<BannerProps> = ({ canAnimate = true }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 18,
        shape: ParticleShape.Wisp,
        additive: true,
        ramp: COLOR_RAMPS.spiritFox,
        xMin: 0.05,
        xMax: 0.95,
        yMin: 0.2,
        yMax: 0.85,
        vxMin: 0.06,
        vxMax: 0.16,
        vyMin: -0.1,
        vyMax: -0.02,
        turbulence: 0.28,
        turbulenceFreq: 2.0,
        lifeMin: 2.2,
        lifeMax: 4.0,
        sizeStartMin: 2.2,
        sizeStartMax: 4.5,
        sizeEndMin: 0.8,
        sizeEndMax: 1.8,
        alphaPeak: 0.85,
      },
      {
        rate: 16,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.fallingStars,
        xMin: 0.15,
        xMax: 0.85,
        yMin: 0.25,
        yMax: 0.78,
        vxMin: -0.04,
        vxMax: 0.08,
        vyMin: -0.08,
        vyMax: 0.04,
        turbulence: 0.18,
        lifeMin: 1.8,
        lifeMax: 3.5,
        sizeStartMin: 2.5,
        sizeStartMax: 5.5,
        sizeEndMin: 0.8,
        sizeEndMax: 2.0,
        alphaPeak: 0.8,
      },
    ],
    []
  );

  return (
    <LayeredParallaxBanner
      bannerId="ban_celestial_koi_river"
      placeholderGradient="linear-gradient(180deg, #030712 0%, #0C1938 55%, #1E1B4B 100%)"
      flickerColor="rgba(56, 189, 248, 0.45)"
      emitters={emitters}
      seed={404}
      canAnimate={canAnimate}
    />
  );
};

/**
 * 5. Obsidian Shogun Citadel (ban_obsidian_shogun_citadel)
 */
export const ObsidianShogunCitadelBanner: React.FC<BannerProps> = ({ canAnimate = true }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 26,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.1,
        xMax: 0.9,
        yMin: 0.72,
        yMax: 1.0,
        vxMin: -0.06,
        vxMax: 0.08,
        vyMin: -0.36,
        vyMax: -0.14,
        gravityY: -0.06,
        turbulence: 0.28,
        lifeMin: 1.6,
        lifeMax: 3.2,
        sizeStartMin: 2.0,
        sizeStartMax: 3.8,
        sizeEndMin: 0.6,
        sizeEndMax: 1.4,
        alphaPeak: 0.92,
      },
    ],
    []
  );

  const lightning = useMemo<LightningConfig>(
    () => ({
      intervalMin: 1.4,
      intervalMax: 2.8,
      decayRate: 4.5,
      glowColor: '#EF4444',
      coreColor: '#FEF08A',
      flashAlpha: 0.08,
    }),
    []
  );

  return (
    <LayeredParallaxBanner
      bannerId="ban_obsidian_shogun_citadel"
      placeholderGradient="linear-gradient(180deg, #070204 0%, #1E050A 55%, #881327 100%)"
      flickerColor="rgba(239, 68, 68, 0.5)"
      emitters={emitters}
      lightning={lightning}
      seed={505}
      canAnimate={canAnimate}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5 NEW 3D-RENDERED LOOP BANNERS (Wave 2: Items 126–130)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 6. Phoenix Ember Sunrise (ban_phoenix_ember_sunrise) — Mythic Animated
 * A giant phoenix rising over a burning horizon, embers drifting.
 */
export const PhoenixEmberSunriseBanner: React.FC<BannerProps> = ({ canAnimate = true }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 32,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.05,
        xMax: 0.95,
        yMin: 0.65,
        yMax: 1.02,
        vxMin: -0.1,
        vxMax: 0.14,
        vyMin: -0.46,
        vyMax: -0.18,
        gravityY: -0.08,
        turbulence: 0.35,
        lifeMin: 1.5,
        lifeMax: 3.0,
        sizeStartMin: 2.2,
        sizeStartMax: 4.4,
        sizeEndMin: 0.6,
        sizeEndMax: 1.4,
        alphaPeak: 0.95,
      },
      {
        rate: 16,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.fallingStars,
        xMin: 0.25,
        xMax: 0.75,
        yMin: 0.35,
        yMax: 0.85,
        vxMin: -0.06,
        vxMax: 0.06,
        vyMin: -0.24,
        vyMax: -0.08,
        turbulence: 0.22,
        lifeMin: 1.6,
        lifeMax: 3.2,
        sizeStartMin: 4.0,
        sizeStartMax: 8.5,
        sizeEndMin: 1.2,
        sizeEndMax: 3.2,
        alphaPeak: 0.7,
      },
    ],
    []
  );

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #090204 0%, #450A0A 50%, #B45309 85%, #FEF08A 100%)',
        contain: 'paint',
      }}
    >
      <StoreLoopVideo
        itemId="ban_phoenix_ember_sunrise"
        animated={true}
        canAnimate={canAnimate}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={90}
        seed={601}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-[3]"
      />
    </div>
  );
};

/**
 * 7. Cyber Shibuya Night (ban_cyber_shibuya_night) — Legendary Animated
 * A neon crossing, holographic kanji ads, rain and passing light trails.
 */
export const CyberShibuyaNightBanner: React.FC<BannerProps> = ({ canAnimate = true }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 44,
        shape: ParticleShape.Streak,
        additive: true,
        ramp: COLOR_RAMPS.neonKyoto,
        xMin: -0.05,
        xMax: 1.08,
        yMin: -0.08,
        yMax: 0.15,
        vxMin: -0.22,
        vxMax: -0.15,
        vyMin: 0.85,
        vyMax: 1.28,
        lifeMin: 0.6,
        lifeMax: 1.1,
        sizeStartMin: 1.4,
        sizeStartMax: 2.5,
        sizeEndMin: 1.0,
        sizeEndMax: 1.8,
        alphaPeak: 0.82,
      },
    ],
    []
  );

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #02040D 0%, #0B132B 55%, #1E1035 100%)',
        contain: 'paint',
      }}
    >
      <StoreLoopVideo
        itemId="ban_cyber_shibuya_night"
        animated={true}
        canAnimate={canAnimate}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={85}
        seed={602}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-[3]"
      />
    </div>
  );
};

/**
 * 8. Eclipse Tengu Peak (ban_eclipse_tengu_peak) — Legendary Animated
 * A tengu silhouette on a mountain under a solar eclipse, wind-blown clouds.
 */
export const EclipseTenguPeakBanner: React.FC<BannerProps> = ({ canAnimate = true }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 24,
        shape: ParticleShape.Petal,
        additive: true,
        ramp: COLOR_RAMPS.bloodMoonAsh,
        xMin: -0.06,
        xMax: 0.9,
        yMin: 0.15,
        yMax: 0.92,
        vxMin: 0.16,
        vxMax: 0.34,
        vyMin: -0.12,
        vyMax: 0.08,
        turbulence: 0.32,
        lifeMin: 1.8,
        lifeMax: 3.4,
        sizeStartMin: 2.4,
        sizeStartMax: 4.8,
        sizeEndMin: 1.0,
        sizeEndMax: 2.2,
        alphaPeak: 0.88,
      },
    ],
    []
  );

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #040206 0%, #1C0B19 50%, #431407 100%)',
        contain: 'paint',
      }}
    >
      <StoreLoopVideo
        itemId="ban_eclipse_tengu_peak"
        animated={true}
        canAnimate={canAnimate}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={75}
        seed={603}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-[3]"
      />
    </div>
  );
};

