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
  Trophy,
  QrCode,
  Layers,
  Image as ImageIcon,
  User as UserIcon,
  Disc,
  Tag,
  Wand2,
  Camera,
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
  onChangeAvatar?: () => void;
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
      data-store-item="profile-effect"
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
 * Always renders the Nameplate item (never hidden, never clipped).
 * Scales cleanly to fit its container (`max-width: 100%`, `object-fit: contain`).
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

  const scaleFitClasses =
    'inline-flex items-center max-w-full min-w-0 overflow-hidden [&_img]:max-w-full [&_img]:object-contain [&_video]:max-w-full [&_video]:object-contain [&_[data-nameplate-id]]:!min-w-0 [&_[data-nameplate-id]]:!max-w-full [&_[data-nameplate-id]]:!w-auto';

  if (hasEquippedPlate && nameplateId) {
    return (
      <div
        className={`${scaleFitClasses} ${darkSurface ? 'dark-surface-preserve' : ''} ${className}`}
        style={{ maxWidth: '100%', objectFit: 'contain' }}
        data-store-item="nameplate"
      >
        <Nameplate
          itemId={nameplateId}
          name={displayName}
          shortId={shortId}
          className="max-w-full min-w-0"
        />
      </div>
    );
  }

  return (
    <div
      data-store-item="nameplate"
      style={
        darkSurface
          ? {
              maxWidth: '100%',
              objectFit: 'contain',
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              borderColor: 'rgba(255, 255, 255, 0.28)',
              color: '#FFFFFF',
            }
          : { maxWidth: '100%', objectFit: 'contain' }
      }
      className={`${scaleFitClasses} gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-heading font-semibold shadow-sm ${
        darkSurface
          ? 'dark-surface-preserve text-white'
          : 'bg-black/[0.04] dark:bg-white/[0.08] border-black/10 dark:border-white/15 text-[var(--text)]'
      } ${className}`}
    >
      <Tag size={11} className="text-[#D71921] shrink-0" />
      <Nameplate
        itemId={nameplateId || 'default-plate'}
        name={displayName}
        shortId={shortId}
        className={darkSurface ? 'dark-surface-preserve !text-white max-w-full min-w-0' : 'max-w-full min-w-0'}
      />
    </div>
  );
};

const AvatarEditContext = React.createContext<{
  canEditAvatar: boolean;
  onChangeAvatar?: () => void;
}>({
  canEditAvatar: false,
});

/**
 * Always renders Avatar + Avatar Frame/Ring with guaranteed z-index and overflow visibility.
 */
const AvatarWithGuaranteedRing: React.FC<{
  data: SharedProfileData;
  size: number;
  showLevelBadge?: boolean;
  squarePixel?: boolean;
  className?: string;
}> = ({ data, size, showLevelBadge = true, squarePixel = false, className = '' }) => {
  const { canEditAvatar, onChangeAvatar } = React.useContext(AvatarEditContext);
  const hasEquippedFrame = Boolean(data.frame && data.frame !== 'none');
  const interactive = Boolean(canEditAvatar && onChangeAvatar);

  return (
    <div
      className={`relative z-30 inline-flex items-center justify-center shrink-0 overflow-visible ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      data-store-item="avatar-and-frame"
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onChangeAvatar?.();
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? 'Change profile picture' : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onChangeAvatar?.();
              }
            }
          : undefined
      }
    >
      <div
        className={`relative inline-flex items-center justify-center overflow-visible transition-transform ${
          interactive ? 'group-hover:scale-[1.02]' : ''
        } ${
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
          className={`dark-surface-preserve absolute -bottom-1 ${
            interactive ? '-left-1' : '-right-1'
          } z-40 px-2 py-0.5 ${
            squarePixel
              ? 'rounded-none border border-emerald-300 bg-emerald-700'
              : 'rounded-full border-2 border-[#121216] bg-gradient-to-r from-amber-600 to-amber-500'
          } text-white font-mono font-black text-[10px] shadow-md flex items-center gap-0.5 select-none`}
          style={{ color: '#FFFFFF' }}
          title={`Level ${data.level}`}
        >
          <span className="text-[8px] font-extrabold" style={{ color: '#FDE68A' }}>
            LV
          </span>
          <span style={{ color: '#FFFFFF' }}>{data.level}</span>
        </div>
      )}
      {interactive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChangeAvatar?.();
          }}
          className="dark-surface-preserve absolute -bottom-1 -right-1 z-40 w-7 h-7 rounded-full border-2 border-[#121216] bg-[#D71921] hover:bg-[#b51219] text-white shadow-md flex items-center justify-center transition-colors cursor-pointer"
          style={{ color: '#FFFFFF' }}
          title="Change profile picture"
          aria-label="Change profile picture"
          data-testid="avatar-edit-badge"
        >
          <Camera size={13} />
        </button>
      )}
    </div>
  );
};

