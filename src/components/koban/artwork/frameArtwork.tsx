import React from 'react';

interface FrameProps {
  itemId: string;
  size?: number;
  canAnimate?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * 25 AVATAR FRAMES (13 Static, 12 Animated)
 * Static items have ZERO movement or shimmer anywhere.
 * Animated items animate using transform and opacity only.
 */
export const FrameRenderer: React.FC<FrameProps> = ({
  itemId,
  size = 56,
  canAnimate = false,
  children,
  className = '',
}) => {
  const innerContent = (
    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-1 relative z-10">
      {children}
    </div>
  );

  switch (itemId) {
    // ─── 13 STATIC FRAMES ──────────────────────────────────────────────────
    case 'frame-bronze-ronin':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#B8740A] shadow-[0_0_3px_rgba(184,116,10,0.4)] pointer-events-none z-20" />
          <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E8A317] border border-[#78350F] z-20 pointer-events-none" />
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E8A317] border border-[#78350F] z-20 pointer-events-none" />
          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#E8A317] border border-[#78350F] z-20 pointer-events-none" />
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#E8A317] border border-[#78350F] z-20 pointer-events-none" />
          {innerContent}
        </div>
      );

    case 'frame-carved-obsidian':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-[3px] border-[#0F172A] shadow-[inset_0_0_4px_#334155] pointer-events-none z-20" />
          <div className="absolute -inset-0.5 rounded-full border border-[#475569]/40 pointer-events-none z-20" />
          {innerContent}
        </div>
      );

    case 'frame-bamboo-weave':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#15803D] pointer-events-none z-20" />
          <div className="absolute inset-0.5 rounded-full border border-dashed border-[#86EFAC] pointer-events-none z-20 opacity-70" />
          {innerContent}
        </div>
      );

    case 'frame-jade-border':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-[3px] border-[#059669] shadow-[0_0_4px_rgba(5,150,105,0.4)] pointer-events-none z-20" />
          <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-1 bg-[#F59E0B] rounded-sm z-20" />
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-1 bg-[#F59E0B] rounded-sm z-20" />
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-[#F59E0B] rounded-sm z-20" />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-[#F59E0B] rounded-sm z-20" />
          {innerContent}
        </div>
      );

    case 'frame-lacquered-mahogany':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-[3px] border-[#991B1B] shadow-[inset_0_1px_2px_#F87171] pointer-events-none z-20" />
          <div className="absolute -inset-0.5 rounded-full border border-[#000000] pointer-events-none z-20" />
          {innerContent}
        </div>
      );

    case 'frame-iron-shuriken':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#475569] pointer-events-none z-20" />
          <polygon points={`${size / 2},1 ${size / 2 - 2},4 ${size / 2 + 2},4`} fill="#94A3B8" className="absolute z-20" />
          <polygon points={`${size / 2},${size - 1} ${size / 2 - 2},${size - 4} ${size / 2 + 2},${size - 4}`} fill="#94A3B8" className="absolute z-20" />
          <polygon points={`1,${size / 2} 4,${size / 2 - 2} 4,${size / 2 + 2}`} fill="#94A3B8" className="absolute z-20" />
          <polygon points={`${size - 1},${size / 2} ${size - 4},${size / 2 - 2} ${size - 4},${size / 2 + 2}`} fill="#94A3B8" className="absolute z-20" />
          {innerContent}
        </div>
      );

    case 'frame-talisman-seal':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#D97706] pointer-events-none z-20" />
          <div className="absolute -top-1 left-2 w-2 h-3.5 bg-[#FEF3C7] border border-[#B45309] rounded-xs z-20" />
          <div className="absolute -bottom-1 right-2 w-2 h-3.5 bg-[#FEF3C7] border border-[#B45309] rounded-xs z-20" />
          {innerContent}
        </div>
      );

    case 'frame-kintsugi-gold':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#18181B] pointer-events-none z-20" />
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 56 56" fill="none">
            <path d="M28 2L30 8L25 14L32 20" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M54 28L48 30L44 26L38 32" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-stone-torii':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#64748B] pointer-events-none z-20" />
          <div className="absolute -top-1 inset-x-2 h-1.5 bg-[#475569] rounded-xs z-20" />
          {innerContent}
        </div>
      );

    case 'frame-forged-steel':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-[2.5px] border-[#94A3B8] shadow-[0_0_2px_#FFFFFF] pointer-events-none z-20" />
          <div className="absolute inset-1 rounded-full border border-dotted border-[#475569] pointer-events-none z-20" />
          {innerContent}
        </div>
      );

    case 'frame-cherry-bark':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-[3px] border-[#78350F] pointer-events-none z-20" />
          <div className="absolute inset-0.5 rounded-full border border-[#D97706]/40 pointer-events-none z-20" />
          {innerContent}
        </div>
      );

    case 'frame-midnight-titanium':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-[2.5px] border-[#334155] shadow-[0_0_3px_#0F172A] pointer-events-none z-20" />
          <div className="absolute -inset-0.5 rounded-full border border-[#1E293B] pointer-events-none z-20" />
          {innerContent}
        </div>
      );

