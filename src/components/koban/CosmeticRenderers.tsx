import React, { useEffect, useRef, useState } from 'react';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { PFP_ARTWORK_MAP } from './artwork/pfpArtwork';
import { FrameRenderer } from './artwork/frameArtwork';
import { NameplateRenderer } from './artwork/plateArtwork';
import {
  EffectAvatarRenderer,
  ProfileCardEffect as BaseProfileCardEffect,
  ProfileEffectCardPreview,
  type ProfileCardEffectProps,
} from './artwork/effectArtwork';
import { useSmoothMode } from '@/utils/smoothMode';

export { ProfileEffectCardPreview };

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

  const item = itemId ? getCosmeticById(itemId) : undefined;
  // Catalog animated flag is the single source of truth
  const isCatalogAnimated = Boolean(item?.animated && !forceStatic && !smoothMode);

  useEffect(() => {
    if (!isCatalogAnimated) {
      setIsVisible(false);
      return;
    }

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
      { threshold: 0.05, rootMargin: '100px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isCatalogAnimated]);

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
}

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
}) => {
  const avatarId = directAvatarId || itemId || null;
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 40;
  const effectiveVariant = variant || avatarVariant;
  const pfpItem = avatarId ? getCosmeticById(avatarId) : undefined;
  const isPfp = Boolean(pfpItem && pfpItem.type === 'avatar' && PFP_ARTWORK_MAP[avatarId!]);
  const { containerRef, canAnimate } = useCosmeticAnimation(avatarId || '', false, forceStatic);

  if (isPfp && avatarId && PFP_ARTWORK_MAP[avatarId]) {
    const PfpComp = PFP_ARTWORK_MAP[avatarId];
    return (
      <div
        ref={containerRef}
        className={`inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0 select-none shadow-sm ${className}`}
        style={{ width: numericSize, height: numericSize }}
        title={pfpItem?.name}
        aria-label={`${pfpItem?.name} Profile Picture`}
      >
        <PfpComp canAnimate={canAnimate} />
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
}> = ({ itemId, name, shortId, roleBadge, className = '', forceStatic = false }) => {
  const { containerRef, canAnimate } = useCosmeticAnimation(itemId, true, forceStatic);
  const exists = Boolean(itemId && itemId !== 'none' && getCosmeticById(itemId));

  if (!exists) {
    return (
      <div className={`inline-flex items-center gap-1.5 max-w-full truncate ${className}`}>
        <span className="font-heading font-semibold text-xs text-[var(--text)] truncate">{name}</span>
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
}> = (props) => {
  const fallback = (
    <div className={`inline-flex items-center gap-1.5 max-w-full truncate ${props.className || ''}`}>
      <span className="font-heading font-semibold text-xs text-[var(--text)] truncate">{props.name}</span>
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
