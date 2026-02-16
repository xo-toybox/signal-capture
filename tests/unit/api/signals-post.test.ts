import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockAuth, mockQueryResult, getLastInsert, getLastFromClient } from '../mocks/supabase';

const { POST } = await import('@/app/api/signals/route');

const testUser = { id: 'user-1', email: 'test@example.com' };

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/signals', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/signals', () => {
  beforeEach(() => {
    mockAuth(testUser);
    mockQueryResult({ data: { id: 'sig-1', raw_input: 'test' } });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);
    const res = await POST(makeRequest({ raw_input: 'hello' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when raw_input is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when raw_input is empty string', async () => {
    const res = await POST(makeRequest({ raw_input: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when raw_input is whitespace only', async () => {
    const res = await POST(makeRequest({ raw_input: '   \n\t  ' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when raw_input exceeds 10000 chars', async () => {
    const res = await POST(makeRequest({ raw_input: 'a'.repeat(10001) }));
    expect(res.status).toBe(400);
  });

  it('accepts raw_input at exactly 10000 chars', async () => {
    const res = await POST(makeRequest({ raw_input: 'a'.repeat(10000) }));
    expect(res.status).toBe(201);
    const inserted = getLastInsert() as Record<string, unknown>;
    expect(inserted.raw_input).toHaveLength(10000);
  });

  it('inserts via service client (bypasses RLS for write operations)', async () => {
    await POST(makeRequest({ raw_input: 'hello' }));
    expect(getLastFromClient()).toBe('service');
  });

  it('defaults invalid input_method to "text"', async () => {
    await POST(makeRequest({ raw_input: 'hello', input_method: 'invalid' }));
    const inserted = getLastInsert() as Record<string, unknown>;
    expect(inserted.input_method).toBe('text');
  });

  it('passes valid input_method through', async () => {
    for (const method of ['text', 'voice', 'share', 'extension']) {
      await POST(makeRequest({ raw_input: 'hello', input_method: method }));
      const inserted = getLastInsert() as Record<string, unknown>;
      expect(inserted.input_method).toBe(method);
    }
  });

  it('rejects javascript: URL in source_url and falls back to null', async () => {
    await POST(makeRequest({ raw_input: 'hello', source_url: 'javascript:alert(1)' }));
    const inserted = getLastInsert() as Record<string, unknown>;
    expect(inserted.source_url).toBeNull();
  });

  it('accepts https:// URL in source_url and normalizes it', async () => {
    await POST(makeRequest({ raw_input: 'hello', source_url: 'https://example.com' }));
    const inserted = getLastInsert() as Record<string, unknown>;
    expect(inserted.source_url).toBe('https://example.com/');
  });

  it('extracts URL from raw_input text', async () => {
    await POST(makeRequest({ raw_input: 'Check this https://example.com/article out' }));
    const inserted = getLastInsert() as Record<string, unknown>;
    expect(inserted.source_url).toBe('https://example.com/article');
  });

  it('does not extract javascript: from raw_input', async () => {
    await POST(makeRequest({ raw_input: 'javascript:alert(1) is bad' }));
    const inserted = getLastInsert() as Record<string, unknown>;
    expect(inserted.source_url).toBeNull();
  });

  it('trims and caps capture_context at 5000 chars', async () => {
    await POST(makeRequest({
      raw_input: 'hello',
      capture_context: '  ' + 'x'.repeat(6000) + '  ',
    }));
    const inserted = getLastInsert() as Record<string, unknown>;
    expect((inserted.capture_context as string).length).toBeLessThanOrEqual(5000);
    expect((inserted.capture_context as string)).not.toMatch(/^\s/);
  });

  it('treats whitespace-only capture_context as null', async () => {
    await POST(makeRequest({
      raw_input: 'hello',
      capture_context: '   \n  ',
    }));
    const inserted = getLastInsert() as Record<string, unknown>;
    expect(inserted.capture_context).toBeNull();
  });

  it('returns 500 on database error', async () => {
    mockQueryResult({ error: { message: 'db fail' } });
    const res = await POST(makeRequest({ raw_input: 'hello' }));
    expect(res.status).toBe(500);
  });
});
