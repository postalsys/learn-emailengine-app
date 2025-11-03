#!/usr/bin/env node

/**
 * Screenshot capture automation for EmailEngine documentation
 *
 * Uses Playwright to capture screenshots of EmailEngine UI for documentation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAILENGINE_URL = 'https://localdev.kreata.ee';
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'screenshots');
const VIEWPORT = { width: 1600, height: 900 };

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
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
    // 1. Main dashboard/login page
    console.log('\n📸 Capturing main dashboard...');
    await page.goto(EMAILENGINE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01-dashboard-main.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 01-dashboard-main.png');

    // 2. Accounts page
    console.log('\n📸 Capturing accounts page...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02-accounts-list.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 02-accounts-list.png');

    // 3. Add account form (if available)
    console.log('\n📸 Capturing add account form...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/accounts/new`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '03-account-add-form.png'),
        fullPage: true
      });
      console.log('   ✅ Saved: 03-account-add-form.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture add account form');
    }

    // 4. Settings page
    console.log('\n📸 Capturing settings page...');
    await page.goto(`${EMAILENGINE_URL}/admin/config`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04-settings-config.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 04-settings-config.png');

    // 5. Webhooks configuration
    console.log('\n📸 Capturing webhooks configuration...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/config/webhooks`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '05-webhooks-config.png'),
        fullPage: true
      });
      console.log('   ✅ Saved: 05-webhooks-config.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture webhooks config');
    }

    // 6. Templates page
    console.log('\n📸 Capturing templates page...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/templates`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '06-templates-list.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 06-templates-list.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture templates page');
    }

    // 7. Queue management (Bull Board)
    console.log('\n📸 Capturing Bull Board queue...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/arena`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '07-bull-board-queues.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 07-bull-board-queues.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture Bull Board');
    }

    // 8. Logs page
    console.log('\n📸 Capturing logs page...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/logs`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '08-logs-view.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 08-logs-view.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture logs page');
    }

    // 9. OAuth2 apps
    console.log('\n📸 Capturing OAuth2 apps...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/oauth`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '09-oauth-apps.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 09-oauth-apps.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture OAuth2 apps');
    }

    // 10. SMTP Gateway
    console.log('\n📸 Capturing SMTP gateway...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/gateway`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '10-smtp-gateway.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 10-smtp-gateway.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture SMTP gateway');
    }

    console.log('\n✅ Screenshot capture complete!');
    console.log(`   Total screenshots saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the capture
captureScreenshots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
