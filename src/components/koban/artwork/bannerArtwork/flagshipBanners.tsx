import React from 'react';

/**
 * 12 Flagship Profile Banners
 * Built with layered depth (background, midground, foreground), subtle grain/noise,
 * soft atmospheric glows, and vignette framing.
 *
 * Performance:
 * - Only animates transform and opacity
 * - Pauses via 'canAnimate' flag (controlled by IntersectionObserver and tab visibility)
 * - Respects prefers-reduced-motion via CSS media query
 * - Uses viewBox="0 0 900 300" for crisp scalable responsive rendering (3:1 aspect ratio)
 */

// ─── 1. MIDNIGHT TORII (Static) ───────────────────────────────────────────────
export const MidnightToriiBanner: React.FC = () => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="mt_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#050819" />
        <stop offset="45%" stopColor="#0E1338" />
        <stop offset="85%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#120E2E" />
      </linearGradient>

      {/* Huge Pale Moon */}
      <radialGradient id="mt_moon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="65%" stopColor="#FEF9C3" />
        <stop offset="85%" stopColor="#FDE68A" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="mt_moon_halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.35" />
        <stop offset="40%" stopColor="#818CF8" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
      </radialGradient>

      {/* Mist Gradient */}
      <linearGradient id="mt_mist" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#312E81" stopOpacity="0" />
        <stop offset="50%" stopColor="#4338CA" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.75" />
      </linearGradient>

      {/* Torii Wood Gradient */}
      <linearGradient id="mt_torii_red" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#B91C1C" />
        <stop offset="50%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>

      {/* Vignette */}
      <radialGradient id="mt_vignette" cx="50%" cy="50%" r="70%">
        <stop offset="60%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
      </radialGradient>
    </defs>

    {/* Background Sky */}
    <rect width="900" height="300" fill="url(#mt_sky)" />

    {/* Distant Stars */}
    <g opacity="0.6">
      {[
        [80, 45, 1], [140, 90, 1.2], [220, 30, 0.8], [310, 70, 1.1],
        [400, 40, 1], [490, 85, 0.9], [580, 35, 1.3], [820, 60, 1],
        [860, 110, 0.8], [750, 40, 1.2], [670, 80, 0.9], [260, 110, 1]
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#E0E7FF" opacity={0.7} />
      ))}
    </g>

    {/* Moon Glow & Sphere */}
    <circle cx="700" cy="115" r="160" fill="url(#mt_moon_halo)" />
    <circle cx="700" cy="115" r="68" fill="url(#mt_moon)" />
    {/* Moon Mare (crater shadows) */}
    <ellipse cx="685" cy="100" rx="20" ry="14" fill="#FACC15" opacity="0.18" />
    <ellipse cx="715" cy="130" rx="26" ry="18" fill="#FACC15" opacity="0.15" />

    {/* Mountain Ridge 1 (Far) */}
    <path d="M0 220 Q200 170 420 200 T900 180 L900 300 L0 300 Z" fill="#13193E" opacity="0.75" />

    {/* Mountain Ridge 2 (Mid) */}
    <path d="M0 245 Q260 210 520 235 T900 215 L900 300 L0 300 Z" fill="#0C102A" />

    {/* Background Torii Silhouettes in Mist */}
    <g opacity="0.35" transform="translate(480, 140) scale(0.45)">
      <rect x="20" y="20" width="12" height="180" fill="#7F1D1D" />
      <rect x="140" y="20" width="12" height="180" fill="#7F1D1D" />
      <path d="M0 35 Q85 20 172 35 L168 18 Q85 5 4 18 Z" fill="#991B1B" />
      <rect x="10" y="55" width="152" height="10" fill="#7F1D1D" />
    </g>
    <g opacity="0.55" transform="translate(540, 120) scale(0.65)">
      <rect x="20" y="20" width="14" height="200" fill="#991B1B" />
      <rect x="160" y="20" width="14" height="200" fill="#991B1B" />
      <path d="M0 35 Q95 18 194 35 L190 16 Q95 2 4 16 Z" fill="#B91C1C" />
      <rect x="12" y="60" width="170" height="12" fill="#991B1B" />
    </g>

    {/* Midground Rolling Mist */}
    <rect x="0" y="160" width="900" height="140" fill="url(#mt_mist)" />

    {/* Foreground Majestic Red Torii Gate */}
    <g transform="translate(630, 70)">
      {/* Pillar Left */}
      <rect x="28" y="28" width="22" height="230" fill="url(#mt_torii_red)" rx="2" />
      <rect x="24" y="250" width="30" height="8" fill="#0F172A" rx="1" /> {/* Stone base */}
      {/* Pillar Right */}
      <rect x="190" y="28" width="22" height="230" fill="url(#mt_torii_red)" rx="2" />
      <rect x="186" y="250" width="30" height="8" fill="#0F172A" rx="1" />

      {/* Kasagi (Top Curved Lintel) */}
      <path d="M0 40 Q120 16 240 40 L234 16 Q120 -8 6 16 Z" fill="#DC2626" />
      <path d="M2 18 Q120 -6 238 18 L236 12 Q120 -12 4 12 Z" fill="#18181B" /> {/* Black ridge cap */}

      {/* Nuki (Tie Beam) */}
      <rect x="16" y="70" width="208" height="16" fill="url(#mt_torii_red)" rx="1" />

      {/* Gakuzuka (Center Plaque Tablet) */}
      <rect x="110" y="38" width="20" height="34" fill="#0A0A0A" rx="1" stroke="#F59E0B" strokeWidth="1" />
    </g>

    {/* Stone Path & Mossy Lanterns in Mist */}
    <g opacity="0.9">
      {/* Stone Lantern Left */}
      <g transform="translate(180, 195) scale(0.85)">
        <polygon points="25,0 5,12 45,12" fill="#334155" />
        <rect x="14" y="12" width="22" height="20" fill="#FEF08A" opacity="0.75" />
        <rect x="18" y="32" width="14" height="50" fill="#1E293B" />
        <rect x="10" y="80" width="30" height="10" fill="#0F172A" />
      </g>
      {/* Stepping Stones */}
      <ellipse cx="440" cy="275" rx="35" ry="12" fill="#1E293B" opacity="0.6" />
      <ellipse cx="530" cy="265" rx="30" ry="10" fill="#1E293B" opacity="0.7" />
      <ellipse cx="610" cy="255" rx="25" ry="9" fill="#1E293B" opacity="0.75" />
    </g>

    {/* Vignette Framing */}
    <rect width="900" height="300" fill="url(#mt_vignette)" pointerEvents="none" />
  </svg>
);

