import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Search,
  PenTool,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CertificateCard } from '@/components/certificate/CertificateCard';
import {
  getAdminCertificates,
  regenerateCertificateAdmin,
  toggleRevokeCertificateAdmin,
  regenerateAllCertificatesAdmin,
  type AdminCertificatesResponse,
} from '@/services/certificateService';
import { showApiToast } from '@/lib/api';
import type { Certificate } from '@/types/certificate';

export function AdminCertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminCertificatesResponse>({
    certificates: [],
    activeSignature: null,
    hasActiveSignature: false,
    totalCount: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all');
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [confirmRegenAllOpen, setConfirmRegenAllOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminCertificates();
      setData(res);
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerateOne = async (cert: Certificate) => {
    const updated = await regenerateCertificateAdmin(cert.id, { useCurrentSignature: true });
    setData((prev) => ({
      ...prev,
      certificates: prev.certificates.map((c) => (c.id === cert.id ? updated : c)),
    }));
  };

  const handleRevokeOne = async (cert: Certificate) => {
    const nextRevoke = cert.status !== 'revoked';
    const updated = await toggleRevokeCertificateAdmin(cert.id, nextRevoke);
    setData((prev) => ({
      ...prev,
      certificates: prev.certificates.map((c) => (c.id === cert.id ? updated : c)),
    }));
  };

  const handleRegenerateAll = async () => {
    setRegeneratingAll(true);
    try {
      const res = await regenerateAllCertificatesAdmin();
      showApiToast(`Regenerated ${res.updatedCount} certificates with active signature!`, 'success');
      setConfirmRegenAllOpen(false);
      await loadData();
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to regenerate all certificates', 'error');
    } finally {
      setRegeneratingAll(false);
    }
  };

  // Filter certificates
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.certificates.filter((cert) => {
      if (statusFilter !== 'all' && cert.status !== statusFilter) return false;
      if (!q) return true;
      return (
        cert.student_name.toLowerCase().includes(q) ||
        cert.mock_name.toLowerCase().includes(q) ||
        cert.serial.toLowerCase().includes(q) ||
        (cert.student_email && cert.student_email.toLowerCase().includes(q))
      );
    });
  }, [data.certificates, search, statusFilter]);

  const activeCount = data.certificates.filter((c) => c.status === 'valid').length;
  const revokedCount = data.certificates.filter((c) => c.status === 'revoked').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ─── HEADER & ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1.5">
            <Link to="/admin" className="hover:text-white transition-colors">
              Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#ef4444] font-semibold">Certificates</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight flex items-center gap-3">
            <Award className="w-7 h-7 text-[#ef4444]" />
            <span>Grand Line Certificates</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
            Automated Certificate of Excellence issued to 1st-position students in Grand Line mocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/settings/signature"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 flex items-center gap-2 transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-[#ef4444]" />
            <span>Manage Signature</span>
          </Link>

          <button
            onClick={() => setConfirmRegenAllOpen(true)}
            disabled={data.certificates.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-xs font-mono text-red-200 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate All</span>
          </button>
        </div>
      </div>

      {/* ─── CLEAR WARNING BANNER IF NO SIGNATURE SET ─── */}
      {!loading && !data.hasActiveSignature && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                Add your signature to finish certificates
              </h3>
              <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                Certificates currently render with a blank signature line until an authorized signature is saved.
              </p>
            </div>
          </div>

          <Link
            to="/admin/settings/signature"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold shrink-0 transition-colors"
          >
            Upload Signature Now
          </Link>
        </div>
      )}

      {/* ─── STATS STRIP ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Total Issued
          </div>
          <div className="text-2xl font-black text-white mt-1">{data.certificates.length}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
            Active / Valid
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-red-400">
            Revoked
          </div>
          <div className="text-2xl font-black text-red-400 mt-1">{revokedCount}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Signature Status
          </div>
          <div className="text-sm font-bold text-white mt-2 flex items-center gap-1.5 truncate">
            {data.hasActiveSignature ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">Active (v{data.activeSignature?.version})</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-amber-300">Blank Line</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, mock name, or serial..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-900 border border-white/10 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ef4444]"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white/20 text-white font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            All ({data.certificates.length})
          </button>
          <button
            onClick={() => setStatusFilter('valid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              statusFilter === 'valid'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Valid ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('revoked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              statusFilter === 'revoked'
                ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/30'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Revoked ({revokedCount})
          </button>
        </div>
      </div>

      {/* ─── CERTIFICATES GRID ─── */}
      {loading ? (
        <div className="p-16 text-center font-mono text-xs text-zinc-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#ef4444]" />
          <span>Loading certificates...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-900/30 p-16 text-center">
          <Award className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200">No Certificates Found</h3>
          <p className="text-xs font-mono text-zinc-500 mt-1 max-w-md mx-auto">
            {search
              ? 'No certificates matched your search filter.'
              : 'Certificates are automatically generated when a student takes 1st position in a Grand Line mock, or when you finalize mock results.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cert) => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              isAdmin={true}
              onRegenerate={handleRegenerateOne}
              onRevoke={handleRevokeOne}
            />
          ))}
        </div>
      )}

      {/* ─── CONFIRM REGENERATE ALL MODAL ─── */}
      {confirmRegenAllOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-white/15 bg-zinc-900 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Regenerate All Certificates?
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1 leading-relaxed">
                This will update all {data.certificates.length} certificates to use the current active signature version and sync any modified mock test titles character-for-character.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRegenAllOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateAll}
                disabled={regeneratingAll}
                className="px-5 py-2 rounded-xl bg-[#ef4444] hover:bg-[#d91422] text-xs font-mono font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg"
              >
                {regeneratingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Regenerate All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
