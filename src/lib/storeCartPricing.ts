/**
 * Single Source of Truth for Boardly Store Item Pricing & Shopping Cart Totals.
 *
 * Shared across:
 *  - Client catalog & pricing (`storePricingService.ts`, `StorePage.tsx`)
 *  - Cart modal (`CartDrawer.tsx`)
 *  - Server purchase endpoint (`POST /api/store/purchase` in `functions/api/economy/[[path]].ts`)
 *
 * Pure TypeScript with relative imports (safe in browser, Cloudflare Workers, and Node tests).
 */

export const MAX_KOBAN_PRICE = 100000;

export function clampKobanPrice(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(MAX_KOBAN_PRICE, Math.floor(n)));
}

export function parseTimestampMs(raw: unknown): number | null {
  if (!raw) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string') {
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as { toMillis?: () => number; seconds?: number };
    if (typeof obj.toMillis === 'function') {
      const ms = obj.toMillis();
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof obj.seconds === 'number' && Number.isFinite(obj.seconds)) {
      return obj.seconds * 1000;
    }
  }
  return null;
}

export function isSaleCurrentlyActive(
  priceKobans: number,
  salePriceKobans?: number | null,
  saleEndsAt?: unknown,
  nowMs: number = Date.now()
): boolean {
  if (salePriceKobans === null || salePriceKobans === undefined) return false;
  if (!Number.isFinite(salePriceKobans) || salePriceKobans < 0) return false;
  if (salePriceKobans >= priceKobans) return false;
  const endMs = parseTimestampMs(saleEndsAt);
  if (endMs !== null && endMs <= nowMs) {
    return false;
  }
  return true;
}

/**
 * Detects if a Firestore `store_items` collection contains the legacy un-migrated
 * uniform-600 bulk test dump (where >60% of unversioned docs have priceKobans === 600).
 * Both the Store UI (`fetchStoreItems`) and the server (`POST /api/store/purchase`)
 * MUST apply this exact check so client and server prices never disagree.
 */
export function isLegacyUniform600Collection(
  docs: Array<{ id?: string; data?: Record<string, any> | null } | Record<string, any>>
): boolean {
  if (!Array.isArray(docs) || docs.length === 0) return false;
  let unversionedCount = 0;
  let uniform600Count = 0;
  for (const entry of docs) {
    const data =
      entry && typeof entry === 'object' && 'data' in entry && entry.data && typeof entry.data === 'object'
        ? (entry.data as Record<string, any>)
        : (entry as Record<string, any>);
    if (!data || typeof data !== 'object') continue;
    if (!data.priceSchemaV2) {
      unversionedCount += 1;
      const p = data.priceKobans ?? data.price_kobans ?? data.price;
      if (p === 600) {
        uniform600Count += 1;
      }
    }
  }
  return unversionedCount > 0 && uniform600Count / unversionedCount > 0.6;
}

export interface ResolvedStoreItemPrice {
  active: boolean;
  effectivePrice: number;
  originalPrice: number;
  isOnSale: boolean;
  saleEndsAt: string | null;
}

/**
 * Resolves the authoritative price & active state for a single Store item.
 * Applies identical rules on client and server:
 * - Respects `priceSchemaV2` and skips unversioned uniform-600 legacy test overrides
 * - Applies active `salePriceKobans` / `sale_price_kobans` if not expired
 * - Superadmin checkout always resolves effective price to 0 when `isSuperAdmin` is true
 */
