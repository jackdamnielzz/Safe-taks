
# SafeWork Pro - Progressive Web App (PWA) Requirements & Offline Strategy

**Version**: 1.0  
**Last Updated**: September 29, 2025  
**Status**: Foundation Specification  
**Purpose**: Complete PWA architecture for offline-capable TRA/LMRA mobile field operations

---

## Table of Contents

1. [Overview](#overview)
2. [PWA Manifest Specification](#pwa-manifest-specification)
3. [Service Worker Strategy](#service-worker-strategy)
4. [Offline Data Synchronization](#offline-data-synchronization)
5. [Cache Strategy](#cache-strategy)
6. [Installation & Update Flow](#installation--update-flow)
7. [Push Notifications](#push-notifications)
8. [Offline-First UI/UX Patterns](#offline-first-uiux-patterns)
9. [Background Sync & Queue Management](#background-sync--queue-management)
10. [Performance & Storage Optimization](#performance--storage-optimization)
11. [Testing Strategy](#testing-strategy)
12. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Overview

### 1.1 Business Requirements

**Critical Use Case**: Field workers executing LMRAs in remote construction sites, offshore platforms, and industrial facilities with unreliable or no internet connectivity.

**Success Criteria**:
- ✅ 100% LMRA functionality available offline
- ✅ Data automatically syncs when connection restored
- ✅ Zero data loss during offline operations
- ✅ Installable on iOS Safari and Android Chrome
- ✅ App-like experience on mobile devices

### 1.2 Technical Goals

1. **Offline-First Architecture**: App works offline by default, online is enhancement
2. **Intelligent Caching**: Smart caching strategies for different data types
3. **Background Sync**: Automatic data synchronization in background
4. **Fast Load Times**: Sub-2-second load on 3G networks
5. **Storage Efficiency**: Maximum 100MB cached data per organization

### 1.3 Target Platforms

**Primary Platforms**:
- iOS Safari 14+ (iPhone, iPad)
- Android Chrome 90+
- Desktop Chrome/Edge/Safari (for safety managers)

**Progressive Enhancement**:
- Older browsers receive basic functionality
- Modern browsers get full PWA features
- Graceful degradation for unsupported features

---

## 2. PWA Manifest Specification

### 2.1 Complete Manifest File

**File**: `public/manifest.json`

```json
{
  "name": "SafeWork Pro - TRA/LMRA Safety Management",
  "short_name": "SafeWork Pro",
  "description": "Professional Task Risk Analysis and Last Minute Risk Analysis platform for field safety operations",
  
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  
  "theme_color": "#FF8B00",
  "background_color": "#FFFFFF",
  
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/screenshots/desktop-dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard Overview"
    },
    {
      "src": "/screenshots/mobile-lmra.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "LMRA Execution"
    },
    {
      "src": "/screenshots/mobile-tra-list.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "TRA Library"
    }
  ],
  
  "categories": ["business", "productivity", "utilities"],
  "iarc_rating_id": "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",
  
  "shortcuts": [
    {
      "name": "Execute LMRA",
      "short_name": "LMRA",
      "description": "Start Last Minute Risk Analysis",
      "url": "/lmra/new",
      "icons": [
        {
          "src": "/icons/shortcut-lmra.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Create TRA",
      "short_name": "New TRA",
      "description": "Create Task Risk Analysis",
      "url": "/tras/new",
      "icons": [
        {
          "src": "/icons/shortcut-tra.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Dashboard",
      "short_name": "Home",
      "description": "Safety Dashboard",
      "url": "/dashboard",
      "icons": [
        {
          "src": "/icons/shortcut-dashboard.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ],
  
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "photos",
          "accept": ["image/*"]
        }
      ]
    }
  },
  
  "related_applications": [],
  "prefer_related_applications": false,
  
  "protocol_handlers": [
    {
      "protocol": "web+safework",
      "url": "/handle-protocol?url=%s"
    }
  ],
  
  "edge_side_panel": {
    "preferred_width": 400
  }
}
```

### 2.2 Icon Requirements

**Icon Specifications**:

| Size | Purpose | Format | Safe Zone |
|------|---------|--------|-----------|
| 72x72 | iOS | PNG | N/A |
| 96x96 | Android | PNG | N/A |
| 128x128 | Chrome | PNG | N/A |
| 144x144 | Windows | PNG | N/A |
| 152x152 | iOS | PNG | N/A |
| 192x192 | Android | PNG | N/A |
| 384x384 | Android | PNG | N/A |
| 512x512 | Android | PNG | N/A |
| 192x192 | Maskable | PNG | 40% margin |
| 512x512 | Maskable | PNG | 40% margin |

**Icon Design Guidelines**:
- **Primary**: SafeWork Pro logo with orange background (#FF8B00)
- **Maskable**: Logo centered with 40% safe zone (80px margin on 192px icon)
- **Monochrome**: White icon on transparent for adaptive icons
- **Format**: PNG-24 with transparency
- **Export**: Sharp edges, no anti-aliasing artifacts

### 2.3 Splash Screens (iOS)

**iOS Splash Screen Sizes**:
```html
<!-- iPhone X, XS, 11 Pro, 12 Mini, 13 Mini -->
<link rel="apple-touch-startup-image" href="/splash/iphone-x.png" 
      media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)">

<!-- iPhone XR, 11, 12, 12 Pro, 13, 13 Pro -->
<link rel="apple-touch-startup-image" href="/splash/iphone-xr.png" 
      media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)">

<!-- iPhone XS Max, 11 Pro Max, 12 Pro Max, 13 Pro Max -->
<link rel="apple-touch-startup-image" href="/splash/iphone-xs-max.png" 
      media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)">

<!-- iPad Pro 12.9" -->
<link rel="apple-touch-startup-image" href="/splash/ipad-pro-12-9.png" 
      media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)">
```

**Splash Screen Design**:
- Background: White (#FFFFFF)
- Logo: SafeWork Pro centered
- Loading indicator: Orange spinner below logo
- Status: "Loading..." text in Neutral-600

---

## 3. Service Worker Strategy

### 3.1 Service Worker Architecture

**Multi-Layer Caching Strategy**:

```
┌─────────────────────────────────────────────────────┐
│                 Service Worker                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   App Shell  │  │  API Cache   │  │  Runtime  │ │
│  │   (Precache) │  │  (Strategy)  │  │  (Images) │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│          │                 │                │        │
│          v                 v                v        │
│  ┌─────────────────────────────────────────────┐   │
│  │          Cache Storage (IndexedDB)          │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │      Background Sync Queue (IndexedDB)      │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 3.2 Service Worker Lifecycle

**File**: `public/sw.js` (or Next.js PWA generated)

```javascript
// Service Worker Version
const CACHE_VERSION = 'v1.0.0';
const APP_SHELL_CACHE = `safework-shell-${CACHE_VERSION}`;
const API_CACHE = `safework-api-${CACHE_VERSION}`;
const RUNTIME_CACHE = `safework-runtime-${CACHE_VERSION}`;

// App Shell Resources (Precached)
const APP_SHELL_RESOURCES = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/_next/static/css/main.css',
  '/_next/static/js/main.js',
  // Add critical JS/CSS bundles
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(APP_SHELL_RESOURCES);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate Event - Clean Old Caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old versions
            return cacheName.startsWith('safework-') && 
                   !cacheName.includes(CACHE_VERSION);
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch Event - Route Requests to Appropriate Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Route to appropriate caching strategy
  if (isAPIRequest(url)) {
    event.respondWith(apiCacheStrategy(request));
  } else if (isImageRequest(url)) {
    event.respondWith(imageCacheStrategy(request));
  } else if (isAppShellRequest(url)) {
    event.respondWith(appShellStrategy(request));
  } else {
    event.respondWith(networkFirstStrategy(request));
  }
});

// Helper: Check if API request
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Helper: Check if image request
function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname);
}

// Helper: Check if app shell request
function isAppShellRequest(url) {
  return APP_SHELL_RESOURCES.some(resource => url.pathname === resource);
}
```

### 3.3 Caching Strategies

**Strategy 1: Cache First (App Shell)**
```javascript
async function appShellStrategy(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit (App Shell):', request.url);
    return cached;
  }
  
  // Fallback to network
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('[SW] App shell fetch failed:', error);
    return caches.match('/offline'); // Offline fallback
  }
}
```

**Strategy 2: Network First with Cache Fallback (API)**
```javascript
async function apiCacheStrategy(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request, {
      timeout: 5000 // 5 second timeout
    });
    
    // Cache successful responses (except POST/PUT/DELETE)
    if (response.ok && request.method === 'GET') {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Cache hit (API):', request.url);
      // Add custom header to indicate cached response
      const headers = new Headers(cached.headers);
      headers.set('X-From-Cache', 'true');
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      });
    }
    
    // No cache available
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No network connection and no cached data available' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
```

**Strategy 3: Stale While Revalidate (Images)**
```javascript
async function imageCacheStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  // Return cached immediately, fetch in background
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // Fallback to cached on error
  
  return cached || fetchPromise;
}
```

**Strategy 4: Network Only (Mutations)**
```javascript
async function networkOnlyStrategy(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Queue for background sync if POST/PUT/DELETE
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await queueBackgroundSync(request);
      
      return new Response(
        JSON.stringify({ 
          queued: true,
          message: 'Request queued for background sync' 
        }),
        { 
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}
```

### 3.4 Background Sync

```javascript
// Register background sync for failed mutations
async function queueBackgroundSync(request) {
  const db = await openSyncDatabase();
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  await db.add('sync-queue', requestData);
  
  // Register background sync event
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-requests');
  }
}

// Background sync event handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  const db = await openSyncDatabase();
  const queue = await db.getAll('sync-queue');
  
  console.log(`[SW] Syncing ${queue.length} queued requests`);
  
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });
      
      if (response.ok) {
        await db.delete('sync-queue', item.id);
        console.log('[SW] Synced:', item.url);
      }
    } catch (error) {
      console.error('[SW] Sync failed:', item.url, error);
      // Keep in queue for retry
    }
  }
}
```

---

## 4. Offline Data Synchronization

### 4.1 Sync Architecture

**Data Sync Layers**:

```
┌─────────────────────────────────────────────────────┐
│              Application Layer                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │         Firestore SDK (Online)               │  │
│  └──────────────────────────────────────────────┘  │
│                      │                               │
│                      v                               │
│  ┌──────────────────────────────────────────────┐  │
│  │    Offline Persistence Layer (IndexedDB)     │  │
│  └──────────────────────────────────────────────┘  │
│                      │                               │
│                      v                               │
│  ┌──────────────────────────────────────────────┐  │
│  │         Sync Queue Manager                   │  │
│  │  • Pending writes                            │  │
│  │  • Conflict resolution                       │  │
│  │  • Retry logic                               │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 4.2 Firestore Offline Persistence

