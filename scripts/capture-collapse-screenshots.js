#!/usr/bin/env node

"use strict";

/*
 * Screenshot driver for the quoted-thread collapse control (docs/receiving/web-safe-html.md).
 *
 * Stages a real conversation - an original message and a reply that quotes it - into an Ethereal
 * mailbox connected to a running EmailEngine, opens the reply in the admin message browser, and
 * captures the folded and unfolded states of the <details class="ee-collapsed-thread"> block that
 * EmailEngine's web-safe HTML emits.
 *
 * Normally invoked by scripts/capture-collapse-screenshots.sh, which boots the throwaway instance
 * this talks to. Run it directly against an already-running instance when iterating on the
 * captures themselves.
 *
 * Playwright, nodemailer and the Ethereal/bootstrap test helpers are all resolved from the
 * EmailEngine checkout, so the docs repo needs no extra dependencies of its own.
 *
 * Configuration (environment variables):
 *   EE_REPO       EmailEngine checkout to borrow helpers from (default ../emailengine)
 *   EE_URL        Base URL of the instance (default http://127.0.0.1:7099)
 *   EE_PASSWORD   Admin password to set or log in with (default: the e2e suite password)
 *   EE_ACCOUNT    Account id to register (default collapse-demo)
 *   EE_OUT_DIR    Where to write the PNGs (default static/img/screenshots)
 *   EE_HEADED     Set to 1 to watch the browser drive the UI
 */

const fs = require("fs");
const path = require("path");

const EE_REPO =
  process.env.EE_REPO || path.join(__dirname, "..", "..", "emailengine");

// Resolved out of the EmailEngine checkout rather than the docs repo: the helpers are the ones the
// e2e suite already uses, so the staging here cannot drift from how EmailEngine is actually tested.
function fromEmailEngine(modulePath) {
  try {
    return require(path.join(EE_REPO, modulePath));
  } catch (err) {
    throw new Error(
      `Could not load ${modulePath} from the EmailEngine checkout at ${EE_REPO}. Set EE_REPO. (${err.message})`,
    );
  }
}

const { chromium, request: playwrightRequest } = fromEmailEngine(
  "node_modules/playwright",
);
const MailComposer = fromEmailEngine(
  "node_modules/nodemailer/lib/mail-composer",
);
const { createUsableTestAccount, etherealAccountPayload } = fromEmailEngine(
  "test/helpers/ethereal",
);
const { ADMIN_PASSWORD } = fromEmailEngine("test/e2e/helpers/bootstrap");

const EE_URL = (process.env.EE_URL || "http://127.0.0.1:7099").replace(
  /\/+$/,
  "",
);
const EE_PASSWORD = process.env.EE_PASSWORD || ADMIN_PASSWORD;
const EE_ACCOUNT = process.env.EE_ACCOUNT || "collapse-demo";
const OUT_DIR =
  process.env.EE_OUT_DIR ||
  path.join(__dirname, "..", "static", "img", "screenshots");
const HEADED = process.env.EE_HEADED === "1";

const VIEWPORT = { width: 1500, height: 1000 };

// The reply the screenshot is about. Gmail's shape, because it is the one most readers recognise:
// the new content and the signature in one container, the quoted thread in a sibling
// div.gmail_quote that the extractor anchors on.
const THREAD_SUBJECT = "Deploy window for the payments release";

const ORIGINAL_TEXT = `Hi Alice,

We need to pick a deploy window for the payments release. The migration locks the
ledger tables for about ten minutes, so it has to happen outside business hours.

Monday morning at 09:00 would give us the whole day to watch it. Tuesday works too,
but then we are into the reporting run.

Could you also confirm whether the incident report from last week is signed off? I
would rather not deploy with that still open.

Thanks,
Bob`;

const ORIGINAL_HTML = `<div dir="ltr"><p>Hi Alice,</p>
<p>We need to pick a deploy window for the payments release. The migration locks the ledger tables for about ten minutes, so it has to happen outside business hours.</p>
<p>Monday morning at 09:00 would give us the whole day to watch it. Tuesday works too, but then we are into the reporting run.</p>
<p>Could you also confirm whether the incident report from last week is signed off? I would rather not deploy with that still open.</p>
<p>Thanks,<br>Bob</p></div>`;

