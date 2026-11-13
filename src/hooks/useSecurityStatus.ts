import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  DEFAULT_PROFILE_LAYOUT,
  normalizeProfileLayout,
  type ProfileLayoutId,
} from '@/lib/profileLayouts';

export type SecurityRowLabel = '2FA: Both' | 'Authenticator' | 'Email code' | 'Off';

export interface SecurityStatusData {
  uid: string;
  totpEnabled: boolean;
  emailCodeEnabled: boolean;
  email2faEnabled: boolean;
  twoFactorEnabled: boolean;
  backupCodesRemaining: number;
  remainingBackupCodes: number;
  rememberedDevices: number;
  trustedDevicesCount: number;
  lastChangedAt: number | null;
  recoveryPending: boolean;
  recoveryDisableAt: number | null;
  emailVerified: boolean | null;
  rowLabel: SecurityRowLabel;
}

export interface SecurityStatusSnapshot extends SecurityStatusData {
  known: boolean;
  loading: boolean;
}

export interface UseSecurityStatusResult extends SecurityStatusSnapshot {
  refresh: () => Promise<void>;
  updateStatus: (partial: Partial<SecurityStatusInput>) => void;
}

export interface SecurityStatusInput {
  totpEnabled?: boolean;
  emailCodeEnabled?: boolean;
  email2faEnabled?: boolean;
  twoFactorEnabled?: boolean;
  backupCodesRemaining?: number;
  remainingBackupCodes?: number;
  rememberedDevices?: number;
  trustedDevicesCount?: number;
  lastChangedAt?: number | null;
  updatedAt?: number | null;
  recoveryPending?: boolean;
  recoveryDisableAt?: number | null;
  emailVerified?: boolean | null;
}

const SECURITY_LS_PREFIX = 'boardly_security_status_v1_';
const LAYOUT_LS_PREFIX = 'boardly_profile_layout_v1_';
const PLAN_LS_PREFIX = 'boardly_settings_plan_v1_';
const NOTIF_LS_PREFIX = 'boardly_notif_prefs_v1_';

export function computeSecurityRowLabel(
  totpEnabled: boolean,
  emailCodeEnabled: boolean
): SecurityRowLabel {
  if (totpEnabled && emailCodeEnabled) return '2FA: Both';
  if (totpEnabled) return 'Authenticator';
  if (emailCodeEnabled) return 'Email code';
  return 'Off';
}

function createUnknownSecuritySnapshot(uid: string): SecurityStatusSnapshot {
  return {
    uid,
    totpEnabled: false,
    emailCodeEnabled: false,
    email2faEnabled: false,
    twoFactorEnabled: false,
    backupCodesRemaining: 0,
    remainingBackupCodes: 0,
    rememberedDevices: 0,
    trustedDevicesCount: 0,
    lastChangedAt: null,
    recoveryPending: false,
    recoveryDisableAt: null,
    emailVerified: null,
    rowLabel: 'Off',
    known: false,
    loading: Boolean(uid),
  };
}

