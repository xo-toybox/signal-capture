# Ralph Loop: Repo Standards Review

## Objective

Security-first review of the repo for modern best practices and correctness. Fix all issues found. Iterate until clean.

## Main orchestrator role

You are the orchestrator. To preserve context across iterations:
- **NEVER** use Read, Grep, or Glob directly on source files
- **ONLY** dispatch subagents (Task tool), apply fixes (Edit), and make decisions
- All discovery, analysis, and verification runs through subagents

## Subagent prompts

End every subagent prompt with concise output instructions (e.g., "If nothing found, say CLEAN").

## Accepted trade-offs (do NOT flag)

These are intentional design decisions. Subagent prompts MUST include this list verbatim to suppress false positives:

- **Single-tenant architecture** — no user_id columns, no multi-tenancy. DELETE without ownership check is by design. `ALLOWED_EMAIL` gates access to one Google account.
- **`/api/auth/test-session`** — dev-only endpoint, gated by `NODE_ENV === 'production'`. Vercel always sets this.
- **CSP `unsafe-inline`** — required by Next.js without nonce middleware. Accepted.
- **In-memory rate limiting** — single user, serverless (restarts clear map). No cleanup needed.
- **No rate limiting on `/api/signals`** — single-user app, not worth the complexity.
- **`isLocalUrl` only checks localhost/127.0.0.1/0.0.0.0** — guards env var, not user input. Attacker can't control `NEXT_PUBLIC_SUPABASE_URL`.
- **Supabase project ref** — not a secret, safe in config/docs.
- **Node.js rate limiter is not thread-safe** — Node.js is single-threaded; check-then-increment is atomic within the synchronous portion.
- **GitHub issue markdown injection** — single-user app (attacker is owner), and GitHub sanitizes rendered markdown.

## Each iteration

Run every step in order. If anything was fixed during this iteration, stop — do NOT output EXIT_SIGNAL. The outer loop will re-feed this prompt for the next iteration.

1. **Discover** — delegate to concurrent `feature-dev:code-reviewer` subagents (one per dimension). Each subagent reads files and reports findings:
   - **Security** — hardcoded secrets, leaked infrastructure IDs, injection risks, overly permissive config, auth/input validation in source
   - **Correctness** — do commands work, cross-file reference sync, source code bugs and logic errors
   - **Consistency & completeness** — single package manager, README matches reality, .env.example documents all vars, dead code and stale imports
2. **Fix** all findings using Edit
3. **Cross-file sweep** — delegate to a subagent: for every file changed this iteration, grep the repo for references and report any stale or broken references
4. **Verify** — run `make check` directly (Bash tool) and fix any failures
5. **Adversarial pass** — delegate to the `adversarial-hunter` subagent. Include project-specific accepted trade-offs in the prompt to suppress false positives. Fix if found.
6. **Security review** — delegate to the `red-team-auditor` subagent. Include project-specific accepted trade-offs in the prompt. Fix any findings.
7. **E2E coverage** — delegate to a subagent: for each user-facing feature (pages, forms, buttons, flows), check whether a corresponding E2E test exists in `e2e/`. Report features with no E2E coverage. Fix by writing missing E2E tests.
8. **E2E gate** — run `make test-e2e` (Bash tool, outside sandbox via `dangerouslyDisableSandbox: true`) and fix any failures. Requires Docker for local Supabase. Kill any running `next dev` first (check `.next/dev/lock`).

If any step above produced fixes, stop here. The next iteration will re-review with fresh eyes.

If the entire iteration found nothing to fix and all verification passed, output:
```
EXIT_SIGNAL
```
