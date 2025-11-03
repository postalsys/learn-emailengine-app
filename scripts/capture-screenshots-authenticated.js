#!/usr/bin/env node

/**
 * Screenshot capture automation for EmailEngine documentation
 * WITH PROPER AUTHENTICATION
 *
 * Uses Playwright to capture screenshots of EmailEngine UI for documentation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAILENGINE_URL = 'https://localdev.kreata.ee';
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'screenshots');
const VIEWPORT = { width: 1600, height: 900 };
const USERNAME = 'admin';
const PASSWORD = 'x0336182';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function login(page) {
  console.log('🔐 Logging in...');

  // Go to login page
  await page.goto(`${EMAILENGINE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Fill in credentials
  await page.fill('input[name="username"], input[type="text"]', USERNAME);
  await page.fill('input[name="password"], input[type="password"]', PASSWORD);

  // Submit form
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

  // Wait for navigation to dashboard
  await page.waitForTimeout(3000);

  console.log('   ✅ Logged in successfully');
}

async function captureScreenshots() {
  console.log('🚀 Starting authenticated screenshot capture...');
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
    // Login first
    await login(page);

    // 1. Main dashboard
    console.log('\n📸 Capturing main dashboard...');
    await page.goto(`${EMAILENGINE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01-dashboard-main.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 01-dashboard-main.png');

    // 2. Accounts page
    console.log('\n📸 Capturing accounts page...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02-accounts-list.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 02-accounts-list.png');

    // 3. Add account form (if available)
    console.log('\n📸 Capturing add account form...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/accounts/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
    await page.goto(`${EMAILENGINE_URL}/admin/config`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04-settings-config.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 04-settings-config.png');

    // 5. Webhooks configuration
    console.log('\n📸 Capturing webhooks configuration...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/config/webhooks`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
      await page.goto(`${EMAILENGINE_URL}/admin/templates`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
      await page.goto(`${EMAILENGINE_URL}/admin/arena`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
      await page.goto(`${EMAILENGINE_URL}/admin/logs`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
      await page.goto(`${EMAILENGINE_URL}/admin/oauth`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
      await page.goto(`${EMAILENGINE_URL}/admin/gateway`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '10-smtp-gateway.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 10-smtp-gateway.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture SMTP gateway');
    }

    // 11. Accounts list with data (if test accounts exist)
    console.log('\n📸 Capturing accounts with data...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '11-accounts-with-data.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 11-accounts-with-data.png');

    // 12. Account detail (if test1 exists)
    console.log('\n📸 Capturing account detail...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/accounts/test1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '12-account-detail.png'),
        fullPage: true
      });
      console.log('   ✅ Saved: 12-account-detail.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture account detail (account may not exist)');
    }

    // 13. Messages list (if test2 exists)
    console.log('\n📸 Capturing messages list...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/accounts/test2`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1000);
      // Try to navigate to messages
      const messagesLink = await page.$('a[href*="messages"]');
      if (messagesLink) {
        await messagesLink.click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '13-messages-list.png'),
          fullPage: false
        });
        console.log('   ✅ Saved: 13-messages-list.png');
      }
    } catch (e) {
      console.log('   ⚠️  Could not capture messages list');
    }

    // 14. Templates with data
    console.log('\n📸 Capturing templates with data...');
    await page.goto(`${EMAILENGINE_URL}/admin/templates`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '15-templates-with-data.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 15-templates-with-data.png');

    // 15. Template editor (if welcome-email exists)
    console.log('\n📸 Capturing template editor...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/templates/welcome-email`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '16-template-editor.png'),
        fullPage: true
      });
      console.log('   ✅ Saved: 16-template-editor.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture template editor');
    }

    // 16. Bull Board with jobs
    console.log('\n📸 Capturing Bull Board with jobs...');
    await page.goto(`${EMAILENGINE_URL}/admin/arena`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '17-bull-board-with-jobs.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 17-bull-board-with-jobs.png');

    // 17. Submit queue
    console.log('\n📸 Capturing Submit queue...');
    try {
      // Look for submit queue link
      const submitLink = await page.$('a[href*="submit"]');
      if (submitLink) {
        await submitLink.click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '18-bull-board-submit-queue.png'),
          fullPage: false
        });
        console.log('   ✅ Saved: 18-bull-board-submit-queue.png');
      }
    } catch (e) {
      console.log('   ⚠️  Could not capture submit queue');
    }

    // 18. Logs with entries
    console.log('\n📸 Capturing logs with entries...');
    await page.goto(`${EMAILENGINE_URL}/admin/logs`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '19-logs-with-entries.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 19-logs-with-entries.png');

    // 19. OAuth add form
    console.log('\n📸 Capturing OAuth add form...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/oauth/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '20-oauth-add-form.png'),
        fullPage: true
      });
      console.log('   ✅ Saved: 20-oauth-add-form.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture OAuth add form');
    }

    // 20. Webhooks settings detail
    console.log('\n📸 Capturing webhooks settings detail...');
    await page.goto(`${EMAILENGINE_URL}/admin/config`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '21-webhooks-settings-detail.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 21-webhooks-settings-detail.png');

    // 21. Account status indicators
    console.log('\n📸 Capturing account status indicators...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '22-account-status-indicators.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 22-account-status-indicators.png');

    console.log('\n✅ Screenshot capture complete!');
    console.log(`   Total screenshots saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error.message);
    console.error(error.stack);
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
