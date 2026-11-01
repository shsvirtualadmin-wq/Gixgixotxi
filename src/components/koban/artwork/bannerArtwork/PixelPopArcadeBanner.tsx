import React, { useCallback, useEffect, useRef, useState } from 'react';
import { storeVideoGovernor } from '../../fx/StoreLoopVideo';

let nextPixelPopArcadeInstanceId = 1;

export interface PixelPopArcadeBannerProps {
  canAnimate?: boolean;
  className?: string;
}

/**
 * Pixel Pop Arcade (id: ban_pixel_pop_arcade) — Epic Animated 3D Banner
 *
 * Rendered procedurally in Blender 4.2.3 LTS at 1280x720 (120 frames, 5.0s seamless loop @ 24fps).
 * - Uses absolute asset paths:
 *   - /assets/store/ban_pixel_pop_arcade/poster.webp
 *   - /assets/store/ban_pixel_pop_arcade/banner.webm
 *   - /assets/store/ban_pixel_pop_arcade/banner.mp4
 * - Falls back cleanly to poster.webp if video fails to load or autoplay is blocked.
 * - Respects prefers-reduced-motion: reduce, low-end Smooth Mode, and the max-8-playing governor.
 */
export const PixelPopArcadeBanner: React.FC<PixelPopArcadeBannerProps> = ({
  canAnimate = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const instanceIdRef = useRef<string>(
    `pixel-pop-arcade-${nextPixelPopArcadeInstanceId++}`
  );

  const [isVisible, setIsVisible] = useState(true);
  const [isGovernorActive, setIsGovernorActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    storeVideoGovernor.isReducedMotion()
  );
  const [posterRetry, setPosterRetry] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoRetry, setVideoRetry] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const basePosterUrl = '/assets/store/ban_pixel_pop_arcade/poster.webp';
  const baseWebmUrl = '/assets/store/ban_pixel_pop_arcade/banner.webm';
  const baseMp4Url = '/assets/store/ban_pixel_pop_arcade/banner.mp4';

  const posterUrl = posterRetry ? `${basePosterUrl}?v=2` : basePosterUrl;
  const webmUrl = videoRetry ? `${baseWebmUrl}?v=2` : baseWebmUrl;
  const mp4Url = videoRetry ? `${baseMp4Url}?v=2` : baseMp4Url;

  const effectiveAnimate = Boolean(canAnimate && !reducedMotion && !videoFailed);

  const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) {
      node.muted = true;
      node.defaultMuted = true;
      node.playsInline = true;
    }
    storeVideoGovernor.setVideoEl(instanceIdRef.current, node);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches || storeVideoGovernor.isReducedMotion());
      const onChange = (e: MediaQueryListEvent) =>
        setReducedMotion(e.matches || storeVideoGovernor.isReducedMotion());
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } catch {
      return;
    }
  }, []);

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

  useEffect(() => {
    if (!effectiveAnimate) {
      setIsGovernorActive(false);
      return;
    }
    const id = instanceIdRef.current;
    return storeVideoGovernor.register({
      id,
      videoEl: videoRef.current,
      getVideoEl: () => videoRef.current,
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 5,
      setActiveState: setIsGovernorActive,
      onPlayError: () => setAutoplayBlocked(true),
    });
  }, [effectiveAnimate, isVisible, videoRetry]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      videoEl: videoRef.current,
      getVideoEl: () => videoRef.current,
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 5,
    });
  }, [isVisible, effectiveAnimate]);

  const handleVideoReady = () => {
    setAutoplayBlocked(false);
    const video = videoRef.current;
    if (effectiveAnimate && isVisible && isGovernorActive && video && video.paused) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.play().catch((err: unknown) => {
        const name = err instanceof Error ? err.name : '';
        if (name === 'AbortError') return;
        setAutoplayBlocked(true);
      });
    }
  };

  const handleVideoError = () => {
    if (!videoRetry) {
      setAutoplayBlocked(false);
      setVideoRetry(true);
    } else {
      setVideoFailed(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`pixel-pop-arcade-banner relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{
        contain: 'paint',
        background:
          'linear-gradient(115deg, #643CE0 0%, #7C4DFF 38%, #FF5FA2 100%)',
      }}
      data-banner-id="ban_pixel_pop_arcade"
      data-testid="pixel-pop-arcade-banner"
    >
      {!posterFailed && (
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          onError={() => {
            if (!posterRetry) {
              setPosterRetry(true);
            } else {
              setPosterFailed(true);
            }
          }}
          className="pixel-pop-arcade-poster absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
      )}

      {effectiveAnimate && (
        <video
          key={videoRetry ? 'retry' : 'initial'}
          ref={handleVideoRef}
          data-testid="pixel-pop-arcade-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={posterFailed ? undefined : posterUrl}
          onLoadedMetadata={handleVideoReady}
          onLoadedData={handleVideoReady}
          onCanPlay={handleVideoReady}
          onPlaying={() => setAutoplayBlocked(false)}
          onError={handleVideoError}
          className={`pixel-pop-arcade-video absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-200 ${
            isVisible && isGovernorActive && !videoFailed && !autoplayBlocked
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          <source src={webmUrl} type="video/webm" />
          <source src={mp4Url} type="video/mp4" onError={handleVideoError} />
        </video>
      )}
    </div>
  );
};
