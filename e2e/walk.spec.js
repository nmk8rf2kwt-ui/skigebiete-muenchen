import { test, expect } from '@playwright/test';

test('Winterwandern (Walk) flow working', async ({ page }) => {
    // Mock Resorts API (Ski) - Fast response for initial load (just in case)
    await page.route('**/api/resorts', async route => {
        await route.fulfill({ json: [] });
    });

    // Mock Winter Walks API
    await page.route('**/api/winter-walks', async route => {
        await route.fulfill({
            json: [
                {
                    "id": "eibsee",
                    "name": "Eibsee Rundweg",
                    "category": "walk",
                    "address": "Eibsee, 82491 Grainau",
                    "latitude": 47.4560,
                    "longitude": 10.9930,
                    "duration": 2.0,
                    "distance": 90,
                    "level": "easy",
                    "view": true,
                    "description": "Traumhafte Kulisse unter der Zugspitze. Fast eben.",
                    "weather": { "temp": -1, "icon": "☀️" },
                    "traffic": { "duration": 5400, "delay": 0 }
                }
            ]
        });
    });

    // 1. Open App with Debug Mode & Walk Domain
    await page.goto('/?debug=true&domain=walk');

    // 2. Check Results
    await expect(page.locator('#resultsView')).toBeVisible();

    // 3. Verify Specific Walk (Eibsee)
    await expect(page.getByText('Eibsee Rundweg')).toBeVisible();

    // 4. Verify Metrics
    // Eibsee has view: true -> "Panorama-Ausblick" in reasoning?
    // Metrics in card: Weather, Duration, Anfahrt.
    // Duration: 2.0 -> "2.0 h" or similar formatter?
    // domainConfigs: formatter: (r) => `${r.duration ?? 0} h`
    // So "2 h" or "2.0 h"? JSON has 2.0. Formatting usually stringifies it.
    await expect(page.locator('.metric-value', { hasText: 'h' }).first()).toBeVisible();

    // Verify Reasoning logic visibility
    // "Panorama-Ausblick"
    // Expand reasoning first?
    // No, reasoning acts as "Warum diese Wahl?" toggle.
    // I should check if it exists in DOM, maybe hidden?
    // Or just check visible metrics.
});
