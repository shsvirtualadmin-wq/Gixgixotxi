import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PenTool,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { SignatureUploader } from '@/components/admin/SignatureUploader';
import { CertificateRenderer } from '@/components/certificate/CertificateRenderer';
import {
  getAdminSignature,
  saveAdminSignature,
  removeAdminSignature,
  type AdminSignatureResponse,
} from '@/services/certificateService';
import { showApiToast } from '@/lib/api';
import type { CertificateSignatureRecord } from '@/types/certificate';

export function AdminSignaturePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminSignatureResponse>({
    activeSignature: null,
    history: [],
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminSignature();
      setData(res);
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to load signature data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSignature = async (payload: {
    signatoryName: string;
    signatoryTitle: string;
    signatureDataUrl: string;
  }) => {
    setSaving(true);
    try {
      const saved = await saveAdminSignature(payload);
      setData((prev) => ({
        activeSignature: saved,
        history: [saved, ...prev.history.filter((h) => h.id !== saved.id)],
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSignature = async () => {
    setSaving(true);
    try {
      await removeAdminSignature();
      setData((prev) => ({
        ...prev,
        activeSignature: null,
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (sig: CertificateSignatureRecord) => {
    if (!sig.signature_data_url) return;
    setSaving(true);
    try {
      await handleSaveSignature({
        signatoryName: sig.signatory_name,
        signatoryTitle: sig.signatory_title,
        signatureDataUrl: sig.signature_data_url,
      });
      showApiToast(`Restored signature version ${sig.version}`, 'success');
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to restore signature', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeSig = data.activeSignature;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ─── BREADCRUMBS & HEADER ─── */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
          <Link to="/admin" className="hover:text-white transition-colors">
            Admin
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/admin/certificates" className="hover:text-white transition-colors">
            Certificates
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#ef4444] font-semibold">Settings &gt; Signature</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight flex items-center gap-3">
              <PenTool className="w-7 h-7 text-[#ef4444]" />
              <span>Certificate Signature Manager</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
              Upload or draw the authorized signature once. It automatically appears on every Grand Line Certificate of Excellence.
            </p>
          </div>

          <Link
            to="/admin/certificates"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 flex items-center gap-1.5 transition-colors self-start"
          >
            <Award className="w-4 h-4 text-[#ef4444]" />
            <span>View All Certificates</span>
          </Link>
        </div>
      </div>

      {/* ─── WARNING BANNER IF NO SIGNATURE SET ─── */}
      {!loading && !activeSig && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-200">
              Add your signature to finish certificates
            </h3>
            <p className="text-xs text-amber-300/80 font-mono mt-1 leading-relaxed">
              No active signature is currently configured. Certificates can still be issued, but they will show a blank signature line until you upload or draw an authorized signature below.
            </p>
          </div>
        </div>
      )}

      {/* ─── ACTIVE SIGNATURE STATUS ─── */}
      {activeSig && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-emerald-400">
                  Active Signature Version {activeSig.version}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {activeSig.signatory_name} · <span className="text-zinc-400 font-normal">{activeSig.signatory_title}</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                Securely encrypted in Cloudflare R2: <code className="text-zinc-400">{activeSig.r2_key}</code>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center h-14 w-44">
            {activeSig.signature_data_url ? (
              <img
                src={activeSig.signature_data_url}
                alt="Active Signature"
                className="max-h-10 max-w-full object-contain filter invert"
              />
            ) : (
              <span className="text-xs font-mono text-zinc-500">No preview</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── LEFT: SIGNATURE UPLOADER & CONFIG (7 cols) ─── */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-2">
            <span>Signature &amp; Authority Details</span>
          </h2>
          <p className="text-xs font-mono text-zinc-400 mb-6">
            Upload an image or draw directly on the canvas. High contrast and clean edges are automatically extracted.
          </p>

          <SignatureUploader
            initialSignatoryName={activeSig?.signatory_name || 'Muhammad Hashir'}
            initialSignatoryTitle={activeSig?.signatory_title || 'Founder, Boardly'}
            initialSignatureDataUrl={activeSig?.signature_data_url || null}
            onSave={handleSaveSignature}
            onRemove={handleRemoveSignature}
            isSaving={saving}
          />
        </div>

        {/* ─── RIGHT: LIVE CERTIFICATE PREVIEW & VERSION HISTORY (5 cols) ─── */}
        <div className="lg:col-span-5 space-y-6">
          {/* LIVE CERTIFICATE PREVIEW */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ef4444]" />
                <span>Live Certificate Appearance</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Auto-scaled</span>
            </div>

            <div className="relative aspect-[1123/794] w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
              <div
                style={{ width: '1123px', height: '794px' }}
                className="origin-top-left transform scale-[0.38] sm:scale-[0.42] lg:scale-[0.34] pointer-events-none"
              >
                <CertificateRenderer
                  studentName="Ayesha Khan"
                  mockName="Physics Grand Test #7"
                  score={95}
                  totalQuestions={100}
                  participantsCount={284}
                  serial="BDLY-PHYS-0001"
                  issuedDate={new Date()}
                  themeId="red-dark"
                  signatoryName={activeSig?.signatory_name || 'Muhammad Hashir'}
                  signatoryTitle={activeSig?.signatory_title || 'Founder, Boardly'}
                  signatureDataUrl={activeSig?.signature_data_url || null}
                />
              </div>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-3 text-center">
              Sample preview with student &quot;Ayesha Khan&quot; on &quot;Physics Grand Test #7&quot;
            </p>
          </div>

          {/* VERSION HISTORY */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5 mb-4">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>Signature Version History ({data.history.length})</span>
            </h3>

            {data.history.length === 0 ? (
              <p className="text-xs font-mono text-zinc-500 py-4 text-center">
                No past signature versions on record.
              </p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {data.history.map((sig) => (
                  <div
                    key={sig.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      sig.active
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-9 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                        {sig.signature_data_url ? (
                          <img
                            src={sig.signature_data_url}
                            alt="Signature"
                            className="max-h-7 max-w-full object-contain filter invert"
                          />
                        ) : (
                          <span className="text-[9px] font-mono text-zinc-600">None</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-200 truncate">
                          v{sig.version} · {sig.signatory_name}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 truncate">
                          {sig.signatory_title}
                        </div>
                      </div>
                    </div>

                    <div>
                      {sig.active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestoreVersion(sig)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 border border-white/10 transition-colors cursor-pointer"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
