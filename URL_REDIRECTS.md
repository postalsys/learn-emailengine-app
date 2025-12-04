# EmailEngine URL Redirect Reference

This document lists all URL redirects needed when migrating from the old documentation sites to the new unified Docusaurus documentation at `learn.emailengine.app`.

## Domain Structure

| Domain | Purpose |
|--------|---------|
| `emailengine.app` | Main landing page |
| `learn.emailengine.app` | New unified Docusaurus documentation |
| `docs.emailengine.app` | Old blog (redirects to learn.emailengine.app) |
| `api.emailengine.app` | Old API docs (redirects to learn.emailengine.app) |

---

## docs.emailengine.app (Old Blog)

All blog content has been merged into the unified documentation.

### Gmail and Google Account Setup

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/setting-up-gmail-api-access/` | `/docs/accounts/gmail-api` | Exact | Gmail API setup tutorial |
| `/gmail-api-support-in-emailengine/` | `/docs/accounts/gmail-api` | Exact | Gmail API feature announcement |
| `/setting-up-gmail-oauth2-for-imap-api/` | `/docs/accounts/gmail-imap` | Exact | Gmail IMAP OAuth2 setup |
| `/emailengine-and-gmail/` | `/docs/accounts/gmail-imap` | Exact | Gmail integration overview |
| `/gmail-oauth-service-accounts/` | `/docs/accounts/google-service-accounts` | Exact | Google service accounts guide |

### Outlook and Microsoft 365 Setup

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/setting-up-oauth2-with-outlook/` | `/docs/accounts/outlook-365` | Exact | Outlook OAuth2 setup |
| `/shared-ms365-mailboxes-with-emailengine/` | `/docs/accounts/shared-mailboxes` | Exact | Shared mailboxes guide |

### OAuth2 and Authentication

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/using-an-authentication-server/` | `/docs/accounts/authentication-server` | Exact | Custom auth server setup |
| `/using-emailengine-to-manage-oauth2-tokens/` | `/docs/accounts/oauth2-token-management` | Exact | OAuth2 token management |
| `/proxying-oauth2-imap-connections-for-outlook-and-gmail/` | `/docs/accounts/proxying-connections` | Exact | IMAP proxy setup |

### Sending Emails

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/sending-an-email-from-emailengine/` | `/docs/sending/basic-sending` | Exact | Basic email sending |
| `/sending-reply-and-forward-emails/` | `/docs/sending/replies-forwards` | Exact | Reply/forward emails |
| `/mail-merge-with-emailengine/` | `/docs/sending/mail-merge` | Exact | Mail merge feature |
| `/sending-multiple-emails-in-the-same-thread/` | `/docs/sending/threading` | Exact | Email threading |
| `/threading-with-emailengine/` | `/docs/sending/threading` | Exact | Threading guide |
| `/using-as-a-transactional-email-service/` | `/docs/sending/transactional-service` | Exact | Transactional email |
| `/making-email-html-webpage-compatible-with-emailengine/` | `/docs/sending/basic-sending` | Exact | HTML email compatibility |

### Receiving and Processing Emails

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/using-emailengine-to-continuously-feed-emails-for-analysis/` | `/docs/receiving/continuous-processing` | Exact | Continuous email processing |
| `/tracking-email-replies-with-imap-api/` | `/docs/receiving/tracking-replies` | Exact | Reply tracking |
| `/tracking-deleted-messages-on-an-imap-account/` | `/docs/receiving/tracking-deleted` | Exact | Deleted message tracking |
| `/about-mailbox/` | `/docs/receiving/mailbox-operations` | Exact | Mailbox operations |

### Webhooks

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/debugging-webhooks-in-emailengine/` | `/docs/receiving/webhooks` | Exact | Webhook debugging |
| `/tailing-webhooks/` | `/docs/receiving/webhooks` | Exact | Webhook tailing |

### Performance and Operations

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/tuning-performance/` | `/docs/advanced/performance-tuning` | Exact | Performance tuning guide |
| `/mailbox-locking-in-imapflow/` | `/docs/advanced/performance-tuning` | Exact | IMAP locking details |
| `/interpreting-queue-types/` | `/docs/advanced/queue-management` | Exact | Queue management |

### Security and Encryption

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/enabling-secret-encryption/` | `/docs/advanced/encryption` | Exact | Encryption setup |
| `/data-compliance/` | `/docs/advanced/encryption` | Exact | Data compliance |

### Bounces and Delivery

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/tracking-bounces/` | `/docs/advanced/bounces` | Exact | Bounce tracking |
| `/measuging-inbox-spam-placement/` | `/docs/advanced/delivery-testing` | Exact | Delivery testing |

### IDs and Technical Details

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/ids-explained/` | `/docs/advanced/ids-explained` | Exact | ID system explanation |

