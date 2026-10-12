import { doc, setDoc, getDocs, collection, query, where, limit, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const REFERRAL_STORAGE_KEY = 'boardly_referral_tracking';
const LEGACY_STORAGE_KEY = 'boardly_referral_code';
const SESSION_KEY = 'referralCode';
const REFERRAL_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days window

interface StoredReferral {
  code: string;
  timestamp: number;
}

export interface AmbassadorLookupResult {
  uid: string;
  name?: string;
  email?: string;
  code: string;
  institution?: string;
}

/**
 * Initializes referral capture from URL query parameters (?ref=CODE, ?r=CODE, ?referral=CODE)
 * and route paths (/r/CODE).
 * Saves to both localStorage AND sessionStorage to survive redirects, Google sign-in popups,
 * and page reloads. Does NOT clear until signup is complete.
 */
export function initReferralTracker(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    let capturedCode: string | null = null;
    let source = '';

    // 1. Check path-based referral links: /r/CODE or /r/CODE/
    const pathname = window.location.pathname || '';
    const pathMatch = pathname.match(/^\/r\/([A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) {
      capturedCode = pathMatch[1].trim();
      source = `pathname (${pathname})`;
    }

    // 2. Check query params (?ref=CODE, ?r=CODE, ?referral=CODE, ?referralCode=CODE)
    if (!capturedCode) {
      const search = window.location.search;
      const urlParams = new URLSearchParams(search);
      const rawParam =
        urlParams.get('ref') ||
        urlParams.get('r') ||
        urlParams.get('referral') ||
        urlParams.get('referralCode');

      if (rawParam && rawParam.trim()) {
        capturedCode = rawParam.trim();
        source = `query param (${search})`;
      }
    }

    // 3. Fallback: Check hash query if SPA used hash routing
    if (!capturedCode && window.location.hash) {
      const hash = window.location.hash;
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(hash.slice(qIndex));
        const rawHashRef =
          hashParams.get('ref') ||
          hashParams.get('r') ||
          hashParams.get('referral') ||
          hashParams.get('referralCode');
        if (rawHashRef && rawHashRef.trim()) {
          capturedCode = rawHashRef.trim();
          source = `hash query (${hash})`;
        }
      }
    }

    if (capturedCode) {
      const normalized = capturedCode.toUpperCase();
      const payload: StoredReferral = {
        code: normalized,
        timestamp: Date.now(),
      };

      // Persist in BOTH localStorage and sessionStorage
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(payload));
        localStorage.setItem(LEGACY_STORAGE_KEY, normalized);
        sessionStorage.setItem(SESSION_KEY, normalized);
        sessionStorage.setItem(LEGACY_STORAGE_KEY, normalized);
      } catch (storageErr) {
        console.warn('[Referral:Capture] Storage quota or security error:', storageErr);
      }

      console.log(`[Referral:Capture] Successfully captured and stored referral code: "${normalized}" from ${source}`);
      return normalized;
    }
  } catch (err) {
    console.warn('[Referral:Capture] Error during referral capture:', err);
  }

  // Return currently stored code if any
  return getStoredReferralCode();
}

/**
 * Retrieves the stored referral code from localStorage or sessionStorage.
 * Always returns normalized uppercase code or null.
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check structured localStorage
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (raw) {
      try {
        const parsed: StoredReferral = JSON.parse(raw);
        if (parsed && parsed.code && parsed.timestamp) {
          const age = Date.now() - parsed.timestamp;
          if (age < REFERRAL_EXPIRATION_MS) {
            return parsed.code.trim().toUpperCase();
          } else {
            console.log('[Referral:Capture] Stored referral code expired (> 30 days). Clearing.');
            localStorage.removeItem(REFERRAL_STORAGE_KEY);
          }
        }
      } catch {
        // Fallback if not JSON
        if (typeof raw === 'string' && raw.trim()) {
          return raw.trim().toUpperCase();
        }
      }
    }

    // 2. Check legacy localStorage key
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && legacy.trim()) {
      return legacy.trim().toUpperCase();
    }

    // 3. Check sessionStorage keys
    const sessionCode = sessionStorage.getItem(SESSION_KEY) || sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (sessionCode && sessionCode.trim()) {
      return sessionCode.trim().toUpperCase();
    }
  } catch (err) {
    console.warn('[Referral:Capture] Error reading stored referral code:', err);
  }

  return null;
}

/**
 * Clears the stored referral code only AFTER signup attribution is complete.
 */
export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    console.log('[Referral:Capture] Cleared stored referral code after completed signup attribution.');
  } catch (err) {
    console.warn('[Referral:Capture] Error clearing stored referral code:', err);
  }
}

/**
 * Looks up the matching ambassador UID for a given referral code.
 * Searches Firestore captains collection, with server API fallback.
 */
