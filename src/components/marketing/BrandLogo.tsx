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
  const iconHeightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8',
    lg: 'h-8 sm:h-9',
    xl: 'h-9 sm:h-10',
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img
        src={BOARDLY_LOGO_TRANSPARENT}
        alt="Boardly Logo"
        className={`${iconHeightClasses[size] || 'h-8'} w-auto object-contain`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = '/assets/boardly-logo-transparent.png';
        }}
      />
      <span
        className={`${textClasses[size] || 'text-xl'} font-bold tracking-tight ${
          light ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}
      >
        Board<span className={light ? 'text-indigo-500' : 'text-indigo-600 dark:text-indigo-400'}>ly</span>
      </span>
    </div>
  );
};
