import React from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import type { CosmeticRarity } from '@/data/cosmeticsCatalog';

export type OwnershipFilter = 'all' | 'unowned' | 'owned';
export type SortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'rarity_desc'
  | 'newest';

export interface StoreFilterState {
  rarity: 'all' | CosmeticRarity;
  ownership: OwnershipFilter;
  maxPrice: number;
  animatedOnly: boolean;
  sortBy: SortOption;
}

export interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: StoreFilterState;
  priceCeiling: number;
  resultCount: number;
  onChange: (next: Partial<StoreFilterState>) => void;
  onReset: () => void;
}

const RARITIES: Array<{ id: 'all' | CosmeticRarity; label: string }> = [
  { id: 'all', label: 'All Rarities' },
  { id: 'common', label: 'Common' },
  { id: 'rare', label: 'Rare' },
  { id: 'epic', label: 'Epic' },
  { id: 'legendary', label: 'Legendary' },
  { id: 'mythic', label: 'Mythic' },
];

const SORT_OPTIONS: Array<{ id: SortOption; label: string }> = [
  { id: 'featured', label: 'Featured & Popular' },
  { id: 'newest', label: 'Newest First' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rarity_desc', label: 'Rarity: Highest First' },
];

export const FilterSheet: React.FC<FilterSheetProps> = ({
  open,
  onClose,
  filters,
  priceCeiling,
  resultCount,
  onChange,
  onReset,
}) => {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-fullscreen-modal="true"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--bg-card)] border-t sm:border border-[var(--border)] shadow-2xl overflow-hidden max-h-[88dvh] flex flex-col"
      >
        {/* Drag handle on mobile */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#E11D2A]" />
            <h2 className="text-base font-black text-[var(--text-primary)]">
              Filters &amp; Sort
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Sort Dropdown */}
          <div>
            <label
              htmlFor="store-sort-select"
              className="block text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2"
            >
              Sort By
            </label>
            <select
              id="store-sort-select"
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value as SortOption })}
              className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[#E11D2A]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="store-price-range"
                className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)]"
              >
                Max Price
              </label>
              <span className="text-xs font-extrabold tabular-nums text-[var(--text-primary)]">
                {filters.maxPrice >= priceCeiling
                  ? `Any (up to ${priceCeiling.toLocaleString()} Kobans)`
                  : `Up to ${filters.maxPrice.toLocaleString()} Kobans`}
              </span>
            </div>
            <input
              id="store-price-range"
              type="range"
              min={150}
              max={priceCeiling}
              step={10}
              value={Math.min(filters.maxPrice, priceCeiling)}
              onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
              className="w-full accent-[#E11D2A] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-semibold text-[var(--text-muted)] mt-1">
              <span>150 Kobans</span>
              <span>{Math.round(priceCeiling / 2).toLocaleString()} Kobans</span>
              <span>{priceCeiling.toLocaleString()} Kobans</span>
            </div>
          </div>

          {/* Rarity */}
          <div>
            <span className="block text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Rarity
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RARITIES.map((r) => {
                const active = filters.rarity === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onChange({ rarity: r.id })}
                    className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-[#E11D2A] text-white border-[#E11D2A]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ownership */}
          <div>
            <span className="block text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Ownership Status
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'all', label: 'All Items' },
                  { id: 'unowned', label: 'Unowned' },
                  { id: 'owned', label: 'Owned' },
                ] as const
              ).map((opt) => {
                const active = filters.ownership === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ ownership: opt.id })}
                    className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-[#E11D2A] text-white border-[#E11D2A]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animated Only toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[var(--text-primary)]">
                  Animated Only
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Show cosmetics with live motion effects
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filters.animatedOnly}
              onClick={() => onChange({ animatedOnly: !filters.animatedOnly })}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                filters.animatedOnly ? 'bg-[#E11D2A]' : 'bg-[var(--border)]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  filters.animatedOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-[var(--border)] flex items-center gap-3 bg-[var(--bg-card)]">
          <button
            type="button"
            onClick={onReset}
            className="h-11 px-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-extrabold text-[var(--text-secondary)] inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black shadow-sm transition-all"
          >
            Show {resultCount} {resultCount === 1 ? 'item' : 'items'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
