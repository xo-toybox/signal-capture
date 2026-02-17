---
commit: b9aa06d
date: 2026-02-16
topic: admin
living: true
---

<!-- regenerate: Find features intended for the app operator rather than end users. Look for developer/admin tools, debug endpoints, reporting mechanisms, and PWA quirks. Write concise notes — what it does, how to access it, and any gotchas. Update YAML frontmatter commit/date. -->

# Admin Notes

Things the app operator needs to know that aren't obvious from the UI.

## Bug reporter

Floating button in the bottom-right corner. Opens a modal to file a bug or feature request directly to GitHub Issues via `/api/report`. Includes a severity picker for bugs and auto-captures environment context (URL, viewport, user agent, console errors).

`Cmd+Enter` (`Ctrl+Enter` on Windows) submits from anywhere in the modal. Requires `GITHUB_TOKEN` and `GITHUB_REPO` env vars to be set. If they're missing, the submit will fail with a 502.

## Desktop PWA refresh

The installed PWA has no address bar or browser refresh button. `Ctrl+R` (`Cmd+R` on Mac) is the only way to reload the page. Worth remembering when the app feels stuck or you've just deployed.
