import { test, expect } from '@playwright/test';

test.describe('Wizard Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Geocoding API (Backend)
        await page.route('**/api/locating/geocode*', async route => {
            await route.fulfill({
                json: {
                    name: 'München',
                    latitude: 48.1351,
                    longitude: 11.5820
                }
            });
        });

        // Mock Backend APIs
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
    });

    // Skipped due to CI/Env flakiness - verified manually
    test('Geolocation Button works', async ({ page, context }) => {
        // Grant Permission BEFORE navigation to ensure it applies
        await context.grantPermissions(['geolocation']);
        await context.setGeolocation({ latitude: 48.1351, longitude: 11.5820 });

        await page.goto('/');

        // Wait for modules to hydrate/listeners to attach
        await page.waitForTimeout(1000);

        // Click Locate
        await page.click('#locateBtn');

        // Should auto-advance to Step 2
        // Increased timeout slightly for the 800ms delay + animation
        await expect(page.locator('#step-activity')).toBeVisible({ timeout: 10000 });
    });

    // Skipped due to CI transition flakiness - verified manually
    test('Standard Wizard Flow', async ({ page }) => {
        await page.goto('/');

        // Wait for hydration
        await page.waitForTimeout(1000);

        // Step 1: Location
        await expect(page.locator('#step-location')).toBeVisible();
        await page.fill('#addressInput', 'München');

        // Wait for input change event to propagate
        await page.waitForTimeout(100);

        // Submit (Step 1 -> Step 2)
        // const searchPromise = page.waitForResponse(response => response.url().includes('photon.komoot.io'));
        await page.click('#submitLocationBtn');
        // await searchPromise;

        await expect(page.locator('#step-activity')).toBeVisible();

        // Step 2: Activity (Step 2 -> Step 3)
        await page.click('.pref-btn[data-domain="ski"]');

        // Step 3: Preferences (Step 3 -> Results)
        await expect(page.locator('#step-prefs')).toBeVisible();
        await page.click('.pref-btn[data-pref="conditions"]');

        // Results View (Auto-submitted)

        // Results View
        await expect(page.locator('#resultsView')).toBeVisible();
        await expect(page.locator('#top3Cards .top3-card')).not.toHaveCount(0);

        // Check Reasoning
        const firstCardReasoning = page.locator('#top3Cards .top3-card').first().locator('.reasoning-summary');
        await firstCardReasoning.click();
        await expect(page.locator('#top3Cards .top3-card').first().locator('.reasoning-list')).toBeVisible();
    });
});
