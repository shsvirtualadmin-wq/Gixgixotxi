import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Crown,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import {
  COSMETICS_CATALOG,
  type CosmeticItem,
  type CosmeticRarity,
  type CosmeticType,
} from '@/data/cosmeticsCatalog';
import type { EquippedCosmetics } from '@/types';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { ProfileCardEffect, Nameplate } from '@/components/koban/CosmeticRenderers';
import { computeLevelFromStats } from '@/components/profile/ProfileView';
import { PageMeta } from '@/components/ui/PageMeta';

type LockerCategoryTab =
  | 'all'
  | 'avatar'
  | 'frame'
  | 'banner'
  | 'nameplate'
  | 'effect';

const CATEGORY_TABS: Array<{ id: LockerCategoryTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'avatar', label: 'Avatars' },
  { id: 'frame', label: 'Frames' },
  { id: 'banner', label: 'Banners' },
  { id: 'nameplate', label: 'Nameplates' },
  { id: 'effect', label: 'Effects' },
];

const RARITY_STYLES: Record<
  CosmeticRarity,
  { label: string; tagClass: string; ringClass: string }
> = {
  mythic: {
    label: 'MYTHIC',
    tagClass:
      'bg-[#D71921]/25 text-red-200 border-[#D71921]/60 shadow-[0_0_14px_rgba(215,25,33,0.35)]',
    ringClass: 'border-[#D71921]/55',
  },
  legendary: {
    label: 'LEGENDARY',
    tagClass:
      'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    ringClass: 'border-amber-400/45',
  },
  epic: {
    label: 'EPIC',
    tagClass: 'bg-purple-500/20 text-purple-300 border-purple-400/45',
    ringClass: 'border-purple-400/40',
  },
  rare: {
    label: 'RARE',
    tagClass: 'bg-sky-500/20 text-sky-300 border-sky-400/45',
    ringClass: 'border-sky-400/40',
  },
  common: {
    label: 'COMMON',
    tagClass: 'bg-white/10 text-white/75 border-white/20',
    ringClass: 'border-white/18',
  },
};

