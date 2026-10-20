import React, { useEffect, useState } from 'react';

interface EffectProps {
  itemId: string;
  size?: number;
  canAnimate?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Avatar-sized Effect Wrapper (rendered around AvatarFrame)
 */
export const EffectAvatarRenderer: React.FC<EffectProps> = ({
  itemId,
  size = 64,
  canAnimate = false,
  children,
  className = '',
}) => {
  switch (itemId) {
    case 'effect-faint-sparkles':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span className={`absolute -top-1 -left-1 text-[#FFD66B] text-xs pointer-events-none z-20 ${canAnimate ? 'animate-bounce' : ''}`}>✦</span>
          <span className={`absolute -top-1 -right-1 text-[#FFD66B] text-[10px] pointer-events-none z-20 ${canAnimate ? 'animate-pulse' : ''}`}>✦</span>
          <span className={`absolute -bottom-1 right-0 text-[#FFD66B] text-xs pointer-events-none z-20 ${canAnimate ? 'animate-ping' : ''}`}>✧</span>
          <span className="absolute bottom-0 -left-1 text-[#FFD66B] text-[9px] pointer-events-none z-20">✦</span>
          {children}
        </div>
      );

    case 'effect-ember-drift':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span className={`absolute -bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-[#EF4444] shadow-[0_0_4px_#EF4444] z-20 pointer-events-none ${canAnimate ? 'animate-ping' : ''}`} />
          <span className={`absolute bottom-2 -right-1 w-2 h-2 rounded-full bg-[#F87171] shadow-[0_0_4px_#F87171] z-20 pointer-events-none ${canAnimate ? 'animate-pulse' : ''}`} />
          <span className="absolute -top-1 right-2 w-1 h-1 rounded-full bg-[#DC2626] z-20 pointer-events-none" />
          {children}
        </div>
      );

    case 'effect-electric-aura':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${canAnimate ? 'animate-pulse' : 'opacity-60'}`} viewBox="0 0 64 64" fill="none">
            <path d="M12 20L18 26L14 34L22 42" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <path d="M52 18L46 24L50 32L44 44" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </svg>
          {children}
        </div>
      );

    case 'effect-cherry-storm':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[11px] z-20 pointer-events-none ${canAnimate ? 'animate-bounce' : ''}`}>🌸</span>
          <span className={`absolute bottom-0 -left-2 text-[10px] z-20 pointer-events-none ${canAnimate ? 'animate-pulse' : ''}`}>🌸</span>
          <span className={`absolute top-1/3 -right-2 text-[9px] z-20 pointer-events-none ${canAnimate ? 'animate-ping' : ''}`}>🌸</span>
          {children}
        </div>
      );

    case 'effect-shadow-haze':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className={`absolute -inset-2 rounded-full bg-radial from-transparent via-[#581C87]/30 to-[#3B0764]/60 blur-xs z-0 pointer-events-none ${canAnimate ? 'animate-pulse' : 'opacity-50'}`} />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-divine-radiance':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className={`absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none z-0 ${canAnimate ? 'origin-center animate-[spin_12s_linear_infinite]' : ''}`} viewBox="0 0 100 100" fill="none">
            <g stroke="#FBBF24" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="4 6">
              <line x1="50" y1="5" x2="50" y2="25" />
              <line x1="50" y1="75" x2="50" y2="95" />
              <line x1="5" y1="50" x2="25" y2="50" />
              <line x1="75" y1="50" x2="95" y2="50" />
            </g>
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    default:
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          {children}
        </div>
      );
  }
};

/**
 * 25 FULL-CARD PROFILE OVERLAY EFFECTS
 * When a user opens a profile, the equipped effect displays for 3-4s, then smoothly fades out.
 * Pointer-events none ensures it never blocks clicks.
 */
