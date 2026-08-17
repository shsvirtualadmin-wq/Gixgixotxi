import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Zap, Sparkles, ArrowRight, X, Calendar, ShieldAlert, CheckCircle2, MessageSquare } from 'lucide-react';

interface TestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetDate?: string;
  currentUsage?: number;
  onUpgradeClick: () => void;
  onSubmitPaymentProofClick?: () => void;
}

export const TestLimitModal: React.FC<TestLimitModalProps> = ({
  isOpen,
  onClose,
  resetDate,
  currentUsage = 2,
  onUpgradeClick,
  onSubmitPaymentProofClick,
}) => {
  if (!isOpen) return null;

  const calculatedResetDate = resetDate || (() => {
    const d = new Date();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthName = nextMonth.toLocaleString('en-US', { month: 'long' });
    return `${monthName} 1st`;
  })();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white  border border-slate-200  rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-900 "
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10  rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10  rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600  bg-slate-100  hover:bg-slate-200  transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-rose-600  bg-rose-500/10  border border-rose-500/20 px-3 py-1 rounded-full">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Monthly Test Limit Reached</span>
            </span>
          </div>

          {/* Header */}
          <div className="space-y-2 mb-6">
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold leading-tight">
              You've used both your free tests this month 🔒
            </h2>
            <p className="text-slate-600  text-sm leading-relaxed">
              Free plan students receive <strong>2 practice test attempts</strong> per calendar month. You have completed <strong>{currentUsage} / 2</strong> tests for this month.
            </p>
          </div>

          {/* Usage Meter Card */}
          <div className="bg-slate-50  border border-slate-200  rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600  flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Free Tier Monthly Usage</span>
              </span>
              <span className="text-rose-600  font-extrabold">{currentUsage} / 2 Tests Used</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-200  rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full w-full" />
            </div>

            {/* Reset Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-500  pt-1">
              <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Your limit resets automatically on <strong className="text-slate-800 ">{calculatedResetDate}</strong></span>
            </div>
          </div>

          {/* Value Prop Bullet List */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-6 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600  flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Upgrade to Boardly Pro to Unlock:</span>
            </span>
            <ul className="text-xs text-slate-700  space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Unlimited Practice Tests</strong> across all subjects & chapters</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Full 100/180 MCQ Grand Mocks</strong> (MDCAT & TCAT Series)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>24/7 AI Study Buddy Tutor</strong> with instant explanations</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onUpgradeClick();
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 px-5 rounded-2xl transition-all active:scale-98 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Upgrade to Boardly Pro</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {onSubmitPaymentProofClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSubmitPaymentProofClick();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200   text-slate-800  font-extrabold py-3 px-5 rounded-2xl transition-all active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer border border-slate-200 "
              >
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Already Paid? Submit Payment Proof</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-center text-slate-500  hover:text-slate-700  font-bold pt-1 cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
