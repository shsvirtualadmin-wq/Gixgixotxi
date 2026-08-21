import React, { useEffect, useState } from 'react';
import { Users, X, MessageCircle, ArrowRight, CheckCircle2, BookMarked, Sparkles } from 'lucide-react';
import { fetchStudentCountFromSupabase } from '../lib/supabase';

interface CommunityModalProps {
  onClose: () => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({ onClose }) => {
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchStudentCountFromSupabase().then((count) => {
      if (isMounted && count > 0) {
        setMemberCount(count);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60  backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white  border border-slate-200/80  rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 max-w-lg w-full shadow-2xl relative text-slate-900  overflow-hidden transition-colors duration-200 animate-ios-spring">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-[#1E5AFF]/[0.08]  blur-3xl pointer-events-none rounded-full" />

        {/* Mobile Pull Handle */}
        <div className="w-10 h-1 bg-slate-200  rounded-full mx-auto mb-4 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-slate-100  border border-slate-200  flex items-center justify-center text-slate-600  hover:text-slate-900  transition-all cursor-pointer active:scale-95 z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Cohesive Header with BOARDLY Branding & Euler Quote */}
        <div className="text-center space-y-3 mb-5 relative z-10">
          {/* Brand Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1E5AFF]/15  border border-[#1E5AFF]/30 text-[#0A1330]  text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#1E5AFF]" />
            <span
              className="text-[#0A1330]  font-extrabold"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              BOARDLY
            </span>
            <span className="text-[#1E5AFF]/60">•</span>
            <span>Student Community</span>
          </div>

          {/* Integrated Euler Quote Box */}
          <div className="bg-[#1E5AFF]/5 border border-[#1E5AFF]/20 rounded-2xl p-3 text-center relative overflow-hidden">
            <p
              className="text-xs sm:text-sm font-semibold italic text-[#0A1330]  leading-snug"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              “Mathematicians have tried in vain to discover order.”
            </p>
            <span className="block text-[10px] font-bold text-[#1E5AFF] uppercase tracking-widest mt-1">
              — Leonhard Euler
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
              Join Boardly Student Community
            </h2>
            <p className="text-xs sm:text-sm text-slate-600  font-medium leading-relaxed max-w-md mx-auto mt-1">
              Connect with fellow students across all academic tracks for daily practice, past paper PDFs, and instant exam updates.
            </p>
          </div>
        </div>

        {/* 2. Main Content Blocks */}
        <div className="space-y-3.5 mb-5 text-left">
          {/* PRIMARY ACTIONABLE CARD: Official WhatsApp Group */}
          <div className="p-4 sm:p-5 bg-emerald-500/5  border-2 border-emerald-500/40  rounded-2xl shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600  border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900  text-base leading-tight">
                    Official WhatsApp Community
                  </h3>
                  <span className="text-xs font-semibold text-slate-600 ">
                    All Test Tracks & Levels
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-500/15  text-emerald-700  text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{memberCount ? `${memberCount}+ Members` : 'Active Group'}</span>
              </div>
            </div>

            <p className="text-slate-700  text-xs font-medium mb-3.5 leading-relaxed">
              Real-time updates, daily MCQ practice, model paper solution keys, and peer guidance across FBISE, MDCAT, TCAT, and all entry test series.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs font-semibold text-slate-700 ">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>FBISE, MDCAT & TCAT/UET</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Daily MCQs & Solution PDFs</span>
              </div>
            </div>

            <a
              href="https://chat.whatsapp.com/L3EYfjDXFNOGTzZjAjRuvg?s=cl&p=a&ilr=1"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-5 rounded-xl text-sm transition-all active:scale-98 shadow-md hover:shadow-emerald-500/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join WhatsApp Group</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>

          {/* SECONDARY INFORMATIONAL CARD: All-Track Model Exam Series */}
          <div className="p-4 bg-slate-50  border border-slate-200  rounded-2xl text-left opacity-95">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1E5AFF]/15 text-[#0A1330]  border border-[#1E5AFF]/30 flex items-center justify-center shrink-0">
                  <BookMarked className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900  text-sm">
                    All-Track Model Exam Series
                  </h3>
                  <span className="text-[11px] font-medium text-slate-500 ">
                    Weekend Online Mocks
                  </span>
                </div>
              </div>

              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200  text-slate-600  uppercase tracking-wider shrink-0">
                Preview Info
              </span>
            </div>

            <p className="text-slate-600  text-xs font-medium mb-2.5 leading-relaxed">
              Special weekend mock exams for FBISE (Class 9-12), MDCAT Medical & TCAT Engineering entry tests with instant analytics.
            </p>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200/60  text-[11px] font-semibold text-slate-600 ">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E5AFF]" />
                All Academic Tracks
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E5AFF]" />
                Free Past Paper Keys
              </span>
            </div>
          </div>
        </div>

        {/* 3. Footer Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-slate-100  border border-slate-200  text-slate-800  hover:bg-slate-200  font-bold py-3 rounded-full cursor-pointer text-xs active:scale-95 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
