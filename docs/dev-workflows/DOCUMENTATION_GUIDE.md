# Documentation Guide

## Categories

| Category | Directory | Audience | In-app | Regenerable |
|----------|-----------|----------|--------|-------------|
| **Public** | `docs/public/` | End users | Yes (`/docs`) | Yes (`living: true`) |
| **Internal** | `docs/internal/` | Developers | No | Sometimes |
| **Dev-workflows** | `docs/dev-workflows/` | Developers | No | No — static |

- **Public** — write for the person who *uses* the app, not who builds it
- **Internal specs** — dated prefix `YYYYMMDD-{topic}.md`, technical detail OK
- **Internal reference** — undated, may be regenerable (e.g., `makefile-workflows.md`)
- **Dev-workflows** — human-written guidelines, not auto-regenerated

## Frontmatter

```yaml
---
commit: ffd66a7          # short SHA of last commit that touched this doc
date: 2026-02-15         # YYYY-MM-DD
topic: features          # unique kebab-case identifier (used by docs.ts)
living: true             # only on regenerable docs; omit for static
---
```

Always update `commit` and `date` when regenerating.

## Regenerate prompts

HTML comment immediately after frontmatter. Must be **self-contained** — an agent with zero context produces a correct doc from this alone.

```markdown
<!-- regenerate: [prompt] -->
```

### Four required elements

1. **Discovery strategy** — tell the agent *where to look*, not what to find. "Enumerate app routes" stays correct as features change; "document the feed and capture form" goes stale.

2. **Structural intent** — describe output shape. Without this, format drifts across regenerations.

3. **Audience and voice** — explicitly state who reads this and how to write. Without it, agents default to developer prose. The original `capture-workflows.md` had field tables and pipeline internals; it was entirely rewritten as user-facing (commit `2b4f392`).

4. **Truthfulness constraint** — "Only describe features actually wired and working." Prevents documenting TODOs or dead code.

## Key lessons

- **Audience mismatch is the #1 failure.** Decide audience first. Encode it in the regenerate prompt. If a doc serves two audiences, split it.
- **Discovery-based prompts outlast feature lists.** "grep for all callers of that endpoint" beats "document the web form, share target, and extension."
- **Not everything should regenerate.** `build-vs-buy.md` and `IDENTITY_FRONTEND_DESIGN.md` preserve human intent — auto-regeneration would destroy their purpose.
- **Screenshots** go in `docs/screenshots/`, referenced as relative paths (`![alt](screenshots/01-feed-desktop.png)`).
