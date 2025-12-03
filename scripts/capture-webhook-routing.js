#!/usr/bin/env node

/**
 * Screenshot capture for Webhook Routing documentation
 *
 * Captures screenshots of the webhook routing feature in EmailEngine:
 * - Webhook routes list page
 * - Create new route form
 * - Route detail view with filter/map functions
 * - Webhook configuration page (to show how to disable default webhook)
 *
 * Prerequisites:
 * - EmailEngine running at https://localdev.kreata.ee
 * - SSH tunnel: ssh -R 7003:localhost:7003 kreata.ee -f -N
 * - EENGINE_REQUIRE_API_AUTH=false for unauthenticated access
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAILENGINE_URL = 'https://localdev.kreata.ee';
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'screenshots', 'webhooks');
const VIEWPORT = { width: 1600, height: 900 };

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureWebhookRoutingScreenshots() {
    console.log('Starting webhook routing screenshot capture...');
    console.log(`   Target: ${EMAILENGINE_URL}`);
    console.log(`   Output: ${OUTPUT_DIR}`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--ignore-certificate-errors']
    });

    const context = await browser.newContext({
        viewport: VIEWPORT,
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    try {
        // 1. Webhook Routes List (empty state)
        console.log('\nCapturing webhook routes list (empty state)...');
        await page.goto(`${EMAILENGINE_URL}/admin/webhooks`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, 'webhook-routes-list-empty.png'),
            fullPage: false
        });
        console.log('   Saved: webhook-routes-list-empty.png');

        // 2. Create New Webhook Route Form
        console.log('\nCapturing new webhook route form...');
        await page.goto(`${EMAILENGINE_URL}/admin/webhooks/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);

        // Fill in the form with example values to show the interface
        await page.fill('input[name="name"]', 'Notify Slack on Inbox Messages');
        await page.fill('input[name="description"]', 'Send webhook to Slack when new emails arrive in INBOX');
        await page.fill('input[name="targetUrl"]', 'https://hooks.slack.com/services/T00000/B00000/xxxxx');
        await page.check('input[name="enabled"]');

        await page.waitForTimeout(500);

        // Take screenshot of the filled form (first part - viewport)
        await page.screenshot({
            path: path.join(OUTPUT_DIR, 'webhook-route-new-form.png'),
            fullPage: false
        });
        console.log('   Saved: webhook-route-new-form.png');

        // Scroll to show the filter and map function editors
        await page.evaluate(() => {
            const editorFn = document.getElementById('editor-fn');
            if (editorFn) {
                editorFn.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
        });
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: path.join(OUTPUT_DIR, 'webhook-route-filter-function.png'),
            fullPage: false
        });
        console.log('   Saved: webhook-route-filter-function.png');

        // Take full page screenshot to show entire form
        await page.screenshot({
            path: path.join(OUTPUT_DIR, 'webhook-route-new-form-full.png'),
            fullPage: true
        });
        console.log('   Saved: webhook-route-new-form-full.png');

        // 3. Create a test webhook route via UI form
        console.log('\nCreating test webhook route via UI form...');
        let webhookRouteId = null;
        try {
            // Navigate to new route form
            await page.goto(`${EMAILENGINE_URL}/admin/webhooks/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000);

            // Fill in the form
            await page.fill('input[name="name"]', 'Notify Slack on Inbox Messages');
            await page.fill('input[name="description"]', 'Send webhook to Slack when new emails arrive in INBOX');
            await page.fill('input[name="targetUrl"]', 'https://hooks.slack.com/services/T00000000/B00000000/xxxxxxxxxxxxxxxx');
            await page.check('input[name="enabled"]');

            // Submit the form
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);

            // Get the route ID from the URL after redirect
            const currentUrl = page.url();
            const match = currentUrl.match(/\/admin\/webhooks\/webhook\/([^/]+)/);
            if (match) {
                webhookRouteId = match[1];
                console.log(`   Created webhook route: ${webhookRouteId}`);
            } else {
                console.log('   Warning: Could not extract webhook route ID from URL');
            }
        } catch (e) {
            console.log('   Warning: Could not create webhook route via UI:', e.message);
        }

        // 4. Webhook Routes List (with route)
        if (webhookRouteId) {
            console.log('\nCapturing webhook routes list (with route)...');
            await page.goto(`${EMAILENGINE_URL}/admin/webhooks`, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(OUTPUT_DIR, 'webhook-routes-list.png'),
                fullPage: false
            });
            console.log('   Saved: webhook-routes-list.png');

            // 5. Webhook Route Detail View
            console.log('\nCapturing webhook route detail view...');
            await page.goto(`${EMAILENGINE_URL}/admin/webhooks/webhook/${webhookRouteId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(OUTPUT_DIR, 'webhook-route-detail.png'),
                fullPage: false
            });
            console.log('   Saved: webhook-route-detail.png');

            // Take full page screenshot of detail view
            await page.screenshot({
                path: path.join(OUTPUT_DIR, 'webhook-route-detail-full.png'),
                fullPage: true
            });
            console.log('   Saved: webhook-route-detail-full.png');

            // 6. Webhook Route Edit Page
            console.log('\nCapturing webhook route edit page...');
            await page.goto(`${EMAILENGINE_URL}/admin/webhooks/webhook/${webhookRouteId}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(OUTPUT_DIR, 'webhook-route-edit.png'),
                fullPage: false
            });
            console.log('   Saved: webhook-route-edit.png');
        }

        // 7. Webhook Configuration Page (shows default webhook settings)
        console.log('\nCapturing webhook configuration page...');
        await page.goto(`${EMAILENGINE_URL}/admin/config/webhooks`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(OUTPUT_DIR, 'webhook-config-page.png'),
            fullPage: false
        });
        console.log('   Saved: webhook-config-page.png');

        // Full page to show all options
        await page.screenshot({
            path: path.join(OUTPUT_DIR, 'webhook-config-page-full.png'),
            fullPage: true
        });
        console.log('   Saved: webhook-config-page-full.png');

        // Clean up - delete the test webhook route via UI
        if (webhookRouteId) {
            console.log('\nCleaning up test webhook route...');
            try {
                await page.goto(`${EMAILENGINE_URL}/admin/webhooks/webhook/${webhookRouteId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await page.waitForTimeout(1000);
                // Click delete button to open modal
                await page.click('#delete-btn');
                await page.waitForTimeout(500);
                // Confirm deletion in modal
                await page.click('#deleteModal button[type="submit"]');
                await page.waitForTimeout(1000);
                console.log('   Deleted test webhook route');
            } catch (e) {
                console.log('   Warning: Could not delete test webhook route:', e.message);
            }
        }

        console.log('\nScreenshot capture complete!');
        console.log(`   Total screenshots saved to: ${OUTPUT_DIR}`);

    } catch (error) {
        console.error('Error during screenshot capture:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the capture
captureWebhookRoutingScreenshots().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
