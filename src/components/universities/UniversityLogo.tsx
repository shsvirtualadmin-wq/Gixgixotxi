import React, { useState } from 'react';
import { getUniversityInitials } from '../UniversityLogoBadge';

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
  className = 'w-12 h-12 rounded-full',
}) => {
  const [hasError, setHasError] = useState(false);

  const initials = getUniversityInitials({ shortName, fullName: alt }, alt);
  const colorClass = getPalette(shortName || alt || 'uni');
  const showImg = !hasError && Boolean(src && src.trim());

  if (!showImg) {
    const textSize = initials.length <= 2 ? 'text-sm' : initials.length === 3 ? 'text-xs' : 'text-[10px]';
    return (
      <div
        className={`${className} ${colorClass} flex items-center justify-center font-black tracking-tight select-none shadow-xs border border-white/20`}
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
      src={src}
      alt={alt}
      loading="eager"
      onError={() => setHasError(true)}
      className={`${className} object-contain bg-white p-1 border border-slate-200/80 shadow-xs`}
    />
  );
};

