// Signal Capture — shared config for background.js and popup.js

const SignalCapture = (() => {
  const API_URLS = [
    'http://localhost:3000',
    'https://signal-capture.vercel.app',
  ];

  const SKIP_PROTOCOLS = ['chrome:', 'chrome-extension:', 'about:', 'devtools:', 'edge:'];

  function filterTabs(tabs) {
    return tabs.filter(t => t.url && !SKIP_PROTOCOLS.some(p => t.url.startsWith(p)));
  }

  function deduplicateTabs(tabs) {
    const seen = new Set();
    return tabs.filter(t => {
      if (seen.has(t.url)) return false;
      seen.add(t.url);
      return true;
    });
  }

  async function postCaptures(captures) {
    let lastErr;
    for (const apiBase of API_URLS) {
      try {
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
        return await res.json();
      } catch (err) {
        lastErr = err;
        console.warn(`Signal Capture: ${apiBase} failed, trying next...`, err.message);
      }
    }
    throw lastErr;
  }

  return { API_URLS, SKIP_PROTOCOLS, filterTabs, deduplicateTabs, postCaptures };
})();
