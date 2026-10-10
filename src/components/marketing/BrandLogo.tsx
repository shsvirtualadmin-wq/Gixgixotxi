import React from 'react';

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
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const navyColor = light ? 'text-white' : 'text-[#0A1330]';
  const indigoColor = light ? 'text-indigo-400' : 'text-indigo-600';

  return (
    <span
      className={`font-poppins font-bold tracking-normal inline-block leading-none select-none p-0 m-0 ${sizeClasses[size]} ${className}`}
    ><span className={`${navyColor} transition-colors p-0 m-0`}>Board</span><span className={`${indigoColor} transition-colors p-0 m-0`}>ly</span></span>
  );
};
