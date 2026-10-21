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
  isSuperAdmin?: boolean;
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
  name = 'Student',
  size = 36,
  className = '',
  avatarKey,
  avatarVariant,
  forceStatic = false,
  isSuperAdmin = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // 1. Check for Boardly equipped avatar (e.g. pfp_ or catalog cosmetic)
  const hasEquipped = Boolean(
    equippedAvatar &&
    equippedAvatar !== 'none' &&
    equippedAvatar !== '' &&
    (equippedAvatar.startsWith('pfp_') || getCosmeticById(equippedAvatar))
  );

  const rawUrl = avatarUrl || photoURL;
  const cleanAvatarUrl = !imageError && rawUrl && rawUrl.trim() !== '' ? rawUrl.trim() : null;
  const initial = (name && name.trim().length > 0 ? name.trim().charAt(0) : 'S').toUpperCase();

  // Avatar inner content based on priority
  let innerAvatar: React.ReactNode;

  if (hasEquipped) {
    // Priority 1: Boardly chosen cosmetic avatar
    innerAvatar = (
      <AvatarPicture
        avatarId={equippedAvatar}
        size={size}
        forceStatic={forceStatic}
        className="w-full h-full object-cover rounded-full"
      />
    );
  } else if (cleanAvatarUrl) {
    // Priority 2: Custom chosen avatar image with safe error fallback
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
  } else if (isSuperAdmin) {
    // Priority 3: Superadmin account (SHS Virtual Academy) shows Boardly / SHS logo
    innerAvatar = (
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
  } else {
    // Priority 4: User's initials on a neutral circle
    innerAvatar = (
      <div
        className="w-full h-full rounded-full bg-surface-muted border border-border flex items-center justify-center font-bold text-primary select-none font-sans"
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
