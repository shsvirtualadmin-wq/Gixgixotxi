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
}) => {
  const sizeConfig = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-12 h-12 border-3',
  }[size];

  const spinnerContent = (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}>
      <div
        className={`${sizeConfig} border-slate-200 border-t-[#1E5AFF] rounded-full animate-spin shrink-0`}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <div className="flex flex-col items-center gap-1">
          <p className="font-['Space_Grotesk'] font-bold text-sm text-slate-800 tracking-tight">
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-500 font-normal max-w-xs leading-relaxed">
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[300] bg-[#F8F9FB] text-slate-900 flex flex-col items-center justify-center p-4">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};