export function resolveEffectiveStoreItemPrice(params: {
  catalogPrice: number;
  catalogSalePrice?: number | null;
  catalogSaleEndsAt?: unknown;
  liveDoc?: Record<string, any> | null;
  isLegacyUniform600?: boolean;
  isSuperAdmin?: boolean;
  nowMs?: number;
}): ResolvedStoreItemPrice {
  const {
    catalogPrice,
    catalogSalePrice = null,
    catalogSaleEndsAt = null,
    liveDoc = null,
    isLegacyUniform600 = false,
    isSuperAdmin = false,
    nowMs = Date.now(),
  } = params;

  const fallbackBase = clampKobanPrice(catalogPrice);

  let active = true;
  let basePrice = fallbackBase;
  let salePrice: number | null =
    typeof catalogSalePrice === 'number' && Number.isFinite(catalogSalePrice)
      ? clampKobanPrice(catalogSalePrice)
      : null;
  let saleEndsAtRaw: unknown = catalogSaleEndsAt;

  if (liveDoc && typeof liveDoc === 'object') {
    const docActive =
      liveDoc.active !== undefined
        ? Boolean(liveDoc.active)
        : liveDoc.is_active !== undefined
        ? Boolean(liveDoc.is_active)
        : true;
    active = isSuperAdmin ? true : docActive;

    const useStoredPrice = Boolean(liveDoc.priceSchemaV2) || !isLegacyUniform600;
    if (useStoredPrice) {
      const rawDocPrice = liveDoc.priceKobans ?? liveDoc.price_kobans ?? liveDoc.price;
      if (typeof rawDocPrice === 'number' && Number.isFinite(rawDocPrice)) {
        basePrice = clampKobanPrice(rawDocPrice);
      }
      const rawDocSale = liveDoc.salePriceKobans ?? liveDoc.sale_price_kobans;
      if (typeof rawDocSale === 'number' && Number.isFinite(rawDocSale)) {
        salePrice = clampKobanPrice(rawDocSale);
      } else if (rawDocSale === null) {
        salePrice = null;
      }
      if ('saleEndsAt' in liveDoc || 'sale_ends_at' in liveDoc) {
        saleEndsAtRaw = liveDoc.saleEndsAt ?? liveDoc.sale_ends_at ?? null;
      }
    }
  }

  const onSale = isSaleCurrentlyActive(basePrice, salePrice, saleEndsAtRaw, nowMs);
  const resolvedEffective = onSale && salePrice !== null ? salePrice : basePrice;
  const finalEffective = isSuperAdmin ? 0 : resolvedEffective;

  const saleEndsAtStr =
    onSale && typeof saleEndsAtRaw === 'string' && saleEndsAtRaw.trim()
      ? saleEndsAtRaw.trim()
      : null;

  return {
    active,
    effectivePrice: finalEffective,
    originalPrice: basePrice,
    isOnSale: onSale,
    saleEndsAt: saleEndsAtStr,
  };
}

export interface CartPricedItem {
  id: string;
  price?: number;
  priceKobans?: number;
  type?: string;
  name?: string;
}

export interface CartTotalsResult<T extends CartPricedItem> {
  items: T[];
  itemCount: number;
  subtotal: number;
  currentBalance: number;
  balanceAfterPurchase: number;
  canAfford: boolean;
  deficit: number;
  insufficientBannerMessage: string | null;
}

/**
 * Single shared calculation for Cart Subtotal, Current Balance, Balance After Purchase,
 * deficit, and "Insufficient Kobans" error banner.
 *
 * Guarantees:
 * - Deduplicates items by ID (never double-counts an item)
 * - Excludes already-owned items if `ownedIds` is provided (for non-superadmin)
 * - Items sharing a slot (e.g. multiple frames/avatars) are each priced ONCE
 * - Banner, subtotal, balance-after-purchase, and checkout validation ALWAYS agree
 */
export function calculateCartTotals<T extends CartPricedItem>(params: {
  items: T[];
  balance: number;
  isSuperAdmin?: boolean;
  ownedIds?: Iterable<string> | null;
}): CartTotalsResult<T> {
  const { items, balance, isSuperAdmin = false, ownedIds = null } = params;
  const ownedSet = ownedIds ? new Set(ownedIds) : null;

  const uniqueItems: T[] = [];
  const seenIds = new Set<string>();
  for (const item of items || []) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) continue;
    const cleanId = item.id.trim();
    if (seenIds.has(cleanId)) continue;
    if (!isSuperAdmin && ownedSet && ownedSet.has(cleanId)) continue;
    seenIds.add(cleanId);
    uniqueItems.push(item);
  }

  const currentBalance = clampKobanPrice(balance);
  const subtotal = isSuperAdmin
    ? 0
    : uniqueItems.reduce((sum, item) => {
        const unitPrice = clampKobanPrice(item.price ?? item.priceKobans ?? 0);
        return sum + unitPrice;
      }, 0);

  const canAfford = isSuperAdmin || currentBalance >= subtotal;
  const deficit = canAfford ? 0 : Math.max(0, subtotal - currentBalance);
  const balanceAfterPurchase = isSuperAdmin ? currentBalance : currentBalance - subtotal;
  const insufficientBannerMessage =
    !canAfford && uniqueItems.length > 0
      ? `Insufficient Kobans. You need ${subtotal.toLocaleString()} Kobans (you have ${currentBalance.toLocaleString()}).`
      : null;

  return {
    items: uniqueItems,
    itemCount: uniqueItems.length,
    subtotal,
    currentBalance,
    balanceAfterPurchase,
    canAfford,
    deficit,
    insufficientBannerMessage,
  };
}
