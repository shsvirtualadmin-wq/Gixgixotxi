/**
 * Single Source of Truth for Boardly Cosmetic Inventory & Equipped Loadout.
 *
 * Shared across:
 *  - Server endpoints: GET /api/inventory, POST /api/inventory/equip, POST /api/store/purchase,
 *    POST /api/admin/backfill-starter-inventory
 *  - Client hooks & views: useWallet, LockerPage, StorePage, ProfileView, DashboardTopBar, AuthContext
 *
 * Pure TypeScript (safe in browser, Cloudflare Workers, and Node tests).
 */

import {
  COSMETICS_CATALOG,
  LEGACY_COSMETICS_CATALOG,
  getCosmeticById,
  type CosmeticItem,
  type CosmeticType,
} from '../data/cosmeticsCatalog';
import {
  MATRIX_AVATARS,
  getDefaultAvatar,
  isValidAvatar,
  type MatrixAvatarDef,
  type MatrixAvatarVariant,
} from './matrixAvatarsData';
import type { EquippedCosmetics } from '../types';

export type CosmeticSlot = 'avatar' | 'frame' | 'banner' | 'nameplate' | 'effect';

export const LOCKER_SLOTS: readonly CosmeticSlot[] = [
  'avatar',
  'frame',
  'banner',
  'nameplate',
  'effect',
] as const;

const MATRIX_AVATAR_MAP = new Map<string, MatrixAvatarDef>(
  MATRIX_AVATARS.map((item) => [item.key, item])
);

const INVALID_PLACEHOLDERS = new Set([
  '',
  'none',
  'null',
  'undefined',
  'default',
  'custom',
  'avatar-1',
  'title-rookie',
]);

function isExternalOrDataUrl(val: string): boolean {
  const lower = val.trim().toLowerCase();
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('/api/avatars/') ||
    lower.includes('googleusercontent.com') ||
    lower.includes('ggpht.com')
  );
}

/**
 * Deterministic starter dot-matrix avatar for a user uid.
 * Always included in every user's inventory (on creation and backfill) and used as
 * the real equipped avatar when no custom/store avatar is equipped.
 */
export function getStarterAvatarForUser(uid?: string | null): {
  key: string;
  variant: MatrixAvatarVariant;
  label: string;
} {
  const def = getDefaultAvatar(uid);
  const meta = MATRIX_AVATAR_MAP.get(def.key);
  return {
    key: def.key,
    variant: def.variant,
    label: meta?.label || 'Starter Avatar',
  };
}

/**
 * Returns the canonical list of starter item IDs every account owns by default.
 */
export function getStarterItemIdsForUser(uid?: string | null): string[] {
  const cleanUid = typeof uid === 'string' ? uid.trim() : '';
  if (!cleanUid) return [];
  return [getStarterAvatarForUser(cleanUid).key];
}

/**
 * Converts a valid free dot-matrix avatar key (e.g. "skull-01") into a canonical CosmeticItem
 * so it renders, filters, equips, and counts consistently inside Locker alongside Store items.
 */
export function buildStarterAvatarCosmeticItem(key: string): CosmeticItem | null {
  const def = MATRIX_AVATAR_MAP.get(key);
  if (!def) return null;
  return {
    id: def.key,
    name: def.label,
    type: 'avatar',
    priceKobans: 0,
    price: 0,
    rarity: 'common',
    description: 'Starter Boardly dot-matrix avatar included with your account.',
    animated: false,
    isAnimated: false,
    unlockRule: 'starter',
    isActive: true,
  };
}

/**
 * Normalizes any raw cosmetic / avatar ID string across legacy aliases, asset paths,
 * active catalog items, legacy catalog items, and starter dot-matrix avatar keys.
 * Returns null for invalid placeholders ("none", "avatar-1", external URLs, etc.).
 */
