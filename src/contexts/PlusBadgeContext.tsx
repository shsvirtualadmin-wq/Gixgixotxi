import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getStoredGuestSessionToken } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { broadcastPublicProfileUpdate } from '@/services/publicProfileService';
import {
  DEFAULT_PLUS_BADGE_SETTINGS,
  isValidPlusBadgeId,
  validatePlusBadgePayload,
  type PlusBadgeSettings,
} from '@/lib/plusBadgeDesigns';

const LS_KEY_GLOBAL_LEGACY = 'boardly_plus_badge_v1';
const LS_KEY_GLOBAL = 'boardly_plus_badge_v2';
const getLsKeyForUser = (uid?: string | null) =>
  uid ? `boardly_plus_badge_v2_${uid}` : LS_KEY_GLOBAL;

function readSettingsFromLocalStorage(uid?: string | null): {
  settings: PlusBadgeSettings;
  hasCached: boolean;
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !uid) {
      return { settings: { ...DEFAULT_PLUS_BADGE_SETTINGS }, hasCached: false };
    }
    const rawUser = window.localStorage.getItem(getLsKeyForUser(uid));
    if (!rawUser) {
      return { settings: { ...DEFAULT_PLUS_BADGE_SETTINGS }, hasCached: false };
    }
    const parsed = JSON.parse(rawUser);
    const check = validatePlusBadgePayload(parsed);
    if (check.valid && check.value) {
      return {
        settings: check.value,
        hasCached: true,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { settings: { ...DEFAULT_PLUS_BADGE_SETTINGS }, hasCached: false };
}

function writeSettingsToLocalStorage(settings: PlusBadgeSettings, uid?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !uid) return;
    const serialized = JSON.stringify({
      plus_badge_design: settings.plus_badge_design,
      plus_badge_visible: settings.plus_badge_visible,
    });
    window.localStorage.setItem(getLsKeyForUser(uid), serialized);
  } catch {
    // Ignore storage errors
  }
}

export function clearPlusBadgeCacheForUid(uid?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(LS_KEY_GLOBAL_LEGACY);
    window.localStorage.removeItem(LS_KEY_GLOBAL);
    if (uid) {
      window.localStorage.removeItem(`boardly_plus_badge_v1_${uid}`);
      window.localStorage.removeItem(getLsKeyForUser(uid));
    }
  } catch {
    // Ignore storage errors
  }
}

