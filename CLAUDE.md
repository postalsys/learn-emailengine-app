# EmailEngine Documentation - Claude Code Guide

This repository contains the **unified Docusaurus documentation site** for EmailEngine, an Email API for IMAP and SMTP.

## Project Status

**✅ Production Ready** - All documentation has been unified and cleaned up. The site is ready for deployment.

- **71 unified documentation files** covering all EmailEngine features
- **73 auto-generated API docs** from OpenAPI spec
- **~85,000 lines** of comprehensive documentation
- **Build status:** ✅ Passing (with minor non-critical anchor warnings)

## Important Rules

**CRITICAL - Read These First:**

1. **Git Commit Messages** - DO NOT include Claude Code attribution or co-authorship
   - ❌ Never add: "Generated with Claude Code"
   - ❌ Never add: "Co-Authored-By: Claude"
   - ✅ Write clear, professional commit messages without AI attribution

2. **No Emojis in Documentation** - Never use emojis in documentation files
   - ❌ Don't use: ✅ ❌ 🚀 💡 ⚠️ etc. in markdown files
   - ✅ Exception: Only if explicitly needed for visual indicators (e.g., alert symbols in admonitions)
   - ✅ Use text instead: "Success", "Warning", "Important", etc.
   - Note: Existing emojis in CLAUDE.md itself are acceptable for this meta-documentation file

## Quick Commands

```bash
# Development server (hot reload)
npm start                    # → http://localhost:3000

# Production build (auto-updates API docs from emailengine.dev)
npm run build                # Output: ./build/

# Test production build locally
npm run serve                # → http://localhost:3000

# Update OpenAPI spec and regenerate API docs + sidebar
npm run update-swagger       # Downloads latest, regenerates docs & sidebar

# Generate API docs from OpenAPI spec
npm run docusaurus gen-api-docs all

# Generate API sidebar structure (outputs to console)
npm run generate-api-sidebar

# Clear cache (if build issues)
npm run docusaurus clear
```

## Architecture Overview

### Documentation Structure

This is a **unified documentation system** where each feature/topic is covered by a single comprehensive document that merges:
- API documentation (from OpenAPI spec)
- Blog post content (practical tutorials, examples)
- General documentation (concepts, configuration)

**DO NOT** create separate docs for the same topic. Always enhance the existing unified documentation.

```
docs/
├── index.md                 # Landing page
├── getting-started/         # 3 files - Introduction, quick start, installation
├── accounts/                # 12 files - Gmail, Outlook, OAuth2, service accounts
├── sending/                 # 8 files - Basic sending, mail merge, threading, templates
├── receiving/               # 9 files - Webhooks, messages, searching, attachments
├── configuration/           # 4 files - Environment variables, Redis, settings
├── api-reference/           # 5 files - API overview, accounts, messages, sending, webhooks
├── integrations/            # 6 files - PHP, CRM, AI/ChatGPT, low-code, Cloudflare
├── advanced/                # 10 files - Performance, monitoring, encryption, IDs
├── deployment/              # 6 files - Docker, SystemD, Render, Nginx, security
├── reference/               # 3 files - Webhook events, error codes, config options
├── support/                 # 2 files - Troubleshooting, license/privacy
└── api/                     # 73 auto-generated OpenAPI docs (DO NOT EDIT)
```

### Key Architectural Decisions

1. **Blog Disabled** - All blog content has been elevated to unified documentation
   - `docusaurus.config.ts` has `blog: false`
   - Blog posts were merged into topic-based docs (e.g., OAuth2 setup, mail merge)

2. **Auto-Generated Sidebars** - No manual `_category_.json` files
   - Sidebar structure comes from file organization and frontmatter
   - `sidebar_position` in frontmatter controls order

3. **OpenAPI Integration** - API docs auto-generated from `sources/swagger.json`
   - Plugin: `docusaurus-plugin-openapi-docs`
   - Output: `docs/api/` (72 endpoint files)
   - Configuration: See `docusaurus.config.ts` plugins section
   - "Send API Request" button disabled (`hideSendButton: true`) since EmailEngine is self-hosted
   - Server URL automatically replaced with `https://emailengine.example.com`

4. **Single Source of Truth** - Each topic has ONE authoritative page
   - No duplicate content between docs/blog/API
   - Cross-references use relative links

## Download Links

EmailEngine provides shortened download URLs that redirect to the latest GitHub releases:

