#!/usr/bin/env node

'use strict';

/*
 * Live verification for region-based pricing across the three moving parts:
 * postalsys.com/region.js (the producer), emailengine.app (the price card and
 * FAQ), and learn.emailengine.app (the <Price /> parenthetical).
 *
 * Almost nothing here is hardcoded. The expected figures are derived from
 * whatever the live payload currently says, the authored fallbacks are scraped
 * from the raw HTML, the stubbed scenarios are built by mutating the live
 * payload, and the docs page list and per-page counts are scanned out of
 * docs/. That is what lets this survive a price change, run from any country,
 * and keep covering a seventh page the day one starts using <Price />.
 *
 * Because the expectations come from the working tree but the assertions run
 * against production, this is a post-deploy gate. Run it on a branch whose
 * docs are ahead of the deploy and the counts will legitimately disagree.
 *
 * The machine running this is normally in the EU, so the live currency will be
 * EUR. The USD path is covered by stubbing the route rather than by pretending
 * to be somewhere else.
 *
 * Configuration (environment variables):
 *   ALLOW_MISSING_FORMATTED
 *                   Tolerate a payload with no `formatted` key, and skip the
 *                   scenarios that exercise it. Needed only while the rollout
 *                   is in progress: pass it until postalsys-web ships
 *                   `formatted`, then stop. Once nobody passes it any more,
 *                   delete the flag along with the pre-rollout branch of
 *                   figureFor().
 *   REGION_URL      default https://postalsys.com/region.js
 *   MARKETING_URL   default https://emailengine.app/
 *   DOCS_URL        default https://learn.emailengine.app
 *
 * Needs a downloaded Chromium in addition to the playwright devDependency:
 * npx playwright install chromium
 *
 * Example:
 *   npm run verify-pricing
 *   ALLOW_MISSING_FORMATTED=1 npm run verify-pricing
 */

const fs = require('fs');
const path = require('path');

// use whichever Playwright package is resolvable (see capture-screenshots.js)
let chromium;
let request;
try {
    ({ chromium, request } = require('playwright'));
} catch (err) {
    ({ chromium, request } = require('@playwright/test'));
}

const REGION_URL = process.env.REGION_URL || 'https://postalsys.com/region.js';
const MARKETING_URL = (process.env.MARKETING_URL || 'https://emailengine.app/').replace(/\/+$/, '') + '/';
const DOCS_URL = (process.env.DOCS_URL || 'https://learn.emailengine.app').replace(/\/+$/, '');
const ALLOW_MISSING_FORMATTED = /^(1|true|yes)$/i.test(process.env.ALLOW_MISSING_FORMATTED || '');

// The only hardcoded presentation detail, and it belongs here: a verifier that
// computes its expectation by calling the code under test asserts nothing. The
// point of the change is to delete this map from the two consumers, where it
// produces user-visible output and where two copies can drift. A currency the
// server starts sending that is not listed skips its symbol check rather than
// failing, so adding one is not gated on updating this script.
const SYMBOLS = { eur: '€', usd: '$' };

// Upper bound on a plausible public price. Its real home is postalsys-web,
// which withholds the whole price block when a price fails it; asserting it
// here as well is an independent check, not a second copy of the policy.
const PRICE_MAX = 20000;

const REGION_BODY_RE = /^window\.PSYS_REGION\s*=\s*(\{[\s\S]*\});\s*$/;

// Margin after the payload has demonstrably been processed. A negative
// assertion ("nothing rendered") has no event to wait for, and erring short
// here would turn a real regression into a false pass.
const SETTLE_MS = 250;

// Per-page facts that cannot be scanned out of the sources: a prose fragment
// that survives the markdown transform (used to prove the static bytes carry
// the authored sentence), how many usages sit inside table cells, and whether
// to reuse the page in the failure scenarios.
const PAGE_META = {
    '/docs': { authored: 'uses flat annual pricing' },
    '/docs/licensing': { authored: 'Flat annual subscription', sample: true },
    '/docs/email-api': { authored: 'Flat annual fee', inTable: 1 },
    '/docs/getting-started/introduction': { authored: 'get a license key' },
    '/docs/comparison/emailengine-vs-nylas': { authored: 'Flat yearly license', sample: true, inTable: 2 },
    '/docs/comparison/emailengine-vs-unipile': { authored: 'Flat yearly license', inTable: 2 }
};

