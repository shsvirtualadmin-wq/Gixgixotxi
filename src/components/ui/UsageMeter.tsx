import React from 'react';
import { useUsage } from '../../context/UsageContext';
import { Zap, Sparkles, Clock, ArrowRight, ShieldCheck, Crown } from 'lucide-react';

export interface UsageMeterProps {
  type: 'tests' | 'aiChats';
  showRefillCountdown?: boolean;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
  compact?: boolean;
  className?: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  type,
  showRefillCountdown = false,
  showUpgradeButton = true,
  onUpgrade,
  compact = false,
  className = '',
}) => {
  const {
    loading,
    isUnlimited,
    testsLimit,
    testsUsed,
    testsLeft,
    aiChatsLimit,
    aiChatsUsed,
    aiChatsLeft,
    refillCountdown,
  } = useUsage();

  // Loading skeleton state: neutral skeleton with "Checking today's limit…"
  if (loading) {
    return (
      <div className={`p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs animate-pulse flex items-center justify-between ${className}`}>
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-28 bg-slate-200 rounded-full" />
          <div className="h-4 w-44 bg-slate-200 rounded-full" />
        </div>
        <span className="text-[11px] font-medium text-slate-400">Checking today's limit…</span>
      </div>
    );
  }

  const isTests = type === 'tests';
  const limit = isTests ? testsLimit : aiChatsLimit;
  const used = isTests ? testsUsed : aiChatsUsed;
  const left = isTests ? testsLeft : aiChatsLeft;
  const isBlocked = !isUnlimited && typeof left === 'number' && left <= 0;

  // Exact required wording:
  // "1 of 2 tests left today" / "0 of 2 tests left today · Resets at midnight (PKT)"
  // "2 of 3 AI chats left today" / "0 of 3 AI chats left today · Resets at midnight (PKT)"
  // Premium shows "Unlimited"
  const itemLabel = isTests ? 'tests' : 'AI chats';
  let primaryText = '';
  if (isUnlimited) {
    primaryText = 'Unlimited';
  } else if (left === 0) {
    primaryText = `0 of ${limit} ${itemLabel} left today · Resets at midnight (PKT)`;
  } else {
    primaryText = `${left} of ${limit} ${itemLabel} left today`;
  }

  const percentUsed = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 text-xs font-semibold ${isBlocked ? 'text-rose-600' : 'text-slate-600'} ${className}`}>
        {isTests ? <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> : <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
        <span>{primaryText}</span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl bg-white border ${
        isBlocked ? 'border-rose-200/90 bg-rose-50/30' : 'border-slate-200/90'
      } shadow-xs flex flex-col justify-between gap-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
              isTests ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'
            }`}
          >
            {isUnlimited ? (
              <Crown className="w-4 h-4 text-amber-500" />
            ) : isTests ? (
              <Zap className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isTests ? 'Daily Practice Tests' : 'Boardy AI Questions'}
            </p>
            <p className={`text-sm sm:text-base font-extrabold ${isBlocked ? 'text-rose-700' : 'text-slate-900'}`}>
              {primaryText}
            </p>
          </div>
        </div>

        {isBlocked && showUpgradeButton && onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>Upgrade</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Thin Progress bar */}
      {!isUnlimited && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isBlocked
                ? 'bg-rose-500'
                : percentUsed > 70
                ? 'bg-amber-500'
                : isTests
                ? 'bg-indigo-600'
                : 'bg-violet-600'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      )}

      {/* Optional Refill Countdown */}
      {showRefillCountdown && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Refills at midnight (PKT)</span>
          </span>
          <span className="font-mono font-bold text-slate-700">{refillCountdown} left</span>
        </div>
      )}
    </div>
  );
};
