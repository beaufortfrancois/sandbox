let activePort;
let resolveNextPage;

// Save the port of whichever same-origin tab connected last
self.onconnect = (e) => {
  activePort = e.ports[0];

  // If the checkout tool is waiting for a page navigation, resume it
  resolveNextPage?.();
};

// Register tool with agent
self.modelContext.registerTool({
  name: 'checkout',
  description: 'Runs a multi-page checkout flow.',
  inputSchema: {
    type: 'object',
    properties: {
      shippingAddress: {
        type: 'object',
        properties: { street: { type: 'string' }, city: { type: 'string' } },
        required: ['street', 'city'],
      },
      paymentDetails: {
        type: 'object',
        properties: { cardNumber: { type: 'string' } },
        required: ['cardNumber'],
      },
    },
    required: ['shippingAddress', 'paymentDetails'],
  },
  execute: async (input) => {
    // 1. Fill shipping on Page 1
    await runInPage('FILL_SHIPPING', input.shippingAddress);

    // 2. Trigger the page transition and wait for the next page to connect.
    // The Shared Worker stays alive here during the unload!
    activePort.postMessage({ type: 'NAVIGATE', url: 'billing.html' });
    await new Promise((resolve) => (resolveNextPage = resolve));

    // 3. Fill billing on Page 2
    const result = await runInPage('FILL_BILLING', input.paymentDetails);
    return { orderId: result.orderId };
  },
});

// Helper: Ask the active page to do DOM/UI work
function runInPage(action, payload) {
  return new Promise((resolve) => {
    const { port1, port2 } = new MessageChannel();
    port1.onmessage = (e) => resolve(e.data);
    activePort.postMessage({ type: 'ACTION', action, payload }, [port2]);
  });
}
