import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GuestProBlockedView } from '@/components/plans/GuestProBlockedView';
import { BoardlyAd } from '@/components/BoardlyAd';

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
  const { isGuest } = useAuth();
  const { t, formatPKR } = useLanguage();
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

      setCountdownText(t('test.resetsIn', { time: `${hrs}h ${mins}m` }));
    }

    calculateTimeToPktMidnight();
    const interval = setInterval(calculateTimeToPktMidnight, 60000);
    return () => clearInterval(interval);
  }, [t]);

  // Superadmin, Pro, and crew-shared unlimited users must NEVER see the blocked sheet
  if (!isOpen || effectivePlan.isUnlimited || effectivePlan.isSuperAdmin) return null;

  if (isGuest) {
    return <GuestProBlockedView variant="sheet" onClose={onClose} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overlay-blur bg-black/60 backdrop-blur-md p-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))] sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[88dvh] overflow-y-auto overscroll-contain rounded-[12px]"
        onClick={(e) => e.stopPropagation()}
      >
        <BoardlyAd
          variant="popup"
          accent="magenta-orange"
          illustrationId="boy-laptop"
          chip={t('dashboard.dailyLimits')}
          headline={t('test.dailyLimitTitle')}
          description={t('test.dailyLimitDesc')}
          metaNote={countdownText || t('settings.resetsAtMidnight')}
          ctaLabel={t('plans.upgradeToPro')}
          onAction={() => {
            onClose();
            navigate('/dashboard/plans');
          }}
          secondaryAction={{
            label: `${t('nav.crew')} (${formatPKR(499)})`,
            onClick: () => {
              onClose();
              navigate('/crew');
            },
          }}
          onDismiss={onClose}
          dismissible
          infoText={t('settings.resetsAtMidnight')}
          footerSlot={
            effectivePlan.isSuperAdmin ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-white/50 bg-white/10 text-white text-xs font-mono font-semibold hover:bg-white/20 transition-colors cursor-pointer"
              >
                [{t('common.admin')}]
              </button>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

export default DailyLimitBlockedSheet;
