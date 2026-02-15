import type { Page } from '@playwright/test';

/** POST from within the browser so cookies are stored in the page context */
export async function apiPost(page: Page, path: string, body?: object) {
  return page.evaluate(
    async ({ path, body }) => {
      const res = await fetch(path, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      return { ok: res.ok, status: res.status, data: await res.json() };
    },
    { path, body },
  );
}

/** GET from within the browser */
export async function apiGet(page: Page, path: string) {
  return page.evaluate(async (path) => {
    const res = await fetch(path);
    return { ok: res.ok, status: res.status, data: await res.json() };
  }, path);
}

/** DELETE from within the browser */
export async function apiDelete(page: Page, path: string) {
  return page.evaluate(async (path) => {
    const res = await fetch(path, { method: 'DELETE' });
    return { ok: res.ok, status: res.status, data: await res.json() };
  }, path);
}

/** Authenticate via test-session endpoint. Call after page.goto() to establish origin. */
export async function authenticate(page: Page) {
  await page.goto('/login');
  const { ok } = await apiPost(page, '/api/auth/test-session');
  if (!ok) throw new Error('Failed to authenticate test session');
}

/** Create a signal via API and return the signal object */
export async function createSignal(page: Page, rawInput?: string) {
  const input = rawInput ?? `e2e-signal-${Date.now()}`;
  const { data } = await apiPost(page, '/api/signals', {
    raw_input: input,
    input_method: 'text',
  });
  return data.signal;
}
