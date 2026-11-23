import React, { useEffect } from 'react';
import { buildPlansCatalog } from '@/config/plans';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import type { AiPlan } from '@/utils/aiMentorsLogic';
import { BoardlyAd } from '@/components/BoardlyAd';
import { useShowAds } from '@/hooks/useShowAds';

interface AiUpgradeSheetProps {
  open: boolean;
  reason: string;
  currentPlan?: AiPlan;
  onClose: () => void;
  onUpgrade: (targetTier: 'pro' | 'plus') => void;
}

export const AiUpgradeSheet: React.FC<AiUpgradeSheetProps> = ({
  open,
  reason,
  currentPlan = 'free',
  onClose,
  onUpgrade,
}) => {
  const { config } = usePlansConfig();
  const { showAds } = useShowAds();
  const catalog = buildPlansCatalog(config);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Never show an upgrade sheet to Plus users
  if (!open || currentPlan === 'plus') return null;

  const isTargetPlus = currentPlan === 'pro';
  const monthlyPlan = isTargetPlus ? catalog.plus_monthly : catalog.pro_monthly;
  const annualPlan = isTargetPlus ? catalog.plus_annual : catalog.pro_annual;
  const freeToProMultiplier = Math.max(
    2,
    Math.round(config.pro.aiCreditsPerDay / Math.max(1, config.free.aiCreditsPerDay))
  );
  const proToPlusMultiplier = Math.max(
    2,
    Math.round(config.plus.aiCreditsPerDay / Math.max(1, config.pro.aiCreditsPerDay))
  );

  const benefits = isTargetPlus
    ? [
        `${config.plus.aiCreditsPerDay} AI Mentor credits every day (${proToPlusMultiplier}× Pro)`,
        'Everything in Boardly Pro + Deep & Max AI thinking',
        'Your unused Pro days are credited automatically to Plus',
      ]
    : [
        `${config.pro.aiCreditsPerDay} AI Mentor credits every day (${freeToProMultiplier}× Free)`,
        'Unlock Deep & Max thinking for tough board & entry-test derivations',
        `Need even more? Boardly Plus gives ${config.plus.aiCreditsPerDay} credits/day`,
      ];

  const priceSummary = `PKR ${monthlyPlan.price_pkr.toLocaleString()}/month · Or PKR ${annualPlan.price_pkr.toLocaleString()}/year (Annual −${config.annualDiscountPercent}%) · or ${monthlyPlan.price_kobans.toLocaleString()} Kobans`;

  return (
    <div
      className="fixed inset-0 z-[10060] flex items-end lg:items-center justify-center p-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))] lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isTargetPlus ? 'Upgrade to Boardly Plus' : 'Upgrade to Boardly Pro'}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-[440px] max-h-[88dvh] overflow-y-auto overscroll-contain rounded-[12px]">
        {showAds ? (
          <BoardlyAd
            variant="popup"
            accent={isTargetPlus ? 'indigo-blue' : 'purple-pink'}
            illustrationId={isTargetPlus ? 'girl-celebrating' : 'girl-laptop'}
            chip={isTargetPlus ? 'BOARDLY PLUS' : 'AI MENTOR · PRO'}
            headline={
              isTargetPlus
                ? `Get ${config.plus.aiCreditsPerDay} AI Mentor credits/day`
                : `Upgrade to Boardly Pro`
            }
            description={reason}
            highlights={benefits}
            metaNote={priceSummary}
            ctaLabel={
              isTargetPlus
                ? `Upgrade to Plus (${config.plus.aiCreditsPerDay} credits/day)`
                : 'Upgrade to Pro'
            }
            onAction={() => onUpgrade(isTargetPlus ? 'plus' : 'pro')}
            onDismiss={onClose}
            dismissible
            infoText="Boardly upgrade prompt shown when AI Mentor credits or Deep/Max thinking limits are reached."
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-2xl space-y-3">
            <h3 className="text-base font-bold">
              {isTargetPlus ? 'Daily AI Mentor limit reached' : 'Plan limit reached'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{reason}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onUpgrade(isTargetPlus ? 'plus' : 'pro')}
                className="min-h-[40px] rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                View Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
