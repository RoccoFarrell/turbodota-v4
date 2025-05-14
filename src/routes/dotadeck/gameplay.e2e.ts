import { test, expect } from '@playwright/test';

test.describe('DotaDeck Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the active season page and ensure we're logged in
    await page.goto('/dotadeck/seasons/active');
    await expect(page.getByTestId('deck-view')).toBeVisible();
  });

  test('should complete a full gameplay loop', async ({ page }) => {
    // Initial state checks
    await expect(page.getByTestId('gold-counter')).toBeVisible();
    await expect(page.getByTestId('hand-size')).toContainText('0');
    await expect(page.getByTestId('discard-tokens')).toContainText('5');

    // Draw a card
    await page.getByRole('button', { name: 'Draw Card' }).click();
    await expect(page.getByTestId('hand-size')).toContainText('1');
    
    // Verify card details are displayed
    const drawnCard = page.getByTestId('card-0');
    await expect(drawnCard).toBeVisible();
    await expect(drawnCard.getByTestId('hero-name')).toBeVisible();
    await expect(drawnCard.getByTestId('base-gold')).toBeVisible();
    await expect(drawnCard.getByTestId('base-xp')).toBeVisible();

    // Open card details
    await drawnCard.click();
    await expect(page.getByTestId('card-details-modal')).toBeVisible();
    await expect(page.getByTestId('card-history')).toBeVisible();

    // Close card details
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('card-details-modal')).not.toBeVisible();

    // Verify shop functionality
    await page.getByRole('link', { name: 'Shop' }).click();
    await expect(page.getByTestId('shop-view')).toBeVisible();

    // Purchase a charm
    const goldMultiplier = page.getByText('Gold Multiplier').first();
    await goldMultiplier.click();
    await page.getByRole('button', { name: 'Purchase' }).click();
    await expect(page.getByText('Item purchased successfully')).toBeVisible();

    // Return to deck view
    await page.getByRole('link', { name: 'Deck' }).click();
    await expect(page.getByTestId('deck-view')).toBeVisible();

    // Verify active charms
    await page.getByTestId('active-charms').click();
    await expect(page.getByText('Gold Multiplier')).toBeVisible();
    await expect(page.getByText('2x')).toBeVisible();

    // Check match results
    await page.getByRole('button', { name: 'Check Results' }).click();
    
    // Wait for potential match results
    try {
      // If a match is found
      await expect(page.getByText('Match found!')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('match-result')).toBeVisible();
      
      // Verify rewards calculation with charm
      const goldCounter = page.getByTestId('gold-counter');
      const currentGold = await goldCounter.textContent();
      expect(parseInt(currentGold || '0')).toBeGreaterThan(0);
      
    } catch {
      // If no match is found
      await expect(page.getByText('No matching games found')).toBeVisible();
    }

    // Test discard functionality
    await page.getByRole('button', { name: 'Discard' }).first().click();
    await expect(page.getByTestId('confirm-discard-modal')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByTestId('hand-size')).toContainText('0');
    await expect(page.getByTestId('discard-tokens')).toContainText('4');
  });

  test('should handle multiple cards and charms', async ({ page }) => {
    // Draw multiple cards
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Draw Card' }).click();
      await expect(page.getByTestId('hand-size')).toContainText(String(i + 1));
    }

    // Verify hand limit
    await page.getByRole('button', { name: 'Draw Card' }).click();
    await expect(page.getByText('Hand is full')).toBeVisible();

    // Purchase multiple charms
    await page.getByRole('link', { name: 'Shop' }).click();
    
    // Buy Gold Multiplier
    const goldMultiplier = page.getByText('Gold Multiplier').first();
    await goldMultiplier.click();
    await page.getByRole('button', { name: 'Purchase' }).click();
    await expect(page.getByText('Item purchased successfully')).toBeVisible();

    // Buy XP Multiplier
    const xpMultiplier = page.getByText('XP Multiplier').first();
    await xpMultiplier.click();
    await page.getByRole('button', { name: 'Purchase' }).click();
    await expect(page.getByText('Item purchased successfully')).toBeVisible();

    // Return to deck and verify active charms
    await page.getByRole('link', { name: 'Deck' }).click();
    await page.getByTestId('active-charms').click();
    await expect(page.getByText('Gold Multiplier')).toBeVisible();
    await expect(page.getByText('XP Multiplier')).toBeVisible();

    // Check match results with multiple charms
    await page.getByRole('button', { name: 'Check Results' }).click();
    
    try {
      await expect(page.getByText('Match found!')).toBeVisible({ timeout: 5000 });
      // Verify combined charm effects
      const goldCounter = page.getByTestId('gold-counter');
      const xpCounter = page.getByTestId('xp-counter');
      
      const currentGold = await goldCounter.textContent();
      const currentXP = await xpCounter.textContent();
      
      expect(parseInt(currentGold || '0')).toBeGreaterThan(0);
      expect(parseInt(currentXP || '0')).toBeGreaterThan(0);
    } catch {
      await expect(page.getByText('No matching games found')).toBeVisible();
    }
  });

  test('should handle real-time updates', async ({ page }) => {
    // Draw a card
    await page.getByRole('button', { name: 'Draw Card' }).click();
    await expect(page.getByTestId('hand-size')).toContainText('1');

    // Open a second browser tab to simulate real-time updates
    const newPage = await page.context().newPage();
    await newPage.goto('/dotadeck/seasons/active');

    // Check match results in the second tab
    await newPage.getByRole('button', { name: 'Check Results' }).click();
    
    try {
      await expect(newPage.getByText('Match found!')).toBeVisible({ timeout: 5000 });
      
      // Verify the original tab updates automatically
      await expect(page.getByTestId('match-result')).toBeVisible();
      await expect(page.getByTestId('gold-counter')).not.toHaveText('0');
    } catch {
      await expect(newPage.getByText('No matching games found')).toBeVisible();
    }

    // Close the second tab
    await newPage.close();
  });
}); 