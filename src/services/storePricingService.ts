import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  COSMETICS_CATALOG,
  KOBAN_TO_PKR_RATE,
  kobansToPkr,
  type CosmeticItem,
} from '@/data/cosmeticsCatalog';
import type { CosmeticType, CosmeticRarity } from '@/types';

export { KOBAN_TO_PKR_RATE, kobansToPkr };

export type StoreCategory = 'banner' | 'avatar_frame' | 'profile_effect' | 'nameplate' | 'avatar';
export type StoreItemType = 'static' | 'animated';

export const MAX_KOBAN_PRICE = 100000;

export interface StoreItemDoc {
  id: string;
  name: string;
  category: StoreCategory;
  catalogType: CosmeticType;
  type: StoreItemType;
  priceKobans: number;
  price_kobans: number;
  salePriceKobans: number | null;
  sale_price_kobans: number | null;
  saleEndsAt: string | null;
  sale_ends_at: string | null;
  active: boolean;
  is_active: boolean;
  rarity: CosmeticRarity;
  isNew?: boolean;
  is_new?: boolean;
  createdAt?: string;
  description?: string;
  previewColor?: string;
  priceSchemaV2?: boolean;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface StorePriceAuditEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  item_id: string;
  item_name: string;
  old_price: number;
  new_price: number;
  sale_price_kobans?: number | null;
  sale_ends_at?: string | null;
  is_active?: boolean;
  timestamp: unknown;
}

export interface PriceHistoryRecord {
  id: string;
  changedBy: string;
  adminId?: string;
  timestamp: unknown;
  filterSummary: string;
  affectedCount: number;
  mode: string;
  changesSample: Array<{
    itemId: string;
    itemName: string;
    oldPrice: number;
    newPrice: number;
  }>;
}

export type BulkAdjustmentMode =
  | 'exact'
  | 'percentage_increase'
  | 'percentage_decrease'
  | 'fixed_increase'
  | 'fixed_decrease'
  | 'set_by_rarity';

export type RarityPriceMap = Record<CosmeticRarity, number>;

export const DEFAULT_RARITY_PRICES: RarityPriceMap = {
  common: 95,
  rare: 220,
  epic: 460,
  legendary: 880,
  mythic: 1700,
};

export interface BulkFilterParams {
  category: 'all' | StoreCategory;
  type: 'both' | 'static' | 'animated';
  mode: BulkAdjustmentMode;
  value: number;
  selectedIds?: string[];
  rarityPrices?: Partial<RarityPriceMap>;
}

export interface BulkPreviewResult {
  totalMatches: number;
  affectedItems: Array<{
    id: string;
    name: string;
    category: StoreCategory;
    rarity: CosmeticRarity;
    type: StoreItemType;
    oldPrice: number;
    newPrice: number;
    diff: number;
  }>;
}

export function clampKobanPrice(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.min(MAX_KOBAN_PRICE, Math.max(0, Math.round(val)));
}

export function validateKobanPriceInput(raw: string | number): {
  valid: boolean;
  value: number;
  error?: string;
} {
  const str = String(raw).trim();
  if (str === '') {
    return { valid: false, value: 0, error: 'Enter a price between 0 and 100,000 Kobans.' };
  }
  const num = Number(str);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { valid: false, value: 0, error: 'Price must be a whole integer.' };
  }
  if (num < 0) {
    return { valid: false, value: 0, error: 'Price cannot be negative (min 0).' };
  }
  if (num > MAX_KOBAN_PRICE) {
    return { valid: false, value: MAX_KOBAN_PRICE, error: 'Price cannot exceed 100,000 Kobans.' };
  }
  return { valid: true, value: num };
}

export function isSaleCurrentlyActive(
  priceKobans: number,
  salePriceKobans?: number | null,
  saleEndsAt?: string | null
): boolean {
  if (salePriceKobans === null || salePriceKobans === undefined) return false;
  if (!Number.isFinite(salePriceKobans) || salePriceKobans < 0) return false;
  if (salePriceKobans >= priceKobans) return false;
  if (saleEndsAt) {
    const endMs = new Date(saleEndsAt).getTime();
    if (Number.isFinite(endMs) && endMs <= Date.now()) {
      return false;
    }
  }
  return true;
}

