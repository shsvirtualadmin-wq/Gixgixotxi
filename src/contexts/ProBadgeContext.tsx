import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getStoredGuestSessionToken } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { broadcastPublicProfileUpdate } from '@/services/publicProfileService';
import {
  DEFAULT_PRO_BADGE_DESIGN,
  DEFAULT_PRO_BADGE_SETTINGS,
  normalizeProBadgeDesign,
  validateProBadgePayload,
  type ProBadgeDesignId,
  type ProBadgeSettings,
} from '@/lib/proBadgeDesigns';
import { isValidPlusBadgeId, resolvePlusBadgeId } from '@/lib/plusBadgeDesigns';

const LS_KEY_GLOBAL = 'boardly_pro_badge_v1';
const getLsKeyForUser = (uid?: string | null) =>
  uid ? `boardly_pro_badge_v1_${uid}` : LS_KEY_GLOBAL;

function resolveStoredPlusId(parsed: any): number | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(parsed, 'plus_badge_id')) {
    return parsed.plus_badge_id === null ? null : resolvePlusBadgeId(parsed.plus_badge_id);
  }
  if (Object.prototype.hasOwnProperty.call(parsed, 'plusBadgeId')) {
    return parsed.plusBadgeId === null ? null : resolvePlusBadgeId(parsed.plusBadgeId);
  }
  if (typeof parsed.design === 'string') {
    return resolvePlusBadgeId(parsed.design);
  }
  return null;
}

function readSettingsFromLocalStorage(uid?: string | null): {
  settings: ProBadgeSettings;
  hasCached: boolean;
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !uid) {
      return { settings: { ...DEFAULT_PRO_BADGE_SETTINGS, plusBadgeId: null }, hasCached: false };
    }
    const rawUser = window.localStorage.getItem(getLsKeyForUser(uid));
    if (!rawUser) {
      return { settings: { ...DEFAULT_PRO_BADGE_SETTINGS, plusBadgeId: null }, hasCached: false };
    }
    const parsed = JSON.parse(rawUser);
    const check = validateProBadgePayload(parsed);
    if (check.valid && check.value) {
      return {
        settings: {
          design: check.value.design,
          plusBadgeId: resolveStoredPlusId(parsed),
          visible: check.value.visible,
        },
        hasCached: true,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { settings: { ...DEFAULT_PRO_BADGE_SETTINGS, plusBadgeId: null }, hasCached: false };
}

function writeSettingsToLocalStorage(settings: ProBadgeSettings, uid?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !uid) return;
    const serialized = JSON.stringify({
      design: settings.design,
      plusBadgeId: settings.plusBadgeId ?? null,
      plus_badge_id: settings.plusBadgeId ?? null,
      visible: settings.visible,
    });
    window.localStorage.setItem(getLsKeyForUser(uid), serialized);
  } catch {
    // Ignore storage errors
  }
}

export function clearProBadgeCacheForUid(uid?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(LS_KEY_GLOBAL);
    if (uid) {
      window.localStorage.removeItem(getLsKeyForUser(uid));
    }
  } catch {
    // Ignore storage errors
  }
}

async function buildProBadgeAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    if (!auth.currentUser && typeof auth.authStateReady === 'function') {
      await auth.authStateReady();
    }
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } else {
      const guestToken = getStoredGuestSessionToken();
      if (guestToken) {
        headers['X-Guest-Session'] = guestToken;
      }
    }
  } catch {
    // Non-fatal
  }
  return headers;
}

