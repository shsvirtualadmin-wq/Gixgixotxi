import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Crown,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Sparkles,
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
import { KobanIcon } from '@/components/koban/KobanIcon';
import { computeLevelFromStats } from '@/components/profile/ProfileView';
import { PageMeta } from '@/components/ui/PageMeta';
import { getDisplayName } from '@/utils/displayName';
import { getEquippedLoadout } from '@/utils/userStateSource';

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

const RARITY_TOKEN_STYLES: Record<
  CosmeticRarity,
  { label: string; bg: string; text: string; border: string }
> = {
  mythic: {
    label: 'Mythic',
    bg: 'var(--rarity-mythic-bg)',
    text: 'var(--rarity-mythic-text)',
    border: 'var(--rarity-mythic-border)',
  },
  legendary: {
    label: 'Legendary',
    bg: 'var(--rarity-legendary-bg)',
    text: 'var(--rarity-legendary-text)',
    border: 'var(--rarity-legendary-border)',
  },
  epic: {
    label: 'Epic',
    bg: 'var(--rarity-epic-bg)',
    text: 'var(--rarity-epic-text)',
    border: 'var(--rarity-epic-border)',
  },
  rare: {
    label: 'Rare',
    bg: 'var(--rarity-rare-bg)',
    text: 'var(--rarity-rare-text)',
    border: 'var(--rarity-rare-border)',
  },
  common: {
    label: 'Common',
    bg: 'var(--rarity-common-bg)',
    text: 'var(--rarity-common-text)',
    border: 'var(--rarity-common-border)',
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
  const { user, profile } = useAuth();
  const wallet = useWallet();

  // Single source of truth for currently equipped loadout
  const equippedLoadout = useMemo(
    () =>
      getEquippedLoadout({
        uid: user?.uid,
        equipped: wallet.equipped,
        photoURL: profile?.photoURL || user?.photoURL || null,
        avatar: profile?.avatar,
        equippedAvatar: profile?.equippedAvatar,
        frame: profile?.frame,
        equippedFrame: profile?.equippedFrame,
        banner: profile?.banner,
        nameplate: profile?.nameplate,
        effect: (profile as { effect?: string } | null)?.effect,
      }),
    [user?.uid, user?.photoURL, wallet.equipped, profile]
  );

  const [activeCategory, setActiveCategory] = useState<LockerCategoryTab>('all');
  // Do NOT auto-select the first item on load — preview starts strictly from what is equipped
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [savingEquip, setSavingEquip] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live try-on state initialized strictly from equippedLoadout
  const [previewEquipped, setPreviewEquipped] = useState<EquippedCosmetics>(() => ({
    avatar: equippedLoadout.avatar,
    frame: equippedLoadout.frame,
    banner: equippedLoadout.banner,
    nameplate: equippedLoadout.nameplate,
    effect: equippedLoadout.effect,
  }));

  // Keep preview synced with newly loaded equipped items when the user has not clicked a preview tile
  useEffect(() => {
    if (!selectedItemId) {
      setPreviewEquipped({
        avatar: equippedLoadout.avatar,
        frame: equippedLoadout.frame,
        banner: equippedLoadout.banner,
        nameplate: equippedLoadout.nameplate,
        effect: equippedLoadout.effect,
      });
    }
  }, [
    selectedItemId,
    equippedLoadout.avatar,
    equippedLoadout.frame,
    equippedLoadout.banner,
    equippedLoadout.nameplate,
    equippedLoadout.effect,
  ]);

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

  const selectedItem: CosmeticItem | null = useMemo(
    () => ownedItems.find((i) => i.id === selectedItemId) || null,
    [ownedItems, selectedItemId]
  );

  const isItemEquippedInWallet = useCallback(
    (item: CosmeticItem) => {
      const currentValue = equippedLoadout[item.type];
      return Boolean(currentValue && currentValue === item.id);
    },
    [equippedLoadout]
  );

  // Tapping an item ONLY previews it on the stage until the user taps Equip
  const handleSelectTile = useCallback((item: CosmeticItem) => {
    setSelectedItemId(item.id);
    setPreviewEquipped((prev) => ({
      ...prev,
      [item.type]: item.id,
    }));
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2400);
  };

  const handleEquipSelected = useCallback(
    async (itemToEquip?: CosmeticItem | null) => {
      const target = itemToEquip || selectedItem;
      if (!target || savingEquip) return;

      if (isItemEquippedInWallet(target)) return;

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

  const hasUnsavedPreview = useMemo(() => {
    return (
      (previewEquipped.avatar || 'avatar-1') !== (equippedLoadout.avatar || 'avatar-1') ||
      (previewEquipped.frame || 'none') !== (equippedLoadout.frame || 'none') ||
      (previewEquipped.banner || 'none') !== (equippedLoadout.banner || 'none') ||
      (previewEquipped.nameplate || 'none') !== (equippedLoadout.nameplate || 'none') ||
      (previewEquipped.effect || 'none') !== (equippedLoadout.effect || 'none')
    );
  }, [previewEquipped, equippedLoadout]);

  const handleSaveAllPreviewed = async () => {
    if (savingEquip || !hasUnsavedPreview) return;
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
    setSelectedItemId(null);
    setPreviewEquipped({
      avatar: equippedLoadout.avatar,
      frame: equippedLoadout.frame,
      banner: equippedLoadout.banner,
      nameplate: equippedLoadout.nameplate,
      effect: equippedLoadout.effect,
    });
    showToast('Preview reset to equipped loadout');
  };

  // Keyboard navigation on desktop
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

  const displayName = getDisplayName(
    {
      display_name: profile?.display_name ?? profile?.displayName,
      realName: profile?.realName ?? profile?.name ?? user?.displayName,
      username: profile?.username,
    },
    'Student'
  );
  const username = String(profile?.username || 'student').replace(/^@+/, '');
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
    return [
      equippedLoadout.avatar,
      equippedLoadout.frame,
      equippedLoadout.banner,
      equippedLoadout.nameplate,
      equippedLoadout.effect,
    ].filter((val) => Boolean(val) && val !== 'none').length;
  }, [equippedLoadout]);

  const stageAvatarId = previewEquipped.avatar || equippedLoadout.avatar || 'avatar-1';
  const stageFrameId = previewEquipped.frame || equippedLoadout.frame || 'none';
  const stageBannerId = previewEquipped.banner || equippedLoadout.banner || 'none';
  const stageNameplateId = previewEquipped.nameplate || equippedLoadout.nameplate || 'none';
  const stageEffectId = previewEquipped.effect || equippedLoadout.effect || 'none';

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
        <div
          className="w-full h-14 rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--border)' }}
        >
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
        className="w-12 h-12 rounded-2xl border flex items-center justify-center"
        style={{
          borderColor: 'var(--border)',
          background: item.previewColor
            ? `radial-gradient(circle at 30% 30%, ${item.previewColor}55, color-mix(in srgb, var(--accent) 18%, transparent))`
            : 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 26%, transparent), color-mix(in srgb, var(--koban) 20%, transparent))',
          color: 'var(--text)',
        }}
      >
        <Sparkles className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div
      className="relative min-h-[100dvh] w-full max-w-full overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageMeta
        title="Locker — Boardly"
        description="Preview and equip your owned avatars, frames, banners, nameplates, and profile effects."
      />

      {/* Soft ambient accents strictly clipped inside container (< 5% opacity in light mode, zero hard edges) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div
          className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-[0.045] dark:opacity-[0.14]"
          style={{
            background: 'radial-gradient(circle, #D71921 0%, transparent 68%)',
          }}
        />
        <div
          className="absolute top-1/4 -right-32 w-[400px] h-[400px] rounded-full opacity-[0.04] dark:opacity-[0.12]"
          style={{
            background: 'radial-gradient(circle, #3a4cff 0%, transparent 68%)',
          }}
        />
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[2100] rounded-full px-4 py-2.5 flex items-center gap-2 text-[13px] font-semibold shadow-lg"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main container — extra bottom padding stacks above both mobile bottom nav AND sticky Equip bar */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-3 lg:pb-12"
        style={{
          paddingBottom: selectedItem
            ? 'calc(176px + env(safe-area-inset-bottom, 0px))'
            : 'calc(112px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Top Navigation Bar (normal UI font 17px/600) */}
        <header
          className="sticky top-2 z-30 h-14 px-2.5 mb-4 rounded-full flex items-center justify-between gap-2"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Back to profile"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 hover:bg-[var(--settings-row-hover)]"
            style={{ color: 'var(--text)' }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.1} />
          </button>

          <h1
            className="text-[17px] font-semibold leading-tight truncate"
            style={{
              color: 'var(--text)',
              fontFamily: 'var(--font-sans, var(--font-heading), system-ui, sans-serif)',
            }}
          >
            Locker
          </h1>

          <button
            type="button"
            onClick={() => navigate('/store')}
            className="min-h-[40px] px-3.5 rounded-full inline-flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer shrink-0 transition-colors hover:bg-[var(--settings-row-hover)]"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <ShoppingBag className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span>Store</span>
          </button>
        </header>

        {wallet.walletError && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-[24px] px-4 py-3"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--danger-border)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--danger)' }} />
              <span className="text-[13px]" style={{ color: 'var(--text)' }}>
                {wallet.walletError}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void wallet.refreshWallet()}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Responsive Layout: Mobile stacked | Desktop 45% Left / 55% Right */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-start">
          {/* LEFT 45% (Desktop) / TOP (Mobile): PROFILE PREVIEW STAGE */}
          <div className="w-full lg:w-[45%] lg:sticky lg:top-20 space-y-3">
            <div
              className="relative rounded-[28px] min-h-[270px] lg:min-h-[410px] overflow-hidden flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--settings-card-shadow)',
              }}
            >
              {stageEffectId && stageEffectId !== 'none' && (
                <ProfileCardEffect itemId={stageEffectId} canAnimate />
              )}

              {/* Equipped Banner behind (theme-aware subtle surface when no banner equipped) */}
              <div className="relative h-28 lg:h-36 w-full overflow-hidden">
                {stageBannerId && stageBannerId !== 'none' ? (
                  <>
                    <BannerRenderer
                      bannerId={stageBannerId}
                      showReadabilityOverlay={false}
                      className="h-28 lg:h-36"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to top, var(--card) 0%, transparent 55%, rgba(0,0,0,0.2) 100%)',
                      }}
                    />
                  </>
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--accent) 9%, var(--bg)) 0%, var(--bg) 52%, color-mix(in srgb, var(--koban) 8%, var(--bg)) 100%)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  />
                )}

                {/* Top Stage Badges: normal UI font */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: hasUnsavedPreview ? 'var(--accent)' : '#10b981' }}
                    />
                    {hasUnsavedPreview ? 'Previewing' : 'Equipped'}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {equippedCount} equipped
                  </span>
                </div>
              </div>

              {/* Center Stage: Avatar with Frame */}
              <div className="relative -mt-12 lg:-mt-14 px-5 pb-5 flex flex-col items-center text-center z-10 flex-1 justify-center">
                <div
                  className="rounded-full p-1.5 shadow-md"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <BoardlyAvatar
                    size={96}
                    uid={user?.uid}
                    equippedAvatar={stageAvatarId}
                    customPhotoURL={equippedLoadout.photoURL || undefined}
                    equippedFrameId={stageFrameId}
                    alt={displayName}
                  />
                </div>

                {/* Nameplate (pixel font allowed ONLY on nameplate) */}
                <div className="mt-3">
                  {stageNameplateId && stageNameplateId !== 'none' ? (
                    <Nameplate
                      itemId={stageNameplateId}
                      name={username}
                      shortId={shortId}
                    />
                  ) : (
                    <div
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[12px] font-semibold"
                      style={{
                        backgroundColor: 'var(--koban-bg)',
                        border: '1px solid var(--koban-border)',
                        color: 'var(--koban)',
                      }}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>
                        @{username} #{shortId}
                      </span>
                    </div>
                  )}
                </div>

                <h2
                  className="mt-2 text-[18px] font-semibold leading-snug"
                  style={{
                    color: 'var(--text)',
                    fontFamily: 'var(--font-sans, var(--font-heading), system-ui, sans-serif)',
                  }}
                >
                  {displayName}
                </h2>
                <div
                  className="mt-1 inline-flex items-center gap-1.5 text-[13px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>Level {levelInfo.level.toLocaleString()}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--koban)' }}>
                    <KobanIcon size={14} decorative />
                    {!wallet.balanceLoaded || wallet.kobanBalance === null ? (
                      <span
                        className="inline-block h-3.5 w-10 animate-pulse rounded-full"
                        style={{ backgroundColor: 'var(--skeleton)' }}
                        aria-label="Loading Kobans balance"
                      />
                    ) : (
                      <span>{wallet.kobanBalance.toLocaleString()} Kobans</span>
                    )}
                  </span>
                </div>

                {/* Desktop Stats Strip */}
                <div
                  className="hidden lg:grid grid-cols-3 gap-2 w-full mt-4 rounded-2xl p-3 text-center"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      Lv {levelInfo.level}
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      Rank
                    </div>
                  </div>
                  <div className="border-x" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--koban)' }}>
                      {ownedItems.length.toLocaleString()}
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      Owned
                    </div>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      #{shortId}
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      ID tag
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
                disabled={!hasUnsavedPreview}
                className="h-[48px] rounded-full inline-flex items-center justify-center gap-2 text-[14px] font-semibold cursor-pointer disabled:opacity-45 transition-colors hover:bg-[var(--settings-row-hover)]"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset preview</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAllPreviewed()}
                disabled={savingEquip || !hasUnsavedPreview}
                className="h-[48px] rounded-full inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white cursor-pointer disabled:opacity-45"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {savingEquip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save loadout</span>
              </button>
            </div>
          </div>

          {/* RIGHT 55% (Desktop) / BELOW (Mobile): CATEGORY PILLS + OWNED ITEM GRID */}
          <div className="w-full lg:w-[55%] min-w-0 space-y-4">
            {/* Scrollable Pill Row on mobile, wraps cleanly on desktop — AA contrast, zero overlapping or clipped text */}
            <div
              role="tablist"
              aria-label="Locker categories"
              className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 lg:flex-wrap lg:overflow-visible"
            >
              {CATEGORY_TABS.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(cat.id)}
                    className="shrink-0 whitespace-nowrap min-h-[42px] px-3.5 rounded-full text-[13.5px] font-medium transition-colors cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--accent)',
                            border: '1px solid var(--accent)',
                            color: '#ffffff',
                          }
                        : {
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }
                    }
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-1">
              <h2
                className="text-[14px] font-medium"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans, var(--font-heading), system-ui, sans-serif)',
                }}
              >
                Owned items ({filteredItems.length})
              </h2>
              {hasUnsavedPreview && (
                <button
                  type="button"
                  onClick={handleResetPreview}
                  className="text-[13px] font-medium cursor-pointer hover:underline lg:hidden"
                  style={{ color: 'var(--accent)' }}
                >
                  Reset preview
                </button>
              )}
            </div>

            {/* 3-Column Mobile / 4-Column Desktop Grid of Owned Item Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const isEquipped = isItemEquippedInWallet(item);
                const isSelected = selectedItemId === item.id;
                const rToken = RARITY_TOKEN_STYLES[item.rarity || 'common'];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTile(item)}
                    className="relative rounded-[24px] p-3 flex flex-col items-center justify-between text-center min-h-[146px] transition-all cursor-pointer"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: isEquipped
                        ? '2px solid var(--accent)'
                        : isSelected
                        ? '2px solid var(--text)'
                        : '1px solid var(--border)',
                      boxShadow: 'var(--settings-card-shadow)',
                    }}
                  >
                    {/* Check badge on equipped item */}
                    {isEquipped && (
                      <span
                        title="Equipped"
                        className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full text-white flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}

                    {/* AA Rarity Chip */}
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: rToken.bg,
                        color: rToken.text,
                        border: `1px solid ${rToken.border}`,
                      }}
                    >
                      {rToken.label}
                    </span>

                    {/* Thumbnail */}
                    <div className="my-2 flex items-center justify-center w-full">
                      {renderItemVisual(item)}
                    </div>

                    {/* Item Name */}
                    <div
                      className="w-full text-[13px] font-semibold truncate"
                      style={{ color: 'var(--text)' }}
                    >
                      {item.name}
                    </div>
                  </button>
                );
              })}

              {/* Last Tile: "+ Get more in Store" */}
              <button
                type="button"
                onClick={() => navigate('/store')}
                className="rounded-[24px] p-3 min-h-[146px] border border-dashed flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer hover:bg-[var(--settings-row-hover)]"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[13px] font-semibold leading-snug">
                  Get more in Store
                </span>
              </button>
            </div>

            {/* Desktop Item Detail Strip at the Bottom */}
            {selectedItem && (
              <div
                className="hidden lg:flex rounded-[24px] p-4 items-center justify-between gap-4"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--settings-card-shadow)',
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: RARITY_TOKEN_STYLES[selectedItem.rarity || 'common'].bg,
                        color: RARITY_TOKEN_STYLES[selectedItem.rarity || 'common'].text,
                        border: `1px solid ${RARITY_TOKEN_STYLES[selectedItem.rarity || 'common'].border}`,
                      }}
                    >
                      {RARITY_TOKEN_STYLES[selectedItem.rarity || 'common'].label}
                    </span>
                    <span className="text-[12px] capitalize" style={{ color: 'var(--text-muted)' }}>
                      {selectedItem.type}
                    </span>
                  </div>
                  <h3
                    className="text-[16px] font-semibold mt-1 truncate"
                    style={{ color: 'var(--text)' }}
                  >
                    {selectedItem.name}
                  </h3>
                  <p className="text-[13px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {selectedItem.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={savingEquip || isItemEquippedInWallet(selectedItem)}
                  onClick={() => void handleEquipSelected(selectedItem)}
                  className="h-[46px] px-6 rounded-full text-[14px] font-semibold shrink-0 cursor-pointer disabled:opacity-60"
                  style={
                    isItemEquippedInWallet(selectedItem)
                      ? {
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }
                      : {
                          backgroundColor: 'var(--accent)',
                          color: '#ffffff',
                        }
                  }
                >
                  {savingEquip
                    ? 'Equipping…'
                    : isItemEquippedInWallet(selectedItem)
                    ? 'Equipped'
                    : 'Equip'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar: stacked cleanly ABOVE DashboardBottomNav (never overlaps) */}
      {selectedItem && (
        <div
          className="lg:hidden fixed left-4 right-4 z-[45]"
          style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div
            className="rounded-full px-4 py-2.5 flex items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.22)',
            }}
          >
            <div className="min-w-0 pl-1">
              <div className="text-[12px] capitalize truncate" style={{ color: 'var(--text-muted)' }}>
                {RARITY_TOKEN_STYLES[selectedItem.rarity || 'common'].label} · {selectedItem.type}
              </div>
              <div className="text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                {selectedItem.name}
              </div>
            </div>

            <button
              type="button"
              disabled={savingEquip || isItemEquippedInWallet(selectedItem)}
              onClick={() => void handleEquipSelected(selectedItem)}
              className="min-h-[44px] px-5 rounded-full text-[14px] font-semibold shrink-0 cursor-pointer disabled:opacity-60"
              style={
                isItemEquippedInWallet(selectedItem)
                  ? {
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }
                  : {
                      backgroundColor: 'var(--accent)',
                      color: '#ffffff',
                    }
              }
            >
              {savingEquip
                ? 'Equipping…'
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
