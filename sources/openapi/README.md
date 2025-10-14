# EmailEngine OpenAPI Documentation

This directory contains the EmailEngine API documentation in OpenAPI 3.0 format, converted from JSON to YAML and split into manageable sections.

## Files

### Main Files

- **openapi.yaml** - Main specification file containing:
  - API metadata (info, servers, security)
  - Complete component schemas (295 schemas)
  - Security scheme definitions
  - Tag definitions
  - Empty paths object (paths are in separate files)

- **openapi-bundled.yaml** - Complete API specification in a single file with all paths included inline (for tools that don't support file references)

### Path Files (Organized by API Category)

- **paths-access-tokens.yaml** - Access Tokens endpoints (4 paths, ~924 tokens)
- **paths-account.yaml** - Account endpoints (11 paths, ~3721 tokens)
- **paths-blocklists.yaml** - Blocklists endpoints (2 paths, ~1457 tokens)
- **paths-delivery-test.yaml** - Delivery Test endpoints (2 paths, ~569 tokens)
- **paths-license.yaml** - License endpoints (1 paths, ~560 tokens)
- **paths-logs.yaml** - Logs endpoints (1 paths, ~252 tokens)
- **paths-mailbox.yaml** - Mailbox endpoints (2 paths, ~1240 tokens)
- **paths-message.yaml** - Message endpoints (8 paths, ~5104 tokens)
- **paths-multi-message-actions.yaml** - Multi Message Actions endpoints (3 paths, ~1342 tokens)
- **paths-oauth2-applications.yaml** - OAuth2 Applications endpoints (2 paths, ~1315 tokens)
- **paths-outbox.yaml** - Outbox endpoints (2 paths, ~814 tokens)
- **paths-smtp-gateway.yaml** - SMTP Gateway endpoints (4 paths, ~1274 tokens)
- **paths-settings.yaml** - Settings endpoints (3 paths, ~3964 tokens)
- **paths-stats.yaml** - Stats endpoints (1 paths, ~226 tokens)
- **paths-submit.yaml** - Submit endpoints (1 paths, ~416 tokens)
- **paths-templates.yaml** - Templates endpoints (4 paths, ~1691 tokens)
- **paths-webhooks.yaml** - Webhooks endpoints (2 paths, ~579 tokens)

## File Statistics

| File | Tag | Paths | Lines | Size | Est. Tokens |
|------|-----|-------|-------|------|-------------|
| paths-access-tokens.yaml | Access Tokens | 4 | 128 | 3.6KB | 924 |
| paths-account.yaml | Account | 11 | 496 | 14.5KB | 3721 |
| paths-blocklists.yaml | Blocklists | 2 | 187 | 5.7KB | 1457 |
| paths-delivery-test.yaml | Delivery Test | 2 | 79 | 2.2KB | 569 |
| paths-license.yaml | License | 1 | 75 | 2.2KB | 560 |
| paths-logs.yaml | Logs | 1 | 36 | 1.0KB | 252 |
| paths-mailbox.yaml | Mailbox | 2 | 169 | 4.8KB | 1240 |
| paths-message.yaml | Message | 8 | 627 | 19.9KB | 5104 |
| paths-multi-message-actions.yaml | Multi Message Actions | 3 | 158 | 5.2KB | 1342 |
| paths-oauth2-applications.yaml | OAuth2 Applications | 2 | 179 | 5.1KB | 1315 |
| paths-outbox.yaml | Outbox | 2 | 113 | 3.2KB | 814 |
| paths-smtp-gateway.yaml | SMTP Gateway | 4 | 181 | 5.0KB | 1274 |
| paths-settings.yaml | Settings | 3 | 733 | 15.5KB | 3964 |
| paths-stats.yaml | Stats | 1 | 34 | 0.9KB | 226 |
| paths-submit.yaml | Submit | 1 | 52 | 1.6KB | 416 |
| paths-templates.yaml | Templates | 4 | 233 | 6.6KB | 1691 |
| paths-webhooks.yaml | Webhooks | 2 | 80 | 2.3KB | 579 |

**Total:** 53 paths across 17 categories

## Usage Options

### Option 1: Use Individual Files (Recommended for Development)

Each path file can be processed independently for focused documentation work:

```bash
# Process a specific category
your-tool paths-account.yaml

# Combine with main spec for validation
your-tool openapi.yaml paths-account.yaml
```

### Option 2: Use Bundled File (Recommended for Tools)

For tools that need a complete specification in one file:

```bash
your-tool openapi-bundled.yaml
```

### Option 3: Bundle Files Programmatically

Use OpenAPI bundling tools to merge files:

```bash
# Using swagger-cli
npm install -g swagger-cli
swagger-cli bundle openapi.yaml -o merged.yaml

# Using redocly
npm install -g @redocly/cli
redocly bundle openapi.yaml -o merged.yaml
```

### Option 4: Reference Files with $ref (Future Enhancement)

To create a reference-based structure, you can modify openapi.yaml to include:

```yaml
paths:
  /v1/accounts:
    $ref: './paths-account.yaml#/~1v1~1accounts'
```

## Docusaurus Integration

For Docusaurus with OpenAPI plugin:

```javascript
// docusaurus.config.js
module.exports = {
  plugins: [
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'emailengine',
        docsPluginId: 'classic',
        config: {
          emailengine: {
            specPath: 'docs/openapi/openapi-bundled.yaml',
            outputDir: 'docs/api',
            sidebarOptions: {
              groupPathsBy: 'tag',
            },
          },
        },
      },
    ],
  ],
};
```

## Validation

Validate the YAML files:

```bash
# Using swagger-cli
swagger-cli validate openapi-bundled.yaml

# Using redocly
redocly lint openapi-bundled.yaml
```

## Token Budget Compliance

All individual path files are well under the 20k token limit:
- Largest file: paths-message.yaml (~5104 tokens)
- Average file: ~1497 tokens
- All files easily processable by language models

## Conversion Details

- **Source:** /Users/andris/Projects/emailengine/docs/swagger.json
- **Format:** OpenAPI 3.0.0
- **Conversion Date:** 2025-10-13T09:01:28.809Z
- **API Version:** 2.57.0
- **Total Schemas:** 295
- **Total Tags:** 17
- **Total Paths:** 52

## Splitting Strategy

Paths were organized by their primary tag (the first tag in each operation's tags array):

- **Access Tokens:** 4 paths
- **Account:** 11 paths
- **Blocklists:** 2 paths
- **Delivery Test:** 2 paths
- **License:** 1 paths
- **Logs:** 1 paths
- **Mailbox:** 2 paths
- **Message:** 8 paths
- **Multi Message Actions:** 3 paths
- **OAuth2 Applications:** 2 paths
- **Outbox:** 2 paths
- **SMTP Gateway:** 4 paths
- **Settings:** 3 paths
- **Stats:** 1 paths
- **Submit:** 1 paths
- **Templates:** 4 paths
- **Webhooks:** 2 paths

This creates logical groupings that align with the EmailEngine API's functional areas.