// Third parties that have nothing to do with pricing. frame.js is matched
// exactly: a postalsys.com prefix would swallow region.js.
const NOISE = [
    /^https:\/\/www\.googletagmanager\.com\//,
    /^https:\/\/plausible\.emailengine\.dev\//,
    /^https:\/\/widget\.senja\.io\//,
    /^https:\/\/fonts\.googleapis\.com\//,
    /^https:\/\/fonts\.gstatic\.com\//,
    /^https:\/\/postalsys\.com\/frame\.js$/
];

let failures = 0;
let checks = 0;

function check(name, ok, detail) {
    checks++;
    if (ok) {
        console.log(`  ok    ${name}`);
        return true;
    }
    failures++;
    console.log(`  FAIL  ${name}${detail === undefined ? '' : ` -- ${detail}`}`);
    return false;
}

function section(title) {
    console.log(`\n${title}`);
}

const countOf = (haystack, needle) => haystack.split(needle).length - 1;
const needleFor = figure => ` (${figure} per year)`;
const PARENTHETICAL_RE = / \(.+? per year\)/;

const hasEurClass = page => page.evaluate(() => document.documentElement.classList.contains('currency-eur'));

const marketingSpanTexts = page =>
    page.evaluate(() => {
        const out = {};
        document.querySelectorAll('[data-price]').forEach(el => {
            out[el.getAttribute('data-price')] = el.textContent;
        });
        return out;
    });

// URL a docs source file is published at, honouring a frontmatter slug.
function urlForDoc(root, file, source) {
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
    const slug = frontmatter && frontmatter[1].match(/^slug:\s*(\S+)/m);
    if (slug) {
        return `/docs${slug[1] === '/' ? '' : slug[1]}`.replace(/\/+$/, '');
    }
    const rel = path
        .relative(root, file)
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '');
    return `/docs${rel ? `/${rel}` : ''}`;
}

// Scanned rather than restated: a hardcoded page list fails by omission, so a
// seventh page picking up <Price /> would silently drop out of this gate
// without anything going red. This is the same grep CLAUDE.md rule 8 names.
function scanDocPages() {
    const root = path.join(__dirname, '..', 'docs');
    const pages = [];

    const walk = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
                continue;
            }
            if (!/\.mdx?$/.test(entry.name)) {
                continue;
            }
            const source = fs.readFileSync(full, 'utf8');
            const count = (source.match(/<Price\s*\/>/g) || []).length;
            if (count) {
                const url = urlForDoc(root, full, source);
                pages.push(Object.assign({ path: url, count }, PAGE_META[url]));
            }
        }
    };

    walk(root);
    return pages.sort((a, b) => a.path.localeCompare(b.path));
}

// What a consumer should be displaying for a currency. Before the server ships
// `formatted` this is what the consumers compute themselves; after, it is what
// the server sends. Both must agree, which is what makes one script correct at
// every gate. The second branch dies with ALLOW_MISSING_FORMATTED.
function figureFor(payload, currency) {
    if (payload.formatted && typeof payload.formatted[currency] === 'string') {
        return payload.formatted[currency];
    }
    if (payload.prices && typeof payload.prices[currency] === 'number') {
        return SYMBOLS[currency] + payload.prices[currency];
    }
    return null;
}

function parseRegionBody(body) {
    const match = body.match(REGION_BODY_RE);
    if (!match) {
        return null;
    }
    try {
        return JSON.parse(match[1]);
    } catch (err) {
        return null;
    }
}

const regionScript = payload => `window.PSYS_REGION = ${JSON.stringify(payload)};`;

