import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import { University, findUniversity } from '../data/universities';

interface UniversityLogoBadgeProps {
  university?: University | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
  loading?: 'eager' | 'lazy';
}

const SIZE_CONFIGS = {
  xs: {
    container: 'w-6 h-6',
    img: 'w-4 h-4',
    icon: 'w-3.5 h-3.5',
    dimension: 16,
  },
  sm: {
    container: 'w-8 h-8',
    img: 'w-5 h-5',
    icon: 'w-4 h-4',
    dimension: 20,
  },
  md: {
    container: 'w-12 h-12',
    img: 'w-8 h-8',
    icon: 'w-6 h-6',
    dimension: 32,
  },
  lg: {
    container: 'w-14 h-14 sm:w-16 sm:h-16',
    img: 'w-9 h-9 sm:w-11 sm:h-11',
    icon: 'w-7 h-7 sm:w-8 sm:h-8',
    dimension: 44,
  },
  xl: {
    container: 'w-20 h-20',
    img: 'w-14 h-14',
    icon: 'w-10 h-10',
    dimension: 56,
  },
};

export const UniversityLogoBadge: React.FC<UniversityLogoBadgeProps> = ({
  university,
  size = 'md',
  className = '',
  showName = false,
  loading = 'eager',
}) => {
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  const resolvedUni = typeof university === 'string' ? findUniversity(university) : university;
  const shortName = resolvedUni?.shortName || (typeof university === 'string' ? university : 'University');
  const logoUrl = resolvedUni?.logo || '';
  const fullName = resolvedUni?.fullName || shortName;
  const uniId = resolvedUni?.id || (typeof university === 'string' ? university.toLowerCase() : 'uni');

  const sizeCfg = SIZE_CONFIGS[size];

  // Reset error & retry state immediately whenever the university or logoUrl changes
  useEffect(() => {
    setRetryCount(0);
    setHasFailed(false);
  }, [logoUrl, uniId]);

  const handleImageError = () => {
    if (retryCount < 1) {
      // Retry once before falling back
      setRetryCount((prev) => prev + 1);
    } else {
      setHasFailed(true);
    }
  };

  const imageSrc = retryCount > 0
    ? `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}retry=${retryCount}`
    : logoUrl;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeCfg.container} rounded-full bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0 transition-transform duration-200`}
        title={fullName}
      >
        {!hasFailed && logoUrl ? (
          <img
            key={`${uniId}-${retryCount}`}
            src={imageSrc}
            alt={`${shortName} logo`}
            width={sizeCfg.dimension}
            height={sizeCfg.dimension}
            loading={loading}
            decoding="async"
            style={{ objectFit: 'contain' }}
            className={`${sizeCfg.img} object-contain`}
            onError={handleImageError}
          />
        ) : (
          <GraduationCap
            className={`${sizeCfg.icon} text-indigo-600 shrink-0`}
            aria-label={`${shortName} insignia`}
          />
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
