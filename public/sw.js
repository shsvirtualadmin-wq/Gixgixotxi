/**
 * Boardly Self-Cleaning Service Worker
 * - Updates immediately (skipWaiting + clients.claim)
 * - Clears all legacy caches (boardly-shell-*) so stale index.html or chunks are never served
 * - Never caches index.html or intercepts navigation/asset requests with stale responses
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => {
        if (self.registration && typeof self.registration.unregister === 'function') {
          return self.registration.unregister();
        }
        return false;
      })
      .catch(() => {})
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
