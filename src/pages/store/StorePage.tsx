import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Check,
  ShoppingBag,
  ArrowLeft,
  Eye,
  X,
  Plus,
  Crown,
  SlidersHorizontal,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useStoreCart } from '@/hooks/useStoreCart';
import { useTheme } from '@/hooks/useTheme';
import {
  COSMETICS_CATALOG,
  type CosmeticItem,
  type CosmeticRarity,
  getCosmeticById,
} from '@/data/cosmeticsCatalog';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { CoinBurstEffect } from '@/components/koban/CoinBurstEffect';
import {
  ProfileEffectCardPreview,
  AvatarPicture,
  AvatarFrame,
  Nameplate,
} from '@/components/koban/CosmeticRenderers';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { GetKobansModal } from '@/components/koban/GetKobansModal';
import { PageMeta } from '@/components/ui/PageMeta';
import {
  fetchStoreItems,
  getEffectivePriceInfo,
  type StoreItemDoc,
} from '@/services/storePricingService';
import type { CartCheckoutResult } from '@/services/kobanService';
import {
  StoreCard,
  StoreCardSkeleton,
  RARITY_ACCENT,
  CATEGORY_SHORT_LABEL,
} from '@/components/store/StoreCard';
import {
  FilterSheet,
  type StoreFilterState,
} from '@/components/store/FilterSheet';
import { CartDrawer } from '@/components/store/CartDrawer';

type StoreTab =
  | 'all'
  | 'banner'
  | 'avatar'
  | 'frame'
  | 'effect'
  | 'nameplate'
  | 'collection';

type MainStoreView = 'cosmetics' | 'membership';

export type EnrichedCosmeticItem = CosmeticItem & {
  price: number;
  originalPrice: number;
  isOnSale: boolean;
};

const RARITY_RANK: Record<CosmeticRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

const LOADOUT_VISITED_KEY = 'boardly_store_loadout_visited';

export interface StorePageProps {
  defaultOpenGetKobans?: boolean;
}

