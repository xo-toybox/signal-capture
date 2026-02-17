---
commit: 0110585
date: 2026-02-17
topic: makefile-workflows
---

<!-- regenerate: Read the Makefile and update this file. Describe development workflows — which targets to run together, in what order, and why. Group by scenario (discover scenarios from the targets, don't hardcode a list). Include the port map table. Update the YAML frontmatter commit/date. -->

# Makefile Workflows

How the make targets compose into actual development workflows.

## Day-to-day UI development (no Docker)

```
make dev
```

Runs on :3000 with mock data. Auth is bypassed (`isDev` returns mock user), no database needed. This is the default for working on components, layouts, and client-side logic.

## Responsive/mobile testing

```
make dev          # terminal 1 — desktop on :3000
make dev-mobile   # terminal 2 — mobile on :3001
```

Separate build dirs (`.next` vs `.next-mobile`) so they don't clobber each other. Open both side-by-side in different viewport widths.

## Full-stack development with real database

```
make dev-docker
```

Runs on :3002. Starts Docker + Supabase if needed, resets the DB with seed data, then launches the dev server connected to local Supabase. Use this when working on API routes, RLS policies, or auth flows.

## Claude/Playwright ad-hoc browsing

```
make dev-browse        # mock data, no Docker
make dev-browse-docker # real local Supabase
```

Both run on :3100 (the E2E port). Start one in the background, then use `browser_navigate http://localhost:3100` + `browser_snapshot` to visually verify pages without writing a test file. The `-docker` variant preserves existing DB state (doesn't reset).

## Running E2E tests

```
make test-e2e                   # all specs, headless
make test-e2e SPEC=auth         # single file (tests/e2e/auth.spec.ts)
make test-e2e-headed            # all specs, visible browser
make test-e2e-headed SPEC=feed  # single file, visible
make test-e2e-ui                # Playwright interactive UI (pick & rerun)
```

All require Docker/Supabase (auto-started). If `dev-browse` is already running on :3100, Playwright reuses it (`reuseExistingServer: true`) instead of launching a second server.

## Investigating test failures

```
make test-e2e-report
```

Opens the last HTML report in a browser. Works without Docker (config no longer exits on missing Supabase).

## Pre-push quality gate

```
make check
```

Runs lint, typecheck, unit tests, production build — in order. This is the CI gate; run it before pushing.

## First-time / fresh clone

```
make setup              # install deps, copy .env.example
make test-e2e-install   # install Playwright browsers
make db-reset           # seed local Supabase (if using Docker)
```

## Cleanup

```
make clean   # remove all build artifacts (.next, .next-*, .coverage, etc.)
make nuke    # clean + remove node_modules
```

## Port map

| Port | Target(s) | Build dir |
|------|-----------|-----------|
| 3000 | `dev` | `.next` |
| 3001 | `dev-mobile` | `.next-mobile` |
| 3002 | `dev-docker` | `.next-docker` |
| 3100 | `dev-browse`, `dev-browse-docker`, `test-e2e` | `.next-e2e` |
