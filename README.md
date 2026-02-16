# Signal Capture

Personal signal capture and intelligence pipeline. Capture URLs, thoughts, and voice notes — then enrich them with AI-extracted claims, novelty assessments, and cross-signal analysis.

PWA with share target support for quick capture from any app on mobile. Signals can be filtered by active, starred, or archived status.

Designed as a single-tenant app — no user_id columns, no multi-tenancy overhead. Access is gated to one Google account via `ALLOWED_EMAIL`. All signals belong to the sole operator.

## Dashboards

- **Live app:** https://signal-capture.vercel.app
- **Vercel:** Vercel dashboard → signal-capture project
- **Supabase:** Supabase dashboard → signal-capture project
- **Google Cloud:** project name `signal-capture`

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

## Chrome Extension

A Chrome extension in `extension/` captures all open tabs in the current browser window as signals.

**Install:**
1. Chrome → Extensions → Enable Developer Mode
2. Load unpacked → select `extension/` directory
3. Click the extension icon to capture all tabs

## GitHub Automation

Claude Code GitHub Action (`.github/workflows/claude.yml`) enables delegated development via issues and PR comments. Create an issue or comment `@claude` to trigger automated implementation — Claude reads the codebase, makes changes, writes tests, and runs `make check` before creating a PR. Scoped to focused tasks (25-turn, 30-minute limit) with safety constraints: can't modify workflows, access secrets, or skip quality gates.

## Development

Use `make dev` (mock data, no database) or `make dev-docker` (local Supabase via Docker). Do **not** run `bun run dev` directly.

See `Makefile` for all workflows (`make help` to list). Env vars in `.env.example`, database schema in `supabase/schema.sql`.

Every PR should pass `make check` (lint, typecheck, test, build).

Runs with mock data when Supabase credentials are not configured. E2E tests use a local Supabase with password auth (no OAuth) — requires Docker.
