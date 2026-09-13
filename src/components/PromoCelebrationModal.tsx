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
  Gift,
  X,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react';

export type PromoModalMode = 'confirm' | 'success' | 'already_active' | 'error';

export interface PromoCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: PromoModalMode;
  trackLabel?: string;
  expiresDate?: string | null;
  code?: string;
  campaignLabel?: string;
  studentEmail?: string;
  errorMessage?: string;
  isLoading?: boolean;
  onActivate?: () => void;
  onCancel?: () => void;
  onGoToDashboard?: () => void;
}

export const PromoCelebrationModal: React.FC<PromoCelebrationModalProps> = ({
  isOpen,
  onClose,
  mode = 'success',
  trackLabel = 'Your Enrolled Track',
  expiresDate,
  code,
  campaignLabel,
  studentEmail,
  errorMessage,
  isLoading = false,
  onActivate,
  onCancel,
  onGoToDashboard,
}) => {
  if (!isOpen) return null;

  const formattedExpiry = expiresDate
    ? new Date(expiresDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      })();

  return (
    <div
      id="promo-celebration-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={mode === 'confirm' ? onCancel || onClose : onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={mode === 'confirm' ? onCancel || onClose : onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* MODE 1: CONFIRMATION PROMPT (Step 1) */}
        {mode === 'confirm' && (
          <>
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 pt-8 pb-7 text-white text-center overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-xl mb-3 text-amber-300">
                <Gift className="w-8 h-8 animate-bounce" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
                Activate 1-Year Free Pro
              </h2>
              <p className="text-blue-100 text-sm font-medium max-w-sm mx-auto">
                You've received a 1-Year Free Pro code. Activate it now?
              </p>

              {code && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/20">
                  <span className="text-blue-200">Code:</span>
                  <span className="text-amber-200 font-mono font-bold tracking-widest">{code}</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              {studentEmail && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Activating for account: <strong className="text-slate-900">{studentEmail}</strong>
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  What You'll Get for 1 Year:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Unlimited MCQs & Tests</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Weakness Diagnostics</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">AI Study Buddy Assistant</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">365 Days Full Access</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Free for 1 full year. No payment or credit card required.
              </p>

              {/* Two Clear Actions: Activate and Cancel */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  id="promo-confirm-cancel-btn"
                  type="button"
                  onClick={onCancel || onClose}
                  disabled={isLoading}
                  className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm tracking-wide transition-all border border-slate-200 text-center cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="promo-confirm-activate-btn"
                  type="button"
                  onClick={onActivate}
                  disabled={isLoading}
                  className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 text-center cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                      <span>Activate Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* MODE 2: SUCCESS STATE (Step 2 - Unlocked & Saved) */}
        {mode === 'success' && (
          <>
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 pt-8 pb-7 text-white text-center overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-xl mb-3 text-amber-300">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
                1 Year Free Pro Unlocked!
              </h2>
              <p className="text-blue-100 text-sm font-medium max-w-xs mx-auto">
                {campaignLabel || 'Your 1-Year Free Pro pass has been activated and saved to your account.'}
              </p>

              {code && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/20">
                  <span className="text-blue-200">Code:</span>
                  <span className="text-amber-200 font-mono font-bold">{code}</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
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

              <button
                id="promo-celebration-continue-btn"
                type="button"
                onClick={onGoToDashboard || onClose}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* MODE 3: ALREADY ACTIVATED ON THIS ACCOUNT (Requirement 6) */}
        {mode === 'already_active' && (
          <>
            <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-6 pt-8 pb-7 text-white text-center overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-xl mb-3 text-emerald-200">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
                Already Activated
              </h2>
              <p className="text-emerald-100 text-sm font-medium max-w-sm mx-auto">
                This 1-Year Free Pro pass is already active on your account.
              </p>

              {code && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/20">
                  <span className="text-emerald-200">Code:</span>
                  <span className="text-white font-mono font-bold">{code}</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                {studentEmail && (
                  <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/60 text-xs">
                    <span className="text-slate-600 font-semibold">Account:</span>
                    <span className="font-bold text-slate-900">{studentEmail}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/60 text-xs">
                  <span className="text-slate-600 font-semibold">Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active Pro Pass
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Expiration:</span>
                  <span className="font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    Pro — expires {formattedExpiry}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 text-center">
                You already have full unlimited access to all tests, subjects, and study tools unlocked on this account.
              </p>

              <button
                id="promo-already-active-dashboard-btn"
                type="button"
                onClick={onGoToDashboard || onClose}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* MODE 4: ERROR STATE */}
        {mode === 'error' && (
          <>
            <div className="relative bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 px-6 pt-8 pb-7 text-white text-center overflow-hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-xl mb-3 text-rose-200">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
                Code Unavailable
              </h2>
              <p className="text-rose-100 text-sm font-medium max-w-sm mx-auto">
                We couldn't activate this promotional code.
              </p>

              {code && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/20">
                  <span className="text-rose-200">Code:</span>
                  <span className="text-white font-mono font-bold">{code}</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium leading-relaxed">
                {errorMessage || 'This promotional link is invalid, expired, or has already reached its maximum redemptions.'}
              </div>

              <button
                id="promo-error-close-btn"
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export const PromoClaimModal = PromoCelebrationModal;

