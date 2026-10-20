import React from 'react';
import type { EffectComponentModule } from './types';

// ─── 22. EFFECT: effect-spirit-wisps (Onibi Spectral Wisps) ───────────────────
// Cerulean spectral soul flames (Onibi) spiraling upward gracefully from river reeds
export const EffectSpiritWisps: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="380" r="120" fill="#38BDF8" opacity="0.3" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes onibiRise1 { 0% { transform: translateY(80px) translateX(0) scale(0.6); opacity: 0; } 20% { opacity: 0.95; } 80% { opacity: 0.95; } 100% { transform: translateY(-240px) translateX(-50px) scale(1.2); opacity: 0; } }
          @keyframes onibiRise2 { 0% { transform: translateY(60px) translateX(0) scale(0.7); opacity: 0; } 20% { opacity: 0.95; } 80% { opacity: 0.95; } 100% { transform: translateY(-260px) translateX(60px) scale(1.1); opacity: 0; } }
          @keyframes flamePuff { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(1.3); } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Ambient River Mist Shroud */}
          <ellipse cx="300" cy="500" rx="280" ry="120" fill="url(#onibiWaterMistGrad)" opacity="0.45" />

          {/* Layer 2: Onibi Spirit Flame 1 (Cerulean, Main) */}
          <g transform="translate(260, 480)" style={{ animation: 'onibiRise1 3.5s ease-out infinite' }}>
            {/* Outer Cyan Halo */}
            <circle cx="0" cy="0" r="32" fill="#0284C7" opacity="0.3" />
            {/* Teardrop Flame Body */}
            <path d="M0 -35 C-20 -10 -22 15 0 25 C22 15 20 -10 0 -35 Z" fill="url(#onibiFlameGrad)" className="animate-[flamePuff_1.8s_ease-in-out_infinite]" />
            <circle cx="0" cy="8" r="10" fill="#E0F2FE" />
          </g>

          {/* Layer 3: Onibi Spirit Flame 2 (Indigo) */}
          <g transform="translate(360, 520)" style={{ animation: 'onibiRise2 4s ease-out infinite 0.7s' }}>
            <circle cx="0" cy="0" r="28" fill="#6366F1" opacity="0.3" />
            <path d="M0 -30 C-18 -8 -20 12 0 22 C20 12 18 -8 0 -30 Z" fill="url(#onibiFlameGrad)" className="animate-[flamePuff_2s_ease-in-out_infinite]" />
            <circle cx="0" cy="6" r="8" fill="#E0F2FE" />
          </g>

          {/* Layer 4: Floating Minor Soul Sparks */}
          <g>
            {[
              { x: 180, y: 560, d: '0.3s' },
              { x: 420, y: 580, d: '1.2s' },
              { x: 220, y: 440, d: '1.8s' },
              { x: 380, y: 420, d: '0.9s' },
            ].map((spk, idx) => (
              <circle
                key={idx}
                cx={spk.x}
                cy={spk.y}
                r={3}
                fill="#38BDF8"
                style={{ animation: `onibiRise1 3.2s ease-out infinite ${spk.d}` }}
              />
            ))}
          </g>

          <defs>
            <radialGradient id="onibiWaterMistGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="onibiFlameGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0369A1" />
              <stop offset="50%" stopColor="#38BDF8" />
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
        <path d="M100 35 C85 55 85 75 100 85 C115 75 115 55 100 35 Z" fill="#38BDF8" className="animate-pulse" />
        <circle cx="100" cy="68" r="6" fill="#FFFFFF" />
        <circle cx="65" cy="50" r="4" fill="#38BDF8" className="animate-ping" />
        <circle cx="135" cy="60" r="3.5" fill="#38BDF8" className="animate-ping" style={{ animationDelay: '0.5s' }} />
      </svg>
    </div>
  ),
};

