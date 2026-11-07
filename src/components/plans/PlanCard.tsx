import type { ReactNode } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import { PriceBlock } from './PriceBlock';

export interface PlanCardProps {
  title: string;
  subtitle?: string;
  durationBadge?: string;
  topRightBadge?: string;
  topRightBadgeTone?: 'pro' | 'gold' | 'neutral';
  icon?: ReactNode;
  pricePkr: number;
  cadenceLabel?: string;
  priceKobans?: number;
  regularPricePkr?: number;
  priceSubtext?: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
  ctaIcon?: ReactNode;
  ctaVariant: 'primary-red' | 'primary-gradient' | 'outlined' | 'disabled-current';
  onCtaClick?: () => void;
  footerSlot?: ReactNode;
}

/**
 * Reusable PlanCard component used across `/dashboard/plans` and `/store` (Boardly Pro tab).
 * Enforces identical radius, padding, 1px border, unclipped top-right badge,
 * baseline-aligned PriceBlock, consistent check-icon feature list, and full-width 46px+ CTA button.
 */
export function PlanCard({
  title,
  subtitle,
  durationBadge,
  topRightBadge,
  topRightBadgeTone = 'pro',
  icon,
  pricePkr,
  cadenceLabel,
  priceKobans,
  regularPricePkr,
  priceSubtext,
  features,
  featured = false,
  ctaLabel,
  ctaIcon,
  ctaVariant,
  onCtaClick,
  footerSlot,
}: PlanCardProps) {
  const isDisabled = ctaVariant === 'disabled-current';

  const badgeClasses =
    topRightBadgeTone === 'gold'
      ? 'bg-amber-500/15 text-amber-500 border-amber-500/35'
      : topRightBadgeTone === 'neutral'
      ? 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]'
      : 'bg-[var(--red)] text-[#FFFFFF] border-[var(--red)] shadow-[0_4px_12px_rgba(232,52,42,0.3)]';

  return (
    <div
      className={`rounded-[24px] p-5 sm:p-6 bg-[var(--card)] border flex flex-col justify-between transition-all duration-200 ${
        featured
          ? 'border-[var(--red)] shadow-[0_14px_38px_rgba(232,52,42,0.11)]'
          : 'border-[var(--border)]'
      }`}
    >
      <div className="space-y-4">
        {/* Top Header Row — Badge sits cleanly inside the card so nothing is ever clipped */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            {icon && (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  featured
                    ? 'bg-[var(--red)]/10 border-[var(--red)]/30 text-[var(--red)]'
                    : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]'
                }`}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--text)] leading-tight">
                  {title}
                </h3>
                {durationBadge && (
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">
                    {durationBadge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-[var(--muted)] mt-0.5 leading-snug">{subtitle}</p>
              )}
            </div>
          </div>

          {topRightBadge && (
            <span
              className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border shrink-0 ${badgeClasses}`}
            >
              {topRightBadge}
            </span>
          )}
        </div>

        {/* Baseline-aligned Price Block */}
        <div className="pt-1 pb-2 border-b border-[var(--border)]">
          <PriceBlock
            pricePkr={pricePkr}
            cadenceLabel={cadenceLabel}
            priceKobans={priceKobans}
            regularPricePkr={regularPricePkr}
            subtext={priceSubtext}
            accentColor={featured ? 'pro' : 'default'}
          />
        </div>

        {/* Consistent Feature List */}
        <ul className="space-y-2.5 text-xs sm:text-[13px] text-[var(--text)]">
          {features.map((feat) => (
            <li key={feat} className="flex items-start gap-2.5 leading-snug">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  featured
                    ? 'bg-[var(--red)]/15 text-[var(--red)]'
                    : 'bg-emerald-500/15 text-emerald-500'
                }`}
              >
                <Check size={11} strokeWidth={2.75} />
              </div>
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button & Optional Footer Slot */}
      <div className="pt-5 mt-5 border-t border-[var(--border)] space-y-2.5">
        {ctaVariant === 'disabled-current' ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] font-heading font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 opacity-80 cursor-default select-none"
          >
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span>{ctaLabel}</span>
          </button>
        ) : ctaVariant === 'outlined' ? (
          <button
            type="button"
            onClick={onCtaClick}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--text)]/40 hover:bg-[var(--card)] text-[var(--text)] font-heading font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          >
            {ctaIcon && <span className="shrink-0 flex items-center">{ctaIcon}</span>}
            <span>{ctaLabel}</span>
          </button>
        ) : ctaVariant === 'primary-gradient' ? (
          <button
            type="button"
            onClick={onCtaClick}
            style={{
              background: 'linear-gradient(135deg, #E8342A 0%, #C8241B 55%, #B45309 100%)',
              color: '#FFFFFF',
            }}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl text-[#FFFFFF] font-heading font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(232,52,42,0.3)] hover:brightness-110 transition-all duration-200 cursor-pointer"
          >
            {ctaIcon && <span className="shrink-0 flex items-center text-[#FFFFFF]">{ctaIcon}</span>}
            <span className="text-[#FFFFFF]">{ctaLabel}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onCtaClick}
            style={{ backgroundColor: '#E8342A', color: '#FFFFFF' }}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[var(--red)] hover:bg-[#d62d23] text-[#FFFFFF] font-heading font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(232,52,42,0.28)] transition-all duration-200 cursor-pointer"
          >
            {ctaIcon && <span className="shrink-0 flex items-center text-[#FFFFFF]">{ctaIcon}</span>}
            <span className="text-[#FFFFFF]">{ctaLabel}</span>
          </button>
        )}

        {footerSlot}
      </div>
    </div>
  );
}
