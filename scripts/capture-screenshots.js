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
    // 1. Main dashboard (admin page)
    console.log('\n📸 Capturing main dashboard...');
    await page.goto(`${EMAILENGINE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01-dashboard-main.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 01-dashboard-main.png');

    // 2. Accounts page
    console.log('\n📸 Capturing accounts page...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02-accounts-list.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 02-accounts-list.png');

    // 3. Account type selection page with OAuth2 buttons
    console.log('\n📸 Capturing account type selection...');
    try {
      // Generate authentication form URL via API
      const authFormResponse = await context.request.post(`${EMAILENGINE_URL}/v1/authentication/form`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          account: 'test-account',
          redirectUrl: 'https://localdev.kreata.ee/admin/accounts'
        }
      });

      const authFormData = await authFormResponse.json();
      console.log(`   Generated form URL: ${authFormData.url}`);

      // Navigate to the form - this shows account type selection with OAuth2 buttons
      await page.goto(authFormData.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // Take screenshot of account type selection page
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '03-account-type-selection.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 03-account-type-selection.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture account type selection:', e.message);
    }

    // 4. Add account form - IMAP/SMTP configuration
    console.log('\n📸 Capturing add account form...');
    try {
      // Create Ethereal Email test account using Playwright's request API
      console.log('   Creating Ethereal Email test account...');
      const etherealResponse = await context.request.post('https://api.nodemailer.com/user', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          requestor: 'emailengine-dev',
          version: '0.0.1'
        }
      });
      const ethereal = await etherealResponse.json();
      console.log(`   Ethereal account created: ${ethereal.user}`);

      // Generate authentication form URL via API
      const response = await context.request.post(`${EMAILENGINE_URL}/v1/authentication/form`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          type: 'imap',
          redirectUrl: 'https://localdev.kreata.ee/admin/accounts'
        }
      });

      const data = await response.json();
      console.log(`   Generated form URL: ${data.url}`);

      // Navigate to the form
      await page.goto(data.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Fill in the initial form with Ethereal Email credentials
      await page.fill('input[name="name"]', 'Test IMAP Account');
      await page.fill('input[name="email"]', ethereal.user);
      await page.fill('input[name="password"]', ethereal.pass);

      // Click Continue - EmailEngine will auto-detect IMAP/SMTP settings
      await page.click('button:has-text("Continue")');
      await page.waitForTimeout(3000); // Wait for auto-detection

      // Take screenshot of the auto-filled IMAP/SMTP configuration
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '04-account-add-form.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 04-account-add-form.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture add account form:', e.message);
    }

    // 5. Settings page
    console.log('\n📸 Capturing settings page...');
    await page.goto(`${EMAILENGINE_URL}/admin/config`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05-settings-config.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 05-settings-config.png');

    // 6. Webhooks configuration
    console.log('\n📸 Capturing webhooks configuration...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/config/webhooks`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '06-webhooks-config.png'),
        fullPage: true
      });
      console.log('   ✅ Saved: 06-webhooks-config.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture webhooks config');
    }

    // 7. Templates page
    console.log('\n📸 Capturing templates page...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/templates`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '07-templates-list.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 07-templates-list.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture templates page');
    }

    // 8. Queue management (Bull Board)
    console.log('\n📸 Capturing Bull Board queue...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/arena`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '08-bull-board-queues.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 08-bull-board-queues.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture Bull Board');
    }

    // 9. Logs page
    console.log('\n📸 Capturing logs page...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/logs`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '09-logs-view.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 09-logs-view.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture logs page');
    }

    // 10. OAuth2 apps
    console.log('\n📸 Capturing OAuth2 apps...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/oauth`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '10-oauth-apps.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 10-oauth-apps.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture OAuth2 apps');
    }

    // 11. SMTP Gateway
    console.log('\n📸 Capturing SMTP gateway...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/gateway`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '11-smtp-gateway.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 11-smtp-gateway.png');
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
