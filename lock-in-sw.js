const CACHE = "focus-bro-shell-v3";
const ASSETS = [
  "index.html",
  "The%20Lock-In%20Room.html",
  "Study-Techniques.html",
  "Feyman-techniques.html",
  "Self-Tought-room.html",
  "Timetable.html",
  "lock-in-manifest.json",
  "focus-bro.css",
  "focus-bro-nav.js",
  "Focus%20bro.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  })));
});
