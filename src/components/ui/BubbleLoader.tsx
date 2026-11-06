import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

export const BUBBLE_LOADER_MESSAGES: readonly string[] = [
  'Preparing your study material, please wait...',
  'Great things take a few seconds. Hang tight!',
  'Every MCQ you review makes you stronger.',
  'Consistency beats talent. Keep going!',
  'Your future white coat is loading...',
  'Almost there, future doctor!',
  'Turning mistakes into exam-day clarity...',
  'Sharpening your medical & engineering concepts...',
  'Precision and patience build top scorers.',
  'Building your path to top merit...',
];

export type BubbleLoaderStage = 'idle' | 'bubbling' | 'progress' | 'success' | 'error';

export interface UseBubbleLoaderOptions {
  /**
   * Optional custom messages for this specific action (e.g. ["Checking your answers..."]),
   * mixed with the friendly encouraging messages.
   */
  customMessages?: string[];
  /**
   * Short text shown with the checkmark at 100% completion. Defaults to "Done!"
   */
  successText?: string;
  /**
   * Timeout in milliseconds before triggering the error state with Retry.
   * Defaults to 20000ms (20s) for normal actions; pass 60000ms (60s) for heavy downloads.
   */
  timeoutMs?: number;
  /**
   * Minimum duration (ms) before showing the progress bar for passive/section loads
   * so ultra-fast <400ms actions do not flicker. Defaults to 0 for explicit button taps
   * and 400ms for passive loads.
   */
  delayBeforeShowMs?: number;
  /**
   * Optional external boolean `loading` state for passive synchronization.
   */
  loading?: boolean;
  /**
   * Optional external real progress (0 - 100). When omitted, smart simulated progress
   * climbs quickly toward 80%, slows toward 95%, and jumps to 100% only on completion.
   */
  progress?: number;
  /**
   * Optional external error string.
   */
  error?: string | null;
  /**
   * Optional retry callback.
   */
  onRetry?: () => void;
}

export interface BubbleProgressSignal {
  /**
   * Update with real progress (0 - 100) or (current, total). Never goes backwards.
   */
  setProgress: (valueOrCurrent: number, total?: number) => void;
  /**
   * Optional status message override.
   */
  setMessage: (msg: string) => void;
  /**
   * AbortSignal triggered if the user taps Cancel or the timeout expires.
   */
  signal: AbortSignal;
}

