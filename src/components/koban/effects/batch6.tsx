import React from 'react';
import type { EffectComponentModule } from './types';

// ─── 16. EFFECT: effect-electric-aura (Storm Eagle Apex) ──────────────────────
// Majestic storm eagle diving through shattered thunderous cloud peaks with electric arcs
export const EffectElectricAura: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <polyline points="280,240 320,320 290,340 330,420" stroke="#FBBF24" strokeWidth="4" fill="none" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes eagleDive { 0% { transform: translate(140px, -120px) scale(0.6); opacity: 0; } 30% { transform: translate(0, 0) scale(1); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translate(-100px, 80px) scale(1.15); opacity: 0; } }
          @keyframes lightningFlash1 { 0%, 100% { opacity: 0; } 15%, 22% { opacity: 1; } 45%, 52% { opacity: 0.9; } 78%, 84% { opacity: 0.95; } }
          @keyframes lightningFlash2 { 0%, 100% { opacity: 0; } 30%, 36% { opacity: 1; } 60%, 65% { opacity: 0.85; } }
          @keyframes thunderCloudRoll { 0% { transform: translateX(-40px); } 50% { transform: translateX(40px); } 100% { transform: translateX(-40px); } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Dark Rolling Thunderclouds */}
          <g className="animate-[thunderCloudRoll_8s_ease-in-out_infinite]" opacity="0.6">
            <path d="M-60 220 Q120 140 280 200 T650 160 L650 480 L-60 480 Z" fill="#0F172A" />
          </g>

          {/* Layer 2: Branching Electric Arcs */}
          <g className="animate-[lightningFlash1_2.8s_infinite]">
            <polyline points="220,120 280,240 240,260 320,380 290,400 360,520" stroke="#FDE047" strokeWidth="3" fill="none" strokeLinecap="round" />
            <polyline points="280,240 340,290" stroke="#67E8F9" strokeWidth="2" fill="none" />
          </g>
          <g className="animate-[lightningFlash2_3.2s_infinite]">
            <polyline points="440,160 380,260 410,280 340,390" stroke="#67E8F9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>

          {/* Layer 3: Diving Storm Eagle Silhouette with Electric Aura Wings */}
          <g className="animate-[eagleDive_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(240, 260)">
            {/* Extended Wings */}
            <path d="M0 40 C-80 -40 -180 -20 -220 80 C-160 70 -100 80 -40 70 Z" fill="#020617" />
            <path d="M0 40 C80 -40 180 -20 220 80 C160 70 100 80 40 70 Z" fill="#020617" />
            {/* Wing Feather Feather Tips in Electric Cyan */}
            <path d="M-220 80 L-180 50 M-200 90 L-160 60" stroke="#00F0FF" strokeWidth="2" />
            <path d="M220 80 L180 50 M200 90 L160 60" stroke="#00F0FF" strokeWidth="2" />
            {/* Eagle Fierce Head & Beak diving down */}
            <circle cx="0" cy="55" r="16" fill="#020617" />
            <polygon points="-6,65 0,85 6,65" fill="#FBBF24" /> {/* Hooked Beak */}
            <circle cx="-6" cy="52" r="3" fill="#67E8F9" />
            <circle cx="6" cy="52" r="3" fill="#67E8F9" />
            {/* Fanned Tail Feathers */}
            <polygon points="0,30 -25,-20 25,-20" fill="#020617" />
          </g>

          {/* Layer 4: Floating Lightning Spark Particles */}
          {!isLowEnd && (
            <g>
              {[
                { cx: 200, cy: 300 },
                { cx: 340, cy: 260 },
                { cx: 420, cy: 380 },
              ].map((s, idx) => (
                <circle key={idx} cx={s.cx} cy={s.cy} r={2.5} fill="#FEF08A" className="animate-ping" style={{ animationDuration: '2s', animationDelay: `${idx * 0.6}s` }} />
              ))}
            </g>
          )}
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <polyline points="90,10 115,50 100,55 125,100" stroke="#FBBF24" strokeWidth="3" fill="none" className="animate-pulse" />
        <g transform="translate(100, 50)">
          <path d="M0 0 C-40 -20 -70 10 -90 40 C-60 30 -30 35 0 20 Z" fill="#020617" />
          <path d="M0 0 C40 -20 70 10 90 40 C60 30 30 35 0 20 Z" fill="#020617" />
          <circle cx="0" cy="18" r="8" fill="#020617" />
          <polygon points="-3,24 0,32 3,24" fill="#FBBF24" />
        </g>
      </svg>
    </div>
  ),
};

