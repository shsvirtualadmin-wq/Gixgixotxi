import React from 'react';

// BATCH 1: Banners 1 to 5
// 1. ban_bamboo_mist (Static)
// 2. ban_ocean_sunset_lanterns (Animated)
// 3. ban_rooftop_night_rain (Animated)
// 4. ban_sakura_stone_bridge (Animated)
// 5. ban_foxfire_shrine_path (Static)

export const BANNER_BATCH_1: Record<string, (animated: boolean) => React.ReactNode> = {
  // ─── 1. ban_bamboo_mist (Static) ──────────────────────────────────────────
  ban_bamboo_mist: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_bamboo_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="60%" stopColor="#022C22" />
          <stop offset="100%" stopColor="#021C16" />
        </linearGradient>
        <linearGradient id="bg_bamboo_stalk_fg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#065F46" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <radialGradient id="bg_bamboo_mist" cx="70%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#064E3B" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Layer 1: Background Sky */}
      <rect width="900" height="300" fill="url(#bg_bamboo_sky)" />
      {/* Layer 2: Ambient Forest Mist Glow */}
      <ellipse cx="650" cy="150" rx="320" ry="120" fill="url(#bg_bamboo_mist)" />
      {/* Layer 3: Distant silhouettes */}
      <g opacity="0.3">
        {[200, 320, 440, 560, 680, 800].map((x) => (
          <rect key={x} x={x} y="0" width="14" height="300" fill="#047857" />
        ))}
      </g>
      {/* Layer 4: Midground Bamboo Grove */}
      <g opacity="0.65">
        {[260, 380, 520, 640, 760, 850].map((x) => (
          <g key={x}>
            <rect x={x} y="0" width="22" height="300" fill="#059669" />
            <line x1={x} y1="70" x2={x + 22} y2="70" stroke="#064E3B" strokeWidth="3" />
            <line x1={x} y1="150" x2={x + 22} y2="150" stroke="#064E3B" strokeWidth="3" />
            <line x1={x} y1="230" x2={x + 22} y2="230" stroke="#064E3B" strokeWidth="3" />
          </g>
        ))}
      </g>
      {/* Layer 5: Stone Stepping Path (Center-Right) */}
      <path d="M400 300 Q600 240 750 210" stroke="#1E293B" strokeWidth="24" strokeLinecap="round" fill="none" opacity="0.7" />
      {/* Layer 6: Foreground Bamboo Stalks (Right-heavy) */}
      <g>
        {[600, 720, 820].map((x) => (
          <g key={x}>
            <rect x={x} y="0" width="30" height="300" fill="url(#bg_bamboo_stalk_fg)" />
            <line x1={x} y1="80" x2={x + 30} y2="80" stroke="#064E3B" strokeWidth="4" />
            <line x1={x} y1="180" x2={x + 30} y2="180" stroke="#064E3B" strokeWidth="4" />
            <path d={`M${x + 30} 80 Q${x + 80} 60 ${x + 90} 90 Q${x + 60} 85 ${x + 30} 80`} fill="#34D399" />
            <path d={`M${x} 180 Q${x - 50} 160 ${x - 60} 190 Q${x - 30} 185 ${x} 180`} fill="#34D399" />
          </g>
        ))}
      </g>
      {/* Layer 7: Ground Moss Vignette (Calm Bottom-Left) */}
      <rect x="0" y="240" width="900" height="60" fill="#022C22" opacity="0.8" />
    </svg>
  ),

  // ─── 2. ban_ocean_sunset_lanterns (Animated) ──────────────────────────────
  ban_ocean_sunset_lanterns: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_sunset_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="40%" stopColor="#C026D3" />
          <stop offset="70%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="bg_sunset_sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9A3412" />
          <stop offset="30%" stopColor="#431407" />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>
      <rect width="900" height="200" fill="url(#bg_sunset_sky)" />
      {/* Layer 2: Giant Setting Sun */}
      <circle cx="680" cy="180" r="70" fill="#FEF08A" opacity="0.9" />
      <circle cx="680" cy="180" r="100" fill="#F59E0B" opacity="0.3" />
      {/* Layer 3: Distant Mountain Silhouettes */}
      <polygon points="400,200 480,140 560,200" fill="#3B0764" opacity="0.8" />
      <polygon points="520,200 620,120 740,200" fill="#581C87" opacity="0.7" />
      {/* Layer 4: Calm Sea Surface */}
      <rect x="0" y="200" width="900" height="100" fill="url(#bg_sunset_sea)" />
      {/* Layer 5: Sun Shimmer on Water */}
      <polygon points="680,200 640,300 720,300" fill="#FBBF24" opacity="0.25" />
      {/* Layer 6: Floating Paper Lanterns with Bobbing Animation */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '3s' }}>
        {[
          { x: 520, y: 220, s: 1 },
          { x: 620, y: 235, s: 1.2 },
          { x: 740, y: 225, s: 0.9 },
          { x: 810, y: 245, s: 1.4 },
          { x: 440, y: 240, s: 0.8 },
        ].map((l, i) => (
          <g key={i} transform={`translate(${l.x}, ${l.y}) scale(${l.s})`}>
            {/* Wooden Base */}
            <rect x="-8" y="6" width="16" height="3" rx="1" fill="#78350F" />
            {/* Paper Lantern Box */}
            <rect x="-7" y="-10" width="14" height="16" rx="2" fill="#FEF08A" stroke="#EA580C" strokeWidth="0.8" />
            {/* Candle Core */}
            <circle cx="0" cy="-2" r="3" fill="#DC2626" />
            {/* Reflection on water */}
            <ellipse cx="0" cy="12" rx="6" ry="2" fill="#F59E0B" opacity="0.5" />
          </g>
        ))}
      </g>
    </svg>
  ),

  // ─── 3. ban_rooftop_night_rain (Animated) ─────────────────────────────────
  ban_rooftop_night_rain: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_rain_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="60%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_rain_sky)" />
      {/* Layer 2: Distant Neon City Glow (Right) */}
      <circle cx="750" cy="160" r="140" fill="#7C3AED" opacity="0.25" />
      <circle cx="820" cy="180" r="90" fill="#06B6D4" opacity="0.2" />
      {/* Layer 3: Cyber Pagoda Rooftop Eaves (Center to Right) */}
      <g transform="translate(350, 140)">
        <path d="M0 80 Q180 30 360 80 Q480 60 560 90 L560 160 L0 160 Z" fill="#09090B" />
        {[40, 100, 160, 220, 280, 340, 400, 460].map((rx) => (
          <path key={rx} d={`M${rx} 72 Q${rx + 15} 55 ${rx + 30} 72`} stroke="#334155" strokeWidth="3" fill="none" />
        ))}
        {/* Neon Edge Light on Tiles */}
        <path d="M0 80 Q180 30 360 80 Q480 60 560 90" stroke="#00F0FF" strokeWidth="2" fill="none" opacity="0.75" />
      </g>
      {/* Layer 4: Vertical Rain Streaks */}
      <g opacity={animated ? 0.75 : 0.4} className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '1.5s' }}>
        {[80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 860].map((rx, idx) => (
          <line
            key={rx}
            x1={rx}
            y1={idx % 2 === 0 ? 0 : 40}
            x2={rx - 15}
            y2={idx % 2 === 0 ? 120 : 180}
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeDasharray="16 20"
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  ),

  // ─── 4. ban_sakura_stone_bridge (Animated) ────────────────────────────────
  ban_sakura_stone_bridge: (animated) => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_bridge_night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="50%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#2E1065" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_bridge_night)" />
      {/* Layer 2: Silver Full Moon */}
      <circle cx="700" cy="80" r="45" fill="#F8FAFC" />
      <circle cx="700" cy="80" r="75" fill="#E2E8F0" opacity="0.2" />
      {/* Layer 3: River Surface (Bottom) */}
      <rect x="0" y="210" width="900" height="90" fill="#09090B" opacity="0.9" />
      <ellipse cx="700" cy="240" rx="40" ry="10" fill="#E2E8F0" opacity="0.3" />
      {/* Layer 4: Arched Stone Bridge (Center-Right) */}
      <g transform="translate(420, 130)">
        {/* Arch */}
        <path d="M0 90 C80 10 240 10 320 90 L330 110 C240 40 80 40 -10 110 Z" fill="#475569" />
        {/* Railing posts */}
        {[30, 80, 130, 180, 230, 280].map((px) => (
          <rect key={px} x={px} y="20" width="6" height="30" fill="#334155" />
        ))}
        <path d="M20 20 C80 -5 240 -5 300 20" stroke="#334155" strokeWidth="5" fill="none" />
      </g>
      {/* Layer 5: Cherry Blossom Tree Silhouette with Pink Petals */}
      <g transform="translate(680, 40)">
        <path d="M60 180 Q80 100 40 40 Q20 80 0 180" fill="#1E293B" />
        {/* Petal clusters */}
        <circle cx="20" cy="30" r="35" fill="#F472B6" opacity="0.75" />
        <circle cx="70" cy="20" r="42" fill="#FB7185" opacity="0.7" />
        <circle cx="100" cy="50" r="30" fill="#F472B6" opacity="0.8" />
      </g>
      {/* Layer 6: Falling Petals (Animated) */}
      <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '2.5s' }}>
        {[450, 520, 590, 660, 730, 800].map((px, i) => (
          <ellipse
            key={i}
            cx={px}
            cy={120 + (i % 3) * 40}
            rx="5"
            ry="3"
            fill="#F472B6"
            transform={`rotate(${i * 35} ${px} ${120 + (i % 3) * 40})`}
            opacity="0.85"
          />
        ))}
      </g>
    </svg>
  ),

  // ─── 5. ban_foxfire_shrine_path (Static) ───────────────────────────────────
  ban_foxfire_shrine_path: () => (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="bg_shrine_path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="50%" stopColor="#1C2541" />
          <stop offset="100%" stopColor="#0A0A0A" />
        </linearGradient>
      </defs>
      <rect width="900" height="300" fill="url(#bg_shrine_path)" />
      {/* Layer 2: Distant Torii Gate in Mountain Gap (Right) */}
      <g transform="translate(680, 70)">
        <rect x="0" y="0" width="70" height="8" rx="2" fill="#DC2626" />
        <rect x="8" y="8" width="6" height="70" fill="#B91C1C" />
        <rect x="56" y="8" width="6" height="70" fill="#B91C1C" />
        <rect x="0" y="24" width="70" height="5" fill="#991B1B" />
      </g>
      {/* Layer 3: Stone Staircase Ascending into Distance */}
      <polygon points="350,300 550,300 700,140 680,140" fill="#334155" opacity="0.6" />
      {/* Steps */}
      {[280, 250, 220, 190, 160].map((sy) => (
        <line key={sy} x1="420" y1={sy} x2="620" y2={sy} stroke="#1E293B" strokeWidth="4" />
      ))}
      {/* Layer 4: Moss-Covered Stone Lantern Pagodas (Tōrō) */}
      {[
        { x: 500, y: 160, s: 0.8 },
        { x: 620, y: 180, s: 1.1 },
        { x: 760, y: 150, s: 0.9 },
      ].map((t, i) => (
        <g key={i} transform={`translate(${t.x}, ${t.y}) scale(${t.s})`}>
          <rect x="-10" y="25" width="20" height="6" fill="#475569" />
          <rect x="-4" y="0" width="8" height="25" fill="#64748B" />
          <rect x="-8" y="-12" width="16" height="12" fill="#FEF08A" stroke="#475569" strokeWidth="2" />
          <polygon points="-12,-12 12,-12 0,-20" fill="#334155" />
          <circle cx="0" cy="-6" r="4" fill="#38BDF8" /> {/* Cyan Foxfire Glow */}
        </g>
      ))}
      {/* Layer 5: Dark Pine Silhouettes */}
      <polygon points="250,300 280,150 310,300" fill="#0F172A" />
      <polygon points="800,300 840,110 880,300" fill="#0F172A" />
    </svg>
  ),
};