export const StorePage: React.FC<StorePageProps> = ({
  defaultOpenGetKobans = false,
}) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const {
    balance,
    owned,
    equipped,
    loading: walletLoading,
    isSuperAdmin,
    equipCosmetic,
    equipMultipleCosmetics,
    purchaseCosmetic,
    purchaseCosmeticBatch,
  } = useWallet();

  const {
    cartIds,
    removeFromCart,
    toggleCartItem,
    addMultipleToCart,
    clearCart,
    isInCart,
    cartPulseTick,
  } = useStoreCart({
    uid: user?.uid,
    owned,
  });

  const [mainView, setMainView] = useState<MainStoreView>('cosmetics');
  const [activeTab, setActiveTab] = useState<StoreTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collapsible Active Loadout card: expanded on first visit, collapsed on subsequent visits
  const [loadoutExpanded, setLoadoutExpanded] = useState<boolean>(() => {
    try {
      const visited = window.localStorage.getItem(LOADOUT_VISITED_KEY);
      if (!visited) {
        window.localStorage.setItem(LOADOUT_VISITED_KEY, '1');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Preview overrides for live try-on
  const [previewSlot, setPreviewSlot] = useState<{
    effect?: string | null;
    frame?: string | null;
    nameplate?: string | null;
    avatar?: string | null;
    banner?: string | null;
  }>({});

  // Detail modal state + swipe tracking
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Instant single-purchase state
  const [confirmBuyItem, setConfirmBuyItem] =
    useState<EnrichedCosmeticItem | null>(null);
  const [purchasingSingle, setPurchasingSingle] = useState(false);

  // Multi-select mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Cart drawer & atomic batch checkout state
  const [cartOpen, setCartOpen] = useState(false);
  const [cartProcessing, setCartProcessing] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [flaggedItemsNotice, setFlaggedItemsNotice] = useState<
    Array<{ id: string; name: string; reason: 'already_owned' | 'unavailable' }>
  >([]);
  const [completedOrder, setCompletedOrder] = useState<CartCheckoutResult | null>(
    null
  );
  const [equippingOrder, setEquippingOrder] = useState(false);
  const checkoutKeyRef = useRef<string>('');
  const [cartPillBounce, setCartPillBounce] = useState(false);

  // Modals & notifications
  const [getKobansOpen, setGetKobansOpen] = useState(defaultOpenGetKobans);
  const [getKobansInitialAmount, setGetKobansInitialAmount] = useState<
    number | undefined
  >(undefined);
  const [coinBurstActive, setCoinBurstActive] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const triggerCoinBurst = useCallback(() => {
    setCoinBurstActive(false);
    window.setTimeout(() => setCoinBurstActive(true), 20);
  }, []);

  // Live Firestore store price overrides
  const [storeItemDocs, setStoreItemDocs] = useState<StoreItemDoc[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    fetchStoreItems()
      .then((docs) => {
        if (active) setStoreItemDocs(docs);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (defaultOpenGetKobans) {
      setGetKobansOpen(true);
    }
  }, [defaultOpenGetKobans]);

  // Animate cart pill whenever an item is added
  useEffect(() => {
    if (cartPulseTick === 0) return;
    setCartPillBounce(true);
    const t = window.setTimeout(() => setCartPillBounce(false), 500);
    return () => window.clearTimeout(t);
  }, [cartPulseTick]);

  const liveCatalog: EnrichedCosmeticItem[] = useMemo(() => {
    const docMap = new Map(storeItemDocs.map((d) => [d.id, d]));
    return COSMETICS_CATALOG.filter((item) => {
      const override = docMap.get(item.id);
      if (override && !isSuperAdmin && override.active === false) {
        return false;
      }
      return item.isActive !== false || isSuperAdmin;
    }).map((item) => {
      const override = docMap.get(item.id);
      const { effectivePrice, originalPrice, isOnSale } = getEffectivePriceInfo(
        override
          ? {
              priceKobans: override.priceKobans,
              salePriceKobans: override.salePriceKobans,
              saleEndsAt: override.saleEndsAt,
            }
          : {
              priceKobans: item.priceKobans,
              salePriceKobans: item.salePriceKobans,
              saleEndsAt: item.saleEndsAt,
            }
      );
      return {
        ...item,
        priceKobans: effectivePrice,
        price: effectivePrice,
        originalPrice,
        isOnSale,
      };
    });
  }, [storeItemDocs, isSuperAdmin]);

  const priceCeiling = useMemo(() => {
    const maxInCatalog = liveCatalog.reduce(
      (max, item) => Math.max(max, item.price),
      1500
    );
    return Math.max(500, maxInCatalog);
  }, [liveCatalog]);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<StoreFilterState>({
    rarity: 'all',
    ownership: 'all',
    maxPrice: 5000,
    animatedOnly: false,
    sortBy: 'featured',
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      maxPrice:
        prev.maxPrice === 5000 || prev.maxPrice > priceCeiling
          ? priceCeiling
          : prev.maxPrice,
    }));
  }, [priceCeiling]);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const displayName =
    userProfile?.displayName || user?.displayName || 'Hashir Ktk';
  const photoURL = userProfile?.photoURL || user?.photoURL || null;

  // Resolved items in the cart (preserving insertion order)
  const cartItems = useMemo(() => {
    const catalogMap = new Map(liveCatalog.map((item) => [item.id, item]));
    return cartIds
      .map((id) => catalogMap.get(id))
      .filter(
        (item): item is (typeof liveCatalog)[number] =>
          Boolean(item) && (isSuperAdmin || !owned.includes(item!.id))
      );
  }, [cartIds, liveCatalog, owned, isSuperAdmin]);

  const cartTotalKobans = useMemo(
    () =>
      isSuperAdmin
        ? 0
        : cartItems.reduce((sum, item) => sum + Math.max(0, item.price), 0),
    [cartItems, isSuperAdmin]
  );

  // Count of active filters (excluding defaults)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.rarity !== 'all') count++;
    if (filters.ownership !== 'all') count++;
    if (filters.maxPrice < priceCeiling) count++;
    if (filters.animatedOnly) count++;
    if (filters.sortBy !== 'featured') count++;
    return count;
  }, [filters, priceCeiling]);

  const resetAllFilters = useCallback(() => {
    setFilters({
      rarity: 'all',
      ownership: 'all',
      maxPrice: priceCeiling,
      animatedOnly: false,
      sortBy: 'featured',
    });
    setSearchQuery('');
  }, [priceCeiling]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let list = [...liveCatalog];

    if (activeTab === 'collection') {
      list = isSuperAdmin
        ? list
        : list.filter((item) => owned.includes(item.id));
    } else if (activeTab !== 'all') {
      list = list.filter((item) => item.type === activeTab);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          CATEGORY_SHORT_LABEL[item.type].toLowerCase().includes(q) ||
          item.rarity.toLowerCase().includes(q)
      );
    }

    if (filters.rarity !== 'all') {
      list = list.filter((item) => item.rarity === filters.rarity);
    }

    if (filters.ownership === 'owned') {
      list = isSuperAdmin
        ? list
        : list.filter((item) => owned.includes(item.id));
    } else if (filters.ownership === 'unowned') {
      list = list.filter((item) => !owned.includes(item.id));
    }

    if (filters.maxPrice < priceCeiling) {
      list = list.filter((item) => item.price <= filters.maxPrice);
    }

    if (filters.animatedOnly) {
      list = list.filter((item) => item.animated !== false);
    }

    if (filters.sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'rarity_desc') {
      list.sort(
        (a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.price - a.price
      );
    } else if (filters.sortBy === 'newest') {
      list.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    } else {
      // Featured: New items first, then Mythic/Legendary
      list.sort(
        (a, b) =>
          Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) ||
          RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]
      );
    }

    return list;
  }, [
    liveCatalog,
    activeTab,
    searchQuery,
    filters,
    owned,
    isSuperAdmin,
    priceCeiling,
  ]);

  // Active item in the detail sheet + prev/next navigation
  const detailIndex = useMemo(() => {
    if (!detailItemId) return -1;
    return filteredItems.findIndex((i) => i.id === detailItemId);
  }, [detailItemId, filteredItems]);

  const detailItem = useMemo(() => {
    if (!detailItemId) return null;
    if (detailIndex >= 0) return filteredItems[detailIndex];
    return liveCatalog.find((i) => i.id === detailItemId) || null;
  }, [detailItemId, detailIndex, filteredItems, liveCatalog]);

  const handleNavigateDetail = useCallback(
    (direction: 'prev' | 'next') => {
      if (filteredItems.length <= 1 || detailIndex < 0) return;
      const nextIndex =
        direction === 'next'
          ? (detailIndex + 1) % filteredItems.length
          : (detailIndex - 1 + filteredItems.length) % filteredItems.length;
      setDetailItemId(filteredItems[nextIndex].id);
    },
    [filteredItems, detailIndex]
  );

  // Keyboard left/right navigation when detail sheet is open
  useEffect(() => {
    if (!detailItemId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleNavigateDetail('prev');
      if (e.key === 'ArrowRight') handleNavigateDetail('next');
      if (e.key === 'Escape') setDetailItemId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailItemId, handleNavigateDetail]);

  const activeEffect =
    previewSlot.effect !== undefined ? previewSlot.effect : equipped.effect;
  const activeFrame =
    previewSlot.frame !== undefined ? previewSlot.frame : equipped.frame;
  const activeNameplate =
    previewSlot.nameplate !== undefined
      ? previewSlot.nameplate
      : equipped.nameplate;
  const activeAvatar =
    previewSlot.avatar !== undefined ? previewSlot.avatar : equipped.avatar;
  const activeBanner =
    previewSlot.banner !== undefined ? previewSlot.banner : equipped.banner;

  const isPreviewingAny = Object.keys(previewSlot).length > 0;

  const isItemOwned = useCallback(
    (id: string) => isSuperAdmin || owned.includes(id),
    [isSuperAdmin, owned]
  );

  const isItemEquipped = useCallback(
    (item: CosmeticItem) => equipped[item.type] === item.id,
    [equipped]
  );

  const handleEquipToggle = async (item: CosmeticItem) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const currentlyEquipped = equipped[item.type] === item.id;
      const nextValue = currentlyEquipped ? null : item.id;
      await equipCosmetic(item.type, nextValue);
      setPreviewSlot((prev) => {
        const copy = { ...prev };
        delete copy[item.type];
        return copy;
      });
      showToast(
        'success',
        currentlyEquipped
          ? `Unequipped ${item.name}`
          : `Equipped ${item.name}!`
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update equipped cosmetic');
    }
  };

  // Single-item instant purchase handler
  const handleConfirmSinglePurchase = async () => {
    if (!confirmBuyItem) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setPurchasingSingle(true);
    try {
      await purchaseCosmetic(confirmBuyItem);
      removeFromCart(confirmBuyItem.id);
      triggerCoinBurst();
      await equipCosmetic(confirmBuyItem.type, confirmBuyItem.id);
      showToast(
        'success',
        `Unlocked & equipped ${confirmBuyItem.name}!`
      );
      setConfirmBuyItem(null);
      setDetailItemId(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Purchase failed');
    } finally {
      setPurchasingSingle(false);
    }
  };

  // Multi-select handlers
  const handleToggleSelectCard = useCallback((itemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleEnterSelectionMode = useCallback((itemId: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
  }, []);

  const selectedItemsTotalKobans = useMemo(() => {
    const catalogMap = new Map(liveCatalog.map((i) => [i.id, i]));
    return selectedIds.reduce((sum, id) => {
      const item = catalogMap.get(id);
      return sum + (item ? item.price : 0);
    }, 0);
  }, [selectedIds, liveCatalog]);

  const handleAddSelectedToCart = () => {
    if (selectedIds.length === 0) return;
    const addedCount = addMultipleToCart(selectedIds);
    setSelectionMode(false);
    setSelectedIds([]);
    showToast(
      'success',
      addedCount > 0
        ? `Added ${addedCount} ${addedCount === 1 ? 'item' : 'items'} to your cart`
        : 'Selected items are already in your cart'
    );
  };

  // Cart drawer & atomic batch checkout handlers
  const handleOpenCart = () => {
    setCartError(null);
    setFlaggedItemsNotice([]);
    setCompletedOrder(null);
    checkoutKeyRef.current = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    setCartOpen(true);
  };

  const handleCartCheckout = async () => {
    if (!user) {
      setCartOpen(false);
      navigate('/login');
      return;
    }
    if (cartItems.length === 0 || cartProcessing) return;

    if (!checkoutKeyRef.current) {
      checkoutKeyRef.current = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    }

    setCartProcessing(true);
    setCartError(null);
    setFlaggedItemsNotice([]);

    try {
      const result = await purchaseCosmeticBatch(
        cartItems,
        checkoutKeyRef.current
      );

      // If any items became owned or unavailable since being added, remove them and notify the user
      if (result.flaggedItems.length > 0) {
        for (const flagged of result.flaggedItems) {
          removeFromCart(flagged.id);
        }
        setFlaggedItemsNotice(result.flaggedItems);
        // Generate a fresh idempotency key for the updated cart
        checkoutKeyRef.current = `${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        return;
      }

      // Success! Clear cart, fire coin burst animation, and show confirmation view
      clearCart();
      triggerCoinBurst();
      setCompletedOrder(result);
    } catch (err: any) {
      setCartError(
        err?.message || 'Checkout could not be completed. No Kobans were deducted.'
      );
    } finally {
      setCartProcessing(false);
    }
  };

  const handleEquipPurchasedOrder = async () => {
    if (!completedOrder || completedOrder.purchasedItems.length === 0) return;
    setEquippingOrder(true);
    try {
      // If 2+ items share a category, the newest (last in list) wins
      const slotUpdates: Partial<
        Record<'effect' | 'frame' | 'nameplate' | 'avatar' | 'banner', string | null>
      > = {};
      for (const entry of completedOrder.purchasedItems) {
        slotUpdates[entry.type] = entry.id;
      }
      await equipMultipleCosmetics(slotUpdates);
      showToast('success', 'Equipped your new cosmetics!');
      setCompletedOrder(null);
      setCartOpen(false);
    } catch (err: any) {
      showToast('error', err?.message || 'Could not equip items');
    } finally {
      setEquippingOrder(false);
    }
  };

  const handleViewCollectionAfterOrder = () => {
    setCompletedOrder(null);
    setCartOpen(false);
    setActiveTab('collection');
  };

  const handleTryOnFromSheet = (item: CosmeticItem) => {
    setPreviewSlot((prev) => ({
      ...prev,
      [item.type]: prev[item.type] === item.id ? undefined : item.id,
    }));
    setLoadoutExpanded(true);
    setDetailItemId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs: { id: StoreTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Items', count: liveCatalog.length },
    {
      id: 'banner',
      label: 'Banners',
      count: liveCatalog.filter((i) => i.type === 'banner').length,
    },
    {
      id: 'avatar',
      label: 'Profile Pictures',
      count: liveCatalog.filter((i) => i.type === 'avatar').length,
    },
    {
      id: 'frame',
      label: 'Avatar Frames',
      count: liveCatalog.filter((i) => i.type === 'frame').length,
    },
    {
      id: 'effect',
      label: 'Profile Effects',
      count: liveCatalog.filter((i) => i.type === 'effect').length,
    },
    {
      id: 'nameplate',
      label: 'Nameplates',
      count: liveCatalog.filter((i) => i.type === 'nameplate').length,
    },
    {
      id: 'collection',
      label: 'My Collection',
      count: isSuperAdmin ? liveCatalog.length : owned.length,
    },
  ];

  const isLoadingGrid = catalogLoading || (Boolean(user) && walletLoading);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-[calc(128px+env(safe-area-inset-bottom,0px))]">
      <PageMeta
        title="Boardly Store — Animated Banners, Avatars, Frames, Profile Effects & Nameplates"
        description="Customize your Boardly identity with animated profile banners, avatar pictures, frames, profile effects, and nameplates using Kobans."
        canonicalPath="/store"
      />
      <CoinBurstEffect
        active={coinBurstActive}
        onComplete={() => setCoinBurstActive(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[220] px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-lg flex items-center gap-2.5 text-xs sm:text-sm font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/85 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/85 border-[#E11D2A]/50 text-red-200'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Sticky Top Store Header */}
      <header className="sticky top-0 z-30 glass-header border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#E11D2A] shrink-0" />
                <h1 className="text-sm sm:text-lg font-black tracking-tight truncate">
                  Boardly Store
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden sm:block truncate">
                Animated cosmetics · Multi-buy cart · Instant unlock
              </p>
            </div>
          </div>

          {/* Right Header Controls: SuperAdmin badge, Live Wallet Balance + "+", Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isSuperAdmin && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[11px] font-black">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SUPER ADMIN</span>
              </div>
            )}

            {/* Live Koban Wallet Balance with "+" button */}
            <div className="h-9 pl-2.5 pr-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center gap-1.5">
              <KobanIcon size={16} />
              <span className="text-xs sm:text-sm font-black tabular-nums text-[var(--text-primary)]">
                {walletLoading ? '…' : balance.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => {
                  setGetKobansInitialAmount(undefined);
                  setGetKobansOpen(true);
                }}
                aria-label="Get more Kobans"
                title="Get Kobans"
                className="w-7 h-7 rounded-lg bg-[#E11D2A] hover:bg-[#c81824] text-white flex items-center justify-center transition-colors ml-0.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
        {/* Top Store Mode Switcher: Cosmetics vs Membership */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setMainView('cosmetics')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all ${
                mainView === 'cosmetics'
                  ? 'bg-[#E11D2A] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cosmetics ({liveCatalog.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMainView('membership')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all ${
                mainView === 'membership'
                  ? 'bg-gradient-to-r from-[#E11D2A] to-amber-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Boardly Pro</span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-[var(--text-muted)] hidden sm:block">
            10 Kobans = PKR 1 · Instant delivery
          </div>
        </div>

        {mainView === 'membership' ? (
          /* Boardly Pro Membership View */
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-8 space-y-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-black uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5" />
                <span>Boardly Pro Scholar Pass</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight">
                Unlock Unlimited Mock Tests, Analytics &amp; Exclusive Perks
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Upgrade your preparation with full access to entry test banks, timed simulations, and priority verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                      Monthly Pass
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border)]">
                      30 Days
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black">PKR 500</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      (5,000 Kobans)
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Unlimited MDCAT, NET, ECAT &amp; FSc full-length mocks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Detailed topic accuracy breakdown</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Pro Scholar badge across Commons &amp; leaderboards</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    setGetKobansInitialAmount(5000);
                    setGetKobansOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white font-black text-xs sm:text-sm transition-colors"
                >
                  Get Monthly Pass — PKR 500
                </button>
              </div>

              <div className="rounded-2xl border-2 border-amber-500/50 bg-[var(--bg-elevated)] p-5 flex flex-col justify-between gap-5 relative">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                      Annual Pass · Best Value
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      Save 25%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black">PKR 4,500</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      (45,000 Kobans)
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Everything in Monthly Pass for 365 days</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Priority support &amp; exam session archives</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Golden Pro Scholar crown badge</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    setGetKobansInitialAmount(45000);
                    setGetKobansOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E11D2A] to-amber-500 text-white font-black text-xs sm:text-sm transition-opacity hover:opacity-95"
                >
                  Get Annual Pass — PKR 4,500
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Compact Collapsible Active Loadout Card */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden transition-all">
              {/* Compact Header Row */}
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setLoadoutExpanded((prev) => !prev)}
                  className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#E11D2A]/15 border border-[#E11D2A]/30 flex items-center justify-center text-[#E11D2A] shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                        {isPreviewingAny ? 'Live Try-On Preview' : 'Active Loadout'}
                      </span>
                      {isPreviewingAny && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          Previewing
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {(
                        [
                          activeBanner && getCosmeticById(activeBanner)?.name,
                          activeAvatar && getCosmeticById(activeAvatar)?.name,
                          activeFrame && getCosmeticById(activeFrame)?.name,
                          activeEffect && getCosmeticById(activeEffect)?.name,
                          activeNameplate && getCosmeticById(activeNameplate)?.name,
                        ].filter(Boolean) as string[]
                      ).join(' · ') || 'Default profile styling — tap to expand'}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isPreviewingAny && (
                    <button
                      type="button"
                      onClick={() => setPreviewSlot({})}
                      className="h-7 px-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLoadoutExpanded((prev) => !prev)}
                    aria-label={
                      loadoutExpanded
                        ? 'Collapse Active Loadout'
                        : 'Expand Active Loadout'
                    }
                    className="h-7 px-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-secondary)] inline-flex items-center gap-1"
                  >
                    <span>{loadoutExpanded ? 'Hide' : 'Preview'}</span>
                    {loadoutExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Live Loadout Stage */}
              {loadoutExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-[var(--border)] space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                    <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0F] dark-surface-preserve min-h-[168px] flex flex-col justify-between">
                      <div className="relative h-24 sm:h-28 w-full overflow-hidden">
                        <BannerRenderer
                          bannerId={activeBanner}
                          animated={true}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent" />
                      </div>
                      <div className="relative z-10 px-4 pb-3 -mt-9 flex flex-col sm:flex-row items-center sm:items-end gap-3">
                        {activeAvatar ? (
                          <div className="relative">
                            <AvatarPicture
                              avatarId={activeAvatar}
                              size={68}
                              animated={true}
                            />
                          </div>
                        ) : (
                          <AvatarFrame
                            frameId={activeFrame || undefined}
                            size={68}
                            animated={true}
                          >
                            {photoURL ? (
                              <img
                                src={photoURL}
                                alt={displayName}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-sm font-black text-white">
                                {(displayName || 'S')[0]?.toUpperCase()}
                              </div>
                            )}
                          </AvatarFrame>
                        )}
                        <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span
                              className="text-sm font-black text-white truncate"
                              style={{
                                color: '#FFFFFF',
                                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                              }}
                            >
                              {displayName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E11D2A]/25 text-red-300 border border-[#E11D2A]/40">
                              Scholar
                            </span>
                          </div>
                          <Nameplate
                            nameplateId={activeNameplate || undefined}
                            displayName={displayName}
                            animated={true}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      <ProfileEffectCardPreview
                        effectId={activeEffect || ''}
                        displayName={displayName}
                        animated={true}
                        className="h-full min-h-[168px]"
                      />
                    </div>
                  </div>

                  {/* Compact slot pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px]">
                    {(
                      [
                        { key: 'banner', label: 'Banner', val: activeBanner },
                        { key: 'avatar', label: 'Avatar', val: activeAvatar },
                        { key: 'frame', label: 'Frame', val: activeFrame },
                        { key: 'effect', label: 'Effect', val: activeEffect },
                        { key: 'nameplate', label: 'Nameplate', val: activeNameplate },
                      ] as const
                    ).map((slot) => {
                      const itemObj = slot.val ? getCosmeticById(slot.val) : null;
                      return (
                        <div
                          key={slot.key}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between gap-1.5"
                        >
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">
                              {slot.label}
                            </span>
                            <span className="font-bold truncate block text-[var(--text-primary)]">
                              {itemObj ? itemObj.name : 'None'}
                            </span>
                          </div>
                          {slot.val && equipped[slot.key] === slot.val && (
                            <button
                              type="button"
                              onClick={() => equipCosmetic(slot.key, null)}
                              className="text-[10px] font-bold text-red-400 hover:text-red-300 shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Search Bar + Filter & Select Controls Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search banners, avatars, frames, effects, nameplates…"
                  aria-label="Search store items by name"
                  className="w-full h-10 pl-10 pr-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#E11D2A]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-muted)] absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters button (with active count) + Clear all chip + Select button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(true)}
                  className={`h-10 px-3.5 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition-all ${
                    activeFilterCount > 0
                      ? 'bg-[#E11D2A]/10 border-[#E11D2A]/50 text-[#E11D2A]'
                      : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#E11D2A] text-white text-[10px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {(activeFilterCount > 0 || searchQuery.trim().length > 0) && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="h-10 px-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode((prev) => {
                      if (prev) setSelectedIds([]);
                      return !prev;
                    });
                  }}
                  className={`h-10 px-3.5 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition-all ${
                    selectionMode
                      ? 'bg-[#E11D2A] border-[#E11D2A] text-white'
                      : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{selectionMode ? 'Cancel Select' : 'Select'}</span>
                </button>
              </div>
            </div>

            {/* Sticky Horizontally Scrollable Category Chips with Fade Edges */}
            <div className="sticky top-14 sm:top-16 z-20 -mx-3 sm:mx-0 px-3 sm:px-0 py-2 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border)]">
              <div className="relative">
                {/* Left fade edge */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10 sm:hidden" />
                {/* Right fade edge */}
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10 sm:hidden" />

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pr-4">
                  {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                          active
                            ? 'bg-[#E11D2A] text-white border-[#E11D2A] shadow-sm'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Store Grid: Skeleton Loading, Empty State, or 2-Column Mobile / 4-Column Desktop Cards */}
            {isLoadingGrid ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <StoreCardSkeleton key={idx} />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                    {activeTab === 'collection'
                      ? 'Your collection has no matching items yet'
                      : 'No cosmetics match your current filters'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                    {activeTab === 'collection'
                      ? 'Unlock animated banners, avatars, frames, profile effects, or nameplates to see them here.'
                      : 'Try clearing your search or relaxing your price and rarity filters.'}
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-center gap-2">
                  {(activeFilterCount > 0 || searchQuery.trim().length > 0) && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="px-4 py-2.5 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear filters</span>
                    </button>
                  )}
                  {activeTab === 'collection' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-extrabold text-[var(--text-primary)]"
                    >
                      Browse All Items
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredItems.map((item) => {
                  const itemOwned = isItemOwned(item.id);
                  const itemEquipped = isItemEquipped(item);
                  const itemInCart = isInCart(item.id);
                  const itemSelected = selectedIds.includes(item.id);

                  return (
                    <StoreCard
                      key={item.id}
                      item={item}
                      userDisplayName={displayName}
                      userPhotoURL={photoURL}
                      isOwned={itemOwned}
                      isEquipped={itemEquipped}
                      isInCart={itemInCart}
                      selectionMode={selectionMode}
                      isSelected={itemSelected}
                      onOpenDetail={(clicked) => setDetailItemId(clicked.id)}
                      onToggleCart={(clicked) => {
                        const res = toggleCartItem(clicked.id);
                        if (res === 'added') {
                          showToast('success', `Added ${clicked.name} to cart`);
                        }
                      }}
                      onBuyNow={() => {
                        if (isInCart(item.id)) {
                          handleOpenCart();
                        } else {
                          setConfirmBuyItem(item);
                        }
                      }}
                      onEquipToggle={(clicked) => handleEquipToggle(clicked)}
                      onToggleSelect={handleToggleSelectCard}
                      onEnterSelectionMode={handleEnterSelectionMode}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky Multi-Select Bar (above floating bottom nav) */}
      {selectionMode && (
        <div className="fixed inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg bottom-[calc(86px+env(safe-area-inset-bottom,0px))] z-40 rounded-2xl bg-[var(--bg-card)]/95 backdrop-blur-lg border border-[#E11D2A]/50 shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-[var(--text-primary)] truncate">
              {selectedIds.length} selected ·{' '}
              <span className="text-[#E11D2A] tabular-nums">
                {selectedItemsTotalKobans.toLocaleString()} Kobans
              </span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              Tap cards to toggle selection
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds([]);
              }}
              className="h-9 px-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleAddSelectedToCart}
              className="h-9 px-3.5 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs font-black shadow-sm transition-all disabled:opacity-50"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* Floating Cart Pill (bottom-right, above floating nav; hidden when cart is empty) */}
      {cartItems.length > 0 && !selectionMode && (
        <button
          type="button"
          onClick={handleOpenCart}
          aria-label={`Open cart with ${cartItems.length} items`}
          className={`fixed right-4 sm:right-6 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-40 h-12 px-4 rounded-full bg-[#E11D2A] hover:bg-[#c81824] text-white shadow-xl border border-white/20 flex items-center gap-2 text-xs sm:text-sm font-black transition-all active:scale-95 ${
            cartPillBounce ? 'scale-110 ring-4 ring-[#E11D2A]/40' : ''
          }`}
        >
          <span role="img" aria-hidden="true" className="text-base leading-none">
            🛒
          </span>
          <span className="tabular-nums">{cartItems.length}</span>
          <span className="opacity-60">·</span>
          <KobanIcon size={15} />
          <span className="tabular-nums">
            {cartTotalKobans.toLocaleString()}
          </span>
        </button>
      )}

      {/* Item Detail Bottom Sheet / Modal (with full name, rarity & category, Add to cart + Buy, Preview on my profile, and left/right swipe & arrow navigation) */}
      {detailItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-fullscreen-modal="true"
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setDetailItemId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0]?.clientX ?? null;
                touchStartYRef.current = e.touches[0]?.clientY ?? null;
              }}
              onTouchEnd={(e) => {
                if (
                  touchStartXRef.current === null ||
                  touchStartYRef.current === null
                ) {
                  return;
                }
                const dx =
                  (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
                const dy =
                  (e.changedTouches[0]?.clientY ?? 0) - touchStartYRef.current;
                touchStartXRef.current = null;
                touchStartYRef.current = null;
                if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                  if (dx < 0) {
                    handleNavigateDetail('next');
                  } else {
                    handleNavigateDetail('prev');
                  }
                }
              }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--bg-card)] border-t sm:border border-[var(--border)] shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
            >
              {/* Mobile drag handle */}
              <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
                <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
              </div>

              {/* Detail Sheet Top Bar with Prev/Next Arrows & Close */}
              <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={filteredItems.length <= 1}
                    onClick={() => handleNavigateDetail('prev')}
                    aria-label="Previous item"
                    className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={filteredItems.length <= 1}
                    onClick={() => handleNavigateDetail('next')}
                    aria-label="Next item"
                    className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {detailIndex >= 0 && (
                    <span className="text-[11px] font-bold text-[var(--text-muted)] ml-1 tabular-nums">
                      {detailIndex + 1} / {filteredItems.length}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDetailItemId(null)}
                  aria-label="Close item details"
                  className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Dark Preview Stage */}
                <div className="relative h-52 sm:h-56 bg-[#090A0F] dark-surface-preserve flex items-center justify-center p-5 border-b border-white/10">
                  {detailItem.type === 'banner' ? (
                    <div className="w-full max-w-sm aspect-[16/9] rounded-2xl overflow-hidden relative border border-white/15 shadow-lg">
                      <BannerRenderer
                        bannerId={detailItem.id}
                        animated={detailItem.animated !== false}
                        className="w-full h-full"
                      />
                      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 pointer-events-none">
                        <div className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/20 flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#E11D2A] text-[10px] font-black text-white flex items-center justify-center">
                            {(displayName || 'S')[0]?.toUpperCase()}
                          </div>
                          <span
                            className="text-xs font-extrabold text-white"
                            style={{
                              color: '#FFFFFF',
                              textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                            }}
                          >
                            {displayName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : detailItem.type === 'avatar' ? (
                    <AvatarPicture
                      avatarId={detailItem.id}
                      size={118}
                      animated={detailItem.animated !== false}
                    />
                  ) : detailItem.type === 'frame' ? (
                    <AvatarFrame
                      frameId={detailItem.id}
                      size={104}
                      animated={detailItem.animated !== false}
                    >
                      {photoURL ? (
                        <img
                          src={photoURL}
                          alt={displayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-lg font-black text-white">
                          {(displayName || 'S')[0]?.toUpperCase()}
                        </div>
                      )}
                    </AvatarFrame>
                  ) : detailItem.type === 'effect' ? (
                    <div className="w-full max-w-xs aspect-[4/3] rounded-2xl overflow-hidden">
                      <ProfileEffectCardPreview
                        effectId={detailItem.id}
                        displayName={displayName}
                        animated={detailItem.animated !== false}
                        className="w-full h-full !h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-xs flex flex-col items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white"
                        style={{
                          color: '#FFFFFF',
                          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        }}
                      >
                        {displayName}
                      </span>
                      <Nameplate
                        nameplateId={detailItem.id}
                        displayName={displayName}
                        animated={detailItem.animated !== false}
                        allowWrap="full"
                      />
                    </div>
                  )}
                </div>

                {/* Full Item Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {(() => {
                        const r =
                          RARITY_ACCENT[detailItem.rarity] ||
                          RARITY_ACCENT.common;
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${r.badgeBg} ${r.badgeText} ${r.badgeBorder}`}
                          >
                            {r.label} Rarity
                          </span>
                        );
                      })()}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {CATEGORY_SHORT_LABEL[detailItem.type]}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-500 inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Animated</span>
                      </span>
                    </div>

                    {/* Full untruncated item name */}
                    <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] leading-snug">
                      {detailItem.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {detailItem.description}
                    </p>
                  </div>

                  {/* Price & PKR breakdown */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      Unlock Price
                    </span>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 font-black text-base tabular-nums text-[var(--text-primary)]">
                        <KobanIcon size={17} />
                        <span>{detailItem.price.toLocaleString()} Kobans</span>
                      </div>
                      <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                        PKR {(detailItem.price / 10).toLocaleString()} · 10 Kobans = PKR 1
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Preview on my profile + (Add to cart & Buy for X Kobans) */}
                  <div className="space-y-2.5 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
                    <button
                      type="button"
                      onClick={() => handleTryOnFromSheet(detailItem)}
                      className="w-full h-10 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-extrabold text-[var(--text-primary)] inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-[#E11D2A]" />
                      <span>Preview on my profile</span>
                    </button>

                    {isItemOwned(detailItem.id) ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleEquipToggle(detailItem);
                          setDetailItemId(null);
                        }}
                        className="w-full h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {isItemEquipped(detailItem)
                            ? 'Unequip Item'
                            : 'Equip Now'}
                        </span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const action = toggleCartItem(detailItem.id);
                            showToast(
                              'success',
                              action === 'added'
                                ? `Added ${detailItem.name} to cart`
                                : `Removed ${detailItem.name} from cart`
                            );
                          }}
                          className={`h-11 px-3 rounded-xl text-xs sm:text-sm font-extrabold border inline-flex items-center justify-center gap-1.5 transition-all ${
                            isInCart(detailItem.id)
                              ? 'bg-[#E11D2A]/15 border-[#E11D2A]/50 text-[#E11D2A]'
                              : 'bg-[var(--bg-elevated)] hover:bg-[var(--border)] border-[var(--border)] text-[var(--text-primary)]'
                          }`}
                        >
                          {isInCart(detailItem.id) ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>In cart</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Add to cart</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setConfirmBuyItem(detailItem);
                          }}
                          className="h-11 px-3 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <KobanIcon size={15} />
                          <span>
                            Buy for {detailItem.price.toLocaleString()} Kobans
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Single-Item Instant Purchase Confirmation Modal */}
      {confirmBuyItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-fullscreen-modal="true"
            className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => {
              if (!purchasingSingle) setConfirmBuyItem(null);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl overflow-hidden p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  Confirm Instant Unlock
                </h3>
                <button
                  type="button"
                  disabled={purchasingSingle}
                  onClick={() => setConfirmBuyItem(null)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-semibold">
                    Item
                  </span>
                  <span className="font-extrabold text-[var(--text-primary)]">
                    {confirmBuyItem.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-semibold">
                    Price
                  </span>
                  <span className="inline-flex items-center gap-1 font-black tabular-nums text-[var(--text-primary)]">
                    <KobanIcon size={14} />
                    {isSuperAdmin ? 0 : confirmBuyItem.price.toLocaleString()} Kobans
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] font-semibold">
                    Your Balance
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold tabular-nums text-[var(--text-primary)]">
                    <KobanIcon size={13} />
                    {balance.toLocaleString()} Kobans
                  </span>
                </div>
              </div>

              {!isSuperAdmin && balance < confirmBuyItem.price ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#E11D2A]">
                    You need {(confirmBuyItem.price - balance).toLocaleString()} more Kobans to unlock this item.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const deficit = Math.max(
                        500,
                        confirmBuyItem.price - balance
                      );
                      setConfirmBuyItem(null);
                      setGetKobansInitialAmount(deficit);
                      setGetKobansOpen(true);
                    }}
                    className="w-full h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2"
                  >
                    <KobanIcon size={15} />
                    <span>Get more Kobans</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    disabled={purchasingSingle}
                    onClick={() => setConfirmBuyItem(null)}
                    className="flex-1 h-11 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={purchasingSingle}
                    onClick={handleConfirmSinglePurchase}
                    className="flex-1 h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <KobanIcon size={15} />
                    <span>
                      {purchasingSingle
                        ? 'Unlocking…'
                        : `Buy for ${(isSuperAdmin ? 0 : confirmBuyItem.price).toLocaleString()}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Filter Bottom Sheet */}
      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        priceCeiling={priceCeiling}
        resultCount={filteredItems.length}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={resetAllFilters}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        balance={balance}
        isSuperAdmin={isSuperAdmin}
        userDisplayName={displayName}
        userPhotoURL={photoURL}
        processing={cartProcessing}
        errorMessage={cartError}
        flaggedItemsNotice={flaggedItemsNotice}
        completedOrder={completedOrder}
        equippingOrder={equippingOrder}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={handleCartCheckout}
        onOpenGetKobans={() => {
          const deficit = Math.max(500, cartTotalKobans - balance);
          setCartOpen(false);
          setGetKobansInitialAmount(deficit);
          setGetKobansOpen(true);
        }}
        onEquipPurchased={handleEquipPurchasedOrder}
        onViewCollection={handleViewCollectionAfterOrder}
      />

      {/* Get Kobans Modal */}
      <GetKobansModal
        isOpen={getKobansOpen}
        onClose={() => setGetKobansOpen(false)}
        initialAmount={getKobansInitialAmount}
      />
    </div>
  );
};

export default StorePage;
