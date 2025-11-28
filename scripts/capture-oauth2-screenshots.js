const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:7003';
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'oauth2-setup');

// Fake credentials for screenshots
const OUTLOOK_APP = {
    name: 'Production Outlook',
    clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    clientSecret: 'Xyz~8Kj2mN9pQ3rS5tU7vW0xY2zA4bC6dE8fG0hI',
    redirectUrl: 'https://localdev.kreata.ee/oauth',
    authority: 'common'
};

async function captureScreenshots() {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: true,
        args: ['--ignore-certificate-errors']
    });

    const context = await browser.newContext({
        viewport: { width: 1600, height: 900 },
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    try {
        // Screenshot 1: OAuth2 configuration page (empty)
        console.log('Capturing OAuth2 configuration page...');
        await page.goto(`${BASE_URL}/admin/config/oauth`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, '01-oauth2-config-empty.png'),
            fullPage: false
        });
        console.log('Captured: 01-oauth2-config-empty.png');

        // Screenshot 2: Click dropdown to show provider options
        console.log('Opening Add application dropdown...');
        await page.click('button.dropdown-toggle');
        await page.waitForTimeout(500);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, '02-oauth2-add-app-menu.png'),
            fullPage: false
        });
        console.log('Captured: 02-oauth2-add-app-menu.png');

        // Screenshot 3: Navigate directly to Outlook form
        console.log('Navigating to Outlook form...');
        await page.goto(`${BASE_URL}/admin/config/oauth/new?provider=outlook`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, '03-oauth2-outlook-form-empty.png'),
            fullPage: true
        });
        console.log('Captured: 03-oauth2-outlook-form-empty.png');

        // Screenshot 4: Fill in the form with fake credentials
        console.log('Filling in Outlook form...');

        // Fill application name
        await page.fill('input[name="name"]', OUTLOOK_APP.name);

        // Check "Enable this app" if not already checked
        const enableCheckbox = page.locator('input[name="enabled"]');
        if (!(await enableCheckbox.isChecked())) {
            await enableCheckbox.check();
        }

        // Fill Client ID
        await page.fill('input[name="clientId"]', OUTLOOK_APP.clientId);

        // Fill Client Secret
        await page.fill('input[name="clientSecret"]', OUTLOOK_APP.clientSecret);

        // Fill Redirect URL
        await page.fill('input[name="redirectUrl"]', OUTLOOK_APP.redirectUrl);

        await page.waitForTimeout(500);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, '04-oauth2-outlook-form-filled.png'),
            fullPage: true
        });
        console.log('Captured: 04-oauth2-outlook-form-filled.png');

        // Screenshot 5: Submit the form
        console.log('Submitting form...');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, '05-oauth2-app-created.png'),
            fullPage: false
        });
        console.log('Captured: 05-oauth2-app-created.png');

        // Screenshot 6: OAuth2 list with app
        console.log('Navigating to OAuth2 list...');
        await page.goto(`${BASE_URL}/admin/config/oauth`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, '06-oauth2-config-with-app.png'),
            fullPage: false
        });
        console.log('Captured: 06-oauth2-config-with-app.png');

        console.log('\nAll OAuth2 screenshots captured successfully!');
        console.log(`Screenshots saved to: ${OUTPUT_DIR}`);

    } catch (error) {
        console.error('Error capturing screenshots:', error);
        // Take error screenshot for debugging
        await page.screenshot({
            path: path.join(OUTPUT_DIR, 'error-screenshot.png'),
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

captureScreenshots();
