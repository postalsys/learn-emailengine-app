#!/usr/bin/env node

'use strict';

/*
 * Screenshot capture for the MCP documentation (docs/mcp/*).
 *
 * Regenerates the admin UI screenshots the MCP pages reference:
 *
 *   mcp-settings.png           Configuration > MCP, Settings tab
 *   mcp-connect-token.png      Connect an agent > Desktop and self-hosted agents
 *   mcp-connect-generated.png  the same panel after generating a connection command
 *   mcp-connect-oauth.png      Connect an agent > Web connectors
 *   mcp-tools-catalog.png      the Exposed tools catalog, expanded
 *   mcp-oauth-consent.png      the OAuth consent prompt at /admin/mcp/authorize
 *   mcp-token-form.png         Access Tokens > new token, with the MCP scope ticked
 *   mcp-tokens-list.png        Access Tokens filtered to the mcp scope
 *
 * Targets a RUNNING EmailEngine instance, ideally a throwaway one: the script
 * turns the MCP endpoint and its OAuth sign-in ON, mints a handful of
 * mcp-scoped access tokens, and registers a dynamic OAuth client. None of that
 * is something you want on a real install.
 *
 * Configuration (environment variables):
 *   EE_URL       Base URL of the instance (default http://127.0.0.1:7003)
 *   EE_USERNAME  Admin username for /admin/login (default "admin")
 *   EE_PASSWORD  Admin password; required - every screenshot here needs an
 *                authenticated admin session, since minting a token and
 *                approving a client both refuse without one
 *   EE_ACCOUNT   Account id used in the "limit to one account" fields
 *                (default "docs-demo-account"; ignored if no such account
 *                exists on the instance)
 *
 * Example against a local dev instance:
 *   EE_URL=http://127.0.0.1:7003 EE_PASSWORD=... node scripts/capture-mcp-screenshots.js
 *
 * The generated access token is REDACTED in mcp-connect-generated.png: the real
 * value is swapped for an obvious placeholder in the DOM before the shot, so a
 * published screenshot never carries a live-looking credential.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// the docs repo does not depend on Playwright directly; use whichever
// Playwright package is resolvable (e.g. via NODE_PATH from the EmailEngine
// checkout, which has @playwright/test installed)
let chromium;
try {
    ({ chromium } = require('playwright'));
} catch (err) {
    ({ chromium } = require('@playwright/test'));
}

const EE_URL = (process.env.EE_URL || 'http://127.0.0.1:7003').replace(/\/+$/, '');
const EE_USERNAME = process.env.EE_USERNAME || 'admin';
const EE_PASSWORD = process.env.EE_PASSWORD || '';
const EE_ACCOUNT = process.env.EE_ACCOUNT || 'docs-demo-account';

const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'screenshots');
const VIEWPORT = { width: 1600, height: 900 };

// What the redacted token in mcp-connect-generated.png reads as. Same length as
// a real token so the code block wraps the way it does in practice.
const REDACTED_TOKEN = 'REDACTED0000000000000000000000000000000000000000000000000000TOKEN';

// The client the consent screenshot is taken for. A web connector is the only
// thing that uses this flow, so the example is one.
const OAUTH_CLIENT_NAME = 'Claude';
const OAUTH_REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback';

if (!EE_PASSWORD) {
    console.error('EE_PASSWORD is required (token minting and client approval both need an admin session)');
    process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function login(page) {
    await page.goto(`${EE_URL}/admin`, { waitUntil: 'load' });
    if (!page.url().includes('/admin/login')) {
        console.log('No login required');
        return;
    }
    console.log('Logging in...');
    await page.fill('#loginUsername', EE_USERNAME);
    await page.fill('#loginPassword', EE_PASSWORD);
    await page.click('form[action="/admin/login"] button[type="submit"]');
    await page.waitForURL(url => !url.pathname.startsWith('/admin/login'), { timeout: 15000 });
}

/*
 * opts.scrollTo   scroll offset before a viewport shot, so a card lower down
 *                 the page is captured whole
 * opts.fullPage   capture the whole page. The admin sidebar is position:fixed,
 *                 so the page is scrolled back to the top first - a full-page
 *                 capture taken while scrolled paints the sidebar halfway down
 *                 the image
 * opts.element    capture just this element instead of the viewport
 */
