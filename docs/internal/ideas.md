---
commit: dea028b
date: 2026-02-18
topic: ideas
---

# Ideas

Things worth doing that don't have a timeline yet. Each idea has enough context to pick up cold.

---

## 1. Competitor UX studies

Study products that excel in dimensions we care about. Not feature comparison — deep UX teardowns: what interactions feel like, how density is achieved, what keyboard vocabulary they use, where they create delight. Feed findings into the design identity doc.

### Linear (highest priority)

Strongest overlap with our aesthetic: dark, dense, keyboard-first, monospace accents. Their projects model is the closest structural analog to ours despite the task-vs-thought divergence.

What to study:

- **Command palette (Cmd+K)** — instant access to everything. Search signals, switch projects, jump to docs, trigger actions. The single highest-leverage keyboard feature we're missing.
- **Keyboard navigation vocabulary** — J/K to move through lists, single-key actions (S for status, P for priority), Enter to open, Escape to back. Our feed and project list have no keyboard nav at all.
- **Speed as felt quality** — optimistic updates are universal, transitions are oriented (slide direction matches navigation direction), nothing ever feels like it's waiting. We have optimistic updates in some places but not consistently.
- **Density with legibility** — type indicator, priority dot, title, assignee, and project badge in one row that's still scannable. How they balance information per pixel without overwhelming.
- **Contextual actions** — right-click menus, inline actions on hover, keyboard shortcuts that change based on context. Progressive disclosure of power without cluttering the default view.
- **Triage as flow state** — how the inbox → categorize → act pipeline creates momentum. Our signal feed triage could learn from this rhythm.

What doesn't translate: status pipelines, cycle/sprint views, team collaboration chrome, view configurability. Our simplicity is a feature.

### Other products to study

- **Readwise Reader** — reading UX, highlight interaction, the "ghost reader" AI integration. Best-in-class for the reading dimension we explicitly don't build.
- **Raindrop.io** — mobile capture flow, collection organization at scale. Clean and fast despite being a simpler product.
- **Things 3** — the gold standard for interaction feel on Apple platforms. Spring animations, gesture vocabulary, progressive disclosure. Not a competitor but a masterclass in physical interaction design.
- **Superhuman** — speed as identity, command palette UX, keyboard-first email. Similar design philosophy applied to a different domain.

---

## 2. Command palette (Cmd+K)

Came out of the Linear study but stands alone as the single feature that would most elevate the "keyboard-deep" principle from aspiration to reality.

Scope: search signals by title/content, switch between projects, jump to docs pages, quick-capture without navigating home. Could start minimal (just search + navigate) and grow.

Depends on: nothing. Could ship independently.

---
