import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

export type LineLoaderContext =
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'universities'
  | 'test'
  | 'results'
  | 'admin'
  | 'import'
  | 'onboarding'
  | 'verify-email'
  | 'general'
  | 'generic';

export const LINE_LOADER_POOLS: Record<LineLoaderContext, readonly string[]> = {
  login: [
    'Logging you in...',
    'Checking your credentials...',
    'Almost there...',
    'Welcome back...',
  ],
  signup: [
    'Creating your account...',
    'Setting things up...',
    'Getting you ready...',
  ],
  dashboard: [
    'Preparing your dashboard...',
    'Opening your dashboard...',
    'Loading your progress...',
    'Getting your streak ready...',
  ],
  universities: [
    'Loading universities...',
    'Fetching the latest banks...',
    'Almost ready...',
  ],
  test: [
    'Preparing your test...',
    'Shuffling questions...',
    'Setting up your timer...',
  ],
  results: [
    'Calculating your score...',
    'Checking your answers...',
    'Preparing your results...',
  ],
  admin: [
    'Opening admin portal...',
    'Loading question bank...',
    'Syncing the bank...',
  ],
  import: [
    'Importing MCQs...',
    'Processing your sheet...',
    'Saving to the bank...',
  ],
  onboarding: [
    'Setting up your profile...',
    'Personalizing your subjects...',
    'Almost ready...',
  ],
  'verify-email': [
    'Verifying your email...',
    'Confirming your token...',
    'One moment...',
  ],
  general: [
    'Thinking...',
    'Processing...',
    'Almost ready...',
  ],
  generic: [
    'Loading...',
    'One moment...',
    'Just a second...',
  ],
};

export function inferLoaderContextFromPath(pathname?: string): LineLoaderContext {
  const clean = (
    pathname ||
    (typeof window !== 'undefined' ? window.location.pathname : '')
  ).toLowerCase();

  if (clean.startsWith('/login') || clean.startsWith('/forgot-password')) {
    return 'login';
  }
  if (
    clean.startsWith('/signup') ||
    clean.startsWith('/onboarding') ||
    clean.startsWith('/verify-email')
  ) {
    return 'signup';
  }
  if (clean.startsWith('/admin')) {
    return 'admin';
  }
  if (clean.includes('/result') || clean.startsWith('/dashboard/results')) {
    return 'results';
  }
  if (clean.startsWith('/test') || clean.startsWith('/dashboard/practice')) {
    return 'test';
  }
  if (
    clean.startsWith('/dashboard') ||
    clean.startsWith('/captain') ||
    clean.startsWith('/crew') ||
    clean.startsWith('/arena')
  ) {
    return 'dashboard';
  }
  return 'generic';
}

export function inferLoaderContextFromMessages(
  message?: string,
  messages?: string[]
): LineLoaderContext {
  const sample = `${message || ''} ${(messages || []).join(' ')}`.toLowerCase();
  if (sample.includes('log') || sample.includes('credential') || sample.includes('sign in')) {
    return 'login';
  }
  if (sample.includes('account') || sample.includes('sign up') || sample.includes('register')) {
    return 'signup';
  }
  if (sample.includes('import') || sample.includes('sheet') || sample.includes('csv')) {
    return 'import';
  }
  if (sample.includes('admin') || sample.includes('audit') || sample.includes('user')) {
    return 'admin';
  }
  if (sample.includes('universit') || sample.includes('bank')) {
    return 'universities';
  }
  if (sample.includes('score') || sample.includes('result') || sample.includes('answer')) {
    return 'results';
  }
  if (sample.includes('test') || sample.includes('question') || sample.includes('timer')) {
    return 'test';
  }
  if (sample.includes('dashboard') || sample.includes('streak') || sample.includes('progress')) {
    return 'dashboard';
  }
  return inferLoaderContextFromPath();
}

