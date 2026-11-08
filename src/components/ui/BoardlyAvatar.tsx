import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getCosmeticById } from '@/data/cosmeticsCatalog';

const LazyAvatarPicture = lazy(() =>
  import('@/components/koban/CosmeticRenderers').then((m) => ({ default: m.AvatarPicture }))
);
const LazyAvatarFrame = lazy(() =>
  import('@/components/koban/CosmeticRenderers').then((m) => ({ default: m.AvatarFrame }))
);

function isImageUrl(val?: string | null): boolean {
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
    if (!expectedSlot || catalogItem.type === expectedSlot) {
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
  uid?: string;
  equippedAvatar?: string | null;
  avatarUrl?: string | null;
  photoURL?: string | null;
  avatar?: string | null;
  customAvatarUrl?: string | null;
  frame?: string | null;
  name?: string | null;
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  forceStatic?: boolean;
  isSuperAdmin?: boolean;
  priority?: number;
  loading?: boolean;
  // Backward-compatible prop aliases
  avatarId?: string | null;
  equippedAvatarId?: string | null;
  frameId?: string | null;
  equippedFrameId?: string | null;
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

const SOFT_AVATAR_PALETTES = [
  { bg: 'rgba(225, 29, 46, 0.16)', text: '#ff4d5c', border: 'rgba(225, 29, 46, 0.28)' },
  { bg: 'rgba(76, 195, 255, 0.16)', text: '#4cc3ff', border: 'rgba(76, 195, 255, 0.28)' },
  { bg: 'rgba(61, 220, 132, 0.16)', text: '#3ddc84', border: 'rgba(61, 220, 132, 0.28)' },
  { bg: 'rgba(245, 197, 66, 0.16)', text: '#f5c542', border: 'rgba(245, 197, 66, 0.28)' },
  { bg: 'rgba(168, 85, 247, 0.16)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.28)' },
  { bg: 'rgba(249, 115, 22, 0.16)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.28)' },
];

function getSoftPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SOFT_AVATAR_PALETTES[hash % SOFT_AVATAR_PALETTES.length];
}

/**
 * SHARED USER AVATAR HELPER
 * Enforces avatar priority:
 * 1. equippedAvatar (Boardly catalog cosmetic ID or pfp_)
 * 2. avatarUrl / photoURL (chosen/uploaded avatar image)
 * 3. Superadmin fallback: Boardly / SHS logo (if superadmin and no chosen avatar)
 * 4. User's initials on a soft colored circle (fallback for users without chosen avatar)
 *
 * Renders the equipped frame around the avatar if equipped.
 */
export const BoardlyAvatar: React.FC<BoardlyAvatarProps> = React.memo(({
  uid: _uid,
  equippedAvatar,
  avatarUrl,
  photoURL,
  avatar,
  customAvatarUrl,
  frame,
  name,
  size: rawSize = 36,
  className = '',
  avatarKey,
  avatarVariant,
  forceStatic = false,
  isSuperAdmin = false,
  priority,
  loading = false,
  avatarId,
  equippedAvatarId,
  frameId,
  equippedFrameId,
  fallbackInitials,
}) => {
  const size = normalizeAvatarSize(rawSize);
  const resolvedName = name || fallbackInitials || 'Student';

  const effectiveEquippedAvatar = equippedAvatar || equippedAvatarId || avatar || null;
  const effectiveAvatarUrl = avatarUrl || customAvatarUrl || null;
  const effectiveFrame = frame || frameId || equippedFrameId || null;

  // Resolve store-bought cosmetic avatar ID from explicit equipped avatar props
  const storeCosmeticAvatar =
    resolveCosmeticItemId(effectiveEquippedAvatar, 'avatar') ||
    resolveCosmeticItemId(avatarId, 'avatar') ||
    resolveCosmeticItemId(effectiveAvatarUrl, 'avatar') ||
    resolveCosmeticItemId(photoURL, 'avatar') ||
    null;

  // Resolve custom image URL (avatarUrl / photoURL / uploaded photo)
  const candidateUrl = [effectiveAvatarUrl, photoURL, effectiveEquippedAvatar, avatarId].find(
    (v) => isImageUrl(v) && !resolveCosmeticItemId(v, 'avatar')
  );

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [candidateUrl]);

  const cleanAvatarUrl =
    !storeCosmeticAvatar && !imageError && candidateUrl ? candidateUrl.trim() : null;

  // Only fall back to avatarKey matrix avatar if there is no store cosmetic and no valid image URL
  const resolvedCosmeticAvatar =
    storeCosmeticAvatar ||
    (!cleanAvatarUrl ? resolveCosmeticItemId(avatarKey, 'avatar') : null);

  const hasEquipped = Boolean(resolvedCosmeticAvatar);

  const initial = (
    resolvedName && resolvedName.trim().length > 0
      ? resolvedName.trim().charAt(0)
      : 'S'
  ).toUpperCase();

  const softPalette = getSoftPalette(_uid || resolvedName || initial);

  const skeletonPlaceholder = (
    <div
      className="w-full h-full rounded-full animate-pulse select-none"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--rs-card2, rgba(154, 154, 163, 0.18))',
        boxShadow: 'inset 0 0 0 1px var(--rs-line, rgba(255, 255, 255, 0.09))',
      }}
      aria-hidden="true"
    />
  );

  const initialFallback = (
    <div
      className="w-full h-full rounded-full flex items-center justify-center font-bold select-none font-sans"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        fontSize: Math.max(11, Math.floor(size * 0.42)),
        backgroundColor: softPalette.bg,
        color: softPalette.text,
        boxShadow: `inset 0 0 0 1px ${softPalette.border}`,
      }}
    >
      {initial}
    </div>
  );

  const superAdminLogoAvatar = (
    <div
      className="w-full h-full rounded-full bg-surface-raised border border-border flex items-center justify-center p-1 select-none overflow-hidden"
      style={{ width: size, height: size, borderRadius: '50%' }}
    >
      <img
        src="/logo.png"
        alt="SHS Virtual Academy"
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
        }}
      />
    </div>
  );

  // Avatar inner content based on priority
  let innerAvatar: React.ReactNode;

  if (loading && !hasEquipped && !cleanAvatarUrl && !isSuperAdmin) {
    innerAvatar = skeletonPlaceholder;
  } else if (hasEquipped && resolvedCosmeticAvatar) {
    // Priority 1: Boardly chosen cosmetic avatar
    innerAvatar = (
      <Suspense fallback={skeletonPlaceholder}>
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
    // Priority 2: Custom chosen avatar image with neutral skeleton loading & error fallback
    innerAvatar = (
      <div
        className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{ width: size, height: size, borderRadius: '50%' }}
      >
        {!imageLoaded && (
          <div className="absolute inset-0">
            {skeletonPlaceholder}
          </div>
        )}
        <img
          src={cleanAvatarUrl}
          alt={resolvedName}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          width={size}
          height={size}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
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
    // Priority 4: User's initials on a soft colored circle
    innerAvatar = initialFallback;
  }

  // If frame is equipped, calculate outer frame size and wrap
  const resolvedFrame =
    resolveCosmeticItemId(effectiveFrame, 'frame') ||
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

