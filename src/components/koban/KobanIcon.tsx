import React, { useEffect, useState, useRef } from 'react';

export type KobanIconSize = 14 | 16 | 18 | 20 | 24 | 28 | 32 | 40 | 48 | 64 | number;

interface KobanIconProps {
  size?: KobanIconSize;
  className?: string;
  tilt?: boolean;
  animated?: boolean; // hero shine sweep
}

/**
 * Original oval "koban"-style coin tilted 15 degrees.
 * Gold gradient (#FFD66B -> #E8A317 -> #B8740A), thin Boardly-red rim (#D71920),
 * faint dot-matrix surface texture, and a dot-matrix "K" made of round dots in the center.
 */
export const KobanIcon: React.FC<KobanIconProps> = ({
  size = 24,
  className = '',
  tilt = true,
  animated = false,
}) => {
  const isHero = size >= 48 || animated;
  const numSize = typeof size === 'number' ? size : 24;
  // Aspect ratio: width to height is ~ 28:36 (classic Japanese koban oblong)
  const width = Math.round(numSize * 0.82);
  const height = numSize;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: height,
        height: height,
        verticalAlign: 'middle',
      }}
    >
      <svg
        viewBox="0 0 32 42"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: tilt ? 'rotate(15deg)' : 'none',
          transformOrigin: 'center center',
          filter: isHero ? 'drop-shadow(0 2px 6px rgba(215, 25, 33, 0.28))' : 'none',
        }}
        aria-hidden="true"
      >
        <defs>
          {/* Authentic Gold Gradient */}
          <linearGradient id="koban-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF0A0" />
            <stop offset="25%" stopColor="#FFD66B" />
            <stop offset="65%" stopColor="#E8A317" />
            <stop offset="100%" stopColor="#B8740A" />
          </linearGradient>

          {/* Inner Coin Ridge Shadow */}
          <linearGradient id="koban-inner-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#E8A317" stopOpacity="0" />
            <stop offset="100%" stopColor="#8C4D00" stopOpacity="0.5" />
          </linearGradient>

          {/* Clip path for oval coin */}
          <clipPath id="koban-clip">
            <rect x="2" y="2" width="28" height="38" rx="14" ry="14" />
          </clipPath>
        </defs>

        {/* Outer Red Rim (Boardly Red #D71920) */}
        <rect
          x="1"
          y="1"
          width="30"
          height="40"
          rx="15"
          ry="15"
          fill="url(#koban-gold-grad)"
          stroke="#D71920"
          strokeWidth="1.5"
        />

        {/* Inner Coin Surface */}
        <rect
          x="3"
          y="3"
          width="26"
          height="36"
          rx="13"
          ry="13"
          fill="url(#koban-gold-grad)"
          stroke="#B8740A"
          strokeWidth="0.8"
        />

        {/* Inner lighting glow */}
        <rect
          x="3"
          y="3"
          width="26"
          height="36"
          rx="13"
          ry="13"
          fill="url(#koban-inner-shadow)"
          clipPath="url(#koban-clip)"
        />

        {/* Faint Horizontal Texture Ridges (Traditional Koban Mint Marks) */}
        <g stroke="#C68010" strokeWidth="0.6" strokeOpacity="0.45" strokeDasharray="1.2 1.8">
          <line x1="7" y1="8" x2="25" y2="8" />
          <line x1="6" y1="12" x2="26" y2="12" />
          <line x1="5" y1="16" x2="27" y2="16" />
          <line x1="5" y1="26" x2="27" y2="26" />
          <line x1="6" y1="30" x2="26" y2="30" />
          <line x1="7" y1="34" x2="25" y2="34" />
        </g>

        {/* Central Dot-Matrix "K" */}
        {/* Left vertical column (5 dots) */}
        <circle cx="11.5" cy="15" r="1.1" fill="#4A2600" />
        <circle cx="11.5" cy="18" r="1.1" fill="#4A2600" />
        <circle cx="11.5" cy="21" r="1.1" fill="#4A2600" />
        <circle cx="11.5" cy="24" r="1.1" fill="#4A2600" />
        <circle cx="11.5" cy="27" r="1.1" fill="#4A2600" />

        {/* Center join */}
        <circle cx="15" cy="21" r="1.1" fill="#4A2600" />

        {/* Diagonal up */}
        <circle cx="18" cy="18" r="1.1" fill="#4A2600" />
        <circle cx="21" cy="15" r="1.1" fill="#4A2600" />

        {/* Diagonal down */}
        <circle cx="18" cy="24" r="1.1" fill="#4A2600" />
        <circle cx="21" cy="27" r="1.1" fill="#4A2600" />

        {/* Hero Shine Sweep Animation (Only for >=48px and not reduced motion) */}
        {isHero && (
          <rect
            x="-40"
            y="-10"
            width="25"
            height="70"
            fill="url(#koban-gold-grad)"
            opacity="0.45"
            clipPath="url(#koban-clip)"
            className="koban-shine-sweep"
            style={{
              mixBlendMode: 'overlay',
              filter: 'blur(3px)',
            }}
          />
        )}
      </svg>
    </span>
  );
};

