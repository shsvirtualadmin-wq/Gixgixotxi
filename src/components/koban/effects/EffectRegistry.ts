import React, { lazy } from 'react';
import type { EffectComponentModule } from './types';

// Code-split dynamic import loaders for each batch
const loadBatch1 = () => import('./batch1');
const loadBatch2 = () => import('./batch2');
const loadBatch3 = () => import('./batch3');
const loadBatch4 = () => import('./batch4');
const loadBatch5 = () => import('./batch5');

export interface EffectEntry {
  FullScene: React.LazyExoticComponent<React.FC<{ isLowEnd?: boolean; reducedMotion?: boolean; className?: string }>>;
  ThumbnailPreview: React.LazyExoticComponent<React.FC<{ className?: string }>>;
}

export const EFFECT_REGISTRY: Record<string, EffectEntry> = {
  // Batch 1
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

  // Batch 4
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
};
