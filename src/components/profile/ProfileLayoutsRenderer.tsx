import React from 'react';
import {
  Edit3,
  ShoppingBag,
  Settings,
  Sparkles,
  MessageSquare,
  UserPlus,
  UserCheck,
  Share2,
  Users,
  Eye,
  X,
  Coins,
  Trophy,
  QrCode,
  Layers,
  Image as ImageIcon,
  User as UserIcon,
  Disc,
  Tag,
  Wand2,
} from 'lucide-react';
import type { ProfileLayoutId, SharedProfileData } from '@/lib/profileLayouts';
import { normalizeProfileLayout } from '@/lib/profileLayouts';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { ProBadge } from '@/components/ui/ProBadge';
import { KobanIcon } from '@/components/koban/KobanIcon';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  ProfileCardEffect,
  CosmeticErrorBoundary,
} from '@/components/koban/CosmeticRenderers';
import {
  BannerRenderer,
  DefaultDotMatrixBanner,
} from '@/components/koban/artwork/bannerArtwork';
import { getCosmeticById } from '@/data/cosmeticsCatalog';
import { deriveFallbackShortId } from '@/utils/shortId';
import { isAdminAccount } from '@/utils/privacy';

export interface ProfileLayoutHeaderProps {
  layout?: ProfileLayoutId | string | null;
  data: SharedProfileData;
  /** True when viewing another user or "View as others" preview mode */
  isPublicMode?: boolean;
  /** True when rendering inside Settings > Profile Layout live preview carousel */
  previewMode?: boolean;
  /** Short ID for display */
  shortId?: string;
  /** Optional close button handler for modal mode */
  onClose?: () => void;
  /** Optional "View as others" handler */
  onPreviewAsPublic?: () => void;
  /** Action callbacks */
  onEditProfile?: () => void;
  onOpenStore?: (category?: string) => void;
  onOpenSettings?: () => void;
  onOpenWallet?: () => void;
  onOpenRewards?: () => void;
  onOpenMessages?: () => void;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  onFollowToggle?: () => void;
  onMessageClick?: () => void;
  onShareProfile?: () => void;
  onViewCrew?: () => void;
  onUpgradeGuest?: () => void;
  onProBadgeClick?: () => void;
  isFollowedByMe?: boolean;
  followsMe?: boolean;
  followWorking?: boolean;
  incomingRequestsCount?: number;
  messageButtonLabel?: string;
  messageButtonDisabled?: boolean;
  messageButtonHighlight?: boolean;
  isGuest?: boolean;
  crewName?: string | null;
  badgeRowNode?: React.ReactNode;
  effectPlayKey?: number;
}

/**
 * Renders the Profile Effect layer over the header in EVERY layout.
 * Uses the user's equipped store effect (`ProfileCardEffect`) plus animated ambient sparkles
 * so the profile effect layer is always visible and never hidden.
 */