// ─── 2. KYOTO RAIN (Static) ───────────────────────────────────────────────────
export const KyotoRainBanner: React.FC = () => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="kr_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1E1B4B" />
        <stop offset="35%" stopColor="#312E81" />
        <stop offset="70%" stopColor="#115E59" />
        <stop offset="100%" stopColor="#042F2E" />
      </linearGradient>

      {/* Mountain Gradients */}
      <linearGradient id="kr_ridge_1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#581C87" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#3B0764" />
      </linearGradient>
      <linearGradient id="kr_ridge_2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
      <linearGradient id="kr_ridge_3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#134E4A" />
        <stop offset="100%" stopColor="#042F2E" />
      </linearGradient>

      {/* Fog Band Gradient */}
      <linearGradient id="kr_fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#CCFBF1" stopOpacity="0" />
        <stop offset="50%" stopColor="#CCFBF1" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#CCFBF1" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Sky */}
    <rect width="900" height="300" fill="url(#kr_sky)" />

    {/* Far Mountain Layer 1 (Plum) */}
    <path d="M0 130 Q160 85 340 120 T700 95 Q820 115 900 110 L900 300 L0 300 Z" fill="url(#kr_ridge_1)" />

    {/* Fog Band 1 */}
    <ellipse cx="400" cy="140" rx="450" ry="24" fill="url(#kr_fog)" />

    {/* Mid Mountain Layer 2 (Teal) */}
    <path d="M0 170 Q210 135 440 160 T900 145 L900 300 L0 300 Z" fill="url(#kr_ridge_2)" opacity="0.85" />

    {/* Pagoda Spire on Ridge 2 */}
    <g transform="translate(680, 105) scale(0.65)" opacity="0.85">
      <line x1="40" y1="0" x2="40" y2="35" stroke="#134E4A" strokeWidth="2.5" />
      <polygon points="40,30 20,45 60,45" fill="#042F2E" />
      <polygon points="40,50 15,68 65,68" fill="#042F2E" />
      <polygon points="40,72 10,92 70,92" fill="#042F2E" />
      <rect x="25" y="92" width="30" height="40" fill="#021C1B" />
    </g>

    {/* Fog Band 2 */}
    <ellipse cx="500" cy="185" rx="500" ry="28" fill="url(#kr_fog)" />

    {/* Foreground Mountain Layer 3 (Deep Forest) */}
    <path d="M0 215 Q260 175 560 210 T900 190 L900 300 L0 300 Z" fill="url(#kr_ridge_3)" />

    {/* Silhouetted Pine Boughs (Left & Right) */}
    <g fill="#021C1A">
      <path d="M0 300 L40 240 L60 260 L90 220 L120 250 L150 205 L170 230 L220 180 L250 300 Z" opacity="0.9" />
      <path d="M720 300 L760 230 L800 255 L840 210 L870 240 L900 195 L900 300 Z" opacity="0.95" />
    </g>

    {/* Slanted Rain Streaks Texture */}
    <g stroke="#99F6E4" strokeWidth="1" strokeLinecap="round" opacity="0.28">
      {[
        [60, 20, 25], [180, 50, 30], [290, 15, 20], [410, 60, 35],
        [520, 30, 28], [630, 75, 24], [740, 25, 32], [850, 80, 26],
        [120, 110, 30], [240, 140, 26], [360, 105, 32], [470, 150, 28],
        [590, 120, 34], [700, 160, 24], [810, 115, 30], [90, 210, 28],
        [220, 220, 32], [340, 195, 26], [480, 230, 30], [620, 215, 34],
        [750, 240, 28], [860, 205, 26]
      ].map(([x, y, len], i) => (
        <line key={i} x1={x} y1={y} x2={x - 12} y2={y + len} />
      ))}
    </g>

    {/* Vignette */}
    <rect width="900" height="300" fill="black" opacity="0.25" />
  </svg>
);

// ─── 3. GOLDEN HOUR LIBRARY (Static) ──────────────────────────────────────────
export const GoldenHourLibraryBanner: React.FC = () => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="gh_bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1B0A02" />
        <stop offset="40%" stopColor="#451A03" />
        <stop offset="75%" stopColor="#78350F" />
        <stop offset="100%" stopColor="#2E1004" />
      </linearGradient>

      {/* Volumetric Sunbeams */}
      <linearGradient id="gh_ray_1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.45" />
        <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="gh_ray_2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.38" />
        <stop offset="70%" stopColor="#D97706" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#451A03" stopOpacity="0" />
      </linearGradient>

      <radialGradient id="gh_window_glow" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.9" />
        <stop offset="40%" stopColor="#FDE68A" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Background Wall */}
    <rect width="900" height="300" fill="url(#gh_bg)" />

    {/* Center Arched Window Glow */}
    <path d="M380 0 Q450 -30 520 0 L530 180 Q450 170 370 180 Z" fill="url(#gh_window_glow)" />

    {/* Gothic Window Tracery Silhouette */}
    <g stroke="#180702" strokeWidth="4" fill="none">
      <path d="M400 0 L400 160 M450 0 L450 160 M500 0 L500 160" />
      <path d="M380 40 L520 40 M380 90 L520 90 M380 140 L520 140" />
      <path d="M400 30 Q425 10 450 30 Q475 10 500 30" />
    </g>

    {/* Sun Light Rays (Streaming diagonally across from upper-center) */}
    <polygon points="410,20 180,300 320,300 460,20" fill="url(#gh_ray_1)" />
    <polygon points="460,20 340,300 520,300 500,20" fill="url(#gh_ray_2)" />
    <polygon points="490,30 580,300 720,300 530,30" fill="url(#gh_ray_1)" opacity="0.75" />

    {/* Tall Bookshelf Silhouettes Left (Tiered Shelves with Books) */}
    <g fill="#1F0D03">
      <rect x="0" y="0" width="160" height="300" />
      <rect x="160" y="0" width="12" height="300" fill="#140702" />
      {/* Shelves & book spines with gold glints */}
      {[40, 95, 150, 205, 260].map((y) => (
        <g key={y}>
          <rect x="0" y={y} width="160" height="6" fill="#451A03" />
          {/* Varied book spines */}
          {[10, 25, 42, 60, 75, 95, 115, 130, 145].map((bx, bi) => (
            <rect
              key={bx}
              x={bx}
              y={y - 28 + (bi % 3) * 3}
              width={12}
              height={28 - (bi % 3) * 3}
              fill={bi % 2 === 0 ? '#78350F' : bi % 3 === 0 ? '#92400E' : '#B45309'}
            />
          ))}
        </g>
      ))}
    </g>

    {/* Tall Bookshelf Silhouettes Right */}
    <g fill="#1F0D03">
      <rect x="740" y="0" width="160" height="300" />
      <rect x="732" y="0" width="10" height="300" fill="#140702" />
      {[40, 95, 150, 205, 260].map((y) => (
        <g key={y}>
          <rect x="740" y={y} width="160" height="6" fill="#451A03" />
          {[750, 768, 785, 805, 825, 842, 860, 880].map((bx, bi) => (
            <rect
              key={bx}
              x={bx}
              y={y - 28 + (bi % 3) * 4}
              width={14}
              height={28 - (bi % 3) * 4}
              fill={bi % 2 === 0 ? '#92400E' : '#78350F'}
            />
          ))}
        </g>
      ))}
    </g>

    {/* Ambient Golden Dust Motes floating in light rays */}
    <g opacity="0.75">
      {[
        [280, 120, 2], [320, 190, 1.5], [410, 160, 2.5], [450, 240, 1.8],
        [360, 260, 2], [520, 170, 2.2], [580, 220, 1.6], [620, 140, 2]
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#FEF3C7" />
      ))}
    </g>
  </svg>
);