function normalizeSecurityStatusData(
  uid: string,
  raw: SecurityStatusInput,
  fallback?: SecurityStatusData | null
): SecurityStatusData {
  const totpEnabled =
    typeof raw.totpEnabled === 'boolean'
      ? raw.totpEnabled
      : Boolean(fallback?.totpEnabled);
  const emailCodeEnabled =
    typeof raw.emailCodeEnabled === 'boolean'
      ? raw.emailCodeEnabled
      : typeof raw.email2faEnabled === 'boolean'
      ? raw.email2faEnabled
      : Boolean(fallback?.emailCodeEnabled);
  const twoFactorEnabled = Boolean(totpEnabled || emailCodeEnabled);

  const backupRaw =
    typeof raw.backupCodesRemaining === 'number'
      ? raw.backupCodesRemaining
      : typeof raw.remainingBackupCodes === 'number'
      ? raw.remainingBackupCodes
      : fallback?.backupCodesRemaining ?? 0;
  const backupCodesRemaining = Math.max(0, Number(backupRaw || 0));

  const devicesRaw =
    typeof raw.rememberedDevices === 'number'
      ? raw.rememberedDevices
      : typeof raw.trustedDevicesCount === 'number'
      ? raw.trustedDevicesCount
      : fallback?.rememberedDevices ?? 0;
  const rememberedDevices = Math.max(0, Number(devicesRaw || 0));

  const lastChangedRaw =
    raw.lastChangedAt !== undefined
      ? raw.lastChangedAt
      : raw.updatedAt !== undefined
      ? raw.updatedAt
      : fallback?.lastChangedAt ?? null;
  const lastChangedAt =
    typeof lastChangedRaw === 'number' && Number.isFinite(lastChangedRaw) && lastChangedRaw > 0
      ? lastChangedRaw
      : null;

  const recoveryPending =
    typeof raw.recoveryPending === 'boolean'
      ? raw.recoveryPending
      : Boolean(fallback?.recoveryPending);
  const recoveryDisableAt =
    raw.recoveryDisableAt !== undefined
      ? raw.recoveryDisableAt
      : fallback?.recoveryDisableAt ?? null;

  const emailVerified =
    typeof raw.emailVerified === 'boolean'
      ? raw.emailVerified
      : fallback?.emailVerified ?? null;

  return {
    uid,
    totpEnabled,
    emailCodeEnabled,
    email2faEnabled: emailCodeEnabled,
    twoFactorEnabled,
    backupCodesRemaining,
    remainingBackupCodes: backupCodesRemaining,
    rememberedDevices,
    trustedDevicesCount: rememberedDevices,
    lastChangedAt,
    recoveryPending,
    recoveryDisableAt,
    emailVerified,
    rowLabel: computeSecurityRowLabel(totpEnabled, emailCodeEnabled),
  };
}

// ── Shared In-Memory Store & Listeners for Security Status ──────────────────
const securityMemoryStore = new Map<string, SecurityStatusSnapshot>();
const inFlightSecurityFetch = new Map<string, Promise<void>>();
const securityListeners = new Set<() => void>();

function emitSecurityChange() {
  for (const listener of securityListeners) {
    try {
      listener();
    } catch {
      // Ignore subscriber error
    }
  }
}

function subscribeSecurityStore(listener: () => void): () => void {
  securityListeners.add(listener);
  return () => {
    securityListeners.delete(listener);
  };
}

function readSecurityFromLocalStorage(uid: string): SecurityStatusData | null {
  if (!uid || typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(`${SECURITY_LS_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SecurityStatusData> | null;
    if (!parsed || typeof parsed !== 'object' || parsed.uid !== uid) return null;
    return normalizeSecurityStatusData(uid, parsed, null);
  } catch {
    return null;
  }
}

function writeSecurityToLocalStorage(uid: string, data: SecurityStatusData): void {
  if (!uid || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${SECURITY_LS_PREFIX}${uid}`, JSON.stringify(data));
  } catch {
    // Ignore storage error
  }
}

export function getSecuritySnapshotForUid(uid: string, isGuest = false): SecurityStatusSnapshot {
  const cleanUid = (uid || '').trim();
  if (!cleanUid) {
    const emptyKey = '__anonymous__';
    let anon = securityMemoryStore.get(emptyKey);
    if (!anon) {
      anon = createUnknownSecuritySnapshot('');
      securityMemoryStore.set(emptyKey, anon);
    }
    return anon;
  }

  if (isGuest || cleanUid.startsWith('guest_')) {
    const existingGuest = securityMemoryStore.get(cleanUid);
    if (existingGuest && existingGuest.known) return existingGuest;
    const guestSnap: SecurityStatusSnapshot = {
      ...normalizeSecurityStatusData(cleanUid, {
        totpEnabled: false,
        emailCodeEnabled: false,
        backupCodesRemaining: 0,
        rememberedDevices: 0,
        emailVerified: false,
      }),
      known: true,
      loading: false,
    };
    securityMemoryStore.set(cleanUid, guestSnap);
    return guestSnap;
  }

  const inMem = securityMemoryStore.get(cleanUid);
  if (inMem) {
    return inMem;
  }

  const fromLs = readSecurityFromLocalStorage(cleanUid);
  if (fromLs) {
    const hydrated: SecurityStatusSnapshot = {
      ...fromLs,
      known: true,
      loading: false,
    };
    securityMemoryStore.set(cleanUid, hydrated);
    return hydrated;
  }

  const unknown = createUnknownSecuritySnapshot(cleanUid);
  securityMemoryStore.set(cleanUid, unknown);
  return unknown;
}

