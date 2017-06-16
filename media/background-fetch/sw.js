useArrayBuffer = false;

addEventListener('install', event => {
  skipWaiting();
  event.waitUntil(async function() {
    // Cache some static files first for offline.
    const cache = await caches.open('files-cache');
    await cache.addAll(['./', 'index.html']);
  }());

  const channel = new BroadcastChannel('channel');
  channel.postMessage({ status: 'Installed service worker.' });
});

addEventListener('activate', event => {
  clients.claim();
});


addEventListener('fetch', event => {
  event.respondWith(loadFromCacheOrFetch(event.request));
});

async function loadFromCacheOrFetch(request) {
  const channel = new BroadcastChannel('channel');
  channel.postMessage({ status: 'Fetch request for ' + request.url });

  const response = await caches.match(request);

  // Fetch from network if it's not already in the cache.
  if (!response) {
    channel.postMessage({ status: 'Fetching from network...' });
    return fetch(request);
  }

  // Browser asks for a range request. Let's provide one reconstructed manually from the cache.
  if (request.headers.has('range')) {
    channel.postMessage({ status: 'Getting response from cache in memory...' });
    if (useArrayBuffer) {
      // ARGH! See https://github.com/whatwg/fetch/issues/554
      const data = await response.arrayBuffer();
      channel.postMessage({ status: 'Got ' + Math.round(data.byteLength / 1024 / 1024) + 'MB using arrayBuffer()' });
      const pos = Number(/^bytes\=(\d+)\-$/g.exec(request.headers.get('range'))[1]);
      const options = {
        status: 206,
        statusText: 'Partial Content',
        headers: { 'Content-Range': 'bytes ' + pos + '-' + (data.byteLength - 1) + '/' + data.byteLength }
      }
      return new Response(data.slice(pos), options);
    } else {
      const data = await response.blob();
      channel.postMessage({ status: 'Got ' + Math.round(data.size / 1024 / 1024) + 'MB using blob()' });
      const pos = Number(/^bytes\=(\d+)\-$/g.exec(request.headers.get('range'))[1]);
      const options = {
        status: 206,
        statusText: 'Partial Content',
        headers: { 'Content-Range': 'bytes ' + pos + '-' + (data.size - 1) + '/' + data.size }
      }
      return new Response(data.slice(pos), options);
    }
  }

  // Return cached response.
  channel.postMessage({ status: 'Got response from cache.' });
  return response;
}

addEventListener('backgroundfetched', event => {
  event.waitUntil(async function() {
    // Cache video
    const cache = await caches.open('video-cache');
    const request = event.fetches[0].request;
    const response = event.fetches[0].response;

    await cache.put(request, response);
    event.updateUI('Downloaded video');

    const channel = new BroadcastChannel('channel');
    channel.postMessage({ status: 'Downloaded video' });
  }());
});

addEventListener('message', event => {
  const channel = new BroadcastChannel('channel');
  useArrayBuffer = (event.data.action == 'arraybuffer');
  channel.postMessage({ status: 'Changed useArrayBuffer to ' + useArrayBuffer });
});

