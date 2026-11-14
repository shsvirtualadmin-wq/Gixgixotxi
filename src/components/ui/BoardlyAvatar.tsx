import React, { lazy, Suspense, useEffect, useState } from 'react';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { getDefaultAvatar, isValidAvatar, type MatrixAvatarVariant } from '@/lib/matrixAvatarsData';
import {
  getCachedPublicProfile,
  getPublicProfile,
  subscribePublicProfile,
  type PublicUserProfile,
} from '@/services/publicProfileService';

const LazyAvatarPicture = lazy(() =>
  import('@/components/koban/CosmeticRenderers').then((m) => ({ default: m.AvatarPicture }))
);
const LazyAvatarFrame = lazy(() =>
  import('@/components/koban/CosmeticRenderers').then((m) => ({ default: m.AvatarFrame }))
);

function isExternalOrDataUrl(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim().toLowerCase();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.includes('googleusercontent.com') ||
    trimmed.includes('ggpht.com')
  );
}

/**
 * Resolves a cosmetic or free system avatar ID from a raw value.
 * Handles direct catalog IDs (`pfp_pixel_pop_arcade`, `eclipse-wyrm`, `frame-topper-burst`),
 * legacy ID aliases (`pfp_eclipse_wyrm`), store asset paths (`/assets/store/pfp_.../poster.webp`),
 * and free system dot-matrix avatar keys (`skull-01`, `robot-01`, etc.) when expectedSlot is 'avatar' or omitted.
 * Rejects Google/external photo URLs and unknown strings.
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
  if (isExternalOrDataUrl(trimmed)) {
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

  if ((!expectedSlot || expectedSlot === 'avatar') && isValidAvatar(candidate)) {
    return candidate;
  }

  return null;
}

export interface ResolvedUserAvatar {
  type: 'store' | 'matrix';
  storeAvatarId: string | null;
  uid: string;
  matrixKey: string;
  matrixVariant: MatrixAvatarVariant;
}

/**
 * Single shared avatar resolver for the entire app.
 * Rule:
 * 1. Equipped store or free system avatar -> 2. Profile avatar -> 3. Deterministic default matrix avatar by `uid`.
 * Never return or expose a Google/Gmail photo URL.
 */
export function resolveUserAvatar(
  uid?: string | null,
  ...avatarCandidates: Array<string | null | undefined>
): ResolvedUserAvatar {
  const cleanUid = typeof uid === 'string' ? uid.trim() : '';
  const cached = cleanUid && cleanUid !== 'anonymous' ? getCachedPublicProfile(cleanUid) : null;
  const matrix = getDefaultAvatar(cleanUid);

  const orderedCandidates: Array<string | null | undefined> = [
    cached?.equipped?.avatar,
    cached?.equippedAvatar,
    ...avatarCandidates,
    cached?.avatar,
    cached?.avatarUrl,
  ];

  for (const cand of orderedCandidates) {
    const resolvedId = resolveCosmeticItemId(cand, 'avatar');
    if (resolvedId) {
      const catalogItem = getCosmeticById(resolvedId);
      if (catalogItem && catalogItem.type === 'avatar') {
        return {
          type: 'store',
          storeAvatarId: catalogItem.id,
          uid: cleanUid,
          matrixKey: matrix.key,
          matrixVariant: matrix.variant,
        };
      }
      if (isValidAvatar(resolvedId)) {
        return {
          type: 'matrix',
          storeAvatarId: null,
          uid: cleanUid,
          matrixKey: resolvedId,
          matrixVariant: matrix.variant,
        };
      }
    }
  }

  return {
    type: 'matrix',
    storeAvatarId: null,
    uid: cleanUid,
    matrixKey: matrix.key,
    matrixVariant: matrix.variant,
  };
}

export interface BoardlyAvatarProps {
  uid?: string | null;
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

/**
 * SHARED USER AVATAR COMPONENT (<BoardlyAvatar />)
 * Enforces ONE live fallback order everywhere by `uid`:
 * 1. Equipped store avatar -> 2. Profile avatar -> 3. Deterministic default matrix avatar.
 * NEVER shows Google / Gmail profile photos or letter initials.
 */
export const BoardlyAvatar: React.FC<BoardlyAvatarProps> = React.memo(({
  uid,
  equippedAvatar,
  avatarUrl,
  photoURL: _ignoredPhotoURL,
  avatar,
  customAvatarUrl,
  frame,
  size: rawSize = 36,
  className = '',
  avatarKey,
  avatarVariant,
  forceStatic = false,
  priority,
  loading = false,
  avatarId,
  equippedAvatarId,
  frameId,
  equippedFrameId,
}) => {
  const cleanUid = typeof uid === 'string' ? uid.trim() : '';
  const canLookupLive = Boolean(cleanUid && cleanUid !== 'anonymous');

  const [liveProfile, setLiveProfile] = useState<PublicUserProfile | null>(() =>
    canLookupLive ? getCachedPublicProfile(cleanUid) : null
  );

  useEffect(() => {
    if (!canLookupLive) {
      setLiveProfile(null);
      return;
    }
    const cached = getCachedPublicProfile(cleanUid);
    if (cached) {
      setLiveProfile(cached);
    } else {
      void getPublicProfile(cleanUid)
        .then((prof) => {
          if (prof) setLiveProfile(prof);
        })
        .catch(() => {});
    }

    return subscribePublicProfile(cleanUid, (updated) => {
      setLiveProfile(updated);
    });
  }, [cleanUid, canLookupLive]);

  const size = normalizeAvatarSize(rawSize);
  const effectiveFrame =
    liveProfile?.equipped?.frame ||
    liveProfile?.equippedFrame ||
    liveProfile?.frame ||
    frame ||
    frameId ||
    equippedFrameId ||
    null;

  // Fallback order: 1. Equipped store or free system avatar -> 2. Profile avatar -> 3. Default matrix avatar
  const resolved = resolveUserAvatar(
    cleanUid,
    liveProfile?.equipped?.avatar,
    liveProfile?.equippedAvatar,
    equippedAvatar,
    equippedAvatarId,
    liveProfile?.avatar,
    liveProfile?.avatarUrl,
    avatarId,
    avatar,
    avatarKey,
    avatarUrl,
    customAvatarUrl
  );

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

  let innerAvatar: React.ReactNode;

  if (loading && resolved.type !== 'store') {
    innerAvatar = skeletonPlaceholder;
  } else if (resolved.type === 'store' && resolved.storeAvatarId) {
    innerAvatar = (
      <Suspense fallback={skeletonPlaceholder}>
        <LazyAvatarPicture
          avatarId={resolved.storeAvatarId}
          uid={resolved.uid}
          seed={resolved.uid}
          size={size}
          forceStatic={forceStatic}
          priority={priority ?? (size >= 56 ? 10 : 1)}
          className="w-full h-full object-cover rounded-full"
        />
      </Suspense>
    );
  } else {
    innerAvatar = (
      <MatrixAvatar
        uid={resolved.uid}
        seed={resolved.uid}
        avatarKey={resolved.matrixKey}
        variant={avatarVariant || resolved.matrixVariant}
        size={size}
        className="rounded-full"
      />
    );
  }

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