const HeaderProfileEffectOverlay: React.FC<{
  effectId: string | null;
  accentColor: string;
  playKey?: number;
}> = ({ effectId, accentColor, playKey = 1 }) => {
  return (
    <div
      key={playKey}
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none"
      aria-hidden="true"
    >
      {effectId && effectId !== 'none' && (
        <CosmeticErrorBoundary fallback={null}>
          <ProfileCardEffect itemId={effectId} previewMode={true} />
        </CosmeticErrorBoundary>
      )}
      {/* Ambient header sparkle particles so the profile effect animates over the header in every layout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-75"
        viewBox="0 0 400 180"
        fill="none"
        preserveAspectRatio="none"
      >
        <g className="animate-pulse">
          <path
            d="M42 24L44.5 31.5L52 34L44.5 36.5L42 44L39.5 36.5L32 34L39.5 31.5L42 24Z"
            fill="#FBBF24"
            fillOpacity="0.85"
          />
          <circle cx="96" cy="42" r="2" fill="#FFFFFF" fillOpacity="0.8" />
          <path
            d="M342 28L344 34L350 36L344 38L342 44L340 38L334 36L340 34L342 28Z"
            fill={accentColor || '#D71921'}
            fillOpacity="0.85"
          />
          <path
            d="M278 18L279.5 22.5L284 24L279.5 25.5L278 30L276.5 25.5L272 24L276.5 22.5L278 18Z"
            fill="#FDE047"
            fillOpacity="0.75"
          />
          <circle cx="195" cy="22" r="1.8" fill="#FDE047" fillOpacity="0.75" />
          <circle cx="315" cy="64" r="2.2" fill="#FFFFFF" fillOpacity="0.65" />
          <circle cx="68" cy="74" r="1.6" fill="#FBBF24" fillOpacity="0.7" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Always renders the Nameplate item (never hidden).
 * If user has an equipped nameplate ID from the store, renders `<Nameplate />`.
 * If user has default/none, renders `<Nameplate />` inside a sleek metallic nameplate pill so the nameplate is always visible.
 */
const AlwaysVisibleNameplate: React.FC<{
  nameplateId: string | null;
  displayName: string;
  shortId: string;
  darkSurface?: boolean;
  className?: string;
}> = ({ nameplateId, displayName, shortId, darkSurface = false, className = '' }) => {
  const hasEquippedPlate = Boolean(
    nameplateId && nameplateId !== 'none' && getCosmeticById(nameplateId)
  );

  if (hasEquippedPlate && nameplateId) {
    return (
      <div className={`inline-flex items-center max-w-full ${className}`} data-store-item="nameplate">
        <Nameplate itemId={nameplateId} name={displayName} shortId={shortId} />
      </div>
    );
  }

  return (
    <div
      data-store-item="nameplate"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-heading font-semibold shadow-sm max-w-full ${
        darkSurface
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-black/[0.04] dark:bg-white/[0.08] border-black/10 dark:border-white/15 text-[var(--text)]'
      } ${className}`}
    >
      <Tag size={11} className="text-[#D71921] shrink-0" />
      <Nameplate
        itemId={nameplateId || 'default-plate'}
        name={displayName}
        shortId={shortId}
        className={darkSurface ? '!text-white' : ''}
      />
    </div>
  );
};

/**
 * Always renders Avatar + Avatar Frame/Ring.
 */
const AvatarWithGuaranteedRing: React.FC<{
  data: SharedProfileData;
  size: number;
  showLevelBadge?: boolean;
  squarePixel?: boolean;
  className?: string;
}> = ({ data, size, showLevelBadge = true, squarePixel = false, className = '' }) => {
  const hasEquippedFrame = Boolean(data.frame && data.frame !== 'none');
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      data-store-item="avatar-and-frame"
    >
      <div
        className={`relative inline-flex items-center justify-center ${
          squarePixel
            ? 'p-1 bg-[#18181b] border-2 border-emerald-400 shadow-[3px_3px_0px_#10b981]'
            : hasEquippedFrame
            ? 'p-0.5 rounded-full'
            : 'p-1 rounded-full ring-2 ring-[#D71921]/70 bg-[var(--card)]'
        }`}
      >
        <BoardlyAvatar
          uid={data.uid}
          equippedAvatar={data.avatar}
          frame={data.frame || 'none'}
          name={data.displayName}
          size={size}
        />
      </div>
      {showLevelBadge && (
        <div
          className={`absolute -bottom-1 -right-1 z-30 px-2 py-0.5 ${
            squarePixel ? 'rounded-none border border-emerald-300 bg-emerald-700' : 'rounded-full border-2 border-[var(--card)] bg-gradient-to-r from-amber-600 to-amber-500'
          } text-white font-mono font-black text-[10px] shadow-md flex items-center gap-0.5 select-none`}
          title={`Level ${data.level}`}
        >
          <span className="text-[8px] font-extrabold text-amber-200">LV</span>
          <span>{data.level}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Shared Action Buttons Row — keeps Edit Profile, Store, and Settings in every layout.
 */
const ProfileActionButtonsRow: React.FC<{
  props: ProfileLayoutHeaderProps;
  variant?: 'default' | 'retro' | 'dark' | 'compact';
  centered?: boolean;
}> = ({ props, variant = 'default', centered = false }) => {
  const {
    isPublicMode = false,
    onEditProfile,
    onOpenStore,
    onOpenSettings,
    onOpenRewards,
    onOpenMessages,
    onFollowToggle,
    onMessageClick,
    onShareProfile,
    onViewCrew,
    onUpgradeGuest,
    isFollowedByMe,
    followWorking,
    incomingRequestsCount = 0,
    messageButtonLabel = 'Message',
    messageButtonDisabled = false,
    messageButtonHighlight = false,
    isGuest = false,
    crewName,
    previewMode = false,
  } = props;

  const isRetro = variant === 'retro';
  const isDark = variant === 'dark';

  const primaryBtnCls = isRetro
    ? 'h-9 px-3 rounded-none bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs border-2 border-emerald-200 shadow-[2px_2px_0px_#064e3b] flex items-center gap-1.5 cursor-pointer whitespace-nowrap'
    : 'h-10 px-3.5 rounded-xl bg-[#D71921] hover:bg-[#b8141b] text-white text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm';

  const secondaryBtnCls = isRetro
    ? 'h-9 px-3 rounded-none bg-[#18181b] hover:bg-[#27272a] text-emerald-300 font-mono font-bold text-xs border-2 border-emerald-500/60 shadow-[2px_2px_0px_#064e3b] flex items-center gap-1.5 cursor-pointer whitespace-nowrap'
    : isDark
    ? 'h-10 px-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap backdrop-blur-sm'
    : 'h-10 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)]/70 hover:bg-[var(--card-2)] text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap';

  if (!isPublicMode) {
    return (
      <div
        className={`flex items-center gap-2 flex-wrap ${
          centered ? 'justify-center' : 'justify-start'
        }`}
      >
        {isGuest && !previewMode && onUpgradeGuest && (
          <button type="button" onClick={onUpgradeGuest} className={primaryBtnCls}>
            <UserPlus size={14} />
            <span>Upgrade</span>
          </button>
        )}
        <button type="button" onClick={onEditProfile} className={primaryBtnCls}>
          <Edit3 size={13} />
          <span>Edit Profile</span>
        </button>
        <button type="button" onClick={() => onOpenStore?.()} className={secondaryBtnCls}>
          <ShoppingBag size={13} className="text-[#E8A317]" />
          <span>Store</span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className={secondaryBtnCls}
          title="Settings"
        >
          <Settings size={13} />
          <span>Settings</span>
        </button>
        {!previewMode && onOpenRewards && (
          <button
            type="button"
            onClick={onOpenRewards}
            className={
              isRetro
                ? secondaryBtnCls
                : 'h-10 px-3 rounded-xl border border-[#D71921]/35 bg-[#D71921]/10 hover:bg-[#D71921]/20 text-[#D71921] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap'
            }
          >
            <Sparkles size={13} />
            <span>Rewards</span>
          </button>
        )}
        {!previewMode && onOpenMessages && (
          <button
            type="button"
            onClick={onOpenMessages}
            className={`${secondaryBtnCls} relative`}
            title="Messages & Chat Requests"
          >
            <MessageSquare size={13} />
            <span className="hidden sm:inline">Messages</span>
            {incomingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#D71921] text-white text-[10px] font-mono font-bold leading-none">
                {incomingRequestsCount}
              </span>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 flex-wrap ${
        centered ? 'justify-center' : 'justify-start'
      }`}
    >
      {onFollowToggle && (
        <button
          type="button"
          onClick={onFollowToggle}
          disabled={followWorking}
          className={isFollowedByMe ? secondaryBtnCls : primaryBtnCls}
        >
          {isFollowedByMe ? (
            <>
              <UserCheck size={14} />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus size={14} />
              <span>Follow</span>
            </>
          )}
        </button>
      )}
      {onMessageClick && (
        <button
          type="button"
          onClick={onMessageClick}
          disabled={messageButtonDisabled}
          className={`${secondaryBtnCls} ${
            messageButtonDisabled ? 'opacity-60 cursor-not-allowed' : ''
          } ${messageButtonHighlight ? '!border-[#D71921] !text-[#D71921]' : ''}`}
        >
          <MessageSquare size={14} />
          <span>{messageButtonLabel}</span>
        </button>
      )}
      {onShareProfile && (
        <button type="button" onClick={onShareProfile} className={secondaryBtnCls}>
          <Share2 size={14} />
          <span>Share</span>
        </button>
      )}
      {crewName && onViewCrew && (
        <button type="button" onClick={onViewCrew} className={secondaryBtnCls}>
          <Users size={14} />
          <span>Crew</span>
        </button>
      )}
    </div>
  );
};

/**
 * Identity meta line: Display Name, @username, PRO Badge, Role Badge
 */
const IdentityMetaBlock: React.FC<{
  data: SharedProfileData;
  shortId: string;
  centered?: boolean;
  darkSurface?: boolean;
  showNameplateUnderName?: boolean;
  hideDisplayNameHeading?: boolean;
  onProBadgeClick?: () => void;
  followsMe?: boolean;
  isPublicMode?: boolean;
}> = ({
  data,
  shortId,
  centered = false,
  darkSurface = false,
  showNameplateUnderName = true,
  hideDisplayNameHeading = false,
  onProBadgeClick,
  followsMe,
  isPublicMode,
}) => {
  const textPrimary = darkSurface ? 'text-white' : 'text-[var(--text)]';
  const textMuted = darkSurface ? 'text-white/70' : 'text-[var(--muted)]';

  return (
    <div className={`flex flex-col gap-1.5 ${centered ? 'items-center text-center' : 'items-start text-left'}`}>
      {!hideDisplayNameHeading && (
        <div className={`flex items-center gap-2 flex-wrap ${centered ? 'justify-center' : ''}`}>
          <h1 className={`font-heading font-bold text-lg sm:text-xl leading-tight ${textPrimary}`}>
            {data.displayName}
          </h1>
          <span className={`font-mono text-xs ${textMuted}`}>@{data.username}</span>
          {data.proBadge && (
            <ProBadge
              design={data.proBadge}
              size="lg"
              animated
              priority
              onClick={onProBadgeClick}
              className="cursor-pointer"
            />
          )}
          {isPublicMode && followsMe && (
            <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-black/20 border border-white/15 text-xs">
              Follows you
            </span>
          )}
        </div>
      )}

      {showNameplateUnderName && (
        <div className={`flex items-center gap-2 flex-wrap ${centered ? 'justify-center' : ''}`}>
          <AlwaysVisibleNameplate
            nameplateId={data.nameplate}
            displayName={data.displayName}
            shortId={shortId}
            darkSurface={darkSurface}
          />
          {hideDisplayNameHeading && (
            <>
              <span className={`font-mono text-xs ${textMuted}`}>@{data.username}</span>
              {data.proBadge && (
                <ProBadge
                  design={data.proBadge}
                  size="lg"
                  animated
                  priority
                  onClick={onProBadgeClick}
                  className="cursor-pointer"
                />
              )}
            </>
          )}
        </div>
      )}

      <div className={`flex items-center gap-2 flex-wrap text-xs ${centered ? 'justify-center' : ''}`}>
        <RoleBadge
          role={data.role}
          customRole={data.customRole || undefined}
          isSuperAdmin={
            isAdminAccount(data.uid) ||
            data.role === 'superadmin' ||
            data.role === 'admin'
          }
          size="md"
        />
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-sans font-medium select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span>Active</span>
        </div>
        {data.bio && (
          <span className={`text-xs line-clamp-1 max-w-md ${textMuted}`}>{data.bio}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Top corner controls (Close button & View as others button)
 */
const TopBannerOverlayControls: React.FC<{
  onClose?: () => void;
  onPreviewAsPublic?: () => void;
  showPreviewBtn?: boolean;
}> = ({ onClose, onPreviewAsPublic, showPreviewBtn }) => (
  <>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 left-3 z-40 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer border border-white/20"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    )}
    {showPreviewBtn && onPreviewAsPublic && (
      <button
        type="button"
        onClick={onPreviewAsPublic}
        className="absolute top-3 right-3 z-40 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-heading font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
      >
        <Eye size={13} />
        <span className="hidden sm:inline">View as others</span>
      </button>
    )}
  </>
);

export const ProfileLayoutsRenderer: React.FC<ProfileLayoutHeaderProps> = (props) => {
  const {
    layout: rawLayout,
    data,
    isPublicMode = false,
    previewMode = false,
    shortId: propShortId,
    onClose,
    onPreviewAsPublic,
    onOpenStore,
    onOpenWallet,
    onOpenFollowers,
    onOpenFollowing,
    onProBadgeClick,
    followsMe,
    badgeRowNode,
    effectPlayKey = 1,
  } = props;

  const layout = normalizeProfileLayout(rawLayout ?? data.profile_layout ?? data.profileLayout);
  const accentColor = data.accent || '#D71921';
  const shortId = propShortId || deriveFallbackShortId(data.uid || '0');
  const avatarSize = previewMode ? 68 : 88;

  // Helper to render the Banner store item
  const renderBanner = (className = 'w-full h-28 sm:h-36') => (
    <div
      className={`relative overflow-hidden shrink-0 select-none ${className}`}
      data-store-item="banner"
    >
      <CosmeticErrorBoundary fallback={<DefaultDotMatrixBanner accentColor={accentColor} />}>
        <BannerRenderer
          bannerId={data.banner}
          accentColor={accentColor}
          animated={true}
          showReadabilityOverlay={true}
        />
      </CosmeticErrorBoundary>
    </div>
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 1. GAME-CARD (Default): banner on top, avatar overlapping at left, 4 stat tiles, nameplate under the name
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'game-card') {
    return (
      <div
        className="relative w-full overflow-hidden flex flex-col bg-[var(--card)] text-[var(--text)]"
        data-profile-layout="game-card"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />
        <div className="relative">
          {renderBanner('w-full h-28 sm:h-36')}
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />
        </div>

        <div className="px-4 sm:px-6 pb-5 flex flex-col gap-3.5 relative z-10">
          <div className="flex items-end justify-between -mt-11 sm:-mt-12">
            <div className="p-1 rounded-full bg-[var(--card)]">
              <AvatarWithGuaranteedRing data={data} size={avatarSize} />
            </div>
            {!isPublicMode && (
              <button
                type="button"
                onClick={onOpenWallet}
                className="mb-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--card-2)] border border-[#E8A317]/30 hover:border-[#E8A317] text-[#D97706] dark:text-[#FBBF24] font-mono text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <KobanIcon size={15} />
                <span>{data.coins.toLocaleString()}</span>
              </button>
            )}
          </div>

          <IdentityMetaBlock
            data={data}
            shortId={shortId}
            showNameplateUnderName={true}
            onProBadgeClick={onProBadgeClick}
            followsMe={followsMe}
            isPublicMode={isPublicMode}
          />

          {/* 4 Stat Tiles */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card-2)]/60 p-2.5 flex flex-col items-center justify-center text-center">
              <span className="font-mono font-bold text-sm sm:text-base text-[var(--text)]">
                LV.{data.level}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Level
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-2)]/60 hover:border-[#E8A317]/50 p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            >
              <span className="font-mono font-bold text-sm sm:text-base text-[#D97706] dark:text-[#FBBF24] flex items-center gap-1">
                <KobanIcon size={13} />
                {data.coins.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Kobans
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-2)]/60 hover:border-[#D71921]/40 p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            >
              <span className="font-mono font-bold text-sm sm:text-base text-[var(--text)]">
                {data.followers}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Followers
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-2)]/60 hover:border-[#D71921]/40 p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            >
              <span className="font-mono font-bold text-sm sm:text-base text-[var(--text)]">
                {data.following}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Following
              </span>
            </button>
          </div>

          {badgeRowNode}
          <ProfileActionButtonsRow props={props} />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CLEAN-SOCIAL: banner, avatar overlapping with stats at its right, then name, nameplate, buttons
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'clean-social') {
    return (
      <div
        className="relative w-full overflow-hidden flex flex-col bg-[var(--card)] text-[var(--text)]"
        data-profile-layout="clean-social"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />
        <div className="relative">
          {renderBanner('w-full h-24 sm:h-32')}
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />
        </div>

        <div className="px-4 sm:px-6 pb-5 flex flex-col gap-3.5 relative z-10">
          {/* Avatar overlapping on left + inline stats row on the right */}
          <div className="flex items-end justify-between gap-3 -mt-9 sm:-mt-11">
            <div className="p-1 rounded-full bg-[var(--card)] shrink-0">
              <AvatarWithGuaranteedRing data={data} size={avatarSize} />
            </div>

            <div className="flex-1 flex items-center justify-around bg-[var(--card-2)]/70 border border-[var(--border)] rounded-2xl py-2 px-2 sm:px-4">
              <div className="flex flex-col items-center">
                <span className="font-mono font-bold text-xs sm:text-sm text-[var(--text)]">
                  Lv.{data.level}
                </span>
                <span className="text-[10px] text-[var(--muted)]">Level</span>
              </div>
              <div className="w-px h-6 bg-[var(--border)]" />
              <button
                type="button"
                onClick={onOpenFollowers}
                className="flex flex-col items-center cursor-pointer hover:opacity-80"
              >
                <span className="font-mono font-bold text-xs sm:text-sm text-[var(--text)]">
                  {data.followers}
                </span>
                <span className="text-[10px] text-[var(--muted)]">Followers</span>
              </button>
              <div className="w-px h-6 bg-[var(--border)]" />
              <button
                type="button"
                onClick={onOpenFollowing}
                className="flex flex-col items-center cursor-pointer hover:opacity-80"
              >
                <span className="font-mono font-bold text-xs sm:text-sm text-[var(--text)]">
                  {data.following}
                </span>
                <span className="text-[10px] text-[var(--muted)]">Following</span>
              </button>
              <div className="w-px h-6 bg-[var(--border)]" />
              <button
                type="button"
                onClick={onOpenWallet}
                className="flex flex-col items-center cursor-pointer hover:opacity-80"
              >
                <span className="font-mono font-bold text-xs sm:text-sm text-[#D97706] dark:text-[#FBBF24] flex items-center gap-0.5">
                  <KobanIcon size={12} />
                  {data.coins.toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--muted)]">Kobans</span>
              </button>
            </div>
          </div>

          <IdentityMetaBlock
            data={data}
            shortId={shortId}
            showNameplateUnderName={true}
            onProBadgeClick={onProBadgeClick}
            followsMe={followsMe}
            isPublicMode={isPublicMode}
          />

          {badgeRowNode}
          <ProfileActionButtonsRow props={props} />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. DARK-PASSPORT: dark gradient card containing the banner, avatar and nameplate, with stat tiles
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'dark-passport') {
    return (
      <div
        className="relative w-full overflow-hidden flex flex-col bg-gradient-to-br from-[#0B0C10] via-[#12151E] to-[#1A1016] text-white p-3 sm:p-5"
        data-profile-layout="dark-passport"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />

        {/* Passport header bar */}
        <div className="relative z-10 flex items-center justify-between pb-2.5 mb-3 border-b border-white/10 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/90">
          <span>BOARDLY ACADEMIC PASSPORT · #{shortId}</span>
          <span>VERIFIED ID</span>
        </div>

        {/* Framed inner banner + avatar + nameplate */}
        <div className="relative z-10 rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-inner">
          <div className="relative">
            {renderBanner('w-full h-24 sm:h-32')}
            <TopBannerOverlayControls
              onClose={onClose}
              onPreviewAsPublic={onPreviewAsPublic}
              showPreviewBtn={!isPublicMode && !previewMode}
            />
          </div>

          <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3.5 -mt-8 sm:-mt-10 relative z-10">
            <div className="p-1 rounded-full bg-[#12151E] border border-white/15 self-start">
              <AvatarWithGuaranteedRing data={data} size={avatarSize} />
            </div>
            <div className="flex-1 pt-1 sm:pt-6">
              <IdentityMetaBlock
                data={data}
                shortId={shortId}
                darkSurface={true}
                showNameplateUnderName={true}
                onProBadgeClick={onProBadgeClick}
                followsMe={followsMe}
                isPublicMode={isPublicMode}
              />
            </div>
          </div>
        </div>

        {/* Passport Stat Tiles */}
        <div className="relative z-10 grid grid-cols-4 gap-2 mt-3">
          <div className="rounded-xl bg-white/[0.06] border border-white/10 p-2.5 text-center">
            <div className="text-[10px] font-mono uppercase text-white/50">Level</div>
            <div className="font-mono font-bold text-sm text-white mt-0.5">LV.{data.level}</div>
          </div>
          <button
            type="button"
            onClick={onOpenWallet}
            className="rounded-xl bg-white/[0.06] border border-white/10 p-2.5 text-center cursor-pointer hover:bg-white/10"
          >
            <div className="text-[10px] font-mono uppercase text-white/50">Kobans</div>
            <div className="font-mono font-bold text-sm text-amber-400 mt-0.5 flex items-center justify-center gap-1">
              <KobanIcon size={12} />
              {data.coins.toLocaleString()}
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenFollowers}
            className="rounded-xl bg-white/[0.06] border border-white/10 p-2.5 text-center cursor-pointer hover:bg-white/10"
          >
            <div className="text-[10px] font-mono uppercase text-white/50">Followers</div>
            <div className="font-mono font-bold text-sm text-white mt-0.5">{data.followers}</div>
          </button>
          <button
            type="button"
            onClick={onOpenFollowing}
            className="rounded-xl bg-white/[0.06] border border-white/10 p-2.5 text-center cursor-pointer hover:bg-white/10"
          >
            <div className="text-[10px] font-mono uppercase text-white/50">Following</div>
            <div className="font-mono font-bold text-sm text-white mt-0.5">{data.following}</div>
          </button>
        </div>

        <div className="relative z-10 mt-3 flex flex-col gap-2.5">
          {badgeRowNode}
          <ProfileActionButtonsRow props={props} variant="dark" />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. CENTERED-HERO: banner, large centered avatar, centered name, nameplate and 3 stats
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'centered-hero') {
    return (
      <div
        className="relative w-full overflow-hidden flex flex-col bg-[var(--card)] text-[var(--text)]"
        data-profile-layout="centered-hero"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />
        <div className="relative">
          {renderBanner('w-full h-28 sm:h-36')}
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />
        </div>

        <div className="px-4 sm:px-6 pb-5 flex flex-col items-center text-center gap-3 relative z-10">
          <div className="-mt-12 sm:-mt-14 p-1.5 rounded-full bg-[var(--card)] shadow-lg">
            <AvatarWithGuaranteedRing data={data} size={previewMode ? 76 : 96} />
          </div>

          <IdentityMetaBlock
            data={data}
            shortId={shortId}
            centered={true}
            showNameplateUnderName={true}
            onProBadgeClick={onProBadgeClick}
            followsMe={followsMe}
            isPublicMode={isPublicMode}
          />

          {/* 3 Centered Stat Columns */}
          <div className="w-full max-w-md grid grid-cols-3 gap-2.5 pt-1">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/60 py-2.5 px-3 flex flex-col items-center">
              <span className="font-mono font-extrabold text-sm sm:text-base text-[var(--text)]">
                LV.{data.level}
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--muted)]">
                Level
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/60 py-2.5 px-3 flex flex-col items-center cursor-pointer hover:border-[#E8A317]/50"
            >
              <span className="font-mono font-extrabold text-sm sm:text-base text-[#D97706] dark:text-[#FBBF24] flex items-center gap-1">
                <KobanIcon size={13} />
                {data.coins.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--muted)]">
                Kobans
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/60 py-2.5 px-3 flex flex-col items-center cursor-pointer hover:border-[#D71921]/40"
            >
              <span className="font-mono font-extrabold text-sm sm:text-base text-[var(--text)]">
                {data.followers} / {data.following}
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--muted)]">
                Followers
              </span>
            </button>
          </div>

          {badgeRowNode}
          <ProfileActionButtonsRow props={props} centered={true} />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. FULL-COVER: banner fills the top half with avatar, name and nameplate over a dark gradient, and a sheet with stats slides over it
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'full-cover') {
    return (
      <div
        className="relative w-full overflow-hidden flex flex-col bg-[var(--card)] text-[var(--text)]"
        data-profile-layout="full-cover"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />

        {/* Top half full-cover banner with avatar, name, and nameplate over dark gradient */}
        <div className="relative w-full h-56 sm:h-64 overflow-hidden">
          {renderBanner('w-full h-full')}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 pointer-events-none" />
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />

          <div className="absolute inset-x-0 bottom-6 px-4 sm:px-6 flex items-end gap-3.5 z-10">
            <AvatarWithGuaranteedRing data={data} size={avatarSize} />
            <div className="flex-1 min-w-0 pb-0.5">
              <IdentityMetaBlock
                data={data}
                shortId={shortId}
                darkSurface={true}
                showNameplateUnderName={true}
                onProBadgeClick={onProBadgeClick}
                followsMe={followsMe}
                isPublicMode={isPublicMode}
              />
            </div>
          </div>
        </div>

        {/* Sliding bottom sheet with stats & buttons */}
        <div className="relative z-20 -mt-5 rounded-t-3xl bg-[var(--card)] border-t border-[var(--border)] px-4 sm:px-6 pt-3 pb-5 flex flex-col gap-3.5 shadow-[0_-8px_24px_rgba(0,0,0,0.2)]">
          <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto" />
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-[var(--card-2)]/70 border border-[var(--border)] p-2 text-center">
              <div className="font-mono font-bold text-xs sm:text-sm text-[var(--text)]">
                LV.{data.level}
              </div>
              <div className="text-[10px] text-[var(--muted)]">Level</div>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="rounded-xl bg-[var(--card-2)]/70 border border-[var(--border)] p-2 text-center cursor-pointer"
            >
              <div className="font-mono font-bold text-xs sm:text-sm text-[#D97706] dark:text-[#FBBF24] flex items-center justify-center gap-0.5">
                <KobanIcon size={12} />
                {data.coins.toLocaleString()}
              </div>
              <div className="text-[10px] text-[var(--muted)]">Kobans</div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="rounded-xl bg-[var(--card-2)]/70 border border-[var(--border)] p-2 text-center cursor-pointer"
            >
              <div className="font-mono font-bold text-xs sm:text-sm text-[var(--text)]">
                {data.followers}
              </div>
              <div className="text-[10px] text-[var(--muted)]">Followers</div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="rounded-xl bg-[var(--card-2)]/70 border border-[var(--border)] p-2 text-center cursor-pointer"
            >
              <div className="font-mono font-bold text-xs sm:text-sm text-[var(--text)]">
                {data.following}
              </div>
              <div className="text-[10px] text-[var(--muted)]">Following</div>
            </button>
          </div>
          {badgeRowNode}
          <ProfileActionButtonsRow props={props} />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. TRADING-CARD: gold-bordered collectible card with the nameplate as the title, the banner as the art window and the avatar at the corner
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'trading-card') {
    return (
      <div
        className="relative w-full overflow-hidden p-3 sm:p-4 bg-gradient-to-br from-[#2B1F0A] via-[#13110E] to-[#291B07] text-white border-4 border-[#F59E0B] shadow-[inset_0_0_24px_rgba(245,158,11,0.25)]"
        data-profile-layout="trading-card"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />

        {/* Collectible Card Top Header Bar: Nameplate as Title + Level/HP */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-3 py-2 rounded-t-xl bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-amber-500/25 border border-amber-400/40">
          <div className="flex items-center gap-2 min-w-0">
            <AlwaysVisibleNameplate
              nameplateId={data.nameplate}
              displayName={data.displayName}
              shortId={shortId}
              darkSurface={true}
            />
            {data.proBadge && (
              <ProBadge
                design={data.proBadge}
                size="sm"
                animated
                priority
                onClick={onProBadgeClick}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono font-black text-xs text-amber-300 shrink-0">
            <Trophy size={13} className="text-amber-400" />
            <span>LV.{data.level}</span>
          </div>
        </div>

        {/* Art Window (Banner) + Corner Avatar */}
        <div className="relative z-10 mt-2 rounded-xl overflow-hidden border-2 border-amber-400/60 shadow-lg">
          {renderBanner('w-full h-32 sm:h-40')}
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />
          <div className="absolute bottom-2 right-2 z-20 p-1 rounded-full bg-[#13110E]/90 border-2 border-amber-400 shadow-xl">
            <AvatarWithGuaranteedRing data={data} size={previewMode ? 58 : 72} />
          </div>
          <div className="absolute bottom-2 left-2.5 z-20 px-2 py-0.5 rounded bg-black/75 border border-amber-400/40 font-mono text-[11px] text-amber-200">
            {data.displayName} · @{data.username}
          </div>
        </div>

        {/* Card Lore & Stat Attributes Box */}
        <div className="relative z-10 mt-2.5 rounded-xl bg-black/45 border border-amber-400/30 p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <RoleBadge
              role={data.role}
              customRole={data.customRole || undefined}
              isSuperAdmin={
                isAdminAccount(data.uid) ||
                data.role === 'superadmin' ||
                data.role === 'admin'
              }
              size="md"
            />
            <div className="flex items-center gap-3 font-mono text-xs text-amber-200">
              <button type="button" onClick={onOpenWallet} className="flex items-center gap-1 cursor-pointer">
                <KobanIcon size={13} />
                <strong>{data.coins.toLocaleString()}</strong>
              </button>
              <button type="button" onClick={onOpenFollowers} className="cursor-pointer">
                <strong>{data.followers}</strong> Followers
              </button>
              <button type="button" onClick={onOpenFollowing} className="cursor-pointer">
                <strong>{data.following}</strong> Following
              </button>
            </div>
          </div>
          {badgeRowNode}
          <ProfileActionButtonsRow props={props} variant="dark" />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. RETRO-PIXEL: dark monospace window "username.exe" with square blocky buttons
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'retro-pixel') {
    return (
      <div
        className="relative w-full overflow-hidden bg-[#090D16] text-emerald-300 font-mono border-2 border-emerald-500/70 shadow-[0_0_24px_rgba(16,185,129,0.15)]"
        data-profile-layout="retro-pixel"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor="#10B981"
          playKey={effectPlayKey}
        />

        {/* Retro OS Title Bar: username.exe */}
        <div className="relative z-20 flex items-center justify-between px-3 py-1.5 bg-emerald-950/90 border-b-2 border-emerald-500/70">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <span className="w-2.5 h-2.5 bg-emerald-400 inline-block" />
            <span>{data.username}.exe</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!isPublicMode && !previewMode && onPreviewAsPublic && (
              <button
                type="button"
                onClick={onPreviewAsPublic}
                className="px-2 py-0.5 bg-black border border-emerald-400 text-[10px] text-emerald-300 cursor-pointer"
              >
                [VIEW_PUBLIC]
              </button>
            )}
            <span className="px-1.5 py-0.5 bg-black border border-emerald-500/60 text-[10px] text-emerald-400">
              _
            </span>
            <span className="px-1.5 py-0.5 bg-black border border-emerald-500/60 text-[10px] text-emerald-400">
              □
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-1.5 py-0.5 bg-red-600 text-white border border-red-300 text-[10px] font-bold cursor-pointer"
              >
                X
              </button>
            )}
          </div>
        </div>

        {/* Banner Viewport */}
        <div className="relative border-b-2 border-emerald-500/50">
          {renderBanner('w-full h-24 sm:h-32')}
        </div>

        {/* Terminal Body */}
        <div className="relative z-10 p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3.5">
            <AvatarWithGuaranteedRing
              data={data}
              size={previewMode ? 64 : 80}
              squarePixel={true}
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-bold text-white">
                  {data.displayName}
                </span>
                <span className="text-xs text-emerald-400">@{data.username}</span>
                {data.proBadge && (
                  <ProBadge
                    design={data.proBadge}
                    size="sm"
                    animated
                    priority
                    onClick={onProBadgeClick}
                  />
                )}
              </div>
              <AlwaysVisibleNameplate
                nameplateId={data.nameplate}
                displayName={data.displayName}
                shortId={shortId}
                darkSurface={true}
              />
              <div className="pt-0.5">
                <RoleBadge
                  role={data.role}
                  customRole={data.customRole || undefined}
                  isSuperAdmin={
                    isAdminAccount(data.uid) ||
                    data.role === 'superadmin' ||
                    data.role === 'admin'
                  }
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Blocky Terminal Stats */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="bg-black border-2 border-emerald-500/50 p-2 text-center">
              <div className="text-[9px] text-emerald-500 uppercase">LVL</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-200">{data.level}</div>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="bg-black border-2 border-emerald-500/50 p-2 text-center cursor-pointer"
            >
              <div className="text-[9px] text-emerald-500 uppercase">KOBANS</div>
              <div className="text-xs sm:text-sm font-bold text-amber-300">
                {data.coins.toLocaleString()}
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="bg-black border-2 border-emerald-500/50 p-2 text-center cursor-pointer"
            >
              <div className="text-[9px] text-emerald-500 uppercase">FOLLOWERS</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-200">{data.followers}</div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="bg-black border-2 border-emerald-500/50 p-2 text-center cursor-pointer"
            >
              <div className="text-[9px] text-emerald-500 uppercase">FOLLOWING</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-200">{data.following}</div>
            </button>
          </div>

          {badgeRowNode}
          <ProfileActionButtonsRow props={props} variant="retro" />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. GLASS: the banner is the full background and a frosted glass panel holds the avatar, name, nameplate and stats
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'glass') {
    return (
      <div
        className="relative w-full overflow-hidden p-4 sm:p-6 text-white min-h-[290px] flex flex-col justify-end"
        data-profile-layout="glass"
      >
        {/* Full Background Banner */}
        <div className="absolute inset-0 z-0">
          {renderBanner('w-full h-full')}
          <div className="absolute inset-0 bg-black/35" />
        </div>

        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />

        <TopBannerOverlayControls
          onClose={onClose}
          onPreviewAsPublic={onPreviewAsPublic}
          showPreviewBtn={!isPublicMode && !previewMode}
        />

        {/* Frosted Glass Panel */}
        <div className="relative z-10 rounded-3xl bg-black/45 dark:bg-black/55 backdrop-blur-xl border border-white/25 p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
            <AvatarWithGuaranteedRing data={data} size={avatarSize} />
            <div className="flex-1 min-w-0">
              <IdentityMetaBlock
                data={data}
                shortId={shortId}
                darkSurface={true}
                showNameplateUnderName={true}
                onProBadgeClick={onProBadgeClick}
                followsMe={followsMe}
                isPublicMode={isPublicMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="rounded-xl bg-white/10 border border-white/15 p-2 text-center backdrop-blur-md">
              <div className="font-mono font-bold text-xs sm:text-sm text-white">
                LV.{data.level}
              </div>
              <div className="text-[10px] text-white/70">Level</div>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="rounded-xl bg-white/10 border border-white/15 p-2 text-center backdrop-blur-md cursor-pointer"
            >
              <div className="font-mono font-bold text-xs sm:text-sm text-amber-300 flex items-center justify-center gap-1">
                <KobanIcon size={12} />
                {data.coins.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/70">Kobans</div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="rounded-xl bg-white/10 border border-white/15 p-2 text-center backdrop-blur-md cursor-pointer"
            >
              <div className="font-mono font-bold text-xs sm:text-sm text-white">
                {data.followers}
              </div>
              <div className="text-[10px] text-white/70">Followers</div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="rounded-xl bg-white/10 border border-white/15 p-2 text-center backdrop-blur-md cursor-pointer"
            >
              <div className="font-mono font-bold text-xs sm:text-sm text-white">
                {data.following}
              </div>
              <div className="text-[10px] text-white/70">Following</div>
            </button>
          </div>

          {badgeRowNode}
          <ProfileActionButtonsRow props={props} variant="dark" />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. ID-BADGE: lanyard clip and a white badge with the banner, centered avatar, nameplate, barcode and stats
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'id-badge') {
    return (
      <div
        className="relative w-full overflow-hidden p-3 sm:p-5 bg-[#E5E7EB] dark:bg-[#111216] flex flex-col items-center"
        data-profile-layout="id-badge"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />

        {/* Lanyard Clip at Top */}
        <div className="relative z-10 flex flex-col items-center -mb-2">
          <div className="w-8 h-5 rounded-t-lg border-2 border-zinc-400 dark:border-zinc-500 bg-zinc-300 dark:bg-zinc-700" />
          <div className="w-16 h-3.5 rounded-full bg-zinc-700 dark:bg-zinc-300 shadow-md flex items-center justify-center">
            <div className="w-8 h-1 rounded-full bg-white/60 dark:bg-black/60" />
          </div>
        </div>

        {/* Crisp White/Credential Badge Card */}
        <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white dark:bg-[#18191E] text-zinc-900 dark:text-white border border-black/10 dark:border-white/15 shadow-xl overflow-hidden flex flex-col items-center text-center">
          <div className="relative w-full">
            {renderBanner('w-full h-24 sm:h-28')}
            <TopBannerOverlayControls
              onClose={onClose}
              onPreviewAsPublic={onPreviewAsPublic}
              showPreviewBtn={!isPublicMode && !previewMode}
            />
          </div>

          <div className="-mt-10 p-1 rounded-full bg-white dark:bg-[#18191E] shadow-md">
            <AvatarWithGuaranteedRing data={data} size={avatarSize} />
          </div>

          <div className="px-4 sm:px-6 pt-2 pb-4 w-full flex flex-col items-center gap-2.5">
            <IdentityMetaBlock
              data={data}
              shortId={shortId}
              centered={true}
              showNameplateUnderName={true}
              onProBadgeClick={onProBadgeClick}
              followsMe={followsMe}
              isPublicMode={isPublicMode}
            />

            {/* Credential Stats Strip */}
            <div className="w-full grid grid-cols-4 gap-1.5 py-2 px-3 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-xs font-mono">
              <div>
                <div className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400">LVL</div>
                <div className="font-bold">{data.level}</div>
              </div>
              <button type="button" onClick={onOpenWallet} className="cursor-pointer">
                <div className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400">KOBANS</div>
                <div className="font-bold text-amber-600 dark:text-amber-400">
                  {data.coins.toLocaleString()}
                </div>
              </button>
              <button type="button" onClick={onOpenFollowers} className="cursor-pointer">
                <div className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400">FOLLOWERS</div>
                <div className="font-bold">{data.followers}</div>
              </button>
              <button type="button" onClick={onOpenFollowing} className="cursor-pointer">
                <div className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400">FOLLOWING</div>
                <div className="font-bold">{data.following}</div>
              </button>
            </div>

            {/* Barcode Strip */}
            <div className="w-full py-2 px-4 rounded-xl bg-zinc-50 dark:bg-black/40 border border-dashed border-zinc-300 dark:border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-0.5 h-6 overflow-hidden">
                {[2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 2, 1, 3, 4, 1, 2].map(
                  (w, idx) => (
                    <span
                      key={idx}
                      className="h-full bg-zinc-900 dark:bg-zinc-200 inline-block"
                      style={{ width: `${w * 2}px`, marginRight: '2px' }}
                    />
                  )
                )}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0">
                <QrCode size={14} />
                <span>ID-{shortId}</span>
              </div>
            </div>

            {badgeRowNode}
            <ProfileActionButtonsRow props={props} centered={true} />
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 10. LOADOUT-SHOWCASE: slim banner, avatar and name, then a list of every equipped item with a thumbnail, a label and a Change button
  // ───────────────────────────────────────────────────────────────────────────
  const bannerMeta = data.banner ? getCosmeticById(data.banner) : null;
  const avatarMeta = data.avatar ? getCosmeticById(data.avatar) : null;
  const frameMeta = data.frame ? getCosmeticById(data.frame) : null;
  const plateMeta = data.nameplate ? getCosmeticById(data.nameplate) : null;
  const effectMeta = data.effect ? getCosmeticById(data.effect) : null;

  const equippedList = [
    {
      key: 'banner',
      category: 'Banner',
      label: bannerMeta?.name || 'Dot Matrix Default Banner',
      icon: <ImageIcon size={13} className="text-[#D71921]" />,
      thumb: (
        <div className="w-14 h-8 rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
          <CosmeticErrorBoundary fallback={<DefaultDotMatrixBanner accentColor={accentColor} />}>
            <BannerRenderer
              bannerId={data.banner}
              accentColor={accentColor}
              animated={false}
              showReadabilityOverlay={false}
            />
          </CosmeticErrorBoundary>
        </div>
      ),
    },
    {
      key: 'avatar',
      category: 'Avatar (PFP)',
      label: avatarMeta?.name || data.avatar || 'Standard Student Avatar',
      icon: <UserIcon size={13} className="text-[#D71921]" />,
      thumb: (
        <div className="w-9 h-9 rounded-full overflow-hidden border border-[var(--border)] flex items-center justify-center bg-[var(--card-2)] shrink-0">
          <AvatarPicture itemId={data.avatar} size={34} />
        </div>
      ),
    },
    {
      key: 'frame',
      category: 'Avatar Frame',
      label: frameMeta?.name || 'Crimson Standard Ring',
      icon: <Disc size={13} className="text-[#D71921]" />,
      thumb: (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--card-2)] border border-[var(--border)] shrink-0">
          <AvatarFrame itemId={data.frame || 'none'} size={32}>
            <div className="w-5 h-5 rounded-full bg-[#D71921]/20 border border-[#D71921]/60" />
          </AvatarFrame>
        </div>
      ),
    },
    {
      key: 'nameplate',
      category: 'Nameplate',
      label: plateMeta?.name || 'Standard Student Nameplate',
      icon: <Tag size={13} className="text-[#D71921]" />,
      thumb: (
        <div className="px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--border)] max-w-[120px] overflow-hidden shrink-0">
          <AlwaysVisibleNameplate
            nameplateId={data.nameplate}
            displayName={data.displayName}
            shortId={shortId}
          />
        </div>
      ),
    },
    {
      key: 'effect',
      category: 'Profile Effect',
      label: effectMeta?.name || 'Ambient Header Sparkles',
      icon: <Wand2 size={13} className="text-[#D71921]" />,
      thumb: (
        <div className="w-12 h-8 rounded-lg bg-[#141418] border border-white/15 relative overflow-hidden flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-amber-400 animate-pulse" />
        </div>
      ),
    },
  ];

  return (
    <div
      className="relative w-full overflow-hidden flex flex-col bg-[var(--card)] text-[var(--text)]"
      data-profile-layout="loadout-showcase"
    >
      <HeaderProfileEffectOverlay
        effectId={data.effect}
        accentColor={accentColor}
        playKey={effectPlayKey}
      />

      {/* Slim Banner */}
      <div className="relative">
        {renderBanner('w-full h-20 sm:h-24')}
        <TopBannerOverlayControls
          onClose={onClose}
          onPreviewAsPublic={onPreviewAsPublic}
          showPreviewBtn={!isPublicMode && !previewMode}
        />
      </div>

      <div className="px-4 sm:px-6 pb-5 flex flex-col gap-3.5 relative z-10">
        {/* Header with Avatar, Name, Nameplate, and Inline Stats */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-8 sm:-mt-10">
          <div className="flex items-end gap-3">
            <div className="p-1 rounded-full bg-[var(--card)]">
              <AvatarWithGuaranteedRing data={data} size={previewMode ? 64 : 80} />
            </div>
            <div className="pb-1">
              <IdentityMetaBlock
                data={data}
                shortId={shortId}
                showNameplateUnderName={true}
                onProBadgeClick={onProBadgeClick}
                followsMe={followsMe}
                isPublicMode={isPublicMode}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[var(--muted)]">
            <span>
              <strong className="text-[var(--text)]">LV.{data.level}</strong>
            </span>
            <span>·</span>
            <button type="button" onClick={onOpenWallet} className="flex items-center gap-1 cursor-pointer">
              <KobanIcon size={12} />
              <strong className="text-[#D97706] dark:text-[#FBBF24]">
                {data.coins.toLocaleString()}
              </strong>
            </button>
            <span>·</span>
            <button type="button" onClick={onOpenFollowers} className="cursor-pointer">
              <strong className="text-[var(--text)]">{data.followers}</strong> followers
            </button>
          </div>
        </div>

        {/* Equipped Store Items List with Thumbnail, Label & Change Button */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/50 divide-y divide-[var(--border)] overflow-hidden">
          <div className="px-3.5 py-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] bg-[var(--card-2)]">
            <span className="flex items-center gap-1.5">
              <Layers size={12} className="text-[#D71921]" />
              <span>Equipped Loadout (All 5 Store Slots)</span>
            </span>
            <span>5 / 5 Active</span>
          </div>
          {equippedList.map((slot) => (
            <div
              key={slot.key}
              className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--card-2)]/80 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {slot.thumb}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[var(--muted)]">
                    {slot.icon}
                    <span>{slot.category}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-heading font-semibold text-[var(--text)] truncate">
                    {slot.label}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenStore?.(slot.key)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[#D71921] text-xs font-heading font-semibold text-[var(--text)] transition-colors cursor-pointer shrink-0"
              >
                Change
              </button>
            </div>
          ))}
        </div>

        {badgeRowNode}
        <ProfileActionButtonsRow props={props} />
      </div>
    </div>
  );
};
