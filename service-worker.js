const CACHE_NAME = 'mpdg-pwa-hub-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './apps/treatment-planner/',
  './apps/treatment-planner/index.html',
  './apps/treatment-planner/app.js',
  './apps/treatment-planner/style.css',
  './data/procedures.csv',
  './data/fees.csv',
  './data/categories.csv'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