// ─── 17. EFFECT: effect-cherry-storm (Nine-Tailed Kitsune) ─────────────────────
// Mythic nine-tailed fox spirit leaping across the screen through a swirling cherry blossom tempest
export const EffectCherryStorm: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="380" r="140" fill="#F472B6" opacity="0.3" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes kitsuneLeap { 0% { transform: translate(-140px, 80px) scale(0.7); opacity: 0; } 30% { transform: translate(0, 0) scale(1); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translate(160px, -60px) scale(1.1); opacity: 0; } }
          @keyframes tailFan1 { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
          @keyframes tailFan2 { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-8deg); } }
          @keyframes sakuraStormDrift { 0% { transform: translate(0, 0) rotate(0deg); opacity: 0; } 20% { opacity: 0.95; } 80% { opacity: 0.95; } 100% { transform: translate(180px, -160px) rotate(320deg); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Ambient Pink Sakura Mist */}
          <ellipse cx="300" cy="380" rx="280" ry="200" fill="url(#sakuraAuraGrad)" opacity="0.45" />

          {/* Layer 2: Nine-Tailed Fox Leaping */}
          <g className="animate-[kitsuneLeap_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(240, 320)">
            {/* Nine Massive Fluffy Fox Tails */}
            <g className="origin-bottom-left animate-[tailFan1_3s_ease-in-out_infinite]" transform="translate(20, 90)">
              {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((deg, idx) => (
                <path
                  key={idx}
                  d="M0 0 C-20 -50 -30 -100 0 -150 C20 -100 10 -50 0 0 Z"
                  fill="url(#tailWhiteTipGrad)"
                  transform={`rotate(${deg})`}
                  opacity="0.9"
                />
              ))}
            </g>

            {/* Fox Graceful Body */}
            <path d="M30 80 C60 50 120 40 160 70 C140 100 110 110 60 110 Z" fill="#FFFFFF" />
            {/* Fox Head & Mask */}
            <polygon points="150,55 190,40 170,75" fill="#FFFFFF" />
            <polygon points="145,50 140,25 155,45" fill="#DC2626" /> {/* Ear */}
            <polygon points="160,45 165,22 172,40" fill="#DC2626" />
            {/* Red Kitsune Facial Warpaint Markings */}
            <path d="M162 52 Q175 48 182 56" stroke="#DC2626" strokeWidth="2.5" fill="none" />
            <circle cx="168" cy="52" r="2.5" fill="#F59E0B" />
          </g>

          {/* Layer 3: Swirling Tempest of Cherry Blossom Petals */}
          <g>
            {[
              { x: 120, y: 440, d: '0s' },
              { x: 200, y: 400, d: '0.4s' },
              { x: 280, y: 360, d: '0.8s' },
              { x: 360, y: 320, d: '1.2s' },
              { x: 440, y: 280, d: '0.6s' },
              { x: 220, y: 480, d: '1.5s' },
              { x: 320, y: 460, d: '1.9s' },
            ].map((p, idx) => (
              <g key={idx} transform={`translate(${p.x}, ${p.y})`} style={{ animation: `sakuraStormDrift 3s linear infinite ${p.d}` }}>
                <path d="M0 0 C-8 -12 -10 -20 -2 -25 C2 -22 0 -20 2 -20 C4 -20 2 -22 6 -25 C14 -20 12 -12 0 0 Z" fill="#F472B6" />
              </g>
            ))}
          </g>

          <defs>
            <radialGradient id="sakuraAuraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F472B6" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#FB7185" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="tailWhiteTipGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="65%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="60" r="38" fill="#F472B6" opacity="0.3" className="animate-pulse" />
        <g transform="translate(80, 50)">
          {[-30, -15, 0, 15, 30].map((deg) => (
            <path key={deg} d="M0 20 C-10 -10 -15 -35 0 -45 C15 -35 10 -10 0 20 Z" fill="#FFFFFF" transform={`rotate(${deg})`} />
          ))}
          <circle cx="30" cy="5" r="8" fill="#FFFFFF" />
          <polygon points="26,2 24,-6 32,0" fill="#DC2626" />
        </g>
        <circle cx="140" cy="40" r="2.5" fill="#F472B6" className="animate-ping" />
      </svg>
    </div>
  ),
};

