import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockAuth, mockQueryResult, getLastRange, getLastFromTable, getLastFromClient, getServiceChainCalls } from '../mocks/supabase';

const { GET } = await import('@/app/api/signals/route');

const testUser = { id: 'user-1', email: 'test@example.com' };
const sampleSignals = [{ id: '1', raw_input: 'signal one' }, { id: '2', raw_input: 'signal two' }];

function makeRequest(params = '') {
  return new NextRequest(`http://localhost:3000/api/signals${params}`, { method: 'GET' });
}

describe('GET /api/signals', () => {
  beforeEach(() => {
    mockAuth(testUser);
    mockQueryResult({ data: sampleSignals });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('queries via server client (RLS-enforced), not service client', async () => {
    await GET(makeRequest());
    expect(getLastFromClient()).toBe('server');
  });

  it('uses default limit=20 and offset=0', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(getLastFromTable()).toBe('signals_feed');
    expect(getLastRange()).toEqual([0, 19]); // range(0, 0+20-1)
    const body = await res.json();
    expect(body.signals).toEqual(sampleSignals);
  });

  it('clamps limit to max 100', async () => {
    await GET(makeRequest('?limit=999'));
    expect(getLastRange()).toEqual([0, 99]); // range(0, 0+100-1)
  });

  it('clamps limit to min 1', async () => {
    await GET(makeRequest('?limit=0'));
    expect(getLastRange()).toEqual([0, 0]); // 0 clamped to min 1, range(0, 0)
  });

  it('clamps negative offset to 0', async () => {
    await GET(makeRequest('?offset=-5'));
    expect(getLastRange()).toEqual([0, 19]); // offset clamped to 0
  });

  it('falls back to defaults for NaN params', async () => {
    await GET(makeRequest('?limit=abc&offset=xyz'));
    expect(getLastRange()).toEqual([0, 19]); // defaults: limit=20, offset=0
  });

  it('returns 500 on database error', async () => {
    mockQueryResult({ error: { message: 'db fail' } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  describe('auto-archive', () => {
    it('archives signals older than 30 days when filter=active', async () => {
      const before = Date.now();
      await GET(makeRequest('?filter=active'));
      const after = Date.now();

      const calls = getServiceChainCalls();
      const updateCall = calls.find(c => c.method === 'update');
      expect(updateCall).toBeDefined();
      expect(updateCall!.args[0]).toEqual({ is_archived: true });

      const eqCall = calls.find(c => c.method === 'eq');
      expect(eqCall).toBeDefined();
      expect(eqCall!.args).toEqual(['is_archived', false]);

      const ltCall = calls.find(c => c.method === 'lt');
      expect(ltCall).toBeDefined();
      expect(ltCall!.args[0]).toBe('created_at');

      // Verify cutoff is ~30 days ago
      const cutoff = new Date(ltCall!.args[1] as string).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(cutoff).toBeGreaterThanOrEqual(before - thirtyDaysMs - 1000);
      expect(cutoff).toBeLessThanOrEqual(after - thirtyDaysMs + 1000);
    });

    it('does not auto-archive for filter=archived', async () => {
      await GET(makeRequest('?filter=archived'));
      expect(getServiceChainCalls()).toHaveLength(0);
    });

    it('does not auto-archive for filter=all', async () => {
      await GET(makeRequest('?filter=all'));
      expect(getServiceChainCalls()).toHaveLength(0);
    });

    it('auto-archives on default filter (active)', async () => {
      await GET(makeRequest());
      const calls = getServiceChainCalls();
      expect(calls.find(c => c.method === 'update')).toBeDefined();
    });
  });
});
