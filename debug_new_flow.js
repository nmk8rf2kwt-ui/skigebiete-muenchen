const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // LOG ALL CONSOLE MESSAGES
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    await page.goto('http://localhost:10000');

    console.log('Page Title:', await page.title());

    const stepLocation = await page.isVisible('#step-location');
    console.log('Step 1 (Location) Visible:', stepLocation);

    if (stepLocation) {
        console.log('Filling input...');
        await page.fill('#addressInput', 'München');

        // Mock API logic manually by injecting script if needed, 
        // but here we rely on real app. 
        // If real app uses external API, it might fail in headless if blocked.
        // Let's assume network is fine.

        console.log('Clicking Submit...');
        await page.click('#submitLocationBtn');

        console.log('Waiting for transition...');
        await page.waitForTimeout(3000); // Give it time

        const stepActivity = await page.isVisible('#step-activity');
        console.log('Step 2 (Activity) Visible:', stepActivity);

        if (!stepActivity) {
            console.log('Layout State:');
            const styles = await page.evaluate(() => {
                return {
                    loc: document.getElementById('step-location').style.display,
                    act: document.getElementById('step-activity').style.display
                }
            });
            console.log(styles);
        }
    }

    await browser.close();
})();