/**
 * Shared Action Buttons Row — keeps Edit Profile, Store, and Settings readable in every layout.
 * On dark/glass/retro layouts, Store and Settings use light button backgrounds with dark text.
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
    ? 'h-9 px-3 rounded-none bg-[#34D399] hover:bg-[#6EE7B7] font-mono font-bold text-xs border-2 border-[#A7F3D0] shadow-[2px_2px_0px_#064e3b] flex items-center gap-1.5 cursor-pointer whitespace-nowrap'
    : 'h-9 sm:h-10 px-3.5 rounded-xl bg-[#D71921] hover:bg-[#b8141b] text-white text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm';

  const primaryBtnStyle: React.CSSProperties | undefined = isRetro
    ? { backgroundColor: '#34D399', color: '#06281E', borderColor: '#A7F3D0' }
    : { backgroundColor: '#D71921', color: '#FFFFFF' };

  // Light button backgrounds with dark text on dark/glass/retro layouts so Store & Settings are always crisp and readable
  const secondaryBtnCls = isRetro
    ? 'h-9 px-3 rounded-none font-mono font-bold text-xs border-2 border-[#34D399] shadow-[2px_2px_0px_#064e3b] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors'
    : isDark
    ? 'h-9 sm:h-10 px-3.5 rounded-xl border text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm'
    : 'h-9 sm:h-10 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)] hover:bg-[var(--surface-hover)] text-[var(--text)] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap';

  const secondaryBtnStyle: React.CSSProperties | undefined = isRetro
    ? { backgroundColor: '#ECFDF5', color: '#064E3B', borderColor: '#34D399' }
    : isDark
    ? { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: 'rgba(255,255,255,0.85)' }
    : undefined;

  if (!isPublicMode) {
    return (
      <div
        className={`flex items-center gap-2 flex-wrap ${
          centered ? 'justify-center' : 'justify-start'
        }`}
      >
        {isGuest && !previewMode && onUpgradeGuest && (
          <button
            type="button"
            onClick={onUpgradeGuest}
            className={primaryBtnCls}
            style={primaryBtnStyle}
          >
            <UserPlus size={14} />
            <span>Upgrade</span>
          </button>
        )}
        <button
          type="button"
          onClick={onEditProfile}
          className={primaryBtnCls}
          style={primaryBtnStyle}
        >
          <Edit3 size={13} />
          <span>Edit Profile</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenStore?.()}
          className={secondaryBtnCls}
          style={secondaryBtnStyle}
        >
          <ShoppingBag size={13} style={{ color: isRetro ? '#047857' : '#D97706' }} />
          <span>Store</span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className={secondaryBtnCls}
          style={secondaryBtnStyle}
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
              isRetro || isDark
                ? secondaryBtnCls
                : 'h-9 sm:h-10 px-3 rounded-xl border border-[#D71921]/35 bg-[#D71921]/10 hover:bg-[#D71921]/20 text-[#D71921] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap'
            }
            style={isRetro || isDark ? secondaryBtnStyle : undefined}
          >
            <Sparkles size={13} style={{ color: '#D71921' }} />
            <span>Rewards</span>
          </button>
        )}
        {!previewMode && onOpenMessages && (
          <button
            type="button"
            onClick={onOpenMessages}
            className={`${secondaryBtnCls} relative`}
            style={secondaryBtnStyle}
            title="Messages & Chat Requests"
          >
            <MessageSquare size={13} />
            <span className="hidden sm:inline">Messages</span>
            {incomingRequestsCount > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full bg-[#D71921] text-white text-[10px] font-mono font-bold leading-none"
                style={{ backgroundColor: '#D71921', color: '#FFFFFF' }}
              >
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
          style={isFollowedByMe ? secondaryBtnStyle : primaryBtnStyle}
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
          style={secondaryBtnStyle}
        >
          <MessageSquare size={14} />
          <span>{messageButtonLabel}</span>
        </button>
      )}
      {onShareProfile && (
        <button
          type="button"
          onClick={onShareProfile}
          className={secondaryBtnCls}
          style={secondaryBtnStyle}
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>
      )}
      {crewName && onViewCrew && (
        <button
          type="button"
          onClick={onViewCrew}
          className={secondaryBtnCls}
          style={secondaryBtnStyle}
        >
          <Users size={14} />
          <span>Crew</span>
        </button>
      )}
    </div>
  );
};

/**
 * Identity meta block: keeps Display Name, @username, PRO Badge, Nameplate, Super Admin, and Active
 * on neat rows with 8px gaps (`gap-2`) and proper wrapping.
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
  const primaryColorStyle: React.CSSProperties | undefined = darkSurface
    ? { color: '#FFFFFF' }
    : undefined;
  const mutedColorStyle: React.CSSProperties | undefined = darkSurface
    ? { color: 'rgba(255, 255, 255, 0.82)' }
    : undefined;
  const activeColorStyle: React.CSSProperties = darkSurface
    ? { color: '#6EE7B7' }
    : { color: '#10B981' };

  return (
    <div
      className={`flex flex-col gap-2 min-w-0 max-w-full ${
        darkSurface ? 'dark-surface-preserve' : ''
      } ${centered ? 'items-center text-center' : 'items-start text-left'}`}
    >
      {/* Row 1: Display Name, @username, PRO Badge (8px gaps, neat wrapping) */}
      {!hideDisplayNameHeading && (
        <div
          className={`flex items-center gap-2 flex-wrap min-w-0 max-w-full ${
            centered ? 'justify-center' : 'justify-start'
          }`}
        >
          <h1
            className={`font-heading font-bold text-base sm:text-lg leading-tight truncate max-w-full ${
              darkSurface ? 'text-white' : 'text-[var(--text)]'
            }`}
            style={primaryColorStyle}
          >
            {data.displayName}
          </h1>
          <span
            className={`font-mono text-xs shrink-0 ${
              darkSurface ? 'text-white/85' : 'text-[var(--muted)]'
            }`}
            style={mutedColorStyle}
          >
            @{data.username}
          </span>
          {data.proBadge && (
            <ProBadge
              design={data.proBadge}
              size="md"
              animated
              priority
              onClick={onProBadgeClick}
              className="cursor-pointer shrink-0"
            />
          )}
          {isPublicMode && followsMe && (
            <span
              className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-black/25 border border-white/20 shrink-0"
              style={primaryColorStyle}
            >
              Follows you
            </span>
          )}
        </div>
      )}

      {/* Row 2: Nameplate, Super Admin / Role Badge, Active status (8px gaps, neat wrapping) */}
      <div
        className={`flex items-center gap-2 flex-wrap min-w-0 max-w-full ${
          centered ? 'justify-center' : 'justify-start'
        }`}
      >
        {showNameplateUnderName && (
          <AlwaysVisibleNameplate
            nameplateId={data.nameplate}
            displayName={data.displayName}
            shortId={shortId}
            darkSurface={darkSurface}
          />
        )}
        {hideDisplayNameHeading && (
          <>
            <span
              className={`font-mono text-xs shrink-0 ${
                darkSurface ? 'text-white/85' : 'text-[var(--muted)]'
              }`}
              style={mutedColorStyle}
            >
              @{data.username}
            </span>
            {data.proBadge && (
              <ProBadge
                design={data.proBadge}
                size="md"
                animated
                priority
                onClick={onProBadgeClick}
                className="cursor-pointer shrink-0"
              />
            )}
          </>
        )}
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
        <div
          className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold select-none shrink-0"
          style={activeColorStyle}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: darkSurface ? '#34D399' : '#10B981' }}
          />
          <span style={activeColorStyle}>Active</span>
        </div>
      </div>

      {data.bio && (
        <p
          className={`text-xs line-clamp-1 max-w-md ${
            darkSurface ? 'text-white/80' : 'text-[var(--muted)]'
          }`}
          style={mutedColorStyle}
        >
          {data.bio}
        </p>
      )}
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
        className="dark-surface-preserve absolute top-3 left-3 z-40 w-8 h-8 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer border border-white/25"
        style={{ color: '#FFFFFF' }}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    )}
    {showPreviewBtn && onPreviewAsPublic && (
      <button
        type="button"
        onClick={onPreviewAsPublic}
        className="dark-surface-preserve absolute top-3 right-3 z-40 px-2.5 py-1 rounded-full bg-black/65 hover:bg-black/85 text-white text-[11px] font-heading font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/25 transition-colors cursor-pointer"
        style={{ color: '#FFFFFF' }}
      >
        <Eye size={13} />
        <span className="hidden sm:inline">View as others</span>
      </button>
    )}
  </>
);

