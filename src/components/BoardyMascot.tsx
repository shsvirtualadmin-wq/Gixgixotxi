import React from 'react';

interface BoardyMascotProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  withSparkle?: boolean;
}

const PRESET_SIZES: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 24,
  md: 40,
  lg: 64,
  xl: 120,
};

export const BoardyMascot: React.FC<BoardyMascotProps> = ({
  size = 'md',
  animated = false,
  className = '',
  withSparkle = false,
}) => {
  const pixelSize = typeof size === 'number' ? size : PRESET_SIZES[size] || 40;

  return (
    <div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${
        animated ? 'hover:scale-110 transition-transform duration-300' : ''
      } ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label="Boardy the study partner"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Indigo to Violet Gradient */}
          <linearGradient id="boardyGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Screen / Page Inner Glow */}
          <linearGradient id="boardyFaceGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
          </linearGradient>

          {/* Bookmark Tag Gradient */}
          <linearGradient id="boardyBookmark" x1="68" y1="4" x2="78" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Notebook Top Bookmark Ribbon */}
        <path
          d="M68 6H80V24L74 20L68 24V6Z"
          fill="url(#boardyBookmark)"
        />

        {/* Outer Board/Notebook Body with Smooth Rounded Corners */}
        <rect
          x="12"
          y="10"
          width="76"
          height="80"
          rx="18"
          fill="url(#boardyGrad)"
        />

        {/* Notebook Left Spine / Binding accent line */}
        <rect
          x="12"
          y="10"
          width="11"
          height="80"
          rx="5"
          fill="#4338CA"
          opacity="0.5"
        />

        {/* Binding stitch/clip rings */}
        <circle cx="17.5" cy="26" r="2.2" fill="#FFFFFF" opacity="0.65" />
        <circle cx="17.5" cy="50" r="2.2" fill="#FFFFFF" opacity="0.65" />
        <circle cx="17.5" cy="74" r="2.2" fill="#FFFFFF" opacity="0.65" />

        {/* Inner Screen / Soft Display Surface */}
        <rect
          x="27"
          y="18"
          width="54"
          height="64"
          rx="12"
          fill="url(#boardyFaceGrad)"
        />

        {/* Cute Face: Left Eye */}
        <circle cx="44" cy="46" r="4.8" fill="#FFFFFF" />
        <circle cx="45.5" cy="44.5" r="1.8" fill="#0A1330" />
        <circle cx="43" cy="47.5" r="0.8" fill="#FFFFFF" />

        {/* Cute Face: Right Eye */}
        <circle cx="64" cy="46" r="4.8" fill="#FFFFFF" />
        <circle cx="65.5" cy="44.5" r="1.8" fill="#0A1330" />
        <circle cx="63" cy="47.5" r="0.8" fill="#FFFFFF" />

        {/* Soft Rosy Cheeks */}
        <ellipse cx="38" cy="53" rx="3.5" ry="2" fill="#F472B6" opacity="0.55" />
        <ellipse cx="70" cy="53" rx="3.5" ry="2" fill="#F472B6" opacity="0.55" />

        {/* Sweet Curved Smile */}
        <path
          d="M50 54 Q54 60 58 54"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Subtle top-left gloss/shine highlight */}
        <path
          d="M32 22 Q48 18 64 22"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>

      {/* Optional Sparkle Badge */}
      {withSparkle && (
        <span
          className="absolute -top-1 -right-1 flex h-3 w-3"
          aria-hidden="true"
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>
      )}
    </div>
  );
};
