#!/usr/bin/env node

'use strict';

/*
 * Screenshot capture for the webhook routing documentation
 * (static/img/screenshots/webhooks). Companion to capture-screenshots.js -
 * same configuration, but everything here works through the admin UI, so no
 * API token is needed.
 *
 * Creates a demo webhook route, captures the list/new/detail/edit pages plus
 * the webhook configuration page, then deletes the demo route again.
 *
 * Configuration (environment variables):
 *   EE_URL       Base URL of a running EmailEngine instance
 *                (default http://127.0.0.1:3000)
 *   EE_USERNAME  Admin username for /admin/login (default "admin")
 *   EE_PASSWORD  Admin password; omit if the instance has authentication
 *                disabled
 *
 * Example:
 *   EE_URL=http://127.0.0.1:7003 EE_PASSWORD=... \
 *     node scripts/capture-webhook-routing.js
 */

const fs = require('fs');
const path = require('path');

// use whichever Playwright package is resolvable (see capture-screenshots.js)
let chromium;
try {
    ({ chromium } = require('playwright'));
} catch (err) {
    ({ chromium } = require('@playwright/test'));
}

const EE_URL = (process.env.EE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const EE_USERNAME = process.env.EE_USERNAME || 'admin';
const EE_PASSWORD = process.env.EE_PASSWORD || '';

const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'screenshots', 'webhooks');
const VIEWPORT = { width: 1600, height: 900 };

const DEMO_ROUTE = {
    name: 'Notify Slack on Inbox Messages',
    description: 'Send webhook to Slack when new emails arrive in INBOX',
    targetUrl: 'https://hooks.slack.com/services/T00000000/B00000000/xxxxxxxxxxxxxxxx'
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function login(page) {
    await page.goto(`${EE_URL}/admin`, { waitUntil: 'load' });
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

async function shot(page, file, opts) {
    opts = opts || {};
    await page.waitForTimeout(opts.settle || 750);
    await page.screenshot({ path: path.join(OUTPUT_DIR, file), fullPage: false });
    console.log(`Saved: ${file}`);
}

async function fillRouteForm(page) {
    await page.fill('input[name="name"]', DEMO_ROUTE.name);
    await page.fill('input[name="description"]', DEMO_ROUTE.description);
    await page.fill('input[name="targetUrl"]', DEMO_ROUTE.targetUrl);
    await page.check('#enabled');
}

async function captureWebhookRoutingScreenshots() {
    console.log(`Target: ${EE_URL}`);
    console.log(`Output: ${OUTPUT_DIR}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    try {
        await login(page);

        // routes list, empty state
        await page.goto(`${EE_URL}/admin/webhooks`, { waitUntil: 'load' });
        await shot(page, 'webhook-routes-list-empty.png');

        // new-route form, filled with example values
        await page.goto(`${EE_URL}/admin/webhooks/new`, { waitUntil: 'load' });
        await fillRouteForm(page);
        await shot(page, 'webhook-route-new-form.png');

        // same form scrolled to the filter/map function editors
        await page.locator('#editor-fn').scrollIntoViewIfNeeded();
        await shot(page, 'webhook-route-filter-function.png', { settle: 1000 });

        // submit; the redirect lands on the new route's detail page
        await page.click('form button[type="submit"]');
        await page.waitForURL(/\/admin\/webhooks\/webhook\/[^/]+$/, { timeout: 15000 });
        const routeId = page.url().match(/\/admin\/webhooks\/webhook\/([^/?]+)/)[1];
        console.log(`Created demo webhook route: ${routeId}`);

        await shot(page, 'webhook-route-detail.png');

        await page.goto(`${EE_URL}/admin/webhooks/webhook/${routeId}/edit`, { waitUntil: 'load' });
        await shot(page, 'webhook-route-edit.png', { settle: 1500 });

        // webhook configuration page (default webhook settings)
        await page.goto(`${EE_URL}/admin/config/webhooks`, { waitUntil: 'load' });
        await shot(page, 'webhook-config-page.png');

        // clean up the demo route. "Delete route" lives in the detail-view
        // row-actions kebab, so the menu has to be opened before the item is
        // clickable
        await page.goto(`${EE_URL}/admin/webhooks/webhook/${routeId}`, { waitUntil: 'load' });
        await page.click('button[aria-label="More webhook route actions"]');
        await page.locator('#delete-btn').click();
        await page.waitForTimeout(500);
        await page.click('#deleteModal button[type="submit"]');
        await page.waitForTimeout(1000);
        console.log('Deleted the demo webhook route');

        console.log('Screenshot capture complete');
    } finally {
        await browser.close();
    }
}

captureWebhookRoutingScreenshots().catch(err => {
    console.error(err);
    process.exit(1);
});
