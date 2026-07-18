#!/usr/bin/env node

'use strict';

/*
 * Screenshot capture for the EmailEngine documentation.
 *
 * Regenerates the admin UI and hosted authentication form screenshots that the
 * docs reference (static/img/screenshots). Targets a RUNNING EmailEngine
 * instance - ideally a fresh throwaway one, since staging creates demo data
 * (OAuth2 stub apps, an Ethereal IMAP account, a template, a submitted
 * message) that you would not want on a real install.
 *
 * Configuration (environment variables):
 *   EE_URL       Base URL of the instance (default http://127.0.0.1:3000)
 *   EE_USERNAME  Admin username for /admin/login (default "admin")
 *   EE_PASSWORD  Admin password; omit if the instance has authentication
 *                disabled
 *   EE_TOKEN     API access token; required - used for staging the demo data
 *                and for generating the hosted authentication form URLs
 *   EE_STAGE     Set to "false" to skip demo-data staging (the instance must
 *                then already contain the data the screenshots need)
 *
 * Example against a local dev instance:
 *   EE_URL=http://127.0.0.1:7003 EE_PASSWORD=... EE_TOKEN=... \
 *     node scripts/capture-screenshots.js
 *
 * The webhook-routing screenshots (static/img/screenshots/webhooks) are
 * captured separately by capture-webhook-routing.js.
 */

const fs = require('fs');
const path = require('path');

// the docs repo does not depend on Playwright directly; use whichever
// Playwright package is resolvable (e.g. via NODE_PATH from the EmailEngine
// checkout, which has @playwright/test installed)
let chromium;
try {
    ({ chromium } = require('playwright'));
} catch (err) {
    ({ chromium } = require('@playwright/test'));
}

const EE_URL = (process.env.EE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const EE_USERNAME = process.env.EE_USERNAME || 'admin';
const EE_PASSWORD = process.env.EE_PASSWORD || '';
const EE_TOKEN = process.env.EE_TOKEN || '';
const EE_STAGE = process.env.EE_STAGE !== 'false';

const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'screenshots');
const VIEWPORT = { width: 1600, height: 900 };

const DEMO_ACCOUNT = 'docs-demo-account';
const DEMO_TEMPLATE_NAME = 'Welcome email';

