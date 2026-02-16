import { test, expect } from '@playwright/test';
import { authenticate } from './helpers';

test.describe('Bug reporter', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto('/');
    // Wait for hydration — capture form is interactive
    await expect(page.getByPlaceholder(/url or thought/i)).toBeVisible();
  });

  test('Cmd+Shift+B opens the modal', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('BUG REPORT', { exact: false })).toBeVisible();
  });

  test('title input is auto-focused on open', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();
    const titleInput = page.getByPlaceholder(/brief description of the issue/i);
    await expect(titleInput).toBeFocused();
  });

  test('Escape closes the modal', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('backdrop click closes the modal', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Click the backdrop (top-left corner of the dialog overlay, outside the panel)
    await dialog.click({ position: { x: 5, y: 5 } });
    await expect(dialog).not.toBeVisible();
  });

  test('Cancel button closes the modal', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Submit button disabled when title is empty', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('Submit button enabled after typing title', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByPlaceholder(/brief description of the issue/i).fill('Test bug');
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await expect(submitBtn).toBeEnabled();
  });

  test('severity selector changes selection', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Default should be medium (yellow)
    const mediumBtn = page.getByRole('button', { name: /medium/i });
    await expect(mediumBtn).toHaveCSS('color', 'rgb(234, 179, 8)');

    // Click high — should become orange, medium should become gray
    const highBtn = page.getByRole('button', { name: /high/i });
    await highBtn.click();
    await expect(highBtn).toHaveCSS('color', 'rgb(249, 115, 22)');
    await expect(mediumBtn).toHaveCSS('color', 'rgb(82, 82, 82)');

    // Click critical — should become red
    const criticalBtn = page.getByRole('button', { name: /critical/i });
    await criticalBtn.click();
    await expect(criticalBtn).toHaveCSS('color', 'rgb(239, 68, 68)');
    await expect(highBtn).toHaveCSS('color', 'rgb(82, 82, 82)');
  });

  test('form resets on reopen', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();

    const titleInput = page.getByPlaceholder(/brief description of the issue/i);
    await titleInput.fill('Temp bug title');
    await page.getByRole('button', { name: /high/i }).click();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Reopen
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(titleInput).toHaveValue('');
    // Severity should be back to medium (yellow)
    await expect(page.getByRole('button', { name: /medium/i })).toHaveCSS('color', 'rgb(234, 179, 8)');
  });

  test('submit shows error when GitHub is not configured', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+b');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByPlaceholder(/brief description of the issue/i).fill('Test bug report');
    await page.getByRole('button', { name: /submit/i }).click();

    // API returns 502 "Bug reporting is not configured"
    await expect(page.getByText(/not configured/i)).toBeVisible({ timeout: 10000 });
  });
});
