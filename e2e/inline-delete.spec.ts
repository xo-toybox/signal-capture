import { test, expect } from '@playwright/test';
import { authenticate, createSignal, apiDelete, apiGet } from './helpers';

test.describe('Inline delete from feed', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('inline delete: click × → confirm → signal removed', async ({ page }) => {
    const rawInput = `e2e-inline-del-${Date.now()}`;
    const signal = await createSignal(page, rawInput);

    await page.goto('/');
    await expect(page.getByText(rawInput)).toBeVisible();

    // Hover the signal card (the <a> containing the signal text)
    const card = page.locator('a', { has: page.getByText(rawInput) });
    await card.hover();

    // Click × to enter confirm state
    await card.getByText('×').click();

    // Should now show "delete?"
    await expect(card.getByText('delete?')).toBeVisible();

    // Click "delete?" to confirm and wait for the DELETE request to complete
    const deleteResponse = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'DELETE',
    );
    await card.getByText('delete?').click();
    await deleteResponse;

    // Verify signal is deleted via API
    const { data } = await apiGet(page, '/api/signals');
    const found = data.signals.find((s: { id: string }) => s.id === signal.id);
    expect(found).toBeUndefined();
  });

  test('inline delete confirmation resets after 3s', async ({ page }) => {
    const rawInput = `e2e-inline-reset-${Date.now()}`;
    const signal = await createSignal(page, rawInput);

    await page.goto('/');
    const card = page.locator('a', { has: page.getByText(rawInput) });
    await card.hover();

    // Click × to enter confirm state
    await card.getByText('×').click();
    await expect(card.getByText('delete?')).toBeVisible();

    // Wait for timeout reset (3s + buffer)
    await expect(card.getByText('×')).toBeVisible({ timeout: 5000 });

    // Clean up
    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });
});
