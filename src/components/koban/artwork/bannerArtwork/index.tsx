import React from 'react';
import { BANNER_BATCH_1 } from './batch1';
import { BANNER_BATCH_2 } from './batch2';
import { BANNER_BATCH_3 } from './batch3';
import { BANNER_BATCH_4 } from './batch4';
import { BANNER_BATCH_5 } from './batch5';

export const BANNER_ARTWORK_MAP: Record<string, (animated: boolean) => React.ReactNode> = {
  ...BANNER_BATCH_1,
  ...BANNER_BATCH_2,
  ...BANNER_BATCH_3,
  ...BANNER_BATCH_4,
  ...BANNER_BATCH_5,
};

export const ACCENT_PRESETS = [
  { id: 'boardly-red', label: 'Boardly Red', hex: '#D71921' },
  { id: 'crimson-ember', label: 'Crimson Ember', hex: '#EF4444' },
  { id: 'cyber-cyan', label: 'Cyber Cyan', hex: '#00F0FF' },
  { id: 'electric-gold', label: 'Electric Gold', hex: '#F59E0B' },
  { id: 'sakura-pink', label: 'Sakura Pink', hex: '#F472B6' },
  { id: 'emerald-jade', label: 'Emerald Jade', hex: '#10B981' },
  { id: 'cosmic-violet', label: 'Cosmic Violet', hex: '#A855F7' },
  { id: 'deep-indigo', label: 'Deep Indigo', hex: '#6366F1' },
];

export interface BannerRendererProps {
  bannerId?: string | null;
  accentColor?: string | null;
  animated?: boolean;
  className?: string;
}

export const DefaultDotMatrixBanner: React.FC<{ accentColor?: string | null; className?: string }> = ({
  accentColor = '#D71921',
  className = '',
}) => {
  const safeColor = accentColor || '#D71921';
  return (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 ${className}`}>
      {/* Background Dot-Matrix Grid */}
      <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full opacity-85">
        <defs>
          <pattern id="default_dot_matrix" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill={safeColor} opacity="0.3" />
          </pattern>
          <linearGradient id="matrix_tint_fade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0.95" />
            <stop offset="60%" stopColor={safeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect width="900" height="300" fill="#0A0A0A" />
        <rect width="900" height="300" fill="url(#default_dot_matrix)" />
        <rect width="900" height="300" fill="url(#matrix_tint_fade)" />
        {/* Subtle geometric line details */}
        <line x1="0" y1="298" x2="900" y2="298" stroke={safeColor} strokeWidth="2" opacity="0.4" />
        <circle cx="850" cy="50" r="60" fill="none" stroke={safeColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
      </svg>
    </div>
  );
};

export const BannerRenderer: React.FC<BannerRendererProps> = ({
  bannerId,
  accentColor,
  animated = false,
  className = '',
}) => {
  if (bannerId && BANNER_ARTWORK_MAP[bannerId]) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        {BANNER_ARTWORK_MAP[bannerId](animated)}
      </div>
    );
  }

  return <DefaultDotMatrixBanner accentColor={accentColor} className={className} />;
};
