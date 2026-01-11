import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    // Mock Backend APIs to ensure reliability without running backend
    await page.route('**/api/resorts', async route => {
        await route.fulfill({
            json: [{
                id: '1', name: 'Resort with History', latitude: 47, longitude: 11,
                liftsOpen: 5, liftsTotal: 10, snow: { mountain: 100 }, distance: 60,
                traffic: {
                    duration: 3600, delay: 0,
                    historyStats: {
                        avg: 3500,
                        top5: [3200, 3300, 3400, 3450, 3500],
                        count: 20
                    }
                }
            }]
        });
    });

    await page.route('**/api/traffic-all*', async route => {
        await route.fulfill({ json: { '1': { duration: 3600, delay: 0 } } });
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

test('Traffic tooltip renders history stats', async ({ page }) => {
    // 1. Mock API implicitly handled by beforeEach? 
    // Wait, beforeEach sets route, but I overwrote it in previous version.
    // I should assert that the mock specific to this test is used.
    // The beforeEach mock has NO historyStats.
    // I need to override the route for THIS test.

    await page.route('**/api/resorts', async route => {
        await route.fulfill({
            json: [{
                id: '1', name: 'Resort with History', latitude: 47, longitude: 11,
                liftsOpen: 5, liftsTotal: 10, snow: { mountain: 100 }, distance: 60,
                traffic: {
                    duration: 3600, delay: 0,
                    historyStats: {
                        avg: 3500,
                        top5: [3200, 3300, 3400, 3450, 3500],
                        count: 20
                    }
                }
            }]
        });
    });

    await page.goto('/');

    // Ensure results view is active (wait for Top 3)
    await expect(page.locator('#top3Cards')).toBeVisible();

    // Switch to Table View
    await page.click('button[data-view="table"]');

    // Debug info
    const tableDisplay = await page.evaluate(() => {
        const t = document.getElementById('skiTable');
        return getComputedStyle(t).display;
    });
    console.log("Table Display:", tableDisplay);

    const storeState = await page.evaluate(() => {
        const activeBtn = document.querySelector('.view-switcher-wizard .view-btn.active');
        return activeBtn ? activeBtn.dataset.view : 'none';
    });
    console.log("Active View Button:", storeState);

    // Locate traffic pill using Title attribute partial match
    const trafficBadge = page.locator('#skiTable tbody tr span[title*="Aktuell"]').first();

    // Verify it exists and has the expected text in title
    await expect(trafficBadge).toBeVisible();
    await expect(trafficBadge).toHaveAttribute('title', /Top 5: 3200, 3300/);
    await expect(trafficBadge).toHaveAttribute('title', /Ø: 3500 min/);
});
