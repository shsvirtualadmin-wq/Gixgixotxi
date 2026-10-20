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

// ─── 14. EFFECT: effect-faint-sparkles (Comet Shrine Maiden) ──────────────────
// Starfield comet shower with tranquil shrine maiden silhouette gazing at falling star trails
export const EffectFaintSparkles: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="400" r="160" fill="none" stroke="#A855F7" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes maidenReveal { 0% { transform: translateY(40px); opacity: 0; } 30% { transform: translateY(0); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(-10px); opacity: 0; } }
          @keyframes starShower { 0% { transform: translate(120px, -100px); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translate(-180px, 240px); opacity: 0; } }
          @keyframes constellationBlink { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.95; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Celestial Deep Purple Starfield */}
          <rect width="600" height="800" fill="url(#starfieldGrad)" opacity="0.4" />

          {/* Layer 2: Shooting Comets across Night Sky */}
          <g>
            {[
              { x: 380, y: 140, d: '0s' },
              { x: 480, y: 220, d: '0.9s' },
              { x: 300, y: 100, d: '1.7s' },
              { x: 440, y: 320, d: '0.4s' },
            ].map((cmt, idx) => (
              <g key={idx} transform={`translate(${cmt.x}, ${cmt.y})`} style={{ animation: `starShower 2.2s linear infinite ${cmt.d}` }}>
                <line x1="0" y1="0" x2="90" y2="-90" stroke="url(#cometGloryGrad)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
              </g>
            ))}
          </g>

          {/* Layer 3: Shrine Maiden Silhouette (Miko, back turned to viewer) */}
          <g className="animate-[maidenReveal_5.5s_ease-out_forwards]" transform="translate(180, 440)">
            {/* Long flowing black hair tied with white ceremonial paper (Takenaga) */}
            <path d="M70 40 C60 80 50 140 60 200 C70 140 80 80 70 40 Z" fill="#09090B" />
            <rect x="64" y="60" width="12" height="10" rx="2" fill="#FFFFFF" />
            {/* White Kimono Top (Kosode) */}
            <path d="M40 75 L100 75 L110 130 L30 130 Z" fill="#F8FAFC" />
            {/* Red Hakama Skirt */}
            <path d="M30 130 L110 130 L125 240 L15 240 Z" fill="#DC2626" />
            {/* Kagura Bell Wand (Suzu) held upward */}
            <line x1="105" y1="110" x2="135" y2="60" stroke="#F59E0B" strokeWidth="2.5" />
            <circle cx="137" cy="58" r="6" fill="#FBBF24" />
          </g>

          {/* Layer 4: Floating Celestial Constellation Matrix */}
          <g className="animate-[constellationBlink_3s_ease-in-out_infinite]">
            <circle cx="180" cy="180" r="3" fill="#FFFFFF" />
            <circle cx="260" cy="140" r="3" fill="#FFFFFF" />
            <circle cx="340" cy="190" r="3" fill="#FFFFFF" />
            <polyline points="180,180 260,140 340,190" fill="none" stroke="#C084FC" strokeWidth="1" strokeDasharray="3 3" />
          </g>

          <defs>
            <radialGradient id="starfieldGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B0764" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cometGloryGrad" x1="0" y1="0" x2="1" y2="-1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#A855F7" />
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
        <line x1="160" y1="20" x2="90" y2="70" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />
        <circle cx="90" cy="70" r="3" fill="#FFFFFF" className="animate-ping" />
        <g transform="translate(60, 60)">
          <path d="M15 15 L35 15 L40 45 L10 45 Z" fill="#F8FAFC" />
          <path d="M10 45 L40 45 L45 60 L5 60 Z" fill="#DC2626" />
        </g>
      </svg>
    </div>
  ),
};

