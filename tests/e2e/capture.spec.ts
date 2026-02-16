import { test, expect } from '@playwright/test';
import { authenticate } from './helpers';

test.describe('Signal capture form', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto('/');
  });

  test('capture button is disabled when input is empty', async ({ page }) => {
    const captureBtn = page.getByRole('button', { name: /capture/i });
    await expect(captureBtn).toBeDisabled();
  });

  test('submit a signal via the form and see it in the feed', async ({ page }) => {
    const rawInput = `e2e-capture-${Date.now()}`;

    const textInput = page.getByPlaceholder(/url or thought/i);
    await textInput.fill(rawInput);

    const captureBtn = page.getByRole('button', { name: /capture/i });
    await expect(captureBtn).toBeEnabled();
    await captureBtn.click();

    await expect(page.getByText(/captured/i)).toBeVisible();
    await expect(textInput).toHaveValue('');

    await page.reload();
    const signalLink = page.getByText(rawInput);
    await expect(signalLink).toBeVisible();

    await signalLink.click();
    await page.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm delete/i }).click();
    await page.waitForURL('/');
  });

  test('submit a signal with optional context', async ({ page }) => {
    const ts = Date.now();
    const rawInput = `e2e-context-${ts}`;
    const context = `Why interesting ${ts}`;

    await page.getByPlaceholder(/url or thought/i).fill(rawInput);
    await page.getByPlaceholder(/why interesting/i).fill(context);
    await page.getByRole('button', { name: /capture/i }).click();

    await expect(page.getByText(/captured/i)).toBeVisible();

    await page.reload();
    await page.getByText(rawInput).click();
    await page.waitForURL(/\/signal\//);
    await expect(page.getByText(context)).toBeVisible();

    await page.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm delete/i }).click();
    await page.waitForURL('/');
  });

  test('shows error toast when capture API fails', async ({ page }) => {
    // Intercept POST /api/signals and return a 500 error
    await page.route('**/api/signals', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to capture signal' }),
        });
      } else {
        await route.continue();
      }
    });

    const textInput = page.getByPlaceholder(/url or thought/i);
    await textInput.fill(`e2e-error-${Date.now()}`);
    await page.getByRole('button', { name: /capture/i }).click();

    // The CaptureForm shows "Failed to capture" toast on error
    await expect(page.getByText(/failed to capture/i)).toBeVisible();
  });
});
