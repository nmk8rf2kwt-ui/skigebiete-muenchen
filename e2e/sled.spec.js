const { test, expect } = require('@playwright/test');

test.describe('Sledding Domain (Rodeln)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock the Sledding API
        await page.route('**/api/sledding', async route => {
            const json = [
                {
                    id: "wallberg",
                    name: "Wallberg Rodelbahn",
                    address: "Wallbergstraße 26, 83700 Rottach-Egern",
                    latitude: 47.6896,
                    longitude: 11.7766,
                    length: 6.5,
                    level: "hard",
                    walk_min: 0,
                    has_rental: true,
                    has_lift: true,
                    night_light: false,
                    price: 12.0,
                    snow: 50,
                    status: "open",
                    distance: 60
                },
                {
                    id: "obere-firstalm",
                    name: "Obere Firstalm",
                    length: 2.5,
                    has_lift: false,
                    night_light: true,
                    status: "open",
                    distance: 55,
                    walk_min: 45
                }
            ];
            await route.fulfill({ json });
        });

        // Mock Location to skip geolocation
        await page.context().grantPermissions(['geolocation']);
        await page.context().setGeolocation({ latitude: 48.1351, longitude: 11.5820 }); // Munich

        // Bypass Step 1 by setting storage
        await page.addInitScript(() => {
            localStorage.setItem('wizard_current_step', 'step-activity');
            localStorage.setItem('user_location', JSON.stringify({
                lat: 48.1351,
                lon: 11.582,
                address: "München (Test)"
            }));
        });

        await page.goto('/');
    });

    test('should allow selecting Rodeln and show results', async ({ page }) => {
        // 1. Verify we are on Step 2 (Activity)
        await expect(page.locator('#step-activity')).toBeVisible();

        // 2. Click "Rodeln" button
        const sledBtn = page.locator('button[data-domain="sled"]');
        await expect(sledBtn).toBeEnabled();
        await sledBtn.click();

        // 3. Verify we are on Step 3 (Preferences)
        await expect(page.locator('#step-prefs')).toBeVisible();

        // Verify specific prefs for Sled (defined in domainConfigs.js)
        // "Rasant" -> id="fast"
        const fastPref = page.locator('button[data-pref="fast"]');
        await expect(fastPref).toBeVisible();
        await expect(fastPref.locator('.pref-label')).toHaveText('Rasant');

        // 4. Select "Rasant" and "Mit Lift"
        await fastPref.click();
        const liftPref = page.locator('button[data-pref="lift"]');
        if (await liftPref.isVisible()) {
            await liftPref.click();
        }

        // 5. Submit
        await page.click('#showResultsBtn');

        // 6. Verify Results
        await expect(page.locator('#resultsView')).toBeVisible();
        await expect(page.locator('#resultsHeading')).toContainText('Beste Wahl heute');

        // Check for Wallberg card
        const wallbergCard = page.locator('.top3-card').filter({ hasText: 'Wallberg' });
        await expect(wallbergCard).toBeVisible();

        // Check for Sled-specific logic in reasoning
        // Wallberg has length 6.5 > 3 -> "Extra lange Bahn"
        await expect(wallbergCard).toContainText('Extra lange Bahn (6.5 km)');
        // Wallberg has lift -> "Aufstiegshilfe vorhanden"
        await expect(wallbergCard).toContainText('Aufstiegshilfe vorhanden');
    });

});
