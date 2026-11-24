import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DEFAULT_PLANS_CONFIG,
  normalizePlansConfig,
  type PlansConfigDoc,
} from '@/lib/planTier';

// Shared singleton cache with 5-minute TTL (one-time fetch instead of permanent onSnapshot listener)
const PLANS_CONFIG_TTL_MS = 5 * 60 * 1000;
let cachedPlansConfig: PlansConfigDoc = DEFAULT_PLANS_CONFIG;
let hasLoadedOnce = false;
let lastFetchedAt = 0;
let inFlightFetch: Promise<PlansConfigDoc> | null = null;
const listeners = new Set<(cfg: PlansConfigDoc) => void>();

function notifyAll(cfg: PlansConfigDoc) {
  cachedPlansConfig = cfg;
  hasLoadedOnce = true;
  lastFetchedAt = Date.now();
  for (const cb of listeners) {
    try {
      cb(cfg);
    } catch {
      // ignore subscriber errors
    }
  }
}

function ensureFetched() {
  if (hasLoadedOnce && Date.now() - lastFetchedAt < PLANS_CONFIG_TTL_MS) {
    return;
  }
  if (inFlightFetch) return;
  inFlightFetch = getDoc(doc(db, 'config', 'plans'))
    .then((snap) => {
      if (snap.exists()) {
        const normalized = normalizePlansConfig(snap.data() as Record<string, any>);
        notifyAll(normalized);
        return normalized;
      }
      notifyAll(DEFAULT_PLANS_CONFIG);
      return DEFAULT_PLANS_CONFIG;
    })
    .catch(() => {
      notifyAll(cachedPlansConfig);
      return cachedPlansConfig;
    })
    .finally(() => {
      inFlightFetch = null;
    });
}

/**
 * Returns `config/plans` from Firestore via a shared cached fetch with instant built-in defaults.
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
    ensureFetched();
    if (hasLoadedOnce) {
      setConfig(cachedPlansConfig);
      setLoading(false);
    }
    return () => {
      listeners.delete(onUpdate);
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
