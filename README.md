# Signal Capture

Personal signal capture and intelligence pipeline. Capture URLs, thoughts, and voice notes — auto-fetch page titles, triage with stars and archives, and annotate with inline notes. Organize reflective thinking in projects with freeform thoughts and linked signals. AI enrichment (claims, novelty, embeddings) is schema-ready but not yet wired.

Two parallel surfaces: the **signal feed** for fast, reactive capture and the **projects space** for slower, deliberate synthesis organized by workstream. Signals are the raw inputs; projects are where you plan.

The feed updates in realtime via Supabase subscriptions and can be filtered by active, starred, or archived status. Voice input (Web Speech API) is available on every text field — tap the mic and it inserts at the cursor. Capture context is click-to-edit inline (`Cmd+Enter` to save, `Esc` to cancel).

Designed as a single-tenant app — no user_id columns, no multi-tenancy overhead. Access is gated to one Google account via `ALLOWED_EMAIL`. All signals belong to the sole operator.

## Dashboards

- **Live app:** https://signal-capture.vercel.app
- **Vercel:** Vercel dashboard → signal-capture project
- **Supabase:** Supabase dashboard → signal-capture project
- **Google Cloud:** project name `signal-capture`

## Projects

A parallel workspace for reflective thinking, organized by workstream. Projects have three lifecycle layers:

- **Tactical** — narrow, active, current focus
- **Strategic** — broad themes, ongoing tracking
- **Hibernating** — paused, revisit later

Each project contains freeform **thoughts** (timestamped text entries) and **linked signals** (post-capture references to signals_raw). Signals are captured into the flat feed as usual — linking happens afterward from the signal detail page or project detail page. A signal belongs to zero or one project.

## Multi-Select & Export

Select multiple signals from the feed and export them as combined markdown.

- **Time-range chips** (Today, 7d, 30d, All) for quick date-based selection
- **Keyboard shortcuts** — `Cmd/Ctrl+A` select all, `Cmd/Ctrl+C` copy markdown, `Enter` preview, `Escape` exit
- **Export preview** — two-tab modal showing rendered markdown and raw code with copy button

## PWA

Install to home screen for standalone use. Share a URL from any app and it lands directly in the capture form via the Web Share Target API.

- **iOS:** Safari → Share → Add to Home Screen
- **Android:** Chrome menu → Install app
- **Desktop:** Chrome address bar → Install icon

## Chrome Extension

A Chrome extension in `extension/` captures open tabs from the current browser window as signals.

- **Popup UI** — select/deselect individual tabs, add shared context, duplicate URLs are flagged
- **Context menu** — right-click any page → "Capture this page"
- **Keyboard shortcut** — `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` (Windows)

**Install:**
1. Chrome → Extensions → Enable Developer Mode
2. Load unpacked → select `extension/` directory

## Documentation

In-app docs at `/docs` — public, user-facing guides auto-discovered from `docs/public/*.md` with YAML frontmatter. Living docs can be regenerated from embedded prompts.

## Bug Reports & Feature Requests

A built-in reporter (floating "report" button, bottom-right) lets you file bugs or feature requests directly as GitHub Issues — no context switching required.

- Toggle between **Bug** and **Feature** modes
- Bugs include a severity picker (low / medium / high / critical)
- ✦ toggle assigns the issue to Claude (adds `claude` label) — on by default for bugs
- Environment context is captured automatically (URL, viewport, user agent, recent console errors)
- Submitted via `POST /api/report` → GitHub Issues API
- GitHub issue titles are auto-prefixed `[Bug]` or `[Feature]` based on the selected mode
- Labels: `bug` or `enhancement` (+ `claude` when assigned)
- Rate-limited to 10 reports per hour

## Security Model

Single-user app with defense in depth across three layers:

**Proxy (request boundary)** — `proxy.ts` intercepts all requests. Unauthenticated users are redirected to `/login`. When `ALLOWED_EMAIL` is set, only that Google account can access the app.

**API routes (data boundary)** — Every API handler calls `getUser()` via the cookie-based Supabase client before processing. Unauthorized requests get `401`. All writes go through the service role client (bypasses RLS) so the API is the sole write path.

**Row Level Security (database boundary)** — RLS is enabled on all tables. The anon key can only `SELECT` for authenticated users. No `INSERT`/`UPDATE`/`DELETE` policies exist for the anon key — writes are only possible through the service role used server-side.

**Input validation** — URLs are parsed with `new URL()` and whitelisted to `http:`/`https:` protocols. `raw_input` is capped at 10k chars, `capture_context` at 5k.

**Client exposure** — Only public keys are exposed to the browser (read-only by RLS). Secret keys never leave the server.

**Dev write guard** — `createServiceClient()` refuses to connect to remote Supabase when `NODE_ENV !== 'production'`, preventing accidental writes to production from a dev server.

---

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Supabase** — Postgres, Auth (Google OAuth), Realtime subscriptions
- **Tailwind CSS 4** — dark-only UI
- **Web Speech API** — voice input transcription

