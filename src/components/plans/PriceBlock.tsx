import { KobanIcon } from '@/components/koban/KobanIcon';

export interface PriceBlockProps {
  pricePkr: number;
  cadenceLabel?: string;
  priceKobans?: number;
  regularPricePkr?: number;
  subtext?: string;
  accentColor?: 'default' | 'pro' | 'gold';
}

/**
 * Reusable PriceBlock component for Plans page and Store Boardly Pro tab.
 * Ensures "PKR 199" and "/ month" are aligned on the exact same baseline
 * with consistent font sizing across all cards in both light and dark themes.
 */
export function PriceBlock({
  pricePkr,
  cadenceLabel,
  priceKobans,
  regularPricePkr,
  subtext,
  accentColor = 'default',
}: PriceBlockProps) {
  const formattedPkr = `PKR ${pricePkr.toLocaleString()}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className={`font-heading font-extrabold text-2xl sm:text-[28px] tracking-tight leading-none ${
            accentColor === 'pro'
              ? 'text-[var(--text)]'
              : accentColor === 'gold'
              ? 'text-[var(--text)]'
              : 'text-[var(--text)]'
          }`}
        >
          {formattedPkr}
        </span>

        {regularPricePkr && regularPricePkr > pricePkr && (
          <span className="font-mono text-xs text-[var(--muted)] line-through">
            PKR {regularPricePkr.toLocaleString()}
          </span>
        )}

        {cadenceLabel && (
          <span className="font-body text-xs sm:text-sm font-medium text-[var(--muted)] leading-none">
            {cadenceLabel}
          </span>
        )}

        {typeof priceKobans === 'number' && priceKobans > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px] font-semibold text-[var(--text)]">
            <KobanIcon size={12} />
            <span>{priceKobans.toLocaleString()} Kobans</span>
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-[var(--muted)] leading-relaxed">{subtext}</p>
      )}
    </div>
  );
}
