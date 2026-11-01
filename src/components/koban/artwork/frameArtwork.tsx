import React, { useEffect, useMemo, useRef } from 'react';
import { StoreFxCanvas } from '../fx/StoreFxCanvas';
import {
  COLOR_RAMPS,
  ParticleShape,
  storeFxScheduler,
  type EmitterConfig,
  type LightningConfig,
} from '../fx/storeFxEngine';

interface FrameProps {
  itemId: string;
  size?: number;
  canAnimate?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Shared single-rAF controller hook for the 5 new premium frames:
 * drives outer ring rotation, inner counter-rotation, stroke-dashoffset energy flow, and glow pulse.
 */
function useFrameMotionRefs(
  canAnimate: boolean,
  cwSpeed = 24,
  ccwSpeed = 18,
  dashSpeed = 32
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cwGroupRef = useRef<SVGGElement>(null);
  const ccwGroupRef = useRef<SVGGElement>(null);
  const energyPathRef = useRef<SVGGeometryElement>(null);
  const pulseGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const apply = (elapsed: number) => {
      const cw = (elapsed * cwSpeed) % 360;
      const ccw = -(elapsed * ccwSpeed) % 360;
      const dash = -(elapsed * dashSpeed);
      const pulse = 0.68 + 0.32 * (0.5 + 0.5 * Math.sin(elapsed * 3.1));

      if (cwGroupRef.current) {
        cwGroupRef.current.setAttribute('transform', `rotate(${cw.toFixed(2)} 50 50)`);
      }
      if (ccwGroupRef.current) {
        ccwGroupRef.current.setAttribute('transform', `rotate(${ccw.toFixed(2)} 50 50)`);
      }
      if (energyPathRef.current) {
        energyPathRef.current.style.strokeDashoffset = `${dash.toFixed(2)}`;
      }
      if (pulseGroupRef.current) {
        pulseGroupRef.current.style.opacity = pulse.toFixed(3);
      }
    };

    return storeFxScheduler.register({
      element: el,
      canAnimate,
      onFrame: (_dt, elapsed) => apply(elapsed),
      onStaticFrame: () => apply(1.5),
    });
  }, [canAnimate, cwSpeed, ccwSpeed, dashSpeed]);

  return { stageRef, cwGroupRef, ccwGroupRef, energyPathRef, pulseGroupRef };
}

/**
 * 25 AVATAR FRAMES (13 Static, 12 Animated)
 * Static items have ZERO movement or shimmer anywhere.
 * Animated items animate using transform and opacity only.
 */
const LEGACY_FRAME_ID_ALIASES: Record<string, string> = {
  frame_torii_gate: 'frame-stone-torii',
  'frame-torii-gate': 'frame-stone-torii',
  frame_hanko_seal: 'frame-talisman-seal',
  frame_sakura_ring: 'frame-sakura-blossom',
  frame_neon_katana: 'frame-neon-cyber',
  frame_ronin_crest: 'frame-bronze-ronin',
  frame_shogun_gold: 'frame-imperial-laurel',
  frame_celestial_dragon: 'frame-celestial-orbit',
};

