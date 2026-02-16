import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockAuth, mockQueryResult, getLastEq, getLastFromTable, getLastFromClient } from '../mocks/supabase';

const { DELETE } = await import('@/app/api/signals/route');

const testUser = { id: 'user-1', email: 'test@example.com' };

describe('DELETE /api/signals', () => {
  beforeEach(() => {
    mockAuth(testUser);
    mockQueryResult();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null);
    const req = new NextRequest('http://localhost:3000/api/signals?id=00000000-0000-0000-0000-000000000001', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/signals', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when id is not a valid UUID', async () => {
    const req = new NextRequest('http://localhost:3000/api/signals?id=not-a-uuid', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('deletes via service client (bypasses RLS for write operations)', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const req = new NextRequest(`http://localhost:3000/api/signals?id=${id}`, { method: 'DELETE' });
    await DELETE(req);
    expect(getLastFromClient()).toBe('service');
  });

  it('deletes from signals_raw with the correct id', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const req = new NextRequest(`http://localhost:3000/api/signals?id=${id}`, { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(id);
    expect(getLastFromTable()).toBe('signals_raw');
    expect(getLastEq()).toEqual(['id', id]);
  });

  it('returns 500 on database error', async () => {
    mockQueryResult({ error: { message: 'db fail' } });
    const id = '00000000-0000-0000-0000-000000000001';
    const req = new NextRequest(`http://localhost:3000/api/signals?id=${id}`, { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(500);
  });
});
