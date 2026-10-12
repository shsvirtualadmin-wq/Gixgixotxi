import { doc, setDoc, getDocs, collection, query, where, increment, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const REFERRAL_STORAGE_KEY = 'boardly_referral_tracking';
const REFERRAL_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface StoredReferral {
  code: string;
  timestamp: number;
}

/**
 * Initializes referral capture from URL query parameters (?ref=CODE or ?r=CODE).
 * Preserves the referral code in localStorage with a 7-day expiration timestamp.
 */
export function initReferralTracker(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const rawRef = urlParams.get('ref') || urlParams.get('r');

    if (rawRef && rawRef.trim()) {
      const code = rawRef.trim().toUpperCase();
      const payload: StoredReferral = {
        code,
        timestamp: Date.now(),
      };
      localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(payload));
      // Also cache in legacy keys for maximum compatibility
      try {
        sessionStorage.setItem('referralCode', code);
        localStorage.setItem('boardly_referral_code', code);
      } catch {}
      console.log(`[ReferralTracker] Stored referral code "${code}" (valid for 7 days).`);
      return code;
    }
  } catch (err) {
    console.warn('[ReferralTracker] Error capturing referral param:', err);
  }

  return getStoredReferralCode();
}

/**
 * Retrieves the currently active referral code from localStorage if still within the 7-day window.
 * Returns null if expired or not set.
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (raw) {
      const parsed: StoredReferral = JSON.parse(raw);
      if (parsed && parsed.code && parsed.timestamp) {
        const age = Date.now() - parsed.timestamp;
        if (age < REFERRAL_EXPIRATION_MS) {
          return parsed.code.trim().toUpperCase();
        } else {
          // Expired after 7 days
          console.log('[ReferralTracker] Referral code expired (> 7 days). Clearing.');
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
        }
      }
    }

    // Fallback: check session storage if set within current session
    const sessionCode = sessionStorage.getItem('referralCode');
    if (sessionCode && sessionCode.trim()) {
      return sessionCode.trim().toUpperCase();
    }
  } catch (err) {
    console.warn('[ReferralTracker] Error reading stored referral code:', err);
  }

  return null;
}

/**
 * Clears the stored referral code after it has been successfully registered upon signup.
 */
export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    localStorage.removeItem('boardly_referral_code');
    sessionStorage.removeItem('referralCode');
  } catch (err) {
    console.warn('[ReferralTracker] Error clearing stored referral code:', err);
  }
}

/**
 * Records referral upon new user signup (email or Google):
 * 1. Writes to Firestore 'referrals' collection
 * 2. Synchronizes with server-side /api/referrals/record
 * 3. Clears referral from localStorage
 */
export async function recordSignupReferral(params: {
  referralCode?: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
}): Promise<{ success: boolean; codeUsed?: string; referralCount?: number }> {
  const code = (params.referralCode || getStoredReferralCode() || '').trim().toUpperCase();
  if (!code) {
    return { success: false };
  }

  // Prevent self-referral if user is the captain himself
  try {
    const nowIso = new Date().toISOString();

    // 1. Write Firestore record
    try {
      const referralDocRef = doc(db, 'referrals', params.referredUserId);
      await setDoc(referralDocRef, {
        referralCode: code,
        captainCode: code,
        referredUserId: params.referredUserId,
        referredUserName: params.referredUserName || 'Student',
        referredUserEmail: params.referredUserEmail || '',
        createdAt: nowIso,
        status: 'active',
        timestamp: Date.now(),
      }, { merge: true });
    } catch (fsErr) {
      console.warn('[ReferralTracker] Firestore write note:', fsErr);
    }

    // 2. Call server endpoint to sync file and increment live count
    let serverCount: number | undefined;
    try {
      const res = await fetch('/api/referrals/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: code,
          referredUserId: params.referredUserId,
          referredUserName: params.referredUserName,
          referredUserEmail: params.referredUserEmail,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        serverCount = data.referralCount;
      }
    } catch (apiErr) {
      console.warn('[ReferralTracker] Server API call note:', apiErr);
    }

    // 3. Clear code from local storage now that it was successfully recorded
    clearStoredReferralCode();

    console.log(`[ReferralTracker] Successfully recorded referral for code ${code}. New count: ${serverCount ?? 'updated'}`);
    return { success: true, codeUsed: code, referralCount: serverCount };
  } catch (err) {
    console.error('[ReferralTracker] Error recording referral on signup:', err);
    return { success: false };
  }
}
