import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { PdfExportProgress } from '@/utils/testPdfExporter';

export interface PdfDownloadButtonProps {
  onDownload: (onProgress: (prog: PdfExportProgress) => void) => Promise<void>;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'compact';
  disabled?: boolean;
}

const MOTIVATING_MESSAGES = [
  'Preparing your study material, please wait...',
  'Great things take a few seconds. Hang tight!',
  'Every MCQ you review makes you stronger.',
  'Consistency beats talent. Keep going!',
  'Your future white coat is loading...',
  'Almost there, future doctor!',
  'Sharpening your medical & engineering concepts...',
  'Turning mistakes into exam-day clarity...',
  'Verifying high-yield explanations...',
];

type DownloadState = 'idle' | 'bubbling' | 'progress' | 'success' | 'error';

export const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({
  onDownload,
  label = 'Download Verified Drill Report',
  className = '',
  variant = 'primary',
  disabled = false,
}) => {
  const [state, setState] = useState<DownloadState>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [displayedPercent, setDisplayedPercent] = useState<number>(0);
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const targetPercentRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Smooth monotonic percentage animation (non-decreasing)
  useEffect(() => {
    if (state !== 'progress' && state !== 'bubbling') return;

    const smoothStep = () => {
      setDisplayedPercent((prev) => {
        const target = targetPercentRef.current;
        if (prev >= target) return prev;
        // Step smoothly towards target
        const diff = target - prev;
        const step = Math.max(1, Math.ceil(diff * 0.15));
        return Math.min(100, prev + step);
      });
      animFrameRef.current = requestAnimationFrame(smoothStep);
    };

    animFrameRef.current = requestAnimationFrame(smoothStep);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state]);

  // Rotate motivating messages every 2.5 seconds
  useEffect(() => {
    if (state !== 'progress') return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MOTIVATING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [state]);

  const startDownloadFlow = useCallback(async () => {
    if (disabled || state === 'progress' || state === 'bubbling') return;

    isCancelledRef.current = false;
    setErrorMessage('');
    targetPercentRef.current = 6;
    setProgressPercent(6);
    setDisplayedPercent(6);
    setMessageIndex(0);

    // Step 1: Bubbling stretching droplet animation
    setState('bubbling');

    // After 400ms bubble morph, transition to sleek progress line
    await new Promise((res) => setTimeout(res, 420));
    if (isCancelledRef.current) return;

    setState('progress');
    targetPercentRef.current = 15;

    try {
      await onDownload((prog: PdfExportProgress) => {
        if (isCancelledRef.current) return;
        // Map real progress into 15% -> 96%
        if (prog.totalPages > 0) {
          const ratio = Math.min(1, Math.max(0, prog.current / prog.totalPages));
          const calculated = Math.round(18 + ratio * 78);
          targetPercentRef.current = Math.max(targetPercentRef.current, calculated);
          setProgressPercent(targetPercentRef.current);
        }
      });

      // Complete to 100%
      targetPercentRef.current = 100;
      setDisplayedPercent(100);

      // Brief delay to display 100% then trigger success
      await new Promise((res) => setTimeout(res, 350));
      if (isCancelledRef.current) return;

      setState('success');

      // Return to idle after 2.2 seconds
      setTimeout(() => {
        if (!isCancelledRef.current) {
          setState('idle');
          setDisplayedPercent(0);
          targetPercentRef.current = 0;
        }
      }, 2200);
    } catch (err: any) {
      console.error('[PdfDownloadButton] Download error:', err);
      setState('error');
      setErrorMessage(
        err?.message || 'PDF export interrupted. Please check network and retry.'
      );
    }
  }, [disabled, onDownload, state]);

  // Handle retry
  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    startDownloadFlow();
  };

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

  // Reduced motion media query check
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // Render State: Success
  if (state === 'success') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs sm:text-sm shadow-md transition-all duration-300 animate-in fade-in zoom-in-95 ${className}`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 size={16} className="text-white shrink-0 animate-bounce" />
        <span>Your report is ready!</span>
      </div>
    );
  }

  // Render State: Error with Retry
  if (state === 'error') {
    return (
      <div
        className={`flex flex-col gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 max-w-sm ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
          <span className="font-medium leading-tight">{errorMessage}</span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
          <span>Retry Download</span>
        </button>
      </div>
    );
  }

  // Render State: Progress morph line
  if (state === 'progress' || state === 'bubbling') {
    const isDropletBubbling = state === 'bubbling' && !prefersReducedMotion;

    return (
      <div
        className={`flex flex-col gap-2 w-full max-w-xs sm:max-w-sm transition-all duration-300 ${className}`}
        aria-label="Exporting PDF document"
      >
        {/* Top Info Strip: Message & Percentage */}
        <div className="flex items-center justify-between text-xs font-medium text-[var(--muted,#64748b)]">
          <span className="truncate pr-2 transition-opacity duration-300 text-[11px] sm:text-xs">
            {MOTIVATING_MESSAGES[messageIndex]}
          </span>
          <span className="font-mono font-bold text-[var(--accent,#D71921)] shrink-0 text-xs tabular-nums">
            {displayedPercent}%
          </span>
        </div>

        {/* Straight Red Progress Line */}
        <div
          className={`relative w-full h-1.5 sm:h-2 rounded-full bg-[var(--surface-2,#e2e8f0)] overflow-hidden transition-all duration-300 ${
            isDropletBubbling ? 'scale-y-150 animate-pulse' : ''
          }`}
        >
          <div
            className="h-full bg-[var(--accent,#D71921)] rounded-full transition-[width] ease-out duration-150 shadow-[0_0_8px_rgba(215,25,33,0.5)]"
            style={{ width: `${Math.max(4, displayedPercent)}%` }}
          />
        </div>

        {/* Traceability subtle subtext */}
        <div className="flex items-center justify-between text-[10px] text-[var(--muted,#94a3b8)]">
          <span>Boardly Verified Export</span>
          <span>A4 · Vector PDF</span>
        </div>
      </div>
    );
  }

  // Render State: Idle
  return (
    <button
      type="button"
      onClick={startDownloadFlow}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${getVariantStyles()} ${className}`}
      style={{
        transformOrigin: 'center center',
      }}
    >
      <Download
        size={15}
        className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110"
      />
      <span>{label}</span>
    </button>
  );
};

export default PdfDownloadButton;
