#!/usr/bin/env node

/**
 * Detailed screenshot capture automation for EmailEngine documentation
 *
 * Creates test accounts and captures comprehensive screenshots
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

const EMAILENGINE_URL = 'https://localdev.kreata.ee';
const EMAILENGINE_API = 'http://127.0.0.1:7003';
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'screenshots');
const VIEWPORT = { width: 1600, height: 900 };

// Test accounts created
const testAccounts = [
  {
    user: "dmhshxfbfqbhw5sn@ethereal.email",
    pass: "NR7B3bp5zjMkkgA7Xt",
    imap: { host: "imap.ethereal.email", port: 993, secure: true },
    smtp: { host: "smtp.ethereal.email", port: 587, secure: false }
  },
  {
    user: "po5yc5x7c2xlhroi@ethereal.email",
    pass: "5RSW6yKuek6buBWFv1",
    imap: { host: "imap.ethereal.email", port: 993, secure: true },
    smtp: { host: "smtp.ethereal.email", port: 587, secure: false }
  }
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `${EMAILENGINE_API}${endpoint}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = (url.startsWith('https') ? https : require('http')).request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function captureDetailedScreenshots() {
  console.log('🚀 Starting detailed screenshot capture...');
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
    // Add first test account via API
    console.log('\n📧 Adding test accounts via API...');
    for (let i = 0; i < testAccounts.length; i++) {
      const account = testAccounts[i];
      const accountData = {
        account: `test${i + 1}`,
        name: `Test Account ${i + 1}`,
        email: account.user,
        imap: {
          host: account.imap.host,
          port: account.imap.port,
          secure: account.imap.secure,
          auth: {
            user: account.user,
            pass: account.pass
          }
        },
        smtp: {
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass
          }
        }
      };

      try {
        const result = await apiRequest('/v1/account', 'POST', accountData);
        console.log(`   ✅ Added account: ${accountData.account}`);
      } catch (e) {
        console.log(`   ⚠️  Account may already exist: ${accountData.account}`);
      }
    }

    // Wait for accounts to connect
    console.log('\n⏳ Waiting for accounts to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 11. Accounts list with data
    console.log('\n📸 Capturing accounts list with data...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '11-accounts-with-data.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 11-accounts-with-data.png');

    // 12. Account detail view
    console.log('\n📸 Capturing account detail view...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts/test1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '12-account-detail.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 12-account-detail.png');

    // 13. Send email form
    console.log('\n📸 Sending test email and capturing...');
    try {
      // Send email via API
      const emailData = {
        from: { name: 'Test Sender', address: testAccounts[0].user },
        to: [{ address: testAccounts[1].user }],
        subject: 'Test Email for Documentation Screenshots',
        html: '<h1>Hello!</h1><p>This is a test email sent from EmailEngine for documentation purposes.</p><p>It includes <strong>HTML formatting</strong> and <a href="https://emailengine.app">links</a>.</p>',
        text: 'Hello! This is a test email sent from EmailEngine.'
      };

      await apiRequest('/v1/account/test1/submit', 'POST', emailData);
      console.log('   ✅ Test email sent');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      console.log('   ⚠️  Could not send test email:', e.message);
    }

    // 14. Messages list
    console.log('\n📸 Capturing messages list...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts/test2/messages`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '13-messages-list.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 13-messages-list.png');

    // 15. Message detail view (if messages exist)
    console.log('\n📸 Capturing message detail...');
    try {
      // Try to click first message
      const messages = await page.$$('.message-item, .list-group-item');
      if (messages.length > 0) {
        await messages[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '14-message-detail.png'),
          fullPage: true
        });
        console.log('   ✅ Saved: 14-message-detail.png');
      }
    } catch (e) {
      console.log('   ⚠️  Could not capture message detail');
    }

    // 16. Create template
    console.log('\n📸 Creating test template...');
    try {
      const templateData = {
        name: 'welcome-email',
        description: 'Welcome email template',
        format: 'html',
        subject: 'Welcome {{name}}!',
        html: '<h1>Welcome {{name}}!</h1><p>Thank you for joining us. Your account is {{account}}.</p>',
        text: 'Welcome {{name}}! Thank you for joining us.'
      };

      await apiRequest('/v1/templates/welcome-email', 'POST', templateData);
      console.log('   ✅ Template created');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.log('   ⚠️  Template may already exist');
    }

    // 17. Templates list with data
    await page.goto(`${EMAILENGINE_URL}/admin/templates`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '15-templates-with-data.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 15-templates-with-data.png');

    // 18. Template editor/detail
    console.log('\n📸 Capturing template editor...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/templates/welcome-email`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '16-template-editor.png'),
        fullPage: true
      });
      console.log('   ✅ Saved: 16-template-editor.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture template editor');
    }

    // 19. Bull Board with jobs
    console.log('\n📸 Capturing Bull Board with job data...');
    await page.goto(`${EMAILENGINE_URL}/admin/arena`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '17-bull-board-with-jobs.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 17-bull-board-with-jobs.png');

    // 20. Bull Board - Submit queue details
    console.log('\n📸 Capturing Submit queue...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/arena/submit`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '18-bull-board-submit-queue.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: 18-bull-board-submit-queue.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture submit queue');
    }

    // 21. Logs with actual entries
    console.log('\n📸 Capturing logs with data...');
    await page.goto(`${EMAILENGINE_URL}/admin/logs`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '19-logs-with-entries.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 19-logs-with-entries.png');

    // 22. OAuth2 apps - Add form
    console.log('\n📸 Capturing OAuth2 add form...');
    try {
      await page.goto(`${EMAILENGINE_URL}/admin/oauth/new`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '20-oauth-add-form.png'),
        fullPage: true
      });
      console.log('   ✅ Saved: 20-oauth-add-form.png');
    } catch (e) {
      console.log('   ⚠️  Could not capture OAuth add form');
    }

    // 23. Settings - Webhooks detail
    console.log('\n📸 Capturing webhooks settings detail...');
    await page.goto(`${EMAILENGINE_URL}/admin/config/webhooks`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '21-webhooks-settings-detail.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 21-webhooks-settings-detail.png');

    // 24. Account connection status indicators
    console.log('\n📸 Capturing account status indicators...');
    await page.goto(`${EMAILENGINE_URL}/admin/accounts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    // Zoom in on status badges
    await page.evaluate(() => {
      const badges = document.querySelectorAll('.badge, .status-indicator');
      if (badges.length > 0) {
        badges[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '22-account-status-indicators.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 22-account-status-indicators.png');

    console.log('\n✅ Detailed screenshot capture complete!');
    console.log(`   Total screenshots saved to: ${OUTPUT_DIR}`);
    console.log('\n📊 Summary:');
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    console.log(`   Total PNG files: ${files.length}`);

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the capture
captureDetailedScreenshots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
