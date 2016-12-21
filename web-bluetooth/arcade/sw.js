// Version 0.2

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('arcade').then(cache => {
      return cache.addAll(['index.html'])
      .then(_ => self.skipWaiting());
    })
  )
});

self.addEventListener('activate',  event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