async function fetchLivePayload() {
    section('Section 1: region.js payload');

    const api = await request.newContext();
    let res;
    try {
        res = await api.get(REGION_URL);
    } catch (err) {
        check('region.js is reachable', false, err.message);
        await api.dispose();
        return null;
    }

    check('region.js returns 200', res.status() === 200, `status ${res.status()}`);
    const contentType = res.headers()['content-type'] || '';
    check('content-type is javascript', contentType.startsWith('application/javascript'), contentType);
    check('cache-control unchanged', (res.headers()['cache-control'] || '') === 'private, max-age=86400', res.headers()['cache-control']);

    const body = await res.text();
    await api.dispose();

    const payload = parseRegionBody(body);
    if (!check('body is a single PSYS_REGION assignment that parses', !!payload, JSON.stringify(body.slice(0, 200)))) {
        return null;
    }

    console.log(`        payload: ${JSON.stringify(payload)}`);

    check('currency is eur or usd', payload.currency === 'eur' || payload.currency === 'usd', payload.currency);
    check('country is a string or null', payload.country === null || typeof payload.country === 'string', String(payload.country));

    // The contract that makes old and new consumers fail closed identically.
    check('formatted never appears without prices', !payload.formatted || !!payload.prices, `prices=${!!payload.prices} formatted=${!!payload.formatted}`);
    if (!ALLOW_MISSING_FORMATTED) {
        check('prices and formatted ship together', !!payload.prices === !!payload.formatted, `prices=${!!payload.prices} formatted=${!!payload.formatted}`);
    }

    for (const currency of Object.keys(payload.prices || {})) {
        const amount = payload.prices[currency];
        check(`prices.${currency} is a number inside the band`, typeof amount === 'number' && amount > 0 && amount <= PRICE_MAX, String(amount));
    }

    if (payload.formatted) {
        const priceKeys = Object.keys(payload.prices || {}).sort().join(',');
        const formattedKeys = Object.keys(payload.formatted).sort().join(',');
        check('formatted covers exactly the same currencies as prices', priceKeys === formattedKeys, `${priceKeys} vs ${formattedKeys}`);

        for (const currency of Object.keys(payload.formatted)) {
            const text = payload.formatted[currency];
            if (!check(`formatted.${currency} is a short non-empty string`, typeof text === 'string' && text.length > 0 && text.length < 24, JSON.stringify(text))) {
                continue;
            }

            if (SYMBOLS[currency]) {
                check(`formatted.${currency} leads with its currency symbol`, text.startsWith(SYMBOLS[currency]), JSON.stringify(text));
            }

            // Catches cents leaking in (a stray 99500), a swapped symbol, or a
            // stray decimal, while tolerating thousands separators.
            if (payload.prices) {
                const digits = Number(text.replace(/[^0-9.]/g, ''));
                check(`formatted.${currency} matches prices.${currency}`, digits === payload.prices[currency], `${text} vs ${payload.prices[currency]}`);
            }

            // Locales other than en-US insert U+00A0 or U+202F, which are
            // invisible in review and break copy-paste and exact comparisons.
            check(`formatted.${currency} carries no exotic whitespace`, !/[  ]/.test(text), JSON.stringify(text));
        }
    }

    return payload;
}

async function newPage(browser, { stub, seedCache, blockRegion } = {}) {
    // A fresh context per scenario means an empty localStorage AND an empty
    // HTTP cache, so the 24h max-age on region.js cannot mask a change.
    const context = await browser.newContext();
    await context.route(
        url => NOISE.some(pattern => pattern.test(url.href)),
        route => route.abort()
    );

    // Resolves the moment the interceptor sees the request, which is the
    // closest real signal available when the outcome under test is that
    // nothing renders. Already resolved when the live payload is in play,
    // where waitForRegionApplied is the signal instead.
    let markHandled;
    const regionHandled = new Promise(resolve => {
        markHandled = resolve;
    });

    if (blockRegion) {
        await context.route(REGION_URL, route => {
            markHandled();
            route.abort('failed');
        });
    } else if (stub !== undefined) {
        // Stateless on purpose: the <link rel="preload"> fetches region.js too,
        // and the script tag may reuse that response.
        await context.route(REGION_URL, route => {
            markHandled();
            route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: stub });
        });
    } else {
        markHandled();
    }

    const page = await context.newPage();

    if (seedCache) {
        // Stamped in the past so waitForRegionApplied can tell the seed apart
        // from the entry the live script writes.
        await page.addInitScript(
            args => {
                try {
                    window.localStorage.setItem('psysRegion', JSON.stringify({ ts: args.ts, data: args.data }));
                } catch (err) {
                    /* ignore */
                }
            },
            { ts: Date.now() - 3600e3, data: seedCache }
        );
    }

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    return { context, page, errors, regionHandled };
}

