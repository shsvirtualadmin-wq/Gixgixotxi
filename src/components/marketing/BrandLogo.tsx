import React from 'react';

export const BOARDLY_LOGO_TRANSPARENT = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000028e88211b439a564acc83f64.png';
export const BOARDLY_LOGO_SOLID = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000e98c8211a04e8f3473512ef4.png';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  light?: boolean;
  variant?: 'light' | 'dark';
  iconOnly?: boolean;
  showCrewBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  light = false,
  variant,
  iconOnly = false,
  showCrewBadge = false,
}) => {
  const isDarkBg = light || variant === 'dark';

  const iconHeightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-7 sm:h-8',
    lg: 'h-8 sm:h-9',
    xl: 'h-9 sm:h-10',
  };

  const textClasses = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  };

  return (
    <div className={`flex items-center gap-2 select-none shrink-0 ${className}`}>
      {/* Brand Icon [B logo] */}
      <img
        src="/assets/boardly-logo-transparent.png"
        alt="Boardly"
        className={`${iconHeightClasses[size] || 'h-8'} w-auto object-contain shrink-0`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = '/assets/boardly-logo-solid.png';
        }}
      />
      {/* Single Wordmark with crisp contrast */}
      {!iconOnly && (
        <span
          className={`${textClasses[size] || 'text-xl'} font-bold tracking-normal font-display ${
            isDarkBg ? 'text-white' : 'text-slate-900'
          }`}
        >
          Board<span className={isDarkBg ? 'text-violet-400' : 'text-indigo-600'}>ly</span>
        </span>
      )}
      {/* Optional Violet CREW Pill */}
      {showCrewBadge && (
        <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.08em] bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm border border-violet-400/30 shrink-0">
          CREW
        </span>
      )}
    </div>
  );
};

