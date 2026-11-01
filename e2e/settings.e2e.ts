import { expect, test } from '@playwright/test';

test.describe('Practice settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'pitchfix.vocal-range',
        JSON.stringify({ version: 1, lowestMidi: 50, highestMidi: 62 }),
      ),
    );
  });

  test('start relaxed, with any octave counting', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('radio', { name: /Relaxed/ })).toBeChecked();
    await expect(page.getByRole('radio', { name: '1 s' })).toBeChecked();
    await expect(page.getByRole('switch', { name: /Any octave counts/ })).toBeChecked();
  });

  test('are remembered after changing them', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Settings' }).click();

    await page.getByText('Precise').click();
    await page.getByText('1.5 s').click();
    await page.getByRole('switch', { name: /Any octave counts/ }).click();
    await page.getByRole('link', { name: 'Done' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/settings');
    await expect(page.getByRole('radio', { name: /Precise/ })).toBeChecked();
    await expect(page.getByRole('radio', { name: '1.5 s' })).toBeChecked();
    await expect(page.getByRole('switch', { name: /Any octave counts/ })).not.toBeChecked();
  });
});
