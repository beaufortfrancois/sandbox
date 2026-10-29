// Connect this page to the shared worker and expose the tool steps it can perform
function connectToWorker(actions) {
  const worker = new SharedWorker('webmcp-worker.js', { extendedLifetime: true });

  worker.port.onmessage = async ({ data, ports: [replyPort] }) => {
    if (data.type === 'NAVIGATE') {
      window.location.href = data.url;
      return;
    }
    // Otherwise, run the requested step and send its result back
    replyPort.postMessage(await actions[data.action](data.payload));
  };
}