// ─── 4. SAKURA DUSK (Static) ──────────────────────────────────────────────────
export const SakuraDuskBanner: React.FC = () => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="sd_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1E1035" />
        <stop offset="40%" stopColor="#4C1D95" />
        <stop offset="70%" stopColor="#9D174D" />
        <stop offset="92%" stopColor="#DB2777" />
        <stop offset="100%" stopColor="#F472B6" />
      </linearGradient>

      {/* Petal Gradients */}
      <linearGradient id="sd_petal_fg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF1F2" />
        <stop offset="60%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#DB2777" />
      </linearGradient>
      <linearGradient id="sd_petal_mg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FBCFE8" />
        <stop offset="100%" stopColor="#BE185D" />
      </linearGradient>

      {/* Temple Horizon Silhouette */}
      <linearGradient id="sd_ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1E112A" />
        <stop offset="100%" stopColor="#0B0512" />
      </linearGradient>
    </defs>

    {/* Sky */}
    <rect width="900" height="300" fill="url(#sd_sky)" />

    {/* Faint Evening Moon */}
    <circle cx="240" cy="80" r="32" fill="#FFF1F2" opacity="0.6" />
    <circle cx="248" cy="74" r="28" fill="#3B0764" opacity="0.75" />

    {/* Distant Temple Horizon */}
    <path d="M0 250 Q280 230 550 245 T900 235 L900 300 L0 300 Z" fill="url(#sd_ground)" />

    {/* Pagoda Silhouette on Right Horizon */}
    <g transform="translate(740, 155) scale(0.65)" fill="#0B0512">
      <polygon points="50,0 20,25 80,25" />
      <polygon points="50,28 10,50 90,50" />
      <polygon points="50,55 0,80 100,80" />
      <rect x="35" y="80" width="30" height="50" />
    </g>

    {/* Branch Silhouettes Spanning from Top Right */}
    <g stroke="#180826" strokeLinecap="round" fill="none">
      <path d="M900 20 Q780 40 680 15 Q600 -5 540 25" strokeWidth="12" />
      <path d="M680 15 Q620 60 560 70 Q510 80 480 65" strokeWidth="6" />
      <path d="M560 70 Q530 110 490 125" strokeWidth="3.5" />
      <path d="M780 40 Q750 90 710 110" strokeWidth="5" />
      <path d="M900 80 Q840 95 810 135" strokeWidth="5" />
    </g>

    {/* Sakura Blossom Clusters on Branch */}
    <g fill="#F472B6" opacity="0.9">
      {[
        [690, 20], [670, 32], [610, 58], [570, 72], [540, 30],
        [500, 70], [480, 120], [750, 95], [720, 115], [820, 130]
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={7} fill="#FFF1F2" stroke="#DB2777" strokeWidth="1.5" />
      ))}
    </g>

    {/* Scattered Petals at Varied Depth (Background, Midground, Foreground) */}
    {/* Far Small Petals */}
    <g opacity="0.6">
      {[
        [150, 160], [220, 120], [330, 90], [420, 140], [530, 180],
        [640, 150], [710, 190], [280, 210], [380, 230], [820, 210]
      ].map(([cx, cy], i) => (
        <path
          key={i}
          d={`M${cx} ${cy} C${cx + 4} ${cy - 6} ${cx + 10} ${cy - 2} ${cx + 8} ${cy + 6} C${cx + 4} ${cy + 8} ${cx} ${cy + 4} ${cx} ${cy}`}
          fill="url(#sd_petal_mg)"
        />
      ))}
    </g>

    {/* Foreground Large Drifting Petals */}
    <g opacity="0.95">
      {[
        [110, 80, 1.4, 25], [260, 180, 1.8, -15], [440, 220, 1.6, 40],
        [600, 100, 2.0, -30], [760, 60, 1.5, 10], [860, 180, 1.7, 50]
      ].map(([x, y, scale, rot], i) => (
        <g key={i} transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`}>
          <path d="M0 0 C-4 -12 8 -16 12 -4 C15 6 4 14 0 0 Z" fill="url(#sd_petal_fg)" />
        </g>
      ))}
    </g>
  </svg>
);

// ─── 5. OBSIDIAN CIRCUIT (Static) ─────────────────────────────────────────────
export const ObsidianCircuitBanner: React.FC = () => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="oc_glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#050508" />
        <stop offset="50%" stopColor="#0B0B12" />
        <stop offset="100%" stopColor="#120608" />
      </linearGradient>

      {/* Hex Dot Pattern */}
      <pattern id="oc_dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="1" fill="#27272A" opacity="0.4" />
      </pattern>

      {/* Neon Glow Filters */}
      <radialGradient id="oc_corner_glow" cx="100%" cy="0%" r="60%">
        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
        <stop offset="50%" stopColor="#991B1B" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="oc_left_glow" cx="0%" cy="100%" r="50%">
        <stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Black Glass Base */}
    <rect width="900" height="300" fill="url(#oc_glass)" />
    <rect width="900" height="300" fill="url(#oc_dots)" />

    {/* Ambient Corner Ambient Glows */}
    <rect width="900" height="300" fill="url(#oc_corner_glow)" />
    <rect width="900" height="300" fill="url(#oc_left_glow)" />

    {/* Circuit Pathways (Ultra-fine Neon-Red Traces with 45° Bends) */}
    <g stroke="#EF4444" strokeWidth="1.6" fill="none" opacity="0.85">
      {/* Top Bus */}
      <path d="M0 60 L240 60 L280 100 L460 100 L500 60 L900 60" />
      <path d="M120 60 L140 40 L380 40 L400 60" stroke="#DC2626" strokeWidth="1.2" />
      {/* Center Bus */}
      <path d="M180 300 L240 240 L440 240 L490 190 L680 190 L730 240 L900 240" />
      <path d="M300 240 L320 220 L400 220 L420 240" stroke="#DC2626" strokeWidth="1.2" />
      {/* Diagonal Spines */}
      <path d="M580 0 L640 60 L640 140 L700 200 L700 300" stroke="#EF4444" strokeWidth="1.8" />
      <path d="M60 0 L60 80 L110 130 L110 240 L170 300" stroke="#B91C1C" strokeWidth="1.4" />
      {/* Branching Chip Grid */}
      <path d="M780 100 L820 140 L880 140" />
      <path d="M800 60 L830 90 L890 90" />
    </g>

    {/* Circuit Nodes & Micro Junctions */}
    <g fill="#EF4444">
      {[
        [240, 60], [280, 100], [460, 100], [500, 60],
        [240, 240], [440, 240], [490, 190], [680, 190], [730, 240],
        [640, 60], [640, 140], [700, 200], [110, 130], [820, 140]
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="4" fill="#EF4444" />
          <circle cx={cx} cy={cy} r="2" fill="#FEF2F2" />
          <circle cx={cx} cy={cy} r="8" fill="none" stroke="#EF4444" strokeWidth="0.8" opacity="0.6" />
        </g>
      ))}
    </g>

    {/* Cyber HUD Corner Elements */}
    <g stroke="#DC2626" strokeWidth="1.5" fill="none" opacity="0.75">
      <path d="M20 35 L20 20 L35 20" />
      <path d="M880 35 L880 20 L865 20" />
      <path d="M20 265 L20 280 L35 280" />
      <path d="M880 265 L880 280 L865 280" />
    </g>

    {/* Tech Label Markings */}
    <text x="30" y="32" fill="#EF4444" fontSize="9" fontFamily="monospace" opacity="0.75" letterSpacing="2">
      BOARDLY // CORE_SYS_v4
    </text>
    <text x="760" y="280" fill="#EF4444" fontSize="8" fontFamily="monospace" opacity="0.6" letterSpacing="1.5">
      SYS_NODE // 0x7F
    </text>
  </svg>
);

// ─── 6. AURORA FROST (Static) ─────────────────────────────────────────────────
export const AuroraFrostBanner: React.FC = () => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="af_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#082F49" />
        <stop offset="40%" stopColor="#0369A1" />
        <stop offset="75%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#E0F2FE" />
      </linearGradient>

      {/* Mint Ribbon */}
      <linearGradient id="af_mint_ribbon" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#34D399" stopOpacity="0" />
        <stop offset="30%" stopColor="#6EE7B7" stopOpacity="0.85" />
        <stop offset="70%" stopColor="#A7F3D0" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
      </linearGradient>

      {/* Ice Blue Ribbon */}
      <linearGradient id="af_blue_ribbon" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
        <stop offset="40%" stopColor="#7DD3FC" stopOpacity="0.8" />
        <stop offset="80%" stopColor="#BAE6FD" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
      </linearGradient>

      {/* Glacier Peak Gradient */}
      <linearGradient id="af_ice_peak_1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#BAE6FD" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="af_ice_peak_dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="100%" stopColor="#075985" />
      </linearGradient>
    </defs>

    {/* Sky */}
    <rect width="900" height="300" fill="url(#af_sky)" />

    {/* Upper Soft Violet Shimmer */}
    <ellipse cx="450" cy="50" rx="400" ry="60" fill="#818CF8" opacity="0.35" />

    {/* Flowing Ribbon 1 (Ice Blue) */}
    <path
      d="M0 60 Q220 -10 450 70 T900 30 L900 120 Q680 80 450 140 T0 120 Z"
      fill="url(#af_blue_ribbon)"
    />

    {/* Flowing Ribbon 2 (Mint Green) */}
    <path
      d="M0 100 Q260 40 480 110 T900 70 L900 150 Q660 120 480 170 T0 150 Z"
      fill="url(#af_mint_ribbon)"
    />

    {/* Far Glacier Peaks */}
    <g opacity="0.85">
      <polygon points="120,300 240,150 360,300" fill="url(#af_ice_peak_1)" />
      <polygon points="240,150 240,300 360,300" fill="url(#af_ice_peak_dark)" />

      <polygon points="340,300 480,120 620,300" fill="url(#af_ice_peak_1)" />
      <polygon points="480,120 480,300 620,300" fill="url(#af_ice_peak_dark)" />

      <polygon points="580,300 700,160 820,300" fill="url(#af_ice_peak_1)" />
      <polygon points="700,160 700,300 820,300" fill="url(#af_ice_peak_dark)" />
    </g>

    {/* Foreground Frost Horizon */}
    <path d="M0 240 Q300 210 600 235 T900 220 L900 300 L0 300 Z" fill="#F0FDFA" opacity="0.95" />
    <path d="M0 260 Q400 230 900 250 L900 300 L0 300 Z" fill="#CCFBF1" />

    {/* Sparkling Ice Crystals */}
    <g fill="#FFFFFF" opacity="0.8">
      {[
        [150, 40], [280, 80], [420, 30], [560, 60], [680, 35], [820, 75]
      ].map(([cx, cy], i) => (
        <polygon
          key={i}
          points={`${cx},${cy - 5} ${cx + 2},${cy} ${cx + 7},${cy} ${cx + 3},${cy + 3} ${cx + 5},${cy + 8} ${cx},${cy + 4} ${cx - 5},${cy + 8} ${cx - 3},${cy + 3} ${cx - 7},${cy} ${cx - 2},${cy}`}
        />
      ))}
    </g>
  </svg>
);

// ─── 7. STARFALL (Animated) ───────────────────────────────────────────────────
export const StarfallBanner: React.FC<{ canAnimate: boolean }> = ({ canAnimate }) => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      {/* Cool Night Sky: Deep Indigo -> Royal Violet -> Luminous Teal Horizon */}
      <linearGradient id="sf_sky" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#05081D" />
        <stop offset="36%" stopColor="#121647" />
        <stop offset="68%" stopColor="#1E1B5E" />
        <stop offset="88%" stopColor="#0D4B68" />
        <stop offset="100%" stopColor="#0A3A52" />
      </linearGradient>

      {/* Left-Third Calm Vignette for Name Overlay Legibility */}
      <linearGradient id="sf_left_calm" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#040717" stopOpacity="0.68" />
        <stop offset="32%" stopColor="#070B24" stopOpacity="0.32" />
        <stop offset="52%" stopColor="#070B24" stopOpacity="0" />
      </linearGradient>

      {/* Soft Aurora Ribbon & Nebula Band Gradients */}
      <linearGradient id="sf_aurora_ribbon" x1="0" y1="0.2" x2="1" y2="0.8">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
        <stop offset="22%" stopColor="#2DD4BF" stopOpacity="0.22" />
        <stop offset="52%" stopColor="#38BDF8" stopOpacity="0.42" />
        <stop offset="78%" stopColor="#A78BFA" stopOpacity="0.38" />
        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.12" />
      </linearGradient>
      <linearGradient id="sf_aurora_secondary" x1="0" y1="0.8" x2="1" y2="0.2">
        <stop offset="0%" stopColor="#818CF8" stopOpacity="0" />
        <stop offset="35%" stopColor="#C084FC" stopOpacity="0.24" />
        <stop offset="70%" stopColor="#22D3EE" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.08" />
      </linearGradient>
      <radialGradient id="sf_nebula_teal" cx="68%" cy="42%" r="48%">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.28" />
        <stop offset="48%" stopColor="#818CF8" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#05081D" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="sf_nebula_violet" cx="44%" cy="28%" r="42%">
        <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.22" />
        <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#05081D" stopOpacity="0" />
      </radialGradient>

      {/* Shooting Star Glowing Trails (Near, Mid, Far) */}
      <linearGradient id="sf_meteor_trail_cyan" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="22%" stopColor="#67E8F9" stopOpacity="0.92" />
        <stop offset="58%" stopColor="#38BDF8" stopOpacity="0.45" />
        <stop offset="85%" stopColor="#818CF8" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="sf_meteor_trail_violet" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="28%" stopColor="#A5F3FC" stopOpacity="0.8" />
        <stop offset="65%" stopColor="#C084FC" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
      </linearGradient>

      {/* Reflective Lake Surface & Horizon Glow */}
      <linearGradient id="sf_lake" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0E4F6E" stopOpacity="0.92" />
        <stop offset="35%" stopColor="#0A2E4D" stopOpacity="0.96" />
        <stop offset="100%" stopColor="#040D1F" stopOpacity="1" />
      </linearGradient>
      <linearGradient id="sf_horizon_mist" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.18" />
        <stop offset="35%" stopColor="#67E8F9" stopOpacity="0.45" />
        <stop offset="68%" stopColor="#2DD4BF" stopOpacity="0.65" />
        <stop offset="90%" stopColor="#A78BFA" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.25" />
      </linearGradient>

      {/* Soft Star Halo Filter */}
      <filter id="sf_star_glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <style>{`
        @keyframes sf_twinkle_far {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.85; }
        }
        @keyframes sf_twinkle_mid {
          0%, 100% { opacity: 0.45; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        @keyframes sf_twinkle_near {
          0%, 100% { opacity: 0.65; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.18); }
        }
        @keyframes sf_aurora_sway {
          0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); opacity: 0.88; }
          50% { transform: translate3d(-16px, 4px, 0) scaleY(1.06); opacity: 1; }
        }
        /* Staggered overlapping meteor cycles so >=2 shooting stars are visible at every instant */
        @keyframes sf_meteor_1 {
          0% { transform: translate3d(130px, -65px, 0); opacity: 0; }
          8% { opacity: 1; }
          48% { opacity: 0.95; }
          62% { transform: translate3d(-180px, 90px, 0); opacity: 0; }
          100% { transform: translate3d(-180px, 90px, 0); opacity: 0; }
        }
        @keyframes sf_meteor_2 {
          0%, 18% { transform: translate3d(140px, -70px, 0); opacity: 0; }
          26% { opacity: 1; }
          68% { opacity: 0.9; }
          82% { transform: translate3d(-190px, 95px, 0); opacity: 0; }
          100% { transform: translate3d(-190px, 95px, 0); opacity: 0; }
        }
        @keyframes sf_meteor_3 {
          0% { transform: translate3d(-30px, 15px, 0); opacity: 0.92; }
          28% { transform: translate3d(-170px, 85px, 0); opacity: 0; }
          42% { transform: translate3d(120px, -60px, 0); opacity: 0; }
          52% { opacity: 0.95; }
          92% { opacity: 0.95; }
          100% { transform: translate3d(-30px, 15px, 0); opacity: 0.92; }
        }
        @keyframes sf_meteor_4 {
          0%, 36% { transform: translate3d(110px, -55px, 0); opacity: 0; }
          45% { opacity: 0.85; }
          84% { opacity: 0.8; }
          96%, 100% { transform: translate3d(-150px, 75px, 0); opacity: 0; }
        }
        @keyframes sf_meteor_5 {
          0% { transform: translate3d(-60px, 30px, 0); opacity: 0.85; }
          22% { transform: translate3d(-160px, 80px, 0); opacity: 0; }
          58% { transform: translate3d(110px, -55px, 0); opacity: 0; }
          68% { opacity: 0.9; }
          100% { transform: translate3d(-60px, 30px, 0); opacity: 0.85; }
        }
        .sf-aurora {
          animation: ${canAnimate ? 'sf_aurora_sway 8s ease-in-out infinite' : 'none'};
          transform-origin: center;
        }
        .sf-twinkle-far {
          animation: ${canAnimate ? 'sf_twinkle_far 4.2s ease-in-out infinite' : 'none'};
        }
        .sf-twinkle-mid {
          animation: ${canAnimate ? 'sf_twinkle_mid 3.4s ease-in-out infinite 0.9s' : 'none'};
          transform-box: fill-box;
          transform-origin: center;
        }
        .sf-twinkle-near {
          animation: ${canAnimate ? 'sf_twinkle_near 2.8s ease-in-out infinite 0.4s' : 'none'};
          transform-box: fill-box;
          transform-origin: center;
        }
        .sf-meteor-1 {
          animation: ${canAnimate ? 'sf_meteor_1 3.6s linear infinite' : 'none'};
        }
        .sf-meteor-2 {
          animation: ${canAnimate ? 'sf_meteor_2 4.4s linear infinite' : 'none'};
        }
        .sf-meteor-3 {
          animation: ${canAnimate ? 'sf_meteor_3 3.2s linear infinite' : 'none'};
        }
        .sf-meteor-4 {
          animation: ${canAnimate ? 'sf_meteor_4 5.0s linear infinite' : 'none'};
        }
        .sf-meteor-5 {
          animation: ${canAnimate ? 'sf_meteor_5 4.0s linear infinite' : 'none'};
        }
        @media (prefers-reduced-motion: reduce) {
          .sf-aurora,
          .sf-twinkle-far,
          .sf-twinkle-mid,
          .sf-twinkle-near,
          .sf-meteor-1,
          .sf-meteor-2,
          .sf-meteor-3,
          .sf-meteor-4,
          .sf-meteor-5 {
            animation: none !important;
          }
        }
      `}</style>
    </defs>

    {/* 1. Cool Indigo-Violet-Teal Sky Base & Nebulae */}
    <rect width="900" height="300" fill="url(#sf_sky)" />
    <rect width="900" height="250" fill="url(#sf_nebula_teal)" />
    <rect width="900" height="250" fill="url(#sf_nebula_violet)" />

    {/* 2. Sweeping Aurora Ribbons (concentrated in center & right, gentle fade on left) */}
    <g className="sf-aurora">
      <path
        d="M 160 155 C 290 78, 430 172, 590 92 C 710 34, 815 118, 920 64 L 920 142 C 810 185, 700 112, 575 162 C 425 220, 290 132, 160 190 Z"
        fill="url(#sf_aurora_ribbon)"
      />
      <path
        d="M 240 110 C 380 42, 520 138, 670 68 C 770 22, 845 78, 920 42 L 920 96 C 840 128, 755 78, 655 118 C 510 178, 375 92, 240 142 Z"
        fill="url(#sf_aurora_secondary)"
      />
    </g>

    {/* 3. Depth Layer 1 (Far): Fine Pinpoint Cyan-White Starfield */}
    <g className="sf-twinkle-far" fill="#BAE6FD" opacity="0.72">
      {[
        [45, 38, 0.9], [95, 82, 0.8], [135, 44, 1.0], [190, 112, 0.9], [245, 58, 1.1],
        [305, 34, 1.1], [340, 108, 0.9], [395, 62, 1.0], [445, 28, 1.1], [485, 96, 0.9],
        [530, 48, 1.0], [575, 134, 0.9], [615, 30, 1.2], [655, 88, 1.0], [705, 52, 1.1],
        [745, 138, 0.9], [785, 26, 1.1], [825, 74, 1.0], [868, 42, 1.1], [882, 128, 0.9],
        [315, 178, 0.9], [465, 168, 1.0], [635, 174, 0.9], [795, 165, 1.0], [855, 185, 0.8],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} />
      ))}
    </g>

    {/* 4. Depth Layer 2 (Mid): Glowing White-Cyan & Soft Violet Stars */}
    <g className="sf-twinkle-mid" fill="#E0F2FE" filter="url(#sf_star_glow)">
      {[
        [78, 62, 1.4], [168, 48, 1.5], [262, 92, 1.7], [338, 52, 1.8],
        [418, 118, 1.6], [498, 42, 2.0], [562, 84, 1.8], [642, 56, 2.1],
        [718, 106, 1.9], [774, 48, 2.2], [838, 96, 1.8], [876, 62, 1.6],
        [378, 156, 1.5], [588, 152, 1.7], [738, 162, 1.6],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} />
      ))}
    </g>

    {/* 5. Depth Layer 3 (Near): Bright 4-Point Diamond Star Flares */}
    <g className="sf-twinkle-near" fill="#FFFFFF" filter="url(#sf_star_glow)">
      {[
        [365, 68, 5.5], [525, 58, 6.5], [685, 42, 7.0], [812, 66, 6.0], [620, 124, 5.0],
      ].map(([cx, cy, s], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="2.2" fill="#67E8F9" opacity="0.85" />
          <polygon
            points={`${cx},${cy - s} ${cx + 1.4},${cy - 1.4} ${cx + s},${cy} ${cx + 1.4},${cy + 1.4} ${cx},${cy + s} ${cx - 1.4},${cy + 1.4} ${cx - s},${cy} ${cx - 1.4},${cy - 1.4}`}
            fill="#FFFFFF"
          />
        </g>
      ))}
    </g>

    {/* 6. Multi-Depth Shooting Stars (5 meteors; resting positions are inside the sky for static/reduced-motion) */}
    {/* Far Depth Meteor 4 */}
    <g transform="translate(450, 92)">
      <g className="sf-meteor-4">
        <line x1="0" y1="0" x2="78" y2="-39" stroke="url(#sf_meteor_trail_violet)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="0" r="1.6" fill="#E0F2FE" />
      </g>
    </g>

    {/* Far Depth Meteor 5 */}
    <g transform="translate(760, 142)">
      <g className="sf-meteor-5">
        <line x1="0" y1="0" x2="86" y2="-43" stroke="url(#sf_meteor_trail_violet)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="0" cy="0" r="1.8" fill="#A5F3FC" />
      </g>
    </g>

    {/* Mid Depth Meteor 2 */}
    <g transform="translate(560, 128)">
      <g className="sf-meteor-2" filter="url(#sf_star_glow)">
        <line x1="0" y1="0" x2="118" y2="-59" stroke="url(#sf_meteor_trail_cyan)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="0" cy="0" r="2.3" fill="#FFFFFF" />
      </g>
    </g>

    {/* Near Depth Meteor 1 (Primary Hero Starfall) */}
    <g transform="translate(650, 86)">
      <g className="sf-meteor-1" filter="url(#sf_star_glow)">
        <line x1="0" y1="0" x2="148" y2="-74" stroke="url(#sf_meteor_trail_cyan)" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="5" fill="#67E8F9" opacity="0.45" />
      </g>
    </g>

    {/* Near Depth Meteor 3 (Secondary Hero Starfall) */}
    <g transform="translate(805, 108)">
      <g className="sf-meteor-3" filter="url(#sf_star_glow)">
        <line x1="0" y1="0" x2="132" y2="-66" stroke="url(#sf_meteor_trail_cyan)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="0" cy="0" r="2.6" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="4.5" fill="#38BDF8" opacity="0.4" />
      </g>
    </g>

    {/* 7. Left-Third Calm Overlay so User Name & Avatar Pop */}
    <rect width="420" height="244" fill="url(#sf_left_calm)" />

    {/* 8. Tranquil Reflective Horizon Line & Starlit Lake (Replaces Mountain Ridge) */}
    <rect x="0" y="242" width="900" height="58" fill="url(#sf_lake)" />
    <ellipse cx="580" cy="242" rx="340" ry="6" fill="url(#sf_horizon_mist)" opacity="0.55" />
    <line x1="0" y1="242" x2="900" y2="242" stroke="url(#sf_horizon_mist)" strokeWidth="1.6" />

    {/* Faint Starlight & Aurora Ripples on the Lake */}
    <g stroke="#67E8F9" strokeLinecap="round" opacity="0.38">
      <line x1="340" y1="252" x2="430" y2="252" strokeWidth="1.2" />
      <line x1="490" y1="256" x2="620" y2="256" strokeWidth="1.5" />
      <line x1="660" y1="251" x2="770" y2="251" strokeWidth="1.3" />
      <line x1="410" y1="266" x2="540" y2="266" strokeWidth="1.1" stroke="#A78BFA" />
      <line x1="580" y1="270" x2="710" y2="270" strokeWidth="1.2" />
      <line x1="740" y1="264" x2="845" y2="264" strokeWidth="1.1" stroke="#2DD4BF" />
      <line x1="515" y1="282" x2="665" y2="282" strokeWidth="1.0" opacity="0.7" />
      <line x1="690" y1="286" x2="810" y2="286" strokeWidth="0.9" stroke="#A78BFA" opacity="0.65" />
    </g>
  </svg>
);

// ─── 8. EMBER DRIFT (Animated) ────────────────────────────────────────────────
export const EmberDriftBanner: React.FC<{ canAnimate: boolean }> = ({ canAnimate }) => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="ed_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0B0204" />
        <stop offset="45%" stopColor="#1F040A" />
        <stop offset="80%" stopColor="#450A0A" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>

      <radialGradient id="ed_core_glow" cx="50%" cy="100%" r="65%">
        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
        <stop offset="40%" stopColor="#991B1B" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      <style>{`
        @keyframes ed_float_1 {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.8; }
          100% { transform: translate3d(18px, -180px, 0); opacity: 0; }
        }
        @keyframes ed_float_2 {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 0.7; }
          100% { transform: translate3d(-24px, -210px, 0); opacity: 0; }
        }
        @keyframes ed_float_3 {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          25% { opacity: 0.95; }
          75% { opacity: 0.6; }
          100% { transform: translate3d(12px, -230px, 0); opacity: 0; }
        }
        .ed-ember-1 { animation: ${canAnimate ? 'ed_float_1 5s ease-out infinite' : 'none'}; }
        .ed-ember-2 { animation: ${canAnimate ? 'ed_float_2 6.5s ease-out infinite 1.2s' : 'none'}; }
        .ed-ember-3 { animation: ${canAnimate ? 'ed_float_3 7.8s ease-out infinite 2.5s' : 'none'}; }
        @media (prefers-reduced-motion: reduce) {
          .ed-ember-1, .ed-ember-2, .ed-ember-3 { animation: none !important; }
        }
      `}</style>
    </defs>

    {/* Maroon-Black Gradient & Core Glow */}
    <rect width="900" height="300" fill="url(#ed_bg)" />
    <rect width="900" height="300" fill="url(#ed_core_glow)" />

    {/* Dark Jagged Obsidian Crags at Bottom */}
    <path d="M0 300 L60 260 L140 280 L230 250 L340 285 L460 240 L580 275 L700 245 L810 270 L900 235 L900 300 Z" fill="#0A0204" />

    {/* Batch 1: Small Rising Embers */}
    <g className="ed-ember-1">
      {[
        [80, 280, 2, '#F97316'], [210, 290, 2.5, '#FDE047'], [340, 275, 1.8, '#EF4444'],
        [490, 285, 3, '#FACC15'], [630, 280, 2.2, '#F97316'], [770, 295, 2, '#FDE047'],
        [860, 270, 2.6, '#EF4444']
      ].map(([cx, cy, r, fill], i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} />
      ))}
    </g>

    {/* Batch 2: Medium Embers */}
    <g className="ed-ember-2">
      {[
        [140, 295, 3.2, '#FEF08A'], [280, 280, 2.4, '#F97316'], [420, 290, 3.5, '#FDE047'],
        [560, 270, 2.8, '#EF4444'], [710, 285, 3.2, '#F97316'], [830, 290, 2.2, '#FEF08A']
      ].map(([cx, cy, r, fill], i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} />
      ))}
    </g>

    {/* Batch 3: Large Bright Sparkling Embers */}
    <g className="ed-ember-3">
      {[
        [180, 285, 4, '#FFFFFF'], [380, 290, 3.8, '#FEF08A'],
        [520, 280, 4.2, '#FEF08A'], [670, 295, 3.6, '#FFFFFF']
      ].map(([cx, cy, r, fill], i) => (
        <g key={i}>
          <circle cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} />
          <circle cx={cx as number} cy={cy as number} r={(r as number) * 2} fill="#F97316" opacity="0.3" />
        </g>
      ))}
    </g>
  </svg>
);

// ─── 9. NEON RAIN CITY (Animated) ─────────────────────────────────────────────
export const NeonRainCityBanner: React.FC<{ canAnimate: boolean }> = ({ canAnimate }) => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="nrc_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#020617" />
        <stop offset="50%" stopColor="#0B0F1E" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>

      {/* Cyber Puddle Glows */}
      <radialGradient id="nrc_cyan_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="nrc_pink_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#EC4899" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      <style>{`
        @keyframes nrc_rain_fall {
          0% { transform: translate3d(0, -60px, 0); }
          100% { transform: translate3d(-30px, 300px, 0); }
        }
        @keyframes nrc_flicker {
          0%, 100% { opacity: 0.95; }
          48% { opacity: 0.95; }
          50% { opacity: 0.2; }
          52% { opacity: 0.95; }
          85% { opacity: 0.95; }
          86% { opacity: 0.4; }
          87% { opacity: 0.95; }
        }
        .nrc-rain { animation: ${canAnimate ? 'nrc_rain_fall 1s linear infinite' : 'none'}; }
        .nrc-rain-fast { animation: ${canAnimate ? 'nrc_rain_fall 0.75s linear infinite' : 'none'}; }
        .nrc-neon-sign { animation: ${canAnimate ? 'nrc_flicker 4s ease infinite' : 'none'}; }
        @media (prefers-reduced-motion: reduce) {
          .nrc-rain, .nrc-rain-fast, .nrc-neon-sign { animation: none !important; }
        }
      `}</style>
    </defs>

    {/* Sky */}
    <rect width="900" height="300" fill="url(#nrc_sky)" />

    {/* Far Skyline Silhouettes */}
    <g fill="#070C1A">
      <rect x="60" y="80" width="70" height="220" />
      <polygon points="95,50 65,80 125,80" />
      <rect x="150" y="110" width="55" height="190" />
      <rect x="230" y="90" width="80" height="210" />
      <rect x="330" y="130" width="60" height="170" />
      <rect x="420" y="70" width="90" height="230" />
      <line x1="465" y1="30" x2="465" y2="70" stroke="#EF4444" strokeWidth="2" />
      <circle cx="465" cy="30" r="3" fill="#EF4444" />
      <rect x="540" y="100" width="75" height="200" />
      <rect x="640" y="85" width="85" height="215" />
      <rect x="750" y="120" width="65" height="180" />
      <rect x="830" y="95" width="70" height="205" />
    </g>

    {/* Lit Windows Grid */}
    <g fill="#FEF08A" opacity="0.35">
      {[100, 130, 160, 190, 220].map((y) => (
        <g key={y}>
          <rect x="245" y={y} width="12" height="6" />
          <rect x="275" y={y} width="12" height="6" />
          <rect x="440" y={y - 20} width="14" height="6" fill="#67E8F9" />
          <rect x="475" y={y - 20} width="14" height="6" fill="#67E8F9" />
          <rect x="660" y={y} width="12" height="6" />
          <rect x="690" y={y} width="12" height="6" />
        </g>
      ))}
    </g>

    {/* Glowing Neon Signboards */}
    <g className="nrc-neon-sign">
      {/* Cyan Billboard */}
      <rect x="240" y="115" width="60" height="18" fill="#00F0FF" rx="3" opacity="0.85" />
      <text x="248" y="128" fill="#000000" fontSize="10" fontWeight="bold" fontFamily="monospace">
        BOARD
      </text>
      {/* Magenta Kanji / Bar Sign */}
      <rect x="550" y="130" width="16" height="70" fill="#EC4899" rx="3" opacity="0.9" />
      <text x="554" y="150" fill="#FFFFFF" fontSize="11" fontWeight="bold">
        夜
      </text>
      <text x="554" y="170" fill="#FFFFFF" fontSize="11" fontWeight="bold">
        市
      </text>
    </g>

    {/* Rain-slicked Street Reflections (Bottom) */}
    <rect x="0" y="270" width="900" height="30" fill="#050B18" />
    <ellipse cx="270" cy="285" rx="80" ry="12" fill="url(#nrc_cyan_glow)" />
    <ellipse cx="560" cy="285" rx="70" ry="10" fill="url(#nrc_pink_glow)" />

    {/* Falling Diagonal Rain Streaks */}
    <g stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" className="nrc-rain">
      {[
        [40, 20], [120, 60], [200, 10], [290, 80], [380, 30],
        [460, 90], [550, 40], [640, 70], [730, 20], [820, 85]
      ].map(([x, y], i) => (
        <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 36} />
      ))}
    </g>
    <g stroke="#E0F2FE" strokeWidth="1" strokeLinecap="round" opacity="0.35" className="nrc-rain-fast">
      {[
        [80, 100], [170, 140], [260, 95], [350, 150], [440, 110],
        [530, 160], [620, 105], [710, 140], [800, 115], [880, 150]
      ].map(([x, y], i) => (
        <line key={i} x1={x} y1={y} x2={x - 12} y2={y + 40} />
      ))}
    </g>
  </svg>
);

// ─── 10. KOI POND (Animated) ──────────────────────────────────────────────────
export const KoiPondBanner: React.FC<{ canAnimate: boolean }> = ({ canAnimate }) => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="kp_water" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#042F2E" />
        <stop offset="50%" stopColor="#0F766E" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>

      {/* Caustic Water Highlights */}
      <radialGradient id="kp_ripple_grad" cx="50%" cy="50%" r="50%">
        <stop offset="60%" stopColor="#5EEAD4" stopOpacity="0" />
        <stop offset="85%" stopColor="#5EEAD4" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
      </radialGradient>

      <style>{`
        @keyframes kp_ripple_expand {
          0% { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes kp_koi_swim_1 {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(180px, -20px, 0) rotate(8deg); }
          100% { transform: translate3d(360px, 10px, 0) rotate(-4deg); }
        }
        @keyframes kp_koi_swim_2 {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(-160px, 25px, 0) rotate(-10deg); }
          100% { transform: translate3d(-340px, -5px, 0) rotate(6deg); }
        }
        .kp-ripple-1 {
          transform-origin: 320px 140px;
          animation: ${canAnimate ? 'kp_ripple_expand 5s ease-out infinite' : 'none'};
        }
        .kp-ripple-2 {
          transform-origin: 640px 180px;
          animation: ${canAnimate ? 'kp_ripple_expand 6s ease-out infinite 2.5s' : 'none'};
        }
        .kp-koi-1 { animation: ${canAnimate ? 'kp_koi_swim_1 14s ease-in-out infinite alternate' : 'none'}; }
        .kp-koi-2 { animation: ${canAnimate ? 'kp_koi_swim_2 16s ease-in-out infinite alternate 1s' : 'none'}; }
        @media (prefers-reduced-motion: reduce) {
          .kp-ripple-1, .kp-ripple-2, .kp-koi-1, .kp-koi-2 { animation: none !important; }
        }
      `}</style>
    </defs>

    {/* Clear Jade Pond Base */}
    <rect width="900" height="300" fill="url(#kp_water)" />

    {/* Concentric Expanding Water Ripples */}
    <circle cx="320" cy="140" r="45" fill="none" stroke="#2DD4BF" strokeWidth="1.8" className="kp-ripple-1" />
    <circle cx="640" cy="180" r="50" fill="none" stroke="#2DD4BF" strokeWidth="1.8" className="kp-ripple-2" />

    {/* Swimming Golden Koi 1 */}
    <g transform="translate(180, 120)" className="kp-koi-1">
      {/* Shadow */}
      <path d="M0 0 Q30 -12 65 -4 Q40 18 0 0 Z" fill="#022C22" opacity="0.4" transform="translate(6, 10)" />
      {/* Body */}
      <path d="M0 0 Q30 -14 65 -4 Q40 16 0 0 Z" fill="#EA580C" />
      {/* Crimson Patches (Kohaku) */}
      <ellipse cx="24" cy="-3" rx="10" ry="6" fill="#DC2626" />
      <ellipse cx="44" cy="2" rx="8" ry="5" fill="#DC2626" />
      {/* Fin Left & Right */}
      <path d="M22 -8 Q12 -22 30 -16 Z" fill="#FDBA74" opacity="0.85" />
      <path d="M25 8 Q15 22 33 16 Z" fill="#FDBA74" opacity="0.85" />
      {/* Tail Fin */}
      <path d="M65 -4 Q88 -14 82 4 Q88 18 65 -4 Z" fill="#FED7AA" opacity="0.9" />
    </g>

    {/* Swimming Scarlet Koi 2 */}
    <g transform="translate(680, 160)" className="kp-koi-2">
      {/* Shadow */}
      <path d="M0 0 Q-30 -12 -65 -4 Q-40 18 0 0 Z" fill="#022C22" opacity="0.4" transform="translate(6, 10)" />
      {/* Body */}
      <path d="M0 0 Q-30 -14 -65 -4 Q-40 16 0 0 Z" fill="#F97316" />
      {/* Golden White Patches */}
      <ellipse cx="-20" cy="-2" rx="9" ry="5" fill="#FEF08A" />
      <ellipse cx="-42" cy="1" rx="8" ry="4" fill="#FFFFFF" />
      {/* Fins */}
      <path d="M-22 -8 Q-12 -22 -30 -16 Z" fill="#FED7AA" opacity="0.85" />
      <path d="M-25 8 Q-15 22 -33 16 Z" fill="#FED7AA" opacity="0.85" />
      {/* Tail Fin */}
      <path d="M-65 -4 Q-88 -14 -82 4 Q-88 18 -65 -4 Z" fill="#FEF08A" opacity="0.9" />
    </g>

    {/* Floating Lily Pads with Lotus Flowers (Foreground) */}
    {/* Lily Pad Left */}
    <g transform="translate(100, 60)">
      <path d="M0 0 A45 45 0 1 1 35 30 L0 0 Z" fill="#15803D" stroke="#166534" strokeWidth="2" />
      {/* Water drop on pad */}
      <circle cx="-12" cy="-8" r="4" fill="#99F6E4" opacity="0.75" />
    </g>
    {/* Lily Pad & Lotus Flower Right */}
    <g transform="translate(760, 80)">
      <path d="M0 0 A50 50 0 1 1 40 32 L0 0 Z" fill="#166534" stroke="#14532D" strokeWidth="2" />
      {/* Lotus Bloom */}
      <g transform="translate(-15, -10)">
        <ellipse cx="0" cy="0" rx="8" ry="16" fill="#F472B6" />
        <ellipse cx="-8" cy="4" rx="6" ry="14" fill="#FBCFE8" transform="rotate(-30)" />
        <ellipse cx="8" cy="4" rx="6" ry="14" fill="#FBCFE8" transform="rotate(30)" />
        <circle cx="0" cy="4" r="5" fill="#FBBF24" />
      </g>
    </g>
  </svg>
);

// ─── 11. LIQUID AURORA (Animated) ─────────────────────────────────────────────
export const LiquidAuroraBanner: React.FC<{ canAnimate: boolean }> = ({ canAnimate }) => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="la_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#020817" />
        <stop offset="50%" stopColor="#08182B" />
        <stop offset="100%" stopColor="#06202A" />
      </linearGradient>

      {/* Morphing Aurora Wave Gradients */}
      <linearGradient id="la_emerald" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
        <stop offset="35%" stopColor="#34D399" stopOpacity="0.75" />
        <stop offset="70%" stopColor="#6EE7B7" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="la_violet" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
        <stop offset="40%" stopColor="#A855F7" stopOpacity="0.65" />
        <stop offset="75%" stopColor="#C084FC" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="la_cyan" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
        <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
      </linearGradient>

      <style>{`
        @keyframes la_morph_1 {
          0% { transform: translate3d(-40px, 0, 0) scaleY(1); opacity: 0.7; }
          50% { transform: translate3d(50px, -15px, 0) scaleY(1.18); opacity: 0.95; }
          100% { transform: translate3d(-40px, 0, 0) scaleY(1); opacity: 0.7; }
        }
        @keyframes la_morph_2 {
          0% { transform: translate3d(30px, 0, 0) scaleY(1.1); opacity: 0.85; }
          50% { transform: translate3d(-45px, 18px, 0) scaleY(0.92); opacity: 0.65; }
          100% { transform: translate3d(30px, 0, 0) scaleY(1.1); opacity: 0.85; }
        }
        @keyframes la_morph_3 {
          0% { transform: translate3d(0, 0, 0); opacity: 0.6; }
          50% { transform: translate3d(60px, -10px, 0); opacity: 0.88; }
          100% { transform: translate3d(0, 0, 0); opacity: 0.6; }
        }
        .la-wave-1 { animation: ${canAnimate ? 'la_morph_1 12s ease-in-out infinite' : 'none'}; }
        .la-wave-2 { animation: ${canAnimate ? 'la_morph_2 16s ease-in-out infinite' : 'none'}; }
        .la-wave-3 { animation: ${canAnimate ? 'la_morph_3 20s ease-in-out infinite' : 'none'}; }
        @media (prefers-reduced-motion: reduce) {
          .la-wave-1, .la-wave-2, .la-wave-3 { animation: none !important; }
        }
      `}</style>
    </defs>

    {/* Polar Sky */}
    <rect width="900" height="300" fill="url(#la_sky)" />

    {/* Crisp Starfield */}
    <g fill="#FFFFFF" opacity="0.75">
      {[
        [60, 40, 1], [150, 90, 1.2], [240, 30, 1.5], [360, 75, 1],
        [480, 35, 1.8], [600, 80, 1.2], [720, 40, 1.5], [840, 70, 1],
        [300, 120, 1.2], [540, 110, 1], [780, 120, 1.4]
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} />
      ))}
    </g>

    {/* Morphing Ribbon 1: Deep Violet Curtain */}
    <g className="la-wave-1">
      <path
        d="M-50 40 Q180 -10 440 60 T950 20 L950 140 Q680 90 440 150 T-50 120 Z"
        fill="url(#la_violet)"
      />
    </g>

    {/* Morphing Ribbon 2: Electric Emerald Waves */}
    <g className="la-wave-2">
      <path
        d="M-40 80 Q220 20 480 95 T960 50 L960 170 Q690 130 480 185 T-40 160 Z"
        fill="url(#la_emerald)"
      />
    </g>

    {/* Morphing Ribbon 3: Luminous Cyan Silk */}
    <g className="la-wave-3">
      <path
        d="M-30 110 Q250 60 520 120 T970 85 L970 190 Q720 155 520 205 T-30 180 Z"
        fill="url(#la_cyan)"
      />
    </g>

    {/* Dark Silhouetted Arctic Mountain Coast */}
    <path d="M0 240 Q250 205 500 230 T900 215 L900 300 L0 300 Z" fill="#030C16" />
    <path d="M0 265 Q350 235 700 260 L900 250 L900 300 L0 300 Z" fill="#01060B" />
  </svg>
);

// ─── 12. COSMIC GATE (Animated) ───────────────────────────────────────────────
export const CosmicGateBanner: React.FC<{ canAnimate: boolean }> = ({ canAnimate }) => (
  <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
    <defs>
      <linearGradient id="cg_void" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#03000A" />
        <stop offset="50%" stopColor="#0C041E" />
        <stop offset="100%" stopColor="#190838" />
      </linearGradient>

      {/* Galaxy Core Radial Glow */}
      <radialGradient id="cg_galaxy_core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="25%" stopColor="#A855F7" stopOpacity="0.8" />
        <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      {/* Torii Pulsing Aura */}
      <radialGradient id="cg_torii_pulse" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
        <stop offset="70%" stopColor="#DC2626" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      <style>{`
        @keyframes cg_rotate_galaxy {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cg_pulse_gate {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .cg-galaxy-spin {
          transform-origin: 450px 140px;
          animation: ${canAnimate ? 'cg_rotate_galaxy 45s linear infinite' : 'none'};
        }
        .cg-gate-glow {
          transform-origin: 450px 135px;
          animation: ${canAnimate ? 'cg_pulse_gate 4s ease-in-out infinite' : 'none'};
        }
        @media (prefers-reduced-motion: reduce) {
          .cg-galaxy-spin, .cg-gate-glow { animation: none !important; }
        }
      `}</style>
    </defs>

    {/* Void Sky */}
    <rect width="900" height="300" fill="url(#cg_void)" />

    {/* Rotating Galaxy Spiral Center (Behind Torii Gate) */}
    <g className="cg-galaxy-spin">
      {/* Brilliant Galaxy Core */}
      <ellipse cx="450" cy="140" rx="140" ry="140" fill="url(#cg_galaxy_core)" />
      {/* Spiral Arm 1 */}
      <path
        d="M450 140 Q550 80 620 140 T680 240 Q620 280 500 250"
        stroke="#C084FC"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Spiral Arm 2 */}
      <path
        d="M450 140 Q350 200 280 140 T220 40 Q280 0 400 30"
        stroke="#38BDF8"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Dust & Star Accents in Arms */}
      {[
        [520, 110], [580, 130], [630, 180], [660, 230],
        [380, 170], [320, 150], [270, 100], [240, 50]
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="#FFFFFF" opacity="0.8" />
      ))}
    </g>

    {/* Pulsing Gate Aura */}
    <circle cx="450" cy="135" r="90" fill="url(#cg_torii_pulse)" className="cg-gate-glow" />

    {/* Celestial Glowing Torii Gate (Centered at 450, 65) */}
    <g transform="translate(365, 55)">
      {/* Left Pillar */}
      <rect x="25" y="25" width="16" height="175" fill="#DC2626" rx="2" />
      <rect x="21" y="195" width="24" height="6" fill="#18181B" rx="1" />
      {/* Right Pillar */}
      <rect x="130" y="25" width="16" height="175" fill="#DC2626" rx="2" />
      <rect x="126" y="195" width="24" height="6" fill="#18181B" rx="1" />

      {/* Kasagi (Top Curved Crimson Beam with Gold Trim) */}
      <path d="M0 32 Q85 10 170 32 L166 12 Q85 -6 4 12 Z" fill="#EF4444" />
      <path d="M2 14 Q85 -4 168 14 L167 9 Q85 -8 3 9 Z" fill="#FBBF24" />

      {/* Nuki (Tie Beam) */}
      <rect x="14" y="58" width="142" height="12" fill="#DC2626" rx="1" />

      {/* Sacred Shimenawa Rope & Shide Paper Streamers */}
      <path d="M25 68 Q85 85 145 68" stroke="#FEF08A" strokeWidth="3" fill="none" />
      <polygon points="60,78 54,92 64,90" fill="#FFFFFF" />
      <polygon points="85,82 79,96 89,94" fill="#FFFFFF" />
      <polygon points="110,78 104,92 114,90" fill="#FFFFFF" />
    </g>

    {/* Distant Cosmic Temple Step Platform */}
    <polygon points="300,260 600,260 660,300 240,300" fill="#0A0314" stroke="#7C3AED" strokeWidth="1" />
    <line x1="280" y1="275" x2="620" y2="275" stroke="#A855F7" strokeWidth="1" opacity="0.4" />
  </svg>
);
