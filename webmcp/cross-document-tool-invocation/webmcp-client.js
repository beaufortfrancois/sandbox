const worker = new SharedWorker('webmcp-worker.js', { extendedLifetime: true });

worker.port.onmessage = async (event) => {
  const { type, action, payload, url } = event.data;
  const replyPort = event.ports[0];

  if (type === 'NAVIGATE') {
    window.location.href = url;
    return;
  }

  // Otherwise, perform DOM-bound actions directly in the tab
  if (action === 'FILL_SHIPPING') {
    document.querySelector('#street').value = payload.street;
    document.querySelector('#city').value = payload.city;
    replyPort.postMessage({ success: true });
    return;
  }
  if (action === 'FILL_BILLING') {
    document.querySelector('#card').value = payload.cardNumber;
    await placeOrder(); // Custom app submit function
    replyPort.postMessage({ orderId: 'abc-98765' });
  }
};
