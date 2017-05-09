const cachingStrategy = async request => {
  const cache = await caches.open('mustache-v1');
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  const fetchResponse = await fetch(request);
  await cache.put(request, fetchResponse.clone());
  return fetchResponse;
};

self.addEventListener('fetch', e => {
  e.respondWith(cachingStrategy(e.request));
});