## Architecture

```
src/
  app/
    (public)/                   # Public route group (no auth)
      login/page.tsx            # Google OAuth login
      docs/page.tsx             # Docs index
      docs/[slug]/page.tsx      # Doc viewer
      docs/layout.tsx           # Docs layout with sidebar
    (app)/                      # Authenticated route group
      page.tsx                  # Signal feed + capture form
      layout.tsx                # BugReporter + service worker
      signal/[id]/page.tsx      # Signal detail view
      projects/page.tsx         # Projects list (layer-grouped)
      projects/[id]/page.tsx    # Project detail (thoughts + linked signals)
    api/
      auth/callback/            # OAuth callback
      auth/test-session/        # Dev-only test auth
      signals/                  # GET (list) + POST (capture) + PATCH (update) + DELETE
      signals/[id]/enrich-title/  # POST enrich page title
      signals/batch/            # POST batch capture (extension)
      projects/                 # GET (list) + POST (create) + PATCH (update) + DELETE
      projects/[id]/thoughts/   # GET (list) + POST (create) + DELETE
      report/                   # POST bug reports to GitHub Issues
  components/
    AppHeader.tsx               # Nav tabs (Signals | Projects) + docs/GitHub links
    CaptureForm.tsx             # Text/voice/share input
    SignalFeed.tsx              # Realtime feed with pagination + selection
    SignalCard.tsx              # Feed item card with project badge
    SwipeableCard.tsx           # Swipe gesture handler for star/archive
    ProjectsList.tsx            # Layer-grouped project list with inline create
    ProjectDetail.tsx           # Thoughts timeline + linked signals + layer dropdown
    ProjectLinker.tsx           # Link/unlink signal to project dropdown
    SelectionBar.tsx            # Multi-select action bar
    ExportPreviewModal.tsx      # Markdown preview/copy modal
    VoiceInput.tsx              # Web Speech API wrapper
    StarButton.tsx              # Star/unstar toggle
    ArchiveButton.tsx           # Archive/unarchive toggle
    DeleteButton.tsx            # Two-click delete with confirmation
    InlineDeleteButton.tsx      # Inline delete with confirm state
    EditableCaptureContext.tsx   # Inline editable capture_context field
    EscapeBack.tsx              # Keyboard Escape → navigate back
    DocsSidebar.tsx             # Docs navigation sidebar
    Prose.tsx                   # Markdown renderer
    BugReporter.tsx             # Bug report trigger button
    BugReporterModal.tsx        # Bug report form modal
  lib/
    supabase.ts                 # Browser client (realtime)
    supabase-server.ts          # Server client (cookies) + service client (RLS bypass)
    types.ts                    # SignalRaw, SignalFeedItem, Project, ProjectThought, etc.
    constants.ts                # Shared status colors and labels
    mock-data.ts                # Demo data when Supabase is not configured
    docs.ts                     # Docs discovery and frontmatter parsing
    signals-to-markdown.ts      # Signal export formatter
    signal-actions.ts           # API helpers for star/archive toggles
    bug-report-types.ts         # BugReportPayload, BugReportError types
    fetch-title.ts              # Server-side page title fetcher
    console-error-buffer.ts     # Captures recent console errors for bug reports
    use-swipe.ts                # Swipe gesture hook with panel reveal
    use-voice-insert.ts         # Voice input with cursor-aware insertion
  proxy.ts                      # Auth middleware (Next.js 16 proxy)
supabase/migrations/            # Incremental schema migrations
```

### Data Model

- **signals_raw** — immutable capture (URL, text, context, input method, project link)
- **signals_enriched** — AI-derived metadata (claims, tags, novelty, embeddings)
- **signals_human** — manual annotations (notes, ratings, tier overrides)
- **signals_feed** — unified view joining signals_raw + enriched + human + projects
- **projects** — workstreams with name, description, and lifecycle layer
- **project_thoughts** — freeform timestamped notes within a project

## GitHub Automation

Claude Code GitHub Action (`.github/workflows/claude.yml`) enables delegated development via issues and PR comments. Create an issue or comment `@claude` to trigger automated implementation — Claude reads the codebase, makes changes, writes tests, and runs `make check` before creating a PR. Scoped to focused tasks (25-turn, 30-minute limit) with safety constraints: can't modify workflows, access secrets, or skip quality gates.

## Development

Use `make dev` (mock data, no database) or `make dev-docker` (local Supabase via Docker).

`make db-reset` resets the local Supabase database and applies seed data from `.dev-docker/seed-local.sql`. Requires Docker. Guarded against running on a linked remote project. `dev-docker` runs this automatically before starting the dev server.

`make db-pull` dumps production data (read-only) and loads it into the local database — useful for debugging with real data.

See `Makefile` for all workflows (`make help` to list). Env vars in `.env.example`, database schema in `supabase/migrations/`.

Every PR should pass `make check` (lint, typecheck, test, build).

Runs with mock data when Supabase credentials are not configured. E2E tests use a local Supabase with password auth (no OAuth) — requires Docker.
