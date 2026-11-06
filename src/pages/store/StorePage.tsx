import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { PageMeta } from '@/components/ui/PageMeta';
import { KobanIcon } from '@/components/koban/KobanIcon';
import {
  COSMETICS_CATALOG,
  KOBAN_TO_PKR_RATE,
  kobansToPkr,
  type CosmeticItem,
} from '@/data/cosmeticsCatalog';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  CosmeticEffect,
  ProfileEffectCardPreview,
  ProfileCardEffect,
} from '@/components/koban/CosmeticRenderers';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { GetKobansModal } from '@/components/koban/GetKobansModal';
import { CoinBurstEffect } from '@/components/koban/CoinBurstEffect';
import {
  fetchStoreItems,
  verifyStoreAdminRoleServerSide,
  verifyItemPriceAtPurchase,
  updateSingleItemPricing,
  previewBulkPriceChanges,
  executeBulkPriceChanges,
  validateKobanPriceInput,
  getEffectivePriceInfo,
  DEFAULT_RARITY_PRICES,
  type StoreItemDoc,
  type BulkAdjustmentMode,
  type RarityPriceMap,
} from '@/services/storePricingService';
import {
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  Shield,
  Eye,
  EyeOff,
  Tag,
  Layers,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import type { CosmeticType, CosmeticRarity, EquippedCosmetics } from '@/types';
import { sanitizeStudentDisplayName } from '@/utils/privacy';
import { useSmartBack } from '@/utils/homeUrl';

type MainView = 'home' | 'browse' | 'collection';
type AnimationFilter = 'all' | 'animated' | 'static';
type OwnershipFilter = 'all' | 'owned' | 'unowned';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rarity';

export interface HydratedStoreItem extends CosmeticItem {
  basePriceKobans: number;
  effectivePriceKobans: number;
  salePriceKobans: number | null;
  saleEndsAt: string | null;
  isOnSale: boolean;
  active: boolean;
  isNewItem: boolean;
}

const RARITY_RANK: Record<CosmeticRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

const RARITY_STYLES: Record<
  CosmeticRarity,
  {
    label: string;
    cardBorder: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
  }
> = {
  common: {
    label: 'Common',
    cardBorder: 'border-[var(--border)] hover:border-zinc-500/60',
    badgeBg: 'bg-zinc-800/90 border-zinc-600/50',
    badgeText: 'text-zinc-200',
    glow: '',
  },
  rare: {
    label: 'Rare',
    cardBorder: 'border-sky-500/45 hover:border-sky-400/80',
    badgeBg: 'bg-sky-950/90 border-sky-400/50',
    badgeText: 'text-sky-300',
    glow: 'shadow-[0_0_18px_-6px_rgba(56,189,248,0.35)]',
  },
  epic: {
    label: 'Epic',
    cardBorder: 'border-purple-500/50 hover:border-purple-400/85',
    badgeBg: 'bg-purple-950/90 border-purple-400/50',
    badgeText: 'text-purple-300',
    glow: 'shadow-[0_0_20px_-6px_rgba(168,85,247,0.4)]',
  },
  legendary: {
    label: 'Legendary',
    cardBorder: 'border-amber-500/55 hover:border-amber-400/90',
    badgeBg: 'bg-amber-950/90 border-amber-400/60',
    badgeText: 'text-amber-300',
    glow: 'shadow-[0_0_22px_-5px_rgba(245,158,11,0.45)]',
  },
  mythic: {
    label: 'Mythic',
    cardBorder: 'border-[#D71921]/75 hover:border-[#EF4444]',
    badgeBg: 'bg-[#450A0A]/95 border-[#EF4444]/70',
    badgeText: 'text-[#FCA5A5]',
    glow: 'shadow-[0_0_24px_-4px_rgba(215,25,33,0.55)]',
  },
};

const CATEGORY_META: Array<{
  type: CosmeticType;
  label: string;
  shortLabel: string;
  subtitle: string;
  sampleId: string;
}> = [
  {
    type: 'banner',
    label: 'Banners',
    shortLabel: 'Banners',
    subtitle: 'Full-width profile backdrops',
    sampleId: 'ban_crimson_dragons_descent',
  },
  {
    type: 'avatar',
    label: 'Profile Pictures',
    shortLabel: 'Pictures',
    subtitle: 'Hand-crafted character art',
    sampleId: 'pfp_zenryu_awakened',
  },
  {
    type: 'frame',
    label: 'Avatar Frames',
    shortLabel: 'Frames',
    subtitle: 'Animated & forged borders',
    sampleId: 'frame-dragon-scale-halo',
  },
  {
    type: 'nameplate',
    label: 'Nameplates',
    shortLabel: 'Nameplates',
    subtitle: 'Custom identity banners',
    sampleId: 'plate-dragon-lord',
  },
  {
    type: 'effect',
    label: 'Profile Effects',
    shortLabel: 'Effects',
    subtitle: 'Full-card particle auras',
    sampleId: 'black-sun-ember-storm',
  },
];

function isItemMarkedNew(item: CosmeticItem): boolean {
  if (item.isNew) return true;
  if (item.createdAt) {
    const createdMs = new Date(item.createdAt).getTime();
    if (Number.isFinite(createdMs)) {
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      return Date.now() - createdMs <= fourteenDaysMs;
    }
  }
  return false;
}

export function StorePage() {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const handleBack = useSmartBack();
  const {
    balance,
    owned,
    equipped,
    loading: walletLoading,
    equipCosmetic,
    purchaseCosmetic,
  } = useWallet();

  // ─── Server-verified Admin Role (default = null) ──────────────────────────
  const [verifiedAdminRole, setVerifiedAdminRole] = useState<'admin' | 'superadmin' | null>(null);
  const [verifiedAdminEmail, setVerifiedAdminEmail] = useState<string>('');
  const isVerifiedAdmin = verifiedAdminRole === 'admin' || verifiedAdminRole === 'superadmin';

  useEffect(() => {
    let active = true;
    if (!user?.uid) {
      setVerifiedAdminRole(null);
      setVerifiedAdminEmail('');
      return;
    }
    verifyStoreAdminRoleServerSide()
      .then((res) => {
        if (!active) return;
        if (res.verified && (res.role === 'admin' || res.role === 'superadmin')) {
          setVerifiedAdminRole(res.role);
          setVerifiedAdminEmail(res.email || user.email || 'admin');
        } else {
          setVerifiedAdminRole(null);
          setVerifiedAdminEmail('');
        }
      })
      .catch(() => {
        if (active) setVerifiedAdminRole(null);
      });
    return () => {
      active = false;
    };
  }, [user?.uid, user?.email]);

  // ─── Store Items Pricing State ────────────────────────────────────────────
  const [storeDocsMap, setStoreDocsMap] = useState<Record<string, StoreItemDoc>>({});
  const [storeLoading, setStoreLoading] = useState<boolean>(true);

  const loadStorePrices = useCallback(async () => {
    setStoreLoading(true);
    try {
      const items = await fetchStoreItems();
      const map: Record<string, StoreItemDoc> = {};
      items.forEach((it) => {
        map[it.id] = it;
      });
      setStoreDocsMap(map);
    } catch (err) {
      console.warn('[StorePage] loadStorePrices error:', err);
    } finally {
      setStoreLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorePrices();
  }, [loadStorePrices]);

  // ─── Navigation & Filter States ───────────────────────────────────────────
  const [activeView, setActiveView] = useState<MainView>('home');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CosmeticType>('all');
  const [collectionCategory, setCollectionCategory] = useState<'all' | CosmeticType>('all');
  const [animationFilter, setAnimationFilter] = useState<AnimationFilter>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | CosmeticRarity>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(2500);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const browseSentinelRef = useRef<HTMLDivElement | null>(null);

  // ─── Temporary "Preview on my profile" Loadout Override ───────────────────
  const [previewOverride, setPreviewOverride] = useState<Partial<EquippedCosmetics> | null>(null);
  const [previewingItemName, setPreviewingItemName] = useState<string | null>(null);

  // ─── Detail Sheet & Purchase Confirmation State ───────────────────────────
  const [selectedDetailItem, setSelectedDetailItem] = useState<HydratedStoreItem | null>(null);
  const [detailOpenedPrice, setDetailOpenedPrice] = useState<number | null>(null);
  const [confirmingPurchase, setConfirmingPurchase] = useState<boolean>(false);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; tone?: 'ok' | 'err' } | null>(
    null
  );
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [justPurchasedId, setJustPurchasedId] = useState<string | null>(null);
  const [showCoinBurst, setShowCoinBurst] = useState<boolean>(false);

  // ─── Get Kobans Modal State ───────────────────────────────────────────────
  const [isGetKobansOpen, setIsGetKobansOpen] = useState<boolean>(false);
  const [getKobansInitialAmount, setGetKobansInitialAmount] = useState<number>(1000);

  useEffect(() => {
    if (location.pathname === '/store/get-kobans') {
      setIsGetKobansOpen(true);
    }
  }, [location.pathname]);

  // ─── Admin "Manage Prices" Mode & Inline Drafts ───────────────────────────
  const [isManagePricesMode, setIsManagePricesMode] = useState<boolean>(false);
  const [inlinePriceDrafts, setInlinePriceDrafts] = useState<Record<string, string>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  // Detail sheet admin sale/price fields
  const [detailPriceDraft, setDetailPriceDraft] = useState<string>('');
  const [detailSalePriceDraft, setDetailSalePriceDraft] = useState<string>('');
  const [detailSaleEndsDraft, setDetailSaleEndsDraft] = useState<string>('');
  const [detailActiveDraft, setDetailActiveDraft] = useState<boolean>(true);

  // Bulk Edit State
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [isBulkSheetOpen, setIsBulkSheetOpen] = useState<boolean>(false);
  const [bulkMode, setBulkMode] = useState<BulkAdjustmentMode>('exact');
  const [bulkValue, setBulkValue] = useState<string>('300');
  const [bulkRarityPrices, setBulkRarityPrices] = useState<RarityPriceMap>({
    ...DEFAULT_RARITY_PRICES,
  });
  const [isExecutingBulk, setIsExecutingBulk] = useState<boolean>(false);
  const [unsavedConfirmPending, setUnsavedConfirmPending] = useState<(() => void) | null>(null);

  const showToast = useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    setToastMessage({ text, tone });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3400);
  }, []);

  const isLoggedIn = Boolean(user?.uid);
  const cleanDisplayName = sanitizeStudentDisplayName(
    profile?.displayName || user?.displayName,
    profile?.shortId || user?.uid
  );

  // ─── Hydrate All 125 Catalog Items with Live Store Pricing ────────────────
  const allHydratedItems: HydratedStoreItem[] = useMemo(() => {
    return COSMETICS_CATALOG.map((item) => {
      const docOverride = storeDocsMap[item.id];
      const basePrice = docOverride ? docOverride.priceKobans : item.priceKobans;
      const salePrice = docOverride ? docOverride.salePriceKobans : (item.salePriceKobans ?? null);
      const saleEndsAt = docOverride ? docOverride.saleEndsAt : (item.saleEndsAt ?? null);
      const active = docOverride ? docOverride.active : item.isActive !== false;

      const priceInfo = getEffectivePriceInfo({
        priceKobans: basePrice,
        salePriceKobans: salePrice,
        saleEndsAt,
      });

      return {
        ...item,
        priceKobans: priceInfo.effectivePrice,
        basePriceKobans: priceInfo.originalPrice,
        effectivePriceKobans: priceInfo.effectivePrice,
        salePriceKobans: salePrice,
        saleEndsAt: priceInfo.saleEndsAt,
        isOnSale: priceInfo.isOnSale,
        active,
        isNewItem: isItemMarkedNew(item),
      };
    });
  }, [storeDocsMap]);

  // Visible store items (hidden items only shown to verified admin in Manage Prices mode)
  const visibleCatalogItems = useMemo(() => {
    return allHydratedItems.filter((it) => it.active || (isVerifiedAdmin && isManagePricesMode));
  }, [allHydratedItems, isVerifiedAdmin, isManagePricesMode]);

  // Max price in catalog for range slider
  const catalogMaxPrice = useMemo(() => {
    const highest = visibleCatalogItems.reduce(
      (max, it) => Math.max(max, it.effectivePriceKobans),
      2000
    );
    return Math.ceil(highest / 100) * 100;
  }, [visibleCatalogItems]);

  useEffect(() => {
    setMaxPriceFilter((prev) => Math.max(prev, catalogMaxPrice));
  }, [catalogMaxPrice]);

  // ─── Category Stats (Count & "From N Kobans" Computed from Data) ──────────
  const categoryStats = useMemo(() => {
    const stats: Record<
      CosmeticType,
      { count: number; minPrice: number; sampleItem: HydratedStoreItem | undefined }
    > = {
      banner: { count: 0, minPrice: Infinity, sampleItem: undefined },
      avatar: { count: 0, minPrice: Infinity, sampleItem: undefined },
      frame: { count: 0, minPrice: Infinity, sampleItem: undefined },
      nameplate: { count: 0, minPrice: Infinity, sampleItem: undefined },
      effect: { count: 0, minPrice: Infinity, sampleItem: undefined },
    };

    for (const item of visibleCatalogItems) {
      const entry = stats[item.type];
      if (!entry) continue;
      entry.count += 1;
      if (item.effectivePriceKobans < entry.minPrice) {
        entry.minPrice = item.effectivePriceKobans;
      }
      if (!entry.sampleItem) {
        entry.sampleItem = item;
      }
    }

    for (const meta of CATEGORY_META) {
      const preferred = visibleCatalogItems.find((it) => it.id === meta.sampleId);
      if (preferred) {
        stats[meta.type].sampleItem = preferred;
      }
      if (!Number.isFinite(stats[meta.type].minPrice)) {
        stats[meta.type].minPrice = 0;
      }
    }

    return stats;
  }, [visibleCatalogItems]);

  // ─── Featured 6 Best Premium Drops for Overview Carousel ──────────────────
  const featuredDrops = useMemo(() => {
    const withOrder = visibleCatalogItems
      .filter((it) => typeof it.featuredOrder === 'number')
      .sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99));
    if (withOrder.length >= 6) return withOrder.slice(0, 6);
    const rest = visibleCatalogItems
      .filter((it) => typeof it.featuredOrder !== 'number')
      .sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]);
    return [...withOrder, ...rest].slice(0, 6);
  }, [visibleCatalogItems]);

  // ─── Filtered & Sorted Browse Items ───────────────────────────────────────
  const filteredBrowseItems = useMemo(() => {
    const filtered = visibleCatalogItems.filter((item) => {
      if (selectedCategory !== 'all' && item.type !== selectedCategory) return false;
      if (animationFilter === 'animated' && !item.animated) return false;
      if (animationFilter === 'static' && item.animated) return false;
      if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
      if (item.effectivePriceKobans > maxPriceFilter) return false;
      const isOwned = owned.includes(item.id);
      if (ownershipFilter === 'owned' && !isOwned) return false;
      if (ownershipFilter === 'unowned' && isOwned) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.effectivePriceKobans - b.effectivePriceKobans);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.effectivePriceKobans - a.effectivePriceKobans);
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        if (a.isNewItem !== b.isNewItem) return a.isNewItem ? -1 : 1;
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    } else if (sortBy === 'rarity') {
      sorted.sort(
        (a, b) =>
          RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] ||
          b.effectivePriceKobans - a.effectivePriceKobans
      );
    } else {
      // Featured default: New premium drops first, then higher rarity
      sorted.sort((a, b) => {
        if (a.isNewItem !== b.isNewItem) return a.isNewItem ? -1 : 1;
        return RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];
      });
    }
    return sorted;
  }, [
    visibleCatalogItems,
    selectedCategory,
    animationFilter,
    rarityFilter,
    maxPriceFilter,
    ownershipFilter,
    owned,
    sortBy,
  ]);

  // Reset pagination when browse filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [selectedCategory, animationFilter, rarityFilter, maxPriceFilter, ownershipFilter, sortBy]);

  // Infinite scroll IntersectionObserver for Browse tab
  useEffect(() => {
    const sentinel = browseSentinelRef.current;
    if (!sentinel || activeView !== 'browse' || visibleCount >= filteredBrowseItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < filteredBrowseItems.length) {
          setVisibleCount((prev) => Math.min(filteredBrowseItems.length, prev + 24));
        }
      },
      { rootMargin: '240px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeView, visibleCount, filteredBrowseItems.length]);

  // ─── Owned Items for My Collection Tab ────────────────────────────────────
  const ownedCatalogItems = useMemo(() => {
    return allHydratedItems.filter((it) => owned.includes(it.id));
  }, [allHydratedItems, owned]);

  const filteredCollectionItems = useMemo(() => {
    if (collectionCategory === 'all') return ownedCatalogItems;
    return ownedCatalogItems.filter((it) => it.type === collectionCategory);
  }, [ownedCatalogItems, collectionCategory]);

  // ─── Unsaved Admin Changes Detection ──────────────────────────────────────
  const hasUnsavedInlineChanges = useMemo(() => {
    for (const [id, draftVal] of Object.entries(inlinePriceDrafts)) {
      const item = allHydratedItems.find((it) => it.id === id);
      if (item && String(item.basePriceKobans) !== String(draftVal).trim()) {
        return true;
      }
    }
    if (selectedDetailItem && isManagePricesMode) {
      if (String(selectedDetailItem.basePriceKobans) !== detailPriceDraft.trim()) return true;
      const origSale =
        selectedDetailItem.salePriceKobans !== null
          ? String(selectedDetailItem.salePriceKobans)
          : '';
      if (origSale !== detailSalePriceDraft.trim()) return true;
    }
    return false;
  }, [
    inlinePriceDrafts,
    allHydratedItems,
    selectedDetailItem,
    isManagePricesMode,
    detailPriceDraft,
    detailSalePriceDraft,
  ]);

  useEffect(() => {
    if (!hasUnsavedInlineChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedInlineChanges]);

  const guardUnsavedChanges = useCallback(
    (action: () => void) => {
      if (hasUnsavedInlineChanges) {
        setUnsavedConfirmPending(() => action);
      } else {
        action();
      }
    },
    [hasUnsavedInlineChanges]
  );

  // ─── Open Item Detail Sheet ───────────────────────────────────────────────
  const openItemDetail = useCallback((item: HydratedStoreItem) => {
    setSelectedDetailItem(item);
    setDetailOpenedPrice(item.effectivePriceKobans);
    setConfirmingPurchase(false);
    setPurchaseError(null);
    setJustPurchasedId(null);
    setDetailPriceDraft(String(item.basePriceKobans));
    setDetailSalePriceDraft(item.salePriceKobans !== null ? String(item.salePriceKobans) : '');
    setDetailSaleEndsDraft(
      item.saleEndsAt ? new Date(item.saleEndsAt).toISOString().slice(0, 10) : ''
    );
    setDetailActiveDraft(item.active);
  }, []);

  // Keep selectedDetailItem synced if storeDocsMap updates
  useEffect(() => {
    if (!selectedDetailItem) return;
    const updated = allHydratedItems.find((it) => it.id === selectedDetailItem.id);
    if (updated) {
      setSelectedDetailItem(updated);
    }
  }, [allHydratedItems, selectedDetailItem]);

  // ─── Equip / Unequip Handler ──────────────────────────────────────────────
  const handleEquipToggle = async (item: HydratedStoreItem) => {
    if (!isLoggedIn) {
      requireAuth(() => {}, {
        title: 'Sign in to equip cosmetics',
        description: 'Log in to customize your Boardly profile loadout.',
      });
      return;
    }
    const isCurrentlyEquipped = equipped[item.type] === item.id;
    const nextItemId = isCurrentlyEquipped ? null : item.id;

    setEquippingId(item.id);
    setPurchaseError(null);
    try {
      await equipCosmetic(item.type, nextItemId);
      if (previewOverride && previewOverride[item.type]) {
        setPreviewOverride(null);
        setPreviewingItemName(null);
      }
      showToast(isCurrentlyEquipped ? `Unequipped ${item.name}` : `Equipped ${item.name}!`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update loadout', 'err');
    } finally {
      setEquippingId(null);
    }
  };

  // ─── "Preview on my profile" Handler ──────────────────────────────────────
  const handlePreviewOnProfile = (item: HydratedStoreItem) => {
    setPreviewOverride((prev) => ({
      ...(prev || {}),
      [item.type]: item.id,
    }));
    setPreviewingItemName(item.name);
    setSelectedDetailItem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Previewing "${item.name}" on your loadout card`);
  };

  // ─── Purchase Handler (with Server Price Re-Verification & Idempotency) ───
  const handleConfirmedPurchase = async (item: HydratedStoreItem) => {
    if (purchasing) return;
    if (!isLoggedIn) {
      setSelectedDetailItem(null);
      requireAuth(() => {}, {
        title: 'Sign in to unlock cosmetics',
        description: 'Log in to spend Kobans and build your collection.',
      });
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      // 1. Server/Firestore price re-check at the exact moment of purchase
      const expectedPrice =
        detailOpenedPrice !== null ? detailOpenedPrice : item.effectivePriceKobans;
      const verification = await verifyItemPriceAtPurchase(item.id, expectedPrice);

      if (!verification.isActive && !isVerifiedAdmin) {
        setPurchaseError('This item is no longer available in the Store.');
        setConfirmingPurchase(false);
        await loadStorePrices();
        return;
      }

      if (!verification.valid) {
        setDetailOpenedPrice(verification.liveEffectivePrice);
        setConfirmingPurchase(false);
        await loadStorePrices();
        setPurchaseError(
          `Price changed, please review (now ${verification.liveEffectivePrice.toLocaleString()} Kobans).`
        );
        return;
      }

      // 2. Execute atomic Koban purchase
      await purchaseCosmetic({
        ...item,
        priceKobans: verification.liveEffectivePrice,
      });

      setJustPurchasedId(item.id);
      setConfirmingPurchase(false);
      setShowCoinBurst(true);
      setTimeout(() => setShowCoinBurst(false), 1800);
      showToast(`Unlocked ${item.name}!`);
    } catch (err: unknown) {
      setPurchaseError(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  // ─── Admin Single-Item Save Handler ───────────────────────────────────────
  const handleAdminSaveSingleItem = async (
    item: HydratedStoreItem,
    rawPrice: string,
    rawSalePrice?: string,
    rawSaleEnds?: string,
    nextActive?: boolean
  ) => {
    if (!isVerifiedAdmin) return;
    const priceValidation = validateKobanPriceInput(rawPrice);
    if (!priceValidation.valid) {
      showToast(priceValidation.error || 'Invalid price', 'err');
      return;
    }

    let parsedSale: number | null | undefined = undefined;
    if (rawSalePrice !== undefined) {
      if (rawSalePrice.trim() === '') {
        parsedSale = null;
      } else {
        const saleVal = validateKobanPriceInput(rawSalePrice);
        if (!saleVal.valid) {
          showToast(saleVal.error || 'Invalid sale price', 'err');
          return;
        }
        if (saleVal.value >= priceValidation.value) {
          showToast('Sale price must be lower than the regular price.', 'err');
          return;
        }
        parsedSale = saleVal.value;
      }
    }

    let parsedSaleEnds: string | null | undefined = undefined;
    if (rawSaleEnds !== undefined) {
      parsedSaleEnds = rawSaleEnds.trim()
        ? new Date(`${rawSaleEnds.trim()}T23:59:59.999Z`).toISOString()
        : null;
    }

    setSavingItemId(item.id);
    try {
      await updateSingleItemPricing(
        verifiedAdminEmail,
        item.id,
        {
          priceKobans: priceValidation.value,
          salePriceKobans: parsedSale,
          saleEndsAt: parsedSaleEnds,
          active: nextActive,
        },
        storeDocsMap[item.id]
      );
      setInlinePriceDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await loadStorePrices();
      showToast(`Saved ${item.name} (${priceValidation.value.toLocaleString()} Kobans)`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save price', 'err');
    } finally {
      setSavingItemId(null);
    }
  };

  // ─── Admin Bulk Preview & Execution ───────────────────────────────────────
  const currentBulkPreview = useMemo(() => {
    const allDocs = allHydratedItems.map(
      (it) =>
        storeDocsMap[it.id] || {
          id: it.id,
          name: it.name,
          category: 'avatar',
          catalogType: it.type,
          type: it.animated ? 'animated' : 'static',
          priceKobans: it.basePriceKobans,
          price_kobans: it.basePriceKobans,
          salePriceKobans: it.salePriceKobans,
          sale_price_kobans: it.salePriceKobans,
          saleEndsAt: it.saleEndsAt,
          sale_ends_at: it.saleEndsAt,
          active: it.active,
          is_active: it.active,
          rarity: it.rarity,
        }
    );

    const targetIds =
      selectedAdminIds.length > 0
        ? selectedAdminIds
        : filteredBrowseItems.map((it) => it.id);

    return previewBulkPriceChanges(allDocs, {
      category: 'all',
      type: 'both',
      mode: bulkMode,
      value: Number(bulkValue) || 0,
      selectedIds: targetIds,
      rarityPrices: bulkRarityPrices,
    });
  }, [
    allHydratedItems,
    storeDocsMap,
    selectedAdminIds,
    filteredBrowseItems,
    bulkMode,
    bulkValue,
    bulkRarityPrices,
  ]);

  const handleExecuteBulkUpdate = async () => {
    if (!isVerifiedAdmin || isExecutingBulk) return;
    if (currentBulkPreview.affectedItems.length === 0) {
      showToast('No items selected for bulk update.', 'err');
      return;
    }

    setIsExecutingBulk(true);
    try {
      const summary = `Bulk ${bulkMode} on ${currentBulkPreview.affectedItems.length} items`;
      const res = await executeBulkPriceChanges(
        verifiedAdminEmail,
        currentBulkPreview,
        summary,
        bulkMode
      );
      await loadStorePrices();
      setIsBulkSheetOpen(false);
      setSelectedAdminIds([]);
      showToast(`Updated prices for ${res.updatedCount} items!`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Bulk update failed', 'err');
    } finally {
      setIsExecutingBulk(false);
    }
  };

  // ─── Effective Equipped Cosmetics for Top Loadout Card ────────────────────
  const effectiveLoadout: EquippedCosmetics = useMemo(
    () => ({
      banner:
        previewOverride?.banner !== undefined ? previewOverride.banner : equipped.banner,
      avatar:
        previewOverride?.avatar !== undefined ? previewOverride.avatar : equipped.avatar,
      frame:
        previewOverride?.frame !== undefined ? previewOverride.frame : equipped.frame,
      nameplate:
        previewOverride?.nameplate !== undefined
          ? previewOverride.nameplate
          : equipped.nameplate,
      effect:
        previewOverride?.effect !== undefined ? previewOverride.effect : equipped.effect,
    }),
    [equipped, previewOverride]
  );

  // Active filter count for Browse filter bar
  const activeFilterCount =
    (rarityFilter !== 'all' ? 1 : 0) +
    (animationFilter !== 'all' ? 1 : 0) +
    (ownershipFilter !== 'all' ? 1 : 0) +
    (maxPriceFilter < catalogMaxPrice ? 1 : 0);

  // ─── Render Category-Specific Item Preview Stage ──────────────────────────
  const renderItemPreviewStage = (item: HydratedStoreItem, isLarge = false) => {
    if (item.type === 'banner') {
      return (
        <div className="relative w-full h-full flex items-center justify-center p-2">
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/15 shadow-md bg-[#0B0B0E]">
            <BannerRenderer
              bannerId={item.id}
              animated={item.animated}
              showReadabilityOverlay={false}
            />
            {/* Mini sample avatar at bottom-left to show how the banner frames a profile */}
            <div className="absolute bottom-1.5 left-2 z-20 flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full ring-2 ring-[#121216] overflow-hidden bg-[#18181B] shadow-md">
                <AvatarPicture
                  avatarId={equipped.avatar}
                  avatarKey={profile?.avatarKey}
                  avatarVariant={profile?.avatarVariant}
                  seed={user?.uid || 'student'}
                  size={24}
                />
              </div>
              <div className="px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-xs border border-white/10 text-[9px] font-semibold text-white/90 leading-none">
                {cleanDisplayName.split(' ')[0] || 'Scholar'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'avatar') {
      const circleSize = isLarge ? 148 : 104;
      return (
        <div className="relative w-full h-full flex items-center justify-center p-3">
          <div
            className="relative rounded-full overflow-hidden ring-2 ring-white/15 shadow-[0_0_24px_rgba(255,255,255,0.12)] flex items-center justify-center"
            style={{ width: '76%', height: '76%', maxWidth: circleSize, maxHeight: circleSize }}
          >
            <AvatarPicture
              itemId={item.id}
              size={circleSize}
              priority={isLarge ? 9 : 2}
              className="!w-full !h-full !rounded-full"
            />
          </div>
        </div>
      );
    }

    if (item.type === 'frame') {
      const frameSize = isLarge ? 144 : 104;
      return (
        <div className="relative w-full h-full flex items-center justify-center p-3">
          <AvatarFrame itemId={item.id} size={frameSize}>
            <AvatarPicture
              avatarId={equipped.avatar}
              avatarKey={profile?.avatarKey}
              avatarVariant={profile?.avatarVariant}
              seed={user?.uid || 'student'}
              size={Math.round(frameSize * 0.72)}
              priority={isLarge ? 9 : 2}
              className="rounded-full"
            />
          </AvatarFrame>
        </div>
      );
    }

    if (item.type === 'nameplate') {
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-center px-2.5 py-3">
          <div className="w-full flex items-center justify-center">
            <Nameplate
              itemId={item.id}
              name={cleanDisplayName || 'Boardly Scholar'}
              allowWrap="two-lines"
              className="w-full justify-center text-center"
            />
          </div>
        </div>
      );
    }

    // Profile Effects: clipped mini profile card with overflow: hidden; contain: paint
    return (
      <div
        className="relative w-full h-full p-2 flex items-center justify-center"
        style={{ overflow: 'hidden', contain: 'paint' }}
      >
        <ProfileEffectCardPreview
          itemId={item.id}
          userName={cleanDisplayName || 'Boardly Scholar'}
          className="w-full h-full"
        />
      </div>
    );
  };

  // ─── Render Single Store Item Card (3 Data Points Max) ────────────────────
  const renderStoreCard = (item: HydratedStoreItem) => {
    const isOwned = owned.includes(item.id);
    const isEquipped = equipped[item.type] === item.id;
    const rarityMeta = RARITY_STYLES[item.rarity] || RARITY_STYLES.common;
    const isSelectedForBulk = selectedAdminIds.includes(item.id);
    const draftPrice =
      inlinePriceDrafts[item.id] !== undefined
        ? inlinePriceDrafts[item.id]
        : String(item.basePriceKobans);

    return (
      <div
        key={item.id}
        onClick={() => openItemDetail(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openItemDetail(item);
          }
        }}
        className={`group relative flex flex-col rounded-2xl bg-[var(--card)] border transition-all duration-150 active:scale-[0.97] cursor-pointer select-none overflow-hidden ${
          rarityMeta.cardBorder
        } ${rarityMeta.glow} ${!item.active ? 'opacity-60' : ''}`}
      >
        {/* Mythic animated top border sheen */}
        {item.rarity === 'mythic' && (
          <div className="h-0.5 w-full bg-gradient-to-r from-[#DC2626] via-[#FDE047] to-[#DC2626]" />
        )}

        {/* Square Preview Stage (Always Dark-Neutral #121216 for Cosmetic Contrast) */}
        <div
          className="relative w-full aspect-square bg-[#121216] overflow-hidden flex items-center justify-center"
          style={{ contain: 'paint' }}
        >
          {renderItemPreviewStage(item, false)}

          {/* Top-Left Badge: SALE or NEW or HIDDEN */}
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 pointer-events-none">
            {!item.active ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-600">
                Hidden
              </span>
            ) : item.isOnSale ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/95 text-black shadow-xs">
                Sale
              </span>
            ) : item.isNewItem ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D71921] text-white shadow-xs">
                New
              </span>
            ) : null}
          </div>

          {/* Top-Right Animated Indicator or Admin Bulk Checkbox */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
            {isVerifiedAdmin && isManagePricesMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAdminIds((prev) =>
                    prev.includes(item.id)
                      ? prev.filter((id) => id !== item.id)
                      : [...prev, item.id]
                  );
                }}
                aria-label={`Select ${item.name} for bulk edit`}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                  isSelectedForBulk
                    ? 'bg-[#D71921] border-white text-white'
                    : 'bg-black/70 border-white/30 text-white/70 hover:text-white'
                }`}
              >
                {isSelectedForBulk && <Check className="w-4 h-4" />}
              </button>
            )}
            {item.animated && (
              <span
                title="Animated cosmetic"
                className="w-6 h-6 rounded-full bg-black/65 backdrop-blur-xs border border-white/15 flex items-center justify-center text-amber-300 pointer-events-none"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>

        {/* Card Footer: 1-Line Name + Single-Row Price & Status Pill */}
        <div className="p-2.5 sm:p-3 flex flex-col gap-1.5 bg-[var(--card)]">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="text-[14px] sm:text-[15px] font-heading font-semibold text-[var(--text)] truncate leading-snug">
              {item.name}
            </h3>
          </div>

          <div className="flex items-center justify-between gap-2 min-h-[28px]">
            {/* Left: Kobans Price */}
            <div className="flex items-center gap-1.5 min-w-0">
              {item.effectivePriceKobans === 0 ? (
                <span className="text-xs font-bold text-emerald-500">Free</span>
              ) : (
                <>
                  <KobanIcon size={15} className="shrink-0" />
                  <span className="text-xs sm:text-[13px] font-bold text-[var(--text)] tabular-nums">
                    {item.effectivePriceKobans.toLocaleString()}
                  </span>
                  {item.isOnSale && (
                    <span className="text-[11px] text-[var(--muted)] line-through tabular-nums">
                      {item.basePriceKobans.toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Right: Compact Status Pill (Equipped / Owned / Buy) */}
            {isEquipped ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Check className="w-3 h-3" />
                Equipped
              </span>
            ) : isOwned ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)] shrink-0">
                Owned
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#D71921]/15 text-[#EF4444] border border-[#D71921]/30 group-hover:bg-[#D71921] group-hover:text-white transition-colors shrink-0">
                Buy
              </span>
            )}
          </div>

          {/* Inline Admin Price Editor (Rendered ONLY for Verified Admin in Manage Prices Mode) */}
          {isVerifiedAdmin && isManagePricesMode && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-1.5 pt-2 border-t border-[var(--border)] flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100000}
                  step={1}
                  value={draftPrice}
                  onChange={(e) =>
                    setInlinePriceDrafts((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                  aria-label={`Price in Kobans for ${item.name}`}
                  className="w-full min-w-0 h-8 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                />
                <button
                  type="button"
                  disabled={savingItemId === item.id}
                  onClick={() => handleAdminSaveSingleItem(item, draftPrice)}
                  className="h-8 px-2.5 rounded-lg bg-[#D71921] hover:bg-[#B91C1C] text-white text-xs font-semibold shrink-0 disabled:opacity-50"
                >
                  {savingItemId === item.id ? '...' : 'Save'}
                </button>
                <button
                  type="button"
                  disabled={savingItemId === item.id}
                  onClick={() =>
                    handleAdminSaveSingleItem(
                      item,
                      draftPrice,
                      undefined,
                      undefined,
                      !item.active
                    )
                  }
                  title={item.active ? 'Hide item' : 'Show item'}
                  aria-label={item.active ? `Hide ${item.name}` : `Show ${item.name}`}
                  className="h-8 w-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] shrink-0"
                >
                  {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
              {savingItemId === item.id && <ButtonLineLoader />}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <PageMeta
        title="Boardly Store — Profile Cosmetics & Drops"
        description="Customize your Boardly scholar profile with animated banners, avatar frames, profile pictures, nameplates, and profile effects."
        canonical="https://boardly.cfd/store"
      />

      {showCoinBurst && <CoinBurstEffect />}

      {/* Top Line Loader during initial price hydration or wallet sync */}
      {(storeLoading || walletLoading) && (
        <div className="sticky top-0 z-50">
          <LineLoader />
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] px-4 py-2.5 rounded-xl bg-zinc-900/95 text-white border border-white/15 shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium">
          {toastMessage.tone === 'err' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── 2.a) HEADER (Single Row, Clean, Fits 320px) ───────────────────── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[var(--bg)]/85 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Left: Back Button + 1-Line Title "Store" */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => guardUnsavedChanges(handleBack)}
              aria-label="Go back"
              className="w-11 h-11 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] active:scale-[0.97] transition-transform shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg sm:text-xl font-heading font-bold text-[var(--text)] truncate">
              Store
            </h1>
          </div>

          {/* Right: Server-Verified Admin Chip + Kobans Pill + Compact "+" Icon Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isVerifiedAdmin && (
              <button
                type="button"
                onClick={() =>
                  guardUnsavedChanges(() => {
                    setIsManagePricesMode((prev) => !prev);
                    setInlinePriceDrafts({});
                  })
                }
                className={`h-10 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors active:scale-[0.97] ${
                  isManagePricesMode
                    ? 'bg-[#D71921] border-[#EF4444] text-white shadow-sm'
                    : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

            {/* Kobans Balance Pill */}
            <div
              className="h-10 px-2.5 sm:px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] inline-flex items-center gap-1.5"
              title="Your Kobans balance"
            >
              <KobanIcon size={16} />
              <span className="text-xs sm:text-sm font-bold tabular-nums text-[var(--text)]">
                {balance.toLocaleString()}
              </span>
            </div>

            {/* Compact "+" Get Kobans Button (44px+ touch target) */}
            <button
              type="button"
              onClick={() => {
                setGetKobansInitialAmount(1000);
                setIsGetKobansOpen(true);
              }}
              aria-label="Get Kobans"
              title="Get Kobans"
              className="w-11 h-11 rounded-xl bg-[#D71921] hover:bg-[#B91C1C] text-white flex items-center justify-center shadow-sm active:scale-[0.97] transition-all shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Admin Manage Prices Toolbar */}
        {isVerifiedAdmin && isManagePricesMode && (
          <div className="bg-[#18070B] border-t border-[#D71921]/40 px-3 sm:px-6 py-2">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-white">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="font-semibold">Manage prices mode</span>
                <span className="text-white/70 hidden sm:inline">
                  (10 Kobans = PKR 1 · Edit inline or select items for bulk update)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkSheetOpen(true)}
                  className="h-9 px-3 rounded-lg bg-[#D71921] hover:bg-[#B91C1C] text-white font-semibold inline-flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    Bulk edit ({selectedAdminIds.length || filteredBrowseItems.length})
                  </span>
                </button>
                {selectedAdminIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAdminIds([])}
                    className="h-9 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/90"
                  >
                    Clear ({selectedAdminIds.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 space-y-5">
        {/* ─── 2.b) LOADOUT CARD (Top of Store, Clipped Particle Stage, Full Name Wrap) ─── */}
        <section
          aria-label="Your equipped profile loadout"
          className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden"
          style={{ overflow: 'hidden', contain: 'paint' }}
        >
          {/* Equipped Profile Effect Layer (Strictly Clipped Inside Card) */}
          {effectiveLoadout.effect && (
            <ProfileCardEffect itemId={effectiveLoadout.effect} previewMode={true} />
          )}

          {/* Equipped Banner Backdrop */}
          <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-[#121216]">
            <BannerRenderer
              bannerId={effectiveLoadout.banner}
              animated={true}
              showReadabilityOverlay={true}
            />
            {previewingItemName && (
              <div className="absolute top-2.5 left-3 right-3 z-20 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-amber-400/40 text-xs text-amber-200">
                <span className="truncate">
                  Previewing: <strong>{previewingItemName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOverride(null);
                    setPreviewingItemName(null);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white font-semibold shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Loadout Identity Row: Large Avatar + Frame + Effect + Full Wrapped Nameplate + 2 Actions */}
          <div className="relative z-10 px-4 pb-4 pt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-10 sm:-mt-12">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 min-w-0">
              {/* Large Avatar with Equipped Frame & Effect */}
              <div
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#121216] p-1 ring-2 ring-[var(--card)] flex items-center justify-center shrink-0 overflow-hidden"
                style={{ contain: 'paint' }}
              >
                <CosmeticEffect itemId={effectiveLoadout.effect || ''} size={76}>
                  <AvatarFrame itemId={effectiveLoadout.frame || ''} size={76}>
                    <AvatarPicture
                      avatarId={effectiveLoadout.avatar}
                      avatarKey={profile?.avatarKey}
                      avatarVariant={profile?.avatarVariant}
                      seed={user?.uid || 'student'}
                      size={56}
                      priority={10}
                      className="rounded-full"
                    />
                  </AvatarFrame>
                </CosmeticEffect>
              </div>

              {/* Nameplate Underneath / Alongside at Real Scale — Full Name Wrapped, Never Truncated */}
              <div className="flex flex-col items-start gap-1 min-w-0 pt-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">
                  Active Loadout
                </span>
                <div className="max-w-full">
                  <Nameplate
                    itemId={effectiveLoadout.nameplate || ''}
                    name={cleanDisplayName || 'Boardly Scholar'}
                    shortId={profile?.shortId}
                    allowWrap="full"
                  />
                </div>
              </div>
            </div>

            {/* Two Clear Loadout Actions: "View profile" and "My collection (n)" */}
            <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={() =>
                  guardUnsavedChanges(() =>
                    navigate(user?.uid ? `/u/${user.uid}` : '/dashboard')
                  )
                }
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] active:scale-[0.97] transition-all"
              >
                View profile
              </button>
              <button
                type="button"
                onClick={() => guardUnsavedChanges(() => setActiveView('collection'))}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] inline-flex items-center gap-1.5 active:scale-[0.97] transition-all"
              >
                <span>My collection ({ownedCatalogItems.length})</span>
              </button>
            </div>
          </div>
        </section>

        {/* ─── 2.c) SEGMENTED TABS: Overview | Browse | Collection (Fits at 320px, Zero Scroll) ─── */}
        <nav
          aria-label="Store sections"
          className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]"
        >
          <button
            type="button"
            onClick={() => guardUnsavedChanges(() => setActiveView('home'))}
            className={`min-h-[44px] px-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${
              activeView === 'home'
                ? 'bg-[var(--card)] text-[var(--text)] shadow-xs border border-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => guardUnsavedChanges(() => setActiveView('browse'))}
            className={`min-h-[44px] px-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${
              activeView === 'browse'
                ? 'bg-[var(--card)] text-[var(--text)] shadow-xs border border-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <span>Browse</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#D71921]/15 text-[#EF4444] tabular-nums">
              {visibleCatalogItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => guardUnsavedChanges(() => setActiveView('collection'))}
            className={`min-h-[44px] px-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${
              activeView === 'collection'
                ? 'bg-[var(--card)] text-[var(--text)] shadow-xs border border-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <span>Collection</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--bg)] text-[var(--text-secondary)] tabular-nums">
              {ownedCatalogItems.length}
            </span>
          </button>
        </nav>

        {/* ═════════════════════════════════════════════════════════════════════
            2.d) OVERVIEW TAB
           ═════════════════════════════════════════════════════════════════════ */}
        {activeView === 'home' && (
          <div className="space-y-6">
            {/* 1. Featured Horizontal Carousel (6 Best Premium Items) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-heading font-bold text-[var(--text)]">
                    Featured
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#D71921]/15 text-[#EF4444] border border-[#D71921]/30">
                    New Drops
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSortBy('newest');
                    setActiveView('browse');
                  }}
                  className="text-xs font-semibold text-[#EF4444] hover:underline inline-flex items-center gap-1"
                >
                  <span>Explore all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {featuredDrops.map((item) => (
                    <div
                      key={item.id}
                      className="snap-start shrink-0 w-[210px] sm:w-[235px]"
                    >
                      {renderStoreCard(item)}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Categories Section (1-Line Heading + 2-Column Grid of 5 Category Tiles) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-heading font-bold text-[var(--text)] truncate">
                  Categories
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setActiveView('browse');
                  }}
                  className="text-xs font-semibold text-[#EF4444] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>See all ({visibleCatalogItems.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {CATEGORY_META.map((cat) => {
                  const stat = categoryStats[cat.type];
                  const sample = stat.sampleItem;
                  return (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.type);
                        setActiveView('browse');
                      }}
                      className="group text-left rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[#D71921]/60 overflow-hidden flex flex-col transition-all active:scale-[0.97]"
                    >
                      {/* Real Preview Thumbnail on Dark Neutral Stage */}
                      <div
                        className="relative w-full aspect-square bg-[#121216] overflow-hidden flex items-center justify-center"
                        style={{ contain: 'paint' }}
                      >
                        {sample ? renderItemPreviewStage(sample, false) : null}
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white/90 border border-white/10 tabular-nums">
                          {stat.count} items
                        </span>
                      </div>

                      <div className="p-3 flex flex-col gap-1">
                        <span className="text-sm font-heading font-bold text-[var(--text)] truncate group-hover:text-[#EF4444] transition-colors">
                          {cat.label}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
                          <span>From</span>
                          <KobanIcon size={13} />
                          <span className="font-bold text-[var(--text)] tabular-nums">
                            {stat.minPrice.toLocaleString()}
                          </span>
                          <span>Kobans</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. Compact "Get Kobans Now" CTA Card at Bottom */}
            <section className="rounded-2xl bg-gradient-to-r from-[#2A050A] via-[#1A0910] to-[#121218] border border-[#D71921]/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <KobanIcon size={15} />
                  <span>Top Up Treasury</span>
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-white">
                  Need more Kobans for Mythic & Legendary drops?
                </h3>
                <p className="text-xs text-white/75">
                  Instant balance top-ups at {KOBAN_TO_PKR_RATE} Kobans = PKR 1, or earn Kobans through daily study streaks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGetKobansInitialAmount(1000);
                  setIsGetKobansOpen(true);
                }}
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shrink-0 active:scale-[0.97] transition-all shadow-md"
              >
                <KobanIcon size={16} />
                <span>Get Kobans Now</span>
              </button>
            </section>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            3) BROWSE TAB
           ═════════════════════════════════════════════════════════════════════ */}
        {activeView === 'browse' && (
          <div className="space-y-4">
            {/* 3.a) Sticky Glass Filter Bar */}
            <div className="sticky top-14 z-20 -mx-3 sm:mx-0 px-3 sm:px-3 py-2.5 backdrop-blur-xl bg-[var(--bg)]/90 sm:rounded-2xl border-b sm:border border-[var(--border)] space-y-2.5">
              {/* Row 1: Scrollable Category Chips with Edge Fade & Hidden Scrollbar */}
              <div className="relative">
                <div className="flex items-center gap-1.5 overflow-x-auto pr-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-[#D71921] text-white'
                        : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                    }`}
                  >
                    All ({visibleCatalogItems.length})
                  </button>
                  {CATEGORY_META.map((cat) => (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => setSelectedCategory(cat.type)}
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                        selectedCategory === cat.type
                          ? 'bg-[#D71921] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                      }`}
                    >
                      {cat.label} ({categoryStats[cat.type]?.count || 0})
                    </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[var(--bg)] to-transparent" />
              </div>

              {/* Row 2: Filters Button + Sort Dropdown + Result Count */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFilterSheetOpen(true)}
                    className="min-h-[40px] px-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] inline-flex items-center gap-1.5 active:scale-[0.97]"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#D71921] text-white text-[10px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <span className="text-xs text-[var(--muted)] tabular-nums">
                    {filteredBrowseItems.length} results
                  </span>
                </div>

                {/* Sort Dropdown */}
                <div className="relative inline-flex items-center">
                  <select
                    aria-label="Sort store items"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="min-h-[40px] pl-3 pr-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] appearance-none cursor-pointer focus:outline-none focus:border-[#D71921]"
                  >
                    <option value="featured">Sort: Featured</option>
                    <option value="newest">Sort: Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rarity">Sort: Rarity</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] absolute right-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Active Filter Removable Chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {rarityFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setRarityFilter('all')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text)]"
                    >
                      <span>Rarity: {RARITY_STYLES[rarityFilter].label}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {animationFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setAnimationFilter('all')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text)]"
                    >
                      <span>Motion: {animationFilter}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {ownershipFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setOwnershipFilter('all')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text)]"
                    >
                      <span>Status: {ownershipFilter}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {maxPriceFilter < catalogMaxPrice && (
                    <button
                      type="button"
                      onClick={() => setMaxPriceFilter(catalogMaxPrice)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text)]"
                    >
                      <span>Max: {maxPriceFilter.toLocaleString()} Kobans</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setRarityFilter('all');
                      setAnimationFilter('all');
                      setOwnershipFilter('all');
                      setMaxPriceFilter(catalogMaxPrice);
                    }}
                    className="text-[11px] font-semibold text-[#EF4444] hover:underline px-1.5"
                  >
                    Reset all
                  </button>
                </div>
              )}
            </div>

            {/* 3.b) Responsive Item Grid (2 cols phone, 3 tablet, 4-5 desktop) */}
            {filteredBrowseItems.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-[var(--text)]">
                  No cosmetics match your current filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setRarityFilter('all');
                    setAnimationFilter('all');
                    setOwnershipFilter('all');
                    setMaxPriceFilter(catalogMaxPrice);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D71921] text-white text-xs font-bold"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {filteredBrowseItems.slice(0, visibleCount).map((item) => renderStoreCard(item))}
                </div>

                {/* 3.f) Infinite Scroll Sentinel */}
                {visibleCount < filteredBrowseItems.length && (
                  <div ref={browseSentinelRef} className="pt-4 pb-2 flex justify-center items-center">
                    <span className="text-xs font-mono text-[var(--muted)] animate-pulse">
                      Loading more cosmetics...
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            4) COLLECTION TAB
           ═════════════════════════════════════════════════════════════════════ */}
        {activeView === 'collection' && (
          <div className="space-y-4">
            {/* Scrollable Category Chip Row with Edge Fade & Hidden Scrollbar */}
            <div className="relative">
              <div className="flex items-center gap-1.5 overflow-x-auto pr-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setCollectionCategory('all')}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                    collectionCategory === 'all'
                      ? 'bg-[#D71921] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                  }`}
                >
                  All Owned ({ownedCatalogItems.length})
                </button>
                {CATEGORY_META.map((cat) => {
                  const catOwnedCount = ownedCatalogItems.filter(
                    (it) => it.type === cat.type
                  ).length;
                  return (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => setCollectionCategory(cat.type)}
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                        collectionCategory === cat.type
                          ? 'bg-[#D71921] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                      }`}
                    >
                      {cat.label} ({catOwnedCount})
                    </button>
                  );
                })}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[var(--bg)] to-transparent" />
            </div>

            {filteredCollectionItems.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {ownedCatalogItems.length === 0
                    ? 'Your cosmetic collection is empty.'
                    : 'No owned items in this category yet.'}
                </p>
                <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
                  Unlock banners, profile pictures, frames, nameplates, and effects in the Store to equip them on your profile.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('browse')}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#D71921] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-bold active:scale-[0.97] transition-all"
                >
                  Browse store
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredCollectionItems.map((item) => {
                  const isEquipped = equipped[item.type] === item.id;
                  const isBusy = equippingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden"
                    >
                      <div
                        onClick={() => openItemDetail(item)}
                        className="relative w-full aspect-square bg-[#121216] overflow-hidden flex items-center justify-center cursor-pointer"
                        style={{ contain: 'paint' }}
                      >
                        {renderItemPreviewStage(item, false)}
                        {isEquipped && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-black">
                            Equipped
                          </span>
                        )}
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        <h3 className="text-sm font-heading font-semibold text-[var(--text)] truncate">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleEquipToggle(item)}
                          className={`min-h-[42px] w-full rounded-xl text-xs font-bold transition-all active:scale-[0.97] flex flex-col items-center justify-center ${
                            isEquipped
                              ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
                              : 'bg-[#D71921] hover:bg-[#B91C1C] text-white'
                          }`}
                        >
                          <span>{isEquipped ? 'Unequip' : 'Equip'}</span>
                          {isBusy && (
                            <div className="w-16 mt-1">
                              <ButtonLineLoader />
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          3.a) FILTERS BOTTOM SHEET
         ═══════════════════════════════════════════════════════════════════════ */}
      {isFilterSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsFilterSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-5 max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-heading font-bold text-[var(--text)]">
                Filter Cosmetics
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                aria-label="Close filters"
                className="w-9 h-9 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rarity Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Rarity
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRarityFilter(r)}
                    className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                      rarityFilter === r
                        ? 'bg-[#D71921] border-[#EF4444] text-white'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {r === 'all' ? 'All Rarities' : RARITY_STYLES[r].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Motion Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Motion Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['all', 'animated', 'static'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAnimationFilter(m)}
                    className={`min-h-[40px] rounded-xl text-xs font-semibold capitalize border ${
                      animationFilter === m
                        ? 'bg-[#D71921] border-[#EF4444] text-white'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {m === 'all' ? 'All' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Ownership Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Ownership
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['all', 'unowned', 'owned'] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOwnershipFilter(o)}
                    className={`min-h-[40px] rounded-xl text-xs font-semibold capitalize border ${
                      ownershipFilter === o
                        ? 'bg-[#D71921] border-[#EF4444] text-white'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {o === 'all' ? 'All' : o === 'owned' ? 'Owned' : 'Not Owned'}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price Range Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[var(--muted)]">
                  Max Price
                </span>
                <span className="font-bold text-[var(--text)] tabular-nums">
                  Up to {maxPriceFilter.toLocaleString()} Kobans
                </span>
              </div>
              <input
                type="range"
                min={70}
                max={catalogMaxPrice}
                step={10}
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-[#D71921]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRarityFilter('all');
                  setAnimationFilter('all');
                  setOwnershipFilter('all');
                  setMaxPriceFilter(catalogMaxPrice);
                }}
                className="min-h-[48px] flex-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold text-[var(--text)]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="min-h-[48px] flex-1 rounded-xl bg-[#D71921] text-white text-xs font-bold"
              >
                Show {filteredBrowseItems.length} items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          3.e) ITEM DETAIL BOTTOM SHEET
         ═══════════════════════════════════════════════════════════════════════ */}
      {selectedDetailItem && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => guardUnsavedChanges(() => setSelectedDetailItem(null))}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden max-h-[92vh] flex flex-col shadow-2xl"
          >
            {/* Large Live Preview Stage (Dark Neutral #121216) */}
            <div
              className="relative w-full h-60 sm:h-64 bg-[#121216] flex items-center justify-center overflow-hidden shrink-0"
              style={{ contain: 'paint' }}
            >
              {renderItemPreviewStage(selectedDetailItem, true)}

              <button
                type="button"
                onClick={() => guardUnsavedChanges(() => setSelectedDetailItem(null))}
                aria-label="Close item details"
                className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white border border-white/15 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${
                    RARITY_STYLES[selectedDetailItem.rarity].badgeBg
                  } ${RARITY_STYLES[selectedDetailItem.rarity].badgeText}`}
                >
                  {RARITY_STYLES[selectedDetailItem.rarity].label}
                </span>
                {selectedDetailItem.animated && (
                  <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-black/70 text-amber-300 border border-white/15 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Animated
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Detail Content */}
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-heading font-bold text-[var(--text)]">
                    {selectedDetailItem.name}
                  </h2>
                  <p className="text-xs text-[var(--muted)] capitalize">
                    {CATEGORY_META.find((c) => c.type === selectedDetailItem.type)?.label ||
                      selectedDetailItem.type}
                  </p>
                </div>

                {/* Price in Kobans + PKR Equivalent (from single KOBAN_TO_PKR_RATE config) */}
                <div className="text-right shrink-0">
                  {selectedDetailItem.effectivePriceKobans === 0 ? (
                    <span className="text-base font-bold text-emerald-500">Free</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      <KobanIcon size={18} />
                      <span className="text-lg font-heading font-bold text-[var(--text)] tabular-nums">
                        {selectedDetailItem.effectivePriceKobans.toLocaleString()}
                      </span>
                      {selectedDetailItem.isOnSale && (
                        <span className="text-xs text-[var(--muted)] line-through tabular-nums">
                          {selectedDetailItem.basePriceKobans.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-[var(--muted)] tabular-nums">
                    PKR {kobansToPkr(selectedDetailItem.effectivePriceKobans).toLocaleString()} (
                    {KOBAN_TO_PKR_RATE} Kobans = PKR 1)
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {selectedDetailItem.description}
              </p>

              {/* "Preview on my profile" Button */}
              <button
                type="button"
                onClick={() => handlePreviewOnProfile(selectedDetailItem)}
                className="min-h-[44px] w-full px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] inline-flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
              >
                <Eye className="w-4 h-4 text-[#EF4444]" />
                <span>Preview on my profile</span>
              </button>

              {purchaseError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{purchaseError}</span>
                </div>
              )}

              {/* Primary Action Area: Owned -> Equip/Unequip | Just Purchased -> Equip Now | Unowned -> Buy / Need Kobans */}
              {owned.includes(selectedDetailItem.id) ||
              justPurchasedId === selectedDetailItem.id ? (
                <button
                  type="button"
                  disabled={equippingId === selectedDetailItem.id}
                  onClick={() => handleEquipToggle(selectedDetailItem)}
                  className="min-h-[48px] w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex flex-col items-center justify-center gap-1 active:scale-[0.97] transition-all"
                >
                  <span>
                    {equipped[selectedDetailItem.type] === selectedDetailItem.id
                      ? 'Unequip from profile'
                      : 'Equip now'}
                  </span>
                  {equippingId === selectedDetailItem.id && (
                    <div className="w-24">
                      <ButtonLineLoader />
                    </div>
                  )}
                </button>
              ) : balance < selectedDetailItem.effectivePriceKobans && !isVerifiedAdmin ? (
                <div className="space-y-2">
                  <div className="text-xs text-center text-amber-400 font-semibold">
                    Need{' '}
                    {(
                      selectedDetailItem.effectivePriceKobans - balance
                    ).toLocaleString()}{' '}
                    more Kobans (You have {balance.toLocaleString()} Kobans)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const shortfall = Math.max(
                        500,
                        selectedDetailItem.effectivePriceKobans - balance
                      );
                      setGetKobansInitialAmount(shortfall);
                      setSelectedDetailItem(null);
                      setIsGetKobansOpen(true);
                    }}
                    className="min-h-[48px] w-full rounded-xl bg-[#D71921] hover:bg-[#B91C1C] text-white text-sm font-bold inline-flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                  >
                    <KobanIcon size={16} />
                    <span>Get Kobans</span>
                  </button>
                </div>
              ) : confirmingPurchase ? (
                <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[#D71921]/50 space-y-3">
                  <p className="text-xs sm:text-sm font-semibold text-[var(--text)] text-center">
                    Spend{' '}
                    <strong>
                      {selectedDetailItem.effectivePriceKobans.toLocaleString()} Kobans
                    </strong>{' '}
                    on <strong>{selectedDetailItem.name}</strong>?
                    <span className="block text-xs text-[var(--muted)] mt-0.5">
                      New balance:{' '}
                      {Math.max(
                        0,
                        balance - selectedDetailItem.effectivePriceKobans
                      ).toLocaleString()}{' '}
                      Kobans
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={purchasing}
                      onClick={() => setConfirmingPurchase(false)}
                      className="min-h-[44px] flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-bold text-[var(--text)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={purchasing}
                      onClick={() => handleConfirmedPurchase(selectedDetailItem)}
                      className="min-h-[44px] flex-1 rounded-xl bg-[#D71921] hover:bg-[#B91C1C] text-white text-xs font-bold flex flex-col items-center justify-center disabled:opacity-50"
                    >
                      <span>{purchasing ? 'Unlocking...' : 'Confirm Purchase'}</span>
                      {purchasing && (
                        <div className="w-20 mt-1">
                          <ButtonLineLoader />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingPurchase(true)}
                  className="min-h-[48px] w-full rounded-xl bg-[#D71921] hover:bg-[#B91C1C] text-white text-sm font-bold inline-flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-md"
                >
                  <KobanIcon size={17} />
                  <span>
                    {selectedDetailItem.effectivePriceKobans === 0
                      ? 'Claim for Free'
                      : `Buy for ${selectedDetailItem.effectivePriceKobans.toLocaleString()} Kobans`}
                  </span>
                </button>
              )}

              {/* Server-Verified Admin Price & Sale Controls inside Detail Sheet */}
              {isVerifiedAdmin && (
                <div className="pt-3 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#EF4444] inline-flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Admin Price & Sale Controls
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={detailActiveDraft}
                        onChange={(e) => setDetailActiveDraft(e.target.checked)}
                        className="accent-[#D71921]"
                      />
                      <span>Visible in Store</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-[var(--muted)] mb-1">
                        Regular Price (Kobans)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        step={1}
                        value={detailPriceDraft}
                        onChange={(e) => setDetailPriceDraft(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--muted)] mb-1">
                        Sale Price (Optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        step={1}
                        placeholder="None"
                        value={detailSalePriceDraft}
                        onChange={(e) => setDetailSalePriceDraft(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--muted)] mb-1">
                        Sale Ends Date
                      </label>
                      <input
                        type="date"
                        value={detailSaleEndsDraft}
                        onChange={(e) => setDetailSaleEndsDraft(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={savingItemId === selectedDetailItem.id}
                      onClick={() =>
                        handleAdminSaveSingleItem(
                          selectedDetailItem,
                          detailPriceDraft,
                          detailSalePriceDraft,
                          detailSaleEndsDraft,
                          detailActiveDraft
                        )
                      }
                      className="min-h-[40px] flex-1 rounded-xl bg-[#D71921] hover:bg-[#B91C1C] text-white text-xs font-bold"
                    >
                      {savingItemId === selectedDetailItem.id
                        ? 'Saving...'
                        : 'Save Price & Sale'}
                    </button>
                    {selectedDetailItem.salePriceKobans !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setDetailSalePriceDraft('');
                          setDetailSaleEndsDraft('');
                          handleAdminSaveSingleItem(
                            selectedDetailItem,
                            detailPriceDraft,
                            '',
                            '',
                            detailActiveDraft
                          );
                        }}
                        className="min-h-[40px] px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]"
                      >
                        End Sale
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          6) ADMIN BULK PRICE EDIT BOTTOM SHEET
         ═══════════════════════════════════════════════════════════════════════ */}
      {isVerifiedAdmin && isBulkSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsBulkSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-bold text-[var(--text)]">
                  Bulk Price Editor
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Applying to{' '}
                  {selectedAdminIds.length > 0
                    ? `${selectedAdminIds.length} selected items`
                    : `all ${filteredBrowseItems.length} currently filtered items`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkSheetOpen(false)}
                className="w-9 h-9 rounded-xl bg-[var(--surface-2)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Mode Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'exact', label: 'Set price' },
                  { id: 'percentage_increase', label: 'Increase by %' },
                  { id: 'percentage_decrease', label: 'Decrease by %' },
                  { id: 'set_by_rarity', label: 'Set by rarity' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setBulkMode(m.id)}
                  className={`min-h-[40px] px-2.5 rounded-xl text-xs font-semibold border ${
                    bulkMode === m.id
                      ? 'bg-[#D71921] border-[#EF4444] text-white'
                      : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {bulkMode === 'set_by_rarity' ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((r) => (
                  <div key={r}>
                    <label className="block text-[11px] capitalize text-[var(--muted)] mb-1">
                      {r}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={bulkRarityPrices[r]}
                      onChange={(e) =>
                        setBulkRarityPrices((prev) => ({
                          ...prev,
                          [r]: Math.max(0, Math.min(100000, Number(e.target.value) || 0)),
                        }))
                      }
                      className="w-full h-9 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  {bulkMode === 'exact' ? 'New Kobans Price (0 - 100,000)' : 'Percentage (%)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={bulkMode === 'exact' ? 100000 : 1000}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono text-[var(--text)]"
                />
              </div>
            )}

            {/* Preview Table of Old & New Prices Before Confirming */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                <span>Preview ({currentBulkPreview.totalMatches} items)</span>
                <span>Old → New Kobans</span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] divide-y divide-[var(--border)]">
                {currentBulkPreview.affectedItems.slice(0, 40).map((row) => (
                  <div
                    key={row.id}
                    className="px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <span className="truncate font-medium text-[var(--text)] pr-2">
                      {row.name}
                    </span>
                    <span className="font-mono tabular-nums shrink-0">
                      <span className="text-[var(--muted)]">
                        {row.oldPrice.toLocaleString()}
                      </span>{' '}
                      →{' '}
                      <strong className="text-emerald-400">
                        {row.newPrice.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkSheetOpen(false)}
                className="min-h-[48px] flex-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExecutingBulk}
                onClick={handleExecuteBulkUpdate}
                className="min-h-[48px] flex-1 rounded-xl bg-[#D71921] hover:bg-[#B91C1C] text-white text-xs font-bold flex flex-col items-center justify-center"
              >
                <span>
                  {isExecutingBulk
                    ? 'Applying...'
                    : `Confirm & Update ${currentBulkPreview.totalMatches} Items`}
                </span>
                {isExecutingBulk && (
                  <div className="w-24 mt-1">
                    <ButtonLineLoader />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Admin Changes Confirmation Modal */}
      {unsavedConfirmPending && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4">
            <h3 className="text-base font-heading font-bold text-[var(--text)]">
              Unsaved price changes
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              You have unsaved admin price edits. Leave without saving?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUnsavedConfirmPending(null)}
                className="min-h-[44px] flex-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold text-[var(--text)]"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = unsavedConfirmPending;
                  setUnsavedConfirmPending(null);
                  setInlinePriceDrafts({});
                  fn();
                }}
                className="min-h-[44px] flex-1 rounded-xl bg-[#D71921] text-white text-xs font-bold"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Get Kobans Modal */}
      <GetKobansModal
        isOpen={isGetKobansOpen}
        onClose={() => {
          setIsGetKobansOpen(false);
          if (location.pathname === '/store/get-kobans') {
            navigate('/store', { replace: true });
          }
        }}
        initialKobanAmount={getKobansInitialAmount}
      />
    </div>
  );
}
export default StorePage;
