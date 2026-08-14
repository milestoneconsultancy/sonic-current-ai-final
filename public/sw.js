const CACHE_NAME = 'free-music-v4';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
];

// 1. Install: Precache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Precaching app shell...');
      // Use allSettled so one missing asset never fails the entire installation
      await Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Precache item missed (${asset}):`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate: Purge old cache versions and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch interceptor: Reliable offline fallback & Stale-While-Revalidate for app assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and proxy / API routes
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // A. Navigation Requests (Opening app, refreshing, standalone PWA launched offline)
  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          // Attempt network with 2.5s timeout for fast online response
          const networkPromise = fetch(request);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 2500)
          );

          const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', networkResponse.clone());
            cache.put('/', networkResponse.clone());
            return networkResponse;
          }
        } catch (netErr) {
          // Offline or network slow - fallback directly to cached shell
          console.log('[SW] Network failed for navigation, serving offline app shell.');
        }

        // Search cache for index.html or root
        const cachedIndex =
          (await caches.match('/index.html')) ||
          (await caches.match('/')) ||
          (await caches.match(request));

        if (cachedIndex) {
          return cachedIndex;
        }

        // Emergency fallback response if cache was somehow empty
        return new Response(
          `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>FREE MUSIC Offline</title><style>body{background:#020617;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;}</style></head><body><div><h2>FREE MUSIC Offline</h2><p>Please connect to the internet once to finish caching the application shell.</p><button onclick="window.location.reload()" style="background:#f59e0b;color:#020617;border:none;padding:10px 20px;border-radius:12px;font-weight:bold;cursor:pointer;">Retry</button></div></body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      })()
    );
    return;
  }

  // B. Static Assets (JS scripts, CSS styles, fonts, icons, manifest)
  event.respondWith(
    (async () => {
      // Check cache first
      const cached = await caches.match(request);

      // Background revalidate if online
      const fetchAndCachePromise = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      if (cached) {
        // Return cached immediately; update cache in background
        fetchAndCachePromise.catch(() => {});
        return cached;
      }

      // If not in cache, wait for network
      const networkResponse = await fetchAndCachePromise;
      if (networkResponse) {
        return networkResponse;
      }

      // Check loose URL match in cache (e.g. without query string)
      const looseMatch = await caches.match(url.pathname);
      if (looseMatch) {
        return looseMatch;
      }

      return new Response('Asset offline unavailable', { status: 503, statusText: 'Offline' });
    })()
  );
});