// Both consumers write the cache from the script's onload handler, so a cache
// entry stamped after navigation began is the precise "region.js ran" signal.
// Without it every assertion can pass vacuously, because the authored bytes on
// emailengine.app already equal the live figure.
async function waitForRegionApplied(page, since) {
    await page.waitForFunction(
        stamp => {
            try {
                const raw = window.localStorage.getItem('psysRegion');
                return !!raw && JSON.parse(raw).ts >= stamp;
            } catch (err) {
                return false;
            }
        },
        since,
        { timeout: 20000 }
    );
}

async function settle(page, regionHandled, { docs = false } = {}) {
    if (docs) {
        // The script tag only exists because <Price /> mounted and subscribed,
        // so this proves the component got as far as asking for a payload. It
        // is injected on mount, so the wait is short: absence here means the
        // component is not on the page at all, which the assertions report
        // better than a long stall would.
        await page.waitForFunction(() => !!document.querySelector('script[src*="region.js"]'), { timeout: 5000 }).catch(() => {});
    }
    // Bounded: a consumer that never asks for the payload at all (the component
    // is missing, or the inline script threw) would otherwise wait forever for
    // an interception that is not coming. The assertions report that far better
    // than a hang does.
    await Promise.race([regionHandled, new Promise(resolve => setTimeout(resolve, 5000))]);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForTimeout(SETTLE_MS);
}

async function checkParentheticalCount(page, { label, needle, count }) {
    try {
        await page.waitForFunction(([want, expected]) => document.body.innerText.split(want).length - 1 === expected, [needle, count], { timeout: 15000 });
        check(label, true);
    } catch (err) {
        const text = await page.evaluate(() => document.body.innerText);
        check(label, false, `found ${countOf(text, needle)}`);
    }
}

async function checkMarketing(browser, payload) {
    section('Section 2: emailengine.app with the live payload');

    const { context, page, errors } = await newPage(browser);
    try {
        const since = Date.now();
        const response = await page.goto(MARKETING_URL, { waitUntil: 'domcontentloaded' });

        // The served bytes, before any JS ran: what a crawler, a curl, or a
        // blocked-script visitor sees. Scraped rather than hardcoded so a copy
        // change does not turn into a false failure.
        const html = await response.text();
        const authored = {};
        const re = /<span data-price="(usd|eur)">([^<]*)<\/span>/g;
        let match;
        while ((match = re.exec(html)) !== null) {
            authored[match[1]] = match[2];
        }
        console.log(`        authored figures: ${JSON.stringify(authored)}`);

        await waitForRegionApplied(page, since);

        const spans = await page.locator('[data-price]').all();
        check('four data-price elements', spans.length === 4, `found ${spans.length}`);

        for (const currency of Object.keys(SYMBOLS)) {
            const expected = figureFor(payload, currency);
            if (expected === null) {
                continue;
            }
            try {
                await page.waitForFunction(
                    ([cur, want]) => Array.from(document.querySelectorAll(`[data-price="${cur}"]`)).every(el => el.textContent === want),
                    [currency, expected],
                    { timeout: 15000 }
                );
                check(`data-price="${currency}" spans read ${expected}`, true);
            } catch (err) {
                const texts = await marketingSpanTexts(page);
                check(`data-price="${currency}" spans read ${expected}`, false, `got ${JSON.stringify(texts[currency])}`);
            }
        }

        check('currency-eur matches the payload currency', (await hasEurClass(page)) === (payload.currency === 'eur'), payload.currency);

        // The hide rule is scoped to .price-card__figure, so exactly one figure
        // shows and it must be the visitor's currency, while everything outside
        // the card stays visible.
        const visibleFigures = await page.locator('.price-card__figure [data-price]:visible').all();
        check('exactly one price-card figure is visible', visibleFigures.length === 1, `found ${visibleFigures.length}`);
        if (visibleFigures.length === 1) {
            const currency = await visibleFigures[0].getAttribute('data-price');
            check('the visible figure is the visitor currency', currency === payload.currency, `${currency} vs ${payload.currency}`);
        }

        // The FAQ shows both currencies at once, which is why `formatted` is a
        // map rather than one resolved string.
        const faqVisible = await page.evaluate(
            () => Array.from(document.querySelectorAll('[data-price]')).filter(el => !el.closest('.price-card__figure') && el.offsetParent !== null).length
        );
        check('both FAQ currency spans stay visible', faqVisible === 2, `found ${faqVisible}`);

        const cached = await page.evaluate(() => {
            try {
                return JSON.parse(window.localStorage.getItem('psysRegion') || 'null');
            } catch (err) {
                return null;
            }
        });
        check('the payload was cached under psysRegion', !!cached && !!cached.data, JSON.stringify(cached));
        if (cached && cached.data) {
            check('the cached copy matches the live currency', cached.data.currency === payload.currency, cached.data.currency);
            if (!ALLOW_MISSING_FORMATTED) {
                check('the cached copy carries formatted', !!cached.data.formatted, JSON.stringify(cached.data));
            }
        }

        // The deploy health check greps static markers with curl and executes
        // no JS, so this is the only thing that would catch a syntax error in
        // the inline block.
        check('no page errors', errors.length === 0, errors.join(' | '));

        return authored;
    } finally {
        await context.close();
    }
}

