#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
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
    console.log('Navigating to webhooks configuration page...');
    await page.goto('https://localdev.kreata.ee/admin/config/webhooks', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    console.log('Capturing screenshot...');
    await page.screenshot({
      path: '/Users/andris/Projects/emailengine-docu/static/img/screenshots/05-webhooks-config.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: 05-webhooks-config.png');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await browser.close();
  }
})();