export interface ProBadgeContextValue {
  settings: ProBadgeSettings;
  /** Saved PLUS badge ID (1..50 or null), kept even if PLUS expires so re-subscribing restores it. */
  plusBadgeId: number | null;
  /** Active PLUS badge ID to display next to the signed-in user's name (null if not active PLUS, hidden, or unequipped). */
  effectivePlusBadgeId: number | null;
  /**
   * The active badge design string shown next to the signed-in user's name (`null` if free/expired/guest or if `visible` is false).
   * For active Boardly Plus users with a badge equipped, returns `'plus:<1..50>'`.
   */
  effectiveProBadge: string | null;
  isActivePro: boolean;
  isActivePlus: boolean;
  planTier: 'free' | 'pro' | 'plus';
  isPendingVerification: boolean;
  loading: boolean;
  known: boolean;
  saving: boolean;
  saveProBadge: (next: ProBadgeSettings) => Promise<{ ok: boolean; error?: string }>;
}

const ProBadgeContext = createContext<ProBadgeContextValue>({
  settings: { ...DEFAULT_PRO_BADGE_SETTINGS, plusBadgeId: null },
  plusBadgeId: null,
  effectivePlusBadgeId: null,
  effectiveProBadge: null,
  isActivePro: false,
  isActivePlus: false,
  planTier: 'free',
  isPendingVerification: false,
  loading: false,
  known: false,
  saving: false,
  saveProBadge: async () => ({ ok: true }),
});

let inFlightProBadgePromise: Promise<{
  settings: ProBadgeSettings;
  serverActivePro?: boolean;
  serverActivePlus?: boolean;
} | null> | null = null;
let inFlightProBadgeUid: string | null = null;