export const ProfileCardEffect: React.FC<{
  itemId?: string | null;
  className?: string;
}> = ({ itemId, className = '' }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!itemId || itemId === 'none') {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3600); // 3.6 seconds display duration, then fades away

    return () => clearTimeout(timer);
  }, [itemId]);

  if (!itemId || itemId === 'none') return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20 transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      aria-hidden="true"
    >
      {/* 13 Static Effects (zero motion, still overlay) */}
      {itemId === 'effect-whispering-mist' && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-500/20 via-transparent to-slate-400/10" />
      )}
      {itemId === 'effect-golden-leaf-frost' && (
        <div className="absolute inset-0 border-2 border-amber-500/20 rounded-2xl" />
      )}
      {itemId === 'effect-crimson-vignette' && (
        <div className="absolute inset-0 bg-radial from-transparent to-[#D71920]/25" />
      )}
      {itemId === 'effect-ink-brush-splash' && (
        <div className="absolute inset-0 border border-slate-700/50 bg-slate-900/15" />
      )}
      {itemId === 'effect-star-chart' && (
        <div className="absolute inset-0 bg-[radial-gradient(#818CF8_1px,transparent_1px)] bg-[size:16px_16px] opacity-25" />
      )}
      {itemId === 'effect-frosted-crystal' && (
        <div className="absolute inset-0 border border-sky-400/30 bg-sky-950/10" />
      )}
      {itemId === 'effect-paper-lantern-glow' && (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent" />
      )}
      {itemId === 'effect-sacred-geometry' && (
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <svg viewBox="0 0 200 200" className="w-48 h-48 stroke-amber-400" fill="none">
            <polygon points="100,10 180,150 20,150" strokeWidth="1" />
            <polygon points="100,190 180,50 20,50" strokeWidth="1" />
          </svg>
        </div>
      )}
      {itemId === 'effect-bamboo-screen' && (
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_90%,rgba(22,163,74,0.15)_90%)] bg-[size:24px_100%]" />
      )}
      {itemId === 'effect-cherry-carpet' && (
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-pink-500/20 to-transparent" />
      )}
      {itemId === 'effect-dawn-horizon' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent" />
      )}
      {itemId === 'effect-dusk-smoke' && (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 to-transparent" />
      )}
      {itemId === 'effect-ancient-runes' && (
        <div className="absolute inset-0 border border-amber-400/40 rounded-2xl" />
      )}

      {/* 12 Animated Effects (active motion while visible) */}
      {itemId === 'effect-faint-sparkles' && (
        <div className="absolute inset-0">
          <span className="absolute top-4 left-6 text-amber-300 text-lg animate-ping">✦</span>
          <span className="absolute top-12 right-8 text-amber-300 text-sm animate-pulse">✦</span>
          <span className="absolute bottom-6 left-1/3 text-amber-300 text-base animate-bounce">✧</span>
        </div>
      )}
      {itemId === 'effect-ember-drift' && (
        <div className="absolute inset-0">
          <span className="absolute bottom-4 left-8 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444] animate-ping" />
          <span className="absolute bottom-8 right-12 w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#F97316] animate-pulse" />
          <span className="absolute bottom-16 left-1/2 w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" />
        </div>
      )}
      {itemId === 'effect-electric-aura' && (
        <div className="absolute inset-0 border-2 border-cyan-400/50 shadow-[inset_0_0_16px_rgba(6,182,212,0.4)] animate-pulse rounded-2xl" />
      )}
      {itemId === 'effect-cherry-storm' && (
        <div className="absolute inset-0 flex items-center justify-around">
          <span className="text-xl animate-bounce">🌸</span>
          <span className="text-sm animate-ping">🌸</span>
          <span className="text-lg animate-pulse">🌸</span>
        </div>
      )}
      {itemId === 'effect-shadow-haze' && (
        <div className="absolute inset-0 bg-radial from-transparent to-purple-950/60 blur-xs animate-pulse" />
      )}
      {itemId === 'effect-divine-radiance' && (
        <div className="absolute inset-0 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-pulse rounded-2xl" />
      )}
      {itemId === 'effect-thunder-storm' && (
        <div className="absolute inset-0 border border-yellow-400 shadow-[0_0_12px_#FDE047] animate-ping rounded-2xl" />
      )}
      {itemId === 'effect-celestial-star-drift' && (
        <div className="absolute inset-0 bg-radial from-purple-900/30 to-transparent">
          <span className="absolute top-6 left-10 text-white animate-ping">★</span>
          <span className="absolute bottom-8 right-14 text-purple-200 animate-pulse">★</span>
        </div>
      )}
      {itemId === 'effect-spirit-wisps' && (
        <div className="absolute inset-0">
          <span className="absolute bottom-6 left-10 w-4 h-4 rounded-full bg-sky-400/70 blur-xs animate-pulse" />
          <span className="absolute bottom-12 right-12 w-3 h-3 rounded-full bg-sky-300/70 blur-xs animate-bounce" />
        </div>
      )}
      {itemId === 'effect-neon-rain' && (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_92%,rgba(0,240,255,0.4)_92%)] bg-[size:16px_16px] animate-pulse" />
      )}
      {itemId === 'effect-blazing-inferno' && (
        <div className="absolute inset-0 border-2 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.5)] animate-pulse rounded-2xl" />
      )}
      {itemId === 'effect-abyssal-ripples' && (
        <div className="absolute inset-0 border border-sky-400/60 shadow-[inset_0_0_20px_rgba(14,165,233,0.3)] animate-pulse rounded-2xl" />
      )}
    </div>
  );
};
