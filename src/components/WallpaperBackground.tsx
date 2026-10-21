import React from 'react';
import { useWallpaper, type WallpaperId } from '@/hooks/useWallpaper';

/**
 * Thumbnail preview for the Settings wallpaper picker.
 * Rendered at 100% width and fixed aspect ratio.
 */
export function WallpaperThumbnail({
  id,
  selected = false,
  className = '',
}: {
  id: WallpaperId;
  selected?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full aspect-video rounded-xl overflow-hidden border transition-all ${
        selected ? 'border-[#D71921] ring-2 ring-[#D71921]/40' : 'border-[var(--border)] hover:border-white/30'
      } ${className}`}
      style={{ backgroundColor: '#050508' }}
    >
      {id === 'crimson-arc' && <CrimsonArcArtwork isThumbnail />}
      {id === 'ember-grid' && <EmberGridArtwork isThumbnail />}
      {id === 'midnight' && <MidnightArtwork isThumbnail />}
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />
    </div>
  );
}

/**
 * 1. "Crimson Arc" (default):
 * Near-black base (#050508), deep red radial glow, large concentric red arcs in corner,
 * thin curved circuit lines, faint dot-matrix grid.
 */
const CrimsonArcArtwork = React.memo(function CrimsonArcArtwork({ isThumbnail = false }: { isThumbnail?: boolean }) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#050508]">
      {/* Deep Red Radial Glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 88% 12%, rgba(215, 25, 33, 0.32) 0%, rgba(140, 15, 20, 0.16) 35%, transparent 70%), radial-gradient(circle at 15% 85%, rgba(180, 20, 25, 0.12) 0%, transparent 50%)',
        }}
      />

      {/* Inline Scalable SVG: Concentric Arcs, Circuit Lines & Dot Matrix */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Dot Matrix Pattern */}
          <pattern id="crimson-dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.05)" />
            <circle cx="18" cy="18" r="0.8" fill="rgba(215, 25, 33, 0.08)" />
          </pattern>

          {/* Glowing gradients for circuit lines */}
          <linearGradient id="arc-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D71921" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#8A0C12" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#D71921" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="line-glow-grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF333D" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#D71921" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#300508" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="glow-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4D55" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D71921" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dot Matrix Grid Layer */}
        <rect width="100%" height="100%" fill="url(#crimson-dot-grid)" opacity={isThumbnail ? 0.6 : 0.85} />

        {/* Concentric Red Arcs radiating from top-right corner */}
        <g stroke="url(#arc-glow-grad)" fill="none">
          <circle cx="1320" cy="80" r="140" strokeWidth="1.2" strokeDasharray="6 8" />
          <circle cx="1320" cy="80" r="220" strokeWidth="1.5" />
          <circle cx="1320" cy="80" r="320" strokeWidth="1.2" strokeOpacity="0.7" />
          <circle cx="1320" cy="80" r="440" strokeWidth="1" strokeDasharray="3 9" strokeOpacity="0.5" />
          <circle cx="1320" cy="80" r="580" strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx="1320" cy="80" r="740" strokeWidth="1" strokeDasharray="8 14" strokeOpacity="0.3" />
          <circle cx="1320" cy="80" r="920" strokeWidth="1.2" strokeOpacity="0.2" />
          <circle cx="1320" cy="80" r="1140" strokeWidth="0.8" strokeOpacity="0.15" />
        </g>

        {/* Thin Curved Circuit Traces with Interconnect Nodes */}
        <g stroke="url(#line-glow-grad)" strokeWidth="1" fill="none">
          {/* Main top arterial circuit */}
          <path d="M 1440 220 L 1180 220 C 1120 220 1080 260 1080 320 L 1080 440 C 1080 500 1040 540 980 540 L 720 540" />
          <path d="M 1240 80 L 1240 180 C 1240 240 1200 280 1140 280 L 920 280 C 860 280 820 320 820 380 L 820 620 L 560 620" />
          
          {/* Secondary branching traces */}
          <path d="M 1320 360 C 1220 360 1160 420 1160 520 L 1160 680 C 1160 740 1120 780 1060 780 L 840 780" strokeDasharray="4 6" />
          <path d="M 980 540 L 980 680 C 980 720 950 750 910 750 L 740 750" />
          <path d="M 680 80 L 680 160 C 680 200 650 230 610 230 L 420 230" strokeOpacity="0.35" />
        </g>

        {/* Glowing Circuit Node Terminals */}
        <g>
          <circle cx="720" cy="540" r="3.5" fill="#FF4D55" />
          <circle cx="720" cy="540" r="8" fill="url(#glow-node)" />

          <circle cx="560" cy="620" r="3" fill="#D71921" />
          <circle cx="560" cy="620" r="7" fill="url(#glow-node)" />

          <circle cx="840" cy="780" r="2.5" fill="#FF4D55" />
          <circle cx="740" cy="750" r="2.5" fill="#D71921" />
          <circle cx="420" cy="230" r="2" fill="#D71921" opacity="0.6" />

          <circle cx="1180" cy="220" r="2.5" fill="#D71921" />
          <circle cx="1140" cy="280" r="2.5" fill="#D71921" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 2. "Ember Grid":
 * Black (#050505) with a subtle red dot-matrix grid fading toward the edges.
 * Clean, technical, geometric, minimal.
 */
const EmberGridArtwork = React.memo(function EmberGridArtwork({ isThumbnail = false }: { isThumbnail?: boolean }) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#050505]">
      {/* Warm Ambient Ember Core */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(200, 25, 32, 0.16) 0%, rgba(100, 10, 15, 0.06) 45%, transparent 75%)',
        }}
      />

      {/* SVG Dot Matrix with Edge Vignette Mask */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="ember-dot-pattern" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="1.2" fill="#D71921" />
            <circle cx="2" cy="2" r="0.6" fill="rgba(255, 255, 255, 0.08)" />
          </pattern>

          {/* Mask that fades out sharply near all four edges */}
          <radialGradient id="grid-fade-mask" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <mask id="ember-mask">
            <rect width="100%" height="100%" fill="url(#grid-fade-mask)" />
          </mask>
        </defs>

        {/* Masked Grid Layer */}
        <rect
          width="100%"
          height="100%"
          fill="url(#ember-dot-pattern)"
          mask="url(#ember-mask)"
          opacity={isThumbnail ? 0.75 : 0.65}
        />

        {/* Subtle Horizontal & Vertical Guide Accents */}
        <g stroke="rgba(215, 25, 33, 0.1)" strokeWidth="0.8" fill="none">
          <line x1="0" y1="450" x2="1440" y2="450" strokeDasharray="6 12" />
          <line x1="720" y1="0" x2="720" y2="900" strokeDasharray="6 12" />
          <circle cx="720" cy="450" r="80" stroke="rgba(215, 25, 33, 0.15)" strokeWidth="1" />
          <circle cx="720" cy="450" r="160" stroke="rgba(215, 25, 33, 0.08)" strokeDasharray="4 8" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 3. "Midnight":
 * Near-black (#030305) with a very soft red vignette.
 * Deep, sleek, distraction-free.
 */
const MidnightArtwork = React.memo(function MidnightArtwork({ isThumbnail = false }: { isThumbnail?: boolean }) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#030305]">
      {/* Outer Velvety Crimson Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, #050508 40%, rgba(18, 4, 7, 0.85) 75%, rgba(160, 15, 24, 0.18) 100%)',
        }}
      />

      {/* Subtle Micro-Noise / Star-field dots for depth */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="midnight-dots" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.6" fill="rgba(255, 255, 255, 0.04)" />
            <circle cx="36" cy="36" r="0.5" fill="rgba(215, 25, 33, 0.07)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#midnight-dots)" opacity={isThumbnail ? 0.7 : 0.8} />
      </svg>
    </div>
  );
});

/**
 * Global Wallpaper Background layer rendered behind the app at all times.
 * Rendered at position: fixed; inset: 0; z-index: -1.
 * Dark overlay (~58%) ensures minimum 4.5:1 text contrast for all direct content.
 * Hardware-accelerated with contain: strict and zero offscreen blur compositing passes.
 */
export const WallpaperBackground = React.memo(function WallpaperBackground() {
  const { wallpaper } = useWallpaper();

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden"
      style={{
        zIndex: -1,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        contain: 'strict',
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      {/* Base Wallpaper SVG Artwork */}
      {wallpaper === 'crimson-arc' && <CrimsonArcArtwork />}
      {wallpaper === 'ember-grid' && <EmberGridArtwork />}
      {wallpaper === 'midnight' && <MidnightArtwork />}

      {/* 58% Dark Overlay to guarantee >= 4.5:1 text contrast for foreground text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.58)',
        }}
      />
    </div>
  );
});
