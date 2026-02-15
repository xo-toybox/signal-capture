# Ralph Loop: Repo Standards Review

> **Run:**
> ```
> /ralph-loop "Read .ralph/repo-standards-review.md and complete the task described." --max-iterations 10 --completion-promise "EXIT_SIGNAL"
> ```

## Objective

Security-first review of the repo for modern best practices and correctness. Fix all issues found. Iterate until clean.

## Main orchestrator role

You are the orchestrator. To preserve context across iterations:
- **NEVER** use Read, Grep, or Glob directly on source files
- **ONLY** dispatch subagents (Task tool), apply fixes (Edit), and make decisions
- All discovery, analysis, and verification runs through subagents

## Each iteration

Run every step in order. If anything was fixed during this iteration, stop — do NOT output EXIT_SIGNAL. The outer loop will re-feed this prompt for the next iteration.

1. **Discover** — delegate to concurrent subagents (one per dimension). Each subagent reads files and reports findings:
   - **Security** — hardcoded secrets, leaked infrastructure IDs, injection risks, overly permissive config, auth/input validation in source
   - **Correctness** — do commands work, cross-file reference sync, source code bugs and logic errors
   - **Consistency & completeness** — single package manager, README matches reality, .env.example documents all vars, dead code and stale imports
2. **Fix** all findings using Edit
3. **Cross-file sweep** — delegate to a subagent: for every file changed this iteration, grep the repo for references and report any stale or broken references
4. **Verify** — delegate to a subagent: run `make check` and report results. Fix any failures.
5. **Adversarial pass** — delegate to a subagent: assume something was missed, actively try to find one more issue. Fix if found.
6. **Security review** — delegate to a subagent: focused audit of all changes made this iteration for security regressions (new injection vectors, exposed secrets, weakened auth, OWASP top 10). Fix any findings.
7. **E2E gate** — delegate to a subagent: run `make test-e2e` and report results. Fix any failures.

If any step above produced fixes, stop here. The next iteration will re-review with fresh eyes.

If the entire iteration found nothing to fix and all verification passed, output:
```
EXIT_SIGNAL
```
