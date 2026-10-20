import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COSMETICS_CATALOG, type CosmeticItem } from '@/data/cosmeticsCatalog';
import type { CosmeticType } from '@/types';

export type StoreCategory = 'banner' | 'avatar_frame' | 'profile_effect' | 'nameplate' | 'avatar';
export type StoreItemType = 'static' | 'animated';

export interface StoreItemDoc {
  id: string;
  name: string;
  category: StoreCategory;
  type: StoreItemType;
  priceKobans: number;
  active: boolean;
  rarity?: string;
  description?: string;
  previewColor?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface PriceHistoryRecord {
  id: string;
  changedBy: string;
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
  | 'fixed_decrease';

export interface BulkFilterParams {
  category: 'all' | StoreCategory;
  type: 'both' | 'static' | 'animated';
  mode: BulkAdjustmentMode;
  value: number;
}

export interface BulkPreviewResult {
  totalMatches: number;
  affectedItems: Array<{
    id: string;
    name: string;
    category: StoreCategory;
    type: StoreItemType;
    oldPrice: number;
    newPrice: number;
    diff: number;
  }>;
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
  return {
    id: item.id,
    name: item.name,
    category: mapCatalogTypeToStoreCategory(item.type),
    type: item.animated ? 'animated' : 'static',
    priceKobans: Math.max(0, Math.floor(item.priceKobans)),
    active: true,
    rarity: item.rarity,
    description: item.description,
    previewColor: item.previewColor,
  };
}

/**
 * Initializes or seeds the store_items collection from COSMETICS_CATALOG.
 * Safe to call repeatedly; uses batched writes (chunked <= 400).
 */
export async function seedStoreItemsIfEmpty(superAdminEmail: string): Promise<number> {
  const colRef = collection(db, 'store_items');
  const snap = await getDocs(colRef);

  if (!snap.empty) {
    return snap.size;
  }

  // Seed all catalog items
  const items = COSMETICS_CATALOG.map(catalogItemToStoreDoc);
  const CHUNK_SIZE = 400;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docRef = doc(db, 'store_items', item.id);
      batch.set(docRef, {
        ...item,
        updatedAt: serverTimestamp(),
        updatedBy: superAdminEmail,
      });
    }

    await batch.commit();
  }

  return items.length;
}

/**
 * Fetches all store items from Firestore.
 * If Firestore collection is empty, returns items built from catalog as fallback.
 */
export async function fetchStoreItems(): Promise<StoreItemDoc[]> {
  try {
    const colRef = collection(db, 'store_items');
    const snap = await getDocs(colRef);

    if (snap.empty) {
      return COSMETICS_CATALOG.map(catalogItemToStoreDoc);
    }

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || d.id,
        category: data.category || 'avatar',
        type: data.type || (data.animated ? 'animated' : 'static'),
        priceKobans: typeof data.priceKobans === 'number' ? Math.max(0, data.priceKobans) : 0,
        active: data.active !== false,
        rarity: data.rarity,
        description: data.description,
        previewColor: data.previewColor,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      } as StoreItemDoc;
    });
  } catch (err) {
    console.warn('[storePricingService] fetchStoreItems error, using catalog fallback:', err);
    return COSMETICS_CATALOG.map(catalogItemToStoreDoc);
  }
}

/**
 * Update pricing and active status for a single item.
 */
export async function updateSingleItemPricing(
  superAdminEmail: string,
  itemId: string,
  updates: { priceKobans?: number; active?: boolean },
  previousItem?: StoreItemDoc
): Promise<void> {
  const docRef = doc(db, 'store_items', itemId);
  const cleanPrice = updates.priceKobans !== undefined ? Math.max(0, Math.floor(updates.priceKobans)) : undefined;

  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    updatedBy: superAdminEmail,
  };
  if (cleanPrice !== undefined) payload.priceKobans = cleanPrice;
  if (updates.active !== undefined) payload.active = Boolean(updates.active);

  await setDoc(docRef, payload, { merge: true });

  // Log to price history
  const historyRef = doc(collection(db, 'storePriceHistory'));
  await setDoc(historyRef, {
    id: historyRef.id,
    changedBy: superAdminEmail,
    timestamp: serverTimestamp(),
    filterSummary: `Single item update: ${previousItem?.name || itemId}`,
    affectedCount: 1,
    mode: 'single',
    changesSample: [
      {
        itemId,
        itemName: previousItem?.name || itemId,
        oldPrice: previousItem?.priceKobans ?? 0,
        newPrice: cleanPrice !== undefined ? cleanPrice : previousItem?.priceKobans ?? 0,
      },
    ],
  });
}

/**
 * Calculates preview of bulk price changes without writing to Firestore.
 */
export function previewBulkPriceChanges(
  items: StoreItemDoc[],
  params: BulkFilterParams
): BulkPreviewResult {
  const matches = items.filter((item) => {
    // 1. Category check
    if (params.category !== 'all' && item.category !== params.category) {
      return false;
    }
    // 2. Type check (static / animated / both)
    if (params.type !== 'both' && item.type !== params.type) {
      return false;
    }
    return true;
  });

  const affectedItems = matches.map((item) => {
    let targetPrice = item.priceKobans;
    const val = Number(params.value) || 0;

    switch (params.mode) {
      case 'exact':
        targetPrice = Math.max(0, Math.round(val));
        break;
      case 'percentage_increase':
        targetPrice = Math.max(0, Math.round(item.priceKobans * (1 + val / 100)));
        break;
      case 'percentage_decrease':
        targetPrice = Math.max(0, Math.round(item.priceKobans * (1 - val / 100)));
        break;
      case 'fixed_increase':
        targetPrice = Math.max(0, Math.round(item.priceKobans + val));
        break;
      case 'fixed_decrease':
        targetPrice = Math.max(0, Math.round(item.priceKobans - val));
        break;
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
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
 * Commits bulk price changes to Firestore using batched writes (max 450 per batch).
 * Appends audit record to storePriceHistory.
 */
export async function executeBulkPriceChanges(
  superAdminEmail: string,
  preview: BulkPreviewResult,
  filterSummary: string,
  mode: string
): Promise<{ updatedCount: number }> {
  if (preview.affectedItems.length === 0) {
    return { updatedCount: 0 };
  }

  const BATCH_CHUNK_SIZE = 450;
  const items = preview.affectedItems;

  for (let i = 0; i < items.length; i += BATCH_CHUNK_SIZE) {
    const chunk = items.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docRef = doc(db, 'store_items', item.id);
      batch.set(
        docRef,
        {
          priceKobans: item.newPrice,
          updatedAt: serverTimestamp(),
          updatedBy: superAdminEmail,
        },
        { merge: true }
      );
    }

    await batch.commit();
  }

  // Write history log record
  const historyRef = doc(collection(db, 'storePriceHistory'));
  const sample = items.slice(0, 10).map((it) => ({
    itemId: it.id,
    itemName: it.name,
    oldPrice: it.oldPrice,
    newPrice: it.newPrice,
  }));

  await setDoc(historyRef, {
    id: historyRef.id,
    changedBy: superAdminEmail,
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
        changedBy: data.changedBy || 'Super Admin',
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
