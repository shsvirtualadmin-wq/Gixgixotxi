import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Sparkles,
  Compass,
  Download,
  Share2,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CertificateCard } from '@/components/certificate/CertificateCard';
import { getMyCertificates } from '@/services/certificateService';
import { PageMeta } from '@/components/ui/PageMeta';
import type { Certificate } from '@/types/certificate';

export function MyCertificatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getMyCertificates();
      setCertificates(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 px-4 sm:px-6">
      <PageMeta
        title="My Certificates — Boardly"
        description="Official Boardly Certificates of Excellence earned by taking 1st Position in Grand Line mocks."
      />

      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1.5">
            <Link to="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#ef4444] font-semibold">Certificates</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight flex items-center gap-3">
            <Award className="w-7 h-7 text-[#ef4444]" />
            <span>My Certificates</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
            Official Certificates of Excellence awarded for securing 1st Position in Grand Line examinations.
          </p>
        </div>

        <Link
          to="/grand-line"
          className="px-4 py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#d91422] text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg self-start sm:self-auto cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>Browse Grand Line Mocks</span>
        </Link>
      </div>

      {/* ─── CERTIFICATES LIST OR EMPTY STATE ─── */}
      {loading ? (
        <div className="p-16 text-center font-mono text-xs text-zinc-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#ef4444]" />
          <span>Loading your certificates...</span>
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-10 sm:p-14 text-center backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-zinc-100">No Certificates Earned Yet</h3>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed">
            Take 1st position in any Boardly Grand Line mock examination to earn an official, cryptographically verified Certificate of Excellence!
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/grand-line"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-mono text-zinc-100 font-semibold flex items-center gap-2 transition-colors"
            >
              <Compass className="w-4 h-4 text-[#ef4444]" />
              <span>Go to Grand Line</span>
            </Link>

            <Link
              to="/dashboard/results"
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 transition-colors"
            >
              View Past Results
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} isAdmin={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCertificatesPage;
