import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockAuth, mockServiceClient, getLastEq, getLastFromTable } from '../mocks/supabase';

const { DELETE } = await import('@/app/api/signals/route');

const testUser = { id: 'user-1', email: 'test@example.com' };

describe('DELETE /api/signals', () => {
  beforeEach(() => {
    mockAuth(testUser);
    mockServiceClient();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);
    const req = new NextRequest('http://localhost:3000/api/signals?id=123', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/signals', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('deletes from signals_raw with the correct id', async () => {
    const req = new NextRequest('http://localhost:3000/api/signals?id=abc-123', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe('abc-123');
    expect(getLastFromTable()).toBe('signals_raw');
    expect(getLastEq()).toEqual(['id', 'abc-123']);
  });

  it('returns 500 on database error', async () => {
    mockServiceClient({ error: { message: 'db fail' } });
    const req = new NextRequest('http://localhost:3000/api/signals?id=abc-123', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(500);
  });
});