async function shot(page, file, opts) {
    opts = opts || {};

    if (opts.fullPage) {
        await page.evaluate(() => window.scrollTo(0, 0));
    } else if (opts.scrollTo !== undefined) {
        await page.evaluate(offset => window.scrollTo(0, offset), opts.scrollTo);
    }

    await page.waitForTimeout(opts.settle || 750);

    const target = opts.element ? await page.$(opts.element) : page;
    if (!target) {
        throw new Error(`No element matching ${opts.element}`);
    }

    await target.screenshot({ path: path.join(OUTPUT_DIR, file), fullPage: opts.element ? undefined : !!opts.fullPage });
    console.log(`Saved: ${file}`);
}

// Picks an account in a ui/account-picker field. The field is a search box over
// GET /admin/accounts/suggestions, not a text input: the posted value lives in a
// hidden input under `id`, and typing into that directly would leave the picker
// showing nothing.
async function pickAccount(page, id, account) {
    await page.fill(`#${id}-search`, account);
    const option = page.locator(`#${id}-results .ee-account-picker-option`).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
    await page.waitForFunction(inputId => !!document.getElementById(inputId).value, id, { timeout: 5000 });
}

// The admin pages post their CSRF crumb both as a form field and as a header
async function crumbOf(page) {
    const crumb = await page.getAttribute('#crumb', 'value');
    if (!crumb) {
        throw new Error('No CSRF crumb on the page');
    }
    return crumb;
}

// Mints an access token through the admin UI endpoint. The REST API declines an
// instance-wide token that carries no permissions record, and the "full access"
// MCP level is exactly that, so the admin route is the one that can mint every
// shape the tokens listing should show.
async function mintToken(page, payload) {
    const crumb = await crumbOf(page);
    const res = await page.request.post(`${EE_URL}/admin/tokens/new`, {
        headers: { 'X-CSRF-Token': crumb, 'Content-Type': 'application/json' },
        data: Object.assign({ crumb }, payload)
    });
    const body = await res.json();
    if (!body.success) {
        throw new Error(`Token mint failed: ${JSON.stringify(body)}`);
    }
    return body.token;
}

// Every run mints tokens, so a second run would otherwise show the listing
// growing a duplicate set of rows. Only mcp-scoped tokens are touched.
async function clearMcpTokens(page) {
    await page.goto(`${EE_URL}/admin/tokens?scope=mcp`, { waitUntil: 'load' });
    const ids = await page.$$eval('.list-delete-btn[data-delete-id]', buttons => buttons.map(button => button.dataset.deleteId));
    if (!ids.length) {
        return;
    }

    const crumb = await crumbOf(page);
    for (const id of ids) {
        await page.request.post(`${EE_URL}/admin/tokens/delete`, {
            headers: { 'X-CSRF-Token': crumb },
            form: { crumb, token: id },
            maxRedirects: 0
        });
    }
    // Each delete queues a "Token deleted" flash. They are one-shot, so one
    // throwaway page load drains them before the first screenshot.
    await page.goto(`${EE_URL}/admin/tokens`, { waitUntil: 'load' });
    console.log(`Removed ${ids.length} existing mcp-scoped token(s)`);
}

async function accountExists(page, account) {
    const res = await page.request.get(`${EE_URL}/admin/accounts?query=${encodeURIComponent(account)}`);
    return res.ok() && (await res.text()).includes(account);
}

// Turns the endpoint and its OAuth sign-in on through the settings form itself,
// so the Settings screenshot shows the state the rest of the shots depend on
async function enableMcp(page) {
    await page.goto(`${EE_URL}/admin/config/mcp`, { waitUntil: 'load' });

    const needsSave = await page.evaluate(() => {
        const endpoint = document.getElementById('settingsMcpEnabled');
        const oauth = document.getElementById('settingsMcpOAuthEnabled');
        const changed = !endpoint.checked || !oauth.checked;
        endpoint.checked = true;
        oauth.checked = true;
        return changed;
    });

    if (needsSave) {
        await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('form[action="/admin/config/mcp"] button[type="submit"]')]);
        console.log('Enabled the MCP endpoint and OAuth sign-in');
    }
}

// Opens a ui/details card by its summary text. The cards carry no ids.
async function openDetails(page, summaryText) {
    await page.evaluate(text => {
        for (const details of document.querySelectorAll('details')) {
            const summary = details.querySelector('summary');
            if (summary && summary.textContent.includes(text)) {
                details.open = true;
            }
        }
    }, summaryText);
}