export async function lookupAmbassadorByCode(rawCode: string): Promise<AmbassadorLookupResult | null> {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return null;

  console.log(`[Referral:Attribution] Looking up ambassador for referral code: "${code}"...`);

  // 1. Try querying captains in Firestore
  try {
    const qCap = query(collection(db, 'captains'), where('referralCode', '==', code), limit(1));
    const snap = await getDocs(qCap);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = docSnap.data();
      const ambassadorUid = data.userId || docSnap.id;
      console.log(`[Referral:Attribution] Found ambassador via Firestore captains: ${data.studentName || ambassadorUid} (${ambassadorUid})`);
      return {
        uid: ambassadorUid,
        name: data.studentName || 'Ambassador',
        email: data.email || '',
        code,
        institution: data.institution || '',
      };
    }
  } catch (fsErr) {
    console.warn('[Referral:Attribution] Firestore captains query note:', fsErr);
  }

  // 2. Server-side lookup fallback via Express endpoint
  try {
    const res = await fetch(`/api/referrals/lookup?code=${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.found && data.ambassadorUid) {
        console.log(`[Referral:Attribution] Found ambassador via server lookup: ${data.name || data.ambassadorUid} (${data.ambassadorUid})`);
        return {
          uid: data.ambassadorUid,
          name: data.name || 'Ambassador',
          email: data.email || '',
          code,
          institution: data.institution || '',
        };
      }
    }
  } catch (apiErr) {
    console.warn('[Referral:Attribution] Server lookup endpoint note:', apiErr);
  }

  console.warn(`[Referral:Attribution] No ambassador found matching code: "${code}".`);
  return null;
}

/**
 * Records referral on first account creation (Email signup and Google sign-in).
 * 1. Reads stored code
 * 2. Looks up matching ambassador
 * 3. Blocks self-referrals
 * 4. Writes attribution to users/{referredUserId}: referredBy, referralCode, referredAt
 * 5. Writes referral document to referrals/{referredUserId} with captainId and ambassadorUid
 * 6. Synchronizes server-side counter
 * 7. Clears stored referral code from storage
 */
export async function recordSignupReferral(params: {
  referralCode?: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
}): Promise<{
  success: boolean;
  codeUsed?: string;
  ambassadorUid?: string;
  referralCount?: number;
  reason?: string;
}> {
  const code = (params.referralCode || getStoredReferralCode() || '').trim().toUpperCase();
  if (!code) {
    console.log('[Referral:Attribution] No referral code stored or provided. Skipping referral attribution.');
    return { success: false, reason: 'no_code' };
  }

  console.log(`[Referral:Attribution] Processing referral attribution for user ${params.referredUserId} with code "${code}"...`);

  // Look up matching ambassador
  const ambassador = await lookupAmbassadorByCode(code);
  const ambassadorUid = ambassador?.uid || '';

  // Block self-referral
  if (ambassadorUid && ambassadorUid === params.referredUserId) {
    console.warn(`[Referral:Attribution] Self-referral blocked: User ${params.referredUserId} attempted to use their own code "${code}".`);
    clearStoredReferralCode();
    return { success: false, reason: 'self_referral' };
  }

  // Extract first name for display
  const rawName = params.referredUserName || 'Student';
  const firstName = rawName.split(' ')[0] || 'Student';
  const nowIso = new Date().toISOString();

  // 1. Write attribution to new user's doc (users/{referredUserId})
  try {
    const userDocRef = doc(db, 'users', params.referredUserId);
    await setDoc(
      userDocRef,
      {
        referredBy: ambassadorUid || null,
        referralCode: code,
        referredAt: nowIso,
        referredAtTimestamp: Date.now(),
      },
      { merge: true }
    );
    console.log(`[Referral:Attribution] Successfully wrote referredBy (${ambassadorUid || 'unknown'}) and referralCode (${code}) to users/${params.referredUserId}`);
  } catch (userWriteErr) {
    console.warn('[Referral:Attribution] Note writing to users document:', userWriteErr);
  }

  // 2. Write referral document to `referrals` collection
  // Document ID is params.referredUserId (ensures 1 referral per student and idempotent writes)
  try {
    const referralDocRef = doc(db, 'referrals', params.referredUserId);
    await setDoc(
      referralDocRef,
      {
        referralId: params.referredUserId,
        referredUserId: params.referredUserId,
        referredUserName: firstName,
        referredUserFullName: rawName,
        referredUserEmail: params.referredUserEmail || '',
        captainId: ambassadorUid || code, // Used for rules and queries
        ambassadorUid: ambassadorUid || '',
        referralCode: code,
        captainCode: code,
        referredAt: nowIso,
        createdAt: nowIso,
        timestamp: Date.now(),
        status: 'active',
      },
      { merge: true }
    );
    console.log(`[Referral:Counting] Successfully created referrals/${params.referredUserId} record (captainId: ${ambassadorUid || code})`);
  } catch (fsErr) {
    console.error('[Referral:Counting] Error writing referrals document:', fsErr);
  }

  // 3. Synchronize with server endpoint for backup / file counter
  let liveCount: number | undefined;
  try {
    const res = await fetch('/api/referrals/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode: code,
        ambassadorUid,
        referredUserId: params.referredUserId,
        referredUserName: firstName,
        referredUserEmail: params.referredUserEmail,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      liveCount = data.referralCount;
    }
  } catch (apiErr) {
    console.warn('[Referral:Counting] Server API sync note:', apiErr);
  }

  // 4. Clear code from local storage only now that registration attribution is complete
  clearStoredReferralCode();

  console.log(`[Referral:Counting] Completed referral attribution for code "${code}". Live count: ${liveCount ?? 'updated'}`);
  return {
    success: true,
    codeUsed: code,
    ambassadorUid,
    referralCount: liveCount,
  };
}