| File | Short URL (Latest) | Versioned URL Format | Full GitHub URL |
|------|-------------------|---------------------|-----------------|
| **macOS PKG (Intel)** | https://go.emailengine.app/emailengine.pkg | https://go.emailengine.app/download/v2.55.4/emailengine.pkg | https://github.com/postalsys/emailengine/releases/latest/download/emailengine.pkg |
| **macOS PKG (Apple Silicon)** | https://go.emailengine.app/emailengine-arm.pkg | https://go.emailengine.app/download/v2.55.4/emailengine-arm.pkg | https://github.com/postalsys/emailengine/releases/latest/download/emailengine-arm.pkg |
| **Linux Binary (tar.gz)** | https://go.emailengine.app/emailengine.tar.gz | https://go.emailengine.app/download/v2.55.4/emailengine.tar.gz | https://github.com/postalsys/emailengine/releases/latest/download/emailengine.tar.gz |
| **Source Distribution** | https://go.emailengine.app/source-dist.tar.gz | https://go.emailengine.app/download/v2.55.4/source-dist.tar.gz | https://github.com/postalsys/emailengine/releases/latest/download/source-dist.tar.gz |
| **Windows Executable** | https://go.emailengine.app/emailengine.exe | https://go.emailengine.app/download/v2.55.4/emailengine.exe | https://github.com/postalsys/emailengine/releases/latest/download/emailengine.exe |

**Download URL Formats:**

1. **Latest version (recommended for most docs):**
   - Format: `https://go.emailengine.app/<filename>`
   - Example: `https://go.emailengine.app/emailengine.exe`
   - Always downloads the latest release

2. **Specific version (when version pinning is needed):**
   - Format: `https://go.emailengine.app/download/vX.X.X/<filename>`
   - Example: `https://go.emailengine.app/download/v2.55.4/emailengine.exe`
   - Downloads a specific release version

**Important Notes:**
- **PKG installers (macOS only):** Architecture-specific binaries
  - `emailengine.pkg` - Intel x86
  - `emailengine-arm.pkg` - Apple Silicon (M1 and newer)
