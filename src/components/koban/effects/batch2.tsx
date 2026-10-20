import React from 'react';
import type { EffectComponentModule } from './types';

// ─── 4. EFFECT: effect-ink-brush-splash (Sumi-e Tiger Painter) ────────────────
// Ink-brush tiger painting itself stroke by stroke with calligraphy ink droplets and red seal stamp
export const EffectInkBrushSplash: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-70">
            <path d="M180 340 Q300 280 420 340 Q300 400 180 340 Z" fill="#0F172A" />
            <rect x="420" y="240" width="30" height="30" fill="#DC2626" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes strokeReveal { 0% { stroke-dashoffset: 600; opacity: 0; } 30% { opacity: 0.95; } 100% { stroke-dashoffset: 0; opacity: 0.95; } }
          @keyframes inkTigerLeap { 0% { transform: translateY(50px) scale(0.9); opacity: 0; } 30% { transform: translateY(0) scale(1); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(-30px) scale(1.05); opacity: 0; } }
          @keyframes sealStamp { 0%, 25% { transform: scale(3) rotate(-20deg); opacity: 0; } 35% { transform: scale(1) rotate(0deg); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: scale(0.95); opacity: 0; } }
          @keyframes splatterDrift { 0% { transform: translate(0, 0) scale(0.8); opacity: 0; } 20% { opacity: 0.85; } 80% { opacity: 0.85; } 100% { transform: translate(25px, -60px) scale(1.2); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Rice paper texture vignette */}
          <rect width="600" height="800" fill="url(#inkWashVignette)" opacity="0.3" />

          {/* Layer 2: Sweeping Sumi-e Brush Stroke Arch */}
          <path
            d="M50 260 C160 140 440 160 550 300"
            stroke="#0F172A"
            strokeWidth="32"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="600"
            className="animate-[strokeReveal_3s_ease-out_forwards]"
            opacity="0.85"
          />

          {/* Layer 3: Secondary energetic calligraphy counter-stroke */}
          <path
            d="M520 220 C420 380 220 440 80 400"
            stroke="#1E293B"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="600"
            className="animate-[strokeReveal_3.5s_ease-out_forwards]"
            opacity="0.75"
          />

          {/* Layer 4: Ink-brush Tiger Silhouette Leaping */}
          <g className="origin-center animate-[inkTigerLeap_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(180, 240)">
            {/* Tiger Muscular Body & Arch */}
            <path d="M40 180 C80 120 180 110 240 150 C210 180 170 190 120 210 C70 230 40 210 40 180 Z" fill="#0F172A" />
            {/* Tiger Roaring Head & Snarl */}
            <path d="M220 140 C240 110 280 120 290 150 C280 170 250 180 230 165 Z" fill="#0F172A" />
            <polygon points="275,130 265,115 255,135" fill="#0F172A" /> {/* Ear */}
            {/* White-Ink Glowing Eyes */}
            <circle cx="265" cy="142" r="3.5" fill="#FEF08A" />
            {/* Tiger Claws Extended */}
            <path d="M220 180 L250 240 L260 235 L235 175 Z" fill="#0F172A" />
            {/* Flowing Tail Wave */}
            <path d="M45 185 C20 195 5 220 15 250 C25 240 25 210 50 195 Z" fill="#0F172A" />
            {/* Tiger Ink Stripes */}
            <path d="M120 135 L135 170 M155 130 L168 165 M185 135 L195 168" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          </g>

          {/* Layer 5: Traditional Red Inkan Stamp / Seal (Bottom Right) */}
          <g className="origin-center animate-[sealStamp_5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(420, 280)">
            <rect width="44" height="44" rx="4" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
            <path d="M10 12 H34 V32 H10 Z" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="22" cy="22" r="6" fill="#FFFFFF" />
          </g>

          {/* Layer 6: Flying Ink Droplets / Splatters */}
          <g>
            {[
              { x: 140, y: 320, r: 6, d: '0s' },
              { x: 240, y: 220, r: 4, d: '0.4s' },
              { x: 380, y: 190, r: 5, d: '0.8s' },
              { x: 440, y: 360, r: 3.5, d: '1.2s' },
              { x: 200, y: 460, r: 5, d: '0.6s' },
              { x: 320, y: 420, r: 4, d: '1.5s' },
            ].map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill="#0F172A"
                style={{ animation: `splatterDrift 4s ease-out infinite ${d.d}` }}
              />
            ))}
          </g>

          <defs>
            <radialGradient id="inkWashVignette" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.7" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <path d="M20 70 C70 30 130 30 180 70" stroke="#334155" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M60 80 Q100 45 140 75 Q110 85 60 80 Z" fill="#0F172A" />
        <rect x="145" y="30" width="18" height="18" rx="2" fill="#DC2626" className="animate-pulse" />
        <circle cx="120" cy="55" r="2.5" fill="#FEF08A" />
        <circle cx="45" cy="45" r="3" fill="#0F172A" />
      </svg>
    </div>
  ),
};

