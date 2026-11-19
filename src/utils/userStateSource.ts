/**
 * Single Source of Truth for:
 *  1. Equipped Cosmetic Loadout (`getEquippedLoadout`)
 *  2. Kobans Wallet Balance (`getKobans`)
 *  3. SWR cache helpers & request latency logger (`measureRequest`, `getSlowestRequests`)
 *
 * Pure TypeScript (safe in browser and Node unit tests).
 */

export interface EquippedLoadout {
  avatar: string | null;
  frame: string | null;
  banner: string | null;
  nameplate: string | null;
  effect: string | null;
  photoURL: string | null;
}

export interface LoadoutSourceInput {
  uid?: string | null;
  equipped?: {
    avatar?: string | null;
    frame?: string | null;
    banner?: string | null;
    nameplate?: string | null;
    effect?: string | null;
  } | null;
  equippedCosmetics?: {
    avatar?: string | null;
    frame?: string | null;
    avatarFrame?: string | null;
    banner?: string | null;
    profileBanner?: string | null;
    nameplate?: string | null;
    effect?: string | null;
    profileEffect?: string | null;
  } | null;
  equippedAvatar?: string | null;
  equippedFrame?: string | null;
  equippedBanner?: string | null;
  equippedNameplate?: string | null;
  equippedEffect?: string | null;
  avatar?: string | null;
  frame?: string | null;
  banner?: string | null;
  nameplate?: string | null;
  effect?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
}

export interface KobanWalletSnapshot {
  balance: number | null;
  loaded: boolean;
  updatedAt: number | null;
}

export interface KobanSourceInput {
  uid?: string | null;
  balance?: number | null;
  kobans?: number | null;
  walletBalance?: number | null;
  loaded?: boolean;
}

export interface RequestTimingEntry {
  label: string;
  durationMs: number;
  status: 'ok' | 'error' | 'timeout';
  recordedAt: number;
}

const LOADOUT_LS_PREFIX = 'boardly_equipped_loadout_v1:';
const KOBANS_LS_PREFIX = 'boardly_kobans_balance_v1:';
const SWR_LS_PREFIX = 'boardly_swr_cache_v1:';

const loadoutMemoryCache = new Map<string, EquippedLoadout>();
const loadoutListeners = new Map<string, Set<(loadout: EquippedLoadout) => void>>();

const kobansMemoryCache = new Map<string, KobanWalletSnapshot>();
const kobansListeners = new Map<string, Set<(snapshot: KobanWalletSnapshot) => void>>();

const swrMemoryCache = new Map<string, { data: unknown; savedAt: number }>();

