import { test, expect } from '@playwright/test';
import { authenticate, createSignal, apiDelete } from './helpers';

const SIGNAL_COUNT = 25; // Must exceed PAGE_SIZE (20) to trigger "load more"

test.describe('Pagination – load more', () => {
  const createdIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await authenticate(page);

    for (let i = 0; i < SIGNAL_COUNT; i++) {
      const signal = await createSignal(page, `e2e-page-${String(i).padStart(2, '0')}-${Date.now()}`);
      createdIds.push(signal.id);
    }

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await authenticate(page);

    for (const id of createdIds) {
      await apiDelete(page, `/api/signals?id=${id}`);
    }

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('"load more" button appears and loads additional signals', async ({ page }) => {
    await page.goto('/');

    const loadMoreBtn = page.getByRole('button', { name: /load more/i });
    await expect(loadMoreBtn).toBeVisible();

    // Count visible signal links before clicking
    const signalLinks = page.locator('a[href^="/signal/"]');
    const initialCount = await signalLinks.count();
    expect(initialCount).toBeGreaterThanOrEqual(20);

    await loadMoreBtn.click();

    // After clicking, more signals should appear in the UI
    await expect(signalLinks).not.toHaveCount(initialCount, { timeout: 5000 });
    const newCount = await signalLinks.count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});
