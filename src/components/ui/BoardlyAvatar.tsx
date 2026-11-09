import React, { lazy, Suspense } from 'react';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { getDefaultAvatar, type MatrixAvatarVariant } from '@/lib/matrixAvatarsData';

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
 * Resolves a store-bought cosmetic ID (avatar or frame) from a raw value.
 * Handles direct catalog IDs (`pfp_pixel_pop_arcade`, `eclipse-wyrm`, `frame-topper-burst`),
 * legacy ID aliases (`pfp_eclipse_wyrm`), and store asset paths (`/assets/store/pfp_.../poster.webp`).
 * Rejects Google/external photo URLs, matrix avatar keys (`skull-01`), and unknown strings.
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
 * 1. If the user has bought or equipped a valid store avatar, return that store avatar ID.
 * 2. Otherwise, return the deterministic default matrix avatar seeded strictly by `uid`.
 * 3. Never return or expose a Google/Gmail photo URL.
 */
export function resolveUserAvatar(
  uid?: string | null,
  ...avatarCandidates: Array<string | null | undefined>
): ResolvedUserAvatar {
  const cleanUid = typeof uid === 'string' ? uid.trim() : '';
  const matrix = getDefaultAvatar(cleanUid);

  for (const cand of avatarCandidates) {
    const storeAvatarId = resolveCosmeticItemId(cand, 'avatar');
    if (storeAvatarId) {
      return {
        type: 'store',
        storeAvatarId,
        uid: cleanUid,
        matrixKey: matrix.key,
        matrixVariant: matrix.variant,
      };
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
 * Enforces ONE rule everywhere:
 * 1. If the user has bought or equipped a store avatar, show that avatar.
 * 2. Otherwise show the deterministic default matrix avatar seeded strictly from `uid`.
 * 3. NEVER show the Google / Gmail profile photo or letter initials anywhere in the app.
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
  forceStatic = false,
  priority,
  loading = false,
  avatarId,
  equippedAvatarId,
  frameId,
  equippedFrameId,
}) => {
  const size = normalizeAvatarSize(rawSize);
  const effectiveFrame = frame || frameId || equippedFrameId || null;

  const resolved = resolveUserAvatar(
    uid,
    equippedAvatar,
    equippedAvatarId,
    avatarId,
    avatar,
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


