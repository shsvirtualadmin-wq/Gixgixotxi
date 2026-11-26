import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, forceRefreshUserProfile } from './useUserProfile';
import { usePlansConfig } from './usePlansConfig';
import {
  resolveUnifiedPlanStatus,
  parseExpiryMillis,
  type UnifiedPlanStatusResult,
} from '@/config/plans';
import {
  getPlan,
  planRank,
  resolveEffectiveCrewPlan,
  type PlanTier,
  type PlansConfigDoc,
} from '@/lib/planTier';

export interface EffectivePlanResult {
  /** True for Pro, Plus, Crew Pro/Plus, and Superadmin (equivalent to hasAtLeast('pro')) */
  isPro: boolean;
  /** True strictly for Plus, Crew Plus, and Superadmin (equivalent to plusAndAbove) */
  isPlus: boolean;
  /** True for any paid plan (Pro or Plus, personal or crew, or Superadmin) */
  isPaid: boolean;
  isUnlimited: boolean;
  isSuperAdmin: boolean;
  source: 'superadmin' | 'personal' | 'crew' | 'none';
  plan: PlanTier;
  planTier: PlanTier;
  /** Canonical human-readable plan label aligned with Settings/Plans ('Plus Unlimited' | 'Boardly Pro' | 'Free') */
  planLabel: string;
  crewPlanTier: PlanTier;
  crewName?: string;
  loading: boolean;
  status: 'loading' | 'ready' | 'error';
  error?: string | null;
  planStatus: UnifiedPlanStatusResult;
  refreshPlanStatus: () => Promise<void>;
  paymentRequests?: any[];
  hasAtLeast: (required: PlanTier) => boolean;
  plusAndAbove: boolean;
}

// ── Superadmin Identity Checker (Strictly from verified Firebase Auth custom claims) ──
export const SUPER_ADMIN_EMAILS: string[] = [];
export const SUPER_ADMIN_UID = '';
export const SUPER_ADMIN_UIDS: string[] = [];