// ─── 5. EFFECT: effect-star-chart (Galaxy Weaver Astrolabe) ───────────────────
// Starry galaxy weaver unraveling ribbons of glowing constellations and spinning armillary rings
export const EffectStarChart: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-70">
            <circle cx="300" cy="380" r="160" fill="none" stroke="#6366F1" strokeWidth="2" strokeDasharray="8 8" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes armillarySpin1 { 0% { transform: rotate(0deg) scale(0.9); } 50% { transform: rotate(180deg) scale(1.05); } 100% { transform: rotate(360deg) scale(0.9); } }
          @keyframes armillarySpin2 { 0% { transform: rotate(360deg) skewX(12deg); } 100% { transform: rotate(0deg) skewX(12deg); } }
          @keyframes meteorShower { 0% { transform: translateY(-120px) translateX(80px); opacity: 0; } 20% { opacity: 0.95; } 80% { opacity: 0.95; } 100% { transform: translateY(320px) translateX(-200px); opacity: 0; } }
          @keyframes constellationPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.95; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Armillary Astrolabe Outer Ring */}
          <g className="origin-center animate-[armillarySpin1_10s_linear_infinite]" transform="translate(300, 360)">
            <circle cx="0" cy="0" r="220" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="12 6" opacity="0.4" />
            <circle cx="0" cy="0" r="180" fill="none" stroke="#818CF8" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            <line x1="-220" y1="0" x2="220" y2="0" stroke="#6366F1" strokeWidth="1" opacity="0.3" />
            <line x1="0" y1="-220" x2="0" y2="220" stroke="#6366F1" strokeWidth="1" opacity="0.3" />
          </g>

          {/* Layer 2: Skewed Elliptical Celestial Ring */}
          <g className="origin-center animate-[armillarySpin2_12s_linear_infinite]" transform="translate(300, 360)">
            <ellipse cx="0" cy="0" rx="200" ry="80" fill="none" stroke="#C084FC" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.7" />
          </g>

          {/* Layer 3: Starry Weaver Constellation Lines */}
          <g className="animate-[constellationPulse_3s_ease-in-out_infinite]">
            <polyline points="180,240 240,200 320,220 380,180 440,240" fill="none" stroke="#E0E7FF" strokeWidth="1.5" />
            <polyline points="240,200 280,300 360,340 420,280" fill="none" stroke="#A5B4FC" strokeWidth="1.2" strokeDasharray="4 3" />
            {/* Glowing Celestial Stars */}
            {[
              { cx: 180, cy: 240, r: 4 },
              { cx: 240, cy: 200, r: 5 },
              { cx: 320, cy: 220, r: 4 },
              { cx: 380, cy: 180, r: 6 },
              { cx: 440, cy: 240, r: 4 },
              { cx: 280, cy: 300, r: 4.5 },
              { cx: 360, cy: 340, r: 5 },
              { cx: 420, cy: 280, r: 4 },
            ].map((star, idx) => (
              <g key={idx}>
                <circle cx={star.cx} cy={star.cy} r={star.r * 2} fill="#818CF8" opacity="0.3" />
                <circle cx={star.cx} cy={star.cy} r={star.r} fill="#FFFFFF" />
              </g>
            ))}
          </g>

          {/* Layer 4: Diagonal Falling Shooting Comet Trails */}
          <g>
            {[
              { x: 380, y: 160, delay: '0s' },
              { x: 460, y: 220, delay: '1.2s' },
              { x: 320, y: 120, delay: '2.0s' },
            ].map((comet, idx) => (
              <g key={idx} transform={`translate(${comet.x}, ${comet.y})`} style={{ animation: `meteorShower 2.5s ease-out infinite ${comet.delay}` }}>
                <line x1="0" y1="0" x2="-80" y2="120" stroke="url(#cometTrailGrad)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
              </g>
            ))}
          </g>

          <defs>
            <linearGradient id="cometTrailGrad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#818CF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="60" r="45" fill="none" stroke="#6366F1" strokeWidth="1" strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '16s' }} />
        <ellipse cx="100" cy="60" rx="55" ry="22" fill="none" stroke="#C084FC" strokeWidth="1" />
        <polyline points="70,50 90,40 120,48 140,36" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="90" cy="40" r="3" fill="#FFFFFF" className="animate-pulse" />
        <circle cx="120" cy="48" r="3" fill="#FFFFFF" className="animate-pulse" />
      </svg>
    </div>
  ),
};