export function useBubbleLoader(options: UseBubbleLoaderOptions = {}) {
  const {
    customMessages = [],
    successText = 'Done!',
    timeoutMs = 20000,
    delayBeforeShowMs = 0,
    loading: externalLoading,
    progress: externalProgress,
    error: externalError,
    onRetry,
  } = options;

  const [stage, setStage] = useState<BubbleLoaderStage>('idle');
  const [percent, setPercent] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [messageOpacity, setMessageOpacity] = useState<number>(1);

  const mergedMessages = React.useMemo(() => {
    const cleanCustom = customMessages.filter(Boolean);
    return cleanCustom.length > 0
      ? [...cleanCustom, ...BUBBLE_LOADER_MESSAGES]
      : [...BUBBLE_LOADER_MESSAGES];
  }, [customMessages]);

  const [currentMessage, setCurrentMessage] = useState<string>(
    mergedMessages[0] || BUBBLE_LOADER_MESSAGES[0]
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealProgressRef = useRef<boolean>(false);
  const lastActionRef = useRef<((helpers: BubbleProgressSignal) => Promise<any>) | null>(null);

  const releaseBodyLocks = useCallback(() => {
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (msgIntervalRef.current) {
      clearInterval(msgIntervalRef.current);
      msgIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      releaseBodyLocks();
    };
  }, [clearTimers, releaseBodyLocks]);

  // Synchronize with external `loading` boolean prop when used declaratively
  useEffect(() => {
    if (externalLoading === undefined) return;

    if (externalLoading) {
      hasRealProgressRef.current = typeof externalProgress === 'number';
      setErrorMessage('');
      setCurrentMessage(mergedMessages[0] || BUBBLE_LOADER_MESSAGES[0]);
      setMessageOpacity(1);

      const delayTimer = setTimeout(() => {
        setPercent((prev) => (prev > 1 ? prev : 1));
        setStage((prev) => (prev === 'idle' || prev === 'error' ? 'progress' : prev));
      }, delayBeforeShowMs);

      return () => clearTimeout(delayTimer);
    } else {
      // External loading finished
      setStage((prev) => {
        if (prev === 'progress' || prev === 'bubbling') {
          setPercent(100);
          setTimeout(() => {
            setStage('idle');
            setPercent(1);
          }, 320);
          return 'success';
        }
        return 'idle';
      });
      clearTimers();
      releaseBodyLocks();
    }
  }, [externalLoading, externalProgress, delayBeforeShowMs, mergedMessages, clearTimers, releaseBodyLocks]);

  // Synchronize external determinate progress
  useEffect(() => {
    if (typeof externalProgress === 'number' && !Number.isNaN(externalProgress)) {
      hasRealProgressRef.current = true;
      const clamped = Math.min(100, Math.max(1, Math.round(externalProgress)));
      setPercent((prev) => Math.max(prev, clamped));
    }
  }, [externalProgress]);

  // Synchronize external error
  useEffect(() => {
    if (externalError) {
      clearTimers();
      setErrorMessage(externalError);
      setStage('error');
    }
  }, [externalError, clearTimers]);

  // Smart simulated progress when real progress is not provided:
  // climbs quickly to ~80%, slows toward 95%, and never hits 100% until completion.
  useEffect(() => {
    if (stage !== 'progress' && stage !== 'bubbling') {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      return;
    }

    simIntervalRef.current = setInterval(() => {
      if (hasRealProgressRef.current) return;
      setPercent((prev) => {
        if (prev >= 95) return 95;
        if (prev < 50) return prev + 4;
        if (prev < 80) return prev + 2;
        return prev + 1;
      });
    }, 140);

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [stage]);

  // Timeout guard while in progress
  useEffect(() => {
    if (stage !== 'progress' && stage !== 'bubbling') return;

    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setErrorMessage('Taking longer than expected. Please check your connection and retry.');
      setStage('error');
      releaseBodyLocks();
    }, timeoutMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [stage, timeoutMs, releaseBodyLocks]);

  // Rotate friendly messages every 3 seconds with a soft fade
  useEffect(() => {
    if (stage !== 'progress') {
      if (msgIntervalRef.current) {
        clearInterval(msgIntervalRef.current);
        msgIntervalRef.current = null;
      }
      return;
    }

    msgIntervalRef.current = setInterval(() => {
      setMessageOpacity(0);
      setTimeout(() => {
        setCurrentMessage((prev) => {
          const candidates = mergedMessages.filter((m) => m !== prev);
          if (candidates.length === 0) return mergedMessages[0] || BUBBLE_LOADER_MESSAGES[0];
          const idx = Math.floor(Math.random() * candidates.length);
          return candidates[idx];
        });
        setMessageOpacity(1);
      }, 240);
    }, 3000);

    return () => {
      if (msgIntervalRef.current) {
        clearInterval(msgIntervalRef.current);
        msgIntervalRef.current = null;
      }
    };
  }, [stage, mergedMessages]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearTimers();
    releaseBodyLocks();
    setErrorMessage('Action cancelled.');
    setStage('error');
  }, [clearTimers, releaseBodyLocks]);

  const run = useCallback(
    async <T,>(action: (helpers: BubbleProgressSignal) => Promise<T>): Promise<T | undefined> => {
      if (stage === 'bubbling' || stage === 'progress') return undefined;

      lastActionRef.current = action;
      releaseBodyLocks();
      clearTimers();
      hasRealProgressRef.current = false;
      setErrorMessage('');
      setPercent(1);
      setCurrentMessage(mergedMessages[0] || BUBBLE_LOADER_MESSAGES[0]);
      setMessageOpacity(1);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const helpers: BubbleProgressSignal = {
        setProgress: (valueOrCurrent: number, total?: number) => {
          if (abortController.signal.aborted) return;
          hasRealProgressRef.current = true;
          const raw =
            typeof total === 'number' && total > 0
              ? (valueOrCurrent / total) * 100
              : valueOrCurrent;
          const clamped = Math.min(99, Math.max(1, Math.round(raw)));
          setPercent((prev) => Math.max(prev, clamped));
        },
        setMessage: (msg: string) => {
          if (!abortController.signal.aborted && msg) {
            setCurrentMessage(msg);
          }
        },
        signal: abortController.signal,
      };

      const startTime = Date.now();

      // Start action immediately, and show droplet bubble morph if it takes >400ms or is an interactive action
      setStage('bubbling');
      const morphTimer = setTimeout(() => {
        if (!abortController.signal.aborted) {
          setStage('progress');
        }
      }, 360);

      try {
        const result = await action(helpers);
        clearTimeout(morphTimer);

        if (abortController.signal.aborted) {
          return undefined;
        }

        const elapsed = Date.now() - startTime;
        // If action finished in <250ms, skip prolonged progress bar to avoid flicker
        if (elapsed < 250 && !hasRealProgressRef.current) {
          setPercent(100);
          setStage('idle');
          return result;
        }

        setPercent(100);
        setStage('success');
        clearTimers();

        setTimeout(() => {
          setStage((current) => (current === 'success' ? 'idle' : current));
          setPercent(1);
        }, 1600);

        return result;
      } catch (err: any) {
        clearTimeout(morphTimer);
        clearTimers();
        if (abortController.signal.aborted) {
          setErrorMessage('Action cancelled.');
        } else {
          setErrorMessage(err?.message || 'Something went wrong. Please retry.');
        }
        setStage('error');
        throw err;
      } finally {
        releaseBodyLocks();
      }
    },
    [stage, mergedMessages, clearTimers, releaseBodyLocks]
  );

  const retry = useCallback(() => {
    if (onRetry) {
      setErrorMessage('');
      setPercent(1);
      setStage('progress');
      onRetry();
      return;
    }
    if (lastActionRef.current) {
      run(lastActionRef.current).catch(() => {});
    } else {
      setStage('idle');
    }
  }, [onRetry, run]);

  const reset = useCallback(() => {
    clearTimers();
    releaseBodyLocks();
    setStage('idle');
    setPercent(1);
    setErrorMessage('');
  }, [clearTimers, releaseBodyLocks]);

  return {
    stage,
    percent,
    currentMessage,
    messageOpacity,
    errorMessage,
    successText,
    isRunning: stage === 'bubbling' || stage === 'progress',
    run,
    cancel,
    retry,
    reset,
    setPercent: (val: number) => {
      hasRealProgressRef.current = true;
      setPercent((prev) => Math.max(prev, Math.min(100, Math.max(1, Math.round(val)))));
    },
  };
}

export interface BubbleLoaderProps {
  /**
   * Visual placement mode:
   * - `'section'`: centered red progress line + percentage + rotating messages inside a page/card section
   * - `'top-bar'`: slim bar pinned at the top of the section/viewport with percentage & message strip
   * - `'inline'`: compact horizontal bar for buttons, drawers, or small action areas
   * - `'overlay'`: full-viewport loader with skeleton backdrop
   */
  variant?: 'section' | 'top-bar' | 'inline' | 'overlay';
  /**
   * Controls whether the loader is active. Defaults to `true`.
   */
  loading?: boolean;
  /**
   * Optional real progress (1 - 100). If omitted, uses smart simulated progress (climbs to 80%, slows to 95%).
   */
  progress?: number;
  /**
   * Custom status messages mixed with the friendly encouraging study messages.
   */
  messages?: string[];
  /**
   * Optional explicit stage override (used when connected to `useBubbleLoader()`).
   */
  stage?: BubbleLoaderStage;
  /**
   * Optional explicit percentage override (used when connected to `useBubbleLoader()`).
   */
  percent?: number;
  /**
   * Optional explicit message override.
   */
  currentMessage?: string;
  /**
   * Optional message opacity for soft fade.
   */
  messageOpacity?: number;
  /**
   * Optional error message to trigger the error + Retry state.
   */
  error?: string | null;
  /**
   * Optional text shown with the checkmark at 100%.
   */
  successText?: string;
  /**
   * Optional retry callback on error or timeout.
   */
  onRetry?: () => void;
  /**
   * Optional cancel callback for long operations (e.g. downloads).
   */
  onCancel?: () => void;
  /**
   * Show skeleton placeholder rows behind a section load so layout never jumps.
   */
  showSkeletons?: boolean;
  skeletonCount?: number;
  /**
   * Delay in ms before displaying passive section loads (<400ms actions won't flicker).
   * Defaults to 0 when rendered inside an existing loading branch, or can be set to 400.
   */
  delayMs?: number;
  timeoutMs?: number;
  className?: string;
}

export const BubbleLoader: React.FC<BubbleLoaderProps> = ({
  variant = 'section',
  loading = true,
  progress,
  messages,
  stage: controlledStage,
  percent: controlledPercent,
  currentMessage: controlledMessage,
  messageOpacity: controlledOpacity,
  error: controlledError,
  successText = 'Done!',
  onRetry,
  onCancel,
  showSkeletons = false,
  skeletonCount = 3,
  delayMs = 0,
  timeoutMs = 20000,
  className = '',
}) => {
  const internal = useBubbleLoader({
    loading,
    progress,
    customMessages: messages,
    error: controlledError,
    successText,
    timeoutMs,
    delayBeforeShowMs: delayMs,
    onRetry,
  });

  const activeStage = controlledStage ?? internal.stage;
  const activePercent = controlledPercent ?? internal.percent;
  const activeMessage = controlledMessage ?? internal.currentMessage;
  const activeOpacity = controlledOpacity ?? internal.messageOpacity;
  const activeError = controlledError || internal.errorMessage;
  const handleRetry = onRetry || internal.retry;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  if (!loading && activeStage === 'idle') {
    return null;
  }

  const scaleRatio = Math.max(0.01, Math.min(1, activePercent / 100));

  // Error State
  if (activeStage === 'error' || activeError) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 w-full max-w-md mx-auto ${className}`}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="flex items-center gap-1.5 text-center">
          <AlertCircle size={14} className="shrink-0 text-red-500" />
          <span className="font-medium leading-snug">
            {activeError || 'Action timed out or failed. Please try again.'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D71921] text-white font-bold text-xs hover:opacity-95 transition-opacity cursor-pointer"
        >
          <RefreshCw size={11} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // Success State at 100%
  if (activeStage === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm ${className}`}
        style={{ willChange: 'transform, opacity' }}
      >
        <CheckCircle2 size={14} className="shrink-0 text-white" />
        <span>{successText}</span>
      </div>
    );
  }

  // Compact Inline Variant (used inside buttons, comment submits, inline actions)
  if (variant === 'inline') {
    return (
      <div
        role="progressbar"
        aria-valuenow={activePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={activeMessage}
        className={`flex flex-col gap-1 w-full min-w-[140px] select-none ${className}`}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold leading-none">
          <span className="font-mono font-bold text-[#D71921] tabular-nums">
            {activePercent}%
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="inline-flex items-center gap-0.5 text-[10px] text-[var(--muted,#64748b)] hover:text-red-500 cursor-pointer"
            >
              <X size={11} />
              <span>Cancel</span>
            </button>
          )}
        </div>
        <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-red-500/15">
          <div
            className="h-full w-full bg-[#D71921] rounded-full"
            style={{
              transformOrigin: 'left center',
              transform: `scaleX(${scaleRatio})`,
              transition: prefersReducedMotion ? 'none' : 'transform 160ms ease-out',
              willChange: 'transform',
            }}
          />
        </div>
        <div
          aria-live="polite"
          className="text-[10px] text-[var(--muted,#64748b)] truncate italic leading-tight"
          style={{
            opacity: activeOpacity,
            transition: prefersReducedMotion ? 'none' : 'opacity 240ms ease-in-out',
            willChange: 'opacity',
          }}
        >
          {activeMessage}
        </div>
      </div>
    );
  }

  // Top-Bar Variant
  if (variant === 'top-bar') {
    return (
      <div
        role="progressbar"
        aria-valuenow={activePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full flex flex-col gap-1.5 py-2 select-none ${className}`}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-red-500/15">
          <div
            className="h-full w-full bg-[#D71921] rounded-full"
            style={{
              transformOrigin: 'left center',
              transform: `scaleX(${scaleRatio})`,
              transition: prefersReducedMotion ? 'none' : 'transform 160ms ease-out',
              willChange: 'transform',
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-1 text-xs">
          <span
            aria-live="polite"
            className="text-[var(--muted,#64748b)] italic truncate"
            style={{
              opacity: activeOpacity,
              transition: prefersReducedMotion ? 'none' : 'opacity 240ms ease-in-out',
              willChange: 'opacity',
            }}
          >
            {activeMessage}
          </span>
          <span className="font-mono font-bold text-[#D71921] tabular-nums shrink-0">
            {activePercent}%
          </span>
        </div>
      </div>
    );
  }

  // Section or Overlay Variant
  const isOverlay = variant === 'overlay';

  return (
    <div
      role="progressbar"
      aria-valuenow={activePercent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative flex flex-col items-center justify-center select-none ${
        isOverlay
          ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] overlay-blur bg-black/60 backdrop-blur-md px-5'
          : 'w-full py-8 px-4'
      } ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Optional non-jumping skeleton placeholders behind section loader */}
      {showSkeletons && !isOverlay && (
        <div
          aria-hidden="true"
          className="w-full space-y-3 opacity-35 pointer-events-none mb-4"
        >
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <div
              key={idx}
              className="w-full h-16 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-2 text-center z-10">
        <div className="w-full flex items-center justify-between text-xs font-semibold px-0.5">
          <span className="font-dot text-sm font-extrabold tracking-tight text-[var(--text)]">
            Boardly
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#D71921] tabular-nums">
              {activePercent}%
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-0.5 text-[11px] text-[var(--muted,#64748b)] hover:text-red-500 cursor-pointer"
              >
                <X size={12} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Thin straight RED progress line filling left-to-right via scaleX */}
        <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-red-500/15">
          <div
            className="h-full w-full bg-[#D71921] rounded-full"
            style={{
              transformOrigin: 'left center',
              transform: `scaleX(${scaleRatio})`,
              transition: prefersReducedMotion ? 'none' : 'transform 160ms ease-out',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Friendly rotating message every 3 seconds with soft fade */}
        <p
          aria-live="polite"
          className="min-h-[20px] text-xs text-[var(--muted,#64748b)] italic leading-snug"
          style={{
            opacity: activeOpacity,
            transition: prefersReducedMotion ? 'none' : 'opacity 240ms ease-in-out',
            willChange: 'opacity',
          }}
        >
          {activeMessage}
        </p>
      </div>

      <style>{`
        @keyframes boardlyDropletBubble {
          0% {
            transform: scale(1, 1);
            opacity: 1;
          }
          35% {
            transform: scale(1.14, 0.88);
            opacity: 1;
          }
          70% {
            transform: scale(0.94, 1.12);
            opacity: 0.96;
          }
          100% {
            transform: scale(1.22, 0.18);
            opacity: 0.35;
          }
        }
      `}</style>
    </div>
  );
};

export default BubbleLoader;
