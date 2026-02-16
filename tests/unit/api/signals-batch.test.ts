import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mockAuth, mockQueryResult, getLastInsert, getLastFromClient } from '../mocks/supabase';

// Mock globalThis.fetch to prevent fire-and-forget enrichment calls
const fetchSpy = vi.fn().mockResolvedValue(new Response('{}'));
vi.stubGlobal('fetch', fetchSpy);

const { POST } = await import('@/app/api/signals/batch/route');

const testUser = { id: 'user-1', email: 'test@example.com' };

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/signals/batch', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeCapture(overrides: Record<string, unknown> = {}) {
  return { source_url: 'https://example.com', raw_input: 'Example', ...overrides };
}

describe('POST /api/signals/batch', () => {
  beforeEach(() => {
    mockAuth(testUser);
    mockQueryResult({ data: [{ id: 'sig-1', source_url: 'https://example.com' }] });
    fetchSpy.mockClear();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);
    const res = await POST(makeRequest({ captures: [makeCapture()] }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/signals/batch', {
      method: 'POST',
      body: 'not json{{{',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid json/i);
  });

  it('returns 400 when captures is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when captures is empty array', async () => {
    const res = await POST(makeRequest({ captures: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when captures is not an array', async () => {
    const res = await POST(makeRequest({ captures: 'not-array' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when captures exceeds 100', async () => {
    const captures = Array.from({ length: 101 }, (_, i) => makeCapture({ raw_input: `Tab ${i}` }));
    const res = await POST(makeRequest({ captures }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/100/);
  });

  it('returns 400 when all captures are invalid', async () => {
    const captures = [
      { source_url: 'https://example.com', raw_input: '' },
      { source_url: 'https://example.com', raw_input: '   ' },
    ];
    const res = await POST(makeRequest({ captures }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/no valid captures/i);
  });

  it('skips captures with oversized raw_input', async () => {
    const captures = [
      makeCapture({ raw_input: 'a'.repeat(10001) }),
      makeCapture({ raw_input: 'valid' }),
    ];
    await POST(makeRequest({ captures }));
    const inserted = getLastInsert() as Record<string, unknown>[];
    expect(inserted).toHaveLength(1);
    expect(inserted[0].raw_input).toBe('valid');
  });

  it('rejects javascript: URL in source_url', async () => {
    await POST(makeRequest({ captures: [makeCapture({ source_url: 'javascript:alert(1)' })] }));
    const inserted = getLastInsert() as Record<string, unknown>[];
    expect(inserted[0].source_url).toBeNull();
  });

  it('accepts https:// URL in source_url', async () => {
    await POST(makeRequest({ captures: [makeCapture({ source_url: 'https://example.com' })] }));
    const inserted = getLastInsert() as Record<string, unknown>[];
    expect(inserted[0].source_url).toBe('https://example.com/');
  });

  it('trims and caps capture_context at 5000 chars', async () => {
    const captures = [makeCapture({ capture_context: '  ' + 'x'.repeat(6000) + '  ' })];
    await POST(makeRequest({ captures }));
    const inserted = getLastInsert() as Record<string, unknown>[];
    expect((inserted[0].capture_context as string).length).toBeLessThanOrEqual(5000);
  });

  it('treats whitespace-only capture_context as null', async () => {
    const captures = [makeCapture({ capture_context: '   \n  ' })];
    await POST(makeRequest({ captures }));
    const inserted = getLastInsert() as Record<string, unknown>[];
    expect(inserted[0].capture_context).toBeNull();
  });

  it('inserts to signals_raw via service client', async () => {
    await POST(makeRequest({ captures: [makeCapture()] }));
    expect(getLastFromClient()).toBe('service');
  });

  it('returns 201 with count on success', async () => {
    mockQueryResult({ data: [{ id: 'sig-1', source_url: 'https://example.com' }] });
    const res = await POST(makeRequest({ captures: [makeCapture()] }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.count).toBe(1);
  });

  it('sets input_method to "extension" for all captures', async () => {
    await POST(makeRequest({ captures: [makeCapture(), makeCapture({ raw_input: 'Second' })] }));
    const inserted = getLastInsert() as Record<string, unknown>[];
    for (const sig of inserted) {
      expect(sig.input_method).toBe('extension');
    }
  });

  it('returns 500 on database error', async () => {
    mockQueryResult({ error: { message: 'db fail' } });
    const res = await POST(makeRequest({ captures: [makeCapture()] }));
    expect(res.status).toBe(500);
  });
});