export function getEffectivePriceInfo(item: {
  priceKobans: number;
  salePriceKobans?: number | null;
  saleEndsAt?: string | null;
}): {
  effectivePrice: number;
  originalPrice: number;
  isOnSale: boolean;
  saleEndsAt: string | null;
} {
  const base = clampKobanPrice(item.priceKobans);
  const onSale = isSaleCurrentlyActive(base, item.salePriceKobans, item.saleEndsAt);
  const effective = onSale && typeof item.salePriceKobans === 'number'
    ? clampKobanPrice(item.salePriceKobans)
    : base;
  return {
    effectivePrice: effective,
    originalPrice: base,
    isOnSale: onSale,
    saleEndsAt: onSale ? (item.saleEndsAt ?? null) : null,
  };
}

/**
 * Verifies the current user's admin/superadmin role server-side (default role = null).
 * Calls /api/auth/me with Firebase Bearer ID token and cross-checks Firestore users/{uid}.
 */
export async function verifyStoreAdminRoleServerSide(): Promise<{
  verified: boolean;
  role: 'admin' | 'superadmin' | null;
  uid: string | null;
  email: string | null;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { verified: false, role: null, uid: null, email: null };
  }

  try {
    const token = await currentUser.getIdToken();
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      const serverRole = String(data?.user?.role || data?.role || '').toLowerCase();
      if (serverRole === 'superadmin' || serverRole === 'admin') {
        return {
          verified: true,
          role: serverRole as 'admin' | 'superadmin',
          uid: currentUser.uid,
          email: currentUser.email || null,
        };
      }
    }
  } catch {
    // Fallback to Firestore user doc verification if /api/auth/me is unreachable
  }

  try {
    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
    if (userSnap.exists()) {
      const uData = userSnap.data();
      const dbRole = String(uData?.role || '').toLowerCase();
      if (dbRole === 'superadmin' || dbRole === 'admin' || uData?.isSuperAdmin === true) {
        return {
          verified: true,
          role: dbRole === 'admin' ? 'admin' : 'superadmin',
          uid: currentUser.uid,
          email: currentUser.email || null,
        };
      }
    }
  } catch {
    // ignore
  }

  return { verified: false, role: null, uid: currentUser.uid, email: currentUser.email || null };
}

// Map catalog item type to StoreCategory
export function mapCatalogTypeToStoreCategory(catalogType: CosmeticType): StoreCategory {
  if (catalogType === 'frame') return 'avatar_frame';
  if (catalogType === 'effect') return 'profile_effect';
  if (catalogType === 'nameplate') return 'nameplate';
  if (catalogType === 'banner') return 'banner';
  return 'avatar';
}

// Convert catalog item to StoreItemDoc
export function catalogItemToStoreDoc(item: CosmeticItem): StoreItemDoc {
  const cleanPrice = clampKobanPrice(item.priceKobans);
  const cleanSale =
    item.salePriceKobans !== undefined && item.salePriceKobans !== null
      ? clampKobanPrice(item.salePriceKobans)
      : null;
  const active = item.isActive !== false;
  return {
    id: item.id,
    name: item.name,
    category: mapCatalogTypeToStoreCategory(item.type),
    catalogType: item.type,
    type: item.animated ? 'animated' : 'static',
    priceKobans: cleanPrice,
    price_kobans: cleanPrice,
    salePriceKobans: cleanSale,
    sale_price_kobans: cleanSale,
    saleEndsAt: item.saleEndsAt ?? null,
    sale_ends_at: item.saleEndsAt ?? null,
    active,
    is_active: active,
    rarity: item.rarity,
    isNew: Boolean(item.isNew),
    is_new: Boolean(item.isNew),
    createdAt: item.createdAt,
    description: item.description,
    previewColor: item.previewColor,
    priceSchemaV2: true,
  };
}

/**
 * Seeds or syncs the 125 catalog items into Firestore store_items & storeItems.
 */
