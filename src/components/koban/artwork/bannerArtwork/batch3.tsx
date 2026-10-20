import React from 'react';

// BATCH 3: Banners 11 to 15
// 11. ban_neon_alley_dusk (Animated)
// 12. ban_misty_mountain_ridges (Static)
// 13. ban_celestial_aurora_fjord (Animated)
// 14. ban_golden_koi_pond (Animated)
// 15. ban_wisteria_cascade (Static)

export const BANNER_BATCH_3: Record<string, (animated: boolean) => React.ReactNode> = {
  // ─── 11. ban_neon_alley_dusk (Animated) ───────────────────────────────────
  ban_neon_alley_dusk: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_cyber_alley" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#09090B" />
          <stop offset="50%" stopColor="#18181B" />
          <stop offset="100%" stopColor="#09090B" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_cyber_alley)" />
      {/* Perspective Buildings */}
      <polygon points="450,140 900,0 900,300 450,220" fill="#18181B" />
      <polygon points="350,140 0,0 0,300 350,220" fill="#09090B" />
      {/* Wet Street Reflections */}
      <polygon points="350,220 450,220 900,300 0,300" fill="#0A0A0A" />
      {/* Glowing Neon Signs on Right Facade */}
      <g transform="translate(620, 80)">
        <rect x="0" y="0" width="12" height="120" rx="3" fill="#F43F5E" className={animated ? 'animate-pulse' : ''} />
        <rect x="60" y="30" width="10" height="90" rx="2" fill="#00F0FF" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.5s' }} />
        <circle cx="120" cy="80" r="18" fill="none" stroke="#FBBF24" strokeWidth="3" />
      </g>
      {/* Puddle reflections */}
      <ellipse cx="600" cy="260" rx="80" ry="14" fill="#F43F5E" opacity="0.35" />
      <ellipse cx="480" cy="270" rx="60" ry="10" fill="#00F0FF" opacity="0.3" />
    </svg>
  ),

  // ─── 12. ban_misty_mountain_ridges (Static) ───────────────────────────────
  ban_misty_mountain_ridges: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_ridge_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="60%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_ridge_sky)" />
      {/* Layer 2: Distant Ridge 1 */}
      <polygon points="300,300 480,120 720,240 900,160 900,300" fill="#64748B" opacity="0.4" />
      {/* Layer 3: Mist Bank */}
      <ellipse cx="600" cy="220" rx="300" ry="40" fill="#FFFFFF" opacity="0.75" />
      {/* Layer 4: Mid Ridge 2 */}
      <polygon points="150,300 380,150 640,280 820,180 900,240 900,300" fill="#334155" opacity="0.7" />
      {/* Layer 5: Foreground Dark Peak (Right) */}
      <polygon points="450,300 680,140 900,300" fill="#0F172A" />
      {/* Lone Pine on Peak */}
      <g transform="translate(680, 110)">
        <line x1="0" y1="0" x2="0" y2="30" stroke="#0F172A" strokeWidth="4" />
        <polygon points="0,-10 -15,10 15,10" fill="#0F172A" />
      </g>
    </svg>
  ),

  // ─── 13. ban_celestial_aurora_fjord (Animated) ────────────────────────────
  ban_celestial_aurora_fjord: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_fjord_night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="60%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="bg_aurora_ribbon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_fjord_night)" />
      {/* Layer 2: Swirling Polar Aurora Curtains (Animated) */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '4s' }}>
        <path d="M200 40 Q450 0 700 60 T900 20 L900 140 Q650 180 400 120 Z" fill="url(#bg_aurora_ribbon)" opacity="0.6" />
        <path d="M300 70 Q550 30 800 90 L800 160 Q550 120 300 150 Z" fill="#10B981" opacity="0.35" />
      </g>
      {/* Layer 3: Fjord Water Mirror (Bottom) */}
      <rect x="0" y="200" width="900" height="100" fill="#030712" />
      <polygon points="400,200 650,200 800,300 300,300" fill="#06B6D4" opacity="0.25" />
      {/* Layer 4: Mountain Crags Flanking Fjord */}
      <polygon points="0,200 150,110 320,200" fill="#0F172A" />
      <polygon points="620,200 780,100 900,200 900,300 620,300" fill="#0F172A" />
    </svg>
  ),

  // ─── 14. ban_golden_koi_pond (Animated) ───────────────────────────────────
  ban_golden_koi_pond: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_pond_water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="60%" stopColor="#042F2E" />
          <stop offset="100%" stopColor="#021C16" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_pond_water)" />
      {/* Lily Pads scattered (Center-Right focused) */}
      {[
        { x: 480, y: 120, r: 35 },
        { x: 620, y: 180, r: 42 },
        { x: 740, y: 90, r: 30 },
        { x: 810, y: 160, r: 38 },
        { x: 560, y: 220, r: 28 },
      ].map((lp, i) => (
        <g key={i}>
          <circle cx={lp.x} cy={lp.y} r={lp.r} fill="#059669" />
          <circle cx={lp.x} cy={lp.y} r={lp.r * 0.9} fill="#10B981" />
          <polygon points={`${lp.x},${lp.y} ${lp.x + lp.r},${lp.y - 8} ${lp.x + lp.r},${lp.y + 8}`} fill="#042F2E" />
        </g>
      ))}
      {/* Golden Koi swimming under ripples */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '3s' }} transform="translate(660, 130)">
        <path d="M-40 0 C-20 -15 20 -15 40 0 C20 15 -20 15 -40 0 Z" fill="#F59E0B" />
        <polygon points="40,0 55,-10 50,0 55,10" fill="#EA580C" />
      </g>
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '2.5s', animationDelay: '0.8s' }} transform="translate(540, 160) rotate(-35)">
        <path d="M-30 0 C-15 -10 15 -10 30 0 C15 10 -15 10 -30 0 Z" fill="#FEF08A" />
        <polygon points="30,0 42,-8 38,0 42,8" fill="#F59E0B" />
      </g>
    </svg>
  ),

  // ─── 15. ban_wisteria_cascade (Static) ────────────────────────────────────
  ban_wisteria_cascade: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_wisteria_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="50%" stopColor="#2E1065" />
          <stop offset="100%" stopColor="#3B0764" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_wisteria_sky)" />
      {/* Wooden Pergola Beam Across Top */}
      <rect x="0" y="20" width="900" height="18" fill="#451A03" />
      {[100, 250, 400, 550, 700, 850].map((bx) => (
        <rect key={bx} x={bx} y="0" width="16" height="45" fill="#78350F" />
      ))}
      {/* Cascading Hanging Wisteria Clusters (Right-heavy) */}
      {[
        { x: 480, h: 140 },
        { x: 540, h: 190 },
        { x: 600, h: 220 },
        { x: 660, h: 170 },
        { x: 720, h: 240 },
        { x: 780, h: 200 },
        { x: 840, h: 160 },
      ].map((w, idx) => (
        <g key={idx} transform={`translate(${w.x}, 38)`}>
          <line x1="0" y1="0" x2="0" y2={w.h} stroke="#15803D" strokeWidth="2" />
          {[...Array(Math.floor(w.h / 18))].map((_, ci) => (
            <circle
              key={ci}
              cx={ci % 2 === 0 ? -4 : 4}
              cy={ci * 18 + 10}
              r={12 - (ci * 0.7)}
              fill={ci % 2 === 0 ? '#C084FC' : '#A855F7'}
              opacity="0.85"
            />
          ))}
        </g>
      ))}
    </svg>
  ),
};
