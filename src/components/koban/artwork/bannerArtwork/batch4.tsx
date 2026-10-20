import React from 'react';

// BATCH 4: Banners 16 to 20
// 16. ban_starlit_observatory (Animated)
// 17. ban_autumn_momiji_shrine (Static)
// 18. ban_thunder_storm_peaks (Animated)
// 19. ban_sunflower_twilight (Static)
// 20. ban_crystal_cavern_depths (Animated)

export const BANNER_BATCH_4: Record<string, (animated: boolean) => React.ReactNode> = {
  // ─── 16. ban_starlit_observatory (Animated) ───────────────────────────────
  ban_starlit_observatory: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_observatory_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="60%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_observatory_sky)" />
      {/* Milky Way Diagonal Band */}
      <path d="M400 0 Q600 150 850 300 L900 300 L750 0 Z" fill="#818CF8" opacity="0.25" />
      {/* Mountain Crest Silhouette */}
      <polygon points="350,300 680,180 900,240 900,300" fill="#09090B" />
      {/* Observatory Dome (Right) */}
      <g transform="translate(680, 150)">
        <ellipse cx="40" cy="30" rx="35" ry="30" fill="#E2E8F0" />
        <line x1="40" y1="0" x2="40" y2="60" stroke="#0F172A" strokeWidth="4" />
        <rect x="5" y="30" width="70" height="30" fill="#94A3B8" />
        <rect x="0" y="55" width="80" height="15" fill="#475569" />
      </g>
      {/* Glittering Stars (Animated) */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '2.5s' }}>
        {[
          { x: 450, y: 60, r: 2 },
          { x: 520, y: 110, r: 3 },
          { x: 600, y: 40, r: 2.5 },
          { x: 740, y: 70, r: 3.5 },
          { x: 820, y: 50, r: 2 },
          { x: 650, y: 100, r: 2.5 },
        ].map((s, idx) => (
          <circle key={idx} cx={s.x} cy={s.y} r={s.r} fill="#FEF08A" />
        ))}
      </g>
    </svg>
  ),

  // ─── 17. ban_autumn_momiji_shrine (Static) ────────────────────────────────
  ban_autumn_momiji_shrine: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_momiji_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="50%" stopColor="#9A3412" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_momiji_sky)" />
      {/* Golden Sunset Wash */}
      <circle cx="700" cy="180" r="100" fill="#FEF08A" opacity="0.4" />
      {/* Wooden Shrine Roofline (Right) */}
      <g transform="translate(620, 100)">
        <polygon points="80,0 0,45 160,45" fill="#78350F" stroke="#451A03" strokeWidth="2" />
        <rect x="25" y="45" width="110" height="90" fill="#991B1B" />
        <rect x="45" y="60" width="70" height="75" fill="#18181B" />
      </g>
      {/* Momiji Red Maple Leaves Framing Top-Right */}
      <g transform="translate(550, 20)">
        {[
          { x: 80, y: 30, r: 24, c: '#DC2626' },
          { x: 140, y: 20, r: 30, c: '#EA580C' },
          { x: 200, y: 40, r: 28, c: '#DC2626' },
          { x: 260, y: 30, r: 32, c: '#B91C1C' },
          { x: 120, y: 65, r: 22, c: '#F59E0B' },
          { x: 180, y: 80, r: 26, c: '#DC2626' },
        ].map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={m.r} fill={m.c} opacity="0.85" />
        ))}
      </g>
    </svg>
  ),

  // ─── 18. ban_thunder_storm_peaks (Animated) ───────────────────────────────
  ban_thunder_storm_peaks: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_thunder_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0F19" />
          <stop offset="60%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_thunder_sky)" />
      {/* Dark Cumulonimbus Storm Clouds */}
      <circle cx="500" cy="90" r="90" fill="#0F172A" />
      <circle cx="620" cy="70" r="110" fill="#18181B" />
      <circle cx="750" cy="90" r="100" fill="#0F172A" />
      {/* Lightning Strike (Animated flash) */}
      <polyline
        points="650,60 620,130 660,150 600,230"
        stroke="#FEF08A"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        className={animated ? 'animate-pulse' : ''}
        style={{ animationDuration: '1.2s' }}
      />
      {/* Jagged Mountain Peak Base */}
      <polygon points="350,300 580,180 720,250 850,160 900,200 900,300" fill="#020617" />
    </svg>
  ),

  // ─── 19. ban_sunflower_twilight (Static) ──────────────────────────────────
  ban_sunflower_twilight: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_sunflower_twilight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#581C87" />
          <stop offset="45%" stopColor="#DB2777" />
          <stop offset="75%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
      </defs>
      <rect width="900" height="190" fill="url(#bg_sunflower_twilight)" />
      {/* Twilight Hill Horizon */}
      <rect x="0" y="190" width="900" height="110" fill="#14532D" />
      {/* Giant Sunflowers (Center-Right focused) */}
      {[
        { x: 500, y: 190, r: 24 },
        { x: 580, y: 175, r: 30 },
        { x: 670, y: 160, r: 36 },
        { x: 760, y: 175, r: 32 },
        { x: 840, y: 190, r: 26 },
      ].map((sf, i) => (
        <g key={i}>
          <line x1={sf.x} y1={sf.y} x2={sf.x} y2="300" stroke="#166534" strokeWidth="5" />
          <circle cx={sf.x} cy={sf.y} r={sf.r} fill="#FACC15" />
          <circle cx={sf.x} cy={sf.y} r={sf.r * 0.5} fill="#78350F" />
        </g>
      ))}
    </svg>
  ),

  // ─── 20. ban_crystal_cavern_depths (Animated) ─────────────────────────────
  ban_crystal_cavern_depths: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_cavern_dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="50%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_cavern_dark)" />
      {/* Hanging Stalactites Top */}
      <polygon points="400,0 430,70 460,0" fill="#1E293B" />
      <polygon points="560,0 600,100 640,0" fill="#0F172A" />
      <polygon points="740,0 770,80 800,0" fill="#1E293B" />
      {/* Glowing Cyan Crystal Clusters (Center-Right) */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '2s' }}>
        {[
          { x: 580, y: 220, h: 70, w: 20 },
          { x: 620, y: 200, h: 90, w: 24 },
          { x: 660, y: 215, h: 75, w: 22 },
          { x: 740, y: 230, h: 60, w: 18 },
          { x: 780, y: 210, h: 80, w: 22 },
        ].map((c, i) => (
          <polygon
            key={i}
            points={`${c.x},300 ${c.x - c.w / 2},${300 - c.h * 0.7} ${c.x},${300 - c.h} ${c.x + c.w / 2},${300 - c.h * 0.7}`}
            fill="#38BDF8"
            stroke="#00F0FF"
            strokeWidth="1.5"
            opacity="0.85"
          />
        ))}
      </g>
      {/* Cavern Pool Reflection */}
      <ellipse cx="680" cy="285" rx="160" ry="15" fill="#00F0FF" opacity="0.3" />
    </svg>
  ),
};
