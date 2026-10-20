import React, { useEffect, useRef, useState } from 'react';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { PFP_ARTWORK_MAP } from './artwork/pfpArtwork';
import { FrameRenderer } from './artwork/frameArtwork';
import { NameplateRenderer } from './artwork/plateArtwork';
import { EffectAvatarRenderer, ProfileCardEffect } from './artwork/effectArtwork';

// Re-export ProfileCardEffect for convenience
export { ProfileCardEffect };

interface BaseCosmeticProps {
  itemId: string;
  size?: number;
  children?: React.ReactNode;
  className?: string;
  forceStatic?: boolean;
}

// Global active nameplate tracking to cap simultaneously animated nameplates in long lists
let activeAnimatedNameplateCount = 0;
const MAX_ANIMATED_NAMEPLATES = 10;

/**
 * Hook to determine if cosmetic should execute animations:
 * 1. Must be marked animated: true in catalog (single source of truth)
 * 2. Element must be visible in viewport via IntersectionObserver
 * 3. If nameplate, must respect the 10-item simultaneous animation cap
 */
export function useCosmeticAnimation(itemId: string, isNameplate = false, forceStatic = false) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasNameplateSlot, setHasNameplateSlot] = useState(false);

  const item = getCosmeticById(itemId);
  // Catalog animated flag is the single source of truth
  const isCatalogAnimated = Boolean(item?.animated && !forceStatic);

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
        const visible = Boolean(entry?.isIntersecting);
        setIsVisible(visible);

        if (isNameplate) {
          if (visible && activeAnimatedNameplateCount < MAX_ANIMATED_NAMEPLATES) {
            activeAnimatedNameplateCount++;
            setHasNameplateSlot(true);
          } else if (!visible) {
            if (hasNameplateSlot) {
              activeAnimatedNameplateCount = Math.max(0, activeAnimatedNameplateCount - 1);
              setHasNameplateSlot(false);
            }
          }
        }
      },
      { threshold: 0.05, rootMargin: '60px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (isNameplate && hasNameplateSlot) {
        activeAnimatedNameplateCount = Math.max(0, activeAnimatedNameplateCount - 1);
      }
    };
  }, [isCatalogAnimated, isNameplate, hasNameplateSlot]);

  // For nameplates, both visibility and cap slot must be satisfied
  const canAnimate = isCatalogAnimated && isVisible && (!isNameplate || hasNameplateSlot);

  return { containerRef, canAnimate, isCatalogAnimated };
}

/**
 * SHARED AVATAR PICTURE COMPONENT (<AvatarPicture />)
 * - If student has equipped an owned Profile Picture (pfp_...), renders the full-art illustration.
 * - Otherwise falls back cleanly to the student's dot-matrix avatar.
 * - Animated PFPs animate only if animated: true and in viewport.
 * - Static PFPs NEVER animate anywhere.
 */
export interface AvatarPictureProps {
  avatarId?: string | null;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  seed?: string | null;
  size?: number | string;
  className?: string;
  forceStatic?: boolean;
}

export const AvatarPicture: React.FC<AvatarPictureProps> = ({
  avatarId,
  avatarKey,
  avatarVariant,
  seed,
  size = 40,
  className = '',
  forceStatic = false,
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 40;
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
      variant={avatarVariant}
      seed={seed}
      size={numericSize}
      className={className}
    />
  );
};

/**
 * SHARED AVATAR FRAME COMPONENT (<AvatarFrame />)
 */
export const AvatarFrame: React.FC<BaseCosmeticProps> = ({
  itemId,
  size = 56,
  children,
  className = '',
  forceStatic = false,
}) => {
  const { containerRef, canAnimate } = useCosmeticAnimation(itemId, false, forceStatic);

  return (
    <div ref={containerRef} className="inline-flex items-center justify-center">
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

// Backward-compatible alias
export const CosmeticFrame = AvatarFrame;

/**
 * SHARED NAMEPLATE COMPONENT (<Nameplate />)
 */
export const Nameplate: React.FC<{
  itemId: string;
  name: string;
  shortId?: string;
  roleBadge?: string;
  className?: string;
  forceStatic?: boolean;
}> = ({ itemId, name, shortId, roleBadge, className = '', forceStatic = false }) => {
  const { containerRef, canAnimate } = useCosmeticAnimation(itemId, true, forceStatic);

  return (
    <div ref={containerRef} className="inline-flex items-center">
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

// Backward-compatible alias
export const CosmeticNameplate = Nameplate;

/**
 * SHARED PROFILE EFFECT COMPONENT (<CosmeticEffect />)
 */
export const CosmeticEffect: React.FC<BaseCosmeticProps> = ({
  itemId,
  size = 64,
  children,
  className = '',
  forceStatic = false,
}) => {
  const { containerRef, canAnimate } = useCosmeticAnimation(itemId, false, forceStatic);

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
