import React, { useRef, useState, useEffect } from 'react';
import { Upload, Edit3, Trash2, RotateCcw, Check, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { showApiToast } from '@/lib/api';

export interface SignatureUploaderProps {
  initialSignatoryName?: string;
  initialSignatoryTitle?: string;
  initialSignatureDataUrl?: string | null;
  onSave: (payload: {
    signatoryName: string;
    signatoryTitle: string;
    signatureDataUrl: string;
  }) => Promise<void>;
  onRemove?: () => Promise<void>;
  isSaving?: boolean;
}

/**
 * Strips white or near-white background pixels and trims transparent margins
 */
function processAndTrimSignature(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Background removal: turn white or near-white into transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    // Detect white/off-white (brightness > 220 or low saturation near white)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    if (brightness > 225) {
      data[i + 3] = 0; // Transparent
    } else if (brightness > 190) {
      // Smooth feathering
      const factor = (225 - brightness) / 35;
      data[i + 3] = Math.min(a, Math.round(a * factor));
    }
  }

  // Find bounding box of non-transparent content
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  let hasInk = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      if (data[idx + 3] > 15) {
        hasInk = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasInk) {
    // Blank image
    return '';
  }

  // Put filtered pixels back
  ctx.putImageData(imgData, 0, 0);

  // Add 10px margin around trimmed bounds
  const padding = 10;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(canvas.width - cropX, maxX - minX + padding * 2);
  const cropH = Math.min(canvas.height - cropY, maxY - minY + padding * 2);

  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = Math.max(10, cropW);
  trimmedCanvas.height = Math.max(10, cropH);
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) return canvas.toDataURL('image/png');

  trimmedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return trimmedCanvas.toDataURL('image/png');
}

