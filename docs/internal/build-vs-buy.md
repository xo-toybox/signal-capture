# Build vs. Buy: Signal Capture

Why build a custom signal-capture tool instead of using Notion, Obsidian, Raindrop, or any of the dozens of capture/PKM products available?

## The Core Workflow

Four requirements define the workflow:

1. **Clean list** of captured thoughts and links
2. **Easy manual prioritize/deprioritize** across the list
3. **Easy return** to a capture to add or update notes
4. **Easy extract** of the full list for batch processing and deep synthesis

Requirements 1-3 are table-stakes for dozens of products. Requirement 4 -- *extracting loose thoughts for batch LLM synthesis* -- is where existing tools break down.

## The Key Insight

Signal Capture is a **pipeline node**, not a **destination**.

Existing products (Notion, Obsidian, Raindrop, Readwise) are designed as destinations -- they want you to capture, organize, and consume *within the product*. Export/API is an afterthought, shaped by what the product thinks you should do with your data.

Signal Capture is an **open pipeline node** -- it captures and stages signals, then makes the data available for whatever downstream system needs it:

```
[Capture surfaces]          [Signal Capture / Supabase]          [Downstream]

  Web app      --+                                    +---> chat (ad-hoc analysis)
  PWA share    --+          +----------------+        |
  Extension    --+------>   |  signals_raw   |  ------+---> OpenClaw (monitoring)
  Voice        --+          |  (Supabase)    |        |
                            +----------------+        +---> Chunked artifacts (other systems)
                                  |                   |
                            [Triage UI]               +---> Enrichment pipeline (AI)
                            star / archive
                            add context
```

## Competitive Landscape

### Tier 1: Bookmark / Read-Later (capture + organize)

| Product | Capture friction | Prioritize | Return & note | Batch extract | Automation flexibility |
|---------|-----------------|------------|---------------|---------------|----------------------|
| **Raindrop.io** | Low (extension, mobile) | Favorites (binary) | Notes, highlights | CSV/HTML. Limited API | None -- closed system |
| **Readwise Reader** | Low (extension, email) | Inbox -> archive | Excellent highlighting | Export API (Obsidian/Notion) | Moderate -- highlight-focused export |
| **Pocket** | Low (extension) | Favorites (binary) | Highlights only | API deprecated | None |
| **Pinboard** | Medium (manual) | None | Description field | Full API (raw bookmarks) | Moderate -- good API, no enrichment |

**Gap**: These are *libraries* -- "save and retrieve." No model for triaging a queue of loose thoughts, and no structured programmatic export for downstream automation.

### Tier 2: PKM / Note-Taking (organize + connect)

| Product | Capture friction | Prioritize | Return & note | Batch extract | Automation flexibility |
|---------|-----------------|------------|---------------|---------------|----------------------|
| **Notion** | Medium (clipper + manual) | Priority property, drag | Full page editor | API exists -- best in class for structured query | Moderate -- API is good but you're on their platform |
| **Obsidian** | High (open app, new note) | Manual frontmatter | Full markdown editor | Local files -- script anything | High -- local files + MCP server for programmatic access |
| **Tana** | Medium (Tana Capture app) | Tags + views | Full outliner | New local API + MCP | Promising -- MCP is new |
| **Roam Research** | Medium | Manual | Outliner | JSON export, API | Moderate |
| **Logseq** | Medium | Manual | Outliner | Local files (Obsidian-like) | High -- open source, local |

**Gap**: Can do the full workflow but with friction in capture (no "URL + why it matters" two-field model, no PWA share, no batch tab capture). Notion is the strongest here, but you're locked to a platform. Obsidian gives ownership and now has MCP for programmatic access, but its data model is still markdown files -- every downstream consumer needs a parser, and there's no structured schema separating raw capture from enrichment from human annotation.

### Tier 3: AI-Enhanced Capture (capture + auto-enrich)

