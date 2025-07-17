/**
 * Service Worker for Cursor Time Tracker PWA
 * Provides offline functionality and caching strategies
 */

const CACHE_NAME = 'time-tracker-v1';
const STATIC_CACHE_NAME = 'time-tracker-static-v1';
const DYNAMIC_CACHE_NAME = 'time-tracker-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/offline',
  // Add your critical CSS and JS files here
];

// API routes that should be cached
const API_CACHE_PATTERNS = [
  '/api/auth/',
  '/api/projects/',
  '/api/sessions/',
  '/api/analytics/',
];

// Maximum cache size
const MAX_CACHE_SIZE = 50;

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    // Handle navigation requests
    if (request.mode === 'navigate') {
      event.respondWith(handleNavigationRequest(request));
      return;
    }

    // Handle API requests
    if (isApiRequest(request)) {
      event.respondWith(handleApiRequest(request));
      return;
    }

    // Handle static assets
    if (isStaticAsset(request)) {
      event.respondWith(handleStaticAssetRequest(request));
      return;
    }

    // Handle other GET requests with network-first strategy
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Handle navigation requests (HTML pages)
 * Strategy: Network first, fall back to cache, then offline page
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fall back to offline page
    const offlineResponse = await caches.match('/offline');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

/**
 * Handle API requests
 * Strategy: Network first with background sync capability
 */
async function handleApiRequest(request) {
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request:', request.url);
    
    // For GET requests, try cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // For POST/PUT/DELETE, you might want to implement background sync
    // For now, return a meaningful error response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable',
        offline: true,
        timestamp: Date.now()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle static asset requests
 * Strategy: Cache first, fall back to network
 */
async function handleStaticAssetRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fall back to network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

/**
 * Handle generic requests
 * Strategy: Network first, fall back to cache
 */
async function handleGenericRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE_NAME, MAX_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Content not available offline', { status: 503 });
  }
}

/**
 * Check if request is for an API endpoint
 */
function isApiRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => 
    request.url.includes(pattern)
  );
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return pathname.startsWith('/images/') ||
         pathname.startsWith('/icons/') ||
         pathname.startsWith('/audio/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.gif') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.ttf');
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
  }
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-timer-data') {
    event.waitUntil(syncTimerData());
  }
  
  if (event.tag === 'sync-session-data') {
    event.waitUntil(syncSessionData());
  }
});

/**
 * Sync timer data when back online
 */
async function syncTimerData() {
  try {
    // Implementation would depend on your data storage strategy
    console.log('[SW] Syncing timer data...');
    
    // Example: Get pending timer data from IndexedDB
    // Send to server
    // Clear local pending data
    
  } catch (error) {
    console.error('[SW] Failed to sync timer data:', error);
  }
}

/**
 * Sync session data when back online
 */
async function syncSessionData() {
  try {
    console.log('[SW] Syncing session data...');
    
    // Similar to syncTimerData but for session information
    
  } catch (error) {
    console.error('[SW] Failed to sync session data:', error);
  }
}

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Time to take a break!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    tag: 'timer-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'start-break',
        title: 'Start Break',
        icon: '/icons/break.png'
      },
      {
        action: 'continue-work',
        title: 'Continue Working',
        icon: '/icons/work.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'Time Tracker';
  }
  
  event.waitUntil(
    self.registration.showNotification('Time Tracker', options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  const action = event.action;
  let url = '/dashboard';
  
  if (action === 'start-break') {
    url = '/dashboard?action=start-break';
  } else if (action === 'continue-work') {
    url = '/dashboard?action=continue-work';
  }
  
  event.waitUntil(
    clients.openWindow(url)
  );
});

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_TIMER_DATA') {
    // Cache timer data for offline use
    cacheTimerData(event.data.payload);
  }
});

/**
 * Cache timer data for offline access
 */
async function cacheTimerData(data) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/api/timer/current', response);
  } catch (error) {
    console.error('[SW] Failed to cache timer data:', error);
  }
}