export function isSuperAdminEmailOrRole(
  _email?: string | null,
  _role?: string | null,
  _uid?: string | null,
  isSuperAdminClaim?: boolean
): boolean {
  return isSuperAdminClaim === true;
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

// ── Pure Plan Resolver (used by hook and by /admin/health & unit tests) ──
export interface PlanResolverInput {
  email?: string | null;
  role?: string | null;
  uid?: string | null;
  isGuest?: boolean;
  plan?: string | null;
  planTier?: string | null;
  isPro?: boolean | null;
  isPlus?: boolean | null;
  isPremium?: boolean | null;
  proPlanId?: string | null;
  plusPlanId?: string | null;
  planStartedAt?: unknown;
  updatedAt?: unknown;
  proUntil?: unknown;
  plusUntil?: unknown;
  planExpiresAt?: unknown;
  premiumExpiresAt?: unknown;
  pendingRequests?: Array<Record<string, any>> | null;
  plansConfig?: Partial<PlansConfigDoc> | null;
  nowMs?: number;
  crew?: {
    tier?: 'free' | 'paid' | string;
    paid_until?: string | null;
    hasProMember?: boolean;
    hasPlusMember?: boolean;
    effectivePlan?: string | null;
    isProShared?: boolean;
    name?: string;
    members?: Array<{
      uid?: string;
      isPro?: boolean;
      isPlus?: boolean;
      isPremium?: boolean;
      plan?: string;
      planTier?: string;
      plusUntil?: unknown;
      planExpiresAt?: unknown;
      premiumExpiresAt?: unknown;
    }>;
  } | null;
  inCrew?: boolean;
  isSuperAdminClaim?: boolean;
}

export function isCrewPaidActive(paidUntil?: string | null, nowMs: number = Date.now()): boolean {
  if (!paidUntil) return false;
  const d = new Date(paidUntil);
  return !isNaN(d.getTime()) && d.getTime() > nowMs;
}

const noopRefresh = async () => {};

export function formatEffectivePlanLabel(tier: PlanTier, isSuperAdmin: boolean): string {
  if (isSuperAdmin || tier === 'plus') return 'Plus Unlimited';
  if (tier === 'pro') return 'Boardly Pro';
  return 'Free';
}

function makeResult(
  tier: PlanTier,
  source: EffectivePlanResult['source'],
  isSuperAdmin: boolean,
  crewPlanTier: PlanTier,
  crewName: string | undefined,
  planStatus: UnifiedPlanStatusResult
): EffectivePlanResult {
  const isPaidVal = planRank(tier) >= 1;
  const isPlusVal = planRank(tier) >= 2;
  return {
    isPro: isPaidVal,
    isPlus: isPlusVal,
    isPaid: isPaidVal,
    isUnlimited: isPaidVal,
    isSuperAdmin,
    source,
    plan: tier,
    planTier: tier,
    planLabel: formatEffectivePlanLabel(tier, isSuperAdmin),
    crewPlanTier,
    crewName,
    loading: false,
    status: 'ready',
    error: null,
    planStatus,
    refreshPlanStatus: noopRefresh,
    hasAtLeast: (required: PlanTier) => planRank(tier) >= planRank(required),
    plusAndAbove: isPlusVal,
  };
}

export function resolveEffectivePlan(input: PlanResolverInput): EffectivePlanResult {
  const nowMs =
    typeof input.nowMs === 'number' && Number.isFinite(input.nowMs) ? input.nowMs : Date.now();
  const isSuper = isSuperAdminEmailOrRole(
    input.email,
    input.role,
    input.uid,
    input.isSuperAdminClaim
  );

  // Personal plan tier (without superadmin override)
  const personalPlan: PlanTier = getPlan(
    {
      uid: input.uid,
      email: input.email,
      role: 'student',
      isGuest: input.isGuest,
      isSuperAdmin: false,
      isSuperAdminClaim: false,
      plan: input.plan,
      planTier: input.planTier,
      isPro: input.isPro,
      isPlus: input.isPlus,
      isPremium: input.isPremium,
      proPlanId: input.proPlanId,
      plusPlanId: input.plusPlanId,
      proUntil: input.proUntil,
      plusUntil: input.plusUntil,
      planExpiresAt: input.planExpiresAt,
      premiumExpiresAt: input.premiumExpiresAt,
    },
    nowMs
  );

  // Check Crew effective highest plan (Free < Pro < Plus)
  let crewPlanTier: PlanTier = 'free';
  let crewName: string | undefined;
  if (input.inCrew && input.crew) {
    crewPlanTier = resolveEffectiveCrewPlan(input.crew, nowMs, {
      excludeSelfUid: input.uid,
      selfPersonalPlan: personalPlan,
    });
    if (planRank(crewPlanTier) >= 1) {
      crewName = input.crew.name || 'Study Crew';
    }
  }

  const unifiedStatus = resolveUnifiedPlanStatus({
    uid: input.uid,
    email: input.email,
    role: input.role,
    isGuest: input.isGuest,
    plan: input.plan,
    planTier: input.planTier,
    isPro: input.isPro,
    isPlus: input.isPlus,
    isPremium: input.isPremium,
    proPlanId: input.proPlanId,
    plusPlanId: input.plusPlanId,
    planStartedAt: input.planStartedAt,
    updatedAt: input.updatedAt,
    proUntil: input.proUntil,
    plusUntil: input.plusUntil,
    planExpiresAt: input.planExpiresAt,
    premiumExpiresAt: input.premiumExpiresAt,
    pendingRequests: input.pendingRequests,
    isCrewPro: planRank(crewPlanTier) >= 1,
    isCrewPlus: crewPlanTier === 'plus',
    crewPlanTier,
    crewName: crewName || null,
    isSuperAdmin: isSuper,
    plansConfig: input.plansConfig,
    nowMs,
  });

  // 1. Superadmin ALWAYS has Plus / highest access everywhere
  if (isSuper) {
    return makeResult('plus', 'superadmin', true, crewPlanTier, crewName, unifiedStatus);
  }

  // 2. Compare personal plan vs crew plan -> highest wins
  if (planRank(personalPlan) >= planRank(crewPlanTier) && planRank(personalPlan) >= 1) {
    return makeResult(personalPlan, 'personal', false, crewPlanTier, crewName, unifiedStatus);
  }

  if (planRank(crewPlanTier) >= 1) {
    return makeResult(
      crewPlanTier,
      'crew',
      false,
      crewPlanTier,
      crewName || 'Study Crew',
      unifiedStatus
    );
  }

  // 3. Free starter (or expired Pro/Plus)
  return makeResult('free', 'none', false, 'free', undefined, unifiedStatus);
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

export function teardownEffectivePlanListeners(): void {
  for (const [, entry] of paymentRequestsRegistry) {
    if (entry.unsub) {
      try {
        entry.unsub();
      } catch {
        // Ignore
      }
      entry.unsub = null;
    }
  }
  paymentRequestsRegistry.clear();

  for (const [, entry] of crewSubscriptionRegistry) {
    if (entry.unsub) {
      try {
        entry.unsub();
      } catch {
        // Ignore
      }
      entry.unsub = null;
    }
  }
  crewSubscriptionRegistry.clear();
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
 * Single source of truth hook for user's effective plan (Free < Pro < Plus) and purchase lock state.
 */
export function useEffectivePlan(): EffectivePlanResult {
  const { user: authUser, isGuest, isSuperAdmin: authIsSuperAdmin } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();
  const { config: plansConfig } = usePlansConfig();

  const currentEmail = authUser?.email || auth.currentUser?.email || profile?.email;
  const currentUid = authUser?.uid || auth.currentUser?.uid || profile?.uid;
  const currentRole = profile?.role;

  const isSuper = Boolean(authIsSuperAdmin);
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

  const { data: crewData, loading: crewLoading, error: crewError } = crewState;

  // Automatic timer to transition plan status the exact moment an active personal or crew plan expires
  const rawProfile = profile as Record<string, any> | null;
  const crewExpCandidates: Array<number | null> = [];
  if (crewData) {
    crewExpCandidates.push(parseExpiryMillis(crewData.paid_until));
    if (Array.isArray(crewData.members)) {
      for (const m of crewData.members) {
        if (!m) continue;
        crewExpCandidates.push(
          parseExpiryMillis(m.plusUntil),
          parseExpiryMillis((m as Record<string, unknown>).proUntil),
          parseExpiryMillis(m.planExpiresAt),
          parseExpiryMillis(m.premiumExpiresAt)
        );
      }
    }
  }
  const expCandidates = [
    parseExpiryMillis(rawProfile?.plusUntil),
    parseExpiryMillis(rawProfile?.planExpiresAt),
    parseExpiryMillis(rawProfile?.premiumExpiresAt),
    parseExpiryMillis(rawProfile?.proUntil),
    ...crewExpCandidates,
  ].filter((v): v is number => v !== null && v > nowMs);
  const nextExpiryMs = expCandidates.length > 0 ? Math.min(...expCandidates) : null;

  useEffect(() => {
    if (!nextExpiryMs) return;
    const msUntilExpiry = nextExpiryMs - (Date.now() + (paymentEntry?.serverTimeOffsetMs || 0));
    if (msUntilExpiry <= 0) return;
    const delay = Math.min(msUntilExpiry + 250, 24 * 60 * 60 * 1000);
    const timer = setTimeout(() => {
      setExpiryTick((t) => t + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [nextExpiryMs, paymentEntry?.serverTimeOffsetMs]);

  const resolved = resolveEffectivePlan({
    email: currentEmail,
    role: currentRole,
    uid: currentUid,
    isGuest: Boolean(isGuest || (currentUid && currentUid.startsWith('guest_'))),
    plan: profile?.plan,
    planTier: rawProfile?.planTier,
    isPro: rawProfile?.isPro,
    isPlus: rawProfile?.isPlus,
    isPremium: profile?.isPremium,
    proPlanId: rawProfile?.proPlanId,
    plusPlanId: rawProfile?.plusPlanId,
    planStartedAt: rawProfile?.planStartedAt,
    updatedAt: profile?.updatedAt,
    proUntil: rawProfile?.proUntil,
    plusUntil: rawProfile?.plusUntil,
    planExpiresAt: profile?.planExpiresAt,
    premiumExpiresAt: profile?.premiumExpiresAt,
    pendingRequests: paymentEntry?.requests || [],
    plansConfig,
    crew: crewData,
    inCrew,
    nowMs,
    isSuperAdminClaim: isSuper,
  });

  const withRefresh: EffectivePlanResult = {
    ...resolved,
    paymentRequests: paymentEntry?.requests || [],
    refreshPlanStatus,
  };

  if (isSuper) {
    if (currentUid) planMemoryCache.set(currentUid, withRefresh);
    return withRefresh;
  }

  const isLoading = profileLoading || (inCrew && crewLoading && !crewData);

  if (isLoading) {
    return {
      ...withRefresh,
      isPro: false,
      isPlus: false,
      isPaid: false,
      isUnlimited: false,
      isSuperAdmin: false,
      plusAndAbove: false,
      source: 'none',
      plan: 'free',
      planTier: 'free',
      planLabel: 'Free',
      crewPlanTier: 'free',
      loading: true,
      status: 'loading',
      error: null,
      hasAtLeast: (req: PlanTier) => req === 'free',
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
