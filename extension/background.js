// Signal Capture — Chrome Extension background service worker
importScripts('config.js');

// Register context menu on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'capture-page',
    title: 'Capture this page',
    contexts: ['page'],
  });
});

// Handle context menu click — single-tab capture
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'capture-page' || !tab?.url) return;

  const filtered = SignalCapture.filterTabs([tab]);
  if (filtered.length === 0) {
    chrome.action.setBadgeText({ text: '0' });
    chrome.action.setBadgeBackgroundColor({ color: '#525252' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
    return;
  }

  try {
    const captures = [{ source_url: tab.url, raw_input: tab.title || tab.url }];
    const data = await SignalCapture.postCaptures(captures);

    chrome.action.setBadgeText({ text: String(data.count ?? 1) });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  } catch (err) {
    console.error('Signal Capture context menu error:', err);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }

  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
});
