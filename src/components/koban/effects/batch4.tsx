import React from 'react';
import type { EffectComponentModule } from './types';

// ─── 10. EFFECT: effect-cherry-carpet (Great Wave Petal Crest) ────────────────
// Ocean cresting wave surging across the card and shattering into flying cherry blossom petals
export const EffectCherryCarpet: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <path d="M0 450 Q300 350 600 450 L600 800 L0 800 Z" fill="#0284C7" opacity="0.4" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes waveSurge { 0% { transform: translateY(120px) scaleY(0.8); opacity: 0; } 30% { transform: translateY(0) scaleY(1.05); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(-30px) scaleY(1.1); opacity: 0; } }
          @keyframes foamClaw { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.1) rotate(4deg); } }
          @keyframes petalSplash { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; } 25% { opacity: 0.95; } 80% { opacity: 0.95; } 100% { transform: translateY(-220px) translateX(90px) rotate(260deg); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Deep Ocean Swell Base */}
          <g className="animate-[waveSurge_5.5s_ease-out_forwards]">
            <path d="M-50 480 C120 450 250 560 380 490 C480 440 550 480 650 460 L650 850 L-50 850 Z" fill="url(#deepWaveGrad)" opacity="0.65" />
          </g>

          {/* Layer 2: Massive Cresting Great Wave with Curled Claws */}
          <g className="animate-[waveSurge_5.5s_ease-out_forwards]">
            <path
              d="M-40 600 C80 520 180 340 320 300 C270 340 240 400 280 440 C340 490 440 460 520 410 C580 380 620 400 640 430 L640 850 L-40 850 Z"
              fill="url(#crestWaveGrad)"
            />
            {/* White Foam Wave Claws */}
            <g className="animate-[foamClaw_3s_ease-in-out_infinite]" transform="translate(240, 290)">
              <path d="M0 40 C20 10 50 0 80 15 C70 30 50 35 30 35 Z" fill="#F0F9FF" />
              <path d="M60 15 C85 -5 120 5 130 30 C110 35 90 25 70 25 Z" fill="#F0F9FF" />
              <path d="M110 10 C140 -10 170 10 160 40 C140 35 125 25 110 25 Z" fill="#F0F9FF" />
            </g>
          </g>

          {/* Layer 3: Exploding Flying Cherry Blossom Petals from Wave Crest */}
          <g>
            {[
              { x: 260, y: 340, d: '0s' },
              { x: 320, y: 310, d: '0.4s' },
              { x: 380, y: 360, d: '0.8s' },
              { x: 440, y: 330, d: '1.2s' },
              { x: 220, y: 380, d: '1.6s' },
              { x: 350, y: 400, d: '0.6s' },
              { x: 480, y: 370, d: '1.0s' },
              { x: 290, y: 430, d: '1.9s' },
            ].map((p, idx) => (
              <g key={idx} transform={`translate(${p.x}, ${p.y})`} style={{ animation: `petalSplash 3.2s ease-out infinite ${p.d}` }}>
                {/* Curved Sakura Petal with notch */}
                <path d="M0 0 C-10 -15 -12 -25 -2 -32 C2 -28 0 -26 2 -26 C4 -26 2 -28 6 -32 C16 -25 14 -15 0 0 Z" fill="#F472B6" />
              </g>
            ))}
          </g>

          {/* Layer 4: Floating Seafoam Spray Motes */}
          {!isLowEnd && (
            <g>
              {[
                { cx: 280, cy: 310 },
                { cx: 340, cy: 280 },
                { cx: 410, cy: 330 },
                { cx: 470, cy: 300 },
              ].map((m, i) => (
                <circle key={i} cx={m.cx} cy={m.cy} r={3} fill="#E0F2FE" className="animate-ping" style={{ animationDuration: '2.5s', animationDelay: `${i * 0.5}s` }} />
              ))}
            </g>
          )}

          <defs>
            <linearGradient id="deepWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#082F49" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="crestWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#0C4A6E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <path d="M0 90 C50 70 80 40 120 50 C100 65 90 85 110 95 C140 105 170 90 200 80 L200 120 L0 120 Z" fill="#0284C7" />
        <path d="M100 45 C115 35 130 38 135 50 C125 52 115 48 105 50 Z" fill="#FFFFFF" />
        <circle cx="130" cy="40" r="3" fill="#F472B6" className="animate-ping" />
        <circle cx="150" cy="55" r="2.5" fill="#F472B6" className="animate-ping" style={{ animationDelay: '0.4s' }} />
      </svg>
    </div>
  ),
};

