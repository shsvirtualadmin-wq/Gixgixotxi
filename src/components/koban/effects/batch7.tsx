import React from 'react';
import type { EffectComponentModule } from './types';

// ─── 19. EFFECT: effect-divine-radiance (Solar Eclipse Sun-Bird) ──────────────
// Solar corona eclipse with mythic sun-bird ascending through rotating radiant flares
export const EffectDivineRadiance: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="380" r="120" fill="#000000" stroke="#F59E0B" strokeWidth="6" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes solarCrownSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes sunBirdRise { 0% { transform: translateY(70px) scale(0.6); opacity: 0; } 30% { transform: translateY(0) scale(1.05); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(-40px) scale(1.15); opacity: 0; } }
          @keyframes flarePulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.15); opacity: 0.9; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Rotating Radiant Solar Ray Flares */}
          <g className="origin-center animate-[solarCrownSpin_12s_linear_infinite]" transform="translate(300, 360)">
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((deg) => (
              <polygon key={deg} points="0,0 -8,-320 8,-320" fill="url(#sunFlareGrad)" transform={`rotate(${deg})`} />
            ))}
          </g>

          {/* Layer 2: Black Total Eclipse Disc with White-Hot Corona Ring */}
          <g className="animate-[flarePulse_3s_ease-in-out_infinite]" transform="translate(300, 360)">
            <circle cx="0" cy="0" r="140" fill="url(#coronaAuraGrad)" />
            <circle cx="0" cy="0" r="105" fill="#09090B" stroke="#FEF08A" strokeWidth="3" />
          </g>

          {/* Layer 3: Mythic Three-Legged Sun-Bird (Yatagarasu) Ascending */}
          <g className="origin-center animate-[sunBirdRise_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(300, 350)">
            {/* Spread Silhouette Wings */}
            <path d="M0 20 C-60 -30 -140 -20 -190 40 C-150 55 -100 60 -40 45 Z" fill="#F59E0B" />
            <path d="M0 20 C60 -30 140 -20 190 40 C150 55 100 60 40 45 Z" fill="#F59E0B" />
            {/* Crowned Sun-Bird Head */}
            <circle cx="0" cy="-15" r="14" fill="#FEF08A" />
            <polygon points="0,-25 -8,-45 8,-45" fill="#EF4444" />
            {/* Three Mythic Talons */}
            <line x1="-12" y1="50" x2="-20" y2="75" stroke="#FBBF24" strokeWidth="2.5" />
            <line x1="0" y1="50" x2="0" y2="80" stroke="#FBBF24" strokeWidth="2.5" />
            <line x1="12" y1="50" x2="20" y2="75" stroke="#FBBF24" strokeWidth="2.5" />
          </g>

          <defs>
            <linearGradient id="sunFlareGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#D97706" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="coronaAuraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="65%" stopColor="#FEF08A" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#F59E0B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="60" r="30" fill="#09090B" stroke="#FEF08A" strokeWidth="2.5" className="animate-pulse" />
        <path d="M100 60 C80 40 50 45 35 60 C55 65 75 65 100 60 Z" fill="#F59E0B" />
        <path d="M100 60 C120 40 150 45 165 60 C145 65 125 65 100 60 Z" fill="#F59E0B" />
      </svg>
    </div>
  ),
};

