chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.tabs.onUpdated.addListener((tabId) => {
  chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html', enabled: true });
});
