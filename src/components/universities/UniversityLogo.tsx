import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface UniversityLogoProps {
  src: string;
  alt: string;
  className?: string;
}

export const UniversityLogo: React.FC<UniversityLogoProps> = ({
  src,
  alt,
  className = 'w-12 h-12 rounded-2xl',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`${className} bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 shadow-xs`}
        title={alt}
      >
        <GraduationCap className="w-1/2 h-1/2 text-indigo-600" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="eager"
      onError={() => setHasError(true)}
      className={`${className} object-contain bg-white p-1 border border-slate-200/80 shadow-xs`}
    />
  );
};
