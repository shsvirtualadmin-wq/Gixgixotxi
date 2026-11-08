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

import { getStoredGuestSessionToken } from '@/lib/api';

async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    if (!auth.currentUser && typeof auth.authStateReady === 'function') {
      await auth.authStateReady();
    }
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(forceRefresh);
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } else {
      const guestToken = getStoredGuestSessionToken();
      if (guestToken) {
        headers['X-Guest-Session'] = guestToken;
      }
    }
  } catch (err) {
    console.warn('[Rewards Auth Header Warning]:', err);
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

export async function fetchRewardsState(uid?: string | null): Promise<RewardsStateResponse> {
  const url = '/api/rewards/state';
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    const rawText = await res.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const serverMsg =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        rawText.slice(0, 200).trim() ||
        res.statusText ||
        'Failed to load reward settings';
      console.error('[Rewards State Load Failed]', {
        url,
        method: 'GET',
        status: res.status,
        statusText: res.statusText,
        response: data ?? rawText,
      });
      const fallback = buildFallbackClientState(uid);
      return {
        ...fallback,
        httpStatus: res.status,
        loadError: `HTTP ${res.status}: ${serverMsg}`,
      };
    }

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
      data.httpStatus = res.status;
      return data as RewardsStateResponse;
    }

    console.error('[Rewards State Invalid Payload]', {
      url,
      method: 'GET',
      status: res.status,
      statusText: res.statusText,
      response: data ?? rawText,
    });
    const fallback = buildFallbackClientState(uid);
    return {
      ...fallback,
      httpStatus: res.status,
      loadError: `HTTP ${res.status}: Invalid response payload from /api/rewards/state`,
    };
  } catch (err: any) {
    console.error('[Rewards State Network Error]', {
      url,
      method: 'GET',
      error: err?.message || String(err),
    });
    const fallback = buildFallbackClientState(uid);
    return {
      ...fallback,
      loadError: `Failed to load reward settings: ${err?.message || 'Unable to reach /api/rewards/state'}`,
    };
  }
}

export async function claimDailyReward(): Promise<{
  ok: boolean;
  httpStatus?: number;
  dayNumber?: number;
  rewardAmount?: number;
  newBalance?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  error?: string;
  code?: string;
  state?: 'server_not_ready' | 'disabled' | 'guest_locked';
  comingSoon?: boolean;
  guestLocked?: boolean;
}> {
  const url = '/api/rewards/daily/claim';
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({}),
    });
    const rawText = await res.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (!res.ok || !data?.ok) {
      const hasStructuredError = Boolean(data && typeof data === 'object' && (data.error || data.message));
      const serverMsg =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        rawText.slice(0, 200).trim() ||
        res.statusText ||
        'Daily check-in claim failed';
      console.error('[Rewards Daily Claim Failed]', {
        url,
        method: 'POST',
        status: res.status,
        statusText: res.statusText,
        response: data ?? rawText,
      });
      return {
        ok: false,
        httpStatus: res.status,
        error: hasStructuredError ? String(serverMsg) : `HTTP ${res.status}: ${serverMsg}`,
        code: data?.code || `HTTP_${res.status}`,
        state: data?.state,
        comingSoon: Boolean(data?.comingSoon),
        guestLocked: Boolean(data?.guestLocked || data?.code === 'GUEST_REWARDS_FORBIDDEN'),
      };
    }

    if (auth.currentUser && typeof data.rewardAmount === 'number') {
      const deltaAmount = Number(data.delta ?? data.rewardAmount);
      const newBalance = Number(data.balanceAfter ?? data.newBalance ?? 0);
      const balanceBefore =
        typeof data.balanceBefore === 'number'
          ? data.balanceBefore
          : Math.max(0, newBalance - deltaAmount);
      if (newBalance === balanceBefore + deltaAmount) {
        notifyKobanReceipt({
          recordId: String(data.ledgerId || `daily_claim_${auth.currentUser.uid}_day_${data.dayNumber || Date.now()}`),
          studentUid: auth.currentUser.uid,
          studentName: auth.currentUser.displayName || undefined,
          studentEmail: auth.currentUser.email || undefined,
          deltaAmount,
          balanceBefore,
          newBalance,
          transactionId: String(data.ledgerId || `daily_${auth.currentUser.uid}_${data.pktDate || Date.now()}`),
          reason: `Daily Check-In Claim (Day ${data.dayNumber || 1})`,
          subType: 'daily_claim',
        });
      }
    }
    return {
      ...data,
      httpStatus: res.status,
    };
  } catch (err: any) {
    console.error('[Rewards Daily Claim Network Error]', {
      url,
      method: 'POST',
      error: err?.message || String(err),
    });
    return {
      ok: false,
      error: `Request failed: ${err?.message || 'Unable to reach /api/rewards/daily/claim'}`,
      code: 'NETWORK_ERROR',
    };
  }
}