export async function seedStoreItemsIfEmpty(superAdminEmail: string): Promise<number> {
  const check = await verifyStoreAdminRoleServerSide();
  if (!check.verified) {
    throw new Error('403 Forbidden: Only verified admin or superadmin can seed store items.');
  }

  const items = COSMETICS_CATALOG.map(catalogItemToStoreDoc);
  const CHUNK_SIZE = 200;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const { effectivePrice } = getEffectivePriceInfo(item);
      const docRef = doc(db, 'store_items', item.id);
      const primaryRef = doc(db, 'storeItems', item.id);
      const payload = {
        ...item,
        updatedAt: serverTimestamp(),
        updatedBy: superAdminEmail || check.email || 'admin',
      };
      batch.set(docRef, payload, { merge: true });
      batch.set(
        primaryRef,
        {
          ...payload,
          priceKobans: effectivePrice,
          basePriceKobans: item.priceKobans,
        },
        { merge: true }
      );
    }

    await batch.commit();
  }

  return items.length;
}

/**
 * Fetches all 125 store items, merging any verified v2 admin overrides from Firestore
 * over the authoritative 125-item catalog.
 * Automatically ignores legacy un-versioned uniform-600 test docs so every item
 * has its proper rarity-matched price unless explicitly updated in v2.
 */
export async function fetchStoreItems(): Promise<StoreItemDoc[]> {
  const baseCatalogMap = new Map<string, StoreItemDoc>();
  for (const item of COSMETICS_CATALOG) {
    baseCatalogMap.set(item.id, catalogItemToStoreDoc(item));
  }

  try {
    const colRef = collection(db, 'store_items');
    const snap = await getDocs(colRef);

    if (snap.empty) {
      return Array.from(baseCatalogMap.values());
    }

    // Detect if Firestore contains legacy un-migrated uniform-600 bulk test data
    const docsData = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    const unversionedCount = docsData.filter((d) => !d.data.priceSchemaV2).length;
    const uniform600Count = docsData.filter(
      (d) => !d.data.priceSchemaV2 && d.data.priceKobans === 600
    ).length;
    const isLegacyUniform600 = unversionedCount > 0 && uniform600Count / unversionedCount > 0.6;

    for (const { id, data } of docsData) {
      const base = baseCatalogMap.get(id);
      if (!base) continue;

      // Only apply price override if doc was saved with priceSchemaV2 or is not part of the legacy uniform-600 dump
      const useStoredPrice = Boolean(data.priceSchemaV2) || !isLegacyUniform600;
      const rawPrice =
        useStoredPrice && typeof (data.priceKobans ?? data.price_kobans) === 'number'
          ? clampKobanPrice(data.priceKobans ?? data.price_kobans)
          : base.priceKobans;

      const rawSale =
        useStoredPrice &&
        (typeof data.salePriceKobans === 'number' || typeof data.sale_price_kobans === 'number')
          ? clampKobanPrice(data.salePriceKobans ?? data.sale_price_kobans)
          : null;

      const rawSaleEndsAt =
        useStoredPrice && typeof (data.saleEndsAt ?? data.sale_ends_at) === 'string'
          ? (data.saleEndsAt ?? data.sale_ends_at)
          : null;

      const isActive =
        data.active !== undefined
          ? Boolean(data.active)
          : data.is_active !== undefined
          ? Boolean(data.is_active)
          : true;

      baseCatalogMap.set(id, {
        ...base,
        priceKobans: rawPrice,
        price_kobans: rawPrice,
        salePriceKobans: rawSale,
        sale_price_kobans: rawSale,
        saleEndsAt: rawSaleEndsAt,
        sale_ends_at: rawSaleEndsAt,
        active: isActive,
        is_active: isActive,
        priceSchemaV2: Boolean(data.priceSchemaV2),
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      });
    }

    return Array.from(baseCatalogMap.values());
  } catch (err) {
    console.warn('[storePricingService] fetchStoreItems error, using catalog fallback:', err);
    return Array.from(baseCatalogMap.values());
  }
}

