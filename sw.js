const CACHE = "mpdg-hub-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./hub-styles.css",
  "./hub-app.js",
  "./apps-config.js",
  "./treatment-planner.html",
  "./styles.css",
  "./app.js",
  "./codes.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