/**
 * Seeds or updates the shared security status store for `uid` immediately
 * (used by session bootstrap in AuthContext, 2FA mutations in SecuritySettingsSection, etc.).
 */
export function seedSecurityStatusFromServer(
  uid: string,
  payload: SecurityStatusInput | null | undefined
): void {
  const cleanUid = (uid || '').trim();
  if (!cleanUid || !payload || typeof payload !== 'object') return;

  const hasAny2faField =
    typeof payload.totpEnabled === 'boolean' ||
    typeof payload.emailCodeEnabled === 'boolean' ||
    typeof payload.email2faEnabled === 'boolean' ||
    typeof payload.twoFactorEnabled === 'boolean';

  const current = getSecuritySnapshotForUid(cleanUid, false);
  const nextData = normalizeSecurityStatusData(cleanUid, payload, current.known ? current : null);
  const nextKnown = current.known || hasAny2faField;

  const nextSnap: SecurityStatusSnapshot = {
    ...nextData,
    known: nextKnown,
    loading: false,
  };

  securityMemoryStore.set(cleanUid, nextSnap);
  if (nextKnown) {
    writeSecurityToLocalStorage(cleanUid, nextData);
  }
  emitSecurityChange();
}

export async function refreshSecurityStatusForUid(uid: string): Promise<void> {
  const cleanUid = (uid || '').trim();
  if (!cleanUid || cleanUid.startsWith('guest_')) return;

  const existingPromise = inFlightSecurityFetch.get(cleanUid);
  if (existingPromise) {
    return existingPromise;
  }

  const prev = getSecuritySnapshotForUid(cleanUid, false);
  if (!prev.loading) {
    securityMemoryStore.set(cleanUid, { ...prev, loading: true });
    emitSecurityChange();
  }

  const fetchPromise = (async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== cleanUid) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/auth/2fa/status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        seedSecurityStatusFromServer(cleanUid, {
          totpEnabled: Boolean(data.totpEnabled),
          emailCodeEnabled: Boolean(data.emailCodeEnabled ?? data.email2faEnabled),
          email2faEnabled: Boolean(data.email2faEnabled ?? data.emailCodeEnabled),
          twoFactorEnabled: Boolean(
            data.twoFactorEnabled ?? (data.totpEnabled || data.email2faEnabled || data.emailCodeEnabled)
          ),
          backupCodesRemaining: Number(
            data.backupCodesRemaining ?? data.remainingBackupCodes ?? 0
          ),
          trustedDevicesCount: Number(
            data.rememberedDevices ?? data.trustedDevicesCount ?? 0
          ),
          lastChangedAt: data.lastChangedAt ?? data.updatedAt ?? null,
          recoveryPending: Boolean(data.recoveryPending),
          recoveryDisableAt: data.recoveryDisableAt ?? null,
        });
        return;
      }
    } catch {
      // Keep cached status if network fails
    }

    const cur = securityMemoryStore.get(cleanUid);
    if (cur && cur.loading) {
      securityMemoryStore.set(cleanUid, { ...cur, loading: false });
      emitSecurityChange();
    }
  })().finally(() => {
    inFlightSecurityFetch.delete(cleanUid);
  });

  inFlightSecurityFetch.set(cleanUid, fetchPromise);
  return fetchPromise;
}

// ── Shared Profile Layout & Settings Row Store (Keyed by UID) ───────────────
export interface ProfileLayoutSnapshot {
  uid: string;
  layout: ProfileLayoutId;
  known: boolean;
  ready: boolean;
  loading: boolean;
  savedAt?: number;
}

