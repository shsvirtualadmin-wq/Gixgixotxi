import React from 'react';

// BATCH 5: Banners 21 to 25
// 21. ban_zen_rock_garden (Static)
// 22. ban_torii_ocean_gate (Animated)
// 23. ban_deep_space_nebula (Animated)
// 24. ban_pine_cliff_moonrise (Static)
// 25. ban_spectral_lotus_river (Animated)

export const BANNER_BATCH_5: Record<string, (animated: boolean) => React.ReactNode> = {
  // ─── 21. ban_zen_rock_garden (Static) ─────────────────────────────────────
  ban_zen_rock_garden: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_zen_wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      {/* Background Clay Wall */}
      <rect width="900" height="150" fill="url(#bg_zen_wall)" />
      {/* Wooden roof trim on wall */}
      <rect x="0" y="140" width="900" height="15" fill="#1C1917" />
      {/* Raked White Sand Garden Floor */}
      <rect x="0" y="155" width="900" height="145" fill="#E2E8F0" />
      {/* Concentric Raked Sand Curves around Rocks */}
      <ellipse cx="680" cy="225" rx="160" ry="50" fill="none" stroke="#CBD5E1" strokeWidth="2.5" />
      <ellipse cx="680" cy="225" rx="120" ry="38" fill="none" stroke="#CBD5E1" strokeWidth="2.5" />
      <ellipse cx="680" cy="225" rx="80" ry="26" fill="none" stroke="#CBD5E1" strokeWidth="2.5" />
      {/* Mossy Zen Stone Island (Right) */}
      <ellipse cx="680" cy="225" rx="50" ry="20" fill="#15803D" />
      <polygon points="650,225 670,180 700,225" fill="#475569" />
      <polygon points="685,225 705,195 725,225" fill="#334155" />
    </svg>
  ),

  // ─── 22. ban_torii_ocean_gate (Animated) ──────────────────────────────────
  ban_torii_ocean_gate: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_torii_sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="60%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
      </defs>
      <rect width="900" height="190" fill="url(#bg_torii_sea)" />
      <rect x="0" y="190" width="900" height="110" fill="#075985" />
      {/* Water Horizon Line & gentle waves (Animated) */}
      <path
        d="M0 190 Q225 185 450 190 T900 190"
        stroke="#38BDF8"
        strokeWidth="3"
        fill="none"
        className={animated ? 'animate-pulse' : ''}
        style={{ animationDuration: '2.5s' }}
      />
      {/* Floating Red Torii Gate (Right) */}
      <g transform="translate(640, 80)">
        {/* Upper curved Kasagi */}
        <path d="M-20 20 C40 8 100 8 160 20 L168 32 C100 22 40 22 -28 32 Z" fill="#DC2626" />
        {/* Nuki Crossbeam */}
        <rect x="0" y="55" width="140" height="10" fill="#B91C1C" />
        {/* Pillars submerged in water */}
        <rect x="25" y="32" width="14" height="140" fill="#991B1B" />
        <rect x="101" y="32" width="14" height="140" fill="#991B1B" />
        {/* Water reflection */}
        <ellipse cx="70" cy="175" rx="50" ry="10" fill="#DC2626" opacity="0.35" />
      </g>
    </svg>
  ),

  // ─── 23. ban_deep_space_nebula (Animated) ─────────────────────────────────
  ban_deep_space_nebula: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <radialGradient id="bg_nebula_cloud1" cx="70%" cy="45%" r="45%">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#030712" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg_nebula_cloud2" cx="50%" cy="60%" r="40%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#030712" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="900" height="300" fill="#030712" />
      {/* Billowing Cosmic Nebula Dust Clouds */}
      <ellipse cx="650" cy="140" rx="260" ry="120" fill="url(#bg_nebula_cloud1)" />
      <ellipse cx="480" cy="170" rx="220" ry="100" fill="url(#bg_nebula_cloud2)" />
      {/* Shimmering Star Cluster (Animated) */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '2s' }}>
        {[
          { x: 580, y: 120, r: 3 },
          { x: 640, y: 90, r: 4 },
          { x: 720, y: 150, r: 3.5 },
          { x: 790, y: 100, r: 2.5 },
          { x: 500, y: 180, r: 3 },
          { x: 440, y: 140, r: 2 },
          { x: 670, y: 170, r: 5 },
        ].map((s, idx) => (
          <g key={idx}>
            <circle cx={s.x} cy={s.y} r={s.r * 2.5} fill="#FFFFFF" opacity="0.3" />
            <circle cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" />
          </g>
        ))}
      </g>
    </svg>
  ),

  // ─── 24. ban_pine_cliff_moonrise (Static) ─────────────────────────────────
  ban_pine_cliff_moonrise: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_pine_night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="60%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_pine_night)" />
      {/* Colossal Luminous Moon (Right) */}
      <circle cx="720" cy="120" r="75" fill="#F8FAFC" />
      <circle cx="720" cy="120" r="110" fill="#E2E8F0" opacity="0.15" />
      {/* Rocky Cliff Outcropping (Right to Center) */}
      <polygon points="500,300 680,180 900,220 900,300" fill="#09090B" />
      {/* Gnarled Windswept Pine Silhouette Framing Moon */}
      <g transform="translate(680, 180)">
        <path d="M0 0 C-40 -40 -30 -90 -80 -120" stroke="#09090B" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M-40 -50 C-10 -70 10 -60 20 -90" stroke="#09090B" strokeWidth="5" fill="none" />
        {/* Pine needle puffs */}
        <circle cx="-80" cy="-120" r="28" fill="#09090B" />
        <circle cx="-60" cy="-105" r="22" fill="#09090B" />
        <circle cx="20" cy="-90" r="24" fill="#09090B" />
      </g>
    </svg>
  ),

  // ─── 25. ban_spectral_lotus_river (Animated) ──────────────────────────────
  ban_spectral_lotus_river: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_lotus_river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="50%" stopColor="#1C2541" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_lotus_river)" />
      {/* Glowing Riverbed winding through mist */}
      <path d="M300 300 Q550 200 700 160 T900 120 L900 300 Z" fill="#042F2E" opacity="0.7" />
      {/* Floating Glowing Cyan Lotus Blossoms (Animated) */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '3s' }}>
        {[
          { x: 500, y: 240, s: 1.2 },
          { x: 620, y: 210, s: 1.0 },
          { x: 740, y: 175, s: 0.8 },
          { x: 820, y: 140, s: 0.65 },
        ].map((lotus, idx) => (
          <g key={idx} transform={`translate(${lotus.x}, ${lotus.y}) scale(${lotus.s})`}>
            {/* Lotus Pad */}
            <ellipse cx="0" cy="8" rx="28" ry="8" fill="#065F46" />
            {/* Luminous Lotus Petals */}
            <path d="M0 6 C-12 -12 0 -24 0 -24 C0 -24 12 -12 0 6 Z" fill="#67E8F9" />
            <path d="M-6 6 C-20 -4 -12 -18 -12 -18 C-12 -18 -2 -10 -6 6 Z" fill="#38BDF8" />
            <path d="M6 6 C20 -4 12 -18 12 -18 C12 -18 2 -10 6 6 Z" fill="#38BDF8" />
            <circle cx="0" cy="-2" r="3" fill="#FFFFFF" />
          </g>
        ))}
      </g>
    </svg>
  ),
};
