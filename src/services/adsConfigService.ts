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
    const endpoints = ['/api/placements/config', '/api/ads/config'];
    for (const endpoint of endpoints) {
      try {
        const resp = await fetch(endpoint, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (!resp.ok) continue;
        const data = await resp.json();
        const raw = data?.config || data;
        if (!raw || typeof raw !== 'object') continue;
        const normalized = normalizeAdsConfig(raw);
        memoryConfig = normalized;
        memoryFetchedAt = Date.now();
        writeSessionCache(normalized, memoryFetchedAt);
        notifyListeners(normalized);
        return normalized;
      } catch {
        // Try next endpoint or fall back to built-in defaults
      }
    }
    const fallback = memoryConfig || DEFAULT_ADS_CONFIG;
    memoryConfig = fallback;
    memoryFetchedAt = Date.now();
    return fallback;
  })().finally(() => {
    inflightPromise = null;
  });

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
      if (navigator.sendBeacon('/api/placements/event', blob)) return;
    }
    fetch('/api/placements/event', {
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
  lastTop: number;
  lastBottom: number;
  lastHeight: number;
  lastAllowed: boolean | null;
  notify: (allowed: boolean) => void;
}

const mobileSlots = new Map<string, MobileSlotEntry>();
const elementToSlotId = new WeakMap<Element, string>();
let currentWinnerId: string | null = null;
let sharedIntersectionObserver: IntersectionObserver | null = null;
let sharedResizeAttached = false;
let sharedScrollAttached = false;
let sharedRafId = 0;

function notifyIfChanged(entry: MobileSlotEntry, allowed: boolean): void {
  if (entry.lastAllowed === allowed) return;
  entry.lastAllowed = allowed;
  entry.notify(allowed);
}

function updateSharedScrollListenerState(): void {
  if (typeof window === 'undefined') return;
  let visibleCount = 0;
  if (window.innerWidth < 768) {
    for (const entry of mobileSlots.values()) {
      if (entry.inViewport) {
        visibleCount++;
        if (visibleCount >= 2) break;
      }
    }
  }
  const needScroll = visibleCount >= 2;
  if (needScroll && !sharedScrollAttached) {
    sharedScrollAttached = true;
    window.addEventListener('scroll', scheduleSharedRecompute, { passive: true });
  } else if (!needScroll && sharedScrollAttached) {
    sharedScrollAttached = false;
    window.removeEventListener('scroll', scheduleSharedRecompute);
  }
}

function recomputeMobileVisibleWinner(measureLiveRects = false): void {
  if (typeof window === 'undefined') return;
  const isMobile = window.innerWidth < 768;

  if (!isMobile) {
    currentWinnerId = null;
    mobileSlots.forEach((entry) => notifyIfChanged(entry, true));
    updateSharedScrollListenerState();
    return;
  }

  let visibleCount = 0;
  for (const entry of mobileSlots.values()) {
    if (entry.inViewport) visibleCount++;
  }

  // Fast path: 0 or 1 slot in viewport — zero layout reads needed!
  if (visibleCount <= 1) {
    currentWinnerId = null;
    for (const entry of mobileSlots.values()) {
      if (entry.inViewport) currentWinnerId = entry.id;
      notifyIfChanged(entry, true);
    }
    updateSharedScrollListenerState();
    return;
  }

  // Among all slots currently intersecting the phone viewport, pick the top-most measurable one
  const vh = window.innerHeight;
  let winner: MobileSlotEntry | null = null;
  let winnerTop = Infinity;
  let fallbackInViewport: MobileSlotEntry | null = null;

  for (const entry of mobileSlots.values()) {
    if (!entry.inViewport) continue;
    if (!fallbackInViewport) fallbackInViewport = entry;
    if (measureLiveRects) {
      const rect = entry.el.getBoundingClientRect();
      entry.lastTop = rect.top;
      entry.lastBottom = rect.bottom;
      entry.lastHeight = rect.height;
    }
    if (entry.lastHeight > 0 && (entry.lastBottom <= 0 || entry.lastTop >= vh)) continue;
    if (entry.lastTop < winnerTop) {
      winnerTop = entry.lastTop;
      winner = entry;
    }
  }

  const chosenWinner = winner || fallbackInViewport;
  currentWinnerId = chosenWinner ? chosenWinner.id : null;

  // CRITICAL: Never hide a slot unless a DIFFERENT slot actually won the mobile viewport!
  for (const entry of mobileSlots.values()) {
    if (!entry.inViewport || !currentWinnerId) {
      notifyIfChanged(entry, true);
    } else {
      notifyIfChanged(entry, entry.id === currentWinnerId);
    }
  }
  updateSharedScrollListenerState();
}

function scheduleSharedRecompute(): void {
  if (typeof window === 'undefined' || sharedRafId) return;
  sharedRafId = window.requestAnimationFrame(() => {
    sharedRafId = 0;
    recomputeMobileVisibleWinner(true);
  });
}

function ensureSharedObserver(): IntersectionObserver | null {
  if (sharedIntersectionObserver || typeof IntersectionObserver === 'undefined') {
    return sharedIntersectionObserver;
  }
  sharedIntersectionObserver = new IntersectionObserver(
    (entries) => {
      for (let i = 0; i < entries.length; i++) {
        const hit = entries[i];
        const slotId = elementToSlotId.get(hit.target);
        if (!slotId) continue;
        const slotEntry = mobileSlots.get(slotId);
        if (!slotEntry) continue;
        slotEntry.inViewport = Boolean(hit.isIntersecting);
        slotEntry.lastTop = hit.boundingClientRect.top;
        slotEntry.lastBottom = hit.boundingClientRect.bottom;
        slotEntry.lastHeight = hit.boundingClientRect.height;
      }
      recomputeMobileVisibleWinner(false);
    },
    { threshold: 0.01 }
  );
  return sharedIntersectionObserver;
}

export function registerMobileAdSlot(
  id: string,
  el: HTMLElement,
  notify: (allowed: boolean) => void
): () => void {
  const entry: MobileSlotEntry = {
    id,
    el,
    inViewport: false,
    lastTop: Infinity,
    lastBottom: 0,
    lastHeight: 0,
    lastAllowed: null,
    notify,
  };
  mobileSlots.set(id, entry);
  elementToSlotId.set(el, id);

  const observer = ensureSharedObserver();
  observer?.observe(el);

  if (typeof window !== 'undefined' && !sharedResizeAttached) {
    sharedResizeAttached = true;
    window.addEventListener('resize', scheduleSharedRecompute, { passive: true });
  }

  return () => {
    sharedIntersectionObserver?.unobserve(el);
    elementToSlotId.delete(el);
    mobileSlots.delete(id);

    if (mobileSlots.size === 0) {
      if (sharedIntersectionObserver) {
        sharedIntersectionObserver.disconnect();
        sharedIntersectionObserver = null;
      }
      if (sharedRafId && typeof window !== 'undefined') {
        window.cancelAnimationFrame(sharedRafId);
        sharedRafId = 0;
      }
      if (typeof window !== 'undefined') {
        if (sharedResizeAttached) {
          sharedResizeAttached = false;
          window.removeEventListener('resize', scheduleSharedRecompute);
        }
        if (sharedScrollAttached) {
          sharedScrollAttached = false;
          window.removeEventListener('scroll', scheduleSharedRecompute);
        }
      }
      currentWinnerId = null;
    } else {
      recomputeMobileVisibleWinner(false);
    }
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
