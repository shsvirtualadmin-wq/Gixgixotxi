/**
 * Unified Logo Preload & Batch Readiness Manager
 * Preloads all university and institution logos in parallel upon app initialization.
 * Provides batch readiness hooks to ensure logo sections render simultaneously
 * without staggered pop-ins.
 */

import { useState, useEffect } from 'react';

export const CRITICAL_LOGO_URLS: string[] = [
  '/logos/academic/nust.png',
  '/logos/academic/fast.png',
  '/logos/academic/giki.png',
  '/logos/academic/pieas.png',
  '/logos/academic/hec-usat.png',
  '/logos/academic/lums.png',
  '/logos/academic/comsats.png',
  '/logos/academic/hitec.png',
  '/logos/academic/nutech.png',
  '/logos/academic/muet.png',
  '/logos/academic/ned.png',
  '/logos/academic/aku.png',
  '/logos/academic/iba.png',
  '/logos/academic/numl.png',
  '/logos/academic/nums.png',
  '/logos/academic/pmdc.png',
  '/logos/academic/uet-taxila.png',
  '/logos/academic/uet-peshawar.png',
  '/logos/academic/fbise.png',
  '/logos/academic/aps.png',
  '/logos/academic/qau.png',
  '/logos/academic/fazaia.png',
  '/logos/academic/fgc.png',
  '/logos/academic/stem.png',
  '/logos/academic/kips.png',
  '/logos/academic/uhs.png',
];

const loadedCache = new Set<string>();
const failedCache = new Set<string>();
const subscribers = new Set<() => void>();
let preloadInitiated = false;
let batchSettled = false;

function notifySubscribers() {
  subscribers.forEach((callback) => {
    try {
      callback();
    } catch (e) {
      console.warn('Error in logo subscriber:', e);
    }
  });
}

/**
 * Preloads an individual image and caches its status.
 */
export function preloadImage(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(true);
  if (loadedCache.has(url)) return Promise.resolve(true);
  if (failedCache.has(url)) return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      loadedCache.add(url);
      resolve(true);
    };

    img.onerror = () => {
      failedCache.add(url);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Preload all critical logos in parallel.
 * Resolves when all images have settled (loaded or failed) or when the fallback timeout triggers.
 */
export function preloadAllLogos(
  urls: string[] = CRITICAL_LOGO_URLS,
  timeoutMs: number = 2000
): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(true);
  if (batchSettled) return Promise.resolve(true);

  preloadInitiated = true;

  const promises = urls.map((url) => preloadImage(url));

  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutMs);
  });

  return Promise.race([
    Promise.allSettled(promises),
    timeoutPromise,
  ]).then(() => {
    batchSettled = true;
    notifySubscribers();
    return true;
  });
}

/**
 * Synchronous check if all logos in the list are ready (loaded or failed).
 */
export function areLogosReady(urls: string[] = CRITICAL_LOGO_URLS): boolean {
  if (typeof window === 'undefined') return true;
  if (batchSettled) return true;
  return urls.every((url) => loadedCache.has(url) || failedCache.has(url));
}

/**
 * React hook to coordinate batch rendering of logos.
 * Prevents staggered pop-in by holding the section ready state until all
 * logos in the target list are loaded into memory.
 */
export function useLogosReady(
  urls: string[] = CRITICAL_LOGO_URLS,
  timeoutMs: number = 1000
): boolean {
  const [isReady, setIsReady] = useState<boolean>(() => areLogosReady(urls));

  useEffect(() => {
    if (isReady) return;

    let isMounted = true;

    const checkReady = () => {
      if (!isMounted) return;
      if (areLogosReady(urls)) {
        setIsReady(true);
      }
    };

    subscribers.add(checkReady);

    // Ensure parallel preload is initiated
    preloadAllLogos(urls, timeoutMs);

    // Guaranteed fallback timeout so UI never remains hidden on slow/offline networks
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsReady(true);
      }
    }, timeoutMs);

    return () => {
      isMounted = false;
      subscribers.delete(checkReady);
      clearTimeout(fallbackTimer);
    };
  }, [urls, isReady, timeoutMs]);

  return isReady;
}

// Immediately initiate preloading on browser module evaluation
if (typeof window !== 'undefined' && !preloadInitiated) {
  preloadAllLogos(CRITICAL_LOGO_URLS, 1500);
}