export function normalizeInventoryItemId(
  raw: unknown,
  expectedSlot?: CosmeticSlot
): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || INVALID_PLACEHOLDERS.has(trimmed.toLowerCase())) {
    return null;
  }
  if (isExternalOrDataUrl(trimmed)) {
    return null;
  }

  // Handle legacy store asset paths saved instead of cosmetic IDs
  const storePathMatch = trimmed.match(
    /^\/assets\/store\/(?:avatars\/|frames\/|banners\/|nameplates\/|effects\/)?([^/?#]+)/i
  );
  const candidate = (storePathMatch ? storePathMatch[1] : trimmed).trim();
  if (!candidate || INVALID_PLACEHOLDERS.has(candidate.toLowerCase())) {
    return null;
  }

  // 1. Check active + legacy Store cosmetics (also resolves LEGACY_COSMETIC_ID_ALIASES)
  const catalogMatch = getCosmeticById(candidate);
  if (catalogMatch) {
    if (!expectedSlot || catalogMatch.type === expectedSlot) {
      return catalogMatch.id;
    }
    return null;
  }

  // 2. Check free starter dot-matrix avatars
  if ((!expectedSlot || expectedSlot === 'avatar') && isValidAvatar(candidate)) {
    return candidate;
  }

  return null;
}

/**
 * Resolves any normalized (or raw) item ID into a canonical CosmeticItem object,
 * covering COSMETICS_CATALOG, LEGACY_COSMETICS_CATALOG, LEGACY_COSMETIC_ID_ALIASES,
 * and starter MATRIX_AVATARS.
 */
export function resolveInventoryItem(rawId?: string | null): CosmeticItem | null {
  const normalized = normalizeInventoryItemId(rawId);
  if (!normalized) return null;

  const catalogItem = getCosmeticById(normalized);
  if (catalogItem) return catalogItem;

  return buildStarterAvatarCosmeticItem(normalized);
}

/**
 * Extracts raw item IDs from any document shape or field naming variant
 * (owned, ownedCosmetics, items, inventory, unlocked, cosmetics).
 */
export function extractItemIdsFromRecord(record: Record<string, any> | null | undefined): string[] {
  if (!record || typeof record !== 'object') return [];
  const results: string[] = [];

  const pushCandidate = (entry: unknown) => {
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (trimmed) results.push(trimmed);
      return;
    }
    if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      const idVal = obj.itemId ?? obj.cosmeticId ?? obj.id ?? obj.key;
      if (typeof idVal === 'string' && idVal.trim()) {
        results.push(idVal.trim());
      }
    }
  };

  const candidateFields = [
    record.owned,
    record.ownedCosmetics,
    record.owned_cosmetics,
    record.items,
    record.inventory,
    record.unlocked,
    record.unlockedItems,
    record.cosmetics,
  ];

  for (const field of candidateFields) {
    if (Array.isArray(field)) {
      for (const item of field) pushCandidate(item);
    } else if (field && typeof field === 'object') {
      for (const [k, v] of Object.entries(field as Record<string, unknown>)) {
        if (v === true || (v && typeof v === 'object')) {
          pushCandidate(typeof v === 'object' ? { id: k, ...(v as Record<string, unknown>) } : k);
        }
      }
    }
  }

  return results;
}

/**
 * Extracts item IDs from subcollection document arrays (`users/{uid}/inventory/*`, `users/{uid}/unlocked/*`).
 */
export function extractItemIdsFromSubcollection(
  docs: Array<{ id: string; data?: Record<string, any> | null }> | null | undefined
): string[] {
  if (!Array.isArray(docs)) return [];
  const out: string[] = [];
  for (const d of docs) {
    if (!d) continue;
    const candidate = d.data?.itemId ?? d.data?.cosmeticId ?? d.id;
    if (typeof candidate === 'string' && candidate.trim()) {
      out.push(candidate.trim());
    }
  }
  return out;
}

function pickFirstNormalizedSlot(
  slot: CosmeticSlot,
  candidates: Array<unknown>
): string | null {
  for (const cand of candidates) {
    const normalized = normalizeInventoryItemId(cand, slot);
    if (normalized) return normalized;
  }
  return null;
}

