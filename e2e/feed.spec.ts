import { test, expect } from '@playwright/test';
import { authenticate, createSignal, apiDelete } from './helpers';

test.describe('Signal feed', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('displays signals in reverse chronological order', async ({ page }) => {
    const first = await createSignal(page, `e2e-order-first-${Date.now()}`);
    await new Promise(r => setTimeout(r, 100));
    const second = await createSignal(page, `e2e-order-second-${Date.now()}`);

    await page.goto('/');

    const firstEl = page.getByText(first.raw_input);
    const secondEl = page.getByText(second.raw_input);
    await expect(firstEl).toBeVisible();
    await expect(secondEl).toBeVisible();

    const allText = await page.locator('[class*="font-mono"]').allTextContents();
    const joined = allText.join(' ');
    const secondIdx = joined.indexOf(second.raw_input);
    const firstIdx = joined.indexOf(first.raw_input);
    expect(secondIdx).toBeLessThan(firstIdx);

    await apiDelete(page, `/api/signals?id=${first.id}`);
    await apiDelete(page, `/api/signals?id=${second.id}`);
  });

  test('clicking a signal navigates to detail page', async ({ page }) => {
    const signal = await createSignal(page, `e2e-nav-${Date.now()}`);

    await page.goto('/');
    await page.getByText(signal.raw_input).click();

    await page.waitForURL(`/signal/${signal.id}`);
    await expect(page.getByRole('heading', { name: signal.raw_input })).toBeVisible();

    await page.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm delete/i }).click();
    await page.waitForURL('/');
  });
});
