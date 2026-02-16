import { test, expect } from '@playwright/test';
import { authenticate } from './helpers';

test.describe('Authenticated user redirect', () => {
  test('authenticated user navigating to /login is redirected to /', async ({ page }) => {
    await authenticate(page);

    // Navigate to /login while already authenticated
    await page.goto('/login');

    // The proxy should redirect authenticated users from /login back to /
    await page.waitForURL('/');
    await expect(page.getByText('Signal Capture')).toBeVisible();
  });
});
