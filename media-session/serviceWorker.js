// Version 3

const FALLBACK_ARTWORK = 'fallbackArtwork.png';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(initCache());
});

function initCache() {
  caches.open('artwork-cache')
  .then(cache => cache.add(FALLBACK_ARTWORK));
}

self.addEventListener('fetch', event => {
  // TODO: Find a better filter for artwork.
  if (event.request.url.endsWith('jpg')) {
    event.respondWith(handleFetchArtwork(event.request));
  }
});

function handleFetchArtwork(request) {
  return getCacheArtwork(request)
  .then(cacheResponse => cacheResponse || getNetworkArtwork(request));
}

function getCacheArtwork(request) {
  return caches.open('artwork-cache')
  .then(cache => cache.match(request));
}

function getNetworkArtwork(request) {
  // Return cached fallback artwork.
  return getCacheArtwork(new Request(FALLBACK_ARTWORK))
  .then(cacheResponse => {
    // Fetch artwork in parallel.
    fetch(request)
    .then(networkResponse => {
      if (networkResponse.status === 200) {
        // Add artwork to the cache for later use and ask clients to update
        // media session artwork.
        addArtworkToCache(request, networkResponse)
        .then(_ => broadcastArtworkUrlToClients(request.url));
      }
    });
    return cacheResponse;
  });
}

function addArtworkToCache(request, response) {
  return caches.open('artwork-cache')
  .then(cache => cache.put(request, response));
}

function broadcastArtworkUrlToClients(artworkUrl) {
  self.clients.matchAll()
  .then(clients => {
    clients.forEach(client => client.postMessage({artworkUrl}));
  });
}
