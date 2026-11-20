import React, { useEffect } from 'react';
import { Check, Sparkles, X, Zap } from 'lucide-react';
import { buildPlansCatalog } from '@/config/plans';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import type { AiPlan } from '@/utils/aiMentorsLogic';

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

  return (
    <div
      className="fixed inset-0 z-[10060] flex items-end lg:items-center justify-center p-0 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isTargetPlus ? 'Upgrade to Boardly Plus' : 'Upgrade to Boardly Pro'}
    >
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-[440px] rounded-t-[32px] lg:rounded-[32px] p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] lg:pb-6 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        {/* Mobile grabber */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border)] lg:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={
                isTargetPlus
                  ? {
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.12))',
                      color: '#d97706',
                    }
                  : {
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }
              }
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3
                className="text-[18px] font-bold leading-tight"
                style={{
                  fontFamily: "'Doto', var(--font-dot), sans-serif",
                  color: 'var(--text)',
                }}
              >
                {isTargetPlus ? 'Boardly Plus' : 'Boardly Pro'}
              </h3>
              <p className="mt-0.5 text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                {reason}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrade sheet"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 3 crisp benefits */}
        <ul className="mt-4 space-y-2.5">
          {benefits.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2.5 text-[14px] leading-snug"
              style={{ color: 'var(--text)' }}
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: isTargetPlus ? '#d97706' : 'var(--accent)' }}
                strokeWidth={2.5}
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* Live pricing box from config/plans */}
        <div
          className="mt-4 rounded-[22px] px-4 py-3 flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-[22px] font-bold tabular-nums"
                style={{ fontFamily: "'Doto', var(--font-dot), sans-serif", color: 'var(--text)' }}
              >
                PKR {monthlyPlan.price_pkr.toLocaleString()}
              </span>
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                /month
              </span>
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Or PKR {annualPlan.price_pkr.toLocaleString()}/year (Annual −{config.annualDiscountPercent}%) · or {monthlyPlan.price_kobans.toLocaleString()} Kobans
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUpgrade(isTargetPlus ? 'plus' : 'pro')}
          className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-95"
          style={
            isTargetPlus
              ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
              : { backgroundColor: 'var(--accent)' }
          }
        >
          <Zap className="h-4 w-4" />
          <span>
            {isTargetPlus
              ? `Upgrade to Plus for ${config.plus.aiCreditsPerDay} credits/day`
              : 'Upgrade to Pro'}
          </span>
        </button>
      </div>
    </div>
  );
};