export const FrameRenderer: React.FC<FrameProps> = ({
  itemId,
  size = 56,
  canAnimate = true,
  children,
  className = '',
}) => {
  const normalizedItemId = LEGACY_FRAME_ID_ALIASES[itemId] || itemId;
  const innerSize = Math.max(16, Math.round(size * 0.66));
  const innerContent = (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center relative z-10 shrink-0 [&>*]:!w-full [&>*]:!h-full [&>*]:!max-w-full [&>*]:!max-h-full [&>*]:!rounded-full"
      style={{ width: innerSize, height: innerSize }}
    >
      {children}
    </div>
  );

  switch (normalizedItemId) {
    // ─── BATCH 1: 8 STATIC FRAMES (Items 1-8) ──────────────────────────────
    case 'frame-bronze-ronin':
      // Hammered bronze octagon with dual katana tsuba discs, brass studs and aged verdigris bevel
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="br-oct" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="50%" stopColor="#78350F" />
                <stop offset="100%" stopColor="#451A03" />
              </linearGradient>
              <linearGradient id="br-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            {/* Outer Beveled Octagon Ring */}
            <polygon points="30,8 70,8 92,30 92,70 70,92 30,92 8,70 8,30" stroke="url(#br-oct)" strokeWidth="6" fill="none" strokeLinejoin="round" />
            <polygon points="31,10 69,10 90,31 90,69 69,90 31,90 10,69 10,31" stroke="#292524" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            {/* Inner Ring Seal */}
            <circle cx="50" cy="50" r="39" stroke="#92400E" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="37.5" stroke="#FBBF24" strokeWidth="1" strokeDasharray="3 4" opacity="0.8" />
            {/* Tsuba Sword Guards at 9 and 3 o'clock */}
            <rect x="0" y="44" width="10" height="12" rx="2" fill="url(#br-gold)" stroke="#451A03" strokeWidth="1" />
            <rect x="90" y="44" width="10" height="12" rx="2" fill="url(#br-gold)" stroke="#451A03" strokeWidth="1" />
            {/* Octagon Corner Brass Rivets */}
            <circle cx="30" cy="8" r="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="0.8" />
            <circle cx="70" cy="8" r="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="0.8" />
            <circle cx="92" cy="30" r="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="0.8" />
            <circle cx="92" cy="70" r="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="0.8" />
            <circle cx="70" cy="92" r="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="0.8" />
            <circle cx="30" cy="92" r="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="0.8" />
            <circle cx="8" cy="70" r="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="0.8" />
            <circle cx="8" cy="30" r="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="0.8" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-carved-obsidian':
      // Volcanic razor obsidian shards with violet prismatic facet cuts
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="obs-facet" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4C1D95" />
                <stop offset="45%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#090514" />
              </linearGradient>
            </defs>
            {/* Outer Shard Silhouette */}
            <polygon points="50,-4 65,12 88,4 82,28 104,45 86,60 98,82 72,78 62,102 48,84 28,100 34,76 4,78 18,52 -2,38 20,24 10,4 36,14" fill="url(#obs-facet)" stroke="#7C3AED" strokeWidth="1.2" strokeLinejoin="miter" />
            {/* Prismatic Chiseled Facets */}
            <path d="M50,-4L50,15L65,12L82,28L68,34L86,60L65,58L62,102L48,84L50,68L28,100L38,72L4,78L24,56L-2,38L22,40L10,4L34,22L50,15Z" stroke="#A78BFA" strokeWidth="0.8" opacity="0.6" />
            <circle cx="50" cy="50" r="38" stroke="#1E1B4B" strokeWidth="3" />
            <circle cx="50" cy="50" r="37" stroke="#6D28D9" strokeWidth="1" strokeDasharray="6 3" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-bamboo-weave':
      // Split green bamboo stalks bound by hemp cord with fresh spring leaf shoots
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            {/* Quad Curved Bamboo Segments */}
            <circle cx="50" cy="50" r="41" stroke="#14532D" strokeWidth="7" strokeLinecap="round" />
            <circle cx="50" cy="50" r="41" stroke="#22C55E" strokeWidth="4.5" strokeDasharray="22 5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="41" stroke="#86EFAC" strokeWidth="1.5" strokeDasharray="22 5" strokeLinecap="round" opacity="0.7" />
            {/* Four Coiled Hemp Binding Knots */}
            <rect x="47" y="4" width="6" height="10" rx="1" fill="#78350F" stroke="#FEF3C7" strokeWidth="0.8" />
            <rect x="47" y="86" width="6" height="10" rx="1" fill="#78350F" stroke="#FEF3C7" strokeWidth="0.8" />
            <rect x="4" y="47" width="10" height="6" rx="1" fill="#78350F" stroke="#FEF3C7" strokeWidth="0.8" />
            <rect x="86" y="47" width="10" height="6" rx="1" fill="#78350F" stroke="#FEF3C7" strokeWidth="0.8" />
            {/* Sprouting Bamboo Leaves at Top Right */}
            <path d="M78 18C86 10 98 12 102 18C96 24 84 22 78 18Z" fill="#15803D" stroke="#4ADE80" strokeWidth="1" />
            <path d="M82 24C92 20 100 28 98 35C90 32 84 28 82 24Z" fill="#16A34A" stroke="#86EFAC" strokeWidth="1" />
            {/* Inner Ring */}
            <circle cx="50" cy="50" r="37.5" stroke="#166534" strokeWidth="1.5" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-jade-border':
      // Imperial nephrite jade torus with 4 engraved gold beast-claw clasps and pearl beads
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="jade-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="40%" stopColor="#059669" />
                <stop offset="85%" stopColor="#065F46" />
                <stop offset="100%" stopColor="#022C22" />
              </linearGradient>
              <linearGradient id="jade-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            {/* Heavy Polished Jade Ring */}
            <circle cx="50" cy="50" r="41" stroke="url(#jade-grad)" strokeWidth="6.5" />
            <circle cx="50" cy="50" r="43.5" stroke="#6EE7B7" strokeWidth="0.8" opacity="0.6" />
            <circle cx="50" cy="50" r="38" stroke="#064E3B" strokeWidth="1.2" />
            {/* 4 Imperial Golden Dragon Claw Clasps */}
            <g transform="translate(44, 2)">
              <rect width="12" height="9" rx="2" fill="url(#jade-gold)" stroke="#78350F" strokeWidth="1" />
              <circle cx="6" cy="4.5" r="2" fill="#DC2626" />
            </g>
            <g transform="translate(44, 89)">
              <rect width="12" height="9" rx="2" fill="url(#jade-gold)" stroke="#78350F" strokeWidth="1" />
              <circle cx="6" cy="4.5" r="2" fill="#DC2626" />
            </g>
            <g transform="translate(2, 44)">
              <rect width="9" height="12" rx="2" fill="url(#jade-gold)" stroke="#78350F" strokeWidth="1" />
              <circle cx="4.5" cy="6" r="2" fill="#DC2626" />
            </g>
            <g transform="translate(89, 44)">
              <rect width="9" height="12" rx="2" fill="url(#jade-gold)" stroke="#78350F" strokeWidth="1" />
              <circle cx="4.5" cy="6" r="2" fill="#DC2626" />
            </g>
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-lacquered-mahogany':
      // Japanese Urushi black-crimson lacquer with maki-e gold crane crescent crest
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="urushi-wood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#450A0A" />
                <stop offset="50%" stopColor="#7F1D1D" />
                <stop offset="100%" stopColor="#180507" />
              </linearGradient>
            </defs>
            {/* Broad Lacquered Wooden Rim */}
            <circle cx="50" cy="50" r="41" stroke="url(#urushi-wood)" strokeWidth="7" />
            <circle cx="50" cy="50" r="44.2" stroke="#DC2626" strokeWidth="1" opacity="0.8" />
            <circle cx="50" cy="50" r="37.8" stroke="#1C1917" strokeWidth="2" />
            {/* Top Maki-e Gold Crescent & Cloud Plume */}
            <path d="M35 12C45 4 55 4 65 12C57 10 43 10 35 12Z" fill="#FBBF24" stroke="#78350F" strokeWidth="0.8" />
            <circle cx="50" cy="8" r="3.5" fill="#DC2626" stroke="#FDE68A" strokeWidth="1" />
            {/* Bottom Lacquered Crest Pedestal */}
            <path d="M38 88L44 94H56L62 88C56 90 44 90 38 88Z" fill="#991B1B" stroke="#F59E0B" strokeWidth="1" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-iron-shuriken':
      // Dark cast-iron ninja frame with 4 massive angled fuma-shuriken throwing blades
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="steel-blade" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
            </defs>
            {/* 4 Curved Shuriken Blades protruding outward */}
            {/* Top Blade */}
            <path d="M50 8L57 -6L43 6L50 8Z" fill="url(#steel-blade)" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Right Blade */}
            <path d="M92 50L106 57L94 43L92 50Z" fill="url(#steel-blade)" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Bottom Blade */}
            <path d="M50 92L43 106L57 94L50 92Z" fill="url(#steel-blade)" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Left Blade */}
            <path d="M8 50L-6 43L6 57L8 50Z" fill="url(#steel-blade)" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Heavy Iron Ring Core */}
            <circle cx="50" cy="50" r="41" stroke="#334155" strokeWidth="6" />
            <circle cx="50" cy="50" r="44" stroke="#64748B" strokeWidth="1.2" />
            <circle cx="50" cy="50" r="38" stroke="#0F172A" strokeWidth="2" />
            {/* 4 Center Steel Rivets */}
            <circle cx="50" cy="14" r="2.5" fill="#E2E8F0" stroke="#1E293B" strokeWidth="1" />
            <circle cx="86" cy="50" r="2.5" fill="#E2E8F0" stroke="#1E293B" strokeWidth="1" />
            <circle cx="50" cy="86" r="2.5" fill="#E2E8F0" stroke="#1E293B" strokeWidth="1" />
            <circle cx="14" cy="50" r="2.5" fill="#E2E8F0" stroke="#1E293B" strokeWidth="1" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-talisman-seal':
      // Twisted sacred Shimenawa rope with vermilion ofuda warding paper charms & zigzag shide
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            {/* Twisted Straw Shimenawa Rope Ring */}
            <circle cx="50" cy="50" r="41" stroke="#78350F" strokeWidth="6.5" strokeDasharray="9 4" />
            <circle cx="50" cy="50" r="41" stroke="#D97706" strokeWidth="4" strokeDasharray="9 4" />
            <circle cx="50" cy="50" r="38" stroke="#451A03" strokeWidth="1.5" />
            {/* Top Left Warding Ofuda Talisman */}
            <g transform="translate(6, 4) rotate(-22)">
              <rect width="14" height="22" rx="2" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.2" />
              <rect x="2" y="3" width="10" height="4" fill="#DC2626" />
              <line x1="7" y1="9" x2="7" y2="19" stroke="#991B1B" strokeWidth="1.5" strokeDasharray="2 1" />
            </g>
            {/* Bottom Right Warding Ofuda Talisman */}
            <g transform="translate(82, 70) rotate(24)">
              <rect width="14" height="22" rx="2" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.2" />
              <rect x="2" y="3" width="10" height="4" fill="#DC2626" />
              <line x1="7" y1="9" x2="7" y2="19" stroke="#991B1B" strokeWidth="1.5" strokeDasharray="2 1" />
            </g>
            {/* Zigzag Paper Shide Tassels at Bottom */}
            <polygon points="46,88 52,94 48,99 54,103 48,105 44,98 48,94" fill="#FFFFFF" stroke="#D97706" strokeWidth="0.8" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-kintsugi-gold':
      // Matte charcoal ceramic with bold branching fractures filled with molten 24k gold leaf
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="kg-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            {/* Matte Charcoal Ceramic Ring */}
            <circle cx="50" cy="50" r="41" stroke="#27272A" strokeWidth="6.5" />
            <circle cx="50" cy="50" r="44.2" stroke="#3F3F46" strokeWidth="1" />
            <circle cx="50" cy="50" r="37.8" stroke="#18181B" strokeWidth="1.5" />
            {/* Kintsugi Gold Veins across Ceramic */}
            <path d="M50 9L48 18L56 24L52 38" stroke="url(#kg-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M56 24L64 26L70 20" stroke="url(#kg-gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M91 50L82 48L78 58L68 56" stroke="url(#kg-gold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M50 91L54 82L46 76L52 64" stroke="url(#kg-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 50L18 52L22 44L32 46" stroke="url(#kg-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Gold Splatters/Droplets at Fracture Junctions */}
            <circle cx="56" cy="24" r="2.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
            <circle cx="78" cy="58" r="2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
            <circle cx="54" cy="82" r="2.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
            <circle cx="22" cy="44" r="2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
          </svg>
          {innerContent}
        </div>
      );

    // ─── BATCH 2: 5 STATIC + 3 ANIMATED FRAMES (Items 9-16) ───────────────
    case 'frame-stone-torii':
      // Weathered mossy granite shrine Torii gate with kasagi lintel, pillars and stone lanterns
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="torii-stone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
            </defs>
            {/* Chiseled Stone Base Ring */}
            <circle cx="50" cy="50" r="41" stroke="url(#torii-stone)" strokeWidth="6" />
            <circle cx="50" cy="50" r="44" stroke="#64748B" strokeWidth="1" />
            <circle cx="50" cy="50" r="38" stroke="#0F172A" strokeWidth="1.5" />
            {/* Massive Curved Top Kasagi Torii Roof Beam */}
            <path d="M12 12C36 4 64 4 88 12L85 18C63 12 37 12 15 18Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.2" />
            <rect x="22" y="18" width="56" height="4" fill="#991B1B" stroke="#450A0A" strokeWidth="0.8" />
            {/* Left and Right Torii Pillars */}
            <rect x="18" y="18" width="7" height="66" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1" />
            <rect x="75" y="18" width="7" height="66" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1" />
            {/* Granite Pillar Bases */}
            <rect x="15" y="80" width="13" height="10" rx="1" fill="#475569" stroke="#1E293B" strokeWidth="1" />
            <rect x="72" y="80" width="13" height="10" rx="1" fill="#475569" stroke="#1E293B" strokeWidth="1" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-forged-steel':
      // Damascus layered steel ring with samurai hamon wave temper line & 8 recessed industrial rivets
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="dm-steel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="35%" stopColor="#94A3B8" />
                <stop offset="70%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
            </defs>
            {/* Multi-layered Damascus Bevel */}
            <circle cx="50" cy="50" r="41" stroke="url(#dm-steel)" strokeWidth="6.5" />
            {/* Hamon Temper Wave Line */}
            <circle cx="50" cy="50" r="41" stroke="#E2E8F0" strokeWidth="1.8" strokeDasharray="8 6 3 6" opacity="0.9" />
            <circle cx="50" cy="50" r="37.8" stroke="#0F172A" strokeWidth="2" />
            {/* 8 Precision Forged Steel Screws */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <circle cx="50" cy="9.5" r="2.2" fill="#CBD5E1" stroke="#334155" strokeWidth="0.8" />
                <line x1="48.5" y1="9.5" x2="51.5" y2="9.5" stroke="#1E293B" strokeWidth="0.8" />
              </g>
            ))}
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-cherry-bark':
      // Polished dark kabazaiku wild cherry bark cylinder with brass momiji leaves & wood grains
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="cb-bark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#78350F" />
                <stop offset="50%" stopColor="#451A03" />
                <stop offset="100%" stopColor="#291205" />
              </linearGradient>
            </defs>
            {/* Dark Cherry Wood Bark Ring */}
            <circle cx="50" cy="50" r="41" stroke="url(#cb-bark)" strokeWidth="7" />
            {/* Horizontal Bark Lenticels / Texture */}
            <circle cx="50" cy="50" r="41" stroke="#D97706" strokeWidth="1.5" strokeDasharray="6 14 10 12" opacity="0.65" />
            <circle cx="50" cy="50" r="37.8" stroke="#1C1917" strokeWidth="1.8" />
            {/* Inlaid Brass Momiji Leaf Badges at Top and Bottom-Right */}
            <g transform="translate(43, 3)">
              <path d="M7 0L9 5L14 4L11 9L14 14L8 11L7 16L6 11L0 14L3 9L0 4L5 5Z" fill="#F59E0B" stroke="#78350F" strokeWidth="0.6" />
            </g>
            <g transform="translate(80, 68) scale(0.8)">
              <path d="M7 0L9 5L14 4L11 9L14 14L8 11L7 16L6 11L0 14L3 9L0 4L5 5Z" fill="#D97706" stroke="#451A03" strokeWidth="0.6" />
            </g>
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-midnight-titanium':
      // Stealth aerospace titanium casing with slotted angular wings & cyan radar tick markers
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            {/* Outer Hex-Chamfered Titanium Ring */}
            <polygon points="25,5 75,5 95,25 95,75 75,95 25,95 5,75 5,25" stroke="#1E293B" strokeWidth="6" fill="none" strokeLinejoin="round" />
            <polygon points="26,7 74,7 93,26 93,74 74,93 26,93 7,74 7,26" stroke="#475569" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            {/* Inner Ring with Cyan Tactical Reticle Marks */}
            <circle cx="50" cy="50" r="38" stroke="#0F172A" strokeWidth="3" />
            <circle cx="50" cy="50" r="38.5" stroke="#06B6D4" strokeWidth="1" strokeDasharray="2 12" />
            {/* Slotted Cooling Vents at 4 corners */}
            <rect x="18" y="16" width="3" height="8" rx="1" fill="#06B6D4" opacity="0.8" transform="rotate(-45 19 20)" />
            <rect x="80" y="16" width="3" height="8" rx="1" fill="#06B6D4" opacity="0.8" transform="rotate(45 81 20)" />
            <rect x="80" y="78" width="3" height="8" rx="1" fill="#06B6D4" opacity="0.8" transform="rotate(-45 81 82)" />
            <rect x="18" y="78" width="3" height="8" rx="1" fill="#06B6D4" opacity="0.8" transform="rotate(45 19 82)" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-ivory-lotus':
      // Tiered sculpted ivory and pearl lotus flower petals cradling the circular base
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="ivory-petal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
            </defs>
            {/* Fine Ivory Gold Ring */}
            <circle cx="50" cy="50" r="41" stroke="#E2E8F0" strokeWidth="5" />
            <circle cx="50" cy="50" r="43.5" stroke="#F59E0B" strokeWidth="1" />
            <circle cx="50" cy="50" r="38" stroke="#94A3B8" strokeWidth="1.2" />
            {/* Cascading Sacred Lotus Petals at Bottom */}
            <path d="M50 72C42 78 30 88 32 96C42 98 50 88 50 84C50 88 58 98 68 96C70 88 58 78 50 72Z" fill="url(#ivory-petal)" stroke="#F59E0B" strokeWidth="1" />
            <path d="M50 78C45 84 38 94 42 102C50 100 50 92 50 90C50 92 50 100 58 102C62 94 55 84 50 78Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="0.8" />
            {/* Top Golden Lotus Bud Crest */}
            <path d="M46 12C48 5 52 5 54 12C50 10 48 10 46 12Z" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
            <circle cx="50" cy="15" r="2.5" fill="#FEF08A" stroke="#D97706" strokeWidth="0.8" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-neon-cyber':
      // Glowing high-contrast neon conduits with animated magenta/cyan pulse and plasma grid
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="neon-conduit" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="50%" stopColor="#FF007A" />
                <stop offset="100%" stopColor="#00F0FF" />
              </linearGradient>
            </defs>
            {/* Base Dark Circuit Chassis */}
            <circle cx="50" cy="50" r="41" stroke="#0A0A0A" strokeWidth="8" />
            {/* High-Voltage Conduit Ring */}
            <circle cx="50" cy="50" r="41" stroke="url(#neon-conduit)" strokeWidth="4.5" />
            {/* Inner Laser Ring */}
            <circle cx="50" cy="50" r="37.5" stroke="#00F0FF" strokeWidth="1.5" />
            {/* 4 Neon Cyber Corner Terminals */}
            <path d="M12 18L18 12M82 12L88 18M88 82L82 88M18 88L12 82" stroke="#FF007A" strokeWidth="3" strokeLinecap="round" />
            {/* Animated Cyan/Pink Plasma Glow Pulse */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#00F0FF"
              strokeWidth="1.8"
              strokeDasharray="14 10"
              opacity="0.9"
              style={canAnimate ? { animation: 'koban-pulse-glow 2.4s ease-in-out infinite' } : undefined}
            />
            {/* Orbiting Laser Data Bit */}
            <g style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-cw 3.6s linear infinite' } : undefined}>
              <circle cx="50" cy="6" r="3.5" fill="#FFFFFF" stroke="#00F0FF" strokeWidth="1.5" />
            </g>
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-crimson-flame':
      // Curling Kitsune foxfire blazing flames with rising embers and animated fire pulse
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="flame-grad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#7F1D1D" />
                <stop offset="50%" stopColor="#DC2626" />
                <stop offset="85%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FDE047" />
              </linearGradient>
            </defs>
            {/* Scorched Outer Core */}
            <circle cx="50" cy="50" r="41" stroke="#450A0A" strokeWidth="7" />
            <circle cx="50" cy="50" r="37.5" stroke="#991B1B" strokeWidth="2" />
            {/* 3 Rising Fire Tendrils from bottom */}
            <g style={canAnimate ? { transformOrigin: '50px 80px', animation: 'koban-flame-flicker 1.8s ease-in-out infinite' } : undefined}>
              <path d="M30 84C26 74 34 64 36 56C42 66 38 78 40 86C36 86 32 86 30 84Z" fill="url(#flame-grad)" opacity="0.9" />
              <path d="M46 92C44 78 52 66 50 50C58 64 54 80 54 92Z" fill="url(#flame-grad)" />
              <path d="M64 86C60 76 68 66 66 58C72 68 68 80 68 86Z" fill="url(#flame-grad)" opacity="0.9" />
            </g>
            {/* Flaming Crown Horns at Top */}
            <g style={canAnimate ? { transformOrigin: '50px 20px', animation: 'koban-flame-flicker 2.2s ease-in-out infinite' } : undefined}>
              <path d="M40 18C44 8 50 2 50 -2C50 2 56 8 60 18C54 14 46 14 40 18Z" fill="url(#flame-grad)" />
            </g>
            {/* Rising Sparks / Embers */}
            <circle
              cx="26"
              cy="36"
              r="2"
              fill="#FDE047"
              style={canAnimate ? { animation: 'koban-ember-rise 2s ease-out infinite' } : undefined}
            />
            <circle
              cx="74"
              cy="30"
              r="2.5"
              fill="#F97316"
              style={canAnimate ? { animation: 'koban-ember-rise 2.6s ease-out infinite 0.8s' } : undefined}
            />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-sakura-blossom':
      // Gnarled flowering cherry branch with blooming 5-petal sakura & drifting animated petals
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            {/* Curving Woody Cherry Branch */}
            <circle cx="50" cy="50" r="41" stroke="#451A03" strokeWidth="6" />
            <circle cx="50" cy="50" r="41" stroke="#78350F" strokeWidth="3" />
            <circle cx="50" cy="50" r="37.8" stroke="#F472B6" strokeWidth="1.5" />
            {/* Blooming 5-Petal Sakura Blossom at Top-Right */}
            <g transform="translate(74, 12)">
              {[0, 72, 144, 216, 288].map((rot) => (
                <ellipse key={rot} cx="10" cy="10" rx="4" ry="7" fill="#FBCFE8" stroke="#DB2777" strokeWidth="0.8" transform={`rotate(${rot} 10 10) translate(0, -6)`} />
              ))}
              <circle cx="10" cy="10" r="3.5" fill="#F472B6" />
              <circle cx="10" cy="10" r="1.5" fill="#FDE047" />
            </g>
            {/* Secondary Flower at Bottom-Left */}
            <g transform="translate(10, 68) scale(0.8)">
              {[0, 72, 144, 216, 288].map((rot) => (
                <ellipse key={rot} cx="10" cy="10" rx="4" ry="7" fill="#FBCFE8" stroke="#DB2777" strokeWidth="0.8" transform={`rotate(${rot} 10 10) translate(0, -6)`} />
              ))}
              <circle cx="10" cy="10" r="3.5" fill="#F472B6" />
              <circle cx="10" cy="10" r="1.5" fill="#FDE047" />
            </g>
            {/* Drifting Sakura Petals with Animated Fall */}
            <path
              d="M32 20C36 16 42 18 40 24C36 28 30 26 32 20Z"
              fill="#F472B6"
              style={canAnimate ? { animation: 'koban-petal-fall 3.2s ease-in-out infinite' } : undefined}
            />
            <path
              d="M72 64C76 60 82 62 80 68C76 72 70 70 72 64Z"
              fill="#FB7185"
              style={canAnimate ? { animation: 'koban-petal-fall 4s ease-in-out infinite 1.5s' } : undefined}
            />
          </svg>
          {innerContent}
        </div>
      );

    // ─── BATCH 3: 8 ANIMATED FRAMES (Items 17-24) ──────────────────────────
    case 'frame-void-shinobi':
      // Dimensional shadow rift with silver kunai daggers and swirling amethyst abyssal pulse
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="void-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="50%" stopColor="#581C87" />
                <stop offset="100%" stopColor="#1E1B4B" />
              </linearGradient>
            </defs>
            {/* Dark Void Portal Ring */}
            <circle cx="50" cy="50" r="41" stroke="url(#void-ring)" strokeWidth="7" />
            <circle cx="50" cy="50" r="37.5" stroke="#3B0764" strokeWidth="2" />
            {/* Pulsing Shadow Smoke Aura */}
            <circle
              cx="50"
              cy="50"
              r="44.5"
              stroke="#C084FC"
              strokeWidth="1.8"
              strokeDasharray="10 8"
              style={canAnimate ? { animation: 'koban-pulse-glow 2.8s ease-in-out infinite' } : undefined}
            />
            {/* Left Silver Kunai Dagger */}
            <g transform="translate(4, 20) rotate(-35)">
              <polygon points="6,0 12,18 0,18" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
              <rect x="5" y="18" width="2" height="8" fill="#64748B" />
              <circle cx="6" cy="28" r="2.5" fill="none" stroke="#64748B" strokeWidth="1" />
            </g>
            {/* Right Silver Kunai Dagger */}
            <g transform="translate(86, 14) rotate(35)">
              <polygon points="6,0 12,18 0,18" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
              <rect x="5" y="18" width="2" height="8" fill="#64748B" />
              <circle cx="6" cy="28" r="2.5" fill="none" stroke="#64748B" strokeWidth="1" />
            </g>
            {/* Orbiting Amethyst Spark */}
            <g style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-ccw 4s linear infinite' } : undefined}>
              <circle cx="50" cy="5" r="3" fill="#E9D5FF" stroke="#A855F7" strokeWidth="1" />
            </g>
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-imperial-laurel':
      // Gilded anime laurel victory wreath with crowned sun crest and royal ruby gem
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="laurel-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            {/* Gilded Inner Ring */}
            <circle cx="50" cy="50" r="40" stroke="url(#laurel-gold)" strokeWidth="4.5" />
            <circle cx="50" cy="50" r="37.5" stroke="#78350F" strokeWidth="1.5" />
            {/* Left Laurel Wreath Leaves */}
            {[-45, -20, 5, 30, 55].map((deg, i) => (
              <g key={`l-${i}`} transform={`rotate(${deg} 50 50) translate(6, 45)`}>
                <path d="M0 0C4 -3 8 -1 10 3C6 6 2 4 0 0Z" fill="url(#laurel-gold)" stroke="#78350F" strokeWidth="0.6" />
              </g>
            ))}
            {/* Right Laurel Wreath Leaves */}
            {[45, 20, -5, -30, -55].map((deg, i) => (
              <g key={`r-${i}`} transform={`rotate(${deg} 50 50) translate(84, 45)`}>
                <path d="M10 0C6 -3 2 -1 0 3C4 6 8 4 10 0Z" fill="url(#laurel-gold)" stroke="#78350F" strokeWidth="0.6" />
              </g>
            ))}
            {/* Majestic Crown at Top */}
            <g
              transform="translate(36, -6)"
              style={canAnimate ? { transformOrigin: '50px 10px', animation: 'koban-pulse-glow 3s ease-in-out infinite' } : undefined}
            >
              <polygon points="0,16 4,4 14,10 24,0 34,10 44,4 48,16" fill="url(#laurel-gold)" stroke="#78350F" strokeWidth="1" />
              <circle cx="24" cy="9" r="3.2" fill="#DC2626" stroke="#FEF08A" strokeWidth="0.8" />
            </g>
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-thunder-arc':
      // Raijin storm drums with electric crackling lightning discharges and thunder clouds
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            {/* Heavy Storm Cobalt Ring */}
            <circle cx="50" cy="50" r="41" stroke="#0C4A6E" strokeWidth="6.5" />
            <circle cx="50" cy="50" r="37.8" stroke="#082F49" strokeWidth="2" />
            {/* 3 Raijin Tomoe Drums around perimeter */}
            {[0, 120, 240].map((rot) => (
              <g key={rot} transform={`rotate(${rot} 50 50) translate(43, 3)`}>
                <circle cx="7" cy="7" r="7" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
                <circle cx="7" cy="7" r="3" fill="#DC2626" />
              </g>
            ))}
            {/* Crackling High-Voltage Electric Arcs */}
            <g style={canAnimate ? { animation: 'koban-lightning-flicker 1.8s steps(2, start) infinite' } : undefined}>
              <path d="M20 28L28 36L22 44L32 54" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="miter" />
              <path d="M80 30L72 38L78 46L68 56" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="miter" />
              <path d="M42 86L50 80L46 72L56 68" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="miter" />
            </g>
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-celestial-orbit':
      // Astrological brass armillary sphere with concentric rings and orbiting celestial planetoids
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            {/* Outer Astrolabe Brass Bezel */}
            <circle cx="50" cy="50" r="41" stroke="#B45309" strokeWidth="5.5" />
            <circle cx="50" cy="50" r="43.5" stroke="#FDE047" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="38" stroke="#78350F" strokeWidth="1.5" />
            {/* Inner Clockwise Orbit Ring with Blazing Golden Sun */}
            <g style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-cw 5.5s linear infinite' } : undefined}>
              <ellipse cx="50" cy="50" rx="44" ry="18" stroke="#F59E0B" strokeWidth="1" strokeDasharray="6 4" opacity="0.85" />
              <circle cx="94" cy="50" r="4.5" fill="#FDE047" stroke="#B45309" strokeWidth="1" />
            </g>
            {/* Outer Counter-Clockwise Orbit Ring with Silver Moon */}
            <g style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-ccw 8s linear infinite' } : undefined}>
              <ellipse cx="50" cy="50" rx="18" ry="44" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6 4" opacity="0.85" />
              <circle cx="50" cy="6" r="3.5" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />
            </g>
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-aurora-pulse':
      // Polar ice crystals with cascading dancing emerald and violet northern lights
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="aurora-curtain" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            {/* Icy Dark Blue Ring */}
            <circle cx="50" cy="50" r="41" stroke="#0F172A" strokeWidth="6.5" />
            <circle cx="50" cy="50" r="37.8" stroke="#1E293B" strokeWidth="1.8" />
            {/* Dancing Aurora Ribbon Over Top Half */}
            <g style={canAnimate ? { transformOrigin: '50px 30px', animation: 'koban-aurora-wave 3.4s ease-in-out infinite' } : undefined}>
              <path d="M12 40C24 16 46 8 68 18C80 24 92 34 88 44C82 32 70 24 58 20C40 14 24 24 12 40Z" fill="url(#aurora-curtain)" opacity="0.9" />
            </g>
            {/* Dancing Aurora Ribbon Over Bottom Half */}
            <g style={canAnimate ? { transformOrigin: '50px 70px', animation: 'koban-aurora-wave 4s ease-in-out infinite 0.7s' } : undefined}>
              <path d="M88 60C76 84 54 92 32 82C20 76 8 66 12 56C18 68 30 76 42 80C60 86 76 76 88 60Z" fill="url(#aurora-curtain)" opacity="0.8" />
            </g>
            {/* Twinkling North Stars */}
            <polygon points="50,4 52,9 57,11 52,13 50,18 48,13 43,11 48,9" fill="#FFFFFF" style={canAnimate ? { animation: 'koban-star-twinkle 2s ease-in-out infinite' } : undefined} />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-demon-fire':
      // Demonic Oni horns soaring from the crown with flared fangs & smoldering embers
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="oni-horn" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#450A0A" />
                <stop offset="60%" stopColor="#991B1B" />
                <stop offset="100%" stopColor="#F87171" />
              </linearGradient>
            </defs>
            {/* Scorched Obsidian Oni Ring */}
            <circle cx="50" cy="50" r="41" stroke="#1C1917" strokeWidth="7" />
            <circle cx="50" cy="50" r="37.5" stroke="#7F1D1D" strokeWidth="2" />
            {/* Twin Towering Curved Oni Horns */}
            <path d="M34 16C28 6 22 -6 10 -10C16 4 24 16 30 24Z" fill="url(#oni-horn)" stroke="#EF4444" strokeWidth="1" />
            <path d="M66 16C72 6 78 -6 90 -10C84 4 76 16 70 24Z" fill="url(#oni-horn)" stroke="#EF4444" strokeWidth="1" />
            {/* Oni Lower Fangs at Bottom */}
            <polygon points="36,88 40,98 44,88" fill="#FEE2E2" stroke="#991B1B" strokeWidth="0.8" />
            <polygon points="56,88 60,98 64,88" fill="#FEE2E2" stroke="#991B1B" strokeWidth="0.8" />
            {/* Ash Embers Rising */}
            <circle cx="28" cy="24" r="2" fill="#EF4444" style={canAnimate ? { animation: 'koban-ember-rise 2.2s ease-out infinite' } : undefined} />
            <circle cx="72" cy="24" r="2.2" fill="#F97316" style={canAnimate ? { animation: 'koban-ember-rise 2.5s ease-out infinite 0.7s' } : undefined} />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-quantum-circuit':
      // Hexagonal quantum silicon chip with glowing green photon nodes & traveling light
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            {/* Hexagonal Cyber Processor Rim */}
            <polygon points="50,6 88,27 88,73 50,94 12,73 12,27" stroke="#064E3B" strokeWidth="6" fill="none" strokeLinejoin="round" />
            <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" stroke="#10B981" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="38" stroke="#022C22" strokeWidth="2.5" />
            {/* 6 Corner Quantum Superconductor Nodes */}
            {[
              [50, 7],
              [87, 28],
              [87, 72],
              [50, 93],
              [13, 72],
              [13, 28],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="#34D399"
                stroke="#064E3B"
                strokeWidth="1"
                style={canAnimate ? { animation: `koban-pulse-glow 2s ease-in-out infinite ${i * 0.3}s` } : undefined}
              />
            ))}
            {/* Circuit Traces */}
            <path d="M50 14V36M80 32L65 42M80 68L65 58M50 86V64M20 68L35 58M20 32L35 42" stroke="#059669" strokeWidth="1.2" strokeDasharray="3 3" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-deepsea-vortex':
      // Great ocean wave whirlpool with cresting foam droplets and swirling cerulean currents
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#082F49" />
              </linearGradient>
            </defs>
            {/* Deep Marine Current Base */}
            <circle cx="50" cy="50" r="41" stroke="#0C4A6E" strokeWidth="6" />
            <circle cx="50" cy="50" r="37.5" stroke="#0369A1" strokeWidth="1.8" />
            {/* Swirling Hokusai Wave Arcs */}
            <g style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-cw 7s linear infinite' } : undefined}>
              <path d="M50 8C73 8 92 27 92 50C92 55 90 60 86 58C82 54 84 46 80 40C72 26 58 18 50 18" fill="none" stroke="url(#wave-grad)" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M50 92C27 92 8 73 8 50C8 45 10 40 14 42C18 46 16 54 20 60C28 74 42 82 50 82" fill="none" stroke="url(#wave-grad)" strokeWidth="3.5" strokeLinecap="round" />
            </g>
            {/* Sea Foam Droplets */}
            <circle cx="86" cy="42" r="2.5" fill="#E0F2FE" />
            <circle cx="14" cy="58" r="2.5" fill="#E0F2FE" />
          </svg>
          {innerContent}
        </div>
      );

    case 'frame-solar-corona':
      // Total solar eclipse with dark umbra disc, blazing golden corona flares and looping solar prominences
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
            <defs>
              <linearGradient id="corona-fire" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="75%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#7C2D12" />
              </linearGradient>
            </defs>
            {/* Dark Sun Eclipse Core Ring */}
            <circle cx="50" cy="50" r="41" stroke="#0C0A09" strokeWidth="7" />
            <circle cx="50" cy="50" r="37.5" stroke="#78350F" strokeWidth="2" />
            {/* Blazing Outer Corona Spikes Pulsing */}
            <g style={canAnimate ? { animation: 'koban-pulse-glow 2.5s ease-in-out infinite' } : undefined}>
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <polygon
                  key={deg}
                  points="50,-4 53,10 47,10"
                  fill="url(#corona-fire)"
                  transform={`rotate(${deg} 50 50)`}
                />
              ))}
            </g>
            {/* Rotating Solar Magnetic Loop Prominence */}
            <g style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-cw 9s linear infinite' } : undefined}>
              <path d="M42 4C46 -6 54 -6 58 4" stroke="#FDE047" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="50" cy="-3" r="2" fill="#FFFFFF" />
            </g>
          </svg>
          {innerContent}
        </div>
      );

    // ─── 5 NEW PREMIUM AVATAR FRAMES (SVG + Shared FX Engine) ───────────────
    case 'frame-dragon-scale-halo':
      return (
        <DragonScaleHaloFrame size={size} canAnimate={canAnimate} className={className}>
          {innerContent}
        </DragonScaleHaloFrame>
      );

    case 'frame-thunder-mandala':
      return (
        <ThunderMandalaFrame size={size} canAnimate={canAnimate} className={className}>
          {innerContent}
        </ThunderMandalaFrame>
      );

    case 'frame-sakura-blade-ring':
      return (
        <SakuraBladeRingFrame size={size} canAnimate={canAnimate} className={className}>
          {innerContent}
        </SakuraBladeRingFrame>
      );

    case 'frame-void-obsidian-ring':
      return (
        <VoidObsidianRingFrame size={size} canAnimate={canAnimate} className={className}>
          {innerContent}
        </VoidObsidianRingFrame>
      );

    case 'frame-royal-gold-laurel-crown':
      return (
        <RoyalGoldLaurelCrownFrame size={size} canAnimate={canAnimate} className={className}>
          {innerContent}
        </RoyalGoldLaurelCrownFrame>
      );

    default:
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
          {innerContent}
        </div>
      );
  }
};

