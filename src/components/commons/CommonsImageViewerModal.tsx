import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface CommonsImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageAlt?: string;
  onClose: () => void;
}

export const CommonsImageViewerModal: React.FC<CommonsImageViewerModalProps> = ({
  isOpen,
  imageUrl,
  imageAlt = 'Image viewer',
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialTouchScaleRef = useRef(1);

  // Reset zoom & pan when image changes or closes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      // Lock background scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, imageUrl]);

  // Handle keyboard shortcuts (Escape to close, +/- for zoom)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(prev + 0.3, 4));
      } else if (e.key === '-') {
        setScale((prev) => {
          const next = Math.max(prev - 0.3, 1);
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.35, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.35, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Double click / tap to toggle 1x <-> 2x
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (scale > 1.2) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || scale <= 1) return;
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    },
    [isDragging, scale]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers: pinch gesture
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialTouchDistanceRef.current = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY
      );
      initialTouchScaleRef.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      // 1 finger drag when zoomed
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY
      );
      const ratio = currentDistance / initialTouchDistanceRef.current;
      const newScale = Math.min(Math.max(initialTouchScaleRef.current * ratio, 1), 4);
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null;
    setIsDragging(false);
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none touch-none animate-in fade-in duration-200"
      onClick={scale === 1 ? onClose : undefined}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Floating Control Bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm font-medium truncate max-w-[60%] px-2">
          <span className="truncate">{imageAlt}</span>
          {scale > 1 && (
            <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-full shrink-0">
              {Math.round(scale * 100)}%
            </span>
          )}
        </div>

        {/* Action Controls: Zoom in/out, reset, download, close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Zoom out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>

          {scale > 1 && (
            <button
              type="button"
              onClick={handleReset}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Reset zoom (0)"
              aria-label="Reset zoom"
            >
              <RotateCcw size={18} />
            </button>
          )}

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Open original / Download"
            aria-label="Open original image"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={18} />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/20 hover:bg-accent text-white transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ml-1"
            title="Close viewer (Esc)"
            aria-label="Close viewer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          onDoubleClick={handleDoubleTap}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          className="max-w-full max-h-full object-contain select-none will-change-transform rounded-sm"
          draggable={false}
        />
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none text-[11px] text-white/60 bg-black/50 backdrop-blur-xs px-3 py-1 rounded-full font-sans">
        {scale > 1 ? 'Drag to pan · Double tap to reset' : 'Pinch or double tap to zoom'}
      </div>
    </div>
  );
};

export default CommonsImageViewerModal;