**Configuration**:
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence
try {
  // Multi-tab support (preferred)
  await enableMultiTabIndexedDbPersistence(db);
  console.log('[Firestore] Multi-tab offline persistence enabled');
} catch (err) {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, use single-tab
    await enableIndexedDbPersistence(db);
    console.log('[Firestore] Single-tab offline persistence enabled');
  } else if (err.code === 'unimplemented') {
    console.warn('[Firestore] Offline persistence not supported');
  }
}

export { db };
```

### 4.3 Sync Queue Management

**File**: `lib/sync/SyncManager.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SyncQueueDB extends DBSchema {
  'lmra-queue': {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      collection: string;
      documentId: string;
      data: any;
      timestamp: number;
      retries: number;
      lastError?: string;
    };
    indexes: { 'by-timestamp': number };
  };
  'photo-queue': {
    key: string;
    value: {
      id: string;
      lmraId: string;
      blob: Blob;
      filename: string;
      timestamp: number;
      uploaded: boolean;
    };
    indexes: { 'by-lmra': string };
  };
}

class SyncManager {
  private db: IDBPDatabase<SyncQueueDB> | null = null;
  
  async init() {
    this.db = await openDB<SyncQueueDB>('safework-sync', 1, {
      upgrade(db) {
        // LMRA Sync Queue
        const lmraStore = db.createObjectStore('lmra-queue', { keyPath: 'id' });
        lmraStore.createIndex('by-timestamp', 'timestamp');
        
        // Photo Upload Queue
        const photoStore = db.createObjectStore('photo-queue', { keyPath: 'id' });
        photoStore.createIndex('by-lmra', 'lmraId');
      },
    });
  }
  
