import React from 'react';

/**
 * Wraps dynamic imports with automatic retry and stale-chunk auto-reload logic.
 * Solves "TypeError: Failed to fetch dynamically imported module" when a new deployment updates asset hashes.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkName: string = 'screen'
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const sessionKey = `chunk_reload_${chunkName}`;
    try {
      return await factory();
    } catch (err: any) {
      console.warn(`[Dynamic Import Warning] Failed to load module for ${chunkName}:`, err);
      
      const isChunkError =
        err?.message?.includes('Failed to fetch dynamically imported module') ||
        err?.message?.includes('Loading chunk') ||
        err?.message?.includes('error loading dynamically imported module') ||
        err?.name === 'ChunkLoadError' ||
        err?.name === 'TypeError';

      if (isChunkError) {
        const lastReload = sessionStorage.getItem(sessionKey);
        const now = Date.now();

        // If not reloaded within the last 15 seconds, reload page to fetch latest index.html with new asset hashes
        if (!lastReload || now - Number(lastReload) > 15000) {
          sessionStorage.setItem(sessionKey, String(now));
          console.log(`[Dynamic Import] Stale chunk detected for ${chunkName}. Performing one-time reload to refresh assets.`);
          window.location.reload();
          // Return a placeholder while reload occurs
          return new Promise<never>(() => {});
        }
      }

      // If already reloaded recently or not a chunk error, rethrow so ChunkErrorBoundary can catch it
      throw err;
    }
  });
}