// ─── 6. EFFECT: effect-frosted-crystal (Aurora Wolf) ──────────────────────────
// White spirit wolf howling over frosted crags with dancing indigo & emerald aurora curtains
export const EffectFrostedCrystal: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <path d="M0 240 Q300 180 600 240 L600 450 L0 450 Z" fill="url(#auroraWaveGrad1)" opacity="0.5" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes auroraDance1 { 0% { transform: translateY(0) scaleY(1); opacity: 0.5; } 50% { transform: translateY(-30px) scaleY(1.2); opacity: 0.85; } 100% { transform: translateY(0) scaleY(1); opacity: 0.5; } }
          @keyframes auroraDance2 { 0% { transform: translateY(0) scaleX(1); opacity: 0.4; } 50% { transform: translateY(25px) scaleX(1.15); opacity: 0.75; } 100% { transform: translateY(0) scaleX(1); opacity: 0.4; } }
          @keyframes wolfHowlEntrance { 0% { transform: translateX(80px) scale(0.85); opacity: 0; } 30% { transform: translateX(0) scale(1); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateX(-20px) scale(1.03); opacity: 0; } }
          @keyframes snowDrift { 0% { transform: translateY(-40px) translateX(0); opacity: 0; } 20% { opacity: 0.9; } 80% { opacity: 0.9; } 100% { transform: translateY(260px) translateX(40px); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Dancing Emerald Aurora Ribbon */}
          <g className="origin-top animate-[auroraDance1_7s_easeInOut_infinite]">
            <path d="M-50 180 Q150 90 320 160 T650 120 L650 360 Q450 420 280 340 T-50 400 Z" fill="url(#auroraWaveGrad1)" opacity="0.6" />
          </g>

          {/* Layer 2: Dancing Indigo-Cyan Polar Aurora Ribbon */}
          <g className="origin-top animate-[auroraDance2_6s_easeInOut_infinite]">
            <path d="M-50 240 Q180 160 380 220 T650 180 L650 460 Q420 500 240 420 T-50 480 Z" fill="url(#auroraWaveGrad2)" opacity="0.5" />
          </g>

          {/* Layer 3: Frosted Mountain Peaks Silhouette */}
          <g transform="translate(0, 320)">
            <polygon points="-20,240 140,140 280,220 440,110 620,250 620,400 -20,400" fill="#0B132B" opacity="0.8" />
            {/* Ice Highlights on Ridge */}
            <polyline points="140,140 200,180 280,220" stroke="#38BDF8" strokeWidth="2" opacity="0.7" />
            <polyline points="360,165 440,110 500,170" stroke="#38BDF8" strokeWidth="2.5" opacity="0.85" />
          </g>

          {/* Layer 4: Howling White Spirit Wolf Silhouette */}
          <g className="animate-[wolfHowlEntrance_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(320, 370)">
            {/* Rock Outcropping */}
            <polygon points="40,180 140,160 180,220 20,220" fill="#1C2541" />
            {/* Wolf Body Silhouette */}
            <path d="M70 165 C85 125 125 120 140 155 L135 175 L65 175 Z" fill="#F8FAFC" />
            {/* Howling Head tilted toward sky */}
            <path d="M115 130 C125 90 145 75 160 70 C155 85 145 105 130 135 Z" fill="#F8FAFC" />
            {/* Wolf Ears */}
            <polygon points="128,95 122,80 135,90" fill="#E2E8F0" />
            {/* Spirit Wolf Fur Tufts */}
            <path d="M85 145 C65 150 50 170 55 180" stroke="#38BDF8" strokeWidth="2" fill="none" opacity="0.8" />
            {/* Glowing Cyan Wolf Eye */}
            <circle cx="136" cy="98" r="2.5" fill="#38BDF8" />
          </g>

          {/* Layer 5: Drifting Diamond Ice Flakes */}
          <g>
            {[
              { x: 120, y: 160, d: '0s' },
              { x: 220, y: 120, d: '0.8s' },
              { x: 340, y: 200, d: '1.4s' },
              { x: 440, y: 140, d: '0.5s' },
              { x: 180, y: 260, d: '1.9s' },
              { x: 280, y: 240, d: '1.1s' },
            ].map((flake, idx) => (
              <polygon
                key={idx}
                points="0,-4 3,0 0,4 -3,0"
                fill="#F0F9FF"
                transform={`translate(${flake.x}, ${flake.y})`}
                style={{ animation: `snowDrift 3.5s ease-out infinite ${flake.d}` }}
              />
            ))}
          </g>

          <defs>
            <linearGradient id="auroraWaveGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="auroraWaveGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <path d="M0 40 Q100 10 200 40 L200 80 L0 80 Z" fill="#10B981" opacity="0.4" className="animate-pulse" />
        <polygon points="0,90 60,60 120,80 160,50 200,90 200,120 0,120" fill="#0B132B" />
        <g transform="translate(130, 48)">
          <path d="M10 25 C15 15 22 10 28 6 C26 12 24 18 18 25 Z" fill="#FFFFFF" />
          <polygon points="5,30 20,26 24,35 0,35" fill="#FFFFFF" />
          <circle cx="21" cy="14" r="1.5" fill="#38BDF8" />
        </g>
      </svg>
    </div>
  ),
};
