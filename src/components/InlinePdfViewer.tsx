import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  RefreshCw,
  FileText
} from 'lucide-react';
import { fetchPdfBinary, openExternalPdfBrowser, resolveProxyPdfUrl } from '../lib/pdfExport';

interface InlinePdfViewerProps {
  fileUrl: string;
  title: string;
  currentPage: number;
  onPageChange: (page: number, totalPages: number) => void;
  searchQuery?: string;
  children?: React.ReactNode;
  onPdfLoaded?: (totalPages: number) => void;
}

export const InlinePdfViewer: React.FC<InlinePdfViewerProps> = ({
  fileUrl,
  title,
  currentPage,
  onPageChange,
  children,
  onPdfLoaded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [useNativeViewerFallback, setUseNativeViewerFallback] = useState<boolean>(false);

  const renderTaskRef = useRef<any>(null);
  const activeDocRef = useRef<any>(null);

  // Load PDF Document with strict timeout & error handling
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    setUseNativeViewerFallback(false);

    if (!fileUrl) {
      setIsLoading(false);
      setErrorMessage('No PDF document URL provided.');
      return;
    }

    // 8-second watchdog timer: if PDF parsing stalls, fail fast with actionable retry/fallback
    const timeoutId = setTimeout(() => {
      if (!isCancelled && isLoading) {
        console.warn('[InlinePdfViewer] Document loading timed out after 8s:', fileUrl);
        setIsLoading(false);
        setErrorMessage('Document took longer than expected to load. You can retry or open the PDF directly.');
      }
    }, 8000);

    const loadDocument = async () => {
      try {
        console.log('[InlinePdfViewer] Fetching PDF binary for:', fileUrl);
        const [pdfBytes, pdfjsLib, pdfWorkerUrlModule] = await Promise.all([
          fetchPdfBinary(fileUrl),
          import('pdfjs-dist'),
          import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        ]);

        if (isCancelled) return;

        const pdfWorkerUrl = (pdfWorkerUrlModule.default || pdfWorkerUrlModule) as string;
        if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            pdfWorkerUrl ||
            `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/build/pdf.worker.min.mjs`;
        }

        const loadingTask = pdfjsLib.getDocument({
          data: pdfBytes,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/cmaps/`,
          cMapPacked: true,
          enableXfa: true,
        });

        // Add 6s promise race so a frozen worker never hangs indefinitely
        const docPromise = loadingTask.promise;
        const raceTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF.js worker initialization timed out')), 6500)
        );

        const doc: any = await Promise.race([docPromise, raceTimeout]);
        if (isCancelled) {
          try {
            doc.cleanup();
            doc.destroy();
          } catch {}
          return;
        }

        clearTimeout(timeoutId);
        // Destroy previous active doc if any to free memory
        if (activeDocRef.current && activeDocRef.current !== doc) {
          try {
            activeDocRef.current.cleanup();
            activeDocRef.current.destroy();
          } catch {}
        }
        activeDocRef.current = doc;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setIsLoading(false);
        if (onPdfLoaded) {
          onPdfLoaded(doc.numPages);
        }
        onPageChange(Math.min(currentPage || 1, doc.numPages), doc.numPages);
      } catch (err: any) {
        console.error('[InlinePdfViewer] Failed to load PDF document:', err);
        if (isCancelled) return;
        clearTimeout(timeoutId);
        setIsLoading(false);
        setErrorMessage(
          err?.message || "Failed to load document preview. You can retry or open the file directly in browser."
        );
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }
      if (activeDocRef.current) {
        try {
          activeDocRef.current.cleanup();
          activeDocRef.current.destroy();
        } catch {}
        activeDocRef.current = null;
      }
    };
  }, [fileUrl, retryKey]);

  // Render current page onto canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }

      setIsRenderingPage(true);
      const safePageNumber = Math.min(Math.max(1, currentPage), pdfDoc.numPages);
      const page = await pdfDoc.getPage(safePageNumber);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const viewport = page.getViewport({ scale: scale * dpr });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      // Fill pure white background for sharp clarity
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        canvas: canvas,
        viewport: viewport,
      };

      const task = page.render(renderContext as any);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
      }
    } finally {
      setIsRenderingPage(false);
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderCurrentPage();
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }
    };
  }, [renderCurrentPage]);

  // Keyboard navigation for page turning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (currentPage > 1) {
          onPageChange(currentPage - 1, totalPages);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1, totalPages);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.7));
  };

  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48;
      if (containerWidth > 300) {
        const calculatedScale = Math.min(Math.max(0.8, containerWidth / 650), 1.8);
        setScale(parseFloat(calculatedScale.toFixed(2)));
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1, totalPages);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1, totalPages);
    }
  };

  const handleRetry = () => {
    setRetryKey(prev => prev + 1);
  };

  // If user requested native iframe fallback
  if (useNativeViewerFallback && fileUrl) {
    const directOrProxied = resolveProxyPdfUrl(fileUrl);
    return (
      <div className="relative flex-1 w-full h-full bg-slate-900 flex flex-col">
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between text-xs text-white border-b border-slate-700">
          <span className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Native Document Viewer: {title}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseNativeViewerFallback(false)}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-medium cursor-pointer"
            >
              Switch to Interactive Canvas
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-bold flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Tab
            </a>
          </div>
        </div>
        <iframe
          src={directOrProxied}
          title={title}
          className="w-full flex-1 border-0"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-slate-100 overflow-auto flex flex-col items-center select-none"
    >
      {/* Lightweight Loading Overlay with App Blue Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur-xs">
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
            <div className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-800">Rendering document preview...</p>
            <p className="text-[11px] text-slate-500">Loading high-resolution vector pages</p>
          </div>
        </div>
      )}

      {/* Clear, Helpful Error State with Retry & Fallbacks */}
      {errorMessage && !isLoading && (
        <div className="m-auto p-6 max-w-md bg-white rounded-2xl border border-rose-200 shadow-md text-center space-y-3.5 my-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">
              {errorMessage.toLowerCase().includes('corrupt') || errorMessage.toLowerCase().includes('invalid pdf')
                ? 'Corrupted PDF Document'
                : 'Failed to load document'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={() => setUseNativeViewerFallback(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Native Viewer</span>
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternalPdfBrowser(fileUrl);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Open in Browser</span>
            </a>
          </div>
        </div>
      )}

      {/* Main High-Resolution Canvas Document Area */}
      {!errorMessage && !isLoading && (
        <div className="relative my-4 flex flex-col items-center shadow-lg rounded-lg border border-slate-300 bg-white transition-all">
          {/* Page Rendering Progress Indicator */}
          {isRenderingPage && (
            <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1.5 shadow-sm">
              <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
              <span className="text-[10px] font-bold text-blue-700">Page {currentPage}</span>
            </div>
          )}

          {/* Vector Document Canvas */}
          <canvas ref={canvasRef} className="block rounded-lg max-w-none shadow-xs" />

          {/* Children overlay for study sticky notes & highlights */}
          {children}
        </div>
      )}

      {/* Floating Bottom Quick-Paging & Zoom Bar */}
      {!errorMessage && !isLoading && totalPages > 1 && (
        <div className="sticky bottom-4 z-20 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-slate-300 shadow-md flex items-center gap-2 text-xs text-slate-700">
          <button
            type="button"
            disabled={currentPage <= 1 || isRenderingPage}
            onClick={handlePrevPage}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-slate-900 px-1">
            {currentPage} <span className="font-normal text-slate-500">/ {totalPages}</span>
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || isRenderingPage}
            onClick={handleNextPage}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-3.5 bg-slate-200 mx-0.5" />

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.7}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-medium text-slate-600 min-w-[34px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitWidth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
export default InlinePdfViewer;
