import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { PFP_ARTWORK_MAP, type PfpSvgProps } from './artwork/pfpArtwork';
import { FrameRenderer } from './artwork/frameArtwork';
import { NameplateRenderer } from './artwork/plateArtwork';
import {
  EffectAvatarRenderer,
  ProfileCardEffect as BaseProfileCardEffect,
  ProfileEffectCardPreview,
  type ProfileCardEffectProps,
} from './artwork/effectArtwork';
import { storeVideoGovernor } from './fx/StoreLoopVideo';
import { useSmoothMode } from '@/utils/smoothMode';

export { ProfileEffectCardPreview };

let nextPixelPopPfpUid = 1;

const PixelPopCubeAvatar: React.FC<PfpSvgProps> = ({
  className = '',
  canAnimate = true,
  priority = 2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const instanceIdRef = useRef<string>(`pfp-pixel-pop-arcade-${nextPixelPopPfpUid++}`);
  const [isVisible, setIsVisible] = useState(true);
  const [isGovernorActive, setIsGovernorActive] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    storeVideoGovernor.isReducedMotion()
  );

  const posterUrl = '/assets/store/pfp_pixel_pop_arcade/poster.webp';
  const webmUrl = '/assets/store/pfp_pixel_pop_arcade/pfp.webm';
  const mp4Url = '/assets/store/pfp_pixel_pop_arcade/pfp.mp4';

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
      priority,
      setActiveState: setIsGovernorActive,
      onPlayError: () => setAutoplayBlocked(true),
    });
  }, [effectiveAnimate, isVisible, priority]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      videoEl: videoRef.current,
      getVideoEl: () => videoRef.current,
      isVisible,
      canAnimate: effectiveAnimate,
      priority,
    });
  }, [isVisible, effectiveAnimate, priority]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (effectiveAnimate && isVisible && isGovernorActive && !autoplayBlocked) {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err: unknown) => {
          const name = err instanceof Error ? err.name : '';
          if (name === 'AbortError') return;
          setAutoplayBlocked(true);
        });
      }
    } else if (!video.paused) {
      video.pause();
    }
  }, [effectiveAnimate, isVisible, isGovernorActive, autoplayBlocked]);

  const handleVideoReady = () => {
    setAutoplayBlocked(false);
    const video = videoRef.current;
    if (effectiveAnimate && isVisible && isGovernorActive && video && video.paused) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err: unknown) => {
          const name = err instanceof Error ? err.name : '';
          if (name === 'AbortError') return;
          setAutoplayBlocked(true);
        });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`pfp-pixel-pop-arcade relative w-full h-full overflow-hidden select-none aspect-square rounded-full ${className}`}
      style={{
        background: 'radial-gradient(circle, #00E0C6 0%, #008276 100%)',
        contain: 'paint',
      }}
      data-avatar-id="pfp_pixel_pop_arcade"
      data-testid="pfp-pixel-pop-arcade"
    >
      <img
        src={posterUrl}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="pfp-pixel-pop-arcade-poster absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none"
      />
      {effectiveAnimate && (
        <video
          ref={handleVideoRef}
          data-testid="pfp-pixel-pop-arcade-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={posterUrl}
          onLoadedMetadata={handleVideoReady}
          onLoadedData={handleVideoReady}
          onCanPlay={handleVideoReady}
          onPlaying={() => setAutoplayBlocked(false)}
          onError={() => setVideoFailed(true)}
          className={`pfp-pixel-pop-arcade-video absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none transition-opacity duration-200 ${
            isVisible && isGovernorActive && !videoFailed && !autoplayBlocked
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          <source src={webmUrl} type="video/webm" />
          <source src={mp4Url} type="video/mp4" onError={() => setVideoFailed(true)} />
        </video>
      )}
    </div>
  );
};

interface BaseCosmeticProps {
  itemId: string;
  size?: number;
  children?: React.ReactNode;
  className?: string;
  forceStatic?: boolean;
}

/**
 * Small Error Boundary to wrap individual cosmetics.
 * Prevents any broken cosmetic rendering from crashing parent components or entire pages.
 */
interface CosmeticErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface CosmeticErrorBoundaryState {
  hasError: boolean;
}

export class CosmeticErrorBoundary extends React.Component<
  CosmeticErrorBoundaryProps,
  CosmeticErrorBoundaryState
> {
  constructor(props: CosmeticErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): CosmeticErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Cosmetic rendering suppressed by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Isolated Profile Card Effect wrapped in CosmeticErrorBoundary.
 * Falls back to null if itemId is retired/missing or rendering throws.
 */
export const ProfileCardEffect: React.FC<ProfileCardEffectProps> = (props) => {
  const exists = Boolean(props.itemId && props.itemId !== 'none' && getCosmeticById(props.itemId));
  if (!exists) return null;
  return (
    <CosmeticErrorBoundary fallback={null}>
      <BaseProfileCardEffect {...props} />
    </CosmeticErrorBoundary>
  );
};
export const ProfileEffect = ProfileCardEffect;

/**
 * Hook to determine if cosmetic should execute animations:
 * 1. Must be marked animated: true in catalog (single source of truth)
 * 2. If forceStatic or Smooth Mode is true, immediately return false
 * 3. Element is observed for viewport presence (defaults to true for instant render)
 */
function useCosmeticAnimation(itemId: string, _isNameplate = false, forceStatic = false) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { smoothMode } = useSmoothMode();

  const normalizedId = itemId === 'pfp_eclipse_wyrm' ? 'eclipse-wyrm' : itemId;
  const item = normalizedId ? getCosmeticById(normalizedId) : undefined;
  // Catalog animated flag is the single source of truth
  const isCatalogAnimated = Boolean(item?.animated && !forceStatic && !smoothMode);

  useEffect(() => {
    if (!isCatalogAnimated) {
      return;
    }

    setIsVisible(true);
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.05, rootMargin: '100px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [normalizedId, isCatalogAnimated]);

  const canAnimate = isCatalogAnimated && isVisible;

  return { containerRef, canAnimate, isCatalogAnimated };
}

/**
 * SHARED AVATAR PICTURE COMPONENT (<AvatarPicture />)
 * - If student has equipped an owned Profile Picture (pfp_...), renders the full-art illustration.
 * - Otherwise falls back cleanly to the student's dot-matrix avatar.
 * - If avatarId does not exist in catalog, gracefully falls back to default dot-matrix avatar.
 * - Isolated within its own CosmeticErrorBoundary.
 */
export interface AvatarPictureProps {
  itemId?: string | null;
  photoURL?: string | null;
  avatarId?: string | null;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  variant?: string | null;
  seed?: string | null;
  size?: number | string;
  className?: string;
  forceStatic?: boolean;
  priority?: number;
}

const VIDEO_LOOP_AVATAR_IDS = new Set([
  'eclipse-wyrm',
  'pfp_eclipse_wyrm',
  'pfp_pixel_pop_arcade',
  'pfp_phoenix_ascendant',
  'pfp_ryujin_sea_dragon',
  'pfp_shadow_ninja_mask',
  'pfp_raijin_thunder_god',
  'pfp_yokai_lantern_ghost',
]);

const AvatarPictureInner: React.FC<AvatarPictureProps> = ({
  itemId,
  photoURL: _photoURL,
  avatarId: directAvatarId,
  avatarKey,
  avatarVariant,
  variant,
  seed,
  size = 40,
  className = '',
  forceStatic = false,
  priority,
}) => {
  const rawAvatarId = directAvatarId || itemId || null;
  const avatarId = rawAvatarId === 'pfp_eclipse_wyrm' ? 'eclipse-wyrm' : rawAvatarId;
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 40;
  // Performance rule: in dense lists (numericSize < 56, e.g. 40x40 comments, chips, leaderboards, member lists), show poster only
  const isDenseList = Boolean(avatarId && VIDEO_LOOP_AVATAR_IDS.has(avatarId) && numericSize < 56);
  const effectiveForceStatic = Boolean(forceStatic || isDenseList);
  const effectivePriority = priority ?? (numericSize >= 56 ? 10 : 1);
  const effectiveVariant = variant || avatarVariant;
  const pfpItem = avatarId ? getCosmeticById(avatarId) : undefined;
  const PfpComp =
    avatarId === 'pfp_pixel_pop_arcade'
      ? PixelPopCubeAvatar
      : avatarId
        ? PFP_ARTWORK_MAP[avatarId]
        : undefined;
  const isPfp = Boolean(pfpItem && pfpItem.type === 'avatar' && PfpComp);
  const { containerRef, canAnimate } = useCosmeticAnimation(avatarId || '', false, effectiveForceStatic);

  if (isPfp && avatarId && PfpComp) {
    return (
      <div
        ref={containerRef}
        className={`inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0 select-none shadow-sm ${className}`}
        style={{ width: numericSize, height: numericSize }}
        title={pfpItem?.name}
        aria-label={`${pfpItem?.name} Profile Picture`}
      >
        <PfpComp canAnimate={canAnimate && !effectiveForceStatic} priority={effectivePriority} />
      </div>
    );
  }

  // Fallback to default dot-matrix avatar
  return (
    <MatrixAvatar
      avatarKey={avatarKey}
      variant={effectiveVariant}
      seed={seed}
      size={numericSize}
      className={className}
    />
  );
};

export const AvatarPicture: React.FC<AvatarPictureProps> = (props) => {
  const numericSize = typeof props.size === 'number' ? props.size : parseInt(String(props.size), 10) || 40;
  const fallback = (
    <MatrixAvatar
      avatarKey={props.avatarKey}
      variant={props.variant || props.avatarVariant}
      seed={props.seed}
      size={numericSize}
      className={props.className}
    />
  );
  return (
    <CosmeticErrorBoundary fallback={fallback}>
      <AvatarPictureInner {...props} />
    </CosmeticErrorBoundary>
  );
};

export const CosmeticAvatar = AvatarPicture;

/**
 * SHARED AVATAR FRAME COMPONENT (<AvatarFrame />)
 * - If frame itemId is invalid or missing, cleanly renders children without frame decoration.
 * - Isolated within its own CosmeticErrorBoundary.
 */
const AvatarFrameInner: React.FC<BaseCosmeticProps> = ({
  itemId,
  size = 56,
  children,
  className = '',
  forceStatic = false,
}) => {
  const { containerRef, canAnimate } = useCosmeticAnimation(itemId, false, forceStatic);
  const exists = Boolean(itemId && itemId !== 'none' && getCosmeticById(itemId));

  if (!exists) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="inline-flex items-center justify-center shrink-0 overflow-hidden relative"
      style={{ width: size, height: size }}
    >
      <FrameRenderer
        itemId={itemId}
        size={size}
        canAnimate={canAnimate}
        className={className}
      >
        {children}
      </FrameRenderer>
    </div>
  );
};

export const AvatarFrame: React.FC<BaseCosmeticProps> = (props) => (
  <CosmeticErrorBoundary fallback={<>{props.children}</>}>
    <AvatarFrameInner {...props} />
  </CosmeticErrorBoundary>
);

// Backward-compatible alias
export const CosmeticFrame = AvatarFrame;

/**
 * SHARED NAMEPLATE COMPONENT (<Nameplate />)
 * - If nameplate itemId is invalid, falls back to plain unstyled student name.
 * - Isolated within its own CosmeticErrorBoundary.
 */
const NameplateInner: React.FC<{
  itemId: string;
  name: string;
  shortId?: string;
  roleBadge?: string;
  className?: string;
  forceStatic?: boolean;
  allowWrap?: boolean | 'full' | 'two-lines';
}> = ({ itemId, name, shortId, roleBadge, className = '', forceStatic = false, allowWrap = false }) => {
  const { containerRef, canAnimate } = useCosmeticAnimation(itemId, true, forceStatic);
  const exists = Boolean(itemId && itemId !== 'none' && getCosmeticById(itemId));
  const wrapCls =
    allowWrap === 'full'
      ? 'whitespace-normal break-words leading-snug'
      : allowWrap
      ? 'whitespace-normal break-words line-clamp-2 leading-snug'
      : 'truncate';

  if (!exists) {
    return (
      <div className={`inline-flex items-center gap-1.5 max-w-full ${allowWrap ? '' : 'truncate'} ${className}`}>
        <span className={`font-heading font-semibold text-xs text-[var(--text)] ${wrapCls}`}>{name}</span>
        {shortId && <span className="font-mono text-[10px] text-[var(--muted)] shrink-0">#{shortId}</span>}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="inline-flex items-center max-w-full overflow-hidden">
      <NameplateRenderer
        itemId={itemId}
        name={name}
        shortId={shortId}
        roleBadge={roleBadge}
        canAnimate={canAnimate}
        className={className}
        allowWrap={allowWrap}
      />
    </div>
  );
};

export const Nameplate: React.FC<{
  itemId: string;
  name: string;
  shortId?: string;
  roleBadge?: string;
  className?: string;
  forceStatic?: boolean;
  allowWrap?: boolean | 'full' | 'two-lines';
}> = (props) => {
  const wrapCls =
    props.allowWrap === 'full'
      ? 'whitespace-normal break-words leading-snug'
      : props.allowWrap
      ? 'whitespace-normal break-words line-clamp-2 leading-snug'
      : 'truncate';
  const fallback = (
    <div className={`inline-flex items-center gap-1.5 max-w-full ${props.allowWrap ? '' : 'truncate'} ${props.className || ''}`}>
      <span className={`font-heading font-semibold text-xs text-[var(--text)] ${wrapCls}`}>{props.name}</span>
      {props.shortId && <span className="font-mono text-[10px] text-[var(--muted)] shrink-0">#{props.shortId}</span>}
    </div>
  );
  return (
    <CosmeticErrorBoundary fallback={fallback}>
      <NameplateInner {...props} />
    </CosmeticErrorBoundary>
  );
};

// Backward-compatible alias
export const CosmeticNameplate = Nameplate;

/**
 * SHARED PROFILE EFFECT COMPONENT (<CosmeticEffect />)
 */
const CosmeticEffectInner: React.FC<BaseCosmeticProps> = ({
  itemId,
  size = 64,
  children,
  className = '',
  forceStatic = false,
}) => {
  const { containerRef, canAnimate } = useCosmeticAnimation(itemId, false, forceStatic);
  const exists = Boolean(itemId && itemId !== 'none' && getCosmeticById(itemId));

  if (!exists) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="inline-flex items-center justify-center">
      <EffectAvatarRenderer
        itemId={itemId}
        size={size}
        canAnimate={canAnimate}
        className={className}
      >
        {children}
      </EffectAvatarRenderer>
    </div>
  );
};

export const CosmeticEffect: React.FC<BaseCosmeticProps> = (props) => (
  <CosmeticErrorBoundary fallback={<>{props.children}</>}>
    <CosmeticEffectInner {...props} />
  </CosmeticErrorBoundary>
);
