import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { KobanIcon } from '@/components/koban/KobanIcon';

export interface PriceRowProps {
  price: number;
  originalPrice?: number;
  isOnSale?: boolean;
  isOwned: boolean;
  isEquipped: boolean;
  isInCart: boolean;
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
  onToggleCart,
  onPrimaryAction,
}) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwned) return;
    if (!isInCart) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 550);
    }
    onToggleCart(e);
  };

  const handlePrimaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrimaryAction(e);
  };

  return (
    <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-1.5 min-h-[44px]">
      {/* Left: Coin icon + price on a single baseline */}
      <div className="flex items-center gap-1.5 min-w-0">
        {isOwned ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--text-secondary)]">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{isEquipped ? 'Equipped' : 'Owned'}</span>
          </span>
        ) : (
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="inline-flex items-center gap-1">
              <KobanIcon size={15} className="shrink-0 self-center" />
              <span className="text-[13px] sm:text-sm font-black tabular-nums text-[var(--text-primary)] leading-none">
                {price.toLocaleString()}
              </span>
            </span>
            {isOnSale && originalPrice && originalPrice > price && (
              <span className="text-[10px] font-semibold tabular-nums text-[var(--text-muted)] line-through leading-none">
                {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Add-to-cart "+" button (with 44x44 tap target) + Uniform-size main button */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isOwned && (
          <button
            type="button"
            onClick={handleCartClick}
            aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
            title={isInCart ? 'In cart (tap to remove)' : 'Add to cart'}
            className={`relative -m-1 p-1 inline-flex items-center justify-center rounded-xl transition-all active:scale-90 ${
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

        {/* Main button: exact same dimensions across Buy, In cart, and Owned */}
        {isOwned ? (
          <button
            type="button"
            onClick={handlePrimaryClick}
            className={`min-w-[78px] sm:min-w-[84px] h-8 px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1 transition-all ${
              isEquipped
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />
            <span>{isEquipped ? 'Active' : 'Owned'}</span>
          </button>
        ) : isInCart ? (
          <button
            type="button"
            onClick={handlePrimaryClick}
            className="min-w-[78px] sm:min-w-[84px] h-8 px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1 bg-transparent text-[#E11D2A] border border-[#E11D2A]/60 hover:bg-[#E11D2A]/10 transition-all active:scale-95"
          >
            <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />
            <span>In cart</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePrimaryClick}
            className="min-w-[78px] sm:min-w-[84px] h-8 px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1 bg-[#E11D2A] hover:bg-[#c81824] text-white shadow-sm transition-all active:scale-95"
          >
            <span>Buy</span>
          </button>
        )}
      </div>
    </div>
  );
};
