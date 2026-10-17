const CACHE = "focus-bro-shell-v12";
const ASSETS = [
  "index.html",
  "Focus-Bro.html",
  "Study-Techniques.html",
  "Feyman-techniques.html",
  "Self-Tought-room.html",
  "Timetable.html",
  "Profile.html",
  "focus-bro-manifest.json",
  "focus-bro.css",
  "focus-bro-nav.js",
  "supabase-config.js",
  "focus-bro-auth.js",
  "supabase-auth-ui.js",
  "auth-ui.css",
  "Focus%20bro.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
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