function pickRandomFromPool(pool: readonly string[], exclude?: string): string {
  if (!pool || pool.length === 0) return 'One moment...';
  const candidates = exclude ? pool.filter((m) => m !== exclude) : [...pool];
  const source = candidates.length > 0 ? candidates : pool;
  const idx = Math.floor(Math.random() * source.length);
  return source[idx] || pool[0] || 'One moment...';
}

export interface LineLoaderProps {
  /**
   * Optional explicit initial message (under 30 chars).
   */
  message?: string;
  /**
   * Optional custom message pool override.
   */
  messages?: string[];
  /**
   * Context pool selector: 'login' | 'signup' | 'dashboard' | 'universities' | 'test' | 'results' | 'admin' | 'import' | 'generic'
   */
  context?: LineLoaderContext;
  /**
   * Placement mode:
   * - 'page' / 'overlay': centered full-screen on clean background
   * - 'section': centered inside a section/card container
   * - 'inline': compact centered block
   */
  variant?: 'page' | 'overlay' | 'section' | 'inline';
  /**
   * Controls whether the loader is active. Defaults to true when rendered conditionally.
   */
  loading?: boolean;
  /**
   * Delay before showing the loader (default 150ms to prevent flicker on fast loads).
   */
  delayMs?: number;
  /**
   * Minimum time to stay visible once shown (default 400ms).
   */
  minDisplayMs?: number;
  /**
   * Timeout in ms before showing "Taking longer than usual..." and a Retry button (default 15000ms).
   */
  timeoutMs?: number;
  /**
   * Optional error string to display with a Retry button.
   */
  error?: string | null;
  /**
   * If true, shows immediately without 150ms delay.
   */
  immediate?: boolean;
  /**
   * Retry handler when timed out or on error.
   */
  onRetry?: () => void;
  className?: string;
}

const ROTATE_INTERVAL_MS = 1800;
const FADE_DURATION_MS = 175;

