import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import type { PlanTier } from '@/lib/planTier';

const STORAGE_KEY_PREFIX = 'boardly_ad_free_';
const AD_FREE_EVENT = 'boardly:ad-free-changed';

// Module-level reactive store so toggling Ad-free in Settings updates EVERY
// mounted ad component in the same React render tick without a page reload.
const inMemoryAdFreeOverrides = new Map<string, { value: boolean; updatedAt: number }>();
const OVERRIDE_SETTLE_MS = 4000;
const storeListeners = new Set<() => void>();
let storeVersion = 0;

function emitStoreChange(): void {
  storeVersion += 1;
  for (const listener of storeListeners) {
    try {
      listener();
    } catch {
      // Ignore individual subscriber errors
    }
  }
}

let adFreeWindowListenersAttached = false;

function handleAdFreeStorageEvent(e: StorageEvent): void {
  if (!e.key || !e.key.startsWith(STORAGE_KEY_PREFIX)) return;
  const uid = e.key.slice(STORAGE_KEY_PREFIX.length);
  if (!uid) return;
  if (e.newValue === '1') {
    inMemoryAdFreeOverrides.set(uid, { value: true, updatedAt: Date.now() });
  } else if (e.newValue === '0') {
    inMemoryAdFreeOverrides.set(uid, { value: false, updatedAt: Date.now() });
  } else {
    inMemoryAdFreeOverrides.delete(uid);
  }
  emitStoreChange();
}

function handleAdFreeCustomEvent(e: Event): void {
  const detail = (e as CustomEvent<{ uid?: string; adFreeEnabled?: boolean }>).detail;
  if (detail?.uid && typeof detail.adFreeEnabled === 'boolean') {
    const existing = inMemoryAdFreeOverrides.get(detail.uid);
    if (!existing || existing.value !== detail.adFreeEnabled) {
      inMemoryAdFreeOverrides.set(detail.uid, {
        value: detail.adFreeEnabled,
        updatedAt: Date.now(),
      });
      emitStoreChange();
    }
  }
}

function attachAdFreeWindowListeners(): void {
  if (typeof window === 'undefined' || adFreeWindowListenersAttached) return;
  adFreeWindowListenersAttached = true;
  window.addEventListener('storage', handleAdFreeStorageEvent);
  window.addEventListener(AD_FREE_EVENT, handleAdFreeCustomEvent);
}

function detachAdFreeWindowListeners(): void {
  if (typeof window === 'undefined' || !adFreeWindowListenersAttached) return;
  adFreeWindowListenersAttached = false;
  window.removeEventListener('storage', handleAdFreeStorageEvent);
  window.removeEventListener(AD_FREE_EVENT, handleAdFreeCustomEvent);
}

function subscribeAdFreeStore(listener: () => void): () => void {
  if (storeListeners.size === 0) {
    attachAdFreeWindowListeners();
  }
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
    if (storeListeners.size === 0) {
      detachAdFreeWindowListeners();
    }
  };
}

function getAdFreeStoreVersion(): number {
  return storeVersion;
}

/**
 * Safely reads the per-UID cached ad-free preference from localStorage.
 */
export function readCachedAdFreePreference(uid?: string | null): boolean | null {
  if (!uid || uid.startsWith('guest_') || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${uid}`);
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false') return false;
  } catch {
    // Ignore storage read errors
  }
  return null;
}

/**
 * Immediately updates the user's ad-free preference in memory + localStorage
 * and synchronously notifies all mounted ad components and Settings switches.
 */
export function setUserAdFreePreference(uid: string, enabled: boolean): void {
  if (!uid || uid.startsWith('guest_')) return;
  inMemoryAdFreeOverrides.set(uid, { value: enabled, updatedAt: Date.now() });
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${uid}`, enabled ? '1' : '0');
      window.dispatchEvent(
        new CustomEvent(AD_FREE_EVENT, {
          detail: { uid, adFreeEnabled: enabled },
        })
      );
    }
  } catch {
    // Ignore storage/event errors
  }
  emitStoreChange();
}

/**
 * Clears in-memory optimistic override (e.g. on sign-out).
 */
export function clearUserAdFreeOverride(uid?: string | null): void {
  if (uid) {
    if (inMemoryAdFreeOverrides.delete(uid)) {
      emitStoreChange();
    }
  } else if (inMemoryAdFreeOverrides.size > 0) {
    inMemoryAdFreeOverrides.clear();
    emitStoreChange();
  }
}

export interface ShowAdsState {
  /**
   * True ONLY when ads are allowed to render for this viewer:
   * - False while auth, profile, or plan status is still loading (prevents flashing ads to Pro/Plus users).
   * - False for active Pro/Plus members with Ad-free ON.
   * - True for active Pro/Plus members with Ad-free OFF.
   * - True for free users, guests ("Continue without an account"), and logged-out visitors.
   */
  showAds: boolean;
  /** True while auth, profile, or effective plan (including Crew) is still resolving */
  loading: boolean;
  /** True strictly for signed-in non-guest active Pro or Plus members */
  isPaidMember: boolean;
  /** Effective Ad-free toggle value (meaningful for Pro/Plus; false for free/guest/logged-out) */
  adFreeEnabled: boolean;
  /** True strictly when viewer is an active Pro/Plus member with Ad-free ON */
  isPaidAdFree: boolean;
  /** Current resolved plan tier */
  plan: PlanTier;
  /** Plan source from useEffectivePlan */
  planSource: 'superadmin' | 'personal' | 'crew' | 'none';
  /** True when viewer is signed in with a non-guest account */
  isSignedInNonGuest: boolean;
}

