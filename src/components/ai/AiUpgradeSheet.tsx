import React, { useEffect } from 'react';
import { Check, Sparkles, X, Zap } from 'lucide-react';
import { ANNUAL_SAVINGS_PERCENT, PLANS } from '@/config/plans';
import { PRO_AI_CREDITS_PER_DAY } from '@/utils/aiMentorsLogic';

interface AiUpgradeSheetProps {
  open: boolean;
  reason: string;
  onClose: () => void;
  onUpgrade: () => void;
}

export const AiUpgradeSheet: React.FC<AiUpgradeSheetProps> = ({
  open,
  reason,
  onClose,
  onUpgrade,
}) => {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10060] flex items-end lg:items-center justify-center p-0 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Boardly Pro"
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
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
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
                Boardly Pro
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
          {[
            `${PRO_AI_CREDITS_PER_DAY} Boardly AI credits every day (20× Free)`,
            'Unlock Deep & Max thinking for tough board & entry-test derivations',
            'Unlimited Practice Tests, Grand Line Mocks & Formula Vault access',
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2.5 text-[14px] leading-snug"
              style={{ color: 'var(--text)' }}
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: 'var(--accent)' }}
                strokeWidth={2.5}
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* Live pricing box from PLANS */}
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
                PKR {PLANS.pro_monthly.price_pkr}
              </span>
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                /month
              </span>
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Or PKR {PLANS.pro_annual.price_pkr.toLocaleString()}/year (Annual −{ANNUAL_SAVINGS_PERCENT}%) · or {PLANS.pro_monthly.price_kobans.toLocaleString()} Kobans
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUpgrade}
          className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-95"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Zap className="h-4 w-4" />
          <span>Upgrade to Pro</span>
        </button>
      </div>
    </div>
  );
};
