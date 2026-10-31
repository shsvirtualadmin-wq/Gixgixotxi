import { api } from '../lib/api';

const knownAllocatedIds = new Set<string>();

function randomNumericString(digits: number): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const num = Math.floor(min + Math.random() * (max - min + 1));
  return String(num);
}

export async function isShortIdTaken(shortId: string): Promise<boolean> {
  return knownAllocatedIds.has(shortId);
}

export async function generateUniqueShortId(): Promise<string> {
  const candidate = randomNumericString(5);
  knownAllocatedIds.add(candidate);
  return candidate;
}

/**
 * Ensures a user profile document has a shortId assigned in D1.
 */
export async function ensureUserShortId(uid: string, currentShortId?: string | null): Promise<string> {
  if (currentShortId && /^\d{5,6}$/.test(currentShortId)) {
    return currentShortId;
  }

  try {
    const res = await api.post<{ shortId?: string }>(
      '/api/users/short-id',
      { uid },
      { silentToast: true }
    );
    if (res?.shortId) {
      knownAllocatedIds.add(res.shortId);
      return res.shortId;
    }
    return deriveFallbackShortId(uid);
  } catch (err) {
    console.warn('[shortId] Failed to assign shortId via D1:', err);
    return deriveFallbackShortId(uid);
  }
}

export function deriveFallbackShortId(uid?: string | null): string {
  if (!uid) return '00000';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  const fiveDigit = (hash % 90000) + 10000;
  return String(fiveDigit);
}

export function formatStudentId(
  profileOrUid?: { shortId?: string | null; uid?: string | null; id?: string | null } | string | null
): string {
  if (!profileOrUid) return '#00000';

  if (typeof profileOrUid === 'string') {
    if (/^\d{5,6}$/.test(profileOrUid.trim())) {
      return `#${profileOrUid.trim()}`;
    }
    return `#${deriveFallbackShortId(profileOrUid)}`;
  }

  if (profileOrUid.shortId && /^\d{5,6}$/.test(String(profileOrUid.shortId).trim())) {
    return `#${String(profileOrUid.shortId).trim()}`;
  }

  const rawUid = profileOrUid.uid || profileOrUid.id;
  return `#${deriveFallbackShortId(rawUid)}`;
}
