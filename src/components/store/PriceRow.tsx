import React, { useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { KobanIcon } from '@/components/koban/KobanIcon';

export interface PriceRowProps {
  price: number;
  originalPrice?: number;
  isOnSale?: boolean;
  isOwned: boolean;
  isEquipped: boolean;
  isInCart: boolean;
  disabled?: boolean;
  isPurchasing?: boolean;
  onToggleCart: (e: React.MouseEvent) => void;
  onPrimaryAction: (e: React.MouseEvent) => void;
}

export const PriceRow: React.FC<PriceRowProps> = ({
  price,
  originalPrice,
  isOnSale,
  isOwned,
  isEquipped,
  isInCart,
  disabled = false,
  isPurchasing = false,
  onToggleCart,
  onPrimaryAction,
}) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwned || disabled || isPurchasing) return;
    if (!isInCart) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 550);
    }
    onToggleCart(e);
  };

  const handlePrimaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isPurchasing) return;
    onPrimaryAction(e);
  };

  return (
    <div className="pt-2.5 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-h-[44px]">
      {/* Top on mobile / Left on desktop: Full price or Owned status on its own unobstructed line */}
      <div className="flex items-center justify-between sm:justify-start gap-1.5 min-w-0 w-full sm:w-auto">
        {isOwned ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{isEquipped ? 'Equipped' : 'Owned'}</span>
          </span>
        ) : (
          <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
            <span className="inline-flex items-center gap-1 whitespace-nowrap shrink-0">
              <KobanIcon size={15} className="shrink-0 self-center" />
              <span className="text-[13px] sm:text-sm font-black tabular-nums text-[var(--text-primary)] leading-none whitespace-nowrap">
                {price.toLocaleString()}
              </span>
            </span>
            {isOnSale && originalPrice && originalPrice > price && (
              <span className="text-[10px] font-semibold tabular-nums text-[var(--text-muted)] line-through leading-none whitespace-nowrap shrink-0">
                {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom on mobile / Right on desktop: Add-to-cart "+" button + Main action button */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 w-full sm:w-auto">
        {!isOwned && (
          <button
            type="button"
            disabled={disabled || isPurchasing}
            onClick={handleCartClick}
            aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
            title={isInCart ? 'In cart (tap to remove)' : 'Add to cart'}
            className={`relative p-0.5 inline-flex items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-50 shrink-0 ${
              justAdded ? 'scale-110' : ''
            }`}
          >
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-bold transition-all ${
                isInCart
                  ? 'bg-[#E11D2A]/15 border-[#E11D2A]/50 text-[#E11D2A]'
                  : 'bg-[var(--bg-elevated)] hover:bg-[var(--border)] border-[var(--border)] text-[var(--text-primary)]'
              }`}
            >
              {isInCart ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </span>
          </button>
        )}

        {/* Main button: full remaining width on mobile, uniform min-width on desktop */}
        {isOwned ? (
          <button
            type="button"
            disabled={disabled || isPurchasing}
            onClick={handlePrimaryClick}
            className={`flex-1 sm:flex-initial min-w-[78px] sm:min-w-[84px] h-8 px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${
              isEquipped
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isPurchasing ? (
              <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
            ) : (
              <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />
            )}
            <span>{isEquipped ? 'Active' : 'Owned'}</span>
          </button>
        ) : isInCart ? (
          <button
            type="button"
            disabled={disabled || isPurchasing}
            onClick={handlePrimaryClick}
            className="flex-1 sm:flex-initial min-w-[78px] sm:min-w-[84px] h-8 px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1 bg-transparent text-[#E11D2A] border border-[#E11D2A]/60 hover:bg-[#E11D2A]/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />
            <span>In cart</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || isPurchasing}
            onClick={handlePrimaryClick}
            className="flex-1 sm:flex-initial min-w-[78px] sm:min-w-[84px] h-8 px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1 bg-[#E11D2A] hover:bg-[#c81824] text-white shadow-sm transition-all active:scale-95 disabled:opacity-60"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
                <span>Buying…</span>
              </>
            ) : (
              <span>Buy</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
