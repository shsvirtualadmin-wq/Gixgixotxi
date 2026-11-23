import React, { useCallback, useEffect, useRef, useState } from 'react';

export type StudentIllustrationId =
  | 'girl-books'
  | 'boy-phone'
  | 'crew-together'
  | 'girl-laptop'
  | 'boy-trophy'
  | 'girl-celebrating'
  | 'boy-notes'
  | 'girl-phone'
  | 'boy-laptop'
  | 'girl-trophy'
  | 'crew-celebrate'
  | 'boy-books';

export interface StudentIllustrationProps {
  illustrationId: StudentIllustrationId;
  /** Optional custom student image URL override */
  imageUrl?: string | null;
  imageAlt?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Set true on the first visible hero poster slide to inject <link rel="preload"> & fetchPriority="high" */
  priority?: boolean;
  className?: string;
}

interface StudentAssetEntry {
  src: string;
  alt: string;
  width: number;
  height: number;
  wide?: boolean;
}

/**
 * Optimized transparent WebP student cutouts (all 32–49 KB, 2× Retina sharp,
 * served from /assets/ads-students/* with 1-year immutable Cache-Control).
 */
const STUDENT_IMAGE_ASSETS: Record<StudentIllustrationId, StudentAssetEntry> = {
  'girl-books': {
    src: '/assets/ads-students/girl-books-v1.webp',
    alt: 'Student holding study books',
    width: 520,
    height: 520,
  },
  'boy-books': {
    src: '/assets/ads-students/boy-books-v1.webp',
    alt: 'Student in uniform carrying study books',
    width: 520,
    height: 520,
  },
  'boy-notes': {
    src: '/assets/ads-students/boy-notes-v1.webp',
    alt: 'Smiling Boardly student waving hello',
    width: 520,
    height: 520,
  },
  'boy-phone': {
    src: '/assets/ads-students/boy-phone-v1.webp',
    alt: 'Student in purple hoodie waving',
    width: 520,
    height: 520,
  },
  'boy-laptop': {
    src: '/assets/ads-students/boy-laptop-v1.webp',
    alt: 'Student practicing on a tablet',
    width: 520,
    height: 520,
  },
  'boy-trophy': {
    src: '/assets/ads-students/boy-trophy-v1.webp',
    alt: 'Student celebrating exam progress with a tablet',
    width: 480,
    height: 600,
  },
  'girl-laptop': {
    src: '/assets/ads-students/girl-laptop-v1.webp',
    alt: 'Student solving MCQs on a tablet',
    width: 520,
    height: 520,
  },
  'girl-phone': {
    src: '/assets/ads-students/girl-laptop-v1.webp',
    alt: 'Student studying on a mobile tablet',
    width: 520,
    height: 520,
  },
  'girl-celebrating': {
    src: '/assets/ads-students/girl-celebrating-v1.webp',
    alt: 'Student celebrating high test accuracy',
    width: 520,
    height: 520,
  },
  'girl-trophy': {
    src: '/assets/ads-students/girl-celebrating-v1.webp',
    alt: 'Student cheering with raised fist',
    width: 520,
    height: 520,
  },
  'crew-together': {
    src: '/assets/ads-students/crew-together-v1.webp',
    alt: 'Two classmates studying together with tablet and notebooks',
    width: 640,
    height: 427,
    wide: true,
  },
  'crew-celebrate': {
    src: '/assets/ads-students/crew-celebrate-v1.webp',
    alt: 'Students pointing at the Boardly app on a tablet',
    width: 640,
    height: 427,
    wide: true,
  },
};

const SOLO_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-[84px] h-[84px] sm:w-[96px] sm:h-[96px]',
  md: 'w-[104px] h-[104px] sm:w-[126px] sm:h-[126px]',
  lg: 'w-[196px] h-[196px] sm:w-[236px] sm:h-[236px]',
};

const WIDE_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-[102px] h-[76px] sm:w-[118px] sm:h-[88px]',
  md: 'w-[124px] h-[92px] sm:w-[154px] sm:h-[112px]',
  lg: 'w-[248px] h-[174px] sm:w-[296px] sm:h-[208px]',
};

// Module-level caches so decoded images appear instantly with zero fade flicker on repeat renders
const decodedImageCache = new Set<string>();
const inflightPreloads = new Map<string, Promise<void>>();
const injectedPreloadLinks = new Set<string>();

export function getStudentImageSrc(
  illustrationId: StudentIllustrationId,
  imageUrl?: string | null
): string {
  if (imageUrl) return imageUrl;
  const asset = STUDENT_IMAGE_ASSETS[illustrationId] || STUDENT_IMAGE_ASSETS['girl-books'];
  return asset.src;
}

/**
 * Injects a deduplicated <link rel="preload" as="image"> in <head> for high-priority hero slides.
 */
