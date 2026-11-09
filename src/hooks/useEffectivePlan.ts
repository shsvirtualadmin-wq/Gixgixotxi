import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, forceRefreshUserProfile } from './useUserProfile';
import {
  resolveUnifiedPlanStatus,
  parseExpiryMillis,
  type UnifiedPlanStatusResult,
} from '@/config/plans';

export interface EffectivePlanResult {
  isPro: boolean;
  isUnlimited: boolean;
  isSuperAdmin: boolean;
  source: 'superadmin' | 'personal' | 'crew' | 'none';
  plan: 'pro' | 'free';
  crewName?: string;
  loading: boolean;
  status: 'loading' | 'ready' | 'error';
  error?: string | null;
  planStatus: UnifiedPlanStatusResult;
  refreshPlanStatus: () => Promise<void>;
}

// ── Superadmin Identity Checker ─────────────────────────────────────────────
export const SUPER_ADMIN_EMAILS = [
  'shsvirtualadmin@gmail.com',
  'support@boardly.cfd',
  'support@scholario.me',
];
export const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';

export function isSuperAdminEmailOrRole(
  email?: string | null,
  role?: string | null,
  uid?: string | null
): boolean {
  if (uid && uid === SUPER_ADMIN_UID) return true;
  const em = (email || '').toLowerCase().trim();
  if (SUPER_ADMIN_EMAILS.includes(em)) return true;
  if (role === 'superadmin' || role === 'admin') return true;
  return false;
}

// ── In-Memory Plan Cache to Eliminate Flickers ─────────────────────────────
const planMemoryCache = new Map<string, EffectivePlanResult>();

export function clearPlanCache(uid?: string) {
  if (uid) {
    planMemoryCache.delete(uid);
  } else {
    planMemoryCache.clear();
  }
}

// ── Pure Plan Resolver (used by hook and by /admin/health pure logic tests) ──
export interface PlanResolverInput {
  email?: string | null;
  role?: string | null;
  uid?: string | null;
  isGuest?: boolean;
  plan?: string | null;
  isPremium?: boolean | null;
  proPlanId?: string | null;
  planStartedAt?: unknown;
  updatedAt?: unknown;
  planExpiresAt?: unknown;
  premiumExpiresAt?: unknown;
  pendingRequests?: Array<Record<string, any>> | null;
  nowMs?: number;
  crew?: {
    tier?: 'free' | 'paid' | string;
    paid_until?: string | null;
    hasProMember?: boolean;
    isProShared?: boolean;
    name?: string;
    members?: Array<{ uid?: string; isPro?: boolean; plan?: string }>;
  } | null;
  inCrew?: boolean;
}

export function isCrewPaidActive(paidUntil?: string | null, nowMs: number = Date.now()): boolean {
  if (!paidUntil) return false;
  const d = new Date(paidUntil);
  return !isNaN(d.getTime()) && d.getTime() > nowMs;
}

const noopRefresh = async () => {};

