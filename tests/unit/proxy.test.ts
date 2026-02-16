import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

let mockUser: { id: string; email: string } | null = null;

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: { user: mockUser } })
      ),
    },
  })),
}));

const { proxy } = await import('../../src/proxy');

function makeRequest(path: string, base = 'http://localhost:3000') {
  return new NextRequest(new URL(path, base));
}

describe('proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    mockUser = null;
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  it('passes through when Supabase is not configured (demo mode)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    const res = await proxy(makeRequest('/'));
    // Should not redirect — just pass through
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated user to /login in production', async () => {
    mockUser = null;
    vi.stubEnv('NODE_ENV', 'production');
    const res = await proxy(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('returns JSON 401 for unauthenticated API requests in production', async () => {
    mockUser = null;
    vi.stubEnv('NODE_ENV', 'production');
    const res = await proxy(makeRequest('/api/report'));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('allows unauthenticated user through in development', async () => {
    mockUser = null;
    vi.stubEnv('NODE_ENV', 'development');
    const res = await proxy(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
  });

  it('allows authenticated user through', async () => {
    mockUser = { id: 'user-1', email: 'test@example.com' };
    const res = await proxy(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('bypasses auth for /login', async () => {
    mockUser = null;
    const res = await proxy(makeRequest('/login'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('bypasses auth for /api/auth/*', async () => {
    mockUser = null;
    const res = await proxy(makeRequest('/api/auth/callback'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated user on /login to /', async () => {
    mockUser = { id: 'user-1', email: 'test@example.com' };
    const res = await proxy(makeRequest('/login'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  it('does not redirect /login?error=access_denied', async () => {
    mockUser = { id: 'user-1', email: 'test@example.com' };
    const res = await proxy(makeRequest('/login?error=access_denied'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('blocks wrong email with ALLOWED_EMAIL in production', async () => {
    mockUser = { id: 'user-1', email: 'wrong@example.com' };
    vi.stubEnv('ALLOWED_EMAIL', 'right@example.com');
    vi.stubEnv('NODE_ENV', 'production');
    const res = await proxy(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('error')).toBe('access_denied');
  });

  it('returns JSON 403 for wrong email on API routes in production', async () => {
    mockUser = { id: 'user-1', email: 'wrong@example.com' };
    vi.stubEnv('ALLOWED_EMAIL', 'right@example.com');
    vi.stubEnv('NODE_ENV', 'production');
    const res = await proxy(makeRequest('/api/report'));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('ignores ALLOWED_EMAIL in development', async () => {
    mockUser = { id: 'user-1', email: 'wrong@example.com' };
    vi.stubEnv('ALLOWED_EMAIL', 'right@example.com');
    vi.stubEnv('NODE_ENV', 'development');
    const res = await proxy(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
  });
});