interface SubFrameProps {
  size: number;
  canAnimate: boolean;
  className: string;
  children: React.ReactNode;
}

const DragonScaleHaloFrame: React.FC<SubFrameProps> = ({ size, canAnimate, className, children }) => {
  const { stageRef, cwGroupRef, ccwGroupRef, energyPathRef, pulseGroupRef } = useFrameMotionRefs(
    canAnimate,
    22,
    16,
    28
  );
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 22,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        ringRadius: 0.36,
        ringCenterX: 0.5,
        ringCenterY: 0.5,
        tangentialSpeed: 0.35,
        vxMin: -0.05,
        vxMax: 0.05,
        vyMin: -0.14,
        vyMax: 0.04,
        turbulence: 0.22,
        lifeMin: 0.7,
        lifeMax: 1.4,
        sizeStartMin: 2.0,
        sizeStartMax: 3.6,
        sizeEndMin: 0.6,
        sizeEndMax: 1.2,
        alphaPeak: 0.95,
      },
    ],
    []
  );

  return (
    <div
      ref={stageRef}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, contain: 'paint' }}
    >
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={40}
        seed={701}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-30"
      />
      <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
        <defs>
          <linearGradient id="dsh_scale" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="41.5" stroke="#2A0408" strokeWidth="7.5" />
        {/* Counter-Rotating Inner Scale Ring */}
        <g ref={ccwGroupRef}>
          <circle cx="50" cy="50" r="37.2" stroke="#F59E0B" strokeWidth="1.6" strokeDasharray="5 4" opacity="0.85" />
        </g>
        {/* Flowing Molten Energy Conduit (stroke-dashoffset) */}
        <circle
          ref={energyPathRef as React.RefObject<SVGCircleElement>}
          cx="50"
          cy="50"
          r="41.5"
          stroke="url(#dsh_scale)"
          strokeWidth="4.8"
          strokeDasharray="10 6"
          strokeLinecap="round"
        />
        {/* Rotating Outer Dragonfire Spines */}
        <g ref={cwGroupRef}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <polygon
              key={deg}
              points="50,2 53,8 47,8"
              fill="#FEF08A"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
        </g>
        {/* Pulsing Crown Dragon Horns & Crest */}
        <g ref={pulseGroupRef}>
          <path d="M29 13 C20 1 12 -3 8 4 C15 12 21 18 27 22 Z" fill="#FDE047" stroke="#92400E" strokeWidth="1.2" />
          <path d="M71 13 C80 1 88 -3 92 4 C85 12 79 18 73 22 Z" fill="#FDE047" stroke="#92400E" strokeWidth="1.2" />
          <polygon points="50,1 55,9 50,14 45,9" fill="#EF4444" stroke="#FEF08A" strokeWidth="1.2" />
        </g>
      </svg>
      {children}
    </div>
  );
};

