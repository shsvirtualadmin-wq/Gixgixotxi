import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Target,
  Zap,
  Check,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPlanConfig, getTimeUntilKarachiMidnight, PLAN_LIMITS } from '../../data/planLimits';
import { SeoHead } from '../common/SeoHead';

interface DailyLimitsViewProps {
  onOpenUpgradeModal: () => void;
  onNavigatePractice?: () => void;
  onNavigateBoardy?: () => void;
}

export const DailyLimitsView: React.FC<DailyLimitsViewProps> = ({
  onOpenUpgradeModal,
  onNavigatePractice,
  onNavigateBoardy,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const planConfig = getPlanConfig(profile?.plan);

  // Countdown timer to midnight PKT
  const [countdown, setCountdown] = useState(getTimeUntilKarachiMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilKarachiMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's usage from profile or defaults
  const testsUsedToday = profile?.testsUsedToday ?? profile?.dailyUsage?.testsTakenToday ?? 0;
  const boardyUsedToday = profile?.boardyQuestionsUsedToday ?? profile?.dailyUsage?.questionsAskedToday ?? 0;

  const isUnlimitedAccount = isAdmin || profile?.plan === 'premium';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-16">
      <SeoHead noIndex={true} />

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
          <Zap className="w-3.5 h-3.5" />
          <span>Active Daily Quotas</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0d1b3e] tracking-tight">
          Your Daily <span className="text-indigo-600">Practice Limits</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Diagnostic quotas refill daily at midnight Pakistan Standard Time (PKT).
        </p>
      </div>

      {/* Midnight PKT Refill Countdown Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">
              Midnight PKT Refill Countdown
            </p>
            <p className="text-xs text-slate-300">
              All daily question drills and Boardy questions reset automatically.
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 font-mono font-black text-lg text-white">
          {countdown.formattedCountdown}
        </div>
      </div>

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Card 1: Practice Tests */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-white shadow-xl shadow-indigo-950/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0d1b3e]">
                  Practice Tests
                </h3>
                <p className="text-[11px] text-slate-400">Timed Chapter Mocks</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {planConfig.name} Plan
            </span>
          </div>

          {/* Test Limit calculation and colored progress bar */}
          {(() => {
            const testPercent = isUnlimitedAccount ? 0 : Math.min(100, Math.round((testsUsedToday / planConfig.testsPerDay) * 100));
            const testBarColor = testPercent < 50 ? 'bg-emerald-500' : testPercent <= 80 ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <span className="text-lg sm:text-xl font-black text-[#0d1b3e]">
                    {isUnlimitedAccount
                      ? 'Unlimited'
                      : `${testsUsedToday} of ${planConfig.testsPerDay} tests used today (resets at midnight PKT)`}
                  </span>
                  {!isUnlimitedAccount && (
                    <span className="text-xs font-bold text-slate-500">
                      {Math.max(0, planConfig.testsPerDay - testsUsedToday)} remaining
                    </span>
                  )}
                </div>

                {!isUnlimitedAccount && (
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${testBarColor} rounded-full transition-all duration-300`}
                      style={{
                        width: `${Math.min(100, (testsUsedToday / planConfig.testsPerDay) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {onNavigatePractice && (
            <button
              type="button"
              onClick={onNavigatePractice}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Start a Practice Test
            </button>
          )}
        </div>

        {/* Card 2: Boardy AI Questions */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-white shadow-xl shadow-indigo-950/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0d1b3e]">
                  Boardy AI Chats
                </h3>
                <p className="text-[11px] text-slate-400">Step-by-step Tutor Doubts</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {planConfig.name} Plan
            </span>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-[#0d1b3e]">
                {isAdmin ? 'Unlimited' : `${boardyUsedToday} of ${planConfig.boardyPerDay}`}
              </span>
              {!isAdmin && (
                <span className="text-xs font-bold text-slate-500">
                  {Math.max(0, planConfig.boardyPerDay - boardyUsedToday)} remaining
                </span>
              )}
            </div>

            {!isAdmin && (
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (boardyUsedToday / planConfig.boardyPerDay) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>

          {onNavigateBoardy && (
            <button
              type="button"
              onClick={onNavigateBoardy}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Ask Boardy AI
            </button>
          )}
        </div>
      </div>

      {/* Plan Comparison & Upgrade Section */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white shadow-xl shadow-indigo-950/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-[#0d1b3e]">
              Plan Comparison &amp; Upgrades
            </h3>
            <p className="text-xs text-slate-500">
              Current subscription tier: <strong className="text-indigo-600">{planConfig.name}</strong>
            </p>
          </div>

          {!isAdmin && planConfig.id !== 'premium' && (
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Upgrade Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3-column tier comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {Object.values(PLAN_LIMITS)
            .filter((p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx)
            .map((plan) => {
              const isCurrent = planConfig.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/70 border-indigo-200 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/80 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-[#0d1b3e]">{plan.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-lg font-black text-indigo-600 mb-2">
                    {plan.priceMonthlyPkr > 0 ? `Rs. ${plan.priceMonthlyPkr}/mo` : 'Free'}
                  </p>

                  <ul className="space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{plan.id === 'premium' ? 'Unlimited' : `${plan.testsPerDay}`} daily tests</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{plan.boardyPerDay} Boardy AI doubts</span>
                    </li>
                  </ul>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
