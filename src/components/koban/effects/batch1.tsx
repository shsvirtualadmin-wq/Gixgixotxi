import React from 'react';
import type { EffectComponentModule } from './types';

// ─── 2. EFFECT: effect-golden-leaf-frost (Golden Chi Lotus) ───────────────────
// Blooming sacred golden lotus with swirling golden energy rings and floating autumn foliage
export const EffectGoldenLeafFrost: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-70">
            <circle cx="300" cy="400" r="140" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="300" cy="400" r="60" fill="#FEF3C7" opacity="0.5" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes fadeSimple { 0% { opacity: 0; } 15% { opacity: 0.7; } 85% { opacity: 0.7; } 100% { opacity: 0; } }
          @keyframes cinematicFade { 0% { opacity: 0; } 10% { opacity: 0.9; } 85% { opacity: 0.9; } 100% { opacity: 0; } }
          @keyframes lotusBloom { 0% { transform: scale(0.4) rotate(-30deg); opacity: 0; } 30% { transform: scale(1.05) rotate(0deg); opacity: 0.9; } 80% { transform: scale(1.0) rotate(5deg); opacity: 0.9; } 100% { transform: scale(1.15) rotate(15deg); opacity: 0; } }
          @keyframes chiRingRotate { 0% { transform: rotate(0deg) scale(0.85); opacity: 0; } 50% { transform: rotate(180deg) scale(1.1); opacity: 0.75; } 100% { transform: rotate(360deg) scale(0.95); opacity: 0.3; } }
          @keyframes ginkgoDrift { 0% { transform: translateY(-40px) translateX(-20px) rotate(0deg); opacity: 0; } 20% { opacity: 0.85; } 80% { opacity: 0.85; } 100% { transform: translateY(180px) translateX(60px) rotate(140deg); opacity: 0; } }
          @keyframes goldenRays { 0% { transform: rotate(0deg); opacity: 0.2; } 50% { transform: rotate(90deg); opacity: 0.5; } 100% { transform: rotate(180deg); opacity: 0.2; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Ambient Background Golden Ray Starburst */}
          <g className="origin-center animate-[goldenRays_8s_linear_infinite]" transform="translate(300, 380)">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line key={deg} x1="0" y1="0" x2={Math.cos((deg * Math.PI) / 180) * 350} y2={Math.sin((deg * Math.PI) / 180) * 350} stroke="url(#chiRayGrad)" strokeWidth="1.5" />
            ))}
          </g>

          {/* Layer 2: Outer Sacred Geometry Chi Ring */}
          <g className="origin-center animate-[chiRingRotate_9s_linear_infinite]" transform="translate(300, 380)">
            <circle cx="0" cy="0" r="180" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.45" />
            <circle cx="0" cy="0" r="140" fill="none" stroke="#FDE68A" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
          </g>

          {/* Layer 3: Central Golden Lotus Base Petals */}
          <g className="origin-center animate-[lotusBloom_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(300, 380)">
            {/* Outer Petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <path
                key={deg}
                d="M0 0 C-30 -70 0 -130 0 -130 C0 -130 30 -70 0 0 Z"
                fill="url(#goldPetalGrad)"
                opacity="0.8"
                transform={`rotate(${deg})`}
              />
            ))}
            {/* Inner Core Petals */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => (
              <path
                key={deg}
                d="M0 0 C-20 -50 0 -95 0 -95 C0 -95 20 -50 0 0 Z"
                fill="url(#innerPetalGrad)"
                opacity="0.9"
                transform={`rotate(${deg})`}
              />
            ))}
            {/* Lotus Seed Pod Glow */}
            <circle cx="0" cy="0" r="28" fill="#FEF08A" />
            <circle cx="0" cy="0" r="45" fill="url(#coreGlowGrad)" opacity="0.75" />
          </g>

          {/* Layer 4: Floating Ginkgo Leaf Wind Particles */}
          <g>
            {[
              { x: 120, y: 220, delay: '0s' },
              { x: 220, y: 160, delay: '0.9s' },
              { x: 420, y: 200, delay: '0.4s' },
              { x: 480, y: 260, delay: '1.5s' },
              { x: 160, y: 340, delay: '2.1s' },
              { x: 380, y: 330, delay: '1.2s' },
            ].map((leaf, idx) => (
              <g key={idx} transform={`translate(${leaf.x}, ${leaf.y})`} style={{ animation: `ginkgoDrift 4s ease-in-out infinite ${leaf.delay}` }}>
                {/* Fan-shaped Ginkgo Leaf */}
                <path d="M0 0 C-12 -18 -18 -26 0 -34 C18 -26 12 -18 0 0 Z" fill="#FBBF24" opacity="0.85" />
                <line x1="0" y1="0" x2="0" y2="12" stroke="#B45309" strokeWidth="1" />
              </g>
            ))}
          </g>

          {/* Layer 5: Rising Golden Spores (High-end only) */}
          {!isLowEnd && (
            <g>
              {[180, 240, 290, 340, 400].map((cx, idx) => (
                <circle
                  key={idx}
                  cx={cx}
                  cy={480 - (idx % 3) * 40}
                  r={2.5}
                  fill="#FFFBEB"
                  className="animate-ping"
                  style={{ animationDuration: `${2 + idx * 0.4}s` }}
                />
              ))}
            </g>
          )}

          <defs>
            <linearGradient id="chiRayGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="goldPetalGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>
            <linearGradient id="innerPetalGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FFFBEB" />
            </linearGradient>
            <radialGradient id="coreGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="60" r="48" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '20s' }} />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <path
            key={deg}
            d="M100 60 C88 35 100 20 100 20 C100 20 112 35 100 60 Z"
            fill="#FBBF24"
            opacity="0.8"
            transform={`rotate(${deg} 100 60)`}
          />
        ))}
        <circle cx="100" cy="60" r="12" fill="#FEF08A" className="animate-pulse" />
      </svg>
    </div>
  ),
};

