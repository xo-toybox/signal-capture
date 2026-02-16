import { test, expect } from '@playwright/test';
import { authenticate, createSignal, apiDelete } from './helpers';

test.describe('Signal actions: star, archive, filter tabs', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  // ---------------------------------------------------------------------------
  // Star / Unstar
  // ---------------------------------------------------------------------------

  test('star a signal', async ({ page }) => {
    const signal = await createSignal(page, `e2e-star-${Date.now()}`);

    await page.goto('/');
    const card = page.locator('a', { has: page.getByText(signal.raw_input) });
    await card.hover();

    const starBtn = card.getByRole('button', { name: 'Star signal' });
    await expect(starBtn).toBeVisible();

    // Wait for the PATCH round-trip before asserting
    const patchRes = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'PATCH',
    );
    await starBtn.click();
    await patchRes;

    // After starring, the button label flips to "Unstar signal"
    await expect(card.getByRole('button', { name: 'Unstar signal' })).toBeVisible();

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('unstar a signal', async ({ page }) => {
    const signal = await createSignal(page, `e2e-unstar-${Date.now()}`);

    await page.goto('/');
    const card = page.locator('a', { has: page.getByText(signal.raw_input) });
    await card.hover();

    // Star first
    const starBtn = card.getByRole('button', { name: 'Star signal' });
    const patch1 = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'PATCH',
    );
    await starBtn.click();
    await patch1;

    // Now unstar
    const unstarBtn = card.getByRole('button', { name: 'Unstar signal' });
    const patch2 = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'PATCH',
    );
    await unstarBtn.click();
    await patch2;

    // Should be back to unstarred state
    await expect(card.getByRole('button', { name: 'Star signal' })).toBeVisible();

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  // ---------------------------------------------------------------------------
  // Archive / Unarchive
  // ---------------------------------------------------------------------------

  test('archive a signal removes it from active view', async ({ page }) => {
    const signal = await createSignal(page, `e2e-archive-${Date.now()}`);

    await page.goto('/');
    const card = page.locator('a', { has: page.getByText(signal.raw_input) });
    await card.hover();

    const archiveBtn = card.getByRole('button', { name: 'Archive signal' });
    await expect(archiveBtn).toBeVisible();

    const patchRes = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'PATCH',
    );
    await archiveBtn.click();
    await patchRes;

    // Re-click Active tab to re-fetch (realtime may be slow in test env)
    await page.getByRole('button', { name: 'Active' }).click();
    await expect(page.getByText(signal.raw_input)).toBeHidden({ timeout: 5000 });

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('unarchive a signal returns it to active view', async ({ page }) => {
    const signal = await createSignal(page, `e2e-unarchive-${Date.now()}`);

    // Archive it first via the UI
    await page.goto('/');
    const card = page.locator('a', { has: page.getByText(signal.raw_input) });
    await card.hover();
    const patchArchive = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'PATCH',
    );
    await card.getByRole('button', { name: 'Archive signal' }).click();
    await patchArchive;

    // Switch to Archived tab
    await page.getByRole('button', { name: 'Archived' }).click();
    await expect(page.getByText(signal.raw_input)).toBeVisible({ timeout: 5000 });

    // Unarchive
    const archivedCard = page.locator('a', { has: page.getByText(signal.raw_input) });
    await archivedCard.hover();
    const patchUnarchive = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'PATCH',
    );
    await archivedCard.getByRole('button', { name: 'Unarchive signal' }).click();
    await patchUnarchive;

    // Re-click Archived tab to re-fetch (realtime may be slow in test env)
    await page.getByRole('button', { name: 'Archived' }).click();
    await expect(page.getByText(signal.raw_input)).toBeHidden({ timeout: 5000 });

    // Switch back to Active — signal should be there again
    await page.getByRole('button', { name: 'Active' }).click();
    await expect(page.getByText(signal.raw_input)).toBeVisible({ timeout: 5000 });

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  // ---------------------------------------------------------------------------
  // Filter tabs
  // ---------------------------------------------------------------------------

  test('filter tabs show signals in correct categories', async ({ page }) => {
    const signal = await createSignal(page, `e2e-filter-${Date.now()}`);

    await page.goto('/');

    // --- Active tab (default): signal visible ---
    await expect(page.getByText(signal.raw_input)).toBeVisible();

    // --- Star the signal ---
    const card = page.locator('a', { has: page.getByText(signal.raw_input) });
    await card.hover();
    const patchStar = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'PATCH',
    );
    await card.getByRole('button', { name: 'Star signal' }).click();
    await patchStar;

    // --- Starred tab: signal visible ---
    await page.getByRole('button', { name: 'Starred' }).click();
    await expect(page.getByText(signal.raw_input)).toBeVisible({ timeout: 5000 });

    // --- All tab: signal visible ---
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.getByText(signal.raw_input)).toBeVisible({ timeout: 5000 });

    // --- Archive the signal ---
    // Switch back to Active first so archive removes it from that view
    await page.getByRole('button', { name: 'Active' }).click();
    await expect(page.getByText(signal.raw_input)).toBeVisible({ timeout: 5000 });

    const activeCard = page.locator('a', { has: page.getByText(signal.raw_input) });
    await activeCard.hover();
    const patchArchive = page.waitForResponse(
      (res) => res.url().includes('/api/signals') && res.request().method() === 'PATCH',
    );
    await activeCard.getByRole('button', { name: 'Archive signal' }).click();
    await patchArchive;

    // Re-click Active tab to re-fetch (realtime may be slow in test env)
    await page.getByRole('button', { name: 'Active' }).click();
    await expect(page.getByText(signal.raw_input)).toBeHidden({ timeout: 5000 });

    // --- Archived tab: signal visible ---
    await page.getByRole('button', { name: 'Archived' }).click();
    await expect(page.getByText(signal.raw_input)).toBeVisible({ timeout: 5000 });

    // --- All tab: signal still visible ---
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.getByText(signal.raw_input)).toBeVisible({ timeout: 5000 });

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });
});
