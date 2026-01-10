import { test, expect } from '@playwright/test';

test('Traffic data is displayed', async ({ page }) => {
    await page.goto('https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/');

    // Wait for the table to load
    await page.locator('#skiTable tbody tr').first().waitFor();

    // Check if we have any execution for "Anfahrt" column (index depends on layout, but let's look for text)
    // We expect either minutes (e.g. "60 min") or "n.a." or similar.
    // We want to verify it's NOT just empty or stuck loading.

    // Get all cells in the "Anfahrt" column (assuming it's roughly the 3rd or 4th column)
    // Or simpler: verify that we see some time format in the table.
    const regex = /([0-9]+ min)|(n\.a\.)/;
    await expect(page.locator('body')).toHaveText(regex);
});