const timingEntries: RequestTimingEntry[] = [];
const MAX_TIMING_ENTRIES = 200;

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function cleanStr(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

export const EMPTY_LOADOUT: EquippedLoadout = Object.freeze({
  avatar: null,
  frame: null,
  banner: null,
  nameplate: null,
  effect: null,
  photoURL: null,
});

function readLoadoutFromStorage(uid: string): EquippedLoadout | null {
  if (!uid || !hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(`${LOADOUT_LS_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EquippedLoadout> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      avatar: cleanStr(parsed.avatar),
      frame: cleanStr(parsed.frame),
      banner: cleanStr(parsed.banner),
      nameplate: cleanStr(parsed.nameplate),
      effect: cleanStr(parsed.effect),
      photoURL: cleanStr(parsed.photoURL),
    };
  } catch {
    return null;
  }
}

function readKobansFromStorage(uid: string): KobanWalletSnapshot | null {
  if (!uid || !hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(`${KOBANS_LS_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { balance?: unknown; updatedAt?: unknown } | null;
    if (!parsed || typeof parsed.balance !== 'number' || !Number.isFinite(parsed.balance)) {
      return null;
    }
    return {
      balance: Math.max(0, Math.floor(parsed.balance)),
      loaded: true,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Single cached loadout source.
 * Resolves equipped cosmetics consistently across Profile, Locker preview,
 * Account avatar, dashboard header avatar, and Switch account sheet.
 * Never invents or defaults to an arbitrary first catalog item.
 */
export function getEquippedLoadout(
  user: string | LoadoutSourceInput | null | undefined
): EquippedLoadout {
  if (!user) return { ...EMPTY_LOADOUT };

  const uid = typeof user === 'string' ? cleanStr(user) : cleanStr(user.uid);
  const input: LoadoutSourceInput = typeof user === 'string' ? { uid } : user;

  let cached: EquippedLoadout | null = null;
  if (uid) {
    cached = loadoutMemoryCache.get(uid) ?? readLoadoutFromStorage(uid);
    if (cached && !loadoutMemoryCache.has(uid)) {
      loadoutMemoryCache.set(uid, cached);
    }
  }

  const eq = input.equipped;
  const eqCos = input.equippedCosmetics;

  const explicitAvatar =
    cleanStr(eq?.avatar) ??
    cleanStr(eqCos?.avatar) ??
    cleanStr(input.equippedAvatar) ??
    cleanStr(input.avatar);

  const explicitFrame =
    cleanStr(eq?.frame) ??
    cleanStr(eqCos?.frame) ??
    cleanStr(eqCos?.avatarFrame) ??
    cleanStr(input.equippedFrame) ??
    cleanStr(input.frame);

  const explicitBanner =
    cleanStr(eq?.banner) ??
    cleanStr(eqCos?.banner) ??
    cleanStr(eqCos?.profileBanner) ??
    cleanStr(input.equippedBanner) ??
    cleanStr(input.banner);

  const explicitNameplate =
    cleanStr(eq?.nameplate) ??
    cleanStr(eqCos?.nameplate) ??
    cleanStr(input.equippedNameplate) ??
    cleanStr(input.nameplate);

  const explicitEffect =
    cleanStr(eq?.effect) ??
    cleanStr(eqCos?.effect) ??
    cleanStr(eqCos?.profileEffect) ??
    cleanStr(input.equippedEffect) ??
    cleanStr(input.effect);

  const explicitPhotoURL = cleanStr(input.photoURL) ?? cleanStr(input.avatarUrl);

  // If canonical cached wallet loadout exists for this uid, prefer its slot values
  // (including explicit `null` when user unequipped a slot) unless caller passed an
  // authoritative `equipped` object directly.
  if (cached && !eq) {
    return {
      avatar: cached.avatar ?? explicitAvatar ?? null,
      frame: cached.frame ?? explicitFrame ?? null,
      banner: cached.banner ?? explicitBanner ?? null,
      nameplate: cached.nameplate ?? explicitNameplate ?? null,
      effect: cached.effect ?? explicitEffect ?? null,
      photoURL: cached.photoURL ?? explicitPhotoURL ?? null,
    };
  }

  return {
    avatar: explicitAvatar ?? cached?.avatar ?? null,
    frame: explicitFrame ?? cached?.frame ?? null,
    banner: explicitBanner ?? cached?.banner ?? null,
    nameplate: explicitNameplate ?? cached?.nameplate ?? null,
    effect: explicitEffect ?? cached?.effect ?? null,
    photoURL: explicitPhotoURL ?? cached?.photoURL ?? null,
  };
}

export function setCachedEquippedLoadout(
  uid: string | null | undefined,
  loadout: Partial<EquippedLoadout>,
  options: { merge?: boolean } = {}
): EquippedLoadout {
  const cleanUid = cleanStr(uid);
  const existing = cleanUid
    ? loadoutMemoryCache.get(cleanUid) ?? readLoadoutFromStorage(cleanUid) ?? EMPTY_LOADOUT
    : EMPTY_LOADOUT;

  const merge = options.merge !== false;
  const next: EquippedLoadout = {
    avatar:
      loadout.avatar !== undefined
        ? cleanStr(loadout.avatar)
        : merge
        ? existing.avatar
        : null,
    frame:
      loadout.frame !== undefined
        ? cleanStr(loadout.frame)
        : merge
        ? existing.frame
        : null,
    banner:
      loadout.banner !== undefined
        ? cleanStr(loadout.banner)
        : merge
        ? existing.banner
        : null,
    nameplate:
      loadout.nameplate !== undefined
        ? cleanStr(loadout.nameplate)
        : merge
        ? existing.nameplate
        : null,
    effect:
      loadout.effect !== undefined
        ? cleanStr(loadout.effect)
        : merge
        ? existing.effect
        : null,
    photoURL:
      loadout.photoURL !== undefined
        ? cleanStr(loadout.photoURL)
        : merge
        ? existing.photoURL
        : null,
  };

  if (!cleanUid) return next;

  loadoutMemoryCache.set(cleanUid, next);
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(`${LOADOUT_LS_PREFIX}${cleanUid}`, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }

  const subs = loadoutListeners.get(cleanUid);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(next);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  return next;
}

export function subscribeEquippedLoadout(
  uid: string | null | undefined,
  callback: (loadout: EquippedLoadout) => void
): () => void {
  const cleanUid = cleanStr(uid);
  if (!cleanUid) return () => {};
  let set = loadoutListeners.get(cleanUid);
  if (!set) {
    set = new Set();
    loadoutListeners.set(cleanUid, set);
  }
  set.add(callback);
  return () => {
    set?.delete(callback);
    if (set && set.size === 0) {
      loadoutListeners.delete(cleanUid);
    }
  };
}

export function clearCachedEquippedLoadout(uid?: string | null): void {
  if (uid) {
    loadoutMemoryCache.delete(uid);
    if (hasLocalStorage()) {
      try {
        window.localStorage.removeItem(`${LOADOUT_LS_PREFIX}${uid}`);
      } catch {
        // Ignore
      }
    }
    return;
  }
  loadoutMemoryCache.clear();
  if (hasLocalStorage()) {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(LOADOUT_LS_PREFIX)) toRemove.push(k);
      }
      toRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }
}

/**
 * Single cached Kobans wallet source.
 * Never returns `0` as a loading placeholder: returns `{ balance: null, loaded: false }`
 * until an authoritative balance is cached or received.
 */
export function getKobans(
  user: string | KobanSourceInput | null | undefined
): KobanWalletSnapshot {
  if (!user) {
    return { balance: null, loaded: false, updatedAt: null };
  }

  const uid = typeof user === 'string' ? cleanStr(user) : cleanStr(user.uid);
  if (uid) {
    const cached = kobansMemoryCache.get(uid) ?? readKobansFromStorage(uid);
    if (cached && cached.loaded && cached.balance !== null) {
      if (!kobansMemoryCache.has(uid)) {
        kobansMemoryCache.set(uid, cached);
      }
      return cached;
    }
  }

  if (typeof user !== 'string') {
    const candidate =
      typeof user.balance === 'number' && Number.isFinite(user.balance)
        ? user.balance
        : typeof user.walletBalance === 'number' && Number.isFinite(user.walletBalance)
        ? user.walletBalance
        : typeof user.kobans === 'number' && Number.isFinite(user.kobans)
        ? user.kobans
        : null;

    if (candidate !== null && user.loaded !== false) {
      return {
        balance: Math.max(0, Math.floor(candidate)),
        loaded: true,
        updatedAt: Date.now(),
      };
    }
  }

  return { balance: null, loaded: false, updatedAt: null };
}

export function setCachedKobans(
  uid: string | null | undefined,
  balance: number
): KobanWalletSnapshot {
  const safeBalance = Math.max(0, Math.floor(Number(balance) || 0));
  const snapshot: KobanWalletSnapshot = {
    balance: safeBalance,
    loaded: true,
    updatedAt: Date.now(),
  };

  const cleanUid = cleanStr(uid);
  if (!cleanUid) return snapshot;

  kobansMemoryCache.set(cleanUid, snapshot);
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(
        `${KOBANS_LS_PREFIX}${cleanUid}`,
        JSON.stringify({ balance: safeBalance, updatedAt: snapshot.updatedAt })
      );
    } catch {
      // Ignore storage errors
    }
  }

  const subs = kobansListeners.get(cleanUid);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(snapshot);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  return snapshot;
}

export function subscribeKobans(
  uid: string | null | undefined,
  callback: (snapshot: KobanWalletSnapshot) => void
): () => void {
  const cleanUid = cleanStr(uid);
  if (!cleanUid) return () => {};
  let set = kobansListeners.get(cleanUid);
  if (!set) {
    set = new Set();
    kobansListeners.set(cleanUid, set);
  }
  set.add(callback);
  return () => {
    set?.delete(callback);
    if (set && set.size === 0) {
      kobansListeners.delete(cleanUid);
    }
  };
}

export function clearCachedKobans(uid?: string | null): void {
  if (uid) {
    kobansMemoryCache.delete(uid);
    if (hasLocalStorage()) {
      try {
        window.localStorage.removeItem(`${KOBANS_LS_PREFIX}${uid}`);
      } catch {
        // Ignore
      }
    }
    return;
  }
  kobansMemoryCache.clear();
  if (hasLocalStorage()) {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(KOBANS_LS_PREFIX)) toRemove.push(k);
      }
      toRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }
}