async function checkDocs(browser, payload, docPages) {
    section('Section 3: learn.emailengine.app with the live payload');

    const figure = figureFor(payload, payload.currency);
    const needle = needleFor(figure);

    for (const { path: docPath, count, authored, inTable } of docPages) {
        const { context, page, errors } = await newPage(browser);
        try {
            const response = await page.goto(`${DOCS_URL}${docPath}`, { waitUntil: 'domcontentloaded' });

            // The SSR and Algolia guard, read from the same navigation: the
            // static bytes must carry the authored sentence and no figure.
            const html = await response.text();
            check(`${docPath} static HTML carries no figure`, countOf(html, figure) === 0 && countOf(html, 'per year)') === 0);
            if (authored) {
                check(`${docPath} static HTML carries the authored text`, html.includes(authored), authored);
            }

            await checkParentheticalCount(page, { label: `${docPath} renders ${count} price parentheticals`, needle, count });

            if (inTable) {
                const found = await page.evaluate(
                    want => Array.from(document.querySelectorAll('table td, table th')).filter(cell => cell.innerText.includes(want)).length,
                    needle
                );
                check(`${docPath} renders ${inTable} of them inside table cells`, found === inTable, `found ${found}`);
            }

            check(`${docPath} has no page errors`, errors.length === 0, errors.join(' | '));
        } finally {
            await context.close();
        }
    }
}

