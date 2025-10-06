// Service Worker for caching strategies
const CACHE_NAME = 'compucar-v1';
const STATIC_CACHE = 'compucar-static-v1';
const DYNAMIC_CACHE = 'compucar-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html', // Fallback page
];

// API routes to cache
const API_CACHE_PATTERNS = [
  '/api/products',
  '/api/categories',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle static assets (Cache First)
  if (request.destination === 'image' || 
      request.destination === 'font' || 
      request.destination === 'style' ||
      request.destination === 'script') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((fetchResponse) => {
              // Only cache successful responses
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return fetchResponse;
            });
        })
    );
    return;
  }

  // Handle API calls (Network First with cache fallback)
  if (url.pathname.startsWith('/api/')) {
    const shouldCache = API_CACHE_PATTERNS.some(pattern => 
      url.pathname.startsWith(pattern)
    );

    if (shouldCache) {
      event.respondWith(
        fetch(request)
          .then((fetchResponse) => {
            // Cache successful API responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  // Cache with 5 minute expiry
                  const headers = new Headers(responseClone.headers);
                  headers.set('sw-cache-timestamp', Date.now().toString());
                  const cachedResponse = new Response(responseClone.body, {
                    status: responseClone.status,
                    statusText: responseClone.statusText,
                    headers: headers
                  });
                  cache.put(request, cachedResponse);
                });
            }
            return fetchResponse;
          })
          .catch(() => {
            // Fallback to cache on network failure
            return caches.match(request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  // Check if cache is still fresh (5 minutes)
                  const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
                  if (cacheTimestamp) {
                    const age = Date.now() - parseInt(cacheTimestamp);
                    if (age < 5 * 60 * 1000) { // 5 minutes
                      return cachedResponse;
                    }
                  }
                }
                // Return generic error response
                return new Response(
                  JSON.stringify({ error: 'Network unavailable', cached: false }),
                  { 
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                  }
                );
              });
          })
      );
      return;
    }
  }

  // Handle page navigation (Network First)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((fetchResponse) => {
          // Cache successful page responses
          if (fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return fetchResponse;
        })
        .catch(() => {
          // Fallback to cache or offline page
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});
