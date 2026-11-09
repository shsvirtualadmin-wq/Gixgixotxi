import React, { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useKobanStyle } from '@/contexts/KobanStyleContext';
import {
  DEFAULT_KOBAN_STYLE,
  deriveKobanColors,
  mix,
  type KobanDesignId,
  type KobanMotionMode,
  type KobanStyleSettings,
} from '@/lib/kobanStyle';

export type KobanIconSize = 14 | 16 | 18 | 20 | 24 | 28 | 32 | 48 | 64 | 80 | number;

export interface KobanStyleProps {
  design?: KobanDesignId;
  mainColor?: string;
  accentColor?: string;
  glowColor?: string;
  glow?: number;
  motion?: KobanMotionMode;
  sparkle?: boolean;
}

export interface KobanIconProps {
  size?: KobanIconSize;
  /** Optional explicit style override (used by the customizer preview & design tiles) */
  styleSettings?: KobanStyleProps;
  /** Alias for styleSettings */
  styleOverride?: KobanStyleProps;
  /**
   * True ONLY for the header balance chip and the large preview.
   * False in lists/tables/cards to keep scrolling smooth on phones.
   */
  animated?: boolean;
  /** Kept for backwards compatibility with existing callers */
  tilt?: boolean;
  /** Accessible label when standing alone (defaults to "Kobans" unless decorative) */
  ariaLabel?: string;
  /** Set true when adjacent text already labels the amount */
  decorative?: boolean;
  className?: string;
}

const PIXEL_GEM_ROWS = [
  '...oooooo...',
  '..ollllggo..',
  '.olllggggrdo',
  'olllggggrrdo',
  'olggggggrrdo',
  '.oggggggrrdo',
  '.ogggggrrrdo',
  '..ogggrrrdo.',
  '..orggrrrdo.',
  '...orrrrdo..',
  '....orrdo...',
  '.....odo....',
] as const;

const PIXEL_K_COORDS = new Set([
  '4,3',
  '6,3',
  '4,4',
  '6,4',
  '4,5',
  '5,5',
  '4,6',
  '6,6',
  '4,7',
  '6,7',
]);

const K_GLYPH_PATH = 'M27 20v24M27 32l12-12M30 30.5l10.5 13.5';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);

  return reduced;
}

function useIsLightTheme(): boolean {
  const [isLight, setIsLight] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
    const root = document.documentElement;
    const check = () => setIsLight(root.getAttribute('data-theme') === 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => obs.disconnect();
  }, []);

  return isLight;
}