const ThunderMandalaFrame: React.FC<SubFrameProps> = ({ size, canAnimate, className, children }) => {
  const { stageRef, cwGroupRef, ccwGroupRef, energyPathRef } = useFrameMotionRefs(
    canAnimate,
    28,
    20,
    38
  );
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 18,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.thunderGold,
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        ringRadius: 0.36,
        tangentialSpeed: 0.42,
        vxMin: -0.05,
        vxMax: 0.05,
        vyMin: -0.05,
        vyMax: 0.05,
        lifeMin: 0.5,
        lifeMax: 1.1,
        sizeStartMin: 1.8,
        sizeStartMax: 3.2,
        sizeEndMin: 0.5,
        sizeEndMax: 1.0,
        alphaPeak: 0.95,
      },
    ],
    []
  );
  const lightning = useMemo<LightningConfig>(
    () => ({
      intervalMin: 0.45,
      intervalMax: 1.1,
      decayRate: 6.5,
      glowColor: '#38BDF8',
      coreColor: '#FEF08A',
      ringMode: true,
      ringRadius: 0.36,
    }),
    []
  );

  return (
    <div
      ref={stageRef}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, contain: 'paint' }}
    >
      <StoreFxCanvas
        emitters={emitters}
        lightning={lightning}
        maxParticles={36}
        seed={702}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-30"
      />
      <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
        <circle cx="50" cy="50" r="41" stroke="#0F172A" strokeWidth="6.5" />
        <circle
          ref={energyPathRef as React.RefObject<SVGCircleElement>}
          cx="50"
          cy="50"
          r="41"
          stroke="#38BDF8"
          strokeWidth="2.8"
          strokeDasharray="12 8"
        />
        <g ref={ccwGroupRef}>
          <circle cx="50" cy="50" r="37.2" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 6" />
        </g>
        <g ref={cwGroupRef}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              <circle cx="50" cy="6" r="4.8" fill="#FEF08A" stroke="#B45309" strokeWidth="1.3" />
              <circle cx="50" cy="6" r="1.9" fill="#78350F" />
            </g>
          ))}
        </g>
      </svg>
      {children}
    </div>
  );
};