| Product | Capture friction | Prioritize | Return & note | Batch extract | Automation flexibility |
|---------|-----------------|------------|---------------|---------------|----------------------|
| **Fabric** | Low (clipper) | Collections | Notes + AI summaries | Limited export | None -- AI is a black box |
| **Mem** | Low | AI-suggested relevance | Full editor | Limited API | Low |
| **Mymind** | Low (extension, mobile) | AI-organized | Minimal | None | None -- fully opaque |
| **Glasp** | Low (highlighter) | None | Highlights + notes | Export to Obsidian/Notion | Low -- highlight-centric |

**Gap**: These add AI *to the product* but don't give you *programmatic access to the AI pipeline*. Fabric will summarize a page for you; it won't let you pull 50 signals into Claude and ask "what patterns do you see across these?" The enrichment is a black box -- you can't swap models, re-run pipelines, or route outputs to other systems.

### Tier 4: Structured Database Tools (organize + API)

| Product | Capture friction | Prioritize | Return & note | Batch extract | Automation flexibility |
|---------|-----------------|------------|---------------|---------------|----------------------|
| **Airtable** | High (forms, manual) | Full sorting/views | Rich fields per record | Full REST API | High -- API + automations, but platform-locked |
| **Coda** | High (manual) | Full sorting/views | Document + database hybrid | API + Packs | High -- but complex |

**Gap**: Closest to Signal Capture's data model. You could build a signals database in Airtable with forms, views, and API access. But: no PWA share target, no Chrome extension batch capture, no voice input, no realtime subscriptions. And you're on their platform with their pricing, rate limits, and schema constraints.

### Tier 5: Intelligence / OSINT Tools (monitor + analyze)

| Product | Capture friction | Prioritize | Return & note | Batch extract | Automation flexibility |
|---------|-----------------|------------|---------------|---------------|----------------------|
| **Feedly Leo** | N/A (monitors sources, not your thoughts) | AI priority scoring | Boards, notes | API (enterprise) | High -- but monitors *feeds*, not personal capture |
| **Hunchly** | Auto-captures browsing | Tags | Notes per capture | PDF/HTML/JSON export | Moderate -- OSINT/legal focus |

**Gap**: Feedly Leo is the closest to "intelligence pipeline" but it monitors published sources -- it doesn't capture your *thoughts and observations*. Hunchly is designed for legal evidence preservation, not thought triage.

## Where Signal Capture's Architecture Wins

### The "Capture with Intent" model

Most tools treat capture as "save this link." Signal Capture treats it as "record this signal and your initial read on why it matters." The two-field model (`raw_input` + `capture_context`) is the atomic unit. You're capturing a *judgment*, not just a URL.

### The 4-table separation

- `signals_raw` -- immutable capture (what you saw)
- `signals_enriched` -- AI-derived metadata (recomputable, swappable)
- `signals_human` -- your annotations (never overwritten by AI)
- `signals_refinements` -- correction history

No existing product separates these concerns. In Notion, your notes and AI summaries live in the same page. In Readwise, highlights and AI summaries are interleaved. This matters when you want to re-run enrichment with a better model without losing your human annotations.

### Direct data access for batch synthesis

Supabase gives you SQL queries, REST API, realtime subscriptions, and pg functions:

```sql
SELECT raw_input, capture_context FROM signals_raw
WHERE is_archived = false AND processing_status = 'pending'
ORDER BY is_starred DESC, created_at DESC
```

Pipe that directly into Claude for pattern analysis. No export step, no format conversion, no API rate limits from a third party.

### Programmable enrichment pipeline

The schema is designed so you can swap enrichment strategies without touching the capture or annotation layer. Today it's empty; tomorrow you could run a Claude batch job that populates `key_claims`, `novelty_assessment`, `domain_tags`, and `cross_signal_notes` for every pending signal.

## Why Notion Specifically Broke

1. **Capture friction**: Opening Notion, navigating to the right database, clicking "New," filling fields. Even with the web clipper, adding "why it matters" context requires opening the page. Signal Capture: `Cmd+Shift+S` from Chrome extension, or two fields on the home page, or share from any app.

2. **Extraction gap**: Notion's API returns pages in block-based format. To get "all my pending signals as structured data," you'd write a script that queries the database API, navigates the block tree, extracts the right properties. You're fighting the data model -- Notion pages are documents, not structured records. With Supabase, it's a SQL query.

