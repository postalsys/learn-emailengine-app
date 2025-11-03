#!/usr/bin/env node

/**
 * Capture API response examples and webhook payloads for documentation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const EMAILENGINE_API = 'http://127.0.0.1:7003';
const WEBHOOK_URL = 'https://kreata.ee/s';
const WEBHOOK_READ_URL = 'https://kreata.ee/r';
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'screenshots');
const EXAMPLES_DIR = path.join(__dirname, '..', 'static', 'img', 'examples');

// Ensure directories exist
[OUTPUT_DIR, EXAMPLES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to make API requests
function apiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, EMAILENGINE_API);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Helper to create syntax-highlighted code screenshot
async function captureCodeExample(browser, title, code, language, filename) {
  const page = await browser.newPage();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #0d1117;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      overflow: hidden;
    }
    .header {
      background: #21262d;
      padding: 12px 16px;
      border-bottom: 1px solid #30363d;
      color: #c9d1d9;
      font-size: 14px;
      font-weight: 600;
    }
    pre {
      margin: 0;
      padding: 16px;
      overflow-x: auto;
    }
    code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">${title}</div>
    <pre><code class="language-${language}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
  </div>
  <script>hljs.highlightAll();</script>
</body>
</html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(EXAMPLES_DIR, filename),
    fullPage: false
  });
  await page.close();
  console.log(`   ✅ Saved: ${filename}`);
}

async function captureAPIExamples() {
  console.log('🚀 Starting API examples capture...');
  console.log(`   API: ${EMAILENGINE_API}`);
  console.log(`   Output: ${EXAMPLES_DIR}`);

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. List accounts response
    console.log('\n📸 Capturing List Accounts response...');
    const accountsResp = await apiRequest('/v1/accounts');
    await captureCodeExample(
      browser,
      'GET /v1/accounts - List All Accounts',
      JSON.stringify(accountsResp.data, null, 2),
      'json',
      'api-list-accounts.png'
    );

    // 2. Get single account response
    console.log('\n📸 Capturing Get Account response...');
    const accountResp = await apiRequest('/v1/account/test1');
    await captureCodeExample(
      browser,
      'GET /v1/account/:account - Get Account Details',
      JSON.stringify(accountResp.data, null, 2),
      'json',
      'api-get-account.png'
    );

    // 3. Create account request
    console.log('\n📸 Capturing Create Account request...');
    const createAccountPayload = {
      account: "example",
      name: "Example Account",
      email: "user@example.com",
      imap: {
        host: "imap.example.com",
        port: 993,
        secure: true,
        auth: {
          user: "user@example.com",
          pass: "app-specific-password"
        }
      },
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: {
          user: "user@example.com",
          pass: "app-specific-password"
        }
      }
    };
    await captureCodeExample(
      browser,
      'POST /v1/account - Create New Account',
      JSON.stringify(createAccountPayload, null, 2),
      'json',
      'api-create-account-request.png'
    );

    // 4. List messages response
    console.log('\n📸 Capturing List Messages response...');
    try {
      const messagesResp = await apiRequest('/v1/account/test2/messages');
      await captureCodeExample(
        browser,
        'GET /v1/account/:account/messages - List Messages',
        JSON.stringify(messagesResp.data, null, 2),
        'json',
        'api-list-messages.png'
      );
    } catch (e) {
      console.log('   ⚠️  Could not capture messages list');
    }

    // 5. Send email request
    console.log('\n📸 Capturing Send Email request...');
    const sendEmailPayload = {
      from: {
        name: "John Doe",
        address: "john@example.com"
      },
      to: [
        {
          name: "Jane Smith",
          address: "jane@example.com"
        }
      ],
      subject: "Meeting Tomorrow",
      html: "<h1>Hi Jane!</h1><p>Just confirming our meeting tomorrow at <strong>10 AM</strong>.</p>",
      text: "Hi Jane! Just confirming our meeting tomorrow at 10 AM."
    };
    await captureCodeExample(
      browser,
      'POST /v1/account/:account/submit - Send Email',
      JSON.stringify(sendEmailPayload, null, 2),
      'json',
      'api-send-email-request.png'
    );

    // 6. Send email response
    console.log('\n📸 Capturing Send Email response...');
    const sendEmailResponse = {
      "messageId": "<abc123@emailengine.app>",
      "queueId": "18f9a1234567890abcdef",
      "response": "250 2.0.0 OK  1234567890 abc-def",
      "accepted": ["jane@example.com"],
      "rejected": []
    };
    await captureCodeExample(
      browser,
      'POST /v1/account/:account/submit - Response',
      JSON.stringify(sendEmailResponse, null, 2),
      'json',
      'api-send-email-response.png'
    );

    // 7. Webhook: messageNew event
    console.log('\n📸 Capturing Webhook: messageNew event...');
    const webhookMessageNew = {
      "account": "test1",
      "event": "messageNew",
      "data": {
        "id": "AAAAAQAAAeE",
        "uid": 12345,
        "emailId": "abc123def456",
        "threadId": "thread789",
        "path": "INBOX",
        "date": "2025-10-24T14:30:00.000Z",
        "flags": ["\\Seen"],
        "unseen": false,
        "flagged": false,
        "draft": false,
        "from": {
          "name": "Jane Smith",
          "address": "jane@example.com"
        },
        "to": [{
          "name": "John Doe",
          "address": "john@example.com"
        }],
        "subject": "Re: Meeting Tomorrow",
        "messageId": "<reply123@example.com>",
        "inReplyTo": "<abc123@emailengine.app>",
        "text": "Sounds good! See you at 10 AM.",
        "html": ["<p>Sounds good! See you at 10 AM.</p>"]
      }
    };
    await captureCodeExample(
      browser,
      'Webhook Event: messageNew',
      JSON.stringify(webhookMessageNew, null, 2),
      'json',
      'webhook-message-new.png'
    );

    // 8. Webhook: messageUpdated event
    console.log('\n📸 Capturing Webhook: messageUpdated event...');
    const webhookMessageUpdated = {
      "account": "test1",
      "event": "messageUpdated",
      "data": {
        "id": "AAAAAQAAAeE",
        "uid": 12345,
        "changes": {
          "flags": {
            "added": ["\\Flagged"],
            "removed": [],
            "value": ["\\Seen", "\\Flagged"]
          }
        }
      }
    };
    await captureCodeExample(
      browser,
      'Webhook Event: messageUpdated',
      JSON.stringify(webhookMessageUpdated, null, 2),
      'json',
      'webhook-message-updated.png'
    );

    // 9. Webhook: messageSent event
    console.log('\n📸 Capturing Webhook: messageSent event...');
    const webhookMessageSent = {
      "account": "test1",
      "event": "messageSent",
      "data": {
        "queueId": "18f9a1234567890abcdef",
        "messageId": "<abc123@emailengine.app>",
        "from": "john@example.com",
        "to": ["jane@example.com"],
        "subject": "Meeting Tomorrow",
        "response": "250 2.0.0 OK  1234567890 abc-def",
        "date": "2025-10-24T14:25:00.000Z"
      }
    };
    await captureCodeExample(
      browser,
      'Webhook Event: messageSent',
      JSON.stringify(webhookMessageSent, null, 2),
      'json',
      'webhook-message-sent.png'
    );

    // 10. Search messages request
    console.log('\n📸 Capturing Search Messages request...');
    const searchPayload = {
      "search": {
        "from": "jane@example.com",
        "subject": "meeting",
        "seen": false
      }
    };
    await captureCodeExample(
      browser,
      'POST /v1/account/:account/search - Search Messages',
      JSON.stringify(searchPayload, null, 2),
      'json',
      'api-search-request.png'
    );

    // 11. cURL example - Create account
    console.log('\n📸 Capturing cURL example...');
    const curlExample = `curl -X POST http://localhost:3000/v1/account \\
  -H "Content-Type: application/json" \\
  -d '{
    "account": "example",
    "name": "Example Account",
    "email": "user@example.com",
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "user@example.com",
        "pass": "app-specific-password"
      }
    },
    "smtp": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "user@example.com",
        "pass": "app-specific-password"
      }
    }
  }'`;
    await captureCodeExample(
      browser,
      'cURL Example: Create Account',
      curlExample,
      'bash',
      'curl-create-account.png'
    );

    // 12. Error response example
    console.log('\n📸 Capturing Error response...');
    const errorResponse = {
      "error": "Account not found",
      "code": "AccountNotFound",
      "statusCode": 404,
      "details": {
        "account": "nonexistent"
      }
    };
    await captureCodeExample(
      browser,
      'Error Response Example',
      JSON.stringify(errorResponse, null, 2),
      'json',
      'api-error-response.png'
    );

    console.log('\n✅ API examples capture complete!');
    const files = fs.readdirSync(EXAMPLES_DIR).filter(f => f.endsWith('.png'));
    console.log(`   Total example screenshots: ${files.length}`);

  } catch (error) {
    console.error('❌ Error during API examples capture:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the capture
captureAPIExamples().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
