import React from 'react';

interface NameplateProps {
  itemId: string;
  name: string;
  shortId?: string;
  roleBadge?: string;
  canAnimate?: boolean;
  className?: string;
  allowWrap?: boolean | 'full' | 'two-lines';
}

/**
 * 30 NAMEPLATES (Static & Animated + 5 New Premium)
 * High-contrast legible text (contrast >= 4.5:1) with textured motifs.
 * Supports wrapping (up to 2 lines in store previews, or full wrap in loadout card) when allowWrap is set.
 */
export const NameplateRenderer: React.FC<NameplateProps> = ({
  itemId,
  name,
  shortId,
  roleBadge,
  canAnimate = true,
  className = '',
  allowWrap = false,
}) => {
  const wrapCls =
    allowWrap === 'full'
      ? 'whitespace-normal break-words leading-snug'
      : allowWrap
      ? 'whitespace-normal break-words line-clamp-2 leading-snug'
      : 'truncate';

  switch (itemId) {
    // ─── 13 STATIC NAMEPLATES ───────────────────────────────────────────────
    case 'plate-slate-scholar':
      // Chiseled dark charcoal scholar inkstone with silver corner brackets, ink wash texture & vermilion seal
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm max-w-full overflow-hidden select-none box-border bg-[#18181B] border-y-2 border-[#71717A] shadow-md ${className}`}
          style={{
            clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#3F3F46_1px,transparent_1px)] [background-size:6px_6px] opacity-40 pointer-events-none" />
          <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="8,1 15,8 8,15 1,8" fill="#A1A1AA" stroke="#27272A" strokeWidth="1" />
            <circle cx="8" cy="8" r="2" fill="#18181B" />
          </svg>
          <span className={`font-heading font-semibold text-xs text-[#FAFAFA] tracking-wide ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A1A1AA] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#27272A] text-[#E4E4E7] font-bold border border-[#52525B] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="8,1 15,8 8,15 1,8" fill="#A1A1AA" stroke="#27272A" strokeWidth="1" />
            <circle cx="8" cy="8" r="2" fill="#18181B" />
          </svg>
        </div>
      );

    case 'plate-golden-honor':
      // Imperial gold ingot with chamfered angular ends, braided gold cord border & vermilion seal
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(135deg, #78350F 0%, #B45309 45%, #D97706 70%, #92400E 100%)',
            border: '1.5px solid #FDE68A',
            clipPath: 'polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)',
            boxShadow: 'inset 0 1px 0 rgba(254,243,199,0.5)',
          }}
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" fill="#FDE047" stroke="#92400E" strokeWidth="1.2" />
            <rect x="6" y="6" width="4" height="4" fill="#92400E" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#FEF3C7] tracking-wider ${wrapCls} min-w-0 z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE68A] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#451A03] text-[#FDE047] font-bold border border-[#F59E0B] shrink-0 z-10">
              {roleBadge}
            </span>
          )}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" fill="#FDE047" stroke="#92400E" strokeWidth="1.2" />
            <rect x="6" y="6" width="4" height="4" fill="#92400E" />
          </svg>
        </div>
      );

    case 'plate-bloodline-nakama':
      // Crimson demon-forged armor plate with serrated chevron ends & bloodstone rivets
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(110deg, #450A0A 0%, #7F1D1D 50%, #991B1B 100%)',
            border: '1.5px solid #DC2626',
            clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 12px, 100% 100%, 12px 100%, 0% calc(100% - 12px))',
          }}
        >
          <svg className="w-3.5 h-3.5 text-red-400 shrink-0" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 14,8 8,15 2,8" fill="#EF4444" stroke="#450A0A" strokeWidth="1" />
            <circle cx="8" cy="8" r="2" fill="#FEE2E2" />
          </svg>
          <span className={`font-heading font-bold text-xs text-white tracking-wide ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FCA5A5] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#991B1B] text-white font-bold border border-[#EF4444] shrink-0 z-10">
              {roleBadge}
            </span>
          )}
          <svg className="w-3.5 h-3.5 text-red-400 shrink-0" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 14,8 8,15 2,8" fill="#EF4444" stroke="#450A0A" strokeWidth="1" />
            <circle cx="8" cy="8" r="2" fill="#FEE2E2" />
          </svg>
        </div>
      );

    case 'plate-imperial-parchment':
      // Unfurled horizontal makimono scroll held by polished wooden roller handles with gold rings
      return (
        <div className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border bg-[#27272A] border-y border-[#CA8A04] shadow-sm rounded-xs ${className}`}>
          {/* Left Scroll Rod Handle */}
          <div className="w-2 h-5 bg-[#78350F] rounded-xs border-y-2 border-[#FDE047] shrink-0 flex items-center justify-center">
            <div className="w-1 h-3 bg-[#451A03]" />
          </div>
          <span className={`font-heading font-bold text-xs text-[#FEF08A] tracking-wide ${wrapCls} min-w-0`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#CBD5E1] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#713F12] text-[#FEF08A] font-bold border border-[#EAB308] shrink-0">{roleBadge}</span>}
          {/* Right Scroll Rod Handle */}
          <div className="w-2 h-5 bg-[#78350F] rounded-xs border-y-2 border-[#FDE047] shrink-0 flex items-center justify-center">
            <div className="w-1 h-3 bg-[#451A03]" />
          </div>
        </div>
      );

    case 'plate-ebony-carved':
      // Polished ebony timber with Asanoha geometric relief carving & gold groove accents
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border bg-[#09090B] border border-[#52525B] shadow-inner ${className}`}
          style={{
            clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
          }}
        >
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L10 6L15 8L10 10L8 15L6 10L1 8L6 6Z" fill="#F59E0B" />
          </svg>
          <span className={`font-heading font-semibold text-xs text-[#E4E4E7] tracking-wider ${wrapCls} min-w-0`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A1A1AA] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#18181B] text-[#D4D4D8] font-bold border border-[#52525B] shrink-0">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L10 6L15 8L10 10L8 15L6 10L1 8L6 6Z" fill="#F59E0B" />
          </svg>
        </div>
      );

    case 'plate-marble-merit':
      // Pure white Carrara marble slab with stepped classical gold pedestals & laurel leaf crests
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border bg-[#F8FAFC] border-2 border-[#D97706] shadow-sm ${className}`}
          style={{
            clipPath: 'polygon(0% 4px, 4px 4px, 4px 0%, calc(100% - 4px) 0%, calc(100% - 4px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 4px), 0% calc(100% - 4px))',
          }}
        >
          {/* Classical Column Capital SVG */}
          <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="2" width="12" height="3" rx="1" fill="#D97706" />
            <rect x="4" y="5" width="2" height="7" fill="#B45309" />
            <rect x="7" y="5" width="2" height="7" fill="#B45309" />
            <rect x="10" y="5" width="2" height="7" fill="#B45309" />
            <rect x="2" y="12" width="12" height="2" rx="0.5" fill="#D97706" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#0F172A] tracking-wider ${wrapCls} min-w-0`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#475569] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#1E293B] text-white font-bold shrink-0">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="2" width="12" height="3" rx="1" fill="#D97706" />
            <rect x="4" y="5" width="2" height="7" fill="#B45309" />
            <rect x="7" y="5" width="2" height="7" fill="#B45309" />
            <rect x="10" y="5" width="2" height="7" fill="#B45309" />
            <rect x="2" y="12" width="12" height="2" rx="0.5" fill="#D97706" />
          </svg>
        </div>
      );

    case 'plate-brushed-titanium':
      // Tactical aerospace titanium dog-tag with diagonal hazard cuts and recessed hex bolts
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 max-w-full overflow-hidden select-none box-border bg-[#1E293B] border border-[#64748B] shadow-sm ${className}`}
          style={{
            clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
          }}
        >
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="8,2 14,5 14,11 8,14 2,11 2,5" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="8" cy="8" r="2" fill="#E2E8F0" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#F8FAFC] uppercase tracking-wider ${wrapCls} min-w-0`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#94A3B8] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0F172A] text-[#38BDF8] font-bold border border-[#0284C7] shrink-0">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="8,2 14,5 14,11 8,14 2,11 2,5" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="8" cy="8" r="2" fill="#E2E8F0" />
          </svg>
        </div>
      );

    case 'plate-autumn-maple':
      // Terracotta & burnt amber plaque with scalloped corners and Japanese crimson Momiji leaf vector SVGs
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(135deg, #451A03 0%, #7C2D12 50%, #9A3412 100%)',
            border: '1.5px solid #F97316',
            borderRadius: '12px 2px 12px 2px',
          }}
        >
          {/* Vector Momiji Maple Leaf */}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L9 4L13 3L11 7L15 10L10 10L9 14L8 11L7 14L6 10L1 10L5 7L3 3L7 4Z" fill="#F97316" stroke="#431407" strokeWidth="0.8" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#FED7AA] tracking-wide ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDBA74] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#431407] text-[#FED7AA] font-bold border border-[#EA580C] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L9 4L13 3L11 7L15 10L10 10L9 14L8 11L7 14L6 10L1 10L5 7L3 3L7 4Z" fill="#F97316" stroke="#431407" strokeWidth="0.8" />
          </svg>
        </div>
      );

    case 'plate-jade-dynasty':
      // Imperial nephrite jade tablet with curved notched corners & golden filigree rings
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(135deg, #022C22 0%, #065F46 45%, #047857 80%, #064E3B 100%)',
            border: '1.5px solid #34D399',
            clipPath: 'polygon(0% 6px, 6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px))',
          }}
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#6EE7B7" strokeWidth="2" fill="#065F46" />
            <circle cx="8" cy="8" r="2.5" fill="#FDE047" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#D1FAE5] tracking-wider ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A7F3D0] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#022C22] text-[#6EE7B7] font-bold border border-[#10B981] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#6EE7B7" strokeWidth="2" fill="#065F46" />
            <circle cx="8" cy="8" r="2.5" fill="#FDE047" />
          </svg>
        </div>
      );

    case 'plate-iron-vanguard':
      // Heavy samurai Kabuto defense plate with angular chevron cuts & gunmetal edge rivets
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border bg-[#1E293B] border-x-2 border-[#94A3B8] shadow-md ${className}`}
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 8px) 50%, 100% 100%, 0% 100%, 8px 50%)',
          }}
        >
          <div className="w-1.5 h-1.5 rotate-45 bg-[#E2E8F0] shrink-0" />
          <span className={`font-heading font-bold text-xs text-white uppercase tracking-widest ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#CBD5E1] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0F172A] text-white font-bold border border-[#475569] shrink-0 z-10">{roleBadge}</span>}
          <div className="w-1.5 h-1.5 rotate-45 bg-[#E2E8F0] shrink-0" />
        </div>
      );

    case 'plate-zen-bamboo':
      // Asymmetrical sliced green bamboo culm with organic fibrous wood grain & tied hemp twine
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(180deg, #14532D 0%, #166534 60%, #15803D 100%)',
            border: '1.5px solid #86EFAC',
            borderRadius: '20px 4px 20px 4px',
          }}
        >
          {/* Vector Bamboo Stalk Shoots */}
          <svg className="w-3.5 h-3.5 text-emerald-300 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 14V2M12 14V2" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 7C8 5 11 8 13 6C11 10 7 9 4 7Z" fill="#4ADE80" />
          </svg>
          <span className={`font-heading font-semibold text-xs text-[#DCFCE7] tracking-wide ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#BBF7D0] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#052E16] text-[#86EFAC] font-bold border border-[#22C55E] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-emerald-300 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 14V2M12 14V2" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 7C8 5 5 8 3 6C5 10 9 9 12 7Z" fill="#4ADE80" />
          </svg>
        </div>
      );

    case 'plate-crimson-lacquer':
      // Shinto temple shrine vermilion Urushi lacquer with gold maki-e crane silhouette
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)',
            border: '1.5px solid #FEF08A',
            clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)',
          }}
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 11,6 15,8 11,10 8,15 5,10 1,8 5,6" fill="#FDE047" stroke="#92400E" strokeWidth="0.8" />
          </svg>
          <span className={`font-heading font-bold text-xs text-white tracking-wide ${wrapCls} min-w-0 z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FECDD3] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#450A0A] text-[#FEF08A] font-bold border border-[#F59E0B] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 11,6 15,8 11,10 8,15 5,10 1,8 5,6" fill="#FDE047" stroke="#92400E" strokeWidth="0.8" />
          </svg>
        </div>
      );

    case 'plate-midnight-constellation':
      // Deep indigo celestial navigation star chart with golden coordinate lines and brass compass star
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border bg-[#0F172A] border-y border-[#38BDF8] shadow-md rounded-sm ${className}`}
        >
          <svg className="w-3.5 h-3.5 text-amber-300 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="8,1 10,6 15,8 10,10 8,15 6,10 1,8 6,6" fill="#FDE047" />
            <circle cx="8" cy="8" r="1.5" fill="#0F172A" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#E0E7FF] tracking-wider ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#7DD3FC] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#1E1B4B] text-[#BAE6FD] font-bold border border-[#0284C7] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-amber-300 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="8,1 10,6 15,8 10,10 8,15 6,10 1,8 6,6" fill="#FDE047" />
            <circle cx="8" cy="8" r="1.5" fill="#0F172A" />
          </svg>
        </div>
      );

    // ─── 12 ANIMATED NAMEPLATES ─────────────────────────────────────────────
    case 'plate-midnight-syndicate':
      // Cyberpunk underground cartel badge with sweeping crimson laser beam scanner
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border bg-[#09090B] border border-[#DC2626] shadow-[0_0_8px_rgba(220,38,38,0.4)] ${className}`}
          style={{
            clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
          }}
        >
          {/* Sweeping Red Scanning Laser Beam */}
          {canAnimate && (
            <div
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-[#EF4444]/60 to-transparent pointer-events-none"
              style={{ animation: 'koban-sweep-light 2.6s ease-in-out infinite' }}
            />
          )}
          <span className="w-2 h-2 bg-[#EF4444] rounded-xs shrink-0" />
          <span className={`font-heading font-bold text-xs text-white uppercase tracking-wider ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#F87171] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#450A0A] text-[#FCA5A5] font-black border border-[#DC2626] shrink-0 z-10">{roleBadge}</span>}
        </div>
      );

    case 'plate-cyber-samurai':
      // High-voltage cyber katana plate with pulsing cyan energy conduit & gold circuit runes
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border bg-[#030712] border-2 border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.4)] ${className}`}
          style={{
            clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%)',
          }}
        >
          {/* Cyan Energy Pulse */}
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/15 via-[#FF007A]/10 to-[#00F0FF]/15 pointer-events-none"
              style={{ animation: 'koban-pulse-glow 2.2s ease-in-out infinite' }}
            />
          )}
          <svg className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="9,1 2,9 7,9 5,15 14,7 9,7" fill="#00F0FF" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#F0FDF4] uppercase tracking-wider ${wrapCls} min-w-0 z-10 drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#67E8F9] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#082F49] text-[#22D3EE] font-black border border-[#06B6D4] shrink-0 z-10">{roleBadge}</span>}
        </div>
      );

    case 'plate-galaxy-pioneer':
      // Cosmic deep space plate with twinkling stars, swirling violet nebula dust & gold compass star
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #312E81 70%, #4C1D95 100%)',
            border: '1.5px solid #A855F7',
            clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
          }}
        >
          {/* Twinkling Star Clusters */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#FDE047] shadow-[0_0_4px_#FDE047] shrink-0"
            style={canAnimate ? { animation: 'koban-star-twinkle 2.2s ease-in-out infinite' } : undefined}
          />
          <span className={`font-heading font-bold text-xs text-white tracking-wider ${wrapCls} min-w-0 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#DDD6FE] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#581C87] text-[#E9D5FF] font-bold border border-[#9333EA] shrink-0 z-10">{roleBadge}</span>}
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_4px_#38BDF8] shrink-0"
            style={canAnimate ? { animation: 'koban-star-twinkle 2.6s ease-in-out infinite 0.8s' } : undefined}
          />
        </div>
      );

    case 'plate-electric-surge':
      // High-amperage storm plate with crackling cyan electric shockwaves & jagged capacitor edges
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#082F49] border-y-2 border-[#00F0FF] ${className}`}
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 8px) 100%, 8px 100%)',
          }}
        >
          {/* Crackling Lightning Overlay */}
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F0FF]/25 to-transparent pointer-events-none"
              style={{ animation: 'koban-lightning-flicker 1.8s steps(2, start) infinite' }}
            />
          )}
          <svg className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="9,1 3,9 8,9 6,15 14,7 9,7" fill="#00F0FF" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#F0FDFA] tracking-wide ${wrapCls} min-w-0 z-10 drop-shadow-[0_0_4px_rgba(0,240,255,0.7)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#67E8F9] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0369A1] text-white font-bold border border-[#38BDF8] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="9,1 3,9 8,9 6,15 14,7 9,7" fill="#00F0FF" />
          </svg>
        </div>
      );

    case 'plate-sakura-flutter':
      // Pearlescent rose silk banner with swallowtail notch & drifting pink cherry blossom petal SVGs
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(135deg, #831843 0%, #9D174D 50%, #BE185D 100%)',
            border: '1.5px solid #F472B6',
            clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 6px) 50%, 100% 100%, 0% 100%, 6px 50%)',
          }}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 3.4s ease-in-out infinite' } : undefined}
          >
            <path d="M8 2C10 0 14 3 13 7C11 11 8 13 8 13C8 13 5 11 3 7C2 3 6 0 8 2Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="0.8" />
          </svg>
          <span className={`font-heading font-bold text-xs text-white tracking-wide ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FBCFE8] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#500724] text-[#FCE7F3] font-bold border border-[#F472B6] shrink-0 z-10">{roleBadge}</span>}
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 4s ease-in-out infinite 1.2s' } : undefined}
          >
            <path d="M8 2C10 0 14 3 13 7C11 11 8 13 8 13C8 13 5 11 3 7C2 3 6 0 8 2Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="0.8" />
          </svg>
        </div>
      );

    case 'plate-blazing-magma':
      // Fractured volcanic basalt with pulsing glowing molten lava fissures
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#1C0A0A] border border-[#EA580C] ${className}`}
          style={{
            clipPath: 'polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)',
          }}
        >
          {/* Molten Lava Breathing Glow */}
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#DC2626]/20 via-[#F59E0B]/30 to-[#DC2626]/20 pointer-events-none"
              style={{ animation: 'koban-flame-flicker 2s ease-in-out infinite' }}
            />
          )}
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1C8 4 10 5 11 8C12 11 10 14 8 15C6 14 4 11 5 8C6 6 8 4 8 1Z" fill="#EA580C" />
            <circle cx="8" cy="10" r="2.5" fill="#FDE047" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#FFF7ED] tracking-wider ${wrapCls} min-w-0 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDBA74] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#7C2D12] text-[#FEF08A] font-bold border border-[#F97316] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1C8 4 10 5 11 8C12 11 10 14 8 15C6 14 4 11 5 8C6 6 8 4 8 1Z" fill="#EA580C" />
            <circle cx="8" cy="10" r="2.5" fill="#FDE047" />
          </svg>
        </div>
      );

    case 'plate-aurora-borealis':
      // Arctic polar night plaque with dancing emerald-indigo aurora borealis waves
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#022C22] border-x-2 border-[#10B981] ${className}`}
          style={{
            clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
          }}
        >
          {/* Animated Aurora Ribbon */}
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#10B981]/25 via-[#06B6D4]/30 to-[#8B5CF6]/25 pointer-events-none"
              style={{ animation: 'koban-aurora-wave 3.6s ease-in-out infinite' }}
            />
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] shrink-0" />
          <span className={`font-heading font-bold text-xs text-[#F0FDF4] tracking-wide ${wrapCls} min-w-0 z-10`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#A7F3D0] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#064E3B] text-[#A7F3D0] font-bold border border-[#059669] shrink-0 z-10">{roleBadge}</span>}
          <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] shrink-0" />
        </div>
      );

    case 'plate-neon-pulse':
      // Cyberpunk dual neon conduit wireframe (magenta & cyan) with pulsing grid radiance
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#180828] border-2 border-[#FF007A] ${className}`}
          style={{
            borderRadius: '4px',
            boxShadow: '0 0 10px rgba(255,0,122,0.4)',
          }}
        >
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#FF007A]/15 via-[#00F0FF]/15 to-[#FF007A]/15 pointer-events-none"
              style={{ animation: 'koban-pulse-glow 2.4s ease-in-out infinite' }}
            />
          )}
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF] shrink-0" />
          <span className={`font-heading font-bold text-xs text-white uppercase tracking-wider ${wrapCls} min-w-0 z-10 drop-shadow-[0_0_4px_rgba(255,0,122,0.8)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#F472B6] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#500724] text-[#F9A8D4] font-bold border border-[#DB2777] shrink-0 z-10">{roleBadge}</span>}
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF] shrink-0" />
        </div>
      );

    case 'plate-thunder-striker':
      // Raijin storm striker plate with jagged thunderbolt edges and high-voltage gold sparks
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#1C1917] border-2 border-[#EAB308] ${className}`}
          style={{
            clipPath: 'polygon(6px 0%, calc(100% - 14px) 0%, calc(100% - 6px) 35%, 100% 35%, calc(100% - 8px) 100%, 8px 100%, 0% 65%, 6px 65%)',
          }}
        >
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FDE047]/30 to-transparent pointer-events-none"
              style={{ animation: 'koban-lightning-flicker 2s steps(2, start) infinite' }}
            />
          )}
          <svg className="w-3.5 h-3.5 text-[#FDE047] shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="9,1 3,9 8,9 6,15 14,7 9,7" fill="#FDE047" />
          </svg>
          <span className={`font-heading font-bold text-xs text-white tracking-wider ${wrapCls} min-w-0 z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE047] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#713F12] text-[#FEF08A] font-bold border border-[#CA8A04] shrink-0 z-10">{roleBadge}</span>}
          <svg className="w-3.5 h-3.5 text-[#FDE047] shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="9,1 3,9 8,9 6,15 14,7 9,7" fill="#FDE047" />
          </svg>
        </div>
      );

    case 'plate-void-phantom':
      // Ethereal shadow realm seal with amethyst void smoke and torn dimensional edges
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#1E1B4B] border border-[#9333EA] ${className}`}
          style={{
            clipPath: 'polygon(0% 4px, 4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px))',
          }}
        >
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#7E22CE]/20 via-[#C084FC]/25 to-[#7E22CE]/20 pointer-events-none"
              style={{ animation: 'koban-pulse-glow 2.8s ease-in-out infinite' }}
            />
          )}
          <span className="text-xs text-[#C084FC] shrink-0">🔮</span>
          <span className={`font-heading font-bold text-xs text-[#FAF5FF] tracking-wide ${wrapCls} min-w-0 z-10 drop-shadow-[0_0_5px_rgba(147,51,234,0.7)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#D8B4FE] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#581C87] text-[#F3E8FF] font-bold border border-[#A855F7] shrink-0 z-10">{roleBadge}</span>}
          <span className="text-xs text-[#C084FC] shrink-0">🔮</span>
        </div>
      );

    case 'plate-solar-flare':
      // Blazing solar prominence plate with golden plasma flares curling along the edges & pulsing fire glow
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#431407] border-y-2 border-[#F97316] ${className}`}
          style={{
            clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)',
          }}
        >
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#EA580C]/25 via-[#FDE047]/30 to-[#EA580C]/25 pointer-events-none"
              style={{ animation: 'koban-flame-flicker 2.2s ease-in-out infinite' }}
            />
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-[#FEF08A] shadow-[0_0_4px_#FDE047] shrink-0" />
          <span className={`font-heading font-bold text-xs text-[#FFF7ED] tracking-wider ${wrapCls} min-w-0 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#FED7AA] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#7C2D12] text-[#FEF08A] font-bold border border-[#F59E0B] shrink-0 z-10">{roleBadge}</span>}
          <span className="w-1.5 h-1.5 rounded-full bg-[#FEF08A] shadow-[0_0_4px_#FDE047] shrink-0" />
        </div>
      );

    case 'plate-bioluminescent-abyss':
      // Mariana trench abyssal plate with glowing cyan anglerfish bioluminescence & deep ocean current
      return (
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#02182B] border border-[#00F0FF] ${className}`}
          style={{
            borderRadius: '16px 2px 16px 2px',
            boxShadow: '0 0 10px rgba(0,240,255,0.3)',
          }}
        >
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/15 via-[#3B82F6]/20 to-[#00F0FF]/15 pointer-events-none"
              style={{ animation: 'koban-water-ripple 3.2s ease-in-out infinite' }}
            />
          )}
          <span
            className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF] shrink-0"
            style={canAnimate ? { animation: 'koban-pulse-glow 2s ease-in-out infinite' } : undefined}
          />
          <span className={`font-heading font-bold text-xs text-[#E0F2FE] tracking-wide ${wrapCls} min-w-0 z-10 drop-shadow-[0_0_4px_rgba(0,240,255,0.7)]`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[#7DD3FC] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0C4A6E] text-[#67E8F9] font-bold border border-[#0284C7] shrink-0 z-10">{roleBadge}</span>}
          <span
            className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF] shrink-0"
            style={canAnimate ? { animation: 'koban-pulse-glow 2s ease-in-out infinite 1s' } : undefined}
          />
        </div>
      );

    // ─── 5 NEW PREMIUM NAMEPLATES ───────────────────────────────────────────
    case 'plate-dragon-lord':
      return (
        <div
          className={`relative inline-flex items-center justify-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(125deg, #2A0408 0%, #7F1D1D 45%, #B91C1C 75%, #450A0A 100%)',
            border: '1.5px solid #F59E0B',
            clipPath: 'polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)',
            boxShadow: '0 0 12px rgba(220,38,38,0.45)',
          }}
        >
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FEF08A]/30 to-transparent pointer-events-none"
              style={{ animation: 'koban-sweep-light 2.5s ease-in-out infinite' }}
            />
          )}
          <svg className="w-3.5 h-3.5 shrink-0 z-10" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 14,5 12,14 8,11 4,14 2,5" fill="#FDE047" stroke="#78350F" strokeWidth="1" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#FEF9C3] tracking-wider ${wrapCls} min-w-0 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]`}>
            {name}
          </span>
          {shortId && <span className="font-mono text-[10px] text-[#FDE68A] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#450A0A] text-[#FEF08A] font-bold border border-[#F59E0B] shrink-0 z-10">
              {roleBadge}
            </span>
          )}
          <svg className="w-3.5 h-3.5 shrink-0 z-10" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 14,5 12,14 8,11 4,14 2,5" fill="#FDE047" stroke="#78350F" strokeWidth="1" />
          </svg>
        </div>
      );

    case 'plate-shinobi-shadow':
      return (
        <div
          className={`relative inline-flex items-center justify-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#0F0720] border border-[#A855F7] ${className}`}
          style={{
            clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
          }}
        >
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#581C87]/25 via-[#C084FC]/30 to-[#581C87]/25 pointer-events-none"
              style={{ animation: 'koban-pulse-glow 2.4s ease-in-out infinite' }}
            />
          )}
          <svg className="w-3.5 h-3.5 shrink-0 z-10" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 10,6 15,8 10,10 8,15 6,10 1,8 6,6" fill="#C084FC" />
            <circle cx="8" cy="8" r="2" fill="#0F0720" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#F3E8FF] tracking-wider ${wrapCls} min-w-0 z-10`}>
            {name}
          </span>
          {shortId && <span className="font-mono text-[10px] text-[#D8B4FE] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#3B0764] text-[#E9D5FF] font-bold border border-[#A855F7] shrink-0 z-10">
              {roleBadge}
            </span>
          )}
          <svg className="w-3.5 h-3.5 shrink-0 z-10" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 10,6 15,8 10,10 8,15 6,10 1,8 6,6" fill="#C084FC" />
            <circle cx="8" cy="8" r="2" fill="#0F0720" />
          </svg>
        </div>
      );

    case 'plate-neon-ronin':
      return (
        <div
          className={`relative inline-flex items-center justify-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#060B19] border-y-2 border-[#00F0FF] ${className}`}
          style={{
            clipPath: 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 10px, 100% 100%, 10px 100%, 0% calc(100% - 10px))',
            boxShadow: '0 0 10px rgba(0,240,255,0.35)',
          }}
        >
          {canAnimate && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/15 via-[#FF007A]/25 to-[#00F0FF]/15 pointer-events-none"
              style={{ animation: 'koban-pulse-glow 2s ease-in-out infinite' }}
            />
          )}
          <span className="w-2 h-2 rotate-45 bg-[#FF007A] shadow-[0_0_6px_#FF007A] shrink-0 z-10" />
          <span className={`font-heading font-bold text-xs text-[#ECFEFF] uppercase tracking-wider ${wrapCls} min-w-0 z-10`}>
            {name}
          </span>
          {shortId && <span className="font-mono text-[10px] text-[#67E8F9] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#083344] text-[#67E8F9] font-bold border border-[#00F0FF] shrink-0 z-10">
              {roleBadge}
            </span>
          )}
          <span className="w-2 h-2 rotate-45 bg-[#00F0FF] shadow-[0_0_6px_#00F0FF] shrink-0 z-10" />
        </div>
      );

    case 'plate-imperial-jade':
      return (
        <div
          className={`relative inline-flex items-center justify-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md ${className}`}
          style={{
            background: 'linear-gradient(135deg, #022C22 0%, #065F46 50%, #047857 100%)',
            border: '1.5px solid #FDE047',
            borderRadius: '6px',
          }}
        >
          <svg className="w-3.5 h-3.5 shrink-0 z-10" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="#FDE047" strokeWidth="1.5" fill="#047857" />
            <circle cx="8" cy="8" r="2.5" fill="#FEF08A" />
          </svg>
          <span className={`font-heading font-bold text-xs text-[#ECFDF5] tracking-wider ${wrapCls} min-w-0 z-10`}>
            {name}
          </span>
          {shortId && <span className="font-mono text-[10px] text-[#A7F3D0] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#022C22] text-[#FDE047] font-bold border border-[#F59E0B] shrink-0 z-10">
              {roleBadge}
            </span>
          )}
          <svg className="w-3.5 h-3.5 shrink-0 z-10" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="#FDE047" strokeWidth="1.5" fill="#047857" />
            <circle cx="8" cy="8" r="2.5" fill="#FEF08A" />
          </svg>
        </div>
      );

    case 'plate-blood-moon-scroll':
      return (
        <div
          className={`relative inline-flex items-center justify-center gap-2 px-4 py-1.5 max-w-full overflow-hidden select-none box-border shadow-md bg-[#18090D] border-y-2 border-[#DC2626] ${className}`}
        >
          <div className="w-2 h-5 bg-[#7F1D1D] rounded-xs border-y border-[#FCA5A5] shrink-0" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shrink-0" />
          <span className={`font-heading font-bold text-xs text-[#FFE4E6] tracking-wider ${wrapCls} min-w-0 z-10`}>
            {name}
          </span>
          {shortId && <span className="font-mono text-[10px] text-[#FDA4AF] shrink-0 z-10">#{shortId}</span>}
          {roleBadge && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#450A0A] text-[#FECDD3] font-bold border border-[#EF4444] shrink-0 z-10">
              {roleBadge}
            </span>
          )}
          <div className="w-2 h-5 bg-[#7F1D1D] rounded-xs border-y border-[#FCA5A5] shrink-0" />
        </div>
      );

    default:
      return (
        <div className={`relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-md max-w-full overflow-hidden select-none box-border bg-[var(--surface-2)] border border-[var(--border)] shadow-sm ${className}`}>
          <span className={`font-heading font-semibold text-xs text-[var(--text)] ${wrapCls} min-w-0`}>{name}</span>
          {shortId && <span className="font-mono text-[10px] text-[var(--muted)] shrink-0">#{shortId}</span>}
          {roleBadge && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[var(--surface-hover)] text-[var(--text)] font-bold shrink-0">{roleBadge}</span>}
        </div>
      );
  }
};