export interface MergeInventoryInput {
  uid: string;
  walletDoc?: Record<string, any> | null;
  userDoc?: Record<string, any> | null;
  inventoryDoc?: Record<string, any> | null;
  publicProfileDoc?: Record<string, any> | null;
  d1Profile?: Record<string, any> | null;
  userInventorySubDocs?: Array<{ id: string; data?: Record<string, any> | null }>;
  userUnlockedSubDocs?: Array<{ id: string; data?: Record<string, any> | null }>;
  inventorySubcollectionDocs?: Array<{ id: string; data?: Record<string, any> | null }>;
  unlockedSubcollectionDocs?: Array<{ id: string; data?: Record<string, any> | null }>;
  extraOwnedIds?: string[];
  cachedOwned?: string[];
  cachedEquipped?: Partial<EquippedCosmetics> | null;
  includeStarter?: boolean;
}

export interface CanonicalInventoryResult {
  uid: string;
  balance: number;
  owned: string[];
  equipped: EquippedCosmetics;
  equippedCount: number;
  starterIds: string[];
  missingFromWalletOwned: string[];
  missingFromUserOwned: string[];
  missingFromInventoryDoc: string[];
  needsBackfill: boolean;
}

/**
 * Single canonical resolver merging all inventory & equipped sources for a user.
 * - Normalizes legacy IDs & aliases so no valid item is ever dropped.
 * - Includes starter avatar and guarantees any currently equipped valid item is in `owned`.
 * - Resolves equipped slots consistently across wallet, user doc, public profile, and D1,
 *   using the deterministic starter avatar when no explicit avatar is equipped.
 */
