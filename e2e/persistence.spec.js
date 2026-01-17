import { test, expect } from '@playwright/test';

test('Persistence CUJ: User location and preferences are saved', async ({ page }) => {

    // Mock APIs
    await page.route('**/api/locating/geocode*', async route => {
        await route.fulfill({
            json: { name: 'München', latitude: 48.13, longitude: 11.58 }
        });
    });
    // Mock Backend
    await page.route('**/api/resorts', async route => route.fulfill({ json: [] }));
    await page.route('**/api/traffic-all*', async route => route.fulfill({ json: {} }));

    // 1. First Visit
    await page.goto('/');

    // Wait for hydration
    await page.waitForTimeout(1000);

    // Complete Wizard Step 1
    await page.fill('#addressInput', 'München');
    await page.click('#submitLocationBtn');

    await expect(page.locator('#step-activity')).toBeVisible();

    // 2. Reload Page (Simulate Returning User)
    await page.reload();

    // Wait for hydration after reload
    await page.waitForTimeout(1000);

    // 3. Assertions
    // Should SKIP Step 1 (Location) and show Step 2 (Activity)
    await expect(page.locator('#step-location')).not.toBeVisible();
    await expect(page.locator('#step-activity')).toBeVisible();
});
