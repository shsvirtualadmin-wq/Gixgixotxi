/**
 * Boardly App Shell Service Worker
 * - Cache-first for hashed static bundles (`/assets/*`), fonts, and icons
 * - Network-first with fast fallback for HTML shell navigations
 * - Never caches authenticated mutations, admin routes, or personal endpoints
 */
const CACHE_NAME = 'boardly-shell-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Vite dev sources, API endpoints, or admin calls in SW
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // Hashed build assets (`/assets/*`) & static icons: Cache-First
  if (
    url.pathname.startsWith('/assets/') ||
    /\.(woff2?|ttf|otf|png|svg|ico|webp)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const netRes = await fetch(req);
          if (netRes && netRes.status === 200) {
            cache.put(req, netRes.clone());
          }
          return netRes;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })
    );
    return;
  }

  // HTML Navigation requests: Network-first with cached App Shell fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((netRes) => {
          if (netRes && netRes.status === 200) {
            const copy = netRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy)).catch(() => {});
          }
          return netRes;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedRoot = await cache.match('/');
          if (cachedRoot) return cachedRoot;
          throw new Error('Offline');
        })
    );
  }
});