// ─── 23. EFFECT: effect-neon-rain (Cyberpunk Drone Dragon) ────────────────────
// Neon rain cyberpunk metropolis skyline with glowing cyan drone-light dragon flying across skyscrapers
export const EffectNeonRain: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <line x1="200" y1="200" x2="400" y2="200" stroke="#00F0FF" strokeWidth="4" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes dragonUndulate { 0% { transform: translate(-160px, 80px) scale(0.7); opacity: 0; } 30% { transform: translate(0, 0) scale(1); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translate(180px, -70px) scale(1.15); opacity: 0; } }
          @keyframes neonRainFall { 0% { transform: translate(60px, -120px); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translate(-120px, 280px); opacity: 0; } }
          @keyframes billboardGlow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Skyscraper Metropolis Silhouette (Bottom) */}
          <g transform="translate(0, 480)">
            <rect x="20" y="60" width="80" height="260" fill="#0F172A" />
            <rect x="120" y="20" width="110" height="300" fill="#020617" />
            <rect x="250" y="80" width="90" height="240" fill="#0F172A" />
            <rect x="360" y="30" width="120" height="290" fill="#020617" />
            <rect x="500" y="70" width="80" height="250" fill="#0F172A" />
            {/* Neon Billboard Highlights */}
            <rect x="140" y="60" width="70" height="18" fill="#F43F5E" className="animate-[billboardGlow_2s_infinite]" />
            <rect x="380" y="80" width="80" height="24" fill="#00F0FF" className="animate-[billboardGlow_2.5s_infinite]" />
          </g>

          {/* Layer 2: Diagonal Cyberpunk Neon Rain */}
          <g>
            {[
              { x: 180, y: 160, d: '0s' },
              { x: 340, y: 120, d: '0.4s' },
              { x: 460, y: 220, d: '0.8s' },
              { x: 260, y: 260, d: '1.2s' },
              { x: 400, y: 320, d: '0.6s' },
            ].map((r, i) => (
              <line
                key={i}
                x1={r.x}
                y1={r.y}
                x2={r.x - 40}
                y2={r.y + 110}
                stroke="#00F0FF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
                style={{ animation: `neonRainFall 1.8s linear infinite ${r.d}` }}
              />
            ))}
          </g>

          {/* Layer 3: Cyan Holographic Drone Dragon Flight */}
          <g className="animate-[dragonUndulate_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(180, 260)">
            {/* Dragon Sinuous Data-Body */}
            <path
              d="M-40 80 Q20 20 100 80 T240 70 Q280 40 320 80"
              stroke="#00F0FF"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
            {/* Secondary Magenta Data Wire */}
            <path
              d="M-30 85 Q30 30 110 85 T250 75 Q290 45 330 85"
              stroke="#F43F5E"
              strokeWidth="3"
              strokeDasharray="6 4"
              fill="none"
              opacity="0.8"
            />
            {/* Dragon Cyber Head & Whiskers */}
            <g transform="translate(320, 80)">
              <polygon points="0,0 30,-10 25,10" fill="#00F0FF" />
              <circle cx="15" cy="-2" r="3" fill="#FFFFFF" />
              <path d="M25 -5 Q45 -20 60 -15" stroke="#00F0FF" strokeWidth="2" fill="none" />
              <path d="M25 5 Q45 20 60 15" stroke="#00F0FF" strokeWidth="2" fill="none" />
            </g>
          </g>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <rect x="20" y="60" width="30" height="60" fill="#0F172A" />
        <rect x="60" y="40" width="40" height="80" fill="#020617" />
        <rect x="110" y="50" width="35" height="70" fill="#0F172A" />
        <rect x="155" y="35" width="30" height="85" fill="#020617" />
        <path d="M20 50 Q60 20 100 50 T180 40" stroke="#00F0FF" strokeWidth="4" fill="none" className="animate-pulse" />
        <line x1="80" y1="10" x2="60" y2="40" stroke="#00F0FF" strokeWidth="1.5" />
        <line x1="140" y1="15" x2="120" y2="45" stroke="#00F0FF" strokeWidth="1.5" />
      </svg>
    </div>
  ),
};

