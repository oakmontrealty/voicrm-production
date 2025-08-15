// VoiCRM Service Worker - Offline Support & Reliability
const CACHE_VERSION = 'voicrm-v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/styles.css',
  '/styles/globals.css',
  '/styles/mobile.css'
];

// API endpoints to cache
const API_CACHE_ROUTES = [
  '/api/contacts',
  '/api/user/profile',
  '/api/settings'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );
  
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== DATA_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch Event - Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default strategy
  event.respondWith(handleDynamicRequest(request));
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(DATA_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cache-Time', new Date().toISOString());
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Return offline response for critical APIs
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This feature is not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Check cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache for future use
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Static fetch failed:', request.url);
    // Return a placeholder for images
    if (request.destination === 'image') {
      return caches.match('/images/placeholder.png');
    }
    throw error;
  }
}

// Handle navigation with offline page fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful HTML responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Navigation failed, showing offline page');
    
    // Try to get from cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Handle other requests with network-first strategy
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync triggered');
  
  if (event.tag === 'sync-calls') {
    event.waitUntil(syncCallData());
  } else if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContactData());
  } else if (event.tag === 'sync-activities') {
    event.waitUntil(syncActivityData());
  }
});

// Sync offline call data
async function syncCallData() {
  const db = await getIndexedDB();
  const tx = db.transaction('pending_calls', 'readonly');
  const store = tx.objectStore('pending_calls');
  const calls = await store.getAll();
  
  for (const call of calls) {
    try {
      const response = await fetch('/api/calls/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(call)
      });
      
      if (response.ok) {
        // Remove from pending after successful sync
        const deleteTx = db.transaction('pending_calls', 'readwrite');
        await deleteTx.objectStore('pending_calls').delete(call.id);
      }
    } catch (error) {
      console.error('[ServiceWorker] Sync failed for call:', call.id);
    }
  }
}

// Sync offline contact data
async function syncContactData() {
  const db = await getIndexedDB();
  const tx = db.transaction('pending_contacts', 'readonly');
  const store = tx.objectStore('pending_contacts');
  const contacts = await store.getAll();
  
  for (const contact of contacts) {
    try {
      const response = await fetch('/api/contacts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      
      if (response.ok) {
        const deleteTx = db.transaction('pending_contacts', 'readwrite');
        await deleteTx.objectStore('pending_contacts').delete(contact.id);
      }
    } catch (error) {
      console.error('[ServiceWorker] Sync failed for contact:', contact.id);
    }
  }
}

// Sync activity data
async function syncActivityData() {
  const db = await getIndexedDB();
  const tx = db.transaction('pending_activities', 'readonly');
  const store = tx.objectStore('pending_activities');
  const activities = await store.getAll();
  
  for (const activity of activities) {
    try {
      const response = await fetch('/api/activities/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      });
      
      if (response.ok) {
        const deleteTx = db.transaction('pending_activities', 'readwrite');
        await deleteTx.objectStore('pending_activities').delete(activity.id);
      }
    } catch (error) {
      console.error('[ServiceWorker] Sync failed for activity:', activity.id);
    }
  }
}

// Get IndexedDB instance
async function getIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VoiCRM', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for offline data
      if (!db.objectStoreNames.contains('pending_calls')) {
        db.createObjectStore('pending_calls', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_contacts')) {
        db.createObjectStore('pending_contacts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_activities')) {
        db.createObjectStore('pending_activities', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached_data')) {
        db.createObjectStore('cached_data', { keyPath: 'key' });
      }
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from VoiCRM',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'voicrm-notification',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('VoiCRM', options)
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

// Periodic background sync for data freshness
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-data') {
    event.waitUntil(updateCachedData());
  }
});

// Update cached data periodically
async function updateCachedData() {
  const criticalAPIs = [
    '/api/contacts',
    '/api/user/profile',
    '/api/settings'
  ];
  
  const cache = await caches.open(DATA_CACHE);
  
  for (const api of criticalAPIs) {
    try {
      const response = await fetch(api);
      if (response.ok) {
        await cache.put(api, response);
      }
    } catch (error) {
      console.log('[ServiceWorker] Failed to update cache for:', api);
    }
  }
}

console.log('[ServiceWorker] Service Worker loaded');