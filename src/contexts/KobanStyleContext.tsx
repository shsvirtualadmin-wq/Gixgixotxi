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

function readStyleFromLocalStorage(uid?: string | null): KobanStyleSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_KOBAN_STYLE;
    }
    const rawUser = uid ? window.localStorage.getItem(getLsKeyForUser(uid)) : null;
    const rawGlobal = window.localStorage.getItem(LS_KEY_GLOBAL);
    const raw = rawUser || rawGlobal;
    if (!raw) return DEFAULT_KOBAN_STYLE;
    const parsed = JSON.parse(raw);
    const check = validateKobanStylePayload(parsed);
    if (check.valid && check.value) {
      return check.value;
    }
  } catch {
    // Ignore storage errors (private mode / quota)
  }
  return DEFAULT_KOBAN_STYLE;
}

function writeStyleToLocalStorage(style: KobanStyleSettings, uid?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const serialized = JSON.stringify(style);
    window.localStorage.setItem(LS_KEY_GLOBAL, serialized);
    if (uid) {
      window.localStorage.setItem(getLsKeyForUser(uid), serialized);
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
  saving: boolean;
  saveStyle: (nextStyle: KobanStyleSettings) => Promise<{ ok: boolean; error?: string }>;
  resetToDefault: () => Promise<{ ok: boolean; error?: string }>;
}

const KobanStyleContext = createContext<KobanStyleContextValue>({
  style: DEFAULT_KOBAN_STYLE,
  loading: false,
  saving: false,
  saveStyle: async () => ({ ok: true }),
  resetToDefault: async () => ({ ok: true }),
});

export function KobanStyleProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [style, setStyle] = useState<KobanStyleSettings>(() => readStyleFromLocalStorage(null));
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const loadedUidRef = useRef<string | null>(null);

  // Sync from server once on app start / when user changes
  useEffect(() => {
    if (authLoading) return;

    const uid = user?.uid || null;

    // Instant paint from localStorage for this user before network completes
    const cached = readStyleFromLocalStorage(uid);
    setStyle(cached);

    if (!uid) {
      loadedUidRef.current = null;
      return;
    }

    if (loadedUidRef.current === uid) {
      return;
    }
    loadedUidRef.current = uid;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const headers = await buildKobanStyleAuthHeaders();
        const res = await fetch('/api/koban-style', {
          method: 'GET',
          headers,
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.ok && data?.style) {
          const check = validateKobanStylePayload(data.style);
          if (check.valid && check.value) {
            setStyle(check.value);
            writeStyleToLocalStorage(check.value, uid);
          }
        }
      } catch {
        // Keep cached or default style if offline
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, authLoading]);

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
          writeStyleToLocalStorage(finalStyle, uid);
          setSaving(false);
          return { ok: true };
        } else {
          // Unauthenticated visitor fallback: save locally
          setStyle(validStyle);
          writeStyleToLocalStorage(validStyle, null);
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

  return (
    <KobanStyleContext.Provider
      value={{
        style,
        loading,
        saving,
        saveStyle,
        resetToDefault,
      }}
    >
      {children}
    </KobanStyleContext.Provider>
  );
}

export function useKobanStyle(): KobanStyleContextValue {
  return useContext(KobanStyleContext);
}