if (!EE_TOKEN) {
    console.error('EE_TOKEN is required (staging and hosted-form URL generation use the REST API)');
    process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function api(context, method, apiPath, data) {
    const res = await context.request.fetch(`${EE_URL}${apiPath}`, {
        method,
        headers: {
            Authorization: `Bearer ${EE_TOKEN}`,
            'Content-Type': 'application/json'
        },
        data
    });
    if (!res.ok()) {
        throw new Error(`${method} ${apiPath} -> HTTP ${res.status()}: ${await res.text()}`);
    }
    return res.json();
}

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

async function shot(page, url, file, opts) {
    opts = opts || {};
    if (url) {
        await page.goto(`${EE_URL}${url}`, { waitUntil: 'load' });
    }
    await page.waitForTimeout(opts.settle || 750);
    await page.screenshot({ path: path.join(OUTPUT_DIR, file), fullPage: !!opts.fullPage });
    console.log(`Saved: ${file}`);
}

// Provision an Ethereal test account (https://ethereal.email) - safe test
// credentials; anything it "sends" loops back into its own inbox
async function createEtherealAccount(context) {
    const res = await context.request.post('https://api.nodemailer.com/user', {
        headers: { 'Content-Type': 'application/json' },
        data: { requestor: 'emailengine-docs-screenshots', version: '1.0.0' }
    });
    if (!res.ok()) {
        throw new Error(`Ethereal account provisioning failed: HTTP ${res.status()}`);
    }
    return res.json();
}

// Create the demo data the admin screenshots rely on: two OAuth2 stub apps
// (so the hosted form shows provider buttons), one connected IMAP account,
// one stored template and one submitted message (queue/dashboard content)
async function stageDemoData(context, ethereal) {
    // OAuth2 stub apps - dummy credentials; only their chooser buttons matter
    const existingApps = await api(context, 'GET', '/v1/oauth2');
    const haveProvider = provider => (existingApps.apps || []).some(app => app.provider === provider);

    if (!haveProvider('gmail')) {
        await api(context, 'POST', '/v1/oauth2', {
            name: 'Gmail',
            provider: 'gmail',
            enabled: true,
            clientId: 'demo-client-id.apps.googleusercontent.com',
            clientSecret: 'demo-client-secret',
            redirectUrl: `${EE_URL}/oauth`,
            baseScopes: 'imap'
        });
        console.log('Staged: Gmail OAuth2 stub app');
    }

    if (!haveProvider('outlook')) {
        await api(context, 'POST', '/v1/oauth2', {
            name: 'Outlook',
            provider: 'outlook',
            enabled: true,
            clientId: 'demo-client-id',
            clientSecret: 'demo-client-secret',
            authority: 'common',
            redirectUrl: `${EE_URL}/oauth`,
            baseScopes: 'imap'
        });
        console.log('Staged: Outlook OAuth2 stub app');
    }

    // connected IMAP account (Ethereal)
    await api(context, 'POST', '/v1/account', {
        account: DEMO_ACCOUNT,
        name: 'John Doe',
        email: ethereal.user,
        imap: {
            host: ethereal.imap.host,
            port: ethereal.imap.port,
            secure: !!ethereal.imap.secure,
            auth: { user: ethereal.user, pass: ethereal.pass }
        },
        smtp: {
            host: ethereal.smtp.host,
            port: ethereal.smtp.port,
            secure: !!ethereal.smtp.secure,
            auth: { user: ethereal.user, pass: ethereal.pass }
        }
    });
    console.log(`Staged: IMAP account ${DEMO_ACCOUNT} (${ethereal.user})`);

    // wait for the account to connect
    const started = Date.now();
    for (;;) {
        const info = await api(context, 'GET', `/v1/account/${DEMO_ACCOUNT}`);
        if (info.state === 'connected') {
            break;
        }
        if (Date.now() - started > 120000) {
            throw new Error(`Account did not reach connected state (last state: ${info.state})`);
        }
        await sleep(2000);
    }
    console.log('Staged: account is connected');

    // stored template
    const templates = await api(context, 'GET', '/v1/templates');
    if (!(templates.templates || []).some(tmpl => tmpl.name === DEMO_TEMPLATE_NAME)) {
        await api(context, 'POST', '/v1/templates/template', {
            account: null, // shared template, not bound to one account
            name: DEMO_TEMPLATE_NAME,
            description: 'Greeting sent to new users',
            format: 'html',
            content: {
                subject: 'Welcome to Example App, {{name}}!',
                html: '<p>Hello {{name}},</p><p>Thanks for signing up. Your account is ready to use.</p><p>The Example App team</p>'
            }
        });
        console.log('Staged: message template');
    }

    // a submitted message: populates the submit queue view and the dashboard
    // counters (Ethereal delivers it back to the account's own inbox)
    await api(context, 'POST', `/v1/account/${DEMO_ACCOUNT}/submit`, {
        from: { name: 'John Doe', address: ethereal.user },
        to: [{ name: 'John Doe', address: ethereal.user }],
        subject: 'Monthly report',
        text: 'The monthly report is attached.',
        html: '<p>The monthly report is attached.</p>'
    });
    console.log('Staged: submitted a demo message');
    await sleep(8000); // allow delivery so the queue shows a completed job
}

// Generate a hosted authentication form URL and rebase it onto EE_URL (the
// instance builds it from its public serviceUrl; the signed blob itself is
// host-independent)
async function hostedFormUrl(context, payload) {
    const data = await api(context, 'POST', '/v1/authentication/form', payload);
    const generated = new URL(data.url);
    return `${EE_URL}${generated.pathname}${generated.search}`;
}

async function captureScreenshots() {
    console.log(`Target: ${EE_URL}`);
    console.log(`Output: ${OUTPUT_DIR}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    try {
        await login(page);

        // accounts list in its empty state, before staging
        const accounts = await api(context, 'GET', '/v1/accounts');
        if (!accounts.total) {
            await shot(page, '/admin/accounts', '02-accounts-list.png');
        } else {
            console.log('Skipped 02-accounts-list.png (instance already has accounts)');
        }

        let ethereal;
        if (EE_STAGE) {
            console.log('Staging demo data...');
            ethereal = await createEtherealAccount(context);
            await stageDemoData(context, ethereal);
        } else {
            ethereal = await createEtherealAccount(context); // still needed for the hosted form shots
        }

        await shot(page, '/admin', '01-dashboard-main.png');
        await shot(page, '/admin/accounts', '11-accounts-with-data.png');
        await shot(page, `/admin/accounts/${DEMO_ACCOUNT}`, '12-account-detail.png');
        await shot(page, '/admin/config/webhooks', '05-webhooks-config.png');
        await shot(page, '/admin/templates', '15-templates-with-data.png');

        // template editor, resolved through the API (the list rows use overlay
        // links without text, so id-based navigation is the stable path)
        const templateList = await api(context, 'GET', '/v1/templates');
        const demoTemplate = (templateList.templates || []).find(tmpl => tmpl.name === DEMO_TEMPLATE_NAME);
        if (demoTemplate) {
            await shot(page, `/admin/templates/template/${demoTemplate.id}/edit`, '16-template-editor.png', { settle: 1500 });
        } else {
            console.log('Skipped 16-template-editor.png (demo template not found)');
        }

        await shot(page, '/admin/bull-board', '17-bull-board-with-jobs.png', { settle: 2000 });
        await shot(page, '/admin/bull-board/queue/submit', '18-bull-board-submit-queue.png', { settle: 2000 });

        // hosted authentication form: provider chooser
        const chooserUrl = await hostedFormUrl(context, {
            name: 'John Doe',
            email: ethereal.user,
            redirectUrl: `${EE_URL}/admin`
        });
        await page.goto(chooserUrl, { waitUntil: 'load' });
        await shot(page, null, '03-account-type-selection.png');

        // hosted authentication form: IMAP/SMTP server settings. Autodetection
        // does not know ethereal.email, so fill the server fields the way a
        // user would before taking the shot
        const imapFormUrl = await hostedFormUrl(context, {
            name: 'John Doe',
            email: ethereal.user,
            type: 'imap',
            redirectUrl: `${EE_URL}/admin`
        });
        await page.goto(imapFormUrl, { waitUntil: 'load' });
        await page.fill('#password', ethereal.pass);
        await page.click('form[action="/accounts/new/imap"] button[type="submit"]');
        await page.waitForSelector('#imap_host', { timeout: 30000 });

        for (let [selector, value] of [
            ['#imap_auth_user', ethereal.user],
            ['#imap_auth_pass', ethereal.pass],
            ['#imap_host', ethereal.imap.host],
            ['#imap_port', String(ethereal.imap.port)],
            ['#smtp_auth_user', ethereal.user],
            ['#smtp_auth_pass', ethereal.pass],
            ['#smtp_host', ethereal.smtp.host],
            ['#smtp_port', String(ethereal.smtp.port)]
        ]) {
            await page.fill(selector, value);
        }
        await page.locator('#imap_secure').setChecked(!!ethereal.imap.secure);
        await page.locator('#smtp_secure').setChecked(!!ethereal.smtp.secure);
        await shot(page, null, '04-account-add-form.png');

        console.log('Screenshot capture complete');
    } finally {
        await browser.close();
    }
}

captureScreenshots().catch(err => {
    console.error(err);
    process.exit(1);
});
