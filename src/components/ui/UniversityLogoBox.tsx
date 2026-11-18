import React, { useState, useEffect, memo } from 'react';
import { PRE_SEEDED_UNIVERSITIES } from '../../constants/d1Universities';

const loadedLogoUrlCache = new Set<string>();
const failedLogoUrlCache = new Set<string>();

export function getUniversityInitials(name: string): string {
  const trimmed = String(name || '').trim();
  const preset = PRE_SEEDED_UNIVERSITIES.find(
    (u) =>
      u.name.toLowerCase() === trimmed.toLowerCase() ||
      u.slug.toLowerCase() === trimmed.toLowerCase()
  );
  if (preset?.shortName) return preset.shortName.slice(0, 4).toUpperCase();
  const cleaned = trimmed.replace(/\(.*?\)/g, '').trim();
  const words = cleaned.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return 'UNI';
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function primeUniversityLogoCache(logoUrl?: string | null): void {
  const clean = String(logoUrl || '').trim();
  if (!clean || failedLogoUrlCache.has(clean) || loadedLogoUrlCache.has(clean)) return;
  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      loadedLogoUrlCache.add(clean);
      failedLogoUrlCache.delete(clean);
    };
    img.src = clean;
  }
}

export function markUniversityLogoCached(logoUrl?: string | null): void {
  const clean = String(logoUrl || '').trim();
  if (!clean) return;
  loadedLogoUrlCache.add(clean);
  failedLogoUrlCache.delete(clean);
}

export type UniversityLogoSize = 'xs' | 'sm' | 'md' | 'lg';

export interface UniversityLogoBoxProps {
  name: string;
  logoUrl?: string | null;
  size?: UniversityLogoSize;
  eager?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<
  UniversityLogoSize,
  { box: string; pad: string; text: string }
> = {
  xs: {
    box: 'w-6 h-6 rounded-lg',
    pad: 'p-0.5',
    text: 'text-[9px]',
  },
  sm: {
    box: 'w-9 h-9 rounded-xl',
    pad: 'p-1',
    text: 'text-xs',
  },
  md: {
    box: 'w-11 h-11 rounded-2xl',
    pad: 'p-1.5',
    text: 'text-xs sm:text-sm',
  },
  lg: {
    box: 'w-16 h-16 rounded-2xl',
    pad: 'p-2',
    text: 'text-base',
  },
};

export const UniversityLogoBox = memo(function UniversityLogoBox({
  name,
  logoUrl,
  size = 'md',
  eager = false,
  className = '',
}: UniversityLogoBoxProps) {
  const cleanUrl = String(logoUrl || '').trim();
  const [isLoaded, setIsLoaded] = useState<boolean>(() =>
    cleanUrl ? loadedLogoUrlCache.has(cleanUrl) : false
  );
  const [hasError, setHasError] = useState<boolean>(() =>
    cleanUrl ? failedLogoUrlCache.has(cleanUrl) : false
  );

  useEffect(() => {
    if (!cleanUrl) {
      setIsLoaded(false);
      setHasError(false);
      return;
    }
    if (loadedLogoUrlCache.has(cleanUrl)) {
      setIsLoaded(true);
      setHasError(false);
      return;
    }
    if (failedLogoUrlCache.has(cleanUrl)) {
      setIsLoaded(false);
      setHasError(true);
      return;
    }
    setIsLoaded(false);
    setHasError(false);
  }, [cleanUrl]);

  const initials = getUniversityInitials(name);
  const sizeSpec = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const showLogo = Boolean(cleanUrl && !hasError);

  if (!showLogo) {
    return (
      <div
        className={`${sizeSpec.box} font-extrabold ${sizeSpec.text} flex items-center justify-center shrink-0 shadow-sm select-none overflow-hidden ${className}`}
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--text-on-accent)',
          fontFamily: 'var(--font-dot)',
          border: '1px solid var(--accent-red-border, var(--accent))',
        }}
        title={name}
      >
        <span className="tracking-tight leading-none truncate px-0.5">{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeSpec.box} ${sizeSpec.pad} flex items-center justify-center shrink-0 shadow-sm overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: 'var(--uni-logo-box-bg)',
        border: '1.5px solid var(--uni-logo-box-border, var(--accent-red-border, var(--accent)))',
        boxShadow: 'var(--uni-logo-box-shadow, 0 2px 8px rgba(215, 25, 33, 0.14))',
      }}
      title={name}
    >
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-1 rounded-lg skeleton-shimmer"
        />
      )}
      <img
        src={cleanUrl}
        alt={`${name} logo`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => {
          loadedLogoUrlCache.add(cleanUrl);
          failedLogoUrlCache.delete(cleanUrl);
          setIsLoaded(true);
        }}
        onError={() => {
          failedLogoUrlCache.add(cleanUrl);
          setHasError(true);
        }}
        className={`w-full h-full transition-opacity duration-150 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
});
