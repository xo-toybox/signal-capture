# Signal Capture

Personal signal capture and intelligence pipeline. Capture URLs, thoughts, and voice notes — auto-fetch page titles, triage with stars and archives, and annotate with inline notes. AI enrichment (claims, novelty, embeddings) is schema-ready but not yet wired.

The feed updates in realtime via Supabase subscriptions and can be filtered by active, starred, or archived status. Voice input (Web Speech API) is available on every text field — tap the mic and it inserts at the cursor. Capture context is click-to-edit inline (`Cmd+Enter` to save, `Esc` to cancel).

Designed as a single-tenant app — no user_id columns, no multi-tenancy overhead. Access is gated to one Google account via `ALLOWED_EMAIL`. All signals belong to the sole operator.

## Dashboards

- **Live app:** https://signal-capture.vercel.app
- **Vercel:** Vercel dashboard → signal-capture project
- **Supabase:** Supabase dashboard → signal-capture project
- **Google Cloud:** project name `signal-capture`

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

## Bug Reports & Feature Requests

A built-in reporter (floating "report" button, bottom-right) lets you file bugs or feature requests directly as GitHub Issues — no context switching required.

- Toggle between **Bug** and **Feature** modes
- Bugs include a severity picker (low / medium / high / critical)
- Environment context is captured automatically (URL, viewport, user agent, recent console errors)
- Submitted via `POST /api/report` → GitHub Issues API
- Issue titles are prefixed `[Bug]` or `[Feature]`
- Labels: `bug` or `enhancement`
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
    page.tsx              # Feed + capture form
    login/page.tsx        # Google OAuth login
    signal/[id]/page.tsx  # Signal detail view
    api/
      auth/callback/      # OAuth callback
      auth/test-session/  # Dev-only test auth
      signals/            # GET (list) + POST (capture) + PATCH (update) + DELETE
      signals/[id]/enrich-title/  # POST enrich page title
      signals/batch/      # POST batch capture (extension)
      report/             # POST bug reports to GitHub Issues
  components/
    CaptureForm.tsx       # Text/voice/share input
    SignalFeed.tsx        # Realtime feed with pagination
    SignalCard.tsx        # Feed item card
    VoiceInput.tsx        # Web Speech API wrapper
    DeleteButton.tsx      # Two-click delete with confirmation
    InlineDeleteButton.tsx # Inline delete with confirm state
    BugReporter.tsx       # Bug report trigger button
    BugReporterModal.tsx  # Bug report form modal
    EditableCaptureContext.tsx # Inline editable capture_context field
    StarButton.tsx        # Star/unstar toggle
    ArchiveButton.tsx     # Archive/unarchive toggle
  lib/
    supabase.ts           # Browser client (realtime)
    supabase-server.ts    # Server client (cookies) + service client (RLS bypass)
    types.ts              # SignalRaw, SignalFeedItem, etc.
    constants.ts          # Shared status colors and labels
    mock-data.ts          # Demo data when Supabase is not configured
    bug-report-types.ts   # BugReportPayload, BugReportError types
    fetch-title.ts        # Server-side page title fetcher
    console-error-buffer.ts # Captures recent console errors for bug reports
  proxy.ts                # Auth middleware (Next.js 16 proxy)
supabase/schema.sql       # Full database schema
```

### Data Model

- **signals_raw** — immutable capture (URL, text, context, input method)
- **signals_enriched** — AI-derived metadata (claims, tags, novelty, embeddings)
- **signals_human** — manual annotations (notes, ratings, tier overrides)
- **signals_feed** — unified view joining all three tables

## GitHub Automation

Claude Code GitHub Action (`.github/workflows/claude.yml`) enables delegated development via issues and PR comments. Create an issue or comment `@claude` to trigger automated implementation — Claude reads the codebase, makes changes, writes tests, and runs `make check` before creating a PR. Scoped to focused tasks (25-turn, 30-minute limit) with safety constraints: can't modify workflows, access secrets, or skip quality gates.

## Development

Use `make dev` (mock data, no database) or `make dev-docker` (local Supabase via Docker). Do **not** run `bun run dev` directly.

See `Makefile` for all workflows (`make help` to list). Env vars in `.env.example`, database schema in `supabase/schema.sql`.

Every PR should pass `make check` (lint, typecheck, test, build).

Runs with mock data when Supabase credentials are not configured. E2E tests use a local Supabase with password auth (no OAuth) — requires Docker.
