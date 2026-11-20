import React, { useState } from 'react';
import type { AiMentorId } from '@/utils/aiMentorsLogic';
import { getMentorCharacterProfile } from './mentorCharacterConfig';

interface MentorAvatarProps {
  mentorId: AiMentorId;
  size?: number;
  className?: string;
  ring?: boolean;
  active?: boolean;
  eager?: boolean;
  /** Hides the avatar visually while a FLIP fly-in clone is in mid-flight */
  hiddenForFlight?: boolean;
  /** Triggers a brief accent ring pulse right as the hero character docks */
  justDocked?: boolean;
}

/**
 * Static rendered portrait avatar used for small avatar slots (drawer, mentor cards,
 * saved chats, chat message bubbles) and reduced-motion/low-end fallback.
 */
export const MentorAvatar: React.FC<MentorAvatarProps> = ({
  mentorId,
  size = 32,
  className = '',
  ring = true,
  active = false,
  eager = false,
  hiddenForFlight = false,
  justDocked = false,
}) => {
  const profile = getMentorCharacterProfile(mentorId);
  const [imgError, setImgError] = useState(false);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none transition-opacity duration-150 ${
        justDocked ? 'ai-mentor-docked-pulse' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: '#141418',
        boxShadow: ring
          ? active
            ? `0 0 0 2px ${profile.accentHex}, 0 0 12px color-mix(in srgb, ${profile.accentHex} 45%, transparent)`
            : `0 0 0 1.5px color-mix(in srgb, ${profile.accentHex} 65%, transparent)`
          : undefined,
        opacity: hiddenForFlight ? 0 : 1,
        ['--mentor-accent' as any]: profile.accentHex,
      }}
      aria-hidden="true"
    >
      {!imgError ? (
        <img
          src={profile.avatarWebp}
          alt={profile.name}
          width={size}
          height={size}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-[12px] font-bold text-white"
          style={{ backgroundColor: profile.accentHex }}
        >
          {profile.name[0]}
        </span>
      )}
    </span>
  );
};
