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
  testsUsed: _testsUsed = FREE_DAILY_TESTS,
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overlay-blur bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md glass-panel rounded-t-[28px] sm:rounded-[28px] p-6 text-[var(--text)] space-y-6"
        style={{ fontFamily: 'var(--font-heading)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with red indicator & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
              Daily Starter Limit
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content: Nothing-style dot counters */}
        <div className="space-y-4">
          <div>
            <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Daily quota reached
            </div>
            <div className="font-dot text-[30px] sm:text-[34px] font-bold text-[var(--text)] tracking-tight leading-none mb-1">
              You've used all {FREE_DAILY_TESTS} daily attempts.
            </div>
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mt-2">
              Free starter accounts can start up to <strong className="text-[var(--text)]">3 test attempts per calendar day</strong> (Pakistan Standard Time, UTC+5).
            </p>
          </div>

          {/* Reset countdown box */}
          <div className="p-3.5 rounded-[18px] glass-row flex items-center justify-between">
            <div className="text-left">
              <div className="text-[12px] font-semibold text-[#F59E0B]">
                {countdownText || 'Calculating reset time...'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">Asia/Karachi standard time</div>
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
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 px-4 rounded-full font-semibold text-[13px] transition-all cursor-pointer"
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
            className="w-full btn-secondary flex items-center justify-center gap-2 py-3 px-4 rounded-full font-semibold text-[13px] transition-all cursor-pointer text-center"
          >
            <Users size={16} className="shrink-0" />
            <span>Join a Crew / Buy Crew Pass (PKR 499) to unlock unlimited tests for your whole group</span>
          </button>

          {/* Admin Bypass Button (only visible to admins) */}
          {effectivePlan.isSuperAdmin && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-emerald-500/50 bg-emerald-500/10 text-emerald-500 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-colors"
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
