---
commit: c523a58
date: 2026-02-16
topic: capture-workflows
living: true
---

<!-- regenerate: Trace every path a signal can enter the system. To discover channels: find the signals creation API route, then grep the entire repo for all callers of that endpoint. Omit channels that are disabled or non-functional. Structure as: what types of content the system accepts, then the available input methods, then what happens post-capture. Write for end users — one short description per channel explaining what to do, not how the system works internally. Only describe features that are actually wired and working. Update YAML frontmatter commit/date. -->

# Capture Workflows

Put anything in the content box — a URL, a thought, a half-formed idea — and hit capture. You can add a title and a note about why it's interesting, but neither is required.

## What you can capture

**Links** — paste or share a URL. The page title is fetched automatically if you don't provide one.

**Thoughts** — no link needed. Type whatever's on your mind, optionally give it a title for easier scanning later.

## Ways to capture

**Type or paste** — the baseline, always available. Paste a URL or type a thought into the content field, optionally add a title and context. `Cmd+Enter` (`Ctrl+Enter` on Windows) to submit.

**Dictate with voice** — tap the mic button on any text field and speak. Your words appear wherever the cursor is. Works on both the content box and the "why interesting?" field.

**Share from another app** — on mobile or any PWA-enabled browser, share a link to Signal Capture. The title and URL are pre-filled; just add why it caught your eye and submit.

**Chrome extension** (desktop only) — click the extension icon to batch-capture selected tabs, or right-click any page and choose "Capture this page" for a single one. Titles come from the page automatically.

## After capture

Your signal appears in the feed. If you captured a link, the system automatically fills in a title. From there: star it, archive it, or tap through to the detail view. On mobile, swipe right to star and swipe left to archive.
