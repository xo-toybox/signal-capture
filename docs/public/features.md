---
commit: 0110585
date: 2026-02-17
topic: features
living: true
---

<!-- regenerate: Discover all user-facing features. Strategy: enumerate app routes (pages and API), then trace the components and interactions each route exposes. Also check for features outside the app routes (e.g. manifests, extensions, workers, CLIs). For each feature, describe key behaviors from the user's perspective. Include screenshots from docs/screenshots/ where they exist. Update YAML frontmatter commit/date. -->

# Features

Personal signal capture and intelligence pipeline. Grab URLs, thoughts, and voice notes — enrich them with AI-extracted claims, novelty assessments, and domain tags. Single-tenant, dark-only.

## Signal Feed

The home view: capture form at top, filterable signal list below.

- **Filter tabs** — Active, Starred, Archived, All
- **Starred signals pin** to the top of the Active view
- **Realtime updates** via Supabase subscriptions — new signals appear instantly
- **Pagination** — loads 20 at a time with "load more"
- **Status indicators** — colored left border per signal: yellow (pending), blue (processing), green (complete), red (dismissed/failed)
- **Enrichment preview** — enriched signals show claim count and up to 3 domain tags inline
- **Auto-archive** — signals older than 30 days automatically leave the Active view

![Feed — desktop](screenshots/01-feed-desktop.png)

![Feed — mobile](screenshots/02-feed-mobile.png)

## Capture

Two-field form: raw input (URL or thought) + optional context (why it matters).

- **URL detection** — auto-fetches page title when a URL is captured
- **Voice input** — Web Speech API mic on every text field, inserts at cursor position
- **Share target** — PWA share handler, so "Share → Signal Capture" from any app pipes URLs directly in
- **Keyboard submit** — `Cmd/Ctrl+Enter` to capture

## Signal Detail

Full view of a single signal with all enrichment data.

- **Raw Capture** — original text, editable context (click to edit, `Cmd+Enter` to save), source URL link
- **Key Claims** — bullet list of AI-extracted assertions
- **Novelty Assessment** — one-paragraph analysis of what's new
- **Domain Tags** — categorization chips (e.g., `world-models`, `architecture-gap`)
- **Cross-Signal Notes** — connections to related signals
- **Confidence** — visual progress bar (0–100%)
- **Human Notes** — manual rating (1–5) and annotations
- **Metadata** — source tier, frontier status, signal type

![Detail — enriched signal](screenshots/03-detail-enriched.png)

![Detail — pending signal](screenshots/05-detail-pending.png)

![Detail — mobile](screenshots/06-detail-mobile.png)

## Triage

Star and archive signals to organize your feed.

- **Desktop** — hover a card to reveal inline star/archive/delete buttons
- **Mobile** — swipe right to star, swipe left to archive
- **Two-click delete** — confirmation step prevents accidental deletion
- **Bulk via extension** — capture and triage multiple tabs at once

## Multi-Select & Export

Select multiple signals and export them as combined markdown.

- **Toggle select mode** from the feed toolbar
- **Time-range chips** (Today, 7d, 30d, All) to quickly select signals by date
- **Keyboard shortcuts** — `Cmd/Ctrl+A` to select all, `Cmd/Ctrl+C` to copy markdown, `Enter` to preview, `Escape` to exit
- **Export preview** — two-tab modal showing rendered markdown and raw code, with copy button

## PWA

Installable as a standalone app on all platforms.

- **iOS** — Safari → Share → Add to Home Screen
- **Android** — Chrome → Install app
- **Desktop** — Chrome address bar → Install
- **Share Target** — "Share" from any app sends URLs to capture form

## Chrome Extension

Browser extension in `extension/` for batch tab capture.

- **Popup UI** — select/deselect tabs, add shared context, duplicate flagging
- **Context menu** — right-click → "Capture this page"
- **Keyboard shortcut** — `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` (Win)

![Chrome Extension](screenshots/09-chrome-extension.png)

## Bug Reporter

Built-in issue filing — bottom-sheet on mobile, modal on desktop.

- Toggle Bug / Feature mode
- Severity picker for bugs (low → critical)
- Voice input for description
- Auto-captures environment context (URL, viewport, user agent, console errors)
- Posts directly to GitHub Issues via `/api/report`
- `Cmd/Ctrl+Enter` to submit

![Bug Reporter](screenshots/08-bug-reporter.png)

## Auth

![Login](screenshots/07-login.png)

Google OAuth via Supabase Auth. Single-user: `ALLOWED_EMAIL` env var restricts access to one account. Three-layer defense: proxy → API auth check → Row Level Security.
