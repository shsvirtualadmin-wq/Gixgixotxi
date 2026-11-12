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

const LS_KEY_GLOBAL = 'boardly_pro_badge_v1';
const getLsKeyForUser = (uid?: string | null) =>
  uid ? `boardly_pro_badge_v1_${uid}` : LS_KEY_GLOBAL;

function readSettingsFromLocalStorage(uid?: string | null): {
  settings: ProBadgeSettings;
  hasCached: boolean;
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !uid) {
      return { settings: DEFAULT_PRO_BADGE_SETTINGS, hasCached: false };
    }
    const rawUser = window.localStorage.getItem(getLsKeyForUser(uid));
    if (!rawUser) return { settings: DEFAULT_PRO_BADGE_SETTINGS, hasCached: false };
    const parsed = JSON.parse(rawUser);
    const check = validateProBadgePayload(parsed);
    if (check.valid && check.value) {
      return { settings: check.value, hasCached: true };
    }
  } catch {
    // Ignore storage errors
  }
  return { settings: DEFAULT_PRO_BADGE_SETTINGS, hasCached: false };
}

function writeSettingsToLocalStorage(settings: ProBadgeSettings, uid?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !uid) return;
    const serialized = JSON.stringify(settings);
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
  /**
   * The active badge design ID shown next to the signed-in user's name (`null` if free/expired/guest or if `visible` is false).
   */
  effectiveProBadge: ProBadgeDesignId | null;
  isActivePro: boolean;
  isPendingVerification: boolean;
  loading: boolean;
  known: boolean;
  saving: boolean;
  saveProBadge: (next: ProBadgeSettings) => Promise<{ ok: boolean; error?: string }>;
}

const ProBadgeContext = createContext<ProBadgeContextValue>({
  settings: DEFAULT_PRO_BADGE_SETTINGS,
  effectiveProBadge: null,
  isActivePro: false,
  isPendingVerification: false,
  loading: false,
  known: false,
  saving: false,
  saveProBadge: async () => ({ ok: true }),
});

let inFlightProBadgePromise: Promise<{ settings: ProBadgeSettings; serverActivePro?: boolean } | null> | null =
  null;
let inFlightProBadgeUid: string | null = null;

export function ProBadgeProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const effectivePlan = useEffectivePlan();
  const [settings, setSettings] = useState<ProBadgeSettings>(() =>
    readSettingsFromLocalStorage(user?.uid || null).settings
  );
  const [known, setKnown] = useState<boolean>(() =>
    readSettingsFromLocalStorage(user?.uid || null).hasCached
  );
  const [serverActivePro, setServerActivePro] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const loadedUidRef = useRef<string | null>(null);

  const isActivePro = useMemo(() => {
    if (!user?.uid || isGuest || user.uid.startsWith('guest_')) return false;
    if (effectivePlan.isPro) return true;
    if (serverActivePro === true && effectivePlan.planStatus.state === 'active') return true;
    return false;
  }, [user?.uid, isGuest, effectivePlan.isPro, effectivePlan.planStatus.state, serverActivePro]);

  const isPendingVerification = useMemo(() => {
    return effectivePlan.planStatus.state === 'pending';
  }, [effectivePlan.planStatus.state]);

  const effectiveProBadge: ProBadgeDesignId | null = useMemo(() => {
    if (!isActivePro || !settings.visible) return null;
    return normalizeProBadgeDesign(settings.design);
  }, [isActivePro, settings.visible, settings.design]);

  useEffect(() => {
    const uid = user?.uid || null;
    const { settings: cached, hasCached } = readSettingsFromLocalStorage(uid);
    setSettings(cached);

    if (!uid || isGuest || uid.startsWith('guest_')) {
      loadedUidRef.current = null;
      setServerActivePro(false);
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
            const candidate = {
              design: normalizeProBadgeDesign(data.design),
              visible: typeof data.visible === 'boolean' ? data.visible : true,
            };
            writeSettingsToLocalStorage(candidate, uid);
            return {
              settings: candidate,
              serverActivePro: typeof data.activePro === 'boolean' ? data.activePro : undefined,
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
    });
  }, [user?.uid, isGuest, effectiveProBadge, settings.design, settings.visible]);

  const saveProBadge = useCallback(
    async (next: ProBadgeSettings): Promise<{ ok: boolean; error?: string }> => {
      const check = validateProBadgePayload(next);
      if (!check.valid || !check.value) {
        return { ok: false, error: check.error || 'Invalid Pro badge choice.' };
      }
      const valid = check.value;
      const uid = user?.uid || null;
      if (!uid || isGuest || uid.startsWith('guest_')) {
        return { ok: false, error: 'Please sign in with an active Pro account to save your badge.' };
      }
      if (!isActivePro) {
        return {
          ok: false,
          error: 'An active Boardly Pro plan is required to save a Pro badge.',
        };
      }

      setSaving(true);
      try {
        const headers = await buildProBadgeAuthHeaders();
        const res = await fetch('/api/pro-badge', {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(valid),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          setSaving(false);
          return {
            ok: false,
            error: data?.error || `Failed to save Pro badge (HTTP ${res.status}).`,
          };
        }

        const savedSettings: ProBadgeSettings = {
          design: normalizeProBadgeDesign(data.design ?? valid.design),
          visible: typeof data.visible === 'boolean' ? data.visible : valid.visible,
        };
        setSettings(savedSettings);
        setKnown(true);
        writeSettingsToLocalStorage(savedSettings, uid);

        const nextEffective: ProBadgeDesignId | null = savedSettings.visible
          ? savedSettings.design
          : null;

        // Broadcast immediately to all rendered components via publicProfileService
        broadcastPublicProfileUpdate(uid, {
          proBadge: nextEffective,
          proBadgeDesign: savedSettings.design,
          proBadgeVisible: savedSettings.visible,
        });

        // Also sync to Firestore publicProfiles/{uid} and users/{uid} in background so Firestore readers stay consistent
        void Promise.all([
          setDoc(
            doc(db, 'publicProfiles', uid),
            {
              proBadge: nextEffective,
              proBadgeDesign: savedSettings.design,
              proBadgeVisible: savedSettings.visible,
            },
            { merge: true }
          ).catch(() => {}),
          setDoc(
            doc(db, 'users', uid),
            {
              proBadgeDesign: savedSettings.design,
              proBadgeVisible: savedSettings.visible,
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
          error: err?.message || 'Network error while saving Pro badge.',
        };
      }
    },
    [user?.uid, isGuest, isActivePro]
  );

  const contextValue = useMemo<ProBadgeContextValue>(
    () => ({
      settings,
      effectiveProBadge,
      isActivePro,
      isPendingVerification,
      loading,
      known,
      saving,
      saveProBadge,
    }),
    [settings, effectiveProBadge, isActivePro, isPendingVerification, loading, known, saving, saveProBadge]
  );

  return <ProBadgeContext.Provider value={contextValue}>{children}</ProBadgeContext.Provider>;
}

export function useProBadge(): ProBadgeContextValue {
  return useContext(ProBadgeContext);
}
