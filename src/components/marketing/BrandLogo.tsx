import React from 'react';

export const BOARDLY_LOGO_TRANSPARENT = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000028e88211b439a564acc83f64.png';
export const BOARDLY_LOGO_SOLID = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000e98c8211a04e8f3473512ef4.png';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  light?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  light = false,
}) => {
  const heightClasses = {
    sm: 'h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-9 sm:h-10',
    xl: 'h-11 sm:h-12',
  };

  return (
    <img
      src={BOARDLY_LOGO_TRANSPARENT}
      alt="Boardly Logo"
      className={`${heightClasses[size] || 'h-8 sm:h-9'} w-auto object-contain select-none transition-transform duration-200 ${light ? 'brightness-0 invert' : ''} ${className}`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        target.src = '/assets/boardly-logo-transparent.png';
      }}
    />
  );
};
