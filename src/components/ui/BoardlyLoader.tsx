import React, { useEffect, useRef, useState } from 'react';
import { BUBBLE_LOADER_MESSAGES, BubbleLoader } from './BubbleLoader';

export const APP_LOADER_MESSAGES = [
  ...BUBBLE_LOADER_MESSAGES,
];

const DEFAULT_MESSAGES = APP_LOADER_MESSAGES;

const MIN_DISPLAY_MS = 400;
const FADE_OUT_MS = 300;
const TIMEOUT_FALLBACK_MS = 20000;

export interface BoardlyLoaderProps {
  /**
   * Controls whether the loader is active. Defaults to `true` when rendered directly
   * (e.g. inside a Suspense fallback). When toggled from `true` to `false`, the loader
   * enforces the ~400ms minimum display time, smoothly fades out over ~300ms, and then
   * removes itself from the DOM.
   */
  loading?: boolean;
  /**
   * Optional real progress percentage (0 - 100). If omitted, uses smart simulated
   * progress (climbs quickly to 80%, slows toward 95%, jumps to 100% on completion).
   */
  progress?: number;
  /**
   * Custom rotating status lines mixed with the friendly encouraging messages.
   */
  messages?: string[];
  /**
   * Layout mode:
   * - `'page'` (default): full-screen fixed viewport cover (`fixed inset-0 z-[9999]`)
   * - `'overlay'`: full-screen fixed viewport cover (`fixed inset-0 z-[9999]`)
   * - `'inline'`: compact container for modals or embedded sections
   */
  variant?: 'page' | 'overlay' | 'inline';
  /**
   * Optional custom retry callback when loading exceeds the timeout.
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
  const [rendered, setRendered] = useState<boolean>(loading);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const shownAtRef = useRef<number>(loading ? Date.now() : 0);

  // Release any accidental body scroll locks on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      }
    };
  }, []);

  // Handle `loading` prop transitions with 400ms min display time and 300ms fade-out
  useEffect(() => {
    if (loading) {
      shownAtRef.current = Date.now();
      setRendered(true);
      setFadingOut(false);
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

  if (!rendered) {
    return null;
  }

  const handleRetry = () => {
    shownAtRef.current = Date.now();
    if (onRetry) {
      onRetry();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const containerLayoutClass =
    variant === 'inline'
      ? 'relative w-full min-h-[220px] py-10 rounded-2xl'
      : 'fixed inset-0 z-[9999] w-screen h-[100dvh]';

  return (
    <div
      className={`boardly-loader-root flex flex-col items-center justify-center px-5 select-none overflow-hidden ${containerLayoutClass} ${
        fadingOut ? 'boardly-loader-fade-out' : 'boardly-loader-fade-in'
      } ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      <div
        aria-hidden="true"
        className="boardly-loader-backdrop pointer-events-none absolute inset-0"
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        <BubbleLoader
          variant="section"
          loading={loading}
          progress={progress}
          messages={messages}
          timeoutMs={TIMEOUT_FALLBACK_MS}
          onRetry={handleRetry}
          showSkeletons={variant === 'inline'}
          skeletonCount={2}
        />
      </div>
    </div>
  );
};

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

function getSectionMessagesForPath(
  pathname: string,
  variant: 'page' | 'overlay' | 'inline'
): string[] {
  if (variant === 'page') {
    return APP_LOADER_MESSAGES;
  }
  const clean = pathname.toLowerCase();
  if (clean.startsWith('/material') || clean.startsWith('/dashboard/notes')) {
    return ['Preparing your study material, please wait...', ...BUBBLE_LOADER_MESSAGES];
  }
  if (clean.startsWith('/commons') || clean.startsWith('/dashboard/commons')) {
    return ['Loading Commons discussions...', ...BUBBLE_LOADER_MESSAGES];
  }
  if (clean.startsWith('/dashboard/notifications')) {
    return ['Checking your latest notifications...', ...BUBBLE_LOADER_MESSAGES];
  }
  return APP_LOADER_MESSAGES;
}

export const BoardlySuspenseBoundary: React.FC<BoardlySuspenseBoundaryProps> = ({
  children,
  variant = 'overlay',
  messages,
}) => {
  const [isSuspended, setIsSuspended] = useState(false);

  const resolvedMessages =
    messages && messages.length > 0
      ? messages
      : typeof window !== 'undefined'
      ? getSectionMessagesForPath(window.location.pathname, variant)
      : APP_LOADER_MESSAGES;

  return (
    <>
      <BoardlyLoader
        loading={isSuspended}
        variant={variant}
        messages={resolvedMessages}
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
