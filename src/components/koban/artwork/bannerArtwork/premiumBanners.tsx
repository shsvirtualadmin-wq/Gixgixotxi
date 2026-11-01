import React from 'react';

interface BannerProps {
  canAnimate?: boolean;
}

/**
 * 1. Crimson Dragon's Descent (Mythic, Animated Embers & Lightning)
 */
export const CrimsonDragonsDescentBanner: React.FC<BannerProps> = ({ canAnimate = false }) => (
  <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice" className="w-full h-full block select-none">
    <defs>
      <linearGradient id="cdd_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#090103" />
        <stop offset="45%" stopColor="#26050B" />
        <stop offset="80%" stopColor="#5C0B16" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      <radialGradient id="cdd_core" cx="55%" cy="38%" r="52%">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
        <stop offset="45%" stopColor="#DC2626" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#090103" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cdd_dragon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="30%" stopColor="#F59E0B" />
        <stop offset="70%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#450A0A" />
      </linearGradient>
    </defs>

    <rect width="1200" height="675" fill="url(#cdd_sky)" />
    <rect width="1200" height="675" fill="url(#cdd_core)" />

    {/* Eclipse Sun & Gold Ring */}
    <circle cx="660" cy="245" r="145" fill="#180205" stroke="#F59E0B" strokeWidth="4" opacity="0.9" />
    <circle
      cx="660"
      cy="245"
      r="165"
      fill="none"
      stroke="#DC2626"
      strokeWidth="2"
      strokeDasharray="14 10"
      opacity="0.7"
      style={canAnimate ? { transformOrigin: '660px 245px', animation: 'koban-orbit-cw 22s linear infinite' } : undefined}
    />

    {/* Jagged Volcanic Ridges */}
    <polygon points="0,675 0,460 190,370 360,480 540,390 760,500 980,360 1200,450 1200,675" fill="#160307" />
    <polygon points="0,675 140,510 350,565 610,465 860,545 1090,460 1200,525 1200,675" fill="#0B0103" />

    {/* Descending Elder Dragon Silhouette & Wing Spines */}
    <g>
      {/* Left Great Wing */}
      <path
        d="M570 250 C430 120 240 110 90 195 C210 215 310 255 370 325 C430 285 500 275 570 280 Z"
        fill="url(#cdd_dragon)"
        opacity="0.92"
      />
      <path d="M565 258 L260 155 M550 268 L325 225 M535 275 L370 295" stroke="#FEF08A" strokeWidth="2.2" opacity="0.75" />

      {/* Right Great Wing */}
      <path
        d="M685 245 C825 105 1015 95 1145 180 C1035 210 935 250 875 320 C810 280 745 270 685 275 Z"
        fill="url(#cdd_dragon)"
        opacity="0.92"
      />
      <path d="M695 252 L995 145 M705 262 L925 218 M715 270 L875 290" stroke="#FEF08A" strokeWidth="2.2" opacity="0.75" />

      {/* Serpentine Coiling Dragon Body & Tail */}
      <path
        d="M410 470 C360 390 480 330 595 295 C695 265 770 210 735 145 C705 95 620 110 615 175 C610 235 660 275 635 340"
        fill="none"
        stroke="url(#cdd_dragon)"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M410 470 C360 390 480 330 595 295 C695 265 770 210 735 145"
        fill="none"
        stroke="#FEF08A"
        strokeWidth="4"
        strokeDasharray="8 12"
        opacity="0.85"
      />

      {/* Dragon Head, Horns & Glowing Eyes */}
      <polygon points="605,310 665,310 650,370 635,388 620,370" fill="#450A0A" stroke="#F59E0B" strokeWidth="2.5" />
      <path d="M612 312 L575 265 M658 312 L695 265" stroke="#FEF08A" strokeWidth="5" strokeLinecap="round" />
      <circle cx="624" cy="342" r="4.5" fill="#FEF08A" />
      <circle cx="646" cy="342" r="4.5" fill="#FEF08A" />

      {/* Dragon Fire Breath Plume */}
      <path
        d="M635 388 C615 450 565 520 510 615 C595 575 665 580 735 625 C685 520 655 450 635 388 Z"
        fill="url(#cdd_dragon)"
        opacity="0.75"
        style={canAnimate ? { animation: 'koban-pulse-glow 2.2s ease-in-out infinite' } : undefined}
      />
    </g>

    {/* Rising Molten Embers */}
    <g style={canAnimate ? { animation: 'koban-ember-rise 3.2s ease-out infinite' } : undefined}>
      <circle cx="240" cy="520" r="5" fill="#FEF08A" />
      <circle cx="390" cy="440" r="4" fill="#F59E0B" />
      <circle cx="520" cy="560" r="6" fill="#EF4444" />
      <circle cx="780" cy="490" r="5" fill="#FEF08A" />
      <circle cx="940" cy="420" r="4.5" fill="#F97316" />
      <circle cx="1060" cy="540" r="5.5" fill="#EF4444" />
    </g>
  </svg>
);

