# Ralph Loop: Repo Standards Review

> **Run:**
> ```
> /ralph-loop "Read .ralph/repo-standards-review.md and complete the task described." --max-iterations 5 --completion-promise "EXIT_SIGNAL"
> ```

## Objective

Review the repo for modern best practices, security, and correctness. Fix all issues found. Iterate until clean.

## Process

1. Read key repo config files (Makefile, package.json, README, .env.example, .gitignore, CI config, etc.)
2. Identify issues — best practices, security, consistency, completeness
3. Fix all issues
4. **Cross-file sweep** — for every file changed, grep the repo for references to it and review those files too. A fix in one file (e.g. Makefile) can leave stale references elsewhere (README, CI, docs).
5. Re-review — fixes can introduce new issues
6. Repeat 2–5 until a full pass finds nothing
7. **Adversarial pass** — assume something was missed. Actively try to find one more issue. Only proceed to verification if this pass comes up empty.

## Verification (mandatory — do not skip)

After the final review pass finds zero issues, run every user-facing command that was added or modified (e.g. `make help`, `make -n check`, `bun run typecheck`). Show the output. If any command fails or produces unexpected output, go back to step 2.

## Completion

Only after verification passes with zero failures, output:
```
EXIT_SIGNAL
```

Do NOT output EXIT_SIGNAL based on code review alone. Runtime verification must pass first.
