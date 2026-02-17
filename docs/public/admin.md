---
commit: 0110585
date: 2026-02-17
topic: admin
living: true
---

<!-- regenerate: Find features intended for the app operator rather than end users. Look for developer/admin tools, debug endpoints, reporting mechanisms, and PWA quirks. Write concise notes — what it does, how to access it, and any gotchas. Update YAML frontmatter commit/date. -->

# Admin Notes

Things the app operator needs to know that aren't obvious from the UI.

## Bug reporter

Bottom-sheet modal triggered by the pill button in the bottom-right corner. Toggle between Bug and Feature mode, pick a severity for bugs, and type a title and description. Environment context (URL, viewport, user agent, console errors) is captured automatically. Posts to GitHub Issues via `/api/report`.

`Cmd+Enter` (`Ctrl+Enter` on Windows) submits from anywhere in the modal. Escape or tapping outside closes it.

Requires `GITHUB_TOKEN` and `GITHUB_REPO` env vars. If they're missing, the reporter shows "not configured" — the rest of the app works fine. Rate-limited to 10 reports per hour.

## Auto-archive

Signals older than 30 days are automatically archived when the Active feed loads. This runs silently in the background — no notification. Starred signals are not exempt; they'll still appear under the Starred filter but will leave the Active view.

The threshold is hardcoded (not configurable via env vars).

## Desktop PWA refresh

The installed PWA has no address bar or browser refresh button. `Cmd+R` (`Ctrl+R` on Windows) is the only way to reload. Worth remembering when the app feels stuck or you've just deployed.

## Keyboard shortcuts

| Shortcut | Where | Action |
|----------|-------|--------|
| `Escape` | Signal detail, docs pages | Navigate back |
| `Cmd/Ctrl+Enter` | Capture form, bug reporter | Submit |
