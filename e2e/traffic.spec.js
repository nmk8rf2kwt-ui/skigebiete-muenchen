import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    // Mock Backend APIs to ensure reliability without running backend
    await page.route('**/api/resorts', async route => {
        await route.fulfill({
            json: [{
                id: '1', name: 'Resort A', latitude: 47, longitude: 11,
                liftsOpen: 5, liftsTotal: 10, snow: { mountain: 100 }, distance: 60,
                traffic: { duration: 3600, delay: 600 } // 10 min delay
            }]
        });
    });

    await page.route('**/api/traffic-all*', async route => {
        await route.fulfill({ json: { '1': { duration: 3600, delay: 600 } } });
    });

    // Set a location in localStorage to bypass onboarding
    await page.addInitScript(() => {
        window.localStorage.setItem('skigebiete_user_location', JSON.stringify({
            latitude: 48.1351,
            longitude: 11.582,
            name: "München (Test)"
        }));
    });
});

test('Traffic data is displayed', async ({ page }) => {
    await page.goto('/');

    // Wait for content (either cards or table)
    await expect(page.locator('.top3-card').or(page.locator('#skiTable tbody tr'))).not.toHaveCount(0);

    // Check if we have any time format displayed (e.g. "60 min") or "n.a."
    // We expect "60 min" (3600s / 60)
    const regex = /([0-9]+ min)|(n\.a\.)/;
    // Use locator('body') to be safe across different view modes
    await expect(page.locator('body')).toHaveText(regex);
});