// ─── 3. EFFECT: effect-crimson-vignette (Blood Moon Ronin) ─────────────────────
// Colossal crimson blood moon with a lone wandering ronin silhouette and rising sakura ash embers
export const EffectCrimsonVignette: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="280" r="150" fill="#DC2626" opacity="0.4" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes bloodMoonRise { 0% { transform: translateY(80px) scale(0.85); opacity: 0; } 30% { transform: translateY(0) scale(1); opacity: 0.9; } 85% { opacity: 0.9; } 100% { transform: translateY(-20px) scale(1.03); opacity: 0; } }
          @keyframes roninWalk { 0% { transform: translateX(-60px); opacity: 0; } 25% { transform: translateX(0); opacity: 0.95; } 80% { opacity: 0.95; } 100% { transform: translateX(40px); opacity: 0; } }
          @keyframes clothSway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-8deg); } }
          @keyframes emberRise { 0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; } 20% { opacity: 0.9; } 80% { opacity: 0.9; } 100% { transform: translateY(-220px) translateX(-35px) scale(1.2); opacity: 0; } }
          @keyframes eclipsePulse { 0%, 100% { opacity: 0.5; transform: scale(1.0); } 50% { opacity: 0.85; transform: scale(1.05); } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Ambient Blood-Red Corner Vignette */}
          <rect width="600" height="800" fill="url(#bloodVignetteGrad)" opacity="0.75" />

          {/* Layer 2: Colossal Blood Moon Rising */}
          <g className="origin-center animate-[bloodMoonRise_5.5s_ease-out_forwards]">
            {/* Corona Outer Rim */}
            <circle cx="380" cy="260" r="160" fill="url(#moonAuraGrad)" className="animate-[eclipsePulse_3s_ease-in-out_infinite]" />
            {/* Solid Moon Disc */}
            <circle cx="380" cy="260" r="120" fill="url(#bloodMoonGrad)" />
            {/* Crater Textures */}
            <circle cx="330" cy="230" r="18" fill="#7F1D1D" opacity="0.4" />
            <circle cx="410" cy="290" r="28" fill="#7F1D1D" opacity="0.35" />
            <circle cx="360" cy="310" r="12" fill="#7F1D1D" opacity="0.4" />
          </g>

          {/* Layer 3: Distant Torii Silhouette & Misty Mountain Hill */}
          <g transform="translate(0, 160)">
            <path d="M-20 460 Q180 410 360 450 T620 420 L620 650 L-20 650 Z" fill="#1C1917" opacity="0.7" />
          </g>

          {/* Layer 4: Lone Ronin Wanderer with Flowing Cloak and Katana */}
          <g className="animate-[roninWalk_5.5s_ease-out_forwards]" transform="translate(140, 480)">
            {/* Ronin Straw Hat (Kasa) */}
            <path d="M30 40 Q75 15 120 40 Q75 32 30 40 Z" fill="#18181B" />
            {/* Head & Scarf */}
            <circle cx="75" cy="46" r="10" fill="#18181B" />
            {/* Torso & Kimono */}
            <path d="M60 56 L90 56 L96 140 L54 140 Z" fill="#27272A" />
            {/* Flowing Cloak / Scarf Banner (Secondary Animation) */}
            <g className="origin-top-left animate-[clothSway_2s_ease-in-out_infinite]">
              <path d="M54 62 C30 80 15 120 0 135 C20 120 40 100 54 85 Z" fill="#DC2626" opacity="0.9" />
            </g>
            {/* Katana Sword at Waist */}
            <line x1="40" y1="110" x2="115" y2="70" stroke="#E4E4E7" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="52" y="100" width="8" height="6" fill="#F59E0B" />
            {/* Sheath */}
            <line x1="38" y1="112" x2="15" y2="128" stroke="#71717A" strokeWidth="3" strokeLinecap="round" />
            {/* Legs */}
            <rect x="62" y="140" width="8" height="50" fill="#18181B" />
            <rect x="80" y="140" width="8" height="46" fill="#18181B" />
          </g>

          {/* Layer 5: Swirling Rising Crimson Sakura Embers */}
          <g>
            {[
              { x: 180, y: 640, delay: '0s' },
              { x: 260, y: 580, delay: '0.6s' },
              { x: 340, y: 620, delay: '1.2s' },
              { x: 420, y: 550, delay: '0.3s' },
              { x: 480, y: 610, delay: '1.7s' },
              { x: 300, y: 510, delay: '0.9s' },
              { x: 380, y: 460, delay: '1.4s' },
            ].map((p, idx) => (
              <g key={idx} transform={`translate(${p.x}, ${p.y})`} style={{ animation: `emberRise 3.5s ease-out infinite ${p.delay}` }}>
                {/* Ember Spark */}
                <polygon points="0,-4 3,0 0,4 -3,0" fill="#EF4444" />
                <circle cx="0" cy="0" r="1.5" fill="#FEF08A" />
              </g>
            ))}
          </g>

          {/* Layer 6: Ground Fog & Blade Flash */}
          <rect x="0" y="670" width="600" height="130" fill="url(#bloodFloorGrad)" opacity="0.6" />

          <defs>
            <radialGradient id="bloodVignetteGrad" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#450A0A" stopOpacity="0.8" />
            </radialGradient>
            <radialGradient id="moonAuraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#991B1B" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#450A0A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bloodMoonGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="60%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </radialGradient>
            <linearGradient id="bloodFloorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#18181B" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="140" cy="50" r="34" fill="#DC2626" />
        <path d="M0 90 Q80 75 200 90 L200 120 L0 120 Z" fill="#18181B" />
        <g transform="translate(60, 62)">
          <path d="M10 12 Q24 2 38 12 Z" fill="#18181B" />
          <rect x="20" y="16" width="8" height="26" fill="#27272A" />
          <path d="M18 18 C8 24 2 36 -2 40 Z" fill="#DC2626" />
        </g>
        <circle cx="95" cy="55" r="2" fill="#EF4444" className="animate-ping" />
        <circle cx="120" cy="40" r="1.5" fill="#FEF08A" className="animate-ping" />
      </svg>
    </div>
  ),
};
