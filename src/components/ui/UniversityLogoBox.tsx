import React, { useState, useEffect, memo } from 'react';
import { PRE_SEEDED_UNIVERSITIES } from '../../constants/d1Universities';

const loadedLogoUrlCache = new Set<string>();
const failedLogoUrlCache = new Set<string>();

export function normalizeUniversityLogoUrl(
  rawUrl?: string | null,
  updatedAt?: number | string | null
): string {
  const clean = String(rawUrl || '').trim();
  if (!clean) return '';
  if (clean.startsWith('data:image/') || clean.startsWith('blob:')) return clean;

  let existingVersion = '';
  let pathPart = clean;
  const qIdx = clean.indexOf('?');
  if (qIdx >= 0 && !clean.includes('/api/posts/file')) {
    pathPart = clean.slice(0, qIdx);
    try {
      const qs = new URLSearchParams(clean.slice(qIdx + 1));
      existingVersion = qs.get('v') || '';
    } catch {
      existingVersion = '';
    }
  }

  const versionTag = String(updatedAt || existingVersion || '').trim();
  const appendVersion = (targetUrl: string): string => {
    if (!versionTag) return targetUrl;
    if (/[?&]v=/.test(targetUrl)) return targetUrl;
    return `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(versionTag)}`;
  };

  if (pathPart.startsWith('http://') || pathPart.startsWith('https://')) {
    let normalized = clean
      .replace('/api/r2/', '/api/media/')
      .replace('/api/commons/r2/', '/api/media/');
    if (
      typeof window !== 'undefined' &&
      window.location?.protocol === 'https:' &&
      normalized.startsWith('http://') &&
      !normalized.includes('localhost') &&
      !normalized.includes('127.0.0.1')
    ) {
      normalized = 'https://' + normalized.slice('http://'.length);
    }
    return appendVersion(normalized);
  }

  if (clean.includes('/api/posts/file')) {
    try {
      const u = new URL(clean, 'http://localhost');
      const k = String(u.searchParams.get('key') || '')
        .replace(/\.\./g, '')
        .replace(/^\/+/, '');
      if (k) return appendVersion(`/api/media/${k}`);
    } catch {
      // Fall through
    }
  }

  if (pathPart.startsWith('/api/r2/')) {
    const k = pathPart.slice('/api/r2/'.length).replace(/^\/+/, '');
    return k ? appendVersion(`/api/media/${k}`) : '';
  }
  if (pathPart.startsWith('/api/commons/r2/')) {
    const k = pathPart.slice('/api/commons/r2/'.length).replace(/^\/+/, '');
    return k ? appendVersion(`/api/media/${k}`) : '';
  }
  if (pathPart.startsWith('/api/media/')) {
    const k = pathPart.slice('/api/media/'.length).replace(/^\/+/, '');
    return k ? appendVersion(`/api/media/${k}`) : '';
  }
  if (pathPart.startsWith('/')) {
    return appendVersion(clean);
  }
  return appendVersion(`/api/media/${pathPart.replace(/^\/+/, '')}`);
}

export function clearFailedUniversityLogoCache(logoUrl?: string | null): void {
  if (!logoUrl) {
    failedLogoUrlCache.clear();
    return;
  }
  const clean = normalizeUniversityLogoUrl(logoUrl);
  failedLogoUrlCache.delete(clean);
  failedLogoUrlCache.delete(String(logoUrl).trim());
}

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
  const clean = normalizeUniversityLogoUrl(logoUrl);
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
  const clean = normalizeUniversityLogoUrl(logoUrl);
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
  const cleanUrl = normalizeUniversityLogoUrl(logoUrl);
  const [hasError, setHasError] = useState<boolean>(() =>
    cleanUrl ? failedLogoUrlCache.has(cleanUrl) : false
  );

  useEffect(() => {
    if (!cleanUrl) {
      setHasError(false);
      return;
    }
    setHasError(failedLogoUrlCache.has(cleanUrl));
  }, [cleanUrl]);

  const initials = getUniversityInitials(name);
  const sizeSpec = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const showLogo = Boolean(cleanUrl && !hasError);

  return (
    <div
      className={`relative ${sizeSpec.box} ${
        showLogo ? sizeSpec.pad : `font-extrabold ${sizeSpec.text}`
      } flex items-center justify-center shrink-0 shadow-sm select-none overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--accent)',
        color: 'var(--text-on-accent)',
        fontFamily: 'var(--font-dot)',
        border: '1px solid var(--accent-red-border, var(--accent))',
      }}
      title={name}
    >
      {showLogo ? (
        <img
          src={cleanUrl}
          alt={name}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => {
            loadedLogoUrlCache.add(cleanUrl);
            failedLogoUrlCache.delete(cleanUrl);
          }}
          onError={() => {
            failedLogoUrlCache.add(cleanUrl);
            setHasError(true);
          }}
          className="w-full h-full object-contain"
          style={{ objectFit: 'contain' }}
        />
      ) : (
        <span className="tracking-tight leading-none truncate px-0.5">{initials}</span>
      )}
    </div>
  );
});