- **Binary (Linux only):** `emailengine.tar.gz` - Linux x86 only (no ARM binary available)
- **Source distribution:** `source-dist.tar.gz` - Platform-independent, requires Node.js 24+, works on any platform
- **Windows:** `emailengine.exe` - Windows executable (NOT `emailengine-win-x64.exe`)
- Always use the short URLs in documentation (they're easier to remember and maintain)
- The installer script is available at: https://go.emailengine.app (redirects to install.sh)

## Important Files

### Configuration Files

- **`docusaurus.config.ts`** - Main Docusaurus configuration
  - Site metadata (title, URL, organization)
  - OpenAPI plugin configuration (sources/swagger.json → docs/api/)
  - Navigation (navbar, footer)
  - Theme settings (dark mode, syntax highlighting)
  - Blog disabled: `blog: false`

- **`sidebars.ts`** - Sidebar configuration
  - `docsSidebar`: Auto-generated from docs/ structure
  - `apiSidebar`: Auto-generated from OpenAPI spec

- **`package.json`** - Dependencies and scripts
  - Docusaurus 3.9.1
  - OpenAPI plugin and theme
  - Build, start, serve scripts

### Source Files

The `sources/` directory contains original reference materials used to create the unified documentation. These files are kept for historical reference and should NOT be edited directly.

**Directory Structure:**

- **`sources/swagger.json`** - EmailEngine OpenAPI 3.1 specification (v2.58.0)
  - 73 API endpoints
  - Auto-downloaded from https://emailengine.dev/swagger.json during build
  - Used to generate `docs/api/` content (72 endpoint files)
  - Run `npm run update-swagger` to update from production

- **`sources/openapi/`** - OpenAPI schema definitions
  - Contains API schema files and specifications
  - Used as reference for API documentation structure
  - DO NOT edit - historical reference only

- **`sources/blog/`** - Original blog articles (Ghost CMS format)
  - 43+ blog posts covering tutorials and detailed guides
  - Topics include OAuth2 setup, mail merge, encryption, etc.
  - Content has been merged into unified topic-based docs
  - DO NOT edit - historical reference only

- **`sources/website-md/`** - Old documentation website (Markdown)
  - 33 HTML/Markdown files from previous documentation site
  - General documentation covering features and configuration
  - Content has been unified into current `docs/` structure
  - DO NOT edit - historical reference only

**Important Notes:**
- All content from these sources has been merged into the unified `docs/` directory
- When updating documentation, edit files in `docs/`, not in `sources/`
- The sources are kept for reference and to track content origin
- Only `sources/swagger.json` is actively updated (automatically during build)

**Reference Locations:**
- EmailEngine source code: `/Users/andris/Projects/emailengine`
- API schema definitions: `./sources/openapi/`
- Blog articles: `./sources/blog/`
- Old documentation: `./sources/website-md/`

### Documentation Reports

- **`UNIFIED_DOCS_COMPLETE.md`** - Project completion summary
- **`CLEANUP_COMPLETE.md`** - Files removed during cleanup
- **`unified-docs-report.md`** - Original 14K+ word implementation plan
- **`topic-coverage.md`** - Coverage analysis (149 sources → 71 unified docs)
- **`content-mapping.md`** - Source-to-destination mapping

## Documentation Authoring Guidelines

### File Structure

Every documentation file should have:

```markdown
---
title: Clear, Descriptive Title
sidebar_position: 1
description: Brief one-sentence description for SEO
---

# Page Title

<!-- Source attribution (for reference) -->
<!-- Sources: docs/old-file.md, blog/tutorial.md, api/endpoint.md -->

Brief introduction paragraph.

:::tip Quick Example
Practical example or key takeaway
:::

## Section 1

Content with code examples...

## See Also

- [Related Topic 1](/docs/category/file1)
- [Related Topic 2](/docs/category/file2)
```

### Code Examples

Always provide **multi-language examples** where appropriate:

```markdown
**cURL:**
\`\`\`bash
curl -X POST http://localhost:3000/v1/account
\`\`\`

**Node.js:**
\`\`\`javascript
const response = await fetch('http://localhost:3000/v1/account')
\`\`\`

**Python:**
\`\`\`python
response = requests.post('http://localhost:3000/v1/account')
\`\`\`

**PHP:**
\`\`\`php
$response = $client->post('http://localhost:3000/v1/account');
\`\`\`
```

### Cross-References

Use relative links to other documentation:

```markdown
- [Account Setup](/docs/accounts) - Link to section
- [Gmail OAuth2](/docs/accounts/gmail-imap) - Link to specific page
- [API Reference](/docs/api-reference) - Link to API overview
- [Webhooks API](/docs/api/webhooks) - Link to auto-generated API doc
```

### Admonitions

Use Docusaurus admonitions for important information:

```markdown
:::tip Best Practice
Use OAuth2 for Gmail and Outlook in production
:::

:::warning Security
Never commit OAuth2 credentials to version control
:::

:::danger Breaking Change
Version 3.0 removes legacy authentication
:::

:::info Note
This feature requires a license key
:::
```

## Common Tasks

### Adding New Documentation

1. **Identify the topic** - Check existing docs first
2. **Choose the right section** - accounts/, sending/, receiving/, etc.
3. **Create the file** with proper frontmatter
4. **Use existing files as templates** - Maintain consistent structure
5. **Test the build** - `npm run build`

### Updating API Documentation

The API documentation is automatically updated from the EmailEngine production API whenever you run a build.

#### Automatic Updates (Recommended)

When you run `npm run build`, the following happens automatically:

1. **Downloads latest OpenAPI spec** from https://emailengine.dev/swagger.json
2. **Replaces server URL** - Changes `http://0.0.0.0:6677` to `https://emailengine.example.com` (since EmailEngine is self-hosted)
3. **Regenerates API docs** from the updated spec (73 endpoint files)
4. **Regenerates API sidebar** with collapsible tag-based groups (17 categories)
5. **Builds the site** with the latest API documentation

This is handled by the `prebuild` script that runs `scripts/update-swagger.js`.

**Note:** The server URL is automatically replaced because EmailEngine is self-hosted software. The documentation uses `https://emailengine.example.com` as a placeholder that users should replace with their actual server URL.

#### Manual Updates

If you need to update the API docs without building:

```bash
# Update swagger.json and regenerate everything
npm run update-swagger

# Or do it step by step:
# 1. Download latest spec manually or edit sources/swagger.json
# 2. Regenerate API docs
npm run docusaurus gen-api-docs all
# 3. Regenerate API sidebar structure
npm run generate-api-sidebar
# 4. Review and commit the updated sidebars.ts file
```

**Important:** The `generate-api-sidebar` script outputs the sidebar structure to the console. You must manually copy this into `sidebars.ts` to update the `apiSidebar` array.

#### API Sidebar Structure

The API sidebar is organized by OpenAPI tags into 17 collapsible categories:
- Account (13 endpoints)
- Mailbox (4 endpoints)
- Message (10 endpoints)
- Submit, Outbox, Delivery Test, Access Tokens, Settings, Templates, Logs, Stats, License, Webhooks, OAuth2 Applications, SMTP Gateway, Blocklists, Multi Message Actions

The sidebar structure is manually maintained in `sidebars.ts` for full control over organization and ordering.

### Fixing Build Warnings

Most warnings are **non-critical** (broken anchors from old structure):

```bash
# Clear cache and rebuild
npm run docusaurus clear
npm run build

# Check specific warnings
npm run build 2>&1 | grep "Broken link"
```

### Deploying

```bash
# 1. Verify build passes
npm run build

# 2. Test production build
npm run serve

# 3. Deploy (depends on hosting platform)
# - Render: Auto-deploy from GitHub
# - GitHub Pages: npm run deploy
# - Custom: Upload ./build/ directory
```

## Key Concepts

### EmailEngine Features Covered

- **Account Management** - Gmail (OAuth2, API, service accounts), Outlook (OAuth2), generic IMAP/SMTP
- **Sending Emails** - Basic sending, replies, mail merge, threading, templates, queue management
- **Receiving Emails** - Webhooks, message operations, searching, attachments, tracking
- **Configuration** - Environment variables, Redis, prepared settings
- **Integrations** - PHP SDK, CRM integration, AI/ChatGPT, low-code platforms, Cloudflare Workers
- **Advanced Topics** - Performance tuning, monitoring, logging, encryption, ID system
- **Deployment** - Docker, SystemD, Render, Nginx reverse proxy, security hardening
- **API Reference** - Complete API documentation with authentication, examples, error handling

### Documentation Quality Standards

Every page should:
- ✅ Have complete frontmatter (title, sidebar_position, description)
- ✅ Include practical code examples
- ✅ Provide step-by-step procedures where applicable
- ✅ Cross-reference related documentation
- ✅ Include troubleshooting tips
- ✅ Follow consistent formatting and tone
- ✅ Use admonitions for important information
- ✅ Provide "See Also" section with related links

### What NOT to Do

- ❌ **Don't create duplicate documentation** - Enhance existing unified docs instead
- ❌ **Don't edit `docs/api/` directly** - These are auto-generated from OpenAPI spec
- ❌ **Don't re-enable the blog** - Blog content is now part of unified docs
- ❌ **Don't add `_category_.json` files** - Sidebars are auto-generated
- ❌ **Don't create separate "tutorial" or "guide" sections** - Merge into relevant topic docs
- ❌ **Don't commit with broken builds** - Always run `npm run build` first
- ❌ **Don't use emojis in documentation** - Use text instead (see Important Rules section)
- ❌ **Don't add AI attribution to git commits** - Keep commit messages professional (see Important Rules section)

## Troubleshooting

### Build Fails

```bash
# Clear cache
npm run docusaurus clear
rm -rf .docusaurus build node_modules/.cache

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### Port Already in Use

```bash
# Kill existing server
lsof -ti:3000 | xargs kill -9

# Or use different port
npm start -- --port 3001
```

### OpenAPI Generation Issues

```bash
# Check OpenAPI spec is valid
npm run docusaurus gen-api-docs:version:emailengine

# Force regeneration
rm -rf docs/api
npm run docusaurus gen-api-docs all
```

## Project History

This documentation was created by:
1. **Setting up Docusaurus 3.9.1** with TypeScript and OpenAPI plugin
2. **Migrating 33 HTML docs** from EmailEngine website to Markdown
3. **Converting 43 blog posts** from Ghost CMS format to Docusaurus
4. **Generating 73 API docs** from OpenAPI specification
5. **Unifying 149 source files** into 71 comprehensive topic-based documentation files
6. **Removing old content** (blog, old docs, helper scripts) to create single source of truth

**Result:** Production-ready documentation with 100% feature coverage and ~85,000 lines of content.

## Getting Help

- **Docusaurus docs:** https://docusaurus.io/docs
- **OpenAPI plugin:** https://github.com/PaloAltoNetworks/docusaurus-openapi-docs
- **EmailEngine:** https://emailengine.app
- **Project reports:** See `UNIFIED_DOCS_COMPLETE.md`, `CLEANUP_COMPLETE.md`

---

**Last Updated:** October 14, 2025
**Docusaurus Version:** 3.9.1
**EmailEngine API Version:** 2.57.0
**Status:** Production Ready
