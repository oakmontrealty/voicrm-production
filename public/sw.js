// Service Worker for VoiCRM
const CACHE_NAME = 'voicrm-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/styles/globals.css',
  '/_next/static/css/app.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/framework.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/index.js',
  '/_next/static/chunks/pages/dashboard.js',
  '/_next/static/chunks/pages/contacts.js',
  '/_next/static/chunks/pages/calls.js',
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache offline page first
        return cache.addAll([OFFLINE_URL]).then(() => {
          // Try to cache other resources, but don't fail if some are unavailable
          return Promise.allSettled(
            urlsToCache.map(url => 
              cache.add(url).catch(err => 
                console.log(`Failed to cache ${url}:`, err)
              )
            )
          );
        });
      })
      .catch(err => console.log('Cache installation failed:', err))
  );
  
  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip chrome-extension and non-HTTP(S) requests
  if (url.protocol === 'chrome-extension:' || 
      (!url.protocol.startsWith('http'))) {
    return;
  }
  
  // Handle API calls differently - network first, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return a JSON error response for API calls
          return new Response(
            JSON.stringify({ 
              error: 'Offline', 
              message: 'This feature requires an internet connection' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }
  
  // For navigation requests (HTML pages), try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Try to return cached page
          return caches.match(request)
            .then((response) => {
              if (response) {
                return response;
              }
              // Return offline page as fallback
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // For all other requests (CSS, JS, images), use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          // Return cached version
          return response;
        }
        
        // Not in cache, fetch from network
        return fetch(request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          
          // Cache the fetched response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache same-origin and CORS-enabled requests
            if (request.url.startsWith(self.location.origin) || 
                response.type === 'cors') {
              cache.put(request, responseToCache);
            }
          });
          
          return response;
        });
      })
      .catch(() => {
        // Network failed and no cache available
        if (request.destination === 'image') {
          // Return placeholder image
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999">Image Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Function to sync offline data
async function syncOfflineData() {
  try {
    // Get all offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // Send offline data to server
      for (const data of offlineData) {
        await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        });
      }
      
      // Clear offline data after successful sync
      await clearOfflineData();
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Helper functions for offline data storage
async function getOfflineData() {
  // This would interface with IndexedDB in a real implementation
  return [];
}

async function clearOfflineData() {
  // This would clear IndexedDB in a real implementation
  return;
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from VoiCRM',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('VoiCRM Alert', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});