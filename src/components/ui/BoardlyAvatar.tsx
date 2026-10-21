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
 * 2. avatarKey (Matrix dot avatar)
 * 3. avatarUrl (custom uploaded avatar image - if not broken)
 * 4. User's initials on a neutral circle (if no chosen avatar, or if image fails to load)
 *
 * Explicit rule: Never show Google photo instead of the chosen avatar.
 * Renders the equipped frame around the avatar if equipped.
 */
export const BoardlyAvatar: React.FC<BoardlyAvatarProps> = React.memo(({
  equippedAvatar,
  avatarUrl,
  frame,
  name = 'Student',
  size = 36,
  className = '',
  avatarKey,
  avatarVariant,
  forceStatic = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // 1. Check for Boardly equipped avatar (e.g. pfp_ or catalog cosmetic)
  const hasEquipped = Boolean(
    equippedAvatar &&
    equippedAvatar !== 'none' &&
    equippedAvatar !== '' &&
    (equippedAvatar.startsWith('pfp_') || getCosmeticById(equippedAvatar))
  );

  const cleanAvatarUrl = !imageError && avatarUrl && avatarUrl.trim() !== '' ? avatarUrl.trim() : null;
  const initial = (name && name.trim().length > 0 ? name.trim().charAt(0) : 'S').toUpperCase();

  // Avatar inner content based on priority
  let innerAvatar: React.ReactNode;

  if (hasEquipped) {
    // Priority 1: Boardly equipped avatar
    innerAvatar = (
      <AvatarPicture
        avatarId={equippedAvatar}
        size={size}
        forceStatic={forceStatic}
        className="w-full h-full object-cover rounded-full"
      />
    );
  } else if (avatarKey) {
    // Priority 2: Dot matrix avatar key
    innerAvatar = (
      <AvatarPicture
        avatarKey={avatarKey}
        avatarVariant={avatarVariant}
        size={size}
        className="w-full h-full rounded-full"
      />
    );
  } else if (cleanAvatarUrl) {
    // Priority 3: Custom avatar URL with safe error fallback
    innerAvatar = (
      <img
        src={cleanAvatarUrl}
        alt={name || 'Student'}
        loading="lazy"
        decoding="async"
        width={size}
        height={size}
        onError={() => setImageError(true)}
        className="w-full h-full object-cover rounded-full select-none"
      />
    );
  } else {
    // Priority 4: Fallback to user's initials on a neutral circle
    innerAvatar = (
      <div
        className="w-full h-full rounded-full bg-surface-muted border border-border flex items-center justify-center font-bold text-primary select-none"
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
});

export default BoardlyAvatar;
