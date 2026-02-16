# Bug Reporter

In-app bug reporting that auto-creates GitHub issues with rich context.

## 1. Motivation

Filing issues through the GitHub UI requires manually gathering context — current URL, browser version, console errors, viewport size — every single time. For a single-user app this friction is enough to skip reporting entirely, which means bugs slip through.

An in-app reporter captures all of that automatically. The user types a title and description; everything else is bundled into the issue body. Zero-friction reporting means more bugs get tracked.

## 2. Interaction

**Trigger**: Fixed bottom-right pill button (`fixed bottom-4 right-4`) with blue dot indicator and "REPORT" label. Always visible to authenticated users.

**Modal form**:
- **Kind** — segmented toggle: `Bug` | `Feature` (defaults to Bug)
- **Title** — single-line text input (required, max 256 chars)
- **Description** — freeform textarea (optional, max 5000 chars)
- **Severity** — segmented control: `low` | `medium` | `high` | `critical` (only shown for bugs, not features)

**Dismiss**: Escape key or backdrop click closes the modal without submitting.

**Submit flow**:
1. Button shows animated dot loading state
2. `POST /api/report` with form data + auto-captured metadata
3. On success: modal closes, toast appears positioned above trigger button with "Issue #N created" + clickable link. Auto-dismisses after 5 seconds.
4. On error: inline error banner in modal (from `{ error }` response), form stays open

## 3. Captured data

### User-provided
| Field       | Type   | Required | Max length |
|-------------|--------|----------|------------|
| kind        | enum   | yes      | bug \| feature |
| title       | string | yes      | 256 chars  |
| description | string | no       | 5000 chars |
| severity    | enum   | yes*     | low \| medium \| high \| critical |

*Severity only applies to bugs (not features).

### Auto-captured (with truncation limits)
| Field          | Source                          | Max length |
|----------------|----------------------------------|------------|
| Page URL       | `window.location.href`          | 2048 chars |
| User Agent     | `navigator.userAgent`           | 512 chars  |
| Viewport       | `${innerWidth}x${innerHeight}`  | 128 chars  |
| Console errors | Ring buffer of last 10 errors (FIFO eviction), captured via global `error` + `unhandledrejection` listeners. Initialized once on app mount, persists across client-side navigations. Timestamps in ISO format. | 10 entries max |

### v1 omission

Screenshots — skip for now. Can add `html2canvas` or native screen capture later if console errors alone aren't enough to reproduce issues.

## 4. Pipeline

```
Browser (modal form)
  │
  ├─ collect auto-captured fields (url, userAgent, viewport, consoleErrors)
  ├─ merge with user input (kind, title, description, severity)
  │
  ▼
POST /api/report
  │
  ├─ check auth: requires authenticated user (401 if not)
  ├─ rate limit: in-memory counter, max 10 issues per hour per user ID
  ├─ validate: title required + ≤256 chars, kind in enum, severity in enum
  ├─ truncate: description (5000), url (2048), userAgent (512), viewport (128)
  ├─ sanitize: replace backticks in console errors (prevent markdown escaping)
  ├─ build issue body from template
  │
  ▼
GitHub REST API
  POST /repos/{owner}/{repo}/issues
  │
  ├─ title: "[Feature] {title}" for features, "{title}" for bugs
  ├─ body: description + severity (bugs only) + environment details + console errors
  ├─ labels: ["enhancement"] for features, ["bug"] for bugs
  │
  ▼
Return { issue_url, issue_number } → client toast
```

### API response shapes

**Success** (`201`):
```json
{ "issue_url": "https://github.com/…/issues/42", "issue_number": 42 }
```

**Unauthorized** (`401`):
```json
{ "error": "Unauthorized" }
```

**Validation error** (`400`):
```json
{ "error": "title is required and must be under 256 chars" }
```

**Rate limit** (`429`):
```json
{ "error": "Rate limit exceeded (10/hour)" }
```

**GitHub API failure** (`502`):
```json
{ "error": "Failed to create GitHub issue" }
```

**Config error** (`502`):
```json
{ "error": "Bug reporting is not configured" }
```

### Issue body template

**For bugs:**
```markdown
{user description}

**Severity:** {severity}

<details><summary>Environment</summary>

- **URL:** {page_url}
- **User Agent:** {user_agent}
- **Viewport:** {viewport}

</details>

<details><summary>Console Errors</summary>

```
{console_errors with backticks replaced}
```

</details>
```

**For features:**
```markdown
{user description}

<details><summary>Environment</summary>

- **URL:** {page_url}
- **User Agent:** {user_agent}
- **Viewport:** {viewport}

</details>
```

Note: Console errors only included if non-empty. Severity line omitted for feature requests.

## 5. Configuration

| Env var        | Value                          | Purpose                         | Validation |
|----------------|--------------------------------|---------------------------------|------------|
| `GITHUB_TOKEN` | Fine-grained PAT               | Issues write scope on target repo | Required   |
| `GITHUB_REPO`  | `xo-toybox/signal-capture`     | Target repo in `owner/repo` format | Regex: `/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/` |

**Setup**:
- Add both to `.env.example` (placeholder values)
- Add both to Vercel dashboard for production
- **Local dev:**
  - `GITHUB_TOKEN` → `~/.secrets` (protected, never committed)
  - `GITHUB_REPO` → `~/.env.shared` (public var, not a secret)

**Runtime validation**: API returns 502 with descriptive error if either var is missing or if `GITHUB_REPO` format is invalid.

## 6. Constraints

- **No new dependencies** — React 19 + Tailwind v4 + native `fetch` only
- **Dark terminal aesthetic** — hardcoded colors matching app theme (black bg `#141414`, blue accent `#3b82f6`, borders with low opacity white)
- **Visible but unobtrusive** — fixed bottom-right pill button, always visible but minimal footprint
- **Auth required** — `/api/report` checks for authenticated user (returns 401 if not), uses user ID for rate limiting
- **GitHub API called server-side only** — token never exposed to the client
