# Ralph Loop: Repo Standards Review

> **Run:**
> ```
> /ralph-loop "Read .ralph/repo-standards-review.md and complete the task described." --max-iterations 5 --completion-promise "EXIT_SIGNAL"
> ```

## Objective

Security-first review of the repo for modern best practices and correctness. Fix all issues found. Iterate until clean.

## Each iteration

Run every step in order. If anything was fixed during this iteration, stop — do NOT output EXIT_SIGNAL. The outer loop will re-feed this prompt for the next iteration.

1. **Discover** — delegate deep reviews to concurrent subagents. They should explore source code thoroughly within their dimension:
   - **Security** — hardcoded secrets, leaked infrastructure IDs, injection risks, overly permissive config, auth/input validation in source
   - **Correctness** — do commands work, cross-file reference sync, source code bugs and logic errors
   - **Consistency & completeness** — single package manager, README matches reality, .env.example documents all vars, dead code and stale imports
2. **Fix** all findings
3. **Cross-file sweep** — for every file changed, grep the repo for references to it. A fix in one file can leave stale references elsewhere (README, CI, docs). Fix any stale references.
4. **Verify** — delegate to a subagent: run `make check` and report results. Fix any failures.
5. **Adversarial pass** — assume something was missed. Actively try to find one more issue. Fix if found.
6. **Security review** — delegate to a subagent: focused audit of all changes made this iteration for security regressions (new injection vectors, exposed secrets, weakened auth, OWASP top 10). Fix any findings.
7. **E2E gate** — delegate to a subagent: run `make test-e2e` and report results. Fix any failures.

If any step above produced fixes, stop here. The next iteration will re-review with fresh eyes.

If the entire iteration found nothing to fix and all verification passed, output:
```
EXIT_SIGNAL
```
