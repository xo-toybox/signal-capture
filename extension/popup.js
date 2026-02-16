// Signal Capture — popup UI

const tabList = document.getElementById('tab-list');
const toggleAllBtn = document.getElementById('toggle-all');
const contextInput = document.getElementById('context-input');
const captureBtn = document.getElementById('capture-btn');
const statusEl = document.getElementById('status');

let tabs = [];
let allSelected = true;

async function loadTabs() {
  const rawTabs = await chrome.tabs.query({ currentWindow: true });
  const filtered = SignalCapture.filterTabs(rawTabs);
  const unique = SignalCapture.deduplicateTabs(filtered);

  // Track duplicate URLs for badge display
  const urlCount = {};
  for (const t of filtered) {
    urlCount[t.url] = (urlCount[t.url] || 0) + 1;
  }

  tabs = unique.map(t => ({
    ...t,
    selected: true,
    dupCount: urlCount[t.url] || 1,
  }));

  render();
}

function getHostname(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

function render() {
  if (tabs.length === 0) {
    tabList.innerHTML = '<div class="empty-message">No capturable tabs</div>';
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capture';
    toggleAllBtn.style.display = 'none';
    return;
  }

  toggleAllBtn.style.display = '';
  tabList.innerHTML = '';

  for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i];
    const row = document.createElement('div');
    row.className = 'tab-row';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.selected;
    cb.addEventListener('change', () => {
      tabs[i].selected = cb.checked;
      updateState();
    });

    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = t.favIconUrl || 'icons/icon-16.png';
    favicon.alt = '';

    const info = document.createElement('div');
    info.className = 'tab-info';

    const title = document.createElement('div');
    title.className = 'tab-title';
    title.textContent = t.title || t.url;

    const host = document.createElement('div');
    host.className = 'tab-host';
    host.textContent = getHostname(t.url);

    info.append(title, host);
    row.append(cb, favicon, info);

    if (t.dupCount > 1) {
      const badge = document.createElement('span');
      badge.className = 'dup-badge';
      badge.textContent = `×${t.dupCount}`;
      row.append(badge);
    }

    row.addEventListener('click', (e) => {
      if (e.target === cb) return;
      cb.checked = !cb.checked;
      tabs[i].selected = cb.checked;
      updateState();
    });

    tabList.append(row);
  }

  updateState();
}

function updateState() {
  const selectedCount = tabs.filter(t => t.selected).length;
  allSelected = selectedCount === tabs.length;
  toggleAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
  captureBtn.disabled = selectedCount === 0;
  captureBtn.textContent = selectedCount > 0 ? `Capture ${selectedCount} tab${selectedCount > 1 ? 's' : ''}` : 'Capture';
}

toggleAllBtn.addEventListener('click', () => {
  allSelected = !allSelected;
  tabs.forEach(t => t.selected = allSelected);
  render();
});

captureBtn.addEventListener('click', async () => {
  const selected = tabs.filter(t => t.selected);
  if (selected.length === 0) return;

  captureBtn.disabled = true;
  captureBtn.textContent = 'Capturing...';
  statusEl.textContent = '';
  statusEl.className = '';

  const context = contextInput.value.trim() || null;
  const captures = selected.map(t => ({
    source_url: t.url,
    raw_input: t.title || t.url,
    ...(context ? { capture_context: context } : {}),
  }));

  try {
    const data = await SignalCapture.postCaptures(captures);
    const count = data.count ?? captures.length;

    statusEl.textContent = `${count} signal${count !== 1 ? 's' : ''} captured`;
    statusEl.className = 'success';
    captureBtn.textContent = 'Done';

    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);

    setTimeout(() => window.close(), 1500);
  } catch (err) {
    statusEl.textContent = err.message || 'Capture failed';
    statusEl.className = 'error';
    captureBtn.disabled = false;
    captureBtn.textContent = 'Retry';

    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
  }
});

loadTabs();