  // Queue LMRA for sync
  async queueLMRA(type: 'create' | 'update' | 'delete', documentId: string, data: any) {
    if (!this.db) await this.init();
    
    const queueItem = {
      id: `lmra_${Date.now()}_${Math.random().toString(36)}`,
      type,
      collection: 'lmraSessions',
      documentId,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    
    await this.db!.add('lmra-queue', queueItem);
    console.log('[Sync] Queued LMRA:', queueItem.id);
    
    // Attempt immediate sync if online
    if (navigator.onLine) {
      this.syncNow();
    }
  }
  
  // Queue photo for upload
  async queuePhoto(lmraId: string, blob: Blob, filename: string) {
    if (!this.db) await this.init();
    
    const queueItem = {
      id: `photo_${Date.now()}_${Math.random().toString(36)}`,
      lmraId,
      blob,
      filename,
      timestamp: Date.now(),
      uploaded: false
    };
    
    await this.db!.add('photo-queue', queueItem);
    console.log('[Sync] Queued photo:', queueItem.id);
    
    if (navigator.onLine) {
      this.syncPhotos();
    }
  }
  
  // Sync queued LMRAs
  async syncNow() {
    if (!this.db) await this.init();
    if (!navigator.onLine) {
      console.log('[Sync] Offline, skipping sync');
      return;
    }
    
    const queue = await this.db!.getAllFromIndex('lmra-queue', 'by-timestamp');
    console.log(`[Sync] Syncing ${queue.length} LMRAs`);
    
    for (const item of queue) {
      try {
        await this.syncItem(item);
        await this.db!.delete('lmra-queue', item.id);
        console.log('[Sync] Synced:', item.id);
      } catch (error) {
        console.error('[Sync] Failed:', item.id, error);
        
        // Update retry count
        item.retries++;
        item.lastError = error.message;
        
        if (item.retries < 5) {
          await this.db!.put('lmra-queue', item);
        } else {
          // Move to failed queue or alert user
          console.error('[Sync] Max retries exceeded:', item.id);
        }
      }
    }
  }
  
  private async syncItem(item: any) {
    const { type, collection, documentId, data } = item;
    
    // Construct Firestore path
    const orgId = await this.getOrgId();
    const docPath = `organizations/${orgId}/${collection}/${documentId}`;
    
    switch (type) {
      case 'create':
        await setDoc(doc(db, docPath), data);
        break;
      case 'update':
        await updateDoc(doc(db, docPath), data);
        break;
      case 'delete':
        await deleteDoc(doc(db, docPath));
        break;
    }
  }
  
  // Sync photos
  async syncPhotos() {
    if (!this.db) await this.init();
    if (!navigator.onLine) return;
    
    const photos = await this.db!.getAll('photo-queue');
    const pending = photos.filter(p => !p.uploaded);
    
    console.log(`[Sync] Uploading ${pending.length} photos`);
    
    for (const photo of pending) {
      try {
        await this.uploadPhoto(photo);
        
        // Mark as uploaded
        photo.uploaded = true;
        await this.db!.put('photo-queue', photo);
      } catch (error) {
        console.error('[Sync] Photo upload failed:', photo.id, error);
      }
    }
    
    // Clean up uploaded photos after 24 hours
    const cleanupTime = Date.now() - (24 * 60 * 60 * 1000);
    for (const photo of photos) {
      if (photo.uploaded && photo.timestamp < cleanupTime) {
        await this.db!.delete('photo-queue', photo.id);
      }
    }
  }
  
  private async uploadPhoto(photo: any) {
    const { lmraId, blob, filename } = photo;
    const orgId = await this.getOrgId();
    const storagePath = `organizations/${orgId}/lmra/${lmraId}/photos/${filename}`;
    
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);
    
    console.log('[Sync] Photo uploaded:', filename);
  }
  
