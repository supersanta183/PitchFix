import { expect, test } from '@playwright/test';

test.describe('Live pitch', () => {
  test('shows the note being sung after the singer taps Start', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Tap Start, then sing any note.')).toBeVisible();

    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.locator('.readout .note')).toHaveText('A3', { timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  });

  test('stops listening when the singer taps Stop', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('.readout .note')).toHaveText('A3', { timeout: 10_000 });

    await page.getByRole('button', { name: 'Stop' }).click();

    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    await expect(page.getByText('Tap Start, then sing any note.')).toBeVisible();
  });
});

test.describe('Blocked microphone', () => {
  test('explains how to allow the microphone and offers to try again', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
    });
    await page.goto('/');

    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByRole('alert')).toContainText("PitchFix can't hear you yet");
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
