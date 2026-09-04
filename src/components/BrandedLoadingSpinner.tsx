import React from 'react';

export interface BrandedLoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
  className?: string;
  logoUrl?: string;
}

export const BrandedLoadingSpinner: React.FC<BrandedLoadingSpinnerProps> = ({
  size = 'md',
  label,
  sublabel,
  fullScreen = false,
  className = '',
  logoUrl = '/logo.png',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 border-2',
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-3',
    xl: 'w-20 h-20 border-4',
  }[size] || 'w-12 h-12 border-3';

  const logoSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  }[size] || 'w-6 h-6';

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3.5 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className={`${sizeClasses} rounded-full border-slate-200 border-t-[#1E5AFF] animate-spin`} />
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Boardly"
            className={`${logoSizes} absolute object-contain`}
          />
        )}
      </div>
      {(label || sublabel) && (
        <div className="space-y-1">
          {label && (
            <h2 className="font-['Space_Grotesk'] font-bold text-sm sm:text-base text-slate-800">
              {label}
            </h2>
          )}
          {sublabel && (
            <p className="text-xs text-slate-500">
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-dvh h-dvh sm:min-h-screen bg-[#F8F9FB] text-slate-900 flex flex-col items-center justify-center p-4 relative">
        {content}
      </div>
    );
  }

  return content;
};
