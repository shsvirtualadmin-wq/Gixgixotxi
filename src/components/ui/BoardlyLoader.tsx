import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const DEFAULT_MESSAGES = [
  'Loading your notes...',
  'Syncing your subjects...',
  'Getting your Commons ready...',
];

const MIN_DISPLAY_MS = 400;
const FADE_OUT_MS = 300;
const MESSAGE_INTERVAL_MS = 2000;
const TIMEOUT_FALLBACK_MS = 10000;

export interface BoardlyLoaderProps {
  /**
   * Controls whether the loader is active. Defaults to `true` when rendered directly
   * (e.g. inside a Suspense fallback). When toggled from `true` to `false`, the loader
   * enforces the ~400ms minimum display time, smoothly fades out over ~300ms, and then
   * removes itself from the DOM.
   */
  loading?: boolean;
  /**
   * Optional real progress percentage (0 - 100). If omitted, uses an indeterminate
   * looping shimmer animation.
   */
  progress?: number;
  /**
   * Custom rotating status lines shown below the progress bar.
   */
  messages?: string[];
  /**
   * Layout mode:
   * - `'page'` (default): fills the page/viewport area without overlapping the mobile bottom nav
   * - `'overlay'`: fixed overlay above page content (stays below mobile bottom nav z-40)
   * - `'inline'`: compact container for modals or embedded sections
   */
  variant?: 'page' | 'overlay' | 'inline';
  /**
   * Optional custom retry callback when loading exceeds the 10-second timeout.
   * Defaults to reloading the current page.
   */
  onRetry?: () => void;
  /**
   * Optional additional className on the outer wrapper.
   */
  className?: string;
}

