import React, { useState, useEffect } from 'react';
import { RotatingQuote } from './RotatingQuote';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface HeaderLogoProps {
  onClick?: () => void;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  isIntro?: boolean;
  currentUserEmail?: string;
}

const WORDS = ['Learn.', 'Grow.', 'Archive.', 'BOARDLY'];

export const HeaderLogo: React.FC<HeaderLogoProps> = ({
  onClick,
  subtitle,
  size = 'lg',
  isIntro = true,
  currentUserEmail,
}) => {
  const { logoUrl } = useSiteSettings();
  const [wordIndex, setWordIndex] = useState(0);
  const [wordOpacity, setWordOpacity] = useState(1);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  useEffect(() => {
    let nextWordTimer: NodeJS.Timeout;

    // Continuous smooth looping sequence (1400ms per word cycle)
    const interval = setInterval(() => {
      setWordOpacity(0);

      nextWordTimer = setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % WORDS.length);
        setWordOpacity(1);
      }, 220);
    }, 1400);

    return () => {
      clearInterval(interval);
      clearTimeout(nextWordTimer);
    };
  }, []);

  const currentWord = WORDS[wordIndex];

  const badgeSizeClass = size === 'sm' ? 'w-9 h-9 p-0.5 rounded-xl' : size === 'md' ? 'w-12 h-12 p-1 rounded-2xl' : 'w-14 h-14 p-1 rounded-2xl';

  return (
    <div
      className="logo-wrap flex flex-col items-center justify-center mb-1.5 sm:mb-2 cursor-pointer group select-none"
      onClick={handleClick}
    >
      {/* Custom or Monogram Logo Image Badge */}
      <div className={`${badgeSizeClass} mb-2 bg-[#0A1330] border-2 border-[#1E5AFF]/40 shadow-[0_0_16px_rgba(30,90,255,0.25)] group-hover:shadow-[0_0_24px_rgba(30,90,255,0.5)] group-hover:border-[#1E5AFF] group-hover:scale-105 transition-all duration-300 overflow-hidden flex items-center justify-center`}>
        <img
          src={logoUrl || "https://pub-51ccade1f191417389ac7df61830c670.r2.dev/logo_clean_square.png"}
          alt="Boardly Logo"
          className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = '/logo.png';
          }}
        />
      </div>

      {/* Brand Title */}
      <div className="flex flex-col items-center justify-center gap-0.5">
        <h1
          className="font-black text-2xl sm:text-3xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#0A1330] via-[#1E5AFF] to-[#0A1330]    filter drop-shadow-[0_1px_3px_rgba(10,19,48,0.2)] "
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          BOARDLY
        </h1>

        {/* Moved subtle tagline: Animated cycling words (Learn, Grow, Archive, BOARDLY) */}
        <div className="h-4 sm:h-5 flex items-center justify-center">
          <span
            className={`text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase transition-all duration-300 ${
              wordOpacity === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            } text-blue-900/80  flex items-center gap-1.5`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5AFF] animate-pulse shrink-0" />
            <span>{currentWord}</span>
          </span>
        </div>
      </div>

      {/* Main Spot: Rotating Quote Component */}
      <RotatingQuote />

      {/* Subtitle Badge */}
      <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-blue-900  bg-blue-500/15  border border-blue-600/30  px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-center">
        {subtitle || 'Official Portal of SHS Virtual Academy'}
      </span>
    </div>
  );
};


