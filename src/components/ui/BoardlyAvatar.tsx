import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getCosmeticById } from '@/data/cosmeticsCatalog';

const LazyAvatarPicture = lazy(() =>
  import('@/components/koban/CosmeticRenderers').then((m) => ({ default: m.AvatarPicture }))
);
const LazyAvatarFrame = lazy(() =>
  import('@/components/koban/CosmeticRenderers').then((m) => ({ default: m.AvatarFrame }))
);

function isImageUrl(val?: string | null): val is string {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  );
}

/**
 * Resolves a store-bought cosmetic ID (avatar or frame) from a raw value.
 * Handles direct catalog IDs (`pfp_pixel_pop_arcade`, `eclipse-wyrm`, `frame_topper_burst`),
 * legacy ID aliases (`pfp_eclipse_wyrm`), and store asset paths (`/assets/store/pfp_.../poster.webp`).
 */
export function resolveCosmeticItemId(
  val?: string | null,
  expectedSlot?: 'avatar' | 'frame'
): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  // Extract cosmetic ID if a store asset path was saved instead of the ID
  const storePathMatch = trimmed.match(
    /^\/assets\/store\/(?:avatars\/|frames\/)?([^/?#]+)/i
  );
  const candidate = storePathMatch ? storePathMatch[1] : trimmed;

  const catalogItem = getCosmeticById(candidate);
  if (catalogItem) {
    if (!expectedSlot || catalogItem.slot === expectedSlot) {
      return catalogItem.id;
    }
  }

  if (expectedSlot === 'avatar' && candidate.startsWith('pfp_')) {
    return candidate;
  }
  if (expectedSlot === 'frame' && candidate.startsWith('frame_')) {
    return candidate;
  }

  if (!isImageUrl(candidate)) {
    if (expectedSlot === 'avatar' && !candidate.startsWith('frame_')) {
      return candidate;
    }
    if (expectedSlot === 'frame' && !candidate.startsWith('pfp_')) {
      return candidate;
    }
    if (!expectedSlot) {
      return candidate;
    }
  }

  return null;
}

export interface BoardlyAvatarProps {
  equippedAvatar?: string | null;
  avatarUrl?: string | null;
  photoURL?: string | null;
  frame?: string | null;
  name?: string | null;
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  forceStatic?: boolean;
  isSuperAdmin?: boolean;
  priority?: number;
  // Backward-compatible prop aliases
  avatarId?: string | null;
  frameId?: string | null;
  fallbackInitials?: string | null;
}

function normalizeAvatarSize(size?: number | 'sm' | 'md' | 'lg'): number {
  if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
    return size;
  }
  if (size === 'sm') return 32;
  if (size === 'lg') return 56;
  if (size === 'md') return 44;
  return 36;
}

/**
 * SHARED USER AVATAR HELPER
 * Enforces avatar priority:
 * 1. equippedAvatar (Boardly catalog cosmetic ID or pfp_)
 * 2. avatarUrl / photoURL (chosen/uploaded avatar image)
 * 3. Superadmin fallback: Boardly / SHS logo (if superadmin and no chosen avatar)
 * 4. User's initials on a neutral circle (fallback for users without chosen avatar)
 *
 * Renders the equipped frame around the avatar if equipped.
 */
export const BoardlyAvatar: React.FC<BoardlyAvatarProps> = React.memo(({
  equippedAvatar,
  avatarUrl,
  photoURL,
  frame,
  name,
  size: rawSize = 36,
  className = '',
  avatarKey,
  avatarVariant,
  forceStatic = false,
  isSuperAdmin = false,
  priority,
  avatarId,
  frameId,
  fallbackInitials,
}) => {
  const size = normalizeAvatarSize(rawSize);
  const resolvedName = name || fallbackInitials || 'Student';

  // Resolve store-bought cosmetic avatar ID from any provided avatar prop
  const resolvedCosmeticAvatar =
    resolveCosmeticItemId(equippedAvatar, 'avatar') ||
    resolveCosmeticItemId(avatarId, 'avatar') ||
    resolveCosmeticItemId(avatarUrl, 'avatar') ||
    resolveCosmeticItemId(photoURL, 'avatar') ||
    resolveCosmeticItemId(avatarKey, 'avatar') ||
    null;

  const hasEquipped = Boolean(resolvedCosmeticAvatar);

  // Resolve custom image URL if no store cosmetic avatar is active (or as image source)
  const candidateUrl = [avatarUrl, photoURL, equippedAvatar, avatarId].find(
    (v) => isImageUrl(v) && !resolveCosmeticItemId(v, 'avatar')
  );

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [candidateUrl]);

  const cleanAvatarUrl =
    !hasEquipped && !imageError && candidateUrl ? candidateUrl.trim() : null;

  const initial = (
    resolvedName && resolvedName.trim().length > 0
      ? resolvedName.trim().charAt(0)
      : 'S'
  ).toUpperCase();

  const initialFallback = (
    <div
      className="w-full h-full rounded-full bg-surface-muted border border-border flex items-center justify-center font-bold text-primary select-none font-sans"
      style={{ fontSize: Math.max(10, Math.floor(size * 0.42)) }}
    >
      {initial}
    </div>
  );

  const superAdminLogoAvatar = (
    <div
      className="w-full h-full rounded-full bg-surface-raised border border-border flex items-center justify-center p-1 select-none overflow-hidden"
      style={{ width: size, height: size }}
    >
      <img
        src="/logo.png"
        alt="SHS Virtual Academy"
        className="w-full h-full object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
        }}
      />
    </div>
  );

  // Avatar inner content based on priority
  let innerAvatar: React.ReactNode;

  if (hasEquipped && resolvedCosmeticAvatar) {
    // Priority 1: Boardly chosen cosmetic avatar
    innerAvatar = (
      <Suspense fallback={initialFallback}>
        <LazyAvatarPicture
          avatarId={resolvedCosmeticAvatar}
          avatarKey={avatarKey || undefined}
          avatarVariant={avatarVariant || undefined}
          size={size}
          forceStatic={forceStatic}
          priority={priority ?? (size >= 56 ? 10 : 1)}
          className="w-full h-full object-cover rounded-full"
        />
      </Suspense>
    );
  } else if (cleanAvatarUrl) {
    // Priority 2: Custom chosen avatar image with loading & error fallback
    innerAvatar = (
      <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
        {!imageLoaded && (
          <div className="absolute inset-0">
            {isSuperAdmin ? superAdminLogoAvatar : initialFallback}
          </div>
        )}
        <img
          src={cleanAvatarUrl}
          alt={resolvedName}
          loading="lazy"
          decoding="async"
          width={size}
          height={size}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover rounded-full select-none transition-opacity duration-150 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    );
  } else if (isSuperAdmin) {
    // Priority 3: Superadmin account (SHS Virtual Academy) shows Boardly / SHS logo
    innerAvatar = superAdminLogoAvatar;
  } else {
    // Priority 4: User's initials on a neutral circle
    innerAvatar = initialFallback;
  }

  // If frame is equipped, calculate outer frame size and wrap
  const resolvedFrame =
    resolveCosmeticItemId(frame, 'frame') ||
    resolveCosmeticItemId(frameId, 'frame') ||
    null;

  if (resolvedFrame) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <Suspense
          fallback={
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {innerAvatar}
            </div>
          }
        >
          <LazyAvatarFrame itemId={resolvedFrame} size={size} forceStatic={forceStatic}>
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {innerAvatar}
            </div>
          </LazyAvatarFrame>
        </Suspense>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {innerAvatar}
    </div>
  );
});

export default BoardlyAvatar;