/**
 * Single source of truth hook deciding whether ANY ad (BoardlyAd, RotatingBoardlyAd,
 * TopAnnouncementStrip, HeroPosterCarousel, PromoBanner, or Google AdSlot) may render
 * or load ad scripts for the current viewer.
 */
export function useShowAds(): ShowAdsState {
  // Subscribe synchronously to live toggle changes across the app & browser tabs
  useSyncExternalStore(subscribeAdFreeStore, getAdFreeStoreVersion, getAdFreeStoreVersion);

  const { user, profile: authProfile, profileLoading: authProfileLoading, isGuest } = useAuth();
  const { profile: liveProfile, loading: liveProfileLoading } = useUserProfile();
  const { isPaid, loading: planLoading, plan, source: planSource } = useEffectivePlan();

  const uid = user?.uid || null;
  const isSignedInNonGuest = Boolean(uid && !isGuest && !uid.startsWith('guest_'));

  // Keep per-UID localStorage cache synced whenever Firestore delivers a confirmed boolean
  const liveFirestoreAdFree =
    isSignedInNonGuest && liveProfile?.uid === uid && typeof liveProfile.adFreeEnabled === 'boolean'
      ? liveProfile.adFreeEnabled
      : null;

  const authFirestoreAdFree =
    isSignedInNonGuest && authProfile?.uid === uid && typeof authProfile.adFreeEnabled === 'boolean'
      ? authProfile.adFreeEnabled
      : null;

  const firestoreAdFree = liveFirestoreAdFree !== null ? liveFirestoreAdFree : authFirestoreAdFree;

  useEffect(() => {
    if (!uid || !isSignedInNonGuest || firestoreAdFree === null) return;
    const activeOverride = inMemoryAdFreeOverrides.get(uid);
    if (activeOverride) {
      const elapsed = Date.now() - activeOverride.updatedAt;
      if (elapsed < OVERRIDE_SETTLE_MS) {
        return;
      }
      if (activeOverride.value === firestoreAdFree) {
        inMemoryAdFreeOverrides.delete(uid);
      } else {
        return;
      }
    }
    try {
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${uid}`, firestoreAdFree ? '1' : '0');
    } catch {
      // Ignore storage errors
    }
  }, [uid, isSignedInNonGuest, firestoreAdFree]);

  // Clear stale overrides when signing out
  useEffect(() => {
    if (!authProfileLoading && !isSignedInNonGuest) {
      clearUserAdFreeOverride();
    }
  }, [authProfileLoading, isSignedInNonGuest]);

  // Resolve using pure shared decision helper
  const activeOverride = uid ? inMemoryAdFreeOverrides.get(uid) : undefined;
  const cachedAdFree = uid && isSignedInNonGuest ? readCachedAdFreePreference(uid) : null;

  const decision = resolveShowAdsDecision({
    authProfileLoading,
    liveProfileLoading,
    planLoading,
    isSignedInNonGuest,
    isPaid,
    plan,
    inMemoryOverride: activeOverride ? activeOverride.value : null,
    firestoreAdFree,
    cachedAdFree,
  });

  return {
    ...decision,
    plan,
    planSource,
    isSignedInNonGuest,
  };
}

export interface ResolveShowAdsInput {
  authProfileLoading: boolean;
  liveProfileLoading: boolean;
  planLoading: boolean;
  isSignedInNonGuest: boolean;
  isPaid: boolean;
  plan: PlanTier;
  inMemoryOverride: boolean | null;
  firestoreAdFree: boolean | null;
  cachedAdFree: boolean | null;
}

/**
 * Pure decision function for ad visibility across all user tiers and loading states.
 */
export function resolveShowAdsDecision(input: ResolveShowAdsInput): {
  showAds: boolean;
  loading: boolean;
  isPaidMember: boolean;
  adFreeEnabled: boolean;
  isPaidAdFree: boolean;
} {
  // Wait for auth to finish resolving before showing ANY ads (prevents flashing ads to Pro/Plus users).
  // For signed-in non-guest users, also wait for live profile and effective plan (including Crew plan).
  const loading = Boolean(
    input.authProfileLoading ||
      (input.isSignedInNonGuest && (input.liveProfileLoading || input.planLoading))
  );

  // Strictly ONLY active Pro or Plus members (never logged-out, never guest, never loading, never free)
  const isPaidMember = Boolean(
    !loading &&
      input.isSignedInNonGuest &&
      input.isPaid &&
      (input.plan === 'pro' || input.plan === 'plus')
  );

  // Resolve Ad-free preference for Pro/Plus:
  // 1. Immediate live toggle override (same-tick reactivity)
  // 2. Live Firestore user doc value (synced across devices & full reloads)
  // 3. Per-UID localStorage cache
  // 4. Default ON (true) for Pro/Plus members
  let adFreeEnabled = false;
  if (isPaidMember) {
    if (typeof input.inMemoryOverride === 'boolean') {
      adFreeEnabled = input.inMemoryOverride;
    } else if (typeof input.firestoreAdFree === 'boolean') {
      adFreeEnabled = input.firestoreAdFree;
    } else if (typeof input.cachedAdFree === 'boolean') {
      adFreeEnabled = input.cachedAdFree;
    } else {
      adFreeEnabled = true;
    }
  }

  const isPaidAdFree = isPaidMember && adFreeEnabled;
  const showAds = !loading && !isPaidAdFree;

  return {
    showAds,
    loading,
    isPaidMember,
    adFreeEnabled,
    isPaidAdFree,
  };
}

export default useShowAds;