    case 'frame-ivory-lotus':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#E2E8F0] shadow-[0_0_3px_rgba(255,255,255,0.4)] pointer-events-none z-20" />
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] pointer-events-none z-20">🪷</span>
          {innerContent}
        </div>
      );

    // ─── 12 ANIMATED FRAMES ────────────────────────────────────────────────
    case 'frame-neon-cyber':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className={`absolute inset-0 rounded-full border-2 border-[#00F0FF] shadow-[0_0_8px_#00F0FF] pointer-events-none z-20 ${canAnimate ? 'animate-pulse' : ''}`} />
          <div className="absolute -inset-0.5 rounded-full border border-[#FF007A] opacity-75 pointer-events-none z-20" />
          {innerContent}
        </div>
      );

    case 'frame-crimson-flame':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute inset-0 rounded-full border-2 border-[#D71920] shadow-[0_0_10px_#D71920] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-flame-flicker 2s infinite ease-in-out' } : undefined}
          />
          {innerContent}
        </div>
      );

    case 'frame-sakura-blossom':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#FF94B8] shadow-[0_0_6px_rgba(255,148,184,0.6)] pointer-events-none z-20" />
          <span className={`absolute -top-1 right-1 text-[#FFB6C1] text-[10px] pointer-events-none z-20 ${canAnimate ? 'animate-bounce' : ''}`}>🌸</span>
          <span className="absolute -bottom-0.5 left-0 text-[#FF94B8] text-[9px] pointer-events-none z-20">🌸</span>
          {innerContent}
        </div>
      );

    case 'frame-void-shinobi':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#9333EA] shadow-[0_0_10px_#7E22CE] pointer-events-none z-20" />
          <div className={`absolute -inset-1 rounded-full bg-radial from-transparent via-[#581C87]/20 to-[#3B0764]/40 pointer-events-none z-0 ${canAnimate ? 'animate-pulse' : ''}`} />
          {innerContent}
        </div>
      );

    case 'frame-imperial-laurel':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className={`absolute inset-0 rounded-full border-2 border-[#FFD700] shadow-[0_0_12px_#F59E0B] pointer-events-none z-20 ${canAnimate ? 'animate-pulse' : ''}`} />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
            <svg width="22" height="14" viewBox="0 0 24 16" fill="none">
              <path d="M2 14L4 4L9 8L12 2L15 8L20 4L22 14H2Z" fill="#FFD700" stroke="#B8740A" strokeWidth="1" />
              <circle cx="12" cy="7" r="2" fill="#D71920" />
            </svg>
          </div>
          {innerContent}
        </div>
      );

    case 'frame-thunder-arc':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#0284C7] pointer-events-none z-20" />
          <svg className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${canAnimate ? 'animate-pulse' : ''}`} viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="6 8" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-celestial-orbit':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#F59E0B] pointer-events-none z-20" />
          <div className={`absolute inset-0 pointer-events-none z-20 ${canAnimate ? 'origin-center animate-[spin_6s_linear_infinite]' : ''}`}>
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FDE047] shadow-[0_0_4px_#FDE047]" />
          </div>
          {innerContent}
        </div>
      );

    case 'frame-aurora-pulse':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className={`absolute inset-0 rounded-full border-2 border-[#10B981] shadow-[0_0_8px_#10B981] pointer-events-none z-20 ${canAnimate ? 'animate-pulse' : ''}`} />
          <div className="absolute -inset-0.5 rounded-full border border-[#8B5CF6]/50 pointer-events-none z-20" />
          {innerContent}
        </div>
      );

    case 'frame-demon-fire':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#EF4444] shadow-[0_0_10px_#B91C1C] pointer-events-none z-20" />
          <div className={`absolute -top-2 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none z-20 ${canAnimate ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : ''}`}>
            <polygon points="0,0 2,6 -2,6" fill="#EF4444" />
            <polygon points="0,0 2,6 -2,6" fill="#EF4444" />
          </div>
          {innerContent}
        </div>
      );

    case 'frame-quantum-circuit':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#10B981] pointer-events-none z-20" />
          <div className={`absolute inset-0 pointer-events-none z-20 ${canAnimate ? 'animate-pulse' : ''}`}>
            <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#34D399]" />
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#34D399]" />
          </div>
          {innerContent}
        </div>
      );

    case 'frame-deepsea-vortex':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#0284C7] shadow-[0_0_8px_#0284C7] pointer-events-none z-20" />
          <svg className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${canAnimate ? 'origin-center animate-[spin_8s_linear_infinite]' : ''}`} viewBox="0 0 56 56" fill="none">
            <path d="M28 2C42.3594 2 54 13.6406 54 28" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 54C13.6406 54 2 42.3594 2 28" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-solar-corona':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className={`absolute inset-0 rounded-full border-2 border-[#F59E0B] shadow-[0_0_12px_#EA580C] pointer-events-none z-20 ${canAnimate ? 'animate-pulse' : ''}`} />
          <div className="absolute -inset-1 rounded-full border border-[#FDE047]/40 pointer-events-none z-20" />
          {innerContent}
        </div>
      );

    default:
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          {innerContent}
        </div>
      );
  }
};
