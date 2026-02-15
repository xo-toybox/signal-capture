import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockAuth, mockServiceClient, getLastRange, getLastFromTable } from '../mocks/supabase';

const { GET } = await import('@/app/api/signals/route');

const testUser = { id: 'user-1', email: 'test@example.com' };
const sampleSignals = [{ id: '1', raw_input: 'signal one' }, { id: '2', raw_input: 'signal two' }];

function makeRequest(params = '') {
  return new NextRequest(`http://localhost:3000/api/signals${params}`, { method: 'GET' });
}

describe('GET /api/signals', () => {
  beforeEach(() => {
    mockAuth(testUser);
    mockServiceClient({ data: sampleSignals });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
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
    expect(getLastRange()).toEqual([0, 19]); // parseInt('0')||20 → 20, range(0, 19)
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
    mockServiceClient({ error: { message: 'db fail' } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