export function mergeCanonicalInventory(input: MergeInventoryInput): CanonicalInventoryResult {
  const uid = String(input.uid || '').trim();
  const w = input.walletDoc || null;
  const u = input.userDoc || null;
  const inv = input.inventoryDoc || null;
  const pub = input.publicProfileDoc || null;
  const d1 = input.d1Profile || null;

  // 1. Balance resolution (matches existing authoritative rule)
  const walletBal =
    w && typeof w.balance === 'number' && Number.isFinite(w.balance)
      ? Math.max(0, Math.floor(w.balance))
      : null;
  const userKobans =
    u && typeof u.kobans === 'number' && Number.isFinite(u.kobans)
      ? Math.max(0, Math.floor(u.kobans))
      : 0;
  const userKobanBal =
    u && typeof u.kobanBalance === 'number' && Number.isFinite(u.kobanBalance)
      ? Math.max(0, Math.floor(u.kobanBalance))
      : 0;
  const userBalance = Math.max(userKobans, userKobanBal);
  const balance =
    walletBal !== null && walletBal > 0
      ? walletBal
      : Math.max(walletBal ?? 0, userBalance);

  // 2. Resolve canonical equipped loadout across all sources
  const wEq = (w?.equipped && typeof w.equipped === 'object' ? w.equipped : {}) as Record<string, any>;
  const uEq = (u?.equipped && typeof u.equipped === 'object' ? u.equipped : {}) as Record<string, any>;
  const uEqCos = (u?.equippedCosmetics && typeof u.equippedCosmetics === 'object'
    ? u.equippedCosmetics
    : {}) as Record<string, any>;
  const pubEq = (pub?.equipped && typeof pub.equipped === 'object' ? pub.equipped : {}) as Record<string, any>;
  const pubEqCos = (pub?.equippedCosmetics && typeof pub.equippedCosmetics === 'object'
    ? pub.equippedCosmetics
    : {}) as Record<string, any>;

  const starterIds = input.includeStarter !== false && uid ? getStarterItemIdsForUser(uid) : [];
  const defaultStarterAvatar = starterIds[0] || null;

  // Respect explicit null when walletDoc explicitly carries an equipped slot map AND
  // no higher-priority source disagrees; otherwise merge cleanly across all stores.
  const hasExplicitWalletEquipped = Boolean(w && w.equipped && typeof w.equipped === 'object');

  const resolveSlot = (slot: CosmeticSlot, candidates: Array<unknown>): string | null => {
    if (hasExplicitWalletEquipped && Object.prototype.hasOwnProperty.call(wEq, slot)) {
      const fromWallet = normalizeInventoryItemId(wEq[slot], slot);
      if (fromWallet) return fromWallet;
      // If wallet explicitly has null for this slot, check if user/public/d1 has a real equipped value
      // (covers legacy users whose wallet was initialized with all-null equipped while profile/D1 held their real loadout).
      // Only treat wallet null as authoritative unequip if users/{uid}.equipped ALSO has null/absent for this slot.
      const userHasExplicitNull =
        u &&
        u.equipped &&
        typeof u.equipped === 'object' &&
        Object.prototype.hasOwnProperty.call(uEq, slot) &&
        (uEq[slot] === null || uEq[slot] === '' || uEq[slot] === 'none');
      if (userHasExplicitNull) {
        return null;
      }
    }
    return pickFirstNormalizedSlot(slot, candidates);
  };

  const resolvedAvatar =
    resolveSlot('avatar', [
      wEq.avatar,
      uEq.avatar,
      uEqCos.avatar,
      u?.equippedAvatar,
      u?.avatar,
      u?.avatarKey,
      u?.avatarId,
      pubEq.avatar,
      pubEqCos.avatar,
      pub?.equippedAvatar,
      pub?.avatar,
      d1?.avatar,
      d1?.equippedAvatar,
    ]) || defaultStarterAvatar;

  const resolvedFrame = resolveSlot('frame', [
    wEq.frame,
    uEq.frame,
    uEqCos.frame,
    uEqCos.avatarFrame,
    u?.equippedFrame,
    u?.frame,
    pubEq.frame,
    pubEqCos.frame,
    pubEqCos.avatarFrame,
    pub?.equippedFrame,
    pub?.frame,
    d1?.frame,
    d1?.equippedFrame,
  ]);

  const resolvedBanner = resolveSlot('banner', [
    wEq.banner,
    uEq.banner,
    uEqCos.banner,
    uEqCos.profileBanner,
    u?.equippedBanner,
    u?.banner,
    pubEq.banner,
    pubEqCos.banner,
    pubEqCos.profileBanner,
    pub?.equippedBanner,
    pub?.banner,
    d1?.banner,
  ]);

  const resolvedNameplate = resolveSlot('nameplate', [
    wEq.nameplate,
    uEq.nameplate,
    uEqCos.nameplate,
    u?.equippedNameplate,
    u?.nameplate,
    pubEq.nameplate,
    pubEqCos.nameplate,
    pub?.equippedNameplate,
    pub?.nameplate,
    d1?.nameplate,
  ]);

  const resolvedEffect = resolveSlot('effect', [
    wEq.effect,
    uEq.effect,
    uEqCos.effect,
    uEqCos.profileEffect,
    u?.equippedEffect,
    u?.effectId,
    u?.effect,
    pubEq.effect,
    pubEqCos.effect,
    pubEqCos.profileEffect,
    pub?.equippedEffect,
    pub?.effectId,
    pub?.effect,
    d1?.effect,
  ]);

  const equipped: EquippedCosmetics = {
    avatar: resolvedAvatar,
    frame: resolvedFrame,
    banner: resolvedBanner,
    nameplate: resolvedNameplate,
    effect: resolvedEffect,
  };

  // 3. Collect and normalize owned item IDs across ALL collections & field names
  const rawWalletOwned = extractItemIdsFromRecord(w);
  const rawUserOwned = extractItemIdsFromRecord(u);
  const rawInvDocOwned = extractItemIdsFromRecord(inv);
  const rawUserInvSub = extractItemIdsFromSubcollection(
    input.userInventorySubDocs ?? input.inventorySubcollectionDocs
  );
  const rawUserUnlockedSub = extractItemIdsFromSubcollection(
    input.userUnlockedSubDocs ?? input.unlockedSubcollectionDocs
  );
  const rawExtra = [
    ...(Array.isArray(input.extraOwnedIds) ? input.extraOwnedIds : []),
    ...(Array.isArray(input.cachedOwned) ? input.cachedOwned : []),
  ];

  const equippedValidIds = [
    equipped.avatar,
    equipped.frame,
    equipped.banner,
    equipped.nameplate,
    equipped.effect,
  ].filter((v): v is string => Boolean(v));

  const canonicalOwnedSet = new Set<string>();
  const addAllNormalized = (list: string[]) => {
    for (const raw of list) {
      const normalized = normalizeInventoryItemId(raw);
      if (normalized) {
        canonicalOwnedSet.add(normalized);
      }
    }
  };

  addAllNormalized(rawWalletOwned);
  addAllNormalized(rawUserOwned);
  addAllNormalized(rawInvDocOwned);
  addAllNormalized(rawUserInvSub);
  addAllNormalized(rawUserUnlockedSub);
  addAllNormalized(rawExtra);
  addAllNormalized(starterIds);
  addAllNormalized(equippedValidIds);

  const owned = Array.from(canonicalOwnedSet);

  // Track what is missing in persisted docs so server can idempotently backfill
  const walletOwnedNorm = new Set(
    rawWalletOwned.map((id) => normalizeInventoryItemId(id)).filter((v): v is string => Boolean(v))
  );
  const userOwnedNorm = new Set(
    rawUserOwned.map((id) => normalizeInventoryItemId(id)).filter((v): v is string => Boolean(v))
  );
  const invOwnedNorm = new Set(
    rawInvDocOwned.map((id) => normalizeInventoryItemId(id)).filter((v): v is string => Boolean(v))
  );

  const missingFromWalletOwned = owned.filter((id) => !walletOwnedNorm.has(id));
  const missingFromUserOwned = owned.filter((id) => !userOwnedNorm.has(id));
  const missingFromInventoryDoc = owned.filter((id) => !invOwnedNorm.has(id));

  const walletMissingEquipped = Boolean(
    !w ||
      (equipped.avatar && normalizeInventoryItemId(wEq.avatar, 'avatar') !== equipped.avatar) ||
      (equipped.frame && normalizeInventoryItemId(wEq.frame, 'frame') !== equipped.frame) ||
      (equipped.banner && normalizeInventoryItemId(wEq.banner, 'banner') !== equipped.banner) ||
      (equipped.nameplate &&
        normalizeInventoryItemId(wEq.nameplate, 'nameplate') !== equipped.nameplate) ||
      (equipped.effect && normalizeInventoryItemId(wEq.effect, 'effect') !== equipped.effect)
  );

  const needsBackfill =
    missingFromWalletOwned.length > 0 ||
    missingFromUserOwned.length > 0 ||
    missingFromInventoryDoc.length > 0 ||
    walletMissingEquipped;

  const equippedCount = countEquippedLoadout(equipped);

  return {
    uid,
    balance,
    owned,
    equipped,
    equippedCount,
    starterIds,
    missingFromWalletOwned,
    missingFromUserOwned,
    missingFromInventoryDoc,
    needsBackfill,
  };
}

