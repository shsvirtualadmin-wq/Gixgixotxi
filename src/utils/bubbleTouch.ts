import type React from 'react';

export interface BubbleTouchOptions {
  /** Whether this element is a primary button or active tab pill that emits the radial touch ripple */
  ripple?: boolean;
  /** Disable press/release spring & haptic when disabled */
  disabled?: boolean;
  /** Optional custom vibrate duration in ms (defaults to 8ms) */
  hapticMs?: number;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function triggerHapticFeedback(durationMs = 8): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore on unsupported browsers or restricted contexts
    }
  }
}

/**
 * Shared GPU-friendly Bubble Touch Effect utility.
 * - On pointer down: scales down to 0.96 with spring physics, triggers 8ms haptic feedback,
 *   and positions the radial light ripple at the exact pointer coordinates.
 * - On pointer up: overshoots to 1.03 and settles back to 1.0, fading out the radial ripple in ~400ms.
 * - Respects prefers-reduced-motion (disables scale & ripple while keeping color transitions).
 */
export function getBubbleTouchHandlers<T extends HTMLElement = HTMLElement>(
  options: BubbleTouchOptions = {}
): {
  onPointerDown: (e: React.PointerEvent<T>) => void;
  onPointerUp: (e: React.PointerEvent<T>) => void;
  onPointerLeave: (e: React.PointerEvent<T>) => void;
  onPointerCancel: (e: React.PointerEvent<T>) => void;
  onPointerMove?: (e: React.PointerEvent<T>) => void;
} {
  const { ripple = false, disabled = false, hapticMs = 8 } = options;

  const updateTouchCoords = (e: React.PointerEvent<T>) => {
    const el = e.currentTarget;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--bubble-x', `${Math.round(x)}px`);
    el.style.setProperty('--bubble-y', `${Math.round(y)}px`);
  };

  const handlePointerDown = (e: React.PointerEvent<T>) => {
    if (disabled) return;
    const el = e.currentTarget;
    if (!el) return;

    triggerHapticFeedback(hapticMs);

    if (prefersReducedMotion()) {
      return;
    }

    updateTouchCoords(e);
    el.removeAttribute('data-bubble-release');
    el.setAttribute('data-bubble-pressed', 'true');
    if (ripple) {
      el.setAttribute('data-bubble-ripple', 'active');
    }
  };

  const handleRelease = (e: React.PointerEvent<T>, withOvershoot: boolean) => {
    const el = e.currentTarget;
    if (!el) return;
    const wasPressed = el.getAttribute('data-bubble-pressed') === 'true';
    el.removeAttribute('data-bubble-pressed');

    if (prefersReducedMotion()) {
      el.removeAttribute('data-bubble-release');
      el.removeAttribute('data-bubble-ripple');
      return;
    }

    if (wasPressed && withOvershoot && !disabled) {
      el.setAttribute('data-bubble-release', 'true');
      window.setTimeout(() => {
        if (el.getAttribute('data-bubble-pressed') !== 'true') {
          el.removeAttribute('data-bubble-release');
        }
      }, 280);
    } else {
      el.removeAttribute('data-bubble-release');
    }

    if (ripple) {
      el.setAttribute('data-bubble-ripple', 'fading');
      window.setTimeout(() => {
        if (el.getAttribute('data-bubble-pressed') !== 'true') {
          el.removeAttribute('data-bubble-ripple');
        }
      }, 400);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<T>) => {
    if (disabled || !ripple) return;
    const el = e.currentTarget;
    if (el && el.getAttribute('data-bubble-pressed') === 'true') {
      updateTouchCoords(e);
    }
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: (e) => handleRelease(e, true),
    onPointerLeave: (e) => handleRelease(e, false),
    onPointerCancel: (e) => handleRelease(e, false),
    ...(ripple ? { onPointerMove: handlePointerMove } : {}),
  };
}
