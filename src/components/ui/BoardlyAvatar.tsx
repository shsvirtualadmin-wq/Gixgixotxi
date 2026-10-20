import React, { useState } from 'react';
import { AvatarPicture, AvatarFrame } from '@/components/koban/CosmeticRenderers';
import { getCosmeticById } from '@/data/cosmeticsCatalog';

export interface BoardlyAvatarProps {
  equippedAvatar?: string | null;
  avatarUrl?: string | null;
  photoURL?: string | null;
  frame?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  forceStatic?: boolean;
}

/**
 * SHARED USER AVATAR HELPER
 * Enforces strict avatar priority:
 * 1. equippedAvatar (Boardly catalog cosmetic ID or pfp_)
 * 2. avatarUrl (custom uploaded avatar image)
 * 3. photoURL (Google account photo)
 * 4. default (Matrix dot avatar or student initial)
 *
 * Renders the equipped frame around the avatar if equipped.
 * Used across Commons post headers, comments, and student profile page.
 */
export const BoardlyAvatar: React.FC<BoardlyAvatarProps> = ({
  equippedAvatar,
  avatarUrl,
  photoURL,
  frame,
  name = 'Student',
  size = 36,
  className = '',
  avatarKey,
  avatarVariant,
  forceStatic = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // 1. Resolve avatar source by priority
  const hasEquipped = Boolean(
    equippedAvatar &&
    equippedAvatar !== 'none' &&
    equippedAvatar !== '' &&
    (equippedAvatar.startsWith('pfp_') || getCosmeticById(equippedAvatar))
  );

  const cleanAvatarUrl = !imageError && avatarUrl && avatarUrl.trim() !== '' ? avatarUrl.trim() : null;
  const cleanPhotoURL = !imageError && photoURL && photoURL.trim() !== '' ? photoURL.trim() : null;

  const initial = (name && name.trim().length > 0 ? name.trim().charAt(0) : 'S').toUpperCase();

  // Avatar inner content based on priority
  let innerAvatar: React.ReactNode;

  if (hasEquipped) {
    // Priority 1: Boardly equipped avatar (e.g. Crimson Ronin pfp)
    innerAvatar = (
      <AvatarPicture
        avatarId={equippedAvatar}
        size={size}
        forceStatic={forceStatic}
        className="w-full h-full object-cover rounded-full"
      />
    );
  } else if (cleanAvatarUrl) {
    // Priority 2: Custom avatar URL
    innerAvatar = (
      <img
        src={cleanAvatarUrl}
        alt={name || 'Student'}
        onError={() => setImageError(true)}
        className="w-full h-full object-cover rounded-full select-none"
      />
    );
  } else if (cleanPhotoURL) {
    // Priority 3: Google account photo
    innerAvatar = (
      <img
        src={cleanPhotoURL}
        alt={name || 'Student'}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
        className="w-full h-full object-cover rounded-full select-none"
      />
    );
  } else if (avatarKey) {
    // Priority 4a: Dot matrix key
    innerAvatar = (
      <AvatarPicture
        avatarKey={avatarKey}
        avatarVariant={avatarVariant}
        size={size}
        className="w-full h-full rounded-full"
      />
    );
  } else {
    // Priority 4b: Stylized student initial letter
    innerAvatar = (
      <div
        className="w-full h-full rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center font-bold text-red-300 select-none"
        style={{ fontSize: Math.max(10, Math.floor(size * 0.42)) }}
      >
        {initial}
      </div>
    );
  }

  // If frame is equipped, calculate outer frame size and wrap
  const hasFrame = Boolean(frame && frame !== 'none' && frame !== '' && getCosmeticById(frame));

  if (hasFrame) {
    const frameSize = Math.round(size * 1.28);
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <AvatarFrame itemId={frame!} size={frameSize} forceStatic={forceStatic}>
          <div
            className="rounded-full overflow-hidden flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            {innerAvatar}
          </div>
        </AvatarFrame>
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
};