  private async getOrgId(): Promise<string> {
    // Get from auth token custom claims
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdTokenResult();
    return token.claims.orgId as string;
  }
  
  // Get sync status
  async getSyncStatus() {
    if (!this.db) await this.init();
    
    const lmraQueue = await this.db!.count('lmra-queue');
    const photoQueue = await this.db!.getAll('photo-queue');
    const pendingPhotos = photoQueue.filter(p => !p.uploaded).length;
    
    return {
      pendingLMRAs: lmraQueue,
      pendingPhotos,
      isOnline: navigator.onLine,
      lastSync: new Date().toISOString()
    };
  }
}

export const syncManager = new SyncManager();
```

### 4.4 Conflict Resolution

**Strategy**: Last Write Wins (LWW) with Timestamp

```typescript
interface SyncConflict {
  localVersion: any;
  serverVersion: any;
  localTimestamp: number;
  serverTimestamp: number;
}

async function resolveConflict(conflict: SyncConflict): Promise<any> {
  // Compare timestamps
  if (conflict.localTimestamp > conflict.serverTimestamp) {
    console.log('[Conflict] Local version newer, using local');
    return conflict.localVersion;
  } else {
    console.log('[Conflict] Server version newer, using server');
    return conflict.serverVersion;
  }
}
```

**Future Enhancement**: Field-level merge for LMRA updates

---

## 5. Cache Strategy

### 5.1 Cache Hierarchy

**Priority 1: Critical Offline Resources** (Precached)
- App shell HTML/CSS/JS
- Offline fallback page
- Essential icons and images
- Critical TRA data for today's work

**Priority 2: TRA Data** (Network First, Cache Fallback)
- Assigned TRAs for current user
- TRA templates
- Hazard library
- User profile and competencies

**Priority 3: LMRA Sessions** (Network First)
- Recent LMRA sessions (7 days)
- In-progress sessions
- Submitted but unsynced sessions

**Priority 4: Media Assets** (Stale While Revalidate)
- Photos from LMRAs
- User avatars
- Organization branding

**Priority 5: Analytics & Non-Critical** (Network Only)
- Analytics events
- Audit logs
- Non-essential API calls

### 5.2 Cache Size Management

**Storage Quota Strategy**:
```typescript
class CacheManager {
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_PHOTO_CACHE = 50 * 1024 * 1024; // 50MB for photos
  
