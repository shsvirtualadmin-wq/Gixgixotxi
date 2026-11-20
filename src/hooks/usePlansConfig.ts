import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DEFAULT_PLANS_CONFIG,
  normalizePlansConfig,
  type PlansConfigDoc,
} from '@/lib/planTier';

// Shared singleton subscription so every screen using usePlansConfig() shares ONE Firestore listener
let cachedPlansConfig: PlansConfigDoc = DEFAULT_PLANS_CONFIG;
let hasLoadedOnce = false;
let activeUnsub: (() => void) | null = null;
const listeners = new Set<(cfg: PlansConfigDoc) => void>();

function notifyAll(cfg: PlansConfigDoc) {
  cachedPlansConfig = cfg;
  hasLoadedOnce = true;
  for (const cb of listeners) {
    try {
      cb(cfg);
    } catch {
      // ignore subscriber errors
    }
  }
}

function ensureSubscribed() {
  if (activeUnsub) return;
  try {
    const ref = doc(db, 'config', 'plans');
    activeUnsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          notifyAll(normalizePlansConfig(snap.data() as Record<string, any>));
        } else {
          notifyAll(DEFAULT_PLANS_CONFIG);
        }
      },
      () => {
        // Fallback silently to defaults on network/permission error
        notifyAll(cachedPlansConfig);
      }
    );
  } catch {
    notifyAll(DEFAULT_PLANS_CONFIG);
  }
}

/**
 * Returns live `config/plans` from Firestore with instant built-in defaults as fallback.
 */
export function usePlansConfig(): {
  config: PlansConfigDoc;
  loading: boolean;
} {
  const [config, setConfig] = useState<PlansConfigDoc>(cachedPlansConfig);
  const [loading, setLoading] = useState<boolean>(!hasLoadedOnce);

  useEffect(() => {
    const onUpdate = (next: PlansConfigDoc) => {
      setConfig(next);
      setLoading(false);
    };
    listeners.add(onUpdate);
    ensureSubscribed();
    if (hasLoadedOnce) {
      setConfig(cachedPlansConfig);
      setLoading(false);
    }
    return () => {
      listeners.delete(onUpdate);
      if (listeners.size === 0 && activeUnsub) {
        activeUnsub();
        activeUnsub = null;
      }
    };
  }, []);

  return { config, loading };
}

/**
 * One-shot fetch of `config/plans` (for services & admin actions).
 */
export async function fetchPlansConfigOnce(): Promise<PlansConfigDoc> {
  try {
    const snap = await getDoc(doc(db, 'config', 'plans'));
    if (snap.exists()) {
      const normalized = normalizePlansConfig(snap.data() as Record<string, any>);
      cachedPlansConfig = normalized;
      hasLoadedOnce = true;
      return normalized;
    }
  } catch {
    // fallback to cached / default
  }
  return cachedPlansConfig;
}

/**
 * Persists `config/plans` in Firestore (admin only — enforced by firestore.rules).
 */
export async function savePlansConfig(
  next: Omit<PlansConfigDoc, 'updatedAt' | 'updatedBy'>,
  adminEmail: string
): Promise<PlansConfigDoc> {
  const normalized = normalizePlansConfig({
    ...next,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'admin',
  });
  await setDoc(doc(db, 'config', 'plans'), normalized, { merge: true });
  notifyAll(normalized);
  return normalized;
}

export function getCachedPlansConfig(): PlansConfigDoc {
  return cachedPlansConfig;
}
