# Signal Capture

Personal signal capture and intelligence pipeline. Capture URLs, thoughts, and voice notes — then enrich them with AI-extracted claims, novelty assessments, and cross-signal analysis.

PWA with share target support for quick capture from any app on mobile.

Designed as a single-tenant app — no user_id columns, no multi-tenancy overhead. Access is gated to one Google account via `ALLOWED_EMAIL`. All signals belong to the sole operator.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Supabase** — Postgres, Auth (Google OAuth), Realtime subscriptions
- **Tailwind CSS 4** — dark-only UI
- **Web Speech API** — voice input transcription

## Architecture

```
app/
  page.tsx              # Feed + capture form
  login/page.tsx        # Google OAuth login
  signal/[id]/page.tsx  # Signal detail view
  api/
    auth/callback/      # OAuth callback
    auth/test-session/  # Dev-only test auth
    signals/            # GET (list) + POST (capture)
components/
  CaptureForm.tsx       # Text/voice/share input
  SignalFeed.tsx        # Realtime feed with pagination
  SignalCard.tsx        # Feed item card
  VoiceInput.tsx        # Web Speech API wrapper
lib/
  supabase.ts           # Browser client (realtime)
  supabase-server.ts    # Server client (cookies) + service client (RLS bypass)
  types.ts              # SignalRaw, SignalFeedItem, etc.
  mock-data.ts          # Demo data when Supabase is not configured
proxy.ts                # Auth middleware (Next.js 16 proxy)
supabase/schema.sql     # Full database schema
```

### Data Model

- **signals_raw** — immutable capture (URL, text, context, input method)
- **signals_enriched** — AI-derived metadata (claims, tags, novelty, embeddings)
- **signals_human** — manual annotations (notes, ratings, tier overrides)
- **signals_feed** — unified view joining all three tables

## Setup

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key
ALLOWED_EMAIL=                  # Restrict access to this email (optional)
```

Run the schema in Supabase SQL Editor:

```bash
# supabase/schema.sql
```

Enable Google OAuth in Supabase Dashboard > Authentication > Providers.

## Security Model

Single-user app with defense in depth across three layers:

**Proxy (request boundary)** — `proxy.ts` intercepts all requests. Unauthenticated users are redirected to `/login`. When `ALLOWED_EMAIL` is set, only that Google account can access the app.

**API routes (data boundary)** — Every API handler calls `getUser()` via the cookie-based Supabase client before processing. Unauthorized requests get `401`. All writes go through the service role client (bypasses RLS) so the API is the sole write path.

**Row Level Security (database boundary)** — RLS is enabled on all tables. The anon key can only `SELECT` for authenticated users. No `INSERT`/`UPDATE`/`DELETE` policies exist for the anon key — writes are only possible through the service role used server-side.

**Input validation** — URLs are validated against `https?://` to prevent `javascript:` XSS. `raw_input` is capped at 10k chars, `capture_context` at 5k.

**Client exposure** — The browser only receives `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (read-only by RLS). The service role key never leaves the server.

## Development

```bash
npm install
npm run dev
```

Runs without Supabase credentials using mock data for demo purposes.

## Testing

### Unit tests

Vitest tests cover API route validation/auth, proxy middleware logic, and input sanitization — no running server or database required.

```bash
npm test              # Run unit tests
```

### E2E tests

E2E tests run against a local Supabase instance (never the remote database).

**Prerequisites:** Docker Desktop must be running.

```bash
supabase start        # Start local Supabase (first run pulls images)
npm run test:e2e      # Run Playwright E2E tests
```

Playwright automatically starts a Next.js dev server on port 3001 pointed at the local Supabase. The `supabase start` command applies migrations and provides local auth, so tests run in full isolation.
