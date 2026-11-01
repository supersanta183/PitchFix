import { expect, Page, test } from '@playwright/test';

/** The fake microphone sings A3. With a D3–D4 range, 0.56 makes the first target A3. */
const FIRST_TARGET_A3 = 0.56;

async function open(page: Page): Promise<void> {
  await page.addInitScript((value) => {
    Math.random = () => value;
    localStorage.setItem(
      'pitchfix.vocal-range',
      JSON.stringify({ version: 1, lowestMidi: 50, highestMidi: 62 }),
    );
    localStorage.setItem('pitchfix.tips.headphones.dismissed', 'true');
  }, FIRST_TARGET_A3);
  await page.goto('/');
}

test.describe('Choosing an exercise', () => {
  test('offers four exercises and remembers the last choice', async ({ page }) => {
    await open(page);
    await expect(page.getByRole('radio', { name: /Single notes/ })).toBeChecked();
    await expect(page.getByRole('radio')).toHaveCount(4);

    await page.getByText('Patterns').click();
    await page.reload();

    await expect(page.getByRole('radio', { name: /Patterns/ })).toBeChecked();
    await expect(page.getByText('Tap Start for patterns')).toBeVisible();
  });
});

test.describe('Patterns', () => {
  test('plays the tune, then asks for it one note at a time', async ({ page }) => {
    await open(page);
    await page.getByText('Patterns').click();
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByTestId('progress')).toContainText(/Pattern 1 of 5 · note 1 of \d/);
    await expect(page.getByText('Listen to the tune…')).toBeVisible();

    await page.getByRole('button', { name: 'Skip' }).click();

    await expect(page.getByTestId('progress')).toContainText(/Pattern 1 of 5 · note 2 of \d/);
  });
});

test.describe('Slides', () => {
  test('asks the singer to find the start note before sliding', async ({ page }) => {
    await open(page);
    await page.getByText('Slides').click();
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByTestId('progress')).toHaveText('Slide 1 of 8');
    await expect(page.getByTestId('target-hint')).toHaveText('Start on E3');
    await expect(page.getByText('Too high – go down')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Matched!')).toBeHidden();
  });
});

test.describe('From memory', () => {
  test('keeps the note secret, pauses, then reveals it once matched', async ({ page }) => {
    await open(page);
    await page.getByText('From memory').click();
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByTestId('target-note')).toHaveText('?');
    await expect(page.getByRole('button', { name: 'Play again' })).toBeDisabled();
    await expect(page.getByText('Keep it in your head…')).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Matched!')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('target-note')).toHaveText('A3');
  });
});
