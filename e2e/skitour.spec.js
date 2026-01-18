const { test, expect } = require('@playwright/test');

test.describe('Skitour Domain', () => {

    test.beforeEach(async ({ page }) => {
        // Mock the Skitour API
        await page.route('**/api/skitours', async route => {
            const json = [
                {
                    id: "rotwand",
                    name: "Rotwand Reibe",
                    address: "Spitzingsee, 83727 Schliersee",
                    latitude: 47.6500,
                    longitude: 11.9333,
                    elevation_gain: 850,
                    distance: 12,
                    level: "hard",
                    avalancheLevel: 2,
                    newSnow: 20,
                    status: "open",
                    description: "Lange, landschaftlich schöne Runde."
                },
                {
                    id: "kolbensattel",
                    name: "Kolbensattel",
                    avalancheLevel: 1,
                    newSnow: 5,
                    elevation_gain: 400
                }
            ];
            await route.fulfill({ json });
        });

        // Mock Location
        await page.context().grantPermissions(['geolocation']);
        await page.context().setGeolocation({ latitude: 48.1351, longitude: 11.5820 });

        // Bypass Step 1
        await page.addInitScript(() => {
            sessionStorage.setItem('skigebiete_user_location', JSON.stringify({
                latitude: 48.1351,
                longitude: 11.5820,
                name: "München (Test)"
            }));
        });

        await page.goto('/');
    });

    test('should allow selecting Skitour and show results', async ({ page }) => {
        // 1. Verify we are on Step 2 (Activity)
        await expect(page.locator('#step-activity')).toBeVisible();

        // 2. Click "Skitour" button
        const tourBtn = page.locator('button[data-domain="skitour"]');
        await expect(tourBtn).toBeEnabled();
        await tourBtn.click();

        // 3. Verify we are on Step 3 (Preferences)
        await expect(page.locator('#step-prefs')).toBeVisible();
        await expect(page.locator('h2').filter({ hasText: 'Was ist dir heute wichtig?' })).toBeVisible();

        // Verify Skitour preferences
        const safePref = page.locator('button[data-pref="safe"]');
        await expect(safePref).toBeVisible();
        await expect(safePref.locator('.pref-label')).toHaveText('Sicher');

        // 4. Select "Sicher" (Auto-submits)
        await safePref.click();

        // 5. Verify Results
        await expect(page.locator('#resultsView')).toBeVisible();
        await expect(page.locator('#resultsHeading')).toContainText('Beste Wahl heute');

        // Check for Rotwand card
        const rotwandCard = page.locator('.top3-card').filter({ hasText: 'Rotwand' });
        await expect(rotwandCard).toBeVisible();

        // Check for Skitour-specific logic
        await expect(rotwandCard).toContainText('Lawinenstufe 2 (Sicher)');
        await expect(rotwandCard).toContainText('20 cm Neuschnee');
    });

});