async function buildPlusBadgeAuthHeaders(): Promise<Record<string, string>> {
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

export interface PlusBadgeContextValue {
  settings: PlusBadgeSettings;
  /** Saved PLUS badge design ID (1..50 or null), kept even if PLUS expires. */
  plusBadgeDesign: number | null;
  /** Whether the member wants their PLUS badge displayed. */
  plusBadgeVisible: boolean;
  /** Active PLUS badge ID to render next to the signed-in member's name (`null` if not active PLUS, hidden, or unequipped). */
  effectivePlusBadgeId: number | null;
  isActivePlus: boolean;
  isPendingVerification: boolean;
  loading: boolean;
  known: boolean;
  saving: boolean;
  savePlusBadge: (next: PlusBadgeSettings) => Promise<{ ok: boolean; error?: string }>;
  resetPlusBadge: () => Promise<{ ok: boolean; error?: string }>;
}

const PlusBadgeContext = createContext<PlusBadgeContextValue>({
  settings: { ...DEFAULT_PLUS_BADGE_SETTINGS },
  plusBadgeDesign: null,
  plusBadgeVisible: true,
  effectivePlusBadgeId: null,
  isActivePlus: false,
  isPendingVerification: false,
  loading: false,
  known: false,
  saving: false,
  savePlusBadge: async () => ({ ok: true }),
  resetPlusBadge: async () => ({ ok: true }),
});

let inFlightPlusBadgePromise: Promise<{
  settings: PlusBadgeSettings;
  serverActivePlus?: boolean;
} | null> | null = null;
let inFlightPlusBadgeUid: string | null = null;

export function PlusBadgeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile: userProfile, isGuest } = useAuth();
  const effectivePlan = useEffectivePlan();
  const [settings, setSettings] = useState<PlusBadgeSettings>(() =>
    readSettingsFromLocalStorage(user?.uid || null).settings
  );
  const [known, setKnown] = useState<boolean>(() =>
    readSettingsFromLocalStorage(user?.uid || null).hasCached
  );
  const [serverActivePlus, setServerActivePlus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const loadedUidRef = useRef<string | null>(null);

  const isActivePlus = useMemo(() => {
    if (!user?.uid || isGuest || user.uid.startsWith('guest_')) return false;
    if (effectivePlan.isPlus) return true;
    if (serverActivePlus === true && effectivePlan.planStatus.state === 'active') return true;
    return false;
  }, [user?.uid, isGuest, effectivePlan.isPlus, effectivePlan.planStatus.state, serverActivePlus]);

  const isPendingVerification = useMemo(() => {
    return effectivePlan.planStatus.state === 'pending';
  }, [effectivePlan.planStatus.state]);

  // Read strictly from PLUS fields (never from PRO fields)
  const plusBadgeDesign: number | null = useMemo(() => {
    if (known) {
      return settings.plus_badge_design !== null && isValidPlusBadgeId(settings.plus_badge_design)
        ? settings.plus_badge_design
        : null;
    }
    if (userProfile && Object.prototype.hasOwnProperty.call(userProfile, 'plus_badge_design')) {
      const d = (userProfile as any).plus_badge_design;
      return d === null ? null : isValidPlusBadgeId(d) ? d : null;
    }
    if (userProfile && Object.prototype.hasOwnProperty.call(userProfile, 'plus_badge_id')) {
      const d = userProfile.plus_badge_id;
      return d === null ? null : isValidPlusBadgeId(d) ? d : null;
    }
    return settings.plus_badge_design;
  }, [known, settings.plus_badge_design, userProfile]);

  const plusBadgeVisible: boolean = useMemo(() => {
    if (known) return settings.plus_badge_visible;
    if (userProfile && typeof (userProfile as any).plus_badge_visible === 'boolean') {
      return (userProfile as any).plus_badge_visible;
    }
    return settings.plus_badge_visible;
  }, [known, settings.plus_badge_visible, userProfile]);

  const effectivePlusBadgeId: number | null = useMemo(() => {
    if (!isActivePlus || !plusBadgeVisible) return null;
    return plusBadgeDesign;
  }, [isActivePlus, plusBadgeVisible, plusBadgeDesign]);

  // Load exclusively from GET /api/plus-badge (never /api/pro-badge)
  useEffect(() => {
    const uid = user?.uid || null;
    const { settings: cached, hasCached } = readSettingsFromLocalStorage(uid);
    setSettings(cached);

    if (!uid || isGuest || uid.startsWith('guest_')) {
      loadedUidRef.current = null;
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

    if (!inFlightPlusBadgePromise || inFlightPlusBadgeUid !== uid) {
      inFlightPlusBadgeUid = uid;
      inFlightPlusBadgePromise = (async () => {
        try {
          const headers = await buildPlusBadgeAuthHeaders();
          const res = await fetch('/api/plus-badge', {
            method: 'GET',
            headers,
            credentials: 'include',
          });
          if (!res.ok) return null;
          const data = await res.json();
          if (data?.ok) {
            const rawDesign = data.plus_badge_design;
            const parsedDesign: number | null =
              rawDesign === null || rawDesign === undefined
                ? null
                : isValidPlusBadgeId(rawDesign)
                ? rawDesign
                : null;
            const candidate: PlusBadgeSettings = {
              plus_badge_design: parsedDesign,
              plus_badge_visible:
                typeof data.plus_badge_visible === 'boolean' ? data.plus_badge_visible : true,
            };
            writeSettingsToLocalStorage(candidate, uid);
            return {
              settings: candidate,
              serverActivePlus:
                typeof data.activePlus === 'boolean'
                  ? data.activePlus
                  : typeof data.isPlus === 'boolean'
                  ? data.isPlus
                  : undefined,
            };
          }
        } catch {
          // Keep cached settings if offline
        }
        return null;
      })().finally(() => {
        inFlightPlusBadgePromise = null;
      });
    }

    inFlightPlusBadgePromise
      .then((resolved) => {
        if (!cancelled) {
          if (resolved) {
            setSettings(resolved.settings);
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

  // Sync ONLY PLUS fields to the signed-in user's publicProfile cache (never touch proBadge fields)
  useEffect(() => {
    const uid = user?.uid;
    if (!uid || isGuest || uid.startsWith('guest_')) return;
    if (!isActivePlus) return;
    broadcastPublicProfileUpdate(uid, {
      plusBadge: effectivePlusBadgeId,
      plus_badge_design: plusBadgeDesign,
      plus_badge_visible: plusBadgeVisible,
      plus_badge_id: plusBadgeDesign,
    });
  }, [user?.uid, isGuest, isActivePlus, effectivePlusBadgeId, plusBadgeDesign, plusBadgeVisible]);

  // Save exclusively via PUT /api/plus-badge (never /api/pro-badge)
  const savePlusBadge = useCallback(
    async (next: PlusBadgeSettings): Promise<{ ok: boolean; error?: string }> => {
      const payloadToSend = {
        plus_badge_design: next.plus_badge_design,
        plus_badge_visible: next.plus_badge_visible,
      };

      const check = validatePlusBadgePayload(payloadToSend);
      if (!check.valid || !check.value) {
        return { ok: false, error: check.error || 'Invalid PLUS badge choice.' };
      }
      const valid = check.value;
      const uid = user?.uid || null;
      if (!uid || isGuest || uid.startsWith('guest_')) {
        return {
          ok: false,
          error: 'Please sign in with an active Boardly Plus account to save your PLUS badge.',
        };
      }
      if (!isActivePlus) {
        return {
          ok: false,
          error: 'An active Boardly Plus plan is required to customize and save a PLUS badge.',
        };
      }

      setSaving(true);
      try {
        const headers = await buildPlusBadgeAuthHeaders();
        const res = await fetch('/api/plus-badge', {
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
            error: data?.error || `Failed to save PLUS badge (HTTP ${res.status}).`,
          };
        }

        const savedDesign: number | null =
          data.plus_badge_design === null
            ? null
            : isValidPlusBadgeId(data.plus_badge_design)
            ? data.plus_badge_design
            : valid.plus_badge_design;
        const savedVisible: boolean =
          typeof data.plus_badge_visible === 'boolean'
            ? data.plus_badge_visible
            : valid.plus_badge_visible;

        const savedSettings: PlusBadgeSettings = {
          plus_badge_design: savedDesign,
          plus_badge_visible: savedVisible,
        };
        setSettings(savedSettings);
        setKnown(true);
        writeSettingsToLocalStorage(savedSettings, uid);

        const nextEffective: number | null = savedVisible ? savedDesign : null;

        // Broadcast ONLY PLUS fields to rendered surfaces
        broadcastPublicProfileUpdate(uid, {
          plusBadge: nextEffective,
          plus_badge_design: savedDesign,
          plus_badge_visible: savedVisible,
          plus_badge_id: savedDesign,
        });

        // Sync ONLY PLUS fields to Firestore in background (never write proBadge/proBadgeDesign/proBadgeVisible)
        void Promise.all([
          setDoc(
            doc(db, 'publicProfiles', uid),
            {
              plusBadge: nextEffective,
              plus_badge_design: savedDesign,
              plus_badge_visible: savedVisible,
              plus_badge_id: savedDesign,
            },
            { merge: true }
          ).catch(() => {}),
          setDoc(
            doc(db, 'users', uid),
            {
              plus_badge_design: savedDesign,
              plus_badge_visible: savedVisible,
              plus_badge_id: savedDesign,
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
          error: err?.message || 'Network error while saving PLUS badge.',
        };
      }
    },
    [user?.uid, isGuest, isActivePlus]
  );

  const resetPlusBadge = useCallback(async () => {
    return savePlusBadge({ ...DEFAULT_PLUS_BADGE_SETTINGS });
  }, [savePlusBadge]);

  const contextValue = useMemo<PlusBadgeContextValue>(
    () => ({
      settings,
      plusBadgeDesign,
      plusBadgeVisible,
      effectivePlusBadgeId,
      isActivePlus,
      isPendingVerification,
      loading,
      known,
      saving,
      savePlusBadge,
      resetPlusBadge,
    }),
    [
      settings,
      plusBadgeDesign,
      plusBadgeVisible,
      effectivePlusBadgeId,
      isActivePlus,
      isPendingVerification,
      loading,
      known,
      saving,
      savePlusBadge,
      resetPlusBadge,
    ]
  );

  return <PlusBadgeContext.Provider value={contextValue}>{children}</PlusBadgeContext.Provider>;
}

export function usePlusBadge(): PlusBadgeContextValue {
  return useContext(PlusBadgeContext);
}
