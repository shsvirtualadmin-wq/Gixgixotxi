import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { storeFxScheduler } from '../fx/storeFxEngine';
import { StoreLoopVideo, storeVideoGovernor } from '../fx/StoreLoopVideo';

interface NameplateProps {
  itemId: string;
  name: string;
  shortId?: string;
  roleBadge?: string;
  canAnimate?: boolean;
  className?: string;
  allowWrap?: boolean | 'full' | 'two-lines';
}

interface PremiumNameplateConfig {
  id: string;
  bgGradient: string;
  shimmerGradient: string;
  smokeColorA: string;
  smokeColorB: string;
  borderOuterColor: string;
  borderFlowColor: string;
  scanlineColor: string;
  textColor: string;
  textShadow: string;
  shortIdColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  turbulenceFreq: string;
  displacementScale: number;
  ornamentPathLeft: React.ReactNode;
  ornamentPathRight: React.ReactNode;
  borderPathD: string;
  has3DLoop?: boolean;
  staticOnly?: boolean;
  videoPosterOnly?: boolean;
  calmCenterZone?: boolean;
  textBackingBg?: string;
  textBackingBorder?: string;
  textBackingShadow?: string;
  flankMotif?: 'sakura-glass' | 'katana-slash';
}

const CALM_CENTER_FLANK_MASK =
  'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 15%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.05) 78%, rgba(0,0,0,0.72) 85%, rgba(0,0,0,0.92) 100%)';