export const SignatureUploader: React.FC<SignatureUploaderProps> = ({
  initialSignatoryName = 'Muhammad Hashir',
  initialSignatoryTitle = 'Founder, Boardly',
  initialSignatureDataUrl = null,
  onSave,
  onRemove,
  isSaving = false,
}) => {
  const [mode, setMode] = useState<'upload' | 'draw'>('upload');
  const [signatoryName, setSignatoryName] = useState(initialSignatoryName);
  const [signatoryTitle, setSignatoryTitle] = useState(initialSignatoryTitle);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(initialSignatureDataUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawnStrokes, setHasDrawnStrokes] = useState(false);

  // Sync state if props change
  useEffect(() => {
    if (initialSignatoryName) setSignatoryName(initialSignatoryName);
    if (initialSignatoryTitle) setSignatoryTitle(initialSignatoryTitle);
    if (initialSignatureDataUrl) setSignatureDataUrl(initialSignatureDataUrl);
  }, [initialSignatoryName, initialSignatoryTitle, initialSignatureDataUrl]);

  // Setup drawing canvas
  useEffect(() => {
    if (mode !== 'draw' || !drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [mode]);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showApiToast('Please upload a PNG, JPG, or WebP image.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showApiToast('Signature file exceeds the 2 MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const processed = processAndTrimSignature(img);
        if (!processed) {
          showApiToast('Could not find signature strokes in this image.', 'error');
          return;
        }
        setSignatureDataUrl(processed);
        showApiToast('Signature processed: background removed and trimmed!', 'success');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drawing pad touch & mouse handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawnStrokes(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    // Export drawn canvas through processAndTrimSignature
    const img = new Image();
    img.onload = () => {
      const processed = processAndTrimSignature(img);
      if (processed) {
        setSignatureDataUrl(processed);
      }
    };
    img.src = canvas.toDataURL('image/png');
  };

  const handleClearPad = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnStrokes(false);
    setSignatureDataUrl(null);
  };

  const handleSave = async () => {
    if (!signatoryName.trim()) {
      showApiToast('Please enter the signatory name.', 'error');
      return;
    }
    if (!signatoryTitle.trim()) {
      showApiToast('Please enter the signatory title.', 'error');
      return;
    }
    if (!signatureDataUrl) {
      showApiToast('Please upload or draw a signature before saving.', 'error');
      return;
    }

    try {
      await onSave({
        signatoryName: signatoryName.trim(),
        signatoryTitle: signatoryTitle.trim(),
        signatureDataUrl,
      });
      showApiToast('Signature and signatory details saved successfully!', 'success');
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to save signature', 'error');
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    if (confirm('Are you sure you want to remove the active signature? Certificates will show a blank signature line until a new signature is added.')) {
      try {
        await onRemove();
        setSignatureDataUrl(null);
        showApiToast('Signature removed.', 'info');
      } catch (err: any) {
        showApiToast(err?.message || 'Failed to remove signature', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── SIGNATORY DETAILS INPUTS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
            Signatory Full Name
          </label>
          <input
            type="text"
            value={signatoryName}
            onChange={(e) => setSignatoryName(e.target.value)}
            placeholder="e.g. Muhammad Hashir"
            className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ef4444]"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
            Signatory Title & Organization
          </label>
          <input
            type="text"
            value={signatoryTitle}
            onChange={(e) => setSignatoryTitle(e.target.value)}
            placeholder="e.g. Founder, Boardly"
            className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ef4444]"
          />
        </div>
      </div>

      {/* ─── MODE TOGGLE: UPLOAD VS DRAW ─── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
            mode === 'upload'
              ? 'bg-[#ef4444] text-white font-bold shadow-md'
              : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
            mode === 'draw'
              ? 'bg-[#ef4444] text-white font-bold shadow-md'
              : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Draw Signature</span>
        </button>
      </div>

      {/* ─── UPLOAD OR DRAW SECTION ─── */}
      {mode === 'upload' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/15 hover:border-[#ef4444]/60 bg-zinc-900/40 rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-[#ef4444] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-zinc-100">
            Click to upload signature image
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto font-mono">
            PNG, JPG, or WebP (max 2 MB). White backgrounds are automatically converted to transparent and cropped.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative border border-white/20 rounded-2xl overflow-hidden bg-white shadow-inner">
            <canvas
              ref={drawCanvasRef}
              width={520}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-44 touch-none cursor-crosshair block"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={handleClearPad}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-mono hover:bg-zinc-700 flex items-center gap-1 shadow-sm"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] font-mono text-zinc-400">
            Use your finger or mouse to draw smoothly. The result is automatically trimmed.
          </p>
        </div>
      )}

      {/* ─── DUAL PREVIEW ON LIGHT & DARK (Requirement: check transparency) ─── */}
      {signatureDataUrl && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#ef4444]" />
              <span>Transparency Verification (Dark &amp; Light)</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              ✓ Background removed &amp; cropped
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* DARK PREVIEW */}
            <div className="rounded-2xl border border-white/10 bg-[#07070a] p-5 flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                On Dark Certificate Surface
              </div>
              <div className="h-20 flex items-center justify-center p-2">
                <img
                  src={signatureDataUrl}
                  alt="Signature on dark"
                  className="max-h-16 max-w-full object-contain filter invert drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                />
              </div>
              <div className="border-t border-white/10 pt-2 text-center">
                <div className="text-xs font-bold text-white">{signatoryName}</div>
                <div className="text-[10px] font-mono text-zinc-400">{signatoryTitle}</div>
              </div>
            </div>

            {/* LIGHT PREVIEW */}
            <div className="rounded-2xl border border-zinc-300 bg-[#f8fafc] p-5 flex flex-col justify-between shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                On Light Certificate Surface
              </div>
              <div className="h-20 flex items-center justify-center p-2">
                <img
                  src={signatureDataUrl}
                  alt="Signature on light"
                  className="max-h-16 max-w-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="border-t border-zinc-200 pt-2 text-center">
                <div className="text-xs font-bold text-zinc-900">{signatoryName}</div>
                <div className="text-[10px] font-mono text-zinc-600">{signatoryTitle}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION BUTTONS: SAVE, REPLACE, REMOVE ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
        <div>
          {onRemove && signatureDataUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Signature</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {signatureDataUrl && (
            <button
              type="button"
              onClick={() => {
                if (mode === 'upload') fileInputRef.current?.click();
                else handleClearPad();
              }}
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !signatureDataUrl}
            className="px-6 py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#d91422] text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Signature'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
