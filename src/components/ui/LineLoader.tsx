import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import {
  RoutePageSkeleton,
  FeedPostSkeletonCard,
  UniversityGridSkeleton,
} from './Skeleton';

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
  login: [''],
  signup: [''],
  dashboard: [''],
  universities: [''],
  test: [''],
  results: [''],
  admin: [''],
  import: [''],
  onboarding: [''],
  'verify-email': [''],
  general: [''],
  generic: [''],
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
  if (sample.includes('universit') || sample.includes('bank')) {
    return 'universities';
  }
  if (sample.includes('admin') || sample.includes('audit') || sample.includes('user')) {
    return 'admin';
  }
  if (sample.includes('score') || sample.includes('result') || sample.includes('answer')) {
    return 'results';
  }
  if (sample.includes('test') || sample.includes('question') || sample.includes('timer')) {
    return 'test';
  }
  return inferLoaderContextFromPath();
}

export interface LineLoaderProps {
  message?: string;
  messages?: string[];
  context?: LineLoaderContext;
  variant?: 'page' | 'overlay' | 'section' | 'inline';
  loading?: boolean;
  delayMs?: number;
  minDisplayMs?: number;
  timeoutMs?: number;
  error?: string | null;
  immediate?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * Facebook-style Skeleton Loader (Zero text messages, Zero full-screen blur gates).
 * Renders gray placeholder shapes in the exact layout of the active route/section.
 * Shows a compact local "Something went wrong" + "Try again" card if an error or timeout occurs.
 */
export const LineLoader: React.FC<LineLoaderProps> = ({
  message,
  messages,
  context,
  variant = 'section',
  loading = true,
  timeoutMs = 15000,
  error = null,
  onRetry,
  className = '',
}) => {
  const [timedOut, setTimedOut] = useState<boolean>(false);

  // Release any accidental body scroll locks on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!loading || error || timeoutMs <= 0) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [loading, error, timeoutMs]);

  const handleRetry = useCallback(() => {
    setTimedOut(false);
    if (onRetry) {
      onRetry();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [onRetry]);

  if (!loading && !error) {
    return null;
  }

  // Local non-blocking error / timeout state ("Something went wrong" + "Try again")
  if (error || timedOut) {
    const statusText = error || 'Something went wrong while loading this section.';
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="false"
        className={`w-full py-6 px-4 flex flex-col items-center justify-center select-none ${className}`}
      >
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle size={16} className="text-[var(--accent)] shrink-0" />
            <p className="text-xs font-medium text-[var(--text)] truncate">{statusText}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast,#fff)] hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            <RefreshCw size={12} />
            <span>Try again</span>
          </button>
        </div>
      </div>
    );
  }

  const resolvedContext = context || inferLoaderContextFromMessages(message, messages);

  // Inline variant (e.g. infinite scroll footer or compact block)
  if (variant === 'inline') {
    const lowerMsg = (message || '').toLowerCase();
    if (lowerMsg.includes('post')) {
      return (
        <div className={`w-full ${className}`}>
          <FeedPostSkeletonCard withAttachment={false} />
        </div>
      );
    }
    return (
      <div
        role="status"
        aria-busy="true"
        className={`w-full py-2 flex items-center justify-center ${className}`}
      >
        <div className="h-8 w-full max-w-sm rounded-xl skeleton" />
      </div>
    );
  }

  // Universities section variant
  if (resolvedContext === 'universities') {
    return (
      <div className={`w-full ${className}`}>
        <UniversityGridSkeleton count={6} />
      </div>
    );
  }

  // Page / Overlay / Section variants: render layout-matched gray skeletons without blocking the shell
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`w-full ${
        variant === 'page' || variant === 'overlay'
          ? 'max-w-5xl mx-auto px-3.5 sm:px-6 pt-3'
          : ''
      } ${className}`}
    >
      <RoutePageSkeleton />
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
