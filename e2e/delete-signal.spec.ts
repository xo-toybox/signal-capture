import { test, expect } from '@playwright/test';
import { authenticate, createSignal, apiGet } from './helpers';

test.describe('Delete signal', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('create → detail → delete → confirm → verify removal', async ({ page }) => {
    const rawInput = `e2e-delete-test-${Date.now()}`;
    const signal = await createSignal(page, rawInput);

    await page.goto(`/signal/${signal.id}`);
    await expect(page.getByRole('heading', { name: rawInput })).toBeVisible();

    // First click — should show "confirm delete"
    const deleteBtn = page.getByRole('button', { name: /delete/i });
    await deleteBtn.click();
    await expect(deleteBtn).toHaveText(/confirm delete/i);

    // Second click — confirms deletion, should redirect to /
    await deleteBtn.click();
    await page.waitForURL('/');

    // Verify signal no longer in API response
    const { data } = await apiGet(page, '/api/signals');
    const found = data.signals.find((s: { id: string }) => s.id === signal.id);
    expect(found).toBeUndefined();
  });

  test('delete button resets after 3s without confirmation', async ({ page }) => {
    const signal = await createSignal(page);

    await page.goto(`/signal/${signal.id}`);

    const deleteBtn = page.getByRole('button', { name: /delete/i });
    await deleteBtn.click();
    await expect(deleteBtn).toHaveText(/confirm delete/i);

    // Wait for auto-reset (3s timer)
    await expect(deleteBtn).toHaveText(/^delete$/i, { timeout: 5000 });

    // Clean up
    await deleteBtn.click();
    await expect(deleteBtn).toHaveText(/confirm delete/i);
    await deleteBtn.click();
    await page.waitForURL('/');
  });
});
