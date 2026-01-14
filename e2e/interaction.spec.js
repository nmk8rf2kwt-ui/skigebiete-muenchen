import { test, expect } from '@playwright/test';

test('Interaction CUJ: Sorting and Map Toggle', async ({ page }) => {

    // Mock Backend to have items to sort
    await page.route('**/api/resorts', async route => {
        await route.fulfill({
            json: [
                {
                    id: '1', name: 'Alpen Resort', distance: 100, distance_km: 100,
                    latitude: 47.0, longitude: 11.0,
                    liftsOpen: 5, liftsTotal: 10,
                    snow: { mountain: 50, valley: 20 },
                    traffic: { duration: 3600, delay: 0 }
                },
                {
                    id: '2', name: 'Zugspitze', distance: 50, distance_km: 50,
                    latitude: 47.4, longitude: 11.0,
                    liftsOpen: 2, liftsTotal: 5,
                    snow: { mountain: 200, valley: 100 },
                    traffic: { duration: 1800, delay: 0 }
                }
            ]
        });
    });
    // Mock other apis
    await page.route('https://photon.komoot.io/api/**', async route => route.fulfill({ json: { features: [] } }));
    await page.route('**/api/traffic-all*', async route => route.fulfill({ json: {} }));

    // Start directly at results (simulation)
    await page.goto('/?results=true');

    // Wait for hydration
    await page.waitForTimeout(1000);

    // Wait for results
    await expect(page.locator('#resultsView')).toBeVisible();

    // Switch to Table View
    await page.click('button[data-view="table"]');
    await expect(page.locator('#tableView')).toBeVisible();

    // 1. Sorting Test - verify that clicking header toggles order
    const rows = page.locator('#resortRows tr');

    // Record initial first row content
    const initialFirstRow = await rows.first().textContent();

    // Click to sort by distance
    await page.click('th[data-sort="distance_km"]');
    await page.waitForTimeout(300); // Wait for re-render

    // After sorting by distance_km ascending, Zugspitze (50km) should be before Alpen Resort (100km)
    await expect(rows.first()).toContainText('Zugspitze');

    // 2. Map Toggle
    await page.click('button[data-view="map"]');
    await expect(page.locator('#map-view')).toBeVisible();
    // Verify Leaflet map initialized
    await expect(page.locator('.leaflet-container')).toBeVisible();
});