// ─── 11. EFFECT: effect-dawn-horizon (Flock of Origami Cranes) ─────────────────
// Paper cranes folding open and flying in a soaring flock across a radiant dawn horizon
export const EffectDawnHorizon: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <polygon points="300,320 330,360 270,360" fill="#FDE047" />
            <polygon points="300,320 340,300 330,360" fill="#FEF08A" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes craneFlockAscend { 0% { transform: translate(-100px, 120px) scale(0.7); opacity: 0; } 25% { opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translate(160px, -180px) scale(1.15); opacity: 0; } }
          @keyframes wingFlap1 { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.4); } }
          @keyframes wingFlap2 { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.3); } }
          @keyframes dawnSunbeams { 0% { transform: rotate(0deg); opacity: 0.3; } 50% { opacity: 0.6; } 100% { transform: rotate(40deg); opacity: 0.3; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Golden Dawn Sunburst Horizon */}
          <g className="origin-bottom-center animate-[dawnSunbeams_12s_linear_infinite]" transform="translate(300, 600)">
            {[-60, -40, -20, 0, 20, 40, 60].map((deg) => (
              <polygon key={deg} points="0,0 -30,-600 30,-600" fill="url(#dawnRayGrad)" opacity="0.35" transform={`rotate(${deg})`} />
            ))}
          </g>

          {/* Layer 2: Glowing Dawn Sun Crest on Horizon */}
          <circle cx="300" cy="580" r="90" fill="url(#dawnSunGrad)" opacity="0.8" />

          {/* Layer 3: Flying Origami Crane 1 (Lead, Large) */}
          <g className="animate-[craneFlockAscend_5.5s_ease-out_forwards]" transform="translate(300, 360)">
            {/* Crane Origami Body */}
            <polygon points="0,0 20,40 -20,40" fill="#FEF08A" />
            <polygon points="0,0 4,-35 -4,-25" fill="#F59E0B" /> {/* Neck & Beak */}
            <polygon points="0,40 0,65 -5,45" fill="#E2E8F0" /> {/* Tail */}
            {/* Flapping Origami Wings */}
            <g className="animate-[wingFlap1_1.2s_ease-in-out_infinite]">
              <polygon points="-20,20 -75,-15 -10,35" fill="#FDE047" /> {/* Left Wing */}
              <polygon points="20,20 75,-15 10,35" fill="#FFFBEB" /> {/* Right Wing */}
            </g>
          </g>

          {/* Layer 4: Escort Origami Crane 2 (Top Left) */}
          <g className="animate-[craneFlockAscend_5.5s_ease-out_forwards]" style={{ animationDelay: '0.3s' }} transform="translate(210, 300) scale(0.75)">
            <polygon points="0,0 18,35 -18,35" fill="#FEF08A" />
            <polygon points="0,0 4,-30 -4,-20" fill="#F59E0B" />
            <g className="animate-[wingFlap2_1s_ease-in-out_infinite]">
              <polygon points="-18,18 -65,-12 -8,30" fill="#FDE047" />
              <polygon points="18,18 65,-12 8,30" fill="#FFFBEB" />
            </g>
          </g>

          {/* Layer 5: Escort Origami Crane 3 (Bottom Right) */}
          <g className="animate-[craneFlockAscend_5.5s_ease-out_forwards]" style={{ animationDelay: '0.6s' }} transform="translate(410, 410) scale(0.65)">
            <polygon points="0,0 16,30 -16,30" fill="#FEF08A" />
            <polygon points="0,0 3,-25 -3,-18" fill="#F59E0B" />
            <g className="animate-[wingFlap1_1.1s_ease-in-out_infinite]">
              <polygon points="-16,15 -55,-10 -6,25" fill="#FDE047" />
              <polygon points="16,15 55,-10 6,25" fill="#FFFBEB" />
            </g>
          </g>

          {/* Layer 6: Small Distant Origami Cranes */}
          {!isLowEnd && (
            <g>
              {[
                { x: 160, y: 220, s: 0.4, d: '0.8s' },
                { x: 460, y: 260, s: 0.45, d: '1.1s' },
                { x: 250, y: 180, s: 0.35, d: '1.4s' },
              ].map((c, i) => (
                <g key={i} className="animate-[craneFlockAscend_5.5s_ease-out_forwards]" style={{ animationDelay: c.d }} transform={`translate(${c.x}, ${c.y}) scale(${c.s})`}>
                  <polygon points="0,0 14,24 -14,24" fill="#FEF08A" />
                  <polygon points="-14,12 -45,-8 -5,20" fill="#FDE047" />
                  <polygon points="14,12 45,-8 5,20" fill="#FFFBEB" />
                </g>
              ))}
            </g>
          )}

          <defs>
            <linearGradient id="dawnRayGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="dawnSunGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="50%" stopColor="#FEF08A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="95" r="40" fill="#F59E0B" opacity="0.4" />
        <g transform="translate(100, 50)">
          <polygon points="0,0 12,20 -12,20" fill="#FEF08A" />
          <polygon points="-12,10 -35,-5 -5,18" fill="#FDE047" />
          <polygon points="12,10 35,-5 5,18" fill="#FFFBEB" />
        </g>
        <g transform="translate(60, 35) scale(0.6)">
          <polygon points="0,0 12,20 -12,20" fill="#FEF08A" />
          <polygon points="-12,10 -35,-5 -5,18" fill="#FDE047" />
          <polygon points="12,10 35,-5 5,18" fill="#FFFBEB" />
        </g>
      </svg>
    </div>
  ),
};

