# Bug Reporter

In-app bug reporting that auto-creates GitHub issues with rich context.

## 1. Motivation

Filing issues through the GitHub UI requires manually gathering context — current URL, browser version, console errors, viewport size — every single time. For a single-user app this friction is enough to skip reporting entirely, which means bugs slip through.

An in-app reporter captures all of that automatically. The user types a title and description; everything else is bundled into the issue body. Zero-friction reporting means more bugs get tracked.

## 2. Interaction

**Trigger**: `Cmd+Shift+B` opens a modal overlay. No visible UI element — this is a hidden power-user feature.

**Modal form**:
- **Title** — single-line text input (required)
- **Description** — freeform textarea (optional)
- **Severity** — segmented control: `low` | `medium` | `high` | `critical`

**Dismiss**: Escape key or backdrop click closes the modal without submitting.

**Submit flow**:
1. Button shows loading state
2. `POST /api/report` with form data
3. On success: modal closes, toast appears with "Issue created" + clickable link to the GitHub issue. Toast is a minimal positioned `div` (bottom-right, `fixed`), auto-dismisses after 5 seconds.
4. On error: inline error message in the modal (from `{ error }` response), form stays open

## 3. Captured data

### User-provided
| Field       | Type   | Required |
|-------------|--------|----------|
| title       | string | yes      |
| description | string | no       |
| severity    | enum   | yes      |

### Auto-captured
| Field          | Source                          |
|----------------|---------------------------------|
| Page URL       | `window.location.href`          |
| Browser + OS   | `navigator.userAgent`           |
| Viewport       | `${innerWidth}x${innerHeight}`  |
| Console errors | Ring buffer of last 10 errors (FIFO eviction), captured via global `error` + `unhandledrejection` listeners. Initialized once on app mount, persists across client-side navigations. |

### v1 omission

Screenshots — skip for now. Can add `html2canvas` or native screen capture later if console errors alone aren't enough to reproduce issues.

## 4. Pipeline

```
Browser (modal form)
  │
  ├─ collect auto-captured fields
  ├─ merge with user input
  │
  ▼
POST /api/report
  │
  ├─ rate limit: in-memory counter, max 10 issues per hour per session
  ├─ validate: title non-empty, severity in enum
  ├─ build issue body from template
  │
  ▼
GitHub REST API
  POST /repos/{owner}/{repo}/issues
  │
  ├─ title: user-provided title
  ├─ body: description + metadata block
  ├─ labels: ["bug"] (severity goes in the body, not as a label)
  │
  ▼
Return { issue_url, issue_number } → client toast
```

### API response shapes

**Success** (`201`):
```json
{ "issue_url": "https://github.com/…/issues/42", "issue_number": 42 }
```

**Validation error** (`400`):
```json
{ "error": "Title is required" }
```

**GitHub API failure** (`502`):
```json
{ "error": "Failed to create issue" }
```

### Issue body template

```markdown
{user description}

<details>
<summary>Environment</summary>

| Key | Value |
|-----|-------|
| URL | `{page_url}` |
| Browser | `{user_agent}` |
| Viewport | `{viewport}` |
| Severity | `{severity}` |

</details>

<details>
<summary>Console errors ({count})</summary>

\`\`\`
{console_errors}
\`\`\`

</details>
```

## 5. Configuration

| Env var        | Value                          | Purpose                         |
|----------------|--------------------------------|---------------------------------|
| `GITHUB_TOKEN` | Fine-grained PAT               | Issues write scope on target repo |
| `GITHUB_REPO`  | `xo-toybox/signal-capture`     | Target repo in `owner/repo` format |

**Setup**:
- Add both to `.env.example` (placeholder values)
- Add both to Vercel dashboard for production
- Add `GITHUB_TOKEN` to `~/.secrets` for local dev
- Add `GITHUB_REPO` to `~/.env.shared` (not a secret)

## 6. Constraints

- **No new dependencies** — React 19 + Tailwind v4 + native `fetch` only
- **Dark terminal aesthetic** — uses existing CSS vars from `globals.css` (`--background`, `--foreground`, `--accent`, `--border`, `--muted`)
- **Hidden feature** — no nav link, no button, only `Cmd+Shift+B`
- **No route-level auth** — `/api/report` sits behind `proxy.ts` auth wall, so it's already protected
- **GitHub API called server-side only** — token never exposed to the client