const SakuraBladeRingFrame: React.FC<SubFrameProps> = ({ size, canAnimate, className, children }) => {
  const { stageRef, cwGroupRef, ccwGroupRef, energyPathRef, pulseGroupRef } = useFrameMotionRefs(
    canAnimate,
    18,
    24,
    30
  );
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 16,
        shape: ParticleShape.Petal,
        additive: true,
        ramp: COLOR_RAMPS.sakuraGale,
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        ringRadius: 0.36,
        tangentialSpeed: 0.28,
        vxMin: -0.06,
        vxMax: 0.06,
        vyMin: -0.04,
        vyMax: 0.08,
        lifeMin: 0.9,
        lifeMax: 1.8,
        sizeStartMin: 2.2,
        sizeStartMax: 4.0,
        sizeEndMin: 1.0,
        sizeEndMax: 1.8,
        alphaPeak: 0.92,
      },
    ],
    []
  );

  return (
    <div
      ref={stageRef}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, contain: 'paint' }}
    >
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={32}
        seed={703}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-30"
      />
      <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
        <defs>
          <linearGradient id="sbr_steel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#9D174D" />
          </linearGradient>
        </defs>
        <g ref={cwGroupRef}>
          <path d="M50 7 A43 43 0 0 1 93 50 A40 40 0 0 1 50 89" stroke="url(#sbr_steel)" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M50 93 A43 43 0 0 1 7 50 A40 40 0 0 1 50 11" stroke="url(#sbr_steel)" strokeWidth="5.5" strokeLinecap="round" />
        </g>
        <circle
          ref={energyPathRef as React.RefObject<SVGCircleElement>}
          cx="50"
          cy="50"
          r="41"
          stroke="#FFF1F2"
          strokeWidth="2.2"
          strokeDasharray="18 26"
          strokeLinecap="round"
        />
        <g ref={ccwGroupRef}>
          <circle cx="50" cy="50" r="37.2" stroke="#FBCFE8" strokeWidth="1.3" strokeDasharray="6 4" />
        </g>
        <g ref={pulseGroupRef}>
          <circle cx="50" cy="7" r="4.2" fill="#F472B6" stroke="#FFF1F2" strokeWidth="1.2" />
          <circle cx="88" cy="72" r="3.6" fill="#FB7185" stroke="#FFF1F2" strokeWidth="1" />
          <circle cx="12" cy="28" r="3.6" fill="#F472B6" stroke="#FFF1F2" strokeWidth="1" />
        </g>
      </svg>
      {children}
    </div>
  );
};

