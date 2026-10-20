import React, { useEffect, useState, Suspense } from 'react';
import { EFFECT_REGISTRY } from './EffectRegistry';

interface CinematicEffectHostProps {
  itemId?: string | null;
  playKey?: string | number; // Change to replay
  className?: string;
  onFinished?: () => void;
}

function checkIsLowEnd(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) return true;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return true;
  return false;
}

function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const CinematicEffectHost: React.FC<CinematicEffectHostProps> = ({
  itemId,
  playKey,
  className = '',
  onFinished,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setIsLowEnd(checkIsLowEnd());
    setReducedMotion(checkReducedMotion());
  }, []);

  useEffect(() => {
    if (!itemId || itemId === 'none' || !EFFECT_REGISTRY[itemId]) {
      setIsPlaying(false);
      return;
    }

    // Start playing once
    setIsPlaying(true);

    const timer = setTimeout(() => {
      setIsPlaying(false);
      onFinished?.();
    }, 5500); // 5.5 seconds total cinematic lifecycle

    return () => clearTimeout(timer);
  }, [itemId, playKey, onFinished]);

  if (!isPlaying || !itemId || !EFFECT_REGISTRY[itemId]) {
    return null;
  }

  const EffectEntry = EFFECT_REGISTRY[itemId];
  const FullSceneComponent = EffectEntry.FullScene;

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-30 overflow-hidden will-change-transform ${className}`}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <FullSceneComponent isLowEnd={isLowEnd} reducedMotion={reducedMotion} />
      </Suspense>
    </div>
  );
};

export const CinematicThumbnail: React.FC<{ itemId?: string | null; className?: string }> = ({
  itemId,
  className = '',
}) => {
  if (!itemId || !EFFECT_REGISTRY[itemId]) {
    return <div className={`w-full h-full bg-neutral-900 ${className}`} />;
  }

  const PreviewComp = EFFECT_REGISTRY[itemId].ThumbnailPreview;

  return (
    <Suspense fallback={<div className="w-full h-full bg-neutral-900 animate-pulse" />}>
      <PreviewComp className={className} />
    </Suspense>
  );
};
