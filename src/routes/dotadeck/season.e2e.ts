import { test, expect } from '@playwright/test';

test.describe('DotaDeck Season Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the season creation page
    await page.goto('/dotadeck/seasons/new');
  });

  test('should display season creation form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create New Season' })).toBeVisible();
    await expect(page.getByLabel('Season Name')).toBeVisible();
    await expect(page.getByLabel('Start Date')).toBeVisible();
    await expect(page.getByLabel('End Date')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Season' })).toBeVisible();
  });

  test('should create a new season successfully', async ({ page }) => {
    // Fill out the form
    await page.getByLabel('Season Name').fill('Test Season');
    await page.getByLabel('Start Date').fill(new Date().toISOString().split('T')[0]);
    await page.getByLabel('End Date').fill(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );

    // Submit the form
    await page.getByRole('button', { name: 'Create Season' }).click();

    // Verify success message
    await expect(page.getByText('Season created successfully')).toBeVisible();

    // Verify redirect to season details
    await expect(page).toHaveURL(/\/dotadeck\/seasons\/\d+/);
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Create Season' }).click();

    // Verify error messages
    await expect(page.getByText('Season name is required')).toBeVisible();
    await expect(page.getByText('Start date is required')).toBeVisible();
    await expect(page.getByText('End date is required')).toBeVisible();
  });

  test('should validate date range', async ({ page }) => {
    // Fill out the form with invalid dates
    await page.getByLabel('Season Name').fill('Test Season');
    await page.getByLabel('Start Date').fill('2024-01-01');
    await page.getByLabel('End Date').fill('2023-12-31');

    // Submit the form
    await page.getByRole('button', { name: 'Create Season' }).click();

    // Verify error message
    await expect(page.getByText('End date must be after start date')).toBeVisible();
  });
});

test.describe('Season User Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the active season page
    await page.goto('/dotadeck/seasons/active');
  });

  test('should display onboarding flow for new users', async ({ page }) => {
    // Verify welcome message
    await expect(page.getByRole('heading', { name: 'Welcome to DotaDeck' })).toBeVisible();

    // Verify tutorial elements
    await expect(page.getByTestId('tutorial-step-1')).toBeVisible();
    await expect(page.getByText('Learn how to play')).toBeVisible();

    // Complete tutorial
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('tutorial-step-2')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('tutorial-step-3')).toBeVisible();
    await page.getByRole('button', { name: 'Complete Tutorial' }).click();

    // Verify tutorial completion
    await expect(page.getByText('Tutorial completed!')).toBeVisible();
    await expect(page.getByTestId('deck-view')).toBeVisible();
  });

  test('should set up initial deck', async ({ page }) => {
    // Skip tutorial if shown
    try {
      await page.getByRole('button', { name: 'Skip Tutorial' }).click();
    } catch {
      // Tutorial not shown, continue
    }

    // Verify initial deck setup
    await expect(page.getByTestId('deck-view')).toBeVisible();
    await expect(page.getByText('Your First Deck')).toBeVisible();
    await expect(page.getByTestId('card-slot')).toHaveCount(3);
  });
});

test.describe('Season Gameplay Setup', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the active season page
    await page.goto('/dotadeck/seasons/active');
  });

  test('should initialize default items', async ({ page }) => {
    // Verify shop is accessible
    await page.getByRole('link', { name: 'Shop' }).click();
    await expect(page.getByTestId('shop-view')).toBeVisible();

    // Verify default items are available
    const shopItems = await page.getByTestId('shop-item').all();
    expect(shopItems.length).toBeGreaterThan(0);
    await expect(page.getByText('Discard Token')).toBeVisible();
    await expect(page.getByText('Gold Multiplier')).toBeVisible();
  });

  test('should show real-time updates', async ({ page }) => {
    // Verify UI elements update in real-time
    await expect(page.getByTestId('gold-counter')).toBeVisible();
    await expect(page.getByTestId('hand-size')).toBeVisible();
    await expect(page.getByTestId('discard-tokens')).toBeVisible();

    // Simulate drawing a card
    await page.getByRole('button', { name: 'Draw Card' }).click();
    await expect(page.getByTestId('hand-size')).toContainText('1');
  });
}); 