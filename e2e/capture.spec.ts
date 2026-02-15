import { test, expect } from '@playwright/test';
import { authenticate, apiDelete } from './helpers';

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

    // Should show success toast
    await expect(page.getByText(/captured/i)).toBeVisible();

    // Input should be cleared after submission
    await expect(textInput).toHaveValue('');

    // Reload to see the signal in the feed (realtime may have latency)
    await page.reload();
    const signalLink = page.getByText(rawInput);
    await expect(signalLink).toBeVisible();

    // Clean up — navigate to detail and delete
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

    // Reload, navigate to detail, verify context was saved
    await page.reload();
    await page.getByText(rawInput).click();
    await page.waitForURL(/\/signal\//);
    await expect(page.getByText(context)).toBeVisible();

    // Clean up
    await page.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm delete/i }).click();
    await page.waitForURL('/');
  });
});