export function injectImagePreloadLink(src: string): void {
  if (typeof document === 'undefined' || !src || injectedPreloadLinks.has(src)) return;
  injectedPreloadLinks.add(src);
  const existing = document.head.querySelector(`link[rel="preload"][href="${src}"]`);
  if (existing) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  if (src.endsWith('.webp')) {
    link.type = 'image/webp';
  }
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Preloads and decodes an image off-screen via `new Image()` + `img.decode()`
 * so it is 100% ready in GPU memory before a slide becomes visible.
 */
export function preloadAndDecodeStudentImage(src: string, highPriority = false): Promise<void> {
  if (!src || typeof window === 'undefined') return Promise.resolve();
  if (highPriority) {
    injectImagePreloadLink(src);
  }
  if (decodedImageCache.has(src)) return Promise.resolve();

  const existing = inflightPreloads.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    if (highPriority && 'fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';
    }

    const finalize = () => {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .catch(() => {})
          .finally(() => {
            decodedImageCache.add(src);
            inflightPreloads.delete(src);
            resolve();
          });
      } else {
        decodedImageCache.add(src);
        inflightPreloads.delete(src);
        resolve();
      }
    };

    img.onload = finalize;
    img.onerror = () => {
      inflightPreloads.delete(src);
      resolve();
    };
    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      finalize();
    }
  });

  inflightPreloads.set(src, promise);
  return promise;
}

/**
 * Renders optimized transparent WebP student cutouts inside Boardly ads.
 * - Starts at opacity 0 over a soft circular gradient placeholder.
 * - Fades in whole (200ms) ONLY after full load + img.decode(), eliminating top-to-bottom drawing.
 * - Uses explicit width/height and container aspect dimensions for zero layout shift.
 * - Avoids expensive drop-shadow/blur CSS filters on <img> itself.
 */
export const StudentIllustration: React.FC<StudentIllustrationProps> = ({
  illustrationId,
  imageUrl,
  imageAlt,
  size = 'md',
  priority = false,
  className = '',
}) => {
  const asset = STUDENT_IMAGE_ASSETS[illustrationId] || STUDENT_IMAGE_ASSETS['girl-books'];
  const resolvedSrc = imageUrl || asset.src;
  const resolvedAlt = imageAlt || asset.alt;
  const isWide = Boolean(!imageUrl && asset.wide);
  const sizeClass = isWide ? WIDE_SIZE_CLASSES[size] : SOLO_SIZE_CLASSES[size];

  const imgRef = useRef<HTMLImageElement | null>(null);
  const mountedRef = useRef(true);
  const [isReady, setIsReady] = useState<boolean>(() => decodedImageCache.has(resolvedSrc));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (priority) {
      injectImagePreloadLink(resolvedSrc);
    }

    if (decodedImageCache.has(resolvedSrc)) {
      setIsReady(true);
      return;
    }

    setIsReady(false);
    let cancelled = false;

    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      const done = () => {
        decodedImageCache.add(resolvedSrc);
        if (!cancelled && mountedRef.current) setIsReady(true);
      };
      if (typeof el.decode === 'function') {
        el.decode().then(done, done);
      } else {
        done();
      }
    }

    return () => {
      cancelled = true;
    };
  }, [resolvedSrc, priority]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const el = e.currentTarget;
      const markReady = () => {
        decodedImageCache.add(resolvedSrc);
        if (mountedRef.current) {
          setIsReady(true);
        }
      };

      if (typeof el.decode === 'function') {
        el.decode().then(markReady, markReady);
      } else {
        markReady();
      }
    },
    [resolvedSrc]
  );

  return (
    <div
      className={`relative shrink-0 select-none flex items-end justify-center ${sizeClass} ${className}`}
      style={{
        aspectRatio: `${asset.width} / ${asset.height}`,
        contain: 'layout paint',
      }}
    >
      {/* Lightweight radial backdrop + soft container shadow (never filter: drop-shadow on <img>) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[8%] rounded-full transition-opacity duration-200 ${
          isReady ? 'opacity-100' : 'opacity-85'
        }`}
        style={{
          background:
            'radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.24) 0%, rgba(255, 210, 63, 0.16) 52%, transparent 74%)',
          boxShadow: '0 8px 20px -6px rgba(18, 6, 38, 0.28)',
        }}
      />
      <img
        ref={imgRef}
        src={resolvedSrc}
        alt={resolvedAlt}
        width={asset.width}
        height={asset.height}
        loading="eager"
        decoding="async"
        {...({ fetchpriority: priority ? 'high' : 'auto' } as React.ImgHTMLAttributes<HTMLImageElement>)}
        draggable={false}
        onLoad={handleLoad}
        className={`relative z-10 h-full w-full object-contain object-bottom transition-opacity duration-200 ease-out ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default StudentIllustration;
