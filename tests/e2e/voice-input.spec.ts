import { test, expect } from '@playwright/test';
import { authenticate } from './helpers';

test.describe('Voice input visibility', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('voice input button is hidden when SpeechRecognition is removed', async ({ page }) => {
    // Remove SpeechRecognition to simulate an unsupported browser
    await page.addInitScript(() => {
      delete (window as unknown as Record<string, unknown>).SpeechRecognition;
      delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    });
    await page.goto('/');

    const voiceBtn = page.getByRole('button', { name: /voice input/i });
    await expect(voiceBtn).toHaveCount(0);
  });

  test('voice input button is visible when SpeechRecognition is available', async ({ page }) => {
    await page.goto('/');

    // Chromium supports SpeechRecognition natively
    const voiceBtn = page.getByRole('button', { name: /voice input/i }).first();
    await expect(voiceBtn).toBeVisible();
  });
});