// ─── 24. EFFECT: effect-blazing-inferno (Yin-Yang Twin Carp) ──────────────────
// Twin celestial Yin-Yang fire and water carp spiraling in an infinite cosmic vortex
export const EffectBlazingInferno: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="380" r="140" fill="none" stroke="#DC2626" strokeWidth="3" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes carpVortexSpin { 0% { transform: rotate(0deg) scale(0.85); opacity: 0; } 30% { transform: rotate(180deg) scale(1.05); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: rotate(360deg) scale(1.15); opacity: 0; } }
          @keyframes finFlutter { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.7); } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Swirling Vortex Center Rings */}
          <g className="origin-center animate-[carpVortexSpin_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(300, 360)">
            <circle cx="0" cy="0" r="160" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="12 8" opacity="0.5" />

            {/* Fire Carp (Crimson / Molten Gold) */}
            <g transform="translate(0, -90) rotate(90)">
              {/* Fish Curled Body */}
              <path d="M0 -30 C-25 0 -20 50 0 80 C20 50 25 0 0 -30 Z" fill="url(#fireCarpGrad)" />
              {/* Fish Tail Fin */}
              <path d="M0 80 C-25 110 -35 130 -15 140 C5 125 0 100 0 80 Z" fill="#DC2626" />
              <path d="M0 80 C25 110 35 130 15 140 C-5 125 0 100 0 80 Z" fill="#DC2626" />
              {/* Pectoral Fins */}
              <g className="animate-[finFlutter_1.2s_ease-in-out_infinite]">
                <ellipse cx="-22" cy="15" rx="14" ry="7" fill="#F59E0B" transform="rotate(-30)" />
                <ellipse cx="22" cy="15" rx="14" ry="7" fill="#F59E0B" transform="rotate(30)" />
              </g>
              <circle cx="0" cy="-20" r="4" fill="#FEF08A" />
            </g>

            {/* Water Carp (Azure / Cerulean) */}
            <g transform="translate(0, 90) rotate(-90)">
              <path d="M0 -30 C-25 0 -20 50 0 80 C20 50 25 0 0 -30 Z" fill="url(#waterCarpGrad)" />
              <path d="M0 80 C-25 110 -35 130 -15 140 C5 125 0 100 0 80 Z" fill="#0284C7" />
              <path d="M0 80 C25 110 35 130 15 140 C-5 125 0 100 0 80 Z" fill="#0284C7" />
              <g className="animate-[finFlutter_1.2s_ease-in-out_infinite]">
                <ellipse cx="-22" cy="15" rx="14" ry="7" fill="#38BDF8" transform="rotate(-30)" />
                <ellipse cx="22" cy="15" rx="14" ry="7" fill="#38BDF8" transform="rotate(30)" />
              </g>
              <circle cx="0" cy="-20" r="4" fill="#FFFFFF" />
            </g>
          </g>

          <defs>
            <linearGradient id="fireCarpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <linearGradient id="waterCarpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="60" r="38" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '6s' }} />
        <path d="M100 25 C85 40 85 60 100 70 Z" fill="#DC2626" />
        <path d="M100 95 C115 80 115 60 100 50 Z" fill="#0284C7" />
        <circle cx="100" cy="60" r="5" fill="#FEF08A" />
      </svg>
    </div>
  ),
};

