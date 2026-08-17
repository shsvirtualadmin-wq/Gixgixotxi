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
  logoUrl = 'https://i.ibb.co/ymPFp2Wb/Chat-Box-1256234838.jpg',
}) => {
  // Dimensions for ring and logo image based on size
  const sizeConfig = {
    xs: { outer: 'w-6 h-6', ringWidth: 'border-2', logo: 'w-3.5 h-3.5', padding: 'p-0.5' },
    sm: { outer: 'w-8 h-8', ringWidth: 'border-2', logo: 'w-5 h-5', padding: 'p-0.5' },
    md: { outer: 'w-12 h-12', ringWidth: 'border-3', logo: 'w-7 h-7', padding: 'p-1' },
    lg: { outer: 'w-16 h-16', ringWidth: 'border-4', logo: 'w-9 h-9', padding: 'p-1' },
    xl: { outer: 'w-24 h-24', ringWidth: 'border-[5px]', logo: 'w-14 h-14', padding: 'p-1.5' },
  }[size];

  const spinnerContent = (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}>
      <div className={`relative flex items-center justify-center ${sizeConfig.outer} shrink-0`}>
        {/* Outer glowing ambient background ring */}
        <div className="absolute inset-0 rounded-full bg-[#1E5AFF]/15  blur-sm animate-pulse" />
        
        {/* Background base track ring */}
        <div className={`absolute inset-0 rounded-full ${sizeConfig.ringWidth} border-[#0A1330]/10 `} />

        {/* Rotating branded gradient electric blue & navy arc */}
        <div
          className={`absolute inset-0 rounded-full ${sizeConfig.ringWidth} border-transparent border-t-[#1E5AFF] border-r-[#0A1330]  animate-spin`}
        />

        {/* Inner logo badge container with breathing logo */}
        <div
          className={`${sizeConfig.logo} rounded-full overflow-hidden bg-[#0A1330] border border-[#1E5AFF]/50 shadow-md flex items-center justify-center animate-logo-breath z-10 shrink-0`}
        >
          <img
            src={logoUrl}
            alt="Boardly Logo"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/watermark-logo.png';
            }}
          />
        </div>
      </div>

      {label && (
        <div className="flex flex-col items-center gap-1">
          <p className="font-['Space_Grotesk'] font-extrabold text-sm sm:text-base text-slate-900  tracking-wide">
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-500  font-medium max-w-xs leading-relaxed">
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[300] bg-[#F8F9FB]  text-slate-900  flex flex-col items-center justify-center p-4 selection:bg-[#1E5AFF] selection:text-white">
        <div className="relative z-10 bg-white/80  border border-slate-200/80  rounded-3xl p-8 max-w-sm w-full shadow-2xl backdrop-blur-xl flex flex-col items-center gap-5 text-center animate-ios-spring">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return spinnerContent;
};