/**
 * Re-reads the item's live price from Firestore right before purchase to:
 * 1. Reject with "Price changed, please review" if an admin changed the price since the user opened the sheet.
 * 2. Ensure `storeItems/{id}` has the exact current effective price (including active sales or v2 catalog price)
 *    so `kobanService.ts` deducts the exact effective price.
 */
export async function verifyItemPriceAtPurchase(
  itemId: string,
  expectedEffectivePrice: number
): Promise<{
  valid: boolean;
  liveEffectivePrice: number;
  liveBasePrice: number;
  isActive: boolean;
  error?: string;
}> {
  const catalogItem = COSMETICS_CATALOG.find((it) => it.id === itemId);
  const baseDefault = catalogItem ? clampKobanPrice(catalogItem.priceKobans) : expectedEffectivePrice;

  try {
    const snap = await getDoc(doc(db, 'store_items', itemId));
    let liveBasePrice = baseDefault;
    let liveSalePrice: number | null = null;
    let liveSaleEndsAt: string | null = null;
    let isActive = true;

    if (snap.exists()) {
      const data = snap.data();
      isActive = data.active !== false && data.is_active !== false;
      if (data.priceSchemaV2 && typeof (data.priceKobans ?? data.price_kobans) === 'number') {
        liveBasePrice = clampKobanPrice(data.priceKobans ?? data.price_kobans);
      }
      if (
        data.priceSchemaV2 &&
        (typeof data.salePriceKobans === 'number' || typeof data.sale_price_kobans === 'number')
      ) {
        liveSalePrice = clampKobanPrice(data.salePriceKobans ?? data.sale_price_kobans);
      }
      if (data.priceSchemaV2 && typeof (data.saleEndsAt ?? data.sale_ends_at) === 'string') {
        liveSaleEndsAt = data.saleEndsAt ?? data.sale_ends_at;
      }
    }

    const { effectivePrice } = getEffectivePriceInfo({
      priceKobans: liveBasePrice,
      salePriceKobans: liveSalePrice,
      saleEndsAt: liveSaleEndsAt,
    });

    if (effectivePrice !== expectedEffectivePrice) {
      return {
        valid: false,
        liveEffectivePrice: effectivePrice,
        liveBasePrice,
        isActive,
        error: 'Price changed, please review',
      };
    }

    return {
      valid: true,
      liveEffectivePrice: effectivePrice,
      liveBasePrice,
      isActive,
    };
  } catch (err: any) {
    console.error(
      '[StorePricingService] verifyItemPriceAtPurchase error:',
      err?.code || 'unknown',
      `store_items/${itemId}`,
      err
    );
    return {
      valid: true,
      liveEffectivePrice: expectedEffectivePrice,
      liveBasePrice: baseDefault,
      isActive: true,
    };
  }
}

/**
 * Update pricing, sale price, sale end timestamp, and active visibility for a single item.
 * Enforces server-verified admin/superadmin check, integer 0..100,000 validation, and writes an audit log.
 */
