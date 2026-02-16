// Signal Capture — Chrome Extension background service worker
// Captures all open tabs in the current window on icon click.

const API_URLS = [
  'http://localhost:3000',
  'https://signal-capture.vercel.app',
];

const SKIP_PROTOCOLS = ['chrome:', 'chrome-extension:', 'about:', 'devtools:', 'edge:'];

async function postCaptures(apiBase, captures) {
  const res = await fetch(`${apiBase}/api/signals/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ captures }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

chrome.action.onClicked.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });

    const captures = tabs
      .filter(t => t.url && !SKIP_PROTOCOLS.some(p => t.url.startsWith(p)))
      .map(t => ({
        source_url: t.url,
        raw_input: t.title || t.url,
      }));

    if (captures.length === 0) {
      chrome.action.setBadgeText({ text: '0' });
      chrome.action.setBadgeBackgroundColor({ color: '#525252' });
      return;
    }

    // Try each API URL in order; use first that succeeds
    let data;
    let lastErr;
    for (const apiBase of API_URLS) {
      try {
        data = await postCaptures(apiBase, captures);
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`Signal Capture: ${apiBase} failed, trying next...`, err.message);
      }
    }

    if (!data) {
      console.error('Signal Capture: all API URLs failed:', lastErr);
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      return;
    }

    chrome.action.setBadgeText({ text: String(data.count ?? captures.length) });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

    // Clear badge after 3 seconds
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
  } catch (err) {
    console.error('Signal Capture extension error:', err);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }
});
