#!/usr/bin/env node

'use strict';

/*
 * Screenshot capture for the OAuth2 setup documentation
 * (static/img/oauth2-setup). Companion to capture-screenshots.js - same
 * configuration, but everything here works through the admin UI, so no API
 * token is needed.
 *
 * Creates one Outlook OAuth2 application along the way. Run it against a
 * throwaway instance that has NO OAuth2 apps yet, otherwise the empty-state
 * shot (01) will not be empty.
 *
 * Configuration (environment variables):
 *   EE_URL       Base URL of a running EmailEngine instance
 *                (default http://127.0.0.1:7003)
 *   EE_USERNAME  Admin username for /admin/login (default "admin")
 *   EE_PASSWORD  Admin password; omit if the instance has authentication
 *                disabled
 *
 * Example:
 *   EE_URL=http://127.0.0.1:7003 EE_PASSWORD=... \
 *     node scripts/capture-oauth2-screenshots.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = (process.env.EE_URL || 'http://127.0.0.1:7003').replace(/\/+$/, '');
const EE_USERNAME = process.env.EE_USERNAME || 'admin';
const EE_PASSWORD = process.env.EE_PASSWORD || '';

const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'oauth2-setup');

// Fake credentials for screenshots
const OUTLOOK_APP = {
    name: 'Production Outlook',
    clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    clientSecret: 'Xyz~8Kj2mN9pQ3rS5tU7vW0xY2zA4bC6dE8fG0hI',
    redirectUrl: 'https://localdev.kreata.ee/oauth',
    authority: 'common'
};

async function login(page) {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'load' });
    if (!page.url().includes('/admin/login')) {
        console.log('No login required');
        return;
    }
    if (!EE_PASSWORD) {
        throw new Error('The instance requires authentication - set EE_PASSWORD');
    }
    console.log('Logging in...');
    await page.fill('#loginUsername', EE_USERNAME);
    await page.fill('#loginPassword', EE_PASSWORD);
    await page.click('form[action="/admin/login"] button[type="submit"]');
    await page.waitForURL(url => !url.pathname.startsWith('/admin/login'), { timeout: 15000 });
}

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
        await login(page);

        // Screenshot 1: OAuth2 configuration page (empty)
        console.log('Capturing OAuth2 configuration page...');
        await page.goto(`${BASE_URL}/admin/config/oauth`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, '01-oauth2-config-empty.png'),
            fullPage: false
        });
        console.log('Captured: 01-oauth2-config-empty.png');

        // Screenshot 2: Click dropdown to show provider options.
        // The "Create OAuth2 app" button has a stable id; the generic
        // `button.dropdown-toggle` selector matches the top-bar user menu first.
        console.log('Opening Add application dropdown...');
        await page.click('#create-app-dropdown');
        await page.waitForSelector('.dropdown-menu [href*="provider="]', { state: 'visible', timeout: 5000 });
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

    } finally {
        await browser.close();
    }
}

// Fail loudly: a swallowed error used to leave the previous run's screenshots in
// place and still exit 0, so a broken capture looked like a successful one.
captureScreenshots().catch(err => {
    console.error(err);
    process.exit(1);
});
