# Signal Capture

Personal signal capture and intelligence pipeline. Capture URLs, thoughts, and voice notes — then enrich them with AI-extracted claims, novelty assessments, and cross-signal analysis.

PWA with share target support for quick capture from any app on mobile.

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

**Client exposure** — The browser only receives `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (read-only by RLS). The service role key never leaves the server.

---

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
    signals/            # GET (list) + POST (capture) + DELETE
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

## Development

See `Makefile` for all workflows (`make setup`, `make dev`, `make test`, `make test-e2e`). Env vars in `.env.example`, database schema in `supabase/schema.sql`.

Runs with mock data when Supabase credentials are not configured. E2E tests use a local Supabase with password auth (no OAuth) — requires Docker.