/**
 * Counts how many cosmetic slots are genuinely equipped (including the starter/default avatar).
 */
export function countEquippedLoadout(
  equipped: Partial<EquippedCosmetics> | null | undefined,
  uid?: string | null
): number {
  const slots: Array<{ slot: CosmeticSlot; value: unknown }> = [
    {
      slot: 'avatar',
      value:
        normalizeInventoryItemId(equipped?.avatar, 'avatar') ||
        (uid ? getStarterAvatarForUser(uid).key : null),
    },
    { slot: 'frame', value: normalizeInventoryItemId(equipped?.frame, 'frame') },
    { slot: 'banner', value: normalizeInventoryItemId(equipped?.banner, 'banner') },
    { slot: 'nameplate', value: normalizeInventoryItemId(equipped?.nameplate, 'nameplate') },
    { slot: 'effect', value: normalizeInventoryItemId(equipped?.effect, 'effect') },
  ];

  return slots.filter((s) => Boolean(s.value)).length;
}

/**
 * Builds the canonical array of owned CosmeticItem objects for the Locker grid:
 * - Includes owned active catalog items, owned legacy catalog items, normalized aliases,
 *   and owned starter/free dot-matrix avatars.
 * - For Super Admin, includes all active store catalog items + any owned legacy/starter items.
 * - Deduplicates by canonical item ID and preserves stable category filtering.
 */
