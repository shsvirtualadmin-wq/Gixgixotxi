import { useState, useEffect, useCallback } from 'react';

export const SMOOTH_MODE_STORAGE_KEY = 'boardly-smooth-mode';
const SMOOTH_MODE_EVENT = 'boardly-smooth-mode-change';

/**
 * Detects whether the current device is a low-end phone, constrained CPU/RAM device,
 * Data Saver connection, or has prefers-reduced-motion enabled.
 */
export function detectDefaultSmoothMode(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }

    const nav = navigator as Navigator & {
      deviceMemory?: number;
      hardwareConcurrency?: number;
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    };

    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory <= 4) {
      return true;
    }

    if (
      typeof nav.hardwareConcurrency === 'number' &&
      nav.hardwareConcurrency > 0 &&
      nav.hardwareConcurrency <= 4
    ) {
      return true;
    }

    if (nav.connection) {
      if (nav.connection.saveData) return true;
      const eff = nav.connection.effectiveType;
      if (eff === 'slow-2g' || eff === '2g') {
        return true;
      }
    }
  } catch {
    // Ignore capability detection errors
  }

  return false;
}

let visibilityListenerRegistered = false;
function ensureTabVisibilityObserver(): void {
  if (visibilityListenerRegistered || typeof document === 'undefined') return;
  visibilityListenerRegistered = true;

  const updateVisibility = () => {
    const root = document.documentElement;
    if (document.hidden) {
      root.classList.add('tab-hidden');
      root.setAttribute('data-tab-hidden', 'true');
    } else {
      root.classList.remove('tab-hidden');
      root.removeAttribute('data-tab-hidden');
    }
  };

  updateVisibility();
  document.addEventListener('visibilitychange', updateVisibility, { passive: true });
}

if (typeof document !== 'undefined') {
  ensureTabVisibilityObserver();
}

/**
 * Reads the effective Smooth Mode state (user preference in localStorage or automatic hardware detection).
 */
export function getSmoothMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(SMOOTH_MODE_STORAGE_KEY);
    if (stored === 'true' || stored === '1' || stored === 'on') return true;
    if (stored === 'false' || stored === '0' || stored === 'off') return false;
  } catch {
    // Ignore storage read errors
  }
  return detectDefaultSmoothMode();
}

/**
 * Applies or removes the `.smooth-mode` class and `data-smooth-mode` attribute on `<html>`.
 */
export function applySmoothModeToDocument(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  ensureTabVisibilityObserver();
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('smooth-mode');
    root.setAttribute('data-smooth-mode', 'true');
  } else {
    root.classList.remove('smooth-mode');
    root.setAttribute('data-smooth-mode', 'false');
  }
}

/**
 * Persists user preference for Smooth Mode and updates `<html>` immediately.
 */
export function setSmoothModePreference(enabled: boolean): void {
  try {
    localStorage.setItem(SMOOTH_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage write errors
  }
  applySmoothModeToDocument(enabled);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<boolean>(SMOOTH_MODE_EVENT, { detail: enabled }));
  }
}

/**
 * React hook for reading and toggling Smooth Mode across the app.
 */
export function useSmoothMode() {
  const [smoothMode, setSmoothModeState] = useState<boolean>(() => getSmoothMode());
  const isAutoDetectedLowEnd = detectDefaultSmoothMode();

  useEffect(() => {
    const current = getSmoothMode();
    setSmoothModeState(current);
    applySmoothModeToDocument(current);

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setSmoothModeState(customEvent.detail);
      } else {
        setSmoothModeState(getSmoothMode());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SMOOTH_MODE_STORAGE_KEY) {
        const updated = getSmoothMode();
        setSmoothModeState(updated);
        applySmoothModeToDocument(updated);
      }
    };

    window.addEventListener(SMOOTH_MODE_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SMOOTH_MODE_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setSmoothMode = useCallback((enabled: boolean) => {
    setSmoothModePreference(enabled);
    setSmoothModeState(enabled);
  }, []);

  const toggleSmoothMode = useCallback(() => {
    setSmoothModePreference(!getSmoothMode());
  }, []);

  return {
    smoothMode,
    setSmoothMode,
    toggleSmoothMode,
    isAutoDetectedLowEnd,
  };
}