const VoidObsidianRingFrame: React.FC<SubFrameProps> = ({ size, canAnimate, className, children }) => {
  const { stageRef, cwGroupRef, ccwGroupRef, energyPathRef, pulseGroupRef } = useFrameMotionRefs(
    canAnimate,
    16,
    26,
    28
  );
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 18,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.voidObsidian,
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        ringRadius: 0.36,
        tangentialSpeed: -0.32,
        vxMin: -0.04,
        vxMax: 0.04,
        vyMin: -0.08,
        vyMax: 0.04,
        lifeMin: 0.7,
        lifeMax: 1.5,
        sizeStartMin: 1.8,
        sizeStartMax: 3.4,
        sizeEndMin: 0.5,
        sizeEndMax: 1.2,
        alphaPeak: 0.92,
      },
    ],
    []
  );
  const lightning = useMemo<LightningConfig>(
    () => ({
      intervalMin: 0.8,
      intervalMax: 1.7,
      decayRate: 5.5,
      glowColor: '#9333EA',
      coreColor: '#F3E8FF',
      ringMode: true,
      ringRadius: 0.36,
    }),
    []
  );

  return (
    <div
      ref={stageRef}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, contain: 'paint' }}
    >
      <StoreFxCanvas
        emitters={emitters}
        lightning={lightning}
        maxParticles={35}
        seed={704}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-30"
      />
      <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
        <circle cx="50" cy="50" r="41" stroke="#09090B" strokeWidth="7.5" />
        <circle
          ref={energyPathRef as React.RefObject<SVGCircleElement>}
          cx="50"
          cy="50"
          r="41"
          stroke="#A855F7"
          strokeWidth="3.2"
          strokeDasharray="14 8"
          strokeLinecap="round"
        />
        <g ref={ccwGroupRef}>
          <circle cx="50" cy="50" r="37.2" stroke="#E9D5FF" strokeWidth="1.4" strokeDasharray="5 5" />
        </g>
        <g ref={cwGroupRef}>
          <polygon points="50,0 55,11 50,16 45,11" fill="#C084FC" stroke="#09090B" strokeWidth="1.2" />
          <polygon points="100,50 89,55 84,50 89,45" fill="#C084FC" stroke="#09090B" strokeWidth="1.2" />
          <polygon points="50,100 55,89 50,84 45,89" fill="#C084FC" stroke="#09090B" strokeWidth="1.2" />
          <polygon points="0,50 11,55 16,50 11,45" fill="#C084FC" stroke="#09090B" strokeWidth="1.2" />
        </g>
        <g ref={pulseGroupRef}>
          <circle cx="50" cy="50" r="43.5" stroke="#9333EA" strokeWidth="1" opacity="0.5" />
        </g>
      </svg>
      {children}
    </div>
  );
};