async function checkFailurePaths(browser, payload, authored, docPages) {
    const liveFigure = figureFor(payload, payload.currency);
    const sample = docPages.filter(entry => entry.sample);

    const expectAuthoredMarketing = async page => {
        const texts = await marketingSpanTexts(page);
        for (const currency of Object.keys(authored)) {
            check(
                `marketing ${currency} span keeps its authored value`,
                texts[currency] === authored[currency],
                `${JSON.stringify(texts[currency])} vs ${JSON.stringify(authored[currency])}`
            );
        }
    };

    const expectNoDocFigure = async (page, docPath) => {
        const text = await page.evaluate(() => document.body.innerText);
        check(`${docPath} renders no price parenthetical`, !PARENTHETICAL_RE.test(text), (text.match(PARENTHETICAL_RE) || [])[0]);
    };

    // Everything that must degrade to the authored bytes. Same shape, so it is
    // one table: a broken payload, a page, and the assertion that nothing
    // changed. `extra` covers the one or two things unique to a scenario.
    const degraded = [
        {
            label: 'region.js blocked',
            options: { blockRegion: true },
            extra: async page => {
                check('currency-eur is not set without a payload', (await hasEurClass(page)) === false);
                const cached = await page.evaluate(() => window.localStorage.getItem('psysRegion'));
                check('nothing is cached when the script fails', cached === null, String(cached));
            }
        },
        {
            // The exact shape the server emits when a price fails the band.
            label: 'band-failed payload (no prices, no formatted)',
            options: { stub: regionScript({ country: payload.country, currency: payload.currency }) },
            extra: async page => {
                // Deliberate ordering: the currency verdict is applied outside
                // the price guard, so emphasis survives a missing price half.
                check('currency-eur still follows the payload', (await hasEurClass(page)) === (payload.currency === 'eur'));
            }
        },
        { label: 'payload is not an object', options: { stub: 'window.PSYS_REGION = "nope";' } },
        {
            label: 'payload is unparseable javascript',
            options: { stub: 'window.PSYS_REGION = {' },
            // The stub is a deliberate syntax error, so the browser reporting one
            // is the scenario working. What matters is that the consumers survive
            // a script that never defined PSYS_REGION.
            allowPageErrors: true
        }
    ];

    if (!ALLOW_MISSING_FORMATTED) {
        degraded.push(
            {
                // Without the typeof guard in the consumers this renders
                // " (995 per year)": a currency-less number in a price
                // sentence. The highest-value single assertion here.
                label: 'formatted values are numbers, not strings',
                options: {
                    stub: regionScript(
                        Object.assign({}, payload, {
                            formatted: Object.keys(payload.prices).reduce((acc, cur) => Object.assign(acc, { [cur]: payload.prices[cur] }), {})
                        })
                    )
                }
            },
            {
                // The transition case: a cache written before the change, with
                // no network to correct it.
                label: 'stale old-shape cache, offline',
                options: { blockRegion: true, seedCache: { country: payload.country, currency: payload.currency, prices: payload.prices } },
                extra: async page => {
                    check('the cached currency verdict still applies', (await hasEurClass(page)) === (payload.currency === 'eur'));
                }
            }
        );
    }

    for (const { label, options, extra, allowPageErrors } of degraded) {
        section(`Scenario: ${label}`);

        const marketing = await newPage(browser, options);
        try {
            await marketing.page.goto(MARKETING_URL, { waitUntil: 'domcontentloaded' });
            await settle(marketing.page, marketing.regionHandled);
            await expectAuthoredMarketing(marketing.page);
            if (extra) {
                await extra(marketing.page);
            }
            if (!allowPageErrors) {
                check('no page errors', marketing.errors.length === 0, marketing.errors.join(' | '));
            }
        } finally {
            await marketing.context.close();
        }

        for (const { path: docPath } of sample) {
            const docs = await newPage(browser, options);
            try {
                await docs.page.goto(`${DOCS_URL}${docPath}`, { waitUntil: 'domcontentloaded' });
                await settle(docs.page, docs.regionHandled, { docs: true });
                await expectNoDocFigure(docs.page, docPath);
                if (!allowPageErrors) {
                    check(`${docPath} has no page errors`, docs.errors.length === 0, docs.errors.join(' | '));
                }
            } finally {
                await docs.context.close();
            }
        }
    }

    // The non-EU path, which cannot be reached by originating traffic from
    // here, so it is stubbed instead.
    const usdPayload = Object.assign({}, payload, { country: 'US', currency: 'usd' });
    const usdFigure = figureFor(usdPayload, 'usd');

    section('Scenario: US visitor');
    const usd = await newPage(browser, { stub: regionScript(usdPayload) });
    try {
        const since = Date.now();
        await usd.page.goto(MARKETING_URL, { waitUntil: 'domcontentloaded' });
        // The authored usd value already equals the live one, so without this
        // wait the span assertion would pass whether the stub ran or not.
        await waitForRegionApplied(usd.page, since);
        const texts = await marketingSpanTexts(usd.page);
        check('usd spans read the usd figure', texts.usd === usdFigure, JSON.stringify(texts.usd));
        check('currency-eur is not set for a US visitor', (await hasEurClass(usd.page)) === false);
        const visible = await usd.page.locator('.price-card__figure [data-price]:visible').first().getAttribute('data-price');
        check('the visible price-card figure is usd', visible === 'usd', String(visible));
    } finally {
        await usd.context.close();
    }

    for (const { path: docPath, count } of sample) {
        section(`Scenario: US visitor on ${docPath}`);
        const docs = await newPage(browser, { stub: regionScript(usdPayload) });
        try {
            await docs.page.goto(`${DOCS_URL}${docPath}`, { waitUntil: 'domcontentloaded' });
            await checkParentheticalCount(docs.page, { label: `${docPath} renders ${count} usd parentheticals`, needle: needleFor(usdFigure), count });
        } finally {
            await docs.context.close();
        }
    }

    // A stale cache from before the change, with the network available. Seeded
    // with the opposite currency so "corrects itself" is an observable state
    // change rather than a value that was already right.
    section('Scenario: stale old-shape cache, online');
    const stale = await newPage(browser, {
        seedCache: { country: payload.country, currency: payload.currency === 'eur' ? 'usd' : 'eur', prices: payload.prices }
    });
    try {
        const since = Date.now();
        await stale.page.goto(MARKETING_URL, { waitUntil: 'domcontentloaded' });
        await waitForRegionApplied(stale.page, since);
        const texts = await marketingSpanTexts(stale.page);
        check('the page corrects itself to the live figure', texts[payload.currency] === liveFigure, JSON.stringify(texts[payload.currency]));
        check('the stale currency verdict is overwritten', (await hasEurClass(stale.page)) === (payload.currency === 'eur'));
        check('no page errors', stale.errors.length === 0, stale.errors.join(' | '));
    } finally {
        await stale.context.close();
    }

    if (ALLOW_MISSING_FORMATTED) {
        return;
    }

    // A cached numeric price that disagrees with the live one must be
    // unreachable, which is the whole point of the change.
    section('Scenario: poisoned old-shape cache');
    const poisoned = await newPage(browser, {
        seedCache: {
            country: payload.country,
            currency: payload.currency,
            prices: Object.keys(payload.prices).reduce((acc, cur) => Object.assign(acc, { [cur]: 1495 }), {})
        }
    });
    try {
        await poisoned.page.goto(MARKETING_URL, { waitUntil: 'domcontentloaded' });
        await settle(poisoned.page, poisoned.regionHandled);
        const html = await poisoned.page.evaluate(() => document.documentElement.innerHTML);
        check('the cached numeric price never reaches the DOM', !html.includes('1495'));
    } finally {
        await poisoned.context.close();
    }

    // The deliberate asymmetry between the two consumers: the marketing page
    // needs both currencies before it rewrites anything, the docs page needs
    // only its own. Pinned so nobody harmonises it later.
    section('Scenario: formatted carries only one currency');
    const oneCurrency = regionScript({ country: 'US', currency: 'usd', prices: payload.prices, formatted: { usd: figureFor(payload, 'usd') } });

    const partialMarketing = await newPage(browser, { stub: oneCurrency });
    try {
        await partialMarketing.page.goto(MARKETING_URL, { waitUntil: 'domcontentloaded' });
        await settle(partialMarketing.page, partialMarketing.regionHandled);
        await expectAuthoredMarketing(partialMarketing.page);
        check('no page errors', partialMarketing.errors.length === 0, partialMarketing.errors.join(' | '));
    } finally {
        await partialMarketing.context.close();
    }

    const partialDocs = await newPage(browser, { stub: oneCurrency });
    try {
        const { path: docPath, count } = sample[0];
        await partialDocs.page.goto(`${DOCS_URL}${docPath}`, { waitUntil: 'domcontentloaded' });
        await checkParentheticalCount(partialDocs.page, {
            label: `${docPath} still renders its own currency`,
            needle: needleFor(figureFor(payload, 'usd')),
            count
        });
    } finally {
        await partialDocs.context.close();
    }
}

