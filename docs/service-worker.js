const CACHE_NAME = 'pmtiles-offline-v1';
const BASE_PATH = '/pmtiles-offline';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/demo.html`,
  `${BASE_PATH}/manifest.json`
];

// External CDN assets to cache
const CDN_ASSETS = [
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://unpkg.com/pmtiles@4.3.1/dist/pmtiles.js',
  'https://unpkg.com/pmtiles-offline@1.0.0/dist/index.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return Promise.all([
        cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('[Service Worker] Failed to cache static assets:', err);
        }),
        cache.addAll(CDN_ASSETS).catch(err => {
          console.warn('[Service Worker] Failed to cache CDN assets:', err);
        })
      ]);
    }).then(() => {
      console.log('[Service Worker] Install complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip PMTiles data files (these are handled by IndexedDB)
  if (url.pathname.endsWith('.pmtiles')) {
    return;
  }

  // Cache-first strategy for static assets and CDN resources
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', request.url);
        return cachedResponse;
      }

      console.log('[Service Worker] Fetching from network:', request.url);
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();

        // Cache successful responses
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache same-origin requests or CDN assets we know about
          if (url.origin === location.origin || CDN_ASSETS.includes(request.url)) {
            console.log('[Service Worker] Caching new resource:', request.url);
            cache.put(request, responseToCache);
          }
        });

        return response;
      }).catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);

        // Return a custom offline page or error response
        if (request.destination === 'document') {
          return caches.match(`${BASE_PATH}/index.html`);
        }

        throw error;
      });
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
