import { useState, useEffect, useCallback } from 'react';

export const BOARDLY_UI_STORAGE_KEY = 'boardlyUI';
export const BOARDLY_UI_LITE_STORAGE_KEY = 'boardlyUILite';
const BOARDLY_UI_EVENT = 'boardly-ui-mode-change';
const BOARDLY_UI_LITE_EVENT = 'boardly-ui-lite-change';

export type BoardlyUIMode = 'classic' | 'glass';

/**
 * Layer 1 requirement: localStorage "boardlyUI" = "glass" or "classic", default "classic".
 * Setting "classic" keeps the original look pixel-identical.
 */
export const DEFAULT_BOARDLY_UI_MODE: BoardlyUIMode = 'classic';

export function isLowSpecDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
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
  } catch {
    // Ignore capability read errors
  }
  return false;
}

/**
 * Reads Performance Mode ("ui-lite") from localStorage, or auto-enables it
 * when navigator.deviceMemory <= 4 or hardwareConcurrency <= 4.
 * Only affects glass mode.
 */
export function getBoardlyUILite(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(BOARDLY_UI_LITE_STORAGE_KEY);
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false') return false;
    const autoLite = isLowSpecDevice();
    if (autoLite) {
      localStorage.setItem(BOARDLY_UI_LITE_STORAGE_KEY, '1');
    }
    return autoLite;
  } catch {
    return false;
  }
}

/**
 * Reads the persisted Boardly UI mode from localStorage.
 * Falls back to DEFAULT_BOARDLY_UI_MODE ("classic").
 */
export function getBoardlyUIMode(): BoardlyUIMode {
  if (typeof window === 'undefined') return DEFAULT_BOARDLY_UI_MODE;
  try {
    const raw = localStorage.getItem(BOARDLY_UI_STORAGE_KEY);
    if (raw === 'glass') return 'glass';
    if (raw === 'classic') return 'classic';
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_BOARDLY_UI_MODE;
}

/**
 * Applies or removes the `.ui-glass` and `.ui-lite` root classes on `<html>`.
 * When mode is "classic", `.ui-glass` and `.ui-lite` are completely absent so the app
 * renders with zero visual changes from its classic stylesheet.
 */
export function applyBoardlyUIModeToDocument(
  mode: BoardlyUIMode,
  liteOverride?: boolean
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isLite = typeof liteOverride === 'boolean' ? liteOverride : getBoardlyUILite();
  if (mode === 'glass') {
    root.classList.add('ui-glass');
    root.classList.toggle('ui-lite', isLite);
    root.setAttribute('data-boardly-ui', 'glass');
    root.setAttribute('data-boardly-ui-lite', isLite ? '1' : '0');
  } else {
    root.classList.remove('ui-glass', 'ui-lite');
    root.setAttribute('data-boardly-ui', 'classic');
    root.removeAttribute('data-boardly-ui-lite');
  }
}

/**
 * Persists user preference for Boardly UI mode ("classic" | "glass")
 * and updates `<html>` immediately.
 */
export function setBoardlyUIModePreference(mode: BoardlyUIMode): void {
  const normalized: BoardlyUIMode = mode === 'glass' ? 'glass' : 'classic';
  try {
    localStorage.setItem(BOARDLY_UI_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage write errors
  }
  applyBoardlyUIModeToDocument(normalized);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<BoardlyUIMode>(BOARDLY_UI_EVENT, { detail: normalized })
    );
  }
}

/**
 * Persists user preference for Performance Mode ("html.ui-lite")
 * and updates `<html>` immediately (only affects glass mode).
 */
export function setBoardlyUILitePreference(enabled: boolean): void {
  const safeLite = Boolean(enabled);
  try {
    localStorage.setItem(BOARDLY_UI_LITE_STORAGE_KEY, safeLite ? '1' : '0');
  } catch {
    // Ignore storage write errors
  }
  applyBoardlyUIModeToDocument(getBoardlyUIMode(), safeLite);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<boolean>(BOARDLY_UI_LITE_EVENT, { detail: safeLite })
    );
  }
}

let pointerDelegateRefCount = 0;
let teardownPointerDelegate: (() => void) | null = null;

