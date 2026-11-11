import React, { useEffect, useRef, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { CosmeticItem, CosmeticRarity } from '@/data/cosmeticsCatalog';
import {
  ProfileEffectCardPreview,
  AvatarPicture,
  AvatarFrame,
  Nameplate,
} from '@/components/koban/CosmeticRenderers';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { PriceRow } from './PriceRow';

export const RARITY_ACCENT: Record<
  CosmeticRarity,
  {
    topEdgeClass: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    label: string;
  }
> = {
  common: {
    topEdgeClass: 'bg-zinc-400',
    badgeBg: 'bg-zinc-500/10',
    badgeText: 'text-zinc-500 dark:text-zinc-300',
    badgeBorder: 'border-zinc-400/30',
    label: 'Common',
  },
  rare: {
    topEdgeClass: 'bg-blue-500',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-600 dark:text-blue-400',
    badgeBorder: 'border-blue-500/30',
    label: 'Rare',
  },
  epic: {
    topEdgeClass: 'bg-purple-500',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-600 dark:text-purple-400',
    badgeBorder: 'border-purple-500/30',
    label: 'Epic',
  },
  legendary: {
    topEdgeClass: 'bg-amber-500',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
    badgeBorder: 'border-amber-500/30',
    label: 'Legendary',
  },
  mythic: {
    topEdgeClass: 'bg-[#E11D2A]',
    badgeBg: 'bg-[#E11D2A]/10',
    badgeText: 'text-[#E11D2A]',
    badgeBorder: 'border-[#E11D2A]/30',
    label: 'Mythic',
  },
};

export const CATEGORY_SHORT_LABEL: Record<CosmeticItem['type'], string> = {
  effect: 'Profile Effect',
  frame: 'Avatar Frame',
  nameplate: 'Nameplate',
  avatar: 'Profile Picture',
  banner: 'Banner',
};

export interface StoreCardProps {
  item: CosmeticItem & {
    price?: number;
    originalPrice?: number;
    isOnSale?: boolean;
  };
  userDisplayName: string;
  userUid?: string | null;
  userPhotoURL?: string | null;
  isOwned: boolean;
  isEquipped: boolean;
  isInCart: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  disabled?: boolean;
  isPurchasing?: boolean;
  onOpenDetail: (item: CosmeticItem) => void;
  onToggleCart: (item: CosmeticItem) => void;
  onBuyNow: (item: CosmeticItem) => void;
  onEquipToggle: (item: CosmeticItem) => void;
  onToggleSelect: (itemId: string) => void;
  onEnterSelectionMode: (itemId: string) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  item,
  userDisplayName,
  userUid,
  isOwned,
  isEquipped,
  isInCart,
  selectionMode,
  isSelected,
  disabled = false,
  isPurchasing = false,
  onOpenDetail,
  onToggleCart,
  onBuyNow,
  onEquipToggle,
  onToggleSelect,
  onEnterSelectionMode,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [showAnimatedTip, setShowAnimatedTip] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Lazy-load and pause animated previews when outside the viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsInViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsInViewport(entry.isIntersecting);
        }
      },
      { rootMargin: '140px 0px', threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || isOwned) return;
    longPressTriggeredRef.current = false;
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onEnterSelectionMode(item.id);
    }, 450);
  };

  const handlePointerUpOrLeave = () => {
    clearLongPress();
  };

  const handleCardClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    if (selectionMode) {
      if (!isOwned) {
        onToggleSelect(item.id);
      }
      return;
    }
    onOpenDetail(item);
  };

  const rarityStyle = RARITY_ACCENT[item.rarity] || RARITY_ACCENT.common;

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
      onPointerCancel={handlePointerUpOrLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`group relative rounded-2xl overflow-hidden flex flex-col h-full text-left select-none cursor-pointer transition-all duration-200 bg-[var(--bg-card)] border ${
        selectionMode && isSelected
          ? 'border-[#E11D2A] ring-2 ring-[#E11D2A]/30'
          : isEquipped
          ? 'border-emerald-500/60'
          : 'border-[var(--border)] hover:border-[var(--text-muted)]'
      }`}
    >
      {/* Subtle Rarity Top Edge Line (Unified system — no heavy red outer glow) */}
      <div className={`h-[3px] w-full shrink-0 ${rarityStyle.topEdgeClass}`} />

      {/* Top Badge Bar — Separated from artwork so NEW (top-left) and Animated sparkle (top-right, 44x44 tap target) never cover artwork */}
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1 min-h-[34px] bg-[#0B0C11] dark-surface-preserve border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 min-w-0">
          {selectionMode && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (!isOwned) onToggleSelect(item.id);
              }}
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                isOwned
                  ? 'border-white/15 bg-white/5 opacity-40 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[#E11D2A] border-[#E11D2A] text-white'
                  : 'border-white/30 bg-white/10 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          )}
          {item.isNew ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#E11D2A] text-white leading-none">
              NEW
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-white/55 truncate">
              {CATEGORY_SHORT_LABEL[item.type]}
            </span>
          )}
        </div>

        {/* Right: Animated Sparkle with 44x44px tap target */}
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="Animated item"
            title="Animated cosmetic preview"
            onClick={(e) => {
              e.stopPropagation();
              setShowAnimatedTip((prev) => !prev);
            }}
            className="-my-2 -mr-2 w-11 h-11 inline-flex items-center justify-center text-amber-300/90 hover:text-amber-200 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-amber-300" />
            </span>
          </button>
          {showAnimatedTip && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowAnimatedTip(false);
              }}
              className="absolute right-8 top-1 z-20 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/85 text-white border border-white/15 shadow-md"
            >
              Animated FX
            </span>
          )}
        </div>
      </div>

      {/* Uniform Dark Stage with Fixed Aspect Ratio Per Category */}
      <div className="relative h-[142px] sm:h-[156px] w-full bg-[#090A0F] dark-surface-preserve flex items-center justify-center p-2.5 overflow-hidden">
        {!isInViewport ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 animate-pulse" />
          </div>
        ) : item.type === 'banner' ? (
          /* Banners: Fixed 16:9 centered inside the stage */
          <div className="w-full max-w-[230px] aspect-[16/9] rounded-xl overflow-hidden relative border border-white/15 shadow-inner">
            <BannerRenderer
              bannerId={item.id}
              animated={item.animated !== false}
              className="w-full h-full"
            />
            <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 pointer-events-none">
              <div className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/20 flex items-center gap-1.5 max-w-full">
                <div className="w-3.5 h-3.5 rounded-full bg-[#E11D2A] text-[8px] font-black text-white flex items-center justify-center shrink-0">
                  {(userDisplayName || 'S')[0]?.toUpperCase()}
                </div>
                <span
                  className="text-[10px] font-extrabold text-white truncate"
                  style={{
                    color: '#FFFFFF',
                    textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                  }}
                >
                  {userDisplayName}
                </span>
              </div>
            </div>
          </div>
        ) : item.type === 'avatar' ? (
          /* Profile Pictures / Avatars: Fixed 1:1 centered */
          <div className="w-[104px] h-[104px] sm:w-[114px] sm:h-[114px] aspect-square rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
            <AvatarPicture
              avatarId={item.id}
              size={82}
              animated={item.animated !== false}
            />
          </div>
        ) : item.type === 'frame' ? (
          /* Avatar Frames: Fixed 1:1 centered */
          <div className="w-[104px] h-[104px] sm:w-[114px] sm:h-[114px] aspect-square rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
            <AvatarFrame
              frameId={item.id}
              size={76}
              animated={item.animated !== false}
            >
              <AvatarPicture
                uid={userUid}
                seed={userUid || undefined}
                size={60}
                animated={false}
              />
            </AvatarFrame>
          </div>
        ) : item.type === 'effect' ? (
          /* Profile Effects: Fixed 4:3 centered */
          <div className="w-full max-w-[184px] aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center">
            <ProfileEffectCardPreview
              effectId={item.id}
              displayName={userDisplayName}
              animated={item.animated !== false}
              className="w-full h-full !h-full"
            />
          </div>
        ) : (
          /* Nameplates: Fixed 4:3 centered with glass pill + white text with soft shadow */
          <div className="w-full max-w-[188px] aspect-[4/3] rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center px-2.5 gap-1.5">
            <span
              className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white truncate max-w-full"
              style={{
                color: '#FFFFFF',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              {userDisplayName}
            </span>
            <Nameplate
              nameplateId={item.id}
              displayName={userDisplayName}
              animated={item.animated !== false}
            />
          </div>
        )}
      </div>

      {/* Card Body: Rarity chip + 2-line title + baseline PriceRow */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2 bg-[var(--bg-card)]">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${rarityStyle.badgeBg} ${rarityStyle.badgeText} ${rarityStyle.badgeBorder}`}
            >
              {rarityStyle.label}
            </span>
            <span className="text-[10px] font-medium text-[var(--text-muted)] truncate">
              {CATEGORY_SHORT_LABEL[item.type]}
            </span>
          </div>

          {/* 2-line title on cards */}
          <h3
            title={item.name}
            className="text-xs sm:text-[13px] font-extrabold text-[var(--text-primary)] leading-snug line-clamp-2 min-h-[2.25rem]"
          >
            {item.name}
          </h3>
        </div>

        <PriceRow
          price={item.price ?? item.priceKobans}
          originalPrice={item.originalPrice}
          isOnSale={item.isOnSale}
          isOwned={isOwned}
          isEquipped={isEquipped}
          isInCart={isInCart}
          disabled={disabled}
          isPurchasing={isPurchasing}
          onToggleCart={() => onToggleCart(item)}
          onPrimaryAction={() => {
            if (isOwned) {
              onEquipToggle(item);
            } else {
              onBuyNow(item);
            }
          }}
        />
      </div>
    </div>
  );
};

export const StoreCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border)] animate-pulse">
      <div className="h-[3px] w-full bg-[var(--border)]" />
      <div className="h-[34px] px-2.5 flex items-center justify-between bg-[#0B0C11]">
        <div className="h-3.5 w-14 rounded-full bg-white/10" />
        <div className="h-5 w-5 rounded-full bg-white/10" />
      </div>
      <div className="h-[142px] sm:h-[156px] w-full bg-[#090A0F] flex items-center justify-center p-3">
        <div className="w-24 h-24 rounded-2xl bg-white/[0.06]" />
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-14 rounded bg-[var(--bg-elevated)]" />
            <div className="h-3 w-16 rounded bg-[var(--bg-elevated)]" />
          </div>
          <div className="h-4 w-4/5 rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between">
          <div className="h-4 w-14 rounded bg-[var(--bg-elevated)]" />
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)]" />
            <div className="h-8 w-[78px] rounded-lg bg-[var(--bg-elevated)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