/**
 * Generic SWR cache for Security, Locker, Plans, and Account views.
 */
export function readSwrCache<T>(key: string, maxAgeMs = 15 * 60 * 1000): T | null {
  const mem = swrMemoryCache.get(key);
  if (mem) {
    if (Date.now() - mem.savedAt <= maxAgeMs) {
      return mem.data as T;
    }
  }
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(`${SWR_LS_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: T; savedAt?: number } | null;
    if (!parsed || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > maxAgeMs) return null;
    swrMemoryCache.set(key, { data: parsed.data, savedAt: parsed.savedAt });
    return (parsed.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export function writeSwrCache<T>(key: string, data: T): void {
  const savedAt = Date.now();
  swrMemoryCache.set(key, { data, savedAt });
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(`${SWR_LS_PREFIX}${key}`, JSON.stringify({ data, savedAt }));
  } catch {
    // Ignore quota errors
  }
}

export function clearSwrCache(prefix?: string): void {
  if (!prefix) {
    swrMemoryCache.clear();
  } else {
    for (const k of Array.from(swrMemoryCache.keys())) {
      if (k.startsWith(prefix)) swrMemoryCache.delete(k);
    }
  }
  if (!hasLocalStorage()) return;
  try {
    const matchPrefix = prefix ? `${SWR_LS_PREFIX}${prefix}` : SWR_LS_PREFIX;
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(matchPrefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

/**
 * Request latency tracker + 8-second timeout guard.
 */
export function recordRequestTiming(
  label: string,
  durationMs: number,
  status: 'ok' | 'error' | 'timeout' = 'ok'
): RequestTimingEntry {
  const entry: RequestTimingEntry = {
    label,
    durationMs: Math.max(0, Math.round(durationMs)),
    status,
    recordedAt: Date.now(),
  };
  timingEntries.push(entry);
  if (timingEntries.length > MAX_TIMING_ENTRIES) {
    timingEntries.splice(0, timingEntries.length - MAX_TIMING_ENTRIES);
  }

  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__BOARDLY_REQUEST_TIMINGS__ =
      getSlowestRequests(10);
  }

  if (entry.durationMs >= 200 || status !== 'ok') {
    // eslint-disable-next-line no-console
    console.info(`[Boardly Slow Request] ${label}: ${entry.durationMs}ms (${status})`);
  }

  return entry;
}

export function getAllRequestTimings(): RequestTimingEntry[] {
  return [...timingEntries];
}

export function getSlowestRequests(limit = 3): RequestTimingEntry[] {
  const bestByLabel = new Map<string, RequestTimingEntry>();
  for (const entry of timingEntries) {
    const existing = bestByLabel.get(entry.label);
    if (!existing || entry.durationMs > existing.durationMs) {
      bestByLabel.set(entry.label, entry);
    }
  }
  return Array.from(bestByLabel.values())
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, Math.max(1, limit));
}

export function resetRequestTimings(): void {
  timingEntries.length = 0;
}

export async function measureRequest<T>(
  label: string,
  fn: () => Promise<T>,
  timeoutMs = 8000
): Promise<T> {
  const startedAt = nowMs();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s.`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    recordRequestTiming(label, nowMs() - startedAt, 'ok');
    return result;
  } catch (err) {
    recordRequestTiming(label, nowMs() - startedAt, timedOut ? 'timeout' : 'error');
    throw err;
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}
