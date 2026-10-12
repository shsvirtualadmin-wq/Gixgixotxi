import React, { useMemo } from 'react';
import { X, Clock, Sparkles, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUsage } from '../../context/UsageContext';
import { PLAN_LIMITS, getTimeUntilKarachiMidnight, PlanType } from '../../data/planLimits';

interface StudentUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest?: () => void;
  onAskBoardy?: () => void;
  onViewPlans?: () => void;
}

export const StudentUsageModal: React.FC<StudentUsageModalProps> = ({
  isOpen,
  onClose,
  onStartTest,
  onAskBoardy,
  onViewPlans,
}) => {
  const auth = useAuth();
  const profile = auth?.profile;
  const isAdmin = Boolean(auth?.isAdmin || profile?.role === 'admin' || (Array.isArray(profile?.roles) && profile.roles.includes('admin')));
  const {
    loading: usageLoading,
    isUnlimited,
    testsLimit,
    testsUsed,
    testsLeft,
    aiChatsLimit,
    aiChatsUsed,
    aiChatsLeft,
    refillCountdown,
  } = useUsage();

  if (!isOpen) return null;

  const userPlan: PlanType = (profile?.plan as PlanType) || 'free';
  const planConfig = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

  const testsUsedToday = testsUsed;
  const boardyUsedToday = aiChatsUsed;

  const isUnlimitedTests = isUnlimited;
  const testsRemaining = isUnlimited ? 'Unlimited' : testsLeft;
  const boardyRemaining = isUnlimited ? 'Unlimited' : aiChatsLeft;

  const countdown = getTimeUntilKarachiMidnight();

  // Last 14 days activity derived from real testHistory array in Firestore
  const last14Days = useMemo(() => {
    const historyList = Array.isArray((profile as any)?.testHistory)
      ? (profile as any).testHistory
      : [];

    const days: { label: string; count: number; isToday: boolean }[] = [];
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toISOString().slice(0, 10);
      const isToday = i === 0;

      let dayCount = 0;
      if (historyList.length > 0) {
        dayCount = historyList.filter((att: any) => {
          if (!att.createdAt) return false;
          return String(att.createdAt).slice(0, 10) === dateStr;
        }).length;
      }
      if (isToday && dayCount === 0 && testsUsedToday > 0) {
        dayCount = testsUsedToday;
      }

      days.push({
        label: weekdays[targetDate.getDay()],
        count: dayCount,
        isToday,
      });
    }
    return days;
  }, [profile, testsUsedToday]);

  const totalFinished14Days = last14Days.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Usage</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              What's left of today on your <span className="font-semibold text-slate-700">{planConfig.name}</span> plan. Everything refills at midnight, Pakistan time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Big Usage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tests Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900 mb-2">
                <span>Tests</span>
                <span className="text-[11px] text-blue-600">{testsUsedToday} started today</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-950">
                {usageLoading ? (
                  <span className="text-sm font-medium text-slate-400">Checking today's limit…</span>
                ) : isUnlimitedTests ? (
                  <span>Unlimited</span>
                ) : testsRemaining === 0 ? (
                  <span className="text-base sm:text-lg font-bold text-rose-700">
                    0 of {testsLimit} tests left today · Resets at midnight (PKT)
                  </span>
                ) : (
                  <span>
                    {testsRemaining} of {testsLimit} tests left today
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200/50 flex items-center justify-between">
              {/* Segmented bar */}
              <div className="flex items-center gap-1.5 flex-1 mr-3">
                {isUnlimitedTests ? (
                  <div className="h-2 w-full bg-blue-600 rounded-full" />
                ) : (
                  Array.from({ length: Math.min(10, testsLimit) }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        i < Number(testsRemaining) ? 'bg-blue-600' : 'bg-blue-200/60'
                      }`}
                    />
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartTest?.();
                }}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2 cursor-pointer shrink-0"
              >
                Start a test
              </button>
            </div>
          </div>

          {/* Boardy Questions Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-2">
                <span>Boardy AI chats</span>
                <span className="text-[11px] text-indigo-600">{boardyUsedToday} asked today</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
                {usageLoading ? (
                  <span className="text-sm font-medium text-slate-400">Checking today's limit…</span>
                ) : isUnlimitedTests ? (
                  <span>Unlimited</span>
                ) : boardyRemaining === 0 ? (
                  <span className="text-base sm:text-lg font-bold text-rose-700">
                    0 of {aiChatsLimit} AI chats left today · Resets at midnight (PKT)
                  </span>
                ) : (
                  <span>
                    {boardyRemaining} of {aiChatsLimit} AI chats left today
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-200/50 flex items-center justify-between">
              {/* Segmented bar */}
              <div className="flex items-center gap-1.5 flex-1 mr-3">
                {isUnlimitedTests ? (
                  <div className="h-2 w-full bg-indigo-600 rounded-full" />
                ) : (
                  Array.from({ length: Math.min(10, aiChatsLimit) }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        i < Number(boardyRemaining) ? 'bg-indigo-600' : 'bg-indigo-200/60'
                      }`}
                    />
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAskBoardy?.();
                }}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 cursor-pointer shrink-0"
              >
                Ask Boardy
              </button>
            </div>
          </div>
        </div>

        {/* Refill Row with 24-hour progress bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Refills in {refillCountdown}</span>
            </span>
            <span className="text-slate-400 font-mono">12:00 AM, Pakistan time</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${countdown.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Last 14 days chart */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Last 14 days activity</span>
            <span className="text-slate-500">{totalFinished14Days} tests finished</span>
          </div>

          <div className="flex items-end justify-between h-20 pt-2 gap-1 px-1">
            {last14Days.map((d, idx) => {
              const heightPct = d.count > 0 ? Math.min(100, Math.max(25, d.count * 30)) : 8;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full max-w-[16px] rounded-t transition-all ${
                      d.isToday
                        ? 'bg-blue-600 ring-2 ring-blue-400/40'
                        : d.count > 0
                        ? 'bg-blue-300'
                        : 'bg-slate-200'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className={`text-[10px] ${d.isToday ? 'font-black text-blue-700' : 'text-slate-400'}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          {totalFinished14Days === 0 && (
            <p className="text-center text-xs text-slate-400 pt-1">
              No tests finished yet. Your days will fill in here.
            </p>
          )}
        </div>

        {/* Daily Allowance by Plan Table */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Daily allowance by plan</h3>
            <span className="text-[11px] text-slate-400">Enforced server-side</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3.5">Plan</th>
                  <th className="py-2.5 px-3.5">Tests / day</th>
                  <th className="py-2.5 px-3.5">Boardy / day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(['free', 'pro', 'premium'] as PlanType[]).map((planKey) => {
                  const cfg = PLAN_LIMITS[planKey];
                  const isUserPlan = userPlan === planKey;
                  return (
                    <tr
                      key={planKey}
                      className={isUserPlan ? 'bg-blue-50/60 font-semibold text-blue-950' : 'text-slate-700'}
                    >
                      <td className="py-2.5 px-3.5 flex items-center gap-2">
                        {isUserPlan && <div className="w-1.5 h-3 bg-blue-600 rounded-full" />}
                        <span>{cfg.name}</span>
                        {isUserPlan && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                            Yours
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {cfg.testsPerDay >= 999 ? 'Unlimited' : cfg.testsPerDay}
                      </td>
                      <td className="py-2.5 px-3.5">{cfg.boardyPerDay}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500 max-w-sm">
              Pro opens every chapter and gives you {PLAN_LIMITS.pro.testsPerDay} tests/day and full Boardy AI assistance.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewPlans?.();
              }}
              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
            >
              See plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
