// Version 1

const FALLBACK_ARTWORK = 'fallbackArtwork.png';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(initCache());
});

function initCache() {
  caches.open('artwork-cache')
  .then(cache => cache.add(FALLBACK_ARTWORK));
}

self.addEventListener('activate', event => {
  clients.claim();
});

self.addEventListener('fetch', event => {
  // TODO: Find a better filter for artwork.
  if (event.request.url.endsWith('jpg')) {
    event.respondWith(handleFetchArtwork(event.request));
  }
});

function handleFetchArtwork(request) {
  // If it's in the service worker cache already, return it otherwise fetch
  // network artwork.
  return getCacheArtwork(request)
  .then(cacheResponse => cacheResponse || getNetworkArtwork(request));
}

function getCacheArtwork(request) {
  return caches.open('artwork-cache')
  .then(cache => cache.match(request));
}

function getNetworkArtwork(request) {
   // Fetch network artwork.
   return fetch(request)
   .then(networkResponse => {
     if (networkResponse.status !== 200) {
       return Promise.reject('Network artwork response is not valid');
     }
     // Add artwork to the cache for later use and return network response.
     addArtworkToCache(request, networkResponse.clone())
     return networkResponse;
   })
   .catch(error => {
     // Return cached fallback artwork.
     return getCacheArtwork(new Request(FALLBACK_ARTWORK))
   });
}

function addArtworkToCache(request, response) {
  return caches.open('artwork-cache')
  .then(cache => cache.put(request, response));
}
