import React, { useEffect, useRef, useState } from 'react';

/**
 * Global Concurrent Video Loop Governor for the Boardly Store
 * Ensures at most 8 <video> loops play simultaneously on the Browse grid.
 */
const MAX_CONCURRENT_VIDEOS = 8;

interface VideoSubscriber {
  id: string;
  videoEl?: HTMLVideoElement | null;
  isVisible: boolean;
  canAnimate: boolean;
  priority: number;
  setActiveState: (playing: boolean) => void;
  onPlayError?: () => void;
}

class StoreVideoPlaybackGovernor {
  private subscribers = new Map<string, VideoSubscriber>();
  private activeIds = new Set<string>();
  private prefersReducedMotion = false;
  private isTabVisible = true;
  private initialized = false;

  private initListeners() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mql.matches;
      mql.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
        this.rebalance();
      });
    } catch {
      // ignore
    }

    if (typeof document !== 'undefined') {
      this.isTabVisible = document.visibilityState === 'visible';
      document.addEventListener('visibilitychange', () => {
        this.isTabVisible = document.visibilityState === 'visible';
        this.rebalance();
      });
    }
  }

  isReducedMotion(): boolean {
    this.initListeners();
    return this.prefersReducedMotion;
  }

  register(sub: VideoSubscriber) {
    this.initListeners();
    this.subscribers.set(sub.id, sub);
    this.rebalance();
    return () => {
      this.subscribers.delete(sub.id);
      this.activeIds.delete(sub.id);
      this.rebalance();
    };
  }

  update(id: string, patch: Partial<Pick<VideoSubscriber, 'isVisible' | 'canAnimate' | 'priority'>>) {
    const sub = this.subscribers.get(id);
    if (!sub) return;
    Object.assign(sub, patch);
    this.rebalance();
  }

  private rebalance() {
    if (this.prefersReducedMotion || !this.isTabVisible) {
      for (const [, sub] of this.subscribers) {
        if (sub.videoEl && !sub.videoEl.paused) {
          sub.videoEl.pause();
        }
        sub.setActiveState(false);
      }
      this.activeIds.clear();
      return;
    }

    const eligible: VideoSubscriber[] = [];
    for (const [, sub] of this.subscribers) {
      if (sub.isVisible && sub.canAnimate) {
        eligible.push(sub);
      } else {
        if (sub.videoEl && !sub.videoEl.paused) {
          sub.videoEl.pause();
        }
        this.activeIds.delete(sub.id);
        sub.setActiveState(false);
      }
    }

    eligible.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const aActive = this.activeIds.has(a.id) ? 1 : 0;
      const bActive = this.activeIds.has(b.id) ? 1 : 0;
      return bActive - aActive;
    });

    const nextActive = new Set<string>();
    for (let i = 0; i < eligible.length; i++) {
      const sub = eligible[i];
      if (i < MAX_CONCURRENT_VIDEOS) {
        nextActive.add(sub.id);
        sub.setActiveState(true);
        if (sub.videoEl && sub.videoEl.paused) {
          sub.videoEl.play().catch(() => {
            sub.onPlayError?.();
          });
        }
      } else {
        if (sub.videoEl && !sub.videoEl.paused) {
          sub.videoEl.pause();
        }
        sub.setActiveState(false);
      }
    }

    this.activeIds = nextActive;
  }

  getActiveCount(): number {
    return this.activeIds.size;
  }
}

export const storeVideoGovernor = new StoreVideoPlaybackGovernor();

let nextInstanceUid = 1;

export interface StoreLoopVideoProps {
  itemId: string;
  animated?: boolean;
  canAnimate?: boolean;
  priority?: number;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders pre-rendered 3D seamless loops (/assets/store/<item-id>/loop.webm & loop.webp)
 * with poster.webp fallback, IntersectionObserver lazy playback, prefers-reduced-motion
 * compliance, and a strict 8-concurrent-video cap on the Store Browse grid.
 */
export const StoreLoopVideo: React.FC<StoreLoopVideoProps> = ({
  itemId,
  animated = true,
  canAnimate = true,
  priority = 1,
  aspectRatio,
  objectFit = 'cover',
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const instanceIdRef = useRef<string>(`store-loop-${itemId}-${nextInstanceUid++}`);
  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => storeVideoGovernor.isReducedMotion());

  const posterUrl = `/assets/store/${itemId}/poster.webp`;
  const webmUrl = `/assets/store/${itemId}/loop.webm`;
  const webpUrl = `/assets/store/${itemId}/loop.webp`;

  const effectiveAnimate = Boolean(animated && canAnimate && !reducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
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
    const videoEl = videoRef.current;
    if (!videoEl || !effectiveAnimate || videoFailed) return;

    // Check if browser supports VP9 WebM decoding; if not, switch immediately to animated WebP loop
    if (typeof videoEl.canPlayType === 'function') {
      const support = videoEl.canPlayType('video/webm; codecs="vp9"');
      if (!support) {
        setVideoFailed(true);
        return;
      }
    }

    const id = instanceIdRef.current;
    return storeVideoGovernor.register({
      id,
      videoEl,
      isVisible,
      canAnimate: effectiveAnimate,
      priority,
      setActiveState: setIsPlaying,
      onPlayError: () => setVideoFailed(true),
    });
  }, [effectiveAnimate, isVisible, priority, videoFailed]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      isVisible,
      canAnimate: effectiveAnimate,
      priority,
    });
  }, [isVisible, effectiveAnimate, priority]);

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        contain: 'paint',
        ...style,
      }}
      data-store-loop-item={itemId}
    >
      {/* Static poster when reduced-motion is active, animation is disabled, or off-screen */}
      {(!effectiveAnimate || !isVisible) && (
        <img
          src={posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full ${fitClass} pointer-events-none`}
        />
      )}

      {/* Animated 3D Seamless Loop Video (VP9 WebM with alpha + Animated WebP fallback) */}
      {effectiveAnimate && isVisible && !videoFailed && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={posterUrl}
          onError={() => setVideoFailed(true)}
          className={`absolute inset-0 w-full h-full ${fitClass} pointer-events-none ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={webmUrl} type="video/webm" onError={() => setVideoFailed(true)} />
          <img src={webpUrl} alt="" className={`w-full h-full ${fitClass}`} />
        </video>
      )}

      {/* When governor pauses this <video> (beyond 8 concurrent videos) or WebM is unsupported, show animated WebP / poster */}
      {effectiveAnimate && isVisible && (videoFailed || !isPlaying) && (
        <img
          src={videoFailed ? webpUrl : posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full ${fitClass} pointer-events-none`}
        />
      )}
    </div>
  );
};
