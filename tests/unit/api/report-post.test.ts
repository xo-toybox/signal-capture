import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mockAuth } from '../mocks/supabase';

const { POST } = await import('@/app/api/report/route');

let userCounter = 0;
function freshUser() {
  return { id: `report-user-${++userCounter}`, email: 'test@example.com' };
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/report', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeBadJsonRequest() {
  return new NextRequest('http://localhost:3000/api/report', {
    method: 'POST',
    body: '{not json',
    headers: { 'Content-Type': 'application/json' },
  });
}

const mockFetch = vi.fn();
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockAuth(freshUser());
  process.env.GITHUB_TOKEN = 'ghp_test_token';
  process.env.GITHUB_REPO = 'owner/repo';
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ html_url: 'https://github.com/owner/repo/issues/42', number: 42 }),
    text: () => Promise.resolve(''),
  });
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_REPO;
  mockFetch.mockReset();
});

describe('POST /api/report', () => {
  // --- Auth ---

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);
    const res = await POST(makeRequest({ title: 'bug' }));
    expect(res.status).toBe(401);
  });

  // --- Rate limiting ---

  it('returns 429 when rate limit exceeded', async () => {
    const rateLimitUser = { id: 'rate-limit-tester', email: 'rate@test.com' };
    mockAuth(rateLimitUser);

    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRequest({ title: `bug ${i}` }));
      expect(res.status).not.toBe(429);
    }

    const res = await POST(makeRequest({ title: 'one too many' }));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain('Rate limit');
  });

  // --- JSON parsing ---

  it('returns 400 on invalid JSON body', async () => {
    const res = await POST(makeBadJsonRequest());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON body');
  });

  // --- Title validation ---

  it('returns 400 when title is missing', async () => {
    const res = await POST(makeRequest({ description: 'no title' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is empty string', async () => {
    const res = await POST(makeRequest({ title: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is whitespace only', async () => {
    const res = await POST(makeRequest({ title: '   \n\t  ' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is not a string', async () => {
    const res = await POST(makeRequest({ title: 123 as unknown as string }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when title exceeds 256 chars', async () => {
    const res = await POST(makeRequest({ title: 'a'.repeat(257) }));
    expect(res.status).toBe(400);
  });

  it('accepts title at exactly 256 chars', async () => {
    const res = await POST(makeRequest({ title: 'a'.repeat(256) }));
    expect(res.status).toBe(201);
  });

  // --- Severity validation ---

  it('defaults invalid severity to medium', async () => {
    await POST(makeRequest({ title: 'bug', severity: 'extreme' }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.body).toContain('**Severity:** medium');
  });

  it('passes valid severity through', async () => {
    for (const sev of ['low', 'medium', 'high', 'critical']) {
      mockFetch.mockClear();
      await POST(makeRequest({ title: 'bug', severity: sev }));
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.body).toContain(`**Severity:** ${sev}`);
    }
  });

  // --- Field truncation ---

  it('truncates description to 5000 chars', async () => {
    await POST(makeRequest({ title: 'bug', description: 'x'.repeat(6000) }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const desc = body.body.split('\n')[0];
    expect(desc.length).toBeLessThanOrEqual(5000);
  });

  it('caps consoleErrors at 10 entries', async () => {
    const errors = Array.from({ length: 15 }, (_, i) => `error-${i}`);
    await POST(makeRequest({ title: 'bug', consoleErrors: errors }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const codeBlock = body.body.match(/```\n([\s\S]*?)```/)?.[1] ?? '';
    const lines = codeBlock.trim().split('\n');
    expect(lines.length).toBe(10);
  });

  it('filters non-string consoleErrors', async () => {
    await POST(makeRequest({ title: 'bug', consoleErrors: ['valid', 123, null, 'also valid'] }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const codeBlock = body.body.match(/```\n([\s\S]*?)```/)?.[1] ?? '';
    const lines = codeBlock.trim().split('\n');
    expect(lines).toEqual(['valid', 'also valid']);
  });

  // --- GitHub config ---

  it('returns 502 when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const res = await POST(makeRequest({ title: 'bug' }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain('not configured');
  });

  it('returns 502 when GITHUB_REPO is missing', async () => {
    delete process.env.GITHUB_REPO;
    const res = await POST(makeRequest({ title: 'bug' }));
    expect(res.status).toBe(502);
  });

  // --- Success path ---

  it('returns 201 with issue_url and issue_number on success', async () => {
    const res = await POST(makeRequest({ title: 'bug' }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.issue_url).toBe('https://github.com/owner/repo/issues/42');
    expect(data.issue_number).toBe(42);
  });

  it('sends correct request to GitHub API', async () => {
    await POST(makeRequest({
      title: 'My Bug',
      description: 'Steps to repro',
      severity: 'high',
      url: 'http://localhost:3000/',
      userAgent: 'TestBrowser/1.0',
      viewport: '1920x1080',
    }));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/owner/repo/issues');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Authorization']).toBe('Bearer ghp_test_token');
    expect(opts.headers['X-GitHub-Api-Version']).toBe('2022-11-28');

    const body = JSON.parse(opts.body);
    expect(body.title).toBe('My Bug');
    expect(body.labels).toEqual(['bug']);
    expect(body.body).toContain('Steps to repro');
    expect(body.body).toContain('**Severity:** high');
    expect(body.body).toContain('http://localhost:3000/');
    expect(body.body).toContain('TestBrowser/1.0');
    expect(body.body).toContain('1920x1080');
  });

  it('includes console errors in issue body when present', async () => {
    await POST(makeRequest({
      title: 'bug',
      consoleErrors: ['[2026-01-01] TypeError: x is undefined'],
    }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.body).toContain('Console Errors');
    expect(body.body).toContain('TypeError: x is undefined');
  });

  it('omits console errors section when empty', async () => {
    await POST(makeRequest({ title: 'bug', consoleErrors: [] }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.body).not.toContain('Console Errors');
  });

  // --- GitHub API failure ---

  it('returns 502 when GitHub API returns error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: () => Promise.resolve('Validation Failed'),
    });
    const res = await POST(makeRequest({ title: 'bug' }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain('Failed to create GitHub issue');
  });

  it('returns 502 when fetch throws network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    const res = await POST(makeRequest({ title: 'bug' }));
    expect(res.status).toBe(502);
  });
});
