# EmailEngine Documentation Site

Source of https://learn.emailengine.app, the documentation site for [EmailEngine](https://emailengine.app). Built with Docusaurus 3.9.

The authored pages live in `docs/`, one directory per topic. `docs/api/` is generated from the EmailEngine OpenAPI document and is never edited by hand. Editorial rules, conventions and the verification workflow are in `CLAUDE.md`.

## Layout

```
docs/
  getting-started/   Introduction and quick start
  installation/      Platform installers, Docker, source
  accounts/          IMAP/SMTP, Gmail, Microsoft 365, OAuth2, hosted authentication
  sending/           Submitting messages, replies, templates, outbox, SMTP server
  receiving/         Listing, searching, attachments, web-safe HTML, export
  webhooks/          Overview, routing, one page per event
  mcp/               The Model Context Protocol endpoint for AI agents
  configuration/     Environment variables, CLI, Redis, prepared settings
  deployment/        Production setup, TLS, security, compliance, FIPS mode
  integrations/      PHP, CRM, AI, low-code platforms
  advanced/          Monitoring, logging, encryption, queues, bounces
  api-reference/     Hand-written API overviews
  reference/         Settings, errors, webhook events, glossary, AI agent reference
  api/               Generated from sources/swagger.json (do not edit)
sources/
  swagger.json       The OpenAPI document, refreshed on every build
  blog/, website-md/, openapi/   Historical source material, not published
src/                 Homepage and the Price component
static/              Images, screenshots and capabilities.json
scripts/             Swagger refresh, API sidebar generator, screenshot capture, pricing check
```

## Commands

```bash
npm install
npm start                    # development server on http://localhost:3000
npm run build                # production build in ./build (refreshes the OpenAPI document first)
npm run serve                # serve the production build locally
npm run update-swagger       # refresh sources/swagger.json and regenerate docs/api
npm run generate-api-sidebar # print the apiSidebar structure for sidebars.ts
npm run verify-pricing       # check the live price rendering after a deploy (needs Playwright)
npm run clear                # clear the Docusaurus cache
```

`npm run build` runs `scripts/update-swagger.js` first. It downloads the published OpenAPI document from https://go.emailengine.app/swagger.json, replaces the server URL with the `https://emailengine.example.com` placeholder, writes `sources/swagger.json` and regenerates `docs/api/`. When the document gains or loses an operation, `sidebars.ts` has to name the new page id under `apiSidebar`, otherwise the build fails. `npm run generate-api-sidebar` prints the structure to copy in.

Incremental builds cache link checking. Before relying on a clean build, remove `build/` and `.docusaurus/`.

## Writing pages

Every page carries frontmatter with `title`, `sidebar_position` and `description`, one H1, and ends with a `## See Also` section. The sidebar is generated from the directory tree and `sidebar_position`; a subdirectory gets its label from a `_category_.json`. When a page moves, add a redirect from the old URL under the `@docusaurus/plugin-client-redirects` entry in `docusaurus.config.ts`.

Two files exist for AI coding assistants and are updated whenever the API surface changes: `docs/reference/llm-context.md` and `static/capabilities.json`.

Dependency alerts for this repository are not actionable: the site is static, and the OpenAPI theme pins React 18 and its own `marked` version. See `CLAUDE.md`.

## Deployment

The `build/` directory is a static site. Production deploys from the repository's default branch.

## License

Copyright Postal Systems OÜ
