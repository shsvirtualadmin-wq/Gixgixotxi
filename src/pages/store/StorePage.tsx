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
  Zap,
  BarChart3,
  BookOpen,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useStoreCart } from '@/hooks/useStoreCart';
import { useTheme } from '@/hooks/useTheme';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  COSMETICS_CATALOG,
  type CosmeticItem,
  type CosmeticRarity,
  getCosmeticById,
} from '@/data/cosmeticsCatalog';
import { AdSlot } from '@/components/AdSlot';
import { useAdsConfig } from '@/services/adsConfigService';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { getDisplayName } from '@/utils/displayName';
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
import { calculateCartTotals } from '@/lib/storeCartPricing';
import {
  buildPlansCatalog,
  buildPlanFaqItems,
  evaluatePlanPurchaseEligibility,
  REFUND_POLICY_TEXT,
  PRO_HIGHLIGHT_BULLETS,
  getProStatusSummary,
  type PaidPlanId,
} from '@/config/plans';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import { computeProToPlusCreditDays, PLUS_ALREADY_INCLUDES_PRO_MSG } from '@/lib/planTier';
import { StatusBanner } from '@/components/plans/StatusBanner';
import { PlanCard } from '@/components/plans/PlanCard';
import { ProLockedStateCard } from '@/components/plans/ProLockedStateCard';
import { ProCheckoutSheet } from '@/components/plans/ProCheckoutSheet';
import { GuestProBlockedView } from '@/components/plans/GuestProBlockedView';
import { fetchStudentProRequests } from '@/services/proSubscriptionService';
import type { PaymentRequest } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, formatNumber } = useLanguage();
  const { user, profile: authUserProfile, isGuest } = useAuth();
  const { profile: liveUserProfile } = useUserProfile();
  const userProfile = liveUserProfile || authUserProfile;
  const { isDark, toggle: toggleTheme } = useTheme();
  const {
    balance,
    kobanBalance,
    balanceLoaded,
    owned,
    equipped,
    loading: walletLoading,
    isSuperAdmin,
    equipCosmetic,
    equipMultipleCosmetics,
    purchaseCosmetic,
    purchaseCosmeticBatch,
    refreshWallet,
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
  const purchasingSingleLockRef = useRef<boolean>(false);
  const singlePurchaseKeyRef = useRef<string>('');
  const [singlePurchaseError, setSinglePurchaseError] = useState<string | null>(
    null
  );
  const [singlePurchaseSuccess, setSinglePurchaseSuccess] = useState<{
    item: EnrichedCosmeticItem;
    newBalance: number;
  } | null>(null);

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
  const [proCheckoutOpen, setProCheckoutOpen] = useState(false);
  const [proCheckoutPlanId, setProCheckoutPlanId] =
    useState<PaidPlanId>('pro_monthly');
  const [membershipBilling, setMembershipBilling] = useState<'monthly' | 'annual'>('monthly');
  const [studentProRequests, setStudentProRequests] = useState<PaymentRequest[]>(
    []
  );
  const { config: plansConfig } = usePlansConfig();
  const plansCatalog = useMemo(() => buildPlansCatalog(plansConfig), [plansConfig]);
  const planFaqItems = useMemo(() => buildPlanFaqItems(plansConfig), [plansConfig]);
  const { source: planSource, planStatus, refreshPlanStatus } = useEffectivePlan();
  const isCrew = planSource === 'crew';

  const rawProExpiresAt =
    userProfile?.plusUntil ??
    userProfile?.planExpiresAt ??
    (userProfile as any)?.premiumExpiresAt ??
    null;
  const proStatusSummary = useMemo(
    () =>
      getProStatusSummary({
        plan: planStatus.isPersonalPlus ? 'plus' : planStatus.isPersonalPro ? 'pro' : 'free',
        isPremium: planStatus.isPersonalPro || planStatus.isPersonalPlus,
        isPlus: planStatus.isPersonalPlus,
        proPlanId: planStatus.planId,
        planExpiresAt: planStatus.expiryMs ?? rawProExpiresAt,
        plusUntil: planStatus.isPersonalPlus ? planStatus.expiryMs ?? rawProExpiresAt : null,
        isSuperAdmin: planStatus.isSuperAdmin,
      }),
    [planStatus, rawProExpiresAt]
  );
  const effectiveIsPro = planStatus.state === 'active';
  const effectiveIsPlus = planStatus.isPlus;
  const isPendingReview = planStatus.state === 'pending';
  const proToPlusCreditDays = useMemo(() => {
    if (!planStatus.isPersonalPro || planStatus.isPersonalPlus || !planStatus.daysLeft) return 0;
    return computeProToPlusCreditDays(
      planStatus.daysLeft,
      plansConfig.pro.pricePkrMonthly,
      plansConfig.plus.pricePkrMonthly
    );
  }, [planStatus, plansConfig]);

  const loadStudentProRequests = useCallback(async () => {
    if (!user?.uid || isGuest) return;
    await refreshPlanStatus();
    const list = await fetchStudentProRequests(user.uid);
    setStudentProRequests(list);
  }, [user?.uid, isGuest, refreshPlanStatus]);

  useEffect(() => {
    loadStudentProRequests();
  }, [loadStudentProRequests]);

  useEffect(() => {
    if (mainView === 'membership' && user?.uid && !isGuest) {
      loadStudentProRequests().catch(() => {});
    }
  }, [mainView, user?.uid, isGuest, loadStudentProRequests]);

  useEffect(() => {
    if (!user?.uid || isGuest) return;
    const onFocusOrRefresh = () => {
      loadStudentProRequests().catch(() => {});
    };
    window.addEventListener('focus', onFocusOrRefresh);
    window.addEventListener('boardly:plan-refresh', onFocusOrRefresh);
    return () => {
      window.removeEventListener('focus', onFocusOrRefresh);
      window.removeEventListener('boardly:plan-refresh', onFocusOrRefresh);
    };
  }, [user?.uid, isGuest, loadStudentProRequests]);

  const pendingProRequest = useMemo(
    () =>
      studentProRequests.find(
        (r) => r.status === 'pending' && r.plan !== 'large_crew'
      ) || null,
    [studentProRequests]
  );
  const latestRejectedProRequest = useMemo(
    () =>
      studentProRequests.find(
        (r) => r.status === 'rejected' && r.plan !== 'large_crew'
      ) || null,
    [studentProRequests]
  );

  const handleOpenProCheckout = useCallback(
    (planId: PaidPlanId) => {
      if (!user) {
        navigate('/login');
        return;
      }
      const eligibility = evaluatePlanPurchaseEligibility(planStatus, planId);
      if (!eligibility.allowed) {
        setToast({
          type: 'error',
          text: eligibility.reason || PLUS_ALREADY_INCLUDES_PRO_MSG,
        });
        return;
      }
      setProCheckoutPlanId(planId);
      setProCheckoutOpen(true);
    },
    [user, navigate, planStatus]
  );

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

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ type, text });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  const displayName = getDisplayName(
    {
      display_name: userProfile?.display_name ?? userProfile?.displayName,
      realName: userProfile?.realName ?? userProfile?.name ?? user?.displayName,
      username: userProfile?.username,
    },
    'You'
  );
  const photoURL: string | null = null;

  // Resolved items in the cart (deduplicated, preserving insertion order, excluding owned)
  const cartTotals = useMemo(() => {
    const catalogMap = new Map(liveCatalog.map((item) => [item.id, item]));
    const resolved = cartIds
      .map((id) => catalogMap.get(id))
      .filter((item): item is (typeof liveCatalog)[number] => Boolean(item));
    return calculateCartTotals({
      items: resolved,
      balance,
      isSuperAdmin,
      ownedIds: owned,
    });
  }, [cartIds, liveCatalog, owned, isSuperAdmin, balance]);

  const cartItems = cartTotals.items;
  const cartTotalKobans = cartTotals.subtotal;

  // Immediately clear any stale checkout error when cart items or affordability change
  useEffect(() => {
    setCartError((prev) => {
      if (!prev) return null;
      if (cartItems.length === 0) return null;
      if (cartTotals.canAfford && /insufficient\s+kobans/i.test(prev)) return null;
      return prev;
    });
  }, [cartItems.length, cartTotalKobans, cartTotals.canAfford]);

  const handleRemoveCartItem = useCallback(
    (itemId: string) => {
      removeFromCart(itemId);
      setCartError(null);
      setFlaggedItemsNotice([]);
      checkoutKeyRef.current = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    },
    [removeFromCart]
  );

  const handleClearCartItems = useCallback(() => {
    clearCart();
    setCartError(null);
    setFlaggedItemsNotice([]);
    checkoutKeyRef.current = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }, [clearCart]);

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
  const { config: adsConfig } = useAdsConfig();
  const storeRowsEveryN = Math.max(2, adsConfig.slots.store_rows?.everyN || 4);
  const [storeGridCols, setStoreGridCols] = useState<number>(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 768) return 3;
    return 2;
  });
  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1024) setStoreGridCols(4);
      else if (window.innerWidth >= 768) setStoreGridCols(3);
      else setStoreGridCols(2);
    };
    window.addEventListener('resize', updateCols, { passive: true });
    return () => window.removeEventListener('resize', updateCols);
  }, []);

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

  const [notFoundItemQuery, setNotFoundItemQuery] = useState(false);

  // Open item from ?item=<id> query param on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qItem = (params.get('item') || '').trim();
    if (!qItem) {
      setNotFoundItemQuery(false);
      return;
    }
    const matched =
      liveCatalog.find(
        (c) =>
          c.id.toLowerCase() === qItem.toLowerCase() ||
          c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === qItem.toLowerCase()
      ) || getCosmeticById(qItem);
    if (matched) {
      setNotFoundItemQuery(false);
      setDetailItemId(matched.id);
    } else if (liveCatalog.length > 0) {
      setNotFoundItemQuery(true);
    }
  }, [liveCatalog]);

  // Keep browser address bar synced with /store/<itemId> when an item detail modal is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDashboardStore = window.location.pathname.toLowerCase().startsWith('/dashboard/store');
    const baseStorePath = isDashboardStore ? '/dashboard/store' : '/store';
    if (detailItem) {
      const targetUrl = `${baseStorePath}/${encodeURIComponent(detailItem.id)}`;
      if (window.location.pathname !== targetUrl) {
        window.history.replaceState(null, '', targetUrl);
      }
    } else if (
      !notFoundItemQuery &&
      window.location.pathname.toLowerCase() !== '/store/get-kobans' &&
      (window.location.pathname.toLowerCase().startsWith('/store/') ||
        window.location.pathname.toLowerCase().startsWith('/dashboard/store/'))
    ) {
      window.history.replaceState(null, '', baseStorePath);
    }
  }, [detailItem, notFoundItemQuery]);

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

  // Close any active sheet on Escape key or browser back navigation, and clean up body attributes
  const closeConfirmBuySheet = useCallback(() => {
    if (purchasingSingleLockRef.current) return;
    setConfirmBuyItem(null);
    setSinglePurchaseError(null);
    setSinglePurchaseSuccess(null);
  }, []);

  const openSinglePurchaseConfirm = useCallback(
    (item: EnrichedCosmeticItem) => {
      if (purchasingSingleLockRef.current || cartProcessing) return;
      if (!isSuperAdmin && owned.includes(item.id)) {
        showToast('error', t('store.alreadyOwned'));
        return;
      }
      // Enforce only ONE modal/sheet open at a time
      setDetailItemId(null);
      setCartOpen(false);
      setFilterSheetOpen(false);
      setProCheckoutOpen(false);
      setGetKobansOpen(false);
      setSinglePurchaseError(null);
      setSinglePurchaseSuccess(null);
      if (confirmBuyItem?.id !== item.id || !singlePurchaseKeyRef.current) {
        singlePurchaseKeyRef.current = `single_${item.id}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;
      }
      setConfirmBuyItem(item);
    },
    [cartProcessing, confirmBuyItem?.id, isSuperAdmin, owned, showToast, t]
  );

  // Keyboard navigation & Escape / browser Back button support for sheets
  useEffect(() => {
    if (!detailItemId && !confirmBuyItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (confirmBuyItem) {
        if (e.key === 'Escape' && !purchasingSingleLockRef.current) {
          closeConfirmBuySheet();
        }
        return;
      }
      if (detailItemId) {
        if (e.key === 'ArrowLeft') handleNavigateDetail('prev');
        if (e.key === 'ArrowRight') handleNavigateDetail('next');
        if (e.key === 'Escape') setDetailItemId(null);
      }
    };
    const onPopState = () => {
      if (!purchasingSingleLockRef.current) {
        setConfirmBuyItem(null);
        setSinglePurchaseError(null);
        setSinglePurchaseSuccess(null);
        setDetailItemId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
    };
  }, [detailItemId, confirmBuyItem, handleNavigateDetail, closeConfirmBuySheet]);

  // Ensure body scroll lock & modal attributes are always cleaned up when sheets close or unmount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const anyModalOpen = Boolean(
      detailItemId || confirmBuyItem || cartOpen || proCheckoutOpen || getKobansOpen || filterSheetOpen
    );
    if (anyModalOpen) {
      document.body.setAttribute('data-fullscreen-modal-open', 'true');
      window.dispatchEvent(new Event('boardly:modal-change'));
    } else {
      document.body.removeAttribute('data-fullscreen-modal-open');
      document.body.style.overflow = '';
      window.dispatchEvent(new Event('boardly:modal-change'));
    }
    return () => {
      document.body.removeAttribute('data-fullscreen-modal-open');
      document.body.style.overflow = '';
      window.dispatchEvent(new Event('boardly:modal-change'));
    };
  }, [detailItemId, confirmBuyItem, cartOpen, proCheckoutOpen, getKobansOpen, filterSheetOpen]);

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
          ? t('store.unequippedItem', { name: item.name })
          : t('store.equippedItem', { name: item.name })
      );
    } catch (err: any) {
      showToast('error', err?.message || t('store.failedUpdateEquip'));
    }
  };

  // Single-item instant purchase handler (single-flight + idempotent)
  const handleConfirmSinglePurchase = async () => {
    if (!confirmBuyItem || purchasingSingleLockRef.current || purchasingSingle) {
      return;
    }
    if (!user) {
      setConfirmBuyItem(null);
      navigate('/login');
      return;
    }
    if (isGuest || user.uid.startsWith('guest_')) {
      setSinglePurchaseError(t('store.guestCannotPurchase'));
      return;
    }
    if (!isSuperAdmin && owned.includes(confirmBuyItem.id)) {
      setSinglePurchaseError(t('store.alreadyOwned'));
      showToast('error', t('store.alreadyOwned'));
      return;
    }
    if (!singlePurchaseKeyRef.current) {
      singlePurchaseKeyRef.current = `single_${confirmBuyItem.id}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    }

    purchasingSingleLockRef.current = true;
    setPurchasingSingle(true);
    setSinglePurchaseError(null);
    try {
      const res = await purchaseCosmetic(
        confirmBuyItem,
        singlePurchaseKeyRef.current
      );
      removeFromCart(confirmBuyItem.id);
      triggerCoinBurst();
      try {
        await equipCosmetic(confirmBuyItem.type, confirmBuyItem.id);
      } catch (equipErr) {
        console.warn('[StorePage] Post-purchase auto-equip warning:', equipErr);
      }
      setSinglePurchaseSuccess({
        item: confirmBuyItem,
        newBalance: res.newBalance,
      });
      refreshWallet().catch(() => {});
      showToast(
        'success',
        t('store.unlockedEquipped', { name: confirmBuyItem.name })
      );
    } catch (err: any) {
      const msg = err?.message || t('store.purchaseFailed');
      setSinglePurchaseError(msg);
      showToast('error', msg);
    } finally {
      purchasingSingleLockRef.current = false;
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
        ? t('store.addedMultipleToCart', { count: formatNumber(addedCount) })
        : t('store.selectedAlreadyInCart')
    );
  };

  // Cart drawer & atomic batch checkout handlers
  const handleOpenCart = () => {
    if (purchasingSingleLockRef.current) return;
    setConfirmBuyItem(null);
    setSinglePurchaseError(null);
    setSinglePurchaseSuccess(null);
    setDetailItemId(null);
    setFilterSheetOpen(false);
    setProCheckoutOpen(false);
    setGetKobansOpen(false);
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
      const target = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      navigate(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }
    if (isGuest || user.uid.startsWith('guest_')) {
      setCartError(t('store.guestCannotPurchase'));
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
        err?.message || t('store.checkoutFailed')
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
      showToast('success', t('store.equippedNewCosmetics'));
      setCompletedOrder(null);
      setCartOpen(false);
    } catch (err: any) {
      showToast('error', err?.message || t('store.couldNotEquip'));
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
    { id: 'all', label: t('store.tabAll'), count: liveCatalog.length },
    {
      id: 'banner',
      label: t('store.tabBanners'),
      count: liveCatalog.filter((i) => i.type === 'banner').length,
    },
    {
      id: 'avatar',
      label: t('store.tabAvatars'),
      count: liveCatalog.filter((i) => i.type === 'avatar').length,
    },
    {
      id: 'frame',
      label: t('store.tabFrames'),
      count: liveCatalog.filter((i) => i.type === 'frame').length,
    },
    {
      id: 'effect',
      label: t('store.tabEffects'),
      count: liveCatalog.filter((i) => i.type === 'effect').length,
    },
    {
      id: 'nameplate',
      label: t('store.tabNameplates'),
      count: liveCatalog.filter((i) => i.type === 'nameplate').length,
    },
    {
      id: 'collection',
      label: t('store.tabCollection'),
      count: isSuperAdmin ? liveCatalog.length : owned.length,
    },
  ];

  const isLoadingGrid = catalogLoading || (Boolean(user) && walletLoading);

  if (notFoundItemQuery) {
    return <NotFoundPage />;
  }

  return (
    <div data-student-page="store" className="min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] pb-[var(--sdn-page-pb)] overflow-x-clip">
      <PageMeta
        title="Boardly Store — Animated Banners, Avatars, Frames, Profile Effects & Nameplates"
        description="Customize your Boardly identity with animated profile banners, avatar pictures, frames, profile effects, and nameplates using Kobans."
        canonicalPath="/store"
      />
      <CoinBurstEffect
        active={coinBurstActive}
        onComplete={() => setCoinBurstActive(false)}
      />

      {/* E. Toast Notification: top of screen, z-index above backdrop & drawer, 2s auto-dismiss, 1 line truncated, max-w 90vw, non-blocking */}
      {toast &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            style={{
              backgroundColor: toast.type === 'success' ? '#0D281E' : '#2A1215',
              color: '#FFFFFF',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            }}
            className={`fixed top-3 left-1/2 -translate-x-1/2 z-[1150] max-w-[90vw] px-3.5 py-2 rounded-full shadow-xl border pointer-events-none flex items-center gap-2 text-xs font-bold dark-surface-preserve ${
              toast.type === 'success'
                ? 'border-emerald-500/45 text-emerald-100'
                : 'border-[#E11D2A]/55 text-red-100'
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 shrink-0 ${
                toast.type === 'success' ? 'text-emerald-400' : 'text-[#FF6B75]'
              }`}
            />
            <span className="truncate whitespace-nowrap">{toast.text}</span>
          </div>,
          document.body
        )}

      {/* Sticky Top Store Header */}
      <header className="sticky top-0 z-30 glass-header border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t('common.back')}
              className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 rtl-mirror" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#E11D2A] shrink-0" />
                <h1 className="text-sm sm:text-lg font-black tracking-tight truncate">
                  {t('store.title')}
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden sm:block truncate">
                {t('store.subtitle')}
              </p>
            </div>
          </div>

          {/* Right Header Controls: SuperAdmin badge, Live Wallet Balance + "+", Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isSuperAdmin && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-black">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SUPER ADMIN</span>
              </div>
            )}

            {/* Live Koban Wallet Balance with "+" button */}
            <div className="h-9 ps-2.5 pe-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center gap-1.5">
              <KobanIcon size={16} />
              <span className="text-xs sm:text-sm font-black tabular-nums ltr-nums text-[var(--text-primary)] inline-flex items-center">
                {!balanceLoaded || kobanBalance === null ? (
                  <span className="inline-block w-10 h-3.5 rounded-md skeleton" aria-label={t('common.loading')} />
                ) : (
                  formatNumber(kobanBalance)
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  setGetKobansInitialAmount(undefined);
                  setGetKobansOpen(true);
                }}
                aria-label={t('store.getMoreKobans')}
                title={t('kobans.getKobans')}
                className="w-7 h-7 rounded-lg bg-[#E11D2A] hover:bg-[#c81824] text-white flex items-center justify-center transition-colors ms-0.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t('settings.theme')}
              title={t('settings.theme')}
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
              <span>{t('store.cosmeticsCount', { count: formatNumber(liveCatalog.length) })}</span>
            </button>
            {!isGuest && (
              <button
                type="button"
                onClick={() => setMainView('membership')}
                style={
                  mainView === 'membership'
                    ? {
                        background:
                          'linear-gradient(135deg, #E8342A 0%, #C8241B 55%, #B45309 100%)',
                        color: '#FFFFFF',
                      }
                    : undefined
                }
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mainView === 'membership'
                    ? 'text-[#FFFFFF] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{t('store.proAndPlus')}</span>
                {effectiveIsPro && (
                  <span className="ms-1 px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-white/20 text-[#FFFFFF]">
                    {effectiveIsPlus ? 'Plus' : 'Pro'}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {effectiveIsPro && !isGuest && proStatusSummary.statusText && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-semibold hidden md:inline-flex items-center gap-1.5">
                <Crown className="w-3 h-3" />
                <span>{proStatusSummary.statusText}</span>
              </span>
            )}
            <div className="text-[11px] font-semibold text-[var(--text-muted)] hidden sm:block">
              {t('store.rateBanner')}
            </div>
          </div>
        </div>

        {mainView === 'membership' && isGuest ? (
          <GuestProBlockedView variant="page" />
        ) : mainView === 'membership' ? (
          /* ─── BOARDLY PRO & PLUS MEMBERSHIP VIEW ─── */
          <div className="space-y-6 pb-20">
            {(effectiveIsPro || planStatus.state === 'pending' || pendingProRequest || latestRejectedProRequest) && (
              <StatusBanner
                planId={effectiveIsPlus ? 'plus' : effectiveIsPro ? 'pro' : isCrew ? 'crew' : 'free'}
                planExpiresAtRaw={rawProExpiresAt}
                planStatus={planStatus}
                pendingProRequest={pendingProRequest}
                latestRejectedProRequest={latestRejectedProRequest}
                onUpgradeOrExtend={() =>
                  handleOpenProCheckout(
                    effectiveIsPlus
                      ? membershipBilling === 'annual'
                        ? 'plus_annual'
                        : 'plus_monthly'
                      : membershipBilling === 'annual'
                      ? 'pro_annual'
                      : 'pro_monthly'
                  )
                }
                onUpgradeToPlus={() =>
                  handleOpenProCheckout(
                    membershipBilling === 'annual' ? 'plus_annual' : 'plus_monthly'
                  )
                }
              />
            )}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#E8342A]/10 border border-[#E8342A]/30 text-[#E8342A] text-[11px] font-mono font-bold uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5" />
                  <span>{t('plans.passesBadge')}</span>
                </div>
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight leading-tight">
                  {t('plans.headline')}
                </h2>
                <p className="font-body text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                  {t('plans.paymentNote')} {t('plans.refundPolicy')}
                </p>
              </div>

              {!isPendingReview && (
                <div className="inline-flex p-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)] self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setMembershipBilling('monthly')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      membershipBilling === 'monthly'
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('plans.monthly')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMembershipBilling('annual')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      membershipBilling === 'annual'
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <span>{t('plans.annual')}</span>
                    <span className="text-[10px] font-mono text-[#E8342A] ltr-nums">
                      -{plansConfig.annualDiscountPercent}%
                    </span>
                  </button>
                </div>
              )}
            </div>

            {isPendingReview ? (
              <ProLockedStateCard planStatus={planStatus} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {(() => {
                  const proPlan =
                    membershipBilling === 'annual'
                      ? plansCatalog.pro_annual
                      : plansCatalog.pro_monthly;
                  const plusPlan =
                    membershipBilling === 'annual'
                      ? plansCatalog.plus_annual
                      : plansCatalog.plus_monthly;
                  const proCtaDisabled = effectiveIsPlus || (planStatus.isPersonalPro && !effectiveIsPlus);
                  const cadenceShort = membershipBilling === 'annual' ? t('plans.perYearShort') : t('plans.perMonthShort');
                  const proCtaLabel = effectiveIsPlus
                    ? t('plans.includedInPlus')
                    : planStatus.isPersonalPro
                    ? t('plans.currentPlan')
                    : t('plans.upgradeToProPrice', {
                        price: `PKR ${formatNumber(proPlan.price_pkr)}${cadenceShort}`,
                      });
                  const plusCtaLabel = effectiveIsPlus
                    ? t('plans.extendPlusPrice', {
                        price: `PKR ${formatNumber(plusPlan.price_pkr)}${cadenceShort}`,
                      })
                    : t('plans.upgradeToPlusPrice', {
                        price: `PKR ${formatNumber(plusPlan.price_pkr)}${cadenceShort}`,
                      });

                  return (
                    <>
                      <PlanCard
                        title="Boardly Pro"
                        subtitle={
                          membershipBilling === 'annual'
                            ? t('plans.annualPassDays', { days: formatNumber(proPlan.duration_days) })
                            : t('plans.monthlyPassDays', { days: formatNumber(proPlan.duration_days) })
                        }
                        durationBadge={t('plans.daysCount', { days: formatNumber(proPlan.duration_days) })}
                        topRightBadge={t('plans.popular')}
                        topRightBadgeTone="pro"
                        icon={<Crown size={17} />}
                        pricePkr={proPlan.price_pkr}
                        cadenceLabel={cadenceShort}
                        priceKobans={proPlan.price_kobans}
                        regularPricePkr={proPlan.regular_price_pkr}
                        priceSubtext={
                          planStatus.isPersonalPro && !effectiveIsPlus && planStatus.expiryFormatted
                            ? t('plans.activeUntil', { date: planStatus.expiryFormatted })
                            : proPlan.description
                        }
                        features={proPlan.features}
                        featured={false}
                        accentVariant="pro"
                        ctaLabel={proCtaLabel}
                        ctaIcon={<Crown size={15} />}
                        ctaVariant={proCtaDisabled ? 'disabled-current' : 'primary-red'}
                        ctaDisabled={proCtaDisabled}
                        onCtaClick={() => handleOpenProCheckout(proPlan.id)}
                      />

                      <PlanCard
                        title="Boardly Plus"
                        subtitle={
                          membershipBilling === 'annual'
                            ? t('plans.annualPassDays', { days: formatNumber(plusPlan.duration_days) })
                            : t('plans.monthlyPassDays', { days: formatNumber(plusPlan.duration_days) })
                        }
                        durationBadge={t('plans.daysCount', { days: formatNumber(plusPlan.duration_days) })}
                        topRightBadge={t('plans.bestValue')}
                        topRightBadgeTone="plus"
                        icon={<Sparkles size={17} />}
                        pricePkr={plusPlan.price_pkr}
                        cadenceLabel={cadenceShort}
                        priceKobans={plusPlan.price_kobans}
                        regularPricePkr={plusPlan.regular_price_pkr}
                        priceSubtext={
                          effectiveIsPlus && planStatus.expiryFormatted
                            ? t('plans.activeUntil', { date: planStatus.expiryFormatted })
                            : planStatus.isPersonalPro
                            ? proToPlusCreditDays > 0
                              ? t('plans.unusedProCreditedDays', { days: formatNumber(proToPlusCreditDays) })
                              : t('plans.unusedProCredited')
                            : plusPlan.description
                        }
                        features={plusPlan.features}
                        featured={true}
                        accentVariant="plus"
                        ctaLabel={plusCtaLabel}
                        ctaIcon={<Sparkles size={15} />}
                        ctaVariant="primary-plus"
                        onCtaClick={() => handleOpenProCheckout(plusPlan.id)}
                      />
                    </>
                  );
                })()}
              </div>
            )}

            {/* "What you get with Pro & Plus" 4-bullet list */}
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  {t('plans.whatYouGet')}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {t('plans.fullScholarAccess')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PRO_HIGHLIGHT_BULLETS.map((item, idx) => {
                  const icons = [
                    <BookOpen key="b" className="w-4 h-4 text-[#E8342A]" />,
                    <Sparkles key="s" className="w-4 h-4 text-[#E8342A]" />,
                    <BarChart3 key="c" className="w-4 h-4 text-[#E8342A]" />,
                    <Crown key="r" className="w-4 h-4 text-[#E8342A]" />,
                  ];
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#E8342A]/10 border border-[#E8342A]/25 flex items-center justify-center shrink-0">
                          {icons[idx % icons.length]}
                        </div>
                        <span className="font-heading font-bold text-xs sm:text-[13px] text-[var(--text-primary)] leading-snug">
                          {t(`plans.highlight_${idx}_title`)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {t(`plans.highlight_${idx}_desc`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Small FAQ at the bottom of Boardly Pro tab */}
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#E8342A]" />
                <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  {t('plans.faqTitle')}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planFaqItems.map((faq, idx) => (
                  <div
                    key={faq.question}
                    className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 space-y-1.5"
                  >
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                      {t(`plans.faq_${idx}_q`)}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {t(`plans.faq_${idx}_a`)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[var(--border)] flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{t('plans.refundPolicy')}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Compact Collapsible Active Loadout Card */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden transition-all">
              {/* Compact Header Row */}
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setLoadoutExpanded((prev) => !prev)}
                  className="flex items-center gap-2.5 min-w-0 text-start flex-1"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#E11D2A]/15 border border-[#E11D2A]/30 flex items-center justify-center text-[#E11D2A] shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                        {isPreviewingAny ? t('store.liveTryOn') : t('store.activeLoadout')}
                      </span>
                      {isPreviewingAny && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[var(--koban-bg)] text-[var(--koban)] border border-[var(--koban-border)]">
                          {t('store.previewing')}
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
                      ).join(' · ') || t('store.defaultStyling')}
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
                      <span>{t('common.reset')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLoadoutExpanded((prev) => !prev)}
                    aria-label={
                      loadoutExpanded
                        ? t('store.hide')
                        : t('store.preview')
                    }
                    className="h-7 px-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-secondary)] inline-flex items-center gap-1"
                  >
                    <span>{loadoutExpanded ? t('store.hide') : t('store.preview')}</span>
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
                              uid={user?.uid}
                              seed={user?.uid}
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
                            <AvatarPicture
                              uid={user?.uid}
                              seed={user?.uid}
                              size={54}
                              animated={false}
                            />
                          </AvatarFrame>
                        )}
                        <div className="flex-1 text-center sm:text-start space-y-1 min-w-0">
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
                              {t('profile.scholar')}
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
                        { key: 'banner', label: t('store.cat_banner'), val: activeBanner },
                        { key: 'avatar', label: t('store.cat_avatar'), val: activeAvatar },
                        { key: 'frame', label: t('store.cat_frame'), val: activeFrame },
                        { key: 'effect', label: t('store.cat_effect'), val: activeEffect },
                        { key: 'nameplate', label: t('store.cat_nameplate'), val: activeNameplate },
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
                              {itemObj ? itemObj.name : t('common.none')}
                            </span>
                          </div>
                          {slot.val && equipped[slot.key] === slot.val && (
                            <button
                              type="button"
                              onClick={() => equipCosmetic(slot.key, null)}
                              className="text-[10px] font-bold text-red-400 hover:text-red-300 shrink-0"
                            >
                              {t('common.clear')}
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
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('store.searchPlaceholder')}
                  aria-label={t('store.searchPlaceholder')}
                  className="w-full h-10 ps-10 pe-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('common.clear')}
                    className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-muted)] absolute end-2 top-1/2 -translate-y-1/2"
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
                  <span>{t('store.filters')}</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#E11D2A] text-white text-[10px] font-black flex items-center justify-center ltr-nums">
                      {formatNumber(activeFilterCount)}
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
                    <span>{t('store.clearAll')}</span>
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
                  <span>{selectionMode ? t('store.cancelSelect') : t('store.select')}</span>
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
                      ? t('store.emptyCollectionTitle')
                      : t('store.emptyFilteredTitle')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                    {activeTab === 'collection'
                      ? t('store.emptyCollectionDesc')
                      : t('store.emptyFilteredDesc')}
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
                      <span>{t('store.clearFilters')}</span>
                    </button>
                  )}
                  {activeTab === 'collection' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-extrabold text-[var(--text-primary)]"
                    >
                      {t('store.browseAllItems')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredItems.map((item, itemIdx) => {
                  const itemOwned = isItemOwned(item.id);
                  const itemEquipped = isItemEquipped(item);
                  const itemInCart = isInCart(item.id);
                  const itemSelected = selectedIds.includes(item.id);

                  const itemPurchasing =
                    purchasingSingle && confirmBuyItem?.id === item.id;

                  const itemsPerBlock = storeRowsEveryN * storeGridCols;
                  const showRowDividerAfter =
                    itemsPerBlock > 0 &&
                    (itemIdx + 1) % itemsPerBlock === 0 &&
                    itemIdx < filteredItems.length - 1;

                  return (
                    <React.Fragment key={item.id}>
                      <StoreCard
                        item={item}
                        userDisplayName={displayName}
                        userUid={user?.uid}
                        isOwned={itemOwned}
                        isEquipped={itemEquipped}
                        isInCart={itemInCart}
                        selectionMode={selectionMode}
                        isSelected={itemSelected}
                        disabled={purchasingSingle || cartProcessing}
                        isPurchasing={itemPurchasing}
                        onOpenDetail={(clicked) => {
                          if (purchasingSingleLockRef.current) return;
                          setConfirmBuyItem(null);
                          setCartOpen(false);
                          setDetailItemId(clicked.id);
                        }}
                        onToggleCart={(clicked) => {
                          if (purchasingSingleLockRef.current) return;
                          const res = toggleCartItem(clicked.id);
                          if (res === 'added') {
                            showToast('success', t('store.addedToCartToast', { name: clicked.name }));
                          }
                        }}
                        onBuyNow={() => {
                          if (purchasingSingleLockRef.current || cartProcessing) {
                            return;
                          }
                          if (isInCart(item.id)) {
                            handleOpenCart();
                          } else {
                            openSinglePurchaseConfirm(item);
                          }
                        }}
                        onEquipToggle={(clicked) => handleEquipToggle(clicked)}
                        onToggleSelect={handleToggleSelectCard}
                        onEnterSelectionMode={handleEnterSelectionMode}
                      />
                      {showRowDividerAfter && (
                        <AdSlot
                          slotId="store_rows"
                          instanceKey={`store-${itemIdx}`}
                          wrapperClassName="col-span-full my-6 sm:my-8"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky Multi-Select Bar (above floating bottom nav, hidden when cart drawer is open) */}
      {selectionMode && !cartOpen && (
        <div className="fixed inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg bottom-[calc(86px+env(safe-area-inset-bottom,0px))] z-40 rounded-2xl bg-[var(--bg-card)] border border-[#E11D2A]/50 shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-[var(--text-primary)] truncate">
              {t('store.selectedCount', { count: formatNumber(selectedIds.length) })} ·{' '}
              <span className="text-[#E11D2A] tabular-nums ltr-nums">
                {formatNumber(selectedItemsTotalKobans)} Kobans
              </span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {t('store.tapToToggle')}
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
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleAddSelectedToCart}
              className="h-9 px-3.5 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs font-black shadow-sm transition-all disabled:opacity-50"
            >
              {t('store.addToCart')}
            </button>
          </div>
        </div>
      )}

      {/* Floating Cart Pill (bottom-end, above floating nav; hidden when cart is empty or cart/pro drawer is open) */}
      {cartItems.length > 0 && !selectionMode && !cartOpen && !proCheckoutOpen && (
        <button
          type="button"
          onClick={handleOpenCart}
          aria-label={t('cart.title')}
          className={`fixed end-4 sm:end-6 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-40 h-12 px-4 rounded-full bg-[#E11D2A] hover:bg-[#c81824] text-white shadow-xl border border-white/20 flex items-center gap-2 text-xs sm:text-sm font-black transition-all active:scale-95 ${
            cartPillBounce ? 'scale-110 ring-4 ring-[#E11D2A]/40' : ''
          }`}
        >
          <span role="img" aria-hidden="true" className="text-base leading-none">
            🛒
          </span>
          <span className="tabular-nums ltr-nums">{formatNumber(cartItems.length)}</span>
          <span className="opacity-60">·</span>
          <KobanIcon size={15} />
          <span className="tabular-nums ltr-nums">
            {formatNumber(cartTotalKobans)}
          </span>
        </button>
      )}

      {/* Item Detail Bottom Sheet / Modal (only rendered when confirmBuyItem is not open so only ONE modal exists at a time) */}
      {detailItem &&
        !confirmBuyItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              data-fullscreen-modal="true"
              aria-hidden="true"
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
              onClick={() => setDetailItemId(null)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={detailItem.name}
              className="fixed inset-0 z-[205] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
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
                style={{
                  backgroundColor: isDark ? '#0F0F14' : '#FFFFFF',
                  color: isDark ? '#FFFFFF' : '#111114',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                }}
                className="pointer-events-auto w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--bg-card)] border-t sm:border border-[var(--border)] shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
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
                      aria-label={t('common.previous')}
                      className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4 rtl-mirror" />
                    </button>
                    <button
                      type="button"
                      disabled={filteredItems.length <= 1}
                      onClick={() => handleNavigateDetail('next')}
                      aria-label={t('common.next')}
                      className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4 rtl-mirror" />
                    </button>
                    {detailIndex >= 0 && (
                      <span className="text-[11px] font-bold text-[var(--text-muted)] ms-1 tabular-nums ltr-nums">
                        {formatNumber(detailIndex + 1)} / {formatNumber(filteredItems.length)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/store/${encodeURIComponent(detailItem.id)}`;
                        navigator.clipboard?.writeText(shareUrl).then(() => {
                          showToast('success', t('store.linkCopied'));
                        });
                      }}
                      aria-label={t('common.share')}
                      className="h-8 px-3 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{t('common.share')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailItemId(null)}
                      aria-label={t('common.close')}
                      className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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
                        <AvatarPicture
                          uid={user?.uid}
                          seed={user?.uid}
                          avatarId={activeAvatar || undefined}
                          size={82}
                          animated={false}
                        />
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
                              {t(`store.rarity_${detailItem.rarity}`)}
                            </span>
                          );
                        })()}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                          {t(`store.cat_${detailItem.type}`)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--koban-bg)] border border-[var(--koban-border)] text-[var(--koban)] inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{t('store.animated')}</span>
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
                        {t('store.unlockPrice')}
                      </span>
                      <div className="text-end">
                        <div className="inline-flex items-center gap-1.5 font-black text-base tabular-nums ltr-nums text-[var(--text-primary)]">
                          <KobanIcon size={17} />
                          <span>{formatNumber(detailItem.price)} Kobans</span>
                        </div>
                        <p className="text-[10px] font-semibold text-[var(--text-muted)] ltr-nums">
                          PKR {formatNumber(detailItem.price / 10)} · 10 Kobans = PKR 1
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
                        <span>{t('store.previewOnProfile')}</span>
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
                              ? t('store.unequipItem')
                              : t('store.equipNow')}
                          </span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            disabled={purchasingSingle}
                            onClick={() => {
                              const action = toggleCartItem(detailItem.id);
                              showToast(
                                'success',
                                action === 'added'
                                  ? t('store.addedToCartToast', { name: detailItem.name })
                                  : t('store.removedFromCartToast', { name: detailItem.name })
                              );
                            }}
                            className={`h-11 px-3 rounded-xl text-xs sm:text-sm font-extrabold border inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 ${
                              isInCart(detailItem.id)
                                ? 'bg-[#E11D2A]/15 border-[#E11D2A]/50 text-[#E11D2A]'
                                : 'bg-[var(--bg-elevated)] hover:bg-[var(--border)] border-[var(--border)] text-[var(--text-primary)]'
                            }`}
                          >
                            {isInCart(detailItem.id) ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>{t('store.inCart')}</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>{t('store.addToCart')}</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={purchasingSingle}
                            onClick={() => {
                              openSinglePurchaseConfirm(detailItem);
                            }}
                            className="h-11 px-3 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
                          >
                            <KobanIcon size={15} />
                            <span className="ltr-nums">
                              {t('store.buyForPrice', { price: formatNumber(detailItem.price) })}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* Single-Item Instant Purchase Confirmation Modal (Separate Backdrop + Solid Surface) */}
      {confirmBuyItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              data-fullscreen-modal="true"
              aria-hidden="true"
              className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm"
              onClick={() => {
                if (!purchasingSingle) closeConfirmBuySheet();
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={
                singlePurchaseSuccess
                  ? t('cart.purchaseComplete')
                  : t('store.confirmUnlockTitle')
              }
              className="fixed inset-0 z-[215] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: isDark ? '#0F0F14' : '#FFFFFF',
                  color: isDark ? '#FFFFFF' : '#111114',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                }}
                className="pointer-events-auto w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[var(--bg-card)] border-t sm:border border-[var(--border)] shadow-2xl overflow-hidden p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    {singlePurchaseSuccess
                      ? t('store.unlockedAndEquippedTitle')
                      : purchasingSingle
                      ? t('store.unlockingItem')
                      : t('store.confirmUnlockTitle')}
                  </h3>
                  <button
                    type="button"
                    disabled={purchasingSingle}
                    onClick={closeConfirmBuySheet}
                    aria-label={t('common.close')}
                    className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {singlePurchaseSuccess ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-0.5">
                        <p className="font-extrabold text-[var(--text-primary)]">
                          {t('store.itemInCollection', { name: singlePurchaseSuccess.item.name })}
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          {t('store.autoEquippedNote')}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)] font-semibold">
                          {t('store.unlockedItemLabel')}
                        </span>
                        <span className="font-extrabold text-[var(--text-primary)]">
                          {singlePurchaseSuccess.item.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[var(--text-secondary)] font-semibold">
                          {t('cart.newBalance')}
                        </span>
                        <span className="inline-flex items-center gap-1 font-black tabular-nums ltr-nums text-emerald-700 dark:text-emerald-400">
                          <KobanIcon size={14} />
                          {formatNumber(singlePurchaseSuccess.newBalance)} Kobans
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeConfirmBuySheet}
                      className="w-full h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>{t('common.done')}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)] font-semibold">
                          {t('store.itemLabel')}
                        </span>
                        <span className="font-extrabold text-[var(--text-primary)]">
                          {confirmBuyItem.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)] font-semibold">
                          {t('store.priceLabel')}
                        </span>
                        <span className="inline-flex items-center gap-1 font-black tabular-nums ltr-nums text-[var(--text-primary)]">
                          <KobanIcon size={14} />
                          {formatNumber(isSuperAdmin ? 0 : confirmBuyItem.price)} Kobans
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[var(--text-secondary)] font-semibold">
                          {t('cart.yourBalance')}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold tabular-nums ltr-nums text-[var(--text-primary)]">
                          <KobanIcon size={13} />
                          {!balanceLoaded || kobanBalance === null ? (
                            <span className="inline-block w-12 h-3.5 rounded-md skeleton" aria-hidden="true" />
                          ) : (
                            `${formatNumber(kobanBalance)} Kobans`
                          )}
                        </span>
                      </div>
                    </div>

                    {singlePurchaseError && (
                      <div className="p-3 rounded-xl bg-[#E11D2A]/10 border border-[#E11D2A]/35 flex items-start gap-2.5 text-xs text-[#E11D2A]">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="font-bold leading-snug">
                          {singlePurchaseError}
                        </span>
                      </div>
                    )}

                    {isGuest || user?.uid.startsWith('guest_') ? (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#E11D2A]">
                          {t('store.guestCannotPurchase')}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            closeConfirmBuySheet();
                            setDetailItemId(null);
                            navigate('/signup');
                          }}
                          className="w-full h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2"
                        >
                          <span>{t('auth.createAccount')}</span>
                        </button>
                      </div>
                    ) : !isSuperAdmin && balance < confirmBuyItem.price ? (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#E11D2A]">
                          {t('store.needMoreKobans', { amount: formatNumber(confirmBuyItem.price - balance) })}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const deficit = Math.max(
                              500,
                              confirmBuyItem.price - balance
                            );
                            closeConfirmBuySheet();
                            setGetKobansInitialAmount(deficit);
                            setGetKobansOpen(true);
                          }}
                          className="w-full h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2"
                        >
                          <KobanIcon size={15} />
                          <span>{t('store.getMoreKobans')}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          disabled={purchasingSingle}
                          onClick={closeConfirmBuySheet}
                          className="flex-1 h-11 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] disabled:opacity-50"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="button"
                          disabled={purchasingSingle}
                          onClick={handleConfirmSinglePurchase}
                          className="flex-1 h-11 rounded-xl bg-[#E11D2A] hover:bg-[#c81824] text-white text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {purchasingSingle ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{t('store.unlockingShort')}</span>
                            </>
                          ) : (
                            <>
                              <KobanIcon size={15} />
                              <span className="ltr-nums">
                                {t('store.buyForShort', { price: formatNumber(isSuperAdmin ? 0 : confirmBuyItem.price) })}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>,
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
        userUid={user?.uid}
        processing={cartProcessing}
        errorMessage={cartError}
        flaggedItemsNotice={flaggedItemsNotice}
        completedOrder={completedOrder}
        equippingOrder={equippingOrder}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCartItems}
        onCheckout={handleCartCheckout}
        onOpenGetKobans={() => {
          const deficit = Math.max(500, cartTotals.deficit);
          setCartOpen(false);
          setGetKobansInitialAmount(deficit);
          setGetKobansOpen(true);
        }}
        onEquipPurchased={handleEquipPurchasedOrder}
        onViewCollection={handleViewCollectionAfterOrder}
      />

      {/* Dedicated Boardly Pro Checkout Sheet */}
      <ProCheckoutSheet
        open={proCheckoutOpen}
        onClose={() => setProCheckoutOpen(false)}
        initialPlanId={proCheckoutPlanId}
        uid={user?.uid}
        userEmail={user?.email || userProfile?.email}
        userName={displayName}
        kobanBalance={kobanBalance}
        balanceLoaded={balanceLoaded}
        currentProExpiresAt={rawProExpiresAt}
        hasPendingProRequest={Boolean(pendingProRequest)}
        onOpenGetKobans={(needed) => {
          setProCheckoutOpen(false);
          setGetKobansInitialAmount(needed);
          setGetKobansOpen(true);
        }}
        onSuccess={({ mode }) => {
          loadStudentProRequests();
          if (mode === 'kobans') {
            triggerCoinBurst();
          }
        }}
        onStartPracticing={() => navigate('/practice')}
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
