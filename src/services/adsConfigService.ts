import { useEffect, useState } from 'react';
import {
  DEFAULT_ADS_CONFIG,
  isOfferActiveNow,
  normalizeAdsConfig,
  type AdDailyStatRow,
  type AdSlotId,
  type AdsConfigDoc,
  type BoardlyOffer,
} from '@/config/ads';
import { getBearerToken } from '@/lib/api';

const CACHE_TTL_MS = 60_000; // 60-second short cache so admin changes go live within ~1 minute
const SESSION_STORAGE_KEY = 'boardly_ads_config_cache_v1';

let memoryConfig: AdsConfigDoc | null = null;
let memoryFetchedAt = 0;
let inflightPromise: Promise<AdsConfigDoc> | null = null;
const configListeners = new Set<(cfg: AdsConfigDoc) => void>();

function readSessionCache(): { config: AdsConfigDoc; fetchedAt: number } | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.config) return null;
    return {
      config: normalizeAdsConfig(parsed.config),
      fetchedAt: Number(parsed.fetchedAt || 0),
    };
  } catch {
    return null;
  }
}

function writeSessionCache(config: AdsConfigDoc, fetchedAt: number): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ config, fetchedAt }));
  } catch {
    // Ignore storage quota errors
  }
}

function notifyListeners(config: AdsConfigDoc): void {
  configListeners.forEach((fn) => {
    try {
      fn(config);
    } catch {
      // Ignore listener error
    }
  });
}

export function getCachedAdsConfigSync(): AdsConfigDoc {
  if (memoryConfig) return memoryConfig;
  const cached = readSessionCache();
  if (cached) {
    memoryConfig = cached.config;
    memoryFetchedAt = cached.fetchedAt;
    return cached.config;
  }
  return DEFAULT_ADS_CONFIG;
}

export function invalidateAdsConfigCache(nextConfig?: AdsConfigDoc): void {
  if (nextConfig) {
    const normalized = normalizeAdsConfig(nextConfig);
    memoryConfig = normalized;
    memoryFetchedAt = Date.now();
    writeSessionCache(normalized, memoryFetchedAt);
    notifyListeners(normalized);
  } else {
    memoryFetchedAt = 0;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }
}

