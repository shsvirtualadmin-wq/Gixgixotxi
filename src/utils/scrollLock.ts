import { useEffect, useId } from 'react';

const activeScrollLockOwners = new Set<string>();

const LOCK_CLASSES = [
  'overflow-hidden',
  'modal-open',
  'scroll-locked',
  'no-scroll',
  'lock-scroll',
];

/**
 * Unconditionally clears any inline scroll-locking styles and classes
 * from both `document.body` and `document.documentElement`.
 */
export function clearDomScrollLocks(): void {
  if (typeof document === 'undefined') return;

  const { body, documentElement: html } = document;
  if (body) {
    body.style.overflow = '';
    body.style.overflowY = '';
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.height = '';
    body.style.paddingRight = '';
    body.style.pointerEvents = '';
    body.classList.remove(...LOCK_CLASSES);
  }
  if (html) {
    html.style.overflow = '';
    html.style.overflowY = '';
    html.style.position = '';
    html.style.top = '';
    html.style.width = '';
    html.style.height = '';
    html.style.paddingRight = '';
    html.style.pointerEvents = '';
    html.classList.remove(...LOCK_CLASSES);
  }
}

/**
 * Checks whether any modal/dialog element is currently mounted and actually visible on screen.
 */
export function hasVisibleOpenModalInDom(): boolean {
  if (typeof document === 'undefined' || !document.body) return false;

  const candidates = document.querySelectorAll<HTMLElement>(
    '[data-fullscreen-modal="true"], [role="dialog"][aria-modal="true"]'
  );

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i];
    if (!el || !el.isConnected) continue;
    if (
      el.classList.contains('fsm-page--closed') ||
      el.classList.contains('pointer-events-none') ||
      el.classList.contains('hidden') ||
      el.classList.contains('invisible') ||
      el.getAttribute('aria-hidden') === 'true'
    ) {
      continue;
    }

    // Check ancestor visibility (e.g., inactive KeepAliveTabsOutlet wrapper with display: none)
    let ancestorHidden = false;
    let curr: HTMLElement | null = el;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      if (curr.style?.display === 'none' || curr.hidden) {
        ancestorHidden = true;
        break;
      }
      const computed = typeof window !== 'undefined' ? window.getComputedStyle(curr) : null;
      if (
        computed &&
        (computed.display === 'none' ||
          computed.visibility === 'hidden' ||
          computed.opacity === '0' ||
          computed.pointerEvents === 'none')
      ) {
        ancestorHidden = true;
        break;
      }
      curr = curr.parentElement;
    }

    if (!ancestorHidden) {
      return true;
    }
  }

  return false;
}

/**
 * Safety cleanup invoked on dashboard mount, route changes, and modal close transitions.
 * If no modal is genuinely visible in the DOM, removes all scroll locks and stale modal attributes.
 */
export function safetyCleanupScrollLocks(force = false): void {
  if (typeof document === 'undefined' || !document.body) return;

  const modalVisible = !force && hasVisibleOpenModalInDom();
  if (!modalVisible) {
    activeScrollLockOwners.clear();
    clearDomScrollLocks();
    document.body.removeAttribute('data-fullscreen-modal-open');
    document.body.removeAttribute('data-pro-checkout-open');
    document.body.removeAttribute('data-hamburger-sheet-open');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('boardly:modal-change'));
    }
  }
}

export function acquireBodyScrollLock(ownerId: string): () => void {
  if (typeof document === 'undefined' || !document.body) {
    return () => {};
  }
  activeScrollLockOwners.add(ownerId);
  document.body.style.overflow = 'hidden';

  return () => {
    releaseBodyScrollLock(ownerId);
  };
}

export function releaseBodyScrollLock(ownerId: string): void {
  activeScrollLockOwners.delete(ownerId);
  if (activeScrollLockOwners.size === 0) {
    clearDomScrollLocks();
  } else if (typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      if (!hasVisibleOpenModalInDom()) {
        safetyCleanupScrollLocks(true);
      }
    });
  }
}

/**
 * React hook that locks body scroll ONLY while `isOpen` is true and guarantees
 * cleanup on close, unmount, or failure.
 */
export function useBodyScrollLock(isOpen: boolean, debugKey?: string): void {
  const reactId = useId();
  const ownerId = debugKey ? `${debugKey}:${reactId}` : reactId;

  useEffect(() => {
    if (!isOpen) {
      releaseBodyScrollLock(ownerId);
      return;
    }
    const release = acquireBodyScrollLock(ownerId);
    return () => {
      release();
    };
  }, [isOpen, ownerId]);
}
