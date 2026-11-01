const CACHE_NAME = 'shs-boardly-mcq-v8';

const ASSETS_TO_CACHE = [
  '/logo.png',
  '/favicon.svg',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle API Requests (Network First, Cache Fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[ServiceWorker] Offline detected, fetching API response from cache');
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'Offline mode active. Using local question bank.'
            }),
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Handle Navigation Requests (Network First - ensures fresh index.html with current chunk hashes)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            if (url.pathname === '/' || url.pathname === '/index.html') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseToCache));
            }
          }
          return networkResponse;
        })
        .catch(async () => {
          // Navigation requests for other paths must never return the cached page
          if (url.pathname !== '/' && url.pathname !== '/index.html') {
            return new Response('Network offline', { status: 503, statusText: 'Offline' });
          }
          console.log('[ServiceWorker] Offline detected during navigation, serving cached index.html');
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Let browser handle video/audio range & streaming requests directly
  if (/\.(webm|mp4|ogg|mp3|wav)$/i.test(url.pathname)) {
    return;
  }

  // Handle JavaScript, CSS & Store Assets (Never cache HTML fallbacks on missing assets)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const contentType = (networkResponse && networkResponse.headers && networkResponse.headers.get('content-type')) || '';
          if (networkResponse && networkResponse.status === 200 && !contentType.includes('text/html')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static Assets (Images, Icons, Fonts: Cache First, never cache HTML fallbacks)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        const cachedType = (cachedResponse.headers && cachedResponse.headers.get('content-type')) || '';
        if (!cachedType.includes('text/html')) {
          return cachedResponse;
        }
      }
      return fetch(event.request).then((networkResponse) => {
        const contentType = (networkResponse && networkResponse.headers && networkResponse.headers.get('content-type')) || '';
        if (networkResponse && networkResponse.status === 200 && !contentType.includes('text/html')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      });
    })
  );
});

// Allow clients to trigger skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