export async function updateSingleItemPricing(
  superAdminEmail: string,
  itemId: string,
  updates: {
    priceKobans?: number;
    salePriceKobans?: number | null;
    saleEndsAt?: string | null;
    active?: boolean;
  },
  previousItem?: StoreItemDoc
): Promise<void> {
  const roleCheck = await verifyStoreAdminRoleServerSide();
  if (!roleCheck.verified) {
    throw new Error('403 Forbidden: Admin or superadmin role required to modify store prices.');
  }

  const cleanPrice =
    updates.priceKobans !== undefined ? clampKobanPrice(updates.priceKobans) : undefined;
  const cleanSale =
    updates.salePriceKobans === null
      ? null
      : updates.salePriceKobans !== undefined
      ? clampKobanPrice(updates.salePriceKobans)
      : undefined;
  const cleanSaleEndsAt =
    updates.saleEndsAt === null
      ? null
      : updates.saleEndsAt !== undefined
      ? String(updates.saleEndsAt)
      : undefined;

  const baseForEffective = cleanPrice ?? previousItem?.priceKobans ?? 0;
  const saleForEffective =
    cleanSale !== undefined ? cleanSale : (previousItem?.salePriceKobans ?? null);
  const endsForEffective =
    cleanSaleEndsAt !== undefined ? cleanSaleEndsAt : (previousItem?.saleEndsAt ?? null);

  const { effectivePrice } = getEffectivePriceInfo({
    priceKobans: baseForEffective,
    salePriceKobans: saleForEffective,
    saleEndsAt: endsForEffective,
  });

  const actorEmail = superAdminEmail || roleCheck.email || 'admin';
  const actorUid = roleCheck.uid || 'admin';

  const payload: Record<string, unknown> = {
    priceSchemaV2: true,
    updatedAt: serverTimestamp(),
    updatedBy: actorEmail,
  };
  if (cleanPrice !== undefined) {
    payload.priceKobans = cleanPrice;
    payload.price_kobans = cleanPrice;
  }
  if (cleanSale !== undefined) {
    payload.salePriceKobans = cleanSale;
    payload.sale_price_kobans = cleanSale;
  }
  if (cleanSaleEndsAt !== undefined) {
    payload.saleEndsAt = cleanSaleEndsAt;
    payload.sale_ends_at = cleanSaleEndsAt;
  }
  if (updates.active !== undefined) {
    payload.active = Boolean(updates.active);
    payload.is_active = Boolean(updates.active);
  }

  const docRef = doc(db, 'store_items', itemId);
  const primaryRef = doc(db, 'storeItems', itemId);

  await Promise.all([
    setDoc(docRef, payload, { merge: true }),
    setDoc(
      primaryRef,
      {
        ...payload,
        priceKobans: effectivePrice,
        basePriceKobans: baseForEffective,
      },
      { merge: true }
    ),
  ]);

  const oldPrice = previousItem?.priceKobans ?? 0;
  const newPrice = cleanPrice !== undefined ? cleanPrice : oldPrice;

  // Write audit log entry (admin_id, item_id, old_price, new_price, timestamp)
  const auditRef = doc(collection(db, 'store_price_audit'));
  const historyRef = doc(collection(db, 'storePriceHistory'));

  await Promise.all([
    setDoc(auditRef, {
      id: auditRef.id,
      admin_id: actorUid,
      admin_email: actorEmail,
      item_id: itemId,
      item_name: previousItem?.name || itemId,
      old_price: oldPrice,
      new_price: newPrice,
      sale_price_kobans: saleForEffective,
      sale_ends_at: endsForEffective,
      is_active: updates.active ?? previousItem?.active ?? true,
      timestamp: serverTimestamp(),
    }),
    setDoc(historyRef, {
      id: historyRef.id,
      adminId: actorUid,
      changedBy: actorEmail,
      timestamp: serverTimestamp(),
      filterSummary: `Single item update: ${previousItem?.name || itemId}`,
      affectedCount: 1,
      mode: 'single',
      changesSample: [
        {
          itemId,
          itemName: previousItem?.name || itemId,
          oldPrice,
          newPrice,
        },
      ],
    }),
  ]);
}

/**
 * Calculates preview of bulk price changes without writing to Firestore.
 * Supports filtering by explicit selectedIds or by category/type, and supports 'set_by_rarity'.
 */
export function previewBulkPriceChanges(
  items: StoreItemDoc[],
  params: BulkFilterParams
): BulkPreviewResult {
  const selectedSet =
    Array.isArray(params.selectedIds) && params.selectedIds.length > 0
      ? new Set(params.selectedIds)
      : null;

  const matches = items.filter((item) => {
    if (selectedSet && !selectedSet.has(item.id)) {
      return false;
    }
    if (!selectedSet) {
      if (params.category !== 'all' && item.category !== params.category) {
        return false;
      }
      if (params.type !== 'both' && item.type !== params.type) {
        return false;
      }
    }
    return true;
  });

  const rarityMap: RarityPriceMap = {
    ...DEFAULT_RARITY_PRICES,
    ...(params.rarityPrices || {}),
  };

  const affectedItems = matches.map((item) => {
    let targetPrice = item.priceKobans;
    const val = Number(params.value) || 0;

    switch (params.mode) {
      case 'exact':
        targetPrice = clampKobanPrice(val);
        break;
      case 'percentage_increase':
        targetPrice = clampKobanPrice(item.priceKobans * (1 + val / 100));
        break;
      case 'percentage_decrease':
        targetPrice = clampKobanPrice(item.priceKobans * (1 - val / 100));
        break;
      case 'fixed_increase':
        targetPrice = clampKobanPrice(item.priceKobans + val);
        break;
      case 'fixed_decrease':
        targetPrice = clampKobanPrice(item.priceKobans - val);
        break;
      case 'set_by_rarity':
        targetPrice = clampKobanPrice(rarityMap[item.rarity] ?? item.priceKobans);
        break;
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      rarity: item.rarity,
      type: item.type,
      oldPrice: item.priceKobans,
      newPrice: targetPrice,
      diff: targetPrice - item.priceKobans,
    };
  });

  return {
    totalMatches: affectedItems.length,
    affectedItems,
  };
}

