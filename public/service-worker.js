const CACHE = "focus-bro-shell-v20";
const ASSETS = [
  "/pages/dashboard",
  "/pages/focus-room",
  "/pages/timetable",
  "/pages/profile",
  "/pages/ai-connect",
  "/public/manifest.json",
  "/assets/css/global.css",
  "/assets/js/navigation.js",
  "/src/config/supabase.js",
  "/src/auth/auth.js",
  "/src/auth/auth-ui.js",
  "/assets/css/auth-ui.css",
  "/assets/images/Focus%20bro.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("message", event => {
  if (event.data && event.data.type === "FOCUS_BRO_ACTIVATE_UPDATE") self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
        return response;
      });
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  })));
});