const RoyalGoldLaurelCrownFrame: React.FC<SubFrameProps> = ({ size, canAnimate, className, children }) => {
  const { stageRef, cwGroupRef, ccwGroupRef, energyPathRef, pulseGroupRef } = useFrameMotionRefs(
    canAnimate,
    14,
    20,
    26
  );
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 16,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.fallingStars,
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        ringRadius: 0.36,
        tangentialSpeed: 0.24,
        vxMin: -0.04,
        vxMax: 0.04,
        vyMin: -0.1,
        vyMax: 0.02,
        lifeMin: 0.8,
        lifeMax: 1.7,
        sizeStartMin: 2.0,
        sizeStartMax: 3.6,
        sizeEndMin: 0.6,
        sizeEndMax: 1.4,
        alphaPeak: 0.9,
      },
    ],
    []
  );

  return (
    <div
      ref={stageRef}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, contain: 'paint' }}
    >
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={32}
        seed={705}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-30"
      />
      <svg className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" viewBox="-10 -10 120 120" fill="none">
        <circle cx="50" cy="50" r="41" stroke="#78350F" strokeWidth="7" />
        <circle
          ref={energyPathRef as React.RefObject<SVGCircleElement>}
          cx="50"
          cy="50"
          r="41"
          stroke="#FEF08A"
          strokeWidth="3.8"
          strokeDasharray="9 5"
          strokeLinecap="round"
        />
        <g ref={ccwGroupRef}>
          <circle cx="50" cy="50" r="37.2" stroke="#F59E0B" strokeWidth="1.6" strokeDasharray="6 4" />
        </g>
        <g ref={cwGroupRef}>
          {[30, 90, 150, 210, 270, 330].map((deg) => (
            <circle key={deg} cx="50" cy="8.5" r="2.2" fill="#FFFFFF" transform={`rotate(${deg} 50 50)`} />
          ))}
        </g>
        {/* Pulsing Crown Keystone Ruby & Sovereign Laurel Spires */}
        <g ref={pulseGroupRef}>
          <polygon points="50,-1 58,11 50,17 42,11" fill="#DC2626" stroke="#FEF08A" strokeWidth="1.6" />
          <polygon points="34,5 41,13 33,15" fill="#FDE047" />
          <polygon points="66,5 59,13 67,15" fill="#FDE047" />
        </g>
      </svg>
      {children}
    </div>
  );
};
