import React, { useEffect, useRef, useState } from 'react';
import { storeVideoGovernor } from '../../fx/StoreLoopVideo';
import { useSmoothMode } from '@/utils/smoothMode';

let nextSovereignBlackSunInstanceId = 1;

export interface SovereignBlackSunBannerProps {
  canAnimate?: boolean;
  className?: string;
}

/**
 * Sovereign of the Black Sun (id: sovereign-of-the-black-sun) — Mythic Animated 3D Banner
 *
 * Rendered procedurally in Blender 4.2.3 LTS (/tools/blender/sovereign_black_sun.py)
 * at 1920x1080 and downscaled to 1200x675 (180 frames, 6.0s seamless loop @ 30fps).
 *
 * - Uses <video autoPlay loop muted playsInline preload="metadata" poster="/assets/store/sovereign-of-the-black-sun/poster.webp">
 *   with WebM (VP9) then MP4 (H.264) <source> tags.
 * - IntersectionObserver + document.visibilityState gating: plays only when visible; pauses when offscreen or hidden.
 * - prefers-reduced-motion: reduce: shows only poster.webp and does not play video.
 * - Respects the global max-8-playing governor (storeVideoGovernor) on the Browse grid.
 * - Maintains a fixed 16:9 aspect ratio container for zero layout shift.
 */
export const SovereignBlackSunBanner: React.FC<SovereignBlackSunBannerProps> = ({
  canAnimate = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const instanceIdRef = useRef<string>(
    `sovereign-black-sun-${nextSovereignBlackSunInstanceId++}`
  );

  const [isVisible, setIsVisible] = useState(true);
  const [isGovernorActive, setIsGovernorActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    storeVideoGovernor.isReducedMotion()
  );
  const { smoothMode } = useSmoothMode();

  const posterUrl = '/assets/store/sovereign-of-the-black-sun/poster.webp';
  const webmUrl = '/assets/store/sovereign-of-the-black-sun/banner.webm';
  const mp4Url = '/assets/store/sovereign-of-the-black-sun/banner.mp4';

  const effectiveAnimate = Boolean(canAnimate && !reducedMotion && !smoothMode);

  // 1. Track prefers-reduced-motion: reduce
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } catch {
      return;
    }
  }, []);

  // 2. IntersectionObserver: play only when visible in viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.05, rootMargin: '80px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3. Register with the global Max-8-Playing Governor (priority 6 for flagship Mythic banner)
  useEffect(() => {
    if (!effectiveAnimate) {
      setIsGovernorActive(false);
      return;
    }
    const id = instanceIdRef.current;
    return storeVideoGovernor.register({
      id,
      videoEl: videoRef.current,
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 6,
      setActiveState: setIsGovernorActive,
    });
  }, [effectiveAnimate, isVisible]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 6,
    });
  }, [isVisible, effectiveAnimate]);

  return (
    <div
      ref={containerRef}
      className={`sovereign-black-sun-banner relative w-full h-full overflow-hidden bg-[#030106] select-none pointer-events-none ${className}`}
      style={{ aspectRatio: '16 / 9', contain: 'paint' }}
      data-banner-id="sovereign-of-the-black-sun"
      data-testid="sovereign-black-sun-banner"
    >
      {/* Static 1200x675 Hero Poster (shown immediately & when prefers-reduced-motion is active) */}
      <img
        src={posterUrl}
        alt="Sovereign of the Black Sun"
        loading="lazy"
        decoding="async"
        className="sovereign-black-sun-poster absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Blender 4.2 LTS 180-frame (6.0s @ 30fps) Seamless Video Loop */}
      {effectiveAnimate && (
        <video
          ref={videoRef}
          data-testid="sovereign-black-sun-video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={posterUrl}
          className={`sovereign-black-sun-video absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200 ${
            isVisible && isGovernorActive ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={webmUrl} type="video/webm" />
          <source src={mp4Url} type="video/mp4" />
        </video>
      )}
    </div>
  );
};