const layoutMemoryStore = new Map<string, ProfileLayoutSnapshot>();
const inFlightLayoutFetch = new Map<string, Promise<void>>();
const layoutListeners = new Set<() => void>();

function emitLayoutChange() {
  for (const listener of layoutListeners) {
    try {
      listener();
    } catch {
      // Ignore
    }
  }
}

function subscribeLayoutStore(listener: () => void): () => void {
  layoutListeners.add(listener);
  return () => {
    layoutListeners.delete(listener);
  };
}

function readLayoutFromLocalStorage(uid: string): { layout: ProfileLayoutId; savedAt?: number } | null {
  if (!uid || typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(`${LAYOUT_LS_PREFIX}${uid}`);
    if (!raw) return null;
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.layout === 'string') {
        return {
          layout: normalizeProfileLayout(parsed.layout),
          savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : undefined,
        };
      }
    }
    return { layout: normalizeProfileLayout(raw) };
  } catch {
    return null;
  }
}

function writeLayoutToLocalStorage(uid: string, layout: ProfileLayoutId, savedAt?: number): void {
  if (!uid || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      `${LAYOUT_LS_PREFIX}${uid}`,
      JSON.stringify({ layout, savedAt: savedAt ?? Date.now() })
    );
    // Also keep cached_profile_${uid} and boardly_user_profile_${uid} synchronized so no stale cache reverts the layout
    for (const lsKey of [`cached_profile_${uid}`, `boardly_user_profile_${uid}`]) {
      const rawProf = window.localStorage.getItem(lsKey);
      if (rawProf) {
        const parsed = JSON.parse(rawProf);
        parsed.profileLayout = layout;
        parsed.profile_layout = layout;
        window.localStorage.setItem(lsKey, JSON.stringify(parsed));
      }
    }
  } catch {
    // Ignore
  }
}

export function getProfileLayoutSnapshotForUid(uid: string): ProfileLayoutSnapshot {
  const cleanUid = (uid || '').trim();
  if (!cleanUid) {
    const anonKey = '__anonymous__';
    let anon = layoutMemoryStore.get(anonKey);
    if (!anon) {
      anon = { uid: '', layout: DEFAULT_PROFILE_LAYOUT, known: false, ready: false, loading: false };
      layoutMemoryStore.set(anonKey, anon);
    }
    return anon;
  }

  const inMem = layoutMemoryStore.get(cleanUid);
  if (inMem) return inMem;

  const fromLs = readLayoutFromLocalStorage(cleanUid);
  if (fromLs) {
    const snap: ProfileLayoutSnapshot = {
      uid: cleanUid,
      layout: fromLs.layout,
      known: true,
      ready: true,
      loading: false,
      savedAt: fromLs.savedAt,
    };
    layoutMemoryStore.set(cleanUid, snap);
    return snap;
  }

  const unknown: ProfileLayoutSnapshot = {
    uid: cleanUid,
    layout: DEFAULT_PROFILE_LAYOUT,
    known: false,
    ready: false,
    loading: true,
  };
  layoutMemoryStore.set(cleanUid, unknown);
  return unknown;
}

/**
 * Authoritatively commits a user-saved profile layout (optimistically on tap + confirmed after POST)
 * so stale background fetches or AuthContext snapshots can never overwrite it.
 */
export function commitSavedProfileLayout(uid: string, rawLayout: unknown): void {
  const cleanUid = (uid || '').trim();
  if (!cleanUid || typeof rawLayout !== 'string' || !rawLayout.trim()) return;
  const resolved = normalizeProfileLayout(rawLayout);
  const now = Date.now();
  const nextSnap: ProfileLayoutSnapshot = {
    uid: cleanUid,
    layout: resolved,
    known: true,
    ready: true,
    loading: false,
    savedAt: now,
  };
  layoutMemoryStore.set(cleanUid, nextSnap);
  writeLayoutToLocalStorage(cleanUid, resolved, now);
  emitLayoutChange();
}

