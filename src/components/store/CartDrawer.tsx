import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { getCosmeticById, type CosmeticItem } from '@/data/cosmeticsCatalog';
import type { CartCheckoutResult } from '@/services/kobanService';
import { KobanIcon } from '@/components/koban/KobanIcon';
import {
  ProfileEffectCardPreview,
  AvatarPicture,
  AvatarFrame,
  Nameplate,
} from '@/components/koban/CosmeticRenderers';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { CATEGORY_SHORT_LABEL } from './StoreCard';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartItems: Array<CosmeticItem & { price?: number }>;
  balance: number;
  isSuperAdmin: boolean;
  userDisplayName: string;
  userPhotoURL?: string | null;
  processing: boolean;
  errorMessage: string | null;
  flaggedItemsNotice: Array<{
    id: string;
    name: string;
    reason: 'already_owned' | 'unavailable';
  }>;
  completedOrder: CartCheckoutResult | null;
  equippingOrder: boolean;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onOpenGetKobans: () => void;
  onEquipPurchased: () => void;
  onViewCollection: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onClose,
  cartItems,
  balance,
  isSuperAdmin,
  userDisplayName,
  userPhotoURL,
  processing,
  errorMessage,
  flaggedItemsNotice,
  completedOrder,
  equippingOrder,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onOpenGetKobans,
  onEquipPurchased,
  onViewCollection,
}) => {
  // Detect if 2+ items in the cart share a category
  const duplicateCategories = useMemo(() => {
    const counts: Record<string, string[]> = {};
    for (const item of cartItems) {
      const label = CATEGORY_SHORT_LABEL[item.type];
      if (!counts[label]) counts[label] = [];
      counts[label].push(item.name);
    }
    return Object.entries(counts)
      .filter(([, names]) => names.length >= 2)
      .map(([category, names]) => ({
        category,
        newestName: names[names.length - 1],
        count: names.length,
      }));
  }, [cartItems]);

  if (!open || typeof document === 'undefined') return null;

  const subtotal = isSuperAdmin
    ? 0
    : cartItems.reduce(
        (sum, item) =>
          sum + Math.max(0, Math.floor(item.price ?? item.priceKobans)),
        0
      );
  const pkrEquivalent = (subtotal / 10).toLocaleString(undefined, {
    minimumFractionDigits: subtotal % 10 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
  const canAfford = isSuperAdmin || balance >= subtotal;
  const deficit = Math.max(0, subtotal - balance);
  const balanceAfter = isSuperAdmin ? balance : Math.max(0, balance - subtotal);

  return createPortal(
    <div
      data-fullscreen-modal="true"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
      onClick={() => {
        if (!processing) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--bg-card)] border-t sm:border border-[var(--border)] shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
      >
        {/* Mobile drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E11D2A]/15 border border-[#E11D2A]/30 flex items-center justify-center text-[#E11D2A]">
              {completedOrder ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)] leading-tight">
                {completedOrder
                  ? 'Purchase Complete!'
                  : `Your Cart (${cartItems.length})`}
              </h2>
              <p className="text-[11px] font-medium text-[var(--text-muted)]">
                {completedOrder
                  ? `${completedOrder.purchasedItems.length} ${
                      completedOrder.purchasedItems.length === 1 ? 'item' : 'items'
                    } unlocked in your collection`
                  : 'Instant multi-item checkout'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!completedOrder && cartItems.length > 0 && (
              <button
                type="button"
                disabled={processing}
                onClick={onClearCart}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[#E11D2A] px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                Clear cart
              </button>
            )}
            <button
              type="button"
              disabled={processing}
              onClick={onClose}
              aria-label="Close cart"
              className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Completed Order Confirmation State */}
        {completedOrder ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-primary)]">
                <p className="font-extrabold text-emerald-500 mb-0.5">
                  All items unlocked &amp; receipt emailed
                </p>
                <p className="text-[var(--text-secondary)]">
                  Your new cosmetics are ready. Equip them all right now or view them in your collection.
                </p>
              </div>
            </div>

            {/* Purchased items list */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {completedOrder.purchasedItems.map((entry) => {
                const fullItem =
                  getCosmeticById(entry.id) ||
                  ({
                    id: entry.id,
                    name: entry.name,
                    type: entry.type,
                    rarity: entry.rarity,
                    priceKobans: entry.pricePaid,
                    description: '',
                    animated: entry.animated,
                    isAnimated: entry.animated,
                  } as CosmeticItem);

                return (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CartItemThumbnail
                        item={fullItem}
                        userDisplayName={userDisplayName}
                        userPhotoURL={userPhotoURL}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[var(--text-primary)] truncate">
                          {entry.name}
                        </p>
                        <p className="text-[11px] font-medium text-[var(--text-muted)]">
                          {CATEGORY_SHORT_LABEL[entry.type]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <KobanIcon size={14} />
                      <span className="text-xs font-black tabular-nums text-[var(--text-primary)]">
                        {entry.pricePaid.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Balance summary */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] font-semibold">
                  Total Spent
                </span>
                <span className="inline-flex items-center gap-1 font-black tabular-nums text-[var(--text-primary)]">
                  <KobanIcon size={14} />
                  {completedOrder.totalPaid.toLocaleString()} Kobans
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] font-semibold">
                  New Wallet Balance
                </span>
                <span className="inline-flex items-center gap-1 font-black tabular-nums text-emerald-500">
                  <KobanIcon size={14} />
                  {completedOrder.newBalance.toLocaleString()} Kobans
                </span>
              </div>
            </div>

            {/* Action buttons: "Equip now" and "View collection" */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={equippingOrder}
                onClick={onEquipPurchased}
                className="flex-1 h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
              >
                {equippingOrder ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Equip now</span>
              </button>
              <button
                type="button"
                onClick={onViewCollection}
                className="flex-1 h-11 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-primary)] text-xs sm:text-sm font-extrabold inline-flex items-center justify-center transition-all"
              >
                View collection
              </button>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[var(--text-primary)]">
                Your cart is empty
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Tap the &ldquo;+&rdquo; button on any store card to add multiple cosmetics and buy them together.
              </p>
            </div>
          </div>
        ) : (
          /* Active Cart State */
          <>
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
              {/* Flagged items notice (if any became owned or unavailable) */}
              {flaggedItemsNotice.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-[var(--text-primary)]">
                    <p className="font-extrabold text-amber-500">
                      Updated your cart before charging:
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--text-secondary)]">
                      {flaggedItemsNotice.map((f) => (
                        <li key={f.id}>
                          • <strong>{f.name}</strong> (
                          {f.reason === 'already_owned'
                            ? 'already owned'
                            : 'currently unavailable'}
                          )
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Same-category conflict note (non-blocking) */}
              {duplicateCategories.length > 0 && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5 text-xs">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    You have multiple items in the same slot (
                    {duplicateCategories.map((d) => d.category).join(', ')}). Both will be added to your collection, and tapping <strong>Equip now</strong> will equip the newest one (
                    {duplicateCategories.map((d) => d.newestName).join(', ')}).
                  </p>
                </div>
              )}

              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-[#E11D2A]/10 border border-[#E11D2A]/30 flex items-start gap-2.5 text-xs text-[#E11D2A]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-2">
                {cartItems.map((item) => {
                  const itemPrice = item.price ?? item.priceKobans;
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CartItemThumbnail
                          item={item}
                          userDisplayName={userDisplayName}
                          userPhotoURL={userPhotoURL}
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-[13px] font-extrabold text-[var(--text-primary)] truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] font-medium text-[var(--text-muted)]">
                            {CATEGORY_SHORT_LABEL[item.type]}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-1">
                          <KobanIcon size={14} />
                          <span className="text-xs sm:text-sm font-black tabular-nums text-[var(--text-primary)]">
                            {itemPrice.toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => onRemoveItem(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="w-8 h-8 rounded-lg bg-[var(--bg-card)] hover:bg-[#E11D2A]/15 text-[var(--text-muted)] hover:text-[#E11D2A] border border-[var(--border)] flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary & Checkout Footer */}
            <div className="p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-[var(--border)] bg-[var(--bg-card)] space-y-3">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-[var(--text-secondary)]">
                    Subtotal ({cartItems.length}{' '}
                    {cartItems.length === 1 ? 'item' : 'items'})
                  </span>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 font-black text-sm tabular-nums text-[var(--text-primary)]">
                      <KobanIcon size={15} />
                      <span>{subtotal.toLocaleString()} Kobans</span>
                    </div>
                    <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                      PKR {pkrEquivalent} · 10 Kobans = PKR 1
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-secondary)]">
                    Current Balance
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold tabular-nums text-[var(--text-primary)]">
                    <KobanIcon size={13} />
                    {balance.toLocaleString()} Kobans
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {canAfford ? 'Balance After Purchase' : 'Shortfall'}
                  </span>
                  {canAfford ? (
                    <span className="inline-flex items-center gap-1 font-extrabold tabular-nums text-emerald-500">
                      <KobanIcon size={13} />
                      {balanceAfter.toLocaleString()} Kobans
                    </span>
                  ) : (
                    <span className="font-extrabold tabular-nums text-[#E11D2A]">
                      You need {deficit.toLocaleString()} more Kobans
                    </span>
                  )}
                </div>
              </div>

              {canAfford ? (
                <button
                  type="button"
                  disabled={processing || cartItems.length === 0}
                  onClick={onCheckout}
                  className="w-full h-12 rounded-2xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-sm font-black inline-flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Checkout…</span>
                    </>
                  ) : (
                    <>
                      <KobanIcon size={16} />
                      <span>
                        Buy all for {subtotal.toLocaleString()} Kobans
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenGetKobans}
                  className="w-full h-12 rounded-2xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-sm font-black inline-flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  <KobanIcon size={16} />
                  <span>Get more Kobans</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

const CartItemThumbnail: React.FC<{
  item: CosmeticItem;
  userDisplayName: string;
  userPhotoURL?: string | null;
}> = ({ item, userDisplayName, userPhotoURL }) => {
  return (
    <div className="w-12 h-12 rounded-xl bg-[#090A0F] dark-surface-preserve border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
      {item.type === 'banner' ? (
        <BannerRenderer
          bannerId={item.id}
          animated={false}
          className="w-full h-full"
        />
      ) : item.type === 'avatar' ? (
        <AvatarPicture avatarId={item.id} size={38} animated={false} />
      ) : item.type === 'frame' ? (
        <AvatarFrame frameId={item.id} size={34} animated={false}>
          {userPhotoURL ? (
            <img
              src={userPhotoURL}
              alt={userDisplayName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white">
              {(userDisplayName || 'S')[0]?.toUpperCase()}
            </div>
          )}
        </AvatarFrame>
      ) : item.type === 'effect' ? (
        <div className="w-full h-full scale-90">
          <ProfileEffectCardPreview
            effectId={item.id}
            displayName={userDisplayName}
            animated={false}
            className="w-full h-full !h-full"
          />
        </div>
      ) : (
        <div className="px-1 scale-75">
          <Nameplate
            nameplateId={item.id}
            displayName={userDisplayName}
            animated={false}
          />
        </div>
      )}
    </div>
  );
};
