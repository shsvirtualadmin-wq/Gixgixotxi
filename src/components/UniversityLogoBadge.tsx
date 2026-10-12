import React, { useState, useEffect } from 'react';
import { University, findUniversity } from '../data/universities';
import { getUniversityLogo, isTargetUniversity } from '../lib/universityLogos';

interface UniversityLogoBadgeProps {
  university?: (University & { abbreviation?: string }) | string | any;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
  loading?: 'eager' | 'lazy';
}

const SIZE_CONFIGS = {
  xs: {
    container: 'w-6 h-6',
    img: 'w-4 h-4',
    dimension: 16,
    text1to2: 'text-[10px]',
    text3: 'text-[8.5px]',
    text4plus: 'text-[7px]',
  },
  sm: {
    container: 'w-8 h-8',
    img: 'w-5 h-5',
    dimension: 20,
    text1to2: 'text-xs',
    text3: 'text-[10px]',
    text4plus: 'text-[8px]',
  },
  md: {
    container: 'w-12 h-12',
    img: 'w-8 h-8',
    dimension: 32,
    text1to2: 'text-sm',
    text3: 'text-xs',
    text4plus: 'text-[10px]',
  },
  lg: {
    container: 'w-14 h-14 sm:w-16 sm:h-16',
    img: 'w-9 h-9 sm:w-11 sm:h-11',
    dimension: 44,
    text1to2: 'text-base sm:text-lg',
    text3: 'text-xs sm:text-sm',
    text4plus: 'text-[10px] sm:text-xs',
  },
  xl: {
    container: 'w-20 h-20',
    img: 'w-14 h-14',
    dimension: 56,
    text1to2: 'text-xl',
    text3: 'text-base',
    text4plus: 'text-xs',
  },
};

/**
 * Extracts abbreviation / initials according to rules:
 * 1. If university has abbreviation or shortName, use that.
 * 2. If no short name is provided, take the first letter of each major word in full name (e.g. "Air University" -> "AU").
 */
export function getUniversityInitials(uniData?: any, fallbackStr?: string): string {
  // Check explicit abbreviation or shortName on the object
  const abbreviation = uniData?.abbreviation || uniData?.shortName;
  if (abbreviation && typeof abbreviation === 'string' && abbreviation.trim()) {
    const clean = abbreviation.trim();
    // If it's already an abbreviation (e.g. DUHS, KMU, SZABMU, NUST), return it
    return clean;
  }

  const rawName = uniData?.fullName || uniData?.name || fallbackStr || '';
  if (!rawName.trim()) {
    return 'U';
  }

  // Major stop words to ignore when extracting initials from full name
  const stopWords = new Set(['of', 'and', '&', 'for', 'the', 'in', 'at', 'on', 'to']);
  const words = rawName
    .replace(/[()[\]{}:;,.-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w: string) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) {
    return rawName.slice(0, 3).toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }

  // First letter of each major word (e.g., "Air University" -> "AU")
  const initials = words.map((w: string) => w[0].toUpperCase()).join('');
  return initials.slice(0, 5);
}

/**
 * Generates a deterministic, vibrant background gradient for each university
 */
const BG_PALETTES = [
  'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white',
  'bg-gradient-to-br from-blue-600 to-blue-800 text-white',
  'bg-gradient-to-br from-violet-600 to-purple-800 text-white',
  'bg-gradient-to-br from-teal-600 to-teal-800 text-white',
  'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white',
  'bg-gradient-to-br from-cyan-600 to-blue-700 text-white',
  'bg-gradient-to-br from-sky-600 to-indigo-700 text-white',
  'bg-gradient-to-br from-slate-700 to-slate-900 text-white',
];

function getPaletteForString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % BG_PALETTES.length;
  return BG_PALETTES[index];
}

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
  const fullName = resolvedUni?.fullName || (resolvedUni as any)?.name || shortName;
  const uniId = resolvedUni?.id || (typeof university === 'string' ? university.toLowerCase() : 'uni');

  // Check central university logo mapping for the 5 target universities
  const candidateIdentifier = typeof university === 'string' ? university : (resolvedUni?.fullName || resolvedUni?.name || resolvedUni?.shortName || resolvedUni?.id || '');
  const mappedTargetLogo = getUniversityLogo(candidateIdentifier);
  const isTarget = isTargetUniversity(candidateIdentifier);

  const logoUrl = isTarget && mappedTargetLogo
    ? mappedTargetLogo
    : (resolvedUni?.logo || (resolvedUni as any)?.logoUrl || mappedTargetLogo || '');

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

  // Compute initials and styling
  const initials = getUniversityInitials(resolvedUni, typeof university === 'string' ? university : undefined);
  const colorClass = getPaletteForString(uniId || shortName || 'uni');

  // Choose font size based on length of initials
  const fontSizeClass =
    initials.length <= 2
      ? sizeCfg.text1to2
      : initials.length === 3
      ? sizeCfg.text3
      : sizeCfg.text4plus;

  const showImage = !hasFailed && Boolean(logoUrl && logoUrl.trim());

  // Target universities display on a rounded square (rounded-xl) with lazy loading
  const containerShapeClass = isTarget ? 'rounded-xl' : 'rounded-full';
  const imgLoading = isTarget ? 'lazy' : loading;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeCfg.container} ${containerShapeClass} bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0 transition-transform duration-200`}
        title={fullName}
      >
        {showImage ? (
          <img
            key={`${uniId}-${retryCount}`}
            src={imageSrc}
            alt={`${shortName} logo`}
            width={sizeCfg.dimension}
            height={sizeCfg.dimension}
            loading={imgLoading}
            decoding="async"
            style={{ objectFit: 'contain' }}
            className={`${sizeCfg.img} object-contain`}
            onError={handleImageError}
          />
        ) : (
          <div
            className={`w-full h-full ${containerShapeClass} ${colorClass} flex items-center justify-center font-black tracking-tight select-none shadow-inner`}
            aria-label={`${shortName} abbreviation`}
          >
            <span className={`${fontSizeClass} font-black uppercase text-center leading-none px-0.5`}>
              {initials}
            </span>
          </div>
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
