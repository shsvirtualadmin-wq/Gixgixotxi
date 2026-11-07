import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  PenTool,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  History,
  RotateCcw,
  Save,
  Eraser,
} from 'lucide-react';
import {
  fetchAdminSignatures,
  uploadAdminSignature,
  updateActiveSignatureMeta,
  restoreAdminSignatureVersion,
  removeActiveAdminSignature,
  regenerateAllCertificates,
  type AdminSignatureRecord,
} from '../../services/certificateService';
import { CertificateRenderer } from './CertificateRenderer';

export interface SignatureUploaderProps {
  onSignatureChanged?: (activeSignature: AdminSignatureRecord | null) => void;
}

/**
 * Client-side white/near-white background stripper & transparent margin trimmer
 * so the Admin gets an instant preview on both light and dark cards before saving to R2.
 */
async function processSignatureFileClientSide(fileOrDataUrl: File | string): Promise<string> {
  const imgUrl =
    typeof fileOrDataUrl === 'string'
      ? fileOrDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read image file.'));
          reader.readAsDataURL(fileOrDataUrl);
        });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid or corrupted image file.'));
    el.src = imgUrl;
  });

  const maxDim = 900;
  let w = img.naturalWidth || img.width || 400;
  let h = img.naturalHeight || img.height || 160;
  if (w > maxDim || h > maxDim) {
    const scale = Math.min(maxDim / w, maxDim / h);
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imgUrl;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a < 12) {
        data[idx + 3] = 0;
        continue;
      }

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const minCh = Math.min(r, g, b);

      if (minCh >= 236 || lum >= 242) {
        data[idx + 3] = 0;
        continue;
      } else if (lum >= 205 && minCh >= 190) {
        const factor = Math.max(0, Math.min(1, (242 - lum) / 37));
        data[idx + 3] = Math.round(a * factor);
      }

      if (data[idx + 3] > 18) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  if (maxX < minX || maxY < minY) {
    return canvas.toDataURL('image/png');
  }

  const pad = 8;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(h - cropY, maxY - minY + 1 + pad * 2);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = Math.max(1, cropW);
  outCanvas.height = Math.max(1, cropH);
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return canvas.toDataURL('image/png');

  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return outCanvas.toDataURL('image/png');
}

/**
 * Admin Signature Manager (Admin Dashboard: Settings > Certificate signature).
 * Supports uploading PNG/JPG/WebP (max 2 MB) or drawing on a touch/mouse pad,
 * automatic white-background removal & margin trimming, light + dark preview cards,
 * live certificate preview, and version history.
 */
