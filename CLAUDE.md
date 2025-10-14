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

# Production build
npm run build                # Output: ./build/

# Test production build locally
npm run serve                # → http://localhost:3000

# Generate API docs from OpenAPI spec
npm run docusaurus gen-api-docs all

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
   - Output: `docs/api/` (73 endpoint files)
   - Configuration: See `docusaurus.config.ts` plugins section

4. **Single Source of Truth** - Each topic has ONE authoritative page
   - No duplicate content between docs/blog/API
   - Cross-references use relative links

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

- **`sources/swagger.json`** - EmailEngine OpenAPI 3.1 specification (v2.57.0)
  - 73 API endpoints
  - Used to generate `docs/api/` content
  - Update this to refresh API docs

- **`sources/` directory** - Contains converted HTML docs and original blog posts
  - These were used to create unified documentation
  - DO NOT edit these - they are historical sources only

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

1. **Update `sources/swagger.json`** with new OpenAPI spec
2. **Regenerate API docs:** `npm run docusaurus gen-api-docs all`
3. **Review generated files** in `docs/api/`
4. **Update API reference docs** in `docs/api-reference/` if needed
5. **Test build:** `npm run build`

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