/**
 * 2. Neon Kyoto Rain (Legendary, Animated Rain & Reflections)
 */
export const NeonKyotoRainBanner: React.FC<BannerProps> = ({ canAnimate = false }) => (
  <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice" className="w-full h-full block select-none">
    <defs>
      <linearGradient id="nkr_bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#050816" />
        <stop offset="50%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
      <linearGradient id="nkr_cyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="nkr_pink" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF007A" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#FF007A" stopOpacity="0" />
      </linearGradient>
    </defs>

    <rect width="1200" height="675" fill="url(#nkr_bg)" />

    {/* Holographic Moon & Horizon Glow */}
    <circle cx="880" cy="190" r="105" fill="#FF007A" opacity="0.22" />
    <circle cx="880" cy="190" r="78" fill="#00F0FF" opacity="0.18" />
    <circle cx="880" cy="190" r="64" fill="none" stroke="#00F0FF" strokeWidth="2.5" opacity="0.8" />

    {/* Kyoto 5-Tier Pagoda Silhouette */}
    <g fill="#090D1A" stroke="#00F0FF" strokeWidth="1.5" strokeOpacity="0.55">
      <polygon points="240,460 480,460 450,425 270,425" />
      <polygon points="255,400 465,400 438,368 282,368" />
      <polygon points="272,342 448,342 422,312 298,312" />
      <polygon points="290,288 430,288 408,260 312,260" />
      <polygon points="310,238 410,238 390,212 330,212" />
      <line x1="360" y1="145" x2="360" y2="212" stroke="#FF007A" strokeWidth="4" />
    </g>

    {/* Neon Vertical Signage */}
    <rect x="620" y="180" width="44" height="190" rx="6" fill="#0F172A" stroke="#FF007A" strokeWidth="3" />
    <circle cx="642" cy="225" r="10" fill="#FF007A" opacity="0.85" />
    <rect x="632" y="255" width="20" height="6" fill="#00F0FF" />
    <rect x="632" y="275" width="20" height="6" fill="#FF007A" />
    <rect x="632" y="295" width="20" height="6" fill="#00F0FF" />

    <rect x="1020" y="220" width="38" height="160" rx="6" fill="#0F172A" stroke="#00F0FF" strokeWidth="2.5" />
    <rect x="1030" y="245" width="18" height="8" fill="#00F0FF" />
    <rect x="1030" y="270" width="18" height="8" fill="#FDE047" />
    <rect x="1030" y="295" width="18" height="8" fill="#FF007A" />

    {/* Wet Cobblestone Street Reflections */}
    <rect x="0" y="475" width="1200" height="200" fill="#050711" />
    <ellipse cx="360" cy="545" rx="160" ry="18" fill="#00F0FF" opacity="0.22" />
    <ellipse cx="642" cy="565" rx="140" ry="22" fill="#FF007A" opacity="0.28" />
    <ellipse cx="920" cy="535" rx="180" ry="20" fill="#00F0FF" opacity="0.2" />

    {/* Animated Diagonal Neon Rain */}
    <g
      strokeWidth="2"
      strokeLinecap="round"
      style={canAnimate ? { animation: 'koban-grid-scroll 2.4s linear infinite' } : undefined}
    >
      <line x1="140" y1="40" x2="90" y2="190" stroke="url(#nkr_cyan)" />
      <line x1="290" y1="80" x2="240" y2="230" stroke="url(#nkr_pink)" />
      <line x1="470" y1="30" x2="420" y2="180" stroke="url(#nkr_cyan)" />
      <line x1="690" y1="60" x2="640" y2="210" stroke="url(#nkr_pink)" />
      <line x1="840" y1="20" x2="790" y2="170" stroke="url(#nkr_cyan)" />
      <line x1="1040" y1="70" x2="990" y2="220" stroke="url(#nkr_pink)" />
      <line x1="210" y1="280" x2="160" y2="430" stroke="url(#nkr_cyan)" />
      <line x1="560" y1="260" x2="510" y2="410" stroke="url(#nkr_pink)" />
      <line x1="920" y1="290" x2="870" y2="440" stroke="url(#nkr_cyan)" />
    </g>
  </svg>
);

