import { test, expect } from '@playwright/test';

test('Wizard flow: Step 1 (Loc) -> Step 2 (Act) -> Step 3 (Pref) -> Results', async ({ page }) => {

    // Mock Photon API
    await page.route(/photon\.komoot\.io\/api/, async route => {
        await route.fulfill({
            json: {
                features: [{
                    properties: { name: 'München', city: 'München' },
                    geometry: { coordinates: [11.5820, 48.1351] }
                }]
            }
        });
    });

    // Mock Backend APIs to ensure speed and reliability
    await page.route('**/api/resorts', async route => {
        await route.fulfill({
            json: [{
                id: '1', name: 'Resort A', latitude: 47, longitude: 11,
                liftsOpen: 5, liftsTotal: 10, snow: { mountain: 100 }, distance: 60
            }]
        });
    });

    await page.route('**/api/traffic-all*', async route => {
        await route.fulfill({ json: { '1': { duration: 3600, delay: 0 } } });
    });

    await page.goto('/');

    // Step 1: Location
    await expect(page.locator('#step-location')).toBeVisible();
    await page.fill('#addressInput', 'München');

    // Wait for input change event to propagate
    await page.waitForTimeout(100);

    await page.click('#submitLocationBtn');

    // Step 2: Activity Selection
    await expect(page.locator('#step-activity')).toBeVisible();
    await page.click('.pref-btn[data-domain="ski"]');

    // Step 3: Preferences
    await expect(page.locator('#step-prefs')).toBeVisible();
    // Wait for dynamic buttons to render
    await expect(page.locator('.pref-btn[data-pref="snow"]')).toBeVisible();
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
