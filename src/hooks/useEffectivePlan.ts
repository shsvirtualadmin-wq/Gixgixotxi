import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from './useUserProfile';

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
}

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

const planMemoryCache = new Map<string, EffectivePlanResult>();

export function clearPlanCache(uid?: string) {
  if (uid) {
    planMemoryCache.delete(uid);
  } else {
    planMemoryCache.clear();
  }
}

export interface PlanResolverInput {
  email?: string | null;
  role?: string | null;
  uid?: string | null;
  plan?: string | null;
  isPremium?: boolean | null;
  planExpiresAt?: unknown;
  premiumExpiresAt?: unknown;
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

export function isCrewPaidActive(paidUntil?: string | null): boolean {
  if (!paidUntil) return false;
  const d = new Date(paidUntil);
  return !isNaN(d.getTime()) && d.getTime() > Date.now();
}

export function resolveEffectivePlan(input: PlanResolverInput): EffectivePlanResult {
  const isSuper = isSuperAdminEmailOrRole(input.email, input.role, input.uid);

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
    };
  }

  const rawPlan = input.plan;
  const isPrem = Boolean(input.isPremium || rawPlan === 'pro');
  const expiryRaw = input.planExpiresAt || input.premiumExpiresAt;

  let isExpired = false;
  if (expiryRaw) {
    let expiryMs: number | null = null;
    if (typeof (expiryRaw as { toMillis?: () => number }).toMillis === 'function') {
      expiryMs = (expiryRaw as { toMillis: () => number }).toMillis();
    } else if (typeof (expiryRaw as { seconds?: number }).seconds === 'number') {
      expiryMs = (expiryRaw as { seconds: number }).seconds * 1000;
    } else if (typeof expiryRaw === 'number') {
      expiryMs = expiryRaw;
    } else if (typeof expiryRaw === 'string') {
      const parsed = new Date(expiryRaw).getTime();
      if (!isNaN(parsed)) expiryMs = parsed;
    }

    if (expiryMs !== null && !isNaN(expiryMs) && Date.now() > expiryMs) {
      isExpired = true;
    }
  }

  const personalPro = isPrem && !isExpired;

  if (personalPro) {
    return {
      isPro: true,
      isUnlimited: true,
      isSuperAdmin: false,
      source: 'personal',
      plan: 'pro',
      loading: false,
      status: 'ready',
      error: null,
    };
  }

  if (input.inCrew && input.crew) {
    const crewData = input.crew;
    const isPaidLargeCrew = crewData.tier === 'paid' && isCrewPaidActive(crewData.paid_until);
    const legacySharing =
      crewData.isProShared !== false &&
      (crewData.hasProMember === true ||
        (Array.isArray(crewData.members) &&
          crewData.members.some(
            (m) => (m.isPro === true || m.plan === 'pro') && (!input.uid || m.uid !== input.uid || isPrem)
          )));

    if (isPaidLargeCrew || legacySharing) {
      return {
        isPro: true,
        isUnlimited: true,
        isSuperAdmin: false,
        source: 'crew',
        plan: 'pro',
        crewName: crewData.name || 'Study Crew',
        loading: false,
        status: 'ready',
        error: null,
      };
    }
  }

  return {
    isPro: false,
    isUnlimited: false,
    isSuperAdmin: false,
    source: 'none',
    plan: 'free',
    loading: false,
    status: 'ready',
    error: null,
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

export function useEffectivePlan(): EffectivePlanResult {
  const { user: authUser } = useAuth();
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

      api
        .get<{ crew?: PlanResolverInput['crew'] }>(`/api/crews/mine`, { silentToast: true })
        .then((res) => {
          const cur = crewSubscriptionRegistry.get(crewId);
          if (!cur) return;
          cur.data = res?.crew || null;
          cur.loading = false;
          cur.error = null;
          for (const cb of cur.subscribers) {
            try {
              cb();
            } catch {
              // ignore
            }
          }
        })
        .catch((err) => {
          const cur = crewSubscriptionRegistry.get(crewId);
          if (!cur) return;
          cur.error = err?.message || 'Failed to read crew plan';
          cur.loading = false;
          for (const cb of cur.subscribers) {
            try {
              cb();
            } catch {
              // ignore
            }
          }
        });
    }

    entry.subscribers.add(onUpdate);
    setCrewState({ data: entry.data, loading: entry.loading, error: entry.error });

    return () => {
      const cur = crewSubscriptionRegistry.get(crewId);
      if (!cur) return;
      cur.subscribers.delete(onUpdate);
    };
  }, [isSuper, crewId]);

  const { data: crewData, loading: crewLoading, error: crewError } = crewState;

  if (isSuper) {
    const superResult: EffectivePlanResult = {
      isPro: true,
      isUnlimited: true,
      isSuperAdmin: true,
      source: 'superadmin',
      plan: 'pro',
      loading: false,
      status: 'ready',
      error: null,
    };
    if (currentUid) planMemoryCache.set(currentUid, superResult);
    return superResult;
  }

  const isLoading = profileLoading || (inCrew && crewLoading && !crewData);

  if (isLoading && currentUid && planMemoryCache.has(currentUid)) {
    const cached = planMemoryCache.get(currentUid)!;
    return {
      ...cached,
      loading: true,
      status: 'loading',
    };
  }

  if (isLoading) {
    return {
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
      isPro: false,
      isUnlimited: false,
      isSuperAdmin: false,
      source: 'none',
      plan: 'free',
      loading: false,
      status: 'error',
      error: profileError?.message || crewError || 'Failed to resolve plan',
    };
  }

  const resolved = resolveEffectivePlan({
    email: currentEmail,
    role: currentRole,
    uid: currentUid,
    plan: profile?.plan,
    isPremium: profile?.isPremium,
    planExpiresAt: profile?.planExpiresAt,
    premiumExpiresAt: profile?.premiumExpiresAt,
    crew: crewData,
    inCrew,
  });

  if (currentUid) {
    planMemoryCache.set(currentUid, resolved);
  }

  return resolved;
}

export default useEffectivePlan;