export async function fetchPublicAdsConfig(force = false): Promise<AdsConfigDoc> {
  const now = Date.now();

  if (!force) {
    if (memoryConfig && now - memoryFetchedAt < CACHE_TTL_MS) {
      return memoryConfig;
    }
    if (!memoryConfig) {
      const session = readSessionCache();
      if (session) {
        memoryConfig = session.config;
        memoryFetchedAt = session.fetchedAt;
        if (now - session.fetchedAt < CACHE_TTL_MS) {
          return session.config;
        }
      }
    }
  }

  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    try {
      const resp = await fetch('/api/ads/config', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const normalized = normalizeAdsConfig(data?.config || data);
      memoryConfig = normalized;
      memoryFetchedAt = Date.now();
      writeSessionCache(normalized, memoryFetchedAt);
      notifyListeners(normalized);
      return normalized;
    } catch {
      const fallback = memoryConfig || DEFAULT_ADS_CONFIG;
      memoryConfig = fallback;
      memoryFetchedAt = Date.now();
      return fallback;
    } finally {
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}

export function useAdsConfig(): { config: AdsConfigDoc; loaded: boolean } {
  const [config, setConfig] = useState<AdsConfigDoc>(() => getCachedAdsConfigSync());
  const [loaded, setLoaded] = useState<boolean>(() => Boolean(memoryConfig));

  useEffect(() => {
    let active = true;
    const listener = (next: AdsConfigDoc) => {
      if (active) {
        setConfig(next);
        setLoaded(true);
      }
    };
    configListeners.add(listener);

    fetchPublicAdsConfig(false).then((next) => {
      if (active) {
        setConfig(next);
        setLoaded(true);
      }
    });

    const onFocus = () => {
      if (Date.now() - memoryFetchedAt >= CACHE_TTL_MS) {
        fetchPublicAdsConfig(false);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      active = false;
      configListeners.delete(listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, []);

  return { config, loaded };
}

/**
 * Anonymous daily Boardly offer stats reporter (impressions & clicks only — zero personal data).
 */
export function recordBoardlyOfferEvent(
  type: 'impression' | 'click',
  slotId: AdSlotId | string,
  offerId: string
): void {
  if (!slotId || !offerId || typeof window === 'undefined') return;
  const payload = JSON.stringify({ type, slotId, offerId });

  try {
    if (type === 'click' && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/ads/event', blob)) return;
    }
    fetch('/api/ads/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Never block UI on stats failure
    });
  } catch {
    // Ignore
  }
}

// =============================================================================
// PAGE-LEVEL OFFER DEDUPLICATION
// Ensures two slots on the same page NEVER show the same Boardly offer.
// =============================================================================

// pageKey (pathname) -> Map<slotInstanceKey, offerId>
const pageOfferClaims = new Map<string, Map<string, string>>();

export function claimUniqueOfferForPage(
  pageKey: string,
  slotInstanceKey: string,
  preferredOfferId: string,
  allOffers: BoardlyOffer[]
): BoardlyOffer | null {
  const activeOffers = allOffers.filter((o) => isOfferActiveNow(o));
  if (activeOffers.length === 0) return null;

  let pageMap = pageOfferClaims.get(pageKey);
  if (!pageMap) {
    // Keep map compact by clearing stale route entries if map grows
    if (pageOfferClaims.size > 12) {
      pageOfferClaims.clear();
    }
    pageMap = new Map<string, string>();
    pageOfferClaims.set(pageKey, pageMap);
  }

  // Gather offer IDs claimed by OTHER mounted slots on this same page
  const usedByOthers = new Set<string>();
  for (const [instKey, offId] of pageMap.entries()) {
    if (instKey !== slotInstanceKey) {
      usedByOthers.add(offId);
    }
  }

  // 1. If this slot already holds a valid active offer not used by others, keep it stable
  const existingId = pageMap.get(slotInstanceKey);
  if (existingId && !usedByOthers.has(existingId)) {
    const existingOffer = activeOffers.find((o) => o.id === existingId);
    if (existingOffer && existingOffer.id === preferredOfferId) {
      return existingOffer;
    }
  }

  // 2. Try preferred offer if active and unused by another slot on this page
  const preferred = activeOffers.find((o) => o.id === preferredOfferId);
  if (preferred && !usedByOthers.has(preferred.id)) {
    pageMap.set(slotInstanceKey, preferred.id);
    return preferred;
  }

  // 3. Pick first active offer not already shown on this page
  const alternative = activeOffers.find((o) => !usedByOthers.has(o.id));
  if (alternative) {
    pageMap.set(slotInstanceKey, alternative.id);
    return alternative;
  }

  // 4. All active offers are already displayed on this page — do not duplicate!
  pageMap.delete(slotInstanceKey);
  return null;
}

export function releaseOfferClaimForPage(pageKey: string, slotInstanceKey: string): void {
  const pageMap = pageOfferClaims.get(pageKey);
  if (!pageMap) return;
  pageMap.delete(slotInstanceKey);
  if (pageMap.size === 0) {
    pageOfferClaims.delete(pageKey);
  }
}

// =============================================================================
// MOBILE SINGLE-VISIBLE AD COORDINATOR
// Guarantees only ONE ad/offer is visible at a time on a phone screen (<768px).
// =============================================================================

interface MobileSlotEntry {
  id: string;
  el: HTMLElement;
  inViewport: boolean;
  notify: (allowed: boolean) => void;
}

const mobileSlots = new Map<string, MobileSlotEntry>();
let currentWinnerId: string | null = null;

function recomputeMobileVisibleWinner(): void {
  if (typeof window === 'undefined') return;
  const isMobile = window.innerWidth < 768;

  if (!isMobile) {
    currentWinnerId = null;
    mobileSlots.forEach((entry) => entry.notify(true));
    return;
  }

  // Among all slots currently intersecting the phone viewport, pick the top-most measurable one
  let winner: MobileSlotEntry | null = null;
  let winnerTop = Infinity;
  let fallbackInViewport: MobileSlotEntry | null = null;

  for (const entry of mobileSlots.values()) {
    if (!entry.inViewport) continue;
    if (!fallbackInViewport) fallbackInViewport = entry;
    const rect = entry.el.getBoundingClientRect();
    // Skip elements completely outside the viewport
    if (rect.height > 0 && (rect.bottom <= 0 || rect.top >= window.innerHeight)) continue;
    if (rect.top < winnerTop) {
      winnerTop = rect.top;
      winner = entry;
    }
  }

  const chosenWinner = winner || fallbackInViewport;
  currentWinnerId = chosenWinner ? chosenWinner.id : null;

  // CRITICAL: Never hide a slot unless a DIFFERENT slot actually won the mobile viewport!
  for (const entry of mobileSlots.values()) {
    if (!entry.inViewport || !currentWinnerId) {
      entry.notify(true);
    } else {
      entry.notify(entry.id === currentWinnerId);
    }
  }
}

export function registerMobileAdSlot(
  id: string,
  el: HTMLElement,
  notify: (allowed: boolean) => void
): () => void {
  const entry: MobileSlotEntry = { id, el, inViewport: false, notify };
  mobileSlots.set(id, entry);

  let observer: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        const hit = entries[0];
        entry.inViewport = Boolean(hit && hit.isIntersecting);
        recomputeMobileVisibleWinner();
      },
      { threshold: 0.01 }
    );
    observer.observe(el);
  }

  let rafId = 0;
  const scheduleRecompute = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      recomputeMobileVisibleWinner();
    });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', scheduleRecompute, { passive: true });
    window.addEventListener('scroll', scheduleRecompute, { passive: true });
  }

  return () => {
    if (observer) observer.disconnect();
    if (rafId && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rafId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', scheduleRecompute);
      window.removeEventListener('scroll', scheduleRecompute);
    }
    mobileSlots.delete(id);
    recomputeMobileVisibleWinner();
  };
}

