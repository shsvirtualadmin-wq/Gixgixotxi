import React, { useState, useEffect, useRef, memo } from 'react';
import { PRE_SEEDED_UNIVERSITIES } from '../../constants/d1Universities';

export const UNIVERSITY_LOGO_RETRY_DELAYS_MS = [500, 1000, 2000] as const;

const loadedLogoUrlCache = new Set<string>();
const decodedLogoUrlCache = new Set<string>();
const failedLogoUrlCache = new Set<string>();
const inFlightLogoPreloads = new Map<string, Promise<boolean>>();
const decodedImageRefs = new Map<string, HTMLImageElement>();
const universityLogoUrlByIdCache = new Map<string, string>();
const MAX_DECODED_IMAGE_REFS = 80;

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

export function appendLogoRetryQuery(cleanUrl: string, retryAttempt: number): string {
  if (!cleanUrl || retryAttempt <= 0) return cleanUrl;
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) return cleanUrl;
  const stripped = cleanUrl.replace(/([?&])_r=\d+&?/g, '$1').replace(/[?&]$/, '');
  return `${stripped}${stripped.includes('?') ? '&' : '?'}_r=${retryAttempt}`;
}

export function rememberUniversityLogoUrls(
  universities: Array<{ id?: string; slug?: string; logo_url?: string | null }>
): void {
  for (const u of universities) {
    const clean = normalizeUniversityLogoUrl(u?.logo_url);
    if (!clean) continue;
    if (u.id) universityLogoUrlByIdCache.set(u.id, clean);
    if (u.slug) universityLogoUrlByIdCache.set(`slug:${u.slug.toLowerCase()}`, clean);
  }
}

export function getRememberedUniversityLogoUrl(id?: string, slug?: string): string {
  if (id && universityLogoUrlByIdCache.has(id)) {
    return universityLogoUrlByIdCache.get(id) || '';
  }
  if (slug) {
    const key = `slug:${slug.toLowerCase()}`;
    if (universityLogoUrlByIdCache.has(key)) {
      return universityLogoUrlByIdCache.get(key) || '';
    }
  }
  return '';
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

export function isUniversityLogoDecoded(logoUrl?: string | null): boolean {
  const clean = normalizeUniversityLogoUrl(logoUrl);
  return Boolean(clean && (decodedLogoUrlCache.has(clean) || loadedLogoUrlCache.has(clean)));
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

function retainDecodedImage(cleanUrl: string, img: HTMLImageElement): void {
  if (decodedImageRefs.has(cleanUrl)) return;
  if (decodedImageRefs.size >= MAX_DECODED_IMAGE_REFS) {
    const oldestKey = decodedImageRefs.keys().next().value;
    if (oldestKey) decodedImageRefs.delete(oldestKey);
  }
  decodedImageRefs.set(cleanUrl, img);
}

/**
 * Preload and decode a single university logo URL once.
 * Uses new Image() + img.decode() so bitmaps are ready before swipe.
 * Deduplicates concurrent/repeat requests so nothing is ever preloaded twice.
 */
export function preloadUniversityLogo(logoUrl?: string | null): Promise<boolean> {
  const clean = normalizeUniversityLogoUrl(logoUrl);
  if (!clean) return Promise.resolve(false);
  if (decodedLogoUrlCache.has(clean)) return Promise.resolve(true);

  const existing = inFlightLogoPreloads.get(clean);
  if (existing) return existing;

  if (typeof Image === 'undefined') return Promise.resolve(false);

  const loadPromise = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.decoding = 'async';

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      inFlightLogoPreloads.delete(clean);
      if (ok) {
        loadedLogoUrlCache.add(clean);
        decodedLogoUrlCache.add(clean);
        failedLogoUrlCache.delete(clean);
        retainDecodedImage(clean, img);
      }
      resolve(ok);
    };

    img.onload = () => {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(() => finish(true))
          .catch(() => {
            // SVG or already-decoded images can reject decode(); onload confirms availability
            finish(img.naturalWidth > 0 || clean.toLowerCase().includes('.svg'));
          });
      } else {
        finish(true);
      }
    };

    img.onerror = () => {
      finish(false);
    };

    img.src = clean;

    // Handle images already synchronously complete from HTTP memory cache
    if (img.complete && img.naturalWidth > 0) {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(() => finish(true))
          .catch(() => finish(true));
      } else {
        finish(true);
      }
    }
  });

  inFlightLogoPreloads.set(clean, loadPromise);
  return loadPromise;
}

export function primeUniversityLogoCache(logoUrl?: string | null): void {
  void preloadUniversityLogo(logoUrl);
}

/**
 * Preload an ordered list of university logo URLs after first paint,
 * in idle time and in small batches, without ever preloading the same URL twice.
 * Canceling stops future batches without aborting images already in flight.
 */