// ─── 15. EFFECT: effect-ember-drift (Phoenix of Embers) ────────────────────────
// Phoenix of molten embers unfolding fiery plumage amidst rising ash sparks and sun halos
export const EffectEmberDrift: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <polygon points="300,280 420,380 300,420 180,380" fill="#EA580C" opacity="0.5" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes phoenixAscent { 0% { transform: translateY(80px) scale(0.6); opacity: 0; } 30% { transform: translateY(0) scale(1.05); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(-40px) scale(1.15); opacity: 0; } }
          @keyframes wingFlutterL { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-12deg); } }
          @keyframes wingFlutterR { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(12deg); } }
          @keyframes fireSparks { 0% { transform: translateY(0) translateX(0) scale(0.6); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(-240px) translateX(-30px) scale(1.2); opacity: 0; } }
          @keyframes flameHalo { 0% { transform: scale(0.9); opacity: 0.4; } 50% { transform: scale(1.15); opacity: 0.8; } 100% { transform: scale(0.9); opacity: 0.4; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Radial Blazing Core Aura */}
          <circle cx="300" cy="380" r="160" fill="url(#fireAuraGrad)" className="animate-[flameHalo_3s_ease-in-out_infinite]" />

          {/* Layer 2: Radiant Phoenix Wings Unfolding */}
          <g className="origin-center animate-[phoenixAscent_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(300, 360)">
            {/* Left Fiery Wing */}
            <g className="origin-right animate-[wingFlutterL_2.5s_ease-in-out_infinite]" transform="translate(-15, 0)">
              <path d="M0 0 C-60 -50 -160 -40 -220 20 C-180 50 -120 70 -60 50 Z" fill="url(#moltenWingGrad)" />
              <path d="M0 20 C-50 -10 -130 0 -180 50 C-140 75 -90 85 -40 60 Z" fill="#F59E0B" opacity="0.85" />
            </g>

            {/* Right Fiery Wing */}
            <g className="origin-left animate-[wingFlutterR_2.5s_ease-in-out_infinite]" transform="translate(15, 0)">
              <path d="M0 0 C60 -50 160 -40 220 20 C180 50 120 70 60 50 Z" fill="url(#moltenWingGrad)" />
              <path d="M0 20 C50 -10 130 0 180 50 C140 75 90 85 40 60 Z" fill="#F59E0B" opacity="0.85" />
            </g>

            {/* Phoenix Majestic Head & Crest */}
            <path d="M0 -30 L8 -60 L-8 -60 Z" fill="#FEF08A" />
            <circle cx="0" cy="-25" r="16" fill="#F97316" />
            <polygon points="0,-48 -14,-75 0,-62 14,-75" fill="#EF4444" /> {/* Flame Crest */}

            {/* Golden Beak */}
            <polygon points="0,-25 15,-20 0,-15" fill="#FEF08A" />

            {/* Flowing Tail Plumage Streamers */}
            <path d="M-15 40 C-30 110 -60 180 -40 240 C-20 180 -5 110 -5 40 Z" fill="url(#moltenWingGrad)" />
            <path d="M15 40 C30 110 60 180 40 240 C20 180 5 110 5 40 Z" fill="url(#moltenWingGrad)" />
            <path d="M0 45 C0 120 10 200 0 260 C-10 200 0 120 0 45 Z" fill="#FEF08A" />
          </g>

          {/* Layer 3: Rising Swirling Ash & Flame Embers */}
          <g>
            {[
              { x: 220, y: 520, d: '0s' },
              { x: 300, y: 560, d: '0.4s' },
              { x: 380, y: 500, d: '0.9s' },
              { x: 260, y: 440, d: '1.3s' },
              { x: 340, y: 420, d: '0.7s' },
              { x: 420, y: 480, d: '1.6s' },
            ].map((spk, idx) => (
              <polygon
                key={idx}
                points="0,-4 3,0 0,4 -3,0"
                fill="#FEF08A"
                transform={`translate(${spk.x}, ${spk.y})`}
                style={{ animation: `fireSparks 2.8s ease-out infinite ${spk.d}` }}
              />
            ))}
          </g>

          <defs>
            <radialGradient id="fireAuraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#EA580C" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7C2D12" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="moltenWingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F97316" />
              <stop offset="80%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="60" r="38" fill="#EA580C" opacity="0.3" className="animate-pulse" />
        <path d="M100 60 C80 30 40 40 20 60 C50 70 80 75 100 60 Z" fill="#F59E0B" />
        <path d="M100 60 C120 30 160 40 180 60 C150 70 120 75 100 60 Z" fill="#F59E0B" />
        <circle cx="100" cy="50" r="8" fill="#FEF08A" />
        <circle cx="100" cy="35" r="2" fill="#EF4444" className="animate-ping" />
      </svg>
    </div>
  ),
};