// =============================================================================
// ADMIN API HELPERS (Authenticated — server enforces requireAdmin)
// =============================================================================

async function adminAdsFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getBearerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const resp = await fetch(path, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.ok === false) {
    throw new Error(data?.error || 'Something went wrong. Please try again.');
  }
  return data as T;
}

export async function fetchAdminAdsConfig(): Promise<AdsConfigDoc> {
  const res = await adminAdsFetch<{ ok: true; config: AdsConfigDoc }>('/api/admin/ads/config', {
    method: 'GET',
  });
  const normalized = normalizeAdsConfig(res.config);
  invalidateAdsConfigCache(normalized);
  return normalized;
}

export async function saveAdminAdsConfig(config: AdsConfigDoc): Promise<AdsConfigDoc> {
  const res = await adminAdsFetch<{ ok: true; config: AdsConfigDoc }>('/api/admin/ads/config', {
    method: 'PUT',
    body: JSON.stringify({ config }),
  });
  const normalized = normalizeAdsConfig(res.config);
  invalidateAdsConfigCache(normalized);
  return normalized;
}

export async function resetAdminAdsConfig(): Promise<AdsConfigDoc> {
  const res = await adminAdsFetch<{ ok: true; config: AdsConfigDoc }>('/api/admin/ads/reset', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const normalized = normalizeAdsConfig(res.config);
  invalidateAdsConfigCache(normalized);
  return normalized;
}

export interface AdminAdsStatsResponse {
  ok: true;
  days: number;
  startDate: string;
  endDate: string;
  totals: { impressions: number; clicks: number };
  byOffer: Array<{ offerId: string; impressions: number; clicks: number }>;
  bySlot: Array<{ slotId: string; impressions: number; clicks: number }>;
  daily: AdDailyStatRow[];
}

export async function fetchAdminAdsStats(days: 7 | 30 = 7): Promise<AdminAdsStatsResponse> {
  return adminAdsFetch<AdminAdsStatsResponse>(`/api/admin/ads/stats?days=${days}`, {
    method: 'GET',
  });
}
