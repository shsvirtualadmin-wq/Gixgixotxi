import React from 'react';
import type { EffectComponentModule } from './types';

// ─── 7. EFFECT: effect-paper-lantern-glow (Moon Shrine Guardian) ───────────────
// Moon-shrine guardian spirit descending through night clouds with floating celestial paper lanterns
export const EffectPaperLanternGlow: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="300" r="140" fill="#FBBF24" opacity="0.3" />
            <polygon points="300,200 320,260 300,320 280,260" fill="#FEF3C7" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes guardianDescend { 0% { transform: translateY(-80px) scale(0.9); opacity: 0; } 30% { transform: translateY(0) scale(1); opacity: 0.95; } 85% { opacity: 0.95; } 100% { transform: translateY(20px) scale(1.05); opacity: 0; } }
          @keyframes ribbonFloat { 0%, 100% { transform: rotate(0deg) skewX(0); } 50% { transform: rotate(-6deg) skewX(-4deg); } }
          @keyframes lanternBob1 { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-16px) rotate(3deg); } }
          @keyframes lanternBob2 { 0%, 100% { transform: translateY(0) rotate(2deg); } 50% { transform: translateY(-22px) rotate(-3deg); } }
          @keyframes cloudSwell { 0% { transform: scale(0.95) translateX(-30px); opacity: 0.4; } 50% { transform: scale(1.05) translateX(30px); opacity: 0.7; } 100% { transform: scale(0.95) translateX(-30px); opacity: 0.4; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Giant Full Moon Backdrop */}
          <circle cx="300" cy="280" r="140" fill="url(#guardianMoonGrad)" opacity="0.6" />

          {/* Layer 2: Drifting Mountain Cloud Banks */}
          <g className="animate-[cloudSwell_8s_ease-in-out_infinite]" opacity="0.5">
            <path d="M-60 480 C80 430 180 500 260 460 C360 410 460 490 660 440 L660 620 L-60 620 Z" fill="#1E293B" />
          </g>

          {/* Layer 3: Floating Paper Lanterns with warm flickering candles */}
          <g className="animate-[lanternBob1_4s_ease-in-out_infinite]" transform="translate(120, 240)">
            <line x1="20" y1="0" x2="20" y2="30" stroke="#78350F" strokeWidth="1.5" />
            <rect x="6" y="30" width="28" height="40" rx="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            <circle cx="20" cy="50" r="12" fill="#FEF08A" opacity="0.8" className="animate-pulse" />
          </g>
          <g className="animate-[lanternBob2_5s_ease-in-out_infinite]" transform="translate(430, 290)">
            <line x1="20" y1="0" x2="20" y2="25" stroke="#78350F" strokeWidth="1.5" />
            <rect x="8" y="25" width="24" height="34" rx="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            <circle cx="20" cy="42" r="10" fill="#FEF08A" opacity="0.8" className="animate-pulse" />
          </g>

          {/* Layer 4: Guardian Spirit Descending Silhouette (Top Center) */}
          <g className="origin-top animate-[guardianDescend_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" transform="translate(230, 160)">
            {/* Halo Ring */}
            <circle cx="70" cy="70" r="50" fill="none" stroke="#FDE68A" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
            {/* Shrine Guardian Crown & Hair Knot */}
            <polygon points="70,18 64,36 76,36" fill="#FBBF24" />
            <circle cx="70" cy="45" r="14" fill="#0F172A" />
            {/* Flowing Celestial Haori Robes */}
            <path d="M40 70 L100 70 L120 180 L20 180 Z" fill="#1E1B4B" />
            {/* Golden Embellishment Sash */}
            <rect x="45" y="95" width="50" height="12" rx="2" fill="#F59E0B" />
            {/* Trailing Celestial Hagoromo Ribbons */}
            <g className="animate-[ribbonFloat_3s_ease-in-out_infinite]">
              <path d="M25 75 C-15 110 -10 160 5 190 C-5 160 5 120 35 90 Z" fill="#DC2626" opacity="0.9" />
              <path d="M115 75 C155 110 150 160 135 190 C145 160 135 120 105 90 Z" fill="#DC2626" opacity="0.9" />
            </g>
            {/* Spirit Lantern held in hand */}
            <circle cx="70" cy="140" r="18" fill="url(#guardianOrbGrad)" />
          </g>

          {/* Layer 5: Sparkling Star Motes */}
          {!isLowEnd && (
            <g>
              {[
                { cx: 160, cy: 380 },
                { cx: 220, cy: 440 },
                { cx: 380, cy: 410 },
                { cx: 450, cy: 360 },
              ].map((m, i) => (
                <circle key={i} cx={m.cx} cy={m.cy} r={2.5} fill="#FEF08A" className="animate-ping" style={{ animationDuration: '3s', animationDelay: `${i * 0.7}s` }} />
              ))}
            </g>
          )}

          <defs>
            <radialGradient id="guardianMoonGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="guardianOrbGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FDE68A" stopOpacity="0.9" />
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
        <circle cx="100" cy="45" r="28" fill="#FBBF24" opacity="0.4" />
        <g transform="translate(85, 25)">
          <circle cx="15" cy="15" r="8" fill="#0F172A" />
          <path d="M5 25 L25 25 L32 55 L-2 55 Z" fill="#1E1B4B" />
          <circle cx="15" cy="40" r="5" fill="#FEF08A" className="animate-pulse" />
        </g>
        <g transform="translate(45, 40)">
          <rect width="10" height="15" rx="2" fill="#F59E0B" className="animate-bounce" />
        </g>
        <g transform="translate(145, 50)">
          <rect width="10" height="15" rx="2" fill="#F59E0B" className="animate-bounce" style={{ animationDelay: '0.4s' }} />
        </g>
      </svg>
    </div>
  ),
};