// ─── 25. EFFECT: effect-abyssal-ripples (Abyssal Koi Dragon) ───────────────────
// Deep-sea koi dragon spiraling upward through glowing jellyfish and bioluminescent ocean abyss
export const EffectAbyssalRipples: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="380" r="160" fill="url(#abyssGlowGrad)" opacity="0.4" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes dragonSpiralAscent { 0% { transform: translateY(140px) rotate(-20deg) scale(0.65); opacity: 0; } 30% { transform: translateY(0) rotate(0deg) scale(1.05); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(-70px) rotate(15deg) scale(1.15); opacity: 0; } }
          @keyframes jellyfishPulse { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.15) translateY(-25px); } }
          @keyframes causticRipples { 0% { transform: rotate(0deg); opacity: 0.3; } 50% { opacity: 0.6; } 100% { transform: rotate(360deg); opacity: 0.3; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Deep Caustic Ocean Rays */}
          <g className="origin-center animate-[causticRipples_16s_linear_infinite]" transform="translate(300, 380)">
            <ellipse cx="0" cy="0" rx="280" ry="160" fill="url(#abyssGlowGrad)" />
          </g>

          {/* Layer 2: Glowing Bioluminescent Jellyfish Floating Upward */}
          <g className="animate-[jellyfishPulse_4s_ease-in-out_infinite]" transform="translate(160, 360)">
            {/* Jellyfish Bell Dome */}
            <path d="M0 0 C-30 -40 30 -40 0 0 Z" fill="#67E8F9" opacity="0.6" />
            <path d="M-15 0 Q-25 40 -10 60 M0 0 Q5 45 0 70 M15 0 Q25 40 10 60" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.8" />
          </g>
          <g className="animate-[jellyfishPulse_4.5s_ease-in-out_infinite 0.8s]" transform="translate(450, 420)">
            <path d="M0 0 C-25 -35 25 -35 0 0 Z" fill="#A855F7" opacity="0.5" />
            <path d="M-12 0 Q-20 35 -8 50 M0 0 Q4 40 0 60 M12 0 Q20 35 8 50" stroke="#C084FC" strokeWidth="1.2" fill="none" opacity="0.75" />
          </g>

          {/* Layer 3: Ascending Deep-Sea Koi Dragon */}
          <g className="animate-[dragonSpiralAscent_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(260, 320)">
            {/* Serpentine Coiling Body */}
            <path
              d="M30 220 C60 160 20 80 80 40 C140 0 160 80 120 140 C80 200 130 260 160 280"
              stroke="url(#koiDragonScaleGrad)"
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
            />
            {/* Dorsal Bioluminescent Spines */}
            <path
              d="M20 220 C50 160 10 80 70 40 C130 0 150 80 110 140"
              stroke="#67E8F9"
              strokeWidth="4"
              strokeDasharray="6 6"
              fill="none"
            />
            {/* Dragon Majestic Head & Whiskers */}
            <g transform="translate(80, 40)">
              <circle cx="0" cy="0" r="18" fill="#0284C7" />
              <polygon points="0,-18 10,-35 2,-20" fill="#38BDF8" /> {/* Horn */}
              <polygon points="0,-18 -10,-35 -2,-20" fill="#38BDF8" />
              {/* Whiskers */}
              <path d="M12 0 Q40 -20 50 10" stroke="#E0F2FE" strokeWidth="2.5" fill="none" />
              <path d="M-12 0 Q-40 -20 -50 10" stroke="#E0F2FE" strokeWidth="2.5" fill="none" />
              <circle cx="-6" cy="-4" r="3.5" fill="#FEF08A" />
              <circle cx="6" cy="-4" r="3.5" fill="#FEF08A" />
            </g>
          </g>

          <defs>
            <radialGradient id="abyssGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#082F49" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="koiDragonScaleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <path d="M40 90 C70 40 60 20 100 30 C130 40 120 80 160 85" stroke="#38BDF8" strokeWidth="12" strokeLinecap="round" fill="none" />
        <circle cx="100" cy="30" r="12" fill="#0284C7" />
        <circle cx="96" cy="28" r="2.5" fill="#FEF08A" />
        <circle cx="45" cy="50" r="6" fill="#67E8F9" opacity="0.5" className="animate-pulse" />
      </svg>
    </div>
  ),
};
