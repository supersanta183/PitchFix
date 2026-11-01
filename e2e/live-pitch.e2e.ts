import { expect, Page, test } from '@playwright/test';

/** The fake microphone sings A3. These fix which target note the app picks from a D3–D4 range. */
const TARGET_A3 = 0.56;
const TARGET_D3 = 0;

async function openWithTarget(page: Page, random: number): Promise<void> {
  await page.addInitScript((value) => (Math.random = () => value), random);
  await page.addInitScript(() =>
    localStorage.setItem(
      'pitchfix.vocal-range',
      JSON.stringify({ version: 1, lowestMidi: 50, highestMidi: 62 }),
    ),
  );
  await page.goto('/');
}

test.describe('Matching the target note', () => {
  test('shows the sung note and confirms it matches the target', async ({ page }) => {
    await openWithTarget(page, TARGET_A3);
    await expect(page.getByTestId('target-note')).toHaveText('A3');
    await expect(page.getByText('Play the note, then tap Start')).toBeVisible();

    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByTestId('sung-note')).toHaveText('A3', { timeout: 10_000 });
    await expect(page.getByText('Spot on!')).toBeVisible();
  });

  test('tells the singer which way to move when off target', async ({ page }) => {
    await openWithTarget(page, TARGET_D3);
    await expect(page.getByTestId('target-note')).toHaveText('D3');

    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByText('Too low – go up')).toBeVisible({ timeout: 10_000 });
  });

  test('stops listening while the reference note plays, then listens again', async ({ page }) => {
    await openWithTarget(page, TARGET_A3);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByTestId('sung-note')).toHaveText('A3', { timeout: 10_000 });

    await page.getByRole('button', { name: 'Play note' }).click();

    await expect(page.getByText('Listen…')).toBeVisible();
    await expect(page.getByTestId('sung-note')).toHaveText('–');
    await expect(page.getByTestId('sung-note')).toHaveText('A3', { timeout: 5_000 });
  });

  test('picks a different note on request', async ({ page }) => {
    await openWithTarget(page, TARGET_A3);
    await page.getByRole('button', { name: 'New note' }).click();
    await expect(page.getByTestId('target-note')).not.toHaveText('A3');
  });

  test('stops listening when the singer taps Stop', async ({ page }) => {
    await openWithTarget(page, TARGET_A3);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByTestId('sung-note')).toHaveText('A3', { timeout: 10_000 });

    await page.getByRole('button', { name: 'Stop' }).click();

    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    await expect(page.getByTestId('sung-note')).toHaveText('–');
  });
});

test.describe('Blocked microphone', () => {
  test('explains how to allow the microphone and offers to try again', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
    });
    await openWithTarget(page, TARGET_A3);

    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByRole('alert')).toContainText("PitchFix can't hear you yet");
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
