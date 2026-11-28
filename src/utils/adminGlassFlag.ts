import { useState, useEffect, useCallback } from 'react';

export const ADMIN_GLASS_STORAGE_KEY = 'boardly_admin_glass';
const ADMIN_GLASS_EVENT = 'boardly:admin-glass-change';

function readEnvFlag(): boolean | null {
  try {
    const env = import.meta.env as Record<string, string | undefined>;
    const raw = env?.VITE_ADMIN_GLASS ?? env?.NEXT_PUBLIC_ADMIN_GLASS;
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
  } catch {
    // ignore env read errors
  }
  return null;
}

/**
 * Determines whether the redesigned /admin iOS Glass + Nothing UI is active.
 * Priority:
 *   1. localStorage 'boardly_admin_glass' ('1'/'true' or '0'/'false')
 *   2. localStorage 'NEXT_PUBLIC_ADMIN_GLASS' ('1'/'true' or '0'/'false')
 *   3. Build env VITE_ADMIN_GLASS or NEXT_PUBLIC_ADMIN_GLASS
 *   4. Default ON (true) on the ui-glass-redesign branch so rollback is a single toggle.
 */
export function isAdminGlassEnabled(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const local =
        window.localStorage.getItem(ADMIN_GLASS_STORAGE_KEY) ??
        window.localStorage.getItem('NEXT_PUBLIC_ADMIN_GLASS');
      if (local === '0' || local === 'false') return false;
      if (local === '1' || local === 'true') return true;
    } catch {
      // ignore storage errors
    }
  }
  const envFlag = readEnvFlag();
  if (envFlag !== null) return envFlag;
  return true;
}

export function setAdminGlassEnabled(enabled: boolean): void {
  const val = enabled ? '1' : '0';
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ADMIN_GLASS_STORAGE_KEY, val);
    } catch {
      // ignore storage errors
    }
    window.dispatchEvent(new CustomEvent<boolean>(ADMIN_GLASS_EVENT, { detail: enabled }));
  }
}

export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4) {
      return true;
    }
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory <= 4) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function useAdminGlassFlag() {
  const [enabled, setEnabledState] = useState<boolean>(() => isAdminGlassEnabled());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setEnabledState(typeof detail === 'boolean' ? detail : isAdminGlassEnabled());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_GLASS_STORAGE_KEY || e.key === 'NEXT_PUBLIC_ADMIN_GLASS') {
        setEnabledState(isAdminGlassEnabled());
      }
    };
    window.addEventListener(ADMIN_GLASS_EVENT, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ADMIN_GLASS_EVENT, onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setAdminGlassEnabled(next);
    setEnabledState(next);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!isAdminGlassEnabled());
  }, [setEnabled]);

  return { enabled, setEnabled, toggle };
}
