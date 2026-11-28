import React, { useEffect, useState } from 'react';
import { getMentorConfig, type AiMentorId } from '@/utils/aiMentorsLogic';

interface MentorAvatarProps {
  mentorId: AiMentorId;
  size?: number;
  className?: string;
  ring?: boolean;
  active?: boolean;
  eager?: boolean;
}

/**
 * Static WebP portrait avatar for Boardly AI Mentors (/ai/{noor,zen,seher,hamza,mahnur,aisha}.webp).
 * Uses explicit width/height, lazy loading by default, and a colored initial-letter circle fallback
 * if an image is missing or fails to load.
 */
export const MentorAvatar: React.FC<MentorAvatarProps> = ({
  mentorId,
  size = 32,
  className = '',
  ring = true,
  active = false,
  eager = false,
}) => {
  const mentor = getMentorConfig(mentorId);
  const [imgError, setImgError] = useState(false);

  // Reset image error state whenever mentor changes so switching mentors always loads cleanly
  useEffect(() => {
    setImgError(false);
  }, [mentor.id, mentor.avatar]);

  const initial = (mentor.name || 'A').charAt(0).toUpperCase();
  const initialFontSize = Math.max(11, Math.round(size * 0.42));

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: imgError ? mentor.accent : 'color-mix(in srgb, var(--card) 85%, #0d0d12)',
        boxShadow: ring
          ? active
            ? `0 0 0 2px ${mentor.accent}, 0 0 12px color-mix(in srgb, ${mentor.accent} 42%, transparent)`
            : `0 0 0 1.5px color-mix(in srgb, ${mentor.accent} 62%, transparent)`
          : undefined,
      }}
      aria-hidden="true"
    >
      {!imgError && mentor.avatar ? (
        <img
          src={mentor.avatar}
          alt={mentor.name}
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
          className="flex h-full w-full items-center justify-center font-bold text-white leading-none"
          style={{
            backgroundColor: mentor.accent,
            fontSize: `${initialFontSize}px`,
          }}
        >
          {initial}
        </span>
      )}
    </span>
  );
};
