/* Simple service worker stub for SafeWork Pro.
   next-pwa will generate a production-ready service worker when configured.
   This lightweight SW provides offline fallback for development/testing.
*/

const CACHE_NAME = "safework-sw-v1";
const OFFLINE_URL = "/offline";

const PRECACHE_RESOURCES = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_RESOURCES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) {
    return;
  }

  // Network-first for API paths
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          // Optionally cache GET responses
          if (request.method === "GET" && resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return resp;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Cache-first for navigation and assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((resp) => {
          // Cache successful responses
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return resp;
        })
        .catch(() => {
          // Fallback to offline page for navigations
          if (request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response(null, { status: 503, statusText: "Offline" });
        });
    })
  );
});