/**
 * 3. Blood Moon Ronin (Legendary, Animated Eclipse & Embers)
 */
export const BloodMoonRoninBanner: React.FC<BannerProps> = ({ canAnimate = false }) => (
  <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice" className="w-full h-full block select-none">
    <defs>
      <linearGradient id="bmr_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#090204" />
        <stop offset="55%" stopColor="#2A070D" />
        <stop offset="100%" stopColor="#520915" />
      </linearGradient>
      <radialGradient id="bmr_moon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="55%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </radialGradient>
    </defs>

    <rect width="1200" height="675" fill="url(#bmr_sky)" />

    {/* Colossal Blood Moon */}
    <circle
      cx="780"
      cy="280"
      r="195"
      fill="url(#bmr_moon)"
      opacity="0.92"
      style={canAnimate ? { animation: 'koban-pulse-glow 3.6s ease-in-out infinite' } : undefined}
    />
    <circle cx="780" cy="280" r="225" fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0.35" />

    {/* Wind-Swept Cliff & Grass */}
    <path d="M0 675 L0 430 Q340 390 680 490 L1200 560 L1200 675 Z" fill="#090204" />

    {/* Lone Ronin Silhouette on Ridge */}
    <g transform="translate(360, 255)">
      {/* Straw Kasa Hat */}
      <polygon points="0,48 64,22 128,48 98,54 30,54" fill="#050102" stroke="#FCA5A5" strokeWidth="1.2" />
      {/* Haori Cloak & Stance */}
      <polygon points="38,52 90,52 115,175 18,175" fill="#050102" />
      {/* Flowing Crimson Scarf */}
      <path
        d="M84 64 C135 52 185 74 230 58 C195 86 145 92 88 82 Z"
        fill="#DC2626"
        style={canAnimate ? { animation: 'koban-flame-flicker 2.4s ease-in-out infinite' } : undefined}
      />
      {/* Drawn Katana Gleam */}
      <line x1="95" y1="115" x2="245" y2="55" stroke="#FEF2F2" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="95" y1="115" x2="245" y2="55" stroke="#EF4444" strokeWidth="7" strokeLinecap="round" opacity="0.35" />
    </g>

    {/* Drifting Scarlet Petals */}
    <g fill="#FCA5A5" opacity="0.85" style={canAnimate ? { animation: 'koban-petal-fall 4s ease-in-out infinite' } : undefined}>
      <ellipse cx="220" cy="190" rx="8" ry="4" transform="rotate(-25 220 190)" />
      <ellipse cx="540" cy="150" rx="9" ry="4.5" transform="rotate(15 540 150)" />
      <ellipse cx="690" cy="240" rx="7" ry="3.5" transform="rotate(-35 690 240)" />
      <ellipse cx="940" cy="180" rx="8.5" ry="4" transform="rotate(20 940 180)" />
      <ellipse cx="860" cy="360" rx="7.5" ry="3.5" transform="rotate(-15 860 360)" />
    </g>
  </svg>
);

/**
 * 4. Celestial Koi River (Epic, Animated Ripples & Astral Koi)
 */