  async checkStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = (used / quota) * 100;
      
      console.log(`[Storage] Using ${this.formatBytes(used)} of ${this.formatBytes(quota)} (${percentUsed.toFixed(1)}%)`);
      
      if (percentUsed > 80) {
        console.warn('[Storage] Quota almost full, cleaning caches');
        await this.cleanOldCaches();
      }
      
      return { used, quota, percentUsed };
    }
  }
  
  async cleanOldCaches() {
    const caches = await caches.keys();
    
    for (const cacheName of caches) {
      if (cacheName.includes('runtime')) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        // Remove oldest 50% of items
        const toRemove = keys.slice(0, Math.floor(keys.length / 2));
        await Promise.all(toRemove.map(key => cache.delete(key)));
        
        console.log(`[Cache] Cleaned ${toRemove.length} items from ${cacheName}`);
      }
    }
  }
  
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
```

### 5.3 Smart Pre-caching

**Pre-cache Today's Work**:
```typescript
async function precacheTodaysTRAs(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Query TRAs assigned to user with work scheduled today
  const trasQuery = query(
    collection(db, `organizations/${orgId}/tras`),
    where('teamMembers', 'array-contains', userId),
    where('validFrom', '<=', today),
    where('validUntil', '>=', today),
    where('status', '==', 'approved')
  );
  
  const snapshot = await getDocs(trasQuery);
  const tras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Store in IndexedDB for offline access
  const db = await openDB('safework-offline', 1);
  const tx = db.transaction('tras', 'readwrite');
  
  for (const tra of tras) {
    await tx.store.put(tra);
  }
  
  await tx.done;
  console.log(`[Precache] Cached ${tras.length} TRAs for offline access`);
}
```

---

## 6. Installation & Update Flow

### 6.1 Installation Prompt

**Component**: `components/PWAInstallPrompt.tsx`

```typescript
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after user has used app for 5 minutes
      setTimeout(() => {
        if (!isAppInstalled()) {
          setShowPrompt(true);
        }
      }, 5 * 60 * 1000);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };
  
  if (!showPrompt || !deferredPrompt) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl p-6 z-50">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <img src="/icons/icon-72x72.png" alt="SafeWork Pro" className="w-12 h-12 rounded-lg" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 mb-1">
            Install SafeWork Pro
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Install our app for faster access and offline LMRA execution
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="btn btn-primary btn-sm"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="btn btn-ghost btn-sm"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}
```

### 6.2 Update Notification

**Component**: `components/PWAUpdatePrompt.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('[PWA] Service Worker registered:', registration);
      
      // Check for updates every hour
      setInterval(() => {
        registration?.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error);
    },
  });
  
  const handleUpdate = () => {
    updateServiceWorker(true);
  };
  
  const handleDismiss = () => {
    setNeedRefresh(false);
  };
  
  if (offlineReady) {
    return (
      <div className="fixed top-4 right-4 bg-success-50 border border-success-500 rounded-lg p-4 shadow-lg z-50">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-success-900">
            App ready to work offline
          </p>
        </div>
      </div>
    );
  }
  
  if (needRefresh) {
    return (
      <div className="fixed top-4 right-4 bg-primary-50 border border-primary-500 rounded-lg p-4 shadow-lg z-50">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-900 mb-2">
              New version available
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="btn btn-primary btn-sm"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="btn btn-ghost btn-sm"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
```

### 6.3 Installation Flow

**User Journey**:

```
Step 1: First Visit
├─ User accesses app via browser
├─ Service worker installs in background
└─ App shell cached

Step 2: Usage (5 minutes)
├─ User performs LMRA or TRA work
├─ App proves value
└─ Install prompt triggered

Step 3: Install Decision
├─ User clicks "Install App"
│  ├─ Browser native install prompt
│  ├─ App added to home screen
│  └─ Standalone mode enabled
└─ OR User clicks "Not Now"
   └─ Prompt dismissed for 7 days

Step 4: Post-Install
├─ Launch from home screen
├─ Full-screen app experience
└─ Automatic offline support
```

---

## 7. Push Notifications

### 7.1 Notification Strategy

**Use Cases**:
1. **Critical Safety Alerts**: LMRA stop-work triggered
2. **Approval Requests**: TRA pending your approval
3. **Competency Expiry**: Certification expiring in 7 days
4. **Sync Status**: Data successfully synced when back online

### 7.2 Notification Permission

**Component**: `components/NotificationPrompt.tsx`

```typescript
import { useState, useEffect } from 'react';

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    // Check if permission already granted/denied
    if ('Notification' in window && Notification.permission === 'default') {
      // Show prompt after user creates first LMRA
      const hasCreatedLMRA = localStorage.getItem('has-created-lmra');
      if (hasCreatedLMRA) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }
  }, []);
  
  const handleEnable = async () => {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('[Notifications] Permission granted');
      await subscribeToNotifications();
      setShowPrompt(false);
    }
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl p-6 z-50">
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        Enable Notifications
      </h3>
      <p className="text-sm text-neutral-600 mb-4">
        Get notified about critical safety alerts, approval requests, and sync status
      </p>
      <div className="flex gap-2">
        <button onClick={handleEnable} className="btn btn-primary btn-sm">
          Enable
        </button>
        <button onClick={() => setShowPrompt(false)} className="btn btn-ghost btn-sm">
          Not Now
        </button>
      </div>
    </div>
  );
}

