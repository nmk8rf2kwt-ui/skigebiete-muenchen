import { test, expect } from '@playwright/test';

test('Wizard flow: Step 1 -> Step 2 -> Results', async ({ page }) => {
    await page.goto('/');

    // Step 1: Location
    await expect(page.locator('#step-location')).toBeVisible();
    await page.fill('#addressInput', 'München');
    await page.click('#submitLocationBtn');

    // Step 2: Preferences
    await expect(page.locator('#step-prefs')).toBeVisible();
    await page.click('.pref-btn[data-pref="snow"]');
    await page.click('#showResultsBtn');

    // Results View
    await expect(page.locator('#resultsView')).toBeVisible();
    await expect(page.locator('#top3Cards .top3-card')).not.toHaveCount(0);

    // Check if reasoning works
    const firstCardReasoning = page.locator('#top3Cards .top3-card').first().locator('.reasoning-summary');
    await firstCardReasoning.click();
    await expect(page.locator('#top3Cards .top3-card').first().locator('.reasoning-list')).toBeVisible();
});
