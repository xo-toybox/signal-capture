import { test, expect } from '@playwright/test';
import { authenticate, createSignal, apiDelete } from './helpers';

test.describe('Signal detail page', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('displays raw input and pending status for new signal', async ({ page }) => {
    const rawInput = `e2e-detail-${Date.now()}`;
    const signal = await createSignal(page, rawInput);

    await page.goto(`/signal/${signal.id}`);

    // Raw input visible in heading and body
    await expect(page.getByRole('heading', { name: rawInput })).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByText('awaiting enrichment')).toBeVisible();

    // Clean up
    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('back link navigates to home', async ({ page }) => {
    const signal = await createSignal(page);

    await page.goto(`/signal/${signal.id}`);
    await page.getByText('back').click();
    await page.waitForURL('/');

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('shows 404 state for non-existent signal', async ({ page }) => {
    await page.goto('/signal/00000000-0000-0000-0000-000000000000');
    await expect(page.getByText('signal not found')).toBeVisible();
  });

  test('displays source URL as clickable link', async ({ page }) => {
    const url = 'https://example.com/test-article';
    const rawInput = `Check this out ${url} e2e-${Date.now()}`;
    const signal = await createSignal(page, rawInput);

    await page.goto(`/signal/${signal.id}`);

    const link = page.getByRole('link', { name: url });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', url);
    await expect(link).toHaveAttribute('target', '_blank');

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });
});