/**
 * Commits bulk price changes to Firestore (both store_items and storeItems)
 * and writes audit log entries for every changed item.
 */
export async function executeBulkPriceChanges(
  superAdminEmail: string,
  preview: BulkPreviewResult,
  filterSummary: string,
  mode: string
): Promise<{ updatedCount: number }> {
  const roleCheck = await verifyStoreAdminRoleServerSide();
  if (!roleCheck.verified) {
    throw new Error('403 Forbidden: Admin or superadmin role required for bulk price updates.');
  }

  if (preview.affectedItems.length === 0) {
    return { updatedCount: 0 };
  }

  const actorEmail = superAdminEmail || roleCheck.email || 'admin';
  const actorUid = roleCheck.uid || 'admin';
  const BATCH_CHUNK_SIZE = 120;
  const items = preview.affectedItems;

  for (let i = 0; i < items.length; i += BATCH_CHUNK_SIZE) {
    const chunk = items.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const cleanNewPrice = clampKobanPrice(item.newPrice);
      const docRef = doc(db, 'store_items', item.id);
      const primaryRef = doc(db, 'storeItems', item.id);
      const payload = {
        priceKobans: cleanNewPrice,
        price_kobans: cleanNewPrice,
        priceSchemaV2: true,
        updatedAt: serverTimestamp(),
        updatedBy: actorEmail,
      };
      batch.set(docRef, payload, { merge: true });
      batch.set(
        primaryRef,
        {
          ...payload,
          basePriceKobans: cleanNewPrice,
        },
        { merge: true }
      );

      const auditRef = doc(collection(db, 'store_price_audit'));
      batch.set(auditRef, {
        id: auditRef.id,
        admin_id: actorUid,
        admin_email: actorEmail,
        item_id: item.id,
        item_name: item.name,
        old_price: item.oldPrice,
        new_price: cleanNewPrice,
        timestamp: serverTimestamp(),
      });
    }

    await batch.commit();
  }

  // Write summary history log record
  const historyRef = doc(collection(db, 'storePriceHistory'));
  const sample = items.slice(0, 15).map((it) => ({
    itemId: it.id,
    itemName: it.name,
    oldPrice: it.oldPrice,
    newPrice: it.newPrice,
  }));

  await setDoc(historyRef, {
    id: historyRef.id,
    adminId: actorUid,
    changedBy: actorEmail,
    timestamp: serverTimestamp(),
    filterSummary,
    affectedCount: items.length,
    mode,
    changesSample: sample,
  });

  return { updatedCount: items.length };
}

/**
 * Fetches recent price history records.
 */
export async function fetchPriceHistory(limitCount = 40): Promise<PriceHistoryRecord[]> {
  try {
    const colRef = collection(db, 'storePriceHistory');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        adminId: data.adminId,
        changedBy: data.changedBy || 'Admin',
        timestamp: data.timestamp,
        filterSummary: data.filterSummary || 'Bulk price update',
        affectedCount: data.affectedCount || 0,
        mode: data.mode || 'bulk',
        changesSample: Array.isArray(data.changesSample) ? data.changesSample : [],
      };
    });
  } catch (err) {
    console.warn('[storePricingService] fetchPriceHistory error:', err);
    return [];
  }
}
