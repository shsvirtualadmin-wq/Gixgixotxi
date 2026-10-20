import React from 'react';

interface NameplateProps {
  itemId: string;
  name: string;
  shortId?: string;
  roleBadge?: string;
  canAnimate?: boolean;
  className?: string;
}

/**
 * 25 NAMEPLATES (13 Static, 12 Animated)
 * High-contrast legible text (contrast >= 4.5:1) with textured motifs.
 * Nameplate scales to its container width (max-w-full, overflow-hidden),
 * long names truncate with an ellipsis (min-w-0 truncate),
 * and all decorations/badges stay cleanly inside the banner (shrink-0).
 */
export const NameplateRenderer: React.FC<NameplateProps> = ({
  itemId,
  name,
  shortId,
  roleBadge,
  canAnimate = false,
  className = '',
}) => {
  switch (itemId) {
    // ─── 13 STATIC NAMEPLATES ───────────────────────────────────────────────
    case 'plate-slate-scholar':
      return (
        <div
          className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#1E1E1E] border border-[#3A3A3A] shadow-sm ${className}`}
          style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '6px 6px' }}
        >
          <span className="font-heading font-semibold text-xs text-white truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A3A3A3] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/15 text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-golden-honor':
      return (
        <div
          className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border border border-[#D97706] shadow-sm ${className}`}
          style={{ background: 'linear-gradient(135deg, #78350F 0%, #B45309 50%, #92400E 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
        >
          <span className="font-heading font-bold text-xs text-[#FEF3C7] tracking-wide truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE68A] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#78350F] text-[#FCD34D] font-bold border border-[#F59E0B] shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-bloodline-nakama':
      return (
        <div
          className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border border border-[#EF4444]/60 shadow-sm ${className}`}
          style={{ background: 'linear-gradient(135deg, #450A0A 0%, #7F1D1D 50%, #991B1B 100%)' }}
        >
          <span className="font-heading font-bold text-xs text-white tracking-wide truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FCA5A5] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#B91C1C] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-imperial-parchment':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#27272A] border border-[#CA8A04] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-[#FEF08A] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#E4E4E7] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#713F12] text-[#FEF08A] font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-ebony-carved':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#09090B] border border-[#27272A] shadow-inner ${className}`}>
          <span className="font-heading font-semibold text-xs text-[#E4E4E7] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A1A1AA] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/15 text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-marble-merit':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#18181B] border border-[#E2E8F0] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-white truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#CBD5E1] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#334155] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-brushed-titanium':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#1E293B] border border-[#475569] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-[#F1F5F9] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#CBD5E1] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#0F172A] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-autumn-maple':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#431407] border border-[#C2410C] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-[#FED7AA] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDBA74] shrink-0">#{shortId}</span>}
          <span className="text-[10px] shrink-0 select-none">🍁</span>
        </div>
      );

    case 'plate-jade-dynasty':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#064E3B] border border-[#10B981] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-[#D1FAE5] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A7F3D0] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#047857] text-[#D1FAE5] font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-iron-vanguard':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#334155] border border-[#64748B] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-white uppercase tracking-wider truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#E2E8F0] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#1E293B] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-zen-bamboo':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#052E16] border border-[#16A34A] shadow-sm ${className}`}>
          <span className="font-heading font-semibold text-xs text-[#DCFCE7] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#BBF7D0] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#15803D] text-[#DCFCE7] font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-crimson-lacquer':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#7F1D1D] border border-[#F87171] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-white truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FECDD3] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#991B1B] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-midnight-constellation':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#1E1B4B] border border-[#818CF8] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-[#E0E7FF] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#C7D2FE] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#312E81] text-[#E0E7FF] font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    // ─── 12 ANIMATED NAMEPLATES ─────────────────────────────────────────────
    case 'plate-midnight-syndicate':
      return (
        <div
          className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#0F172A] border border-[#1E3A8A] shadow-[0_0_8px_rgba(59,130,246,0.3)] ${className}`}
        >
          {canAnimate && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#38BDF8] animate-pulse pointer-events-none" />}
          <span className="font-heading font-bold text-xs text-white truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#93C5FD] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#1D4ED8] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-cyber-samurai':
      return (
        <div
          className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#18181B] border border-[#D97706]/70 shadow-sm ${className}`}
        >
          {canAnimate && <div className="absolute inset-0 pointer-events-none opacity-20 bg-amber-400 animate-pulse" style={{ mixBlendMode: 'screen' }} />}
          <span className="font-heading font-bold text-xs text-white uppercase tracking-wider truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE047] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#F59E0B] text-black font-black shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-galaxy-pioneer':
      return (
        <div
          className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border border border-[#8B5CF6]/60 shadow-[0_0_8px_rgba(139,92,246,0.35)] ${className}`}
          style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)' }}
        >
          <span className={`absolute top-0.5 right-2 w-1 h-1 rounded-full bg-white pointer-events-none ${canAnimate ? 'animate-ping' : 'opacity-80'}`} />
          <span className="font-heading font-bold text-xs text-white tracking-wide truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#DDD6FE] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#6D28D9] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-electric-surge':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#082F49] border border-[#06B6D4] shadow-[0_0_8px_#06B6D4] ${className}`}>
          {canAnimate && <div className="absolute inset-0 border border-[#38BDF8] animate-pulse rounded-lg pointer-events-none" />}
          <span className="font-heading font-bold text-xs text-[#E0F2FE] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#7DD3FC] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#0284C7] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-sakura-flutter':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#831843] border border-[#F472B6] shadow-sm ${className}`}>
          <span className="font-heading font-bold text-xs text-[#FCE7F3] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FBCFE8] shrink-0">#{shortId}</span>}
          <span className={`text-[10px] shrink-0 select-none ${canAnimate ? 'animate-bounce' : ''}`}>🌸</span>
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#BE185D] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-blazing-magma':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#450A0A] border border-[#DC2626] shadow-sm ${className}`}>
          {canAnimate && <div className="absolute inset-0 bg-[#EF4444]/20 animate-pulse pointer-events-none rounded-lg" />}
          <span className="font-heading font-bold text-xs text-[#FEF2F2] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FCA5A5] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#B91C1C] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-aurora-borealis':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#022C22] border border-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.35)] ${className}`}>
          <span className="font-heading font-bold text-xs text-[#ECFDF5] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#6EE7B7] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#047857] text-[#ECFDF5] font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-neon-pulse':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#2E1065] border border-[#EC4899] shadow-[0_0_8px_#EC4899] ${className}`}>
          {canAnimate && <div className="absolute inset-x-0 top-0 h-0.5 bg-[#00F0FF] animate-pulse pointer-events-none" />}
          <span className="font-heading font-bold text-xs text-white truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#F472B6] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#BE185D] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-thunder-striker':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#1C1917] border border-[#EAB308] shadow-sm ${className}`}>
          <span className={`text-[10px] shrink-0 select-none ${canAnimate ? 'animate-ping' : ''}`}>⚡</span>
          <span className="font-heading font-bold text-xs text-[#FEF08A] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE047] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#A16207] text-[#FEF08A] font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-void-phantom':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#3B0764] border border-[#9333EA] shadow-[0_0_8px_#9333EA] ${className}`}>
          <span className="font-heading font-bold text-xs text-[#F3E8FF] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#D8B4FE] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#7E22CE] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-solar-flare':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#7C2D12] border border-[#F97316] shadow-sm ${className}`}>
          {canAnimate && <div className="absolute inset-0 bg-[#FBBF24]/20 animate-pulse pointer-events-none rounded-lg" />}
          <span className="font-heading font-bold text-xs text-[#FFF7ED] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FED7AA] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#C2410C] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    case 'plate-bioluminescent-abyss':
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-lg max-w-full overflow-hidden select-none box-border bg-[#0C4A6E] border border-[#0EA5E9] shadow-[0_0_8px_#0EA5E9] ${className}`}>
          <span className={`absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-[#38BDF8] pointer-events-none ${canAnimate ? 'animate-ping' : ''}`} />
          <span className="font-heading font-bold text-xs text-[#F0F9FF] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#BAE6FD] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#0369A1] text-white font-bold shrink-0">{roleBadge}</span>}
        </div>
      );

    default:
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-md max-w-full overflow-hidden select-none box-border bg-[var(--surface-2)] border border-[var(--border)] shadow-sm ${className}`}>
          <span className="font-heading font-semibold text-xs text-[var(--text)] truncate min-w-0">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[var(--muted)] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[var(--surface-hover)] text-[var(--text)] font-bold shrink-0">{roleBadge}</span>}
        </div>
      );
  }
};
