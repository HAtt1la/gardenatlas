const CACHE_NAME = 'gardenatlas-v6';
const ASSETS_TO_CACHE = [
  '/gardenatlas/',
  '/gardenatlas/index.html',
  '/gardenatlas/manifest.json',
  '/gardenatlas/icon.svg',
  '/gardenatlas/icon-192.png',
  '/gardenatlas/icon-512.png'
];

// Install event - cache app shell, but do NOT skip waiting
// (user will be prompted to update via the app UI)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Allow the app to trigger activation of the waiting SW
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch event
// - Navigation (HTML): network-first so the browser always gets a fresh shell
//   when online; falls back to cached index.html when offline.
// - Everything else: cache-first for performance, but also revalidate in the
//   background so the next load gets the updated asset.
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip browser extension requests
  if (!event.request.url.startsWith('http')) return;

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    // Network-first for HTML navigation: always try to get a fresh page.
    // This ensures users see the latest version without manual cache clears.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/gardenatlas/index.html')))
    );
  } else {
    // Stale-while-revalidate for assets: serve cache immediately, refresh in background.
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const networkFetch = fetch(event.request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => null);

          return cachedResponse || networkFetch;
        });
      })
    );
  }
});
