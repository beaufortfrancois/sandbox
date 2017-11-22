addEventListener('message', async event => {

  const sharedBuffer = event.data;
  const view = new Uint8Array(sharedBuffer);

  const videoUrl = 'https://storage.googleapis.com/fbeaufort-test/sample-video.mp4';
  const response = await fetch(videoUrl, { headers: { range: 'bytes=0-811' } })
  const buffer = await response.arrayBuffer();
  view.set(new Uint8Array(buffer), 0);

  self.postMessage('Fetched!');

});
