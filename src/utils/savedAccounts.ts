/**
 * Saved Accounts & Add-Account Flow Helpers.
 *
 * Persists a lightweight list of recently used accounts in localStorage so
 * Settings -> Switch account keeps existing accounts (including admin accounts)
 * visible when adding or switching to another account.
 *
 * Pure TypeScript (safe in browser and Node tests).
 */

export interface SavedAccountEntry {
  uid: string;
  email: string;
  displayName: string;
  username?: string | null;
  role?: string | null;
  planLabel?: string | null;
  equippedAvatar?: string | null;
  equippedFrameId?: string | null;
  /** Public opaque session reference ID (raw switch token stays exclusively in HttpOnly server cookie). */
  sessionId?: string | null;
  sessionExpiresAt?: number | null;
  isGuest?: boolean;
  lastUsedAt: number;
}

export const SAVED_ACCOUNTS_STORAGE_KEY = 'boardly_saved_accounts_v1';
const MAX_SAVED_ACCOUNTS = 8;

function getSafeStorage(storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null) {
  if (storage) return storage;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore storage access failures
  }
  return null;
}

export function getSavedAccounts(
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
): SavedAccountEntry[] {
  const store = getSafeStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is SavedAccountEntry =>
          Boolean(entry && typeof entry === 'object' && typeof entry.uid === 'string' && entry.uid.trim())
      )
      .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  } catch {
    return [];
  }
}

export function upsertSavedAccount(
  account: Omit<SavedAccountEntry, 'lastUsedAt'> & { lastUsedAt?: number },
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
): SavedAccountEntry[] {
  const cleanUid = String(account.uid || '').trim();
  if (!cleanUid || cleanUid.startsWith('guest_') || account.isGuest) {
    return getSavedAccounts(storage);
  }
  const store = getSafeStorage(storage);
  const existing = getSavedAccounts(store);
  const prevMatch = existing.find((a) => a.uid === cleanUid);

  const normalized: SavedAccountEntry = {
    uid: cleanUid,
    email: String(account.email || prevMatch?.email || '').trim().toLowerCase(),
    displayName: String(
      account.displayName || prevMatch?.displayName || account.username || account.email || 'Account'
    ).trim(),
    username: account.username ?? prevMatch?.username ?? null,
    role: account.role ?? prevMatch?.role ?? null,
    planLabel: account.planLabel ?? prevMatch?.planLabel ?? null,
    equippedAvatar: account.equippedAvatar ?? prevMatch?.equippedAvatar ?? null,
    equippedFrameId: account.equippedFrameId ?? prevMatch?.equippedFrameId ?? null,
    sessionId: account.sessionId !== undefined ? account.sessionId : (prevMatch?.sessionId ?? null),
    sessionExpiresAt:
      account.sessionExpiresAt !== undefined
        ? account.sessionExpiresAt
        : (prevMatch?.sessionExpiresAt ?? null),
    isGuest: false,
    lastUsedAt: typeof account.lastUsedAt === 'number' ? account.lastUsedAt : Date.now(),
  };

  const next = [normalized, ...existing.filter((a) => a.uid !== cleanUid)].slice(
    0,
    MAX_SAVED_ACCOUNTS
  );

  if (store) {
    try {
      store.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors
    }
  }
  return next;
}

export function removeSavedAccount(
  uid: string,
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
): SavedAccountEntry[] {
  const cleanUid = String(uid || '').trim();
  const store = getSafeStorage(storage);
  const next = getSavedAccounts(store).filter((a) => a.uid !== cleanUid);
  if (store) {
    try {
      store.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }
  return next;
}

/**
 * Returns true when the current URL query string represents an explicit
 * "Add account" or "Switch account" flow where an already-logged-in user
 * (admin or student) must NEVER be auto-redirected to their current dashboard.
 */
export function isAddAccountUrl(search: string): boolean {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const action = (params.get('action') || '').trim().toLowerCase();
    return (
      action === 'add-account' ||
      action === 'switch-account' ||
      params.get('addAccount') === '1' ||
      params.get('add_account') === '1' ||
      params.get('switch') === '1'
    );
  } catch {
    return false;
  }
}

export function getAddAccountPrefillEmail(search: string): string {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return (params.get('email') || '').trim();
  } catch {
    return '';
  }
}

export function getAddAccountReason(search: string): 'session_expired' | null {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const reason = (params.get('reason') || '').trim().toLowerCase();
    return reason === 'session_expired' ? 'session_expired' : null;
  } catch {
    return null;
  }
}

export function buildAddAccountUrl(options?: {
  email?: string | null;
  returnTo?: string | null;
  reason?: 'session_expired' | null;
}): string {
  const params = new URLSearchParams();
  params.set('action', 'add-account');
  if (options?.email && options.email.trim()) {
    params.set('email', options.email.trim());
  }
  if (options?.reason === 'session_expired') {
    params.set('reason', 'session_expired');
  }
  if (options?.returnTo && options.returnTo.startsWith('/') && !options.returnTo.startsWith('/login')) {
    params.set('from', options.returnTo);
  }
  return `/login?${params.toString()}`;
}

/**
 * Evaluates whether LoginPage / SignupPage / AuthCard should auto-redirect the
 * currently authenticated user away from the auth screen.
 *
 * - Normal visit to /login: redirects once verified & profile loaded.
 * - Add-account visit (/login?action=add-account): NEVER auto-redirects the
 *   already-logged-in user (admin or student). Only redirects AFTER the user
 *   explicitly submits a new login/signup AND the newly authenticated user's
 *   profile & role have finished loading (`profileUid === currentUid`).
 */
export function shouldAutoRedirectFromAuthScreen(params: {
  isAddAccountFlow: boolean;
  hasCompletedNewAuthSubmit: boolean;
  initialUid: string | null;
  currentUid: string | null;
  profileUid: string | null;
  profileLoading: boolean;
  isSessionVerified: boolean;
  submittedTargetUid?: string | null;
}): boolean {
  const {
    isAddAccountFlow,
    hasCompletedNewAuthSubmit,
    initialUid,
    currentUid,
    profileUid,
    profileLoading,
    isSessionVerified,
    submittedTargetUid = null,
  } = params;

  if (!currentUid || !isSessionVerified || profileLoading) {
    return false;
  }

  if (!isAddAccountFlow) {
    return true;
  }

  // During Add Account flow: never bounce the existing session back to /admin or /dashboard
  if (!hasCompletedNewAuthSubmit) {
    return false;
  }

  // If we already know the newly authenticated UID from the submit handler, wait until
  // AuthContext has switched BOTH user.uid and profile.uid to that exact UID.
  if (submittedTargetUid && currentUid !== submittedTargetUid) {
    return false;
  }

  // Wait until the newly signed-in account's own profile is loaded so we route by ITS role
  if (!profileUid || profileUid !== currentUid) {
    return false;
  }

  if (initialUid && currentUid === initialUid && !hasCompletedNewAuthSubmit) {
    return false;
  }

  return true;
}
