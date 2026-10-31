import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import type { PdfExportProgress } from '@/utils/testPdfExporter';

export interface PdfDownloadButtonProps {
  onDownload: (
    onProgress: (prog: PdfExportProgress) => void,
    signal?: AbortSignal
  ) => Promise<void>;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'compact';
  disabled?: boolean;
}

const FRIENDLY_MESSAGES = [
  'Preparing your study material, please wait...',
  'Great things take a few seconds. Hang tight!',
  'Every MCQ you review makes you stronger.',
  'Consistency beats talent. Keep going!',
  'Your future white coat is loading...',
  'Almost there, future doctor!',
  'Turning mistakes into exam-day clarity...',
  'Sharpening your medical & engineering concepts...',
  'Precision and patience build top scorers.',
];

type DownloadState = 'idle' | 'bubbling' | 'progress' | 'success' | 'error';

export const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({
  onDownload,
  label = 'Download PDF',
  className = '',
  variant = 'primary',
  disabled = false,
}) => {
  const [state, setState] = useState<DownloadState>('idle');
  const [percent, setPercent] = useState<number>(1);
  const [currentMessage, setCurrentMessage] = useState<string>(FRIENDLY_MESSAGES[0]);
  const [messageOpacity, setMessageOpacity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Restore scroll in document body whenever state changes or unmounts
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      }
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, []);

  // Soft-fade message rotation every 3 seconds, picked randomly without immediate repetition
  useEffect(() => {
    if (state !== 'progress') {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      return;
    }

    messageIntervalRef.current = setInterval(() => {
      // 1. Soft fade out
      setMessageOpacity(0);

      // 2. Change message after 260ms fade-out
      setTimeout(() => {
        setCurrentMessage((prev) => {
          const available = FRIENDLY_MESSAGES.filter((m) => m !== prev);
          const randomIndex = Math.floor(Math.random() * available.length);
          return available[randomIndex] || FRIENDLY_MESSAGES[0];
        });
        // 3. Soft fade in
        setMessageOpacity(1);
      }, 260);
    }, 3000);

    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, [state]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    setState('error');
    setErrorMessage('Download cancelled.');
  }, []);

  const startDownloadFlow = useCallback(async () => {
    if (disabled || state === 'progress' || state === 'bubbling') return;

    // Reset state & ensure scroll is never locked
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }

    setErrorMessage('');
    setPercent(1);
    setCurrentMessage(FRIENDLY_MESSAGES[0]);
    setMessageOpacity(1);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 60-second safety timeout
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(() => {
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        setState('error');
        setErrorMessage('PDF export timed out after 60 seconds. Please tap Retry.');
      }
    }, 60000);

    // 1. Tap "Download PDF": the button bubbles out (scales up smoothly like a stretching droplet)
    setState('bubbling');
    await new Promise((r) => setTimeout(r, 420));

    if (abortController.signal.aborted) return;

    // 2. Morph into a thin straight RED progress line across the card
    setState('progress');

    try {
      await onDownload((prog: PdfExportProgress) => {
        if (abortController.signal.aborted) return;

        // Calculate REAL progress (questions processed / total), never let it go backwards
        if (prog.totalPages > 0) {
          const calcPercent = Math.min(
            100,
            Math.max(1, Math.round((prog.current / prog.totalPages) * 100))
          );
          setPercent((prev) => Math.max(prev, calcPercent));
        }
      }, abortController.signal);

      if (abortController.signal.aborted) return;

      // 3. Reach 100% and show success
      setPercent(100);
      await new Promise((r) => setTimeout(r, 250));

      if (abortController.signal.aborted) return;

      // 4. Checkmark state with "Your report is ready"
      setState('success');
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

      // 5. Animate back into normal button after 2.2 seconds
      setTimeout(() => {
        setState((current) => (current === 'success' ? 'idle' : current));
        setPercent(1);
      }, 2200);
    } catch (err: any) {
      if (abortController.signal.aborted) {
        setState('error');
        setErrorMessage('Download cancelled.');
      } else {
        console.error('[PdfDownloadButton] Error exporting PDF:', err);
        setState('error');
        setErrorMessage(err?.message || 'Failed to generate PDF. Please retry.');
      }
    } finally {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      }
    }
  }, [disabled, onDownload, state]);

  // Reduced motion media query check
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // Base button styles per variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-[var(--surface-2,#f1f5f9)] text-[var(--text,#0f172a)] hover:bg-[var(--border,#e2e8f0)] border border-[var(--border,#e2e8f0)]';
      case 'outline':
        return 'bg-transparent text-[var(--text,#0f172a)] hover:bg-[var(--surface-2,#f8fafc)] border border-[var(--border,#cbd5e1)]';
      case 'compact':
        return 'bg-[var(--accent,#D71921)] text-white hover:opacity-95 text-xs py-1.5 px-3';
      case 'primary':
      default:
        return 'bg-[var(--accent,#D71921)] text-white hover:opacity-95 shadow-sm';
    }
  };

  // State: Success Checkmark
  if (state === 'success') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-opacity duration-200 ${className}`}
        style={{ willChange: 'transform, opacity' }}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 size={16} className="text-white shrink-0" />
        <span>Your report is ready</span>
      </div>
    );
  }

  // State: Error or Cancelled with clear message and Retry button
  if (state === 'error') {
    return (
      <div
        className={`flex flex-col gap-1.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 w-full max-w-sm ${className}`}
        style={{ willChange: 'transform, opacity' }}
        role="alert"
      >
        <div className="flex items-start gap-1.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
          <span className="font-medium leading-tight flex-1">{errorMessage}</span>
        </div>
        <button
          type="button"
          onClick={startDownloadFlow}
          className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer"
        >
          <RefreshCw size={11} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // State: Progress Line across the card
  if (state === 'progress') {
    const scaleRatio = Math.max(0.01, Math.min(1, percent / 100));

    return (
      <div
        className={`flex flex-col gap-1.5 w-full min-w-[230px] max-w-md select-none ${className}`}
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Top Header: Progress percentage & Cancel button */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[#D71921] font-mono font-bold tabular-nums">
            {percent}%
          </span>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted,#64748b)] hover:text-red-600 transition-colors cursor-pointer px-1.5 py-0.5 rounded"
            title="Cancel PDF export"
          >
            <X size={12} />
            <span>Cancel</span>
          </button>
        </div>

        {/* Thin straight RED progress line across the card */}
        <div
          className="relative w-full h-1.5 rounded-full overflow-hidden bg-red-500/15"
          style={{ willChange: 'transform' }}
        >
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

        {/* Friendly motivating messages under the line with soft opacity fade */}
        <div
          className="min-h-[18px] text-[11px] text-[var(--muted,#64748b)] leading-tight italic"
          style={{
            opacity: messageOpacity,
            transition: prefersReducedMotion ? 'none' : 'opacity 260ms ease-in-out',
            willChange: 'opacity',
          }}
        >
          {currentMessage}
        </div>
      </div>
    );
  }

  // State: Idle or Bubbling Button (stretching droplet effect before morphing into red line)
  const isBubbling = state === 'bubbling' && !prefersReducedMotion;

  return (
    <button
      type="button"
      onClick={startDownloadFlow}
      disabled={disabled || state === 'bubbling'}
      className={`group relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer select-none transition-transform duration-200 active:scale-[0.98] disabled:opacity-90 ${getVariantStyles()} ${className}`}
      style={{
        transformOrigin: 'center center',
        willChange: 'transform, opacity',
        animation: isBubbling
          ? 'boardlyDropletBubble 420ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          : 'none',
      }}
    >
      <Download
        size={15}
        className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5"
      />
      <span>{label}</span>

      <style>{`
        @keyframes boardlyDropletBubble {
          0% {
            transform: scale(1, 1);
            opacity: 1;
          }
          35% {
            transform: scale(1.16, 0.86);
            opacity: 1;
          }
          70% {
            transform: scale(0.92, 1.14);
            opacity: 0.95;
          }
          100% {
            transform: scale(1.28, 0.14);
            opacity: 0.3;
          }
        }
      `}</style>
    </button>
  );
};

export default PdfDownloadButton;
