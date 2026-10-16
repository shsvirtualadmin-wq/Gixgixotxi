import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Share2,
  Copy,
  Check,
  Download,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Instagram,
  FileText,
} from 'lucide-react';
import { SeoHead } from '../common/SeoHead';

interface CrewPromoKitPageProps {
  onBack?: () => void;
  onNavigate?: (route: string) => void;
}

export const CrewPromoKitPage: React.FC<CrewPromoKitPageProps> = ({
  onBack,
  onNavigate,
}) => {
  const { user, profile } = useAuth();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const referralCode =
    profile?.crewReferralCode ||
    (profile?.uid ? `CREW-${profile.uid.substring(0, 6).toUpperCase()}` : 'CREW-BOARDLY');
  const referralUrl = `https://boardly.cfd/r/${referralCode}`;

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const templates = [
    {
      title: 'Batch WhatsApp Group Broadcast',
      icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
      tag: 'Best for WhatsApp & Study Circles',
      content: `Assalam o Alaikum everyone! 👋\n\nIf you're preparing for FSC boards or university entry tests (NUST NET, FAST, GIKI, MDCAT, PIEAS), check out Boardly & SHS Virtual Academy.\n\nIt offers timed MCQ drills with verified step-by-step math derivations and AI diagnostic feedback.\n\nYou can access free diagnostic mock tests using my ambassador link:\n👉 ${referralUrl}\n\nLet's study together! 🚀`,
    },
    {
      title: 'Instagram & WhatsApp Story Caption',
      icon: <Instagram className="w-5 h-5 text-pink-400" />,
      tag: 'Stories & Reels',
      content: `Ace your entrance tests with verified derivations on @boardly.pk 📚 Link in bio or swipe up to practice free diagnostic mocks: ${referralUrl}`,
    },
    {
      title: 'Personal Study Buddy Recommendation',
      icon: <Share2 className="w-5 h-5 text-purple-400" />,
      tag: 'Direct 1-on-1 Chats',
      content: `Hey! I've been using Boardly for test prep and it's super helpful because every MCQ has step-by-step solutions instead of just an answer key. Try a diagnostic sprint with my link: ${referralUrl}`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-[#EAF0FF] font-sans p-4 sm:p-8">
      <SeoHead pathname="/crew/kit" title="Boardly Crew Promotional Kit" />
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <button
            onClick={() => {
              if (onBack) onBack();
              else if (onNavigate) onNavigate('/crew/dashboard');
              else if (typeof window !== 'undefined') window.history.back();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#A3B0CC] hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Code: {referralCode}
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-violet-900/30 to-pink-950/20 border border-purple-500/30 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-xs font-bold text-pink-300 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ambassador Outreach Kit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Promotional Kit & Templates
            </h1>
            <p className="text-xs sm:text-sm text-[#A3B0CC] leading-relaxed">
              Copy pre-crafted outreach messages with your unique tracking link automatically embedded. Ready for batch groups, social stories, and campus flyers.
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#A3B0CC]">
            Pre-Formatted Broadcast Templates
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {templates.map((tpl, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-[#0B1220] border border-white/10 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      {tpl.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{tpl.title}</h3>
                      <span className="text-[10px] text-[#A3B0CC] font-mono">{tpl.tag}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => copyText(tpl.content, idx)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#070B14] border border-white/5 font-mono text-xs text-[#EAF0FF] whitespace-pre-line leading-relaxed">
                  {tpl.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Downloadable Assets */}
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Digital Posters & Slide Deck Templates</span>
          </h3>
          <p className="text-xs text-[#A3B0CC]">
            Official presentation slides and printable A4 posters for college noticeboards.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000e98c8211a04e8f3473512ef4.png"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 flex items-center justify-between text-xs text-white font-semibold transition-colors"
            >
              <span>Boardly High-Res Logo Asset</span>
              <Download className="w-4 h-4 text-purple-400" />
            </a>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-[#A3B0CC]">
              <span>Orientation Deck (.PDF / .PPTX)</span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                Available via Coordinator
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
