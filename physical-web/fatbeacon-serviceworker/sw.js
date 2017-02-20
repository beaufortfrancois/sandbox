addEventListener('activate', () => {
  clients.claim();
});

addEventListener('fetch', event => {
  const pathname = event.request.url.slice(registration.scope.length - 1);
  if (pathname.startsWith('/fatbeacon_')) {
    event.respondWith(async function() {
      const body = await getResponseBodyFromFatBeacon(pathname);
      return new Response(body, {
          headers: {'Content-Type': guessContentType(pathname)}
      });
    }());
  }
});

function getResponseBodyFromFatBeacon(pathname) {
  return new Promise(resolve => {
    const channel = new BroadcastChannel('fatbeacon');
    const channelId = `channel-${Math.random()}`;
    channel.onmessage = event => {
      if (event.data.channelId == channelId) resolve(event.data.body);
    };
    channel.postMessage({ channelId, pathname });
  });
}

/* Utils */

function guessContentType(pathname) {
  // TODO: Find a better way... because obviously...
  if (pathname.endsWith('.html')) {
    return 'text/html; charset=utf-8';
  } else if (pathname.endsWith('.css')) {
    return 'text/css; charset=utf-8';
  } else if (pathname.endsWith('.js')) {
    return 'application/javascript; charset=utf-8';
  } else if (pathname.endsWith('.mp4')) {
    return 'video/mp4';
  }
  return 'application/octet-stream';
}
