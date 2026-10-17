import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from './useUserProfile';
import { debugTracker } from '@/utils/debugTracker';

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

// ── Superadmin Identity Checker ─────────────────────────────────────────────
export const SUPER_ADMIN_EMAILS = ['shsvirtualadmin@gmail.com', 'support@boardly.cfd'];
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

// ── Pure Plan Resolver (used by hook and by /admin/health pure logic tests) ──
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
    };
  }

  // 2. Personal Plan check with Expiration Guard
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

  // 3. Crew shared Pro check (only if user is actually in crew)
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

  // 4. Free starter
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

/**
 * Single source of truth hook for user's effective plan.
 * Guarantees zero flicker for Superadmin, 3 states (loading, ready, error),
 * and in-memory plan caching per uid.
 */
export function useEffectivePlan(): EffectivePlanResult {
  const { user: authUser } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();
  const [crewData, setCrewData] = useState<PlanResolverInput['crew']>(null);
  const [crewLoading, setCrewLoading] = useState(false);
  const [crewError, setCrewError] = useState<string | null>(null);

  // Immediate synchronous Superadmin resolution before ANY Firestore load
  const currentEmail = authUser?.email || auth.currentUser?.email || profile?.email;
  const currentUid = authUser?.uid || auth.currentUser?.uid || profile?.uid;
  const currentRole = profile?.role;

  const isSuper = isSuperAdminEmailOrRole(currentEmail, currentRole, currentUid);
  const crewId = profile?.crewId;
  const inCrew = Boolean(profile?.isCrewMember || crewId);

  // Listen to crew doc if user is in a crew and not personally Pro
  useEffect(() => {
    if (isSuper || !crewId) {
      setCrewData(null);
      setCrewLoading(false);
      setCrewError(null);
      return;
    }

    setCrewLoading(true);
    setCrewError(null);
    const crewRef = doc(db, 'crews', crewId);

    const unsubscribe = onSnapshot(
      crewRef,
      (snap) => {
        if (snap.exists()) {
          setCrewData(snap.data() as PlanResolverInput['crew']);
        } else {
          setCrewData(null);
        }
        setCrewLoading(false);
      },
      (err) => {
        console.warn('[useEffectivePlan] Error reading crew plan:', err);
        setCrewError(err.message);
        setCrewLoading(false);
        debugTracker.recordPlanLog({
          action: 'read_crew_plan',
          status: err.code === 'permission-denied' ? 'permission_denied' : 'error',
          errorCode: err.code,
          details: err.message,
        });
      }
    );

    return () => unsubscribe();
  }, [isSuper, crewId]);

  // Immediate synchronous Superadmin resolution before ANY Firestore load
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

  // If loading and we have a cached plan for this UID, return cached plan with status: 'loading'
  if (isLoading && currentUid && planMemoryCache.has(currentUid)) {
    const cached = planMemoryCache.get(currentUid)!;
    return {
      ...cached,
      loading: true,
      status: 'loading',
    };
  }

  // Neutral loading state placeholder (never defaults to free while loading)
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
