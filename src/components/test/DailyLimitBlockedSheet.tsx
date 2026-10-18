import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, Users } from 'lucide-react';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';

interface DailyLimitBlockedSheetProps {
  isOpen: boolean;
  onClose: () => void;
  testsUsed?: number;
}

export function DailyLimitBlockedSheet({
  isOpen,
  onClose,
  testsUsed = FREE_DAILY_TESTS,
}: DailyLimitBlockedSheetProps) {
  const navigate = useNavigate();
  const effectivePlan = useEffectivePlan();
  const [countdownText, setCountdownText] = useState('');

  // PKT (UTC+5) Midnight Reset Timer
  useEffect(() => {
    function calculateTimeToPktMidnight() {
      const now = new Date();
      const pktOffsetMinutes = 5 * 60;
      const localOffsetMinutes = now.getTimezoneOffset();
      const pktNow = new Date(now.getTime() + (pktOffsetMinutes + localOffsetMinutes) * 60 * 1000);

      const midnight = new Date(pktNow);
      midnight.setHours(24, 0, 0, 0);

      const diffMs = midnight.getTime() - pktNow.getTime();
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setCountdownText(`Resets in ${hrs} hours ${mins} minutes (at midnight PKT)`);
    }

    calculateTimeToPktMidnight();
    const interval = setInterval(calculateTimeToPktMidnight, 60000);
    return () => clearInterval(interval);
  }, []);

  // Superadmin, Pro, and crew-shared unlimited users must NEVER see the blocked sheet
  if (!isOpen || effectivePlan.isUnlimited || effectivePlan.isSuperAdmin) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#0D0D0D] border border-[#222222] rounded-t-[28px] sm:rounded-[24px] p-6 text-white shadow-2xl space-y-6"
        style={{ fontFamily: 'var(--font-heading)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with red indicator & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#888888]">
              Daily Starter Limit
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#222222] flex items-center justify-center text-[#888888] hover:text-white hover:border-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content: Nothing-style dot counters */}
        <div className="space-y-4">
          <div>
            <div className="text-[12px] text-[#888888] uppercase tracking-wider mb-1">
              Daily quota reached
            </div>
            <div className="font-dot text-[30px] sm:text-[34px] font-bold text-white tracking-tight leading-none mb-1">
              You've used all {FREE_DAILY_TESTS} daily attempts.
            </div>
            <p className="text-[13px] text-[#AAAAAA] leading-relaxed mt-2">
              Free starter accounts can start up to <strong className="text-white">3 test attempts per calendar day</strong> (Pakistan Standard Time, UTC+5).
            </p>
          </div>

          {/* Reset countdown box */}
          <div className="p-3.5 rounded-[16px] bg-[#141414] border border-[#222222] flex items-center justify-between">
            <div className="text-left">
              <div className="text-[12px] font-medium text-amber-400">
                {countdownText || 'Calculating reset time...'}
              </div>
              <div className="text-[10px] text-[#666666]">Asia/Karachi standard time</div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Upgrade & Join Study Crew / Buy Crew Pass */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/dashboard/plans');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] bg-[#D71921] hover:bg-[#b0141a] text-white font-semibold text-[13px] transition-all cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Zap size={16} />
            <span>Upgrade to Pro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/crew');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] bg-[#141414] hover:bg-[#1f1f1f] border border-[#2E2E2E] text-white font-semibold text-[13px] transition-all cursor-pointer text-center"
          >
            <Users size={16} className="shrink-0" />
            <span>Join a Crew / Buy Crew Pass (PKR 499) to unlock unlimited tests for your whole group</span>
          </button>

          {/* Admin Bypass Button (only visible to admins) */}
          {effectivePlan.isSuperAdmin && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-emerald-500/50 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              [Admin Bypass: Ignore Daily Quota]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyLimitBlockedSheet;
