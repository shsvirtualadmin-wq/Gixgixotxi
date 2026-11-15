import { useState, useEffect, useCallback } from 'react';

export const BOARDLY_UI_STORAGE_KEY = 'boardlyUI';
const BOARDLY_UI_EVENT = 'boardly-ui-mode-change';

export type BoardlyUIMode = 'classic' | 'glass';

/**
 * Phase 1 requirement: Default boardlyUI = "classic" for now.
 * Only the Settings toggle switches to "glass".
 */
export const DEFAULT_BOARDLY_UI_MODE: BoardlyUIMode = 'classic';

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
 * Applies or removes the `.ui-glass` root class on `<html>`.
 * When mode is "classic", `.ui-glass` is completely absent so the app
 * renders with zero visual changes from its classic stylesheet.
 */
export function applyBoardlyUIModeToDocument(mode: BoardlyUIMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'glass') {
    root.classList.add('ui-glass');
    root.setAttribute('data-boardly-ui', 'glass');
  } else {
    root.classList.remove('ui-glass');
    root.setAttribute('data-boardly-ui', 'classic');
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
 * React hook for reading and switching Boardly UI mode ("classic" | "glass").
 */
export function useBoardlyUIMode() {
  const [uiMode, setUIModeState] = useState<BoardlyUIMode>(() => getBoardlyUIMode());

  useEffect(() => {
    const current = getBoardlyUIMode();
    setUIModeState(current);
    applyBoardlyUIModeToDocument(current);

    let activeEl: HTMLElement | null = null;
    let reboundTimer: number | null = null;

    const releaseActive = () => {
      if (!activeEl) return;
      const el = activeEl;
      activeEl = null;
      if (el.getAttribute('data-pressed') !== 'true') return;
      el.removeAttribute('data-pressed');
      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }
      el.setAttribute('data-rebound', 'true');
      if (reboundTimer !== null) {
        window.clearTimeout(reboundTimer);
      }
      reboundTimer = window.setTimeout(() => {
        el.removeAttribute('data-rebound');
        reboundTimer = null;
      }, 420);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!document.documentElement.classList.contains('ui-glass')) return;
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;
      const pressable = target.closest<HTMLElement>(
        'button:not(:disabled), [role="tab"], [data-pressable], a.glass-row, a.glass-pill, .stg-row, .fsm-row'
      );
      if (!pressable) return;
      if (activeEl && activeEl !== pressable) {
        activeEl.removeAttribute('data-pressed');
      }
      activeEl = pressable;
      const rect = pressable.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pressable.style.setProperty('--tap-x', `${Math.round(e.clientX - rect.left)}px`);
        pressable.style.setProperty('--tap-y', `${Math.round(e.clientY - rect.top)}px`);
      }
      pressable.removeAttribute('data-rebound');
      pressable.setAttribute('data-pressed', 'true');
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<BoardlyUIMode>;
      if (customEvent.detail === 'glass' || customEvent.detail === 'classic') {
        setUIModeState(customEvent.detail);
      } else {
        setUIModeState(getBoardlyUIMode());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === BOARDLY_UI_STORAGE_KEY) {
        const updated = getBoardlyUIMode();
        setUIModeState(updated);
        applyBoardlyUIModeToDocument(updated);
      }
    };

    window.addEventListener(BOARDLY_UI_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerup', releaseActive, { passive: true });
    document.addEventListener('pointercancel', releaseActive, { passive: true });
    return () => {
      if (reboundTimer !== null) {
        window.clearTimeout(reboundTimer);
      }
      window.removeEventListener(BOARDLY_UI_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', releaseActive);
      document.removeEventListener('pointercancel', releaseActive);
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

  return {
    uiMode,
    isGlass: uiMode === 'glass',
    setUIMode,
    toggleUIMode,
  };
}
