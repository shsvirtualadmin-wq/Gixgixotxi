import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { PageMeta } from '@/components/ui/PageMeta';
import { KobanAmount, KobanChip } from '@/components/koban/KobanIcon';
import { COSMETICS_CATALOG, getCosmeticById, type CosmeticItem } from '@/data/cosmeticsCatalog';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  CosmeticEffect,
  ProfileEffectCardPreview,
} from '@/components/koban/CosmeticRenderers';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { GetKobansModal } from '@/components/koban/GetKobansModal';
import { CoinBurstEffect } from '@/components/koban/CoinBurstEffect';
import { fetchStoreItems } from '@/services/storePricingService';
import {
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShoppingBag,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import type { CosmeticType, CosmeticRarity, EquippedCosmetics } from '@/types';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

type MainView = 'home' | 'browse' | 'collection';
type AnimationFilter = 'all' | 'animated' | 'static';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name';

export function StorePage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { balance, owned, equipped, equipCosmetic, purchaseCosmetic, isSuperAdmin } = useWallet();

  // Dynamic pricing map from Firestore store_items collection
  const [storePricesMap, setStorePricesMap] = useState<Record<string, { price: number; active: boolean }>>({});

  useEffect(() => {
    let mounted = true;
    fetchStoreItems()
      .then((items) => {
        if (!mounted) return;
        const map: Record<string, { price: number; active: boolean }> = {};
        items.forEach((it) => {
          map[it.id] = { price: it.priceKobans, active: it.active };
        });
        setStorePricesMap(map);
      })
      .catch((err) => console.warn('[StorePage] load dynamic prices error:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Navigation states
  const [activeView, setActiveView] = useState<MainView>('home');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CosmeticType>('all');
  const [animationFilter, setAnimationFilter] = useState<AnimationFilter>('all');
  const [rarityFilter] = useState<'all' | CosmeticRarity>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Item detail sheet state
  const [selectedDetailItem, setSelectedDetailItem] = useState<(CosmeticItem & { active?: boolean }) | null>(null);

  // Equip / Buy state
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [equipNotice, setEquipNotice] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showCoinBurst, setShowCoinBurst] = useState(false);

  // Get Kobans modal state
  const [isGetKobansOpen, setIsGetKobansOpen] = useState(false);
  const [getKobansInitialAmount, setGetKobansInitialAmount] = useState<number>(1000);

  // Open Get Kobans modal if path is /store/get-kobans
  useEffect(() => {
    if (location.pathname === '/store/get-kobans') {
      setIsGetKobansOpen(true);
    }
  }, [location.pathname]);

  const isLoggedIn = Boolean(user?.uid);
  const cleanDisplayName = sanitizeStudentDisplayName(
    profile?.displayName || user?.displayName,
    profile?.shortId || user?.uid
  );

  // Filter items matching single source of truth + dynamic store_items prices
  const filteredCatalog = useMemo(() => {
    const list = COSMETICS_CATALOG.map((item) => {
      const live = storePricesMap[item.id];
      if (live) {
        return {
          ...item,
          priceKobans: live.price,
          active: live.active,
        };
      }
      return { ...item, active: true };
    }).filter((item) => {
      // If inactive and not Super Admin, hide from normal students
      if (item.active === false && !isSuperAdmin) {
        return false;
      }
      // 1. Category Filter
      if (selectedCategory !== 'all' && item.type !== selectedCategory) {
        return false;
      }
      // 2. Animation Filter: matches item.animated flag exactly
      if (animationFilter === 'animated' && !item.animated) {
        return false;
      }
      if (animationFilter === 'static' && item.animated) {
        return false;
      }
      // 3. Rarity Filter
      if (rarityFilter !== 'all' && item.rarity !== rarityFilter) {
        return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.priceKobans - b.priceKobans);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.priceKobans - a.priceKobans);
    }
    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [selectedCategory, animationFilter, rarityFilter, sortBy, storePricesMap, isSuperAdmin]);

  // Dedicated type filter for My Collection
  const [collectionCategory, setCollectionCategory] = useState<CosmeticType | 'all'>('all');

  // Owned items for My Collection view: maps every id in owned[], ensuring 100% of owned items are displayed
  const allOwnedItems = useMemo(() => {
    const uniqueOwned = Array.from(new Set(owned));
    return uniqueOwned.map((id) => {
      const catalogItem = getCosmeticById(id);
      if (catalogItem) return catalogItem;

      let type: CosmeticType = 'avatar';
      if (id.startsWith('frame') || id.includes('frame')) type = 'frame';
      else if (id.startsWith('plate') || id.includes('plate') || id.includes('nameplate')) type = 'nameplate';
      else if (id.startsWith('effect') || id.includes('effect')) type = 'effect';
      else if (id.startsWith('ban_') || id.includes('banner')) type = 'banner';
      else if (id.startsWith('pfp') || id.startsWith('avatar')) type = 'avatar';

      const retiredItem: CosmeticItem & { isRetired?: boolean } = {
        id,
        name: `Retired Drop (${id})`,
        type,
        priceKobans: 0,
        rarity: 'rare',
        description: 'This legacy drop is retired from the active store catalog but remains permanently unlocked in your personal collection.',
        animated: false,
        isAnimated: false,
        previewColor: '#6B7280',
        isRetired: true,
      };
      return retiredItem;
    });
  }, [owned]);

  const filteredCollectionItems = useMemo(() => {
    if (collectionCategory === 'all') return allOwnedItems;
    return allOwnedItems.filter((item) => item.type === collectionCategory);
  }, [allOwnedItems, collectionCategory]);

  const handleEquip = async (item: CosmeticItem) => {
    if (!isLoggedIn) {
      navigate('/login?redirect=/store');
      return;
    }
    setEquippingId(item.id);
    try {
      const isCurrentlyEquipped = equipped[item.type] === item.id;
      await equipCosmetic(item.type, isCurrentlyEquipped ? null : item.id);
      setEquipNotice(isCurrentlyEquipped ? `Unequipped ${item.name}` : `Equipped ${item.name}!`);
      setTimeout(() => setEquipNotice(null), 2500);
    } catch (err: unknown) {
      setPurchaseError((err as Error).message || 'Failed to equip cosmetic');
    } finally {
      setEquippingId(null);
    }
  };

  const handlePurchase = async (item: CosmeticItem) => {
    if (!isLoggedIn) {
      navigate('/login?redirect=/store');
      return;
    }

    if (balance < item.priceKobans) {
      setPurchaseError(`Insufficient Kobans. Need ${item.priceKobans - balance} more Kobans.`);
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      await purchaseCosmetic(item);
      setShowCoinBurst(true);
      setTimeout(() => setShowCoinBurst(false), 2000);
      setEquipNotice(`Unlocked ${item.name}! You can now equip it to your profile.`);
      setTimeout(() => setEquipNotice(null), 3000);
    } catch (err: unknown) {
      console.error(
        '[StorePage] unlock error:',
        (err as any)?.code || 'ERROR',
        `users/${user?.uid}/unlocked/${item.id}`,
        err
      );
      setPurchaseError((err as Error).message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const selectCategoryFromTile = (cat: CosmeticType) => {
    setSelectedCategory(cat);
    setActiveView('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageMeta
        title="Boardly Store — 100 Cosmetic Drops, Profile Pictures & Effects"
        description="Equip anime-inspired Profile Pictures, ornate Avatar Frames, Nameplates, and Profile Effects. 10 Kobans = PKR 1."
      />

      {showCoinBurst && <CoinBurstEffect />}

      {/* Main Container with pb-32 bottom padding so bottom nav never covers cards */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-6 text-[var(--text)] pb-32">
        {/* ─── DASHBOARD COMPACT TOP BAR (When inside dashboard / logged-in) ──── */}
        {isLoggedIn && (
          <div className="sticky top-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2.5 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeView !== 'home') {
                    setActiveView('home');
                    setSelectedCategory('all');
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="p-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-colors cursor-pointer"
                title="Go back"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#E8A317]" />
                <span className="font-heading font-extrabold text-sm sm:text-base text-[var(--text)] tracking-tight">
                  Boardly Store
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <KobanChip balance={balance} />
              <button
                type="button"
                onClick={() => {
                  setGetKobansInitialAmount(1000);
                  setIsGetKobansOpen(true);
                }}
                className="btn-red text-xs py-1.5 px-3 rounded-xl font-bold flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus size={13} />
                <span>Get Kobans</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── PUBLIC TOP HEADER (When logged out) ───────────────────────────── */}
        {!isLoggedIn && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#E8A317]/15 border border-[#E8A317]/30 flex items-center justify-center text-[#E8A317]">
                  <ShoppingBag size={18} />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-[var(--text)] tracking-tight">
                  Boardly Store
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Customize your identity with full-art Profile Pictures, Avatar Frames, Chat Nameplates, and Profile Effects.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to="/kobans"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>About Kobans</span>
                <ChevronRight size={13} />
              </Link>
              <Link
                to="/login?redirect=/store"
                className="btn-red text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span>Sign In to Unlock</span>
              </Link>
            </div>
          </div>
        )}

        {/* ─── EQUIPPED LOADOUT CARD (Uses shared AvatarFrame, AvatarPicture, Nameplate) ──── */}
        {isLoggedIn && (
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm group">
            {/* Single Source of Truth: Equipped Profile Banner */}
            <div className="absolute inset-0 pointer-events-none -z-10 opacity-70 transition-opacity group-hover:opacity-85">
              <BannerRenderer
                bannerId={equipped.banner}
                accentColor={profile?.accent || '#D71921'}
                animated={true}
                showReadabilityOverlay={true}
              />
            </div>
            {/* Readability backdrop so nameplate and buttons remain distinct */}
            <div className="absolute inset-0 bg-black/45 dark:bg-black/60 backdrop-blur-[2px] pointer-events-none -z-10" />

            <Link
              to="/dashboard/profile"
              className="flex items-center gap-4 min-w-0 w-full sm:w-auto hover:opacity-90 transition-opacity cursor-pointer group"
              title="Open your profile"
            >
              <div className="relative shrink-0">
                <CosmeticEffect itemId={equipped.effect || 'none'} size={68}>
                  <AvatarFrame itemId={equipped.frame || 'none'} size={68}>
                    <AvatarPicture
                      avatarId={equipped.avatar}
                      avatarKey={profile?.avatarKey || 'skull-01'}
                      variant={profile?.avatarVariant || 'red-on-black'}
                      seed={user?.uid}
                      size={52}
                    />
                  </AvatarFrame>
                </CosmeticEffect>
              </div>
              <div className="min-w-0 space-y-1">
                <span className="text-[11px] text-[var(--muted)] uppercase font-heading font-semibold block group-hover:text-red-400 transition-colors">
                  Your Equipped Loadout · View Profile →
                </span>
                <Nameplate
                  itemId={equipped.nameplate || 'none'}
                  name={cleanDisplayName}
                  shortId={profile?.shortId || (user?.uid ? user.uid.slice(0, 5) : '00000')}
                  roleBadge={profile?.role === 'captain' ? 'CAPTAIN' : undefined}
                />
              </div>
            </Link>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setActiveView('collection')}
                className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
              >
                My Collection ({owned.length})
              </button>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-[var(--muted)] font-mono block">Syncs across app</span>
                <span className="text-[11px] text-emerald-400 font-semibold font-heading">Active Everywhere</span>
              </div>
            </div>
          </div>
        )}

        {equipNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-400 text-xs font-heading flex items-center gap-2 animate-in fade-in">
            <Check size={16} />
            <span>{equipNotice}</span>
          </div>
        )}

        {/* ─── NAVIGATION TABS: Store Home | Browse Catalog | My Collection ── */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeView === 'home'
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold shadow-sm'
                : 'text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)]'
            }`}
          >
            Store Overview
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('browse');
              setSelectedCategory('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeView === 'browse'
                ? 'bg-[var(--text)] text-[var(--bg)] font-bold shadow-sm'
                : 'text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)]'
            }`}
          >
            Browse All Drops (100)
          </button>
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setActiveView('collection')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'collection'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-bold shadow-sm'
                  : 'text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)]'
              }`}
            >
              <span>My Collection</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-mono">
                {owned.length}
              </span>
            </button>
          )}
        </div>

        {/* ─── VIEW 1: STORE HOME (4 CATEGORY TILES) ────────────────────────── */}
        {activeView === 'home' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-heading font-bold text-[var(--text)]">
                  Cosmetic Categories (100 Unique Drops)
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setActiveView('browse');
                  }}
                  className="text-xs text-[var(--muted)] hover:text-white flex items-center gap-1 font-heading cursor-pointer"
                >
                  <span>View All 100 Drops</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* 5 Category Tiles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Tile 1: Profile Banners */}
                <div
                  onClick={() => selectCategoryFromTile('banner')}
                  className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-400">
                      12 Flagships
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono">From 380 Kobans</span>
                  </div>

                  <div className="h-32 rounded-xl bg-[var(--surface-2)] overflow-hidden border border-[var(--border)] shadow-md group-hover:scale-[1.02] transition-transform">
                    <BannerRenderer bannerId="ban_starfall" animated={true} className="w-full h-full" showReadabilityOverlay={false} />
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text)] group-hover:text-amber-400 transition-colors">
                      Profile Banners
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                      Scenic Torii shrines, starfall meteors, rising embers, rain city skylines, and cosmic gates.
                    </p>
                  </div>
                </div>

                {/* Tile 2: Profile Pictures */}
                <div
                  onClick={() => selectCategoryFromTile('avatar')}
                  className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-red-500/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-red-500/40 bg-red-950/40 text-red-400">
                      25 Drops
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono">From 90 Kobans</span>
                  </div>

                  <div className="h-32 rounded-xl bg-[var(--surface-2)] flex items-center justify-center p-2">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                      <AvatarPicture avatarId="pfp_crimson_ronin" size={80} />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text)] group-hover:text-red-400 transition-colors">
                      Profile Pictures
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                      Full-art anime avatar scenes, Ronin silhouettes, kitsune spirits, and mythic beasts.
                    </p>
                  </div>
                </div>

                {/* Tile 3: Avatar Frames */}
                <div
                  onClick={() => selectCategoryFromTile('frame')}
                  className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-400">
                      25 Drops
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono">From 75 Kobans</span>
                  </div>

                  <div className="h-32 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
                    <AvatarFrame itemId="frame-neon-cyber" size={76}>
                      <AvatarPicture avatarKey="skull-01" variant="red-on-black" size={56} />
                    </AvatarFrame>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text)] group-hover:text-cyan-400 transition-colors">
                      Avatar Frames
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                      Concentric neon rings, flame flickers, antique bronze, and imperial laurel wreaths.
                    </p>
                  </div>
                </div>

                {/* Tile 4: Chat Nameplates */}
                <div
                  onClick={() => selectCategoryFromTile('nameplate')}
                  className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-950/40 text-purple-400">
                      25 Drops
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono">From 70 Kobans</span>
                  </div>

                  <div className="h-32 rounded-xl bg-[var(--surface-2)] flex items-center justify-center p-2 overflow-hidden">
                    <div className="w-full flex items-center justify-center overflow-hidden">
                      <Nameplate itemId="plate-galaxy-pioneer" name="Cosmic Pioneer" shortId="99012" className="max-w-full" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text)] group-hover:text-purple-400 transition-colors">
                      Chat Nameplates
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                      Cyber samurai badges, constellation gradients, slate scholar matrix pills, and syndicate stripes.
                    </p>
                  </div>
                </div>

                {/* Tile 5: Profile Effects */}
                <div
                  onClick={() => selectCategoryFromTile('effect')}
                  className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-pink-500/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-pink-500/40 bg-pink-950/40 text-pink-400">
                      25 Drops
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono">From 70 Kobans</span>
                  </div>

                  <div className="h-32 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
                    <CosmeticEffect itemId="effect-cherry-storm" size={78}>
                      <AvatarPicture avatarKey="skull-01" variant="red-on-black" size={54} />
                    </CosmeticEffect>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text)] group-hover:text-pink-400 transition-colors">
                      Profile Effects
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                      Rising embers, electric discharge arcs, sakura storms, and divine celestial radiance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Highlight Strip */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#D71920]/15 via-[#E8A317]/10 to-transparent border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-[11px] font-mono uppercase font-bold text-[#FFD66B]">
                  Official Kobans Economy
                </span>
                <h3 className="text-lg sm:text-xl font-heading font-extrabold text-[var(--text)]">
                  Need Kobans to Unlock Custom Drops?
                </h3>
                <p className="text-xs text-[var(--muted)] max-w-lg">
                  Starting at PKR 50 for 500 Kobans (10 Kobans = PKR 1). Verified manually by superadmins via JazzCash and EasyPaisa.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGetKobansInitialAmount(1000);
                  setIsGetKobansOpen(true);
                }}
                className="btn-red text-xs px-5 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 cursor-pointer shadow-lg"
              >
                <Plus size={16} />
                <span>Get Kobans Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── VIEW 2: BROWSE CATALOG (FILTERS + 100 ITEMS GRID) ─────────────── */}
        {activeView === 'browse' && (
          <div className="space-y-5">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3 shadow-xs">
              {/* Category Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-heading font-bold text-[var(--muted)] mr-1">Type:</span>
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'banner', label: 'Banners' },
                  { id: 'avatar', label: 'Profile Pictures' },
                  { id: 'frame', label: 'Avatar Frames' },
                  { id: 'nameplate', label: 'Chat Nameplates' },
                  { id: 'effect', label: 'Profile Effects' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id as 'all' | CosmeticType)}
                    className={`px-3 py-1 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-[var(--text)] text-[var(--bg)] font-bold'
                        : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Sub-Filters: Animation & Sort */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[var(--border)] text-xs">
                {/* Animated / Static filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[var(--muted)] font-heading font-semibold">Motion:</span>
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'animated', label: '✦ Animated Only' },
                    { id: 'static', label: 'Still Visual Only' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAnimationFilter(f.id as AnimationFilter)}
                      className={`px-2.5 py-0.8 rounded-lg text-xs font-heading transition-colors cursor-pointer ${
                        animationFilter === f.id
                          ? 'border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-bold'
                          : 'border border-[var(--border)] text-[var(--muted)] hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Price Sort */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={13} className="text-[var(--muted)]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] font-heading outline-none cursor-pointer"
                  >
                    <option value="default">Featured Order</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredCatalog.map((item) => {
                const isOwned = owned.includes(item.id);
                const isEquipped = equipped[item.type] === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedDetailItem(item);
                      setPurchaseError(null);
                    }}
                    className={`p-3 sm:p-4 rounded-2xl bg-[var(--card)] border transition-all cursor-pointer group flex flex-col justify-between gap-3 ${
                      isEquipped
                        ? 'border-emerald-500/80 shadow-[0_0_14px_rgba(16,185,129,0.22)]'
                        : isOwned
                        ? 'border-[var(--border)] hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : item.rarity === 'legendary'
                        ? 'border-amber-500/50 hover:border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                        : item.rarity === 'epic'
                        ? 'border-purple-500/40 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.16)]'
                        : item.rarity === 'rare'
                        ? 'border-blue-500/35 hover:border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.12)]'
                        : 'border-[var(--border)] hover:border-[var(--red)]/50'
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                      <span className={`uppercase font-bold ${
                        item.rarity === 'legendary' ? 'text-amber-400' : item.rarity === 'epic' ? 'text-purple-400' : item.rarity === 'rare' ? 'text-blue-400' : 'text-[var(--muted)]'
                      }`}>
                        {item.rarity}
                      </span>
                      {item.animated ? (
                        <span className="px-1.5 py-0.2 rounded-full border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-0.5">
                          ✦ Animated
                        </span>
                      ) : (
                        <span className="text-[var(--muted)]">Static</span>
                      )}
                    </div>

                    {/* Preview Canvas */}
                    <div className="h-28 rounded-xl bg-[var(--surface-2)] flex items-center justify-center p-2 relative overflow-hidden">
                      {item.type === 'avatar' && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md shrink-0">
                          <AvatarPicture avatarId={item.id} size={64} />
                        </div>
                      )}

                      {item.type === 'frame' && (
                        <div className="p-2 overflow-visible flex items-center justify-center shrink-0">
                          <AvatarFrame itemId={item.id} size={72}>
                            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#27272A] to-[#09090B] flex items-center justify-center shadow-inner">
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-500 fill-current opacity-60">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                              </svg>
                            </div>
                          </AvatarFrame>
                        </div>
                      )}

                      {item.type === 'nameplate' && (
                        <div className="w-full flex items-center justify-center overflow-hidden px-1">
                          <Nameplate itemId={item.id} name={cleanDisplayName} className="max-w-full" />
                        </div>
                      )}

                      {item.type === 'effect' && (
                        <div className="w-full h-full p-1">
                          <ProfileEffectCardPreview itemId={item.id} compact={true} />
                        </div>
                      )}

                      {item.type === 'banner' && (
                        <div className="w-full h-full rounded-lg overflow-hidden border border-[var(--border)] shadow-xs">
                          <BannerRenderer
                            bannerId={item.id}
                            animated={item.animated}
                            className="w-full h-full"
                            showReadabilityOverlay={false}
                          />
                        </div>
                      )}
                    </div>

                    {/* Meta & Price */}
                    <div>
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-[var(--text)] truncate group-hover:text-[var(--red)] transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Status / Price */}
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-xs">
                      {isEquipped ? (
                        <span className="text-emerald-400 font-bold font-heading text-[11px] flex items-center gap-1">
                          <Check size={12} /> Equipped
                        </span>
                      ) : isOwned ? (
                        <span className="text-amber-400 font-bold font-heading text-[11px]">
                          Owned
                        </span>
                      ) : (
                        <KobanAmount value={item.priceKobans} iconSize={13} className="text-[#FFD66B]" />
                      )}

                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        PKR {Math.round(item.priceKobans / 10)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VIEW 3: MY COLLECTION ────────────────────────────────────────── */}
        {activeView === 'collection' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border)] gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-bold text-[var(--text)]">
                  My Collection ({filteredCollectionItems.length})
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Showing {filteredCollectionItems.length} {collectionCategory === 'all' ? '' : collectionCategory} item{filteredCollectionItems.length === 1 ? '' : 's'} (You own {allOwnedItems.length} total). Equip any owned drop directly to your profile.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setActiveView('browse');
                }}
                className="btn-red text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-sm self-start sm:self-auto cursor-pointer"
              >
                <Plus size={14} />
                <span>Browse Store</span>
              </button>
            </div>

            {/* Collection Type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all' as const, label: 'All', count: allOwnedItems.length },
                { id: 'banner' as const, label: 'Banners', count: allOwnedItems.filter((i) => i.type === 'banner').length },
                { id: 'avatar' as const, label: 'Profile Pictures', count: allOwnedItems.filter((i) => i.type === 'avatar').length },
                { id: 'frame' as const, label: 'Frames', count: allOwnedItems.filter((i) => i.type === 'frame').length },
                { id: 'nameplate' as const, label: 'Nameplates', count: allOwnedItems.filter((i) => i.type === 'nameplate').length },
                { id: 'effect' as const, label: 'Effects', count: allOwnedItems.filter((i) => i.type === 'effect').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCollectionCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    collectionCategory === tab.id
                      ? 'bg-[var(--text)] text-[var(--bg)] font-bold shadow-xs'
                      : 'border border-[var(--border)] text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    collectionCategory === tab.id ? 'bg-[var(--bg)] text-[var(--text)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {filteredCollectionItems.length === 0 ? (
              <div className="py-12 text-center rounded-3xl bg-[var(--card)] border border-[var(--border)] p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#E8A317]/10 border border-[#E8A317]/30 flex items-center justify-center text-[#E8A317] mx-auto">
                  <ShoppingBag size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-[var(--text)]">
                    {allOwnedItems.length === 0 ? 'No Cosmetics Unlocked Yet' : 'No Items in This Category'}
                  </h3>
                  <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                    {allOwnedItems.length === 0
                      ? 'Browse the Boardly Store to unlock custom Profile Pictures, Avatar Frames, and Effects.'
                      : `You don't own any ${collectionCategory} drops yet. Switch categories or explore the store.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (allOwnedItems.length > 0) {
                      setCollectionCategory('all');
                    } else {
                      setSelectedCategory('all');
                      setActiveView('browse');
                    }
                  }}
                  className="btn-red text-xs px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{allOwnedItems.length > 0 ? 'Show All Owned Items' : 'Explore 100 Drops'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredCollectionItems.map((item) => {
                  const isEquipped = equipped[item.type as keyof EquippedCosmetics] === item.id;
                  const isRetired = Boolean((item as { isRetired?: boolean }).isRetired);
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl bg-[var(--card)] border transition-all flex flex-col justify-between gap-3 ${
                        isEquipped ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/30' : 'border-[var(--border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono gap-1">
                        <span className="uppercase text-[var(--muted)] truncate">{item.type}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isRetired && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-400">
                              Retired
                            </span>
                          )}
                          {isEquipped && (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              <Check size={11} /> Equipped
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="h-24 rounded-xl bg-[var(--surface-2)] flex items-center justify-center p-2 overflow-hidden relative">
                        {item.type === 'avatar' && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm shrink-0">
                            <AvatarPicture avatarId={item.id} size={56} />
                          </div>
                        )}
                        {item.type === 'frame' && (
                          <div className="p-2 overflow-visible flex items-center justify-center shrink-0">
                            <AvatarFrame itemId={item.id} size={64}>
                              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#27272A] to-[#09090B] flex items-center justify-center shadow-inner">
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-zinc-500 fill-current opacity-60">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                              </div>
                            </AvatarFrame>
                          </div>
                        )}
                        {item.type === 'nameplate' && (
                          <div className="w-full flex items-center justify-center overflow-hidden px-1">
                            <Nameplate itemId={item.id} name={cleanDisplayName} className="max-w-full" />
                          </div>
                        )}
                        {item.type === 'effect' && (
                          <div className="w-full h-full p-1">
                            {isRetired ? (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[var(--muted)] text-center">
                                Retired Aura
                              </div>
                            ) : (
                              <ProfileEffectCardPreview itemId={item.id} compact={true} />
                            )}
                          </div>
                        )}
                        {item.type === 'banner' && (
                          <div className="w-full h-full rounded-lg overflow-hidden border border-[var(--border)] shadow-xs">
                            <BannerRenderer
                              bannerId={item.id}
                              animated={item.animated}
                              className="w-full h-full"
                              showReadabilityOverlay={false}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-heading font-bold text-xs text-[var(--text)] truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-[var(--muted)] line-clamp-1 mt-0.5">
                          {isRetired ? 'Legacy unlocked item' : item.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={equippingId === item.id}
                        onClick={() => handleEquip(item)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isEquipped
                            ? 'border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-white'
                            : 'btn-red shadow-sm'
                        }`}
                      >
                        {equippingId === item.id ? 'Saving...' : isEquipped ? 'Unequip' : 'Equip'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── ITEM DETAIL SHEET (Modal / Live Preview on Own Card) ──────────── */}
        {selectedDetailItem && (
          <div
            className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-t-[28px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-0 sm:my-auto text-[var(--text)] max-h-[92vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                    {selectedDetailItem.rarity}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {selectedDetailItem.animated ? '✦ Animated' : 'Static Visual'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetailItem(null);
                    setPurchaseError(null);
                  }}
                  className="p-1 rounded-full text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)] cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Live Preview Canvas on Student's Loadout */}
              <div className="h-44 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center p-4 relative overflow-hidden">
                {selectedDetailItem.type === 'avatar' && (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl border border-[var(--border)]">
                    <AvatarPicture avatarId={selectedDetailItem.id} size={96} />
                  </div>
                )}

                {selectedDetailItem.type === 'frame' && (
                  <div className="p-4 overflow-visible flex items-center justify-center">
                    <AvatarFrame itemId={selectedDetailItem.id} size={96}>
                      <div className="w-full h-full rounded-full bg-gradient-to-b from-[#27272A] to-[#09090B] flex items-center justify-center shadow-inner">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-500 fill-current opacity-60">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                      </div>
                    </AvatarFrame>
                  </div>
                )}

                {selectedDetailItem.type === 'nameplate' && (
                  <div className="w-full max-w-sm mx-auto flex items-center justify-center overflow-hidden px-2">
                    <Nameplate
                      itemId={selectedDetailItem.id}
                      name={cleanDisplayName}
                      shortId={profile?.shortId || (user?.uid ? user.uid.slice(0, 5) : '00000')}
                      roleBadge={profile?.role === 'captain' ? 'CAPTAIN' : undefined}
                      className="max-w-full"
                    />
                  </div>
                )}

                {selectedDetailItem.type === 'effect' && (
                  <div className="w-full max-w-sm h-36">
                    <ProfileEffectCardPreview itemId={selectedDetailItem.id} />
                  </div>
                )}

                {selectedDetailItem.type === 'banner' && (
                  <div className="w-full h-36 rounded-xl overflow-hidden relative shadow-lg border border-[var(--border)]">
                    <BannerRenderer
                      bannerId={selectedDetailItem.id}
                      animated={selectedDetailItem.animated}
                      className="w-full h-full"
                      showReadabilityOverlay={true}
                    />
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-2 z-20 pointer-events-none">
                      <AvatarFrame itemId={equipped.frame || 'none'} size={38}>
                        <AvatarPicture avatarId={equipped.avatar} size={28} />
                      </AvatarFrame>
                      <Nameplate itemId={equipped.nameplate || 'none'} name={cleanDisplayName} />
                    </div>
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-[var(--text)]">
                    {selectedDetailItem.name}
                  </h3>
                  <KobanAmount value={selectedDetailItem.priceKobans} iconSize={16} className="text-[#FFD66B]" />
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {selectedDetailItem.description}
                </p>
              </div>

              {/* Price & Balance breakdown */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Price in PKR:</span>
                  <span className="font-bold text-[var(--text)]">
                    PKR {Math.round(selectedDetailItem.priceKobans / 10)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Your Koban Balance:</span>
                  <span className="font-bold text-[#FFD66B]">{balance.toLocaleString()} Kobans</span>
                </div>
                {!owned.includes(selectedDetailItem.id) && (
                  <div className="flex justify-between pt-1 border-t border-[var(--border)]">
                    <span>Balance After:</span>
                    <span
                      className={
                        balance >= selectedDetailItem.priceKobans
                          ? 'text-emerald-400 font-bold'
                          : 'text-red-400 font-bold'
                      }
                    >
                      {(balance - selectedDetailItem.priceKobans).toLocaleString()} Kobans
                    </span>
                  </div>
                )}
              </div>

              {purchaseError && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{purchaseError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2">
                {!isLoggedIn ? (
                  <Link
                    to="/login?redirect=/store"
                    className="btn-red w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Sign In to Unlock</span>
                    <ArrowRight size={14} />
                  </Link>
                ) : (isSuperAdmin || owned.includes(selectedDetailItem.id)) ? (
                  <button
                    type="button"
                    disabled={equippingId === selectedDetailItem.id}
                    onClick={() => handleEquip(selectedDetailItem)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      equipped[selectedDetailItem.type] === selectedDetailItem.id
                        ? 'border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-white'
                        : 'btn-red shadow-sm'
                    }`}
                  >
                    {equippingId === selectedDetailItem.id
                      ? 'Saving...'
                      : equipped[selectedDetailItem.type] === selectedDetailItem.id
                      ? 'Unequip Cosmetic'
                      : isSuperAdmin && !owned.includes(selectedDetailItem.id)
                      ? 'Equip for Free (Super Admin)'
                      : 'Equip to Profile'}
                  </button>
                ) : (selectedDetailItem.priceKobans === 0 || balance >= selectedDetailItem.priceKobans) ? (
                  <button
                    type="button"
                    disabled={purchasing}
                    onClick={() => handlePurchase(selectedDetailItem)}
                    className="btn-red w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Unlocking...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>
                          {selectedDetailItem.priceKobans === 0
                            ? 'Unlock for Free (0 Kobans)'
                            : `Unlock for ${selectedDetailItem.priceKobans.toLocaleString()} Kobans`}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGetKobansInitialAmount(Math.max(500, selectedDetailItem.priceKobans - balance));
                      setIsGetKobansOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#E8A317]/15 border border-[#E8A317]/40 text-[#FFD66B] hover:bg-[#E8A317]/25 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Get More Kobans</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Get Kobans Modal */}
        {isGetKobansOpen && (
          <GetKobansModal
            isOpen={isGetKobansOpen}
            onClose={() => setIsGetKobansOpen(false)}
            initialAmount={getKobansInitialAmount}
          />
        )}
      </div>
    </>
  );
}

export default StorePage;