export const SignatureUploader: React.FC<SignatureUploaderProps> = ({
  onSignatureChanged,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [activeSignature, setActiveSignature] = useState<AdminSignatureRecord | null>(null);
  const [history, setHistory] = useState<AdminSignatureRecord[]>([]);
  const [inputMode, setInputMode] = useState<'upload' | 'draw'>('upload');

  const [signatoryName, setSignatoryName] = useState('Boardly Examination Council');
  const [signatoryTitle, setSignatoryTitle] = useState('Founder, Boardly');
  const [stagedDataUrl, setStagedDataUrl] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const padCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnStrokesRef = useRef(false);

  const loadSignatures = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchAdminSignatures();
      setActiveSignature(res.activeSignature || null);
      setHistory(Array.isArray(res.history) ? res.history : []);
      if (res.activeSignature) {
        setSignatoryName(res.activeSignature.signatoryName || 'Boardly Examination Council');
        setSignatoryTitle(res.activeSignature.signatoryTitle || 'Founder, Boardly');
        setStagedDataUrl(res.activeSignature.previewDataUrl || null);
      } else {
        setStagedDataUrl(null);
      }
      onSignatureChanged?.(res.activeSignature || null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load certificate signature settings.');
    } finally {
      setLoading(false);
    }
  }, [onSignatureChanged]);

  useEffect(() => {
    void loadSignatures();
  }, [loadSignatures]);

  // Initialize drawing canvas
  const clearDrawPad = useCallback(() => {
    const canvas = padCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnStrokesRef.current = false;
  }, []);

  const getPointerCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = padCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleStartDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = padCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerCoords(e);
    isDrawingRef.current = true;
    hasDrawnStrokesRef.current = true;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMoveDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = padCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleEndDraw = async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = padCanvasRef.current;
    if (!canvas || !hasDrawnStrokesRef.current) return;
    const rawDataUrl = canvas.toDataURL('image/png');
    const trimmed = await processSignatureFileClientSide(rawDataUrl);
    setStagedDataUrl(trimmed);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Please upload a PNG, JPG, or WebP signature image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Signature file exceeds the 2 MB maximum limit.');
      return;
    }

    try {
      const processedDataUrl = await processSignatureFileClientSide(file);
      setStagedDataUrl(processedDataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not process signature image.');
    }
  };

  const handleSaveSignature = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signatoryName.trim()) {
      setErrorMsg('Please enter the Signatory name.');
      return;
    }

    setSaving(true);
    try {
      const isNewImage =
        stagedDataUrl &&
        (!activeSignature || stagedDataUrl !== activeSignature.previewDataUrl);

      if (isNewImage && stagedDataUrl) {
        const res = await uploadAdminSignature({
          imageBase64: stagedDataUrl,
          signatoryName: signatoryName.trim(),
          signatoryTitle: signatoryTitle.trim(),
        });
        setSuccessMsg(
          `Saved signature v${res.signature.version} to private R2 (white background removed & margins trimmed).`
        );
      } else if (activeSignature) {
        const res = await updateActiveSignatureMeta({
          signatoryName: signatoryName.trim(),
          signatoryTitle: signatoryTitle.trim(),
        });
        setSuccessMsg(`Updated signatory details on v${res.signature.version}.`);
      } else {
        setErrorMsg('Please upload or draw a signature image before saving.');
        setSaving(false);
        return;
      }

      await loadSignatures();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save signature.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSignature = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      await removeActiveAdminSignature();
      setStagedDataUrl(null);
      setSuccessMsg(
        'Active signature removed. New certificates will use a blank signature line until a signature is set or restored.'
      );
      await loadSignatures();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to remove active signature.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (version: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      await restoreAdminSignatureVersion(version);
      setSuccessMsg(`Restored signature v${version} as active.`);
      await loadSignatures();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to restore signature version.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateAllWithCurrent = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setRegeneratingAll(true);
    try {
      const res = await regenerateAllCertificates();
      setSuccessMsg(
        `Regenerated ${res.regeneratedCount} certificate(s) with signature v${res.signatureVersion}.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to regenerate certificates.');
    } finally {
      setRegeneratingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner when no active signature is set */}
      {!loading && !activeSignature && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-[var(--text)]">
                Add your signature to finish certificates
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                No active signature is currently set. Certificates issued now will show a clean blank signature line until you save or restore a signature.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload / Draw + Signatory Fields */}
        <div className="lg:col-span-6 space-y-5 p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">
                Certificate Signature
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Stored in private Cloudflare R2. White backgrounds are stripped and empty margins trimmed automatically.
              </p>
            </div>
            {activeSignature && (
              <span className="px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ACTIVE · v{activeSignature.version}
              </span>
            )}
          </div>

          {/* Mode Switcher: Upload Image vs Draw Signature */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Upload size={14} />
              <span>Upload Image</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('draw')}
              className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                inputMode === 'draw'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <PenTool size={14} />
              <span>Draw Signature</span>
            </button>
          </div>

          {inputMode === 'upload' ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[120px] p-4 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface-2)] flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload size={22} className="text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text)]">
                  Tap to upload signature image (PNG, JPG, WebP · max 2 MB)
                </span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  AUTO WHITE-BG REMOVAL &amp; MARGIN TRIM ENABLED
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Sign inside the pad below (mouse or touch):</span>
                <button
                  type="button"
                  onClick={clearDrawPad}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                >
                  <Eraser size={12} />
                  <span>Clear Pad</span>
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-white">
                <canvas
                  ref={padCanvasRef}
                  width={540}
                  height={160}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleMoveDraw}
                  onMouseUp={handleEndDraw}
                  onMouseLeave={handleEndDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleMoveDraw}
                  onTouchEnd={handleEndDraw}
                  className="w-full h-[140px] touch-none cursor-crosshair block"
                />
              </div>
            </div>
          )}

          {/* Dual Contrast Preview: Light & Dark Surface */}
          <div className="space-y-2">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              TRANSPARENCY &amp; CONTRAST CHECK (LIGHT &amp; DARK PREVIEW)
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Light Preview */}
              <div className="p-3 rounded-xl border border-slate-300 bg-[#F8FAFC] flex flex-col items-center justify-center min-h-[88px]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                  LIGHT THEME PREVIEW
                </span>
                {stagedDataUrl ? (
                  <img
                    src={stagedDataUrl}
                    alt="Signature on light background"
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No signature loaded</span>
                )}
              </div>

              {/* Dark Preview */}
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0A0A0D] flex flex-col items-center justify-center min-h-[88px]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                  DARK THEME PREVIEW
                </span>
                {stagedDataUrl ? (
                  <img
                    src={stagedDataUrl}
                    alt="Signature on dark background"
                    className="max-h-12 w-auto object-contain brightness-125 contrast-125"
                  />
                ) : (
                  <span className="text-[11px] text-slate-600 italic">No signature loaded</span>
                )}
              </div>
            </div>
          </div>

          {/* Signatory Name & Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Signatory Name
              </label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                placeholder="e.g. Syed H. Shah"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Signatory Title
              </label>
              <input
                type="text"
                value={signatoryTitle}
                onChange={(e) => setSignatoryTitle(e.target.value)}
                placeholder="e.g. Founder, Boardly"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Action Buttons: Replace, Remove, Save */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveSignature}
                disabled={saving || !activeSignature}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-semibold text-red-400 hover:bg-red-500/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveSignature}
              disabled={saving}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-bold hover:opacity-90 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Saving to Private R2...' : 'Save Signature'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Full Certificate Preview + Version History */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                LIVE CERTIFICATE APPEARANCE
              </span>
              <button
                type="button"
                onClick={handleRegenerateAllWithCurrent}
                disabled={regeneratingAll}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--text)] hover:border-[var(--accent)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={regeneratingAll ? 'animate-spin' : ''} />
                <span>
                  {regeneratingAll
                    ? 'Regenerating...'
                    : 'Regenerate all with current signature'}
                </span>
              </button>
            </div>

            <CertificateRenderer
              serial="BDLY-GL01-0001"
              studentName="Zainab Fatima Ali"
              grandLineId="gl_mock_01"
              grandLineTitle="NUST NET-1 Full Length Grand Line Mock"
              editionLabel="EDITION #01 · ENGINEERING"
              rank={1}
              score={192}
              totalQuestions={200}
              percentage={96}
              participantsCount={512}
              issuedAt={Date.now()}
              themeId="red-dark"
              signatoryName={signatoryName || 'Boardly Examination Council'}
              signatoryTitle={signatoryTitle || 'Founder, Boardly'}
              signatureDataUrl={stagedDataUrl}
            />
          </div>

          {/* Version History */}
          {history.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                <History size={14} className="text-[var(--accent)]" />
                <span>Signature Version History (Preserved for Issued Certificates)</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.previewDataUrl ? (
                        <div className="w-16 h-9 rounded bg-white p-1 flex items-center justify-center shrink-0">
                          <img
                            src={item.previewDataUrl}
                            alt={`v${item.version}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--text)] truncate">
                          v{item.version} · {item.signatoryName}
                        </div>
                        <div className="font-mono text-[10px] text-[var(--text-muted)] truncate">
                          {item.signatoryTitle} · {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {item.active ? (
                      <span className="px-2 py-1 rounded font-mono text-[10px] uppercase bg-emerald-500/15 text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleRestoreVersion(item.version)}
                        disabled={saving}
                        className="min-h-[36px] px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Use v{item.version}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureUploader;
