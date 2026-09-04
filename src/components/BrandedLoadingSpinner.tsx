import React from 'react';

export interface BrandedLoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
  className?: string;
  logoUrl?: string;
}

export const BrandedLoadingSpinner: React.FC<BrandedLoadingSpinnerProps> = () => {
  return null;
};
