const { test, expect } = require('@playwright/test');

test.describe('Walk Domain', () => {

    test.beforeEach(async ({ page }) => {
        // Mock the Walk API
        await page.route('**/api/winter-walks', async route => {
            const json = [
                {
                    id: "eibsee",
                    name: "Eibsee Rundweg",
                    duration: 2.0,
                    distance: 90,
                    level: "easy",
                    view: true,
                    weather: { "temp": -1, "icon": "☀️" }
                },
                {
                    id: "herzogstand",
                    name: "Herzogstand",
                    duration: 3.0,
                    level: "hard",
                    view: true
                }
            ];
            await route.fulfill({ json });
        });

        // Mock Location
        await page.context().grantPermissions(['geolocation']);
        await page.context().setGeolocation({ latitude: 48.1351, longitude: 11.5820 });

        // Bypass Step 1
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

    test('should allow selecting Winterwanderung and show results', async ({ page }) => {
        // 1. Verify we are on Step 2 (Activity)
        await expect(page.locator('#step-activity')).toBeVisible();

        // 2. Click "Walk" button
        const walkBtn = page.locator('button[data-domain="walk"]');
        await expect(walkBtn).toBeVisible();
        await walkBtn.click();

        // 3. Verify we are on Step 3 (Preferences)
        await expect(page.locator('#step-prefs')).toBeVisible();

        // Verify Walk preferences
        const viewPref = page.locator('button[data-pref="view"]');
        await expect(viewPref).toBeVisible();
        await expect(viewPref.locator('.pref-label')).toHaveText('Aussicht');

        // 4. Select "Aussicht"
        await viewPref.click();

        // 5. Submit
        await page.click('#showResultsBtn');

        // 6. Verify Results
        await expect(page.locator('#resultsView')).toBeVisible();
        await expect(page.locator('#resultsHeading')).toContainText('Beste Wahl heute');

        // Check for Eibsee
        const eibseeCard = page.locator('.top3-card').filter({ hasText: 'Eibsee' });
        await expect(eibseeCard).toBeVisible();

        // Check for Walk-specific logic
        await expect(eibseeCard).toContainText('Panorama-Ausblick');
        await expect(eibseeCard).toContainText('Leichter Rundweg');
    });

});
