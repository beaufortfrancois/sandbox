var useArrayBuffer = false;
var chunkIt = true;

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
      if (chunkIt) {
        const chunkSize = 512 * 1024;
        const end = (Math.min(data.size - 1, pos + chunkSize));
        const options = {
          status: 206,
          statusText: 'Partial Content',
          headers: {
           'Content-Range': 'bytes ' + pos + '-' + end + '/' + data.size,
           'Content-Length': end - pos
          }
        }
        const slicedData = data.slice(pos, end);
        channel.postMessage({ status: 'Sliced it to ' + Number(slicedData.size / 1024 / 1024).toFixed(1) + 'MB' });
        return new Response(slicedData, options);
      } else {
        const end = data.size - 1;
        const options = {
          status: 206,
          statusText: 'Partial Content',
          headers: {
            'Content-Range': 'bytes ' + pos + '-' + end + '/' + data.size,
            'Content-Length': end - pos
          }
        }
        const slicedData = data.slice(pos, end);
        channel.postMessage({ status: 'Sliced it to ' + Number(slicedData.size / 1024 / 1024).toFixed(1) + 'MB' });
        return new Response(slicedData, options);
      }
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
  if ('radio' in event.data) {
    useArrayBuffer = (event.data.radio == 'arraybuffer');
    channel.postMessage({ status: 'Changed useArrayBuffer to ' + useArrayBuffer });
  } else if ('checkbox' in event.data) {
    chunkIt = event.data.checkbox;
    channel.postMessage({ status: 'Changed chunkIt to ' + chunkIt });
  }
});

