---
title: License Keys
sidebar_position: 2
description: Pre-configure license keys via environment variables
---

# Prepared License

Pre-configure license keys for automated license activation.

## Manual vs Prepared Licensing

**Manual:**
1. Start EmailEngine
2. Log into web interface
3. Navigate to Settings > License
4. Enter license key
5. Click "Activate"

**Prepared (automated):**
```bash
export EENGINE_PREPARED_LICENSE="your-license-key-here"
emailengine
```

## License Key Formats

EENGINE_PREPARED_LICENSE supports two formats:

### Format 1: Normal License Key (PEM Format)

The standard license key format provided by https://postalsys.com/:

```bash
export EENGINE_PREPARED_LICENSE="-----BEGIN LICENSE-----
Application: EmailEngine
Licensed to: Postal Systems OÜ

h6FspGM0NTSha6gwY2FlMjY2Y6Fus0V4YW1wbGUgQ29tcGFueSBJbmOhaKNBQ1OhYbFAZXhhbX
BsZS9kZW1vLWFwcKFjzwAAAZnw+ZsOoXPEK0VYQU1QTEVfU0lHTkFUVVJFX05PVF9WQUxJRF9G
T1JfUFVCTElDX0RFTU8=
-----END LICENSE-----"

emailengine
```

**This is the recommended format** - copy the license key exactly as shown in your account at https://postalsys.com/.

### Format 2: Exported License Key

An encoded single-line format exported from EmailEngine CLI:

```bash
# Export an existing license
emailengine license export --dbs.redis="redis://localhost:6379"

# Output (example):
i0-AgqFsxFWFoWvEDGC7abcdefghijklmnopqrstuvwxyz...

# Use in another instance
export EENGINE_PREPARED_LICENSE="i0-AgqFsxFWFoWvEDGC7abcdefghijklmnopqrstuvwxyz..."
emailengine
```

**Use case:** Transfer license from one EmailEngine instance to another without accessing the license portal.

## Configuration Methods

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="config-method">
<TabItem value="env" label="Environment Variable">

**PEM format (recommended):**
```bash
export EENGINE_PREPARED_LICENSE="-----BEGIN LICENSE-----
Application: EmailEngine
Licensed to: Your Company Name

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghijklmnopqrstuvwxyz...
-----END LICENSE-----"

emailengine
```

**Exported format:**
```bash
export EENGINE_PREPARED_LICENSE="i0-AgqFsxFWFoWvEDGC7..."
emailengine
```

</TabItem>
<TabItem value="cli" label="Command-Line">

**PEM format:**
```bash
emailengine --preparedLicense="-----BEGIN LICENSE-----
Application: EmailEngine
Licensed to: Your Company Name

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghijklmnopqrstuvwxyz...
-----END LICENSE-----"
```

**Exported format:**
```bash
emailengine --preparedLicense="i0-AgqFsxFWFoWvEDGC7..."
```

</TabItem>
<TabItem value="docker" label="Docker">

**PEM format:**
```dockerfile
ENV EENGINE_PREPARED_LICENSE="-----BEGIN LICENSE-----\nApplication: EmailEngine\nLicensed to: Your Company\n\neyJhbGci...\n-----END LICENSE-----"
```

**Exported format:**
```dockerfile
ENV EENGINE_PREPARED_LICENSE="i0-AgqFsxFWFoWvEDGC7..."
```

</TabItem>
<TabItem value="docker-compose" label="Docker Compose">

**PEM format (multiline YAML):**
```yaml
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      EENGINE_PREPARED_LICENSE: |
        -----BEGIN LICENSE-----
        Application: EmailEngine
        Licensed to: Your Company Name

        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghijklmnopqrstuvwxyz...
        -----END LICENSE-----
```

**Exported format (single-line):**
```yaml
services:
  emailengine:
    image: postalsys/emailengine:latest
    environment:
      - EENGINE_PREPARED_LICENSE=${LICENSE_KEY}
```

```bash
# .env
LICENSE_KEY=i0-AgqFsxFWFoWvEDGC7...
```

</TabItem>
</Tabs>

## Verification

Check license status via API:

```bash
curl http://localhost:3000/v1/license \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "active": true,
  "details": {
    "application": "@postalsys/emailengine-app",
    "key": "1edf01e35e75ed3425808eba",
    "licensedTo": "Kreata OÜ",
    "hostname": "emailengine.example.com",
    "created": "2021-10-13T07:47:42.695Z"
  },
  "type": "EmailEngine License"
}
```

## License Management

**Update license:**
1. Change `EENGINE_PREPARED_LICENSE` environment variable
2. Restart EmailEngine

The new license will be automatically applied on startup.

**Remove license via API:**
```bash
curl -X DELETE http://localhost:3000/v1/license \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## See Also

- [Prepared Settings](/docs/configuration/prepared-settings) - Pre-configure runtime settings
- [Prepared Access Tokens](/docs/configuration/prepared-settings/tokens) - Pre-configure API access tokens
- [License API](/docs/api/get-v-1-license) - Programmatic license management
- [Support & License](/docs/licensing) - License information and policies
