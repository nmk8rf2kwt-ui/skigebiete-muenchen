import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
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
    const regex = /([0-9]+ min)|(n\.a\.)/;
    // Use locator('body') to be safe across different view modes
    await expect(page.locator('body')).toHaveText(regex);
});
