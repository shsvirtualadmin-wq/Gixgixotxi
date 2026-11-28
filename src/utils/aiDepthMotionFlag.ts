import { useEffect, useState } from 'react';

const STORAGE_KEY = 'boardly_ai_depth_motion';

/**
 * Feature flag controlling the animated Answer-Depth picker & matching thinking indicator.
 * Default: ON.
 * Can be turned off via:
 * - Query param: `?aiDepthMotion=0` (or `?aiDepthMotion=1` to re-enable)
 * - localStorage: `localStorage.setItem('boardly_ai_depth_motion', '0')`
 * - Build env: `VITE_AI_DEPTH_MOTION=0`
 */
export function isAiDepthMotionFlagEnabled(): boolean {
  const envVal = (import.meta as any)?.env?.VITE_AI_DEPTH_MOTION;
  if (envVal === '0' || envVal === 'false') return false;

  if (typeof window === 'undefined') return true;

  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('aiDepthMotion');
    if (q === '0' || q === 'false') return false;
    if (q === '1' || q === 'true') return true;
  } catch {
    // Ignore URL parse issues
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === '0' || saved === 'false') return false;
    if (saved === '1' || saved === 'true') return true;
  } catch {
    // Ignore storage issues
  }

  return true;
}

export function setAiDepthMotionFlag(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    window.dispatchEvent(new CustomEvent('boardly:ai-depth-motion-change', { detail: { enabled } }));
  } catch {
    // Ignore storage errors
  }
}

export interface AiDepthMotionState {
  /** True when feature flag is enabled AND user does not prefer reduced motion */
  motionEnabled: boolean;
  /** True when prefers-reduced-motion: reduce is active */
  reducedMotion: boolean;
  /** True when document.hidden is true (CSS animations pause cleanly) */
  tabHidden: boolean;
}

export function useAiDepthMotion(): AiDepthMotionState {
  const [flagEnabled, setFlagEnabled] = useState<boolean>(() => isAiDepthMotionFlagEnabled());
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });
  const [tabHidden, setTabHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.hidden) : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onFlagChange = () => setFlagEnabled(isAiDepthMotionFlagEnabled());
    window.addEventListener('boardly:ai-depth-motion-change', onFlagChange);

    const onVisibility = () => setTabHidden(Boolean(document.hidden));
    document.addEventListener('visibilitychange', onVisibility);

    let mql: MediaQueryList | null = null;
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    if (window.matchMedia) {
      try {
        mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mql.matches);
        if (typeof mql.addEventListener === 'function') {
          mql.addEventListener('change', onMotionChange);
        }
      } catch {
        // Ignore matchMedia errors
      }
    }

    return () => {
      window.removeEventListener('boardly:ai-depth-motion-change', onFlagChange);
      document.removeEventListener('visibilitychange', onVisibility);
      if (mql && typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', onMotionChange);
      }
    };
  }, []);

  return {
    motionEnabled: flagEnabled && !reducedMotion,
    reducedMotion,
    tabHidden,
  };
}