### Integrations

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/generating-summaries-of-new-emails-using-chatgpt/` | `/docs/integrations/ai-chatgpt` | Exact | ChatGPT integration |
| `/improved-chatgpt-integration-with-emailengine/` | `/docs/integrations/ai-chatgpt` | Exact | ChatGPT improvements |
| `/low-code-integrations/` | `/docs/integrations/low-code` | Exact | Low-code platforms |
| `/integrating-emails-with-a-crm/` | `/docs/integrations/crm` | Exact | CRM integration |
| `/using-emailengine-with-php-and-composer/` | `/docs/integrations/php` | Exact | PHP SDK guide |
| `/how-to-parse-emails-with-cloudflare-email-workers/` | `/docs/integrations` | Exact | Cloudflare Workers |

### Deployment

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/install-emailengine-on-render-com/` | `/docs/deployment/render` | Exact | Render.com deployment |

### Comparison

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/emailengine-vs-nylas/` | `/docs/comparison/emailengine-vs-nylas` | Exact | Nylas comparison |

### Meta/General (Redirect to Docs Home)

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/how-i-turned-my-open-source-project-into/` | `/docs` | Exact | Business story article |
| `/packaging-and-selling-a-node-js-app/` | `/docs` | Exact | Packaging article |
| `/nodemailer-has-zero-dependencies/` | `/docs` | Exact | Nodemailer article |
| `/version-2/` | `/docs` | Exact | Version 2 announcement |

### Fallback Redirects

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/` | `/docs` | Exact | Root redirect |
| `/page/*` | `/docs` | Wildcard | Pagination pages |
| `/rss/` | `/docs` | Exact | RSS feed |
| `/feed/` | `/docs` | Exact | Atom feed |
| `/*` | `/docs` | Fallback | Catch-all for unmapped paths |

---

## emailengine.app (Landing Page)

Redirects for old documentation paths on the main domain.

### Account and Authentication Setup

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/hosted-authentication` | `/docs/accounts/hosted-authentication` | Exact | Hosted auth page |
| `/supported-account-types` | `/docs/accounts` | Exact | Account types overview |
| `/oauth2-configuration` | `/docs/configuration/oauth2-configuration` | Exact | OAuth2 config |
| `/gmail-api` | `/docs/accounts/gmail-api` | Exact | Gmail API |
| `/gmail-over-imap` | `/docs/accounts/gmail-imap` | Exact | Gmail IMAP |
| `/outlook-and-ms-365` | `/docs/accounts/outlook-365` | Exact | Outlook/MS365 |
| `/google-service-accounts` | `/docs/accounts/google-service-accounts` | Exact | Service accounts |
| `/shared-mailboxes-in-ms-365` | `/docs/accounts/shared-mailboxes` | Exact | Shared mailboxes |

### API and Authentication

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/authenticating-api-requests` | `/docs/api-reference/access-tokens` | Exact | API authentication |

### Sending Emails

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/sending-emails` | `/docs/sending` | Exact | Sending overview |
| `/email-templates` | `/docs/sending/templates` | Exact | Email templates |
| `/virtual-mailing-lists` | `/docs/advanced/virtual-lists` | Exact | Virtual lists |

### Receiving Emails

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/webhooks` | `/docs/receiving/webhooks` | Exact | Webhooks |
| `/bounces` | `/docs/advanced/bounces` | Exact | Bounce handling |
| `/pre-processing-functions` | `/docs/advanced/pre-processing` | Exact | Pre-processing |

### Installation and Setup

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/set-up` | `/docs/installation` | Exact | Installation guide |
| `/docker` | `/docs/installation/docker` | Exact | Docker setup |

### Configuration

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/configuration` | `/docs/configuration` | Exact | Configuration overview |
| `/redis` | `/docs/configuration/redis` | Exact | Redis setup |
| `/reset-password` | `/docs/configuration/reset-password` | Exact | Password reset |
| `/prepared-settings` | `/docs/configuration/prepared-settings` | Exact | Prepared settings |
| `/prepared-access-token` | `/docs/configuration/prepared-settings/tokens` | Exact | Prepared tokens |
| `/prepared-license` | `/docs/configuration/prepared-settings/license` | Exact | Prepared license |

### Deployment and Operations

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/system-d-service` | `/docs/deployment/systemd` | Exact | SystemD service |
| `/expose-public-https` | `/docs/deployment/nginx-proxy` | Exact | Nginx proxy |
| `/monitoring` | `/docs/advanced/monitoring` | Exact | Monitoring |
| `/logging` | `/docs/advanced/logging` | Exact | Logging |
| `/local-addresses` | `/docs/advanced/local-addresses` | Exact | Local addresses |
| `/troubleshooting` | `/docs/troubleshooting` | Exact | Troubleshooting |

### Static Pages

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/support` | `/docs/support` | Exact | Support page |
| `/about` | `/docs` | Exact | About page |

### Deprecated Pages

| Source | Response | Match | Description |
|--------|----------|-------|-------------|
| `/document-store-deprecated` | 410 Gone | Exact | Removed feature |

---

## api.emailengine.app (Old API Docs)

| Source | Destination | Match | Description |
|--------|-------------|-------|-------------|
| `/` | `/docs/api/emailengine-api` | Exact | API docs root |
| `/*` | `/docs/api/emailengine-api` | Fallback | All API paths |

---

## Notes

- All redirects use HTTP 301 (permanent) status code
- Destinations are relative to `https://learn.emailengine.app`
- "Exact" match means the path must match exactly
- "Wildcard" uses pattern matching (e.g., `/page/*`)
- "Fallback" catches any unmatched paths