let keyframesInjected = false;
function ensureKobanKeyframes(): void {
  if (keyframesInjected || typeof document === 'undefined') return;
  keyframesInjected = true;
  const styleId = 'boardly-koban-icon-keyframes';
  if (document.getElementById(styleId)) return;
  const el = document.createElement('style');
  el.id = styleId;
  el.textContent = `
    @keyframes koban-spin-9s {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes koban-spin-34s {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes koban-float-lively {
      0%, 100% { transform: translateY(0%); }
      50% { transform: translateY(-4%); }
    }
    @keyframes koban-pixel-bob {
      0%, 100% { transform: translateY(0%); }
      50% { transform: translateY(-3%); }
    }
    @keyframes koban-k-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }
    @keyframes koban-glow-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.84; }
    }
    @keyframes koban-shine-sweep {
      0%, 15% { transform: translateX(-80px) rotate(25deg); opacity: 0; }
      30% { opacity: 0.85; }
      55%, 100% { transform: translateX(80px) rotate(25deg); opacity: 0; }
    }
    @keyframes koban-sparkle-twinkle {
      0%, 100% { transform: scale(0.25) rotate(0deg); opacity: 0.15; }
      50% { transform: scale(1) rotate(20deg); opacity: 0.95; }
    }
    @media (prefers-reduced-motion: reduce) {
      .koban-anim-node {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(el);
}

/**
 * Shared <KobanIcon /> Component (64x64 inline SVG).
 * Renders one of the 6 whitelisted designs with per-instance unique gradient IDs,
 * user-selected colors, glow drop-shadow, light sweep + 4-point sparkles, and motion.
 */
export const KobanIcon: React.FC<KobanIconProps> = ({
  size = 24,
  styleSettings,
  styleOverride,
  animated = false,
  ariaLabel = 'Kobans',
  decorative = false,
  className = '',
}) => {
  ensureKobanKeyframes();

  const { style: contextStyle } = useKobanStyle();
  const reducedMotion = usePrefersReducedMotion();
  const isLightMode = useIsLightTheme();
  const rawUid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const overrides = styleOverride || styleSettings;
  const design: KobanDesignId = overrides?.design ?? contextStyle.design ?? DEFAULT_KOBAN_STYLE.design;
  const mainColor = overrides?.mainColor ?? contextStyle.mainColor ?? DEFAULT_KOBAN_STYLE.mainColor;
  const accentColor = overrides?.accentColor ?? contextStyle.accentColor ?? DEFAULT_KOBAN_STYLE.accentColor;
  const glowColor = overrides?.glowColor ?? contextStyle.glowColor ?? DEFAULT_KOBAN_STYLE.glowColor;
  const glow =
    typeof overrides?.glow === 'number'
      ? overrides.glow
      : typeof contextStyle.glow === 'number'
      ? contextStyle.glow
      : DEFAULT_KOBAN_STYLE.glow;
  const motion: KobanMotionMode =
    overrides?.motion ?? contextStyle.motion ?? DEFAULT_KOBAN_STYLE.motion;
  const sparkle: boolean =
    typeof overrides?.sparkle === 'boolean'
      ? overrides.sparkle
      : typeof contextStyle.sparkle === 'boolean'
      ? contextStyle.sparkle
      : DEFAULT_KOBAN_STYLE.sparkle;

  const colors = deriveKobanColors(mainColor, accentColor, glowColor);
  const { light, mid, midDeep, deep, ink, kcolor, pixelOutline, pixelMidDeep, glowRgb } = colors;
  const crystalSideLight = mix(light, mid, 50);

  // Per-instance unique gradient & clip IDs
  const g1Id = `kb-g1-${rawUid}`;
  const orbRadId = `kb-orb-${rawUid}`;
  const crystalSideId = `kb-crys-${rawUid}`;
  const shineGradId = `kb-shine-${rawUid}`;
  const clipId = `kb-clip-${rawUid}`;

  // Effective animation flags (strictly off when animated=false, motion='off', or prefers-reduced-motion)
  const canAnimate = Boolean(animated && !reducedMotion && motion !== 'off');
  const isLively = canAnimate && motion === 'lively';
  const showShineAndSparkle = Boolean(animated && !reducedMotion && sparkle);
  const showSparkles = showShineAndSparkle && size >= 40;

  // Glow drop-shadow calculation
  // s = (glow / 100) multiplied by 0.55 in light mode so it does not wash out
  const rawStrength = Math.max(0, Math.min(100, glow)) / 100;
  const s = rawStrength * (isLightMode ? 0.55 : 1);
  const blur1 = (size * 0.1).toFixed(2);
  const blur2 = (size * 0.28).toFixed(2);
  const alpha1 = (0.9 * s).toFixed(3);
  const alpha2 = (0.55 * s).toFixed(3);
  const filterShadow =
    s > 0.005
      ? `drop-shadow(0 0 ${blur1}px rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${alpha1})) drop-shadow(0 0 ${blur2}px rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${alpha2}))`
      : 'none';

  // Outer motion class/style for subtle/lively glow pulse or float
  const wrapperAnimation = !canAnimate
    ? undefined
    : design === 'pixel'
    ? 'koban-pixel-bob 2.6s ease-in-out infinite'
    : isLively
    ? 'koban-float-lively 3.2s ease-in-out infinite, koban-glow-pulse 2.8s ease-in-out infinite'
    : 'koban-glow-pulse 3.4s ease-in-out infinite';

  const kPulseStyle: React.CSSProperties | undefined = canAnimate
    ? { animation: 'koban-k-pulse 2.6s ease-in-out infinite' }
    : undefined;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none relative ${className}`}
      style={{
        width: size,
        height: size,
        filter: filterShadow,
      }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative ? 'true' : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible block koban-anim-node"
        style={wrapperAnimation ? { animation: wrapperAnimation } : undefined}
      >
        <defs>
          {/* Main diagonal gradient G1: light 0, mid .3, mid-to-deep blend .65, deep 1 */}
          <linearGradient id={g1Id} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="30%" stopColor={mid} />
            <stop offset="65%" stopColor={midDeep} />
            <stop offset="100%" stopColor={deep} />
          </linearGradient>

          {/* Energy Orb radial gradient (center 35% 30%): light 0, mid .35, deep .75, ink 1 */}
          <radialGradient id={orbRadId} cx="35%" cy="30%" fx="35%" fy="30%" r="70%">
            <stop offset="0%" stopColor={light} />
            <stop offset="35%" stopColor={mid} />
            <stop offset="75%" stopColor={deep} />
            <stop offset="100%" stopColor={ink} />
          </radialGradient>

          {/* Crystal side shards gradient: light-mid to deep */}
          <linearGradient id={crystalSideId} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={crystalSideLight} />
            <stop offset="100%" stopColor={deep} />
          </linearGradient>

          {/* Light sweep highlight gradient */}
          {showShineAndSparkle && (
            <>
              <linearGradient id={shineGradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <clipPath id={clipId}>
                <circle cx="32" cy="32" r="29" />
              </clipPath>
            </>
          )}
        </defs>

        {/* ─── DESIGN A: "star" (Shuriken Star) ─────────────────────────────── */}
        {design === 'star' && (
          <g>
            <g
              className="koban-anim-node"
              style={
                isLively
                  ? {
                      transformOrigin: '32px 32px',
                      animation: 'koban-spin-9s 9s linear infinite',
                    }
                  : undefined
              }
            >
              <path
                d="M32 2L39 25L62 32L39 39L32 62L25 39L2 32L25 25Z"
                fill={`url(#${g1Id})`}
                stroke="#ffffff"
                strokeOpacity="0.55"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M32 2L32 62M2 32L62 32"
                stroke={ink}
                strokeOpacity="0.25"
                strokeWidth="1"
              />
            </g>
            <circle cx="32" cy="32" r="11" fill={ink} stroke={mid} strokeWidth="1.6" />
            <g transform="translate(32 32) scale(0.46) translate(-32 -32)">
              <path
                d={K_GLYPH_PATH}
                fill="none"
                stroke={kcolor}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
              />
            </g>
          </g>
        )}

        {/* ─── DESIGN B: "hex" (Rune Hex) ───────────────────────────────────── */}
        {design === 'hex' && (
          <g>
            <path
              d="M32 3L58 17.5V46.5L32 61L6 46.5V17.5Z"
              fill={ink}
              stroke={`url(#${g1Id})`}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M32 11L51 22V42L32 53L13 42V22Z"
              fill="none"
              stroke={mid}
              strokeOpacity="0.5"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <path
              d="M32 3V8M32 56V61M6 17.5L10 20M58 17.5L54 20"
              stroke={deep}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={K_GLYPH_PATH}
              fill="none"
              stroke={kcolor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
              className="koban-anim-node"
              style={kPulseStyle}
            />
          </g>
        )}

        {/* ─── DESIGN C: "pixel" (Pixel Gem) ────────────────────────────────── */}
        {design === 'pixel' && (
          <g shapeRendering="crispEdges">
            {PIXEL_GEM_ROWS.map((rowStr, y) =>
              Array.from(rowStr).map((ch, x) => {
                if (ch === '.') return null;
                const isK = PIXEL_K_COORDS.has(`${x},${y}`);
                let fill = mid;
                if (isK) {
                  fill = ink;
                } else if (ch === 'o') {
                  fill = pixelOutline;
                } else if (ch === 'l') {
                  fill = light;
                } else if (ch === 'g') {
                  fill = mid;
                } else if (ch === 'r') {
                  fill = pixelMidDeep;
                } else if (ch === 'd') {
                  fill = deep;
                }
                return (
                  <rect
                    key={`${x}-${y}`}
                    x={8 + x * 4}
                    y={8 + y * 4}
                    width={4}
                    height={4}
                    fill={fill}
                  />
                );
              })
            )}
          </g>
        )}

        {/* ─── DESIGN D: "orb" (Energy Orb) ─────────────────────────────────── */}
        {design === 'orb' && (
          <g>
            <circle
              cx="32"
              cy="32"
              r="20"
              fill={`url(#${orbRadId})`}
              stroke="#ffffff"
              strokeOpacity="0.4"
              strokeWidth="1.2"
            />
            <ellipse
              cx="25"
              cy="23"
              rx="7"
              ry="4"
              transform="rotate(-30 25 23)"
              fill="#ffffff"
              fillOpacity="0.45"
            />
            <path
              d={K_GLYPH_PATH}
              fill="none"
              stroke={ink}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
            />
            <g transform="rotate(-20 32 32)">
              <g
                className="koban-anim-node"
                style={
                  isLively
                    ? {
                        transformOrigin: '32px 32px',
                        animation: 'koban-spin-34s 3.4s linear infinite',
                      }
                    : undefined
                }
              >
                <ellipse
                  cx="32"
                  cy="32"
                  rx="30"
                  ry="9"
                  fill="none"
                  stroke={`url(#${g1Id})`}
                  strokeWidth="2.2"
                  strokeOpacity="0.85"
                />
                <circle cx="62" cy="32" r="3.4" fill={light} />
              </g>
            </g>
          </g>
        )}

        {/* ─── DESIGN E: "crystal" (Crystal Shards) ─────────────────────────── */}
        {design === 'crystal' && (
          <g>
            <path
              d="M14 30L22 44L16 58L8 46Z"
              fill={`url(#${crystalSideId})`}
              fillOpacity="0.9"
            />
            <path
              d="M50 30L58 46L50 58L42 44Z"
              fill={`url(#${crystalSideId})`}
              fillOpacity="0.9"
            />
            <path
              d="M32 2L46 24L40 60H24L18 24Z"
              fill={`url(#${g1Id})`}
              stroke="#ffffff"
              strokeOpacity="0.5"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            <path
              d="M32 2L32 60M18 24L46 24"
              stroke="#ffffff"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <g transform="translate(32 38) scale(0.5) translate(-32 -32)">
              <path
                d={K_GLYPH_PATH}
                fill="none"
                stroke={ink}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
              />
            </g>
          </g>
        )}

        {/* ─── DESIGN F: "chip" (Neon K Chip) ───────────────────────────────── */}
        {design === 'chip' && (
          <g>
            <path
              d="M20 4H44C56 4 60 8 60 20V44C60 56 56 60 44 60H20C8 60 4 56 4 44V20C4 8 8 4 20 4Z"
              fill={ink}
              stroke={`url(#${g1Id})`}
              strokeWidth="3.2"
            />
            <path
              d="M14 14H22M42 50H50"
              stroke={deep}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d={K_GLYPH_PATH}
              fill="none"
              stroke={kcolor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
              className="koban-anim-node"
              style={kPulseStyle}
            />
          </g>
        )}

        {/* ─── LIGHT SWEEP HIGHLIGHT (when sparkle & animated) ──────────────── */}
        {showShineAndSparkle && (
          <g clipPath={`url(#${clipId})`} pointerEvents="none">
            <rect
              x="22"
              y="-16"
              width="14"
              height="96"
              fill={`url(#${shineGradId})`}
              className="koban-anim-node"
              style={{
                transformOrigin: '32px 32px',
                animation: 'koban-shine-sweep 4.2s ease-in-out infinite',
              }}
            />
          </g>
        )}

        {/* ─── 4-POINT TWINKLING SPARKLES (only for sizes 40px and up) ──────── */}
        {showSparkles && (
          <g pointerEvents="none">
            {[
              { cx: 10, cy: 11, scale: 0.9, delay: '0s' },
              { cx: 54, cy: 12, scale: 0.75, delay: '0.9s' },
              { cx: 55, cy: 52, scale: 0.85, delay: '1.8s' },
              { cx: 9, cy: 50, scale: 0.7, delay: '2.6s' },
            ].map((sp, idx) => (
              <g
                key={idx}
                transform={`translate(${sp.cx} ${sp.cy}) scale(${sp.scale})`}
              >
                <path
                  d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z"
                  fill={light}
                  stroke="#ffffff"
                  strokeWidth="0.4"
                  className="koban-anim-node"
                  style={{
                    transformOrigin: '0px 0px',
                    animation: `koban-sparkle-twinkle 2.4s ease-in-out ${sp.delay} infinite`,
                  }}
                />
              </g>
            ))}
          </g>
        )}
      </svg>
    </span>
  );
};

export interface KobanAmountProps {
  value?: number;
  amount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | KobanIconSize;
  iconSize?: KobanIconSize;
  showLabel?: boolean;
  showPkrEquivalent?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * Formatted Koban amount with the shared <KobanIcon /> + tabular numeral formatting.
 */
export const KobanAmount: React.FC<KobanAmountProps> = ({
  value,
  amount,
  size,
  iconSize,
  showLabel = false,
  showPkrEquivalent = false,
  animated = false,
  className = '',
}) => {
  const resolvedVal = value ?? amount ?? 0;
  const safeVal = Math.max(0, Math.floor(Number(resolvedVal) || 0));
  const formatted = safeVal.toLocaleString();
  const pkr = (safeVal / 10).toLocaleString(undefined, {
    minimumFractionDigits: safeVal % 10 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

  const resolvedIconSize: KobanIconSize = iconSize ?? (
    size === 'xs' ? 14 :
    size === 'sm' ? 16 :
    size === 'md' ? 18 :
    size === 'lg' ? 24 :
    size === 'xl' ? 28 :
    typeof size === 'number' ? size : 18
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono tabular-nums font-bold ${className}`}
      title={`${formatted} Kobans (PKR ${pkr})`}
    >
      <KobanIcon size={resolvedIconSize} animated={animated} decorative />
      <span>{formatted}</span>
      {showLabel && <span className="text-[0.85em] opacity-85 font-semibold">Kobans</span>}
      {showPkrEquivalent && (
        <span className="text-[0.75em] font-normal opacity-60 ml-0.5">(PKR {pkr})</span>
      )}
    </span>
  );
};

export interface KobanChipProps {
  balance: number;
  loading?: boolean;
  onClick?: () => void;
  to?: string;
  showPlus?: boolean;
  styleOverride?: KobanStyleProps;
  className?: string;
}

/**
 * Top Bar Koban Balance Chip — animates the shared <KobanIcon /> and counts smoothly when balance changes.
 */
export const KobanChip: React.FC<KobanChipProps> = ({
  balance,
  loading = false,
  onClick,
  to = '/store',
  showPlus = true,
  styleOverride,
  className = '',
}) => {
  const [displayBalance, setDisplayBalance] = React.useState(balance);
  const [isBumping, setIsBumping] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (displayBalance === balance) return;

    setIsBumping(true);
    const diff = balance - displayBalance;
    const steps = 16;
    const stepTime = 22;
    let currentStep = 0;
    const startVal = displayBalance;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayBalance(balance);
        clearInterval(timer);
        setTimeout(() => setIsBumping(false), 250);
      } else {
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayBalance(Math.round(startVal + diff * eased));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [balance, loading, displayBalance]);

  const content = (
    <>
      <KobanIcon
        size={18}
        animated={true}
        styleOverride={styleOverride}
        decorative
        className={isBumping ? 'scale-110 transition-transform' : ''}
      />
      <span
        className={`font-mono tabular-nums text-xs font-bold tracking-tight transition-colors ${
          isBumping ? 'text-[#FFD66B]' : 'text-[var(--text)]'
        }`}
      >
        {loading ? '•••' : displayBalance.toLocaleString()}
      </span>
      {showPlus && (
        <span className="w-4 h-4 rounded-full bg-[#E8A317]/20 border border-[#E8A317]/40 flex items-center justify-center text-[#FFD66B] group-hover:bg-[#E8A317] group-hover:text-black transition-colors">
          <Plus size={10} strokeWidth={3} />
        </span>
      )}
    </>
  );

  const baseClasses = `group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-glass)] hover:bg-[var(--surface-glass-heavy)] border border-[#E8A317]/35 hover:border-[#E8A317]/60 shadow-[0_0_16px_rgba(232,163,23,0.12)] transition-all duration-200 cursor-pointer ${
    isBumping ? 'scale-105 border-[#FFD66B] shadow-[0_0_22px_rgba(255,214,107,0.35)]' : ''
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClasses}
        title="Your Kobans Balance — Click to get more"
        aria-label={`Kobans balance: ${displayBalance.toLocaleString()}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={baseClasses}
      title="Your Kobans Balance — Open Boardly Store"
      aria-label={`Kobans balance: ${displayBalance.toLocaleString()}`}
    >
      {content}
    </Link>
  );
};

/**
 * Stacked Kobans visual for bundle cards in GetKobansModal
 */
export const KobanStack: React.FC<{ count?: 1 | 2 | 3; size?: number; className?: string }> = ({
  count = 2,
  size = 24,
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <span
          key={idx}
          style={{
            marginLeft: idx === 0 ? 0 : -Math.round(size * 0.35),
            zIndex: count - idx,
          }}
          className="inline-flex"
        >
          <KobanIcon size={size} animated={false} decorative={idx > 0} />
        </span>
      ))}
    </span>
  );
};

export type { KobanStyleSettings };
export default KobanIcon;
