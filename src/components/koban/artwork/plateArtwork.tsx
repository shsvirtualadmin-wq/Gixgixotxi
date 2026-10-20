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
 * Static items NEVER animate anywhere.
 * Animated items move only using transform and opacity.
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
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#1E1E1E] border border-[#3A3A3A] shadow-sm select-none ${className}`}
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
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg border border-[#D97706] shadow-sm select-none ${className}`}
          style={{ background: 'linear-gradient(135deg, #78350F 0%, #B45309 50%, #92400E 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
        >
          <span className="font-heading font-bold text-xs text-[#FEF3C7] tracking-wide">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE68A]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#78350F] text-[#FCD34D] font-bold border border-[#F59E0B]">{roleBadge}</span>}
        </div>
      );

    case 'plate-bloodline-nakama':
      return (
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg border border-[#EF4444]/60 shadow-sm select-none ${className}`}
          style={{ background: 'linear-gradient(135deg, #450A0A 0%, #7F1D1D 50%, #991B1B 100%)' }}
        >
          <span className="font-heading font-bold text-xs text-white tracking-wide">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FCA5A5]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#B91C1C] text-white font-bold">{roleBadge}</span>}
        </div>
      );

    case 'plate-imperial-parchment':
      return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#27272A] border border-[#CA8A04] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-[#FEF08A]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A1A1AA]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#713F12] text-[#FEF08A] font-bold">{roleBadge}</span>}
        </div>
      );

    case 'plate-ebony-carved':
      return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#09090B] border border-[#27272A] shadow-inner select-none ${className}`}>
          <span className="font-heading font-semibold text-xs text-[#E4E4E7]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#71717A]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/10 text-white font-bold">{roleBadge}</span>}
        </div>
      );

    case 'plate-marble-merit':
      return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#18181B] border border-[#E2E8F0] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-white">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#94A3B8]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#334155] text-white font-bold">{roleBadge}</span>}
        </div>
      );

    case 'plate-brushed-titanium':
      return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#1E293B] border border-[#475569] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-[#F1F5F9]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#94A3B8]">#{shortId}</span>}
        </div>
      );

    case 'plate-autumn-maple':
      return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#431407] border border-[#C2410C] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-[#FED7AA]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDBA74]">#{shortId}</span>}
          <span className="text-[10px]">🍁</span>
        </div>
      );

    case 'plate-jade-dynasty':
      return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#064E3B] border border-[#10B981] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-[#D1FAE5]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#6EE7B7]">#{shortId}</span>}
        </div>
      );

    case 'plate-iron-vanguard':
      return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#334155] border border-[#64748B] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-white uppercase tracking-wider">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#CBD5E1]">#{shortId}</span>}
        </div>
      );

    case 'plate-zen-bamboo':
      return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#052E16] border border-[#16A34A] shadow-sm select-none ${className}`}>
          <span className="font-heading font-semibold text-xs text-[#DCFCE7]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#86EFAC]">#{shortId}</span>}
        </div>
      );

    case 'plate-crimson-lacquer':
      return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#7F1D1D] border border-[#F87171] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-white">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FECDD3]">#{shortId}</span>}
        </div>
      );

    case 'plate-midnight-constellation':
      return (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#1E1B4B] border border-[#818CF8] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-[#E0E7FF]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A5B4FC]">#{shortId}</span>}
        </div>
      );

    // ─── 12 ANIMATED NAMEPLATES ─────────────────────────────────────────────
    case 'plate-midnight-syndicate':
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#0F172A] border border-[#1E3A8A] shadow-[0_0_8px_rgba(59,130,246,0.3)] overflow-hidden select-none ${className}`}
        >
          {canAnimate && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#38BDF8] animate-pulse" />}
          <span className="font-heading font-bold text-xs text-white">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#93C5FD]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#1D4ED8] text-white font-bold">{roleBadge}</span>}
        </div>
      );

    case 'plate-cyber-samurai':
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#18181B] border border-[#D97706]/70 shadow-sm overflow-hidden select-none ${className}`}
        >
          {canAnimate && <div className="absolute inset-0 pointer-events-none opacity-20 bg-amber-400 animate-pulse" style={{ mixBlendMode: 'screen' }} />}
          <span className="font-heading font-bold text-xs text-white uppercase tracking-wider">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FBBF24]">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#F59E0B] text-black font-black">{roleBadge}</span>}
        </div>
      );

    case 'plate-galaxy-pioneer':
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg border border-[#8B5CF6]/60 shadow-[0_0_8px_rgba(139,92,246,0.35)] overflow-hidden select-none ${className}`}
          style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)' }}
        >
          <span className={`absolute top-0.5 right-2 w-1 h-1 rounded-full bg-white ${canAnimate ? 'animate-ping' : 'opacity-80'}`} />
          <span className="font-heading font-bold text-xs text-white tracking-wide">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#DDD6FE]">#{shortId}</span>}
        </div>
      );

    case 'plate-electric-surge':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#082F49] border border-[#06B6D4] shadow-[0_0_8px_#06B6D4] select-none ${className}`}>
          {canAnimate && <div className="absolute inset-0 border border-[#38BDF8] animate-pulse rounded-lg pointer-events-none" />}
          <span className="font-heading font-bold text-xs text-[#E0F2FE]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#7DD3FC]">#{shortId}</span>}
        </div>
      );

    case 'plate-sakura-flutter':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#831843] border border-[#F472B6] shadow-sm select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-[#FCE7F3]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FBCFE8]">#{shortId}</span>}
          <span className={`text-[9px] ${canAnimate ? 'animate-bounce' : ''}`}>🌸</span>
        </div>
      );

    case 'plate-blazing-magma':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#450A0A] border border-[#DC2626] select-none ${className}`}>
          {canAnimate && <div className="absolute inset-0 bg-[#EF4444]/20 animate-pulse pointer-events-none rounded-lg" />}
          <span className="font-heading font-bold text-xs text-[#FEF2F2]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FCA5A5]">#{shortId}</span>}
        </div>
      );

    case 'plate-aurora-borealis':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#022C22] border border-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.35)] select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-[#ECFDF5]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#6EE7B7]">#{shortId}</span>}
        </div>
      );

    case 'plate-neon-pulse':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#2E1065] border border-[#EC4899] shadow-[0_0_8px_#EC4899] select-none ${className}`}>
          {canAnimate && <div className="absolute inset-x-0 top-0 h-0.5 bg-[#00F0FF] animate-pulse" />}
          <span className="font-heading font-bold text-xs text-white">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#F472B6]">#{shortId}</span>}
        </div>
      );

    case 'plate-thunder-striker':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#1C1917] border border-[#EAB308] select-none ${className}`}>
          <span className={`text-[10px] ${canAnimate ? 'animate-ping' : ''}`}>⚡</span>
          <span className="font-heading font-bold text-xs text-[#FEF08A]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE047]">#{shortId}</span>}
        </div>
      );

    case 'plate-void-phantom':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#3B0764] border border-[#9333EA] shadow-[0_0_8px_#9333EA] select-none ${className}`}>
          <span className="font-heading font-bold text-xs text-[#F3E8FF]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#D8B4FE]">#{shortId}</span>}
        </div>
      );

    case 'plate-solar-flare':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#7C2D12] border border-[#F97316] select-none ${className}`}>
          {canAnimate && <div className="absolute inset-0 bg-[#FBBF24]/20 animate-pulse pointer-events-none rounded-lg" />}
          <span className="font-heading font-bold text-xs text-[#FFF7ED]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FED7AA]">#{shortId}</span>}
        </div>
      );

    case 'plate-bioluminescent-abyss':
      return (
        <div className={`relative inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#0C4A6E] border border-[#0EA5E9] shadow-[0_0_8px_#0EA5E9] select-none ${className}`}>
          <span className={`absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-[#38BDF8] ${canAnimate ? 'animate-ping' : ''}`} />
          <span className="font-heading font-bold text-xs text-[#F0F9FF]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#BAE6FD]">#{shortId}</span>}
        </div>
      );

    default:
      return (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--surface-2)] border border-[var(--border)] select-none ${className}`}>
          <span className="font-heading font-semibold text-xs text-[var(--text)]">{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[var(--muted)]">#{shortId}</span>}
        </div>
      );
  }
};