async function subscribeToNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Notifications] Not supported');
    return;
  }
  
  const registration = await navigator.serviceWorker.ready;
  
  // Subscribe to push notifications
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  
  // Send subscription to server
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
  
  console.log('[Notifications] Subscribed successfully');
}
```

### 7.3 Service Worker Notification Handler

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: data.tag || 'default',
    requireInteraction: data.priority === 'high',
    actions: data.actions || [],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if app is already open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
```

---

## 8. Offline-First UI/UX Patterns

### 8.1 Connection Status Indicator

**Component**: `components/ConnectionStatus.tsx`

```typescript
import { useState, useEffect } from 'react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!showBanner) return null;
  
  return (
    <div className={`fixed top-0 left-0 right-0 p-3 text-center text-sm font-medium z-50 ${
      isOnline ? 'bg-success-500 text-white' : 'bg-warning-500 text-white'
    }`}>
      {isOnline ? (
        <>
          <svg className="inline w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          Back online - syncing data...
        </>
      ) : (
        <>
          <svg className="inline w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
          Offline mode - data will sync when connection restored
        </>
      )}
    </div>
  );
}
```

### 8.2 Sync Status Display

**Component**: `components/SyncStatus.tsx`

```typescript
import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/sync/SyncManager';

export function SyncStatus() {
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    const updateStatus = async () => {
      const syncStatus = await syncManager.getSyncStatus();
      setStatus(syncStatus);
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Update every 10s
    
    return () => clearInterval(interval);
  }, []);
  
  if (!status || (status.pendingLMRAs === 0 && status.pendingPhotos === 0)) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="animate-spin">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-900">
            Syncing data...
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {status.pendingLMRAs > 0 && `${status.pendingLMRAs} LMRA${status.pendingLMRAs > 1 ? 's' : ''}`}
            {status.pendingLMRAs > 0 && status.pendingPhotos > 0 && ', '}
            {status.pendingPhotos > 0 && `${status.pendingPhotos} photo${status.pendingPhotos > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 8.3 Offline Indicators on Forms

**Pattern**: Visual indicators for offline-saved data

```typescript
<div className="flex items-center gap-2 text-sm text-neutral-600">
  {isSavedLocally && (
    <>
      <svg className="w-4 h-4 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
      <span>Saved locally - will sync when online</span>
    </>
  )}
  {isSynced && (
    <>
      <svg className="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>Synced to cloud</span>
    </>
  )}
</div>
```

---

## 9. Background Sync & Queue Management

### 9.1 Background Sync Registration

```typescript
// lib/sync/backgroundSync.ts
export async function registerBackgroundSync(tag: string = 'sync-data') {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    
    try {
      await registration.sync.register(tag);
      console.log('[Background Sync] Registered:', tag);
      return true;
    } catch (error) {
      console.error('[Background Sync] Registration failed:', error);
      return false;
    }
  }
  
  console.warn('[Background Sync] Not supported');
  return false;
}
```

### 9.2 Periodic Background Sync (Future)

```typescript
// Request periodic sync permission (Chrome only)
async function requestPeriodicSync() {
  if ('periodicSync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    
    try {
      await registration.periodicSync.register('sync-tras', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      });
      console.log('[Periodic Sync] Registered');
    } catch (error) {
      console.error('[Periodic Sync] Failed:', error);
    }
  }
}
```

---

## 10. Performance & Storage Optimization

### 10.1 Image Compression

**Client-Side Compression**:
```typescript
import imageCompression from 'browser-image-compression';

async function compressPhoto(file: File): Promise<Blob> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg'
  };
  
  try {
    const compressed = await imageCompression(file, options);
    console.log(`[Compression] Original: ${file.size} bytes, Compressed: ${compressed.size} bytes`);
    return compressed;
  } catch (error) {
    console.error('[Compression] Failed:', error);
    return file;
  }
}
```

### 10.2 Lazy Loading Strategy

```typescript
// lib/lazyLoad.ts
export function lazyLoadImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
      imageObserver.observe(img);
    });
  }
}
```

### 10.3 Cache Cleanup Strategy

```typescript
// Automatically clean caches when storage is low
async function cleanupOldData() {
  const estimate = await navigator.storage.estimate();
  const percentUsed = (estimate.usage! / estimate.quota!) * 100;
  
  if (percentUsed > 80) {
    console.log('[Cleanup] Storage > 80%, cleaning old data');
    
    // Remove old LMRA sessions (> 30 days)
    const db = await openDB('safework-offline');
    const tx = db.transaction('lmra-sessions', 'readwrite');
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const oldSessions = await tx.store
      .index('by-timestamp')
      .getAllKeys(IDBKeyRange.upperBound(cutoff));
    
    for (const key of oldSessions) {
      await tx.store.delete(key);
    }
    
    console.log(`[Cleanup] Removed ${oldSessions.length} old sessions`);
  }
}
```

---

## 11. Testing Strategy

### 11.1 Offline Testing Scenarios

**Test Cases**:
1. ✅ Install app and verify offline functionality
2. ✅ Execute LMRA completely offline
3. ✅ Take photos offline and verify queue
4. ✅ Go offline mid-LMRA and resume
5. ✅ Sync data when connection restored
6. ✅ Handle conflicts (local vs server)
7. ✅ Storage quota exceeded gracefully
8. ✅ Update service worker without data loss

### 11.2 Browser Testing Matrix

| Browser | Version | Install | Offline | Background Sync | Push |
|---------|---------|---------|---------|-----------------|------|
| Chrome Android | 90+ | ✅ | ✅ | ✅ | ✅ |
| Safari iOS | 14+ | ✅ | ✅ | ❌ | ❌ |
| Chrome Desktop | 90+ | ✅ | ✅ | ✅ | ✅ |
| Edge | 90+ | ✅ | ✅ | ✅ | ✅ |
| Firefox | 90+ | ✅ | ✅ | ❌ | ✅ |

### 11.3 Lighthouse PWA Audit

**Target Scores**:
- ✅ Performance: > 90
- ✅ Accessibility: > 90
- ✅ Best Practices: 100
- ✅ SEO: > 90
- ✅ PWA: 100

**Required Checks**:
- [x] Registers a service worker
- [x] Responds with 200 when offline
- [x] Provides a valid web app manifest
- [x] Uses HTTPS
- [x] Redirects HTTP to HTTPS
- [x] Has a viewport meta tag
- [x] Content sized correctly for viewport
- [x] Has a `<meta name="theme-color">` tag
- [x] Provides a valid apple-touch-icon
- [x] Installable

---

## 12. Implementation Roadmap

### 12.1 Phase 1: Foundation (Week 1-2)

**Tasks**:
- [x] Create PWA manifest file with all icons
- [x] Configure Next.js for PWA (next-pwa plugin)
- [ ] Generate all required icon sizes
- [ ] Create offline fallback page
- [ ] Test installation on iOS and Android

**Deliverables**:
- manifest.json
- Icon set (10 sizes)
- Offline.html
- Installation guide

### 12.2 Phase 2: Service Worker (Week 3-4)

**Tasks**:
- [ ] Implement service worker with caching strategies
- [ ] Configure app shell caching
- [ ] Implement network-first for API calls
- [ ] Add stale-while-revalidate for images
- [ ] Test offline functionality

**Deliverables**:
- Service worker implementation
- Cache strategies configured
- Offline mode working

### 12.3 Phase 3: Offline Data Sync (Week 5-6)

**Tasks**:
- [ ] Enable Firestore offline persistence
- [ ] Implement sync queue manager
- [ ] Create background sync handlers
- [ ] Add conflict resolution
- [ ] Test offline LMRA execution

**Deliverables**:
- Sync manager implementation
- Offline LMRA fully functional
- Data sync working

### 12.4 Phase 4: UI/UX & Polish (Week 7-8)

**Tasks**:
- [ ] Add connection status indicators
- [ ] Create install prompt component
- [ ] Build update notification system
- [ ] Implement sync status display
- [ ] Add offline badges on data

**Deliverables**:
- Complete offline UI/UX
- Install prompts working
- Update flow smooth

### 12.5 Phase 5: Testing & Optimization (Week 9-10)

**Tasks**:
- [ ] Cross-browser testing (iOS, Android, Desktop)
- [ ] Performance optimization
- [ ] Storage quota management
- [ ] Lighthouse PWA audit
- [ ] User acceptance testing

**Deliverables**:
- Test reports
- Performance optimizations
- Lighthouse score > 90
- Production-ready PWA

---

## 13. Key Decisions & Rationale

### Decision 1: Next PWA vs Custom Service Worker

**Chosen**: Next PWA plugin (with custom SW extensions)

**Rationale**:
- ✅