export const LineLoader: React.FC<LineLoaderProps> = ({
  message,
  messages,
  context,
  variant = 'section',
  loading = true,
  delayMs = 150,
  immediate = false,
  minDisplayMs = 400,
  timeoutMs = 15000,
  error = null,
  onRetry,
  className = '',
}) => {
  const effectiveDelay = immediate ? 0 : delayMs;
  const resolvedContext: LineLoaderContext = useMemo(
    () => context || inferLoaderContextFromMessages(message, messages),
    [context, message, messages]
  );

  const pool: readonly string[] = useMemo(() => {
    const basePool = LINE_LOADER_POOLS[resolvedContext] || LINE_LOADER_POOLS.generic;
    const customList = (messages || [])
      .map((m) => m.trim())
      .filter((m) => m.length > 0 && m.length <= 30);
    const singleMsg =
      message && message.trim().length > 0 && message.trim().length <= 30
        ? message.trim()
        : null;

    const combined = [
      ...(singleMsg ? [singleMsg] : []),
      ...customList,
      ...basePool,
    ];
    return Array.from(new Set(combined));
  }, [resolvedContext, message, messages]);

  // Pick initial message immediately on mount (never blank)
  const [currentMessage, setCurrentMessage] = useState<string>(() => {
    if (message && message.trim().length > 0 && message.trim().length <= 30) {
      return message.trim();
    }
    return pickRandomFromPool(pool);
  });
  const [msgVisible, setMsgVisible] = useState<boolean>(true);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  // Timing rules: 150ms delay before showing, 400ms minimum visibility once shown
  const [isVisible, setIsVisible] = useState<boolean>(delayMs <= 0 && loading);
  const [keepMounted, setKeepMounted] = useState<boolean>(loading);
  const visibleSinceRef = useRef<number>(delayMs <= 0 && loading ? Date.now() : 0);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // Release any accidental body scroll locks on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      }
    };
  }, []);

  // Handle 150ms show delay and 400ms minimum display time
  useEffect(() => {
    if (loading) {
      setKeepMounted(true);
      setTimedOut(false);
      if (delayMs <= 0) {
        visibleSinceRef.current = Date.now();
        setIsVisible(true);
        return;
      }
      const showTimer = setTimeout(() => {
        visibleSinceRef.current = Date.now();
        setIsVisible(true);
      }, delayMs);
      return () => clearTimeout(showTimer);
    } else {
      if (!isVisible) {
        setKeepMounted(false);
        return;
      }
      const elapsed = Date.now() - (visibleSinceRef.current || Date.now());
      const remaining = Math.max(0, minDisplayMs - elapsed);
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setKeepMounted(false);
      }, remaining);
      return () => clearTimeout(hideTimer);
    }
  }, [loading, delayMs, minDisplayMs, isVisible]);

  // Rotate message every ~1.8s without repeating back-to-back
  useEffect(() => {
    if (!keepMounted || timedOut || error) return;

    let fadeTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      if (prefersReducedMotion) {
        // Plain text swap with no fade for reduced-motion users
        setCurrentMessage((prev) => pickRandomFromPool(pool, prev));
        setMsgVisible(true);
      } else {
        setMsgVisible(false);
        fadeTimeout = setTimeout(() => {
          setCurrentMessage((prev) => pickRandomFromPool(pool, prev));
          setMsgVisible(true);
        }, FADE_DURATION_MS);
      }
    }, ROTATE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [keepMounted, timedOut, error, pool, prefersReducedMotion]);

  // 15-second timeout guard
  useEffect(() => {
    if (!keepMounted || error || timeoutMs <= 0) return;
    const timer = setTimeout(() => {
      setTimedOut(true);
      setIsVisible(true);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [keepMounted, error, timeoutMs]);

  const handleRetry = useCallback(() => {
    setTimedOut(false);
    visibleSinceRef.current = Date.now();
    setCurrentMessage(pickRandomFromPool(pool));
    if (onRetry) {
      onRetry();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [onRetry, pool]);

  if (!keepMounted && !error) {
    return null;
  }

  const isFullPage = variant === 'page' || variant === 'overlay';
  const isInline = variant === 'inline';

  const containerClass =
    variant === 'overlay'
      ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] overlay-blur bg-black/60 backdrop-blur-md flex flex-col items-center justify-center px-5 select-none'
      : isFullPage
      ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[var(--bg)]/85 backdrop-blur-md flex flex-col items-center justify-center px-5 select-none'
      : isInline
      ? 'w-full py-4 px-3 flex flex-col items-center justify-center select-none'
      : 'w-full min-h-[180px] py-10 px-4 flex flex-col items-center justify-center select-none';

  // During the initial 150ms anti-flicker window, reserve space quietly without flashing
  if (!isVisible && !error && !timedOut) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={`${containerClass} ${className}`}
      />
    );
  }

  // Error or 15s Timeout State with Retry
  if (error || timedOut) {
    const statusText = error || 'Taking longer than usual...';
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="false"
        className={`${containerClass} ${className}`}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center max-w-xs">
          <p className="line-loader-msg" style={{ opacity: 1 }}>
            {statusText}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast,#fff)] hover:opacity-90 transition-opacity cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`${containerClass} ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-2.5">
        <div
          className="line-loader-msg"
          style={{ opacity: msgVisible ? 1 : 0 }}
        >
          {currentMessage}
        </div>
        <div className="line-loader-track" aria-hidden="true">
          <div className="line-loader-bar" />
        </div>
      </div>
    </div>
  );
};

/**
 * Thin 2px gliding line rendered along the bottom edge of a submitting button.
 */
export interface ButtonLineLoaderProps {
  label?: string;
  className?: string;
}

export const ButtonLineLoader: React.FC<ButtonLineLoaderProps> = ({ label, className = '' }) => (
  <span className={`line-loader-btn-track ${className}`} aria-hidden="true" title={label}>
    <span className="line-loader-btn-bar" />
    {label && <span className="sr-only">{label}</span>}
  </span>
);

export default LineLoader;
