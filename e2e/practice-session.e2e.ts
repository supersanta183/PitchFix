import { expect, Page, test } from '@playwright/test';

/**
 * The fake microphone sings A3. With a D3–D4 range, these fix which target the
 * app picks: 0.56 alternates A3 and A#3, 0 starts on D3.
 */
const TARGET_A3 = 0.56;
const TARGET_D3 = 0;

async function open(page: Page, random: number, settings?: object): Promise<void> {
  await page.addInitScript(
    ([value, storedSettings]) => {
      Math.random = () => value as number;
      localStorage.setItem(
        'pitchfix.vocal-range',
        JSON.stringify({ version: 1, lowestMidi: 50, highestMidi: 62 }),
      );
      if (storedSettings) {
        localStorage.setItem('pitchfix.practice-settings', JSON.stringify(storedSettings));
      }
    },
    [random, settings ?? null] as const,
  );
  await page.goto('/');
}

test.describe('Single notes session', () => {
  test('plays the target, then counts it once held in tune', async ({ page }) => {
    await open(page, TARGET_A3);
    await expect(page.getByText('Tap Start for single notes')).toBeVisible();

    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByTestId('target-note')).toHaveText('A3');
    await expect(page.getByText('Listen…')).toBeVisible();
    await expect(page.getByTestId('sung-note')).toHaveText('A3', { timeout: 10_000 });
    await expect(page.getByText('Matched!')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Note 2 of 10')).toBeVisible({ timeout: 5_000 });
  });

  test('tells the singer which way to move when off target', async ({ page }) => {
    await open(page, TARGET_D3);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByTestId('target-note')).toHaveText('D3');

    await expect(page.getByText('Too low – go up')).toBeVisible({ timeout: 10_000 });
  });

  test('moves on when the singer skips a note', async ({ page }) => {
    await open(page, TARGET_D3);
    await page.getByRole('button', { name: 'Start' }).click();

    await page.getByRole('button', { name: 'Skip' }).click();

    await expect(page.getByText('Note 2 of 10')).toBeVisible();
  });

  test('summarises the session after the last note', async ({ page }) => {
    test.setTimeout(90_000);
    await open(page, TARGET_A3, { version: 1, toleranceCents: 50, holdSeconds: 0.5 });
    await page.getByRole('button', { name: 'Start' }).click();

    for (let note = 1; note <= 10; note++) {
      await expect(page.getByText(`Note ${note} of 10`)).toBeVisible({ timeout: 10_000 });
      if ((await page.getByTestId('target-note').textContent())?.trim() === 'A3') {
        await expect(page.getByText('Matched!')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Matched!')).toBeHidden({ timeout: 5_000 });
      } else {
        await page.getByRole('button', { name: 'Skip' }).click();
      }
    }

    await expect(page.getByTestId('summary-score')).toHaveText('You matched 5 of 10 notes');
    await expect(page.getByRole('button', { name: 'Practise again' })).toBeVisible();
  });

  test('stops listening when the singer taps Stop', async ({ page }) => {
    await open(page, TARGET_D3);
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
    await open(page, TARGET_A3);

    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByRole('alert')).toContainText("PitchFix can't hear you yet");
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
