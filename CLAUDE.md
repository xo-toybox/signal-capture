# Signal Capture

Personal signal-capture and enrichment tool. Single-tenant, dark-only UI.

## Stack

- Next.js 16 (Turbopack), React 19, Tailwind v4, Supabase
- `bun` for all package management and scripts (not npm/yarn)
- TypeScript strict mode, ESLint 9 flat config

## Key Conventions

- `proxy.ts` is the auth middleware (Next.js 16 renamed `middleware.ts` → `proxy.ts`, exports `proxy()`)
- `cookies()` from `next/headers` is async — always `await` it
- `useSearchParams()` requires a `<Suspense>` boundary
- Import alias: `@/*` maps to `src/*`
- Components: PascalCase files, `'use client'` directive when needed
- Utilities: kebab-case files in `src/lib/`

## Access Control

Two tiers, enforced by `proxy.ts` + route groups:

| Tier | Route group | Paths | Notes |
|---|---|---|---|
| Public | `(public)` | `/login`, `/docs/*` | No auth, no BugReporter |
| Authenticated | `(app)` | `/`, `/signal/*`, `/projects/*` | Google OAuth + `ALLOWED_EMAIL` |

API routes live outside groups — auth via proxy + route-level `getUser()`.
Admin/user separation deferred (single-tenant: owner = admin = user).

When adding a new page: place in the correct route group. If public, also add path prefix to `PUBLIC_PATHS` in `proxy.ts`.

When changing navigation targets (Links, redirects, EscapeBack), verify the destination is reachable from the same access tier. Public pages must not navigate to `(app)` routes.

## API Route Patterns

- Auth check first: call `getUser()`, return 401 if missing
- Use `createServiceClient()` for writes (bypasses RLS)
- Validate inputs: URL protocol whitelist (`http:`/`https:`), length limits
- Return 400 for validation errors, 401 for auth, 201 for creation

## Workflows

**Always use `make` targets** — never raw `bun run dev`, `bun run build`, etc. The Makefile sets env vars, output dirs, and ports correctly. Run `make help` to list available targets. Key ones:

- `make dev` — dev server on :3000 with mock data
- `make dev-browse` — dev server on :3100 for Playwright/MCP browser testing
- `make check` — lint + typecheck + test + build (run before considering work complete)
- `make test` / `make test-e2e` — unit / E2E tests

## Testing

- Mock setup in `tests/unit/setup.ts` and `tests/unit/mocks/supabase.ts`
- API tests use `makeRequest()` factory + `mockAuth()`/`mockQueryResult()` helpers

## Styling

- Tailwind v4, dark-only
- Design identity: [`docs/dev-workflows/IDENTITY_FRONTEND_DESIGN.md`](docs/dev-workflows/IDENTITY_FRONTEND_DESIGN.md)
- No arbitrary Tailwind values — use custom hex colors or CSS vars from `globals.css`

## Documentation

When creating or updating docs, follow [`docs/dev-workflows/DOCUMENTATION_GUIDE.md`](docs/dev-workflows/DOCUMENTATION_GUIDE.md).