export function seedProfileLayoutFromServer(
  uid: string,
  rawLayout: unknown,
  options?: { isAuthoritativeSave?: boolean; isPassiveSeed?: boolean }
): void {
  const cleanUid = (uid || '').trim();
  if (!cleanUid || typeof rawLayout !== 'string' || !rawLayout.trim()) return;
  if (options?.isAuthoritativeSave) {
    commitSavedProfileLayout(cleanUid, rawLayout);
    return;
  }

  const resolved = normalizeProfileLayout(rawLayout);
  const existing = layoutMemoryStore.get(cleanUid) || readLayoutFromLocalStorage(cleanUid);

  // Never let a passive seed (e.g. from AuthContext.profile) overwrite an already-known layout
  if (options?.isPassiveSeed && existing && 'layout' in existing) {
    const existingMem = layoutMemoryStore.get(cleanUid);
    if (existingMem?.known) {
      return;
    }
  }

  // Never let a late background response overwrite a layout that the user explicitly saved in the last 60s
  if (existing?.savedAt && Date.now() - existing.savedAt < 60_000 && existing.layout !== resolved) {
    return;
  }

  const nextSnap: ProfileLayoutSnapshot = {
    uid: cleanUid,
    layout: resolved,
    known: true,
    ready: true,
    loading: false,
    savedAt: existing?.savedAt,
  };
  layoutMemoryStore.set(cleanUid, nextSnap);
  writeLayoutToLocalStorage(cleanUid, resolved, existing?.savedAt);
  emitLayoutChange();
}

export async function refreshProfileLayoutForUid(uid: string): Promise<void> {
  const cleanUid = (uid || '').trim();
  if (!cleanUid) return;

  const existing = inFlightLayoutFetch.get(cleanUid);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/auth/profile-layout?uid=${encodeURIComponent(cleanUid)}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.ok && (json.profile_layout || json.layout)) {
          seedProfileLayoutFromServer(cleanUid, json.profile_layout ?? json.layout);
          return;
        }
      }
    } catch {
      // Ignore network error
    }
    const cur = layoutMemoryStore.get(cleanUid);
    if (cur && !cur.known) {
      layoutMemoryStore.set(cleanUid, {
        ...cur,
        known: true,
        ready: true,
        loading: false,
      });
      emitLayoutChange();
    }
  })().finally(() => {
    inFlightLayoutFetch.delete(cleanUid);
  });

  inFlightLayoutFetch.set(cleanUid, promise);
  return promise;
}

// ── Per-UID Plan & Notification Preferences Cache Helpers ───────────────────
export function readCachedPlanLabelForUid(uid: string): string | null {
  if (!uid || typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(`${PLAN_LS_PREFIX}${uid}`) || null;
  } catch {
    return null;
  }
}

export function writeCachedPlanLabelForUid(uid: string, label: string): void {
  if (!uid || !label || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${PLAN_LS_PREFIX}${uid}`, label);
  } catch {
    // Ignore
  }
}

export interface CachedNotificationPrefs {
  emailKobanReceipts: boolean;
  emailArenaStarts: boolean;
}

export function readCachedNotificationPrefsForUid(uid: string): CachedNotificationPrefs | null {
  if (!uid || typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(`${NOTIF_LS_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.emailKobanReceipts === 'boolean' &&
      typeof parsed.emailArenaStarts === 'boolean'
    ) {
      return {
        emailKobanReceipts: parsed.emailKobanReceipts,
        emailArenaStarts: parsed.emailArenaStarts,
      };
    }
  } catch {
    // Ignore
  }
  return null;
}