async function main() {
    console.log(`region:    ${REGION_URL}`);
    console.log(`marketing: ${MARKETING_URL}`);
    console.log(`docs:      ${DOCS_URL}`);
    console.log(`mode:      ${ALLOW_MISSING_FORMATTED ? 'formatted optional (rollout in progress)' : 'formatted required'}`);

    const docPages = scanDocPages();
    console.log(`docs pages using <Price />: ${docPages.map(entry => `${entry.path} (${entry.count})`).join(', ')}`);

    const payload = await fetchLivePayload();
    if (!payload) {
        console.log('\nCannot continue without a parseable payload.');
        process.exitCode = 1;
        return;
    }

    if (!payload.prices) {
        console.log('\nThe live payload carries no prices, so there is nothing for the consumers to render.');
        console.log('That is a legitimate server state, but it makes the rest of this script meaningless.');
        process.exitCode = 1;
        return;
    }

    const browser = await chromium.launch();
    try {
        const authored = await checkMarketing(browser, payload);
        await checkDocs(browser, payload, docPages);
        await checkFailurePaths(browser, payload, authored, docPages);
    } finally {
        await browser.close();
    }

    console.log(`\n${checks - failures}/${checks} checks passed`);
    if (failures) {
        console.log(`${failures} FAILED`);
        process.exitCode = 1;
    }
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
