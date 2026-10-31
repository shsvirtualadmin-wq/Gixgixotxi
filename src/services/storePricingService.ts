import { api } from '@/lib/api';
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

export function mapCatalogTypeToStoreCategory(catalogType: CosmeticType): StoreCategory {
  if (catalogType === 'frame') return 'avatar_frame';
  if (catalogType === 'effect') return 'profile_effect';
  if (catalogType === 'nameplate') return 'nameplate';
  if (catalogType === 'banner') return 'banner';
  return 'avatar';
}

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
 * Seeds or syncs store items in D1 (`store_items`).
 */
export async function seedStoreItemsIfEmpty(_superAdminEmail: string): Promise<number> {
  const items = await fetchStoreItems();
  return items.length;
}

/**
 * Fetches all store items from D1 `/api/shop/items` with catalog fallback.
 */
export async function fetchStoreItems(): Promise<StoreItemDoc[]> {
  try {
    const res = await api.get<{ items?: StoreItemDoc[] }>('/api/shop/items', {
      silentToast: true,
    });
    if (Array.isArray(res?.items) && res.items.length > 0) {
      return res.items.map((data) => ({
        id: data.id,
        name: data.name || data.id,
        category: data.category || 'avatar',
        type: data.type || 'static',
        priceKobans: typeof data.priceKobans === 'number' ? Math.max(0, data.priceKobans) : 0,
        active: data.active !== false,
        rarity: data.rarity,
        description: data.description,
        previewColor: data.previewColor,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      }));
    }
    return COSMETICS_CATALOG.map(catalogItemToStoreDoc);
  } catch (err) {
    console.warn('[storePricingService] fetchStoreItems error, using catalog fallback:', err);
    return COSMETICS_CATALOG.map(catalogItemToStoreDoc);
  }
}

/**
 * Update pricing and active status for a single item in D1.
 */
export async function updateSingleItemPricing(
  _superAdminEmail: string,
  itemId: string,
  updates: { priceKobans?: number; active?: boolean },
  previousItem?: StoreItemDoc
): Promise<void> {
  const cleanPrice =
    updates.priceKobans !== undefined
      ? Math.max(0, Math.floor(updates.priceKobans))
      : undefined;

  await api.put(`/api/admin/shop/items/${encodeURIComponent(itemId)}`, {
    priceKobans: cleanPrice,
    active: updates.active,
    name: previousItem?.name || itemId,
    category: previousItem?.category || 'avatar',
    type: previousItem?.type || 'static',
    oldPrice: previousItem?.priceKobans ?? 0,
  });
}

export function previewBulkPriceChanges(
  items: StoreItemDoc[],
  params: BulkFilterParams
): BulkPreviewResult {
  const matches = items.filter((item) => {
    if (params.category !== 'all' && item.category !== params.category) {
      return false;
    }
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
 * Commits bulk price changes to D1 `store_items` and `store_price_history`.
 */
export async function executeBulkPriceChanges(
  _superAdminEmail: string,
  preview: BulkPreviewResult,
  filterSummary: string,
  mode: string
): Promise<{ updatedCount: number }> {
  if (preview.affectedItems.length === 0) {
    return { updatedCount: 0 };
  }

  const res = await api.post<{ updatedCount: number }>('/api/admin/shop/bulk-price', {
    items: preview.affectedItems,
    filterSummary,
    mode,
  });

  return { updatedCount: Number(res?.updatedCount ?? preview.affectedItems.length) };
}

/**
 * Fetches recent price history records from D1.
 */
export async function fetchPriceHistory(limitCount = 40): Promise<PriceHistoryRecord[]> {
  try {
    const res = await api.get<{ history?: PriceHistoryRecord[] }>(
      `/api/admin/shop/price-history?limit=${limitCount}`,
      { silentToast: true }
    );
    return Array.isArray(res?.history) ? res.history : [];
  } catch (err) {
    console.warn('[storePricingService] fetchPriceHistory error:', err);
    return [];
  }
}
