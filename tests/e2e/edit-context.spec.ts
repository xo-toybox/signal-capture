import { test, expect } from '@playwright/test';
import { authenticate, createSignal, apiDelete } from './helpers';

test.describe('Editable capture context', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('click to edit — clicking context text opens textarea', async ({ page }) => {
    const ts = Date.now();
    const context = `Initial context ${ts}`;
    const signal = await createSignal(page, `e2e-edit-ctx-${ts}`);

    // Set capture_context via PATCH
    await page.evaluate(
      async ({ id, ctx }) => {
        await fetch(`/api/signals?id=${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capture_context: ctx }),
        });
      },
      { id: signal.id, ctx: context },
    );

    await page.goto(`/signal/${signal.id}`);
    await expect(page.getByText(context)).toBeVisible();

    // Click the context text to enter edit mode
    await page.getByText(context).click();

    // Textarea should appear with the existing context value
    const textarea = page.getByRole('textbox');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(context);

    // Save and cancel buttons should be visible
    await expect(page.getByRole('button', { name: 'save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'cancel' })).toBeVisible();

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('save edit — updates text via save button', async ({ page }) => {
    const ts = Date.now();
    const original = `Original context ${ts}`;
    const updated = `Updated context ${ts}`;

    // Create signal with capture_context
    const { data } = await page.evaluate(
      async ({ raw, ctx }) => {
        const res = await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_input: raw, input_method: 'text', capture_context: ctx }),
        });
        return { ok: res.ok, status: res.status, data: await res.json() };
      },
      { raw: `e2e-save-ctx-${ts}`, ctx: original },
    );
    const signal = data.signal;

    await page.goto(`/signal/${signal.id}`);
    await expect(page.getByText(original)).toBeVisible();

    // Enter edit mode
    await page.getByText(original).click();
    const textarea = page.getByRole('textbox');
    await expect(textarea).toBeVisible();

    // Clear and type new value
    await textarea.fill(updated);

    // Click save
    await page.getByRole('button', { name: 'save' }).click();

    // Should exit edit mode and show the updated text
    await expect(page.getByRole('textbox')).not.toBeVisible();
    await expect(page.getByText(updated)).toBeVisible();

    // Reload to verify persistence
    await page.reload();
    await expect(page.getByText(updated)).toBeVisible();

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('save edit via Cmd+Enter', async ({ page }) => {
    const ts = Date.now();
    const original = `Cmd save ctx ${ts}`;
    const updated = `Cmd saved ctx ${ts}`;

    const { data } = await page.evaluate(
      async ({ raw, ctx }) => {
        const res = await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_input: raw, input_method: 'text', capture_context: ctx }),
        });
        return { ok: res.ok, status: res.status, data: await res.json() };
      },
      { raw: `e2e-cmdsave-ctx-${ts}`, ctx: original },
    );
    const signal = data.signal;

    await page.goto(`/signal/${signal.id}`);
    await page.getByText(original).click();

    const textarea = page.getByRole('textbox');
    await textarea.fill(updated);

    // Save with Cmd+Enter (Meta+Enter)
    await textarea.press('Meta+Enter');

    // Should exit edit mode and show updated text
    await expect(page.getByRole('textbox')).not.toBeVisible();
    await expect(page.getByText(updated)).toBeVisible();

    // Reload to verify persistence
    await page.reload();
    await expect(page.getByText(updated)).toBeVisible();

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('cancel edit — Escape restores original text', async ({ page }) => {
    const ts = Date.now();
    const original = `Cancel test ctx ${ts}`;

    const { data } = await page.evaluate(
      async ({ raw, ctx }) => {
        const res = await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_input: raw, input_method: 'text', capture_context: ctx }),
        });
        return { ok: res.ok, status: res.status, data: await res.json() };
      },
      { raw: `e2e-cancel-ctx-${ts}`, ctx: original },
    );
    const signal = data.signal;

    await page.goto(`/signal/${signal.id}`);
    await page.getByText(original).click();

    const textarea = page.getByRole('textbox');
    await textarea.fill('This should be discarded');

    // Press Escape to cancel
    await textarea.press('Escape');

    // Should exit edit mode and still show the original text
    await expect(page.getByRole('textbox')).not.toBeVisible();
    await expect(page.getByText(original)).toBeVisible();
    await expect(page.getByText('This should be discarded')).not.toBeVisible();

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('cancel edit via cancel button', async ({ page }) => {
    const ts = Date.now();
    const original = `Cancel btn ctx ${ts}`;

    const { data } = await page.evaluate(
      async ({ raw, ctx }) => {
        const res = await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_input: raw, input_method: 'text', capture_context: ctx }),
        });
        return { ok: res.ok, status: res.status, data: await res.json() };
      },
      { raw: `e2e-cancelbtn-ctx-${ts}`, ctx: original },
    );
    const signal = data.signal;

    await page.goto(`/signal/${signal.id}`);
    await page.getByText(original).click();

    const textarea = page.getByRole('textbox');
    await textarea.fill('Also discarded');

    // Click cancel button
    await page.getByRole('button', { name: 'cancel' }).click();

    // Should revert to original
    await expect(page.getByRole('textbox')).not.toBeVisible();
    await expect(page.getByText(original)).toBeVisible();

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });

  test('empty context shows "+ add note" on hover and is clickable', async ({ page }) => {
    const ts = Date.now();
    const signal = await createSignal(page, `e2e-empty-ctx-${ts}`);

    await page.goto(`/signal/${signal.id}`);

    // The "+ add note" text is hidden by default (opacity-0) but present in DOM.
    // Hover over the editable area to reveal it, then click.
    const addNote = page.getByText('+ add note');
    // Force-click works even if opacity is 0 since the parent div is clickable
    await addNote.click({ force: true });

    // Should enter edit mode with empty textarea
    const textarea = page.getByRole('textbox');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue('');

    // Type a note and save
    const note = `New note ${ts}`;
    await textarea.fill(note);
    await page.getByRole('button', { name: 'save' }).click();

    // Should show the new note
    await expect(page.getByRole('textbox')).not.toBeVisible();
    await expect(page.getByText(note)).toBeVisible();

    // Reload to verify persistence
    await page.reload();
    await expect(page.getByText(note)).toBeVisible();

    await apiDelete(page, `/api/signals?id=${signal.id}`);
  });
});
