import React, { useState, useEffect } from 'react';
import { Lock, Clock, Sparkles, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { StudentProfile, isUserProOrPaid } from '../lib/supabase';

interface PdfRestrictionModalProps {
  reason: 'FREE_USER' | 'RATE_LIMIT_EXCEEDED' | 'DAILY_LIMIT_REACHED' | string;
  message?: string;
  remainingMs?: number;
  nextAvailableAt?: string;
  onClose: () => void;
  onUpgradeClick?: () => void;
  isProHint?: boolean;
  userProfile?: StudentProfile | null;
}

export const PdfRestrictionModal: React.FC<PdfRestrictionModalProps> = ({
  reason,
  message,
  remainingMs: initialRemainingMs,
  nextAvailableAt,
  onClose,
  onUpgradeClick,
  isProHint,
  userProfile,
}) => {
  let effectiveUserProfile = userProfile;
  if (effectiveUserProfile === undefined) {
    try {
      const cached = localStorage.getItem('boardly_cached_profile');
      if (cached) effectiveUserProfile = JSON.parse(cached);
    } catch (e) {}
  }

  let effectiveIsProHint = isProHint;
  if (effectiveIsProHint === undefined) {
    try {
      const cachedUserStr = localStorage.getItem('boardly_cached_user');
      const user = cachedUserStr ? JSON.parse(cachedUserStr) : null;
      effectiveIsProHint = isUserProOrPaid(user, effectiveUserProfile || null);
    } catch (e) {}
  }

  // A user is treated as Pro/Rate-Limited if:
  // 1. reason is RATE_LIMIT_EXCEEDED or DAILY_LIMIT_REACHED
  // 2. effectiveIsProHint is true
  // 3. reason is NOT FREE_USER and NOT ERROR
  const isProUser = Boolean(
    reason === 'RATE_LIMIT_EXCEEDED' ||
    reason === 'DAILY_LIMIT_REACHED' ||
    effectiveIsProHint === true ||
    (reason !== 'FREE_USER' && reason !== 'ERROR')
  );

  const isFreeUser = !isProUser;

  // Calculate live countdown for Pro 2-hour rate limit
  const [currentRemainingMs, setCurrentRemainingMs] = useState<number>(() => {
    if (nextAvailableAt) {
      const targetTime = new Date(nextAvailableAt).getTime();
      const diff = targetTime - Date.now();
      return diff > 0 ? diff : 0;
    }
    return initialRemainingMs && initialRemainingMs > 0 ? initialRemainingMs : 0;
  });

  useEffect(() => {
    if (isFreeUser) return;

    const calcRemaining = () => {
      if (nextAvailableAt) {
        const targetTime = new Date(nextAvailableAt).getTime();
        const diff = targetTime - Date.now();
        return diff > 0 ? diff : 0;
      }
      return 0;
    };

    if (nextAvailableAt) {
      const interval = setInterval(() => {
        const rem = calcRemaining();
        setCurrentRemainingMs(rem);
        if (rem <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [nextAvailableAt, isFreeUser]);

  useEffect(() => {
    if (!isFreeUser && currentRemainingMs <= 0) {
      onClose();
    }
  }, [currentRemainingMs, isFreeUser, onClose]);

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  if (!isFreeUser && currentRemainingMs <= 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/70  backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white  border border-slate-200  rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-slate-900  overflow-hidden animate-scaleUp">
        {/* Decorative ambient lighting */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl pointer-events-none rounded-full ${
            isFreeUser ? 'bg-blue-500/15' : 'bg-amber-500/15'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100  border border-slate-200  flex items-center justify-center text-slate-500  hover:text-slate-900  transition-all cursor-pointer active:scale-95 z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Icon Badge */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
              isFreeUser
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/25'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25'
            }`}
          >
            {isFreeUser ? <Lock className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isFreeUser
                ? 'bg-blue-100  text-blue-700  border border-blue-200 '
                : 'bg-amber-100  text-amber-800  border border-amber-200 '
            }`}
          >
            {isFreeUser ? (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Pro Feature Required
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" /> 2-Hour Cooldown Active
              </>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900  mb-2">
            {isFreeUser ? 'PDF Downloads Locked' : 'PDF Generation Limit Exceeded'}
          </h3>

          <p className="text-sm text-slate-600  leading-relaxed mb-4">
            {isFreeUser
              ? (message || 'PDF downloads are a Pro feature — upgrade to unlock unlimited access')
              : (currentRemainingMs > 0
                  ? `Try again after 2 hours. Your next download will be available in ${formatCountdown(currentRemainingMs)}.`
                  : 'Try again after 2 hours.')}
          </p>

          {!isFreeUser && (
            <div className="w-full bg-amber-50  border border-amber-200  rounded-2xl p-4 text-center mb-5">
              <div className="flex items-center justify-center gap-1.5 text-amber-800  text-xs font-bold uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4" />
                <span>Next Download Available In</span>
              </div>
              <div className="text-3xl font-mono font-extrabold text-amber-900  tracking-wider my-1">
                {currentRemainingMs > 0 ? formatCountdown(currentRemainingMs) : 'Unlocked!'}
              </div>
              <p className="text-xs text-amber-700  mt-1">
                {currentRemainingMs > 0
                  ? 'Pro users can generate 1 printable worksheet PDF every 2 hours.'
                  : 'Your cooldown has ended! You can download your worksheet now.'}
              </p>
            </div>
          )}

          {!isFreeUser && (
            <div className="w-full bg-slate-50  border border-slate-200  rounded-xl p-3 text-xs text-slate-500  text-left mb-6 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                To protect server performance, Pro users receive 1 PDF export per 2 hours. Your download limit automatically unlocks when the timer completes.
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="w-full space-y-2.5">
            {isFreeUser && onUpgradeClick ? (
              <button
                onClick={() => {
                  onClose();
                  onUpgradeClick();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>Upgrade to Pro Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              onClick={onClose}
              className={`w-full py-2.5 px-4 rounded-xl font-medium transition-all cursor-pointer active:scale-98 ${
                isFreeUser
                  ? 'bg-slate-100  hover:bg-slate-200  text-slate-700 '
                  : 'bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md shadow-amber-600/20'
              }`}
            >
              {isFreeUser ? 'Maybe Later' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
