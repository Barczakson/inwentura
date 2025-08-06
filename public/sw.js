const CACHE_NAME = 'inwentura-v1';
const API_CACHE_NAME = 'inwentura-api-v1';

// URLs to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// API endpoints that can be cached
const API_CACHE_URLS = [
  '/api/inwentura/products/categories',
  '/api/test-voice'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with network-first strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // For specific API endpoints, use cache-first strategy
    if (API_CACHE_URLS.some(apiUrl => url.pathname === apiUrl || url.pathname.startsWith(apiUrl))) {
      event.respondWith(
        caches.open(API_CACHE_NAME)
          .then((cache) => {
            return cache.match(event.request)
              .then((response) => {
                // Return cached response if exists
                if (response) {
                  // Fetch in background and update cache
                  fetch(event.request)
                    .then((networkResponse) => {
                      if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                      }
                    })
                    .catch(() => {
                      // Ignore network errors for background fetch
                    });
                  return response;
                }
                
                // Otherwise, fetch from network
                return fetch(event.request)
                  .then((networkResponse) => {
                    if (networkResponse.ok) {
                      // Cache the response for future use
                      const responseToCache = networkResponse.clone();
                      cache.put(event.request, responseToCache);
                    }
                    return networkResponse;
                  })
                  .catch(() => {
                    // Return offline response for API failures
                    return new Response(
                      JSON.stringify({
                        success: false,
                        error: 'Offline - brak połączenia z internetem',
                        offline: true
                      }),
                      {
                        headers: { 'Content-Type': 'application/json' },
                        status: 503,
                        statusText: 'Service Unavailable'
                      }
                    );
                  });
              });
          })
      );
      return;
    }
    
    // For other API endpoints (POST, PUT, DELETE), use network-only strategy
    // but queue them when offline
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Queue the request for when online
          return queueRequest(event.request);
        })
    );
    return;
  }
  
  // Handle static assets - cache-first strategy
  event.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            return fetch(event.request)
              .then((networkResponse) => {
                // Cache new static assets
                if (networkResponse.ok && event.request.method === 'GET') {
                  const responseToCache = networkResponse.clone();
                  cache.put(event.request, responseToCache);
                }
                return networkResponse;
              });
          });
      })
  );
});

// Background sync for queued requests
const requestQueue = [];

function queueRequest(request) {
  return new Promise((resolve, reject) => {
    const requestData = {
      request: request.clone(),
      resolve,
      reject,
      timestamp: Date.now()
    };
    
    requestQueue.push(requestData);
    
    // Try to sync immediately
    syncRequests();
  });
}

async function syncRequests() {
  if (!navigator.onLine || requestQueue.length === 0) {
    return;
  }
  
  const requestsToSync = [...requestQueue];
  requestQueue.length = 0; // Clear the queue
  
  for (const { request, resolve, reject } of requestsToSync) {
    try {
      const response = await fetch(request);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  }
}

// Listen for online events to sync queued requests
self.addEventListener('online', () => {
  syncRequests();
});

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});