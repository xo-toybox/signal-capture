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

## API Route Patterns

- Auth check first: call `getUser()`, return 401 if missing
- Use `createServiceClient()` for writes (bypasses RLS)
- Validate inputs: URL protocol whitelist (`http:`/`https:`), length limits
- Return 400 for validation errors, 401 for auth, 201 for creation

## Workflows

Standard dev, test, and build commands are `make` targets — run `make help` to list them. Run `make check` before considering work complete.

## Testing

- Mock setup in `tests/unit/setup.ts` and `tests/unit/mocks/supabase.ts`
- API tests use `makeRequest()` factory + `mockAuth()`/`mockQueryResult()` helpers

## Styling

- Tailwind v4, dark-only: `bg-[#0a0a0a]`, `text-[#e5e5e5]`
- Borders: `border-white/5`
- No arbitrary Tailwind values — use custom hex colors
