import React from 'react';

export const isChunkOrDynamicImportError = (err: any): boolean => {
  const msg = err?.message || String(err || '');
  const name = err?.name || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Failed to load module script') ||
    name === 'ChunkLoadError' ||
    (name === 'TypeError' && (msg.includes('fetch') || msg.includes('import')))
  );
};

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
    } catch (firstErr: any) {
      console.warn(`[Dynamic Import Warning] Initial attempt failed for ${chunkName}:`, firstErr);

      // Attempt 1 immediate retry after 300ms in case of temporary network latency or dev-mode compilation
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return await factory();
      } catch (err: any) {
        console.warn(`[Dynamic Import Warning] Retry attempt failed for ${chunkName}:`, err);

        const isChunkError = isChunkOrDynamicImportError(err) || isChunkOrDynamicImportError(firstErr);

        if (isChunkError) {
          const lastReload = sessionStorage.getItem(sessionKey);
          const now = Date.now();

          // If not reloaded within the last 20 seconds, reload page to fetch latest index.html with new asset hashes
          if (!lastReload || now - Number(lastReload) > 20000) {
            sessionStorage.setItem(sessionKey, String(now));
            console.log(`[Dynamic Import] Stale chunk detected for ${chunkName}. Performing one-time reload to refresh assets.`);

            if (chunkName.toLowerCase().includes('studybuddy')) {
              sessionStorage.setItem('boardly_reopen_study_buddy', 'true');
            }

            // Invalidate service worker caches before reloading if possible
            if ('caches' in window) {
              try {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
              } catch {}
            }

            window.location.reload();
            // Return a placeholder while reload occurs to prevent error boundary crash
            return new Promise<never>(() => {});
          }
        }

        // If already reloaded recently or not a chunk error, rethrow so ChunkErrorBoundary can catch it
        throw err;
      }
    }
  });
}

