import React, { useState } from 'react';
import { University, findUniversity } from '../data/universities';

interface UniversityLogoBadgeProps {
  university?: University | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

const SIZE_CONFIGS = {
  xs: {
    container: 'w-6 h-6',
    img: 'w-4 h-4',
    text: 'text-[9px]',
  },
  sm: {
    container: 'w-8 h-8',
    img: 'w-5 h-5',
    text: 'text-[10px]',
  },
  md: {
    container: 'w-12 h-12',
    img: 'w-8 h-8',
    text: 'text-xs',
  },
  lg: {
    container: 'w-14 h-14 sm:w-16 sm:h-16',
    img: 'w-9 h-9 sm:w-11 sm:h-11',
    text: 'text-xs sm:text-sm font-black',
  },
  xl: {
    container: 'w-20 h-20',
    img: 'w-14 h-14',
    text: 'text-base font-black',
  },
};

export const UniversityLogoBadge: React.FC<UniversityLogoBadgeProps> = ({
  university,
  size = 'md',
  className = '',
  showName = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const resolvedUni = typeof university === 'string' ? findUniversity(university) : university;
  const shortName = resolvedUni?.shortName || (typeof university === 'string' ? university : 'UNI');
  const logoUrl = resolvedUni?.logo || '';
  const fullName = resolvedUni?.fullName || shortName;

  const sizeCfg = SIZE_CONFIGS[size];

  // Derive compact initials (max 3 chars)
  const initials = shortName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase() || shortName.substring(0, 3).toUpperCase();

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeCfg.container} rounded-full bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0 transition-transform duration-200`}
        title={fullName}
      >
        {!imgError && logoUrl ? (
          <img
            src={logoUrl}
            alt={`${shortName} logo`}
            loading="lazy"
            decoding="async"
            className={`${sizeCfg.img} object-contain`}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={`font-poppins font-black text-indigo-700 tracking-tight select-none ${sizeCfg.text}`}>
            {initials}
          </span>
        )}
      </div>

      {showName && (
        <span className="text-sm font-bold text-slate-800 truncate">
          {shortName}
        </span>
      )}
    </div>
  );
};
