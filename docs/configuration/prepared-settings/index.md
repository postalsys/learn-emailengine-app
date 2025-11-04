---
title: Prepared Settings
sidebar_position: 5
description: Pre-configure runtime settings, access tokens, and license keys via environment variables
---

# Prepared Settings

Prepared configuration allows you to pre-configure EmailEngine settings, access tokens, and license keys before the application starts. This is essential for automated deployments, CI/CD pipelines, and containerized environments where manual configuration is impractical.

## Overview

EmailEngine supports three types of prepared configuration:

1. **Prepared Settings** - Runtime configuration (webhooks, OAuth2, etc.)
2. **Prepared Access Tokens** - API authentication tokens
3. **Prepared License Keys** - License activation

All prepared configuration is applied on application startup. If the configuration already exists, it's skipped to avoid duplicates.

## Use Cases

**Automated Deployments:**
- Docker/Kubernetes deployments
- Infrastructure as Code (Terraform, Ansible)
- CI/CD pipelines

**Testing:**
- End-to-end automated testing
- Integration test environments
- Staging environment setup

**Multi-Environment Setup:**
- Development, staging, production configs
- Multi-tenant deployments
- Rapid environment provisioning

## Prepared Settings

Pre-configure runtime settings that would normally be set via the Settings API or web interface.

### What Can Be Pre-Configured

Any setting available via the `/v1/settings` API endpoint:

- Webhook URLs and event filters
- OAuth2 application credentials
- SMTP gateway configuration
- Email templates
- Default email signatures
- Custom service settings

### Configuration Methods

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="config-method">
<TabItem value="env" label="Environment Variable">

Set the `EENGINE_SETTINGS` environment variable with a JSON string:

```bash
export EENGINE_SETTINGS='{"webhooks": "https://webhook.site/abc123","webhookEvents":["messageNew"]}'
emailengine
```

</TabItem>
<TabItem value="cli" label="Command-Line">

Use the `--settings` flag:

```bash
emailengine --settings='{"webhooks": "https://your-app.com/webhook","webhookEvents":["messageNew"]}'
```

</TabItem>
<TabItem value="docker" label="Docker">

**Single-line environment variable:**
```dockerfile
ENV EENGINE_SETTINGS='{"webhooks":"https://your-app.com/webhook","webhookEvents":["messageNew","messageSent"]}'
```

</TabItem>
<TabItem value="docker-compose" label="Docker Compose">

**Multi-line YAML format (recommended):**
```yaml
version: '3.8'
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      EENGINE_SETTINGS: >
        {
          "webhooks": "https://your-app.com/webhook",
          "webhookEvents": [
            "messageNew",
            "messageDeleted",
            "messageSent",
            "messageDeliveryError"
          ],
          "notifyText": "EmailEngine notification",
          "serviceUrl": "https://emailengine.example.com"
        }
```

**Using external file:**
```yaml
services:
  emailengine:
    image: postalsys/emailengine:latest
    env_file:
      - ./config/emailengine.env
```

```bash
# config/emailengine.env
EENGINE_SETTINGS={"webhooks":"https://your-app.com/webhook","webhookEvents":["messageNew"]}
```

</TabItem>
</Tabs>

### Examples

**Basic webhook configuration:**
```bash
EENGINE_SETTINGS='{
  "webhooks": "https://your-app.com/webhook",
  "webhookEvents": ["messageNew", "messageSent"]
}'
```

**Complete configuration:**
```bash
EENGINE_SETTINGS='{
  "webhooks": "https://your-app.com/webhook",
  "webhookEvents": [
    "messageNew",
    "messageDeleted",
    "messageSent",
    "messageDeliveryError"
  ],
  "notifyText": "New email notification",
  "notifyTextSize": 100,
  "serviceUrl": "https://emailengine.example.com"
}'
```

**OAuth2 applications:**
```bash
EENGINE_SETTINGS='{
  "gmailEnabled": true,
  "gmailClientId": "123456.apps.googleusercontent.com",
  "gmailClientSecret": "GOCSPX-abc123",
  "outlookEnabled": true,
  "outlookClientId": "abc-def-ghi",
  "outlookClientSecret": "secret123"
}'
```

### Validation

Settings are validated on startup. If validation fails, the application won't start:

```
Error: Invalid settings configuration
  - webhooks: must be a valid URL
  - webhookEvents: must be an array
```

Check your JSON syntax and setting values if you encounter errors.

### Updating Prepared Settings

Prepared settings are only applied once on first startup. To update:

1. Use the Settings API to modify existing settings
2. Or update the `EENGINE_SETTINGS` environment variable and restart

**Update settings via API:**
```bash
# Update specific setting
curl -X POST http://localhost:3000/v1/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": "https://new-webhook-url.com/webhook",
    "webhookEvents": ["messageNew", "messageSent"]
  }'

# Clear specific setting by setting to null
curl -X POST http://localhost:3000/v1/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"webhooks": null}'
```

## See Also

- [Prepared Access Tokens](./tokens) - Pre-configure API access tokens
- [Prepared License](./license) - Pre-configure license keys
- [Environment Variables](/docs/configuration/environment-variables) - Complete environment variable reference
- [Settings API](/docs/api-reference/settings) - Programmatic settings management