function deriveDeterministicShortId(uid: string): string {
  if (!uid) return '10000';
  let hash = 2166136261;
  for (let i = 0; i < uid.length; i++) {
    hash ^= uid.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = (Math.abs(hash) % 90000) + 10000;
  return String(num);
}

export const LockerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, authProfile } = useAuth();
  const wallet = useWallet();

  const [activeCategory, setActiveCategory] = useState<LockerCategoryTab>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [savingEquip, setSavingEquip] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live try-on state (initializes from currently equipped items)
  const [previewEquipped, setPreviewEquipped] = useState<EquippedCosmetics>(() => ({
    ...(wallet.equipped || {}),
  }));

  useEffect(() => {
    setPreviewEquipped({ ...(wallet.equipped || {}) });
  }, [wallet.equipped]);

  // Owned items ONLY (Items not owned never show here)
  const ownedSet = useMemo(() => new Set(wallet.owned || []), [wallet.owned]);

  const ownedItems = useMemo(() => {
    const allowedTypes = new Set<CosmeticType>([
      'avatar',
      'frame',
      'banner',
      'nameplate',
      'effect',
    ]);
    return COSMETICS_CATALOG.filter(
      (item) =>
        allowedTypes.has(item.type) &&
        (ownedSet.has(item.id) || wallet.isSuperAdmin || item.priceKobans === 0)
    );
  }, [ownedSet, wallet.isSuperAdmin]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return ownedItems;
    return ownedItems.filter((item) => item.type === activeCategory);
  }, [ownedItems, activeCategory]);

  // Select first item automatically when category changes
  useEffect(() => {
    if (filteredItems.length > 0) {
      if (!selectedItemId || !filteredItems.some((i) => i.id === selectedItemId)) {
        setSelectedItemId(filteredItems[0].id);
      }
    } else {
      setSelectedItemId(null);
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem: CosmeticItem | null = useMemo(
    () => ownedItems.find((i) => i.id === selectedItemId) || null,
    [ownedItems, selectedItemId]
  );

  const isItemEquippedInWallet = useCallback(
    (item: CosmeticItem) => {
      return wallet.equipped?.[item.type] === item.id;
    },
    [wallet.equipped]
  );

  // Tap an item -> select it and apply live preview on stage immediately
  const handleSelectTile = useCallback((item: CosmeticItem) => {
    setSelectedItemId(item.id);
    setPreviewEquipped((prev) => ({
      ...prev,
      [item.type]: item.id,
    }));
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2400);
  };

  // Equip the selected item & write to user doc
  const handleEquipSelected = useCallback(
    async (itemToEquip?: CosmeticItem | null) => {
      const target = itemToEquip || selectedItem;
      if (!target || savingEquip) return;

      const alreadyEquipped = isItemEquippedInWallet(target);
      if (alreadyEquipped) return;

      setSavingEquip(true);
      try {
        await wallet.equipCosmetic(target.type, target.id);
        setPreviewEquipped((prev) => ({
          ...prev,
          [target.type]: target.id,
        }));
        showToast(`Equipped ${target.name}`);
      } catch (err: any) {
        showToast(err?.message || 'Failed to equip item');
      } finally {
        setSavingEquip(false);
      }
    },
    [selectedItem, savingEquip, isItemEquippedInWallet, wallet]
  );

  // Save all previewed items at once (Desktop Save button)
  const handleSaveAllPreviewed = async () => {
    if (savingEquip) return;
    setSavingEquip(true);
    try {
      await wallet.equipMultipleCosmetics(previewEquipped);
      showToast('Loadout saved to profile');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save loadout');
    } finally {
      setSavingEquip(false);
    }
  };

  const handleResetPreview = () => {
    setPreviewEquipped({ ...(wallet.equipped || {}) });
    showToast('Preview reset to equipped loadout');
  };

  // Keyboard navigation on Desktop: Arrow keys move selection, Enter equips
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      if (filteredItems.length === 0) return;
      const idx = filteredItems.findIndex((i) => i.id === selectedItemId);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = idx < 0 ? 0 : (idx + 1) % filteredItems.length;
        handleSelectTile(filteredItems[nextIdx]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx =
          idx <= 0 ? filteredItems.length - 1 : (idx - 1) % filteredItems.length;
        handleSelectTile(filteredItems[prevIdx]);
      } else if (e.key === 'Enter' && selectedItem) {
        e.preventDefault();
        void handleEquipSelected(selectedItem);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filteredItems, selectedItemId, selectedItem, handleSelectTile, handleEquipSelected]);

  const displayName =
    (authProfile as any)?.displayName ||
    profile?.nickname ||
    profile?.displayName ||
    user?.displayName ||
    'Student';
  const username = String(
    (authProfile as any)?.username || profile?.username || 'student'
  ).replace(/^@+/, '');
  const shortId = String(
    profile?.shortId || deriveDeterministicShortId(user?.uid || 'student')
  )
    .replace(/^#+/, '')
    .trim();

  const levelInfo = computeLevelFromStats({
    xp: (profile?.score || 0) + 120,
    streakDays: profile?.streak || 1,
    testsCompleted: profile?.testsCompleted || 0,
    questionsAnswered: profile?.totalQuestionsSolved || 0,
  });

  const equippedCount = useMemo(() => {
    return Object.values(wallet.equipped || {}).filter(
      (val) => Boolean(val) && val !== 'none'
    ).length;
  }, [wallet.equipped]);

  const stageAvatarId =
    previewEquipped.avatar ||
    wallet.equipped?.avatar ||
    profile?.equippedAvatar ||
    profile?.avatar ||
    'avatar-1';
  const stageFrameId =
    previewEquipped.frame ||
    wallet.equipped?.frame ||
    profile?.equippedFrame ||
    profile?.frame ||
    'none';
  const stageBannerId =
    previewEquipped.banner ||
    wallet.equipped?.banner ||
    profile?.banner ||
    'none';
  const stageNameplateId =
    previewEquipped.nameplate ||
    wallet.equipped?.nameplate ||
    profile?.nameplate ||
    'none';
  const stageEffectId =
    previewEquipped.effect || wallet.equipped?.effect || 'none';

  const activeCategoryIdx = Math.max(
    0,
    CATEGORY_TABS.findIndex((c) => c.id === activeCategory)
  );

  const renderItemVisual = (item: CosmeticItem) => {
    if (item.type === 'avatar') {
      return (
        <BoardlyAvatar
          size={56}
          uid={user?.uid}
          equippedAvatar={item.id}
          alt={item.name}
        />
      );
    }
    if (item.type === 'frame') {
      return (
        <BoardlyAvatar
          size={56}
          uid={user?.uid}
          equippedAvatar={stageAvatarId}
          equippedFrameId={item.id}
          alt={item.name}
        />
      );
    }
    if (item.type === 'banner') {
      return (
        <div className="w-full h-14 rounded-xl overflow-hidden border border-white/15">
          <BannerRenderer
            bannerId={item.id}
            showReadabilityOverlay={false}
            className="h-14"
          />
        </div>
      );
    }
    if (item.type === 'nameplate') {
      return (
        <div className="px-2 py-1 max-w-full overflow-hidden">
          <Nameplate
            itemId={item.id}
            name={username}
            shortId={shortId}
            forceStatic
          />
        </div>
      );
    }
    return (
      <div
        className="w-12 h-12 rounded-2xl border border-white/20 flex items-center justify-center"
        style={{
          background: item.previewColor
            ? `radial-gradient(circle at 30% 30%, ${item.previewColor}66, rgba(215,25,33,0.2))`
            : 'linear-gradient(135deg, rgba(215,25,33,0.4), rgba(245,158,11,0.25))',
        }}
      >
        <Sparkles className="w-5 h-5 text-white" />
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#050506] text-white boardly-page-safe-bottom overflow-x-hidden">
      <PageMeta
        title="Locker — Boardly"
        description="Preview and equip your owned avatars, frames, banners, nameplates, and profile effects."
      />

      {/* Ambient blurred red (#D71921) and blue (#3a4cff) glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-28 -left-24 w-[360px] h-[360px] rounded-full bg-[#D71921]/22 blur-[120px]" />
        <div className="absolute top-1/3 -right-28 w-[340px] h-[340px] rounded-full bg-[#3a4cff]/18 blur-[130px]" />
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2100] boardly-glass-pill px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-white shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-6 pt-3 pb-28 lg:pb-12">
        {/* Top Glass Navigation Bar */}
        <header className="boardly-glass-pill sticky top-3 z-30 h-14 px-2.5 mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Back to profile"
            className="press-scale w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#D71921]" />
            <h1 className="font-doto-title text-[16px] tracking-[0.16em] text-white">
              LOCKER
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('/store')}
            className="press-scale min-h-[44px] px-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 inline-flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Store</span>
          </button>
        </header>

        {/* Responsive Layout: Mobile (< 1024px) stacked | Desktop (>= 1024px) 45% Left / 55% Right */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-start">
          {/* LEFT 45% (Desktop) / TOP (Mobile): PROFILE PREVIEW STAGE */}
          <div className="w-full lg:w-[45%] lg:sticky lg:top-20 space-y-3">
            <div className="boardly-glass-card relative rounded-[32px] min-h-[270px] lg:min-h-[420px] overflow-hidden flex flex-col justify-between">
              {stageEffectId && stageEffectId !== 'none' && (
                <ProfileCardEffect itemId={stageEffectId} canAnimate />
              )}

              {/* Equipped Banner behind */}
              <div className="relative h-28 lg:h-40 w-full overflow-hidden">
                <BannerRenderer
                  bannerId={stageBannerId === 'none' ? undefined : stageBannerId}
                  showReadabilityOverlay={false}
                  className="h-28 lg:h-40"
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '10px 10px',
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090d] via-transparent to-black/30" />

                {/* Top Stage Badges: "PREVIEW" and "N EQUIPPED" */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 font-doto-title text-[10px] tracking-[0.16em] text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] animate-pulse" />
                    PREVIEW
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 font-doto-title text-[10px] tracking-[0.14em] text-white/90">
                    {equippedCount} EQUIPPED
                  </span>
                </div>
              </div>

              {/* Center Stage: Large Avatar with Frame + Dotted Glowing Platform Ellipse Under It */}
              <div className="relative -mt-12 lg:-mt-16 px-5 pb-5 flex flex-col items-center text-center z-10 flex-1 justify-center">
                <div className="relative flex flex-col items-center">
                  <div className="rounded-full p-1.5 bg-[#09090d]/90 border border-white/20 shadow-[0_14px_34px_rgba(0,0,0,0.75)]">
                    <BoardlyAvatar
                      size={96}
                      uid={user?.uid}
                      equippedAvatar={stageAvatarId}
                      customPhotoURL={profile?.photoURL}
                      equippedFrameId={stageFrameId}
                      alt={displayName}
                    />
                  </div>

                  {/* Dotted Glowing Platform Ellipse Under Avatar */}
                  <div
                    aria-hidden="true"
                    className="-mt-2 w-36 h-6 rounded-full border border-dashed border-[#D71921]/60 bg-[#D71921]/20 shadow-[0_0_28px_rgba(215,25,33,0.55)]"
                    style={{
                      transform: 'rotateX(65deg)',
                      backgroundImage:
                        'radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)',
                      backgroundSize: '6px 6px',
                    }}
                  />
                </div>

                {/* Nameplate & Name */}
                <div className="mt-2">
                  {stageNameplateId && stageNameplateId !== 'none' ? (
                    <Nameplate
                      itemId={stageNameplateId}
                      name={username}
                      shortId={shortId}
                    />
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/55">
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-xs font-bold text-amber-100 font-inter-num">
                        {username} #{shortId}
                      </span>
                    </div>
                  )}
                </div>

                <h2 className="mt-2 text-lg lg:text-xl font-extrabold text-white">
                  {displayName}
                </h2>
                <p className="text-xs text-white/65 font-inter-num">
                  Level {levelInfo.level.toLocaleString()} ·{' '}
                  {Number(wallet.balance || 0).toLocaleString()} Kobans
                </p>

                {/* Desktop Stats & Barcode Strip */}
                <div className="hidden lg:grid grid-cols-3 gap-2 w-full mt-4 boardly-glass-inset rounded-2xl p-3 text-center">
                  <div>
                    <div className="font-inter-num text-sm font-extrabold text-white">
                      LV {levelInfo.level}
                    </div>
                    <div className="font-doto-title text-[9px] text-white/60">
                      RANK
                    </div>
                  </div>
                  <div className="nothing-dotted-divider-v">
                    <div className="font-inter-num text-sm font-extrabold text-amber-300">
                      {ownedItems.length.toLocaleString()}
                    </div>
                    <div className="font-doto-title text-[9px] text-amber-300/80">
                      OWNED
                    </div>
                  </div>
                  <div className="nothing-dotted-divider-v">
                    <div className="font-inter-num text-sm font-extrabold text-white">
                      #{shortId}
                    </div>
                    <div className="font-doto-title text-[9px] text-white/60">
                      ID TAG
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Save and Reset Buttons Under Stage */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleResetPreview}
                className="boardly-glass-pill press-scale h-[50px] rounded-full inline-flex items-center justify-center gap-2 text-xs font-bold text-white/85 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAllPreviewed()}
                disabled={savingEquip}
                className="boardly-red-pill press-scale h-[50px] rounded-full inline-flex items-center justify-center gap-2 text-xs font-bold tracking-wide disabled:opacity-50 cursor-pointer"
              >
                {savingEquip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save Loadout</span>
              </button>
            </div>
          </div>

          {/* RIGHT 55% (Desktop) / BELOW (Mobile): CATEGORY CHIPS + OWNED ITEM GRID */}
          <div className="w-full lg:w-[55%] space-y-4">
            {/* Category Chips with ONE Shared Sliding Red Pill */}
            <div
              role="tablist"
              aria-label="Locker categories"
              className="boardly-glass-pill relative p-1.5 grid grid-cols-6 items-center min-h-[52px] overflow-x-auto no-scrollbar"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-b from-[#D71921] to-[#b51219] border border-white/25 shadow-[0_4px_16px_rgba(215,25,33,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  width: `calc((100% - 12px) / ${CATEGORY_TABS.length})`,
                  left: '6px',
                  transform: `translateX(${activeCategoryIdx * 100}%)`,
                }}
              />
              {CATEGORY_TABS.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`relative z-10 min-h-[44px] px-2 rounded-full text-[11px] sm:text-xs font-bold tracking-wide whitespace-nowrap transition-colors cursor-pointer ${
                      active ? 'text-white' : 'text-white/72 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 3-Column Mobile / 4-Column Desktop Grid of Owned Item Cards */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredItems.map((item, idx) => {
                const isEquipped = isItemEquippedInWallet(item);
                const isSelected = selectedItemId === item.id;
                const rStyle = RARITY_STYLES[item.rarity || 'common'];

                return (
                  <button
                    key={item.id}
                    type="button"
                    style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
                    onClick={() => handleSelectTile(item)}
                    className={`press-scale relative rounded-[22px] p-2.5 sm:p-3 flex flex-col items-center justify-between text-center min-h-[142px] transition-all cursor-pointer ${
                      isEquipped
                        ? 'boardly-glass-card ring-2 ring-[#D71921] shadow-[0_0_22px_rgba(215,25,33,0.35)]'
                        : isSelected
                        ? 'boardly-glass-card ring-2 ring-white/60'
                        : 'boardly-glass-card hover:border-white/35'
                    }`}
                  >
                    {/* Check badge on equipped item */}
                    {isEquipped && (
                      <span
                        title="Equipped"
                        className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-[#D71921] text-white flex items-center justify-center shadow-md"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}

                    {/* Rarity Tag */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${rStyle.tagClass}`}
                    >
                      {rStyle.label}
                    </span>

                    {/* Thumbnail */}
                    <div className="my-2 flex items-center justify-center w-full">
                      {renderItemVisual(item)}
                    </div>

                    {/* Item Name */}
                    <div className="w-full text-[11px] sm:text-xs font-bold text-white truncate">
                      {item.name}
                    </div>
                  </button>
                );
              })}

              {/* Last Tile: Dashed "+ Get more in Store" linking to /store */}
              <button
                type="button"
                onClick={() => navigate('/store')}
                className="press-scale rounded-[22px] p-3 min-h-[142px] border border-dashed border-white/25 hover:border-[#D71921]/70 bg-white/[0.02] hover:bg-[#D71921]/10 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#D71921]/20 border border-[#D71921]/40 flex items-center justify-center text-[#D71921]">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white/85 leading-snug">
                  + Get more in Store
                </span>
              </button>
            </div>

            {/* Desktop Item Detail Strip at the Bottom */}
            {selectedItem && (
              <div className="hidden lg:flex boardly-glass-card rounded-[24px] p-4 items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        RARITY_STYLES[selectedItem.rarity || 'common'].tagClass
                      }`}
                    >
                      {RARITY_STYLES[selectedItem.rarity || 'common'].label}
                    </span>
                    <span className="font-doto-title text-[10px] tracking-[0.14em] text-white/60 uppercase">
                      {selectedItem.type}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1 truncate">
                    {selectedItem.name}
                  </h3>
                  <p className="text-xs text-white/65 truncate mt-0.5">
                    {selectedItem.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={savingEquip || isItemEquippedInWallet(selectedItem)}
                  onClick={() => void handleEquipSelected(selectedItem)}
                  className={`press-scale h-[48px] px-6 rounded-full text-xs font-bold tracking-wide shrink-0 cursor-pointer ${
                    isItemEquippedInWallet(selectedItem)
                      ? 'boardly-glass-pill text-emerald-300 border-emerald-400/40'
                      : 'boardly-red-pill text-white'
                  }`}
                >
                  {isItemEquippedInWallet(selectedItem) ? 'Equipped' : 'Equip'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Glass Bottom Bar: Selected Item Name + Red "Equip" Pill */}
      {selectedItem && (
        <div className="lg:hidden fixed bottom-[calc(78px+env(safe-area-inset-bottom,0px))] left-3.5 right-3.5 z-40">
          <div className="boardly-glass-pill px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xl">
            <div className="min-w-0">
              <div className="font-doto-title text-[9px] tracking-[0.14em] text-white/60 uppercase">
                {RARITY_STYLES[selectedItem.rarity || 'common'].label} ·{' '}
                {selectedItem.type}
              </div>
              <div className="text-sm font-bold text-white truncate">
                {selectedItem.name}
              </div>
            </div>

            <button
              type="button"
              disabled={savingEquip || isItemEquippedInWallet(selectedItem)}
              onClick={() => void handleEquipSelected(selectedItem)}
              className={`press-scale min-h-[44px] px-5 rounded-full text-xs font-bold tracking-wide shrink-0 cursor-pointer ${
                isItemEquippedInWallet(selectedItem)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : 'boardly-red-pill text-white'
              }`}
            >
              {savingEquip
                ? 'Equipping...'
                : isItemEquippedInWallet(selectedItem)
                ? 'Equipped'
                : 'Equip'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LockerPage;