export function ProBadgeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile: userProfile, isGuest } = useAuth();
  const effectivePlan = useEffectivePlan();
  const [settings, setSettings] = useState<ProBadgeSettings>(() =>
    readSettingsFromLocalStorage(user?.uid || null).settings
  );
  const [known, setKnown] = useState<boolean>(() =>
    readSettingsFromLocalStorage(user?.uid || null).hasCached
  );
  const [serverActivePro, setServerActivePro] = useState<boolean | null>(null);
  const [serverActivePlus, setServerActivePlus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const loadedUidRef = useRef<string | null>(null);

  const isActivePro = useMemo(() => {
    if (!user?.uid || isGuest || user.uid.startsWith('guest_')) return false;
    if (effectivePlan.isPaid || effectivePlan.isPro) return true;
    if (serverActivePro === true && effectivePlan.planStatus.state === 'active') return true;
    return false;
  }, [
    user?.uid,
    isGuest,
    effectivePlan.isPaid,
    effectivePlan.isPro,
    effectivePlan.planStatus.state,
    serverActivePro,
  ]);

  const isActivePlus = useMemo(() => {
    if (!user?.uid || isGuest || user.uid.startsWith('guest_')) return false;
    if (effectivePlan.isPlus) return true;
    if (serverActivePlus === true && effectivePlan.planStatus.state === 'active') return true;
    return false;
  }, [user?.uid, isGuest, effectivePlan.isPlus, effectivePlan.planStatus.state, serverActivePlus]);

  const planTier = effectivePlan.planTier;

  const isPendingVerification = useMemo(() => {
    return effectivePlan.planStatus.state === 'pending';
  }, [effectivePlan.planStatus.state]);

  // Seed plusBadgeId from Firestore userProfile if available and local state hasn't loaded yet
  const plusBadgeId: number | null = useMemo(() => {
    if (settings.plusBadgeId !== undefined) {
      return isValidPlusBadgeId(settings.plusBadgeId) ? settings.plusBadgeId : null;
    }
    if (userProfile && Object.prototype.hasOwnProperty.call(userProfile, 'plus_badge_id')) {
      return resolvePlusBadgeId(userProfile.plus_badge_id);
    }
    if (userProfile?.proBadgeDesign) {
      return resolvePlusBadgeId(userProfile.proBadgeDesign);
    }
    return null;
  }, [settings.plusBadgeId, userProfile]);

  const effectivePlusBadgeId: number | null = useMemo(() => {
    if (!isActivePlus || !settings.visible) return null;
    return plusBadgeId;
  }, [isActivePlus, settings.visible, plusBadgeId]);

  const effectiveProBadge: string | null = useMemo(() => {
    if (!isActivePro || !settings.visible) return null;
    if (isActivePlus) {
      return effectivePlusBadgeId !== null ? `plus:${effectivePlusBadgeId}` : null;
    }
    return normalizeProBadgeDesign(settings.design);
  }, [isActivePro, isActivePlus, settings.visible, settings.design, effectivePlusBadgeId]);

  useEffect(() => {
    const uid = user?.uid || null;
    const { settings: cached, hasCached } = readSettingsFromLocalStorage(uid);
    setSettings(cached);

    if (!uid || isGuest || uid.startsWith('guest_')) {
      loadedUidRef.current = null;
      setServerActivePro(false);
      setServerActivePlus(false);
      setKnown(Boolean(uid && (isGuest || uid.startsWith('guest_'))));
      return;
    }

    if (hasCached) {
      setKnown(true);
    }

    if (loadedUidRef.current === uid) {
      return;
    }
    loadedUidRef.current = uid;
    if (!hasCached) {
      setKnown(false);
    }

    let cancelled = false;
    setLoading(true);

    if (!inFlightProBadgePromise || inFlightProBadgeUid !== uid) {
      inFlightProBadgeUid = uid;
      inFlightProBadgePromise = (async () => {
        try {
          const headers = await buildProBadgeAuthHeaders();
          const res = await fetch('/api/pro-badge', {
            method: 'GET',
            headers,
            credentials: 'include',
          });
          if (!res.ok) return null;
          const data = await res.json();
          if (data?.ok) {
            const resolvedPlus =
              Object.prototype.hasOwnProperty.call(data, 'plus_badge_id')
                ? data.plus_badge_id === null
                  ? null
                  : resolvePlusBadgeId(data.plus_badge_id)
                : resolvePlusBadgeId(data.design);
            const candidate: ProBadgeSettings = {
              design: normalizeProBadgeDesign(data.design),
              plusBadgeId: resolvedPlus,
              visible: typeof data.visible === 'boolean' ? data.visible : true,
            };
            writeSettingsToLocalStorage(candidate, uid);
            return {
              settings: candidate,
              serverActivePro: typeof data.activePro === 'boolean' ? data.activePro : undefined,
              serverActivePlus: typeof data.isPlus === 'boolean' ? data.isPlus : undefined,
            };
          }
        } catch {
          // Keep cached settings if offline
        }
        return null;
      })().finally(() => {
        inFlightProBadgePromise = null;
      });
    }

    inFlightProBadgePromise
      .then((resolved) => {
        if (!cancelled) {
          if (resolved) {
            setSettings(resolved.settings);
            if (typeof resolved.serverActivePro === 'boolean') {
              setServerActivePro(resolved.serverActivePro);
            }
            if (typeof resolved.serverActivePlus === 'boolean') {
              setServerActivePlus(resolved.serverActivePlus);
            }
          }
          setKnown(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setKnown(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, isGuest]);

  // Keep the signed-in user's publicProfile cache in sync whenever their effective badge changes
  useEffect(() => {
    const uid = user?.uid;
    if (!uid || isGuest || uid.startsWith('guest_')) return;
    broadcastPublicProfileUpdate(uid, {
      proBadge: effectiveProBadge,
      proBadgeDesign: settings.design,
      proBadgeVisible: settings.visible,
      plus_badge_id: plusBadgeId,
    });
  }, [user?.uid, isGuest, effectiveProBadge, settings.design, settings.visible, plusBadgeId]);

  const saveProBadge = useCallback(
    async (next: ProBadgeSettings): Promise<{ ok: boolean; error?: string }> => {
      const hasPlusPayload = next.plusBadgeId !== undefined;
      const payloadToSend = {
        design: next.design,
        visible: next.visible,
        ...(hasPlusPayload ? { plus_badge_id: next.plusBadgeId } : {}),
      };

      const check = validateProBadgePayload(payloadToSend);
      if (!check.valid || !check.value) {
        return { ok: false, error: check.error || 'Invalid badge choice.' };
      }
      const valid = check.value;
      const uid = user?.uid || null;
      if (!uid || isGuest || uid.startsWith('guest_')) {
        return { ok: false, error: 'Please sign in with an active Plus account to save your badge.' };
      }
      if (hasPlusPayload && valid.plusBadgeId !== null && !isActivePlus) {
        return {
          ok: false,
          error: 'An active Boardly Plus plan is required to equip a PLUS badge.',
        };
      }
      if (!isActivePro) {
        return {
          ok: false,
          error: 'An active Boardly Plus plan is required to save a badge.',
        };
      }

      setSaving(true);
      try {
        const headers = await buildProBadgeAuthHeaders();
        const res = await fetch('/api/pro-badge', {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(payloadToSend),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          setSaving(false);
          return {
            ok: false,
            error: data?.error || `Failed to save badge (HTTP ${res.status}).`,
          };
        }

        const savedPlusId: number | null =
          Object.prototype.hasOwnProperty.call(data, 'plus_badge_id')
            ? data.plus_badge_id === null
              ? null
              : resolvePlusBadgeId(data.plus_badge_id)
            : valid.plusBadgeId ?? null;

        const savedSettings: ProBadgeSettings = {
          design: normalizeProBadgeDesign(data.design ?? valid.design),
          plusBadgeId: savedPlusId,
          visible: typeof data.visible === 'boolean' ? data.visible : valid.visible,
        };
        setSettings(savedSettings);
        setKnown(true);
        writeSettingsToLocalStorage(savedSettings, uid);

        const nextEffective: string | null = savedSettings.visible
          ? isActivePlus
            ? savedPlusId !== null
              ? `plus:${savedPlusId}`
              : null
            : savedSettings.design
          : null;

        // Broadcast immediately to all rendered components via publicProfileService
        broadcastPublicProfileUpdate(uid, {
          proBadge: nextEffective,
          proBadgeDesign: savedSettings.design,
          proBadgeVisible: savedSettings.visible,
          plus_badge_id: savedPlusId,
          planTier,
        });

        // Also sync to Firestore publicProfiles/{uid} and users/{uid} in background so Firestore readers stay consistent
        void Promise.all([
          setDoc(
            doc(db, 'publicProfiles', uid),
            {
              proBadge: nextEffective,
              proBadgeDesign: savedSettings.design,
              proBadgeVisible: savedSettings.visible,
              plus_badge_id: savedPlusId,
            },
            { merge: true }
          ).catch(() => {}),
          setDoc(
            doc(db, 'users', uid),
            {
              proBadgeDesign: savedSettings.design,
              proBadgeVisible: savedSettings.visible,
              plus_badge_id: savedPlusId,
            },
            { merge: true }
          ).catch(() => {}),
        ]);

        setSaving(false);
        return { ok: true };
      } catch (err: any) {
        setSaving(false);
        return {
          ok: false,
          error: err?.message || 'Network error while saving badge.',
        };
      }
    },
    [user?.uid, isGuest, isActivePro, isActivePlus, planTier]
  );

  const contextValue = useMemo<ProBadgeContextValue>(
    () => ({
      settings,
      plusBadgeId,
      effectivePlusBadgeId,
      effectiveProBadge,
      isActivePro,
      isActivePlus,
      planTier,
      isPendingVerification,
      loading,
      known,
      saving,
      saveProBadge,
    }),
    [
      settings,
      plusBadgeId,
      effectivePlusBadgeId,
      effectiveProBadge,
      isActivePro,
      isActivePlus,
      planTier,
      isPendingVerification,
      loading,
      known,
      saving,
      saveProBadge,
    ]
  );

  return <ProBadgeContext.Provider value={contextValue}>{children}</ProBadgeContext.Provider>;
}

export function useProBadge(): ProBadgeContextValue {
  return useContext(ProBadgeContext);
}
