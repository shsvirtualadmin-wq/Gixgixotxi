import React from 'react';

interface CosmeticRendererProps {
  itemId: string;
  size?: number; // pixel diameter/box for avatar/effect
  children?: React.ReactNode; // child avatar or badge text
  className?: string;
}

/**
 * 18 distinct self-contained SVG/CSS cosmetic renderers
 * (6 frames, 6 nameplates, 6 effects)
 */
export const CosmeticFrame: React.FC<CosmeticRendererProps> = ({
  itemId,
  size = 56,
  children,
  className = '',
}) => {
  switch (itemId) {
    case 'frame-bronze-ronin':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#B8740A] shadow-[0_0_4px_rgba(184,116,10,0.4)] pointer-events-none z-10" />
          {/* 4 corner bronze studs */}
          <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E8A317] border border-[#78350F] z-20 pointer-events-none" />
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E8A317] border border-[#78350F] z-20 pointer-events-none" />
          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#E8A317] border border-[#78350F] z-20 pointer-events-none" />
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#E8A317] border border-[#78350F] z-20 pointer-events-none" />
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-1">
            {children}
          </div>
        </div>
      );

    case 'frame-neon-cyber':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse pointer-events-none z-10" />
          <div className="absolute -inset-0.5 rounded-full border border-[#FF007A] opacity-75 pointer-events-none z-10" />
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-1">
            {children}
          </div>
        </div>
      );

    case 'frame-crimson-flame':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute inset-0 rounded-full border-2 border-[#D71920] shadow-[0_0_10px_#D71920] pointer-events-none z-10"
            style={{
              animation: 'koban-flame-flicker 2s infinite ease-in-out',
            }}
          />
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-1">
            {children}
          </div>
        </div>
      );

    case 'frame-sakura-blossom':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#FF94B8] shadow-[0_0_6px_rgba(255,148,184,0.6)] pointer-events-none z-10" />
          {/* 3 Petal Shapes */}
          <span className="absolute -top-1 right-1 text-[#FFB6C1] text-[10px] pointer-events-none z-20 animate-bounce">🌸</span>
          <span className="absolute -bottom-0.5 left-0 text-[#FF94B8] text-[9px] pointer-events-none z-20">🌸</span>
          <span className="absolute top-1/2 -right-1 text-[#FFC0CB] text-[8px] pointer-events-none z-20">🌸</span>
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-1">
            {children}
          </div>
        </div>
      );

    case 'frame-void-shinobi':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#9333EA] shadow-[0_0_10px_#7E22CE] pointer-events-none z-10" />
          <div className="absolute -inset-1 rounded-full bg-radial from-transparent via-[#581C87]/20 to-[#3B0764]/40 animate-pulse pointer-events-none z-0" />
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-1 relative z-10">
            {children}
          </div>
        </div>
      );

    case 'frame-superadmin-crown':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#FFD700] shadow-[0_0_12px_#F59E0B] pointer-events-none z-10" />
          {/* Imperial Crown Crest at top */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
            <svg width="22" height="14" viewBox="0 0 24 16" fill="none">
              <path d="M2 14L4 4L9 8L12 2L15 8L20 4L22 14H2Z" fill="#FFD700" stroke="#B8740A" strokeWidth="1" />
              <circle cx="12" cy="7" r="2" fill="#D71920" />
            </svg>
          </div>
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-1">
            {children}
          </div>
        </div>
      );

    default:
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          {children}
        </div>
      );
  }
};

