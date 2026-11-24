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
import { calculateCartTotals } from '@/lib/storeCartPricing';
import { RARITY_ACCENT } from './StoreCard';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, formatNumber } = useLanguage();
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});
  const [conflictDetailsOpen, setConflictDetailsOpen] = useState(false);

  // Single shared calculation for cart items, subtotal, affordability, and banner
  const cartTotals = useMemo(
    () =>
      calculateCartTotals({
        items: cartItems,
        balance,
        isSuperAdmin,
      }),
    [cartItems, balance, isSuperAdmin]
  );
  const uniqueCartItems = cartTotals.items;

  // Detect if 2+ items in the cart share a category
  const duplicateCategories = useMemo(() => {
    const counts: Record<string, string[]> = {};
    for (const item of uniqueCartItems) {
      const label = t(`store.cat_${item.type}`);
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
  }, [uniqueCartItems, t]);

  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStateRef = React.useRef<{
    active: boolean;
    pointerId: number | null;
    startY: number;
    lastY: number;
    lastTime: number;
    velocityY: number;
  }>({
    active: false,
    pointerId: null,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocityY: 0,
  });

  // Reset expanders when drawer closes or conflicts change
  useEffect(() => {
    if (!open) {
      setExpandedItemIds({});
      setConflictDetailsOpen(false);
      setIsClosing(false);
      setDragY(0);
      setIsDraggingSheet(false);
    }
  }, [open]);

  const handleCloseWithSlide = () => {
    if (processing) return;
    setIsClosing(true);
    setDragY(0);
    setIsDraggingSheet(false);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 240);
  };

  const handleGrabberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (processing) return;
    e.stopPropagation();
    const now = performance.now();
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastTime: now,
      velocityY: 0,
    };
    setIsDraggingSheet(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleGrabberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;
    const now = performance.now();
    const dt = Math.max(1, now - ds.lastTime);
    const dyFromLast = e.clientY - ds.lastY;
    ds.velocityY = dyFromLast / dt;
    ds.lastY = e.clientY;
    ds.lastTime = now;

    const rawDelta = e.clientY - ds.startY;
    const clampedDelta = rawDelta < 0 ? rawDelta * 0.2 : rawDelta;
    setDragY(clampedDelta);
  };

  const handleGrabberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.pointerId !== e.pointerId) return;
    ds.active = false;
    ds.pointerId = null;
    setIsDraggingSheet(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    const totalDy = e.clientY - ds.startY;
    const vy = ds.velocityY;
    if (totalDy > 95 || vy > 0.55) {
      handleCloseWithSlide();
    } else {
      setDragY(0);
    }
  };

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

  const subtotal = cartTotals.subtotal;
  const pkrEquivalent = formatNumber(subtotal / 10);
  const canAfford = cartTotals.canAfford;
  const deficit = cartTotals.deficit;
  const rawBalanceAfter = cartTotals.balanceAfterPurchase;
  // Never display a stale/false "Insufficient Kobans" error banner when the real total is affordable
  const resolvedBannerError = !canAfford
    ? t('cart.needMoreKobans', { amount: formatNumber(deficit) })
    : errorMessage && !/insufficient\s+kobans/i.test(errorMessage)
    ? errorMessage
    : null;

  const borderClass = isDark ? 'border-white/[0.18]' : 'border-black/[0.08]';
  const rowSurfaceClass = isDark
    ? 'bg-white/[0.06] border-white/[0.14]'
    : 'bg-black/[0.03] border-black/[0.08]';
  const primaryTextClass = isDark ? 'text-white' : 'text-[#111114]';
  const secondaryTextClass = isDark ? 'text-white/80' : 'text-[#2D2D35]';
  const mutedTextClass = isDark ? 'text-white/70' : 'text-black/60';

  return createPortal(
    <>
      {/* Backdrop Layer */}
      <div
        data-fullscreen-modal="true"
        aria-hidden="true"
        className={`fixed inset-0 z-[1100] bg-black/60 backdrop-blur-md transition-opacity duration-250 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleCloseWithSlide}
      />

      {/* Glass Bottom Sheet Layer (radius 40px) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          completedOrder
            ? t('cart.purchaseComplete')
            : t('cart.yourCartCount', { count: formatNumber(cartItems.length) })
        }
        className="fixed inset-x-0 bottom-0 sm:inset-0 z-[1110] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={
            dragY !== 0 || isDraggingSheet
              ? {
                  transform: `translate3d(0, ${dragY}px, 0)`,
                  transition: isDraggingSheet
                    ? 'none'
                    : 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }
              : undefined
          }
          className={`pointer-events-auto w-full max-w-lg glass glass-panel ios-bottom-sheet overflow-hidden max-h-[calc(100dvh-12px)] sm:max-h-[90dvh] flex flex-col ${
            isClosing ? 'is-closing' : ''
          } ${isDark ? 'text-white' : 'text-[#111114]'}`}
        >
          {/* Draggable iOS Sheet Grabber */}
          <div
            onPointerDown={handleGrabberPointerDown}
            onPointerMove={handleGrabberPointerMove}
            onPointerUp={handleGrabberPointerUp}
            onPointerCancel={handleGrabberPointerUp}
            className="pt-3 pb-1.5 flex justify-center shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
            aria-label={t('common.close')}
          >
            <div className="ios-sheet-grabber !my-0" />
          </div>

          {/* Sticky Header */}
          <div
            className={`sticky top-0 z-10 shrink-0 px-5 py-3.5 border-b ${borderClass} flex items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                  completedOrder
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400 spring-check-pop'
                    : 'bg-[#D71921]/20 border-[#D71921]/45 text-[#FF5A65]'
                }`}
              >
                {completedOrder ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 text-start">
                <div
                  style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                  className={`text-base sm:text-lg leading-tight truncate ${primaryTextClass}`}
                >
                  {completedOrder
                    ? t('cart.purchaseComplete')
                    : t('cart.yourCartCount', { count: formatNumber(uniqueCartItems.length) })}
                </div>
                <p className={`text-xs font-medium truncate ${mutedTextClass}`}>
                  {completedOrder
                    ? completedOrder.purchasedItems.length === 1
                      ? t('cart.itemUnlockedSingle')
                      : t('cart.itemsUnlockedCount', {
                          count: formatNumber(completedOrder.purchasedItems.length),
                        })
                    : t('cart.instantCheckout')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!completedOrder && cartItems.length > 0 && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={onClearCart}
                  className={`min-h-[44px] text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                    isDark
                      ? 'text-white/75 hover:text-[#FF5A65] hover:bg-white/[0.08]'
                      : 'text-black/70 hover:text-[#D71921] hover:bg-black/[0.05]'
                  }`}
                >
                  {t('cart.clearCart')}
                </button>
              )}
              <button
                type="button"
                disabled={processing}
                onClick={handleCloseWithSlide}
                aria-label={t('common.close')}
                className="ios-circle-btn disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Completed Order Confirmation State (Purchase Complete) */}
          {completedOrder ? (
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
              {/* Green Success Banner */}
              <div
                className={`p-4 rounded-[24px] border flex items-start gap-3 text-start ${
                  isDark
                    ? 'bg-emerald-500/15 border-emerald-400/35'
                    : 'bg-[#ECFDF5] border-emerald-600/30'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center shrink-0 spring-check-pop">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      isDark ? 'text-emerald-300' : 'text-emerald-700'
                    }`}
                  />
                </div>
                <div className="text-xs leading-relaxed">
                  <p
                    className={`font-bold text-sm mb-0.5 ${
                      isDark ? 'text-emerald-300' : 'text-emerald-800'
                    }`}
                    style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                  >
                    {t('cart.allUnlockedTitle')}
                  </p>
                  <p className={secondaryTextClass}>
                    {t('cart.allUnlockedDesc')}
                  </p>
                </div>
              </div>

              {/* Purchased items list */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto overscroll-contain pe-1 stagger-list">
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
                  const isLegendary = fullItem.rarity === 'legendary';
                  const rarityStyle = RARITY_ACCENT[fullItem.rarity] || RARITY_ACCENT.common;

                  return (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-[22px] border ${rowSurfaceClass} flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-3 min-w-0 text-start">
                        <CartItemThumbnail
                          item={fullItem}
                          userDisplayName={userDisplayName}
                          userUid={userUid}
                        />
                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${primaryTextClass}`}>
                            {entry.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[11px] font-medium ${mutedTextClass}`}>
                              {t(`store.cat_${entry.type}`)}
                            </span>
                            <span
                              style={{
                                fontFamily: "'Doto', var(--font-dot), monospace",
                                fontWeight: 800,
                              }}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${
                                isLegendary
                                  ? 'bg-amber-400/20 text-amber-300 border-amber-300/50 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                                  : `${rarityStyle.badgeBg} ${rarityStyle.badgeText} ${rarityStyle.badgeBorder}`
                              }`}
                            >
                              {t(`store.rarity_${fullItem.rarity}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <KobanIcon size={15} />
                        <span
                          style={{
                            fontFamily: "'Doto', var(--font-dot), monospace",
                            fontWeight: 800,
                          }}
                          className={`text-xs sm:text-sm tabular-nums ltr-nums ${primaryTextClass}`}
                        >
                          {formatNumber(entry.pricePaid)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals box with the new balance in green */}
              <div className={`p-4 rounded-[24px] border ${rowSurfaceClass} space-y-2 text-xs`}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${secondaryTextClass}`}>
                    {t('cart.totalSpent')}
                  </span>
                  <span
                    style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                    className={`inline-flex items-center gap-1.5 tabular-nums ltr-nums ${primaryTextClass}`}
                  >
                    <KobanIcon size={14} />
                    {formatNumber(completedOrder.totalPaid)} Kobans
                  </span>
                </div>
                <div className="dotted-divider my-1" aria-hidden="true" />
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${secondaryTextClass}`}>
                    {t('cart.newBalance')}
                  </span>
                  <span
                    style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                    className={`inline-flex items-center gap-1.5 text-sm tabular-nums ltr-nums ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}
                  >
                    <KobanIcon size={14} />
                    {formatNumber(completedOrder.newBalance)} Kobans
                  </span>
                </div>
              </div>

              {/* Action buttons: Red "Equip now" pill + Glass "View collection" pill */}
              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={equippingOrder}
                  onClick={onEquipPurchased}
                  className="btn-primary flex-1 min-h-[52px] rounded-full text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {equippingOrder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{t('cart.equipNow')}</span>
                </button>
                <button
                  type="button"
                  onClick={onViewCollection}
                  className={`btn-secondary flex-1 min-h-[52px] rounded-full ${primaryTextClass} text-xs sm:text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer`}
                >
                  {t('cart.viewCollection')}
                </button>
              </div>
            </div>
          ) : uniqueCartItems.length === 0 ? (
            /* Empty Cart State */
            <div className="p-8 text-center space-y-3">
              <div
                className={`w-14 h-14 rounded-full border ${rowSurfaceClass} flex items-center justify-center mx-auto ${mutedTextClass}`}
              >
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p
                  style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                  className={`text-base ${primaryTextClass}`}
                >
                  {t('cart.emptyTitle')}
                </p>
                <p className={`text-xs mt-1 ${mutedTextClass}`}>
                  {t('cart.emptyDesc')}
                </p>
              </div>
            </div>
          ) : (
            /* Active Cart State */
            <>
              <div className="px-4 sm:px-5 pt-3.5 pb-6 space-y-2.5 overflow-y-auto overscroll-contain flex-1 min-h-0 max-h-[calc(100dvh-260px)]">
                {/* Flagged items notice */}
                {flaggedItemsNotice.length > 0 && (
                  <div
                    className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs text-start ${
                      isDark
                        ? 'bg-amber-500/15 border-amber-500/35 text-white'
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
                        {t('cart.updatedCartNotice')}
                      </p>
                      <ul className={`mt-1 space-y-0.5 text-[11px] ${secondaryTextClass}`}>
                        {flaggedItemsNotice.map((f) => (
                          <li key={f.id}>
                            • <strong>{f.name}</strong> (
                            {f.reason === 'already_owned'
                              ? t('cart.alreadyOwned')
                              : t('cart.currentlyUnavailable')}
                            )
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Compact Same-Slot Notice */}
                {duplicateCategories.length > 0 && (
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl border text-xs text-start ${
                      isDark
                        ? 'bg-blue-500/15 border-blue-400/35 text-white'
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
                            ? t('cart.multipleCategoryItems', {
                                category: duplicateCategories[0].category,
                              })
                            : t('cart.multipleSlotsNotice', {
                                count: formatNumber(duplicateCategories.length),
                              })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConflictDetailsOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 transition-colors ${
                          isDark
                            ? 'text-blue-200 hover:bg-white/10'
                            : 'text-blue-800 hover:bg-blue-900/10'
                        }`}
                      >
                        <span>{conflictDetailsOpen ? t('common.hide') : t('common.details')}</span>
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
                        {t('cart.duplicateSlotExplanation', {
                          categories: duplicateCategories.map((d) => d.category).join(', '),
                          newest: duplicateCategories.map((d) => d.newestName).join(', '),
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Error banner */}
                {resolvedBannerError && (
                  <div
                    role="alert"
                    className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs text-start ${
                      isDark
                        ? 'bg-[#D71921]/20 border-[#D71921]/45 text-[#FF8A92]'
                        : 'bg-[#FEF2F2] border-[#D71921]/30 text-[#B91C1C]'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{resolvedBannerError}</span>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="space-y-2.5 stagger-list">
                  {uniqueCartItems.map((item) => {
                    const itemPrice = item.price ?? item.priceKobans;
                    const isLegendary = item.rarity === 'legendary';
                    const rarityStyle = RARITY_ACCENT[item.rarity] || RARITY_ACCENT.common;
                    const isNameExpanded = Boolean(expandedItemIds[item.id]);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-[22px] border ${rowSurfaceClass} flex items-center justify-between gap-3`}
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
                              className={`text-start w-full text-xs sm:text-[13px] font-bold leading-snug ${primaryTextClass} ${
                                isNameExpanded
                                  ? 'whitespace-normal break-words'
                                  : 'truncate block'
                              }`}
                            >
                              {item.name}
                            </button>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={`text-[11px] font-medium ${mutedTextClass}`}>
                                {t(`store.cat_${item.type}`)}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'Doto', var(--font-dot), monospace",
                                  fontWeight: 800,
                                }}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${
                                  isLegendary
                                    ? 'bg-amber-400/20 text-amber-300 border-amber-300/50'
                                    : `${rarityStyle.badgeBg} ${rarityStyle.badgeText} ${rarityStyle.badgeBorder}`
                                }`}
                              >
                                {t(`store.rarity_${item.rarity}`)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <KobanIcon size={15} />
                            <span
                              style={{
                                fontFamily: "'Doto', var(--font-dot), monospace",
                                fontWeight: 800,
                              }}
                              className={`text-xs sm:text-sm tabular-nums ltr-nums ${primaryTextClass}`}
                            >
                              {formatNumber(itemPrice)}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => onRemoveItem(item.id)}
                            aria-label={t('store.removeFromCart')}
                            className="ios-circle-btn text-white/70 hover:text-[#FF6B75] disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className={`sticky bottom-0 z-10 shrink-0 px-4 sm:px-5 pt-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] border-t ${borderClass} space-y-3`}
              >
                <div className={`p-4 rounded-[24px] border ${rowSurfaceClass} space-y-2 text-xs`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`font-semibold ${secondaryTextClass}`}>
                      {uniqueCartItems.length === 1
                        ? t('cart.subtotalSingle')
                        : t('cart.subtotalCount', {
                            count: formatNumber(uniqueCartItems.length),
                          })}
                    </span>
                    <div className="text-end">
                      <div
                        style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                        className={`inline-flex items-center gap-1 text-sm tabular-nums ltr-nums ${primaryTextClass}`}
                      >
                        <KobanIcon size={15} />
                        <span>{formatNumber(subtotal)} Kobans</span>
                      </div>
                      <p className={`text-[11px] font-medium ltr-nums ${mutedTextClass}`}>
                        PKR {pkrEquivalent} · 10 Kobans = PKR 1
                      </p>
                    </div>
                  </div>

                  <div className="dotted-divider my-1" aria-hidden="true" />

                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold ${secondaryTextClass}`}>
                      {t('cart.currentBalance')}
                    </span>
                    <span
                      style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                      className={`inline-flex items-center gap-1 tabular-nums ltr-nums ${primaryTextClass}`}
                    >
                      <KobanIcon size={13} />
                      {formatNumber(cartTotals.currentBalance)} Kobans
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold ${secondaryTextClass}`}>
                      {t('cart.balanceAfter')}
                    </span>
                    <span
                      style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
                      className={`inline-flex items-center gap-1 tabular-nums ltr-nums ${
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
                      {formatNumber(rawBalanceAfter)} Kobans
                    </span>
                  </div>

                  {!canAfford && (
                    <div className="flex items-center justify-end">
                      <span
                        className={`text-[11px] font-bold tabular-nums ${
                          isDark ? 'text-[#FF6B75]' : 'text-[#D91422]'
                        }`}
                      >
                        {t('cart.needMoreKobans', { amount: formatNumber(deficit) })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Checkout Button: Solid Red Pill with Glow */}
                {canAfford ? (
                  <button
                    type="button"
                    disabled={processing || cartItems.length === 0}
                    onClick={onCheckout}
                    className="btn-primary w-full min-h-[52px] rounded-full text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('cart.processingCheckout')}</span>
                      </>
                    ) : (
                      <>
                        <KobanIcon size={16} />
                        <span>
                          {t('cart.buyAllFor', { amount: formatNumber(subtotal) })}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenGetKobans}
                    className="btn-primary w-full min-h-[52px] rounded-full text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <KobanIcon size={16} />
                    <span>{t('store.getMoreKobans')}</span>
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
    <div className="w-12 h-12 rounded-2xl bg-[#050506] dark-surface-preserve border border-white/[0.18] flex items-center justify-center overflow-hidden shrink-0">
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
          <AvatarPicture
            uid={userUid}
            seed={userUid || undefined}
            size={26}
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