export function resolveEffectivePlan(input: PlanResolverInput): EffectivePlanResult {
  const nowMs = typeof input.nowMs === 'number' && Number.isFinite(input.nowMs) ? input.nowMs : Date.now();
  const isSuper = isSuperAdminEmailOrRole(input.email, input.role, input.uid);

  const expA = parseExpiryMillis(input.planExpiresAt);
  const expB = parseExpiryMillis(input.premiumExpiresAt);
  const expiryMs =
    expA !== null && expB !== null ? Math.max(expA, expB) : expA !== null ? expA : expB;
  const isExpired = expiryMs !== null && expiryMs <= nowMs;
  const isPrem = Boolean(
    input.isPremium ||
      input.plan === 'pro' ||
      input.plan === 'pro_monthly' ||
      input.plan === 'pro_annual'
  );
  const personalPro = isPrem && !isExpired;

  // Check Crew shared Pro
  let crewProActive = false;
  let crewName: string | undefined;
  if (input.inCrew && input.crew) {
    const crewData = input.crew;
    const isPaidLargeCrew = crewData.tier === 'paid' && isCrewPaidActive(crewData.paid_until, nowMs);
    const legacySharing =
      crewData.isProShared !== false &&
      (crewData.hasProMember === true ||
        (Array.isArray(crewData.members) &&
          crewData.members.some(
            (m) => (m.isPro === true || m.plan === 'pro') && (!input.uid || m.uid !== input.uid || personalPro)
          )));
    if (isPaidLargeCrew || legacySharing) {
      crewProActive = true;
      crewName = crewData.name || 'Study Crew';
    }
  }

  const unifiedStatus = resolveUnifiedPlanStatus({
    uid: input.uid,
    email: input.email,
    role: input.role,
    isGuest: input.isGuest,
    plan: input.plan,
    isPremium: input.isPremium,
    proPlanId: input.proPlanId,
    planStartedAt: input.planStartedAt,
    updatedAt: input.updatedAt,
    planExpiresAt: input.planExpiresAt,
    premiumExpiresAt: input.premiumExpiresAt,
    pendingRequests: input.pendingRequests,
    isCrewPro: crewProActive,
    crewName: crewName || null,
    isSuperAdmin: isSuper,
    nowMs,
  });

  // 1. Superadmin ALWAYS has Pro / Unlimited everywhere with zero exceptions
  if (isSuper) {
    return {
      isPro: true,
      isUnlimited: true,
      isSuperAdmin: true,
      source: 'superadmin',
      plan: 'pro',
      loading: false,
      status: 'ready',
      error: null,
      planStatus: unifiedStatus,
      refreshPlanStatus: noopRefresh,
    };
  }

  // 2. Personal Pro active
  if (unifiedStatus.isPersonalPro) {
    return {
      isPro: true,
      isUnlimited: true,
      isSuperAdmin: false,
      source: 'personal',
      plan: 'pro',
      loading: false,
      status: 'ready',
      error: null,
      planStatus: unifiedStatus,
      refreshPlanStatus: noopRefresh,
    };
  }

  // 3. Crew shared Pro
  if (crewProActive) {
    return {
      isPro: true,
      isUnlimited: true,
      isSuperAdmin: false,
      source: 'crew',
      plan: 'pro',
      crewName: crewName || 'Study Crew',
      loading: false,
      status: 'ready',
      error: null,
      planStatus: unifiedStatus,
      refreshPlanStatus: noopRefresh,
    };
  }

  // 4. Free starter (or pending verification)
  return {
    isPro: false,
    isUnlimited: false,
    isSuperAdmin: false,
    source: 'none',
    plan: 'free',
    loading: false,
    status: 'ready',
    error: null,
    planStatus: unifiedStatus,
    refreshPlanStatus: noopRefresh,
  };
}

interface SharedCrewEntry {
  data: PlanResolverInput['crew'];
  loading: boolean;
  error: string | null;
  subscribers: Set<() => void>;
  unsub: (() => void) | null;
}

const crewSubscriptionRegistry = new Map<string, SharedCrewEntry>();

interface SharedPaymentRequestsEntry {
  requests: Array<Record<string, any>>;
  serverTimeOffsetMs: number;
  loading: boolean;
  subscribers: Set<() => void>;
  unsub: (() => void) | null;
}

const paymentRequestsRegistry = new Map<string, SharedPaymentRequestsEntry>();

function notifyPaymentRequestsSubscribers(uid: string) {
  const entry = paymentRequestsRegistry.get(uid);
  if (!entry) return;
  for (const cb of entry.subscribers) {
    try {
      cb();
    } catch {
      // Ignore callback error
    }
  }
}

export async function forceRefreshPaymentRequests(uid?: string | null): Promise<void> {
  if (!uid || uid.startsWith('guest_')) return;
  const entry = paymentRequestsRegistry.get(uid);
  try {
    const q = query(collection(db, 'paymentRequests'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }));
    if (entry) {
      entry.requests = docs;
      entry.loading = false;
      notifyPaymentRequestsSubscribers(uid);
    }
  } catch {
    // Ignore transient Firestore error
  }

  // Also query server-authoritative /api/pro/status if authenticated
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const res = await fetch('/api/pro/status', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload && typeof payload.serverNowMs === 'number' && entry) {
        entry.serverTimeOffsetMs = payload.serverNowMs - Date.now();
        notifyPaymentRequestsSubscribers(uid);
      }
    }
  } catch {
    // Non-blocking if offline
  }
}

