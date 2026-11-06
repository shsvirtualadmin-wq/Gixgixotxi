import { collection, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Short Numeric ID Generator (5-digit, automatically escalates to 6-digit if space is saturated).
 * Ensures students never see raw database UIDs.
 */

// Cache of allocated short IDs to reduce Firestore roundtrips
const knownAllocatedIds = new Set<string>();

/**
 * Generates a random numeric string of given length
 */
function randomNumericString(digits: number): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const num = Math.floor(min + Math.random() * (max - min + 1));
  return String(num);
}

/**
 * Checks whether a short numeric ID is already assigned in Firestore.
 */
export async function isShortIdTaken(shortId: string): Promise<boolean> {
  if (knownAllocatedIds.has(shortId)) return true;
  try {
    const q = query(collection(db, 'publicProfiles'), where('shortId', '==', shortId), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      knownAllocatedIds.add(shortId);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[shortId] Check uniqueness warning:', err);
    return false;
  }
}

/**
 * Generates a unique 5-digit (or 6-digit if exhausted) numeric ID with retry logic.
 */
export async function generateUniqueShortId(): Promise<string> {
  // Try 5-digit generation first (10,000 - 99,999)
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = randomNumericString(5);
    const taken = await isShortIdTaken(candidate);
    if (!taken) {
      knownAllocatedIds.add(candidate);
      return candidate;
    }
  }

  // If 5-digit space experienced collisions, escalate to 6-digit (100,000 - 999,999)
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = randomNumericString(6);
    const taken = await isShortIdTaken(candidate);
    if (!taken) {
      knownAllocatedIds.add(candidate);
      return candidate;
    }
  }

  // Deterministic timestamp-based 6-digit fallback
  const fallback = String(Date.now() % 900000 + 100000);
  knownAllocatedIds.add(fallback);
  return fallback;
}

/**
 * Ensures a user profile document has a shortId assigned.
 * If missing, generates one and updates the Firestore user doc.
 */
export async function ensureUserShortId(uid: string, currentShortId?: string | null): Promise<string> {
  if (currentShortId && /^\d{5,6}$/.test(currentShortId)) {
    return currentShortId;
  }

  try {
    const newShortId = await generateUniqueShortId();
    await updateDoc(doc(db, 'users', uid), {
      shortId: newShortId,
    });
    return newShortId;
  } catch (err) {
    console.warn('[shortId] Failed to assign shortId:', err);
    // Return a stable 5-digit hash based on uid so UI never displays long string
    return deriveFallbackShortId(uid);
  }
}

/**
 * Derives a deterministic 5-digit numeric string from a raw UID as an instantaneous fallback
 */
export function deriveFallbackShortId(uid?: string | null): string {
  if (!uid) return '00000';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  const fiveDigit = (hash % 90000) + 10000;
  return String(fiveDigit);
}

/**
 * Formats a user ID for display.
 * Always prefers 5-digit/6-digit numeric shortId over raw UID string.
 */
export function formatStudentId(
  profileOrUid?: { shortId?: string | null; uid?: string | null; id?: string | null } | string | null
): string {
  if (!profileOrUid) return '#00000';

  if (typeof profileOrUid === 'string') {
    // If it's already a 5-6 digit string
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