function acquireGlobalGlassPressDelegate(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  pointerDelegateRefCount += 1;
  if (teardownPointerDelegate) {
    return () => {
      pointerDelegateRefCount = Math.max(0, pointerDelegateRefCount - 1);
      if (pointerDelegateRefCount === 0 && teardownPointerDelegate) {
        teardownPointerDelegate();
        teardownPointerDelegate = null;
      }
    };
  }

  let activeEl: HTMLElement | null = null;
  let reboundTimer: number | null = null;

  const clearWillChange = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.willChange = '';
  };

  const releaseActive = () => {
    if (!activeEl) return;
    const el = activeEl;
    activeEl = null;
    if (el.getAttribute('data-pressed') !== 'true') {
      clearWillChange(el);
      return;
    }
    el.removeAttribute('data-pressed');
    const isLite = document.documentElement.classList.contains('ui-lite');
    if (
      isLite ||
      (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    ) {
      clearWillChange(el);
      return;
    }
    el.setAttribute('data-rebound', 'true');
    if (reboundTimer !== null) {
      window.clearTimeout(reboundTimer);
    }
    reboundTimer = window.setTimeout(() => {
      el.removeAttribute('data-rebound');
      clearWillChange(el);
      reboundTimer = null;
    }, 440);
  };

  const handlePointerDown = (e: PointerEvent) => {
    const root = document.documentElement;
    if (!root.classList.contains('ui-glass')) return;
    const target = e.target as HTMLElement | null;
    if (!target || typeof target.closest !== 'function') return;
    const pressable = target.closest<HTMLElement>(
      'button:not(:disabled), [role="tab"], [role="button"], [data-pressable], .lg-pill, .glass-pill, .glass-card-interactive, a.glass-row, .stg-row, .fsm-row, .sdn-tab, .akb-tab-btn'
    );
    if (!pressable) return;
    if (pressable.hasAttribute('disabled') || pressable.getAttribute('aria-disabled') === 'true') {
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(8);
      }
    } catch {
      // Ignore haptic errors on unsupported browsers
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    // One ripple / press active at a time
    if (activeEl && activeEl !== pressable) {
      activeEl.removeAttribute('data-pressed');
      activeEl.removeAttribute('data-rebound');
      clearWillChange(activeEl);
    }
    activeEl = pressable;

    if (!root.classList.contains('ui-lite')) {
      const rect = pressable.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pressable.style.setProperty('--tap-x', `${Math.round(e.clientX - rect.left)}px`);
        pressable.style.setProperty('--tap-y', `${Math.round(e.clientY - rect.top)}px`);
      }
    }

    pressable.style.willChange = 'transform';
    pressable.removeAttribute('data-rebound');
    pressable.setAttribute('data-pressed', 'true');
  };

  document.addEventListener('pointerdown', handlePointerDown, { passive: true });
  document.addEventListener('pointerup', releaseActive, { passive: true });
  document.addEventListener('pointercancel', releaseActive, { passive: true });

  teardownPointerDelegate = () => {
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('pointerup', releaseActive);
    document.removeEventListener('pointercancel', releaseActive);
    if (reboundTimer !== null) {
      window.clearTimeout(reboundTimer);
      reboundTimer = null;
    }
    if (activeEl) {
      activeEl.removeAttribute('data-pressed');
      activeEl.removeAttribute('data-rebound');
      clearWillChange(activeEl);
      activeEl = null;
    }
  };

  return () => {
    pointerDelegateRefCount = Math.max(0, pointerDelegateRefCount - 1);
    if (pointerDelegateRefCount === 0 && teardownPointerDelegate) {
      teardownPointerDelegate();
      teardownPointerDelegate = null;
    }
  };
}

/**
 * React hook for reading and switching Boardly UI mode ("classic" | "glass")
 * and Performance Mode ("html.ui-lite").
 */
export function useBoardlyUIMode() {
  const [uiMode, setUIModeState] = useState<BoardlyUIMode>(() => getBoardlyUIMode());
  const [uiLite, setUILiteState] = useState<boolean>(() => getBoardlyUILite());

  useEffect(() => {
    const current = getBoardlyUIMode();
    const currentLite = getBoardlyUILite();
    setUIModeState(current);
    setUILiteState(currentLite);
    applyBoardlyUIModeToDocument(current, currentLite);
    const releasePressDelegate = acquireGlobalGlassPressDelegate();

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<BoardlyUIMode>;
      if (customEvent.detail === 'glass' || customEvent.detail === 'classic') {
        setUIModeState(customEvent.detail);
      } else {
        setUIModeState(getBoardlyUIMode());
      }
    };

    const handleLiteChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setUILiteState(customEvent.detail);
      } else {
        setUILiteState(getBoardlyUILite());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === BOARDLY_UI_STORAGE_KEY || e.key === BOARDLY_UI_LITE_STORAGE_KEY) {
        const updatedMode = getBoardlyUIMode();
        const updatedLite = getBoardlyUILite();
        setUIModeState(updatedMode);
        setUILiteState(updatedLite);
        applyBoardlyUIModeToDocument(updatedMode, updatedLite);
      }
    };

    window.addEventListener(BOARDLY_UI_EVENT, handleCustomChange);
    window.addEventListener(BOARDLY_UI_LITE_EVENT, handleLiteChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      releasePressDelegate();
      window.removeEventListener(BOARDLY_UI_EVENT, handleCustomChange);
      window.removeEventListener(BOARDLY_UI_LITE_EVENT, handleLiteChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setUIMode = useCallback((nextMode: BoardlyUIMode) => {
    setBoardlyUIModePreference(nextMode);
    setUIModeState(nextMode);
  }, []);

  const toggleUIMode = useCallback(() => {
    const next: BoardlyUIMode = getBoardlyUIMode() === 'glass' ? 'classic' : 'glass';
    setBoardlyUIModePreference(next);
    setUIModeState(next);
  }, []);

  const setUILite = useCallback((enabled: boolean) => {
    setBoardlyUILitePreference(enabled);
    setUILiteState(Boolean(enabled));
  }, []);

  const toggleUILite = useCallback(() => {
    const next = !getBoardlyUILite();
    setBoardlyUILitePreference(next);
    setUILiteState(next);
  }, []);

  return {
    uiMode,
    isGlass: uiMode === 'glass',
    setUIMode,
    toggleUIMode,
    uiLite,
    setUILite,
    toggleUILite,
  };
}