async function captureConfigPage(page, account) {
    await enableMcp(page);

    // 1. Settings tab
    await shot(page, 'mcp-settings.png');

    // 2. Connect an agent > Desktop and self-hosted agents
    await page.click('#mcp-connect-tab');
    await page.waitForTimeout(400);
    await page.fill('#mcpGenLabel', 'Claude Code on my laptop');
    if (account) {
        await pickAccount(page, 'mcpGenAccount', account);
    }
    await page.check('#mcpGenAccessread');
    await shot(page, 'mcp-connect-token.png', { fullPage: true });

    // 3. the same panel after generating a connection command
    await page.click('#mcpGenSubmit');
    await page.waitForSelector('#mcpGenResult:not(.hidden)', { timeout: 15000 });
    await page.evaluate(redacted => {
        for (const id of ['mcpGenJsonCfg', 'mcpGenClaudeCmd']) {
            const elm = document.getElementById(id);
            elm.textContent = elm.textContent.replace(/\b[0-9a-f]{64}\b/g, redacted);
        }
    }, REDACTED_TOKEN);
    // scrolled to the bottom of the panel, where the generated configuration is
    await shot(page, 'mcp-connect-generated.png', { scrollTo: 100000 });

    // 4. Connect an agent > Web connectors
    await page.click('#mcp-connect-oauth-tab');
    await shot(page, 'mcp-connect-oauth.png', { scrollTo: 140 });

    // 5. the tool catalog, expanded. Captured as the card alone: fifteen tools
    // are taller than the viewport, and a full-page shot of the tab would be
    // mostly the generator above it.
    await openDetails(page, 'Exposed tools');
    await shot(page, 'mcp-tools-catalog.png', { element: 'details:has(summary:text-matches("Exposed tools"))' });
}

// The consent prompt. Registering a client is an unauthenticated call, exactly
// as a real MCP client makes it; the authorization request is then composed the
// way the client would compose it.
async function captureConsentPage(page, account) {
    const registration = await page.request.post(`${EE_URL}/mcp/oauth/register`, {
        headers: { 'Content-Type': 'application/json' },
        data: { redirect_uris: [OAUTH_REDIRECT_URI], client_name: OAUTH_CLIENT_NAME }
    });
    if (!registration.ok()) {
        throw new Error(`Client registration failed: HTTP ${registration.status()} ${await registration.text()}`);
    }
    const client = await registration.json();

    const verifier = crypto.randomBytes(48).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

    const params = new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: OAUTH_REDIRECT_URI,
        response_type: 'code',
        state: crypto.randomBytes(12).toString('base64url'),
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: `${EE_URL}/mcp`
    });

    await page.goto(`${EE_URL}/admin/mcp/authorize?${params.toString()}`, { waitUntil: 'load' });
    if (account) {
        await pickAccount(page, 'account', account);
        // the tool count follows the field; let it repaint
        await page.waitForTimeout(300);
    }
    await shot(page, 'mcp-oauth-consent.png', { fullPage: true });
}

async function captureTokenPages(page, account) {
    // The new-token form in MCP mode: ticking the scope swaps the permission
    // editor for the three access levels and the tool count
    await page.goto(`${EE_URL}/admin/tokens/new`, { waitUntil: 'load' });
    await page.fill('#description', 'Inbox triage agent');
    // "All scopes" is the default; the MCP-only shape is what the docs describe
    await page.uncheck('#scopesAll');
    await page.check('#scopesMcp');
    if (account) {
        await pickAccount(page, 'account', account);
    }
    await page.waitForTimeout(500);
    await shot(page, 'mcp-token-form.png', { fullPage: true });

    // A couple more rows so the filtered listing shows the shapes the docs
    // describe rather than the single token the generator above created
    await mintToken(page, {
        description: 'MCP: Inbox triage agent',
        scopes: ['mcp'],
        account: account || '',
        permissions: { actions: ['read', 'write', 'send'], groups: ['account', 'mailbox', 'message', 'submit', 'outbox', 'template'] }
    });
    await mintToken(page, {
        description: 'MCP: Claude',
        scopes: ['mcp'],
        account: '',
        permissions: { actions: ['read'], groups: ['account', 'mailbox', 'message', 'outbox', 'template'] }
    });

    await page.goto(`${EE_URL}/admin/tokens?scope=mcp`, { waitUntil: 'load' });
    await shot(page, 'mcp-tokens-list.png');
}

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
    const context = await browser.newContext({ viewport: VIEWPORT, ignoreHTTPSErrors: true });
    const page = await context.newPage();

    try {
        await login(page);

        const account = (await accountExists(page, EE_ACCOUNT)) ? EE_ACCOUNT : null;
        if (!account) {
            console.log(`No account "${EE_ACCOUNT}" on this instance - the account fields stay empty`);
        }

        await clearMcpTokens(page);

        await captureConfigPage(page, account);
        await captureConsentPage(page, account);
        await captureTokenPages(page, account);
    } finally {
        await browser.close();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
