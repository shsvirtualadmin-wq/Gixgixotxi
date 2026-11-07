/**
 * Boardly Rewards — Client API Service & Referral Code Cookie/Storage Helpers.
 *
 * HARD RULE: Never credit Kobans or write balances from the browser.
 * Every claim, referral action, or Super Admin mode toggle goes strictly through `/api/rewards/*`
 * backed by Cloudflare D1.
 */

import { auth } from '@/lib/firebase';
import {
  DEFAULT_DAILY_LADDER,
  DEFAULT_REWARDS_CONFIG,
  computeDailyProgressState,
  computeMilestonesState,
  generateDeterministicReferralCode,
  isValidReferralCodeFormat,
  normalizeReferralCode,
  type RewardsMode,
  type RewardsStateResponse,
} from '@/lib/rewardsEngine';
import {
  notifyKobanReceipt,
  notifyReferralConfirmed,
  notifyReferralRewardCredited,
} from './emailNotificationService';

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
    state: 'server_not_ready',
    statusMessage: 'Rewards are being set up',
    serverConfigured: false,
    mode: 'off',
    canClaim: false,
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

function sanitizeClientRewardsError(
  status: number,
  data: Record<string, any> | null | undefined
): {
  error: string;
  code: string;
  state?: 'server_not_ready' | 'disabled';
  comingSoon: boolean;
} {
  const rawCode = String(data?.code || '');
  const rawError = String(data?.error || '');
  const isServerNotReady =
    status >= 500 ||
    data?.state === 'server_not_ready' ||
    rawCode === 'SERVER_NOT_READY' ||
    rawCode === 'SERVER_NOT_CONFIGURED' ||
    rawCode === 'CREDIT_PENDING_RETRY' ||
    /firestore|beginTransaction|PERMISSION_DENIED|service account/i.test(rawError);

  if (isServerNotReady) {
    return {
      error: 'Rewards are being set up',
      code: 'SERVER_NOT_READY',
      state: 'server_not_ready',
      comingSoon: true,
    };
  }

  return {
    error: rawError || 'Rewards are being set up',
    code: rawCode || `HTTP_${status}`,
    state: data?.state === 'disabled' ? 'disabled' : undefined,
    comingSoon: status === 503 || Boolean(data?.comingSoon),
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
      if (data.state === 'server_not_ready' || !data.serverConfigured) {
        data.state = 'server_not_ready';
        data.statusMessage = 'Rewards are being set up';
        data.canClaim = false;
        data.enabled = false;
        data.comingSoon = true;
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
  state?: 'server_not_ready' | 'disabled';
  comingSoon?: boolean;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/rewards/daily/claim', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const safe = sanitizeClientRewardsError(res.status, data);
      return {
        ok: false,
        ...safe,
      };
    }
    if (auth.currentUser && typeof data.rewardAmount === 'number') {
      notifyKobanReceipt({
        recordId: `daily_claim_${auth.currentUser.uid}_day_${data.dayNumber || Date.now()}`,
        studentUid: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || undefined,
        studentEmail: auth.currentUser.email || undefined,
        deltaAmount: data.rewardAmount,
        newBalance: Number(data.newBalance || 0),
        reason: `Daily Check-In Claim (Day ${data.dayNumber || 1})`,
        subType: 'daily_claim',
      });
    }
    return data;
  } catch {
    return {
      ok: false,
      error: 'Rewards are being set up',
      code: 'SERVER_NOT_READY',
      state: 'server_not_ready',
      comingSoon: true,
    };
  }
}

export async function claimMilestoneReward(milestoneId: string): Promise<{
  ok: boolean;
  milestoneId?: string;
  rewardAmount?: number;
  newBalance?: number;
  error?: string;
  code?: string;
  state?: 'server_not_ready' | 'disabled';
  comingSoon?: boolean;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/rewards/milestone/claim', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: milestoneId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const safe = sanitizeClientRewardsError(res.status, data);
      return {
        ok: false,
        ...safe,
      };
    }
    if (auth.currentUser && typeof data.rewardAmount === 'number') {
      notifyKobanReceipt({
        recordId: `milestone_${auth.currentUser.uid}_${milestoneId}`,
        studentUid: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || undefined,
        studentEmail: auth.currentUser.email || undefined,
        deltaAmount: data.rewardAmount,
        newBalance: Number(data.newBalance || 0),
        reason: `MCQ Milestone Reward (${milestoneId})`,
        subType: 'milestone_claim',
      });
    }
    return data;
  } catch {
    return {
      ok: false,
      error: 'Rewards are being set up',
      code: 'SERVER_NOT_READY',
      state: 'server_not_ready',
      comingSoon: true,
    };
  }
}

