import React, { useEffect, useRef, useState } from 'react';
import { useSmoothMode } from '@/utils/smoothMode';
import { BANNER_BATCH_1 } from './batch1';
import { BANNER_BATCH_2 } from './batch2';
import { BANNER_BATCH_3 } from './batch3';
import { BANNER_BATCH_4 } from './batch4';
import { BANNER_BATCH_5 } from './batch5';
import {
  MidnightToriiBanner,
  KyotoRainBanner,
  GoldenHourLibraryBanner,
  SakuraDuskBanner,
  ObsidianCircuitBanner,
  AuroraFrostBanner,
  StarfallBanner,
  EmberDriftBanner,
  NeonRainCityBanner,
  KoiPondBanner,
  LiquidAuroraBanner,
  CosmicGateBanner,
} from './flagshipBanners';
import {
  CrimsonDragonsDescentBanner,
  NeonKyotoRainBanner,
  BloodMoonRoninBanner,
  CelestialKoiRiverBanner,
  ObsidianShogunCitadelBanner,
} from './premiumBanners';

// Flagship & New Premium custom banners mapping
const FLAGSHIP_BANNER_MAP: Record<string, (animated: boolean) => React.ReactNode> = {
  // 5 New Premium Banners
  ban_crimson_dragons_descent: (animated: boolean) => <CrimsonDragonsDescentBanner canAnimate={animated} />,
  ban_neon_kyoto_rain: (animated: boolean) => <NeonKyotoRainBanner canAnimate={animated} />,
  ban_blood_moon_ronin: (animated: boolean) => <BloodMoonRoninBanner canAnimate={animated} />,
  ban_celestial_koi_river: (animated: boolean) => <CelestialKoiRiverBanner canAnimate={animated} />,
  ban_obsidian_shogun_citadel: (animated: boolean) => <ObsidianShogunCitadelBanner canAnimate={animated} />,

  // Static 6
  ban_midnight_torii: () => <MidnightToriiBanner />,
  ban_kyoto_rain: () => <KyotoRainBanner />,
  ban_golden_hour_library: () => <GoldenHourLibraryBanner />,
  ban_sakura_dusk: () => <SakuraDuskBanner />,
  ban_obsidian_circuit: () => <ObsidianCircuitBanner />,
  ban_aurora_frost: () => <AuroraFrostBanner />,

  // Animated 6
  ban_starfall: (animated: boolean) => <StarfallBanner canAnimate={animated} />,
  ban_ember_drift: (animated: boolean) => <EmberDriftBanner canAnimate={animated} />,
  ban_neon_rain_city: (animated: boolean) => <NeonRainCityBanner canAnimate={animated} />,
  ban_koi_pond: (animated: boolean) => <KoiPondBanner canAnimate={animated} />,
  ban_liquid_aurora: (animated: boolean) => <LiquidAuroraBanner canAnimate={animated} />,
  ban_cosmic_gate: (animated: boolean) => <CosmicGateBanner canAnimate={animated} />,
};

export const BANNER_ARTWORK_MAP: Record<string, (animated: boolean) => React.ReactNode> = {
  ...BANNER_BATCH_1,
  ...BANNER_BATCH_2,
  ...BANNER_BATCH_3,
  ...BANNER_BATCH_4,
  ...BANNER_BATCH_5,
  ...FLAGSHIP_BANNER_MAP,
};

export const ACCENT_PRESETS = [
  { id: 'boardly-red', label: 'Boardly Red', hex: '#D71921' },
  { id: 'crimson-ember', label: 'Crimson Ember', hex: '#EF4444' },
  { id: 'cyber-cyan', label: 'Cyber Cyan', hex: '#00F0FF' },
  { id: 'electric-gold', label: 'Electric Gold', hex: '#F59E0B' },
  { id: 'sakura-pink', label: 'Sakura Pink', hex: '#F472B6' },
  { id: 'emerald-jade', label: 'Emerald Jade', hex: '#10B981' },
  { id: 'cosmic-violet', label: 'Cosmic Violet', hex: '#A855F7' },
  { id: 'deep-indigo', label: 'Deep Indigo', hex: '#6366F1' },
];

export interface BannerRendererProps {
  bannerId?: string | null;
  accentColor?: string | null;
  animated?: boolean;
  className?: string;
  forceStatic?: boolean;
  showReadabilityOverlay?: boolean;
}

/**
 * Default Boardly cover banner: Signature maroon gradient with dotted matrix pattern.
 * Used whenever no custom banner is equipped.
 */
export const DefaultDotMatrixBanner: React.FC<{
  accentColor?: string | null;
  className?: string;
  showReadabilityOverlay?: boolean;
}> = ({
  accentColor = '#D71921',
  className = '',
  showReadabilityOverlay = false,
}) => {
  const safeColor = accentColor || '#D71921';
  return (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 ${className}`}>
      {/* Background Dot-Matrix Grid over Deep Maroon Gradient */}
      <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        <defs>
          <linearGradient id="def_maroon_base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1E0305" />
            <stop offset="45%" stopColor="#2E080C" />
            <stop offset="85%" stopColor="#180204" />
            <stop offset="100%" stopColor="#0B0102" />
          </linearGradient>

          <radialGradient id="def_maroon_glow" cx="80%" cy="20%" r="60%">
            <stop offset="0%" stopColor={safeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <pattern id="default_dot_matrix" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.5" fill={safeColor} opacity="0.32" />
          </pattern>
        </defs>

        <rect width="900" height="300" fill="url(#def_maroon_base)" />
        <rect width="900" height="300" fill="url(#def_maroon_glow)" />
        <rect width="900" height="300" fill="url(#default_dot_matrix)" />

        {/* Clean geometric grid line accents */}
        <line x1="0" y1="298" x2="900" y2="298" stroke={safeColor} strokeWidth="2" opacity="0.4" />
        <circle cx="850" cy="50" r="60" fill="none" stroke={safeColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
      </svg>

      {showReadabilityOverlay && (
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/40 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

/**
 * Performance-governed Banner Renderer.
 * - IntersectionObserver pauses offscreen animations
 * - document.visibilityState pauses background tab animations
 * - prefers-reduced-motion media query disables motion
 */
export const BannerRenderer: React.FC<BannerRendererProps> = ({
  bannerId,
  accentColor,
  animated = true,
  className = '',
  forceStatic = false,
  showReadabilityOverlay = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // 1. Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(media.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } catch {
      // ignore
    }
  }, []);

  // 2. Track tab visibility
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // 3. Track element intersection
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsIntersecting(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.05, rootMargin: '100px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { smoothMode } = useSmoothMode();

  const canAnimate =
    animated &&
    !forceStatic &&
    !smoothMode &&
    !prefersReducedMotion &&
    isTabVisible &&
    isIntersecting;

  // Custom Banner lookup
  if (bannerId && BANNER_ARTWORK_MAP[bannerId]) {
    const renderArtwork = BANNER_ARTWORK_MAP[bannerId];
    return (
      <div ref={containerRef} className={`relative w-full h-full overflow-hidden bg-neutral-950 ${className}`}>
        {renderArtwork(canAnimate)}
        {showReadabilityOverlay && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/40 to-transparent pointer-events-none z-10" />
        )}
      </div>
    );
  }

  // Fallback to signature Maroon Dot-Matrix Banner
  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <DefaultDotMatrixBanner
        accentColor={accentColor}
        showReadabilityOverlay={showReadabilityOverlay}
      />
    </div>
  );
};
