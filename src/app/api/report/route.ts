import { createServerClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';
import type { Severity, ReportKind } from '@/lib/bug-report-types';

async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const VALID_SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];

const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return Response.json({ error: 'Rate limit exceeded (10/hour)' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate title
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 256) {
    return Response.json({ error: 'title is required and must be under 256 chars' }, { status: 400 });
  }

  // Validate kind
  const validKinds: ReportKind[] = ['bug', 'feature'];
  const kind: ReportKind = validKinds.includes(body.kind) ? body.kind : 'bug';

  // Validate severity
  const severity: Severity = VALID_SEVERITIES.includes(body.severity) ? body.severity : 'medium';

  // Truncate optional fields
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 5000) : '';
  const url = typeof body.url === 'string' ? body.url.slice(0, 2048) : '';
  const userAgent = typeof body.userAgent === 'string' ? body.userAgent.slice(0, 512) : '';
  const viewport = typeof body.viewport === 'string' ? body.viewport.slice(0, 128) : '';
  const consoleErrors: string[] = Array.isArray(body.consoleErrors)
    ? body.consoleErrors.filter((e: unknown) => typeof e === 'string').slice(0, 10)
    : [];

  // Check GitHub config
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;
  if (!githubToken || !githubRepo) {
    console.error('report POST error: GITHUB_TOKEN or GITHUB_REPO not configured');
    return Response.json({ error: 'Bug reporting is not configured' }, { status: 502 });
  }
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepo)) {
    console.error('report POST error: GITHUB_REPO format invalid');
    return Response.json({ error: 'Bug reporting is misconfigured' }, { status: 502 });
  }

  // Build issue body
  const parts: string[] = [];
  if (description) parts.push(description);
  parts.push('');
  if (kind === 'bug') {
    parts.push(`**Severity:** ${severity}`);
  }
  parts.push('');
  parts.push('<details><summary>Environment</summary>');
  parts.push('');
  if (url) parts.push(`- **URL:** ${url}`);
  if (userAgent) parts.push(`- **User Agent:** ${userAgent}`);
  if (viewport) parts.push(`- **Viewport:** ${viewport}`);
  parts.push('');
  parts.push('</details>');

  if (consoleErrors.length > 0) {
    parts.push('');
    parts.push('<details><summary>Console Errors</summary>');
    parts.push('');
    parts.push('```');
    parts.push(consoleErrors.map(e => e.replace(/`/g, '\u02CB')).join('\n'));
    parts.push('```');
    parts.push('');
    parts.push('</details>');
  }

  const issueBody = parts.join('\n');

  // Create GitHub issue
  try {
    const res = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: kind === 'feature' ? `[Feature] ${title}` : `[Bug] ${title}`,
        body: issueBody,
        labels: [kind === 'feature' ? 'enhancement' : 'bug'],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('report POST error:', res.status, text);
      return Response.json({ error: 'Failed to create GitHub issue' }, { status: 502 });
    }

    const data = await res.json();
    return Response.json(
      { issue_url: data.html_url, issue_number: data.number },
      { status: 201 },
    );
  } catch (err) {
    console.error('report POST error:', err);
    return Response.json({ error: 'Failed to create GitHub issue' }, { status: 502 });
  }
}
