---
commit: c523a58
date: 2026-02-16
topic: capture-workflows
---

<!-- regenerate: Trace every path a signal can enter the system. To discover channels: find the signals creation API route, then grep the entire repo for all callers of that endpoint. For each channel, describe fields populated, input method, and user flow. Include the field reference table and post-capture pipeline. Update YAML frontmatter commit/date. -->

# Capture Workflows

How signals enter the system across each channel.

## Fields

| Field | Required | Description |
|---|---|---|
| **Title** | No | Short headline for scanning. Auto-filled from share or page scrape; editable. |
| **Content** | Yes | The signal itself: URL, thought, excerpt, or any text. |
| **Why interesting?** | No | Your editorial context — what caught your eye, how it connects. |

**Display title priority:** Title > Fetched title (scraped) > Enrichment title (AI) > Truncated content

---

## Channels

### PWA Share (Chrome / mobile share sheet)

User shares a link from another app to Signal Capture.

| Field | Value |
|---|---|
| Title | Pre-filled from `shared_title` (editable) |
| Content | The shared URL |
| Why interesting? | Empty, auto-focused for quick annotation |
| Source URL | Auto-set from `shared_url` |
| Input method | `share` |

Flow: Share link > form opens with title + URL pre-filled > add context > submit.

### Manual URL

User pastes or types a URL directly.

| Field | Value |
|---|---|
| Title | Empty (user can type; auto-scraped after submit) |
| Content | The URL (or URL + surrounding text) |
| Why interesting? | Optional |
| Source URL | Auto-extracted from content |
| Input method | `text` |

Flow: Paste URL into content > optionally add title + context > submit > title auto-fetched from page.

### Thought

User captures an idea, observation, or note — no URL.

| Field | Value |
|---|---|
| Title | Optional short label for feed scanning |
| Content | The thought (free-form, any length up to 10k chars) |
| Why interesting? | Optional — useful when the thought needs framing |
| Source URL | None |
| Input method | `text` |

Flow: Type thought > optionally title it > submit.

### Voice

User dictates via microphone button (Web Speech API).

| Field | Value |
|---|---|
| Title | Empty (user can type or dictate) |
| Content | Transcribed speech |
| Why interesting? | Can also be dictated (separate mic button) |
| Source URL | Auto-extracted if transcript contains a URL |
| Input method | `voice` |

Flow: Tap mic > speak > transcript appears in content > edit/add title > submit.

### Chrome Extension (batch)

Extension captures all open tabs or selected tabs.

| Field | Value |
|---|---|
| Title | Page title from `document.title` |
| Content | Page URL |
| Why interesting? | Not set (batch capture) |
| Source URL | Tab URL |
| Input method | `extension` |

Flow: Click extension > select tabs > batch capture > titles auto-sent from tab metadata.

---

## After Capture

1. **Title fetch** — if source URL exists and no user-provided title, scrapes `<title>` / `og:title` from the page. Stored as `fetched_title` (never overwrites user-provided title).
2. **Enrichment** — AI pipeline extracts claims, tags, novelty assessment. Generates `source_title` in enrichment layer.
3. **Triage** — signal appears in feed. Star, archive, or click through to detail view.
