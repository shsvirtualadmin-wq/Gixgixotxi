import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Bot,
  Layers,
} from 'lucide-react';

interface PromoCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackLabel?: string;
  expiresDate?: string | null;
  code?: string;
  campaignLabel?: string;
  onGoToDashboard?: () => void;
}

export const PromoCelebrationModal: React.FC<PromoCelebrationModalProps> = ({
  isOpen,
  onClose,
  trackLabel = 'Your Enrolled Track',
  expiresDate,
  code,
  campaignLabel,
  onGoToDashboard,
}) => {
  if (!isOpen) return null;

  const formattedExpiry = expiresDate
    ? new Date(expiresDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      })();

  return (
    <div
      id="promo-celebration-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 pt-8 pb-7 text-white text-center overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />

          {/* Floating Badge Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-xl mb-3 text-amber-300">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
            1 Year Free Pro Unlocked!
          </h2>
          <p className="text-blue-100 text-sm font-medium max-w-xs mx-auto">
            {campaignLabel || 'Special promotional access has been applied to your student account.'}
          </p>

          {code && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/20">
              <span>Code:</span>
              <span className="text-amber-200 font-mono font-bold">{code}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Plan Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Subscription Plan</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Boardly Pro Pass
              </span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Active Track</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {trackLabel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Valid Until</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {formattedExpiry} (365 Days)
              </span>
            </div>
          </div>

          {/* Included Features Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Your Pro Privileges Include:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Unlimited MCQs & Tests</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">AI Study Buddy Explanations</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Full Exam-Standard Mocks</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Track Progress Analytics</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <button
            id="promo-celebration-continue-btn"
            type="button"
            onClick={onGoToDashboard || onClose}
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <span>Go to My Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
