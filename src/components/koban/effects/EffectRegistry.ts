import React, { lazy } from 'react';
import type { EffectComponentModule } from './types';

// Code-split dynamic import loaders for each batch
const loadBatch1 = () => import('./batch1');
const loadBatch2 = () => import('./batch2');
const loadBatch3 = () => import('./batch3');
const loadBatch4 = () => import('./batch4');
const loadBatch5 = () => import('./batch5');
const loadBatch6 = () => import('./batch6');
const loadBatch7 = () => import('./batch7');
const loadBatch8 = () => import('./batch8');

export interface EffectEntry {
  FullScene: React.LazyExoticComponent<React.FC<{ isLowEnd?: boolean; reducedMotion?: boolean; className?: string }>>;
  ThumbnailPreview: React.LazyExoticComponent<React.FC<{ className?: string }>>;
}

export const EFFECT_REGISTRY: Record<string, EffectEntry> = {
  // Batch 1
  'effect-whispering-mist': {
    FullScene: lazy(() => loadBatch1().then((m) => ({ default: m.EffectWhisperingMist.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch1().then((m) => ({ default: m.EffectWhisperingMist.ThumbnailPreview }))),
  },
  'effect-golden-leaf-frost': {
    FullScene: lazy(() => loadBatch1().then((m) => ({ default: m.EffectGoldenLeafFrost.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch1().then((m) => ({ default: m.EffectGoldenLeafFrost.ThumbnailPreview }))),
  },
  'effect-crimson-vignette': {
    FullScene: lazy(() => loadBatch1().then((m) => ({ default: m.EffectCrimsonVignette.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch1().then((m) => ({ default: m.EffectCrimsonVignette.ThumbnailPreview }))),
  },

  // Batch 2
  'effect-ink-brush-splash': {
    FullScene: lazy(() => loadBatch2().then((m) => ({ default: m.EffectInkBrushSplash.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch2().then((m) => ({ default: m.EffectInkBrushSplash.ThumbnailPreview }))),
  },
  'effect-star-chart': {
    FullScene: lazy(() => loadBatch2().then((m) => ({ default: m.EffectStarChart.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch2().then((m) => ({ default: m.EffectStarChart.ThumbnailPreview }))),
  },
  'effect-frosted-crystal': {
    FullScene: lazy(() => loadBatch2().then((m) => ({ default: m.EffectFrostedCrystal.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch2().then((m) => ({ default: m.EffectFrostedCrystal.ThumbnailPreview }))),
  },

  // Batch 3
  'effect-paper-lantern-glow': {
    FullScene: lazy(() => loadBatch3().then((m) => ({ default: m.EffectPaperLanternGlow.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch3().then((m) => ({ default: m.EffectPaperLanternGlow.ThumbnailPreview }))),
  },
  'effect-sacred-geometry': {
    FullScene: lazy(() => loadBatch3().then((m) => ({ default: m.EffectSacredGeometry.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch3().then((m) => ({ default: m.EffectSacredGeometry.ThumbnailPreview }))),
  },
  'effect-bamboo-screen': {
    FullScene: lazy(() => loadBatch3().then((m) => ({ default: m.EffectBambooScreen.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch3().then((m) => ({ default: m.EffectBambooScreen.ThumbnailPreview }))),
  },

  // Batch 4
  'effect-cherry-carpet': {
    FullScene: lazy(() => loadBatch4().then((m) => ({ default: m.EffectCherryCarpet.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch4().then((m) => ({ default: m.EffectCherryCarpet.ThumbnailPreview }))),
  },
  'effect-dawn-horizon': {
    FullScene: lazy(() => loadBatch4().then((m) => ({ default: m.EffectDawnHorizon.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch4().then((m) => ({ default: m.EffectDawnHorizon.ThumbnailPreview }))),
  },
  'effect-dusk-smoke': {
    FullScene: lazy(() => loadBatch4().then((m) => ({ default: m.EffectDuskSmoke.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch4().then((m) => ({ default: m.EffectDuskSmoke.ThumbnailPreview }))),
  },

  // Batch 5
  'effect-ancient-runes': {
    FullScene: lazy(() => loadBatch5().then((m) => ({ default: m.EffectAncientRunes.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch5().then((m) => ({ default: m.EffectAncientRunes.ThumbnailPreview }))),
  },
  'effect-faint-sparkles': {
    FullScene: lazy(() => loadBatch5().then((m) => ({ default: m.EffectFaintSparkles.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch5().then((m) => ({ default: m.EffectFaintSparkles.ThumbnailPreview }))),
  },
  'effect-ember-drift': {
    FullScene: lazy(() => loadBatch5().then((m) => ({ default: m.EffectEmberDrift.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch5().then((m) => ({ default: m.EffectEmberDrift.ThumbnailPreview }))),
  },

  // Batch 6
  'effect-electric-aura': {
    FullScene: lazy(() => loadBatch6().then((m) => ({ default: m.EffectElectricAura.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch6().then((m) => ({ default: m.EffectElectricAura.ThumbnailPreview }))),
  },
  'effect-cherry-storm': {
    FullScene: lazy(() => loadBatch6().then((m) => ({ default: m.EffectCherryStorm.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch6().then((m) => ({ default: m.EffectCherryStorm.ThumbnailPreview }))),
  },
  'effect-shadow-haze': {
    FullScene: lazy(() => loadBatch6().then((m) => ({ default: m.EffectShadowHaze.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch6().then((m) => ({ default: m.EffectShadowHaze.ThumbnailPreview }))),
  },

  // Batch 7
  'effect-divine-radiance': {
    FullScene: lazy(() => loadBatch7().then((m) => ({ default: m.EffectDivineRadiance.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch7().then((m) => ({ default: m.EffectDivineRadiance.ThumbnailPreview }))),
  },
  'effect-thunder-storm': {
    FullScene: lazy(() => loadBatch7().then((m) => ({ default: m.EffectThunderStorm.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch7().then((m) => ({ default: m.EffectThunderStorm.ThumbnailPreview }))),
  },
  'effect-celestial-star-drift': {
    FullScene: lazy(() => loadBatch7().then((m) => ({ default: m.EffectCelestialStarDrift.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch7().then((m) => ({ default: m.EffectCelestialStarDrift.ThumbnailPreview }))),
  },

  // Batch 8
  'effect-spirit-wisps': {
    FullScene: lazy(() => loadBatch8().then((m) => ({ default: m.EffectSpiritWisps.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch8().then((m) => ({ default: m.EffectSpiritWisps.ThumbnailPreview }))),
  },
  'effect-neon-rain': {
    FullScene: lazy(() => loadBatch8().then((m) => ({ default: m.EffectNeonRain.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch8().then((m) => ({ default: m.EffectNeonRain.ThumbnailPreview }))),
  },
  'effect-blazing-inferno': {
    FullScene: lazy(() => loadBatch8().then((m) => ({ default: m.EffectBlazingInferno.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch8().then((m) => ({ default: m.EffectBlazingInferno.ThumbnailPreview }))),
  },
  'effect-abyssal-ripples': {
    FullScene: lazy(() => loadBatch8().then((m) => ({ default: m.EffectAbyssalRipples.FullScene }))),
    ThumbnailPreview: lazy(() => loadBatch8().then((m) => ({ default: m.EffectAbyssalRipples.ThumbnailPreview }))),
  },
};