export const CosmeticNameplate: React.FC<{
  itemId: string;
  name: string;
  shortId?: string;
  roleBadge?: string;
  className?: string;
}> = ({ itemId, name, shortId, roleBadge, className = '' }) => {
  switch (itemId) {
    case 'plate-slate-scholar':
      return (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#1E1E1E] border border-[#3A3A3A] shadow-sm ${className}`}
          style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '6px 6px' }}
        >
          <span className="font-heading font-semibold text-xs text-white">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A3A3A3]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/10 text-white font-bold">{roleBadge}</span>}
        </div>
      );

    case 'plate-golden-honor':
      return (
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg border border-[#D97706] shadow-sm ${className}`}
          style={{
            background: 'linear-gradient(135deg, #78350F 0%, #B45309 50%, #92400E 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          <span className="font-heading font-bold text-xs text-[#FEF3C7] tracking-wide">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE68A]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#78350F] text-[#FCD34D] font-bold border border-[#F59E0B]">{roleBadge}</span>}
        </div>
      );

    case 'plate-midnight-syndicate':
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#0B132B] border border-[#1C2541] overflow-hidden shadow-sm ${className}`}
        >
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent animate-pulse" />
          <span className="font-heading font-semibold text-xs text-[#E0E1DD]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#00F0FF]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#1C2541] text-[#48CAE4] font-bold">{roleBadge}</span>}
        </div>
      );

    case 'plate-bloodline-nakama':
      return (
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg border border-[#D71920] shadow-sm ${className}`}
          style={{
            background: 'linear-gradient(135deg, #1C0A0B 0%, #3F0E11 50%, #1C0A0B 100%)',
            boxShadow: '0 0 6px rgba(215, 25, 33, 0.35)',
          }}
        >
          <span className="font-heading font-extrabold text-xs text-white tracking-wide">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FFA4A6]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#D71920] text-white font-black">{roleBadge}</span>}
        </div>
      );

    case 'plate-cyber-samurai':
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-[#18181B] border-l-4 border-l-[#F59E0B] border-y border-r border-[#27272A] ${className}`}
          style={{
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          }}
        >
          <span className="font-heading font-bold text-xs text-white uppercase tracking-wider">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FBBF24]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#F59E0B] text-black font-black">{roleBadge}</span>}
        </div>
      );

    case 'plate-galaxy-pioneer':
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg border border-[#8B5CF6]/60 shadow-[0_0_8px_rgba(139,92,246,0.35)] overflow-hidden ${className}`}
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)',
          }}
        >
          <span className="absolute top-0.5 right-2 w-1 h-1 rounded-full bg-white animate-ping" />
          <span className="absolute bottom-1 left-3 w-1 h-1 rounded-full bg-[#C4B5FD] opacity-75" />
          <span className="font-heading font-bold text-xs text-white tracking-wide">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#DDD6FE]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#6D28D9] text-white font-bold">{roleBadge}</span>}
        </div>
      );

    default:
      return (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--surface-2)] border border-[var(--border)] ${className}`}>
          <span className="font-heading font-semibold text-xs text-[var(--text)]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[var(--muted)]">#{shortId}</span>}
        </div>
      );
  }
};

export const CosmeticEffect: React.FC<CosmeticRendererProps> = ({
  itemId,
  size = 64,
  children,
  className = '',
}) => {
  switch (itemId) {
    case 'effect-faint-sparkles':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          {/* Floating Gold Sparkle Stars */}
          <span className="absolute -top-1 -left-1 text-[#FFD66B] text-xs pointer-events-none animate-bounce z-20">✦</span>
          <span className="absolute -top-1 -right-1 text-[#FFD66B] text-[10px] pointer-events-none animate-pulse z-20">✦</span>
          <span className="absolute -bottom-1 right-0 text-[#FFD66B] text-xs pointer-events-none animate-ping z-20">✧</span>
          <span className="absolute bottom-0 -left-1 text-[#FFD66B] text-[9px] pointer-events-none z-20">✦</span>
          {children}
        </div>
      );

    case 'effect-ember-drift':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          {/* Rising Crimson Embers */}
          <span className="absolute -bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-[#EF4444] shadow-[0_0_4px_#EF4444] animate-ping z-20 pointer-events-none" />
          <span className="absolute bottom-2 -right-1 w-2 h-2 rounded-full bg-[#F87171] shadow-[0_0_4px_#F87171] animate-pulse z-20 pointer-events-none" />
          <span className="absolute -top-1 right-2 w-1 h-1 rounded-full bg-[#DC2626] z-20 pointer-events-none" />
          {children}
        </div>
      );

    case 'effect-electric-aura':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          {/* Energy Arcs */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 animate-pulse" viewBox="0 0 64 64" fill="none">
            <path d="M12 20L18 26L14 34L22 42" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <path d="M52 18L46 24L50 32L44 44" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </svg>
          {children}
        </div>
      );

    case 'effect-cherry-storm':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[11px] animate-bounce z-20 pointer-events-none">🌸</span>
          <span className="absolute bottom-0 -left-2 text-[10px] animate-pulse z-20 pointer-events-none">🌸</span>
          <span className="absolute top-1/3 -right-2 text-[9px] animate-ping z-20 pointer-events-none">🌸</span>
          {children}
        </div>
      );

    case 'effect-shadow-haze':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <div className="absolute -inset-2 rounded-full bg-radial from-transparent via-[#581C87]/30 to-[#3B0764]/60 blur-sm animate-pulse z-0 pointer-events-none" />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-divine-radiance':
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          {/* Sunburst Rays */}
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100" fill="none">
            <g stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.45" strokeDasharray="4 6">
              <line x1="50" y1="5" x2="50" y2="25" />
              <line x1="50" y1="75" x2="50" y2="95" />
              <line x1="5" y1="50" x2="25" y2="50" />
              <line x1="75" y1="50" x2="95" y2="50" />
              <line x1="18" y1="18" x2="32" y2="32" />
              <line x1="68" y1="68" x2="82" y2="82" />
              <line x1="82" y1="18" x2="68" y2="32" />
              <line x1="32" y1="68" x2="18" y2="82" />
            </g>
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    default:
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          {children}
        </div>
      );
  }
};
