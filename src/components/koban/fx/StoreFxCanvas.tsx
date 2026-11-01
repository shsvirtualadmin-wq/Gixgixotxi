import React, { useEffect, useRef } from 'react';
import {
  storeFxScheduler,
  ParticlePool2D,
  LightningPool2D,
  type EmitterConfig,
  type LightningConfig,
  MAX_PARTICLES_PER_ITEM,
} from './storeFxEngine';

export interface StoreFxCanvasProps {
  emitters?: EmitterConfig[];
  lightning?: LightningConfig;
  maxParticles?: number;
  seed?: number;
  canAnimate?: boolean;
  className?: string;
  /**
   * Optional custom procedural draw callback invoked each frame before or after particles
   */
  onCustomDraw?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number,
    dt: number
  ) => void;
  /**
   * Optional custom draw callback executed after particles/lightning
   */
  onForegroundDraw?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number,
    dt: number
  ) => void;
}

export const StoreFxCanvas: React.FC<StoreFxCanvasProps> = ({
  emitters = [],
  lightning,
  maxParticles = MAX_PARTICLES_PER_ITEM,
  seed = 1337,
  canAnimate = true,
  className = '',
  onCustomDraw,
  onForegroundDraw,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCustomDrawRef = useRef(onCustomDraw);
  const onForegroundDrawRef = useRef(onForegroundDraw);
  onCustomDrawRef.current = onCustomDraw;
  onForegroundDrawRef.current = onForegroundDraw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pool =
      emitters.length > 0
        ? new ParticlePool2D(emitters, Math.min(maxParticles, MAX_PARTICLES_PER_ITEM), seed)
        : null;
    pool?.prewarm(2.4, 0.04);

    const boltPool = lightning ? new LightningPool2D(lightning, seed + 77) : null;
    if (boltPool) {
      boltPool.triggerStrike();
    }

    let logicalW = 300;
    let logicalH = 200;
    let dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        logicalW = rect.width;
        logicalH = rect.height;
      }
      dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
      const targetW = Math.max(1, Math.round(logicalW * dpr));
      const targetH = Math.max(1, Math.round(logicalH * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    syncSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        syncSize();
        if (!canAnimate) {
          drawFrame(0, 2.4);
        }
      });
      ro.observe(canvas);
    }

    const drawFrame = (dt: number, elapsed: number) => {
      if (logicalW <= 0 || logicalH <= 0) syncSize();
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);

      if (onCustomDrawRef.current) {
        onCustomDrawRef.current(ctx, logicalW, logicalH, elapsed, dt);
      }

      if (pool) {
        if (dt > 0) pool.update(dt, elapsed);
        pool.render(ctx, logicalW, logicalH, elapsed);
      }

      if (boltPool) {
        if (dt > 0) boltPool.update(dt);
        boltPool.render(ctx, logicalW, logicalH);
      }

      if (onForegroundDrawRef.current) {
        onForegroundDrawRef.current(ctx, logicalW, logicalH, elapsed, dt);
      }

      ctx.restore();
    };

    const unregister = storeFxScheduler.register({
      element: canvas,
      canAnimate,
      onFrame: (dt, elapsed) => {
        drawFrame(dt, elapsed);
      },
      onStaticFrame: () => {
        if (boltPool) boltPool.triggerStrike();
        drawFrame(0, 2.4);
      },
    });

    return () => {
      unregister();
      ro?.disconnect();
    };
  }, [emitters, lightning, maxParticles, seed, canAnimate]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none block select-none ${className}`}
      style={{ contain: 'paint' }}
    />
  );
};