// ─── 8. EFFECT: effect-sacred-geometry (Ancient Temple Bell) ──────────────────
// Ancient massive bronze temple bell ringing acoustic shockwaves of sacred geometric light & runes
export const EffectSacredGeometry: EffectComponentModule = {
  FullScene: ({ isLowEnd, reducedMotion }) => {
    if (reducedMotion) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[fadeSimple_5s_ease-out_forwards]">
          <svg viewBox="0 0 600 800" className="w-full h-full object-cover opacity-75">
            <circle cx="300" cy="360" r="140" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden mix-blend-screen opacity-90 animate-[cinematicFade_5.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <style>{`
          @keyframes bellSwing { 0% { transform: rotate(0deg); } 20% { transform: rotate(8deg); } 40% { transform: rotate(-7deg); } 60% { transform: rotate(4deg); } 80% { transform: rotate(-2deg); } 100% { transform: rotate(0deg); } }
          @keyframes shockwaveExpand1 { 0% { transform: scale(0.2); opacity: 0.95; } 100% { transform: scale(2.2); opacity: 0; } }
          @keyframes shockwaveExpand2 { 0% { transform: scale(0.2); opacity: 0.95; } 100% { transform: scale(2.4); opacity: 0; } }
          @keyframes runeFloat { 0% { transform: translateY(0) rotate(0deg); opacity: 0.8; } 50% { transform: translateY(-30px) rotate(15deg); opacity: 1; } 100% { transform: translateY(-60px) rotate(30deg); opacity: 0; } }
        `}</style>
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Layer 1: Acoustic Resonance Shockwaves radiating outward */}
          <g className="origin-center" transform="translate(300, 360)">
            <circle cx="0" cy="0" r="100" fill="none" stroke="#F59E0B" strokeWidth="2" className="animate-[shockwaveExpand1_2.5s_ease-out_infinite]" />
            <polygon points="0,-120 104,60 -104,60" fill="none" stroke="#FBBF24" strokeWidth="1.5" className="animate-[shockwaveExpand2_3s_ease-out_infinite]" />
            <polygon points="0,120 104,-60 -104,-60" fill="none" stroke="#FBBF24" strokeWidth="1.5" className="animate-[shockwaveExpand2_3s_ease-out_infinite]" />
          </g>

          {/* Layer 2: Hanging Wooden Beam Structure */}
          <rect x="180" y="80" width="240" height="24" rx="4" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          <line x1="260" y1="104" x2="260" y2="150" stroke="#71717A" strokeWidth="4" />
          <line x1="340" y1="104" x2="340" y2="150" stroke="#71717A" strokeWidth="4" />

          {/* Layer 3: Colossal Ancient Bronze Temple Bell (Bonshō) */}
          <g className="origin-top animate-[bellSwing_4s_ease-in-out_infinite]" transform="translate(300, 150)">
            {/* Bell Top Crown Ring (Ryūzu) */}
            <ellipse cx="0" cy="0" rx="40" ry="14" fill="#B45309" />
            {/* Bell Dome & Flaring Skirt */}
            <path d="M-55 10 C-50 90 -75 180 -80 200 L80 200 C75 180 50 90 55 10 Z" fill="url(#bronzeBellGrad)" stroke="#78350F" strokeWidth="2" />
            {/* Bell Relief Lotus Pattern & Striking Point (Tsukiza) */}
            <circle cx="0" cy="120" r="22" fill="#D97706" stroke="#92400E" strokeWidth="2" />
            <circle cx="0" cy="120" r="14" fill="#FEF08A" opacity="0.8" />
            {/* Decorative Grid Lines */}
            <line x1="-60" y1="70" x2="60" y2="70" stroke="#78350F" strokeWidth="2" />
            <line x1="-70" y1="160" x2="70" y2="160" stroke="#78350F" strokeWidth="2" />
          </g>

          {/* Layer 4: Floating Sacred Sanskrit & Ancient Runes */}
          <g>
            {[
              { x: 160, y: 320, rune: 'ॐ', delay: '0s' },
              { x: 420, y: 300, rune: '卍', delay: '0.8s' },
              { x: 190, y: 460, rune: '蓮', delay: '1.4s' },
              { x: 400, y: 440, rune: '鐘', delay: '0.5s' },
            ].map((r, i) => (
              <text
                key={i}
                x={r.x}
                y={r.y}
                fill="#FDE68A"
                fontSize="24"
                fontFamily="sans-serif"
                fontWeight="bold"
                style={{ animation: `runeFloat 3.5s ease-out infinite ${r.delay}` }}
              >
                {r.rune}
              </text>
            ))}
          </g>

          <defs>
            <linearGradient id="bronzeBellGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="40%" stopColor="#B45309" />
              <stop offset="60%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  },
  ThumbnailPreview: ({ className = '' }) => (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 120" className="w-full h-full object-cover">
        <circle cx="100" cy="65" r="42" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" className="animate-ping" style={{ animationDuration: '3s' }} />
        <path d="M75 30 C75 60 65 90 60 100 L140 100 C135 90 125 60 125 30 Z" fill="#B45309" />
        <circle cx="100" cy="70" r="10" fill="#FEF08A" className="animate-pulse" />
      </svg>
    </div>
  ),
};