/**
 * Single source of truth hook for user's effective plan and purchase lock state.
 * Guarantees zero flicker for Superadmin, 3 states (loading, ready, error),
 * real-time listener on `users/{uid}` and `paymentRequests`, and automatic expiry transition.
 */
export function useEffectivePlan(): EffectivePlanResult {
  const { user: authUser, isGuest } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();

  const currentEmail = authUser?.email || auth.currentUser?.email || profile?.email;
  const currentUid = authUser?.uid || auth.currentUser?.uid || profile?.uid;
  const currentRole = profile?.role;

  const isSuper = isSuperAdminEmailOrRole(currentEmail, currentRole, currentUid);
  const crewId = profile?.crewId;
  const inCrew = Boolean(profile?.isCrewMember || crewId);

  const [crewState, setCrewState] = useState<{
    data: PlanResolverInput['crew'];
    loading: boolean;
    error: string | null;
  }>(() => {
    if (isSuper || !crewId) return { data: null, loading: false, error: null };
    const existing = crewSubscriptionRegistry.get(crewId);
    return existing
      ? { data: existing.data, loading: existing.loading, error: existing.error }
      : { data: null, loading: true, error: null };
  });

  const [, setPaymentTick] = useState(0);
  const [, setExpiryTick] = useState(0);

  // Real-time shared subscription to user's paymentRequests
  useEffect(() => {
    if (!currentUid || isGuest || currentUid.startsWith('guest_')) {
      return;
    }

    const onUpdate = () => {
      setPaymentTick((t) => t + 1);
    };

    let entry = paymentRequestsRegistry.get(currentUid);
    if (!entry) {
      entry = {
        requests: [],
        serverTimeOffsetMs: 0,
        loading: true,
        subscribers: new Set(),
        unsub: null,
      };
      paymentRequestsRegistry.set(currentUid, entry);

      const q = query(collection(db, 'paymentRequests'), where('userId', '==', currentUid));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const cur = paymentRequestsRegistry.get(currentUid);
          if (!cur) return;
          cur.requests = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Record<string, any>),
          }));
          cur.loading = false;
          notifyPaymentRequestsSubscribers(currentUid);
        },
        () => {
          const cur = paymentRequestsRegistry.get(currentUid);
          if (!cur) return;
          cur.loading = false;
          notifyPaymentRequestsSubscribers(currentUid);
        }
      );
      entry.unsub = unsub;
    }

    entry.subscribers.add(onUpdate);

    return () => {
      const cur = paymentRequestsRegistry.get(currentUid);
      if (!cur) return;
      cur.subscribers.delete(onUpdate);
      if (cur.subscribers.size === 0 && cur.unsub) {
        cur.unsub();
        cur.unsub = null;
        paymentRequestsRegistry.delete(currentUid);
      }
    };
  }, [currentUid, isGuest]);

  // Single shared listener to crew doc if user is in a crew and not Superadmin
  useEffect(() => {
    if (isSuper || !crewId) {
      setCrewState({ data: null, loading: false, error: null });
      return;
    }

    const onUpdate = () => {
      const entry = crewSubscriptionRegistry.get(crewId);
      if (entry) {
        setCrewState({ data: entry.data, loading: entry.loading, error: entry.error });
      }
    };

    let entry = crewSubscriptionRegistry.get(crewId);
    if (!entry) {
      entry = {
        data: null,
        loading: true,
        error: null,
        subscribers: new Set(),
        unsub: null,
      };
      crewSubscriptionRegistry.set(crewId, entry);

      const crewRef = doc(db, 'crews', crewId);
      const unsubCrew = onSnapshot(
        crewRef,
        (snap) => {
          const cur = crewSubscriptionRegistry.get(crewId);
          if (!cur) return;
          cur.data = snap.exists() ? (snap.data() as PlanResolverInput['crew']) : null;
          cur.loading = false;
          cur.error = null;
          for (const cb of cur.subscribers) {
            try {
              cb();
            } catch (notifyErr) {
              console.warn('[useEffectivePlan] subscriber notify error:', notifyErr);
            }
          }
        },
        (err) => {
          console.warn('[useEffectivePlan] Error reading crew plan:', err);
          const cur = crewSubscriptionRegistry.get(crewId);
          if (!cur) return;
          cur.error = err.message;
          cur.loading = false;
          for (const cb of cur.subscribers) {
            try {
              cb();
            } catch (notifyErr) {
              console.warn('[useEffectivePlan] subscriber notify error:', notifyErr);
            }
          }
        }
      );
      entry.unsub = unsubCrew;
    }

    entry.subscribers.add(onUpdate);
    setCrewState({ data: entry.data, loading: entry.loading, error: entry.error });

    return () => {
      const cur = crewSubscriptionRegistry.get(crewId);
      if (!cur) return;
      cur.subscribers.delete(onUpdate);
      if (cur.subscribers.size === 0 && cur.unsub) {
        cur.unsub();
        cur.unsub = null;
        crewSubscriptionRegistry.delete(crewId);
      }
    };
  }, [isSuper, crewId]);

  const refreshPlanStatus = useCallback(async () => {
    if (!currentUid || isGuest || currentUid.startsWith('guest_')) return;
    clearPlanCache(currentUid);
    await Promise.all([
      forceRefreshUserProfile(currentUid),
      forceRefreshPaymentRequests(currentUid),
    ]);
    setExpiryTick((t) => t + 1);
  }, [currentUid, isGuest]);

  const paymentEntry = currentUid ? paymentRequestsRegistry.get(currentUid) : undefined;
  const nowMs = Date.now() + (paymentEntry?.serverTimeOffsetMs || 0);

  // Automatic timer to transition plan status the exact moment an active plan expires
  const expA = parseExpiryMillis(profile?.planExpiresAt);
  const expB = parseExpiryMillis(profile?.premiumExpiresAt);
  const activeExpiryMs =
    expA !== null && expB !== null ? Math.max(expA, expB) : expA !== null ? expA : expB;

  useEffect(() => {
    if (!activeExpiryMs) return;
    const msUntilExpiry = activeExpiryMs - (Date.now() + (paymentEntry?.serverTimeOffsetMs || 0));
    if (msUntilExpiry <= 0) return;
    // Schedule an automatic re-evaluation when the plan expires (cap timer at 24h to avoid 32-bit overflow)
    const delay = Math.min(msUntilExpiry + 250, 24 * 60 * 60 * 1000);
    const timer = setTimeout(() => {
      setExpiryTick((t) => t + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [activeExpiryMs, paymentEntry?.serverTimeOffsetMs]);

  const { data: crewData, loading: crewLoading, error: crewError } = crewState;

  const resolved = resolveEffectivePlan({
    email: currentEmail,
    role: currentRole,
    uid: currentUid,
    isGuest: Boolean(isGuest || (currentUid && currentUid.startsWith('guest_'))),
    plan: profile?.plan,
    isPremium: profile?.isPremium,
    proPlanId: (profile as Record<string, any> | null)?.proPlanId,
    planStartedAt: (profile as Record<string, any> | null)?.planStartedAt,
    updatedAt: profile?.updatedAt,
    planExpiresAt: profile?.planExpiresAt,
    premiumExpiresAt: profile?.premiumExpiresAt,
    pendingRequests: paymentEntry?.requests || [],
    crew: crewData,
    inCrew,
    nowMs,
  });

  const withRefresh: EffectivePlanResult = {
    ...resolved,
    refreshPlanStatus,
  };

  if (isSuper) {
    if (currentUid) planMemoryCache.set(currentUid, withRefresh);
    return withRefresh;
  }

  const isLoading = profileLoading || (inCrew && crewLoading && !crewData);

  if (isLoading && currentUid && planMemoryCache.has(currentUid)) {
    const cached = planMemoryCache.get(currentUid)!;
    return {
      ...cached,
      loading: true,
      status: 'loading',
      refreshPlanStatus,
    };
  }

  if (isLoading) {
    return {
      ...withRefresh,
      isPro: false,
      isUnlimited: false,
      isSuperAdmin: false,
      source: 'none',
      plan: 'free',
      loading: true,
      status: 'loading',
      error: null,
    };
  }

  if (profileError || crewError) {
    return {
      ...withRefresh,
      loading: false,
      status: 'error',
      error: profileError?.message || crewError || 'Failed to resolve plan',
    };
  }

  if (currentUid) {
    planMemoryCache.set(currentUid, withRefresh);
  }

  return withRefresh;
}

export default useEffectivePlan;

