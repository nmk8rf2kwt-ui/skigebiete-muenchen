const { test, expect } = require('@playwright/test');

test.describe('Skate Domain', () => {

    test.beforeEach(async ({ page }) => {
        // Mock the Skate API
        await page.route('**/api/ice-skating', async route => {
            const json = [
                {
                    id: "nymphenburg",
                    name: "Nymphenburger Kanal",
                    type: "natural",
                    isOpen: false,
                    distance: 15
                },
                {
                    id: "prinzregenten",
                    name: "Prinzregentenstadion",
                    type: "indoor",
                    isOpen: true,
                    price: 6.50,
                    distance: 10
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

    test('should allow selecting Eislaufen and show results', async ({ page }) => {
        // 1. Verify we are on Step 2 (Activity)
        await expect(page.locator('#step-activity')).toBeVisible();

        // 2. Click "Eislaufen" button
        const skateBtn = page.locator('button[data-domain="skate"]');
        await expect(skateBtn).toBeEnabled();
        await skateBtn.click();

        // 3. Verify we are on Step 3 (Preferences)
        await expect(page.locator('#step-prefs')).toBeVisible();

        // Verify Skate preferences
        const indoorPref = page.locator('button[data-pref="indoor"]');
        await expect(indoorPref).toBeVisible();
        await expect(indoorPref.locator('.pref-label')).toHaveText('Eissporthalle');

        // 4. Select "Indoor"
        await indoorPref.click();

        // 5. Submit
        await page.click('#showResultsBtn');

        // 6. Verify Results
        await expect(page.locator('#resultsView')).toBeVisible();
        await expect(page.locator('#resultsHeading')).toContainText('Beste Wahl heute');

        // Check for Prinzregentenstadion (Open & Indoor)
        const prinzCard = page.locator('.top3-card').filter({ hasText: 'Prinzregentenstadion' });
        await expect(prinzCard).toBeVisible();

        // Check for Skate-specific logic
        await expect(prinzCard).toContainText('Geöffnet');
        await expect(prinzCard).toContainText('Eishalle (Wetterunabhängig)');
    });

});
