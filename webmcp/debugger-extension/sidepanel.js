chrome.debugger.onEvent.addListener((source, method, params) => {
  pre.append(JSON.stringify({source, method, params}, '', ' '));
  pre.append(document.createElement('hr'));
});

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const debuggee = { tabId: tab.id };
await new Promise((resolve) => chrome.debugger.attach(debuggee, '1.3', resolve));
await new Promise((resolve) => chrome.debugger.sendCommand(debuggee, 'WebMCP.enable', resolve));
