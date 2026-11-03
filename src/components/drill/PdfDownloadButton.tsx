import React, { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import type { PdfExportProgress } from '@/utils/testPdfExporter';
import { ButtonLineLoader } from '@/components/ui/LineLoader';

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
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const startDownloadFlow = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    if (disabled || isExporting || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsExporting(true);
    setErrorMsg(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await onDownload(() => {}, controller.signal);
    } catch (err) {
      console.error('[PdfDownloadButton] Error exporting PDF:', err);
      setErrorMsg('Download failed');
    } finally {
      inFlightRef.current = false;
      setIsExporting(false);
      abortRef.current = null;
    }
  };

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

  return (
    <button
      type="button"
      onClick={startDownloadFlow}
      disabled={disabled || isExporting}
      className={`group relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer select-none transition-transform duration-200 active:scale-[0.98] disabled:opacity-65 disabled:cursor-not-allowed ${getVariantStyles()} ${className}`}
    >
      {!isExporting && (
        <Download
          size={15}
          className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5"
        />
      )}
      <span>
        {isExporting
          ? 'Preparing PDF...'
          : errorMsg
          ? 'Retry PDF'
          : label}
      </span>
      {isExporting && <ButtonLineLoader />}
    </button>
  );
};

export default PdfDownloadButton;