export const BoardlyLoader: React.FC<BoardlyLoaderProps> = ({
  loading = true,
  progress,
  messages = DEFAULT_MESSAGES,
  variant = 'page',
  onRetry,
  className = '',
}) => {
  const safeMessages = messages.length > 0 ? messages : DEFAULT_MESSAGES;

  // Track mount/visibility lifecycle for minimum display time (400ms) + smooth fade-out (300ms)
  const [rendered, setRendered] = useState<boolean>(loading);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const shownAtRef = useRef<number>(loading ? Date.now() : 0);

  // Rotating status text state
  const [msgIndex, setMsgIndex] = useState<number>(0);
  const [msgVisible, setMsgVisible] = useState<boolean>(true);

  // 10-second timeout fallback state
  const [timedOut, setTimedOut] = useState<boolean>(false);
  const [retryCycle, setRetryCycle] = useState<number>(0);

  // Handle `loading` prop transitions with 400ms min display time and 300ms fade-out
  useEffect(() => {
    if (loading) {
      shownAtRef.current = Date.now();
      setRendered(true);
      setFadingOut(false);
      setTimedOut(false);
      return;
    }

    if (!rendered) return;

    const elapsed = Date.now() - (shownAtRef.current || Date.now());
    const remainingMinWait = Math.max(0, MIN_DISPLAY_MS - elapsed);

    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const minWaitTimer = setTimeout(() => {
      setFadingOut(true);
      fadeTimer = setTimeout(() => {
        setRendered(false);
        setFadingOut(false);
      }, FADE_OUT_MS);
    }, remainingMinWait);

    return () => {
      clearTimeout(minWaitTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [loading, rendered]);

  // Rotate status message every ~2 seconds with a soft fade
  useEffect(() => {
    if (!rendered || fadingOut || timedOut || safeMessages.length <= 1) return;

    let swapTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setMsgVisible(false);
      swapTimeout = setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % safeMessages.length);
        setMsgVisible(true);
      }, 220);
    }, MESSAGE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (swapTimeout) clearTimeout(swapTimeout);
    };
  }, [rendered, fadingOut, timedOut, safeMessages.length]);

  // 10-second timeout fallback
  useEffect(() => {
    if (!rendered || !loading) return;
    setTimedOut(false);

    const timer = setTimeout(() => {
      setTimedOut(true);
    }, TIMEOUT_FALLBACK_MS);

    return () => clearTimeout(timer);
  }, [rendered, loading, retryCycle]);

  if (!rendered) {
    return null;
  }

  const handleRetry = () => {
    setTimedOut(false);
    shownAtRef.current = Date.now();
    setRetryCycle((c) => c + 1);
    if (onRetry) {
      onRetry();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const hasDeterminateProgress =
    typeof progress === 'number' && !Number.isNaN(progress) && progress >= 0;
  const clampedProgress = hasDeterminateProgress
    ? Math.min(100, Math.max(0, progress))
    : undefined;

  const containerLayoutClass =
    variant === 'overlay'
      ? 'fixed inset-x-0 top-0 bottom-0 z-30 min-h-[100dvh] pb-[calc(84px+env(safe-area-inset-bottom,0px))] sm:pb-0'
      : variant === 'inline'
      ? 'relative w-full min-h-[280px] py-12 rounded-2xl'
      : 'relative w-full flex-1 min-h-[calc(100dvh-140px)] pb-[calc(84px+env(safe-area-inset-bottom,0px))] sm:pb-12';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!timedOut}
      className={`boardly-loader-root flex flex-col items-center justify-center px-5 select-none overflow-hidden ${containerLayoutClass} ${
        fadingOut ? 'boardly-loader-fade-out' : 'boardly-loader-fade-in'
      } ${className}`}
    >
      {/* Visually hidden accessible label */}
      <span className="sr-only">Loading</span>

      {/* Subtle dotted grid + soft radial red glow using theme tokens */}
      <div
        aria-hidden="true"
        className="boardly-loader-backdrop pointer-events-none absolute inset-0"
      />

      {/* Centered content column */}
      <div className="relative z-10 w-full max-w-[260px] flex flex-col items-center text-center">
        {/* 1. Centered Boardly wordmark in pixel font with subtle entrance animation */}
        <div className="boardly-loader-wordmark font-dot text-[28px] sm:text-[32px] font-extrabold tracking-tight text-[var(--text)] mb-4">
          Boardly
        </div>

        {/* 2. Slim red progress bar (~3px high, rounded, max-width ~220px) */}
        <div
          aria-hidden="true"
          className="boardly-loader-track w-full max-w-[220px] h-[3px] rounded-full overflow-hidden mb-3.5"
        >
          {clampedProgress !== undefined ? (
            <div
              className="boardly-loader-bar-determinate h-full rounded-full"
              style={{ width: `${clampedProgress}%` }}
            />
          ) : (
            <div className="boardly-loader-bar-indeterminate h-full w-full rounded-full" />
          )}
        </div>

        {/* 3. Rotating status line (~2s interval with soft fade) or 10s timeout fallback */}
        {!timedOut ? (
          <p
            className={`boardly-loader-message font-heading text-xs sm:text-[13px] font-medium text-[var(--text-muted)] min-h-[20px] leading-snug ${
              msgVisible ? 'boardly-loader-msg-visible' : 'boardly-loader-msg-hidden'
            }`}
          >
            {safeMessages[msgIndex % safeMessages.length]}
          </p>
        ) : (
          <div className="boardly-loader-timeout flex flex-col items-center gap-2.5 mt-0.5">
            <p className="font-heading text-xs sm:text-[13px] font-medium text-[var(--text-secondary)]">
              Taking longer than usual...
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="btn-secondary h-8 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Internal tracker rendered inside `<React.Suspense fallback={...}>` to notify
 * `BoardlySuspenseBoundary` only when a lazy route/component is genuinely suspended.
 */
const SuspenseFallbackSignal: React.FC<{
  onSuspendChange: (suspended: boolean) => void;
}> = ({ onSuspendChange }) => {
  useEffect(() => {
    onSuspendChange(true);
    return () => {
      onSuspendChange(false);
    };
  }, [onSuspendChange]);

  return null;
};

export interface BoardlySuspenseBoundaryProps {
  children: React.ReactNode;
  variant?: 'page' | 'overlay' | 'inline';
  messages?: string[];
}

/**
 * Wraps `<React.Suspense>` so that:
 * - If a route chunk is already loaded in memory, the loader never flashes at all.
 * - If a route chunk is genuinely loading, `BoardlyLoader` appears immediately,
 *   respects the ~400ms minimum display time so it never flickers on fast connections,
 *   fades out smoothly over ~300ms once content is ready, and removes itself from the DOM
 *   with zero layout shift.
 */
export const BoardlySuspenseBoundary: React.FC<BoardlySuspenseBoundaryProps> = ({
  children,
  variant = 'overlay',
  messages,
}) => {
  const [isSuspended, setIsSuspended] = useState(false);

  return (
    <>
      <BoardlyLoader
        loading={isSuspended}
        variant={variant}
        messages={messages}
      />
      <React.Suspense
        fallback={<SuspenseFallbackSignal onSuspendChange={setIsSuspended} />}
      >
        {children}
      </React.Suspense>
    </>
  );
};

export default BoardlyLoader;