export async function attachReferralCode(code: string): Promise<{
  ok: boolean;
  referralId?: string;
  status?: string;
  inviterDisplayName?: string;
  error?: string;
  code?: string;
  state?: 'server_not_ready' | 'disabled';
  comingSoon?: boolean;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/rewards/referral/attach', {
      method: 'POST',
      headers,
      body: JSON.stringify({ code: normalizeReferralCode(code) }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const safe = sanitizeClientRewardsError(res.status, data);
      return {
        ok: false,
        ...safe,
      };
    }
    if (auth.currentUser) {
      notifyReferralConfirmed({
        referralId: String(data.referralId || `${auth.currentUser.uid}_${normalizeReferralCode(code)}`),
        friendUid: auth.currentUser.uid,
        friendName: auth.currentUser.displayName || undefined,
        referrerName: data.inviterDisplayName || 'Boardly Classmate',
        referralCode: normalizeReferralCode(code),
      });
    }
    return data;
  } catch {
    return {
      ok: false,
      error: 'Rewards are being set up',
      code: 'SERVER_NOT_READY',
      state: 'server_not_ready',
      comingSoon: true,
    };
  }
}

export async function acceptPendingReferral(
  referralId: string,
  enteredCode: string
): Promise<{
  ok: boolean;
  referralId?: string;
  status?: string;
  inviterAccepted?: boolean;
  inviteeAccepted?: boolean;
  paid?: boolean;
  inviterReward?: number;
  inviteeReward?: number;
  message?: string;
  error?: string;
  code?: string;
  state?: 'server_not_ready' | 'disabled';
  comingSoon?: boolean;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/rewards/referral/accept', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        referralId,
        enteredCode: normalizeReferralCode(enteredCode),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const safe = sanitizeClientRewardsError(res.status, data);
      return {
        ok: false,
        ...safe,
      };
    }
    if (auth.currentUser) {
      if (data.paid) {
        notifyReferralRewardCredited({
          referralId: String(data.referralId || referralId),
          referrerUid: auth.currentUser.uid,
          referrerName: auth.currentUser.displayName || undefined,
          referrerKobans: Number(data.inviterReward || 5000),
          friendKobans: Number(data.inviteeReward || 1000),
          referralCode: normalizeReferralCode(enteredCode),
        });
      } else {
        notifyReferralConfirmed({
          referralId: String(data.referralId || referralId),
          referrerUid: auth.currentUser.uid,
          referrerName: auth.currentUser.displayName || undefined,
          referralCode: normalizeReferralCode(enteredCode),
        });
      }
    }
    return data;
  } catch {
    return {
      ok: false,
      error: 'Rewards are being set up',
      code: 'SERVER_NOT_READY',
      state: 'server_not_ready',
      comingSoon: true,
    };
  }
}

/**
 * Super Admin endpoint to update the D1 Rewards mode ("off" | "admin_only" | "everyone").
 */
export async function setRewardsAdminMode(mode: RewardsMode): Promise<{
  ok: boolean;
  previousMode?: RewardsMode;
  mode?: RewardsMode;
  error?: string;
  code?: string;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/rewards/admin/mode', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode }),
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Network error' }));
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || `Request failed (${res.status})`,
      code: data?.code,
    };
  }
  return data;
}

export interface RewardsHealthResponse {
  ok: boolean;
  reason: string;
  httpStatus?: number;
  targetProjectId?: string;
  targetDatabaseId?: string;
  serviceAccountProjectId?: string | null;
  serviceAccountClientEmail?: string | null;
  projectMismatch?: boolean;
  restUrlPattern?: string;
  oauthScope?: string;
  tokenAudience?: string;
  mode?: RewardsMode;
}

/**
 * Super Admin endpoint to check Firestore + D1 Rewards health (`GET /api/rewards/health`).
 */
export async function fetchRewardsHealth(): Promise<RewardsHealthResponse> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/rewards/health', {
      method: 'GET',
      headers,
    });
    const data = await res.json().catch(() => null);
    if (data && typeof data === 'object' && typeof data.reason === 'string') {
      return data as RewardsHealthResponse;
    }
    return {
      ok: false,
      reason: `http_${res.status}`,
      httpStatus: res.status,
    };
  } catch {
    return {
      ok: false,
      reason: 'network_error',
    };
  }
}