3. **Multi-destination problem**: If you want the same data to flow to Claude chat AND OpenClaw AND another system, Notion becomes a bottleneck. Each integration is a custom adapter. With Supabase, each downstream system connects directly to the same Postgres database.

## Why Obsidian Specifically Broke

1. **Capture friction**: Open app, new note, type, add frontmatter for metadata. No web capture with context. Plugins help but add complexity.

2. **Extraction gap**: Obsidian now has an MCP server, which significantly improves programmatic access compared to raw file scripting. But the underlying data model is still markdown files with frontmatter -- there's no structured schema, no separation between raw capture and enrichment and human annotation. "Pull all pending signals" means querying notes by frontmatter tags, which works but conflates all data layers into one document.

3. **No realtime**: Local-first means no realtime subscriptions, no API endpoint another system can poll. MCP helps with on-demand access but doesn't solve push-based workflows.

## Comparison Summary

| Need | Notion / Obsidian | Raindrop / Readwise | Signal Capture |
|------|-----------------|-------------------|----------------|
| Low-friction multi-surface capture | Web clipper exists but slow for thoughts + context | URL-only, no "why it matters" | 2-field form, PWA share, extension batch, voice |
| Structured data access | API exists but export-shaped | Minimal/no API | Direct SQL, REST API, realtime subscriptions |
| Feed into multiple downstream systems | Requires per-system custom integration | Not designed for this | Supabase is the shared data layer -- any system can query |
| Re-run enrichment without losing human work | Notes and AI summaries interleaved | N/A | 4-table separation: raw / enriched / human / refinements |
| Own the data format | Proprietary (Notion) or files (Obsidian) | Proprietary | Postgres. Standard SQL. You control the schema. |

## The Automation Flexibility Argument

The core bet: **the intelligence layer doesn't exist yet, and you need a foundation that can accommodate whatever it becomes.**

Every existing product embeds assumptions about what automation looks like:

- Readwise assumes automation = "sync highlights to Obsidian"
- Notion assumes automation = "trigger Zapier when a row changes"
- Feedly Leo assumes automation = "AI scores articles for you"
- Fabric assumes automation = "we summarize content for you"

Signal Capture assumes automation = **"you'll figure it out, here's a Postgres database."**

The 4-table schema is designed for this:

- Route starred signals to OpenClaw for monitoring: `WHERE is_starred = true`
- Run a weekly Claude synthesis batch: `WHERE created_at > now() - interval '7 days'`
- Generate chunked artifacts for another system: query + transform + push, no intermediate format
- Swap enrichment models: rewrite `signals_enriched`, leave `signals_raw` and `signals_human` untouched
- Add a new downstream consumer that doesn't exist yet: it just connects to Supabase

No product in the landscape gives you this. Obsidian comes closest (local files + MCP for programmatic access) and Airtable (structured API), but Obsidian's data model is still markdown files -- MCP gives you better access to them, but every downstream consumer still needs to parse frontmatter and markdown rather than query structured columns. Airtable's API is rate-limited and platform-locked.

## What's NOT Worth Building

- **Deep reading / highlighting**: Use Readwise Reader. Capture the *output* (the key insight + why it matters) as a signal.
- **Knowledge graph / note linking**: Use Obsidian. Signal Capture feeds signals *into* that process.
- **Rich text editing**: Plain text `capture_context` is fine for the "why it matters" annotation. Deep note-taking happens downstream.
- **Source monitoring**: Use Feedly. Capture interesting findings as signals.

## Summary

| Dimension | Existing products | Signal Capture |
|-----------|-------------------|----------------|
| Capture model | "Save this link" | "Record this signal + why it matters" |
| Data access | Export/API as afterthought | Postgres is the product |
| Downstream consumers | 1 (the product itself) | N (chat, OpenClaw, artifacts, enrichment, anything) |
| AI enrichment | Black box, vendor-controlled | Open pipeline, you choose the model and strategy |
| Schema evolution | Platform decides | You decide |
| Pricing risk | Platform can change pricing/features | Self-hosted foundation (Supabase) |

The build decision isn't "this is better than Notion for note-taking." It's "none of these products are designed to be a node in a personal intelligence pipeline where the downstream automation doesn't exist yet."