interface KobanAmountProps {
  value?: number;
  amount?: number;
  iconSize?: KobanIconSize;
  size?: string | number;
  className?: string;
  showIcon?: boolean;
  prefix?: string;
}

/**
 * Displays a formatted Koban amount with coin icon and thousands separator (e.g. 1,250).
 */
export const KobanAmount: React.FC<KobanAmountProps> = ({
  value,
  amount,
  iconSize = 16,
  size,
  className = '',
  showIcon = true,
  prefix = '',
}) => {
  const actualVal = value ?? amount ?? 0;
  const numSize = typeof size === 'number' ? size : typeof iconSize === 'number' ? iconSize : 16;
  const formatted = Math.max(0, Math.floor(actualVal || 0)).toLocaleString('en-US');

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold tracking-tight ${className}`}>
      {showIcon && <KobanIcon size={numSize} />}
      <span>
        {prefix}
        {formatted}
      </span>
    </span>
  );
};

export interface KobanChipProps {
  balance: number;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  as?: 'button' | 'span' | 'div';
}

/**
 * Koban Balance Chip pill: Displays oval coin and animated count with thousands separator.
 * Renders as a <span> by default (when no onClick is passed) to prevent invalid DOM nesting
 * when placed inside <button> or <a> links.
 */
export const KobanChip: React.FC<KobanChipProps> = ({
  balance,
  onClick,
  className = '',
  loading = false,
  as,
}) => {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const prevBalanceRef = useRef(balance);

  // Animated count-up when balance changes
  useEffect(() => {
    if (prevBalanceRef.current === balance) return;
    const start = prevBalanceRef.current;
    const end = balance;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * eased);
      setDisplayBalance(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevBalanceRef.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [balance]);

  const safeBalance = Number.isFinite(Number(displayBalance)) ? Math.max(0, Math.floor(Number(displayBalance))) : 0;
  const content = (
    <>
      <KobanIcon size={18} />
      <span
        className="font-mono tabular-nums text-xs font-bold"
        style={{ color: 'var(--cw-gold, #f5c542)' }}
      >
        {loading ? '0' : safeBalance.toLocaleString('en-US')}
      </span>
    </>
  );

  const baseStyles = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--cw-glass-fill)] border border-[rgba(232,163,23,0.35)] shadow-xs ${className}`;

  if (onClick || as === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`${baseStyles} hover:border-[#E8A317] transition-all ${
          onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'
        }`}
        title="Koban Balance"
      >
        {content}
      </button>
    );
  }

  return (
    <span className={`${baseStyles} cursor-default`} title="Koban Balance">
      {content}
    </span>
  );
};

interface KobanStackProps {
  size?: number;
  count?: number;
}

/**
 * Stack of 3 Koban coins for amounts >= 1,000 Kobans.
 */
export const KobanStack: React.FC<KobanStackProps> = ({ size = 28, count = 3 }) => {
  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size * 1.5, height: size }}
      aria-hidden="true"
    >
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <span
          key={i}
          className="absolute transition-transform"
          style={{
            left: `${i * 7}px`,
            top: `${(2 - i) * 2}px`,
            zIndex: i + 1,
          }}
        >
          <KobanIcon size={size} tilt={i === 2} />
        </span>
      ))}
    </div>
  );
};