// ─── 20. EFFECT: effect-thunder-storm (Raijin Thunder Spirit) ─────────────────
// Thunder spirit riding storm clouds surrounded by orbiting thunder drums and jagged lightning
export const EffectThunderStorm: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="380" r="140" fill="none" stroke="#FBBF24" strokeWidth="3" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes drumRingSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes thunderBoltHit { 0%, 100% { opacity: 0; } 10%, 16% { opacity: 1; } 35%, 40% { opacity: 0.9; } 70%, 75% { opacity: 1; } }
          @keyframes spiritSwell { 0% { transform: scale(0.8); opacity: 0; } 30% { transform: scale(1.05); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: scale(1.15); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Orbiting Thunder Drums (Taiko ring with Mitsudomoe emblems) */}
          <g className="origin-center animate-[drumRingSpin_9s_linear_infinite]" transform="translate(300, 360)">
            <circle cx="0" cy="0" r="180" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.4" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg}) translate(0, -180)`}>
                {/* Drum */}
                <circle cx="0" cy="0" r="18" fill="#B45309" stroke="#FEF08A" strokeWidth="2" />
                <circle cx="0" cy="0" r="12" fill="#78350F" />
                {/* Tomoe curl */}
                <circle cx="0" cy="-3" r="3" fill="#FEF08A" />
              </g>
            ))}
          </g>

          {/* Layer 2: Central Storm Deity Core */}
          <g className="origin-center animate-[spiritSwell_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(300, 360)">
            {/* Muscular Spirit Halo & Horns */}
            <path d="M-40 -40 Q0 -90 40 -40 Q0 -60 -40 -40 Z" fill="#F59E0B" />
            <circle cx="0" cy="0" r="45" fill="#1E293B" stroke="#FDE047" strokeWidth="2.5" />
            <circle cx="-14" cy="-8" r="4" fill="#00F0FF" />
            <circle cx="14" cy="-8" r="4" fill="#00F0FF" />
          </g>

          {/* Layer 3: Instant Lightning Strikes connecting drums */}
          <g className="animate-[thunderBoltHit_2.5s_infinite]">
            <polyline points="300,180 340,260 280,310 300,360" stroke="#FEF08A" strokeWidth="3" fill="none" />
            <polyline points="480,360 410,340 370,390 300,360" stroke="#67E8F9" strokeWidth="3" fill="none" />
          </g>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="60" r="42" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '8s' }} />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle key={deg} cx={100 + Math.cos((deg * Math.PI) / 180) * 42} cy={60 + Math.sin((deg * Math.PI) / 180) * 42} r="6" fill="#B45309" stroke="#FEF08A" strokeWidth="1" />
        ))}
        <polyline points="90,40 105,60 95,65 110,80" stroke="#FEF08A" strokeWidth="2" fill="none" className="animate-pulse" />
      </svg>
    </div>
  ),
};

// ─── 21. EFFECT: effect-celestial-star-drift (Sky Island Cascade) ─────────────
// Floating sky island with glowing cascading waterfall and drifting ethereal spirit wisps
export const EffectCelestialStarDrift: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <polygon points="200,420 400,420 300,560" fill="#38BDF8" opacity="0.4" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes islandFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
          @keyframes waterfallFlow { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 80; } }
          @keyframes wispSway { 0% { transform: translateY(0) translateX(0); opacity: 0; } 25% { opacity: 0.9; } 80% { opacity: 0.9; } 100% { transform: translateY(-160px) translateX(-40px); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Floating Celestial Island Rock Formation */}
          <g className="animate-[islandFloat_6s_ease-in-out_infinite]" transform="translate(180, 360)">
            {/* Grassy Top Plateau */}
            <path d="M0 40 Q120 15 240 40 L220 65 Q120 50 20 65 Z" fill="#15803D" />
            {/* Inverted Mountain Cone Rock Base */}
            <polygon points="10,50 230,50 120,220" fill="url(#islandRockGrad)" />
            {/* Bonsai Tree rooted in stone */}
            <path d="M70 40 C65 10 90 -10 110 -20" stroke="#78350F" strokeWidth="5" fill="none" />
            <circle cx="110" cy="-20" r="22" fill="#16A34A" />
            <circle cx="95" cy="-10" r="16" fill="#22C55E" />

            {/* Glowing Waterfall Pouring Down from Peak into Ether */}
            <line x1="160" y1="45" x2="160" y2="280" stroke="#38BDF8" strokeWidth="8" strokeDasharray="16 8" strokeLinecap="round" className="animate-[waterfallFlow_1s_linear_infinite]" opacity="0.85" />
            <line x1="160" y1="45" x2="160" y2="260" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="12 12" className="animate-[waterfallFlow_0.8s_linear_infinite]" />
          </g>

          {/* Layer 2: Drifting Bioluminescent Spirit Wisps */}
          <g>
            {[
              { x: 220, y: 520, d: '0s' },
              { x: 320, y: 480, d: '0.8s' },
              { x: 420, y: 540, d: '1.5s' },
              { x: 260, y: 440, d: '1.1s' },
            ].map((w, idx) => (
              <g key={idx} transform={`translate(${w.x}, ${w.y})`} style={{ animation: `wispSway 3.5s ease-out infinite ${w.d}` }}>
                <circle cx="0" cy="0" r="6" fill="#67E8F9" opacity="0.4" />
                <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
              </g>
            ))}
          </g>

          <defs>
            <linearGradient id="islandRockGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="60%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <polygon points="50,45 150,45 100,105" fill="#334155" />
        <ellipse cx="100" cy="45" rx="52" ry="10" fill="#15803D" />
        <line x1="120" y1="45" x2="120" y2="115" stroke="#38BDF8" strokeWidth="4" strokeDasharray="6 4" className="animate-pulse" />
        <circle cx="70" cy="30" r="8" fill="#22C55E" />
      </svg>
    </div>
  ),
};
