import { test, expect } from '@playwright/test';
import { authenticate, apiGet, apiDelete } from './helpers';

test.describe('Share target', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('shared_url pre-fills capture form with title', async ({ page }) => {
    await page.goto('/?shared_url=https://example.com&shared_title=Example%20Page');

    const input = page.getByPlaceholder(/url or thought/i);
    await expect(input).toHaveValue('Example Page');
  });

  test('shared_url without title uses URL as input', async ({ page }) => {
    await page.goto('/?shared_url=https://example.com/article');

    const input = page.getByPlaceholder(/url or thought/i);
    await expect(input).toHaveValue('https://example.com/article');
  });

  test('shared_text pre-fills capture form', async ({ page }) => {
    await page.goto('/?shared_text=An%20interesting%20thought');

    const input = page.getByPlaceholder(/url or thought/i);
    await expect(input).toHaveValue('An interesting thought');
  });

  test('shared signal submits with share input method and clears', async ({ page }) => {
    const sharedUrl = `https://example.com/e2e-share-${Date.now()}`;
    await page.goto(`/?shared_url=${encodeURIComponent(sharedUrl)}`);

    const input = page.getByPlaceholder(/url or thought/i);
    await expect(input).toHaveValue(sharedUrl);

    await page.getByRole('button', { name: /capture/i }).click();
    await expect(page.getByText(/captured/i)).toBeVisible();
    await expect(input).toHaveValue('');

    // Verify signal was created with share method
    const { data } = await apiGet(page, '/api/signals');
    const signal = data.signals.find((s: { raw_input: string }) => s.raw_input === sharedUrl);
    expect(signal).toBeDefined();
    expect(signal.input_method).toBe('share');

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });
});
