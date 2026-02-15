import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });

  test('unauthenticated API request is redirected by proxy', async ({ page }) => {
    await page.goto('/login');
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/signals', { redirect: 'manual' });
      return { type: res.type };
    });
    expect(result.type).toBe('opaqueredirect');
  });

  test('test-session endpoint authenticates and grants access', async ({ page }) => {
    await page.goto('/login');

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/auth/test-session', { method: 'POST' });
      return { ok: res.ok };
    });
    expect(result.ok).toBe(true);

    await page.goto('/');
    await expect(page.getByText('Signal Capture')).toBeVisible();
  });
});
