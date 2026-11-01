import React from 'react';
import type { EffectComponentModule } from './types';

// ─── 13. EFFECT: effect-ancient-runes (Spider Lily Phantom) ───────────────────
// Crimson spider lily (Higanbana) phantom blooming with red spirit butterflies & floating sealing talismans
export const EffectAncientRunes: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="380" r="120" fill="none" stroke="#DC2626" strokeWidth="2" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes lilyBloom { 0% { transform: scale(0.3) rotate(-20deg); opacity: 0; } 30% { transform: scale(1.05) rotate(0deg); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: scale(1.15) rotate(10deg); opacity: 0; } }
          @keyframes butterflyFlap { 0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; } 20% { opacity: 0.9; } 80% { opacity: 0.9; } 100% { transform: translateY(-160px) translateX(60px) scale(1.1); opacity: 0; } }
          @keyframes talismanDrift { 0% { transform: translateY(-30px) rotate(-6deg); opacity: 0; } 25% { opacity: 0.9; } 85% { opacity: 0.9; } 100% { transform: translateY(120px) rotate(12deg); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Ambient Blood-Red Mist Swirl */}
          <ellipse cx="300" cy="400" rx="260" ry="200" fill="url(#lilyMistGrad)" opacity="0.4" />

          {/* Layer 2: Sealing Paper Ofuda Talismans Drifting */}
          <g>
            {[
              { x: 140, y: 240, d: '0s' },
              { x: 440, y: 280, d: '0.8s' },
              { x: 180, y: 460, d: '1.4s' },
            ].map((t, idx) => (
              <g key={idx} transform={`translate(${t.x}, ${t.y})`} style={{ animation: `talismanDrift 4s ease-in-out infinite ${t.d}` }}>
                {/* Paper Talisman */}
                <rect width="28" height="65" rx="3" fill="#FFFBEB" stroke="#B45309" strokeWidth="1" />
                <path d="M14 8 V56 M8 20 H20 M6 35 H22" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
              </g>
            ))}
          </g>

          {/* Layer 3: Blooming Crimson Spider Lily (Higanbana) */}
          <g className="origin-center animate-[lilyBloom_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(300, 420)">
            {/* Extended Long Curled Petals */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <path
                key={deg}
                d="M0 0 C15 -40 25 -90 5 -130 C-5 -150 -15 -140 -8 -120 C5 -90 -5 -40 0 0 Z"
                fill="#DC2626"
                transform={`rotate(${deg})`}
              />
            ))}
            {/* Filament Stamens arching outwards */}
            {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <path d="M0 0 Q20 -80 0 -160" stroke="#F87171" strokeWidth="1.5" fill="none" />
                <circle cx="0" cy="-160" r="3" fill="#FEF08A" />
              </g>
            ))}
            {/* Center Core Bulb */}
            <circle cx="0" cy="0" r="22" fill="#7F1D1D" stroke="#DC2626" strokeWidth="2" />
            <circle cx="0" cy="0" r="10" fill="#EF4444" className="animate-pulse" />
          </g>

          {/* Layer 4: Flapping Red Spirit Butterflies */}
          <g>
            {[
              { x: 220, y: 380, d: '0s' },
              { x: 380, y: 340, d: '0.6s' },
              { x: 260, y: 260, d: '1.2s' },
              { x: 340, y: 480, d: '1.8s' },
            ].map((bf, idx) => (
              <g key={idx} transform={`translate(${bf.x}, ${bf.y})`} style={{ animation: `butterflyFlap 3s ease-out infinite ${bf.d}` }}>
                {/* Left Wings */}
                <ellipse cx="-8" cy="-6" rx="8" ry="12" fill="#EF4444" transform="rotate(-30)" />
                {/* Right Wings */}
                <ellipse cx="8" cy="-6" rx="8" ry="12" fill="#EF4444" transform="rotate(30)" />
                <circle cx="0" cy="0" r="2" fill="#FEF08A" />
              </g>
            ))}
          </g>

          <defs>
            <radialGradient id="lilyMistGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#7F1D1D" stopOpacity="0.2" />
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
        <circle cx="100" cy="60" r="16" fill="#7F1D1D" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <path
            key={deg}
            d="M100 60 Q115 35 105 15"
            stroke="#DC2626"
            strokeWidth="2"
            fill="none"
            transform={`rotate(${deg} 100 60)`}
          />
        ))}
        <circle cx="125" cy="40" r="2.5" fill="#FEF08A" className="animate-ping" />
        <rect x="50" y="30" width="10" height="24" rx="1.5" fill="#FFFBEB" stroke="#B45309" strokeWidth="0.8" />
      </svg>
    </div>
  ),
};
