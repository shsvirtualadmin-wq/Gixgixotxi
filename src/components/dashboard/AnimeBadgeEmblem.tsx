import React from 'react';
import type { AnimeBadge } from '@/constants/animeBadges';

interface AnimeBadgeEmblemProps {
  badge: AnimeBadge;
  isUnlocked?: boolean;
  size?: number;
  className?: string;
}

/**
 * Original SVG Emblem Renderer with dark neon / matrix UI aesthetic
 * Custom geometry for each of the 8 streak milestone tiers.
 */
export function AnimeBadgeEmblem({
  badge,
  isUnlocked = false,
  size = 64,
  className = '',
}: AnimeBadgeEmblemProps) {
  const accent = isUnlocked ? badge.accentColor : '#4b5563';
  const glow = isUnlocked ? badge.glowColor : 'transparent';
  const filterId = `glow-${badge.id}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 transition-transform duration-200 select-none ${className}`}
      style={{
        filter: isUnlocked ? `drop-shadow(0 0 8px ${glow})` : 'grayscale(1) opacity(0.35)',
      }}
    >
      <defs>
        <radialGradient id={`bg-${badge.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a24" />
          <stop offset="100%" stopColor="#0b0b10" />
        </radialGradient>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagonal Outer Frame */}
      <polygon
        points="50,4 92,26 92,74 50,96 8,74 8,26"
        fill={`url(#bg-${badge.id})`}
        stroke={accent}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Inner Glowing Hexagon Accent */}
      <polygon
        points="50,12 84,30 84,70 50,88 16,70 16,30"
        fill="none"
        stroke={accent}
        strokeWidth="1.2"
        strokeDasharray="4 2"
        opacity={isUnlocked ? 0.75 : 0.25}
      />

      {/* Tier 1: Initiation (3 Days - Soft Green Flame / Seed) */}
      {badge.id === 'initiation' && (
        <g transform="translate(50, 48)" filter={isUnlocked ? `url(#${filterId})` : undefined}>
          <path
            d="M0,-22 C8,-12 14,-4 14,6 C14,16 6,22 0,22 C-6,22 -14,16 -14,6 C-14,-4 -8,-12 0,-22 Z"
            fill={accent}
            opacity="0.9"
          />
          <circle cx="0" cy="8" r="4.5" fill="#ffffff" />
        </g>
      )}

      {/* Tier 2: Discipline (7 Days - Electric Blue Lightning Bolt) */}
      {badge.id === 'discipline' && (
        <g transform="translate(50, 48)" filter={isUnlocked ? `url(#${filterId})` : undefined}>
          <circle cx="0" cy="0" r="18" fill="none" stroke={accent} strokeWidth="2.5" />
          <path
            d="M-2,-20 L-8,0 L2,0 L-2,20 L10,-2 L0,-2 Z"
            fill={accent}
          />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>
      )}

      {/* Tier 3: Habit Locked (14 Days - Vivid Purple Dual Blades / Diamond) */}
      {badge.id === 'habit-locked' && (
        <g transform="translate(50, 48)" filter={isUnlocked ? `url(#${filterId})` : undefined}>
          <polygon points="0,-22 18,0 0,22 -18,0" fill="none" stroke={accent} strokeWidth="2.5" />
          <polygon points="0,-12 10,0 0,12 -10,0" fill={accent} />
          <circle cx="0" cy="0" r="3" fill="#ffffff" />
        </g>
      )}

      {/* Tier 4: Unstoppable (30 Days - Amber Gold Starburst Sun) */}
      {badge.id === 'unstoppable' && (
        <g transform="translate(50, 48)" filter={isUnlocked ? `url(#${filterId})` : undefined}>
          <path
            d="M0,-22 L5,-7 L20,-7 L8,3 L13,18 L0,9 L-13,18 L-8,3 L-20,-7 L-5,-7 Z"
            fill={accent}
            opacity="0.95"
          />
          <circle cx="0" cy="2" r="4" fill="#ffffff" />
        </g>
      )}

      {/* Tier 5: Master of Momentum (60 Days - Ruby Red Tri-Force Aura) */}
      {badge.id === 'master-of-momentum' && (
        <g transform="translate(50, 48)" filter={isUnlocked ? `url(#${filterId})` : undefined}>
          <polygon points="0,-24 20,12 -20,12" fill="none" stroke={accent} strokeWidth="3" />
          <polygon points="0,24 20,-12 -20,-12" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.6" />
          <circle cx="0" cy="0" r="7" fill={accent} />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>
      )}

      {/* Tier 6: Legend of Consistency (90 Days - Neon Cyan Cybernetic Core) */}
      {badge.id === 'legend-of-consistency' && (
        <g transform="translate(50, 48)" filter={isUnlocked ? `url(#${filterId})` : undefined}>
          <circle cx="0" cy="0" r="20" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="6 3" />
          <circle cx="0" cy="0" r="12" fill={accent} opacity="0.4" />
          <polygon points="0,-16 14,0 0,16 -14,0" fill={accent} />
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
        </g>
      )}

      {/* Tier 7: Ascendant (180 Days - Prismatic Iridescent Wings) */}
      {badge.id === 'ascendant' && (
        <g transform="translate(50, 48)" filter={isUnlocked ? `url(#${filterId})` : undefined}>
          <path
            d="M-22,10 C-18,-10 0,-22 0,-22 C0,-22 18,-10 22,10 C12,16 -12,16 -22,10 Z"
            fill={accent}
          />
          <circle cx="0" cy="-2" r="5" fill="#ffffff" />
          <path d="M-10,14 L0,22 L10,14" stroke={accent} strokeWidth="2.5" fill="none" />
        </g>
      )}

      {/* Tier 8: Eternal Vanguard (365 Days - Celestial White-Gold Crown) */}
      {badge.id === 'eternal-vanguard' && (
        <g transform="translate(50, 48)" filter={isUnlocked ? `url(#${filterId})` : undefined}>
          <path
            d="M-22,14 L-18,-10 L-8,0 L0,-24 L8,0 L18,-10 L22,14 Z"
            fill={accent}
          />
          <circle cx="-18" cy="-10" r="3" fill="#ffffff" />
          <circle cx="0" cy="-24" r="3.5" fill="#ffffff" />
          <circle cx="18" cy="-10" r="3" fill="#ffffff" />
          <ellipse cx="0" cy="7" rx="8" ry="3.5" fill="#0b0b10" />
        </g>
      )}

      {/* Days Label at the base of the emblem */}
      <text
        x="50"
        y="83"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fontFamily="sans-serif"
        fill={isUnlocked ? '#ffffff' : '#6b7280'}
        letterSpacing="0.05em"
      >
        {badge.days}D
      </text>
    </svg>
  );
}

export default AnimeBadgeEmblem;