const ProfileLayoutsRendererInner: React.FC<ProfileLayoutHeaderProps> = (props) => {
  const {
    layout: rawLayout,
    data,
    isPublicMode = false,
    previewMode = false,
    shortId: propShortId,
    onClose,
    onPreviewAsPublic,
    onChangeAvatar,
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
  const avatarSize = previewMode ? 68 : 84;

  // Stat grid classes: 2x2 on narrow widths / preview cards, 4 columns on wider screens so labels never clip
  const statGridCols = previewMode ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';

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
        <div className="relative z-10">
          {renderBanner('w-full h-28 sm:h-36')}
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />
        </div>

        <div className="px-4 sm:px-6 pb-5 flex flex-col gap-3.5 relative z-20">
          <div className="flex items-end justify-between -mt-10 sm:-mt-12 relative z-30">
            <div className="p-1 rounded-full bg-[var(--card)] overflow-visible">
              <AvatarWithGuaranteedRing data={data} size={avatarSize} />
            </div>
            {!isPublicMode && (
              <button
                type="button"
                onClick={onOpenWallet}
                className="mb-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--card-2)] border border-[#E8A317]/35 hover:border-[#E8A317] text-[#B45309] dark:text-[#FBBF24] font-mono text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <KobanIcon size={14} />
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

          {/* 4 Stat Tiles: 2x2 on narrow/preview widths, never clipping or overlapping labels */}
          <div className={`grid ${statGridCols} gap-2 pt-0.5`}>
            <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card-2)]/70 p-2.5 flex flex-col items-center justify-center text-center">
              <span
                className="font-mono font-bold text-[var(--text)] leading-tight truncate max-w-full"
                style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                LV.{data.level}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--muted)] mt-0.5">
                Level
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card-2)]/70 hover:border-[#E8A317]/50 p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            >
              <span
                className="font-mono font-bold text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center gap-1 leading-tight truncate max-w-full"
                style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                <KobanIcon size={13} />
                <span>{data.coins.toLocaleString()}</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--muted)] mt-0.5">
                Kobans
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card-2)]/70 hover:border-[#D71921]/40 p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            >
              <span
                className="font-mono font-bold text-[var(--text)] leading-tight truncate max-w-full"
                style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                {data.followers}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--muted)] mt-0.5">
                Followers
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card-2)]/70 hover:border-[#D71921]/40 p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            >
              <span
                className="font-mono font-bold text-[var(--text)] leading-tight truncate max-w-full"
                style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                {data.following}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--muted)] mt-0.5">
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
  // 2. CLEAN-SOCIAL: banner, avatar overlapping with stats at its right (2x2 grid so no cramping), then name, nameplate, buttons
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
        <div className="relative z-10">
          {renderBanner('w-full h-24 sm:h-32')}
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />
        </div>

        <div className="px-4 sm:px-6 pb-5 flex flex-col gap-3.5 relative z-20">
          {/* Avatar overlapping on left + 2x2 stats grid on the right (never cramped or overlapping) */}
          <div className="flex items-start justify-between gap-3 pt-2">
            <div className="-mt-11 sm:-mt-13 p-1 rounded-full bg-[var(--card)] shrink-0 relative z-30 overflow-visible">
              <AvatarWithGuaranteedRing data={data} size={avatarSize} />
            </div>

            <div
              className={`flex-1 min-w-0 grid ${
                previewMode ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
              } gap-1.5`}
            >
              <div className="min-w-0 rounded-xl bg-[var(--card-2)]/80 border border-[var(--border)] py-1.5 px-2 flex flex-col items-center justify-center text-center">
                <span
                  className="font-mono font-bold text-[var(--text)] leading-tight truncate max-w-full"
                  style={{ fontSize: 'clamp(11px, 2.6vw, 14px)' }}
                >
                  LV.{data.level}
                </span>
                <span className="text-[9px] font-mono uppercase text-[var(--muted)]">Level</span>
              </div>
              <button
                type="button"
                onClick={onOpenWallet}
                className="min-w-0 rounded-xl bg-[var(--card-2)]/80 border border-[var(--border)] py-1.5 px-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#E8A317]/50"
              >
                <span
                  className="font-mono font-bold text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center gap-0.5 leading-tight truncate max-w-full"
                  style={{ fontSize: 'clamp(11px, 2.6vw, 14px)' }}
                >
                  <KobanIcon size={11} />
                  <span>{data.coins.toLocaleString()}</span>
                </span>
                <span className="text-[9px] font-mono uppercase text-[var(--muted)]">Kobans</span>
              </button>
              <button
                type="button"
                onClick={onOpenFollowers}
                className="min-w-0 rounded-xl bg-[var(--card-2)]/80 border border-[var(--border)] py-1.5 px-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#D71921]/40"
              >
                <span
                  className="font-mono font-bold text-[var(--text)] leading-tight truncate max-w-full"
                  style={{ fontSize: 'clamp(11px, 2.6vw, 14px)' }}
                >
                  {data.followers}
                </span>
                <span className="text-[9px] font-mono uppercase text-[var(--muted)]">Followers</span>
              </button>
              <button
                type="button"
                onClick={onOpenFollowing}
                className="min-w-0 rounded-xl bg-[var(--card-2)]/80 border border-[var(--border)] py-1.5 px-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#D71921]/40"
              >
                <span
                  className="font-mono font-bold text-[var(--text)] leading-tight truncate max-w-full"
                  style={{ fontSize: 'clamp(11px, 2.6vw, 14px)' }}
                >
                  {data.following}
                </span>
                <span className="text-[9px] font-mono uppercase text-[var(--muted)]">Following</span>
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
        className="dark-surface-preserve relative w-full overflow-hidden flex flex-col bg-gradient-to-br from-[#0B0C10] via-[#12151E] to-[#1A1016] text-white p-3.5 sm:p-5"
        style={{ color: '#FFFFFF' }}
        data-profile-layout="dark-passport"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />

        {/* Passport header bar */}
        <div
          className="relative z-10 flex items-center justify-between pb-2.5 mb-3 border-b border-white/15 text-[10px] font-mono uppercase tracking-[0.16em]"
          style={{ color: '#FBBF24' }}
        >
          <span>BOARDLY PASSPORT · #{shortId}</span>
          <span>VERIFIED ID</span>
        </div>

        {/* Framed inner banner + avatar + nameplate */}
        <div
          className="relative z-10 rounded-2xl overflow-hidden border border-white/20 shadow-inner"
          style={{ backgroundColor: 'rgba(10, 12, 18, 0.78)' }}
        >
          <div className="relative z-10">
            {renderBanner('w-full h-24 sm:h-32')}
            <TopBannerOverlayControls
              onClose={onClose}
              onPreviewAsPublic={onPreviewAsPublic}
              showPreviewBtn={!isPublicMode && !previewMode}
            />
          </div>

          <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 -mt-9 sm:-mt-10 relative z-20">
            <div
              className="p-1 rounded-full border border-white/25 self-start relative z-30 overflow-visible"
              style={{ backgroundColor: '#12151E' }}
            >
              <AvatarWithGuaranteedRing data={data} size={avatarSize} />
            </div>
            <div className="flex-1 min-w-0 pt-1 sm:pt-5">
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

        {/* Passport Stat Tiles: white/light text on dark surface */}
        <div className={`relative z-10 grid ${statGridCols} gap-2 mt-3`}>
          <div
            className="min-w-0 rounded-xl border border-white/15 p-2.5 text-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div
              className="text-[10px] font-mono uppercase"
              style={{ color: 'rgba(255, 255, 255, 0.72)' }}
            >
              Level
            </div>
            <div
              className="font-mono font-bold mt-0.5 truncate"
              style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
            >
              LV.{data.level}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenWallet}
            className="min-w-0 rounded-xl border border-white/15 p-2.5 text-center cursor-pointer hover:bg-white/15"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div
              className="text-[10px] font-mono uppercase"
              style={{ color: 'rgba(255, 255, 255, 0.72)' }}
            >
              Kobans
            </div>
            <div
              className="font-mono font-bold mt-0.5 flex items-center justify-center gap-1 truncate"
              style={{ color: '#FDE047', fontSize: 'clamp(12px, 3vw, 15px)' }}
            >
              <KobanIcon size={12} />
              <span>{data.coins.toLocaleString()}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenFollowers}
            className="min-w-0 rounded-xl border border-white/15 p-2.5 text-center cursor-pointer hover:bg-white/15"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div
              className="text-[10px] font-mono uppercase"
              style={{ color: 'rgba(255, 255, 255, 0.72)' }}
            >
              Followers
            </div>
            <div
              className="font-mono font-bold mt-0.5 truncate"
              style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
            >
              {data.followers}
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenFollowing}
            className="min-w-0 rounded-xl border border-white/15 p-2.5 text-center cursor-pointer hover:bg-white/15"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div
              className="text-[10px] font-mono uppercase"
              style={{ color: 'rgba(255, 255, 255, 0.72)' }}
            >
              Following
            </div>
            <div
              className="font-mono font-bold mt-0.5 truncate"
              style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
            >
              {data.following}
            </div>
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
  // 4. CENTERED-HERO: banner, large centered avatar, centered name, nameplate and stats
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
        <div className="relative z-10">
          {renderBanner('w-full h-28 sm:h-36')}
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />
        </div>

        <div className="px-4 sm:px-6 pb-5 flex flex-col items-center text-center gap-3 relative z-20">
          <div className="-mt-12 sm:-mt-14 p-1.5 rounded-full bg-[var(--card)] shadow-lg relative z-30 overflow-visible">
            <AvatarWithGuaranteedRing data={data} size={previewMode ? 76 : 92} />
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

          {/* Centered Stat Tiles */}
          <div className={`w-full max-w-md grid ${statGridCols} gap-2 pt-0.5`}>
            <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/70 py-2 px-2.5 flex flex-col items-center justify-center">
              <span
                className="font-mono font-extrabold text-[var(--text)] leading-tight truncate max-w-full"
                style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                LV.{data.level}
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--muted)] mt-0.5">
                Level
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/70 py-2 px-2.5 flex flex-col items-center justify-center cursor-pointer hover:border-[#E8A317]/50"
            >
              <span
                className="font-mono font-extrabold text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center gap-1 leading-tight truncate max-w-full"
                style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                <KobanIcon size={13} />
                <span>{data.coins.toLocaleString()}</span>
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--muted)] mt-0.5">
                Kobans
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/70 py-2 px-2.5 flex flex-col items-center justify-center cursor-pointer hover:border-[#D71921]/40"
            >
              <span
                className="font-mono font-extrabold text-[var(--text)] leading-tight truncate max-w-full"
                style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                {data.followers}
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--muted)] mt-0.5">
                Followers
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/70 py-2 px-2.5 flex flex-col items-center justify-center cursor-pointer hover:border-[#D71921]/40"
            >
              <span
                className="font-mono font-extrabold text-[var(--text)] leading-tight truncate max-w-full"
                style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                {data.following}
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--muted)] mt-0.5">
                Following
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
  // 5. FULL-COVER: banner fills the top half with avatar, name and nameplate over a dark gradient, and a dark glass sheet with stats slides over it
  // ───────────────────────────────────────────────────────────────────────────
  if (layout === 'full-cover') {
    return (
      <div
        className="dark-surface-preserve relative w-full overflow-hidden flex flex-col bg-[#0F1016] text-white"
        style={{ backgroundColor: '#0F1016', color: '#FFFFFF' }}
        data-profile-layout="full-cover"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />

        {/* Top half full-cover banner with avatar, name, and nameplate over dark gradient */}
        <div className="relative w-full min-h-[210px] sm:min-h-[240px] flex flex-col justify-end overflow-hidden pt-10 pb-8">
          <div className="absolute inset-0 z-0">
            {renderBanner('w-full h-full')}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, rgba(10,11,16,0.96) 0%, rgba(10,11,16,0.68) 55%, rgba(10,11,16,0.25) 100%)',
              }}
            />
          </div>
          <TopBannerOverlayControls
            onClose={onClose}
            onPreviewAsPublic={onPreviewAsPublic}
            showPreviewBtn={!isPublicMode && !previewMode}
          />

          <div className="relative z-20 px-4 sm:px-6 flex items-end gap-3.5">
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

        {/* Sliding dark glass bottom sheet with white/light stat tiles & light Store/Settings buttons */}
        <div
          className="relative z-30 -mt-5 rounded-t-3xl border-t border-white/15 px-4 sm:px-6 pt-3 pb-5 flex flex-col gap-3.5 shadow-[0_-8px_24px_rgba(0,0,0,0.45)]"
          style={{ backgroundColor: '#14161F', color: '#FFFFFF' }}
        >
          <div className="w-10 h-1 rounded-full bg-white/25 mx-auto" />
          <div className={`grid ${statGridCols} gap-2`}>
            <div
              className="min-w-0 rounded-xl border border-white/15 p-2 text-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div
                className="font-mono font-bold truncate"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                LV.{data.level}
              </div>
              <div
                className="text-[10px] font-mono uppercase mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.75)' }}
              >
                Level
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="min-w-0 rounded-xl border border-white/15 p-2 text-center cursor-pointer hover:bg-white/15"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div
                className="font-mono font-bold flex items-center justify-center gap-1 truncate"
                style={{ color: '#FDE047', fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                <KobanIcon size={12} />
                <span>{data.coins.toLocaleString()}</span>
              </div>
              <div
                className="text-[10px] font-mono uppercase mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.75)' }}
              >
                Kobans
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="min-w-0 rounded-xl border border-white/15 p-2 text-center cursor-pointer hover:bg-white/15"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div
                className="font-mono font-bold truncate"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                {data.followers}
              </div>
              <div
                className="text-[10px] font-mono uppercase mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.75)' }}
              >
                Followers
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="min-w-0 rounded-xl border border-white/15 p-2 text-center cursor-pointer hover:bg-white/15"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div
                className="font-mono font-bold truncate"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                {data.following}
              </div>
              <div
                className="text-[10px] font-mono uppercase mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.75)' }}
              >
                Following
              </div>
            </button>
          </div>
          {badgeRowNode}
          <ProfileActionButtonsRow props={props} variant="dark" />
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
        className="dark-surface-preserve relative w-full overflow-hidden p-3 sm:p-4 bg-gradient-to-br from-[#2B1F0A] via-[#13110E] to-[#291B07] text-white border-4 border-[#F59E0B] shadow-[inset_0_0_24px_rgba(245,158,11,0.25)]"
        style={{ color: '#FFFFFF' }}
        data-profile-layout="trading-card"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor={accentColor}
          playKey={effectPlayKey}
        />

        {/* Collectible Card Top Header Bar: Nameplate scaled cleanly to fit + Level/HP */}
        <div
          className="relative z-10 flex flex-col gap-2 px-3 py-2.5 rounded-t-xl border border-amber-400/45"
          style={{
            background:
              'linear-gradient(90deg, rgba(245,158,11,0.24) 0%, rgba(18,16,12,0.85) 50%, rgba(245,158,11,0.24) 100%)',
          }}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <AlwaysVisibleNameplate
                nameplateId={data.nameplate}
                displayName={data.displayName}
                shortId={shortId}
                darkSurface={true}
                className="max-w-full"
              />
            </div>
            <div
              className="flex items-center gap-1.5 font-mono font-black text-xs shrink-0"
              style={{ color: '#FDE047' }}
            >
              <Trophy size={13} style={{ color: '#FBBF24' }} />
              <span>LV.{data.level}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span
                className="font-heading font-bold text-sm truncate"
                style={{ color: '#FFFFFF' }}
              >
                {data.displayName}
              </span>
              <span className="font-mono text-xs" style={{ color: '#FDE68A' }}>
                @{data.username}
              </span>
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
            <div
              className="inline-flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: '#6EE7B7' }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: '#34D399' }}
              />
              <span>Active</span>
            </div>
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
          <div
            className="absolute bottom-2 right-2 z-30 p-1 rounded-full border-2 border-amber-400 shadow-xl overflow-visible"
            style={{ backgroundColor: '#13110E' }}
          >
            <AvatarWithGuaranteedRing data={data} size={previewMode ? 58 : 70} />
          </div>
          <div
            className="absolute bottom-2 left-2.5 z-20 px-2 py-1 rounded border border-amber-400/40"
            style={{ backgroundColor: 'rgba(0,0,0,0.82)', color: '#FEF08A' }}
          >
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

        {/* Card Lore & Stat Attributes Box */}
        <div
          className="relative z-10 mt-2.5 rounded-xl border border-amber-400/35 p-3 flex flex-col gap-2.5"
          style={{ backgroundColor: 'rgba(12, 10, 8, 0.85)', color: '#FFFFFF' }}
        >
          <div className={`grid ${statGridCols} gap-2`}>
            <div
              className="min-w-0 rounded-lg border border-amber-400/25 p-2 text-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            >
              <div className="text-[9px] font-mono uppercase" style={{ color: '#FDE68A' }}>
                Level
              </div>
              <div className="font-mono font-bold text-xs sm:text-sm" style={{ color: '#FFFFFF' }}>
                LV.{data.level}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="min-w-0 rounded-lg border border-amber-400/25 p-2 text-center cursor-pointer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            >
              <div className="text-[9px] font-mono uppercase" style={{ color: '#FDE68A' }}>
                Kobans
              </div>
              <div
                className="font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-1"
                style={{ color: '#FDE047' }}
              >
                <KobanIcon size={12} />
                <span>{data.coins.toLocaleString()}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="min-w-0 rounded-lg border border-amber-400/25 p-2 text-center cursor-pointer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            >
              <div className="text-[9px] font-mono uppercase" style={{ color: '#FDE68A' }}>
                Followers
              </div>
              <div className="font-mono font-bold text-xs sm:text-sm" style={{ color: '#FFFFFF' }}>
                {data.followers}
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="min-w-0 rounded-lg border border-amber-400/25 p-2 text-center cursor-pointer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            >
              <div className="text-[9px] font-mono uppercase" style={{ color: '#FDE68A' }}>
                Following
              </div>
              <div className="font-mono font-bold text-xs sm:text-sm" style={{ color: '#FFFFFF' }}>
                {data.following}
              </div>
            </button>
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
        className="dark-surface-preserve relative w-full overflow-hidden bg-[#090D16] font-mono border-2 border-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.15)]"
        style={{ backgroundColor: '#090D16', color: '#6EE7B7' }}
        data-profile-layout="retro-pixel"
      >
        <HeaderProfileEffectOverlay
          effectId={data.effect}
          accentColor="#10B981"
          playKey={effectPlayKey}
        />

        {/* Retro OS Title Bar: username.exe */}
        <div
          className="relative z-20 flex items-center justify-between px-3 py-1.5 border-b-2 border-emerald-500/70"
          style={{ backgroundColor: '#052E16', color: '#A7F3D0' }}
        >
          <div className="flex items-center gap-2 text-xs font-bold min-w-0">
            <span
              className="w-2.5 h-2.5 inline-block shrink-0"
              style={{ backgroundColor: '#34D399' }}
            />
            <span className="truncate" style={{ color: '#ECFDF5' }}>
              {data.username}.exe
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isPublicMode && !previewMode && onPreviewAsPublic && (
              <button
                type="button"
                onClick={onPreviewAsPublic}
                className="px-2 py-0.5 border border-emerald-400 text-[10px] cursor-pointer"
                style={{ backgroundColor: '#000000', color: '#6EE7B7' }}
              >
                [VIEW_PUBLIC]
              </button>
            )}
            <span
              className="px-1.5 py-0.5 border border-emerald-500/60 text-[10px]"
              style={{ backgroundColor: '#000000', color: '#34D399' }}
            >
              _
            </span>
            <span
              className="px-1.5 py-0.5 border border-emerald-500/60 text-[10px]"
              style={{ backgroundColor: '#000000', color: '#34D399' }}
            >
              □
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-1.5 py-0.5 bg-red-600 text-white border border-red-300 text-[10px] font-bold cursor-pointer"
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
              >
                X
              </button>
            )}
          </div>
        </div>

        {/* Banner Viewport */}
        <div className="relative z-10 border-b-2 border-emerald-500/50">
          {renderBanner('w-full h-24 sm:h-32')}
        </div>

        {/* Terminal Body */}
        <div className="relative z-20 p-3.5 sm:p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AvatarWithGuaranteedRing
              data={data}
              size={previewMode ? 60 : 76}
              squarePixel={true}
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  className="text-sm sm:text-base font-bold truncate max-w-full"
                  style={{ color: '#FFFFFF' }}
                >
                  {data.displayName}
                </span>
                <span className="text-xs shrink-0" style={{ color: '#6EE7B7' }}>
                  @{data.username}
                </span>
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
              <div className="flex items-center gap-2 flex-wrap">
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
                <div
                  className="inline-flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: '#6EE7B7' }}
                >
                  <span
                    className="w-2 h-2 inline-block animate-pulse"
                    style={{ backgroundColor: '#34D399' }}
                  />
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Nameplate Row inside Retro Pixel Window so it never clips */}
          <div className="w-full min-w-0 max-w-full overflow-hidden">
            <AlwaysVisibleNameplate
              nameplateId={data.nameplate}
              displayName={data.displayName}
              shortId={shortId}
              darkSurface={true}
              className="max-w-full"
            />
          </div>

          {/* Blocky Terminal Stats */}
          <div className={`grid ${statGridCols} gap-2 pt-0.5`}>
            <div
              className="min-w-0 border-2 border-emerald-500/60 p-2 text-center"
              style={{ backgroundColor: '#030712' }}
            >
              <div className="text-[9px] uppercase" style={{ color: '#6EE7B7' }}>
                LEVEL
              </div>
              <div
                className="font-bold truncate mt-0.5"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 14px)' }}
              >
                LV.{data.level}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="min-w-0 border-2 border-emerald-500/60 p-2 text-center cursor-pointer"
              style={{ backgroundColor: '#030712' }}
            >
              <div className="text-[9px] uppercase" style={{ color: '#6EE7B7' }}>
                KOBANS
              </div>
              <div
                className="font-bold flex items-center justify-center gap-1 truncate mt-0.5"
                style={{ color: '#FDE047', fontSize: 'clamp(12px, 3vw, 14px)' }}
              >
                <KobanIcon size={12} />
                <span>{data.coins.toLocaleString()}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="min-w-0 border-2 border-emerald-500/60 p-2 text-center cursor-pointer"
              style={{ backgroundColor: '#030712' }}
            >
              <div className="text-[9px] uppercase" style={{ color: '#6EE7B7' }}>
                FOLLOWERS
              </div>
              <div
                className="font-bold truncate mt-0.5"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 14px)' }}
              >
                {data.followers}
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="min-w-0 border-2 border-emerald-500/60 p-2 text-center cursor-pointer"
              style={{ backgroundColor: '#030712' }}
            >
              <div className="text-[9px] uppercase" style={{ color: '#6EE7B7' }}>
                FOLLOWING
              </div>
              <div
                className="font-bold truncate mt-0.5"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 14px)' }}
              >
                {data.following}
              </div>
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
        className="dark-surface-preserve relative w-full overflow-hidden p-3.5 sm:p-5 text-white min-h-[290px] flex flex-col justify-end"
        style={{ backgroundColor: '#0B0C12', color: '#FFFFFF' }}
        data-profile-layout="glass"
      >
        {/* Full Background Banner */}
        <div className="absolute inset-0 z-0">
          {renderBanner('w-full h-full')}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(8, 10, 16, 0.48)' }}
          />
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
        <div
          className="relative z-20 rounded-3xl backdrop-blur-xl border border-white/25 p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 mt-8"
          style={{
            backgroundColor: 'rgba(14, 16, 24, 0.72)',
            color: '#FFFFFF',
          }}
        >
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

          <div className={`grid ${statGridCols} gap-2 pt-0.5`}>
            <div
              className="min-w-0 rounded-xl border border-white/20 p-2 text-center backdrop-blur-md"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
            >
              <div
                className="font-mono font-bold truncate"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                LV.{data.level}
              </div>
              <div
                className="text-[10px] font-mono uppercase mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Level
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="min-w-0 rounded-xl border border-white/20 p-2 text-center backdrop-blur-md cursor-pointer hover:bg-white/20"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
            >
              <div
                className="font-mono font-bold flex items-center justify-center gap-1 truncate"
                style={{ color: '#FDE047', fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                <KobanIcon size={12} />
                <span>{data.coins.toLocaleString()}</span>
              </div>
              <div
                className="text-[10px] font-mono uppercase mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Kobans
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowers}
              className="min-w-0 rounded-xl border border-white/20 p-2 text-center backdrop-blur-md cursor-pointer hover:bg-white/20"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
            >
              <div
                className="font-mono font-bold truncate"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                {data.followers}
              </div>
              <div
                className="text-[10px] font-mono uppercase mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Followers
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="min-w-0 rounded-xl border border-white/20 p-2 text-center backdrop-blur-md cursor-pointer hover:bg-white/20"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
            >
              <div
                className="font-mono font-bold truncate"
                style={{ color: '#FFFFFF', fontSize: 'clamp(12px, 3vw, 15px)' }}
              >
                {data.following}
              </div>
              <div
                className="text-[10px] font-mono uppercase mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Following
              </div>
            </button>
          </div>

          {badgeRowNode}
          <ProfileActionButtonsRow props={props} variant="dark" />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. ID-BADGE: lanyard clip and a badge with the banner, centered overlapping avatar (never cut off), nameplate, barcode and stats
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
        <div className="relative z-20 flex flex-col items-center -mb-2">
          <div className="w-8 h-5 rounded-t-lg border-2 border-zinc-400 dark:border-zinc-500 bg-zinc-300 dark:bg-zinc-700" />
          <div className="w-16 h-3.5 rounded-full bg-zinc-700 dark:bg-zinc-300 shadow-md flex items-center justify-center">
            <div className="w-8 h-1 rounded-full bg-white/60 dark:bg-black/60" />
          </div>
        </div>

        {/* Credential Badge Card */}
        <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white dark:bg-[#18191E] text-zinc-900 dark:text-white border border-black/10 dark:border-white/15 shadow-xl overflow-hidden flex flex-col items-center text-center">
          {/* Banner at z-10 */}
          <div className="relative z-10 w-full">
            {renderBanner('w-full h-24 sm:h-28')}
            <TopBannerOverlayControls
              onClose={onClose}
              onPreviewAsPublic={onPreviewAsPublic}
              showPreviewBtn={!isPublicMode && !previewMode}
            />
          </div>

          {/* Overlapping Avatar at z-30 with overflow-visible so the banner NEVER cuts off the avatar or its frame */}
          <div className="relative z-30 -mt-10 p-1.5 rounded-full bg-white dark:bg-[#18191E] shadow-lg overflow-visible">
            <AvatarWithGuaranteedRing data={data} size={avatarSize} />
          </div>

          <div className="relative z-20 px-4 sm:px-6 pt-2 pb-4 w-full flex flex-col items-center gap-2.5">
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
            <div
              className={`w-full grid ${statGridCols} gap-2 py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-xs font-mono`}
            >
              <div className="min-w-0">
                <div className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400">LEVEL</div>
                <div
                  className="font-bold truncate mt-0.5"
                  style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}
                >
                  LV.{data.level}
                </div>
              </div>
              <button type="button" onClick={onOpenWallet} className="min-w-0 cursor-pointer">
                <div className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400">KOBANS</div>
                <div
                  className="font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 truncate mt-0.5"
                  style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}
                >
                  <KobanIcon size={12} />
                  <span>{data.coins.toLocaleString()}</span>
                </div>
              </button>
              <button type="button" onClick={onOpenFollowers} className="min-w-0 cursor-pointer">
                <div className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400">
                  FOLLOWERS
                </div>
                <div
                  className="font-bold truncate mt-0.5"
                  style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}
                >
                  {data.followers}
                </div>
              </button>
              <button type="button" onClick={onOpenFollowing} className="min-w-0 cursor-pointer">
                <div className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400">
                  FOLLOWING
                </div>
                <div
                  className="font-bold truncate mt-0.5"
                  style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}
                >
                  {data.following}
                </div>
              </button>
            </div>

            {/* Barcode Strip */}
            <div className="w-full py-2 px-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-dashed border-zinc-300 dark:border-white/15 flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5 h-5 overflow-hidden">
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
              <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0">
                <QrCode size={13} />
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
  // 10. LOADOUT-SHOWCASE: slim banner, avatar and name (never overflowing banner), then a list of every equipped item with a thumbnail, full category label ("NAMEPLATE" never cut off) and a Change button
  // ───────────────────────────────────────────────────────────────────────────
  const bannerMeta = data.banner ? getCosmeticById(data.banner) : null;
  const avatarMeta = data.avatar ? getCosmeticById(data.avatar) : null;
  const frameMeta = data.frame ? getCosmeticById(data.frame) : null;
  const plateMeta = data.nameplate ? getCosmeticById(data.nameplate) : null;
  const effectMeta = data.effect ? getCosmeticById(data.effect) : null;

  const equippedList = [
    {
      key: 'banner',
      category: 'BANNER',
      label: bannerMeta?.name || 'Dot Matrix Default Banner',
      icon: <ImageIcon size={12} className="text-[#D71921] shrink-0" />,
      thumb: (
        <div className="w-11 h-8 rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
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
      category: 'AVATAR (PFP)',
      label: avatarMeta?.name || data.avatar || 'Standard Student Avatar',
      icon: <UserIcon size={12} className="text-[#D71921] shrink-0" />,
      thumb: (
        <div className="w-9 h-9 rounded-full overflow-hidden border border-[var(--border)] flex items-center justify-center bg-[var(--card-2)] shrink-0">
          <AvatarPicture itemId={data.avatar} size={32} />
        </div>
      ),
    },
    {
      key: 'frame',
      category: 'AVATAR FRAME',
      label: frameMeta?.name || 'Crimson Standard Ring',
      icon: <Disc size={12} className="text-[#D71921] shrink-0" />,
      thumb: (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--card-2)] border border-[var(--border)] shrink-0">
          <AvatarFrame itemId={data.frame || 'none'} size={30}>
            <div className="w-4 h-4 rounded-full bg-[#D71921]/20 border border-[#D71921]/60" />
          </AvatarFrame>
        </div>
      ),
    },
    {
      key: 'nameplate',
      category: 'NAMEPLATE',
      label: plateMeta?.name || 'Standard Student Nameplate',
      icon: <Tag size={12} className="text-[#D71921] shrink-0" />,
      thumb: (
        <div
          className="w-11 h-8 rounded-lg bg-[var(--card-2)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0 p-0.5"
          style={{ objectFit: 'contain' }}
        >
          <div
            className="origin-center pointer-events-none flex items-center justify-center"
            style={{ transform: 'scale(0.45)', width: '200px' }}
          >
            <AlwaysVisibleNameplate
              nameplateId={data.nameplate}
              displayName={data.displayName}
              shortId={shortId}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'effect',
      category: 'PROFILE EFFECT',
      label: effectMeta?.name || 'Ambient Header Sparkles',
      icon: <Wand2 size={12} className="text-[#D71921] shrink-0" />,
      thumb: (
        <div className="dark-surface-preserve w-11 h-8 rounded-lg bg-[#141418] border border-white/15 relative overflow-hidden flex items-center justify-center shrink-0">
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
      <div className="relative z-10">
        {renderBanner('w-full h-20 sm:h-24')}
        <TopBannerOverlayControls
          onClose={onClose}
          onPreviewAsPublic={onPreviewAsPublic}
          showPreviewBtn={!isPublicMode && !previewMode}
        />
      </div>

      <div className="px-4 sm:px-6 pb-5 flex flex-col gap-3 relative z-20">
        {/* Avatar overlaps banner cleanly; Name & Stats sit below banner so name NEVER overflows banner */}
        <div className="flex items-end justify-between gap-2 -mt-8 relative z-30">
          <div className="p-1 rounded-full bg-[var(--card)] shrink-0 overflow-visible">
            <AvatarWithGuaranteedRing data={data} size={previewMode ? 62 : 76} />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--muted)] flex-wrap justify-end pb-1">
            <span>
              <strong className="text-[var(--text)]">LV.{data.level}</strong>
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={onOpenWallet}
              className="flex items-center gap-1 cursor-pointer"
            >
              <KobanIcon size={12} />
              <strong className="text-[#B45309] dark:text-[#FBBF24]">
                {data.coins.toLocaleString()}
              </strong>
            </button>
            <span>·</span>
            <button type="button" onClick={onOpenFollowers} className="cursor-pointer">
              <strong className="text-[var(--text)]">{data.followers}</strong> followers
            </button>
          </div>
        </div>

        {/* Identity Meta Block below the banner so long names wrap/truncate with ellipsis and never overflow banner */}
        <div className="min-w-0 max-w-full">
          <IdentityMetaBlock
            data={data}
            shortId={shortId}
            showNameplateUnderName={true}
            onProBadgeClick={onProBadgeClick}
            followsMe={followsMe}
            isPublicMode={isPublicMode}
          />
        </div>

        {/* Equipped Store Items List with Thumbnail, Unclipped Category Label & Change Button */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)]/50 divide-y divide-[var(--border)] overflow-hidden">
          <div className="px-3 py-2 flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] bg-[var(--card-2)]">
            <span className="flex items-center gap-1.5 min-w-0 truncate">
              <Layers size={12} className="text-[#D71921] shrink-0" />
              <span className="truncate">Equipped Loadout (5 Slots)</span>
            </span>
            <span className="shrink-0 font-bold text-[#D71921]">5 / 5 Active</span>
          </div>
          {equippedList.map((slot) => (
            <div
              key={slot.key}
              className="px-3 py-2 flex items-center justify-between gap-2.5 hover:bg-[var(--card-2)]/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {slot.thumb}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[var(--muted)] whitespace-nowrap">
                    {slot.icon}
                    <span>{slot.category}</span>
                  </div>
                  <div className="text-xs font-heading font-semibold text-[var(--text)] truncate">
                    {slot.label}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (slot.key === 'avatar' && !isPublicMode && !previewMode && onChangeAvatar) {
                    onChangeAvatar();
                  } else {
                    onOpenStore?.(slot.key);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[#D71921] text-[11px] font-heading font-semibold text-[var(--text)] transition-colors cursor-pointer shrink-0"
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

export const ProfileLayoutsRenderer: React.FC<ProfileLayoutHeaderProps> = (props) => {
  const canEditAvatar = Boolean(!props.isPublicMode && !props.previewMode && props.onChangeAvatar);
  return (
    <AvatarEditContext.Provider value={{ canEditAvatar, onChangeAvatar: props.onChangeAvatar }}>
      <ProfileLayoutsRendererInner {...props} />
    </AvatarEditContext.Provider>
  );
};