const PREMIUM_NAMEPLATE_CONFIGS: Record<string, PremiumNameplateConfig> = {
  'plate-dragon-lord': {
    id: 'plate-dragon-lord',
    bgGradient: 'linear-gradient(125deg, #220306 0%, #681016 38%, #991B1B 68%, #3B0609 100%)',
    shimmerGradient: 'linear-gradient(108deg, transparent 15%, rgba(254,240,138,0.08) 38%, rgba(253,224,71,0.42) 50%, rgba(249,115,22,0.16) 62%, transparent 85%)',
    smokeColorA: '#F97316',
    smokeColorB: '#DC2626',
    borderOuterColor: '#D97706',
    borderFlowColor: '#FEF08A',
    scanlineColor: 'rgba(254, 240, 138, 0.28)',
    textColor: '#FEF9C3',
    textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 8px rgba(220,38,38,0.85)',
    shortIdColor: '#FDE68A',
    badgeBg: '#450A0A',
    badgeText: '#FEF08A',
    badgeBorder: '#F59E0B',
    turbulenceFreq: '0.035 0.08',
    displacementScale: 8,
    borderPathD: 'M10,1.5 L220,1.5 L228.5,20 L220,38.5 L10,38.5 L1.5,20 Z',
    ornamentPathLeft: (
      <g>
        <path d="M2 8 L8 2 L14 6 L11 14 L7 11 L3 14 Z" fill="#FDE047" stroke="#78350F" strokeWidth="0.9" />
        <circle cx="8" cy="7.5" r="1.6" fill="#DC2626" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <path d="M14 8 L8 2 L2 6 L5 14 L9 11 L13 14 Z" fill="#FDE047" stroke="#78350F" strokeWidth="0.9" />
        <circle cx="8" cy="7.5" r="1.6" fill="#DC2626" />
      </g>
    ),
  },
  'plate-shinobi-shadow': {
    id: 'plate-shinobi-shadow',
    bgGradient: 'linear-gradient(128deg, #090414 0%, #1E0B3B 45%, #3B0764 76%, #110622 100%)',
    shimmerGradient: 'linear-gradient(108deg, transparent 18%, rgba(168,85,247,0.10) 40%, rgba(233,213,255,0.38) 50%, rgba(192,132,252,0.14) 60%, transparent 82%)',
    smokeColorA: '#A855F7',
    smokeColorB: '#6366F1',
    borderOuterColor: '#7E22CE',
    borderFlowColor: '#E9D5FF',
    scanlineColor: 'rgba(216, 180, 254, 0.25)',
    textColor: '#FAF5FF',
    textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 9px rgba(168,85,247,0.85)',
    shortIdColor: '#D8B4FE',
    badgeBg: '#2E1065',
    badgeText: '#F3E8FF',
    badgeBorder: '#A855F7',
    turbulenceFreq: '0.04 0.09',
    displacementScale: 10,
    borderPathD: 'M12,1.5 L228,1.5 L218,38.5 L2,38.5 Z',
    ornamentPathLeft: (
      <g>
        <path d="M8 1 L10.2 5.8 L15 8 L10.2 10.2 L8 15 L5.8 10.2 L1 8 L5.8 5.8 Z" fill="#C084FC" stroke="#3B0764" strokeWidth="0.8" />
        <circle cx="8" cy="8" r="2" fill="#090414" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <path d="M8 1 L10.2 5.8 L15 8 L10.2 10.2 L8 15 L5.8 10.2 L1 8 L5.8 5.8 Z" fill="#C084FC" stroke="#3B0764" strokeWidth="0.8" />
        <circle cx="8" cy="8" r="2" fill="#090414" />
      </g>
    ),
  },
  'plate-neon-ronin': {
    id: 'plate-neon-ronin',
    bgGradient: 'linear-gradient(125deg, #040814 0%, #09192F 44%, #1E1038 78%, #050B18 100%)',
    shimmerGradient: 'linear-gradient(105deg, transparent 18%, rgba(0,240,255,0.12) 38%, rgba(255,0,122,0.42) 50%, rgba(0,240,255,0.22) 62%, transparent 82%)',
    smokeColorA: '#00F0FF',
    smokeColorB: '#FF007A',
    borderOuterColor: '#0284C7',
    borderFlowColor: '#00F0FF',
    scanlineColor: 'rgba(0, 240, 255, 0.36)',
    textColor: '#ECFEFF',
    textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 8px rgba(0,240,255,0.8)',
    shortIdColor: '#67E8F9',
    badgeBg: '#083344',
    badgeText: '#67E8F9',
    badgeBorder: '#00F0FF',
    turbulenceFreq: '0.05 0.11',
    displacementScale: 7,
    borderPathD: 'M2,1.5 L218,1.5 L228.5,11 L228.5,38.5 L12,38.5 L1.5,29 Z',
    ornamentPathLeft: (
      <g>
        <polygon points="8,1 15,8 8,15 1,8" fill="#FF007A" stroke="#00F0FF" strokeWidth="0.9" />
        <circle cx="8" cy="8" r="1.8" fill="#ECFEFF" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <polygon points="8,1 15,8 8,15 1,8" fill="#00F0FF" stroke="#FF007A" strokeWidth="0.9" />
        <circle cx="8" cy="8" r="1.8" fill="#ECFEFF" />
      </g>
    ),
  },
  'plate-imperial-jade': {
    id: 'plate-imperial-jade',
    bgGradient: 'linear-gradient(130deg, #02241C 0%, #064E3B 42%, #047857 74%, #022C22 100%)',
    shimmerGradient: 'linear-gradient(108deg, transparent 16%, rgba(110,231,183,0.12) 39%, rgba(254,240,138,0.40) 50%, rgba(52,211,153,0.16) 61%, transparent 84%)',
    smokeColorA: '#34D399',
    smokeColorB: '#FBBF24',
    borderOuterColor: '#D97706',
    borderFlowColor: '#FEF08A',
    scanlineColor: 'rgba(167, 243, 208, 0.25)',
    textColor: '#ECFDF5',
    textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 8px rgba(16,185,129,0.8)',
    shortIdColor: '#A7F3D0',
    badgeBg: '#022C22',
    badgeText: '#FDE047',
    badgeBorder: '#F59E0B',
    turbulenceFreq: '0.03 0.07',
    displacementScale: 7,
    borderPathD: 'M7,1.5 L223,1.5 L228.5,7 L228.5,33 L223,38.5 L7,38.5 L1.5,33 L1.5,7 Z',
    ornamentPathLeft: (
      <g>
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="#FDE047" strokeWidth="1.3" fill="#047857" />
        <circle cx="8" cy="8" r="2.5" fill="#FEF08A" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="#FDE047" strokeWidth="1.3" fill="#047857" />
        <circle cx="8" cy="8" r="2.5" fill="#FEF08A" />
      </g>
    ),
  },
  'plate-blood-moon-scroll': {
    id: 'plate-blood-moon-scroll',
    bgGradient: 'linear-gradient(125deg, #16060A 0%, #3E0A14 45%, #6B1120 75%, #1F070C 100%)',
    shimmerGradient: 'linear-gradient(108deg, transparent 16%, rgba(251,113,133,0.12) 39%, rgba(254,205,211,0.38) 50%, rgba(225,29,72,0.18) 61%, transparent 84%)',
    smokeColorA: '#F43F5E',
    smokeColorB: '#9F1239',
    borderOuterColor: '#BE123C',
    borderFlowColor: '#FDA4AF',
    scanlineColor: 'rgba(253, 164, 175, 0.25)',
    textColor: '#FFF1F2',
    textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 8px rgba(225,29,72,0.85)',
    shortIdColor: '#FDA4AF',
    badgeBg: '#4C0519',
    badgeText: '#FECDD3',
    badgeBorder: '#F43F5E',
    turbulenceFreq: '0.036 0.085',
    displacementScale: 8,
    borderPathD: 'M5,1.5 L225,1.5 L225,38.5 L5,38.5 Z',
    ornamentPathLeft: (
      <g>
        <rect x="3" y="1.5" width="4.5" height="13" rx="1" fill="#881337" stroke="#FDA4AF" strokeWidth="0.9" />
        <circle cx="11.5" cy="8" r="2.8" fill="#F43F5E" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <circle cx="4.5" cy="8" r="2.8" fill="#F43F5E" />
        <rect x="8.5" y="1.5" width="4.5" height="13" rx="1" fill="#881337" stroke="#FDA4AF" strokeWidth="0.9" />
      </g>
    ),
  },
  // ─── 4 NEW PREMIUM NAMEPLATES (Wave 2: Items 142–145) ───────────────────
  'plate-raijin-storm-plate': {
    id: 'plate-raijin-storm-plate',
    has3DLoop: true,
    bgGradient: 'linear-gradient(125deg, #050B18 0%, #0F172A 45%, #1E3A8A 78%, #090D16 100%)',
    shimmerGradient: 'linear-gradient(108deg, transparent 18%, rgba(56,189,248,0.14) 38%, rgba(254,240,138,0.44) 50%, rgba(56,189,248,0.22) 62%, transparent 82%)',
    smokeColorA: '#38BDF8',
    smokeColorB: '#FACC15',
    borderOuterColor: '#0284C7',
    borderFlowColor: '#FEF08A',
    scanlineColor: 'rgba(56, 189, 248, 0.35)',
    textColor: '#F0F9FF',
    textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 8px rgba(56,189,248,0.85)',
    shortIdColor: '#7DD3FC',
    badgeBg: '#0C4A6E',
    badgeText: '#FEF08A',
    badgeBorder: '#38BDF8',
    turbulenceFreq: '0.045 0.095',
    displacementScale: 9,
    borderPathD: 'M8,1.5 L222,1.5 L228.5,12 L222,38.5 L8,38.5 L1.5,28 Z',
    ornamentPathLeft: (
      <g>
        <polygon points="9,1 3,9 8,9 6,15 14,7 9,7" fill="#FEF08A" stroke="#0284C7" strokeWidth="0.8" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <polygon points="9,1 3,9 8,9 6,15 14,7 9,7" fill="#FEF08A" stroke="#0284C7" strokeWidth="0.8" />
      </g>
    ),
  },
  'plate-cyber-glitch': {
    id: 'plate-cyber-glitch',
    has3DLoop: true,
    bgGradient: 'linear-gradient(125deg, #060414 0%, #160A2C 45%, #082F49 78%, #090418 100%)',
    shimmerGradient: 'linear-gradient(102deg, transparent 18%, rgba(255,0,122,0.22) 42%, rgba(0,240,255,0.48) 50%, rgba(253,224,71,0.24) 58%, transparent 82%)',
    smokeColorA: '#00F0FF',
    smokeColorB: '#FF007A',
    borderOuterColor: '#FF007A',
    borderFlowColor: '#00F0FF',
    scanlineColor: 'rgba(0, 240, 255, 0.42)',
    textColor: '#ECFEFF',
    textShadow: '-1px 0 rgba(255,0,122,0.85), 1px 0 rgba(0,240,255,0.85), 0 1px 2px rgba(0,0,0,0.95)',
    shortIdColor: '#F472B6',
    badgeBg: '#3B0764',
    badgeText: '#00F0FF',
    badgeBorder: '#FF007A',
    turbulenceFreq: '0.06 0.14',
    displacementScale: 8,
    borderPathD: 'M4,1.5 L224,1.5 L228.5,8 L226,38.5 L6,38.5 L1.5,32 Z',
    ornamentPathLeft: (
      <g>
        <rect x="2" y="3" width="10" height="4" fill="#00F0FF" />
        <rect x="4" y="9" width="10" height="4" fill="#FF007A" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <rect x="4" y="3" width="10" height="4" fill="#FF007A" />
        <rect x="2" y="9" width="10" height="4" fill="#00F0FF" />
      </g>
    ),
  },
  'plate-frozen-sakura-glass': {
    id: 'plate-frozen-sakura-glass',
    has3DLoop: true,
    calmCenterZone: true,
    flankMotif: 'sakura-glass',
    bgGradient: 'linear-gradient(128deg, #07192B 0%, #102A45 26%, #09192B 50%, #2E1330 78%, #091728 100%)',
    shimmerGradient: 'linear-gradient(108deg, transparent 10%, rgba(186,230,253,0.28) 28%, rgba(244,114,182,0.45) 50%, rgba(125,211,252,0.28) 72%, transparent 90%)',
    smokeColorA: '#7DD3FC',
    smokeColorB: '#F472B6',
    borderOuterColor: '#38BDF8',
    borderFlowColor: '#FBCFE8',
    scanlineColor: 'rgba(186, 230, 253, 0.24)',
    textColor: '#FFFFFF',
    textShadow: '0 1px 2px rgba(2,6,23,0.98), 0 0 4px rgba(2,6,23,0.95), 0 0 9px rgba(14,116,144,0.55)',
    shortIdColor: '#FBCFE8',
    badgeBg: '#082F49',
    badgeText: '#FCE7F3',
    badgeBorder: '#7DD3FC',
    textBackingBg: 'linear-gradient(180deg, rgba(6, 18, 32, 0.86) 0%, rgba(11, 22, 39, 0.90) 100%)',
    textBackingBorder: 'rgba(125, 211, 252, 0.34)',
    textBackingShadow: '0 1px 6px rgba(2, 6, 23, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
    turbulenceFreq: '0.032 0.075',
    displacementScale: 5,
    borderPathD: 'M8,1.5 L222,1.5 L228.5,8 L228.5,32 L222,38.5 L8,38.5 L1.5,32 L1.5,8 Z',
    ornamentPathLeft: (
      <g>
        <path d="M8 1.5 C11.2 4.8 13.2 8.8 8 14.5 C2.8 8.8 4.8 4.8 8 1.5 Z" fill="#F472B6" stroke="#E0F2FE" strokeWidth="0.9" />
        <circle cx="8" cy="8" r="1.4" fill="#E0F2FE" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <path d="M8 1.5 C11.2 4.8 13.2 8.8 8 14.5 C2.8 8.8 4.8 4.8 8 1.5 Z" fill="#7DD3FC" stroke="#FCE7F3" strokeWidth="0.9" />
        <circle cx="8" cy="8" r="1.4" fill="#FCE7F3" />
      </g>
    ),
  },
  'plate-ronin-katana-slash': {
    id: 'plate-ronin-katana-slash',
    has3DLoop: true,
    videoPosterOnly: true,
    calmCenterZone: true,
    flankMotif: 'katana-slash',
    bgGradient: 'linear-gradient(125deg, #07070A 0%, #16161B 24%, #09090D 50%, #36080C 80%, #09090B 100%)',
    shimmerGradient: 'linear-gradient(115deg, transparent 42%, rgba(239,68,68,0.52) 48.5%, rgba(255,255,255,0.82) 50%, rgba(220,38,38,0.52) 51.5%, transparent 58%)',
    smokeColorA: '#DC2626',
    smokeColorB: '#27272A',
    borderOuterColor: '#DC2626',
    borderFlowColor: '#FCA5A5',
    scanlineColor: 'rgba(239, 68, 68, 0.22)',
    textColor: '#FFFFFF',
    textShadow: '0 1px 2px rgba(0,0,0,0.98), 0 0 4px rgba(0,0,0,0.95), 0 0 9px rgba(185,28,28,0.55)',
    shortIdColor: '#FECDD3',
    badgeBg: '#18181B',
    badgeText: '#FECDD3',
    badgeBorder: '#DC2626',
    textBackingBg: 'linear-gradient(180deg, rgba(8, 8, 12, 0.88) 0%, rgba(15, 10, 14, 0.92) 100%)',
    textBackingBorder: 'rgba(239, 68, 68, 0.34)',
    textBackingShadow: '0 1px 6px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(254, 202, 202, 0.12)',
    turbulenceFreq: '0.03 0.06',
    displacementScale: 4,
    borderPathD: 'M10,1.5 L228.5,1.5 L220,38.5 L1.5,38.5 Z',
    ornamentPathLeft: (
      <g>
        <line x1="2" y1="14" x2="14" y2="2" stroke="#F8FAFC" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="2.5" y1="13.5" x2="13.5" y2="2.5" stroke="#EF4444" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="5" y1="4" x2="12" y2="11" stroke="#DC2626" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    ),
    ornamentPathRight: (
      <g>
        <line x1="2" y1="14" x2="14" y2="2" stroke="#F8FAFC" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="2.5" y1="13.5" x2="13.5" y2="2.5" stroke="#EF4444" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="4" y1="5" x2="11" y2="12" stroke="#DC2626" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    ),
  },
};