export const CelestialKoiRiverBanner: React.FC<BannerProps> = ({ canAnimate = false }) => (
  <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice" className="w-full h-full block select-none">
    <defs>
      <linearGradient id="ckr_bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#030712" />
        <stop offset="50%" stopColor="#0C2442" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
      <linearGradient id="ckr_stream" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.1" />
        <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#818CF8" stopOpacity="0.15" />
      </linearGradient>
    </defs>

    <rect width="1200" height="675" fill="url(#ckr_bg)" />

    {/* Winding Astral River Ribbon */}
    <path
      d="M-50 520 C280 360 480 560 760 340 C960 180 1090 260 1250 140 L1250 340 C1060 440 920 390 740 520 C460 700 260 520 -50 660 Z"
      fill="url(#ckr_stream)"
    />

    {/* Concentric Ripple Rings */}
    <g
      fill="none"
      stroke="#7DD3FC"
      strokeWidth="2"
      opacity="0.55"
      style={canAnimate ? { animation: 'koban-water-ripple 3.4s ease-in-out infinite' } : undefined}
    >
      <circle cx="480" cy="430" r="48" />
      <circle cx="480" cy="430" r="82" strokeOpacity="0.4" />
      <circle cx="820" cy="290" r="52" />
      <circle cx="820" cy="290" r="90" strokeOpacity="0.4" />
    </g>

    {/* Golden Koi Silhouette */}
    <g transform="translate(440, 395) rotate(-22)">
      <path d="M0 25 C35 0 85 5 115 25 C85 45 35 50 0 25 Z" fill="#F59E0B" />
      <polygon points="0,25 -32,6 -22,25 -32,44" fill="#FEF08A" />
      <circle cx="92" cy="20" r="3" fill="#FFFBEB" />
    </g>

    {/* Silver-Cyan Astral Koi Silhouette */}
    <g transform="translate(860, 315) rotate(158)">
      <path d="M0 25 C35 0 85 5 115 25 C85 45 35 50 0 25 Z" fill="#38BDF8" />
      <polygon points="0,25 -32,6 -22,25 -32,44" fill="#E0F2FE" />
      <circle cx="92" cy="20" r="3" fill="#FFFFFF" />
    </g>

    {/* Constellation Stars */}
    <g fill="#FEF08A" opacity="0.85">
      <circle cx="210" cy="160" r="3" />
      <circle cx="310" cy="120" r="4" />
      <circle cx="410" cy="175" r="3" />
      <line x1="210" y1="160" x2="310" y2="120" stroke="#7DD3FC" strokeWidth="1" opacity="0.4" />
      <line x1="310" y1="120" x2="410" y2="175" stroke="#7DD3FC" strokeWidth="1" opacity="0.4" />
    </g>
  </svg>
);

/**
 * 5. Obsidian Shogun Citadel (Epic, Static High-Contrast Fortress)
 */
export const ObsidianShogunCitadelBanner: React.FC = () => (
  <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice" className="w-full h-full block select-none">
    <defs>
      <linearGradient id="osc_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#09090B" />
        <stop offset="60%" stopColor="#18181B" />
        <stop offset="100%" stopColor="#450A0A" />
      </linearGradient>
    </defs>

    <rect width="1200" height="675" fill="url(#osc_sky)" />

    {/* Crimson Horizon Backlight */}
    <ellipse cx="600" cy="520" rx="520" ry="180" fill="#DC2626" opacity="0.28" />

    {/* Obsidian Fortress Keep Silhouette */}
    <g fill="#09090B" stroke="#F59E0B" strokeWidth="1.8" strokeOpacity="0.65">
      <polygon points="360,540 840,540 800,430 400,430" />
      <polygon points="410,430 790,430 750,335 450,335" />
      <polygon points="465,335 735,335 700,250 500,250" />
      <polygon points="515,250 685,250 655,180 545,180" />
      {/* Shachihoko Roof Finials */}
      <path d="M545 180 L530 155 M655 180 L670 155" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" />
    </g>

    {/* Illuminated Shoji Citadel Windows */}
    <g fill="#EF4444" opacity="0.85">
      <rect x="575" y="205" width="18" height="24" rx="2" />
      <rect x="607" y="205" width="18" height="24" rx="2" />
      <rect x="545" y="280" width="22" height="28" rx="2" />
      <rect x="589" y="280" width="22" height="28" rx="2" />
      <rect x="633" y="280" width="22" height="28" rx="2" />
    </g>

    {/* Volcanic Basalt Pillars & Magma Fissures */}
    <polygon points="0,675 0,480 260,530 440,675" fill="#050507" />
    <polygon points="1200,675 1200,470 930,525 760,675" fill="#050507" />
    <path d="M360 540 L290 675 M840 540 L910 675 M600 540 L600 675" stroke="#EF4444" strokeWidth="3" opacity="0.7" />
  </svg>
);