// ─── 12. EFFECT: effect-dusk-smoke (Crescent Rooftop Cat) ─────────────────────
// Silhouetted crescent-moon midnight cat perched on curved temple roof tiles under drifting dusk clouds
export const EffectDuskSmoke: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <path d="M300 240 C360 240 400 300 380 360 C360 300 320 280 270 280 Z" fill="#FBBF24" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes rooftopReveal { 0% { transform: translateY(60px); opacity: 0; } 30% { transform: translateY(0); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(15px); opacity: 0; } }
          @keyframes catTailSway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(18deg); } }
          @keyframes catBlink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
          @keyframes duskSmokeDrift { 0% { transform: translateX(-80px); opacity: 0.3; } 50% { opacity: 0.7; } 100% { transform: translateX(120px); opacity: 0.3; } }
          @keyframes crescentMoonFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Slender Golden Crescent Moon */}
          <g className="animate-[crescentMoonFloat_6s_ease-in-out_infinite]" transform="translate(360, 220)">
            <path d="M0 0 C60 20 80 80 50 140 C10 110 0 70 0 0 Z" fill="#FBBF24" />
            <circle cx="28" cy="70" r="60" fill="url(#crescentGlowGrad)" opacity="0.4" />
          </g>

          {/* Layer 2: Drifting Purple Dusk Smoke Clouds */}
          <g className="animate-[duskSmokeDrift_8s_linear_infinite]" opacity="0.5">
            <ellipse cx="200" cy="460" rx="260" ry="60" fill="url(#duskSmokeGrad)" />
            <ellipse cx="440" cy="500" rx="220" ry="50" fill="url(#duskSmokeGrad)" />
          </g>

          {/* Layer 3: Curved Traditional Temple Eaves / Roof Ridge */}
          <g className="animate-[rooftopReveal_5.5s_ease-out_forwards]" transform="translate(0, 480)">
            {/* Curved Main Beam */}
            <path d="M-20 180 C180 120 400 130 620 180 L620 240 L-20 240 Z" fill="#0F172A" />
            {/* Tile ridges */}
            {[40, 100, 160, 220, 280, 340, 400, 460, 520].map((rx) => (
              <path key={rx} d={`M${rx} 165 C${rx + 15} 145 ${rx + 30} 145 ${rx + 45} 165`} stroke="#334155" strokeWidth="3" fill="none" />
            ))}
          </g>

          {/* Layer 4: Midnight Cat Silhouette Perched on Ridge */}
          <g className="animate-[rooftopReveal_5.5s_ease-out_forwards]" transform="translate(220, 500)">
            {/* Cat Body */}
            <ellipse cx="60" cy="90" rx="28" ry="34" fill="#020617" />
            {/* Cat Head */}
            <circle cx="60" cy="46" r="18" fill="#020617" />
            {/* Cat Pointed Ears */}
            <polygon points="46,42 42,24 54,34" fill="#020617" />
            <polygon points="74,42 78,24 66,34" fill="#020617" />
            {/* Glowing Golden Eyes */}
            <g className="origin-center animate-[catBlink_4s_infinite]">
              <ellipse cx="53" cy="45" rx="3.5" ry="4" fill="#FBBF24" />
              <ellipse cx="67" cy="45" rx="3.5" ry="4" fill="#FBBF24" />
              <circle cx="53" cy="45" r="1.5" fill="#020617" />
              <circle cx="67" cy="45" r="1.5" fill="#020617" />
            </g>
            {/* Long Curled Tail Swaying */}
            <g className="origin-bottom-left animate-[catTailSway_3s_ease-in-out_infinite]" transform="translate(34, 100)">
              <path d="M0 0 C-20 15 -35 -10 -25 -30" stroke="#020617" strokeWidth="6" strokeLinecap="round" fill="none" />
            </g>
          </g>

          {/* Layer 5: Tiny Floating Night Star Sparkles */}
          {!isLowEnd && (
            <g>
              {[
                { cx: 160, cy: 260 },
                { cx: 280, cy: 210 },
                { cx: 480, cy: 300 },
              ].map((s, idx) => (
                <circle key={idx} cx={s.cx} cy={s.cy} r={2} fill="#FDE047" className="animate-ping" style={{ animationDuration: '3s', animationDelay: `${idx * 0.8}s` }} />
              ))}
            </g>
          )}

          <defs>
            <radialGradient id="crescentGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="duskSmokeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#7E22CE" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <path d="M140 25 C155 32 160 50 150 65 C140 55 138 42 140 25 Z" fill="#FBBF24" />
        <path d="M0 95 C60 85 140 85 200 95 L200 120 L0 120 Z" fill="#0F172A" />
        <g transform="translate(70, 72)">
          <circle cx="12" cy="12" r="7" fill="#020617" />
          <polygon points="7,9 5,3 10,7" fill="#020617" />
          <polygon points="17,9 19,3 14,7" fill="#020617" />
          <ellipse cx="12" cy="24" rx="10" ry="12" fill="#020617" />
          <circle cx="10" cy="12" r="1.5" fill="#FBBF24" />
          <circle cx="14" cy="12" r="1.5" fill="#FBBF24" />
        </g>
      </svg>
    </div>
  ),
};