// ─── 18. EFFECT: effect-shadow-haze (Spirit Deer Antlers) ──────────────────────
// Sacred spirit deer with glowing crystal antlers stepping through an ethereal mist forest
export const EffectShadowHaze: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="380" r="140" fill="#38BDF8" opacity="0.3" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes deerEntrance { 0% { transform: translateY(50px) scale(0.85); opacity: 0; } 30% { transform: translateY(0) scale(1); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(-15px) scale(1.03); opacity: 0; } }
          @keyframes antlerGlow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
          @keyframes forestSporeFloat { 0% { transform: translateY(0); opacity: 0; } 30% { opacity: 0.85; } 80% { opacity: 0.85; } 100% { transform: translateY(-140px); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Ethereal Cyan Forest Shroud */}
          <ellipse cx="300" cy="380" rx="260" ry="180" fill="url(#deerMistGrad)" opacity="0.4" />

          {/* Layer 2: Sacred Spirit Deer Profile */}
          <g className="animate-[deerEntrance_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(200, 320)">
            {/* Slender Deer Neck & Head */}
            <path d="M80 180 C85 120 105 80 120 50 C125 50 145 60 140 75 C125 100 115 140 110 180 Z" fill="#F8FAFC" />
            <circle cx="130" cy="62" r="3.5" fill="#38BDF8" /> {/* Glowing Eye */}
            <polygon points="112,48 105,25 118,38" fill="#F8FAFC" /> {/* Ear */}

            {/* Glowing Crystal Branching Antlers */}
            <g className="animate-[antlerGlow_2.5s_ease-in-out_infinite]">
              <path d="M120 45 C120 -20 160 -80 190 -120 M140 -20 C180 -30 210 -15 230 10 M165 -65 C200 -80 230 -60 250 -40" stroke="#38BDF8" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M115 45 C110 -20 80 -70 50 -110 M98 -20 C70 -30 40 -15 20 10 M80 -60 C50 -75 25 -55 10 -35" stroke="#7DD3FC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Antler Crystal Blossoms */}
              <circle cx="190" cy="-120" r="4.5" fill="#FFFFFF" />
              <circle cx="230" cy="10" r="3.5" fill="#38BDF8" />
              <circle cx="250" cy="-40" r="4" fill="#E0F2FE" />
              <circle cx="50" cy="-110" r="4" fill="#FFFFFF" />
            </g>
          </g>

          {/* Layer 3: Bioluminescent Floating Forest Spores */}
          <g>
            {[
              { x: 140, y: 440, d: '0s' },
              { x: 220, y: 380, d: '0.7s' },
              { x: 380, y: 420, d: '1.3s' },
              { x: 460, y: 360, d: '0.4s' },
            ].map((sp, idx) => (
              <circle
                key={idx}
                cx={sp.x}
                cy={sp.y}
                r={3}
                fill="#38BDF8"
                style={{ animation: `forestSporeFloat 3.5s ease-out infinite ${sp.d}` }}
              />
            ))}
          </g>

          <defs>
            <radialGradient id="deerMistGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.2" />
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
        <circle cx="100" cy="60" r="38" fill="#0284C7" opacity="0.3" className="animate-pulse" />
        <g transform="translate(85, 40)">
          <path d="M15 45 C20 25 30 15 35 5" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <path d="M35 5 Q50 -15 65 -25 M45 -5 Q60 -5 70 5" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="65" cy="-25" r="2.5" fill="#FFFFFF" className="animate-ping" />
        </g>
      </svg>
    </div>
  ),
};
