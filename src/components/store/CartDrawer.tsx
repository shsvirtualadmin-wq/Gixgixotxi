import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/utils/scrollLock';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import { useTheme } from '@/hooks/useTheme';
import { CATEGORY_SHORT_LABEL, RARITY_ACCENT } from './StoreCard';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartItems: Array<CosmeticItem & { price?: number }>;
  balance: number;
  isSuperAdmin: boolean;
  userDisplayName: string;
  userUid?: string | null;
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
  userUid,
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
  const { isDark } = useTheme();
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});
  const [conflictDetailsOpen, setConflictDetailsOpen] = useState(false);

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

  // Reset expanders when drawer closes or conflicts change
  useEffect(() => {
    if (!open) {
      setExpandedItemIds({});
      setConflictDetailsOpen(false);
    }
  }, [open]);

  // Lock body scroll and hide floating bottom navigation while drawer is open
  useBodyScrollLock(open, 'cart-drawer');

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prevModalAttr = document.body.getAttribute('data-fullscreen-modal-open');

    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new Event('boardly:modal-change'));

    return () => {
      if (prevModalAttr === null) {
        document.body.removeAttribute('data-fullscreen-modal-open');
      } else {
        document.body.setAttribute('data-fullscreen-modal-open', prevModalAttr);
      }
      window.dispatchEvent(new Event('boardly:modal-change'));
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const toggleExpandName = (id: string) => {
    setExpandedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
  const rawBalanceAfter = isSuperAdmin ? balance : balance - subtotal;

  const surfaceBg = isDark ? '#0F0F14' : '#FFFFFF';
  const borderClass = isDark ? 'border-white/10' : 'border-black/[0.07]';
  const rowSurfaceClass = isDark
    ? 'bg-white/[0.04] border-white/10'
    : 'bg-black/[0.03] border-black/[0.07]';
  const primaryTextClass = isDark ? 'text-white' : 'text-[#111114]';
  const secondaryTextClass = isDark ? 'text-white/80' : 'text-[#2D2D35]';
  const mutedTextClass = isDark ? 'text-white/60' : 'text-black/60';

  return createPortal(
    <>
      {/* A. Separate Backdrop Layer: ONLY layer with blur */}
      <div
        data-fullscreen-modal="true"
        aria-hidden="true"
        className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!processing) onClose();
        }}
      />

      {/* A. Separate Drawer Layer ABOVE Backdrop: 100% solid opaque surface, zero backdrop-filter */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={completedOrder ? 'Purchase Complete' : `Your Cart (${cartItems.length})`}
        className="fixed inset-x-0 bottom-0 sm:inset-0 z-[1110] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: surfaceBg,
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
          className={`pointer-events-auto w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] border ${borderClass} shadow-2xl overflow-hidden max-h-[calc(100dvh-12px)] sm:max-h-[90dvh] flex flex-col backdrop-blur-none ${
            isDark ? 'bg-[#0F0F14] text-white' : 'bg-[#FFFFFF] text-[#111114]'
          }`}
        >
          {/* Top Drag Handle */}
          <div
            style={{ backgroundColor: surfaceBg }}
            className="pt-2.5 pb-1 flex justify-center shrink-0"
          >
            <div
              className={`w-10 h-1 rounded-full ${
                isDark ? 'bg-white/20' : 'bg-black/15'
              }`}
            />
          </div>

          {/* B. Sticky Header */}
          <div
            style={{
              backgroundColor: surfaceBg,
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            }}
            className={`sticky top-0 z-10 shrink-0 px-5 py-3.5 border-b ${borderClass} flex items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  completedOrder
                    ? isDark
                      ? 'bg-[#0D281E] border-emerald-500/30 text-emerald-400'
                      : 'bg-[#ECFDF5] border-emerald-600/25 text-emerald-700'
                    : isDark
                    ? 'bg-[#2A1215] border-[#E11D2A]/35 text-[#FF5A65]'
                    : 'bg-[#FEF2F2] border-[#E11D2A]/25 text-[#E11D2A]'
                }`}
              >
                {completedOrder ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div
                  style={{ fontFamily: 'var(--font-heading)' }}
                  className={`text-base font-bold leading-tight truncate ${primaryTextClass}`}
                >
                  {completedOrder
                    ? 'Purchase Complete!'
                    : `Your Cart (${cartItems.length})`}
                </div>
                <p className={`text-xs font-medium truncate ${mutedTextClass}`}>
                  {completedOrder
                    ? `${completedOrder.purchasedItems.length} ${
                        completedOrder.purchasedItems.length === 1 ? 'item' : 'items'
                      } unlocked in your collection`
                    : 'Instant multi-item checkout'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!completedOrder && cartItems.length > 0 && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={onClearCart}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    isDark
                      ? 'text-white/70 hover:text-[#FF5A65] hover:bg-white/[0.06]'
                      : 'text-black/70 hover:text-[#E11D2A] hover:bg-black/[0.05]'
                  }`}
                >
                  Clear cart
                </button>
              )}
              <button
                type="button"
                disabled={processing}
                onClick={onClose}
                aria-label="Close cart"
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white/80'
                    : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/[0.07] text-black/75'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Completed Order Confirmation State */}
          {completedOrder ? (
            <div
              style={{ backgroundColor: surfaceBg }}
              className="p-5 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0"
            >
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isDark
                    ? 'bg-[#0D281E] border-emerald-500/30'
                    : 'bg-[#ECFDF5] border-emerald-600/25'
                }`}
              >
                <Sparkles
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                />
                <div className="text-xs">
                  <p
                    className={`font-bold mb-0.5 ${
                      isDark ? 'text-emerald-300' : 'text-emerald-800'
                    }`}
                  >
                    All items unlocked &amp; receipt emailed
                  </p>
                  <p className={secondaryTextClass}>
                    Your new cosmetics are ready. Equip them all right now or view them in your collection.
                  </p>
                </div>
              </div>

              {/* Purchased items list */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto overscroll-contain pr-1">
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
                  const rarityStyle = RARITY_ACCENT[fullItem.rarity] || RARITY_ACCENT.common;

                  return (
                    <div
                      key={entry.id}
                      className={`p-2.5 rounded-2xl border ${rowSurfaceClass} flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CartItemThumbnail
                          item={fullItem}
                          userDisplayName={userDisplayName}
                          userUid={userUid}
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${primaryTextClass}`}>
                            {entry.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[11px] font-medium ${mutedTextClass}`}>
                              {CATEGORY_SHORT_LABEL[entry.type]}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider border ${rarityStyle.badgeBg} ${rarityStyle.badgeText} ${rarityStyle.badgeBorder}`}
                            >
                              {rarityStyle.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <KobanIcon size={14} />
                        <span className={`text-xs font-bold tabular-nums ${primaryTextClass}`}>
                          {entry.pricePaid.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Balance summary */}
              <div className={`p-3.5 rounded-2xl border ${rowSurfaceClass} space-y-1.5 text-xs`}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${secondaryTextClass}`}>
                    Total Spent
                  </span>
                  <span className={`inline-flex items-center gap-1 font-bold tabular-nums ${primaryTextClass}`}>
                    <KobanIcon size={14} />
                    {completedOrder.totalPaid.toLocaleString()} Kobans
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${secondaryTextClass}`}>
                    New Wallet Balance
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold tabular-nums ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}
                  >
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
                  style={{ backgroundColor: '#E11D2A', color: '#FFFFFF' }}
                  className="flex-1 h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
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
                  className={`flex-1 h-11 rounded-xl border ${rowSurfaceClass} ${primaryTextClass} text-xs sm:text-sm font-bold inline-flex items-center justify-center transition-all`}
                >
                  View collection
                </button>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty Cart State */
            <div
              style={{ backgroundColor: surfaceBg }}
              className="p-8 text-center space-y-3"
            >
              <div
                className={`w-14 h-14 rounded-2xl border ${rowSurfaceClass} flex items-center justify-center mx-auto ${mutedTextClass}`}
              >
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-sm font-bold ${primaryTextClass}`}>
                  Your cart is empty
                </p>
                <p className={`text-xs mt-1 ${mutedTextClass}`}>
                  Tap the &ldquo;+&rdquo; button on any store card to add multiple cosmetics and buy them together.
                </p>
              </div>
            </div>
          ) : (
            /* Active Cart State */
            <>
              {/* B. Scrollable Body: ONLY this area scrolls */}
              <div
                style={{ backgroundColor: surfaceBg }}
                className="px-4 sm:px-5 pt-3.5 pb-6 space-y-2.5 overflow-y-auto overscroll-contain flex-1 min-h-0 max-h-[calc(100dvh-260px)]"
              >
                {/* Flagged items notice (if any became owned or unavailable) */}
                {flaggedItemsNotice.length > 0 && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                      isDark
                        ? 'bg-[#2A1F0D] border-amber-500/35 text-white'
                        : 'bg-[#FFFBEB] border-amber-500/40 text-[#111114]'
                    }`}
                  >
                    <AlertCircle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isDark ? 'text-amber-400' : 'text-amber-700'
                      }`}
                    />
                    <div>
                      <p
                        className={`font-bold ${
                          isDark ? 'text-amber-300' : 'text-amber-800'
                        }`}
                      >
                        Updated your cart before charging:
                      </p>
                      <ul className={`mt-1 space-y-0.5 text-[11px] ${secondaryTextClass}`}>
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

                {/* D. Compact Same-Slot Notice: 1 line + "Details" expander on solid tinted surface */}
                {duplicateCategories.length > 0 && (
                  <div
                    style={{
                      backgroundColor: isDark ? '#12203A' : '#EAF2FF',
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs ${
                      isDark
                        ? 'bg-[#12203A] border-[#2B4C7E] text-white'
                        : 'bg-[#EAF2FF] border-[#9EC5FE] text-[#111114]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Info
                          className={`w-4 h-4 shrink-0 ${
                            isDark ? 'text-blue-300' : 'text-blue-700'
                          }`}
                        />
                        <p className="text-xs font-medium truncate">
                          {duplicateCategories.length === 1
                            ? `Multiple ${duplicateCategories[0].category} items in cart`
                            : `${duplicateCategories.length} slots have multiple items in cart`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConflictDetailsOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 transition-colors ${
                          isDark
                            ? 'text-blue-200 hover:bg-white/10'
                            : 'text-blue-800 hover:bg-blue-900/10'
                        }`}
                      >
                        <span>{conflictDetailsOpen ? 'Hide' : 'Details'}</span>
                        {conflictDetailsOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {conflictDetailsOpen && (
                      <p
                        className={`mt-1.5 pt-1.5 border-t text-[11px] leading-relaxed ${
                          isDark
                            ? 'border-white/10 text-white/90'
                            : 'border-blue-900/15 text-[#111114]'
                        }`}
                      >
                        Both items in{' '}
                        <strong>
                          {duplicateCategories.map((d) => d.category).join(', ')}
                        </strong>{' '}
                        will be added to your collection, and tapping{' '}
                        <strong>Equip now</strong> will equip the newest one (
                        {duplicateCategories.map((d) => d.newestName).join(', ')}).
                      </p>
                    )}
                  </div>
                )}

                {/* Error banner */}
                {errorMessage && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                      isDark
                        ? 'bg-[#2A1215] border-[#E11D2A]/40 text-[#FF8A92]'
                        : 'bg-[#FEF2F2] border-[#E11D2A]/30 text-[#B91C1C]'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{errorMessage}</span>
                  </div>
                )}

                {/* C. Cart Items List */}
                <div className="space-y-2">
                  {cartItems.map((item) => {
                    const itemPrice = item.price ?? item.priceKobans;
                    const rarityStyle = RARITY_ACCENT[item.rarity] || RARITY_ACCENT.common;
                    const isNameExpanded = Boolean(expandedItemIds[item.id]);

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-2xl border ${rowSurfaceClass} backdrop-blur-none flex items-center justify-between gap-3`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <CartItemThumbnail
                            item={item}
                            userDisplayName={userDisplayName}
                            userUid={userUid}
                          />
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => toggleExpandName(item.id)}
                              title={item.name}
                              className={`text-left w-full text-xs sm:text-[13px] font-bold leading-snug ${primaryTextClass} ${
                                isNameExpanded
                                  ? 'whitespace-normal break-words'
                                  : 'truncate block'
                              }`}
                            >
                              {item.name}
                            </button>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={`text-[11px] font-medium ${mutedTextClass}`}>
                                {CATEGORY_SHORT_LABEL[item.type]}
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider border ${rarityStyle.badgeBg} ${rarityStyle.badgeText} ${rarityStyle.badgeBorder}`}
                              >
                                {rarityStyle.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <KobanIcon size={15} />
                            <span
                              className={`text-xs sm:text-sm font-bold tabular-nums ${primaryTextClass}`}
                            >
                              {itemPrice.toLocaleString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => onRemoveItem(item.id)}
                            aria-label={`Remove ${item.name} from cart`}
                            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition-colors disabled:opacity-50 ${
                              isDark
                                ? 'bg-white/[0.04] hover:bg-[#E11D2A]/20 border-white/10 text-white/70 hover:text-[#FF6B75]'
                                : 'bg-black/[0.03] hover:bg-[#E11D2A]/10 border-black/[0.07] text-black/65 hover:text-[#D91422]'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* B & G. Sticky Footer: solid background, top divider, soft shadow, safe-area inset */}
              <div
                style={{
                  backgroundColor: surfaceBg,
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                }}
                className={`sticky bottom-0 z-10 shrink-0 px-4 sm:px-5 pt-3.5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t ${borderClass} space-y-3 ${
                  isDark
                    ? 'shadow-[0_-10px_28px_rgba(0,0,0,0.55)]'
                    : 'shadow-[0_-10px_28px_rgba(15,23,42,0.08)]'
                }`}
              >
                <div className={`p-3.5 rounded-2xl border ${rowSurfaceClass} space-y-2 text-xs`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`font-semibold ${secondaryTextClass}`}>
                      Subtotal ({cartItems.length}{' '}
                      {cartItems.length === 1 ? 'item' : 'items'})
                    </span>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1 font-bold text-sm tabular-nums ${primaryTextClass}`}
                      >
                        <KobanIcon size={15} />
                        <span>{subtotal.toLocaleString()} Kobans</span>
                      </div>
                      <p className={`text-[11px] font-medium ${mutedTextClass}`}>
                        PKR {pkrEquivalent} · 10 Kobans = PKR 1
                      </p>
                    </div>
                  </div>

                  <div className={`pt-2 border-t ${borderClass} flex items-center justify-between gap-2`}>
                    <span className={`font-semibold ${secondaryTextClass}`}>
                      Current Balance
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold tabular-nums ${primaryTextClass}`}
                    >
                      <KobanIcon size={13} />
                      {balance.toLocaleString()} Kobans
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold ${secondaryTextClass}`}>
                      Balance After Purchase
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold tabular-nums ${
                        canAfford
                          ? isDark
                            ? 'text-emerald-400'
                            : 'text-emerald-700'
                          : isDark
                          ? 'text-[#FF6B75]'
                          : 'text-[#D91422]'
                      }`}
                    >
                      <KobanIcon size={13} />
                      {rawBalanceAfter.toLocaleString()} Kobans
                    </span>
                  </div>

                  {!canAfford && (
                    <div className="flex items-center justify-end">
                      <span
                        className={`text-[11px] font-bold tabular-nums ${
                          isDark ? 'text-[#FF6B75]' : 'text-[#D91422]'
                        }`}
                      >
                        You need {deficit.toLocaleString()} more Kobans
                      </span>
                    </div>
                  )}
                </div>

                {/* G. Checkout Button: Solid #E11D2A, full width */}
                {canAfford ? (
                  <button
                    type="button"
                    disabled={processing || cartItems.length === 0}
                    onClick={onCheckout}
                    style={{ backgroundColor: '#E11D2A', color: '#FFFFFF' }}
                    className="w-full h-12 rounded-2xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
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
                    style={{ backgroundColor: '#E11D2A', color: '#FFFFFF' }}
                    className="w-full h-12 rounded-2xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                  >
                    <KobanIcon size={16} />
                    <span>Get more Kobans</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

const CartItemThumbnail: React.FC<{
  item: CosmeticItem;
  userDisplayName: string;
  userUid?: string | null;
  userPhotoURL?: string | null;
}> = ({ item, userDisplayName, userUid }) => {
  return (
    <div className="w-14 h-14 rounded-xl bg-[#090A0F] dark-surface-preserve border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
      {item.type === 'banner' ? (
        <BannerRenderer
          bannerId={item.id}
          animated={false}
          className="w-full h-full"
        />
      ) : item.type === 'avatar' ? (
        <AvatarPicture avatarId={item.id} size={42} animated={false} />
      ) : item.type === 'frame' ? (
        <AvatarFrame frameId={item.id} size={38} animated={false}>
          <AvatarPicture
            uid={userUid}
            seed={userUid || undefined}
            size={30}
            animated={false}
          />
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
