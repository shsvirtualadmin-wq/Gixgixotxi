import React from 'react';

/**
 * Registry of active module loaders for background preloading.
 */
const preloadedModules = new Map<string, Promise<any>>();

/**
 * Preload a lazy component factory in the background.
 */
export function preloadComponent<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkName?: string
): Promise<{ default: T }> {
  const key = chunkName || factory.toString();
  if (!preloadedModules.has(key)) {
    const promise = factory().catch((err) => {
      console.warn(`[Background Preload Warning] Preload for ${chunkName || 'chunk'} deferred:`, err);
      preloadedModules.delete(key);
      throw err;
    });
    preloadedModules.set(key, promise);
  }
  return preloadedModules.get(key)!;
}

/**
 * Wraps dynamic imports with automatic silent retries.
 * NEVER forces a disruptive page reload.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkName: string = 'screen'
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: any = null;
    
    // Auto-retry up to 3 times with progressive backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const cachedPromise = preloadedModules.get(chunkName);
        if (cachedPromise) {
          return await cachedPromise;
        }
        return await factory();
      } catch (err: any) {
        lastError = err;
        console.warn(`[Dynamic Import] Attempt ${attempt}/3 failed for ${chunkName}:`, err);
        
        // Wait briefly before retrying (100ms, 300ms)
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 150));
        }
      }
    }

    console.error(`[Dynamic Import Fatal] All retries exhausted for ${chunkName}:`, lastError);
    throw lastError;
  });
}
