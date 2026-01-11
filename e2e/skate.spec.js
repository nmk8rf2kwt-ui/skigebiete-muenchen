import { test, expect } from '@playwright/test';

test('Eislaufen (Skate) flow working', async ({ page }) => {  // Mock Geolocation API (Photon)
    await page.route('https://photon.komoot.io/api/**', async route => {
        const json = {
            features: [{
                geometry: { coordinates: [11.582, 48.135] },
                properties: { name: 'München', city: 'München' }
            }]
        };
        await route.fulfill({ json });
    });

    // Mock Traffic API
    await page.route('**/api/traffic-all**', async route => {
        await route.fulfill({ json: {} });
    });

    // Mock Resorts API (Ski) - Fast response for initial load
    await page.route('**/api/resorts', async route => {
        await route.fulfill({ json: [] });
    });

    // 1. Open App with Debug Mode & Skate Domain
    await page.goto('/?debug=true&domain=skate');

    // 2. Click "Meine Empfehlungen zeigen" (No, debug mode goes straight to results?)
    // app.js:282 resultsView.style.display = "block";
    // So results are immediate.

    // 3. Check Results
    await expect(page.locator('#resultsView')).toBeVisible();

    // 4. Verify Skate Metrics (Status, Temp)
    // Verify Prinzregentenstadion is visible and Open.
    await expect(page.getByText('Prinzregentenstadion')).toBeVisible();
    await expect(page.locator('.metric-value', { hasText: 'Offen' }).first()).toBeVisible();

});
