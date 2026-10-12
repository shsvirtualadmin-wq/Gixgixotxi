import React, { useState } from 'react';
import { getUniversityInitials } from '../UniversityLogoBadge';
import { getUniversityLogo, isTargetUniversity } from '../../lib/universityLogos';

interface UniversityLogoProps {
  src?: string;
  alt: string;
  shortName?: string;
  className?: string;
}

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

function getPalette(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return BG_PALETTES[Math.abs(hash) % BG_PALETTES.length];
}

export const UniversityLogo: React.FC<UniversityLogoProps> = ({
  src,
  alt,
  shortName,
  className = 'w-12 h-12 rounded-2xl',
}) => {
  const [hasError, setHasError] = useState(false);

  const identifier = shortName || alt || '';
  const mappedLogo = getUniversityLogo(identifier);
  const isTarget = isTargetUniversity(identifier);

  const resolvedSrc = isTarget && mappedLogo ? mappedLogo : (src || mappedLogo || '');
  const initials = getUniversityInitials({ shortName, fullName: alt }, alt);
  const colorClass = getPalette(shortName || alt || 'uni');
  const showImg = !hasError && Boolean(resolvedSrc && resolvedSrc.trim());

  // Target universities: object-fit contain on a white or transparent rounded square, lazy loaded
  const shapeClass = isTarget ? 'rounded-2xl' : (className.includes('rounded-') ? '' : 'rounded-2xl');

  if (!showImg) {
    const textSize = initials.length <= 2 ? 'text-sm' : initials.length === 3 ? 'text-xs' : 'text-[10px]';
    return (
      <div
        className={`${className} ${shapeClass} ${colorClass} flex items-center justify-center font-black tracking-tight select-none shadow-xs border border-white/20`}
        title={alt}
        aria-label={`${alt} initials`}
      >
        <span className={`${textSize} font-black uppercase text-center leading-none px-1`}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || `${shortName || 'University'} logo`}
      loading={isTarget ? 'lazy' : 'eager'}
      decoding="async"
      onError={() => setHasError(true)}
      className={`${className} ${shapeClass} object-contain bg-white p-1.5 border border-slate-200/80 shadow-xs`}
    />
  );
};
