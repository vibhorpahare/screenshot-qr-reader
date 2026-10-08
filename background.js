// Per-tab history lives in chrome.storage.session keyed by tab id.
// Wipe it the moment the tab closes.
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(String(tabId));
});