export function buildOwnedCosmeticItemsList(
  ownedIds: string[] | null | undefined,
  options: {
    isSuperAdmin?: boolean;
    uid?: string | null;
    equipped?: Partial<EquippedCosmetics> | null;
  } = {}
): CosmeticItem[] {
  const allowedTypes = new Set<CosmeticType>([
    'avatar',
    'frame',
    'banner',
    'nameplate',
    'effect',
  ]);
  const byId = new Map<string, CosmeticItem>();

  const addItemById = (rawId: string | null | undefined) => {
    const item = resolveInventoryItem(rawId);
    if (item && allowedTypes.has(item.type) && !byId.has(item.id)) {
      byId.set(item.id, item);
    }
  };

  // 1. Add all explicitly owned items (store + legacy + aliases + starter matrix avatars)
  if (Array.isArray(ownedIds)) {
    for (const rawId of ownedIds) {
      addItemById(rawId);
    }
  }

  // 2. Always ensure currently equipped valid items & starter avatar are present
  if (options.uid) {
    for (const starterId of getStarterItemIdsForUser(options.uid)) {
      addItemById(starterId);
    }
  }
  if (options.equipped) {
    addItemById(options.equipped.avatar);
    addItemById(options.equipped.frame);
    addItemById(options.equipped.banner);
    addItemById(options.equipped.nameplate);
    addItemById(options.equipped.effect);
  }

  // 3. SuperAdmin unlocks all active store catalog items
  if (options.isSuperAdmin) {
    for (const item of COSMETICS_CATALOG) {
      if (allowedTypes.has(item.type) && !byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  } else {
    // Include any 0-Koban active store items if ever configured in catalog
    for (const item of COSMETICS_CATALOG) {
      if (allowedTypes.has(item.type) && item.priceKobans === 0 && !byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  }

  // Sort: currently equipped first, then store items, then starter items, then alphabetically
  const eqSet = new Set<string>(
    [
      normalizeInventoryItemId(options.equipped?.avatar, 'avatar'),
      normalizeInventoryItemId(options.equipped?.frame, 'frame'),
      normalizeInventoryItemId(options.equipped?.banner, 'banner'),
      normalizeInventoryItemId(options.equipped?.nameplate, 'nameplate'),
      normalizeInventoryItemId(options.equipped?.effect, 'effect'),
    ].filter((v): v is string => Boolean(v))
  );

  const catalogOrder = new Map<string, number>();
  [...COSMETICS_CATALOG, ...LEGACY_COSMETICS_CATALOG].forEach((it, idx) => {
    catalogOrder.set(it.id, idx);
  });

  return Array.from(byId.values()).sort((a, b) => {
    const aEq = eqSet.has(a.id) ? 0 : 1;
    const bEq = eqSet.has(b.id) ? 0 : 1;
    if (aEq !== bEq) return aEq - bEq;

    const aOrder = catalogOrder.get(a.id);
    const bOrder = catalogOrder.get(b.id);
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Filters a canonical owned items list by Locker category tab.
 */
export function filterLockerItemsByCategory(
  items: CosmeticItem[],
  category: 'all' | CosmeticSlot
): CosmeticItem[] {
  if (category === 'all') return items;
  return items.filter((item) => item.type === category);
}
