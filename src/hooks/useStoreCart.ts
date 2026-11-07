import { useState, useEffect, useCallback, useRef } from 'react';

const CART_STORAGE_PREFIX = 'boardly_store_cart_';

function getStorageKey(uid: string | null | undefined): string {
  return `${CART_STORAGE_PREFIX}${uid || 'guest'}`;
}

function readStoredCart(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
          .map((id) => id.trim())
      )
    );
  } catch {
    return [];
  }
}

function writeStoredCart(key: string, ids: string[]): void {
  try {
    if (ids.length === 0) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(ids));
    }
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export interface UseStoreCartOptions {
  uid: string | null | undefined;
  owned: string[];
}

export function useStoreCart({ uid, owned }: UseStoreCartOptions) {
  const storageKey = getStorageKey(uid);
  const prevUidRef = useRef<string | null | undefined>(uid);
  const ownedRef = useRef<string[]>(owned);
  ownedRef.current = owned;

  const [cartIds, setCartIds] = useState<string[]>(() => {
    const initial = readStoredCart(storageKey);
    const ownedSet = new Set(owned);
    return initial.filter((id) => !ownedSet.has(id));
  });

  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [cartPulseTick, setCartPulseTick] = useState<number>(0);

  // Handle user sign-in / sign-out transitions
  useEffect(() => {
    const prevUid = prevUidRef.current;
    prevUidRef.current = uid;

    // If user signed out (was logged in, now null/undefined), clear both previous user cart and guest cart
    if (prevUid && !uid) {
      writeStoredCart(getStorageKey(prevUid), []);
      writeStoredCart(getStorageKey(null), []);
      setCartIds([]);
      return;
    }

    // Load cart for the active user (and merge guest cart if signing in)
    const ownedSet = new Set(ownedRef.current);
    const userStored = readStoredCart(getStorageKey(uid));
    const guestStored = uid ? readStoredCart(getStorageKey(null)) : [];
    const merged = Array.from(new Set([...userStored, ...guestStored])).filter(
      (id) => !ownedSet.has(id)
    );
    if (uid && guestStored.length > 0) {
      writeStoredCart(getStorageKey(null), []);
    }
    writeStoredCart(getStorageKey(uid), merged);
    setCartIds(merged);
  }, [uid]);

  // Automatically strip any items that become owned
  useEffect(() => {
    if (!owned || owned.length === 0) return;
    const ownedSet = new Set(owned);
    setCartIds((prev) => {
      const filtered = prev.filter((id) => !ownedSet.has(id));
      if (filtered.length !== prev.length) {
        writeStoredCart(storageKey, filtered);
        return filtered;
      }
      return prev;
    });
  }, [owned, storageKey]);

  const addToCart = useCallback(
    (itemId: string) => {
      if (!itemId || owned.includes(itemId)) return false;
      let added = false;
      setCartIds((prev) => {
        if (prev.includes(itemId)) return prev;
        added = true;
        const next = [...prev, itemId];
        writeStoredCart(storageKey, next);
        return next;
      });
      setLastAddedId(itemId);
      setCartPulseTick((t) => t + 1);
      return added;
    },
    [owned, storageKey]
  );

  const removeFromCart = useCallback(
    (itemId: string) => {
      setCartIds((prev) => {
        if (!prev.includes(itemId)) return prev;
        const next = prev.filter((id) => id !== itemId);
        writeStoredCart(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const toggleCartItem = useCallback(
    (itemId: string): 'added' | 'removed' | 'owned' => {
      if (owned.includes(itemId)) return 'owned';
      let action: 'added' | 'removed' = 'added';
      setCartIds((prev) => {
        if (prev.includes(itemId)) {
          action = 'removed';
          const next = prev.filter((id) => id !== itemId);
          writeStoredCart(storageKey, next);
          return next;
        }
        action = 'added';
        const next = [...prev, itemId];
        writeStoredCart(storageKey, next);
        return next;
      });
      if (action === 'added') {
        setLastAddedId(itemId);
        setCartPulseTick((t) => t + 1);
      }
      return action;
    },
    [owned, storageKey]
  );

  const addMultipleToCart = useCallback(
    (itemIds: string[]): number => {
      const ownedSet = new Set(owned);
      const validIds = itemIds.filter((id) => id && !ownedSet.has(id));
      if (validIds.length === 0) return 0;

      let addedCount = 0;
      setCartIds((prev) => {
        const existing = new Set(prev);
        const toAdd = validIds.filter((id) => !existing.has(id));
        addedCount = toAdd.length;
        if (toAdd.length === 0) return prev;
        const next = [...prev, ...toAdd];
        writeStoredCart(storageKey, next);
        return next;
      });

      if (validIds.length > 0) {
        setLastAddedId(validIds[validIds.length - 1]);
        setCartPulseTick((t) => t + 1);
      }
      return addedCount;
    },
    [owned, storageKey]
  );

  const clearCart = useCallback(() => {
    writeStoredCart(storageKey, []);
    setCartIds([]);
  }, [storageKey]);

  const isInCart = useCallback(
    (itemId: string) => cartIds.includes(itemId),
    [cartIds]
  );

  return {
    cartIds,
    addToCart,
    removeFromCart,
    toggleCartItem,
    addMultipleToCart,
    clearCart,
    isInCart,
    lastAddedId,
    cartPulseTick,
  };
}