export async function claimMilestoneReward(milestoneId: string): Promise<{
  ok: boolean;
  httpStatus?: number;
  milestoneId?: string;
  rewardAmount?: number;
  balanceBefore?: number;
  newBalance?: number;
  balanceAfter?: number;
  error?: string;
  code?: string;
  state?: 'server_not_ready' | 'disabled' | 'guest_locked';
  comingSoon?: boolean;
  guestLocked?: boolean;
}> {
  const url = '/api/rewards/milestone/claim';
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ id: milestoneId }),
    });
    const rawText = await res.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (!res.ok || !data?.ok) {
      const hasStructuredError = Boolean(data && typeof data === 'object' && (data.error || data.message));
      const serverMsg =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        rawText.slice(0, 200).trim() ||
        res.statusText ||
        'Milestone claim failed';
      console.error('[Rewards Milestone Claim Failed]', {
        url,
        method: 'POST',
        milestoneId,
        status: res.status,
        statusText: res.statusText,
        response: data ?? rawText,
      });
      return {
        ok: false,
        httpStatus: res.status,
        error: hasStructuredError ? String(serverMsg) : `HTTP ${res.status}: ${serverMsg}`,
        code: data?.code || `HTTP_${res.status}`,
        state: data?.state,
        comingSoon: Boolean(data?.comingSoon),
        guestLocked: Boolean(data?.guestLocked || data?.code === 'GUEST_REWARDS_FORBIDDEN'),
      };
    }

    if (auth.currentUser && typeof data.rewardAmount === 'number') {
      const deltaAmount = Number(data.delta ?? data.rewardAmount);
      const newBalance = Number(data.balanceAfter ?? data.newBalance ?? 0);
      const balanceBefore =
        typeof data.balanceBefore === 'number'
          ? data.balanceBefore
          : Math.max(0, newBalance - deltaAmount);
      if (newBalance === balanceBefore + deltaAmount) {
        notifyKobanReceipt({
          recordId: String(data.ledgerId || `milestone_${auth.currentUser.uid}_${milestoneId}`),
          studentUid: auth.currentUser.uid,
          studentName: auth.currentUser.displayName || undefined,
          studentEmail: auth.currentUser.email || undefined,
          deltaAmount,
          balanceBefore,
          newBalance,
          transactionId: String(data.ledgerId || `milestone_${auth.currentUser.uid}_${milestoneId}`),
          reason: `MCQ Milestone Reward (${milestoneId})`,
          subType: 'milestone_claim',
        });
      }
    }
    return {
      ...data,
      httpStatus: res.status,
    };
  } catch (err: any) {
    console.error('[Rewards Milestone Claim Network Error]', {
      url,
      method: 'POST',
      milestoneId,
      error: err?.message || String(err),
    });
    return {
      ok: false,
      error: `Request failed: ${err?.message || 'Unable to reach /api/rewards/milestone/claim'}`,
      code: 'NETWORK_ERROR',
    };
  }
}

export async function attachReferralCode(code: string): Promise<{
  ok: boolean;
  httpStatus?: number;
  referralId?: string;
  status?: string;
  inviterDisplayName?: string;
  error?: string;
  code?: string;
  state?: 'server_not_ready' | 'disabled' | 'guest_locked';
  comingSoon?: boolean;
  guestLocked?: boolean;
}> {
  const url = '/api/rewards/referral/attach';
  const normalizedCode = normalizeReferralCode(code);
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ code: normalizedCode }),
    });
    const rawText = await res.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (!res.ok || !data?.ok) {
      const hasStructuredError = Boolean(data && typeof data === 'object' && (data.error || data.message));
      const serverMsg =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        rawText.slice(0, 200).trim() ||
        res.statusText ||
        'Referral attach failed';
      console.error('[Rewards Referral Attach Failed]', {
        url,
        method: 'POST',
        code: normalizedCode,
        status: res.status,
        statusText: res.statusText,
        response: data ?? rawText,
      });
      return {
        ok: false,
        httpStatus: res.status,
        error: hasStructuredError ? String(serverMsg) : `HTTP ${res.status}: ${serverMsg}`,
        code: data?.code || `HTTP_${res.status}`,
        state: data?.state,
        comingSoon: Boolean(data?.comingSoon),
        guestLocked: Boolean(data?.guestLocked || data?.code === 'GUEST_REWARDS_FORBIDDEN'),
      };
    }

    if (auth.currentUser) {
      notifyReferralConfirmed({
        referralId: String(data.referralId || `${auth.currentUser.uid}_${normalizedCode}`),
        friendUid: auth.currentUser.uid,
        friendName: auth.currentUser.displayName || undefined,
        referrerName: data.inviterDisplayName || 'Boardly Classmate',
        referralCode: normalizedCode,
      });
    }
    return {
      ...data,
      httpStatus: res.status,
    };
  } catch (err: any) {
    console.error('[Rewards Referral Attach Network Error]', {
      url,
      method: 'POST',
      code: normalizedCode,
      error: err?.message || String(err),
    });
    return {
      ok: false,
      error: `Request failed: ${err?.message || 'Unable to reach /api/rewards/referral/attach'}`,
      code: 'NETWORK_ERROR',
    };
  }
}

