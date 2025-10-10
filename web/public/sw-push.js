// Push notification service worker for SafeWork Pro
// Handles background push notifications for critical safety alerts

const CACHE_NAME = "safework-push-v1";
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000";

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("[SW] Installing push service worker");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/icon-192x192.png", "/icon-512x512.png", "/badge-72x72.png"]);
    })
  );

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating push service worker");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let notificationData = {};

  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.error("[SW] Error parsing push data:", error);
    notificationData = {
      title: "SafeWork Pro Alert",
      body: "You have a new safety notification",
      priority: "HIGH",
    };
  }

  const options = {
    body: notificationData.body,
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    image: notificationData.image,
    data: {
      url: notificationData.url || "/",
      notificationId: notificationData.notificationId,
      type: notificationData.type,
      priority: notificationData.priority,
      timestamp: Date.now(),
    },
    actions: notificationData.actions || [
      {
        action: "view",
        title: "Bekijken",
        icon: "/icon-192x192.png",
      },
      {
        action: "dismiss",
        title: "Negeren",
      },
    ],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    tag: notificationData.tag || `safework-${notificationData.type}`,
    renotify: notificationData.renotify || false,
    timestamp: notificationData.timestamp || Date.now(),
    vibrate: notificationData.priority === "CRITICAL" ? [200, 100, 200] : [100],
  };

  // Handle critical alerts with higher urgency
  if (notificationData.priority === "CRITICAL") {
    options.requireInteraction = true;
    options.silent = false;
    options.tag = "critical-alert";
  }

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, options)
      .then(() => {
        // Track notification delivery
        return trackNotificationEvent("DELIVERED", notificationData);
      })
      .catch((error) => {
        console.error("[SW] Error showing notification:", error);
        return trackNotificationEvent("FAILED", notificationData, error.message);
      })
  );
});

// Notification click event - handle user interaction
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  // Track click event
  trackNotificationEvent("CLICKED", data, action);

  if (action === "dismiss") {
    return;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const url = data.url || "/";

        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error("[SW] Error handling notification click:", error);
      })
  );
});

// Background sync for offline notification tracking
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "notification-events") {
    event.waitUntil(syncNotificationEvents());
  }
});

// Helper function to track notification events
async function trackNotificationEvent(status, data, errorMessage = null) {
  try {
    const eventData = {
      notificationId: data.notificationId,
      type: data.type,
      priority: data.priority,
      status,
      timestamp: Date.now(),
      errorMessage,
    };

    // Store event locally for sync when online
    const events = await getStoredEvents();
    events.push(eventData);
    await storeEvents(events);

    // Try to send to server if online
    if (navigator.onLine) {
      await sendEventToServer(eventData);
    }
  } catch (error) {
    console.error("[SW] Error tracking notification event:", error);
  }
}

// Get stored events from IndexedDB
async function getStoredEvents() {
  return new Promise((resolve) => {
    const request = indexedDB.open("SafeWorkPro", 1);

    request.onerror = () => resolve([]);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(["notificationEvents"], "readonly");
      const store = transaction.objectStore("notificationEvents");
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => resolve([]);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("notificationEvents")) {
        const store = db.createObjectStore("notificationEvents", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

// Store events in IndexedDB
async function storeEvents(events) {
  return new Promise((resolve) => {
    const request = indexedDB.open("SafeWorkPro", 1);

    request.onerror = () => resolve();

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(["notificationEvents"], "readwrite");
      const store = transaction.objectStore("notificationEvents");

      // Clear existing events
      store.clear().onsuccess = () => {
        // Add new events
        events.forEach((eventData) => {
          store.add(eventData);
        });
        resolve();
      };
    };
  });
}

// Send event to server
async function sendEventToServer(eventData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (response.ok) {
      // Remove from local storage if successfully sent
      const events = await getStoredEvents();
      const filteredEvents = events.filter((event) => event.timestamp !== eventData.timestamp);
      await storeEvents(filteredEvents);
    }
  } catch (error) {
    console.error("[SW] Error sending event to server:", error);
  }
}

// Sync notification events when back online
async function syncNotificationEvents() {
  const events = await getStoredEvents();

  if (events.length === 0) {
    return;
  }

  // Send events in batches
  const batchSize = 10;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    await Promise.all(batch.map((eventData) => sendEventToServer(eventData)));
  }
}

// Handle messages from main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener("error", (event) => {
  console.error("[SW] Service worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled promise rejection:", event.reason);
});
