import { expect, test } from '@playwright/test';

test.describe('Vocal range', () => {
  test('a new singer is asked to find their range first', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/range\/test$/);
    await expect(
      page.getByRole('heading', { name: "Let's find your singing range" }),
    ).toBeVisible();
  });

  test('captures a held note as the lowest, then asks for the highest', async ({ page }) => {
    await page.goto('/range/test');
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByTestId('heard-note')).toHaveText('A3', { timeout: 10_000 });
    await page.getByRole('button', { name: 'Use A3' }).click();

    await expect(
      page.getByRole('heading', { name: 'Now sing your highest comfortable note' }),
    ).toBeVisible();
  });

  test('asks for a higher note when the highest is too close to the lowest', async ({ page }) => {
    await page.goto('/range/test');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Use A3' }).click({ timeout: 10_000 });

    await expect(page.getByRole('alert')).toContainText('A3 is too close to your lowest note', {
      timeout: 10_000,
    });
  });

  test('can be set by hand and is remembered', async ({ page }) => {
    await page.goto('/range/test');
    await page.getByRole('link', { name: 'Set my range by hand' }).click();
    await expect(page.getByTestId('highest').getByTestId('stepper-note')).toHaveText('D4');

    await page.getByRole('button', { name: 'Raise highest note' }).click();
    await page.getByRole('button', { name: 'Raise highest note' }).click();
    await page.getByRole('button', { name: 'Lower lowest note' }).click();
    await page.getByRole('button', { name: 'Save range' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Range C#3–E4' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: 'Range C#3–E4' })).toBeVisible();
  });

  test('never lets the range get narrower than a fifth', async ({ page }) => {
    await page.goto('/range');
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Lower highest note' }).click();
    }
    await expect(page.getByTestId('highest').getByTestId('stepper-note')).toHaveText('A3');
    await expect(page.getByRole('button', { name: 'Lower highest note' })).toBeDisabled();
  });
});