export function writeCachedNotificationPrefsForUid(
  uid: string,
  prefs: CachedNotificationPrefs
): void {
  if (!uid || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${NOTIF_LS_PREFIX}${uid}`, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

/**
 * Early bootstrap helper called right after login and on app start.
 */
export function preloadSecurityAndSettingsForUid(uid: string, isGuest = false): void {
  const cleanUid = (uid || '').trim();
  if (!cleanUid) return;
  getSecuritySnapshotForUid(cleanUid, isGuest);
  getProfileLayoutSnapshotForUid(cleanUid);
  if (!isGuest && !cleanUid.startsWith('guest_')) {
    void refreshSecurityStatusForUid(cleanUid);
  }
  void refreshProfileLayoutForUid(cleanUid);
}

/**
 * Clears all in-memory and per-UID localStorage caches on sign-out so no user's
 * security status or settings row values ever leak across sessions.
 */
export function clearSecurityStatusCache(uid?: string | null): void {
  if (uid) {
    securityMemoryStore.delete(uid);
    layoutMemoryStore.delete(uid);
  } else {
    securityMemoryStore.clear();
    layoutMemoryStore.clear();
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (uid) {
          if (
            k === `${SECURITY_LS_PREFIX}${uid}` ||
            k === `${LAYOUT_LS_PREFIX}${uid}` ||
            k === `${PLAN_LS_PREFIX}${uid}` ||
            k === `${NOTIF_LS_PREFIX}${uid}`
          ) {
            keysToRemove.push(k);
          }
        } else if (
          k.startsWith(SECURITY_LS_PREFIX) ||
          k.startsWith(LAYOUT_LS_PREFIX) ||
          k.startsWith(PLAN_LS_PREFIX) ||
          k.startsWith(NOTIF_LS_PREFIX)
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore storage error
    }
  }

  emitSecurityChange();
  emitLayoutChange();
}

/**
 * Shared React hook for reading and updating the signed-in user's 2-step verification status.
 * Used by the Settings list row, the Security sub-page, and Universal Search.
 */
export function useSecurityStatus(): UseSecurityStatusResult {
  const { user, profile, isGuest } = useAuth();
  const uid = (user?.uid || profile?.uid || '').trim();

  const getSnapshot = useCallback(
    () => getSecuritySnapshotForUid(uid, isGuest),
    [uid, isGuest]
  );

  const snapshot = useSyncExternalStore(
    subscribeSecurityStore,
    getSnapshot,
    getSnapshot
  );

  useEffect(() => {
    if (!uid || isGuest || uid.startsWith('guest_')) return;
    void refreshSecurityStatusForUid(uid);
  }, [uid, isGuest]);

  const refresh = useCallback(async () => {
    if (!uid || isGuest || uid.startsWith('guest_')) return;
    await refreshSecurityStatusForUid(uid);
  }, [uid, isGuest]);

  const updateStatus = useCallback(
    (partial: Partial<SecurityStatusInput>) => {
      if (!uid) return;
      seedSecurityStatusFromServer(uid, partial);
    },
    [uid]
  );

  return {
    ...snapshot,
    refresh,
    updateStatus,
  };
}

/**
 * Shared React hook for reading and updating the signed-in user's profile layout.
 */
export function useProfileLayoutStatus(): {
  layout: ProfileLayoutId;
  known: boolean;
  ready: boolean;
  loading: boolean;
  setLayout: (next: ProfileLayoutId) => void;
  refresh: () => Promise<void>;
} {
  const { user, profile } = useAuth();
  const uid = (user?.uid || profile?.uid || '').trim();

  const getSnapshot = useCallback(
    () => getProfileLayoutSnapshotForUid(uid),
    [uid]
  );

  const snapshot = useSyncExternalStore(
    subscribeLayoutStore,
    getSnapshot,
    getSnapshot
  );

  useEffect(() => {
    if (!uid) return;
    if (profile?.profileLayout || profile?.profile_layout) {
      seedProfileLayoutFromServer(uid, profile.profileLayout ?? profile.profile_layout, {
        isPassiveSeed: true,
      });
    }
    void refreshProfileLayoutForUid(uid);
  }, [uid, profile?.profileLayout, profile?.profile_layout]);

  const setLayout = useCallback(
    (next: ProfileLayoutId) => {
      if (!uid) return;
      commitSavedProfileLayout(uid, next);
    },
    [uid]
  );

  const refresh = useCallback(async () => {
    if (!uid) return;
    await refreshProfileLayoutForUid(uid);
  }, [uid]);

  return {
    layout: snapshot.layout,
    known: snapshot.known,
    ready: snapshot.known,
    loading: snapshot.loading,
    setLayout,
    refresh,
  };
}
