---
title: Translations
sidebar_position: 12
description: Configure language settings for public-facing pages and contribute translations
---

# Translations

EmailEngine supports multiple languages for public-facing pages. This includes hosted authentication forms, error pages, unsubscribe pages, and other user-facing content.

:::note Admin Interface Not Translated
The admin dashboard and configuration interface are only available in English. Translations apply only to public pages that end users interact with.
:::

## Supported Languages

EmailEngine includes translations for the following languages:

| Language | Locale Code |
| -------- | ----------- |
| English  | `en`        |
| Estonian | `et`        |
| French   | `fr`        |
| German   | `de`        |
| Polish   | `pl`        |
| Japanese | `ja`        |
| Dutch    | `nl`        |

## Language Selection

EmailEngine determines the language to use based on the following priority order:

1. **Query parameter** - `?locale=fr`
2. **Custom header** - `X-EE-Locale: fr`
3. **Session cookie** - Stored from previous query/header selection
4. **Accept-Language header** - Browser's language preference
5. **Default locale** - Server-wide setting

### Per-Request Language (Query Parameter)

Append `?locale={code}` to any public page URL:

```
https://your-ee.com/accounts/new?data=...&locale=fr
```

When set via query parameter, the language selection is stored in a session cookie and persists until the session ends or a different language is selected.

### Per-Request Language (Header)

Set the `X-EE-Locale` header in your request:

```bash
curl https://your-ee.com/accounts/new?data=... \
  -H "X-EE-Locale: de"
```

Like the query parameter, this also sets a session cookie to persist the selection.

### Browser Language Detection

If no explicit locale is set, EmailEngine uses the browser's `Accept-Language` header to negotiate the best available language. For example, a browser sending `Accept-Language: de-DE,de;q=0.9,en;q=0.8` would see German if available.

### Default Language (Server-Wide)

Set the server-wide default locale that applies when no other language preference is detected.

**Via API:**

```bash
curl -X POST https://your-ee.com/v1/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "fr"
  }'
```

**Via Web Interface:**

1. Open the EmailEngine admin dashboard
2. Navigate to **Configuration** > **General Settings**
3. Find the **Default Language** setting
4. Select your preferred language from the dropdown
5. Click **Save**

### Pre-selecting Language in Hosted Authentication

When generating authentication form URLs, you can include the locale parameter to display the form in a specific language:

```bash
curl -X POST https://your-ee.com/v1/authentication/form \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user123",
    "redirectUrl": "https://myapp.com/settings"
  }'
```

Then append `&locale=fr` to the returned URL before redirecting the user:

```
https://your-ee.com/accounts/new?data=eyJ...&locale=fr
```

## What Gets Translated

### Public UI Pages

Translations apply to public-facing pages:

**Hosted Authentication Forms:**

- Account type selection ("Choose your email account provider")
- "Sign in with Google" / "Sign in with Microsoft" buttons
- IMAP/SMTP configuration form labels
- Success/error messages

**Unsubscribe Pages:**

- Unsubscribe confirmation
- Re-subscribe option
- Status messages

**Error Pages:**

- OAuth2 error messages
- Session expired messages
- Connection error descriptions

**Redirect Pages:**

- "Click here to continue" messages

### API Validation Errors

API validation error messages are also translated. The same language selection mechanism applies to API requests:

**Triggers for API response translation:**

| Method                 | Example                      | Persists |
| ---------------------- | ---------------------------- | -------- |
| Query parameter        | `POST /v1/account?locale=fr` | No       |
| Custom header          | `X-EE-Locale: fr`            | No       |
| Accept-Language header | `Accept-Language: fr`        | No       |

**Example - German validation error:**

```bash
curl -X POST https://your-ee.com/v1/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-EE-Locale: de" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response with German error messages:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Ungültige Eingabe",
  "fields": [
    {
      "message": "\"account\" ist erforderlich",
      "key": "account"
    },
    {
      "message": "\"name\" ist erforderlich",
      "key": "name"
    }
  ]
}
```

:::note Cookie Persistence
For API requests (paths starting with `/v1/`), locale selection via query parameter or header does **not** set a session cookie. Each API request must explicitly specify the desired locale. Cookies are only set for UI page requests.
:::

## See Also

- [Hosted Authentication](/docs/accounts/hosted-authentication) - Public authentication forms
- [Configuration Options](/docs/reference/configuration-options) - All configuration settings