const REPLY_TEXT = `Monday at 09:00 works for me. I will be online from 08:30 to watch the migration.

The incident report was signed off on Friday, so nothing is blocking us there.

Thanks,
Alice

On Mon, 20 Jul 2026 at 10:12, Bob Meyer <bob.meyer@example.net> wrote:
> Hi Alice,
>
> We need to pick a deploy window for the payments release. The migration locks the
> ledger tables for about ten minutes, so it has to happen outside business hours.
>
> Monday morning at 09:00 would give us the whole day to watch it. Tuesday works too,
> but then we are into the reporting run.
>
> Could you also confirm whether the incident report from last week is signed off? I
> would rather not deploy with that still open.
>
> Thanks,
> Bob`;

const REPLY_HTML = `<div dir="ltr"><p>Monday at 09:00 works for me. I will be online from 08:30 to watch the migration.</p>
<p>The incident report was signed off on Friday, so nothing is blocking us there.</p>
<p>Thanks,<br>Alice</p></div>
<br>
<div class="gmail_quote"><div dir="ltr" class="gmail_attr">On Mon, 20 Jul 2026 at 10:12, Bob Meyer &lt;<a href="mailto:bob.meyer@example.net">bob.meyer@example.net</a>&gt; wrote:<br></div>
<blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex"><div dir="ltr"><p>Hi Alice,</p>
<p>We need to pick a deploy window for the payments release. The migration locks the ledger tables for about ten minutes, so it has to happen outside business hours.</p>
<p>Monday morning at 09:00 would give us the whole day to watch it. Tuesday works too, but then we are into the reporting run.</p>
<p>Could you also confirm whether the incident report from last week is signed off? I would rather not deploy with that still open.</p>
<p>Thanks,<br>Bob</p></div></blockquote></div>`;

