import React from 'react';

// BATCH 2: Banners 6 to 10
// 6. ban_temple_bell_snow (Static)
// 7. ban_firefly_meadow (Animated)
// 8. ban_desert_giant_moon (Static)
// 9. ban_volcano_ember_sky (Animated)
// 10. ban_paper_crane_sky (Animated)

export const BANNER_BATCH_2: Record<string, (animated: boolean) => React.ReactNode> = {
  // ─── 6. ban_temple_bell_snow (Static) ─────────────────────────────────────
  ban_temple_bell_snow: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_snow_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="60%" stopColor="#334155" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_snow_sky)" />
      {/* Snow-covered ground */}
      <rect x="0" y="210" width="900" height="90" fill="#F8FAFC" />
      <path d="M0 210 Q250 190 500 210 T900 195 L900 220 L0 220 Z" fill="#E2E8F0" />
      {/* Winter Pagoda Roof (Right) */}
      <g transform="translate(620, 80)">
        <polygon points="100,0 20,40 180,40" fill="#334155" />
        <path d="M20 40 Q100 25 180 40" stroke="#F8FAFC" strokeWidth="8" fill="none" strokeLinecap="round" /> {/* Snow blanket */}
        <polygon points="100,50 40,85 160,85" fill="#334155" />
        <path d="M40 85 Q100 70 160 85" stroke="#F8FAFC" strokeWidth="8" fill="none" strokeLinecap="round" />
        <rect x="70" y="85" width="60" height="90" fill="#1E293B" />
      </g>
      {/* Ancient Temple Bell Pavilion (Center) */}
      <g transform="translate(440, 110)">
        <polygon points="60,0 0,30 120,30" fill="#0F172A" />
        <path d="M0 30 Q60 15 120 30" stroke="#FFFFFF" strokeWidth="6" fill="none" />
        <rect x="15" y="30" width="6" height="80" fill="#78350F" />
        <rect x="99" y="30" width="6" height="80" fill="#78350F" />
        {/* Bronze Bell */}
        <ellipse cx="60" cy="50" rx="16" ry="6" fill="#D97706" />
        <path d="M44 50 C44 75 38 95 35 100 L85 100 C82 95 76 75 76 50 Z" fill="#B45309" />
      </g>
      {/* Snow-dusted Pine branches */}
      <g transform="translate(780, 160)">
        <polygon points="40,0 0,40 80,40" fill="#14532D" />
        <path d="M0 40 Q40 30 80 40" stroke="#FFFFFF" strokeWidth="4" fill="none" />
      </g>
    </svg>
  ),

  // ─── 7. ban_firefly_meadow (Animated) ─────────────────────────────────────
  ban_firefly_meadow: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_meadow_night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="60%" stopColor="#064E3B" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_meadow_night)" />
      {/* Distant crescent moon & stars */}
      <circle cx="780" cy="60" r="22" fill="#FEF08A" opacity="0.8" />
      {/* Tall Grass & Wildflowers Reeds */}
      <g transform="translate(0, 180)">
        {[...Array(24)].map((_, i) => (
          <path
            key={i}
            d={`M${i * 38 + 20} 120 Q${i * 38 + 40} 40 ${i * 38 + (i % 2 === 0 ? 55 : 25)} 0`}
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        ))}
      </g>
      {/* Firefly orbs with pulsing glows (Center-Right focused) */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '2s' }}>
        {[
          { x: 480, y: 140, r: 4 },
          { x: 550, y: 110, r: 5 },
          { x: 620, y: 170, r: 4.5 },
          { x: 690, y: 120, r: 6 },
          { x: 760, y: 160, r: 4 },
          { x: 820, y: 130, r: 5 },
          { x: 590, y: 80, r: 3.5 },
          { x: 710, y: 70, r: 4 },
        ].map((f, i) => (
          <g key={i}>
            <circle cx={f.x} cy={f.y} r={f.r * 2.8} fill="#FDE047" opacity="0.3" />
            <circle cx={f.x} cy={f.y} r={f.r} fill="#FEF08A" />
          </g>
        ))}
      </g>
    </svg>
  ),

  // ─── 8. ban_desert_giant_moon (Static) ────────────────────────────────────
  ban_desert_giant_moon: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_desert_night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="50%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id="bg_dune_sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="50%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_desert_night)" />
      {/* Colossal Luminous Full Moon (Right) */}
      <circle cx="700" cy="110" r="85" fill="#FEF3C7" />
      <circle cx="700" cy="110" r="120" fill="#FDE68A" opacity="0.2" />
      {/* Distant Dunes Wave */}
      <path d="M200 240 Q450 170 700 220 T900 180 L900 300 L200 300 Z" fill="#78350F" opacity="0.7" />
      {/* Foreground Sweeping Dune */}
      <path d="M0 240 Q350 180 650 250 T900 210 L900 300 L0 300 Z" fill="url(#bg_dune_sand)" />
      {/* Desert Caravan Silhouette (Small, Center-Right) */}
      <g transform="translate(560, 215) scale(0.7)">
        <ellipse cx="40" cy="20" rx="14" ry="10" fill="#1C1917" />
        <circle cx="55" cy="12" r="6" fill="#1C1917" />
        <ellipse cx="80" cy="22" rx="12" ry="9" fill="#1C1917" />
        <circle cx="93" cy="15" r="5" fill="#1C1917" />
      </g>
    </svg>
  ),

  // ─── 9. ban_volcano_ember_sky (Animated) ──────────────────────────────────
  ban_volcano_ember_sky: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_volcano_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#450A0A" />
          <stop offset="50%" stopColor="#7F1D1D" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_volcano_sky)" />
      {/* Volcanic Mountain Silhouette with Crater Glow (Center-Right) */}
      <polygon points="350,300 620,110 880,300" fill="#18181B" />
      <ellipse cx="620" cy="112" rx="35" ry="10" fill="#EF4444" />
      <ellipse cx="620" cy="112" rx="20" ry="6" fill="#FEF08A" />
      {/* Lava flow fissures */}
      <path d="M620 115 Q600 170 580 230 Q590 270 570 300" stroke="#F97316" strokeWidth="3" fill="none" />
      <path d="M635 115 Q660 160 670 210 Q655 250 670 300" stroke="#EF4444" strokeWidth="2.5" fill="none" />
      {/* Rising Hot Magma Embers */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '1.8s' }}>
        {[
          { x: 560, y: 140 },
          { x: 600, y: 80 },
          { x: 640, y: 60 },
          { x: 680, y: 90 },
          { x: 720, y: 130 },
          { x: 630, y: 35 },
          { x: 590, y: 50 },
        ].map((emb, i) => (
          <circle key={i} cx={emb.x} cy={emb.y} r={i % 2 === 0 ? 3 : 2} fill="#FEF08A" />
        ))}
      </g>
    </svg>
  ),

  // ─── 10. ban_paper_crane_sky (Animated) ───────────────────────────────────
  ban_paper_crane_sky: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_crane_dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#F472B6" />
          <stop offset="80%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_crane_dawn)" />
      {/* Layer 2: Morning Cloud Puffs */}
      <ellipse cx="680" cy="220" rx="180" ry="50" fill="#FFFFFF" opacity="0.35" />
      <ellipse cx="480" cy="240" rx="140" ry="40" fill="#FFFFFF" opacity="0.25" />
      {/* Layer 3: Soaring Origami Cranes in V-formation (Center to Right) */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '3s' }}>
        {[
          { x: 650, y: 100, s: 1.2 },
          { x: 560, y: 140, s: 0.9 },
          { x: 740, y: 130, s: 1.0 },
          { x: 480, y: 170, s: 0.75 },
          { x: 810, y: 160, s: 0.8 },
        ].map((c, idx) => (
          <g key={idx} transform={`translate(${c.x}, ${c.y}) scale(${c.s})`}>
            <polygon points="0,0 12,18 -12,18" fill="#FFFBEB" />
            <polygon points="-12,8 -36,-6 -6,16" fill="#FEF08A" />
            <polygon points="12,8 36,-6 6,16" fill="#FFFFFF" />
          </g>
        ))}
      </g>
    </svg>
  ),
};
