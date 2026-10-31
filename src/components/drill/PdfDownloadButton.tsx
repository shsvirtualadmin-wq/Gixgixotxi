import React from 'react';
import { Download } from 'lucide-react';
import type { PdfExportProgress } from '@/utils/testPdfExporter';
import { BubbleLoader, useBubbleLoader, BUBBLE_LOADER_MESSAGES } from '@/components/ui/BubbleLoader';

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

export const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({
  onDownload,
  label = 'Download PDF',
  className = '',
  variant = 'primary',
  disabled = false,
}) => {
  const loader = useBubbleLoader({
    customMessages: [...BUBBLE_LOADER_MESSAGES],
    successText: 'Your report is ready',
    timeoutMs: 60000,
  });

  const startDownloadFlow = () => {
    if (disabled || loader.isRunning) return;
    loader
      .run(async ({ setProgress, signal }) => {
        await onDownload((prog: PdfExportProgress) => {
          if (prog.totalPages > 0) {
            setProgress(prog.current, prog.totalPages);
          }
        }, signal);
      })
      .catch((err) => {
        console.error('[PdfDownloadButton] Error exporting PDF:', err);
      });
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

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

  // Morph into BubbleLoader when in progress, completed, or errored
  if (loader.stage === 'progress' || loader.stage === 'success' || loader.stage === 'error') {
    return (
      <div className={`w-full min-w-[230px] max-w-md ${className}`}>
        <BubbleLoader
          variant="inline"
          stage={loader.stage}
          percent={loader.percent}
          currentMessage={loader.currentMessage}
          messageOpacity={loader.messageOpacity}
          error={loader.errorMessage}
          successText={loader.successText}
          onCancel={loader.cancel}
          onRetry={startDownloadFlow}
        />
      </div>
    );
  }

  const isBubbling = loader.stage === 'bubbling' && !prefersReducedMotion;

  return (
    <button
      type="button"
      onClick={startDownloadFlow}
      disabled={disabled || loader.stage === 'bubbling'}
      className={`group relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer select-none transition-transform duration-200 active:scale-[0.98] disabled:opacity-90 ${getVariantStyles()} ${className}`}
      style={{
        transformOrigin: 'center center',
        willChange: 'transform, opacity',
        animation: isBubbling
          ? 'boardlyDropletBubble 360ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
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
