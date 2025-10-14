# Link Fix Examples - Before and After

## Example 1: Main Index Page (docs/index.md)

**Before:**
```markdown
1. **[Install EmailEngine](/docs/getting-started/installation)** - Set up with Docker, npm, or on platforms like Render.com
```

**After:**
```markdown
1. **[Install EmailEngine](/docs/installation)** - Set up with Docker, npm, or on platforms like Render.com
```

**Reason:** Installation docs are at `/docs/installation/`, not `/docs/getting-started/installation`

---

## Example 2: Gmail IMAP Setup (docs/accounts/gmail-imap.md)

**Before:**
```markdown
[Learn more about hosted authentication →](/docs/usage/hosted-authentication)
```

**After:**
```markdown
[Learn more about hosted authentication →](/docs/accounts/oauth2-setup)
```

**Reason:** The `/docs/usage/` directory doesn't exist. Hosted authentication content is in the OAuth2 setup guide.

---

## Example 3: Integration Guides (docs/integrations/crm.md)

**Before:**
```markdown
- [Performance Tuning](/docs/advanced/performance-tuning.md)
- [Monitoring](/docs/advanced/monitoring.md)
- [Webhooks](/docs/usage/webhooks.md)
```

**After:**
```markdown
- [Performance Tuning](/docs/advanced/performance-tuning)
- [Monitoring](/docs/advanced/monitoring)
- [Webhooks](/docs/receiving/webhooks)
```

**Reason:**
1. Removed `.md` extensions (not needed in internal links)
2. Fixed `/docs/usage/webhooks.md` to `/docs/receiving/webhooks`

---

## Example 4: API Reference (docs/index.md)

**Before:**
```markdown
- **[Account Management](/docs/api-reference/accounts)** - Register and manage accounts
- **[Sending Emails](/docs/api-reference/sending)** - Submit endpoint and options
- **[Message Operations](/docs/api-reference/messages)** - List, search, and manage emails
- **[Complete API Docs](/docs/api)** - All 73 endpoints with schemas
```

**After:**
```markdown
- **[Account Management](/docs/api-reference/accounts-api)** - Register and manage accounts
- **[Sending Emails](/docs/api-reference/sending-api)** - Submit endpoint and options
- **[Message Operations](/docs/api-reference/messages-api)** - List, search, and manage emails
- **[Complete API Docs](/docs/api-reference)** - All 73 endpoints with schemas
```

**Reason:** API reference files have `-api` suffix and `/docs/api` should be `/docs/api-reference`

---

## Example 5: Configuration Links (docs/accounts/proxying-connections.md)

**Before:**
```markdown
- [IMAP Proxy Configuration](/docs/configuration/imap-proxy)
- [SMTP Proxy Configuration](/docs/configuration/smtp-proxy)
```

**After:**
```markdown
- [IMAP Proxy Configuration](/docs/accounts/proxying-connections)
- [SMTP Proxy Configuration](/docs/accounts/proxying-connections)
```

**Reason:** Proxy configuration is documented in the proxying-connections page, not in separate config files.

---

## Example 6: Support Links (docs/installation/index.md)

**Before:**
```markdown
[Support page →](/docs/support)
```

**After:**
```markdown
[Support page →](/docs/support/license)
```

**Reason:** No `/docs/support/index.md` exists. The only support page is `/docs/support/license.md`

---

## Example 7: Thread Management (docs/index.md)

**Before:**
```markdown
- [Learn about email threading →](/docs/receiving/threading)
```

**After:**
```markdown
- [Learn about email threading →](/docs/sending/threading)
```

**Reason:** Threading functionality is documented in the sending section, not receiving.

---

## Example 8: Configuration Security (docs/accounts/troubleshooting.md)

**Before:**
```markdown
- [Review security best practices](/docs/configuration/security)
```

**After:**
```markdown
- [Review security best practices](/docs/deployment/security)
```

**Reason:** Security documentation is in the deployment section, not configuration.

---

## Statistics Summary

- **Total Links Fixed:** 113
- **Files Modified:** 29
- **Most Common Fix:** `/docs/usage/hosted-authentication` → `/docs/accounts/oauth2-setup` (11 occurrences)
- **Second Most Common:** `/docs/usage/webhooks.md` → `/docs/receiving/webhooks` (9 occurrences)
- **Third Most Common:** `/docs/advanced/performance-tuning.md` → `/docs/advanced/performance-tuning` (8 occurrences - removing .md)