const PremiumAnimatedNameplate: React.FC<{
  config: PremiumNameplateConfig;
  name: string;
  shortId?: string;
  roleBadge?: string;
  canAnimate: boolean;
  className: string;
  allowWrap?: boolean | 'full' | 'two-lines';
}> = ({ config, name, shortId, roleBadge, canAnimate, className, allowWrap }) => {
  const rawUid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const taskId = `nameplate-${config.id}-${rawUid}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shimmerRef = useRef<HTMLDivElement | null>(null);
  const smokeGroupRef = useRef<SVGGElement | null>(null);
  const borderFlowRef = useRef<SVGPathElement | null>(null);
  const scanlineRef = useRef<HTMLDivElement | null>(null);
  const flankFxLeftRef = useRef<SVGGElement | null>(null);
  const flankFxRightRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const applyFrame = (elapsed: number) => {
      if (shimmerRef.current) {
        // Continuous smooth shimmer sweep across [-110%, 110%]
        const cycle = (elapsed * 0.36) % 1;
        const pct = -110 + cycle * 220;
        shimmerRef.current.style.transform = `translate3d(${pct.toFixed(1)}%, 0, 0)`;
      }
      if (smokeGroupRef.current) {
        const dx = Math.sin(elapsed * 0.75) * (config.calmCenterZone ? 6 : 14);
        const dy = Math.cos(elapsed * 0.52) * 3.5;
        smokeGroupRef.current.setAttribute('transform', `translate(${dx.toFixed(2)}, ${dy.toFixed(2)})`);
      }
      if (borderFlowRef.current) {
        const dashOffset = -(elapsed * 48) % 280;
        borderFlowRef.current.style.strokeDashoffset = `${dashOffset.toFixed(1)}`;
      }
      if (scanlineRef.current) {
        const scanY = (Math.sin(elapsed * 1.6) * 0.5 + 0.5) * 100;
        const scanAlpha = config.calmCenterZone
          ? 0.14 + 0.14 * Math.sin(elapsed * 2.4)
          : 0.35 + 0.35 * Math.sin(elapsed * 2.4);
        scanlineRef.current.style.top = `${scanY.toFixed(1)}%`;
        scanlineRef.current.style.opacity = `${scanAlpha.toFixed(2)}`;
      }
      if (config.flankMotif === 'katana-slash') {
        // Quick katana flash at the left and right ends only (never crosses center text)
        const slashPhase = (elapsed * 0.55) % 1;
        const flashOpacity = slashPhase < 0.22 ? Math.sin((slashPhase / 0.22) * Math.PI) : 0.28;
        const shift = slashPhase < 0.22 ? (slashPhase / 0.22) * 8 - 4 : 0;
        if (flankFxLeftRef.current) {
          flankFxLeftRef.current.style.opacity = `${flashOpacity.toFixed(2)}`;
          flankFxLeftRef.current.setAttribute('transform', `translate(${shift.toFixed(1)}, ${(-shift * 0.5).toFixed(1)})`);
        }
        if (flankFxRightRef.current) {
          flankFxRightRef.current.style.opacity = `${flashOpacity.toFixed(2)}`;
          flankFxRightRef.current.setAttribute('transform', `translate(${(-shift).toFixed(1)}, ${(shift * 0.5).toFixed(1)})`);
        }
      } else if (config.flankMotif === 'sakura-glass') {
        // Gentle falling sakura drift in left and right endzones
        const driftY = Math.sin(elapsed * 1.1) * 3.2;
        const driftX = Math.cos(elapsed * 0.85) * 2.4;
        if (flankFxLeftRef.current) {
          flankFxLeftRef.current.setAttribute('transform', `translate(${driftX.toFixed(2)}, ${driftY.toFixed(2)})`);
        }
        if (flankFxRightRef.current) {
          flankFxRightRef.current.setAttribute('transform', `translate(${(-driftX).toFixed(2)}, ${(-driftY).toFixed(2)})`);
        }
      }
    };

    if (!canAnimate || config.staticOnly) {
      applyFrame(1.4);
      return;
    }

    const unregister = storeFxScheduler.register({
      id: taskId,
      element: el,
      canAnimate: true,
      onFrame: (_dt, elapsed) => applyFrame(elapsed),
      onStaticFrame: () => applyFrame(1.4),
    });

    return () => {
      unregister();
    };
  }, [canAnimate, config.calmCenterZone, config.flankMotif, config.staticOnly, taskId]);

  // Full player name is ALWAYS visible (never single-line truncated on the premium items; wraps up to 2 lines or full wrap)
  const textWrapClass =
    allowWrap === 'full'
      ? 'whitespace-normal break-words leading-snug'
      : 'whitespace-normal break-words line-clamp-2 leading-snug';

  const filterId = `np-smoke-${rawUid}`;
  const isCalmCenter = Boolean(config.calmCenterZone);
  const edgeMaskStyle: React.CSSProperties | undefined = isCalmCenter
    ? {
        maskImage: CALM_CENTER_FLANK_MASK,
        WebkitMaskImage: CALM_CENTER_FLANK_MASK,
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center gap-2 px-3.5 py-1.5 max-w-full overflow-hidden select-none box-border rounded-md shadow-md ${className}`}
      style={{
        background: config.bgGradient,
        overflow: 'hidden',
        contain: 'paint',
      }}
    >
      {/* Pre-rendered 3D Plate Decoration Loop (600x120) */}
      {config.has3DLoop && (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={edgeMaskStyle}
        >
          <StoreLoopVideo
            itemId={config.id}
            animated={!config.staticOnly && !config.videoPosterOnly}
            canAnimate={canAnimate && !config.staticOnly && !config.videoPosterOnly}
            objectFit="cover"
            className={`absolute inset-0 w-full h-full ${isCalmCenter ? 'opacity-45' : 'opacity-55'}`}
          />
        </div>
      )}

      {/* SVG feTurbulence + feDisplacementMap Drifting Smoke & Ornate Border Path */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 230 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={config.turbulenceFreq}
              numOctaves={2}
              seed={17}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={config.displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <linearGradient id={`${filterId}-smoke`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={config.smokeColorA} stopOpacity={isCalmCenter ? '0.24' : '0.28'} />
            <stop offset="50%" stopColor={config.smokeColorB} stopOpacity={isCalmCenter ? '0.04' : '0.18'} />
            <stop offset="100%" stopColor={config.smokeColorA} stopOpacity={isCalmCenter ? '0.24' : '0.26'} />
          </linearGradient>
        </defs>

        {isCalmCenter ? (
          <g ref={smokeGroupRef} filter={`url(#${filterId})`}>
            {/* Flank-only smoke clouds leaving the central 60% text zone clear */}
            <ellipse cx="22" cy="20" rx="24" ry="14" fill={`url(#${filterId}-smoke)`} />
            <ellipse cx="208" cy="20" rx="24" ry="14" fill={`url(#${filterId}-smoke)`} />
          </g>
        ) : (
          <g ref={smokeGroupRef} filter={`url(#${filterId})`}>
            <ellipse cx="65" cy="20" rx="58" ry="16" fill={`url(#${filterId}-smoke)`} />
            <ellipse cx="165" cy="20" rx="62" ry="15" fill={`url(#${filterId}-smoke)`} />
          </g>
        )}

        {/* Flank-Only Decorative Artwork for Ronin Katana Slash */}
        {config.flankMotif === 'katana-slash' && (
          <g>
            {/* Left Endzone Katana Blade & Crimson Ink Accents (x: 2..42) */}
            <path d="M 3 34 L 34 4 L 38 4 L 9 34 Z" fill="#DC2626" fillOpacity="0.42" />
            <path d="M 12 36 L 40 8" stroke="#FCA5A5" strokeWidth="1.1" strokeOpacity="0.65" strokeLinecap="round" />
            <circle cx="20" cy="11" r="1.4" fill="#EF4444" fillOpacity="0.7" />
            <circle cx="31" cy="29" r="1.1" fill="#FCA5A5" fillOpacity="0.6" />
            <g ref={flankFxLeftRef}>
              <line x1="4" y1="35" x2="36" y2="3" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8" y1="36" x2="42" y2="6" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {/* Right Endzone Katana Blade & Crimson Ink Accents (x: 188..228) */}
            <path d="M 192 36 L 223 6 L 227 6 L 198 36 Z" fill="#DC2626" fillOpacity="0.42" />
            <path d="M 190 32 L 218 4" stroke="#FCA5A5" strokeWidth="1.1" strokeOpacity="0.65" strokeLinecap="round" />
            <circle cx="210" cy="12" r="1.3" fill="#EF4444" fillOpacity="0.7" />
            <circle cx="198" cy="28" r="1.1" fill="#FCA5A5" fillOpacity="0.6" />
            <g ref={flankFxRightRef}>
              <line x1="194" y1="37" x2="226" y2="5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="188" y1="34" x2="222" y2="4" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* Flank-Only Decorative Artwork for Frozen Sakura Glass */}
        {config.flankMotif === 'sakura-glass' && (
          <g>
            {/* Icy Glass Facet Highlights at Left & Right Ends (x: 2..44 and 186..228) */}
            <polygon points="2,8 28,2 18,38 2,32" fill="#7DD3FC" fillOpacity="0.16" />
            <polygon points="18,2 40,2 26,38 10,38" fill="#F472B6" fillOpacity="0.12" />
            <polygon points="228,8 202,2 212,38 228,32" fill="#7DD3FC" fillOpacity="0.16" />
            <polygon points="212,2 190,2 204,38 220,38" fill="#F472B6" fillOpacity="0.12" />

            {/* Left Endzone Falling Sakura Petals & Ice Crystals */}
            <g ref={flankFxLeftRef}>
              <path d="M 22 7 C 25 9 25 13 22 15 C 19 13 19 9 22 7 Z" fill="#F9A8D4" fillOpacity="0.85" />
              <path d="M 34 23 C 36.5 25 36.5 28.5 34 30.5 C 31.5 28.5 31.5 25 34 23 Z" fill="#F472B6" fillOpacity="0.75" />
              <circle cx="15" cy="27" r="1.3" fill="#E0F2FE" fillOpacity="0.85" />
              <circle cx="37" cy="11" r="1.1" fill="#BAE6FD" fillOpacity="0.8" />
            </g>

            {/* Right Endzone Falling Sakura Petals & Ice Crystals */}
            <g ref={flankFxRightRef}>
              <path d="M 208 9 C 211 11 211 15 208 17 C 205 15 205 11 208 9 Z" fill="#F9A8D4" fillOpacity="0.85" />
              <path d="M 196 24 C 198.5 26 198.5 29.5 196 31.5 C 193.5 29.5 193.5 26 196 24 Z" fill="#F472B6" fillOpacity="0.75" />
              <circle cx="215" cy="28" r="1.3" fill="#E0F2FE" fillOpacity="0.85" />
              <circle cx="193" cy="12" r="1.1" fill="#BAE6FD" fillOpacity="0.8" />
            </g>
          </g>
        )}

        {/* Ornate Base Border Path */}
        <path
          d={config.borderPathD}
          fill="none"
          stroke={config.borderOuterColor}
          strokeWidth="1.6"
          strokeOpacity="0.85"
          vectorEffect="non-scaling-stroke"
        />

        {/* Flowing Energy Highlight along Ornate Border Path */}
        <path
          ref={borderFlowRef}
          d={config.borderPathD}
          fill="none"
          stroke={config.borderFlowColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="46 94"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Continuous Animated Shimmer Sweep (Masked away from center text when calmCenterZone is true) */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={edgeMaskStyle}
      >
        <div
          ref={shimmerRef}
          className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
          style={{ background: config.shimmerGradient }}
        />
      </div>

      {/* Subtle Horizontal Scanline Pulse (Masked away from center text when calmCenterZone is true) */}
      <div
        ref={scanlineRef}
        className="absolute inset-x-0 h-[1.5px] pointer-events-none"
        style={{
          background: config.scanlineColor,
          top: '45%',
          opacity: isCalmCenter ? 0.16 : 0.45,
          ...(edgeMaskStyle || {}),
        }}
      />

      {/* Left Crest SVG */}
      <svg className="w-3.5 h-3.5 shrink-0 z-10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {config.ornamentPathLeft}
      </svg>

      {/* Player Name & Tag — Calm high-contrast backing pill when calmCenterZone is enabled */}
      {isCalmCenter ? (
        <div
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded min-w-0 max-w-full z-10"
          style={{
            background: config.textBackingBg,
            border: `1px solid ${config.textBackingBorder || 'rgba(255,255,255,0.18)'}`,
            boxShadow: config.textBackingShadow,
          }}
        >
          <span
            className={`font-heading font-bold text-xs tracking-wider text-center ${textWrapClass} min-w-0`}
            style={{
              color: config.textColor,
              textShadow: config.textShadow,
            }}
          >
            {name}
          </span>

          {shortId && (
            <span
              className="font-mono text-[10px] font-semibold shrink-0"
              style={{
                color: config.shortIdColor,
                textShadow: '0 1px 2px rgba(0,0,0,0.98), 0 0 4px rgba(0,0,0,0.9)',
              }}
            >
              #{shortId}
            </span>
          )}

          {roleBadge && (
            <span
              className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border shrink-0"
              style={{
                backgroundColor: config.badgeBg,
                color: config.badgeText,
                borderColor: config.badgeBorder,
              }}
            >
              {roleBadge}
            </span>
          )}
        </div>
      ) : (
        <>
          <span
            className={`font-heading font-bold text-xs tracking-wider text-center ${textWrapClass} min-w-0 z-10`}
            style={{
              color: config.textColor,
              textShadow: config.textShadow,
            }}
          >
            {name}
          </span>

          {shortId && (
            <span
              className="font-mono text-[10px] shrink-0 z-10"
              style={{ color: config.shortIdColor, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
              #{shortId}
            </span>
          )}

          {roleBadge && (
            <span
              className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border shrink-0 z-10"
              style={{
                backgroundColor: config.badgeBg,
                color: config.badgeText,
                borderColor: config.badgeBorder,
              }}
            >
              {roleBadge}
            </span>
          )}
        </>
      )}

      {/* Right Crest SVG */}
      <svg className="w-3.5 h-3.5 shrink-0 z-10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {config.ornamentPathRight}
      </svg>
    </div>
  );
};

/**
 * 30 NAMEPLATES (Static & Animated + 5 New Premium)
 * High-contrast legible text (contrast >= 4.5:1) with textured motifs.
 * Supports wrapping (up to 2 lines in store previews, or full wrap in loadout card) when allowWrap is set.
 */
let nextPixelPopPlateUid = 1;

/**
 * Pixel Pop Marquee (id: plate-pixel-pop-arcade) — Common Animated 3D Nameplate
 * - Wide strip 960x160 px (6:1), 240 frames @ 24 fps (10.000s seamless loop).
 * - Absolute asset paths:
 *   - /assets/store/plate-pixel-pop-arcade/poster.webp
 *   - /assets/store/plate-pixel-pop-arcade/plate.webm
 *   - /assets/store/plate-pixel-pop-arcade/plate.mp4
 * - Center 60% stays calm & dark (#1B1B3A to #2A1F5C) with > 14:1 contrast against #FFFFFF text.
 * - Uses poster-only in dense lists, respects prefers-reduced-motion and max-8-playing governor,
 *   and falls back cleanly to poster.webp if video fails to load.
 */
const PixelPopMarqueeNameplate: React.FC<NameplateProps> = ({
  name,
  shortId,
  roleBadge,
  canAnimate = true,
  className = '',
  allowWrap = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const instanceIdRef = useRef<string>(`plate-pixel-pop-arcade-${nextPixelPopPlateUid++}`);

  const [isVisible, setIsVisible] = useState(true);
  const [isDenseListDom, setIsDenseListDom] = useState(false);
  const [isGovernorActive, setIsGovernorActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    storeVideoGovernor.isReducedMotion()
  );
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const posterUrl = '/assets/store/plate-pixel-pop-arcade/poster.webp';
  const webmUrl = '/assets/store/plate-pixel-pop-arcade/plate.webm';
  const mp4Url = '/assets/store/plate-pixel-pop-arcade/plate.mp4';

  const effectiveAnimate = Boolean(
    canAnimate && !isDenseListDom && !reducedMotion && !videoFailed
  );

  const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) {
      node.muted = true;
      node.defaultMuted = true;
      node.playsInline = true;
    }
    storeVideoGovernor.setVideoEl(instanceIdRef.current, node);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches || storeVideoGovernor.isReducedMotion());
      const onChange = (e: MediaQueryListEvent) =>
        setReducedMotion(e.matches || storeVideoGovernor.isReducedMotion());
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Detect if mounted inside a dense list (leaderboard rows, member lists, table rows, compact nav)
    const inDense = Boolean(
      el.closest('tr, tbody, [data-dense-list="true"], .dense-list-item')
    );
    setIsDenseListDom(inDense);

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.05, rootMargin: '80px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!effectiveAnimate) {
      setIsGovernorActive(false);
      return;
    }
    const id = instanceIdRef.current;
    return storeVideoGovernor.register({
      id,
      videoEl: videoRef.current,
      getVideoEl: () => videoRef.current,
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 6,
      setActiveState: setIsGovernorActive,
      onPlayError: () => setAutoplayBlocked(true),
    });
  }, [effectiveAnimate, isVisible]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      videoEl: videoRef.current,
      getVideoEl: () => videoRef.current,
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 6,
    });
  }, [isVisible, effectiveAnimate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (effectiveAnimate && isVisible && isGovernorActive && !autoplayBlocked) {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err: unknown) => {
          const errName = err instanceof Error ? err.name : '';
          if (errName === 'AbortError') return;
          setAutoplayBlocked(true);
        });
      }
    } else if (!video.paused) {
      video.pause();
    }
  }, [effectiveAnimate, isVisible, isGovernorActive, autoplayBlocked]);

  const handleVideoReady = () => {
    setAutoplayBlocked(false);
    const video = videoRef.current;
    if (effectiveAnimate && isVisible && isGovernorActive && video && video.paused) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err: unknown) => {
          const errName = err instanceof Error ? err.name : '';
          if (errName === 'AbortError') return;
          setAutoplayBlocked(true);
        });
      }
    }
  };

  const textWrapClass =
    allowWrap === 'full'
      ? 'whitespace-normal break-words leading-tight'
      : 'whitespace-normal break-words line-clamp-2 leading-tight';

  const showVideo = Boolean(
    effectiveAnimate && isVisible && isGovernorActive && !videoFailed && !autoplayBlocked
  );

  return (
    <div
      ref={containerRef}
      data-nameplate-id="plate-pixel-pop-arcade"
      data-testid="plate-pixel-pop-arcade"
      className={`plate-pixel-pop-arcade relative inline-flex items-center justify-center max-w-full overflow-hidden select-none box-border rounded-lg shadow-md ${className}`}
      style={{
        minWidth: '216px',
        minHeight: '38px',
        paddingLeft: '21%',
        paddingRight: '21%',
        paddingTop: '7px',
        paddingBottom: '7px',
        background: 'linear-gradient(135deg, #1B1B3A 0%, #2A1F5C 100%)',
        border: '1px solid #121028',
        contain: 'paint',
      }}
    >
      {!posterFailed && (
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          onError={() => setPosterFailed(true)}
          className="plate-pixel-pop-arcade-poster absolute inset-0 w-full h-full object-fill pointer-events-none"
        />
      )}

      {effectiveAnimate && (
        <video
          ref={handleVideoRef}
          data-testid="plate-pixel-pop-arcade-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={posterFailed ? undefined : posterUrl}
          onLoadedMetadata={handleVideoReady}
          onLoadedData={handleVideoReady}
          onCanPlay={handleVideoReady}
          onPlaying={() => setAutoplayBlocked(false)}
          onError={() => setVideoFailed(true)}
          className={`plate-pixel-pop-arcade-video absolute inset-0 w-full h-full object-fill pointer-events-none transition-opacity duration-200 ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={webmUrl} type="video/webm" />
          <source src={mp4Url} type="video/mp4" onError={() => setVideoFailed(true)} />
        </video>
      )}

      <div className="relative z-10 inline-flex items-center justify-center gap-1.5 min-w-0 max-w-full text-center">
        <span
          className={`font-heading font-bold text-xs tracking-wide text-center ${textWrapClass} min-w-0`}
          style={{
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(10, 8, 22, 0.96)',
          }}
        >
          {name}
        </span>

        {shortId && (
          <span
            className="font-mono text-[10px] font-bold shrink-0"
            style={{
              color: '#FFE45E',
              textShadow: '0 1px 2px rgba(10, 8, 22, 0.96)',
            }}
          >
            #{shortId}
          </span>
        )}

        {roleBadge && (
          <span
            className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border shrink-0"
            style={{
              backgroundColor: '#1B1B3A',
              color: '#00E0C6',
              borderColor: '#7C4DFF',
            }}
          >
            {roleBadge}
          </span>
        )}
      </div>
    </div>
  );
};

export const NameplateRenderer: React.FC<NameplateProps> = ({
  itemId,
  name,
  shortId,
  roleBadge,
  canAnimate = true,
  className = '',
  allowWrap = false,
}) => {
  if (itemId === 'plate-pixel-pop-arcade') {
    return (
      <PixelPopMarqueeNameplate
        itemId={itemId}
        name={name}
        shortId={shortId}
        roleBadge={roleBadge}
        canAnimate={canAnimate}
        className={className}
        allowWrap={allowWrap}
      />
    );
  }

  if (PREMIUM_NAMEPLATE_CONFIGS[itemId]) {
    return (
      <PremiumAnimatedNameplate
        config={PREMIUM_NAMEPLATE_CONFIGS[itemId]}
        name={name}
        shortId={shortId}
        roleBadge={roleBadge}
        canAnimate={canAnimate}
        className={className}
        allowWrap={allowWrap}
      />
    );
  }

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