export async function acceptPendingReferral(
  referralId: string,
  enteredCode: string
): Promise<{
  ok: boolean;
  httpStatus?: number;
  referralId?: string;
  status?: string;
  inviterAccepted?: boolean;
  inviteeAccepted?: boolean;
  paid?: boolean;
  inviterReward?: number;
  inviterBalanceBefore?: number;
  inviterBalanceAfter?: number;
  inviteeReward?: number;
  inviteeBalanceBefore?: number;
  inviteeBalanceAfter?: number;
  message?: string;
  error?: string;
  code?: string;
  state?: 'server_not_ready' | 'disabled' | 'guest_locked';
  comingSoon?: boolean;
  guestLocked?: boolean;
}> {
  const url = '/api/rewards/referral/accept';
  const normalizedCode = normalizeReferralCode(enteredCode);
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        referralId,
        enteredCode: normalizedCode,
      }),
    });
    const rawText = await res.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (!res.ok || !data?.ok) {
      const hasStructuredError = Boolean(data && typeof data === 'object' && (data.error || data.message));
      const serverMsg =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        rawText.slice(0, 200).trim() ||
        res.statusText ||
        'Referral confirmation failed';
      console.error('[Rewards Referral Accept Failed]', {
        url,
        method: 'POST',
        referralId,
        enteredCode: normalizedCode,
        status: res.status,
        statusText: res.statusText,
        response: data ?? rawText,
      });
      return {
        ok: false,
        httpStatus: res.status,
        error: hasStructuredError ? String(serverMsg) : `HTTP ${res.status}: ${serverMsg}`,
        code: data?.code || `HTTP_${res.status}`,
        state: data?.state,
        comingSoon: Boolean(data?.comingSoon),
        guestLocked: Boolean(data?.guestLocked || data?.code === 'GUEST_REWARDS_FORBIDDEN'),
      };
    }

    if (auth.currentUser) {
      if (data.paid) {
        notifyReferralRewardCredited({
          referralId: String(data.referralId || referralId),
          referrerUid: auth.currentUser.uid,
          referrerName: auth.currentUser.displayName || undefined,
          referrerKobans: Number(data.inviterReward || 5000),
          referrerBalanceBefore:
            typeof data.inviterBalanceBefore === 'number' ? data.inviterBalanceBefore : undefined,
          referrerNewBalance:
            typeof data.inviterBalanceAfter === 'number' ? data.inviterBalanceAfter : undefined,
          friendKobans: Number(data.inviteeReward || 1000),
          friendBalanceBefore:
            typeof data.inviteeBalanceBefore === 'number' ? data.inviteeBalanceBefore : undefined,
          friendNewBalance:
            typeof data.inviteeBalanceAfter === 'number' ? data.inviteeBalanceAfter : undefined,
          referralCode: normalizedCode,
          transactionId: String(data.referralId || referralId),
        });
      } else {
        notifyReferralConfirmed({
          referralId: String(data.referralId || referralId),
          referrerUid: auth.currentUser.uid,
          referrerName: auth.currentUser.displayName || undefined,
          referralCode: normalizedCode,
        });
      }
    }
    return {
      ...data,
      httpStatus: res.status,
    };
  } catch (err: any) {
    console.error('[Rewards Referral Accept Network Error]', {
      url,
      method: 'POST',
      referralId,
      enteredCode: normalizedCode,
      error: err?.message || String(err),
    });
    return {
      ok: false,
      error: `Request failed: ${err?.message || 'Unable to reach /api/rewards/referral/accept'}`,
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Super Admin endpoint to update the D1 Rewards mode ("off" | "admin_only" | "everyone").
 */
export async function setRewardsAdminMode(mode: RewardsMode): Promise<{
  ok: boolean;
  status?: number;
  previousMode?: RewardsMode;
  mode?: RewardsMode;
  error?: string;
  code?: string;
}> {
  const url = '/api/rewards/admin/mode';
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode }),
    });
    const rawText = await res.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (!res.ok || !data?.ok) {
      const serverMsg =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        rawText.slice(0, 200).trim() ||
        res.statusText ||
        'Request failed';
      console.error('[Rewards Admin Mode Save Failed]', {
        url,
        method: 'POST',
        requestedMode: mode,
        status: res.status,
        statusText: res.statusText,
        response: data ?? rawText,
      });
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}: ${serverMsg}`,
        code: data?.code || `HTTP_${res.status}`,
      };
    }

    return {
      ...data,
      status: res.status,
    };
  } catch (err: any) {
    console.error('[Rewards Admin Mode Network Error]', {
      url,
      method: 'POST',
      requestedMode: mode,
      error: err?.message || String(err),
    });
    return {
      ok: false,
      error: `Request failed: ${err?.message || 'Unable to reach /api/rewards/admin/mode'}`,
      code: 'NETWORK_ERROR',
    };
  }
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

