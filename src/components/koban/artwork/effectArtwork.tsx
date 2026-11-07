import React, { useEffect, useRef, useState } from 'react';
import { storeVideoGovernor } from '../fx/StoreLoopVideo';

interface EffectProps {
  itemId: string;
  size?: number;
  canAnimate?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * 3D Blender Transparent Profile Effect Renderer for "Black Sun Ember Storm" (id: black-sun-ember-storm)
 * - Uses /assets/store/black-sun-ember-storm/effect.webp, effect.webm (VP9 alpha yuva420p), and poster.png
 * - Pauses when off-screen (IntersectionObserver) or when tab is hidden (document.visibilityState)
 * - Shows poster.png only under prefers-reduced-motion: reduce or forceStatic
 * - pointer-events: none so clicks pass through to all buttons, links, and tabs underneath
 */
let nextBlackSunEffectInstanceUid = 1;

const BlackSunEmberStormOverlay: React.FC<{
  canAnimate?: boolean;
  mode?: 'card' | 'avatar';
}> = ({ canAnimate = true, mode = 'card' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const instanceIdRef = useRef<string>(
    `black-sun-ember-storm-${mode}-${nextBlackSunEffectInstanceUid++}`
  );
  const [isVisible, setIsVisible] = useState(true);
  const [isGovernorActive, setIsGovernorActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [webpFailed, setWebpFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => storeVideoGovernor.isReducedMotion());
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  const posterUrl = '/assets/store/black-sun-ember-storm/poster.png';
  const webpUrl = '/assets/store/black-sun-ember-storm/effect.webp';
  const webmUrl = '/assets/store/black-sun-ember-storm/effect.webm';

  const effectiveAnimate = Boolean(canAnimate && !reducedMotion && tabVisible);

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
    if (typeof document === 'undefined') return;
    const onVisChange = () => {
      setTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
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
      priority: mode === 'card' ? 8 : 4,
      setActiveState: setIsGovernorActive,
      onPlayError: () => setVideoFailed(true),
    });
  }, [effectiveAnimate, isVisible, mode, videoFailed]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      isVisible,
      canAnimate: effectiveAnimate,
      priority: mode === 'card' ? 8 : 4,
    });
  }, [isVisible, effectiveAnimate, mode]);

  const showStaticPosterOnly = !effectiveAnimate || !isVisible;
  const activeImgSrc = showStaticPosterOnly || webpFailed ? posterUrl : webpUrl;

  return (
    <div
      ref={containerRef}
      data-effect-id="black-sun-ember-storm"
      data-effect-mode={mode}
      className="relative w-full h-full overflow-hidden pointer-events-none select-none"
      style={{ pointerEvents: 'none', contain: 'paint' }}
      aria-hidden="true"
    >
      {/* Static poster (reduced-motion / off-screen / forceStatic) or Animated WebP with alpha */}
      <img
        src={activeImgSrc}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        onError={() => {
          if (!webpFailed && activeImgSrc === webpUrl) {
            setWebpFailed(true);
          }
        }}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-200 ${
          !showStaticPosterOnly && !videoFailed && isGovernorActive && videoReady
            ? 'opacity-0'
            : 'opacity-100'
        }`}
      />

      {/* VP9 Alpha WebM Seamless Loop (yuva420p, 30 fps) */}
      {!showStaticPosterOnly && !videoFailed && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={posterUrl}
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-200 ${
            isGovernorActive && videoReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={webmUrl} type="video/webm" onError={() => setVideoFailed(true)} />
        </video>
      )}
    </div>
  );
};

let nextPixelPopEffectInstanceUid = 1;

/**
 * 3D Blender Transparent Profile Effect Renderer for "Pixel Pop Sparkle Shower" (id: effect-pixel-pop-arcade)
 * - Uses absolute paths:
 *   - /assets/store/effect-pixel-pop-arcade/effect.webp (800x450, 150 frames @ 15 fps = 10.000s loop, alpha)
 *   - /assets/store/effect-pixel-pop-arcade/poster.png (800x450 frame 0 with alpha)
 * - Center 60% of the overlay is transparent so name, stats, and buttons stay 100% clear
 * - Respects prefers-reduced-motion: reduce, document visibility, IntersectionObserver, and storeVideoGovernor (max 8 playing)
 * - Falls back cleanly to poster.png if effect.webp fails to load
 * - pointer-events: none so it never blocks clicks
 */
const PixelPopSparkleShowerOverlay: React.FC<{
  canAnimate?: boolean;
  mode?: 'card' | 'avatar';
  forcePosterOnly?: boolean;
}> = ({ canAnimate = true, mode = 'card', forcePosterOnly = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceIdRef = useRef<string>(
    `effect-pixel-pop-arcade-${mode}-${nextPixelPopEffectInstanceUid++}`
  );
  const [isVisible, setIsVisible] = useState(true);
  const [isGovernorActive, setIsGovernorActive] = useState(false);
  const [webpFailed, setWebpFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => storeVideoGovernor.isReducedMotion());
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  const posterUrl = '/assets/store/effect-pixel-pop-arcade/poster.png';
  const webpUrl = '/assets/store/effect-pixel-pop-arcade/effect.webp';

  const effectiveAnimate = Boolean(
    canAnimate && !forcePosterOnly && !reducedMotion && tabVisible && !webpFailed
  );
  const priority = mode === 'card' ? 8 : 4;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches || storeVideoGovernor.isReducedMotion());
      const handler = (e: MediaQueryListEvent) =>
        setReducedMotion(e.matches || storeVideoGovernor.isReducedMotion());
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisChange = () => {
      setTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
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
      isVisible,
      canAnimate: effectiveAnimate,
      priority,
      setActiveState: setIsGovernorActive,
    });
  }, [effectiveAnimate, isVisible, priority]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      isVisible,
      canAnimate: effectiveAnimate,
      priority,
    });
  }, [isVisible, effectiveAnimate, priority]);

  const showAnimatedWebp = Boolean(effectiveAnimate && isVisible && isGovernorActive && !webpFailed);

  return (
    <div
      ref={containerRef}
      data-effect-id="effect-pixel-pop-arcade"
      data-effect-mode={mode}
      className="relative w-full h-full overflow-hidden pointer-events-none select-none"
      style={{ pointerEvents: 'none', contain: 'paint' }}
      aria-hidden="true"
    >
      {!posterFailed && (
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          onError={() => setPosterFailed(true)}
          className={`effect-pixel-pop-arcade-poster absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-150 ${
            showAnimatedWebp ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
      {showAnimatedWebp && (
        <img
          src={webpUrl}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          onError={() => setWebpFailed(true)}
          className="effect-pixel-pop-arcade-webp absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />
      )}
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
  if (itemId === 'black-sun-ember-storm') {
    // Performance rule: in dense lists (comments, chips, leaderboards where size < 56), do not render the profile effect at all
    if (size < 56) {
      return (
        <div
          className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {children}
        </div>
      );
    }
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <div
          className="absolute -inset-2.5 rounded-full pointer-events-none z-20 overflow-hidden"
          style={{ overflow: 'hidden', contain: 'paint', pointerEvents: 'none' }}
        >
          <BlackSunEmberStormOverlay canAnimate={canAnimate} mode="avatar" />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (itemId === 'effect-pixel-pop-arcade') {
    const isDenseList = size < 56;
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <div
          className="absolute -inset-2.5 rounded-full pointer-events-none z-20 overflow-hidden"
          style={{ overflow: 'hidden', contain: 'paint', pointerEvents: 'none' }}
        >
          <PixelPopSparkleShowerOverlay
            canAnimate={canAnimate && !isDenseList}
            mode="avatar"
            forcePosterOnly={isDenseList}
          />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  switch (itemId) {
    // ─── STATIC & LEGACY AVATAR EFFECTS ──────────────────────────────────────────
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
  forceStatic?: boolean;
}

export const ProfileCardEffect: React.FC<ProfileCardEffectProps> = ({
  itemId,
  className = '',
  previewMode = false,
  forceStatic = false,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!itemId || itemId === 'none') {
      setVisible(false);
      return;
    }
    setVisible(true);
    // Flagship 3D seamless loops ('black-sun-ember-storm', 'effect-pixel-pop-arcade') loop continuously while visible on-screen
    if (!previewMode && itemId !== 'black-sun-ember-storm' && itemId !== 'effect-pixel-pop-arcade') {
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
      style={{ overflow: 'hidden', contain: 'paint', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* ─── FLAGSHIP 3D BLENDER PROFILE EFFECT: BLACK SUN EMBER STORM ────────── */}
      {itemId === 'black-sun-ember-storm' && (
        <BlackSunEmberStormOverlay canAnimate={visible && !forceStatic} mode="card" />
      )}

      {/* ─── 3D BLENDER PROFILE EFFECT: PIXEL POP SPARKLE SHOWER ─────────────── */}
      {itemId === 'effect-pixel-pop-arcade' && (
        <PixelPopSparkleShowerOverlay canAnimate={visible && !forceStatic} mode="card" />
      )}

      {/* ─── STATIC & LEGACY FULL-CARD EFFECTS ───────────────────────── */}
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
  itemId?: string;
  effectId?: string;
  className?: string;
  compact?: boolean;
  userName?: string;
  displayName?: string;
  forceStatic?: boolean;
  animated?: boolean;
}> = ({
  itemId,
  effectId,
  className = '',
  userName,
  displayName,
  forceStatic = false,
  animated = true,
}) => {
  const resolvedId = itemId || effectId || '';
  const resolvedName = userName || displayName || 'Boardly Scholar';
  const resolvedForceStatic = Boolean(forceStatic || !animated);

  return (
    <div
      className={`dark-surface-preserve relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-[#141418] via-[#0E0E12] to-[#08080B] border border-white/15 p-2.5 flex flex-col justify-center items-center shadow-inner select-none ${className}`}
      style={{ overflow: 'hidden', contain: 'paint' }}
    >
      {/* Subtle Top Banner Strip Inside Mini Profile Card */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-r from-[#2A080C] via-[#1E1B4B] to-[#0F172A] opacity-85 pointer-events-none" />

      {/* Centered Mini Profile Avatar + Glass Username Pill */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center max-w-full px-1">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#DC2626] to-[#F59E0B] p-0.5 shrink-0 shadow-md">
          <div className="w-full h-full rounded-full bg-[#121216] flex items-center justify-center p-1.5 text-[#F59E0B]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z" />
            </svg>
          </div>
        </div>
        <span
          className="text-[11px] font-heading font-semibold text-white leading-tight line-clamp-1 max-w-full px-2.5 py-0.5 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 shadow-sm"
          style={{
            color: '#FFFFFF',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.65)',
          }}
        >
          {resolvedName}
        </span>
      </div>

      {/* Looping Full-Card Effect Clipped Inside */}
      <ProfileCardEffect itemId={resolvedId} previewMode={true} forceStatic={resolvedForceStatic} />
    </div>
  );
};

