/**
 * Boardly Rewards — Client API Service & Referral Code Cookie/Storage Helpers.
 *
 * HARD RULE: Never credit Kobans or write balances from the browser.
 * Every claim or referral action goes strictly through `/api/rewards/*`.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  DEFAULT_DAILY_LADDER,
  DEFAULT_REWARDS_CONFIG,
  computeDailyProgressState,
  computeMilestonesState,
  generateDeterministicReferralCode,
  isValidReferralCodeFormat,
  normalizeReferralCode,
  type RewardsConfig,
  type RewardsStateResponse,
} from '@/lib/rewardsEngine';

export const REWARD_REF_LS_KEY = 'boardly_ref_code';
export const REWARD_REF_COOKIE_NAME = 'boardly_ref_code';

/**
 * Stores a referral code in both localStorage and a 30-day browser cookie.
 */
export function savePendingReferralCode(rawCode: string): string | null {
  const normalized = normalizeReferralCode(rawCode);
  if (!normalized) return null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(REWARD_REF_LS_KEY, normalized);
    }
    if (typeof document !== 'undefined') {
      const maxAge = 30 * 24 * 60 * 60; // 30 days
      document.cookie = `${REWARD_REF_COOKIE_NAME}=${encodeURIComponent(
        normalized
      )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    }
  } catch {
    // Ignore storage errors in private browsing
  }
  return normalized;
}

/**
 * Reads any stored referral code from localStorage or the 30-day cookie.
 */
export function getPendingReferralCode(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const fromLs = window.localStorage.getItem(REWARD_REF_LS_KEY);
      if (fromLs) {
        const norm = normalizeReferralCode(fromLs);
        if (isValidReferralCodeFormat(norm)) return norm;
      }
    }
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${REWARD_REF_COOKIE_NAME}=([^;]+)`)
      );
      if (match?.[1]) {
        const norm = normalizeReferralCode(decodeURIComponent(match[1]));
        if (isValidReferralCodeFormat(norm)) return norm;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Clears the stored referral code from both localStorage and cookie after attach.
 */
export function clearPendingReferralCode(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(REWARD_REF_LS_KEY);
    }
    if (typeof document !== 'undefined') {
      document.cookie = `${REWARD_REF_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  } catch {
    // Ignore
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Proceed unauthenticated
  }
  return headers;
}

export function buildFallbackClientState(uid?: string | null): RewardsStateResponse {
  const nowMs = Date.now();
  const myCode = uid ? generateDeterministicReferralCode(uid, 0) : 'BLD-7K9M2P';
  const daily = computeDailyProgressState({
    totalClaims: 0,
    lastClaimPktDate: null,
    nowMs,
    config: DEFAULT_REWARDS_CONFIG,
  });
  const milestones = computeMilestonesState({
    mcqsAnswered: 0,
    claimedIds: {},
    config: DEFAULT_REWARDS_CONFIG,
  });

  return {
    serverConfigured: false,
    enabled: false,
    comingSoon: true,
    timezone: DEFAULT_REWARDS_CONFIG.timezone,
    balance: 0,
    daily,
    dailyLadder: [...DEFAULT_DAILY_LADDER],
    mcqsAnswered: 0,
    milestones,
    dragonMilestone: {
      threshold: 1000,
      unlocked: false,
      progress: 0,
    },
    referral: {
      myCode,
      shareUrl: `https://boardly.cfd/join/${myCode}`,
      canAttachManualCode: false,
      alreadyAttachedInviter: false,
      paidCountThisMonth: 0,
      maxPaidPerMonth: DEFAULT_REWARDS_CONFIG.referral.maxPaidPerInviterPerMonth,
      config: DEFAULT_REWARDS_CONFIG.referral,
      items: [],
    },
  };
}

export async function fetchRewardsState(uid?: string | null): Promise<RewardsStateResponse> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/rewards/state', {
      method: 'GET',
      headers,
    });
    const data = await res.json().catch(() => null);
    if (data && typeof data === 'object' && data.daily && Array.isArray(data.milestones)) {
      if (uid && (!data.serverConfigured || data.referral?.myCode === 'BLD-7K9M2P')) {
        const deterministic = generateDeterministicReferralCode(uid, 0);
        data.referral = {
          ...data.referral,
          myCode: deterministic,
          shareUrl: `https://boardly.cfd/join/${deterministic}`,
        };
      }
      return data as RewardsStateResponse;
    }
    return buildFallbackClientState(uid);
  } catch {
    return buildFallbackClientState(uid);
  }
}

export async function claimDailyReward(): Promise<{
  ok: boolean;
  dayNumber?: number;
  rewardAmount?: number;
  newBalance?: number;
  error?: string;
  code?: string;
  comingSoon?: boolean;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/rewards/daily/claim', {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Network error' }));
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || `Request failed (${res.status})`,
      code: data?.code,
      comingSoon: res.status === 503 || Boolean(data?.comingSoon),
    };
  }
  return data;
}

export async function claimMilestoneReward(milestoneId: string): Promise<{
  ok: boolean;
  milestoneId?: string;
  rewardAmount?: number;
  newBalance?: number;
  error?: string;
  code?: string;
  comingSoon?: boolean;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/rewards/milestone/claim', {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: milestoneId }),
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Network error' }));
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || `Request failed (${res.status})`,
      code: data?.code,
      comingSoon: res.status === 503 || Boolean(data?.comingSoon),
    };
  }
  return data;
}

export async function attachReferralCode(code: string): Promise<{
  ok: boolean;
  referralId?: string;
  status?: string;
  inviterDisplayName?: string;
  error?: string;
  code?: string;
  comingSoon?: boolean;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/rewards/referral/attach', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code: normalizeReferralCode(code) }),
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Network error' }));
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || `Request failed (${res.status})`,
      code: data?.code,
      comingSoon: res.status === 503 || Boolean(data?.comingSoon),
    };
  }
  return data;
}

export async function acceptPendingReferral(
  referralId: string,
  enteredCode: string
): Promise<{
  ok: boolean;
  referralId?: string;
  status?: string;
  paid?: boolean;
  inviterReward?: number;
  inviteeReward?: number;
  message?: string;
  error?: string;
  code?: string;
  comingSoon?: boolean;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/rewards/referral/accept', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      referralId,
      enteredCode: normalizeReferralCode(enteredCode),
    }),
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Network error' }));
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || `Request failed (${res.status})`,
      code: data?.code,
      comingSoon: res.status === 503 || Boolean(data?.comingSoon),
    };
  }
  return data;
}

/**
 * Super Admin helper to read or seed `config/rewards` using the existing
 * Firestore `/config/{docId}` admin-config pattern (`allow read: if true; allow write: if isAdmin()`).
 */
export async function ensureFirestoreRewardsConfigSeeded(isAdmin: boolean): Promise<RewardsConfig> {
  try {
    const configRef = doc(db, 'config', 'rewards');
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      return snap.data() as RewardsConfig;
    }
    if (isAdmin) {
      await setDoc(configRef, {
        ...DEFAULT_REWARDS_CONFIG,
        updatedAt: serverTimestamp(),
      });
    }
  } catch {
    // Non-fatal
  }
  return DEFAULT_REWARDS_CONFIG;
}
