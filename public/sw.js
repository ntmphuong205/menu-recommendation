// Deliberately does no caching — this dashboard polls live order/table data
// every few seconds, and a caching service worker risks showing an admin
// stale orders or seat status. It exists only so the app meets Chrome's
// PWA installability checks (required for the Play Store TWA wrapper).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