export function preloadUniversityLogosInBatches(
  rawUrls: Array<string | null | undefined>,
  options?: { batchSize?: number }
): () => void {
  if (typeof window === 'undefined') return () => {};

  const batchSize = Math.max(1, options?.batchSize ?? 3);
  const queue: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawUrls) {
    const clean = normalizeUniversityLogoUrl(raw);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    if (decodedLogoUrlCache.has(clean) || inFlightLogoPreloads.has(clean)) continue;
    queue.push(clean);
  }

  if (queue.length === 0) return () => {};

  let cancelled = false;
  let raf1 = 0;
  let raf2 = 0;
  let idleHandle: number | null = null;
  let timerHandle: ReturnType<typeof setTimeout> | null = null;
  let cursor = 0;

  const scheduleIdle = (cb: () => void) => {
    if (cancelled) return;
    const win = window as Window & {
      requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof win.requestIdleCallback === 'function') {
      idleHandle = win.requestIdleCallback(
        () => {
          idleHandle = null;
          if (!cancelled) cb();
        },
        { timeout: 500 }
      );
    } else {
      timerHandle = setTimeout(() => {
        timerHandle = null;
        if (!cancelled) cb();
      }, 32);
    }
  };

  const runNextBatch = () => {
    if (cancelled || cursor >= queue.length) return;
    const batch = queue.slice(cursor, cursor + batchSize);
    cursor += batch.length;
    void Promise.allSettled(batch.map((u) => preloadUniversityLogo(u))).then(() => {
      if (!cancelled && cursor < queue.length) {
        scheduleIdle(runNextBatch);
      }
    });
  };

  // Wait until after the dashboard's first paint before scheduling idle batches
  raf1 = window.requestAnimationFrame(() => {
    raf2 = window.requestAnimationFrame(() => {
      if (!cancelled) {
        scheduleIdle(runNextBatch);
      }
    });
  });

  return () => {
    cancelled = true;
    if (raf1) window.cancelAnimationFrame(raf1);
    if (raf2) window.cancelAnimationFrame(raf2);
    const win = window as Window & { cancelIdleCallback?: (id: number) => void };
    if (idleHandle !== null && typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(idleHandle);
    }
    if (timerHandle !== null) {
      clearTimeout(timerHandle);
    }
  };
}

export function markUniversityLogoCached(logoUrl?: string | null): void {
  const clean = normalizeUniversityLogoUrl(logoUrl);
  if (!clean) return;
  loadedLogoUrlCache.add(clean);
  decodedLogoUrlCache.add(clean);
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
  { box: string; pad: string; text: string; px: number }
> = {
  xs: {
    box: 'w-6 h-6 rounded-lg',
    pad: 'p-0.5',
    text: 'text-[9px]',
    px: 20,
  },
  sm: {
    box: 'w-9 h-9 rounded-xl',
    pad: 'p-1',
    text: 'text-xs',
    px: 28,
  },
  md: {
    box: 'w-11 h-11 rounded-2xl',
    pad: 'p-1.5',
    text: 'text-xs sm:text-sm',
    px: 32,
  },
  lg: {
    box: 'w-16 h-16 rounded-2xl',
    pad: 'p-2',
    text: 'text-base',
    px: 48,
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
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [permanentlyFailed, setPermanentlyFailed] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setRetryAttempt(0);
    setIsRetrying(false);
    setPermanentlyFailed(false);
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [cleanUrl]);

  // Recover automatically if network comes back online after exhausting retries
  useEffect(() => {
    if (!permanentlyFailed || !cleanUrl || typeof window === 'undefined') return;
    const onOnline = () => {
      clearFailedUniversityLogoCache(cleanUrl);
      setPermanentlyFailed(false);
      setIsRetrying(false);
      setRetryAttempt(1);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [permanentlyFailed, cleanUrl]);

  const scheduleRetry = () => {
    if (!cleanUrl || retryTimerRef.current) return;
    if (retryAttempt < UNIVERSITY_LOGO_RETRY_DELAYS_MS.length) {
      const delay = UNIVERSITY_LOGO_RETRY_DELAYS_MS[retryAttempt];
      setIsRetrying(true);
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        setRetryAttempt((prev) => prev + 1);
      }, delay);
    } else {
      failedLogoUrlCache.add(cleanUrl);
      setIsRetrying(false);
      setPermanentlyFailed(true);
    }
  };

  // Detect images that already errored before onError attached
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !cleanUrl || permanentlyFailed || isRetrying) return;
    if (el.complete && el.naturalWidth === 0) {
      scheduleRetry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanUrl, retryAttempt, permanentlyFailed]);

  const activeSrc = cleanUrl ? appendLogoRetryQuery(cleanUrl, retryAttempt) : '';
  const initials = getUniversityInitials(name);
  const sizeSpec = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const showLogo = Boolean(activeSrc && !permanentlyFailed);

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
          ref={imgRef}
          src={activeSrc}
          alt={name}
          width={sizeSpec.px}
          height={sizeSpec.px}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => {
            if (retryTimerRef.current) {
              clearTimeout(retryTimerRef.current);
              retryTimerRef.current = null;
            }
            setIsRetrying(false);
            setPermanentlyFailed(false);
            loadedLogoUrlCache.add(cleanUrl);
            decodedLogoUrlCache.add(cleanUrl);
            failedLogoUrlCache.delete(cleanUrl);
          }}
          onError={() => {
            scheduleRetry();
          }}
          className="w-full h-full object-contain"
          style={{
            objectFit: 'contain',
            visibility: isRetrying ? 'hidden' : 'visible',
          }}
        />
      ) : (
        <span className="tracking-tight leading-none truncate px-0.5">{initials}</span>
      )}
    </div>
  );
});

