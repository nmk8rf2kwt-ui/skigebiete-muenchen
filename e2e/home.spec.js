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

test('Homepage loads and displays title', async ({ page }) => {
    await page.goto('/');
    // Use a regex that is flexible
    await expect(page).toHaveTitle(/Skigebiet/);
});

test('Resort data is populated', async ({ page }) => {
    await page.goto('/');

    // Check if either Top 3 cards or table rows are visible
    const top3Cards = page.locator('.top3-card');
    const tableRows = page.locator('#skiTable tbody tr');

    // Wait for at least one of them to appear (Top 3 is default now)
    await expect(async () => {
        const hasCards = await top3Cards.count() > 0;
        const hasRows = await tableRows.count() > 0;
        expect(hasCards || hasRows).toBeTruthy();
    }).toPass();
});

test('Content is visible on load', async ({ page }) => {
    await page.goto('/');

    // Verify that the main UI containers are present
    await expect(page.locator('#top3Cards')).toBeVisible();
});
