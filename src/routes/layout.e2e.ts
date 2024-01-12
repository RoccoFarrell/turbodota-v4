import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Turbodota/);
});

test('random page', async ({ page }) => {
  await page.goto('/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Random Tracker' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByText(/The Walker Random/)).toBeVisible();
});
