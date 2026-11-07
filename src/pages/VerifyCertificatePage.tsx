import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  Calendar,
  Hash,
  Users,
  Compass,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { verifyCertificatePublic } from '@/services/certificateService';
import type { VerifyCertificateResult } from '@/types/certificate';
import { Logo } from '@/components/ui/Logo';

export default function VerifyCertificatePage() {
  const { serial } = useParams<{ serial: string }>();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<VerifyCertificateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!serial) {
        setError('No certificate serial number provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await verifyCertificatePublic(serial);
        if (!active) return;
        if (!res) {
          setError(`No official certificate was found matching serial "${serial}".`);
        } else {
          setCert(res);
        }
      } catch (err: any) {
        if (active) setError(err?.message || 'Verification lookup failed.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [serial]);

  const isRevoked = cert?.status === 'revoked';

  const formatDateStr = (dateVal: any) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col justify-between selection:bg-[#ef4444] selection:text-white relative overflow-hidden">
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#272732 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#ef4444]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/40">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
          <span>OFFICIAL VERIFICATION PORTAL</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto p-6 sm:p-8 flex flex-col justify-center">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-12 text-center backdrop-blur-xl">
            <RefreshCw className="w-8 h-8 text-[#ef4444] animate-spin mx-auto mb-4" />
            <h2 className="text-base font-bold text-zinc-200">Verifying Certificate Serial...</h2>
            <p className="text-xs font-mono text-zinc-500 mt-1">
              Querying cryptographic records for {serial}
            </p>
          </div>
        ) : error || !cert ? (
          <div className="rounded-3xl border border-red-500/20 bg-zinc-900/70 p-8 sm:p-10 text-center backdrop-blur-xl shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-[#ef4444] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">Certificate Not Found</h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-2 max-w-md mx-auto leading-relaxed">
              {error || `The serial "${serial}" does not correspond to an official Boardly award.`}
            </p>
            <div className="mt-6 pt-6 border-t border-white/10 flex justify-center">
              <Link
                to="/grand-line"
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 flex items-center gap-2 transition-colors"
              >
                <Compass className="w-4 h-4 text-[#ef4444]" />
                <span>Explore Grand Line Mocks</span>
              </Link>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-3xl border backdrop-blur-2xl p-6 sm:p-10 shadow-2xl transition-all relative overflow-hidden ${
              isRevoked
                ? 'border-red-500/30 bg-red-950/20'
                : 'border-white/15 bg-zinc-900/75'
            }`}
          >
            {/* Top Verification Status Banner */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                {isRevoked ? (
                  <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                    RECORD STATUS
                  </div>
                  <div
                    className={`text-base font-black uppercase tracking-tight flex items-center gap-2 ${
                      isRevoked ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    <span>{isRevoked ? 'REVOKED / INVALID' : 'VERIFIED AUTHENTIC'}</span>
                    {!isRevoked && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Serial pill */}
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  SERIAL NUMBER
                </div>
                <div className="font-mono text-sm sm:text-base font-bold text-[#ef4444] tracking-wider mt-0.5">
                  {cert.serial}
                </div>
              </div>
            </div>

            {/* Revoked Warning Notice */}
            {isRevoked && (
              <div className="mb-6 p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-xs text-red-200 font-mono leading-relaxed">
                <strong>Attention:</strong> This certificate was officially revoked by Boardly administrators. It is no longer valid or acknowledged for academic credentials.
              </div>
            )}

            {/* Certificate Details Card */}
            <div className="space-y-6">
              {/* Recipient */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  STUDENT NAME
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                  {cert.student_name}
                </div>
              </div>

              {/* Exact Mock Name: character for character, never altered */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ef4444] font-bold">
                  EXAMINATION / MOCK TITLE
                </span>
                <div
                  className="text-lg sm:text-xl font-bold text-zinc-100 mt-1 break-words leading-snug"
                  title={cert.mock_name}
                >
                  {cert.mock_name}
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
                <div className="rounded-xl p-3.5 bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                    ACHIEVED RANK
                  </span>
                  <span className="font-['Doto',monospace] text-base font-extrabold text-[#ef4444] mt-1 block">
                    1st POSITION
                  </span>
                </div>

                <div className="rounded-xl p-3.5 bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                    FINAL SCORE
                  </span>
                  <span className="font-mono text-base font-bold text-zinc-100 mt-1 block">
                    {cert.score}
                    {cert.total_questions ? ` / ${cert.total_questions}` : ''}
                  </span>
                </div>

                <div className="rounded-xl p-3.5 bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                    COMPETITORS
                  </span>
                  <span className="font-mono text-base font-bold text-zinc-100 mt-1 block">
                    Ahead of {cert.participants_count}
                  </span>
                </div>
              </div>

              {/* Authorisation and Issue Date */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Issued on {formatDateStr(cert.issued_at)}</span>
                </div>

                <div>
                  Authorised by{' '}
                  <span className="text-zinc-200 font-semibold">{cert.signatory_name}</span>
                  {cert.signatory_title ? ` (${cert.signatory_title})` : ''}
                </div>
              </div>
            </div>

            {/* Note & CTA */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] font-mono text-zinc-500 text-center sm:text-left leading-relaxed">
                Signatures and credentials are cryptographic assets protected in Cloudflare R2 and Supabase.
              </p>

              <Link
                to="/grand-line"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#d91422] text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-lg shrink-0"
              >
                <span>Practice on Boardly</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-4 text-center font-mono text-[11px] text-zinc-500 backdrop-blur-md bg-black/40">
        © {new Date().getFullYear()} Boardly · SHS Virtual Academy · All Rights Reserved
      </footer>
    </div>
  );
}