// A little unrelated traffic, so the message list looks like a mailbox rather than a fixture.
const FILLER = [
  {
    subject: "Sprint 42 notes",
    from: "Priya Raman <priya@example.net>",
    text: "Notes from this morning are in the shared drive. Nothing blocking.",
  },
  {
    subject: "Invoice 4432",
    from: "Accounts <accounts@example.net>",
    text: "Please find invoice 4432 for the June retainer attached to this thread.",
  },
  {
    subject: "Coffee machine is fixed",
    from: "Office <office@example.net>",
    text: "The machine on the second floor works again. Please rinse the tray.",
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(request, method, apiPath, data) {
  const res = await request.fetch(`${EE_URL}${apiPath}`, { method, data });
  if (!res.ok()) {
    throw new Error(
      `${method} ${apiPath} -> HTTP ${res.status()}: ${await res.text()}`,
    );
  }
  return res.status() === 204 ? null : res.json();
}

// Build the message ourselves rather than letting EmailEngine compose it: the whole point is the
// exact quoted-reply markup a real client would send, which the compose path would not reproduce.
async function buildRaw(message) {
  const composer = new MailComposer(message);
  const raw = await composer.compile().build();
  return raw.toString("base64");
}

async function uploadMessage(request, message) {
  const raw = await buildRaw(message);
  return api(request, "POST", `/v1/account/${EE_ACCOUNT}/message`, {
    path: "INBOX",
    raw,
    flags: [],
  });
}

async function waitFor(
  label,
  check,
  { timeout = 120000, interval = 2000 } = {},
) {
  const started = Date.now();
  for (;;) {
    const result = await check();
    if (result) {
      return result;
    }
    if (Date.now() - started > timeout) {
      throw new Error(`Timed out waiting for ${label}`);
    }
    await sleep(interval);
  }
}

async function ensureAdminSession(page) {
  await page.goto(`${EE_URL}/admin`, { waitUntil: "load" });

  if (page.url().includes("/admin/login")) {
    await page.fill("#loginUsername", "admin");
    await page.fill("#loginPassword", EE_PASSWORD);
    await page.click('form[action="/admin/login"] button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), {
      timeout: 15000,
    });
    console.log("Logged in as admin");
    return;
  }

  // Fresh instance: setting the first password enables authentication and logs us in.
  await page.goto(`${EE_URL}/admin/account/password`, { waitUntil: "load" });
  await page.fill("#password", EE_PASSWORD);
  await page.fill("#password2", EE_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("load");
  console.log("Enabled authentication (admin password set)");

  await page.goto(`${EE_URL}/admin`, { waitUntil: "load" });
  if (page.url().includes("/admin/login")) {
    await page.fill("#loginUsername", "admin");
    await page.fill("#loginPassword", EE_PASSWORD);
    await page.click('form[action="/admin/login"] button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), {
      timeout: 15000,
    });
  }
}

// The trial button only renders while the instance is unlicensed, so its absence means we are done.
async function ensureTrial(page) {
  await page.goto(`${EE_URL}/admin`, { waitUntil: "load" });
  const trialBtn = page.locator("#start-trial-btn");
  if (await trialBtn.count()) {
    await trialBtn.click();
    await trialBtn.waitFor({ state: "detached", timeout: 60000 });
    console.log("Activated a 14-day trial");
  }
}

async function createApiToken(page) {
  await page.goto(`${EE_URL}/admin/tokens/new`, { waitUntil: "load" });
  await page.fill("#description", "collapse screenshot token");
  await page.check("#scopesAll");
  await page.click('#token-form button[type="submit"]');

  // The token is revealed once, in the modal input, and is filled in after the modal opens.
  const tokenInput = page.locator("#showTokenValue");
  await tokenInput.waitFor({ state: "visible", timeout: 20000 });

  const token = await waitFor(
    "the token to be revealed",
    async () => (await tokenInput.inputValue()) || false,
    { timeout: 20000, interval: 250 },
  );
  console.log("Created a REST API token");
  return token;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Provisioning an Ethereal mailbox...");
  const ethereal = await createUsableTestAccount();
  console.log(`Ethereal mailbox: ${ethereal.user}`);

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    await ensureAdminSession(page);
    await ensureTrial(page);
    const token = await createApiToken(page);

    const request = await playwrightRequest.newContext({
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    try {
      console.log(`Registering account ${EE_ACCOUNT}...`);
      await api(request, "POST", "/v1/account", {
        account: EE_ACCOUNT,
        name: "Alice Perez",
        ...etherealAccountPayload(ethereal),
      });

      await waitFor("the account to connect", async () => {
        const info = await api(request, "GET", `/v1/account/${EE_ACCOUNT}`);
        return info.state === "connected";
      });
      console.log("Account is connected");

      console.log("Uploading the conversation...");
      for (const filler of FILLER) {
        await uploadMessage(request, {
          from: filler.from,
          to: `Alice Perez <${ethereal.user}>`,
          subject: filler.subject,
          text: filler.text,
        });
      }

      const originalMessageId = "<deploy-window-original@example.net>";
      await uploadMessage(request, {
        from: "Bob Meyer <bob.meyer@example.net>",
        to: `Alice Perez <${ethereal.user}>`,
        subject: THREAD_SUBJECT,
        messageId: originalMessageId,
        text: ORIGINAL_TEXT,
        html: ORIGINAL_HTML,
      });

      // The reply is the message the screenshot is of. In-Reply-To/References are what tell
      // the extractor this is a reply at all.
      await uploadMessage(request, {
        from: `Alice Perez <${ethereal.user}>`,
        to: "Bob Meyer <bob.meyer@example.net>",
        subject: `Re: ${THREAD_SUBJECT}`,
        messageId: "<deploy-window-reply@example.net>",
        inReplyTo: originalMessageId,
        references: originalMessageId,
        text: REPLY_TEXT,
        html: REPLY_HTML,
      });

      const replySubject = `Re: ${THREAD_SUBJECT}`;
      await waitFor("the reply to appear in INBOX", async () => {
        const list = await api(
          request,
          "GET",
          `/v1/account/${EE_ACCOUNT}/messages?path=INBOX&pageSize=50`,
        );
        return (list.messages || []).some(
          (entry) => entry.subject === replySubject,
        );
      });
      console.log("Conversation is in the mailbox");
    } finally {
      await request.dispose();
    }

    console.log("Opening the message browser...");
    await page.goto(`${EE_URL}/admin/accounts/${EE_ACCOUNT}/browse`, {
      waitUntil: "load",
    });

    // ee-client renders the folder tree and the message list itself, after its own API calls.
    const replyRow = page
      .locator(".ee-message-item", { hasText: THREAD_SUBJECT })
      .first();
    await replyRow.waitFor({ state: "visible", timeout: 60000 });
    await replyRow.click();

    const collapse = page.locator("details.ee-collapsed-thread");
    await collapse.waitFor({ state: "visible", timeout: 30000 });
    const toggle = page.locator("summary.ee-collapsed-thread-toggle");
    console.log(
      `Collapse control is rendered, labelled: ${JSON.stringify(await toggle.innerText())}`,
    );

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, "web-safe-html-collapsed.png"),
    });
    console.log("Saved: web-safe-html-collapsed.png");

    await toggle.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, "web-safe-html-expanded.png"),
    });
    console.log("Saved: web-safe-html-expanded.png");

    console.log(`\nScreenshots written to ${OUT_DIR}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`\nCapture failed: ${err.message}`);
  process.exit(1);
});
