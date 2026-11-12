import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { auth } from '@/lib/firebase';
import { getStoredGuestSessionToken } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  DEFAULT_KOBAN_STYLE,
  validateKobanStylePayload,
  type KobanStyleSettings,
} from '@/lib/kobanStyle';

const LS_KEY_GLOBAL = 'boardly_koban_style_v1';
const getLsKeyForUser = (uid?: string | null) =>
  uid ? `boardly_koban_style_v1_${uid}` : LS_KEY_GLOBAL;

function readStyleFromLocalStorage(uid?: string | null): {
  style: KobanStyleSettings;
  hasCached: boolean;
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !uid) {
      return { style: DEFAULT_KOBAN_STYLE, hasCached: false };
    }
    const rawUser = window.localStorage.getItem(getLsKeyForUser(uid));
    if (!rawUser) return { style: DEFAULT_KOBAN_STYLE, hasCached: false };
    const parsed = JSON.parse(rawUser);
    const check = validateKobanStylePayload(parsed);
    if (check.valid && check.value) {
      return { style: check.value, hasCached: true };
    }
  } catch {
    // Ignore storage errors (private mode / quota)
  }
  return { style: DEFAULT_KOBAN_STYLE, hasCached: false };
}

function writeStyleToLocalStorage(style: KobanStyleSettings, uid?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage || !uid) return;
    const serialized = JSON.stringify(style);
    window.localStorage.setItem(getLsKeyForUser(uid), serialized);
  } catch {
    // Ignore storage errors
  }
}

export function clearKobanStyleCacheForUid(uid?: string | null): void {
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

async function buildKobanStyleAuthHeaders(): Promise<Record<string, string>> {
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

export interface KobanStyleContextValue {
  style: KobanStyleSettings;
  loading: boolean;
  known: boolean;
  saving: boolean;
  saveStyle: (nextStyle: KobanStyleSettings) => Promise<{ ok: boolean; error?: string }>;
  resetToDefault: () => Promise<{ ok: boolean; error?: string }>;
}

const KobanStyleContext = createContext<KobanStyleContextValue>({
  style: DEFAULT_KOBAN_STYLE,
  loading: false,
  known: false,
  saving: false,
  saveStyle: async () => ({ ok: true }),
  resetToDefault: async () => ({ ok: true }),
});

let inFlightKobanStylePromise: Promise<KobanStyleSettings | null> | null = null;
let inFlightKobanStyleUid: string | null = null;

export function KobanStyleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [style, setStyle] = useState<KobanStyleSettings>(() =>
    readStyleFromLocalStorage(user?.uid || null).style
  );
  const [known, setKnown] = useState<boolean>(() =>
    readStyleFromLocalStorage(user?.uid || null).hasCached
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const loadedUidRef = useRef<string | null>(null);

  // Sync from server once on app start / when user changes (without waiting on profileLoading waterfall)
  useEffect(() => {
    const uid = user?.uid || null;

    // Instant paint from localStorage for this user before network completes
    const { style: cached, hasCached } = readStyleFromLocalStorage(uid);
    setStyle(cached);

    if (!uid) {
      loadedUidRef.current = null;
      setKnown(false);
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

    if (!inFlightKobanStylePromise || inFlightKobanStyleUid !== uid) {
      inFlightKobanStyleUid = uid;
      inFlightKobanStylePromise = (async () => {
        try {
          const headers = await buildKobanStyleAuthHeaders();
          const res = await fetch('/api/koban-style', {
            method: 'GET',
            headers,
            credentials: 'include',
          });
          if (!res.ok) return null;
          const data = await res.json();
          if (data?.ok && data?.style) {
            const check = validateKobanStylePayload(data.style);
            if (check.valid && check.value) {
              writeStyleToLocalStorage(check.value, uid);
              return check.value;
            }
          }
        } catch {
          // Keep cached or default style if offline
        }
        return null;
      })().finally(() => {
        inFlightKobanStylePromise = null;
      });
    }

    inFlightKobanStylePromise
      .then((resolved) => {
        if (!cancelled) {
          if (resolved) {
            setStyle(resolved);
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
  }, [user?.uid]);

  const saveStyle = useCallback(
    async (nextStyle: KobanStyleSettings): Promise<{ ok: boolean; error?: string }> => {
      const check = validateKobanStylePayload(nextStyle);
      if (!check.valid || !check.value) {
        return { ok: false, error: check.error || 'Invalid style settings.' };
      }

      const validStyle = check.value;
      const uid = user?.uid || null;
      setSaving(true);

      try {
        if (uid) {
          const headers = await buildKobanStyleAuthHeaders();
          const res = await fetch('/api/koban-style', {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify(validStyle),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.ok) {
            setSaving(false);
            return {
              ok: false,
              error: data?.error || `Failed to save Koban style (HTTP ${res.status}).`,
            };
          }
          const serverValidated = validateKobanStylePayload(data.style);
          const finalStyle =
            serverValidated.valid && serverValidated.value ? serverValidated.value : validStyle;
          setStyle(finalStyle);
          setKnown(true);
          writeStyleToLocalStorage(finalStyle, uid);
          setSaving(false);
          return { ok: true };
        } else {
          // Unauthenticated visitor fallback: save locally
          setStyle(validStyle);
          setKnown(true);
          setSaving(false);
          return { ok: true };
        }
      } catch (err: any) {
        setSaving(false);
        return {
          ok: false,
          error: err?.message || 'Network error while saving Koban style.',
        };
      }
    },
    [user?.uid]
  );

  const resetToDefault = useCallback(async () => {
    return saveStyle(DEFAULT_KOBAN_STYLE);
  }, [saveStyle]);

  const contextValue = React.useMemo<KobanStyleContextValue>(
    () => ({
      style,
      loading,
      known,
      saving,
      saveStyle,
      resetToDefault,
    }),
    [style, loading, known, saving, saveStyle, resetToDefault]
  );

  return (
    <KobanStyleContext.Provider value={contextValue}>
      {children}
    </KobanStyleContext.Provider>
  );
}

export function useKobanStyle(): KobanStyleContextValue {
  return useContext(KobanStyleContext);
}
